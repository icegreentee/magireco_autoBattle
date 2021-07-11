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

var pkgName = context.getPackageName();

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

//用shizuku adb/root权限，或者直接用root权限截屏
var screencapShellCmdThread = null;
var screencapLength = -1;
var localHttpListenPort = -1;
function detectScreencapLength() {
    let result = privShell("screencap | "+"/data/local/tmp/"+pkgName+"/sbin/scrcap2bmp -a -l");
    if (result.code == 0) return parseInt(result.error);
    throw new Error("detectScreencapLengthFailed");
}
function findListenPort() {
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

var screencap = sync(function () {
    //使用shell命令 screencap 截图
    try {screencapShellCmdThread.interrupt();} catch (e) {};
    if (localHttpListenPort<0) localHttpListenPort = findListenPort();
    if (screencapLength < 0) screencapLength = detectScreencapLength();
    if (screencapLength <= 0) {
        log("screencapLength="+screencapLength+"<= 0, exit");
        exit();
    }
    let screenshot = null;
    for (let i=0; i<10; i++) {
        screencapShellCmdThread = threads.start(function() {
            let cmd = "screencap | "+"/data/local/tmp/"+pkgName+"/sbin/scrcap2bmp -a -w5 -p"+localHttpListenPort;
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
} );
shellScreenCap.screencap = screencap;

module.exports = shellScreenCap;