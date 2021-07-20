//截图兼容模块

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var shellScreenCap = {};
var MODULES = {};


function init() {
    MODULES = shellScreenCap.MODULES;
    //shellCmd模块
    //使用Shizuku执行shell命令
    shizukuShell = MODULES.shellCmd.shizukuShell;
    //直接使用root权限执行shell命令
    rootShell = MODULES.shellCmd.rootShell;
    //根据情况使用Shizuku还是直接使用root执行shell命令
    privShell = MODULES.shellCmd.privShell;
    //不使用特权执行shell命令
    normalShell = MODULES.shellCmd.normalShell;
}
shellScreenCap.init = init;

var AutoJSPkgName = context.getPackageName();
var dataDir = files.cwd();

var shizukuShell = () => {};
var rootShell = () => {};
var privShell = () => {};
var normalShell = () => {};

//检测CPU ABI
var shellABI = null;
function detectABI() {
    if (shellABI != null) return shellABI;
    let cmd = "getprop ro.product.cpu.abi"
    let result = normalShell(cmd);
    let ABIStr = "";
    if (result.code == 0) ABIStr += result.result;
    ABIStr = ABIStr.toLowerCase();
    if (ABIStr.startsWith("arm64")) {
        shellABI = "arm64";
    } else if (ABIStr.startsWith("arm")) {
        shellABI = "arm";
    } else if (ABIStr.startsWith("x86_64")) {
        shellABI = "x86_64";
    } else if (ABIStr.startsWith("x86")) {
        shellABI = "x86";
    }
    return shellABI;
}
shellScreenCap.detectABI = detectABI;

//在/data/local/tmp/下安装scrcap2bmp
shellScreenCap.binarySetupDone = false;
function setupBinary() {
    if (shellScreenCap.binarySetupDone) return shellScreenCap.binarySetupDone;

    let binaryFileName = "scrcap2bmp";
    let binaryCopyToPath = "/data/local/tmp/"+AutoJSPkgName+"/sbin/"+binaryFileName;
    detectABI();

    let binaryCopyFromPath = dataDir+"/modules/shellScreenCap/bin/"+binaryFileName+"-"+shellABI;
    if (!files.isFile(binaryCopyFromPath)) return;

    //adb shell的权限并不能修改APP数据目录的权限，所以先要用APP自己的身份来改权限
    normalShell("chmod a+x "+dataDir+"/../../"); // pkgname/
    normalShell("chmod a+x "+dataDir+"/../");    // pkgname/files/
    normalShell("chmod a+x "+dataDir);           // pkgname/files/project/
    normalShell("chmod a+x "+dataDir+"/modules");
    normalShell("chmod a+x "+dataDir+"/modules/shellScreenCap");
    normalShell("chmod a+x "+dataDir+"/modules/shellScreenCap/bin");

    normalShell("chmod a+r "+binaryCopyFromPath);

    privShell("mkdir "+"/data/local/tmp/"+AutoJSPkgName);
    privShell("mkdir "+"/data/local/tmp/"+AutoJSPkgName+"/sbin");
    privShell("chmod 755 "+"/data/local/tmp/"+AutoJSPkgName);
    privShell("chmod 755 "+"/data/local/tmp/"+AutoJSPkgName+"/sbin");

    privShell("cat "+binaryCopyFromPath+" > "+binaryCopyToPath);
    let result = privShell("chmod 755 "+binaryCopyToPath);
    if (result.code == 0) {
        shellScreenCap.binarySetupDone = true;
    } else {
        log(result);
    }
    return shellScreenCap.binarySetupDone;
}

//申请截屏权限
//可能是AutoJSPro本身的问题，截图权限可能会突然丢失，logcat可见：
//VirtualDisplayAdapter: Virtual display device released because application token died: top.momoe.auto
//应该就是因为这个问题，截到的图是不正确的，会截到很长时间以前的屏幕（应该就是截图权限丢失前最后一刻的屏幕）
//猜测这个问题与转屏有关，所以尽量避免转屏（包括切入切出游戏）
var canCaptureScreen = false;
var hasScreenCaptureError = false;
function startScreenCapture() {
    if (canCaptureScreen) {
        log("已经获取到截图权限了");
        return;
    }

    if (hasScreenCaptureError) {
        toastLog("通过录屏API截图时出错\n请使用root或adb权限截屏");
        stopThread();
    }

    $settings.setEnabled("stop_all_on_volume_up", false);
    $settings.setEnabled("foreground_service", true);
    sleep(500);
    for (let attempt = 1; attempt <= 3; attempt++) {
        let screencap_landscape = true;
        if (requestScreenCapture(screencap_landscape)) {
            //雷电模拟器下，返回的截屏数据是横屏强制转竖屏的，需要检测这种情况
            initializeScreenCaptureFix();

            sleep(500);
            toastLog("获取截图权限成功。\n为避免截屏出现问题，请务必不要转屏，也不要切换出游戏");
            sleep(3000);
            toastLog("转屏可能导致截屏失败，请务必不要转屏，也不要切换出游戏×2");
            sleep(3000);
            canCaptureScreen = true;
            break;
        } else {
            log("第", attempt, "次获取截图权限失败");
            sleep(1000);
        }
    }

    if (!canCaptureScreen) {
        log("截图权限获取失败，退出");
        stopThread();
    }

    return;
}
shellScreenCap.startScreenCapture = startScreenCapture;

//雷电模拟器下，返回的截屏数据是横屏强制转竖屏的，需要检测这种情况
var needScreenCaptureFix = false;
function initializeScreenCaptureFix() {
    try {
        log("测试录屏API是否可用...");
        let screenshot = captureScreen();
        let x = screenshot.getWidth();
        let y = screenshot.getHeight();
        log("通过录屏API得到截图,大小:"+x+"x"+y);
        log("测试对截图进行裁剪...");
        let img = images.clip(screenshot, parseInt(x/4), parseInt(y/4), parseInt(x/2), parseInt(y/2));
        img.recycle();
        log("测试对截图进行裁剪完成");
        log("测试对截图进行缩放...");
        img = images.resize(screenshot, [parseInt(x/2), parseInt(y/2)]);
        img.recycle();
        log("测试对截图进行缩放完成");
        if (x < y) {
            //这里不考虑本来就要截屏竖屏的情况
            log("检测到横屏强制转竖屏的截屏");
            needScreenCaptureFix = true;
        }
    } catch (e) {
        hasScreenCaptureError = true;
        toastLog("通过录屏API截图时出错\n请使用root或adb权限截屏");
        logException(e);
        stopThread();
    }
}

//用shizuku adb/root权限，或者直接用root权限截屏
var screencapShellCmdThread = null;
var screencapLength = -1;
var localHttpListenPort = -1;
function detectScreencapLength() {
    let result = privShell("screencap | "+"/data/local/tmp/"+AutoJSPkgName+"/sbin/scrcap2bmp -a -l");
    if (result.code == 0) return parseInt(result.error);
    throw "detectScreencapLengthFailed"
}
function findListenPort() {
    for (let i=11023; i<65535; i+=16) {
        let cmd = "/data/local/tmp/"+AutoJSPkgName+"/sbin/scrcap2bmp -t"+i;
        let result = privShell(cmd);
        if (result.code == 0 && result.error.includes("Port "+i+" is available")) {
            log("可用监听端口", i);
            return i;
        }
    }
    log("找不到可用监听端口");
    throw "cannotFindAvailablePort"
}

//每次更新图片，就把旧图片回收
var imgRecycleMap = {};
function renewImage() {
    let imageObj = null;
    let tag = "";
    let tagOnly = false;
    let key = "";

    switch (arguments.length) {
    case 3:
        tagOnly = arguments[2];
    case 2:
        tag = "TAG"+arguments[1];
    case 1:
        imageObj = arguments[0];
        break;
    default:
        throw "renewImageIncorrectArgc"
    }

    if (!tagOnly) {
        try { throw new Error(""); } catch (e) {
            Error.captureStackTrace(e, renewImage); //不知道AutoJS的Rhino是什么版本，不captureStackTrace的话，e.stack == null
            let splitted = e.stack.toString().split("\n");
            for (let i=0; i<splitted.length; i++) {
                if (splitted[i].match(/:\d+/) && !splitted[i].match(/renewImage/)) {
                    //含有行号，且不是renewImage
                    key += splitted[i];
                }
            }
        }
        if (key == null || key == "") throw "renewImageNullKey";
    }

    key += tag;

    if (imgRecycleMap[key] != null) {
        try {imgRecycleMap[key].recycle();} catch (e) {log("renewImage", e)};
        imgRecycleMap[key] = null;
    }

    imgRecycleMap[key] = imageObj;

    return imageObj;
}
shellScreenCap.renewImage = renewImage;

//回收所有图片
function recycleAllImages() {
    log("recycleAllImages...");
    var count = 0;
    for (let i in imgRecycleMap) {
        if (imgRecycleMap[i] != null) {
            renewImage(null);
            count++;
            //log("recycleAllImages: recycled image used at:")
            //log(i);
        }
    }
    log("recycleAllImages done, recycled "+count+" images");
}
shellScreenCap.recycleAllImages = recycleAllImages;

var compatCaptureScreen = sync(function (useShell) {
    if (useShell) {
        if (!setupBinary()) throw new Error("compatCaptureScreen: setupBinary failed");
        //使用shell命令 screencap 截图
        try {screencapShellCmdThread.interrupt();} catch (e) {};
        if (localHttpListenPort<0) localHttpListenPort = findListenPort();
        if (screencapLength < 0) screencapLength = detectScreencapLength();
        if (screencapLength <= 0) {
            log("screencapLength="+screencapLength+"<= 0, exit");
            stopThread();
        }
        let screenshot = null;
        for (let i=0; i<10; i++) {
            screencapShellCmdThread = threads.start(function() {
                let cmd = "screencap | "+"/data/local/tmp/"+AutoJSPkgName+"/sbin/scrcap2bmp -a -w5 -p"+localHttpListenPort;
                let result = privShell(cmd, false);
            });
            sleep(100);
            for (let j=0; j<5; j++) {
                try { screenshot = images.load("http://127.0.0.1:"+localHttpListenPort+"/screencap.bmp"); } catch (e) {log(e)};
                if (screenshot != null) break;
                sleep(200);
            }
            try {screencapShellCmdThread.interrupt();} catch (e) {};
            if (screenshot != null) break;
            sleep(100);
        }
        if (screenshot == null) log("截图失败");
        let tagOnly = true;
        return renewImage(screenshot, "screenshot", tagOnly); //回收旧图片
    } else {
        //使用AutoJS默认提供的录屏API截图
        let screenshot = captureScreen();
        if (needScreenCaptureFix) {
            //检测到横屏强制转竖屏的截屏，需要修正

            //获取截屏尺寸
            let imgX = screenshot.getWidth();
            let imgY = screenshot.getHeight();

            //获取屏幕尺寸（如果参数是竖屏就转换成横屏参数）
            let screenX = device.width;
            let screenY = device.height;
            if (screenX < screenY) {
                let temp = screenX;
                screenX = screenY;
                screenY = temp;
            }

            //假设真正的图像位于居中部位，将其裁剪出来
            let croppedX = imgX;
            let croppedY = imgX / screenX * screenY;
            let tagOnly = true;
            let croppedImg = renewImage(images.clip(screenshot, 0, (imgY - croppedY) / 2, croppedX, croppedY), "croppedScreenshot", tagOnly);

            //把裁剪出来的图像重新放大回屏幕尺寸
            let resizedImg = images.resize(croppedImg, [screenX, screenY]);
            return renewImage(resizedImg, "fixedScreenshot", tagOnly);
        } else {
            return screenshot;
        }
    }
});
shellScreenCap.compatCaptureScreen = compatCaptureScreen;


module.exports = shellScreenCap;