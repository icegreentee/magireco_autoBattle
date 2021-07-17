//Shell命令模块

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var shellCmd = {};
var MODULES = {};


function init() {
    MODULES = shellCmd.MODULES;
}
shellCmd.init = init;

//申请权限
var requestShellPrivilegeThread = null;
function requestShellPrivilege() {
    if (shellCmd.privilege) {
        log("已经获取到root或adb权限了");
        return shellCmd.privilege;
    }

    let rootMarkerPath = files.join(engines.myEngine().cwd(), "hasRoot");

    let cmd = "cat /proc/self/status";
    let result = null;
    try {
        result = shizukuShell(cmd);
    } catch (e) {
        result = {code: 1, result: "-1", err: ""};
        logException(e);
    }
    let euid = -1;
    if (result.code == 0) {
        euid = getEUID(result.result);
        switch (euid) {
        case 0:
            log("Shizuku有root权限");
            shellCmd.privilege = {shizuku: {uid: euid}};
            break;
        case 2000:
            log("Shizuku有adb shell权限");
            shellCmd.privilege = {shizuku: {uid: euid}};
            break;
        default:
            log("通过Shizuku获取权限失败，Shizuku是否正确安装并启动了？");
            shellCmd.privilege = null;
        }
    }

    if (shellCmd.privilege != null) return;

    if (!files.isFile(rootMarkerPath)) {
        toastLog("Shizuku没有安装/没有启动/没有授权\n尝试直接获取root权限...");
        sleep(2500);
        toastLog("请务必选择“永久”授权，而不是一次性授权！");
    } else {
        log("Shizuku没有安装/没有启动/没有授权\n之前成功直接获取过root权限,再次检测...");
    }
    result = rootShell(cmd);
    if (result.code == 0) euid = getEUID(result.result);
    if (euid == 0) {
        log("直接获取root权限成功");
        shellCmd.privilege = {shizuku: null};
        files.create(rootMarkerPath);
    } else {
        toastLog("直接获取root权限失败！");
        sleep(2500);
        shellCmd.privilege = null;
        files.remove(rootMarkerPath);
        if (device.sdkInt >= 23) {
            toastLog("请下载安装Shizuku,并按照说明启动它\n然后在Shizuku中给本应用授权");
            $app.openUrl("https://shizuku.rikka.app/zh-hans/download.html");
        } else {
            toastLog("Android版本低于6，Shizuku不能使用最新版\n请安装并启动Shizuku 3.6.1，并给本应用授权");
            $app.openUrl("https://github.com/RikkaApps/Shizuku/releases/tag/v3.6.1");
        }
    }

    return shellCmd.privilege;
}
shellCmd.requestShellPrivilege = sync(function () {
    if (requestShellPrivilegeThread != null && requestShellPrivilegeThread.isAlive()) {
        toastLog("已经在尝试申请root或adb权限了\n请稍后重试");
    } else {
        requestShellPrivilegeThread = threads.start(requestShellPrivilege);
    }
});

//使用Shizuku执行shell命令
function shizukuShell(cmd, logstring) {
    if (logstring === true || (logstring !== false && logstring == null))
        logstring = "执行shell命令: ["+cmd+"]";
    if (logstring !== false) log("使用Shizuku"+logstring);
    $shell.setDefaultOptions({adb: true});
    let result = $shell(cmd);
    $shell.setDefaultOptions({adb: false});
    if (logstring !== false) log("使用Shizuku"+logstring+" 完成");
    return result;
};
shellCmd.shizukuShell = shizukuShell;

//直接使用root权限执行shell命令
function rootShell(cmd, logstring) {
    if (logstring === true || (logstring !== false && logstring == null))
        logstring = "执行shell命令: ["+cmd+"]";
    if (logstring !== false) log("直接使用root权限"+logstring);
    $shell.setDefaultOptions({adb: false});
    if (logstring !== false) log("直接使用root权限"+logstring+" 完成");
    return $shell(cmd, true);
};
shellCmd.rootShell = rootShell;

//根据情况使用Shizuku还是直接使用root执行shell命令
function privShell(cmd, logstring) {
    if (shellCmd.privilege) {
        if (shellCmd.privilege.shizuku) {
            return shizukuShell(cmd, logstring);
        } else {
            return rootShell(cmd, logstring);
        }
    } else {
        shellCmd.requestShellPrivilege();
        throw new Error("没有root或adb权限");
    }
}
shellCmd.privShell = privShell;

//不使用特权执行shell命令
function normalShell(cmd, logstring) {
    if (logstring === true || (logstring !== false && logstring == null))
        logstring = "执行shell命令: ["+cmd+"]";
    if (logstring !== false) log("不使用特权"+logstring);
    $shell.setDefaultOptions({adb: false});
    if (logstring !== false) log("不使用特权"+logstring+" 完成");
    return $shell(cmd);
}
shellCmd.normalShell = normalShell;

//检查并申请root或adb权限
function getEUID(procStatusContent) {
    let matched = procStatusContent.match(/(^|\n)Uid:\s+\d+\s+\d+\s+\d+\s+\d+($|\n)/);
    if (matched != null) {
        matched = matched[0].match(/\d+(?=\s+\d+\s+\d+($|\n))/);
    }
    if (matched != null) {
        return parseInt(matched[0]);
    } else {
        return -1;
    }
}
shellCmd.getEUID = getEUID;

module.exports = shellCmd;