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

function verifyFile(fileInfo) { try {
    let fileName = fileInfo.fileName;
    let filePath = files.join(dataDir, fileName);
    let fileHash = fileInfo.fileHash;
    //let fileVersion = fileInfo.fileVersion; //用不到

    if (fileName.endsWith("/")) {
        toastLog("验证文件时出错\n文件名结尾是\"/\": ["+fileName+"]");
        return false;
    }

    if (!files.isFile(filePath)) {
        toastLog("文件 ["+filePath+"] 不存在");
        return false;
    }

    let existingFileBytes = files.readBytes(filePath);
    let fileHashCalc = $crypto.digest(existingFileBytes, "SHA-256", { input: "bytes", output: "hex" }).toLowerCase();

    if (fileHashCalc != fileHash) {
        toastLog("文件 ["+filePath+"] 哈希值不符\n参照值=["+fileHash+"] 实际值=["+fileHashCalc+"]");
        return false;
    } else {
        return true;
    }
} catch (e) {
    toastLog("验证文件时出错", fileInfo);
    logException(e);
    return false;
} }

var verifyModule = sync(function (moduleName, fixMismatch) { try {
    let moduleDir = files.join(dataDir, moduleName);
    let moduleHashesFileName = moduleName+"-sha256-hashes.json";
    if (moduleName == "") {
        //不是子模块，而是主程序
        moduleDir = dataDir;
        moduleHashesFileName = "sha256-hashes.json";
    }
    let moduleHashesFilePath = files.join(moduleDir, moduleHashesFileName);

    if (!files.isFile(moduleHashesFilePath)) {
        toastLog("未找到模块 ["+moduleName"] 的哈希值文件");
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
    toastLog("验证模块时出错", moduleName);
    logException(e);
    return false;
} });
onlineUpdate.verifyModule = verifyModule;

const updateURLBase = "https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle";

function updateFile(fileInfo) { try {
    let fileName = fileInfo.fileName;
    let filePath = files.join(dataDir, fileName);
    let fileHash = fileInfo.fileHash;
    let fileVersion = fileInfo.fileVersion;

    if (fileName.endsWith("/")) {
        toastLog("更新或修复文件时出错\n文件名结尾是\"/\": ["+fileName+"]");
        return false;
    }

    let updateURLBaseWithVersion = updateURLBase+"@"+fileVersion;
    let url = updateURLBaseWithVersion+"/"+fileName;

    let response = http.get(url);

    if (response.statusCode != 200) {
        toastLog("无法下载文件 ["+fileName+"]\nHTTP "+response.statusCode+" "+response.statusMessage);
        return false;
    }

    let downloadedBytes = response.body.bytes();
    let downloadedHash = $crypto.digest(downloadedBytes, "SHA-256", { input: "bytes", output: "hex" }).toLowerCase();
    if (downloadedHash != fileHash) {
        //可能是CRLF行尾，转换到LF再试一次
        let downloadedString = response.body.string();
        let downloadedStringLF = downloadedString.split("\r").join("");
        let downloadedHashLF = $crypto.digest(downloadedStringLF, "SHA-256", { input: "string", output: "hex" }).toLowerCase();
        if (downloadedHashLF != fileHash) {
            toastLog("下载到的文件 ["+fileName+"] 哈希值不符\n参照值=["+fileHash+"] 实际值=["+downloadedHash+"]");
            return false;
        }
    }

    log("写入文件 ["+fileName+"] ...");
    let fileSubDir = filePath.split("/").pop().join("/");
    files.ensureDir(fileSubDir);
    files.create(filePath);
    files.writeBytes(filePath, downloadedBytes);

    if (files.isFile(filePath)) {
        log("写入文件 ["+fileName+"] 完成");
    } else {
        toastLog("写入文件 ["+fileName+"] 失败\n文件不存在");
        return false;
    }

    let writtenFileBytes = files.readBytes(filePath);
    let fileHashCalc = $crypto.digest(writtenFileBytes, "SHA-256", { input: "bytes", output: "hex" }).toLowerCase();

    if (fileHashCalc != fileHash) {
        toastLog("写入后的文件 ["+filePath+"] 哈希值不符\n参照值=["+fileHash+"] 实际值=["+fileHashCalc+"]");
        return false;
    } else {
        return true;
    }
} catch (e) {
    toastLog("更新或修复文件时出错", fileInfo);
    logException(e);
    return false;
} }

var updateModuleToVersion = sync(function (moduleName, newVersion) { try {
    let moduleDir = files.join(dataDir, moduleName);
    let moduleHashesFileName = moduleName+"-sha256-hashes.json";
    if (moduleName == "") {
        //不是子模块，而是主程序
        moduleDir = dataDir;
        moduleHashesFileName = "sha256-hashes.json";
    }
    let moduleHashesFilePath = files.join(moduleDir, moduleHashesFileName);

    let updateURLBaseWithVersion = updateURLBase+"@"+newVersion;
    let url = updateURLBaseWithVersion+"/"+moduleHashesFileName;

    let response = http.get(url);

    if (response.statusCode != 200) {
        toastLog("无法下载模块 ["+moduleName+"] 的哈希值文件\nHTTP "+response.statusCode+" "+response.statusMessage);
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
        toastLog("解析模块 ["+moduleName+"] 的哈希值文件时出错");
        logException(e);
        return false;
    }

    log("写入模块 ["+moduleName+"] 的哈希值文件...");
    files.ensureDir(moduleDir);
    files.create(moduleHashesFilePath);
    files.write(moduleHashesFilePath, downloadedString);
    if (files.isFile()) {
        log("写入模块 ["+moduleName+"] 的哈希值文件完成");
    } else {
        toastLog("写入模块 ["+moduleName+"] 的哈希值文件时出错\n文件不存在");
        return false;
    }

    return verifyModule(moduleName, true);
} catch (e) {
    toastLog("更新模块到指定版本时出错", moduleName, newVersion);
    logException(e);
    return false;
} });
onlineUpdate.updateModuleToVersion = updateModuleToVersion;

onlineUpdate.currentVersion = "0.0.0"; //需要外界传入

var getLatestVersion = sync(function() { try {
    if (onlineUpdate.currentVersion == "0.0.0") {
        toastLog("onlineUpdate是否忘记传入当前版本号？");
    }

    let result = {upgradable: false, newVersion: onlineUpdate.currentVersion, hasError: false};
    let updateURLBaseLatest = updateURLBase+"@latest";
    let url = updateURLBaseLatest+"/project.json";

    let response = http.get(url);

    if (response.statusCode != 200) {
        toastLog("无法下载 [project.json]\nHTTP "+response.statusCode+" "+response.statusMessage);
        return false;
    }

    let parsed = JSON.parse(response.body.string());

    let currentVersionNumbers = onlineUpdate.currentVersion.split(".");
    let latestVersionNumbers = parsed.versionName.split(".");
    let shorterCount = currentVersionNumbers.length > latestVersionNumbers.length ? latestVersionNumbers.length : currentVersionNumbers.length;

    for (let i=0; i<shorterCount; i++) {
        if (latestVersionNumbers[i] > currentVersionNumbers[i]) {
            result.upgradable = true;
            result.newVersion = parsed.versionName;
            break;
        }
    }

    return result;
} catch (e) {
    toastLog("获取最新版本时出错");
    logException(e);
    return {upgradable: false, newVersion: onlineUpdate.currentVersion, hasError: true};
} });
onlineUpdate.getLatestVersion = getLatestVersion;


module.exports = onlineUpdate;