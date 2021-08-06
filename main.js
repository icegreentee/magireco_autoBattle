"ui";
importClass(android.view.View)
importClass(android.graphics.Color)
importClass(android.view.MenuItem)
importClass(com.stardust.autojs.project.ProjectConfig)
importClass(com.stardust.autojs.core.ui.inflater.util.Ids)
importClass(Packages.androidx.core.graphics.drawable.DrawableCompat)
importClass(Packages.androidx.appcompat.content.res.AppCompatResources)
importClass(android.webkit.WebView)
importClass(android.webkit.WebChromeClient)
importClass(android.webkit.WebResourceResponse)
importClass(android.webkit.WebViewClient)

var Name = "AutoBattle";
var version = "5.3.0";
var appName = Name + " v" + version;

//注意:这个函数只会返回打包时的版本，而不是在线更新后的版本！
function getProjectVersion() {
    var conf = ProjectConfig.Companion.fromProjectDir(engines.myEngine().cwd());
    if (conf) return conf.versionName;
}

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var floatUI = require('floatUI.js');

function setFollowRedirects(value) {
    let newokhttp = new Packages.okhttp3.OkHttpClient.Builder().followRedirects(value);
    http.__okhttp__.muteClient(newokhttp);
}

const logMaxSize = 1048576;
var reportTask = null;
function reportBug() {
    toastLog("正在上传日志和最近一次的快照,请耐心等待...");

    log(appName);
    try{floatUI.logParams();} catch (e) {}
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
            let timevalues = timestamp.split('_').join('-').split('-').map((val) => parseInt(val));
            let isNewer = false;
            for (let j=0; j<6; j++) {
                if (timevalues[j] > latest[j]) {
                    isNewer = true;
                    break;
                } else if (timevalues[j] < latest[j]) {
                    isNewer = false;
                    break;
                } //相等的话继续比下一项数值
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

var isDevMode = false;//TODO 以后用上Webpack了就改成根据NODE_ENV来判断


var floatIsActive = false;
// 悬浮窗权限检查
if (!$floaty.checkPermission()) {
    toastLog("没有悬浮窗权限\n申请中...");
    let failed = false;
    //这里的调用都不阻塞
    //也许$floaty.requestPermission出问题时未必会抛异常，但startActivity在MIUI上确证会抛异常
    //所以先尝试startActivity，再尝试$floaty.requestPermission
    try {
        app.startActivity({
            packageName: "com.android.settings",
            className: "com.android.settings.Settings$AppDrawOverlaySettingsActivity",
            data: "package:" + context.getPackageName(),
        });
    } catch (e) {
        failed = true;
        logException(e);
    }
    if (failed) {
        failed = false;
        toastLog("申请悬浮窗权限时出错\n再次申请...");
        try {
            $floaty.requestPermission();
        } catch (e) {
            failed = true;
            logException(e);
        }
    }
    if (failed) {
        toastLog("申请悬浮窗权限时出错\n请到应用设置里手动授权");
    } else {
        toast("请重新启动脚本");
    }
    exit();
} else {
    floatUI.main();
    floatIsActive = true;
}

function switchSettingsUI(mode) {
    let path = files.join(files.cwd(), "use_legacy_settings_ui");
    switch (mode) {
        case "legacy":
            toastLog("切换到旧版设置界面");
            files.ensureDir(path);
            files.create(path);
            break;
        case "webview":
            toastLog("切换到新版设置界面");
            files.remove(path);
            break;
        default:
            toastLog("不知道要切换到哪种设置界面");
            return;
    }
    events.on("exit", function () {
        app.launch(context.getPackageName());
    });
    engines.stopAll();
}

function toggleAutoService(enable) {
    if (enable && !auto.service) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
        //部分品牌的手机在有悬浮窗的情况下拒绝开启无障碍服务（目前只发现OPPO是这样）
        //为了关闭悬浮窗，最简单的办法就是退出脚本
        ui.run(function () {
            //TODO 需要适配新版UI
            if (ui["exitOnServiceSettings"] != null && ui["exitOnServiceSettings"].isChecked()) exit();
        });
    }
    let disableSelfDone = false;
    if (!enable && auto.service) {
        if (device.sdkInt >= 24) {
            try {
                auto.service.disableSelf();
                disableSelfDone = true;//即便禁用成功了，auto.service也不会立即变成null
            } catch (e) {
                logException(e);
                disableSelfDone = false;
            }
        } else {
            toastLog("Android 6.0或以下请到系统设置里手动关闭无障碍服务");
            app.startActivity({
                action: "android.settings.ACCESSIBILITY_SETTINGS"
            });
        }
    }
    return disableSelfDone ? false : (auto.service != null ? true : false);
}

var useLegacySettingsUI = false;
if (files.isFile(files.join(files.cwd(), "use_legacy_settings_ui"))) {
    useLegacySettingsUI = true;
}

if (!useLegacySettingsUI) {
    //使用新版UI
    ui.layout(
        <vertical h="auto" w="*">
            <webview id="webview" w="auto" h="auto"/>
        </vertical>
    );

    //正式发布
    let path = "/autoWebview/dist/index.html"
    let releaseUrlBase = "https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle@latest";
    let releaseUrl = releaseUrlBase+path;

    //开发环境，可以用adb reverse tcp:8080 tcp:8080来映射端口到npm run serve启动的HTTP服务器
    let debugUrlBase = "http://127.0.0.1:8080";
    let debugUrl = debugUrlBase+"/index.html";

    //优先使用本地URL，文件不存在时使用在线URL
    let onlineUrl = isDevMode ? debugUrl : releaseUrl;
    let fileUrl = files.join(files.cwd(), path);
    fileUrl = "file://"+fileUrl;
    let url = files.isFile(path) ? fileUrl : onlineUrl;
    ui.webview.loadUrl(url);

    //借用prompt处理Web端主动发起的对AutoJS端的通信
    //参考：https://www.jianshu.com/p/94277cb8f835
    function handleWebViewCallAJ(fnName, paramString) {
        let result = null;
        let resultString = "";

        let params = [];
        try {
            if (paramString !== "") params = JSON.parse(paramString);
        } catch (e) {
            logException(e);
            params = [];
        }

        switch (fnName) {
            case "switchSettingsUI":
                if (params.length > 0) switchSettingsUI(params[0]);
                result = true;
                break;
            case "isAutoServiceEnabled":
                result = auto.service ? true : false;
                break;
            case "toggleAutoService":
                result = false;
                if (params.length > 0) result = toggleAutoService(params[0]);
                break;
            case "getScripts":
                result = [];
                if (floatUI != null) {
                    result = floatUI.scripts.map((val) => {delete val.fn; return val;});
                }
                break;
            case "getSettingsParam":
                //TODO 为保持兼容，不应使用webview里的localstorage，还是应该继续从AutoJS的storages里读取参数
                break;
            case "setSettingsParam":
                //TODO 为保持兼容，不应使用webview里的localstorage，还是应该继续从AutoJS的storages里读取参数
                break;
            case "reportBug":
                if (reportTask && reportTask.isAlive()) {
                    toastLog("已经在上传了,请稍后再试");
                } else {
                    reportTask = threads.start(reportBug);
                }
                break;
            case "openLogConsole":
                app.startActivity("console");
                break;
            default:
                toastLog("未知的callAJ命令:\n["+fnName+"]");
        }

        try {
            resultString = JSON.stringify(result);
        } catch (e) {
            logException(e);
            resultString = "";
        }
        return resultString;
    }
    let webViewSettings = ui.webview.getSettings();
    webViewSettings.setAllowFileAccessFromFileURLs(false);
    webViewSettings.setAllowUniversalAccessFromFileURLs(false);
    webViewSettings.setSupportZoom(false);
    webViewSettings.setJavaScriptEnabled(true);
    var webcc = new JavaAdapter(WebChromeClient, {
        onJsPrompt: function (view, url, message, defaultValue, jsPromptResult) {
            let result = "";
            try {
                result = handleWebViewCallAJ(message, defaultValue);
                if (result == null) result = "";
            } catch (e) {
                logException(e);
                result = "";
            }
            jsPromptResult.confirm(result);//必须confirm，否则会在Webview上阻塞JS继续执行
            return true;
        }
    });
    ui.webview.setWebChromeClient(webcc);

    //在Webview端执行JS代码
    //参考 https://github.com/710850609/autojs-webView/blob/02ff4540618a16014e67ad2d4c4bd6f80e7da685/expand/core/webViewExpand.js#L212
    function callWebviewJS(script, callback) {
        try {
            ui.webview.evaluateJavascript("javascript:"+script, new JavaAdapter(android.webkit.ValueCallback, {
                onReceiveValue: (val) => {
                    if (callback) {
                        callback(val);
                    }
                }
            }));
        } catch (e) {
            logException(e);
            log("在Webview端执行JS代码时出错");
        }
    }

    //回到本界面时，resume事件会被触发
    ui.emitter.on("resume", () => {
        // 此时根据无障碍服务的开启情况，同步开关的状态
        let jscode = "window.updateSettingsUI(\"isAutoServiceEnabled\","+(auto.service!=null?true:false)+");";
        callWebviewJS(jscode);
        if (!floatIsActive) {
            floatUI.main();
            floatIsActive = true;
        }
        //TODO
        //if ($settings.isEnabled('foreground_service') != ui.foreground.isChecked())
        //    ui.foreground.setChecked($settings.isEnabled('foreground_service'));
        //if ($settings.isEnabled('stop_all_on_volume_up') != ui.stopOnVolUp.isChecked())
        //    ui.stopOnVolUp.setChecked($settings.isEnabled('stop_all_on_volume_up'));
    });
} else {
    //使用旧版UI
    ui.statusBarColor("#FF4FB3FF")
    ui.layout(
        <relative id="container">
            <appbar id="appbar" w="*">
                <toolbar id="toolbar" bg="#ff4fb3ff" title="{{appName}}" />
            </appbar>
            <vertical id="running_stats" visibility="gone" w="fill_parent" h="fill_parent" layout_below="appbar" gravity="center_horizontal">
                <text id="running_stats_title" text="脚本运行中" textColor="#00D000" textSize="20" w="wrap_content" h="wrap_content"/>
                <text id="running_stats_status_text" marginLeft="5" layout_gravity="center_vertical" text="" w="wrap_content" h="wrap_content"/>
                <text id="running_stats_params_text" marginLeft="5" layout_gravity="center_vertical" text="" w="wrap_content" h="wrap_content"/>
            </vertical>
            <androidx.swiperefreshlayout.widget.SwipeRefreshLayout id="swipe" layout_below="appbar">
                <ScrollView id="content">
                    <vertical gravity="center" layout_weight="1">
                        <vertical id="autojs_ver_vertical" visibility="gone" margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                            <text id="autojs_ver_text" text="AutoJS Pro 引擎版本过低" textColor="#FFCC00" textSize="16" w="wrap_content" h="wrap_content"/>
                        </vertical>

                        <vertical id="task_paused_vertical" visibility="gone" margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                            <text id="task_paused_title" text="脚本已暂停" textColor="#FFCC00" textSize="20" w="wrap_content" h="wrap_content"/>
                            <button id="task_paused_button" text="返回游戏并继续运行脚本" textColor="#000000" textSize="16" w="wrap_content" h="wrap_content"/>
                        </vertical>

                        <vertical margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                            <button id="switch_ui_button" text="切换到新版设置界面" textColor="#000000" textSize="16" w="wrap_content" h="wrap_content"/>
                        </vertical>

                        <vertical margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                            <Switch id="autoService" margin="0 3" w="*" checked="{{auto.service != null}}" textColor="#666666" text="无障碍服务" />
                            <Switch id="foreground" margin="0 3" w="*" textColor="#000000" text="前台服务（常被鲨进程可以开启，按需）" />
                            <Switch id="stopOnVolUp" margin="0 3" w="*" textColor="#000000" text="按音量上键停止全部脚本" />
                            <Switch id="showExperimentalFixes" margin="0 3" w="*" checked="false" textColor="#666666" text="显示实验性问题修正选项" />
                            <vertical id="experimentalFixes" visibility="gone" margin="5 3" w="*">
                                <Switch id="exitOnServiceSettings" margin="0 3" w="*" checked="false" textColor="#000000" text="OPPO手机拒绝开启无障碍服务" />
                                <text id="exitOnServiceSettingsText1" visibility="gone" textSize="12" text="如果不是OPPO则不建议打开这个选项" textColor="#000000" />
                                <text id="exitOnServiceSettingsText2" visibility="gone" textSize="12" text="OPPO等部分品牌的手机在有悬浮窗(比如“加速球”)存在时会拒绝开启无障碍服务" textColor="#000000" />
                                <text id="exitOnServiceSettingsText3" visibility="gone" textSize="12" text="启用这个选项后，在弹出无障碍设置时，脚本会完全退出、从而关闭悬浮窗来避免触发这个问题" textColor="#000000" />
                                <text id="exitOnServiceSettingsText4" visibility="gone" textSize="12" text="与此同时请关闭其他有悬浮窗的应用(简单粗暴的方法就是清空后台)以确保无障碍服务可以顺利开启" textColor="#000000" />
                            </vertical>
                        </vertical>

                        <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                            <text text="全局设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                            <vertical padding="10 6 0 6" w="*" h="auto">
                                <linear margin="0 3">
                                    <text text="默认执行脚本" layout_weight="1" layout_gravity="center_vertical" textColor="#000000" />
                                    <spinner id="default" h="auto" gravity="right" textSize="14" textColor="#000000" entries="{{floatUI.scripts.map(x=>x.name).join('|')}}" />
                                </linear>
                                <text text="回复药使用选择:" margin="0 5" />
                                <vertical padding="10 3 0 3" w="*" h="auto">
                                    <linear>
                                        <checkbox id="drug1" text="AP回复药50(绿药)" layout_weight="1" textColor="#666666" />
                                        <text text="个数限制" textColor="#666666" />
                                        <input maxLength="3" id="drug1num" hint="留空即无限制" text="0" textSize="14" inputType="number|none" />
                                    </linear>
                                    <linear>
                                        <checkbox id="drug2" text="AP回复药全(红药)" layout_weight="1" textColor="#666666" />
                                        <text text="个数限制" textColor="#666666" />
                                        <input maxLength="3" id="drug2num" hint="留空即无限制" text="0" textSize="14" inputType="number|none" />
                                    </linear>
                                    <linear>
                                        <checkbox id="drug3" text="魔法石" layout_weight="1" textColor="#666666" />
                                        <text text="碎钻个数" textColor="#666666" />
                                        <text text="(不是次数!)" textColor="#ff00ff" />
                                        <input maxLength="3" id="drug3num" hint="留空即无限制" text="0" textSize="14" inputType="number|none" />
                                    </linear>
                                    <linear>
                                        <checkbox id="drug4" text="BP回复药(镜层)" layout_weight="1" textColor="#666666" />
                                        <text text="个数限制" textColor="#666666" />
                                        <input maxLength="3" id="drug4num" hint="留空即无限制" text="0" textSize="14" inputType="number|none" />
                                    </linear>
                                    <text text="注意:回复药开关状态和个数限制不会永久保存,在脚本完全退出后,这些设置会被重置!" textColor="#666666" />
                                </vertical>
                                <Switch id="justNPC" w="*" margin="0 5" checked="false" textColor="#000000" text="只使用NPC(不选则先互关好友,后NPC)" />
                                <Switch id="autoReconnect" w="*" margin="0 3" checked="false" textColor="#000000" text="防断线模式(尽可能自动点击断线重连按钮)" />
                                <vertical padding="0 3 0 0" w="*" h="auto">
                                    <text textColor="#000000" text="防断线模式仅限于在战斗中自动点击断线重连按钮,无法应对强制回首页的情况。闪退自动重开可以应对强制回首页。" />
                                </vertical>
                            </vertical>
                        </vertical>
                        <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                            <text text="默认脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                            <vertical padding="10 6 0 6" w="*" h="auto">
                                <Switch id="useAuto" w="*" margin="0 3" checked="true" textColor="#000000" text="优先使用官方自动续战" />
                                <vertical padding="0 8 0 0" w="*" h="auto">
                                    <linear padding="0 0 0 0" w="*" h="auto">
                                        <text text="嗑药至AP上限" textColor="#666666" />
                                        <input maxLength="1" margin="5 0 0 0" id="apmul" hint="可选值0-4,留空视为0" text="" textSize="14" inputType="number|none" />
                                        <text text="倍以上" textColor="#666666" />
                                    </linear>
                                    <text text="注意:嗑药至AP上限倍数不会永久保存,脚本完全退出后会被重置!" textColor="#666666" />
                                </vertical>
                                <vertical padding="0 8 0 0" w="*" h="auto">
                                    <Switch id="toggleDefaultExtraSettings" w="*" margin="0 3" checked="false" textColor="#666666" text="显示更多选项" />
                                </vertical>
                                <vertical id="DefaultExtraSettings1" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                    <Switch id="autoFollow" w="*" margin="0 3" checked="true" textColor="#000000" text="自动关注路人" />
                                    <text text="启用后如果助战选到了路人,会在结算时关注他。停用这个选项则不会关注路人,在结算时如果出现询问关注的弹窗,会直接关闭。" textColor="#000000" />
                                </vertical>
                                <vertical id="DefaultExtraSettings2" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                    <linear>
                                        <text text="每隔" textColor="#000000" />
                                        <input maxLength="5" id="breakAutoCycleDuration" hint="留空即不打断" text="" textSize="14" inputType="number|none" />
                                        <text text="秒打断官方自动续战" textColor="#000000" />
                                    </linear>
                                    <text text="经过设定的秒数后,长按打断官方自动周回" textColor="#000000" />
                                </vertical>
                                <vertical id="DefaultExtraSettings3" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                    <linear padding="0 0 0 0" w="*" h="auto">
                                        <text text="等待控件超时" textColor="#000000" />
                                        <input maxLength="6" margin="5 0 0 0" id="timeout" hint="5000" text="5000" textSize="14" inputType="number|none" />
                                        <text text="毫秒" textColor="#000000" />
                                    </linear>
                                    <text text="修改“等待控件超时”并不能让脚本变快,数值太小反而可能出错。如果不是机器特别卡(这种情况也要把这个值改得更大,而不是更小)请不要改,退格可自动恢复默认(5000毫秒)" textColor="#000000" />
                                </vertical>
                                <vertical padding="0 8 0 0" w="*" h="auto">
                                    <Switch id="toggleDefaultCrashRestartExtraSettings" text="显示闪退自动重开设置" textColor="#666666" />
                                    <text text="[录制闪退重开选关动作]或[导入动作录制数据]后即可在[副本周回(剧情/活动通用)]脚本启动时选择启用闪退自动重开,应对闪退或掉线后强制回首页的情况。" textColor="#000000" />
                                </vertical>
                                <vertical id="DefaultCrashRestartExtraSettings1" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                    <linear>
                                        <text text="假死检测超时" textColor="#000000" />
                                        <input maxLength="5" id="forceStopTimeout" hint="留空即不强关重开" text="" textSize="14" inputType="number|none" />
                                        <text text="秒" textColor="#000000" />
                                    </linear>
                                    <text text="如果停留在一个状态超过设定的秒数,就认为游戏已经假死,然后杀进程重开。一般用来对付黑屏上只显示一个环彩羽(或者其他角色)Live2D、而未能正常显示选关列表的问题。一般设为5到10分钟(300到600秒)。" textColor="#000000" />
                                </vertical>
                                <vertical id="DefaultCrashRestartExtraSettings2" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                    <linear>
                                        <text text="无条件杀进程重开,每隔" textColor="#000000" />
                                        <input maxLength="5" id="periodicallyKillTimeout" hint="留空即不强关重开" text="" textSize="14" inputType="number|none" />
                                        <text text="秒一次" textColor="#000000" />
                                    </linear>
                                    <text text="有的时候游戏会发生内存泄露,内存占用持续上升直至爆炸,可能导致脚本进程也被杀死。这种情况下,设置假死检测、打断官方自动续战可能都没用,于是就不得不设置这个万不得已的选项。一般设为1小时(3600秒)左右。" textColor="#000000" />
                                </vertical>
                                <vertical id="DefaultCrashRestartExtraSettings3" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                    <Switch id="rootForceStop" w="*" margin="0 3" checked="false" textColor="#000000" text="优先使用root或adb权限杀进程" />
                                    <text text="部分模拟器等环境下,没有root或adb(Shizuku)权限可能无法杀死进程。真机则一般可以把游戏先切到后台(然后一般就暂停运行了)再杀死。如果你无法获取root或adb权限,而且先切到后台再杀进程这个办法奏效,就可以关掉这个选项。" textColor="#000000" />
                                </vertical>
                            </vertical>
                        </vertical>
                        <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                            <text text="镜层周回脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                            <vertical padding="10 6 0 6" w="*" h="auto">
                                <vertical padding="0 8 0 6" w="*" h="auto">
                                    <Switch id="toggleMirrorsExtraSettings" w="*" margin="0 3" checked="false" textColor="#666666" text="显示更多选项" />
                                </vertical>
                                <vertical id="MirrorsExtraSettings1" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                    <Switch id="smartMirrorsPick" w="*" margin="0 3" checked="true" textColor="#000000" text="智能挑选最弱对手" />
                                    <text text="开启此项后会先找总战力低于我方六分之一的弱队,如果找不到就挨个点开队伍详情计算平均战力,从而找到最弱对手。如果碰到问题可以关闭这个选项,然后就只会挑选第3个对手" textColor="#000000" />
                                </vertical>
                                <vertical id="MirrorsExtraSettings2" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                    <Switch id="useCVAutoBattle" w="*" margin="0 3" checked="true" textColor="#000000" text="在周回中使用识图自动战斗" />
                                    <text text="开启此项,可以通过截屏识图自动完成连携。关闭此项,则镜层周回使用简单无脑点第1/2/3个盘来自动完成战斗" textColor="#000000" />
                                </vertical>
                            </vertical>
                        </vertical>
                        <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                            <text text="识图自动战斗(自动点击行动盘(识图,连携))脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                            <vertical padding="10 6 0 6" w="*" h="auto">
                                <vertical padding="0 8 0 6" w="*" h="auto">
                                    <Switch id="toggleCVAutoBattleExtraSettings" w="*" margin="0 3" checked="false" textColor="#666666" text="显示更多选项" />
                                </vertical>
                                <vertical id="CVAutoBattleExtraSettings1" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                    <Switch id="rootScreencap" w="*" margin="0 3" checked="false" textColor="#000000" text="使用root或adb权限截屏" />
                                    <text text="部分环境下截屏权限会在一段时间后丢失,或者出现截屏后处理数据时报错崩溃的问题。这些情况下可以开启这个选项,但开启后截图效率会下降" textColor="#000000" />
                                    <text text="注意!超级用户授权通知会遮挡屏幕、干扰截屏识图,所以务必要关掉这个通知(对模拟器来说,一般可以在系统设置里找到超级用户设置)。也可以改用不会弹出通知的Shizuku来授权" textColor="#FF0000" />
                                </vertical>
                                <vertical id="CVAutoBattleExtraSettings2" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                    <Switch id="CVAutoBattleDebug" w="*" margin="0 3" checked="false" textColor="#000000" text="识图自动战斗启用调试模式" />
                                    <text text="开启后,识图自动战斗将不会点击行动盘,只会在保存一些图片后结束运行,以方便排查bug" textColor="#000000" />
                                </vertical>
                                <vertical id="CVAutoBattleExtraSettings3" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                    <Switch id="CVAutoBattleClickAllSkills" w="*" margin="0 3" checked="true" textColor="#000000" text="使用主动技能" />
                                    <text text="开启后,从第3回合开始,会放出所有可用的主动技能。如果遇到问题可以关闭" textColor="#000000" />
                                </vertical>
                            </vertical>
                        </vertical>
                        <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                            <text text="副本/活动周回2(备用可选)脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                            <vertical padding="10 6 0 6" w="*" h="auto">
                                <text text="活动周回关卡选择:" textColor="#000000" margin="0 5" />
                                <radiogroup id="battleNo" padding="10 3 0 3">
                                    <radio id="cb1" text="初级" />
                                    <radio id="cb2" text="中级" />
                                    <radio id="cb3" text="高级" checked="true" />
                                </radiogroup>
                                <linear margin="0 3">
                                    <text text="助战x，y坐标自定义:" textColor="#000000" layout_gravity="center_vertical" />
                                    <input maxLength="4" id="helpx" text="" hint="横坐标" textSize="14" inputType="number|none" />
                                    <input maxLength="4" id="helpy" text="" hint="纵坐标" textSize="14" inputType="number|none" />
                                </linear>
                            </vertical>
                        </vertical>
                        <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                            <text text="关于" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                            <linear padding="10 6" bg="#ffffff">
                                <text id="versionMsg" layout_weight="1" w="*" gravity="center" color="#666666" text="尝试获取最新版本信息" />
                            </linear>
                            <linear padding="10 6" bg="#ffffff">
                                <text id="" layout_weight="1" color="#666666" text="版权声明，本app仅供娱乐学习使用，且永久免费，不可进行出售盈利。作者bilibili 虹之宝玉  群号：453053507" />
                            </linear>
                        </vertical>
                    </vertical>
                </ScrollView>
            </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>
        </relative>
    );

    function getTintDrawable(name, tint) {
        var id = context.getResources().getIdentifier(name, "drawable", context.getPackageName());
        var raw = AppCompatResources.getDrawable(context, id);
        var wrapped = DrawableCompat.wrap(raw);
        DrawableCompat.setTint(wrapped, tint);
        return wrapped
    }

    ui.emitter.on("create_options_menu", menu => {
        //在菜单内显示图标
        let menuClass = menu.getClass();
        if(menuClass.getSimpleName().equals("MenuBuilder")){
            try {
                let m = menuClass.getDeclaredMethod("setOptionalIconsVisible", java.lang.Boolean.TYPE);
                m.setAccessible(true);
                m.invoke(menu, true);
            } catch(e){
                log(e);
            }
        }
        //SHOW_AS_ACTION_IF_ROOM在竖屏下不会显示文字,所以不设置
        let item = menu.add("报告问题");
        item.setIcon(getTintDrawable("ic_report_black_48dp", colors.WHITE));
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
        item = menu.add("查看日志");
        item.setIcon(getTintDrawable("ic_assignment_black_48dp", colors.WHITE));
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
        item = menu.add("魔纪百科");
        item.setIcon(getTintDrawable("ic_book_black_48dp", colors.WHITE));
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
        item = menu.add("模拟抽卡");
        item.setIcon(getTintDrawable("ic_store_black_48dp", colors.WHITE));
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
    });

    activity.setSupportActionBar(ui.toolbar);

    ui.emitter.on("options_item_selected", (e, item) => {
        switch (item.getTitle()) {
            case "报告问题":
                if (reportTask && reportTask.isAlive()) {
                    toastLog("已经在上传了,请稍后再试");
                } else {
                    reportTask = threads.start(reportBug);
                }
                break;
            case "查看日志":
                app.startActivity("console");
                break;
            case "魔纪百科":
                app.openUrl("https://magireco.moe/");
                break;
            case "模拟抽卡":
                app.openUrl("https://rika.ren/~kuro/workspace/playground/");
                break;
        }
        e.consumed = true;
    });

    //检测AutoJS引擎版本

    //经测试发现app.autojs.versionName不能用
    //以下数值通过实际运行一遍代码取得，取自Pro 8.8.13-0
    const lowestVersionCode = 8081200;

    function detectAutoJSVersion() {
        ui.run(function() {
            let currentVersionCode = NaN;
            try {
                currentVersionCode = parseInt(app.autojs.versionCode);
            } catch (e) {
                currentVersionCode = NaN;
            }
            if (isNaN(currentVersionCode)) {
                ui.autojs_ver_text.setText("无法检测 AutoJS Pro 引擎版本\n继续使用可能碰到问题\n推荐下载最新apk安装包进行更新");
                ui.autojs_ver_vertical.setVisibility(View.VISIBLE);
                return;
            }
            if (currentVersionCode < lowestVersionCode) {
                ui.autojs_ver_text.setText("AutoJS Pro 引擎版本过低\n当前版本versionCode=["+currentVersionCode+"]\n最低要求versionCode=["+lowestVersionCode+"]\n继续使用可能碰到问题\n推荐下载最新apk安装包进行更新");
                ui.autojs_ver_vertical.setVisibility(View.VISIBLE);
                return;
            }
        });
    }
    detectAutoJSVersion();

    //无障碍开关监控
    ui.autoService.setOnCheckedChangeListener(function (widget, checked) {
        let result = toggleAutoService(checked);
        ui.autoService.setChecked(result);
    });
    ui.showExperimentalFixes.setOnCheckedChangeListener(function (widget, checked) {
        ui.experimentalFixes.setVisibility(checked?View.VISIBLE:View.GONE);
    });
    //前台服务
    $settings.setEnabled('foreground_service', $settings.isEnabled('foreground_service')); //修正刚安装好后返回错误的数值，点进设置再出来又变成正确的数值的问题
    ui.foreground.setChecked($settings.isEnabled('foreground_service'));
    ui.foreground.setOnCheckedChangeListener(function (widget, checked) {
        $settings.setEnabled('foreground_service', checked);
    });
    //按音量上键完全退出脚本
    $settings.setEnabled('stop_all_on_volume_up', $settings.isEnabled('stop_all_on_volume_up')); //修正刚安装好后返回错误的数值，点进设置再出来又变成正确的数值的问题
    ui.stopOnVolUp.setChecked($settings.isEnabled('stop_all_on_volume_up'));
    ui.stopOnVolUp.setOnCheckedChangeListener(function (widget, checked) {
        $settings.setEnabled('stop_all_on_volume_up', checked);
    });

    //显示更多选项
    function setToggleListener(key) {
        ui["toggle"+key+"ExtraSettings"].setOnCheckedChangeListener(function (widget, checked) {
            for (let i=1; ui[key+"ExtraSettings"+i] != null; i++) {
                ui[key+"ExtraSettings"+i].setVisibility(checked?View.VISIBLE:View.GONE);
            }
        });
    }
    for (let key of ["Default", "DefaultCrashRestart", "Mirrors", "CVAutoBattle"]) {
        setToggleListener(key);
    }

    //回到本界面时，resume事件会被触发
    ui.emitter.on("resume", () => {
        // 此时根据无障碍服务的开启情况，同步开关的状态
        ui.autoService.checked = auto.service != null;
        if (!floatIsActive) {
            floatUI.main()
            floatIsActive = true;
        }
        if ($settings.isEnabled('foreground_service') != ui.foreground.isChecked())
            ui.foreground.setChecked($settings.isEnabled('foreground_service'));
        if ($settings.isEnabled('stop_all_on_volume_up') != ui.stopOnVolUp.isChecked())
            ui.stopOnVolUp.setChecked($settings.isEnabled('stop_all_on_volume_up'));
    });

    //监听刷新事件
    ui.swipe.setOnRefreshListener({
        onRefresh: function () {
            //为了看效果延迟一下
            toUpdate()
            ui.swipe.setRefreshing(false);
        },
    });
    //-----------------自定义逻辑-------------------------------------------
    var storage = storages.create("auto_mr");
    const persistParamList = [
        "foreground",
        "stopOnVolUp",
        "exitOnServiceSettings",
        "default",
        "autoReconnect",
        "justNPC",
        "helpx",
        "helpy",
        "battleNo",
        "useAuto",
        "autoFollow",
        "breakAutoCycleDuration",
        "forceStopTimeout",
        "periodicallyKillTimeout",
        "timeout",
        "rootForceStop",
        "rootScreencap",
        "smartMirrorsPick",
        "useCVAutoBattle",
        "CVAutoBattleDebug",
        "CVAutoBattleClickAllSkills",
    ];
    const tempParamList = [
        "drug1",
        "drug2",
        "drug3",
        "drug4",
        "drug1num",
        "drug2num",
        "drug3num",
        "drug4num",
        "apmul",
    ];

    var idmap = {};
    var field = (new Ids()).getClass().getDeclaredField("ids");
    field.setAccessible(true);
    var iter = field.get(null).keySet().iterator();
    while (iter.hasNext()) {
        let item = iter.next();
        idmap[Ids.getId(item)] = item;
    }

    function syncValue(key, value) {
        switch (ui[key].getClass().getSimpleName()) {
            // input
            case "JsEditText":
                if (value !== undefined)
                    ui[key].setText(value)
                return ui[key].getText() + ""
            case "Switch":
            case "CheckBox":
                if (value !== undefined)
                    ui[key].setChecked(value)
                return ui[key].isChecked()
            case "JsSpinner":
                if (value !== undefined && ui[key].getCount() > value)
                    ui[key].setSelection(value, true)
                return ui[key].getSelectedItemPosition()
            case "RadioGroup": {
                if (value !== undefined && ui[value])
                    ui[value].setChecked(true)
                let name = "";
                let id = ui[key].getCheckedRadioButtonId();
                if (id >= 0)
                    name = idmap[ui[key].getCheckedRadioButtonId()]
                return name
            }

        }
    }

    function saveParamIfPersist(key, value) {
        for (let paramName of persistParamList) {
            if (paramName === key) {
                log("保存参数：", key, value);
                storage.put(key, value);
            }
        }
    }

    function setOnChangeListener(key) {
        switch (ui[key].getClass().getSimpleName()) {
            case "JsEditText":
                ui[key].addTextChangedListener(
                new android.text.TextWatcher({
                afterTextChanged: function (s) {
                    let value = ""+s;
                    saveParamIfPersist(key, value); //直接用s作为参数会崩溃
                    floatUI.adjust(key, value);
                }
                })
                );
                break;
            case "CheckBox":
            case "Switch":
                ui[key].setOnCheckedChangeListener(
                function (widget, checked) {
                    for (let i=1; ui[key+"Text"+i]!=null; i++) {
                        ui[key+"Text"+i].setVisibility(checked?View.VISIBLE:View.GONE);
                    }
                    saveParamIfPersist(key, checked);
                    floatUI.adjust(key, checked);
                }
                );
                break;
            case "JsSpinner":
                ui[key].setOnItemSelectedListener(
                new android.widget.AdapterView.OnItemSelectedListener({
                onItemSelected: function (spinnerparent, spinnerview, spinnerposition, spinnerid) {
                    saveParamIfPersist(key, spinnerposition);
                    floatUI.adjust(key, spinnerposition);
                }
                })
                );
                break;
            case "RadioGroup":
                ui[key].setOnCheckedChangeListener(
                new android.widget.RadioGroup.OnCheckedChangeListener({
                onCheckedChanged: function (group, checkedId) {
                    let name = idmap[checkedId];
                    if (name) {
                        saveParamIfPersist(key, name);
                        floatUI.adjust(key, name);
                    }
                }
                })
                );
                break;
        }
    }

    //限制timeout的取值
    ui["timeout"].addTextChangedListener(
    new android.text.TextWatcher({
    afterTextChanged: function (s) {
        let str = ""+s;
        let value = parseInt(str);
        if (isNaN(value) || value < 100) {
            s.replace(0, str.length, "5000");
        }
    }
    })
    );

    for (let key of persistParamList) {
        if (key == "foreground") continue;
        if (key == "stopOnVolUp") continue;
        let value = storage.get(key);
        setOnChangeListener(key); //先设置listener
        syncValue(key, value);    //如果储存了超出取值范围之外的数据则会被listener重置
    }

    function setDrugCheckboxListener(drugname) {
        ui[drugname].setOnCheckedChangeListener(function (widget, checked) {
            saveParamIfPersist(drugname, checked);
            floatUI.adjust(drugname, checked);
            if (checked) {
                ui[drugname+"num"].setEnabled(true);
                ui[drugname+"num"].setText("");
            } else {
                ui[drugname+"num"].setText("0");
                ui[drugname+"num"].setEnabled(false);
            }
        });
    }

    for (let key of tempParamList) {
        if (key.match(/^drug\d+$/)) {
            setDrugCheckboxListener(key);
            ui[key+"num"].setEnabled(false);
        } else {
            setOnChangeListener(key);
        }
    }

    //传递当前版本号给floatUI
    floatUI.adjust("version", version);

    //限制apmul取值
    //digits="01234"貌似不起效，没办法，只能手动实现
    ui["apmul"].setKeyListener(new android.text.method.NumberKeyListener({
    getInputType: function() {
        return android.text.InputType.TYPE_MASK_VARIATION;
    },
    getAcceptedChars: function () {
        return ['0', '1', '2', '3', '4'];
    }
    }));

    //切换到新版设置界面按钮点击事件
    ui["switch_ui_button"].setOnClickListener(new android.view.View.OnClickListener({
        onClick: function (view) {
            switchSettingsUI("webview");
        }
    }));

    //返回游戏并继续运行脚本按钮点击事件
    ui["task_paused_button"].setOnClickListener(new android.view.View.OnClickListener({
        onClick: function (view) {
            floatUI.backToGame();
        }
    }));

    //版本获取
    var refreshUpdateStatus = sync(function () {
        http.__okhttp__.setTimeout(5000);
        try {
            let res = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle@latest/project.json");
            if (res.statusCode != 200) {
                log("请求失败: " + res.statusCode + " " + res.statusMessage);
                ui.run(function () {
                    ui.versionMsg.setText("获取失败")
                    ui.versionMsg.setTextColor(colors.parseColor("#666666"))
                })
            } else {
                let resJson = res.body.json();
                if (parseInt(resJson.versionName.split(".").join("")) <= parseInt(version.split(".").join(""))) {
                    ui.run(function () {
                        ui.versionMsg.setText("当前无需更新")
                        ui.versionMsg.setTextColor(colors.parseColor("#666666"))
                    });
                } else {
                    ui.run(function () {
                        ui.versionMsg.setText("最新版本为" + resJson.versionName + ",下拉进行更新")
                        ui.versionMsg.setTextColor(colors.RED)
                    });
                }
            }
        } catch (e) {
            ui.run(function () {
                ui.versionMsg.setText("请求超时")
                ui.versionMsg.setTextColor(colors.parseColor("#666666"))
            })
        }
    });
    threads.start(function () {refreshUpdateStatus();});

    //版本更新
    function toUpdate() {
        try {
            let res = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle@latest/project.json");
            if (res.statusCode != 200) {
                toastLog("请求超时")
            } else {
                let resJson = res.body.json();
                if (parseInt(resJson.versionName.split(".").join("")) <= parseInt(version.split(".").join(""))) {
                    toastLog("无需更新")
                } else {
                    let main_script = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle@"+resJson.versionName+"/main.js");
                    let float_script = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle@"+resJson.versionName+"/floatUI.js");
                    if (main_script.statusCode == 200 && float_script.statusCode == 200) {
                        toastLog("更新加载中");
                        let mainjs = main_script.body.string();
                        let floatjs = float_script.body.string();
                        files.write(engines.myEngine().cwd() + "/main.js", mainjs)
                        files.write(engines.myEngine().cwd() + "/floatUI.js", floatjs)
                        events.on("exit", function () {
                            //通过execScriptFile好像会有问题，比如点击悬浮窗QB=>齿轮然后就出现两个QB
                            //engines.execScriptFile(engines.myEngine().cwd() + "/main.js")
                            app.launch(context.getPackageName())
                            toast("更新完毕")
                        })
                        engines.stopAll()
                    } else {
                        toast("脚本获取失败！这可能是您的网络原因造成的，建议您检查网络后再重新运行软件吧\nHTTP状态码:" + main_script.statusMessage, "," + float_script.statusMessage);
                    }
                }
            }

        } catch (error) {
            toastLog("请求超时，可再一次尝试")
        }
    }
}
//改变参数时instantToast反馈
floatUI.enableToastParamChanges();