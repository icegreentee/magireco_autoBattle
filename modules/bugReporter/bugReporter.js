//报告问题模块

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var bugReporter = {};
var MODULES = {};


function init() {
    MODULES = bugReporter.MODULES;
}
bugReporter.init = init;

const logMaxSize = 1048576;

function setFollowRedirects(value) {
    let newokhttp = new Packages.okhttp3.OkHttpClient.Builder().followRedirects(value);
    http.__okhttp__.muteClient(newokhttp);
}

var reportTask = null;
function reportBug() {
    toastLog("正在上传日志和最近一次的快照,请耐心等待...");

    log(appName);
    try{MODULES.floatUI.logParams();} catch (e) {}
    log("Android API Level", device.sdkInt);
    log("屏幕分辨率", device.width, device.height);
    var str = "";
    for (let key of ["brand", "device", "model", "product", "hardware"]) {
        str += "\n"+key+" "+device[key];
    }
    log(str);

    var snapshotDir = files.join(files.getSdcardPath(), "auto_magireco");
    var listedFilenames = files.listDir(snapshotDir, function (filename) {
        return filename.match(/^\d+-\d+-\d+_\d+-\d+-\d+\.xml$/) != null && files.isFile(files.join(snapshotDir, filename));
    });
    var latest = [0,0,0,0,0,0];
    if (listedFilenames != null) {
        for (let i=0; i<listedFilenames.length; i++) {
            let filename = listedFilenames[i];
            let timestamp = filename.match(/^\d+-\d+-\d+_\d+-\d+-\d+/)[0];
            let timevalues = timestamp.split('_').join('-').split('-');
            let isNewer = true;
            for (let j=0; j<6; j++) {
                if (timevalues[j] < latest[j]) {
                    isNewer = false;
                    break;
                }
            }
            if (isNewer) for (let j=0; j<6; j++) {
                latest[j] = timevalues[j];
            }
        }
    }
    var snapshotContent = null;
    if (listedFilenames != null && listedFilenames.length > 0) {
        let latestSnapshotFilename = latest.slice(0, 3).join('-') + "_" + latest.slice(3, 6).join('-') + ".xml";
        log("要上传的快照文件名", latestSnapshotFilename);
        snapshotContent = files.read(files.join(snapshotDir, latestSnapshotFilename));
        let snapshotBytes = files.readBytes(files.join(snapshotDir, latestSnapshotFilename));
        let snapshotSize = snapshotBytes.length;
        log("快照大小", snapshotSize+"字节", snapshotContent.length+"字符");
        if (snapshotSize > logMaxSize) {
            //大于1MB时不上传
            snapshotContent = null;
            toastLog("快照文件太大，请采取其他方式上传");
        }
    }

    var parentDir = files.join(engines.myEngine().cwd(), "..");
    var logDir = files.join(parentDir, "logs");
    var logContent = files.read(files.join(logDir, "log.txt"));
    let logBytes = files.readBytes(files.join(logDir, "log.txt"));
    let logSize = logBytes.length;
    log("日志大小", logSize+"字节", logContent.length+"字符");
    if (logSize > logMaxSize) {
        //大于1MB时只截取尾部
        //算法太渣，很慢，需要改
        let excessSize = logSize - logMaxSize;
        let rate = logSize / logContent.length;
        let est = excessSize / rate;
        do {
            var logTailContent = new java.lang.String(logContent).substring(est, logContent.length-1);
            var logTailSize = new java.lang.String(logTailContent).getBytes().length;
            est += (logTailSize - logMaxSize) / rate;
            sleep(1000);
        } while (logTailSize - logMaxSize > 0 || logTailSize - logMaxSize <= -32);
        logContent = logTailContent;
        log("截取尾部 日志大小", logTailSize+"字节", logContent.length+"字符");
    }

    var resultLinks = "";

    var uploadContents = {
        log: {content: logContent, syntax: "text"},
        snapshot: {content: snapshotContent, syntax: "xml"}
    };
    for (let key in uploadContents) {
        if (uploadContents[key].content == null) {
            log("读取"+key+"内容失败");
            continue;
        }
        if (uploadContents[key].content == "") {
            log(key+"内容为空,无法上传");
            continue;
        }

        toastLog("上传"+key+"...");

        http.__okhttp__.setTimeout(60 * 1000);
        setFollowRedirects(false);
        let response = null;
        try {
            response = http.post("https://pastebin.ubuntu.com/", {
                poster: "autojs_"+key,
                syntax: uploadContents[key].syntax,
                expiration: "week",
                content: uploadContents[key].content
            });
        } catch (e) {
            toastLog("请求超时,请稍后再试");
        }
        setFollowRedirects(true);

        if (response == null) {
            log(key+"上传失败");
        } else if (response.statusCode != 302) {
            log(key+"上传失败", response.statusCode, response.statusMessage);
        } else {
            if (resultLinks != "") resultLinks += "\n";
            let location = response.headers["Location"];
            resultLinks += key+"已上传至: ";
            if (location != null) {
                resultLinks += "https://pastebin.ubuntu.com"+location;
            } else {
                log(key+"链接获取失败");
                resultLinks += "链接获取失败";
            }
            toastLog(key+"上传完成!\n等待2秒后继续...");
            sleep(2000);
        }
    }

    if (resultLinks != "") {
        log(resultLinks);
        ui.run(() => {
            clip = android.content.ClipData.newPlainText("auto_bugreport_result", resultLinks);
            activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE).setPrimaryClip(clip);
            toast("内容已复制到剪贴板");
        });
        dialogs.build({
            title: "上传完成",
            content: "别忘了全选=>复制，然后粘贴给群里的小伙伴们看看哦~ 不然的话，我们也不知道你上传到哪里了啊！！！",
            inputPrefill: resultLinks
        }).show();
        log("报告问题对话框已关闭");
    }
}

module.exports = bugReporter;