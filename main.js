"ui";
importClass(android.view.View)
importClass(android.graphics.Color)
importClass(android.view.MenuItem)
importClass(com.stardust.autojs.project.ProjectConfig)
importClass(com.stardust.autojs.core.ui.inflater.util.Ids)
importClass(Packages.androidx.core.graphics.drawable.DrawableCompat)
importClass(Packages.androidx.appcompat.content.res.AppCompatResources)

var Name = "AutoBattle";
var version = "4.0.0";
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

ui.statusBarColor("#FF4FB3FF")
ui.layout(
    <relative id="container">
        <appbar id="appbar" w="*">
            <toolbar id="toolbar" bg="#ff4fb3ff" title="{{appName}}" />
        </appbar>
        <androidx.swiperefreshlayout.widget.SwipeRefreshLayout id="swipe" layout_below="appbar" layout_above="start">
            <ScrollView id="content">
                <vertical gravity="center" layout_weight="1">

                    <vertical margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                        <Switch id="autoService" margin="0 3" w="*" checked="{{auto.service != null}}" textColor="#666666" text="无障碍服务" />
                        <Switch id="foreground" margin="0 3" w="*" textColor="#000000" text="前台服务（常被鲨进程可以开启，按需）" />
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
                                <linear>
                                    <text text="每隔" textColor="#000000" />
                                    <input maxLength="5" id="breakAutoCycleDuration" hint="留空即不打断" text="" textSize="14" inputType="number|none" />
                                    <text text="秒打断官方自动续战" textColor="#000000" />
                                </linear>
                                <text text="经过设定的秒数后,长按打断官方自动周回" textColor="#000000" />
                            </vertical>
                            <vertical padding="0 8 0 0" w="*" h="auto">
                                <linear>
                                    <text text="假死检测超时" textColor="#000000" />
                                    <input maxLength="5" id="forceStopTimeout" hint="留空即不强关重开" text="" textSize="14" inputType="number|none" />
                                    <text text="秒" textColor="#000000" />
                                </linear>
                                <text text="如果停留在一个状态超过设定的秒数,就认为游戏已经假死,然后杀进程重开" textColor="#000000" />
                            </vertical>
                            <vertical padding="0 8 0 0" w="*" h="auto">
                                <linear padding="0 0 0 0" w="*" h="auto">
                                    <text text="等待控件超时" textColor="#000000" />
                                    <input maxLength="6" margin="5 0 0 0" id="timeout" hint="5000" text="5000" textSize="14" inputType="number|none" />
                                    <text text="毫秒" textColor="#000000" />
                                </linear>
                                <text text="修改“等待控件超时”并不能让脚本变快,数值太小反而可能出错。如果不是机器特别卡(这种情况也要把这个值改得更大,而不是更小)请不要改,退格可自动恢复默认(5000毫秒)" textColor="#000000" />
                            </vertical>
                            <vertical padding="0 8 0 6" w="*" h="auto">
                                <Switch id="rootForceStop" w="*" margin="0 3" checked="false" textColor="#000000" text="优先使用root或adb权限杀进程" />
                                <text text="部分模拟器等环境下,没有root或adb(Shizuku)权限可能无法杀死进程。真机则一般可以把游戏先切到后台(然后一般就暂停运行了)再杀死。如果你无法获取root或adb权限,而且先切到后台再杀进程这个办法奏效,就可以关掉这个选项。" textColor="#000000" />
                            </vertical>
                        </vertical>
                    </vertical>
                    <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                        <text text="备用脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
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
        return filename.match(/^\d+-\d+-\d+_\d+-\d+-\d+\.xml$/) && files.isFile(files.join(snapshotDir, filename));
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
            app.startActivity("console")
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

activity.setSupportActionBar(ui.toolbar);

function getTintDrawable(name, tint) {
    var id = context.getResources().getIdentifier(name, "drawable", context.getPackageName());
    var raw = AppCompatResources.getDrawable(context, id);
    var wrapped = DrawableCompat.wrap(raw);
    DrawableCompat.setTint(wrapped, tint);
    return wrapped
}

//无障碍开关监控
ui.autoService.setOnCheckedChangeListener(function (widget, checked) {
    if (checked && !auto.service) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    }
    if (!checked && auto.service) {
        if (device.sdkInt >= 24) {
            auto.service.disableSelf();
        } else {
            toastLog("Android 6.0或以下请到系统设置里关闭无障碍服务");
        }
    }
    ui.autoService.setChecked(auto.service != null)
});
//前台服务
ui.foreground.setChecked($settings.isEnabled('foreground_service'));
ui.foreground.setOnCheckedChangeListener(function (widget, checked) {
    $settings.setEnabled('foreground_service', checked);
});

//回到本界面时，resume事件会被触发
ui.emitter.on("resume", () => {
    // 此时根据无障碍服务的开启情况，同步开关的状态
    ui.autoService.checked = auto.service != null;
    if (!floatIsActive) {
        floatUI.main()
        floatIsActive = true;
    }
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

var floatIsActive = false;
// 悬浮窗权限检查
if (!$floaty.checkPermission()) {
    toastLog("没有悬浮窗权限\n申请中...");
    let failed = false;
    //这里的调用都不阻塞
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

var storage = storages.create("auto_mr");
const persistParamList = ["foreground", "default", "autoReconnect", "justNPC", "helpx", "helpy", "battleNo", "useAuto", "breakAutoCycleDuration", "forceStopTimeout", "timeout", "rootForceStop"]
const tempParamList = ["drug1", "drug2", "drug3", "drug4", "drug1num", "drug2num", "drug3num", "drug4num", "apmul"]

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
        case "Switch":
        case "CheckBox":
            ui[key].setOnCheckedChangeListener(
            function (widget, checked) {
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
    let value = storage.get(key);
    setOnChangeListener(key); //先设置listener
    syncValue(key, value);    //如果储存了超出取值范围之外的数据则会被listener重置
}

//绿药或红药，每次消耗1个
//魔法石，每次碎5钻
const drugCosts = [1, 1, 5, 1];

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

//版本获取
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

//版本更新
function toUpdate() {
    try {
        let res = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle/project.json");
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
