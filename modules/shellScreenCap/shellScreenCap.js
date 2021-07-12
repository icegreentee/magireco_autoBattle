//截屏模块

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
shellScreenCap.shellCmd = null;//需要外部传入

function shizukuShell() {
    if (shellScreenCap.shellCmd == null) {
        throw new Error("shellCmd module not passed in");
    } else {
        shellScreenCap.shellCmd.shizukuShell.apply(this, arguments);
    }
}
function rootShell() {
    if (shellScreenCap.shellCmd == null) {
        throw new Error("shellCmd module not passed in");
    } else {
        shellScreenCap.shellCmd.rootShell.apply(this, arguments);
    }
}
function privShell() {
    if (shellScreenCap.shellCmd == null) {
        throw new Error("shellCmd module not passed in");
    } else {
        shellScreenCap.shellCmd.privShell.apply(this, arguments);
    }
}
function normalShell() {
    if (shellScreenCap.shellCmd == null) {
        throw new Error("shellCmd module not passed in");
    } else {
        shellScreenCap.shellCmd.normalShell.apply(this, arguments);
    }
}


//脚本包名
var pkgName = context.getPackageName();
//脚本所在目录路径
var dataDir = engines.myEngine().cwd();

//安装scrcap2bmp二进制文件

var binarySetupDone = false;

//检测CPU ABI
var shellABI = null;
function detectABI() {
    if (shellABI != null) return shellABI;//之前已经检测过了

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
    } else {
        throw new Error("Unknown ABI");
    }
    return shellABI;
}

var binariesInfo = [
    {fileHash: "10f99a556a7ef84ec5f4082f60e9bd2c994fb79d7a2c6e38125ef9dbeae51099", fileName: "scrcap2bmp-arm"},
    {fileHash: "7955cc0a9b7523df4e9c29541c7a77e03d045d7c3d7a798f69faef2175972a68", fileName: "scrcap2bmp-arm64"},
    {fileHash: "99709c1284a7aef4018ca640090892202429dee56af55312c6ce8d6d09c44fe8", fileName: "scrcap2bmp-x86"},
    {fileHash: "ec2920bcb7497582f5cff281dd79cdfab1e299be0825b5a024af39334c6890f8", fileName: "scrcap2bmp-x86_64"},
];

function setupBinaries() {
    setupBinary("scrcap2bmp");
}
shellScreenCap.setupBinaries = setupBinaries;

function setupBinary(binaryFileName) {
    let binaryCopyToPath = "/data/local/tmp/"+pkgName+"/sbin/"+binaryFileName;
    detectABI();
    if (files.isFile(binaryCopyToPath)) {
        log("setupBinary 文件 "+binaryFileName+" 已存在");
        let existingFileBytes = files.readBytes(binaryCopyToPath);
        let fileHashCalc = $crypto.digest(existingFileBytes, "SHA-256", { input: "bytes", output: "hex" }).toLowerCase();
        for (let i=0; i<binariesInfo.length; i++) {
            let binaryInfo = binariesInfo[i];
            if (binaryInfo.fileName == "bin/"+binaryFileName+"-"+shellABI) {
                if (binaryInfo.fileHash == fileHashCalc) {
                    log("setupBinary 文件 "+binaryFileName+" hash值相符");
                    return;
                }
                log("setupBinary 文件 "+binaryFileName+" hash值不符");
                files.remove(binaryCopyToPath);
                break;
            }
        }
    }
    if (!files.isFile(dataDir+"/bin/"+binaryFileName+"-"+shellABI)) {
        toastLog("找不到自带的"+binaryFileName+"，请下载新版安装包");
        sleep(2000);
        exit();
    }
    //adb shell的权限并不能修改APP数据目录的权限，所以先要用APP自己的身份来改权限
    normalShellCmd("chmod a+x "+dataDir+"/../../"); // pkgname/
    normalShellCmd("chmod a+x "+dataDir+"/../");    // pkgname/files/
    normalShellCmd("chmod a+x "+dataDir);           // pkgname/files/project/
    normalShellCmd("chmod a+x "+dataDir+"/bin");

    let binaryCopyFromPath = dataDir+"/bin/"+binaryFileName+"-"+shellABI;
    normalShellCmd("chmod a+r "+binaryCopyFromPath);

    privilegedShellCmd("mkdir "+"/data/local/tmp/"+pkgName);
    privilegedShellCmd("mkdir "+"/data/local/tmp/"+pkgName+"/sbin");
    privilegedShellCmd("chmod 755 "+"/data/local/tmp/"+pkgName);
    privilegedShellCmd("chmod 755 "+"/data/local/tmp/"+pkgName+"/sbin");

    privilegedShellCmd("cat "+binaryCopyFromPath+" > "+binaryCopyToPath);
    privilegedShellCmd("chmod 755 "+binaryCopyToPath);

    binarySetupDone = true;
}


//申请截屏权限
//可能是AutoJSPro本身的问题，截图权限可能会突然丢失，logcat可见：
//VirtualDisplayAdapter: Virtual display device released because application token died: top.momoe.auto
//应该就是因为这个问题，截到的图是不正确的，会截到很长时间以前的屏幕（应该就是截图权限丢失前最后一刻的屏幕）
//另外还可能出现一个问题，就是clip截到的图时报错缓冲区不够什么的，可能是AutoJS本身的bug
var canCaptureScreen = false;
function startScreenCapture() {
    if (canCaptureScreen) {
        log("已经获取到截图权限了");
        return;
    }

    sleep(500);
    for (let attempt = 1; attempt <= 3; attempt++) {
        let screencap_landscape = true;
        if (requestScreenCapture(screencap_landscape)) {
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
        exit();
    }

    return;
}
shellScreenCap.startScreenCapture = startScreenCapture;

//找到可以监听的端口号
var localHttpListenPort = -1;
function findListenPort() {
    if (localHttpListenPort > 0) return localHttpListenPort;//之前已经检测过了

    for (let i=11023; i<65535; i+=16) {
        let cmd = "/data/local/tmp/"+pkgName+"/sbin/scrcap2bmp -t"+i;
        let result = privShell(cmd);
        if (result.code == 0 && result.error.includes("Port "+i+" is available")) {
            log("可用监听端口", i);
            return i;
        }
    }

    log("找不到可用监听端口");
    throw new Error("cannotFindAvailablePort");
}

//检测截屏数据大小
var screencapLength = -1;
function detectScreencapLength() {
    if (screencapLength >= 0) return screencapLength;//之前已经检测过了

    let result = privShell("screencap | "+"/data/local/tmp/"+pkgName+"/sbin/scrcap2bmp -a -l");
    if (result.code == 0) {
        screencapLength = parseInt(result.error);
        if (screencapLength <= 0) {
            log("错误: 截屏数据大小为0或负数");
            throw new Error("detectScreencapLength: screencapLength <= 0");
        } else {
            return screencapLength;
        }
    }

    throw new Error("detectScreencapLengthFailed");
}

//还没回收的图片
var imgRecycleMap = {};

//每次更新图片，就把旧图片回收
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
        throw new Error("renewImage: invalid arguments count");
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
        if (key == null || key == "") throw new Error("renewImageNullKey");
    }

    key += tag;

    if (imgRecycleMap[key] != null) {
        try {imgRecycleMap[key].recycle();} catch (e) {log("renewImage exception"); log(e);};
        imgRecycleMap[key] = null;
    }

    imgRecycleMap[key] = imageObj;

    return imageObj;
}

//回收所有图片
function recycleAllImages() {
    for (let i in imgRecycleMap) {
        if (imgRecycleMap[i] != null) {
            renewImage(null);
            log("recycleAllImages: recycled image used at:")
            log(i);
        }
    }
}


//使用shell命令 screencap 截图
var screencapShellCmdThread = null;
var screencap = sync(function () {
    try {screencapShellCmdThread.interrupt();} catch (e) {};

    findListenPort();

    detectScreencapLength();

    let screenshot = null;
    for (let i=0; i<10; i++) {
        screencapShellCmdThread = threads.start(function() {
            let cmd = "screencap | "+"/data/local/tmp/"+pkgName+"/sbin/scrcap2bmp -a -w5 -p"+localHttpListenPort;
            let result = privShell(cmd, false);//这条命令不打log
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
} );
shellScreenCap.screencap = screencap;

module.exports = shellScreenCap;