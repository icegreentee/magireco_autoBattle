//在线更新模块

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var onlineUpdate = {};
var MODULES = {};


function init() {
    MODULES = onlineUpdate.MODULES;
}
onlineUpdate.init = init;

http.__okhttp__.setTimeout(5000);

var setTimeout = sync(function (newTimeout) {
    http.__okhttp__.setTimeout(newTimeout);
});
onlineUpdate.setTimeout = setTimeout;

var restart = sync(function (message) {
    //先注册退出回调，然后退出并触发重启
    events.on("exit", function () {
        //通过execScriptFile好像会有问题，比如点击悬浮窗QB=>齿轮然后就出现两个QB
        //engines.execScriptFile(engines.myEngine().cwd() + "/main.js")
        app.launch(context.getPackageName());
        toast(message == null ? "更新完毕" : message);
    })
    engines.stopAll(); //实际上在这之后还是会多执行几句
});
onlineUpdate.restart = restart;

var dataDir = files.cwd();

function checkHash(fileName, fileContent, fileHash, fileContentType) {
    if (onlineUpdate.isDevMode) {
        log("isDevMode == true 不检查哈希值");
        return true;
    }

    let fileHashCalc = $crypto.digest(fileContent, "SHA-256", { input: fileContentType, output: "hex" }).toLowerCase();

    if (fileHashCalc != fileHash) {
        log("文件 ["+fileName+"] 哈希值不符\n参照值=["+fileHash+"] 实际值=["+fileHashCalc+"]");
        return false;
    } else {
        return true;
    }
}

function verifyFile(fileInfo) { try {
    let fileName = fileInfo.fileName;
    let fileDir = files.join(dataDir, fileInfo.fileDir);
    let filePath = files.join(fileDir, fileName);
    let fileHash = fileInfo.fileHash;
    //let fileVersion = fileInfo.fileVersion; //用不到

    if (fileName.endsWith("/")) {
        toastLog("验证文件时出错\n文件名结尾是\"/\": ["+fileName+"]");
        return false;
    }

    if (!files.isFile(filePath)) {
        log("文件 ["+fileName+"] 不存在");
        log("完整路径: ["+filePath+"]");
        return false;
    }

    let existingFileBytes = files.readBytes(filePath);

    if (!checkHash(fileName, existingFileBytes, fileHash, "bytes")) {
        log("完整路径: ["+filePath+"]");
        return false;
    } else {
        return true;
    }
} catch (e) {
    logException(e);
    toastLog("验证文件时出错", fileInfo);
    return false;
} }

var verifyModule = sync(function (moduleName, fixMismatch) { try {
    let moduleDir = files.join(dataDir, "modules");
    moduleDir = files.join(moduleDir, moduleName);
    let moduleHashesFileName = moduleName+"-sha256-hashes.json";
    if (moduleName == "main") {
        //不是子模块，而是主程序
        moduleDir = dataDir;
    }
    let moduleHashesFilePath = files.join(moduleDir, moduleHashesFileName);

    if (!files.isFile(moduleHashesFilePath)) {
        toastLog("未找到模块 ["+moduleName+"] 的哈希值文件");
        return false;
    }

    let moduleHashesJSON = files.read(moduleHashesFilePath);

    let fileInfoArray = JSON.parse(moduleHashesJSON);

    for (let fileInfo of fileInfoArray) {
        if (!verifyFile(fileInfo)) {
            if (fixMismatch) {
                if (!updateFile(fileInfo)) return false;
            } else {
                return false;
            }
        }
    }

    return true;
} catch (e) {
    logException(e);
    toastLog("验证模块时出错", moduleName);
    return false;
} });
onlineUpdate.verifyModule = verifyModule;

const updateURLBase = "https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle";

function updateFile(fileInfo) { try {
    let fileName = fileInfo.fileName;
    let fileDir = files.join(dataDir, fileInfo.fileDir);
    let filePath = files.join(fileDir, fileName);
    let fileHash = fileInfo.fileHash;
    let fileVersion = fileInfo.fileVersion;

    if (fileName.endsWith("/")) {
        toastLog("更新或修复文件时出错\n文件名结尾是\"/\": ["+fileName+"]");
        return false;
    }

    let updateURLBaseWithVersion = updateURLBase+"@"+fileVersion;
    let url = updateURLBaseWithVersion+"/"+fileInfo.fileDir+"/"+fileName;

    let response = http.get(url);

    if (response.statusCode != 200) {
        toastLog("无法下载文件 ["+fileName+"]\nHTTP "+response.statusCode+" "+response.statusMessage);
        log("完整URL: ["+url+"]");
        return false;
    }

    let downloadedBytes = response.body.bytes();
    if (!checkHash(fileName, downloadedBytes, fileHash, "bytes")) {
        //可能是CRLF行尾，转换到LF再试一次
        let downloadedString = response.body.string();
        let downloadedStringLF = downloadedString.split("\r").join("");
        if (!checkHash(fileName, downloadedStringLF, fileHash, "string")) {
            log("完整路径: ["+filePath+"]");
            return false;
        }
    }

    log("写入文件 ["+fileName+"] ...");
    files.ensureDir(filePath);
    files.writeBytes(filePath, downloadedBytes);

    if (files.isFile(filePath)) {
        log("写入文件 ["+fileName+"] 完成");
    } else {
        toastLog("写入文件 ["+fileName+"] 失败\n文件不存在");
        return false;
    }

    let writtenFileBytes = files.readBytes(filePath);

    if (!checkHash(fileName, writtenFileBytes, fileHash, "bytes")) {
        toastLog("写入后的文件 ["+filePath+"] 哈希值不符\n参照值=["+fileHash+"] 实际值=["+fileHashCalc+"]");
        return false;
    } else {
        return true;
    }
} catch (e) {
    logException(e);
    toastLog("更新或修复文件时出错", fileInfo);
    return false;
} }

var updateModuleToVersion = sync(function (moduleName, newVersion) { try {
    let moduleDir = files.join(dataDir, "modules");
    moduleDir = files.join(moduleDir, moduleName);
    let moduleHashesFileName = moduleName+"-sha256-hashes.json";
    if (moduleName == "main") {
        //不是子模块，而是主程序
        moduleDir = dataDir;
    }
    let moduleHashesFilePath = files.join(moduleDir, moduleHashesFileName);

    let updateURLBaseWithVersion = updateURLBase+"@"+newVersion;
    let url = updateURLBaseWithVersion+(moduleName=="main"?"/":"/modules/"+moduleName)+"/"+moduleHashesFileName;

    let response = http.get(url);

    if (response.statusCode != 200) {
        toastLog("无法下载模块 ["+moduleName+"] 的哈希值文件\nHTTP "+response.statusCode+" "+response.statusMessage);
        log("完整URL: ["+url+"]");
        return false;
    }

    let downloadedString = response.body.string();
    try {
        let fileInfoArray = JSON.parse(downloadedString);
        if (fileInfoArray == null) {
            toastLog("解析模块 ["+moduleName+"] 的哈希值文件的结果为null");
            return false;
        }
    } catch (e) {
        logException(e);
        toastLog("解析模块 ["+moduleName+"] 的哈希值文件时出错");
        return false;
    }

    log("写入模块 ["+moduleName+"] 的哈希值文件...");
    files.ensureDir(moduleHashesFilePath);
    files.write(moduleHashesFilePath, downloadedString);
    if (files.isFile(moduleHashesFilePath)) {
        log("写入模块 ["+moduleName+"] 的哈希值文件完成");
    } else {
        toastLog("写入模块 ["+moduleName+"] 的哈希值文件时出错\n文件不存在");
        return false;
    }

    return verifyModule(moduleName, true);
} catch (e) {
    logException(e);
    toastLog("更新模块到指定版本时出错", moduleName, newVersion);
    return false;
} });
onlineUpdate.updateModuleToVersion = updateModuleToVersion;

onlineUpdate.appVersion = "0.0.0"; //需要外界传入

var getLatestVersion = sync(function() { try {
    if (onlineUpdate.appVersion == "0.0.0") {
        toastLog("onlineUpdate是否忘记传入当前版本号？");
    }

    let result = {upgradable: false, newVersion: onlineUpdate.appVersion, hasError: false};
    let updateURLBaseLatest = updateURLBase+"@latest";
    let url = updateURLBaseLatest+"/project.json";

    let response = http.get(url);

    if (response.statusCode != 200) {
        toastLog("无法下载 [project.json]\nHTTP "+response.statusCode+" "+response.statusMessage);
        log("完整URL: ["+url+"]");
        result.upgradable = false;
        result.hasError = true;
        return result;
    }

    let parsed = JSON.parse(response.body.string());

    let appVersionNumbers = onlineUpdate.appVersion.split(".");
    let latestVersionNumbers = parsed.versionName.split(".");
    let shorterCount = appVersionNumbers.length > latestVersionNumbers.length ? latestVersionNumbers.length : appVersionNumbers.length;

    for (let i=0; i<shorterCount; i++) {
        if (latestVersionNumbers[i] > appVersionNumbers[i]) {
            result.upgradable = true;
            result.newVersion = parsed.versionName;
            break;
        }
    }

    return result;
} catch (e) {
    logException(e);
    toastLog("获取最新版本时出错");
    return {upgradable: false, newVersion: onlineUpdate.appVersion, hasError: true};
} });
onlineUpdate.getLatestVersion = getLatestVersion;

var updateEverythingToLatest = sync(function (isForced) { try {
    let latest = getLatestVersion();
    if (latest.hasError) {
        return false;
    }
    if (!latest.upgradable) {
        if (isForced) {
            log("仍然继续更新");
        } else {
            toastLog("无需更新");
            return true;
        }
    }

    let updateURLBaseWithVersion = updateURLBase+"@"+latest.newVersion;
    let url = updateURLBaseWithVersion+"/"+"modules.json";

    log("下载 modules.json ...");
    let response = http.get(url);
    if (response.statusCode != 200) {
        toastLog("无法下载 modules.json");
        log("完整URL: ["+url+"]");
        return false;
    }
    log("下载 modules.json 完成");

    let downloadedString = response.body.string();

    log("解析 modules.json ...");
    let localModuleInfoList = null;
    try {
        localModuleInfoList = JSON.parse(downloadedString);
    } catch (e) {
        logException(e);
        toastLog("解析 modules.json 时出错");
        return false;
    }
    log("解析 modules.json 完成");

    log("更新所有模块...");
    for (let moduleInfo of localModuleInfoList) {
        if (!updateModuleToVersion(moduleInfo.name, latest.newVersion)) {
            return false;
        }
    }
    log("更新所有模块完成");

    log("写入 modules.json ...");
    let path = files.join(dataDir, "modules.json");
    files.ensureDir(path);
    files.write(path, downloadedString);
    if (files.isFile(path)) {
        log("写入 modules.json 完成");
    } else {
        toastLog("写入 modules.json 时出错\n文件不存在");
        return false;
    }

    log("升级主程序...");
    if (!updateModuleToVersion("main", latest.newVersion)) return false;
    log("升级主程序完成");

    return true;
} catch (e) {
    logException(e);
    toastLog("升级所有组件到最新版本时出错");
    return false;
} });
onlineUpdate.updateEverythingToLatest = updateEverythingToLatest;


module.exports = onlineUpdate;