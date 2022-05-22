var floatUI = {}

//缓解报毒问题
function deObStr(s) {
    return s.replace(/cwvqlu/gi, ss => ss.split("").map(c => String.fromCharCode(c.charCodeAt(0)-2)).join(""));
}

//悬浮窗logo
importClass(java.lang.Runnable);
importClass(android.animation.ObjectAnimator)
importClass(android.animation.PropertyValuesHolder)
importClass(android.animation.ValueAnimator)
importClass(android.animation.AnimatorSet)
importClass(android.view.animation.AccelerateInterpolator)
importClass(android.view.animation.TranslateAnimation)
importClass(android.animation.ObjectAnimator)
importClass(android.animation.TimeInterpolator)
importClass(android.os.Bundle)
importClass(android.view.View)
importClass(android.view.Window)
importClass(android.view.Gravity)
importClass(android.graphics.Point)
importClass(android.content.IntentFilter)
importClass(android.content.Intent)

importClass(android.view.animation.AccelerateDecelerateInterpolator)
importClass(android.view.animation.AccelerateInterpolator)
importClass(android.view.animation.AnticipateInterpolator)
importClass(android.view.animation.AnticipateOvershootInterpolator)
importClass(android.view.animation.BounceInterpolator)
importClass(android.view.animation.CycleInterpolator)
importClass(android.view.animation.DecelerateInterpolator)
importClass(android.view.animation.LinearInterpolator)
importClass(android.view.animation.OvershootInterpolator)
importClass(android.view.animation.PathInterpolator)
importClass(android.widget.Button)
importClass(android.widget.ImageView)
importClass(android.widget.TextView)

// 捕获异常时打log记录详细的调用栈
//（不能先声明为空函数再赋值，否则不会正常工作）
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var enableAutoService = () => {};

var origFunc = {
    click: function () {return click.apply(this, arguments)},
    swipe: function () {return swipe.apply(this, arguments)},
    press: function () {return press.apply(this, arguments)},
    buildDialog: function() {return dialogs.build.apply(this, arguments)},
}

//注意:这个函数只会返回打包时的版本，而不是在线更新后的版本！
function getProjectVersion() {
    var conf = ProjectConfig.Companion.fromProjectDir(engines.myEngine().cwd());
    if (conf) return conf.versionName;
}

//sync锁的是this对象，于是A函数锁定后B函数得等A函数返回
//这个syncer就不会让B函数等待A函数返回
//必须是syncer.syn(func)这样调用
var syncer = {
    lockers: [],
    renewLockerIfDead: sync(function (locker, renewLock, renewThread, force) {
        if (force || locker.thread == null || !locker.thread.isAlive()) {
            if (renewLock) locker.lock = threads.lock();
            if (renewThread) locker.thread = threads.currentThread();
        }
    }),
    syn: function (func) {
        let currentLocker = {lock: threads.lock(), thread: null};
        this.lockers.push(currentLocker);
        let syncerobj = this;
        return function () {
            let ret = undefined;
            try {
                while (!currentLocker.lock.tryLock(1000, java.util.concurrent.TimeUnit.MILLISECONDS)) {
                    syncerobj.renewLockerIfDead(currentLocker, true, true, false);
                }
                syncerobj.renewLockerIfDead(currentLocker, false, true, true);
                ret = func.apply(this, arguments);
            } finally {
                while (currentLocker.lock.getHoldCount() > 0) currentLocker.lock.unlock();
            }
            return ret;
        }
    }
}

// 为了解决报毒问题，CwvqLU Pro V9 内测版 9.0.11-0 混淆了类名和activity名
var lowestObVerCode = 9101100;
var splashActivityName = deObStr("com.stardust.cwvqlu.inrt.SplashActivity");
if (parseInt(app[deObStr("cwvqlu")].versionCode) >= lowestObVerCode) {
    splashActivityName = context.getPackageName()+".SplashActivity";
}

function restartApp() {
    //重启本app，但因为进程没退出，所以无障碍服务应该还能保持启用；缺点是每重启一次貌似都会泄漏一点内存
    events.on("exit", function () {
        app.launch(context.getPackageName());
        toast("app已重启");
    });
    engines.stopAll();
}

//记录当前版本是否测试过助战的文件(已经去掉，留下注释)
//var supportPickingTestRecordPath = files.join(engines.myEngine().cwd(), "support_picking_tested");

//停止shell脚本监工(在algo_init中初始化)
var stopFatalKillerShellScript = () => {};
var stopFatalKillerShellScriptThread = null;
var tasks = algo_init();
// touch capture, will be initialized in main
var capture = () => { };
// 停止脚本线程，尤其是防止停止自己的时候仍然继续往下执行少许语句（同上，会在main函数中初始化）
var stopThread = () => { };
// （不）使用Shizuku/root执行shell命令
var shizukuShell = () => { };
var rootShell = () => { };
var privShell = () => { };
var normalShell = () => { };
// 检查root或adb权限
var getEUID = () => { };
var requestShellPrivilege = () => { };
var requestShellPrivilegeThread = null;
// 嗑药数量限制和统计
//绿药或红药，每次消耗1个
//魔法石，每次碎5钻
const drugCosts = [1, 1, 5, 1, 1];
var updateDrugLimit = () => { };
var updateDrugConsumingStats = () => { };
var isDrugEnabled = () => { };
var isDrugEnough = () => { };
// 周回数统计
var updateCycleCount = () => { };

floatUI.storage = null;

floatUI.floatyHangWorkaroundLock = threads.lock();

// available script list
floatUI.scripts = [
    {
        name: "副本周回(剧情/活动通用)",
        fn: tasks.default,
    },
    {
        name: "镜层周回",
        fn: tasks.mirrors,
    },
    {
        name: "自动点击行动盘(识图,连携)",
        fn: tasks.CVAutoBattle,
    },
    {
        name: "自动点击行动盘(无脑123盘)",
        fn: tasks.simpleAutoBattle,
    },
    {
        name: "理子活动脚本",
        fn: tasks.dungeonEvent,
    },
    {
        name: "录制闪退重开选关动作",
        fn: tasks.recordSteps,
    },
    {
        name: "重放选关动作",
        fn: tasks.replaySteps,
    },
    {
        name: "导入动作录制数据",
        fn: tasks.importSteps,
    },
    {
        name: "导出动作录制数据",
        fn: tasks.exportSteps,
    },
    {
        name: "清除动作录制数据",
        fn: tasks.clearSteps,
    },
    {
        name: "文字抓取",
        fn: tasks.captureText,
    },
    {
        name: "测试助战自动选择",
        fn: tasks.testSupportSel,
    },
    {
        name: "测试闪退自动重开",
        fn: tasks.testReLaunch,
    },
    {
        name: "通用副本周回v3.6.0(备用)",
        fn: tasks.default3_6_0,
    },
    {
        name: "副本周回2(备用可选)",
        fn: autoMain,
    },
    {
        name: "活动周回2(备用可选)",
        fn: autoMainver1,
    },
    {
        name: "镜层周回2(备用,无脑123盘)",
        fn: jingMain,
    },
    {
        name: "活动周回,自动重开(备用)",
        fn: tasks.reopen,
    }
];

floatUI.presetOpLists = [
    {
        name: "不使用预设数据",
        content: null,
    },
    {
        name: "国服主线2-1-4普通本(水波祭)",
        content: "{\"package_name\":\"com.bilibili.madoka.bilibili\",\"date\":\"2021-9-3_"
            +"11-1-1\",\"isGeneric\":true,\"defaultSleepTime\":1500,\"isEventTypeBRA"
            +"NCH\":false,\"steps\":[{\"action\":\"click\",\"click\":{\"point\":{\"x\":1563"
            +",\"y\":845,\"pos\":\"bottom\"}}},{\"action\":\"sleep\",\"sleep\":{\"sleepTime"
            +"\":3000}},{\"action\":\"swipe\",\"swipe\":{\"points\":[{\"x\":1338,\"y\":823,"
            +"\"pos\":\"center\"},{\"x\":1350,\"y\":182,\"pos\":\"center\"}],\"duration\":20"
            +"00}},{\"action\":\"swipe\",\"swipe\":{\"points\":[{\"x\":1338,\"y\":823,\"pos"
            +"\":\"center\"},{\"x\":1350,\"y\":182,\"pos\":\"center\"}],\"duration\":2000}}"
            +",{\"action\":\"swipe\",\"swipe\":{\"points\":[{\"x\":1338,\"y\":823,\"pos\":\"c"
            +"enter\"},{\"x\":1350,\"y\":182,\"pos\":\"center\"}],\"duration\":2000}},{\"a"
            +"ction\":\"swipe\",\"swipe\":{\"points\":[{\"x\":1338,\"y\":823,\"pos\":\"cente"
            +"r\"},{\"x\":1350,\"y\":182,\"pos\":\"center\"}],\"duration\":2000}},{\"actio"
            +"n\":\"click\",\"click\":{\"point\":{\"x\":1160,\"y\":201,\"pos\":\"center\"}}},"
            +"{\"action\":\"swipe\",\"swipe\":{\"points\":[{\"x\":1159,\"y\":820,\"pos\":\"ce"
            +"nter\"},{\"x\":1170,\"y\":206,\"pos\":\"center\"}],\"duration\":2000}},{\"ac"
            +"tion\":\"swipe\",\"swipe\":{\"points\":[{\"x\":1152,\"y\":843,\"pos\":\"center"
            +"\"},{\"x\":1131,\"y\":218,\"pos\":\"center\"}],\"duration\":2000}},{\"action"
            +"\":\"click\",\"click\":{\"point\":{\"x\":1122,\"y\":190,\"pos\":\"center\"}}},{"
            +"\"action\":\"sleep\",\"sleep\":{\"sleepTime\":3000}},{\"action\":\"click\",\""
            +"click\":{\"point\":{\"x\":1193,\"y\":570,\"pos\":\"top\"}}},{\"action\":\"slee"
            +"p\",\"sleep\":{\"sleepTime\":3000}},{\"action\":\"checkText\",\"checkText\""
            +":{\"text\":\"BATTLE 4\",\"boundsCenter\":{\"x\":304,\"y\":514,\"pos\":\"top\"}"
            +",\"found\":{\"kill\":false,\"stopScript\":false,\"nextAction\":\"ignore\"}"
            +",\"notFound\":{\"kill\":true,\"stopScript\":false,\"nextAction\":\"fail\"}"
            +"}},{\"action\":\"checkText\",\"checkText\":{\"text\":\"第2章\",\"boundsCenter"
            +"\":{\"x\":305,\"y\":250,\"pos\":\"top\"},\"found\":{\"kill\":false,\"stopScrip"
            +"t\":false,\"nextAction\":\"ignore\"},\"notFound\":{\"kill\":true,\"stopScr"
            +"ipt\":false,\"nextAction\":\"fail\"}}},{\"action\":\"checkText\",\"checkTe"
            +"xt\":{\"text\":\"1话\",\"boundsCenter\":{\"x\":303,\"y\":296,\"pos\":\"top\"},\"f"
            +"ound\":{\"kill\":false,\"stopScript\":false,\"nextAction\":\"success\"},\""
            +"notFound\":{\"kill\":true,\"stopScript\":false,\"nextAction\":\"fail\"}}}"
            +"]}",
    },
    {
        name: "国服门票活动剧情[BATTLE 1]",
        content: "{\"date\":\"2022-2-14_4-12-10\",\"defaultSleepTime\":1500,\"isEventType"
            +"BRANCH\":false,\"isGeneric\":true,\"package_name\":\"com.bilibili.mado"
            +"ka.bilibili\",\"steps\":[{\"action\":\"click\",\"click\":{\"point\":{\"pos\":"
            +"\"bottom\",\"x\":1620,\"y\":549}}},{\"action\":\"sleep\",\"sleep\":{\"sleepTi"
            +"me\":3000}},{\"action\":\"click\",\"click\":{\"point\":{\"pos\":\"top\",\"x\":1"
            +"008,\"y\":182}}},{\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"point"
            +"s\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306"
            +"}]}},{\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\""
            +":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"act"
            +"ion\":\"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\""
            +":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swip"
            +"e\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":"
            +"915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\""
            +":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos"
            +"\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\":{\"duratio"
            +"n\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x"
            +"\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"p"
            +"oints\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\""
            +":306}]}},{\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\""
            +"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{"
            +"\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\""
            +",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\""
            +"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,"
            +"\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"sw"
            +"ipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{"
            +"\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\":{\"dur"
            +"ation\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top"
            +"\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\":{\"duration\":200"
            +"0,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070"
            +",\"y\":306}]}},{\"action\":\"click\",\"click\":{\"point\":{\"pos\":\"bottom\","
            +"\"x\":1092,\"y\":775}}},{\"action\":\"sleep\",\"sleep\":{\"sleepTime\":3000}"
            +"},{\"action\":\"checkText\",\"checkText\":{\"boundsCenter\":{\"pos\":\"top\""
            +",\"x\":305,\"y\":467},\"found\":{\"kill\":false,\"nextAction\":\"ignore\",\"s"
            +"topScript\":false},\"notFound\":{\"kill\":true,\"nextAction\":\"fail\",\"s"
            +"topScript\":false},\"text\":\"剧情副本\"}},{\"action\":\"checkText\",\"checkTe"
            +"xt\":{\"boundsCenter\":{\"pos\":\"top\",\"x\":298,\"y\":515},\"found\":{\"kill"
            +"\":false,\"nextAction\":\"success\",\"stopScript\":false},\"notFound\":{\""
            +"kill\":true,\"nextAction\":\"fail\",\"stopScript\":false},\"text\":\"BATTL"
            +"E 1\"}}]}"
    },
    {
        name: "国服[由比鹤乃篇①]活动剧情",
        content: "{\"date\":\"2022-2-14_4-12-10\",\"defaultSleepTime\":1500,\"isEventType"
            +"BRANCH\":false,\"isGeneric\":true,\"package_name\":\"com.bilibili.mado"
            +"ka.bilibili\",\"steps\":[{\"action\":\"click\",\"click\":{\"point\":{\"pos\":"
            +"\"bottom\",\"x\":1620,\"y\":549}}},{\"action\":\"sleep\",\"sleep\":{\"sleepTi"
            +"me\":3000}},{\"action\":\"click\",\"click\":{\"point\":{\"pos\":\"top\",\"x\":1"
            +"008,\"y\":182}}},{\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"point"
            +"s\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306"
            +"}]}},{\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\""
            +":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"act"
            +"ion\":\"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\""
            +":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swip"
            +"e\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":"
            +"915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\""
            +":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos"
            +"\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\":{\"duratio"
            +"n\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x"
            +"\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"p"
            +"oints\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\""
            +":306}]}},{\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\""
            +"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{"
            +"\"action\":\"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\""
            +",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\""
            +"swipe\",\"swipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,"
            +"\"y\":915},{\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"sw"
            +"ipe\":{\"duration\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{"
            +"\"pos\":\"top\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\":{\"dur"
            +"ation\":2000,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top"
            +"\",\"x\":1070,\"y\":306}]}},{\"action\":\"swipe\",\"swipe\":{\"duration\":200"
            +"0,\"points\":[{\"pos\":\"top\",\"x\":1070,\"y\":915},{\"pos\":\"top\",\"x\":1070"
            +",\"y\":306}]}},{\"action\":\"click\",\"click\":{\"point\":{\"pos\":\"bottom\","
            +"\"x\":1092,\"y\":775}}},{\"action\":\"sleep\",\"sleep\":{\"sleepTime\":3000}"
            +"},{\"action\":\"checkText\",\"checkText\":{\"boundsCenter\":{\"pos\":\"top\""
            +",\"x\":305,\"y\":467},\"found\":{\"kill\":false,\"nextAction\":\"ignore\",\"s"
            +"topScript\":false},\"notFound\":{\"kill\":true,\"nextAction\":\"fail\",\"s"
            +"topScript\":false},\"text\":\"剧情副本\"}},{\"action\":\"checkText\",\"checkTe"
            +"xt\":{\"boundsCenter\":{\"pos\":\"top\",\"x\":298,\"y\":515},\"found\":{\"kill"
            +"\":false,\"nextAction\":\"success\",\"stopScript\":false},\"notFound\":{\""
            +"kill\":true,\"nextAction\":\"fail\",\"stopScript\":false},\"text\":\"由比鹤乃篇"
            +"①\"}}]}",
    },
];

//当前正在运行的线程
var currentTask = null;
var currentTaskName = "未运行任何脚本";
var currentTaskCycles = 0;
var currentTaskDrugConsumed = {};
const TASK_STOPPED = 0;
const TASK_RUNNING = 1;
const TASK_PAUSING = 2;
const TASK_PAUSED = 3;
const TASK_RESUMING = 4;
var isCurrentTaskPaused = threads.atomic(TASK_STOPPED);
//被打开的所有对话框（用于在线程退出时dismiss）
var openedDialogs = {openedDialogCount: 0};
var openedDialogsLock = threads.lock();

//运行脚本时隐藏UI控件，防止误触
floatUI.toolBarMenuItems = [];
floatUI.lockToolbarMenu = function (isLocked) {
    ui.run(() => {
        activity.setSupportActionBar(isLocked?null:ui.toolbar);
        let menu = ui["toolbar"].getMenu();
        menu.close();
        if (isLocked) {
            for (let i=0; i<menu.size(); i++) floatUI.toolBarMenuItems.push(menu.getItem(i));
            menu.clear();
        } else {
            menu.clear();
            while (floatUI.toolBarMenuItems.length > 0) {
                menu.add(floatUI.toolBarMenuItems[0].getTitle())
                    .setIcon(floatUI.toolBarMenuItems[0].getIcon())
                    .setShowAsAction(android.view.MenuItem.SHOW_AS_ACTION_WITH_TEXT);
                floatUI.toolBarMenuItems.splice(0, 1);
            }
        }
    });
}
var lockUI = syncer.syn(function (isLocked) {
    //隐藏或显示设置界面
    updateUI("swipe", "setVisibility", isLocked?View.GONE:View.VISIBLE);
    updateUI("running_stats", "setVisibility", isLocked?View.VISIBLE:View.GONE);

    updateUI("lockToolbarMenu", "lockToolbarMenu", isLocked);
});
function getUIContent(key) {
    switch (ui[key].getClass().getSimpleName()) {
        case "JsEditText":
            return ui[key].getText() + "";
        case "Switch":
        case "CheckBox":
            return ui[key].isChecked()?"已启用":"已停用";
        case "JsSpinner":
            return ui[key].getSelectedItem();
        case "RadioGroup": {
            let name = "";
            let text = "";
            let id = ui[key].getCheckedRadioButtonId();
            if (id >= 0) {
                name = idmap[ui[key].getCheckedRadioButtonId()];
                text = ui[name].getText();
            }
            return text;
        }
    }
}
function setUIContent(key, value) {
    switch (ui[key].getClass().getSimpleName()) {
        case "JsEditText":
            ui[key].setText(value);
            break;
        case "Switch":
        case "CheckBox":
            ui[key].setChecked(value);
            break;
        case "JsSpinner":
            ui[key].setSelection(value);
            break;
        case "RadioGroup":
            if (value !== undefined && ui[value])
                ui[value].setChecked(true);
            break;
        default:
           throw new Error("setUIContent: unknown ui[key].getClass().getSimpleName() return value");
    }
}

//监视当前任务的线程
var monitoredTask = null;

var bypassPopupCheck = threads.atomic(0);

//下面三个变量本来在algo_init闭包内、在startScreenCapture函数之前声明,现在移动到这里
var canCaptureScreen = false;
var requestScreenCaptureSuccess = false;
var hasScreenCaptureError = false;
var syncedReplaceCurrentTask = syncer.syn(function(taskItem, callback) {
    if (currentTask != null && currentTask.isAlive()) {
        stopThread(currentTask);
        isCurrentTaskPaused.set(TASK_STOPPED);
        toastLog("已停止之前的脚本");
    }
    //确保之前的脚本已经停下后新开一个线程执行callback
    if (callback != null) {
        threads.start(callback);
    }
    if (monitoredTask != null && monitoredTask.isAlive()) {
        monitoredTask.join();
    }
    monitoredTask = threads.start(function () {
        if (!limit.doNotToggleForegroundService) {
            $settings.setEnabled("foreground_service", true);
            log("已开启前台服务");
            updateUI("foreground", "setChecked", $settings.isEnabled("foreground_service", false));
        }
        try {
            currentTaskName = taskItem.name;
            currentTask = threads.start(taskItem.fn);
            currentTask.waitFor();
            //由被运行的脚本线程自己执行isCurrentTaskPaused.set(TASK_RUNNING)
            //如果被运行的脚本不（需要）支持暂停，那就不设置TASK_RUNNING
        } catch (e) {logException(e);}
        if (currentTask != null && currentTask.isAlive()) {
            lockUI(true);
            currentTask.join();
            isCurrentTaskPaused.set(TASK_STOPPED);
            lockUI(false);
        }
        //之前可能在STATE_TEAM状态下设置了跳过isGameDead里的掉线弹窗检查,现在恢复成不跳过
        bypassPopupCheck.set(0);
        log("关闭所有无主对话框...");
        try {
            openedDialogsLock.lock();//先加锁，dismiss会等待解锁后再开始删
            for (let key in openedDialogs) {
                if (key != "openedDialogCount") {
                    try {
                        openedDialogs[key].node.dialog.dismiss();
                    } catch (e) {
                        logException(e);
                        delete openedDialogs[key];
                    }
                }
            }
        } catch (e) {
            logException(e);
            throw e;
        } finally {
            openedDialogsLock.unlock();
        }
        //等待dismiss删完，如果不等删完的话，下一次启动的脚本调用对话框又会死锁
        log("等待无主对话框全部清空...");
        while (true) {
            let remaining = 0;
            try {
                openedDialogsLock.lock();
                for (let key in openedDialogs) {
                    if (key != "openedDialogCount") {
                        remaining++;
                    }
                }
            } catch (e) {
                logException(e);
                throw e;
            } finally {
                openedDialogsLock.unlock();
            }
            if (remaining == 0) break;
            sleep(100);
        }
        log("无主对话框已全部清空");
        if (!limit.doNotToggleForegroundService) {
            try {
                $images.stopScreenCapture();
            } catch (e) {
                logException(e);
            }
            try {
                captureScreen();
            } catch (e) {
                //截屏权限确实被停用了
                canCaptureScreen = false;
                requestScreenCaptureSuccess = false;
                hasScreenCaptureError = false;
            }
            $settings.setEnabled("foreground_service", false);
            log("已停止前台服务");
            updateUI("foreground", "setChecked", $settings.isEnabled("foreground_service", false));
        }
        floatUI.storage.remove("last_limit_json");
        //停止shell脚本监工(在参数修改触发adjust函数后就应该已经停止了)
        if (limit.autoRecover) stopFatalKillerShellScript();
    });
    monitoredTask.waitFor();
});
//syncedReplaceCurrentTask函数也需要新开一个线程来执行，
//如果在UI线程直接调用，第二次调用就会卡在monitoredTask.join()这里
function replaceCurrentTask(taskItem, callback) {
    //确保前一个脚本停下后会新开一个线程执行callback
    try {
        threads.start(function () {syncedReplaceCurrentTask(taskItem, callback);}).waitFor();
    } catch (e) {
        logException(e);
    }
}
function replaceSelfCurrentTask(taskItem, callback) {
    replaceCurrentTask(taskItem, callback);
    stopThread();
}

floatUI.main = function () {
    // space between buttons compare to button size
    var space_factor = 1.5;
    // size for icon compare to button size
    var logo_factor = 7.0 / 11;
    // button size in dp
    var button_size = 44;

    // submenu definition
    var menu_list = [
        {
            logo: "@drawable/ic_camera_enhance_black_48dp",
            color: "#009687",
            fn: snapshotWrap,
        },
        {
            logo: "@drawable/ic_more_horiz_black_48dp",
            color: "#ee534f",
            fn: taskWrap,
        },
        {
            logo: "@drawable/ic_play_arrow_black_48dp",
            color: "#40a5f3",
            fn: defaultWrap,
        },
        {
            logo: "@drawable/ic_clear_black_48dp",
            color: "#fbd834",
            fn: cancelWrap,
        },
        {
            logo: "@drawable/ic_settings_black_48dp",
            color: "#bfc1c0",
            fn: settingsWrap,
        },
    ];

    stopThread = function (thread) {
        var isSelf = false;
        if (thread == null) {
            thread = threads.currentThread();
            isSelf = true;
        }
        if (ui.isUiThread()) {
            if (isSelf) {
                log("不能停止UI线程!");
            } else threads.start(function () {
                stopThread(thread);
            });
        } else {
            while (isSelf || (thread != null && thread.isAlive())) {
                try {thread.interrupt();} catch (e) {};
                sleep(200);
            }
        }
    }

    function snapshotWrap() {
        if (auto.root == null) {
            log("auto.root == null");
            toastLog("快照失败,无障碍服务是否开启?");
            return;
        }
        toastLog("开始快照");
        try {
            var text = recordElement(auto.root, 0, "");
        } catch (e) {
            toastLog("快照出错");
            logException(e);
            return;
        }

        var d = new Date();
        var timestamp =
            "" +
            d.getFullYear() +
            "-" +
            (d.getMonth() + 1) +
            "-" +
            d.getDate() +
            "_" +
            d.getHours() +
            "-" +
            d.getMinutes() +
            "-" +
            d.getSeconds();
        var path = files.getSdcardPath();
        path = files.join(path, "auto_magireco");
        path = files.join(path, timestamp + ".xml");
        files.ensureDir(path);
        files.write(path, text);
        toastLog("快照保存至" + path);
    }

    function defaultWrap() {
        checkRotationGlitch();
        toastLog("执行 " + floatUI.scripts[limit.default].name + " 脚本");
        replaceCurrentTask(floatUI.scripts[limit.default]);
    }

    function taskWrap() {
        checkRotationGlitch();
        layoutTaskPopup();
        task_popup.container.setVisibility(View.VISIBLE);
        task_popup.setTouchable(true);
    }

    function cancelWrap() {
        toastLog("停止脚本");
        replaceCurrentTask({name:"未运行任何脚本", fn: function () {}});
    }

    //检测getWindowSize的转屏方向是不是出现错误
    function checkRotationGlitch() {
        let sz = getWindowSize();
        if (sz.y > sz.x) {
            try {
                if (auto.root != null && auto.root.packageName() != context.getPackageName()) {
                    threads.start(function () {
                        for (let i=0; i<3; i++) {
                            toastLog("警告:\n检测到竖屏");
                            sleep(2000);
                            toast("如果实际上并不是竖屏,\n请强行停止脚本运行,或重启手机");
                            sleep(2000);
                        }
                    });
                }
            } catch (e) {
                logException(e);
            };
        }
    }

    // get to main activity
    function settingsScrollToTop(isPaused) {
        //scrollview内容有变动时滚动回顶端
        ui.run(function() {
            //尝试过OnGlobalLayoutListener，但仍然没解决问题；
            //可能是这个事件被触发过很多次，然后就不知道应该在第几次触发时注销Listener
            ui["content"].postDelayed(function () {
                ui["content"].smoothScrollTo(0, 0);
                if (isPaused) {
                    ui["task_paused_vertical"].setVisibility(View.VISIBLE);
                }
            }, 600);
        });
    }
    function openSettingsRunnable() {
        if (!isCurrentTaskPaused.compareAndSet(TASK_RUNNING, TASK_PAUSING)) {
            replaceCurrentTask(
                {name:"未运行任何脚本", fn: function () {}},
                function () {
                    //确保之前的脚本停下来后才会新开一个线程执行这个回调
                    toastLog("打开脚本设置\n(没有脚本正在运行中)");
                    backtoMain();
                    settingsScrollToTop(false);
                }
            );
            return;
        }
        toastLog("正在暂停脚本...");
        let lastTime = new Date().getTime();
        while (true) {
            let breakLoop = false;
            switch (isCurrentTaskPaused.get()) {
                case TASK_PAUSING:
                    sleep(200);
                    if (new Date().getTime() > lastTime + 4000) {
                        toast("小提示:\n有对话框时,无法暂停脚本");
                        lastTime = new Date().getTime();
                    }
                    break;
                case TASK_PAUSED:
                    breakLoop = true;
                    break;
                default:
                    toastLog("遇到意外情况,无法暂停脚本");
                    return;
            }
            if (breakLoop) break;
        }
        toastLog("脚本已暂停");
        lockUI(false);
        settingsScrollToTop(true);
        backtoMain();
        while (true) {
            switch (isCurrentTaskPaused.get()) {
                case TASK_PAUSED:
                case TASK_RESUMING:
                    sleep(200);
                    break;
                case TASK_RUNNING:
                    toastLog("继续运行脚本");
                    updateUI("task_paused_vertical", "setVisibility", View.GONE);
                    lockUI(true);
                    return;
                    break;
                case TASK_STOPPED:
                    log("脚本已停止运行");
                    updateUI("task_paused_vertical", "setVisibility", View.GONE);
                    //monitoredTask会执行lockUI(false)
                    return;
                    break;
                default:
                    toastLog("遇到意外情况,无法暂停脚本");
                    return;
            }
        }
    }
    var openSettingsThread = null;
    function settingsWrap() {syncer.syn(function () {
        if (openSettingsThread != null && openSettingsThread.isAlive()) {
            if (isCurrentTaskPaused.get() == TASK_PAUSED) {
                toastLog("打开脚本设置\n(脚本已暂停)");
                backtoMain();
                settingsScrollToTop(true);
            } else {
                toastLog("脚本尚未暂停\n请稍后再试");
                return;
            }
        } else {
            openSettingsThread = threads.start(openSettingsRunnable);
        }
    })();};

    //切换悬浮窗靠左/靠右,切换后X轴方向会反转。
    function toggleFloatyGravityLeftRight(floatyRawWindow, isRight) {
        let field = floatyRawWindow.getClass().getDeclaredField("mWindow");
        field.setAccessible(true);
        mWindow = field.get(floatyRawWindow);
        let layoutParams = mWindow.getWindowLayoutParams();
        let gravity = layoutParams.gravity;
        if (isRight == null) {
            gravity ^= android.view.Gravity.LEFT | android.view.Gravity.RIGHT;
        } else {
            gravity &= ~(isRight ? android.view.Gravity.LEFT : android.view.Gravity.RIGHT);
            gravity |= isRight ? android.view.Gravity.RIGHT : android.view.Gravity.LEFT;
        }
        gravity &= ~(android.view.Gravity.RELATIVE_LAYOUT_DIRECTION);
        layoutParams.gravity = gravity;
        mWindow.updateWindowLayoutParams(layoutParams);
    }
    var isGravityRight = false;

    var task_popup = floaty.rawWindow(
        <frame id="container" w="*" h="*">
            <relative w="*" h="*" bg="#f8f8f8" margin="0 15 15 0" padding="2" >
                <vertical id="list_title" bg="#4fb3ff" w="match_parent" h="wrap_content" layout_alignParentTop="true" >
                    <text text="选择需要执行的脚本" textSize="16" padding="4 2" textColor="#ffffff" />
                </vertical>
                <list id="list" w="match_parent" layout_below="list_title" layout_above="list_reminder" >
                    <text
                        id="name"
                        text="{{name}}"
                        textSize="16"
                        h="45"
                        gravity="center"
                        margin="0 1"
                        w="*"
                        bg="#ffffff"
                    />
                </list>
                <vertical id="list_reminder" bg="#4fb3ff" w="match_parent" h="wrap_content" layout_alignParentBottom="true" >
                    <text text="如果没看到想要的，可以继续往下拖动找找看" textSize="16" padding="4 2" textColor="#ffffff" />
                </vertical>
            </relative>
            <frame id="close_button" w="30" h="30" layout_gravity="top|right">
                <img w="30" h="30" src="#881798" circle="true" />
                <img
                    w="21"
                    h="21"
                    src="@drawable/ic_close_black_48dp"
                    tint="#ffffff"
                    layout_gravity="center"
                />
            </frame>
        </frame>
    );

    function layoutTaskPopup() {
        var sz = getWindowSize();
        task_popup.setSize(parseInt(sz.x * 3 / 4), parseInt(sz.y * 3 / 4));
        task_popup.setPosition(parseInt(sz.x / 8), parseInt(sz.y / 8));
    }

    task_popup.container.setVisibility(View.INVISIBLE);
    ui.post(() => {
        try {
            task_popup.setTouchable(false);
        } catch (e) {
            logException(e);
            toastLog("设置悬浮窗时出错,重启app...");
            restartApp();
        }
    });
    task_popup.list.setDataSource(floatUI.scripts);
    task_popup.list.on("item_click", function (item, i, itemView, listView) {
        task_popup.container.setVisibility(View.INVISIBLE);
        task_popup.setTouchable(false);
        if (item.fn) {
            toastLog("执行 " + item.name + " 脚本");
            replaceCurrentTask(item);
        }
    });
    task_popup.close_button.click(() => {
        task_popup.container.setVisibility(View.INVISIBLE);
        task_popup.setTouchable(false);
    });

    // record control info into xml
    function recordElement(item, depth, text) {
        if (item) {
            text += "\t".repeat(depth);
            text += "<" + item.className();
            if (item.id()) text += ' id="' + item.id() + '"';
            if (item.text() && item.text() != "") text += ' text="' + item.text() + '"';
            if (item.desc() && item.desc() != "") text += ' desc="' + item.desc() + '"';
            text += ' bounds="' + item.bounds() + '"';
            if (item.childCount() < 1) text += "/>\n";
            else {
                text += ">\n";
                item.children().forEach((child) => {
                    text = recordElement(child, depth + 1, text);
                });
                text += "\t".repeat(depth);
                text += "</" + item.className() + ">\n";
            }
        }
        return text;
    }

    // popup submenu, this is E4X grammar
    var submenuXML = (
        <frame
            id="container"
            w={parseInt(button_size * (space_factor + 1.5))}
            h={parseInt(button_size * (2 * space_factor + 2))}
        ></frame>
    );
    for (let i = 0; i < menu_list.length; i++) {
        submenuXML.frame += (
            <frame id={"entry" + i} w={button_size} h={button_size}>
                <img w={button_size} h={button_size} src={menu_list[i].color} circle="true" />
                <img
                    w={parseInt(button_size * logo_factor)}
                    h={parseInt(button_size * logo_factor)}
                    src={menu_list[i].logo}
                    tint="#ffffff"
                    layout_gravity="center"
                />
            </frame>
        );
    }
    var submenu = floaty.rawWindow(submenuXML);

    submenu.container.setVisibility(View.INVISIBLE);
    floatUI.floatyHangWorkaroundLock.lock();
    ui.post(() => {
        try {
          submenu.setTouchable(false);
          toggleFloatyGravityLeftRight(submenu, false);//CwvqLU设置的Gravity貌似是START而不是LEFT,这里改成LEFT
          floatUI.floatyHangWorkaroundLock.unlock(); //绕开CwvqLU 9.1.0版上的奇怪假死问题
        } catch (e) {
            logException(e);
            toastLog("设置悬浮窗时出错,重启app...");
            restartApp();
        }
    });

    // mount onclick handler
    for (var i = 0; i < menu_list.length; i++) {
        // hack way to capture i with closure
        submenu["entry" + i].click(
            ((id) => () => {
                menu_list[id].fn();
                hideMenu(true);
            })(i)
        );
    }

    // layout menu and play animation
    // will show menu when hide==false
    function hideMenu(hide) {
        menu.setTouchable(false);
        menu.logo.attr("alpha", "1");
        submenu.setTouchable(false);

        var angle_base = Math.PI / menu_list.length / 2;
        var size_base = menu.getWidth();

        submenu.setPosition(
            0,
            parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2)
        );

        for (var i = 0; i < menu_list.length; i++) {
            var params = submenu["entry" + i].getLayoutParams();
            var horizontal_margin = parseInt(
                size_base * (space_factor + 0.5) * Math.sin(angle_base * (2 * i + 1))
            );
            var vertical_margin = parseInt(
                size_base * (space_factor + 0.5) * (1 - Math.cos(angle_base * (2 * i + 1)))
            );
            if (!isGravityRight) {
                params.gravity = Gravity.TOP | Gravity.LEFT;
                params.leftMargin = horizontal_margin;
                params.rightMargin = 0;
            } else {
                params.gravity = Gravity.TOP | Gravity.RIGHT;
                params.rightMargin = horizontal_margin;
                params.leftMargin = 0;
            }
            params.topMargin = vertical_margin;
            submenu["entry" + i].setLayoutParams(params);
        }

        submenu.container.setVisibility(View.VISIBLE);

        var animators = [];
        for (var i = 0; i < menu_list.length; i++) {
            animators.push(
                ObjectAnimator.ofFloat(
                    submenu["entry" + i],
                    "translationX",
                    0,
                    (!isGravityRight ? -1 : 1) *
                    size_base *
                    (space_factor + 0.5) *
                    Math.sin(angle_base * (2 * i + 1))
                )
            );
            animators.push(
                ObjectAnimator.ofFloat(
                    submenu["entry" + i],
                    "translationY",
                    0,
                    size_base * (space_factor + 0.5) * Math.cos(angle_base * (2 * i + 1))
                )
            );
            animators.push(ObjectAnimator.ofFloat(submenu["entry" + i], "scaleX", 1, 0));
            animators.push(ObjectAnimator.ofFloat(submenu["entry" + i], "scaleY", 1, 0));
        }

        var set = new AnimatorSet();
        set.playTogether.apply(set, animators);
        set.setDuration(200);
        if (!hide) set.setInterpolator({ getInterpolation: (f) => 1 - f });
        set.addListener({
            onAnimationEnd: (anim) => {
                menu.setTouchable(true);
                if (hide) {
                    submenu.container.setVisibility(View.INVISIBLE);
                    menu.logo.attr("alpha", "0.4");
                } else {
                    submenu.setTouchable(true);
                }
            },
        });
        set.start();
    }

    // float button
    var menu = floaty.rawWindow(
        <frame id="container" w="44"><vertical>
            <frame id="logo" w="44" h="44" alpha="0.4">
                <img w="44" h="44" src="#ffffff" circle="true" />
                <img
                    id="img_logo"
                    w="32"
                    h="32"
                    src={"file://"+files.join(files.join(files.cwd(), "images"), "qb.png")}
                    layout_gravity="center"
                />
            </frame>
            <frame id="clickDiskWorkaround" alpha="0.4" w="44" h="44">
                <img w="44" h="44" src="#303030" circle="true" />
                <vertical padding="0 6 0 6">
                    <img
                        id="img_magia"
                        h="16"
                        src={"file://"+files.join(files.join(files.cwd(), "images"), "magia.png")}
                    />
                    <img
                        id="img_doppel"
                        h="16"
                        src={"file://"+files.join(files.join(files.cwd(), "images"), "doppel.png")}
                    />
                </vertical>
            </frame>
        </vertical></frame>
    );

    floatUI.floatyHangWorkaroundLock.lock();
    ui.post(() => {
        try {
          menu.setPosition(0, parseInt(getWindowSize().y / 4));
          toggleFloatyGravityLeftRight(menu, false);//CwvqLU设置的Gravity貌似是START而不是LEFT,这里改成LEFT
          floatUI.floatyHangWorkaroundLock.unlock(); //绕开CwvqLU 9.1.0版上的奇怪假死问题
        } catch (e) {
            logException(e);
            toastLog("设置悬浮窗时出错,重启app...");
            restartApp();
        }
    });

    function calcMenuY() {
        var sz = getWindowSize();
        var minMargin = parseInt((submenu.getHeight() - menu.getHeight()) / 2);
        var y = menu.getY();
        if (y < minMargin) return minMargin;
        else if (y > sz.y - minMargin - menu.getHeight())
            return sz.y - minMargin - menu.getHeight();
        else return y;
    }

    var touch_x = 0,
        touch_y = 0,
        touch_move = false;
    var win_x = 0,
        win_y = 0;
    menu.logo.setOnTouchListener(function (self, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                touch_move = false;
                touch_x = event.getRawX();
                touch_y = event.getRawY();
                win_x = menu.getX();
                win_y = menu.getY();
                break;
            case event.ACTION_MOVE:
                {
                    let dx = event.getRawX() - touch_x;
                    if (isGravityRight) dx = -dx;//靠右的时候,悬浮窗位置和触摸事件的x轴方向相反
                    let dy = event.getRawY() - touch_y;
                    if (!touch_move && submenu.container.getVisibility() == View.INVISIBLE) {
                        if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
                            touch_move = true;
                            menu.logo.attr("alpha", "1");
                        }
                    }
                    if (touch_move) menu.setPosition(win_x + dx, win_y + dy);
                }
                break;
            case event.ACTION_UP:
                if (touch_move) {
                    menu.setTouchable(false);
                    let sz = getWindowSize();
                    let current = menu.getX();
                    let bounceHeight = current;
                    if (current >= sz.x / 2) {
                        //无论靠左还是靠右,getX返回的都是正数:靠左时是从左边缘往右的距离,靠右时则是从右边缘往左的距离
                        //所以在这里统一判定:距离大于屏幕宽度的一半时,就进行切换,从靠左(右)切换道靠右(左)
                        isGravityRight = !isGravityRight;
                        toggleFloatyGravityLeftRight(menu);
                        toggleFloatyGravityLeftRight(submenu);
                        bounceHeight = sz.x - current - menu.getHeight();//刘海屏下不准确,但也无所谓,反正就是个一转眼就消失的动画效果
                    }
                    let animator = ValueAnimator.ofInt(bounceHeight, 0);
                    let menu_y = calcMenuY();
                    animator.addUpdateListener({
                        onAnimationUpdate: (animation) => {
                            menu.setPosition(parseInt(animation.getAnimatedValue()), menu_y);
                        },
                    });
                    animator.addListener({
                        onAnimationEnd: (anim) => {
                            menu.logo.attr("alpha", "0.4");
                            menu.setTouchable(true);
                        },
                    });
                    animator.setInterpolator(new BounceInterpolator());
                    animator.setDuration(300);
                    animator.start();
                } else {
                    hideMenu(submenu.container.getVisibility() == View.VISIBLE);
                }
        }
        return true;
    });
    var clickDiskWorkaroundThread = null;
    menu.clickDiskWorkaround.setOnTouchListener(function (self, event) {
        switch (event.getAction()) {
            case event.ACTION_UP:
                if (clickDiskWorkaroundThread == null || !clickDiskWorkaroundThread.isAlive()) {
                    clickDiskWorkaroundThread = threads.start(tasks.clickDiskWorkaround);
                }
                break;
        }
        return true;
    });

    //转屏时设置悬浮窗的位置和大小
    var receiver = new BroadcastReceiver({
        onReceive: function (ctx, it) {
            if (menu && menu.container) {
                var sz = getWindowSize();

                //更新脚本选择悬浮窗的大小和位置
                try {
                    //因为已经有sz了，就不调用layoutTaskPopup()了
                    task_popup.setSize(parseInt(sz.x * 3 / 4), parseInt(sz.y * 3 / 4));
                    task_popup.setPosition(parseInt(sz.x / 8), parseInt(sz.y / 8));
                } catch (e) {
                    logException(e);
                    toastLog("无法重设悬浮窗的大小和位置,\n可能是悬浮窗意外消失\n退出脚本...");
                    engines.stopAll();
                    return; //不再继续往下执行
                }

                //更新QB头像和5个按钮的位置
                //因为toggleFloatyGravityLeftRight函数的作用,无论是停靠屏幕左边缘还是右边缘,X坐标值设为0都代表停靠屏幕边缘
                menu.setPosition(0, calcMenuY());
                submenu.setPosition(
                    0,
                    parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2)
                );
            } else {
                try {
                    context.unregisterReceiver(receiver);
                } catch (e) {
                    logException(e);
                }
            }
        },
    });

    context.registerReceiver(receiver, new IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED));
    events.on("exit", function () {
        try {
            context.unregisterReceiver(receiver);
        } catch (e) {
            logException(e);
        }
        //floatUI.storage.remove("last_limit_json");//触发带崩脚本问题时貌似on exit事件也会触发,所以这里就不删除last_limit_json了
        //停止shell脚本监工(在参数修改触发adjust函数后就应该已经停止了)
        if (limit.autoRecover) {
            let lastTask = null;
            try {
                let lastTaskJson = floatUI.storage.get("last_limit_json", "null");
                lastTask = JSON.parse(lastTaskJson);
            } catch (e) {
                lastTask = null;
            }
            if (lastTask != null) {
                origFunc.buildDialog({
                    title: "游戏崩溃带崩脚本的临时解决方案",
                    content: "已保存脚本当前的运行状态，下次启动脚本时，将会自动重启游戏并重新登录、恢复本次脚本运行。"
                          +"\n如果点击\"不要恢复\"按钮，就会把这个保存下来的状态清除掉，然后就不会恢复了。"
                          +"\n（一般情况下，弹出这个对话框是为了判断情况：如果是游戏崩溃带崩脚本、而不是用户主动想退出，那么\"不要恢复\"按钮应该就不会被点击，然后在1分钟内，应该就可以检测到脚本已经死掉、从而自动重启脚本，接着，重启后的脚本就会重启并重新登录游戏、恢复上次被打断的任务）",
                    positive: "不要恢复",
                    negative: "要恢复",
                }).on("positive", (d) => {
                    log("on positive, clear and stop");
                    floatUI.storage.clear("last_limit_json");
                    log("cleared last_limit_json");
                    stopFatalKillerShellScript();
                }).on("negative", (d) => {
                    log("on negative, do nothing");
                }).on("dismiss", (d) => {
                    log("on dismiss, do nothing");
                }).show();
            }
        }
    });

    var touch_down_pos = null;
    var touch_up_pos = null;
    var touch_down_time = 0;
    var touch_up_time = 0;
    const default_description_text = "请点击需要周回的battle\n(请通关一次后再用，避免错位)";
    var overlay = floaty.rawWindow(
        <frame id="container" w="*" h="*">
            <frame w="*" h="*" bg="#000000" alpha="0.2"></frame>
            <text
                id="description_text"
                w="auto"
                h="auto"
                text="请点击需要周回的battle{{'\n'}}(请通关一次后再用，避免错位)"
                bg="#ffffff"
                textColor="#FF0000"
                layout_gravity="center_horizontal|top"
                textAlignment="center"
            />
        </frame>
    );
    overlay.container.setVisibility(View.INVISIBLE);
    ui.post(() => {
        try {
          overlay.setTouchable(false);
        } catch (e) {
            logException(e);
            toastLog("设置悬浮窗时出错,重启app...");
            restartApp();
        }
    });
    overlay.container.setOnTouchListener(function (self, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                if (touch_down_pos == null) {
                    touch_down_time = new Date().getTime();
                    touch_down_pos = {
                        x: parseInt(event.getRawX()),
                        y: parseInt(event.getRawY()),
                    }
                    log("捕获触控按下坐标", touch_down_pos.x, touch_down_pos.y);
                }
                break;
            case event.ACTION_UP:
                touch_up_time = new Date().getTime();
                touch_up_pos = {
                    x: parseInt(event.getRawX()),
                    y: parseInt(event.getRawY()),
                };
                log("捕获触控松开坐标", touch_up_pos.x, touch_up_pos.y);
                overlay.setTouchable(false);
                overlay.container.setVisibility(View.INVISIBLE);
                break;
        }
        return true;
    });

    capture = function (description_text) {
        if (description_text == null) {
            description_text = default_description_text;
        }
        touch_down_time = 0;
        touch_up_time = 0;
        touch_down_pos = null;
        touch_up_pos = null;
        ui.post(() => {
            var sz = getWindowSize();
            overlay.setSize(sz.x, sz.y);
            overlay.container.description_text.setText(description_text);
            overlay.container.setVisibility(View.VISIBLE);
            overlay.setTouchable(true);
        });
        while (overlay.container.getVisibility() == View.INVISIBLE) {
            sleep(200);
        }
        while (overlay.container.getVisibility() == View.VISIBLE) {
            sleep(200);
        }
        if (touch_down_time == 0 || touch_up_time == 0) return null;//不应该仍然为0。实际上应该不会发生
        let swipe_duration = touch_up_time - touch_down_time;
        return {pos_down: touch_down_pos, pos_up: touch_up_pos, duration: swipe_duration};
    };

    var floatyObjs = {
        menu: menu,
        submenu: submenu,
        task_popup: task_popup,
        overlay: overlay
    };
    var floatyVisibilities = {};
    var floatySizePositions = {};
    var isAllFloatyHidden = false;
    var showHideAllFloaty = syncer.syn(function (show) {
        if (ui.isUiThread()) throw new Error("showHideAllFloaty should not run in UI thread");
        //尝试避免悬浮窗隐藏后无法恢复的问题
        //floatUI.main在UI线程中第一个执行，然后会上锁，等到反射相关操作做完了才会解锁
        //然后这里才能上锁（还有refreshUpdateStatus在被调用之前也会尝试上锁，但和这里谁先谁后应该无所谓）
        floatUI.floatyHangWorkaroundLock.lock();
        floatUI.floatyHangWorkaroundLock.unlock();
        //ui.run(function () {
        ui.post(() => {
            if (!show) {
                if (limit.doNotHideFloaty) return;
                if (isAllFloatyHidden) return;
                try {
                    floatyVisibilities.menu = menu.container.getVisibility();
                    floatyVisibilities.submenu = submenu.entry0.getVisibility();
                    floatyVisibilities.task_popup = task_popup.container.getVisibility();
                    floatyVisibilities.overlay = overlay.container.getVisibility();
    
                    for (let key in floatyObjs) {
                        let f = floatyObjs[key];
                        floatySizePositions[key] = {
                            size: {w: f.getWidth(), h: f.getHeight()},
                            pos: {x: f.getX(), y: f.getY()},
                        };
                    };
    
                    menu.container.setVisibility(View.GONE);
                    for (let i = 0; i < menu_list.length; i++) submenu["entry"+i].setVisibility(View.GONE);
                    task_popup.container.setVisibility(View.GONE);
                    overlay.container.setVisibility(View.GONE);
    
                    for (let key in floatyObjs) {
                        let f = floatyObjs[key];
                        f.setSize(1, 1);
                        f.setPosition(0, 0);
                    }
    
                    isAllFloatyHidden = true;
                    instantToast("为避免干扰申请权限,\n已隐藏所有悬浮窗");
                } catch (e) {
                    logException(e);
                    toastLog("悬浮窗已丢失\n请重新启动本程序");
                    exit();
                }
            } else {
                //if (!isAllFloatyHidden) return;
                if (isAllFloatyHidden) instantToast("恢复显示悬浮窗");
                log("尝试恢复显示悬浮窗");
                try {
                    for (let key in floatyObjs) {
                        let f = floatyObjs[key];
                        let sp = floatySizePositions[key];
                        if (sp == null) {
                            //如果之前没隐藏过悬浮窗，sp就是undefined，所以这里不能继续往下执行，只能return
                            log("floatySizePositions["+key+"] == null");
                            return;
                        }
                        let s = sp.size, p = sp.pos;
                        f.setPosition(p.x, p.y);
                        f.setSize(s.w, s.h);
                    }
    
                    menu.container.setVisibility(floatyVisibilities.menu);
                    for (var i = 0; i < menu_list.length; i++) submenu["entry"+i].setVisibility(floatyVisibilities.submenu);
                    task_popup.container.setVisibility(floatyVisibilities.task_popup);
                    overlay.container.setVisibility(floatyVisibilities.overlay);
    
                    isAllFloatyHidden = false;
                } catch (e) {
                    logException(e);
                    toastLog("悬浮窗已丢失\n请重新启动本程序");
                    exit();
                }
            }
        });
    });
    floatUI.hideAllFloaty = function () {
        threads.start(function () {
            showHideAllFloaty(false);
        });
    };
    floatUI.recoverAllFloaty = function () {
        threads.start(function () {
            showHideAllFloaty(true);
        });
    }

    //检测刘海屏参数
    function adjustCutoutParams() {
        if (device.sdkInt >= 28) {
            //Android 9或以上有原生的刘海屏API
            let windowInsets = activity.getWindow().getDecorView().getRootWindowInsets();
            let displayCutout = null;
            if (windowInsets != null) {
                displayCutout = windowInsets.getDisplayCutout();
            }
            let display = activity.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay();
            let cutoutParams = {
                rotation: display.getRotation(),
                cutout: displayCutout
            }
            limit.cutoutParams = cutoutParams;
        }
    }
    //脚本启动时反复尝试检测,4秒后停止尝试
    threads.start(function () {
        //Android 8.1或以下没有刘海屏API,无法检测
        if (device.sdkInt < 28) return;

        try {
            cutoutParamsLock.lock();
            var startTime = new Date().getTime();
            do {
                try {adjustCutoutParams();} catch (e) {logException(e);};
                if (limit.cutoutParams != null && limit.cutoutParams.cutout != null) break;
                sleep(500);
            } while (new Date().getTime() < startTime + 4000);
        } catch (e) {
            logException(e);
            throw e;
        } finally {
            cutoutParamsLock.unlock();
        }
        log("limit.cutoutParams", limit.cutoutParams);
    });

    //使用Shizuku执行shell命令
    shizukuShell = function (shellcmd, logstring) {
        if (logstring === true || (logstring !== false && logstring == null))
            logstring = "执行shell命令: ["+shellcmd+"]";
        if (logstring !== false) log("使用Shizuku"+logstring);
        $shell.setDefaultOptions({adb: true});
        let result = $shell(shellcmd);
        $shell.setDefaultOptions({adb: false});
        if (logstring !== false) log("使用Shizuku"+logstring+" 完成");
        return result;
    };
    //直接使用root权限执行shell命令
    rootShell = function (shellcmd, logstring) {
        if (logstring === true || (logstring !== false && logstring == null))
            logstring = "执行shell命令: ["+shellcmd+"]";
        if (logstring !== false) log("直接使用root权限"+logstring);
        $shell.setDefaultOptions({adb: false});
        let result = $shell(shellcmd, true);
        if (logstring !== false) log("直接使用root权限"+logstring+" 完成");
        return result;
    };
    //根据情况使用Shizuku还是直接使用root执行shell命令
    privShell = function (shellcmd, logstring) {
        if (limit.privilege) {
            if (limit.privilege.shizuku) {
                return shizukuShell(shellcmd, logstring);
            } else {
                return rootShell(shellcmd, logstring);
            }
        } else {
            if (requestShellPrivilegeThread != null && requestShellPrivilegeThread.isAlive()) {
                toastLog("已经在尝试申请root或adb权限了\n请稍后重试,或彻底退出脚本后重试");
            } else {
                requestShellPrivilegeThread = threads.start(requestShellPrivilege);
            }
            throw new Error("没有root或adb权限");
        }
    }
    //不使用特权执行shell命令
    normalShell = function (shellcmd, logstring) {
        if (logstring === true || (logstring !== false && logstring == null))
            logstring = "执行shell命令: ["+shellcmd+"]";
        if (logstring !== false) log("不使用特权"+logstring);
        $shell.setDefaultOptions({adb: false});
        let result = $shell(shellcmd);
        if (logstring !== false) log("不使用特权"+logstring+" 完成");
        return result;
    }

    //检查并申请root或adb权限
    getEUID = function (procStatusContent) {
        let matched = null;

        //shellcmd="id"
        matched = procStatusContent.match(/^uid=\d+/);
        if (matched != null) {
            matched = matched[0].match(/\d+/);
        }
        if (matched != null) {
            return parseInt(matched[0]);
        }

        //shellcmd="cat /proc/self/status"
        matched = procStatusContent.match(/(^|\n)Uid:\s+\d+\s+\d+\s+\d+\s+\d+($|\n)/);
        if (matched != null) {
            matched = matched[0].match(/\d+(?=\s+\d+\s+\d+($|\n))/);
        }
        if (matched != null) {
            return parseInt(matched[0]);
        }

        return -1;
    }
    requestShellPrivilege = function () {
        if (limit.privilege) {
            log("已经获取到root或adb权限了");
            return limit.privilege;
        }

        let euid = -1;

        let rootMarkerPath = files.join(engines.myEngine().cwd(), "hasRoot");

        const idshellcmds = ["id", "cat /proc/self/status"];

        for (let shellcmd of idshellcmds) {
            let result = null;
            try {
                result = shizukuShell(shellcmd);
            } catch (e) {
                result = {code: 1, result: "-1", err: ""};
                logException(e);
            }
            if (result.code == 0) {
                euid = getEUID(result.result);
            }
            switch (euid) {
            case 0:
                log("Shizuku有root权限");
                limit.privilege = {shizuku: {uid: euid}};
                break;
            case 2000:
                log("Shizuku有adb shell权限");
                limit.privilege = {shizuku: {uid: euid}};
                break;
            default:
                log("通过Shizuku获取权限失败，Shizuku是否正确安装并启动了？");
                limit.privilege = null;
            }
            if (limit.privilege != null) {
                return;
            }
        }

        if (!files.isFile(rootMarkerPath)) {
            toastLog("Shizuku没有安装/没有启动/没有授权\n尝试直接获取root权限...");
            sleep(2500);
            toastLog("请务必选择“永久”授权，而不是一次性授权！");
            floatUI.hideAllFloaty();
        } else {
            log("Shizuku没有安装/没有启动/没有授权\n之前成功直接获取过root权限,再次检测...");
        }

        for (let shellcmd of idshellcmds) {
            let result = null;
            try {
                result = rootShell(shellcmd);
            } catch (e) {
                logException(e);
                result = {code: 1, result: "-1", err: ""};
            }
            euid = -1;
            if (result.code == 0) euid = getEUID(result.result);
            if (euid == 0) {
                log("直接获取root权限成功");
                limit.privilege = {shizuku: null};
                files.create(rootMarkerPath);
                floatUI.recoverAllFloaty();
                return limit.privilege;
            }
        }

        toastLog("直接获取root权限失败！");
        sleep(2500);
        limit.privilege = null;
        files.remove(rootMarkerPath);
        if (device.sdkInt >= 23) {
            toastLog("请下载安装Shizuku,并按照说明启动它\n然后在Shizuku中给本应用授权");
            $app.openUrl("https://shizuku.rikka.app/zh-hans/download.html");
        } else {
            toastLog("Android版本低于6，Shizuku已不再支持\n必须直接授予root权限，否则无法使用本app");
            //CwvqLU版本更新后，Shizuku 3.6.1就不能识别了，也就无法授权
            //toastLog("Android版本低于6，Shizuku不能使用最新版\n请安装并启动Shizuku 3.6.1，并给本应用授权");
            //$app.openUrl("https://github.com/RikkaApps/Shizuku/releases/tag/v3.6.1");
        }

        floatUI.recoverAllFloaty();
        return limit.privilege;
    }

    if (device.sdkInt < 24) {
        if (requestShellPrivilegeThread == null || !requestShellPrivilegeThread.isAlive()) {
            requestShellPrivilegeThread = threads.start(requestShellPrivilege);
            requestShellPrivilegeThread.waitFor();
            threads.start(function () {
                requestShellPrivilegeThread.join();
                enableAutoService();
            });
        }
    }

    enableAutoService = syncer.syn(function () {
        if (!floatUI.storage.get("autoEnableAccSvc", false)) return;
        if (limit.privilege == null) return;
        if (ui.isUiThread()) throw new Error("enableAutoService should not run on UI thread");
        $settings.setEnabled("enable_accessibility_service_by_root", false);
        let accSvcName = floatUI.storage.get("accSvcName", "");
        function getServices() {
            let result = privShell("settings get secure enabled_accessibility_services");
            if (result.code != 0) return;
            let resultStr = result.result.split("\n").join("").split("\"").join("");
            return resultStr.split(":");
        }
        let myServiceNamePrefix = context.getPackageName()+"/";
        if (auto.service != null && auto.root != null) {
            log("无障碍服务已开启，无需再次自动开启");
            if (accSvcName == null || accSvcName === "") {
                log("尚未获取无障碍服务名，尝试获取");
                let found = getServices().find((item) => item.startsWith(myServiceNamePrefix));
                if (found != null) {
                    let foundSplitted = found.split("/");
                    if (foundSplitted[1] != null && foundSplitted[1] !== "") {
                        floatUI.storage.put("accSvcName", foundSplitted[1]);
                        accSvcName = floatUI.storage.get("accSvcName", "");
                    }
                }
                if (accSvcName != null && accSvcName !== "") {
                    log("成功获取无障碍服务名 ["+accSvcName+"]");
                } else {
                    log("获取无障碍服务名失败");
                }
            } else {
                log("之前已获取无障碍服务名 ["+accSvcName+"]");
            }
            return;
        } else {
            log("无障碍服务未开启，尝试自动开启");
            if (accSvcName == null || accSvcName === "") {
                log("尚未获取无障碍服务名，无法自动开启");
                return;
            } else {
                log("之前已获取无障碍服务名 ["+accSvcName+"]");
            }
        }
        let myServiceName = myServiceNamePrefix+accSvcName;
        let filteredServices = getServices().filter((item) =>
            item !== myServiceName && item != null && item !== "" && item !== "null" && item !== "undefined");
        let servicesStrWithoutMe = filteredServices.join(":");
        filteredServices.push(myServiceName);
        let servicesStr = filteredServices.join(":");
        for (let attempt = 0; attempt < 10; attempt++) {
            if (auto.service != null && auto.root != null) {
                log("已自动开启无障碍服务");
                floatUI.recoverAllFloaty();
                updateUI("autoService", "setChecked", true);
                break;
            }
            let result = privShell("settings put secure enabled_accessibility_services \""+servicesStrWithoutMe+"\"");
            sleep(500);
            result = privShell("settings put secure enabled_accessibility_services \""+servicesStr+"\"");
            sleep(500);
            // workaround weird bug on MuMu Android 6
            result = privShell("settings put secure accessibility_enabled \""+((attempt+1)%2)+"\"");
            sleep(500);
        }
        if (auto.service == null || auto.root == null) {
            log("自动开启无障碍服务失败，清除之前记录的无障碍服务名");
            floatUI.storage.remove("accSvcName");
        }
    });
    floatUI.enableAutoService = function () {
        threads.start(function() {
            enableAutoService();
        });
    }

    //嗑药后，更新设置中的嗑药个数限制
    updateDrugLimit = function (index) {
        if (index < 0 || index > 4) throw new Error("index out of range");
        let drugnum = parseInt(limit["drug"+(index+1)+"num"]);
        //parseInt("") == NaN，NaN视为无限大处理（所以不需要更新数值）
        if (!isNaN(drugnum)) {
            if (drugnum >= drugCosts[index]) {
                drugnum -= drugCosts[index];
                limit["drug"+(index+1)+"num"] = ""+drugnum;
                if (drugnum < drugCosts[index]) {
                    limit["drug"+(index+1)] = false;
                }
                updateUI("drug"+(index+1), "setChecked", limit["drug"+(index+1)]);
                updateUI("drug"+(index+1)+"num", "setText", limit["drug"+(index+1)+"num"]);
            } else {
                //正常情况下应该首先是药的数量还够，才会继续嗑药，然后才会更新嗑药个数限制，所以不应该走到这里
                log("limit.drug"+(index+1)+"num", limit["drug"+(index+1)+"num"]);
                log("index", index);
                throw new Error("limit.drug"+(index+1)+"num exhausted");
            }
        }
    }
    //嗑药后，更新嗑药个数统计
    updateDrugConsumingStats = function (index) {
        if (index < 0 || index > 4) throw new Error("index out of range");
        if (currentTaskDrugConsumed["drug"+(index+1)] == null) {
            currentTaskDrugConsumed["drug"+(index+1)] = 0;
        }
        currentTaskDrugConsumed["drug"+(index+1)] += drugCosts[index];
        log("drug"+(index+1)+"已经磕了"+currentTaskDrugConsumed["drug"+(index+1)]+"个");
    }

    isDrugEnabled = function (index) {
        if (index < 0 || index > 4) throw new Error("index out of range");

        let limitnum = parseInt(limit["drug"+(index+1)+"num"]);
        log(
        "\n第"+(index+1)+"种回复药"
        +"\n"+(limit["drug"+(index+1)]?"已启用":"已禁用")
        +"\n个数限制:"+limitnum+"个"
        );

        //如果未启用则直接返回false
        if (!limit["drug"+(index+1)]) return false;

        //检查是不是至少够磕一次
        if (limitnum < drugCosts[index]) return false;

        return true;
    }

    isDrugEnough = function (index, count) {
        if (index < 0 || index > 4) throw new Error("index out of range");

        //从游戏界面上读取剩余回复药个数后，作为count传入进来
        let remainingnum = parseInt(count);
        let limitnum = parseInt(limit["drug"+(index+1)+"num"]);
        log(
        "\n第"+(index+1)+"种回复药"
        +"\n"+(limit["drug"+(index+1)]?"已启用":"已禁用")
        +"\n剩余:    "+remainingnum+"个"
        +"\n个数限制:"+limitnum+"个"
        );

        //如果未启用则直接返回false
        if (!limit["drug"+(index+1)]) return false;

        //检查是不是至少够磕一次
        if (limitnum < drugCosts[index]) return false;

        //如果传入了undefined、""等等，parseInt将会返回NaN，然后NaN与数字比大小的结果将会是是false
        //BP蓝药/理子活动CP药数量暂时还不能检测，当作数量足够
        if (index == 3 || index == 4) {
            return true;
        } else if (remainingnum < drugCosts[index]) return false;

        return true;
    }

    updateCycleCount = function () {
        currentTaskCycles++;
        log("周回数增加到", currentTaskCycles);
    }

};
// ------------主要逻辑--------------------
var langNow = "zh"
var language = {
    zh: ["回复确认", "回复", "开始", "关注", "关注追加", "消耗AP"],
    jp: ["回復確認", "回復する", "開始", "フォロー", "フォロー追加", "消費AP"],
    tai: ["回復確認", "進行回復", "開始", "關注", "追加關注", "消費AP"]
}
var currentLang = language.zh
var limit = {
    version: '',
    doNotHideFloaty: false,
    doNotToggleForegroundService: false,
    autoRecover: false,
    helpx: '',
    helpy: '',
    battleNo: 'cb3',
    drug1: false,
    drug2: false,
    drug3: false,
    autoReconnect: true,
    reLoginNeverAbandon: false,
    justNPC: false,
    dragSupportList: false,
    preferredSupportCharaNames: "",
    excludedSupportCharaNames: "",
    preferredSupportMemorias: "",//未实现
    autoForPreferredOnly: false,
    drug4: false,
    drug5: false,
    waitCP: false,
    drug1num: '0',
    drug2num: '0',
    drug3num: '0',
    drug4num: '0',
    drug5num: '0',
    drug5waitMinutes: "",
    promptAutoRelaunch: true,
    usePresetOpList: 0,
    default: 0,
    useAuto: true,
    autoFollow: true,
    breakAutoCycleDuration: "",
    forceStopTimeout: "600",
    periodicallyKillTimeout: "3600",
    periodicallyKillGracePeriod: "540",
    apmul: "",
    timeout: "5000",
    rootForceStop: false,
    rootScreencap: false,
    smartMirrorsPick: true,
    useCVAutoBattle: true,
    CVAutoBattleDebug: false,
    CVAutoBattleClickAllSkills: true,
    CVAutoBattleClickSkillsSinceTurn: "3",
    CVAutoBattleClickAllMagiaDisks: true,
    CVAutoBattlePreferAccel: false,
    CVAutoBattlePreferABCCombo: false,
    CVAutoBattleClickDiskDuration: "50",
    dungeonEventRouteData: "",
    dungeonClickNonBattleNodeWaitSec: "8",
    dungeonPostRewardWaitSec: "8",
    dungeonBattleTimeoutSec: "1200",
    dungeonBattleCountBeforeKill: "20",
    firstRequestPrivilege: true,
    privilege: null
}

var cutoutParamsLock = threads.lock();

var clickSets = {
    ap: {
        x: 1000,
        y: 50,
        pos: "top"
    },
    apdrugbtn1: {
        x: 440,
        y: 908,
        pos: "center"
    },
    apdrugbtn2: {
        x: 960,
        y: 908,
        pos: "center"
    },
    apdrugbtn3: {
        x: 1480,
        y: 908,
        pos: "center"
    },
    aphui: {
        x: 1160,
        y: 730,
        pos: "center"
    },
    apclose: {
        x: 1900,
        y: 20,
        pos: "center"
    },
    start: {
        x: 1800,
        y: 1000,
        pos: "bottom"
    },
    startAutoRestart: {
        x: 1800,
        y: 750,
        pos: "bottom"
    },
    autostart: {
        x: 1800,
        y: 750,
        pos: "bottom"
    },
    levelup: {
        x: 960,
        y: 870,
        pos: "center"
    },
    restart: {
        x: 1800,
        y: 1000,
        pos: "bottom"
    },
    restartIntoLoop: {
        x: 1460,
        y: 1000,
        pos: "bottom"
    },
    reconection: {
        x: 700,
        y: 750,
        pos: "center"
    },
    yesfocus: {/*其实应该是followYes，是否关注路人？“是”*/
        x: 1220,
        y: 860,
        pos: "center"
    },
    nofocus: {/*其实应该是followNo，是否关注路人？“否”*/
        x: 699,
        y: 860,
        pos: "center"
    },
    focusclose: {
        x: 950,
        y: 820,
        pos: "center"
    },
    skip: {
        x: 1870,
        y: 50,
        pos: "top"
    },
    huodongok: {
        x: 1600,
        y: 800,
        pos: "center"
    },
    bphui: {
        x: 1180,
        y: 830,
        pos: "center"
    },
    bphui2: {
        x: 960,
        y: 880,
        pos: "center"
    },
    bphuiok: {
        x: 960,
        y: 900,
        pos: "center"
    },
    bpclose: {
        x: 750,
        y: 830,
        pos: "center"
    },
    battlePan1: {
        x: 400,
        y: 950,
        pos: "bottom"
    },
    battlePan2: {
        x: 700,
        y: 950,
        pos: "bottom"
    },
    battlePan3: {
        x: 1000,
        y: 950,
        pos: "bottom"
    },
    mirrors1stOpponent: {
        x: 1793,
        y: 269,
        pos: "center"
    },
    battle1: {
        x: 1200,
        y: 580,
        pos: "top"
    },
    battle2: {
        x: 1200,
        y: 770,
        pos: "top"
    },
    battle3: {
        x: 1200,
        y: 960,
        pos: "top"
    },
    helperFirst: {
        x: 1300,
        y: 350,
        pos: "top"
    },
    recover_battle: {
        x: 1230,
        y: 730,
        pos: "center"
    },
    backToHomepage: {
        x: 960,
        y: 830,
        pos: "center"
    },
    back: {
        x: 120,
        y: 50,
        pos: "top"
    },
    dataDownloadOK: {
        x: 960,
        y: 769,
        pos: "center"
    },
    battleFinishedOK: {
        x: 960,
        y: 660,
        pos: "center"
    },
    cpExhaustRefill: {
        x: 1175,
        y: 832,
        pos: "center"
    },
}

var gamex = 0;
var gamey = 0;
var gametop = 0;
var gameleft = 0;

//屏幕是否为16比9
var deviceflag = false;

function screenutilClick(d) {
    let initx = 1920
    let inity = 1080
    if (gamex * 9 == gamey * 16) {
        deviceflag = true;
    }
    if (deviceflag) {
        let rate = gamey / inity
        click(gameleft + d.x * rate, d.y * rate + gametop)
    }
    else {
        if (d.pos == "top") {
            let rate = gamex / initx
            click(gameleft + d.x * rate, d.y * rate + gametop)
        } else if (d.pos == "center") {
            let rate = gamex / initx
            let realy = gamex * 9 / 16
            click(gameleft + d.x * rate, (gamey - (realy)) / 2 + d.y * rate + gametop)
        } else {
            let rate = gamex / initx
            click(gameleft + d.x * rate, (gamey - (inity - d.y) * rate) + gametop)
        }
    }
}
function autoMain() {
    waitForGameForeground();
    // 初始化嗑药数量
    let druglimit = {
        drug1limit: limit.drug1num,
        drug2limit: limit.drug2num,
        drug3limit: limit.drug3num
    }
    while (true) {
        //开始
        //---------嗑药模块------------------
        //不嗑药直接跳过ap操作
        ApsFunction(druglimit)
        // -----------选援助----------------
        FriendHelpFunction();
        // -----------开始----------------
        BeginFunction();
        //---------战斗------------------
        log("进入战斗")
        //------------开始结算-------------------
        id("ResultWrap").findOne()
        //稳定模式点击结束
        sleep(3000)
        while (!id("retryWrap").findOnce()) {
            //-----------如果有升级弹窗点击----------------------
            if (text(currentLang[3]).findOnce()) {
                while (text(currentLang[3]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(currentLang[4]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.focusclose)
                    sleep(3000)
                }
            }
            if (id("rankUpWrap").findOnce()) {
                while (id("rankUpWrap").findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.levelup)
                    sleep(3000)
                }
            }
            if (id("ap").findOnce()) {
                return;
            }
            sleep(1000)
            // 循环点击的位置为短线重连确定点
            screenutilClick(clickSets.reconection)
            // 点击完毕后 再战不会马上出来，需要等待
            sleep(2000)
        }
        //--------------再战--------------------------
        while (id("retryWrap").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.restart)
            sleep(2500)
        }
    }
}
// 贞德类活动
function autoMainver1() {
    waitForGameForeground();
    // 初始化嗑药数量
    let druglimit = {
        drug1limit: limit.drug1num,
        drug2limit: limit.drug2num,
        drug3limit: limit.drug3num
    }
    while (true) {
        //开始
        //---------嗑药模块------------------
        //不嗑药直接跳过ap操作
        ApsFunction(druglimit)
        // -----------选援助----------------
        FriendHelpFunction();
        // -----------开始----------------
        BeginFunction();
        //---------战斗------------------
        log("进入战斗")
        //------------开始结算-------------------
        id("ResultWrap").findOne()
        //稳定模式点击结束
        sleep(3000)
        while (id("ResultWrap").findOnce()) {
            //-----------如果有升级弹窗点击----------------------
            if (text(currentLang[3]).findOnce()) {
                while (text(currentLang[3]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(currentLang[4]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.focusclose)
                    sleep(3000)
                }
            }
            if (id("rankUpWrap").findOnce()) {
                while (id("rankUpWrap").findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.levelup)
                    sleep(3000)
                }
            }
            sleep(1000)
            // 循环点击的位置为短线重连确定点
            screenutilClick(clickSets.reconection)
            // 点击完毕后 再战不会马上出来，需要等待
            sleep(2000)
        }
        //--------------再战--------------------------
        log("退出结算")
        sleep(2000)
        id("questLinkList").findOne()
        log("选择battle")
        while (id("questLinkList").findOnce()) {
            if (limit.battleNo == "cb1") {
                screenutilClick(clickSets.battle1)
            }
            else if (limit.battleNo == "cb2") {
                screenutilClick(clickSets.battle2)
            } else {
                screenutilClick(clickSets.battle3)
            }
            sleep(3000)
        }
        log("一轮结束")
        sleep(1000)
    }
}

function jingMain() {
    waitForGameForeground();
    while (true) {
        let matchWrap = id("matchingWrap").findOne().bounds()
        while (!id("battleStartBtn").findOnce()) {
            sleep(1000)
            click(matchWrap.centerX(), matchWrap.bottom - 50)
            sleep(2000)
        }
        let btn = id("battleStartBtn").findOne().bounds()
        while (id("battleStartBtn").findOnce()) {
            sleep(1000)
            click(btn.centerX(), btn.centerY())
            sleep(1000)
            if (id("popupInfoDetailTitle").findOnce()) {
                if (isDrugEnough(3)) {
                    while (!id("BpCureWrap").findOnce()) {
                        screenutilClick(clickSets.bphui)
                        sleep(1500)
                    }
                    while (id("BpCureWrap").findOnce()) {
                        screenutilClick(clickSets.bphui2)
                        sleep(1500)
                    }
                    while (id("popupInfoDetailTitle").findOnce()) {
                        screenutilClick(clickSets.bphuiok)
                        sleep(1500)
                    }

                    //更新嗑药个数限制数值，减去用掉的数量
                    updateDrugLimit(3);

                    //更新嗑药个数统计
                    updateDrugConsumingStats(3);
                } else {
                    screenutilClick(clickSets.bpclose)
                    log("jjc结束")
                    return;
                }
            }
            sleep(1000)
        }
        log("进入战斗")
        while (!id("matchingWrap").findOnce()) {
            if (!id("ArenaResult").findOnce()) {
                screenutilClick(clickSets.battlePan1)
                sleep(1000)
            }
            if (!id("ArenaResult").findOnce()) {
                screenutilClick(clickSets.battlePan2)
                sleep(1000)
            }
            if (!id("ArenaResult").findOnce()) {
                screenutilClick(clickSets.battlePan3)
                sleep(1000)
            }
            if (id("ArenaResult").findOnce()) {
                screenutilClick(clickSets.levelup)
            }
            sleep(3000)

        }
    }
}
//----------function抽离------------------------
// 嗑药模块封装
function ApsFunction(druglimit) {
    log("开始检测ap")
    if ((!limit.drug1 && !limit.drug2 && !limit.drug3)) {
        log("无需检测ap")
        return;
    }
    let apCostBounds = text(currentLang[5]).findOne().parent().bounds()
    //获得ap消耗值
    let apCost = textMatches(/^\d+$/).boundsInside(apCostBounds.left, apCostBounds.top, apCostBounds.right, apCostBounds.bottom).findOne().text();
    apCost = parseInt(apCost)
    log("副本ap消耗值为", apCost)
    let statusRect = id("status").findOne().bounds()
    let apComList = textMatches(/^\d+\/\d+$/).boundsInside(statusRect.left, statusRect.top, statusRect.right, statusRect.bottom).find();
    if (apComList.length == 0) {
        apComList = descMatches(/^\d+\/\d+$/).boundsInside(statusRect.left, statusRect.top, statusRect.right, statusRect.bottom).find();
    }
    // aps  55/122  获得字符串中第一串数字
    let aps = apComList[0].text();
    log("ap:", aps)
    let apNow = parseInt(aps.match(/\d+/)[0])
    log("当前体力为" + apNow)
    if (apNow < apCost * 2) {
        //嗑药
        //打开ap面板
        log("嗑药面板开启")
        while (!id("popupInfoDetailTitle").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.ap)
            sleep(2000)
        }
        let apDrugNums = textMatches(/^\d+個$/).find()

        if (langNow == "zh") {
            apDrugNums = textMatches(/^\d+个$/).find()
        }
        //获得回复药水数量
        let apDrug50Num = getDrugNum(apDrugNums[0].text())
        let apDrugFullNum = getDrugNum(apDrugNums[1].text())
        let apMoneyNum = getDrugNum(apDrugNums[2].text())
        log("药数量分别为", apDrug50Num, apDrugFullNum, apMoneyNum)
        // 根据条件选择药水

        if (apDrug50Num > 0 && limit.drug1 && druglimit.drug1limit != "0") {
            if (druglimit.drug1limit) {
                druglimit.drug1limit = (parseInt(druglimit.drug1limit) - 1) + ""
            }
            while (!text(currentLang[0]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.apdrugbtn1)
                sleep(2000)
            }
            text(currentLang[1]).findOne()
            sleep(1000)
            log("确认回复")
            while (text(currentLang[0]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.aphui)
                sleep(2000)
            }
        } else if (apDrugFullNum > 0 && limit.drug2 && druglimit.drug2limit != "0") {
            if (druglimit.drug2limit) {
                druglimit.drug2limit = (parseInt(druglimit.drug2limit) - 1) + ""
            }
            while (!text(currentLang[0]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.apdrugbtn2)
                sleep(2000)
            }
            text(currentLang[1]).findOne()
            sleep(1000)
            log("确认回复")
            while (text(currentLang[0]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.aphui)
                sleep(2000)
            }
        }
        else if (apMoneyNum > 5 && limit.drug3 && druglimit.drug3limit != "0") {
            if (druglimit.drug3limit) {
                druglimit.drug3limit = (parseInt(druglimit.drug3limit) - 1) + ""
            }
            while (!text(currentLang[0]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.apdrugbtn3)
                sleep(2000)
            }
            text(currentLang[1]).findOne()
            sleep(1000)
            log("确认回复")
            while (text(currentLang[0]).findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.aphui)
                sleep(2000)
            }
        } else {
            //关掉面板继续周回
            log("none")
        }

        //关掉ap面板
        log("关掉面板")
        while (id("popupInfoDetailTitle").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.apclose)
            sleep(2000)
        }
    }
}
// 助战选择封装
function FriendHelpFunction() {
    log("选择助战")
    // 15为npc助战  0~14为玩家助战
    //确定在选人阶段
    let friendWrap = id("friendWrap").findOne().bounds()

    if (limit.helpx != "" && limit.helpy != "") {
        while (id("friendWrap").findOnce()) {
            sleep(1000)
            click(parseInt(limit.helpx), parseInt(limit.helpy))
            sleep(2000)
        }
    }
    else {
        let ptCom = textMatches(/^\+{0,1}\d0$/).boundsInside(friendWrap.left + friendWrap.width() / 2, friendWrap.top, friendWrap.right, friendWrap.bottom).find();
        if (ptCom.length == 0) {
            ptCom = descMatches(/^\+{0,1}\d0$/).boundsInside(friendWrap.left + friendWrap.width() / 2, friendWrap.top, friendWrap.right, friendWrap.bottom).find();
        }
        log("助战列表数量：", ptCom.length)
        if (ptCom.length == 0) {
            log("识别不到任何助战列表！可能识别失败或者助战耗尽。")
            log("尝试点击第一个助战位置")
            while (id("friendWrap").findOnce()) {
                sleep(1000)
                screenutilClick(clickSets.helperFirst)
                sleep(2000)
            }
        } else {
            // 可点击的助战列表
            let ptComCanClick = []
            for (let i = 0; i < ptCom.length; i++) {
                //在可见范围内
                if (ptCom[i].bounds().centerY() < friendWrap.bottom && ptCom[i].bounds().centerY() > friendWrap.top) {
                    if (ptComCanClick.length != 0) {
                        //新加入的pt若比第一次加入的要小，舍去
                        if (getPt(ptComCanClick[0]) > getPt(ptCom[i])) {
                            continue
                        }
                    }
                    ptComCanClick.push(ptCom[i])
                }
            }
            log("候选列表数量：", ptComCanClick.length)
            // 是单纯选npc还是，优先助战
            let finalPt = ptComCanClick[0]
            if (limit.justNPC || getPt(finalPt) < getPt(ptComCanClick[ptComCanClick.length - 1])) {
                finalPt = ptComCanClick[ptComCanClick.length - 1]
            }
            log("选择位置：", finalPt.bounds())
            while (id("friendWrap").findOnce()) {
                sleep(1000)
                click(finalPt.bounds().centerX(), finalPt.bounds().centerY())
                sleep(2000)
            }
        }

    }
}
function BeginFunction() {
    id("pieceEquipBtn").findOne()
    log("进入开始")
    while (id("pieceEquipBtn").findOnce()) {
        sleep(1000)
        log("开始点击")
        screenutilClick(clickSets.start)
        sleep(3000)
    }
    //稳定模式点击
    if (limit.autoReconnect) {
        while (!id("ResultWrap").findOnce()) {
            sleep(3000)
            // 循环点击的位置为短线重连确定点
            screenutilClick(clickSets.reconection)
            sleep(2000)
        }
    }
}
function autoBeginFunction() {
    id("pieceEquipBtn").findOne()
    log("进入开始")
    while (id("pieceEquipBtn").findOnce()) {
        sleep(1000)
        log("开始点击")
        screenutilClick(clickSets.autostart)
        sleep(3000)
    }
    //稳定模式点击
    if (limit.autoReconnect) {
        while (!id("ResultWrap").findOnce()) {
            sleep(3000)
            // 循环点击的位置为短线重连确定点
            screenutilClick(clickSets.reconection)
            sleep(2000)
        }
    }
}
function waitForGameForeground() {
    let isGameFg = false;
    for (let i = 1; i <= 5; i++) {
        if (packageName("com.aniplex.magireco").findOnce()) {
            isGameFg = true;
            log("检测到日服");
            langNow = "jp";
        }
        if (packageName("com.bilibili.madoka.bilibili").findOnce()) {
            isGameFg = true;
            log("检测到国服");
            langNow = "zh";
        }
        if (packageName("com.komoe.madokagp").findOnce()) {
            isGameFg = true;
            log("检测到台服");
            langNow = "tai";
        }
        currentLang = language[langNow];
        if (isGameFg) {
            log("游戏在前台");
            let gameBounds = className("android.widget.FrameLayout").depth(4).findOne().bounds()
            log("游戏位置：" + gameBounds)
            gametop = gameBounds.top;
            gameleft = gameBounds.left;
            gamex = gameBounds.right - gameBounds.left;
            gamey = gameBounds.bottom - gameBounds.top;
            break;
        } else {
            toastLog("请务必先把魔纪切换到前台");
        }
        sleep(2000);
    }
    if (!isGameFg) {
        toastLog("游戏没有切到前台，退出");
        exit();
    }
}


function getPt(com) {
    let txt = com.text()
    if (txt.length == 0) {
        txt = com.desc()
    }
    return parseInt(txt.length == 3 ? txt.slice(1) : txt)
}
function getDrugNum(text) {
    return parseInt(text.slice(0, text.length - 1))
}

//立即就会显示出来、不会一个个攒起来连续冒出来的toast
var lastToastObj = null;
function instantToast(text) {
    ui.run(function () {
        if (lastToastObj != null) lastToastObj.cancel();
        lastToastObj = new android.widget.Toast.makeText(context, text, android.widget.Toast.LENGTH_SHORT);
        lastToastObj.show();
    });
}
var canToastParamChanges = false;//启动时不弹toast
floatUI.enableToastParamChanges = function () {
    canToastParamChanges = true;
}
floatUI.adjust = function (key, value) {
    if (value !== undefined) {
        limit[key] = value
        log("更新参数：", key, value)

        //默认执行脚本仍然会在启动时toast,原因未知
        if (canToastParamChanges) instantToast(getUIContent(key) === "" ? "(参数留空)" : getUIContent(key));

        //如果需要就弹窗申请root或adb权限
        let isPrivNeeded = false;
        if (key == "rootForceStop" && value) isPrivNeeded = true;
        if (key == "rootScreencap" && value) isPrivNeeded = true;
        if (key == "autoRecover" && value) isPrivNeeded = true;
        if (key == "autoEnableAccSvc" && value) isPrivNeeded = true;
        if (!limit.privilege && isPrivNeeded) {
            if (requestShellPrivilegeThread == null || !requestShellPrivilegeThread.isAlive()) {
                requestShellPrivilegeThread = threads.start(requestShellPrivilege);
                requestShellPrivilegeThread.waitFor();
                threads.start(function () {
                    requestShellPrivilegeThread.join();
                    enableAutoService();
                });
            }
        }

        //停止shell脚本监工
        if (key == "autoRecover" && !value) {
            if (stopFatalKillerShellScriptThread == null || !stopFatalKillerShellScriptThread.isAlive()) {
                stopFatalKillerShellScriptThread = threads.start(stopFatalKillerShellScript);
                stopFatalKillerShellScriptThread.waitFor();
            } else {
                log("已经在尝试停止shell脚本监工了");
            }
        }

        if (key == "autoEnableAccSvc") {
            if (value) {
                if (limit.privilege) {
                    //自动开启无障碍服务，或者获取无障碍服务名
                    floatUI.enableAutoService();
                } //如果是没有权限的情况，上面也一样会在获取权限后调用enableAutoService
            }
        }
    }
}

floatUI.settingsUIRefreshingList = {};
floatUI.refreshUI = function() {
    //会在main.js的on resume listener里被调用
    ui.run(function () {
        for (let name in floatUI.settingsUIRefreshingList) {
            let item = floatUI.settingsUIRefreshingList[name];
            if (name === "lockToolbarMenu") {
                let isLocked = item.arg;
                floatUI.lockToolbarMenu(isLocked);
            } else if (ui[name][item.funcName] != null) {
                ui[name][item.funcName](item.arg);
            }
            delete floatUI.settingsUIRefreshingList[name];
        }
    });
}
function updateUI() {
    let args = arguments;
    ui.run(function () {
        if (args.length != 3) {
            throw new Error("updateUI: incorrect argument count");
        }
        let name = args[0];
        let funcName = args[1];
        let arg = args[2];
        let item = {name: name, funcName: funcName, arg: arg};
        delete floatUI.settingsUIRefreshingList[name];//防止更新顺序出错
        floatUI.settingsUIRefreshingList[name] = item;//同样的操作只进行最后一次,覆盖掉前一次
        if (auto.service != null && auto.root != null && auto.root.packageName() === context.getPackageName()) {
            floatUI.refreshUI();
        }
    });
}

floatUI.logParams = function () {
    log("\n参数:\n", limit);
}

// compatible action closure
function algo_init() {
    //虽然函数名里有Root，实际上用的可能还是adb shell权限
    function clickOrSwipeRoot(x1, y1, x2, y2, duration) {
        var shellcmd = null;
        var logString = null;
        switch (arguments.length) {
            case 5:
                shellcmd = "input swipe "+x1+" "+y1+" "+x2+" "+y2+(duration==null?"":(" "+duration));
                logString = "模拟滑动: ["+x1+","+y1+" => "+x2+","+y2+"]"+(duration==null?"":(" ("+duration+"ms)"));
                break;
            case 2:
                //shellcmd = "input tap "+x1+" "+y1; //在MuMu上会出现自动战斗时一次点不到盘的问题
                shellcmd = "input swipe "+x1+" "+y1+" "+x1+" "+y1+" 150";
                logString = "模拟点击: ["+x1+","+y1+"]";
                break;
            default:
                throw new Error("clickOrSwipeRoot: invalid argument count");
        }
        privShell(shellcmd, logString);
    }

    function click(x, y) {
        //isGameDead和getFragmentViewBounds其实是在后面定义的
        if (isGameDead() == "crashed") {
            log("游戏已经闪退,放弃点击");
            return;
        }
        if (y == null) {
            var point = x;
            x = point.x;
            y = point.y;
        }
        // limit range

        let xy = {};
        xy.orig = {x: x, y: y};

        var sz = getFragmentViewBounds();
        if (x < sz.left) {
            x = sz.left;
        }
        if (x >= sz.right) {
            x = sz.right - 1;
        }
        if (y < sz.top) {
            y = sz.top;
        }
        if (y >= sz.bottom) {
            y = sz.bottom - 1;
        }

        xy.clamped = {x: x, y: y};
        for (let axis of ["x", "y"])
            if (xy.clamped[axis] != xy.orig[axis])
                log("点击坐标"+axis+"="+xy.orig[axis]+"超出游戏画面之外,强制修正至"+axis+"="+xy.clamped[axis]);

        // system version higher than Android 7.0
        if (device.sdkInt >= 24) {
            // now accessibility gesture APIs are available
            log("使用无障碍服务模拟点击坐标 "+x+","+y);
            origFunc.click(x, y);
            log("点击完成");
        } else {
            clickOrSwipeRoot(x, y);
        }
    }

    function getDefaultSwipeDuration(x1, x2, y1, y2) {
        // 默认滑动时间计算，距离越长时间越长
        let swipe_distance = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
        let screen_diagonal = Math.sqrt(Math.pow((device.width), 2) + Math.pow((device.height), 2));
        return parseInt(1500 + 3000 * (swipe_distance / screen_diagonal));
    }

    function swipe(x1, y1, x2, y2, duration) {
        //isGameDead和getFragmentViewBounds其实是在后面定义的
        if (isGameDead() == "crashed") {
            log("游戏已经闪退,放弃滑动");
            return;
        }
        // 解析参数
        var points = [];
        if (arguments.length > 5) throw new Error("compatSwipe: incorrect argument count");
        for (let i=0; i<arguments.length; i++) {
            if (isNaN(parseInt(arguments[i]))) {
                //参数本身就（可能）是一个坐标点对象
                points.push(arguments[i]);
            } else {
                //参数应该是坐标X值或滑动时长
                if (i < arguments.length-1) {
                    //存在下一个参数，则把这个参数视为坐标X值，下一个参数视为坐标Y值
                    points.push({x: parseInt(arguments[i]), y: parseInt(arguments[i+1])});
                    i++;
                } else {
                    //不存在下一个参数，这个参数应该是滑动时长
                    duration = parseInt(arguments[i]);
                }
            }
            //坐标X、Y值应该都是数字
            if (isNaN(points[points.length-1].x) || isNaN(points[points.length-1].y))
                throw new Error("compatSwipe: invalid arguments (invalid point)");
            //又一个坐标点被加入，最多加入2个点，不允许加入第3个点
            if (points.length > 2) {
                throw new Error("compatSwipe invalid arguments (added more than 2 points)");
            }
        }
        x1 = points[0].x;
        y1 = points[0].y;
        x2 = points[1].x;
        y2 = points[1].y;

        // limit range

        let xy = {};
        xy.orig = {x1: x1, y1: y1, x2: x2, y2: y2};

        var sz = getFragmentViewBounds();
        if (x1 < sz.left) {
            x1 = sz.left;
        }
        if (x1 >= sz.right) {
            x1 = sz.right - 1;
        }
        if (y1 < sz.top) {
            y1 = sz.top;
        }
        if (y1 >= sz.bottom) {
            y1 = sz.bottom - 1;
        }
        if (x2 < sz.left) {
            x2 = sz.left;
        }
        if (x2 >= sz.right) {
            x2 = sz.right - 1;
        }
        if (y2 < sz.top) {
            y2 = sz.top;
        }
        if (y2 >= sz.bottom) {
            y2 = sz.bottom - 1;
        }

        xy.clamped = {x1: x1, y1: y1, x2: x2, y2: y2};
        for (let axis of ["x1", "y1", "x2", "y2"])
            if (xy.clamped[axis] != xy.orig[axis])
                log("滑动坐标"+axis+"="+xy.orig[axis]+"超出游戏画面之外,强制修正至"+axis+"="+xy.clamped[axis]);

        // system version higher than Android 7.0
        if (device.sdkInt >= 24) {
            log("使用无障碍服务模拟滑动 "+x1+","+y1+" => "+x2+","+y2+(duration==null?"":(" ("+duration+"ms)")));
            origFunc.swipe(x1, y1, x2, y2, duration != null ? duration : getDefaultSwipeDuration(x1, x2, y1, y2)); //最后一个参数不能缺省
            log("滑动完成");
        } else {
            clickOrSwipeRoot(x1, y1, x2, y2, duration != null ? duration : getDefaultSwipeDuration(x1, x2, y1, y2));
        }
    }

    // find first element using regex
    function matchFast(reg, wait) {
        return match_(reg, wait, true);
    }
    function match(reg, wait) {
        return match_(reg, wait, false);
    }
    function match_(reg, wait, isFast) {
        var startTime = wait ? new Date().getTime() : 0;
        var result = null;
        var it = 0;
        do {
            it++;
            if (!isFast) try {
                auto.root.refresh();
            } catch (e) {
                logException(e);
                if (wait) sleep(isFast ? 32 : 100);
                continue;
            }
            result = textMatches(reg).findOnce();
            if (result && (isFast || result.refresh())) break;
            result = descMatches(reg).findOnce();
            if (result && (isFast || result.refresh())) break;
            if (wait) sleep(isFast ? 32 : 100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        return result;
    }

    // find all element using regex
    function matchAll(reg, wait) {
        var startTime = new Date().getTime();
        var result = [];
        var it = 0;
        do {
            it++;
            try {
                auto.root.refresh();
            } catch (e) {
                logException(e);
                sleep(100);
                continue;
            }
            result = textMatches(reg).find();
            result = result.filter((x) => x.refresh());
            if (result.length >= 1) break;
            result = descMatches(reg).find();
            result = result.filter((x) => x.refresh());
            if (result.length >= 1) break;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        return result;
    }

    // find first element using plain text
    function findFast(txt, wait) {
        return find_(txt, wait, true);
    }
    function find(txt, wait) {
        return find_(txt, wait, false);
    }
    function find_(txt, wait, isFast) {
        var startTime = wait ? new Date().getTime() : 0;
        var result = null;
        var it = 0;
        do {
            it++;
            if (!isFast) try {
                auto.root.refresh();
            } catch (e) {
                logException(e);
                if (wait) sleep(isFast ? 32 : 100);
                continue;
            }
            result = text(txt).findOnce();
            if (result && (isFast || result.refresh())) break;
            result = desc(txt).findOnce();
            if (result && (isFast || result.refresh())) break;
            if (wait) sleep(isFast ? 32 : 100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        return result;
    }

    // find all element using plain text
    function findAll(txt, wait) {
        var startTime = new Date().getTime();
        var result = [];
        var it = 0;
        do {
            it++;
            try {
                auto.root.refresh();
            } catch (e) {
                logException(e);
                sleep(100);
                continue;
            }
            result = text(txt).find();
            result = result.filter((x) => x.refresh());
            if (result.length >= 1) break;
            result = desc(txt).find();
            result = result.filter((x) => x.refresh());
            if (result.length >= 1) break;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        return result;
    }

    function findIDFast(name, wait) {
        return findID_(name, wait, true);
    }
    function findID(name, wait) {
        return findID_(name, wait, false);
    }
    function findID_(name, wait, isFast) {
        var startTime = wait ? new Date().getTime() : 0;
        var result = null;
        var it = 0;
        do {
            it++;
            if (!isFast) try {
                auto.root.refresh();
            } catch (e) {
                logException(e);
                if (wait) sleep(isFast ? 32 : 100);
                continue;
            }
            result = id(name).findOnce();
            if (result && (isFast || result.refresh())) break;
            if (wait) sleep(isFast ? 32 : 100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        return result;
    }

    function waitElement(element, wait) {
        var startTime = new Date().getTime();
        var result;
        do {
            if (!element.refresh()) return;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
    }

    function findPackageName(name, wait) {
        var startTime = new Date().getTime();
        var result = null;
        var it = 0;
        do {
            it++;
            try {
                auto.root.refresh();
            } catch (e) {
                logException(e);
                sleep(100);
                continue;
            }
            result = packageName(name).findOnce();
            if (result && result.refresh()) break;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        return result;
    }

    function waitAnyFast(fnlist, wait) {
        return waitAny_(fnlist, wait, true);
    }
    function waitAny(fnlist, wait) {
        return waitAny_(fnlist, wait, false);
    }
    function waitAny_(fnlist, wait, isFast) {
        var startTime = new Date().getTime();
        var result = null;
        var it = 0;
        var current = 0;
        do {
            it++;
            if (current >= fnlist.length) current = 0;
            result = fnlist[current]();
            if (result && (isFast || result.refresh())) break;
            current++;
            sleep(isFast ? 32 : 50);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        if (wait)
            log(
                "find " +
                fnlist.length +
                " items for " +
                (new Date().getTime() - startTime) +
                " with " +
                it +
                " limit " +
                wait
            );
    }

    function getContent(element) {
        if (element == null) return "";
        let text = element.text();
        if (text === "" || text == null) text = element.desc();
        if (text === "" || text == null) text = "";
        return text;
    }

    function checkNumber(content) {
        return !isNaN(Number(content)) && !isNaN(parseInt(content));
    }

    //AP回复、更改队伍名称、连线超时等弹窗都属于这种类型
    //关注追加窗口在MuMu上点这里的close坐标点不到关闭
    //title_to_find可以是数组
    function findPopupInfoDetailTitle(title_to_find, wait) {
        let default_x = getFragmentViewBounds().right - 1;
        let default_y = 0;
        let result = {
            element: null,
            title: "",
            close: {
                //getFragmentViewBounds其实是在后面定义的
                x: default_x,
                y: default_y
            }
        };

        let element = wait ? findID("popupInfoDetailTitle", wait) : findIDFast("popupInfoDetailTitle", false);

        if (element == null) return null;
        result.element = element;

        let element_text = getContent(element);

        if (element_text != null && element_text != "") {
            //MuMu模拟器上popupInfoDetailTitle自身就有文字
            let title = element_text;
            result.title = ((title == null) ? "" : title);
        } else if (element.childCount() > 0) {
            //Android 10真机上popupInfoDetailTitle自身没有文字，文字是它的子控件
            let children_elements = element.children();
            let max = 0;
            let title = "";
            for (let i=0; i<children_elements.length; i++) {
                let child_element = children_elements[i];
                let text = getContent(child_element);
                if (text != null && text.length > max) {
                    max = text.length;
                    title = text;
                }
            }
            result.title = title;
        } else {
            //意料之外的情况
            result.title = "";
        }

        if (
             title_to_find != null
             && (
                  typeof title_to_find == "string"
                  ? title_to_find != result.title
                  : title_to_find.find((val) => val == result.title) == null
                )
           )
        {
            return null;
        }

        let element_bounds = element.bounds();
        let half_height = parseInt(element_bounds.height() / 2);
        if (result.title != null && element_bounds.width() > result.title.length * (half_height * 2)) {
            let close_x = element_bounds.right + (half_height * 2);
            if (close_x <= default_x) result.close.x = close_x;
        }
        result.close.y = element_bounds.top - half_height;
        if (result.close.y < 0) result.close.y = half_height;

        return result;
    }

    //检测AP，缺省wait的情况下只检测一次就退出
    function getAP(wait) {
        var startTime = new Date().getTime();

        if (findID("baseContainer")) {
            // values and seperator are together
            do {
                let result = null;
                let h = getWindowSize().y;
                let elements = matchAll(/^\d+\/\d+$/, false);
                for (let element of elements) {
                    if (element.bounds().top < h) {
                        if (
                            element.indexInParent() == element.parent().childCount() - 1 ||
                            !(
                                "" + getContent(element.parent().child(element.indexInParent() + 1))
                            ).startsWith("Rank")
                        ) {
                            let content = getContent(element);
                            h = element.bounds().top;
                            result = {
                                value: parseInt(content.split("/")[0]),
                                total: parseInt(content.split("/")[1]),
                                bounds: element.bounds(),
                            };
                        }
                    }
                }
                if (result) return result;
                sleep(100);
            } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        } else {
            // ... are seperate
            do {
                let result = null;
                let h = getWindowSize().y;
                let elements = findAll("/", false);
                for (let element of elements) {
                    if (element.bounds().top < h) {
                        if (
                            element.indexInParent() > 1 &&
                            element.indexInParent() < element.parent().childCount() - 1
                        ) {
                            var previous = element.parent().child(element.indexInParent() - 1);
                            var next = element.parent().child(element.indexInParent() + 1);
                            if (
                                checkNumber(getContent(previous)) &&
                                checkNumber(getContent(next))
                            ) {
                                h = element.bounds().top;
                                result = {
                                    value: Number(getContent(previous)),
                                    total: Number(getContent(next)),
                                    bounds: element.bounds(),
                                };
                            }
                        }
                    }
                }
                if (result) return result;
                sleep(100);
            } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        }
    }

    function getPTList() {
        let results = [];
        //在收集可能是Pt的控件之前，应该先找到“请选择支援角色”
        //如果找不到，那应该是出现意料之外的情况了，这里也不好应对处理
        let string_support_element = find(string.support, parseInt(limit.timeout));
        let left = string_support_element.bounds().left;
        let elements = matchAll(/^\+\d*$/);
        log("PT匹配结果数量" + elements.length);
        for (var element of elements) {
            var content = getContent(element);
            // pt value and "+" are seperate
            if (content == "+") {
                if (element.indexInParent() < element.parent().childCount() - 1) {
                    var next = element.parent().child(element.indexInParent() + 1);
                    if (checkNumber(getContent(next))) {
                        results.push({
                            value: Number(getContent(next)),
                            bounds: element.bounds(),
                        });
                    }
                }
            }
            // ... are together
            else {
                if (checkNumber(content.slice(1))) {
                    results.push({
                        value: Number(content.slice(1)),
                        bounds: element.bounds(),
                    });
                }
            }
        }

        return results.filter((result) => result.bounds.left >= left);
    }

    function detectCostAP() {
        //FIXME 星期副本的选关界面中识别到的是列表中第一个而未必是实际被选中周回的副本，
        //但第一个出现的也是消耗AP最高的，所以一般问题也不大
        let elements = matchAll(string.regex_cost_ap);

        //“消耗AP”文字和数字没分开的情况
        let result = null;
        elements.find((element) => {
            let text = getContent(element);
            let matched = text != null ? text.match(/\d+/) : null;
            if (matched != null) {
                result = parseInt(matched[0]);
                return true;
            }
        })
        if (result != null) return result;

        //“消耗AP”文字和数字分开了的情况
        for (let element of elements) {
            if (element.indexInParent() < element.parent().childCount() - 1) {
                var next = element.parent().child(element.indexInParent() + 1);
                if (checkNumber(getContent(next))) {
                    return Number(getContent(next));
                }
            }
        }
    }

    function getCostAP() {
        let detectedAPCost = detectCostAP();
        if (detectedAPCost != null) return detectedAPCost;
        else if (lastOpList != null && lastOpList.apCost != null && checkNumber(lastOpList.apCost)) {
            log("没有检测到AP消耗数值,返回动作录制记录里的AP消耗数值["+lastOpList.apCost+"]");
            return parseInt(lastOpList.apCost);
        }
    }

    const knownFirstPtPoint = {
        x: 1808,
        y: 325,
        pos: "top"
    }
    const ptDistanceY = 243.75;

    //屏幕范围内的最后一个助战Y坐标
    //考虑到屏幕底部可能有手势导航条之类的,稍微往里收窄一些
    const screenBottomYInnerMargin = 20;
    function clampSupportY() {
        let screenBottomY = getWindowSize().y - screenBottomYInnerMargin;
        let convertedPtDistanceY = convertCoordsNoCutout({x: 0, y: ptDistanceY, pos: "top"}).y;
        let convertedFirst = convertCoords(knownFirstPtPoint);
        let rangeY = screenBottomY - convertedFirst.y;
        return parseInt(screenBottomY - (rangeY % convertedPtDistanceY));
    }

    function swipeToPointIfNeeded(point) {
        let screenBottomY = getWindowSize().y - screenBottomYInnerMargin;
        let convertedPtDistanceY = convertCoordsNoCutout({x: 0, y: ptDistanceY, pos: "top"}).y;
        if (!limit.dragSupportList && point.y > screenBottomY) {
            toastLog("助战位置超出游戏画面之外\n限制到屏幕范围内");
            point.y = clampSupportY();
            return point;
        }
        while (point.y > screenBottomY) {
            toastLog("助战位置超出游戏画面之外\n自动拖动助战列表...");
            let remainingDistance = point.y - screenBottomY;
            //一开始步子迈的大一些，然后减小步伐
            //步子迈太小了也不行，会误识别成长按，所以得留一步距离给下一次拖动
            let swipeDistanceX = 0;
            let swipeDistanceY = 0;
            let swipeDuration = 4000;
            if (remainingDistance > convertedPtDistanceY * 4) {
                swipeDistanceY = convertedPtDistanceY * 3;
                swipeDuration = 4000;
            } else if (remainingDistance > convertedPtDistanceY * 3) {
                swipeDistanceY = convertedPtDistanceY * 2;
                swipeDuration = 3500;
            } else if (remainingDistance > convertedPtDistanceY * 2) {
                swipeDistanceY = convertedPtDistanceY;
                swipeDuration = 3000;
            } else if (remainingDistance > convertedPtDistanceY) {
                //最后两步并一步
                swipeDistanceY = remainingDistance;
                swipeDuration = 3000;
            } else if (remainingDistance > 0 && remainingDistance <= convertedPtDistanceY) {
                //正常情况下走不到这里
                swipeDistanceX = convertedPtDistanceY;
                swipeDistanceY = remainingDistance;
                swipeDuration = 3000;
            } else {
                toastLog("自动拖动助战列表时出错");
                log("返回第一个助战");
                return convertCoords(knownFirstPtPoint);
            }
            if (swipeDistanceX != 0) log("警告 swipeDistanceX不为零 swipeDistanceX="+swipeDistanceX);
            swipe(point.x, screenBottomY, point.x - swipeDistanceX, screenBottomY - swipeDistanceY, swipeDuration);
            sleep(500);
            point.y -= swipeDistanceY;
        }
        return point;
    }

    function pickSupportWithMostPt(isTestMode) {
        var hasError = false;
        //Lv/ATK/DEF/HP [Rank] 玩家名 [最终登录] Pt
        //Lv/ATK/DEF/HP 玩家名 [Rank] [最终登录] Pt
        //如果助战玩家未设定当前属性的角色，则缺失Lv/ATK/DEF/HP，但仍然有Rank、玩家名、最终登录和Pt
        let AllElements = [];
        let uicollection = packageName(string.package_name).find();
        for (let i=0; i<uicollection.length; i++) {
            AllElements.push(uicollection[i]);
        }

        let finalIndex = -1;
        AllElements.forEach(function (val, index) {
            if (getContent(val).match(string.regex_difficulty)) finalIndex = index
        });
        if (finalIndex == -1) {
            log("助战选择出错,找不到难度");
            hasError = true;
            finalIndex = AllElements.length-1; //先让他继续跑，虽然结果不会用
        }

        let LvLikeIndices = [];
        AllElements.forEach(function (val, i) {
            if (getContent(val).match(/^((Lv|ATK|DEF|HP)\d*)$/)) LvLikeIndices.push(i)
        });
        let RankLikeIndices = [];
        AllElements.forEach(function (val, i) {
            if (getContent(val).match(/^Rank\d*$/)) RankLikeIndices.push(i)
        });
        let LastLoginLikeIndices = [];
        AllElements.forEach(function (val, i) {
            if (getContent(val).match(string.regex_lastlogin)) LastLoginLikeIndices.push(i)
        });
        let PtLikeIndices = [];
        AllElements.forEach(function (val, i){
            if (getContent(val).match(/^\+\d*$/)) PtLikeIndices.push(i)
        });
        log("\n匹配到:"
            +"\n  类似Lv/ATK/DEF/HP的控件个数: "+LvLikeIndices.length
            +"\n  类似Rank的控件个数:          "+RankLikeIndices.length
            +"\n  类似上次登录的控件个数:      "+LastLoginLikeIndices.length
            +"\n  类似Pt的控件个数:            "+PtLikeIndices.length
            +"\n");

        let AllLvIndices = [];
        let PlayerLvIndices = [];
        let NPCLvIndices = [];
        //倒着从后往前搜寻，这样才会先碰到和Lv/ATK/DEF/HP混淆的恶搞玩家名，从而排除，而不会误排除真正的Lv/ATK/DEF/HP
        LvLikeIndices.reverse().forEach(function (index, i, arr) {
            //第一个(序号0)在颠倒前就是最后一个，因为后面已经没有下一个Lv/ATK/DEF/HP控件了，用finalIndex
            //第二个(序号1)和后续的在颠倒前就是倒数第二个和之前的，往前推一个对应颠倒前往后推一个
            let nextIndex = i == 0 ? finalIndex : arr[i-1];

            let rankIndex = RankLikeIndices.find((val) => val > index && val < nextIndex);
            let lastLoginIndex = LastLoginLikeIndices.find((val) => val > index && val < nextIndex);

            if (rankIndex != null && lastLoginIndex != null) {
                //在Lv/ATK/DEF/HP后找到Rank和上次登录，就是玩家的Lv/ATK/DEF/HP；否则是NPC或恶搞玩家名
                //但是还要排除一种可能：未设定助战角色
                //在（疑似）Rank和上次登录时间之后找Pt，尽量确保找到的Pt不是恶搞玩家名（比如“+60”）
                let ptIndex = PtLikeIndices.find((val) => val > rankIndex && val > lastLoginIndex);
                if (ptIndex == null) {
                    log("助战选择出错,在第"+(arr.length-i)+"个Lv/ATK/DEF/HP控件后,找到了Rank和上次登录,却没找到Pt");
                    hasError = true;
                    return;
                }
                if (AllElements.slice(index + 1, ptIndex).find((val) => getContent(val) == string.support_chara_not_set) != null) {
                    log("在第"+(arr.length-i)+"个Lv/ATK/DEF/HP控件后,找到了Rank和上次登录,还有\"未设定\"");
                    if (PtLikeIndices.find((val) => val > index && val < ptIndex) != null) {
                        log("应该是NPC");
                        NPCLvIndices.push(index);
                    } else {
                        log("应该是恶搞玩家名\"未设定\"");
                        PlayerLvIndices.push(index);
                    }
                } else {
                    PlayerLvIndices.push(index);
                }
                AllLvIndices.push(index);
                return;
            }
            if (rankIndex != null && lastLoginIndex == null) {
                log("在第"+(arr.length-i)+"个Lv/ATK/DEF/HP控件后,找到了Rank,却没找到上次登录");
                return;
            }
            if (rankIndex == null && lastLoginIndex != null) {
                log("在第"+(arr.length-i)+"个Lv/ATK/DEF/HP控件后,没找到Rank,却找到上次登录");
                return;
            }
            if (rankIndex == null && lastLoginIndex == null) {
                //NPC一定是没有Rank也没有上次登录
                //但是，不知道是不是有些环境下，玩家名后面本来就既没有Rank也没有上次登录
                //预想在这种情况下，会把和Lv/ATK/DEF/HP相似的恶搞玩家名误判为NPC
                NPCLvIndices.push(index);
                AllLvIndices.push(index);
                return;
            }
        });
        //恢复原来的顺序
        LvLikeIndices.reverse();
        AllLvIndices.reverse();
        PlayerLvIndices.reverse();
        NPCLvIndices.reverse();
        log("玩家助战总数: "+PlayerLvIndices.length);

        //从NPC的Lv/ATK/DEF/HP里排除和Lv/ATK/DEF/HP相似的恶搞玩家名
        //这里的假设是玩家名肯定在Lv/ATK/DEF/HP和Pt之间——如果还有更奇葩的环境不满足这个假设就没辙了
        //假Lv/ATK/DEF/HP前面肯定还有真Lv/ATK/DEF/HP（所以需要倒着从后往前搜才能先碰到假的）
        NPCLvIndices = NPCLvIndices.reverse().filter(function (index, i, arr) {
            //当前Lv/ATK/DEF/HP控件在AllLvIndices中的序号
            let i_index = AllLvIndices.findIndex((val) => val == index);
            //已经是第一个Lv/ATK/DEF/HP控件(序号0)了，不可能是假的
            if (i_index == 0) return true;
            //找到前一个Lv/ATK/DEF/HP控件
            let prevIndex = AllLvIndices[i_index-1];

            let PtIndex = PtLikeIndices.find((val) => val > prevIndex && val < index);

            if (PtIndex == null) {
                //假Lv/ATK/DEF/HP和真Lv/ATK/DEF/HP之间肯定没有Pt
                let delete_i = AllLvIndices.findIndex((val) => val == index);
                log("第"+(delete_i+1)+"个Lv/ATK/DEF/HP控件是恶搞玩家名,排除");
                AllLvIndices.splice(delete_i, 1);
                return false;
            }
            if (PtIndex != null) {
                //真Lv/ATK/DEF/HP之前要么已经没有更前面的Lv，如果有（无论真假），和前一个Lv/ATK/DEF/HP之间肯定有Pt
                return true;
            }
        });
        NPCLvIndices.reverse();//恢复原来的顺序

        log("NPC助战个数: "+NPCLvIndices.length);
        log("助战总数: "+AllLvIndices.length);
        if (NPCLvIndices.length + PlayerLvIndices.length != AllLvIndices.length) {
            hasError = true;
            log("助战选择出错,NPC助战个数+玩家助战总数!=助战总数");
        }

        //寻找最高的Pt加成
        let HighestPt = 0;
        let AllPtIndices = [];
        let NPCPtIndices = [];
        let PlayerPtIndices = [];
        //可以不用颠倒过来了
        AllLvIndices.forEach(function (index, i, arr) {
            //最后一个Lv/ATK/DEF/HP控件后面已经没有下一个Lv/ATK/DEF/HP控件了，用finalIndex；其余的往后推一个即可
            let nextIndex = i >= arr.length - 1 ? finalIndex : arr[i+1];

            //从前往后找到所有像是Pt的控件
            let ptPossibleIndices = PtLikeIndices
                .filter((val) => val > index && val < nextIndex)
                .filter(
                         (val) => AllElements.slice(index + 1, val)/* 避免未设定角色的助战插入进来干扰 */
                                             .find((element) => getContent(element) == string.support_chara_not_set) == null
                       );
            //取最后一个，防止碰到恶搞玩家名
            let ptIndex = ptPossibleIndices.length > 0 ? ptPossibleIndices[ptPossibleIndices.length-1] : null;

            if (ptIndex != null) {
                let PtContent = getContent(AllElements[ptIndex]);
                let Pt = parseInt(PtContent);
                //处理+和60分开的情况
                if (isNaN(Pt)) {
                    PtContent = getContent(AllElements[++ptIndex]);
                    Pt = parseInt(PtContent);
                }
                if (isNaN(Pt)) {
                    log("助战选择出错,在第"+(i+1)+"个Lv/ATK/DEF/HP控件后无法读取Pt数值");
                    hasError = true;
                    return;
                }

                if (NPCLvIndices.find((val) => val == index) != null) {
                    NPCPtIndices.push(ptIndex);
                }
                if (PlayerLvIndices.find((val) => val == index) != null) {
                    PlayerPtIndices.push(ptIndex);
                }
                AllPtIndices.push(ptIndex);

                if (Pt > HighestPt) {
                    log("在第"+(i+1)+"个Lv/ATK/DEF/HP控件后找到了更高的Pt加成: "+Pt);
                    HighestPt = Pt;
                }
                return;
            }
            if (ptIndex == null) {
                log("助战选择出错,在第"+(i+1)+"个Lv/ATK/DEF/HP控件后,找不到Pt控件");
                hasError = true;
                return;
            }
        });
        log("最高Pt加成: "+HighestPt);

        if (NPCPtIndices.length != NPCLvIndices.length) {
            hasError = true;
            log("助战选择出错,NPCPt控件数!=NPCLv/ATK/DEF/HP控件数");
        }
        if (PlayerPtIndices.length != PlayerLvIndices.length) {
            hasError = true;
            log("助战选择出错,玩家Pt控件数!=玩家Lv/ATK/DEF/HP控件数");
        }
        if (AllPtIndices.length != AllLvIndices.length) {
            hashError = true;
            log("助战选择出错,Pt控件总数!=Lv/ATK/DEF/HP控件总数");
        }

        let AllHighPtIndices = AllPtIndices.filter((index) => parseInt(getContent(AllElements[index])) == HighestPt);
        let PlayerHighPtIndices = PlayerPtIndices.filter((index) => parseInt(getContent(AllElements[index])) == HighestPt);
        log("高Pt加成助战总数: "+AllHighPtIndices.length);
        log("玩家高Pt加成助战个数: "+PlayerHighPtIndices.length);
        if (NPCPtIndices.length + PlayerHighPtIndices.length != AllHighPtIndices.length) {
            hasError = true;
            log("助战选择出错,NPCPt控件数+玩家高Pt加成控件数!=高Pt加成控件总数");
        }

        //测试模式
        var testOutputString = null;
        if (isTestMode) {
            if (!hasError) {
                testOutputString  =
                        "最高Pt加成:"
                    + "\n  "+HighestPt
                    + "\n助战总数:"
                    + "\n| "+AllPtIndices.length
                    + "\n+---NPC个数:"
                    + "\n|     "+NPCPtIndices.length
                    + "\n+---玩家总数:"
                    + "\n    | "+PlayerPtIndices.length
                    + "\n    +---互关好友个数:"
                    + "\n    |     "+PlayerHighPtIndices.length
                    + "\n    +---单FO或路人个数:"
                    + "\n          "+(PlayerPtIndices.length-PlayerHighPtIndices.length);
            } else {
                testOutputString = null;
            }
        }

        //间接推算坐标，而不是直接读取坐标

        if (hasError) {
            toastLog("助战选择过程中出错,返回第一个助战");
            return {point: convertCoords(knownFirstPtPoint), testdata: testOutputString};
        }

        //优选助战：
        //优先选指定角色（比如龙城明日香，但现在还不能和恶搞玩家名区分），
        //或者加成记忆（未实现，貌似有点复杂，可能以后也不会在这里实现）。

        let preferredSupportCharaNames =
            limit.preferredSupportCharaNames == null
                ? []
                : (""+limit.preferredSupportCharaNames)
                  .replace(/，|\r|\n/g, ",")
                  .split(',')
                  .filter((val) => !val.match(/^ *$/));
        let excludedSupportCharaNames =
            limit.excludedSupportCharaNames == null
                ? []
                : (""+limit.excludedSupportCharaNames)
                  .replace(/，|\r|\n/g, ",")
                  .split(',')
                  .filter((val) => !val.match(/^ *$/));
        let preferredSupportMemorias =
            limit.preferredSupportMemorias == null
                ? []
                : (""+limit.preferredSupportMemorias)
                  .replace(/，|\r|\n/g, ",")
                  .split(',')
                  .filter((val) => !val.match(/^ *$/));

        if (preferredSupportCharaNames.length > 0 || preferredSupportMemorias.length > 0) {
            log("已启用优选助战");
            let HighPtPlayers = [];//在这个数组里保存每个互关好友的Lv/ATK/DEF/HP控件和Pt控件两个序号
            for (let i=0; i<PlayerHighPtIndices.length; i++) {
                let ptIndex = PlayerHighPtIndices[i];
                let lvIndexMax = -1;
                PlayerLvIndices.forEach((lvIndex) => {
                    if (lvIndex < ptIndex && lvIndex > lvIndexMax)
                        lvIndexMax = lvIndex;
                });
                if (lvIndexMax <= -1) {
                    hasError = true;
                    toastLog("优选助战时出错,找不到第"+i+"个互关好友的Lv控件,返回第一个助战");
                    return {point: convertCoords(knownFirstPtPoint), testdata: testOutputString};
                }
                let playerLvPt = {lvIndex: lvIndexMax, ptIndex: ptIndex};
                HighPtPlayers.push(playerLvPt);
            };
            //排序，以防万一
            HighPtPlayers.sort((i, j) => i.lvIndex - j.lvIndex);
            //在互关好友中寻找优先选择的角色名
            let foundPreferredChara = null;//如果找到了就放在这个变量里
            function matchingCallback(textPattern, innerCallbackIfMatched) {
                //排除规则和优选规则的匹配逻辑其实是类似的，所以这里单独抽出来一个回调函数
                for (let i=0; i<HighPtPlayers.length; i++) {
                    //都是要顺着互关好友列表依次捋一遍
                    let splittedTextPatterns = textPattern.split(" ").filter((val) => !val.match(/^ *$/));
                    let playerLvPt = HighPtPlayers[i];
                    playerLvPt.indexInHighPtPlayers = i;

                    //跑在优选规则里，这里很显然是跳过被标记为排除的助战。
                    //跑在排除规则里，其实也是已经被标记为排除的自然不需要再被标记一次。
                    if (playerLvPt.isExcluded) continue;

                    //把当前这个互关好友的玩家名、角色名、角色类型还有其他统统放到这个数组里
                    let allCharaText = [];
                    for (let j=playerLvPt.lvIndex+1; j<playerLvPt.ptIndex; j++)
                        allCharaText.push(getContent(AllElements[j]));

                    if (allCharaText.find((text) => text === textPattern) != null) {
                        //直接匹配上了
                        innerCallbackIfMatched(playerLvPt);
                        return true;
                    } else if (splittedTextPatterns.find((splitTxtPtn) =>//“拆开后的每一条规则”
                        //直接匹配没匹配上，但是按照空格拆开后仍然是全部都匹配上了
                        //这里逻辑有点绕：“拆开后的每一条规则”里都“找不到”“跟（上述数组里）所有文字都匹配不上”的，那就是全都规则都匹配上了
                        allCharaText.find((text) => text === splitTxtPtn) == null//“跟所有文字都匹配不上”
                    ) == null) {//“找不到”
                        innerCallbackIfMatched(playerLvPt);
                        return true;
                    }
                }
                //所有互关好友全捋过一遍了，一个都都匹配不上
                return false;
            }
            excludedSupportCharaNames.forEach((textPattern) => {//排除规则，看看哪些需要排除，所以用forEach挨个捋一遍，一个也不放过
                matchingCallback(textPattern, (playerLvPt) => {
                    //innerCallbackIfMatched
                    //匹配上了排除规则，那就标记为排除
                    playerLvPt.isExcluded = true;
                });
            });
            preferredSupportCharaNames.find((textPattern) => {//优选规则，只要找到一个匹配上的，就可以停了，所以用find
                return matchingCallback(textPattern, (playerLvPt) => {
                    //innerCallbackIfMatched
                    //匹配上了优选规则，找到了
                    playerLvPt.charaName = textPattern;
                    foundPreferredChara = playerLvPt;
                });
            });
            if (foundPreferredChara != null) {
                let logText = "找到了和指定角色名匹配的助战";
                log(logText);
                log(foundPreferredChara);
                testOutputString += "\n"+logText+":";
                testOutputString += "\n  "+"角色名:";
                testOutputString += "\n    ["+foundPreferredChara.charaName+"]";
                testOutputString += "\n  "+"是第"+(foundPreferredChara.indexInHighPtPlayers+1)+"个互关好友\n";
                //找到了指定的角色名（虽然可能是恶搞玩家名）
                //这个角色在列表里的位置，需要跳过NPC
                let supportPos = NPCPtIndices.length + foundPreferredChara.indexInHighPtPlayers;
                let point = {
                    x: knownFirstPtPoint.x,
                    y: knownFirstPtPoint.y + ptDistanceY * supportPos,
                    pos: knownFirstPtPoint.pos
                }
                point = convertCoords(point);
                if (point.y <= getWindowSize().y - screenBottomYInnerMargin) {
                    //没超出屏幕范围
                    log("返回优选助战结果(未超出屏幕范围)");
                    return {point: point, foundPreferredChara: foundPreferredChara, testdata: testOutputString};
                } else {
                    //超出屏幕范围
                    if (limit.dragSupportList) {
                        log("返回优选助战结果(超出屏幕范围,需要拖动)");
                        return {point: point, foundPreferredChara: foundPreferredChara, testdata: testOutputString};
                    } else {
                        log("优选助战结果在屏幕范围外,因为禁用了拖动所以放弃优选结果");
                    }
                }
            }
        }

        if (AllPtIndices.length == 0) {
            toastLog("没有助战可供选择");
            return {point: null, testdata: testOutputString};
        }

        if (limit.justNPC) {
            if (NPCPtIndices.length > 0) {
                log("仅使用NPC已开启,选择第一个助战(即第一个NPC)");
                return {point: convertCoords(knownFirstPtPoint), testdata: testOutputString};
            } else if (PlayerPtIndices.length > 0) {
                toastLog("仅使用NPC已开启,但是没有NPC,所以没有助战可供选择");
                return {point: null, testdata: testOutputString};
            } else {
                //不应该走到这里
                toastLog("没有助战可供选择");
                return {point: null, testdata: testOutputString};
            }
        }

        if (PlayerHighPtIndices.length > 0) {
            log("选择第一个互关好友");
            let point = {
                x: knownFirstPtPoint.x,
                y: knownFirstPtPoint.y + ptDistanceY * NPCPtIndices.length,
                pos: knownFirstPtPoint.pos
            }
            point = convertCoords(point);
            if (point.y > getWindowSize().y - screenBottomYInnerMargin) {
                if (limit.dragSupportList) {
                    log("推算出的第一个互关好友坐标已经超出屏幕范围,需要拖动");
                } else {
                    toastLog("推算出的第一个互关好友坐标已经超出屏幕范围\n限制到屏幕范围内");
                    point.y = clampSupportY();
                }
            }
            return {point: point, testdata: testOutputString};
        } else if (NPCPtIndices.length > 0) {
            log("没有互关好友,选择第一个助战(即第一个NPC)");
            return {point: convertCoords(knownFirstPtPoint), testdata: testOutputString};
        } else if (PlayerPtIndices.length > 0) {
            log("没有互关好友也没有NPC,选择第一个助战(即单向关注好友或路人)");
            return {point: convertCoords(knownFirstPtPoint), testdata: testOutputString};
        } else {
            //不应该走到这里
            toastLog("没有助战可供选择");
            return {point: null, testdata: testOutputString};
        }
    }

    const STATE_CRASHED = 0;
    const STATE_LOGIN = 1;
    const STATE_HOME = 2;
    const STATE_MENU = 3;
    const STATE_SUPPORT = 4;
    const STATE_TEAM = 5;
    const STATE_BATTLE = 6;
    const STATE_REWARD_CHARACTER = 7;
    const STATE_REWARD_MATERIAL = 8;
    const STATE_REWARD_POST = 9;

    const StateNames = [
        "STATE_CRASHED",
        "STATE_LOGIN",
        "STATE_HOME",
        "STATE_MENU",
        "STATE_SUPPORT",
        "STATE_TEAM",
        "STATE_BATTLE",
        "STATE_REWARD_CHARACTER",
        "STATE_REWARD_MATERIAL",
        "STATE_REWARD_POST"
    ];

    // strings constants
    const strings = {
        name: [
            "support",
            "support_chara_not_set",
            "ap_refill_title",
            "ap_refill_button",
            "ap_refill_popup",
            "ap_refill_confirm",
            "out_of_ap",
            "ticket_exhausted_title",
            "team_name_change",
            "start",
            "follow",
            "follow_append",
            "battle_confirm",
            "region",
            "move_to_node",
            "region_lose",
            "cp_exhausted",
            "cp_refill_title",
            "regex_cost_ap",
            "regex_drug",
            "regex_lastlogin",
            "regex_bonus",
            "regex_autobattle",
            "regex_until",
            "regex_event_branch",
            "package_name",
            "connection_lost",
            "auth_error",
            "generic_error",
            "error_occurred",
            "story_updated",
            "unexpected_error",
        ],
        zh_Hans: [
            "请选择支援角色",
            "未设定",
            "AP回复",
            "回复",
            "回复确认",
            "回复",
            "AP不足",
            "道具不足",
            "队伍名称变更",
            "开始",
            "关注",
            "关注追加",
            "确定",
            "区域",
            "节点移动",
            "攻略区域失败",
            "CP不足。",
            "CP回复药",
            /^消耗AP *\d*/,
            /^\d+个$/,
            /^最终登录.+/,
            /＋\d+个$/,
            /[\s\S]*续战/,
            /.+截止$/,
            /^event_branch.*/,
            "com.bilibili.madoka.bilibili",
            "连线超时",
            "认证错误",//被踢下线
            "错误",
            "发生错误",//出现场景(之一)是登录时掉线
            "更新资料",//一般是(活动)剧情数据更新(开放新关卡)后出现
            "发生错误",//发生无法预期的错误。
        ],
        zh_Hant: [
            "請選擇支援角色",
            "未設定",
            "AP回復",
            "回復",
            "回復確認",
            "進行回復",
            "AP不足",
            "道具不足",//在线翻译的，不知道台服实际是啥，不过反正也要停服了
            "變更隊伍名稱",
            "開始",
            "關注",
            "追加關注",
            "決定",
            "區域",//同上,在线翻译的
            "節點移動",//同上,在线翻译的
            "攻略區域失敗",//同上,在线翻译的
            "CP不足。",//同上,在线翻译的
            "CP回復藥",//同上,在线翻译的
            /^消費AP *\d*/,
            /^\d+個$/,
            /^最終登入.+/,
            /＋\d+個$/,
            /[\s\S]*周回/,
            /.+為止$/,
            /^event_branch.*/,
            "com.komoe.madokagp",
            "連線超時",
            "認證錯誤",//被踢下线
            "錯誤",
            "發生錯誤",
            "更新資料",
            "發生錯誤",
        ],
        ja: [
            "サポートキャラを選んでください",
            "未設定",
            "AP回復",
            "回復",
            "回復確認",
            "回復する",
            "AP不足",
            "アイテムが足りない",//在线翻译的，不知道日服实际是啥，但日服已经无法用无障碍服务抓取控件信息了，加入了这个其实也没有意义了
            "チーム名変更",
            "開始",
            "フォロー",
            "フォロー追加",
            "決定",
            "エリア",//从复刻血夜活动看到了，但是没X用，因为无障碍服务并没有恢复
            "ポイントの移動",//同上
            "エリア攻略失敗",//同上
            "CPが不足しています。",//同上
            "CP回復藥",//同上
            /^消費AP *\d*/,
            /^\d+個$/,
            /^最終ログイン.+/,
            /＋\d+個$/,
            /[\s\S]*周回/,
            /.+まで$/,
            /^event_branch.*/,
            "com.aniplex.magireco",
            "通信エラー",
            "認証エラー",//这个是脑补的。实际上日服貌似只能引继，没有多端登录，所以也就没有被“顶号”、被踢下线……
            "エラー",
            "エラー",
            "データ更新",
            "予期せぬエラー",
        ],
    };

    function deleteDialogAndSetResult(openedDialogsNode, result) {
        //调用origFunc.buildDialog时貌似又会触发一次dismiss，然后造成openedDialogsLock死锁，所以这里return来避免这个死锁
        if (openedDialogsNode.alreadyDeleted.getAndIncrement() != 0) return;

        let count = openedDialogsNode.count;

        try {
            openedDialogsLock.lock();
            delete openedDialogs[""+count];
        } catch (e) {
            logException(e);
            throw e;
        } finally {
            openedDialogsLock.unlock();
        }

        openedDialogsNode.dialogResult.setAndNotify(result);
    }
    var dialogs = {
        buildAndShow: function () { let openedDialogsNode = {}; try {
            openedDialogsLock.lock();

            let count = ++openedDialogs.openedDialogCount;
            openedDialogs[""+count] = {node: openedDialogsNode};
            openedDialogsNode.count = count;

            var dialogType = arguments[0];
            var title = arguments[1];
            var content = arguments[2];
            var prefill = content;
            var callback1 = arguments[3];
            var callback2 = arguments[4];
            if (dialogType == "rawInputWithContent") {
                prefill = arguments[3];
                callback1 = arguments[4];
                callback2 = arguments[5];
            }
            if (title == null) title = "";
            if (content == null) content = "";
            if (prefill == null) prefill = "";

            openedDialogsNode.dialogResult = threads.disposable();

            let dialogParams = {title: title};
            if (dialogType != "select") dialogParams.positive = "确定";

            switch (dialogType) {
                case "alert":
                    dialogParams["content"] = content;
                    break;
                case "select":
                    if (callback2 != null) dialogParams["negative"] = "取消";
                    dialogParams["items"] = content;
                    dialogParams["itemsSelectMode"] = "select";
                    break;
                case "confirm":
                    dialogParams["negative"] = "取消";
                    dialogParams["content"] = content;
                    break;
                case "rawInputWithContent":
                    if (content != null && content != "") dialogParams["content"] = content;
                case "rawInput":
                    if (callback2 != null) dialogParams["negative"] = "取消";
                    dialogParams["inputPrefill"] = prefill;
                    break;
            }

            let newDialog = origFunc.buildDialog(dialogParams);

            openedDialogsNode.alreadyDeleted = threads.atomic(0);
            newDialog = newDialog.on("dismiss", () => {
                //dismiss应该在positive/negative/input之后，所以应该不会有总是传回null的问题
                //其中，positive/input之后应该不会继续触发dismiss，只有negative才会
                deleteDialogAndSetResult(openedDialogsNode, null);
            });

            if (dialogType != "rawInput" && dialogType != "rawInputWithContent" && dialogType != "select") {
                newDialog = newDialog.on("positive", () => {
                    if (callback1 != null) callback1();
                    //如果origFunc.buildDialog是第一次触发dismiss并调用deleteDialogAndSetResult，仍然会死锁，所以这里也要避免这个问题
                    deleteDialogAndSetResult(openedDialogsNode, true);
                });
            }

            switch (dialogType) {
                case "alert":
                    break;
                case "select":
                    newDialog = newDialog.on("item_select", (index, item, dialog) => {
                        if (callback1 != null) callback1();
                        deleteDialogAndSetResult(openedDialogsNode, index);
                    });
                    //不break
                case "confirm":
                    newDialog = newDialog.on("negative", () => {
                        if (callback2 != null) callback2();
                        //如果origFunc.buildDialog是第一次触发dismiss并调用deleteDialogAndSetResult，仍然会死锁，所以这里也要避免这个问题
                        deleteDialogAndSetResult(openedDialogsNode, false);
                    });
                    break;
                case "rawInputWithContent":
                case "rawInput":
                    newDialog = newDialog.on("input", (input) => {
                        if (callback1 != null) callback1();
                        //如果origFunc.buildDialog是第一次触发dismiss并调用deleteDialogAndSetResult，仍然会死锁，所以这里也要避免这个问题
                        deleteDialogAndSetResult(openedDialogsNode, input);
                    });
                    newDialog = newDialog.on("negative", () => {
                        if (callback2 != null) callback2();
                        //如果origFunc.buildDialog是第一次触发dismiss并调用deleteDialogAndSetResult，仍然会死锁，所以这里也要避免这个问题
                        deleteDialogAndSetResult(openedDialogsNode, null);
                    });
                    break;
            }

            openedDialogsNode.dialog = newDialog;

            newDialog.show();
        } catch (e) {
            logException(e);
            throw e;
        } finally {
            openedDialogsLock.unlock();
        } let ret = openedDialogsNode.dialogResult.blockedGet(); sleep(500);/* 等待对话框消失,防止isGameDead误判 */ return ret; },
        alert: function(title, content, callback) {return this.buildAndShow("alert", title, content, callback)},
        select: function(title, items, callback1, callback2) {return this.buildAndShow("select", title, items, callback1, callback2)},
        confirm: function(title, content, callback1, callback2) {return this.buildAndShow("confirm", title, content, callback1, callback2)},
        rawInput: function(title, prefill, callback1, callback2) {return this.buildAndShow("rawInput", title, prefill, callback1, callback2)},
        rawInputWithContent: function(title, content, prefill, callback1, callback2) {return this.buildAndShow("rawInputWithContent", title, content, prefill, callback1, callback2)},
    };

    var string = {};
    var last_alive_lang = null; //用于游戏闪退重启

    function detectGameLang() {
        let detectedLang = null;
        for (detectedLang in strings) {
            if (detectedLang == "name") continue;
            try {
                if (findPackageName(strings[detectedLang][strings.name.findIndex((e) => e == "package_name")], 1000)) {
                    if (detectedLang != last_alive_lang) log("区服", detectedLang);
                    break;
                }
            } catch (e) {detectedLang = null;}
            detectedLang = null;
        }
        if (detectedLang != null) {
            //如果游戏不在前台的话，last_alive_lang和string不会被重新赋值
            last_alive_lang = detectedLang;
            for (let i = 0; i < strings.name.length; i++) {
                string[strings.name[i]] = strings[last_alive_lang][i];
            }
            return detectedLang;
        }
        return null;
    }

    //检测游戏是否闪退或掉线
    //注意！调用后会重新检测区服，从而可能导致string、last_alive_lang变量被重新赋值
    function isGameDead(wait) {
        var startTime = new Date().getTime();
        var detectedLang = null;
        do {
            if (last_alive_lang != null) {
                let current_package_name = null;
                try {
                    auto.root.refresh();
                    if (auto.root != null) {
                        current_package_name = auto.root.packageName();
                    }
                } catch (e) {current_package_name = null;};
                if (current_package_name == string.package_name) {
                    detectedLang = last_alive_lang;
                    break;
                }
            } else {
                detectedLang = detectGameLang();
                if (detectedLang != null) break;
            }
            sleep(50);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));

        if (detectedLang == null) {
            log("游戏已经闪退");
            return "crashed";
        }

        //因为STATE_TEAM状态下这里的掉线弹窗检查非常慢,所以跳过头4回检查
        if (bypassPopupCheck.get() == 0) do {
            let found_popup = null;
            try {
                found_popup = findPopupInfoDetailTitle(["connection_lost", "auth_error", "generic_error", "error_occurred", "story_updated", "unexpected_error"].map((val) => string[val]));
            } catch (e) {
                logException(e);
                found_popup = null;
            }
            if (found_popup != null) {
                log("游戏已经断线/登出/出错,并强制回首页");
                return "logged_out";
            }
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));

        return false;
    }

    var lastFragmentViewStatus = {bounds: null, rotation: 0};
    var getFragmentViewBounds = syncer.syn(function () {
        if (string == null || string.package_name == null || string.package_name == "") {
            try {
                throw new Error("getFragmentViewBounds: null/empty string.package_name");
            } catch (e) {
                logException(e);
            }
            let sz = getWindowSize();
            lastFragmentViewStatus = {bounds: null, rotation: 0};
            return new android.graphics.Rect(0, 0, sz.x, sz.y);
        }

        //复用上次的结果,加快速度
        let display = context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay();
        let currentRotation = display.getRotation();
        if (lastFragmentViewStatus.bounds != null && lastFragmentViewStatus.rotation == currentRotation) {
            return lastFragmentViewStatus.bounds;
        }

        let bounds = null;
        try {
            bounds = selector()
                .packageName(string.package_name)
                .className("android.widget.EditText")
                .algorithm("BFS")
                .findOnce()
                .parent()
                .bounds();
        } catch (e) {
            logException(e);
            log("getFragmentViewBounds出错,使用getWindowSize作为替代");
            let sz = getWindowSize();
            lastFragmentViewStatus = {bounds: null, rotation: 0};
            return new android.graphics.Rect(0, 0, sz.x, sz.y);
        }

        if (bounds != null) lastFragmentViewStatus = {bounds: bounds, rotation: currentRotation};

        return bounds;
    });

    var screen = {width: 0, height: 0, type: "normal"};
    var gamebounds = null;
    var gameoffset = {x: 0, y: 0, center: {y: 0}, bottom: {y: 0}};

    function detectScreenParams() {
        //开始脚本前可能转过屏之类的，所以参数需要先重置
        //如果中途有问题有问题，最终就不会修改之前的参数
        let detected_screen = {width: 0, height: 0, type: "normal"};
        let detected_gamebounds = null;
        let detected_gameoffset = {x: 0, y: 0, center: {y: 0}, bottom: {y: 0}};

        detected_screen.width = device.width;
        detected_screen.height = device.height;
        if (detected_screen.height > detected_screen.width) {
            //魔纪只能横屏运行
            let temp = detected_screen.height;
            detected_screen.height = detected_screen.width;
            detected_screen.width = temp;
        }
        if (detected_screen.width * 9 > detected_screen.height * 16) {
            detected_screen.type = "wider";
            scalerate = detected_screen.height / 1080;
            detected_gameoffset.x = parseInt((detected_screen.width - (1920 * scalerate)) / 2);
        } else {
            scalerate = detected_screen.width / 1920;
            if (detected_screen.width * 9 == detected_screen.height * 16) {
                detected_screen.type = "normal";
            } else {
                detected_screen.type = "higher";
                detected_gameoffset.bottom.y = parseInt(detected_screen.height - (1080 * scalerate));
                detected_gameoffset.center.y = parseInt((detected_screen.height - (1080 * scalerate)) / 2);
            }
        }
        log("detected_screen", detected_screen, "detected_gameoffset", detected_gameoffset);

        let element = selector().packageName(string.package_name).className("android.widget.EditText").algorithm("BFS").findOnce();
        log("EditText bounds", element.bounds());
        element = element.parent();
        detected_gamebounds = element.bounds();
        log("detected_gamebounds", detected_gamebounds);

        //刘海屏
        //(1)假设发生画面裁切时，实际显示画面上下（或左右）被裁切的宽度一样（刘海总宽度的一半），
        let isGameoffsetAdjusted = false;
        if (device.sdkInt >= 28) {
            //Android 9或以上有原生的刘海屏API
            //处理转屏
            try {
                cutoutParamsLock.lock();
                var initialRotation = limit.cutoutParams != null ? limit.cutoutParams.rotation : null;
                var initialCutout = limit.cutoutParams != null ? limit.cutoutParams.cutout : null;
            } catch (e) {
                logException(e);
                throw e;
            } finally {
                cutoutParamsLock.unlock();
            }
            if (initialRotation != null && initialCutout != null) {
                let display = context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay();
                let currentRotation = display.getRotation();
                log("currentRotation", currentRotation, "initialRotation", initialRotation);

                if (currentRotation != null && initialRotation != null
                    && currentRotation >= 0 && currentRotation <= 3
                    && initialRotation >= 0 && initialRotation <= 3)
                {
                    let relativeRotation = (4 + currentRotation - initialRotation) % 4;
                    log("relativeRotation", relativeRotation);

                    let safeInsets = {};
                    for (let key of ["Left", "Top", "Right", "Bottom"]) {
                        safeInsets[key] = initialCutout["getSafeInset"+key]();
                    }
                    log("safeInsets before rotation", safeInsets);

                    for (let i=0; i<relativeRotation; i++) {
                        //顺时针旋转相应的次数
                        let temp = safeInsets.Left;
                        safeInsets.Left = safeInsets.Top;
                        safeInsets.Top = safeInsets.Right;
                        safeInsets.Right = safeInsets.Bottom;
                        safeInsets.Bottom = temp;
                    }
                    log("safeInsets after rotation", safeInsets);

                    detected_gameoffset.x += (safeInsets.Left - safeInsets.Right) / 2;
                    detected_gameoffset.y += (safeInsets.Top - safeInsets.Bottom) / 2;

                    isGameoffsetAdjusted = true;
                }
            }
        }
        log("isGameoffsetAdjusted", isGameoffsetAdjusted);
        if (!isGameoffsetAdjusted) {
            //Android 8.1或以下没有刘海屏API；或者因为未知原因虽然是Android 9或以上但没有成功获取刘海屏参数
            //(2)假设detected_gamebounds就是实际显示的游戏画面(模拟器测试貌似有时候不对)
            //所以结合(1)考虑，游戏画面中点减去屏幕中点就得到偏移量
            //（因为刘海宽度未知，所以不能直接用游戏左上角当偏移量）
            detected_gameoffset.x += parseInt(detected_gamebounds.centerX() - (detected_screen.width / 2));
            detected_gameoffset.y += parseInt(detected_gamebounds.centerY() - (detected_screen.height / 2));
        }
        log("detected_gameoffset", detected_gameoffset);

        return {
            screen: detected_screen,
            gamebounds: detected_gamebounds,
            gameoffset: detected_gameoffset
        };
    }

    function initialize(dontStopOnError) {
        if (auto.service == null || auto.root == null) {
            if (auto.service == null) toastLog("未开启无障碍服务");
            if (auto.service != null && auto.root == null) toastLog("无障碍服务似乎工作不正常\n最好重新开启一下无障碍服务\nauto.root == null");
            if (!dontStopOnError) {
                app.startActivity({
                    action: "android.settings.ACCESSIBILITY_SETTINGS"
                });
                stopThread();
            }
        }

        if ($settings.isEnabled("stable_mode")) {
            toastLog(deObStr("警告: 发现CwvqLU的无障碍服务\"稳定模式\"被开启!\n\"稳定模式\"会干扰控件信息抓取!\n尝试关闭..."));
            $settings.setEnabled("stable_mode", false);
            if (device.sdkInt >= 24) {
                auto.service.disableSelf();
                toastLog("为了关闭\"稳定模式\",已停用无障碍服务\n请重新启用无障碍服务后继续");
            } else {
                toastLog("为了关闭\"稳定模式\",\nAndroid 6.0或以下,请到系统设置里:\n先停用无障碍服务,再重新启用");
            }
            app.startActivity({
                action: "android.settings.ACCESSIBILITY_SETTINGS"
            });
            stopThread();
        }

        //检测区服
        if (detectGameLang() == null) {
            if (!dontStopOnError) {
                toastLog("请先把魔法纪录切换到前台,然后再试一次");
                stopThread();
            } else {
                log("检测区服没有返回结果");
            }
        }//detectGameLang会修改string和last_alive_lang

        if (!dontStopOnError) switch (last_alive_lang) {
            case "ja":
                dialogs.alert(
                    "检测到日服",
                    "自日服游戏客户端强制升级至2.4.1版之后,绝大多数脚本在日服上都已失效!\n"
                    +"失效原因是:无障碍服务在游戏内只能抓取到一个空壳webview控件,除此之外无法抓取到任何控件信息。\n"
                    +"点击\"确定\"后脚本将继续运行,但副本周回或镜层周回等脚本都无法正常工作。\n"
                    +"自动点击行动盘脚本应该仍然可以工作,但因为未修正的bug,可能无法正常识别出战斗已经结束。"
                );
                break;
        }

        //检测屏幕参数
        let detected_screen_params = null;
        try {
            detected_screen_params = detectScreenParams();
        } catch (e) {
            logException(e);
            log("检测屏幕参数时出错");
            detected_screen_params = null;
        }
        if (detected_screen_params == null) {
            if (!dontStopOnError) {
                toastLog("检测屏幕参数失败\n请再试一次");
                stopThread();
            } else {
                log("检测屏幕参数没有返回结果");
            }
        } else {
            screen = detected_screen_params.screen;
            gamebounds = detected_screen_params.gamebounds;
            gameoffset = detected_screen_params.gameoffset;
        }
    }

    function refillAP() {
        log("根据情况,如果需要,就使用AP回复药");
        var result = "drug_not_used";

        //检测AP药选择窗口在最开始是不是打开的状态
        var ap_refill_title_appeared = false;
        var ap_refill_title_popup = findPopupInfoDetailTitle(string.ap_refill_title, 200);
        if (ap_refill_title_popup != null) ap_refill_title_appeared = true;

        var apCost = getCostAP();

        //循环嗑药到设定的AP上限倍数，并且达到关卡消耗的2倍
        var apMultiplier = parseInt(0+limit.apmul);

        var initialapinfo = getAP(parseInt(limit.timeout));
        var apinfo = {};
        if (initialapinfo == null) {
            apinfo = null;
        } else for (let key in initialapinfo) apinfo[key] = initialapinfo[key];

        while (true) {
            //避免AP余量没磕到满足要求，但之前有一轮磕过药、而且把药的剩余数量磕完了的情况下死循环
            result = "drug_not_used";

            if (apCost == null) {
                //先检查是否误触，或者检测迟滞而步调不一致
                //如果AP药选择窗口还没出现，检查是不是已经切换到队伍调整
                if (findID("nextPageBtn") != null) {
                    log("已经切换到队伍调整");
                    result = "error";
                    break;
                }
                //同上，检查是不是选助战时点击变成了长按，误触打开了助战角色信息面板
                if (findID("detailTab") != null) {
                    log("误触打开了助战角色信息面板");
                    result = "error";
                    break;
                }
                toastLog("关卡AP消耗未知，不嗑药\n（可能在刷门票活动本？这方面还有待改进）");
                break;
            }
            if (apinfo == null) {
                log("检测AP失败");
                result == "error";
                break;//后面还是要尽量把AP药选择窗口关闭，如果已经打开的话
            }
            log("当前AP:"+apinfo.value+"/"+apinfo.total);
            var apMax = apinfo.total * apMultiplier;
            log("要嗑药到"+apMultiplier+"倍AP上限,即"+apMax+"AP");

            if (apinfo.value >= apMax) {
                log("当前AP已经达到设置的上限倍数");
                log("关卡消耗"+apCost+"AP");//apCost == null的情况已经在前面排除了
                if (apinfo.value >= apCost * 2) {
                    log("当前AP达到关卡消耗量的两倍,即"+(apCost*2)+"AP,停止嗑药");
                    break;
                } else if (apinfo.value >= apCost) {
                    log("当前AP只满足关卡消耗量的一倍,尚未达到两倍");
                } else {
                    log("当前AP小于关卡消耗量");
                }
            } else {
                log("当前AP尚未达到设置的上限倍数");
                let drugEnabled = false;
                for (let i=0; i<3; i++) {
                    if (isDrugEnabled(i)) {
                        drugEnabled = true;
                        break;
                    }
                }
                if (!drugEnabled) {
                    log("所有3种药都没有允许使用");
                    break;
                }
            }

            log("继续嗑药");

            //确保AP药选择窗口已经打开
            let ap_refill_title_attempt_max = 50;
            for (let attempt=0; attempt<ap_refill_title_attempt_max; attempt++) {
                log("等待AP药选择窗口出现...");
                ap_refill_title_popup = findPopupInfoDetailTitle(string.ap_refill_title, false);
                if (ap_refill_title_popup != null) {
                    log("AP药选择窗口已经出现");
                    ap_refill_title_appeared = true;
                    break;
                }
                //如果AP药选择窗口还没出现，检查是不是已经切换到队伍调整
                if (findID("nextPageBtn") != null) {
                    //避免在已经切换到队伍调整后误触
                    //不过在这里检测可能仍然不太可靠，因为能从助战选择那里调用到这里，本来就是之前已经检测过一次nextPageBtn却没有找到
                    //（应该）还是有可能出现虽然已经从助战选择切换出去，但还没完全切换到队伍调整，也检测不到nextPageBtn的情况
                    //这个时候还是会把队伍名称错当成AP按钮误点、然后弹出修改队伍名称的窗口
                    //所以，归根到底还是得靠parseInt(limit.timeout)调大一些，以及队伍调整环节的防误触
                    log("已经切换到队伍调整");
                    result = "error";
                    return result;//AP药选择窗口肯定没开，所以不需要在后面尝试关闭了
                }
                //同上，检查是不是选助战时点击变成了长按，误触打开了助战角色信息面板
                if (findID("detailTab") != null) {
                    log("误触打开了助战角色信息面板");
                    result = "error";
                    return result;
                }
                if (attempt == ap_refill_title_attempt_max-1) {
                    log("多次尝试后，AP药选择窗口仍然没有出现");
                    result = "error";
                    return result;
                }
                if (attempt % 5 == 0) {
                    log("点击AP按钮");
                    click(apinfo.bounds.centerX(), apinfo.bounds.centerY());
                }
                sleep(200);
            }

            //从游戏界面上读取剩余回复药个数
            var numbers = matchAll(string.regex_drug, true);

            //找到三种药的回复按钮
            var buttons = findAll(string.ap_refill_button);

            //如果一切正常，那应该能找到3个匹配的字符串和3个按钮
            if (numbers.length == 3 && buttons.length == 3) {
                //依次轮流尝试使用3种回复药
                for (let i = 0; i < 3; i++) {
                    //检查还剩余多少个药
                    let remainingDrugCount = parseInt(getContent(numbers[i]).slice(0, -1));
                    if (isDrugEnough(i, remainingDrugCount)) {
                        do {
                            log("点击使用第"+(i+1)+"种回复药");
                            click(convertCoords(clickSets["apdrugbtn"+(i+1)]));
                            // wait for confirmation popup
                            var ap_refill_confirm_popup = findPopupInfoDetailTitle(string.ap_refill_popup, 2000);
                        } while (ap_refill_confirm_popup == null);

                        var bound = find(string.ap_refill_confirm, true).bounds();
                        while (ap_refill_confirm_popup.element.refresh()) {
                            log("找到确认回复窗口，点击确认回复");
                            click(bound.centerX(), bound.centerY());
                            waitElement(ap_refill_confirm_popup.element, 5000);
                        }
                        log("确认回复窗口已消失");
                        result = "drug_used";

                        //推算AP增加量
                        switch (i) {
                            case 0://绿药50
                                apinfo.value += 50;
                                break;
                            case 1://红药
                            case 2://碎钻
                                apinfo.value += apinfo.total;
                                break;
                            default:
                                throw new Error("unkown drugtype "+i);
                        }

                        //更新嗑药个数限制数值，减去用掉的数量
                        updateDrugLimit(i);

                        //更新嗑药个数统计
                        updateDrugConsumingStats(i);

                        break; //防止一次连续磕到三种不同的药
                    } else {
                        log("第"+(i+1)+"种回复药剩余数量不足或已经达到嗑药个数限制");
                    }
                }
            }

            if (result != "drug_used") {/* result == "drug_not_used" || result == "error" */
                if (find(string.out_of_ap)) {
                    log("AP不足且未嗑药,退出");
                    stopThread();
                }
                log("未嗑药");
                break; //可能AP还够完成一局，所以只结束while循环、继续往下执行关闭嗑药窗口，不退出
            }
        }

        log("嗑药结束");

        //关闭AP药选择窗口
        if (ap_refill_title_popup == null || !ap_refill_title_popup.element.refresh()) {
            //AP药选择窗口之前可能被关闭过一次，又重新打开
            //在这种情况下需要重新寻找控件并赋值，否则会出现卡在AP药窗口的问题

            //不过，如果AP药选择窗口在最开始的时候就没出现过，后来也没故意要打开它，
            //现在就认为它自从自始至终就从来没出现过，所以就不需要寻找它并等待它出现

            if (ap_refill_title_appeared) ap_refill_title_popup = findPopupInfoDetailTitle(string.ap_refill_title, 2000);
        }
        while (ap_refill_title_popup != null && ap_refill_title_popup.element.refresh()) {
            log("关闭AP回复窗口");
            click(ap_refill_title_popup.close);
            waitElement(ap_refill_title_popup.element, 5000);
        }
        return result;
    }

    function convertCoords(point) {
        let newpoint = {x: point.x, y: point.y, pos: point.pos};

        //先缩放
        newpoint.x *= scalerate;
        newpoint.y *= scalerate;

        //移动坐标，使画面横向位置位于屏幕中央，以及加上刘海屏的额外偏移
        newpoint.x += gameoffset.x;
        newpoint.y += gameoffset.y;

        switch (screen.type) {
        case "normal":
            break;
        case "wider":
            break;
        case "higher":
            switch (point.pos) {
            case "top":
                break;
            case "center":
            case "bottom":
                newpoint.y += gameoffset[point.pos].y;
                break;
            default:
                throw new Error("incorrect point.pos");
            }
            break;
        default:
            throw new Error("incorrect screen type");
        }

        newpoint.x = parseInt(newpoint.x);
        newpoint.y = parseInt(newpoint.y);
        return newpoint;
    }

    function convertCoordsNoCutout(point) {
        let newpoint = {x: point.x, y: point.y, pos: point.pos};

        //先缩放
        newpoint.x *= scalerate;
        newpoint.y *= scalerate;

        /*
        //移动坐标，使画面横向位置位于屏幕中央，以及加上刘海屏的额外偏移
        newpoint.x += gameoffset.x;
        newpoint.y += gameoffset.y;
        */

        switch (screen.type) {
        case "normal":
            break;
        case "wider":
            break;
        case "higher":
            switch (point.pos) {
            case "top":
                break;
            case "center":
            case "bottom":
                /*
                newpoint.y += gameoffset[point.pos].y;
                */
                break;
            default:
                throw new Error("incorrect point.pos");
            }
            break;
        default:
            throw new Error("incorrect screen type");
        }

        newpoint.x = parseInt(newpoint.x);
        newpoint.y = parseInt(newpoint.y);
        return newpoint;
    }

    function getConvertedArea(area) {
        let convertedArea = {
            topLeft: convertCoords(area.topLeft),
            bottomRight: convertCoords(area.bottomRight)
        };
        return convertedArea;
    }
    function getConvertedAreaNoCutout(area) {
        let convertedArea = {
            topLeft: convertCoordsNoCutout(area.topLeft),
            bottomRight: convertCoordsNoCutout(area.bottomRight)
        };
        return convertedArea;
    }

    var lastClickedReconnectPointIndex = 0;
    function clickReconnect() {
        //因为clickSets在后面才初始化,所以只能在函数内初始化reconnectPoints
        const reconnectPoints = [
            {
                name: "断线重连按钮",
                point: clickSets.reconection,
            },
            {
                name: "OK按钮",
                point: clickSets.dataDownloadOK,
            },
            {
                name: "战斗已结束OK按钮",
                point: clickSets.battleFinishedOK,
            },
        ];
        lastClickedReconnectPointIndex++;
        if (lastClickedReconnectPointIndex >= reconnectPoints.length) {
            lastClickedReconnectPointIndex = 0;
        }
        let item = reconnectPoints[lastClickedReconnectPointIndex];
        log("点击"+item.name+"区域");
        click(convertCoords(item.point));
        sleep(300); //避免过于频繁的反复点击、尽量避免游戏误以为长按没抬起（Issue #205）
    }

    function clickAerrPopup() {
        //处理雷电等模拟器下游戏闪退时系统也会弹窗提示重启/关闭而且弹窗不消失的问题
        const aerrIDTexts = [
            {id: "android:id/aerr_restart", text: "重新打开应用"},
            {id: "android:id/aerr_close", text: "关闭应用"},
        ]
        for (let idText of aerrIDTexts) {
            resetFatalKillerWatchDog(); //重设套娃监工WATCHDOG
            let aerrElement = findIDFast(idText.id);
            if (aerrElement == null) aerrElement = findFast(idText.text);
            if (aerrElement != null) {
                log("点击系统弹窗的\""+idText.text+"\"按钮");
                let x = aerrElement.bounds().centerX(), y = aerrElement.bounds().centerY();
                if (device.sdkInt >= 24) {
                    log("使用无障碍服务模拟点击坐标 "+x+","+y);
                    origFunc.click(x, y);
                    log("点击完成");
                } else {
                    clickOrSwipeRoot(x, y);
                }
                log("等待3秒...");
                sleep(3000);
            }
        }
    }

    function selectBattle() { }

    function enterLoop(){
        if (!dialogs.confirm("说明",
            "这个备用的活动周回脚本,功能是刷门票型(DAILYTOWER)活动(类似[初出茅庐女仆十七夜 阔达自在！]这种)。"
            +"\n写死了是刷活动[剧情 1],而且固定每小时自动杀进程重开一次游戏,因为上述这些设定在这个脚本里都是写死了的,所以不受相关设置选项控制,也不会使用选关动作录制数据。"
            +"\n(只有这个备用脚本自己是这样写死的;其他脚本,比如[副本周回(剧情/活动通用)],还是会遵照设置参数运行、会使用选关动作录制数据。)"
            +"\n在首页/选关/选助战/战斗中都可以启动这个脚本,就是启动后不能有其它操作。"
            +"\n备注:"
            +"\n这个脚本是群内大佬贡献的自用脚本(GitHub pull request #62)。它只是个临时的解决方案,用来解决[初出茅庐女仆十七夜 阔达自在！]活动在自动周回几个小时后就会爆内存的问题,没来及考虑照顾兼容所有环境。"
            +"\n已知在MuMu模拟器、低于4.0的雷电模拟器等少数环境下,拖动列表后,抓取到的控件坐标会错乱,所以可能点不到活动[剧情 1]这个正确选项上。"
        )) {
            toastLog("用户点击取消,停止运行");
            return;
        }
        var last=Date.now();
        initialize();
        var pkgName = auto.root.packageName();
        var state = STATE_BATTLE;
        if(match(string.regex_until)) state = STATE_HOME;
        else if(find(string.support)) state = STATE_SUPPORT;
        else if(findID("nextPageBtn")) state = STATE_TEAM;
        else if(find("BATTLE 1")) state=STATE_MENU;
        while (true) {
            switch (state) {
                case STATE_LOGIN:{
                    if(match(string.regex_until)){
                        state=STATE_HOME;
                        log("进入主页面");
                        break;
                    }
                    if(find("BATTLE 1")){
                        state=STATE_MENU;
                        log("进入关卡选择");
                        break;
                    }
                    if (find(string.support)) {
                        state = STATE_SUPPORT;
                        log("进入助战选择");
                        break;
                    }
                    if (findID("nextPageBtn")) {
                        state = STATE_TEAM;
                        log("进入队伍调整");
                        break;
                    }
                    let window=findID("android:id/content")
                    if(window){
                        click(convertCoords(clickSets.recover_battle))
                    }
                    break;
                }
                case STATE_HOME:{
                    if(find("BATTLE 1")){
                        state=STATE_MENU;
                        log("进入关卡选择");
                        break;
                    }
                    let found_popup = findPopupInfoDetailTitle();
                    if (found_popup != null) {
                        log("尝试关闭弹窗 标题: \""+found_popup.title+"\"");
                        click(found_popup.close);
                    }
                    let element=match(string.regex_until)
                    if(element){
                        click(element.bounds().centerX(),element.bounds().centerY())
                    }
                    break;
                }

                case STATE_MENU: {
                    if (find(string.support)) {
                        state = STATE_SUPPORT;
                        log("进入助战选择");
                        break;
                    }
                    let element=find("BATTLE 1")
                    if(element){
                        if(element.bounds().top<element.bounds().bottom){
                            click(element.bounds().centerX(),element.bounds().centerY())
                        }
                        else{
                            let sx=element.bounds().centerX()
                            let syfrom=getWindowSize().y-100
                            let syto=parseInt(syfrom/2)
                            swipe(sx, syfrom, sx, syto, 100)
                        }
                    }
                    break;
                }

                case STATE_SUPPORT: {
                    // exit condition
                    if (findID("nextPageBtn")) {
                        state = STATE_TEAM;
                        log("进入队伍调整");
                        break;
                    }
                    // pick support
                    let ptlist = getPTList();
                    let playercount = matchAll(string.regex_lastlogin).length;
                    log("候选数量" + ptlist.length + ",玩家数量" + playercount);
                    if (ptlist.length) {
                        // front with more pt
                        let bound = ptlist[0].bounds;
                        click(bound.centerX(), bound.centerY());
                        // wait for start button for 5 seconds
                        findID("nextPageBtn", 5000);
                        break;
                    }
                    // if unexpectedly treated as long touch
                    if (findID("detailTab")) {
                        log("点击变长按，打开了detailTab，尝试返回");
                        click(convertCoords(clickSets.back));
                        find(string.support, 5000);
                    }
                    break;
                }

                case STATE_TEAM: {
                    var element = findID("nextPageBtnLoop");
                    // exit condition
                    if (findID("android:id/content") && !element) {
                        state = STATE_BATTLE;
                        log("进入战斗");
                        break;
                    }
                    // click start
                    if (element) {
                        let bound = element.bounds();
                        click(bound.centerX(), bound.centerY());
                        waitElement(element, 500);
                    }
                    break;
                }

                case STATE_BATTLE:{
                    if (!packageName(pkgName).findOnce()) {
                        app.launch(pkgName);
                        sleep(2000);
                        last=Date.now();
                        state=STATE_LOGIN;
                        log("重启游戏进程，进入登录页面");
                    } else if(((Date.now()>last+1000*60*60) && findID("ResultWrap"))||(Date.now()>last+1000*60*65)){
                        log("尝试关闭游戏进程");
                        backtoMain();
                        sleep(5000)
                        killBackground(pkgName);
                        sleep(10000)
                    } else if (limit.autoReconnect && !findID("ResultWrap")) {
                        clickReconnect();
                        //slow down
                        findID("ResultWrap",2000);
                    }
                    break;
                }
            }
            sleep(1000);
        }
    }

    //理子活动脚本,闪退会自动重开,如果打输了基本上就是会浪费1点CP(拿不到后续节点,尤其是是boss战的奖励)
    function getCPCureRemainSeconds() {
        //注意:如果没有找到自回等待时间,也会返回3601秒
        let result = 3601;
        let cureRemainElement = findIDFast("cureRemain");
        if (cureRemainElement != null) {
            let text = getContent(cureRemainElement);
            let matched = text.match(/^\d{2}:\d{2}$/)[0];
            if (matched == null) return result;
            let minutes = matched.match(/^\d{2}/)[0];
            let seconds = matched.match(/\d{2}$/)[0];
            if (minutes == null || seconds == null) return result;
            let totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
            if (isNaN(totalSeconds) || totalSeconds < 0 || totalSeconds > 3600) return result;
            result = totalSeconds + 1;
        }
        return result;
    }
    function waitForCPRecoveryForSeconds(waitTotalSeconds) {
        //等待CP自回,但无视waitCP设置参数
        if (typeof waitTotalSeconds !== "number") waitTotalSeconds = 3601;
        for (let i=waitTotalSeconds,sleepSec=60; i>0; i-=sleepSec) {
            let waitSec = i % 60;
            let waitMin = (i - waitSec) / 60;
            toastLog("等待自回1CP...\n还有"+waitMin+"分钟"+waitSec+"秒");
            sleepSec = i > 60 ? 60 : i;
            sleep(sleepSec * 1000);
        }
        log("已自回1CP");
        return true;
    }
    function waitForCPRecovery() {
        //等待CP自回
        if (limit.waitCP) {
            return waitForCPRecoveryForSeconds(getCPCureRemainSeconds());
        } else {
            log("CP不足");
            return false;
        }
    }
    function refillCP() {
        //回复CP
        while (findFast(string.cp_exhausted) != null) {
            log("出现CP不足报错窗口,点击回复按钮...");
            click(convertCoords(clickSets.cpExhaustRefill));
            sleep(1000);
        }
        let cpRefillPopup = findPopupInfoDetailTitle(string.cp_refill_title);
        if (cpRefillPopup != null) {
            if (limit.drug5waitMinutes !== "") {
                let drug5waitMinutes = parseInt(limit.drug5waitMinutes);
                let cpCureRemainSeconds = getCPCureRemainSeconds();
                if (!isNaN(drug5waitMinutes) && drug5waitMinutes > 0 && drug5waitMinutes * 60 + 1 >= cpCureRemainSeconds) {
                    //若CP能在设置的分钟内能自回则等自回而不嗑药
                    while ((cpRefillPopup = findPopupInfoDetailTitle(string.cp_refill_title)) != null) {
                        //先关闭嗑药窗口
                        click(cpRefillPopup.close);
                        sleep(1500);
                    }
                    return waitForCPRecoveryForSeconds(cpCureRemainSeconds);
                }
            }
            if (isDrugEnabled(4)) {
                let isCPDrugExhausted = false;
                let attemptMax = 3;
                for (let attempt=0; attempt<attemptMax; attempt++) {
                    if (!id("cpTextWrap").findOnce()) {
                        updateDrugLimit(4);
                        break;
                    }
                    if (attempt == attemptMax - 1) {
                        isCPDrugExhausted = true;
                        toastLog("多次嗑CP药仍然没有反应,应该是CP药耗尽了");
                        break;
                    }
                    click(convertCoords(clickSetsMod.bpDrugConfirm))
                    sleep(1500)
                }
                while ((cpRefillPopup = findPopupInfoDetailTitle(string.cp_refill_title)) != null) {
                    click(isCPDrugExhausted ? cpRefillPopup.close : convertCoords(clickSetsMod.bpDrugRefilledOK))
                    sleep(1500)
                }
                log("磕CP药结束");
                if (isCPDrugExhausted) {
                    return waitForCPRecovery();
                } else {
                    return true;
                }
            } else {
                click(cpRefillPopup.close);
                log("设置的CP药已用完");
                return waitForCPRecovery();
            }
        }
        return false;
    }
    function dungeonEventRunnable() {
        initialize();

        requestTestReLaunchIfNeeded();//测试是否可以正常重开

        dialogs.alert("警告",
            "理子(DUNGEON类型)活动脚本【不支持】设置了替补队员的情况!否则在打输的情况下脚本将无法继续正常运行!\n"
            +"要运行这个脚本,请务必要撤下替补,这样虽然会在打输时浪费1CP,但不会阻碍脚本继续运行。");

        //刚点进活动,选择剧情/挑战区域的界面具有的特征控件文本
        const menuStateRegExps = [/^event_dungeon.*/];
        //进入活动地图后的特征控件ResID
        const mapStateIDs = ["resetPosition", "openBtn"];
        //进入结算界面后的特征控件ResID
        const battleRewardIDs = ["ResultWrap", "retryWrap", "hasTotalRiche"];
        //主菜单上的活动按钮
        const eventButtonPoint = convertCoords({x: 1620, y: 549, pos: "bottom"});
        const lengthOfSide = 620;//三角形边长
        const AltitudeOfTriangle = parseInt(lengthOfSide * Math.sqrt(3) / 2);//三角形高
        const initialPoint = {x: 960, y: 900, pos:"center"};//点击定位按钮,重置位置后,理子所在棋子的位置坐标
        //在跳棋棋盘(活动地图)上点击不同下一步的坐标
        const pointsOnChessboard = {
            initial: initialPoint,
            left: {x: initialPoint.x - AltitudeOfTriangle, y: initialPoint.y - lengthOfSide / 2, pos: "center"},
            right: {x: initialPoint.x + AltitudeOfTriangle, y: initialPoint.y - lengthOfSide / 2, pos: "center"},
            up: {x: initialPoint.x, y: initialPoint.y - AltitudeOfTriangle, pos: "center"},
            halfLeft: {x: initialPoint.x - AltitudeOfTriangle / 2, y: initialPoint.y - lengthOfSide / 4, pos: "center"},
            halfRight: {x: initialPoint.x + AltitudeOfTriangle / 2, y: initialPoint.y - lengthOfSide / 4, pos: "center"},
            halfUp: {x: initialPoint.x, y: initialPoint.y - AltitudeOfTriangle / 2, pos: "center"},
        };
        const presetRouteData = {
            regionNum: "12",
            description: "理子活动挑战12右路3宝箱",
            route: [
                {/*屋顶魔女的手下*/
                    move: "right",
                    edge: false,
                    type: "battle",
                },
                {/*Flower Speaker之谣*/
                    move: "right",
                    edge: false,
                    type: "battle",
                },
                {/*拿到第1个宝箱 +8叉签*/
                    move: "halfLeft",
                    edge: "right",
                    type: "treasure",
                },
                {/*遇到第1个陷阱 -7000HP*/
                    move: "halfLeft",
                    edge: false,
                    type: "trap",
                },
                {/*屋顶魔女的手下*/
                    move: "right",
                    edge: false,
                    type: "battle",
                },
                {/*沙地魔女*/
                    move: "left",
                    edge: "right",
                    type: "battle",
                },
                {/*拿到第2个宝箱 +8叉签*/
                    move: "halfRight",
                    edge: false,
                    type: "treasure",
                },
                {/*遇到第2个陷阱 -7000HP*/
                    move: "halfRight",
                    edge: false,
                    type: "trap",
                },
                {/*沙地魔女*/
                    move: "up",
                    edge: "right",
                    type: "battle",
                },
                {/*拿到第3个宝箱 +10叉签*/
                    move: "up",
                    edge: "right",
                    type: "treasure",
                },
                {/*屋顶魔女的手下*/
                    move: "left",
                    edge: "right",
                    type: "battle",
                },
                {/*屋顶魔女*/
                    move: "left",
                    edge: false,
                    type: "battle",
                },
            ],
        };

        //读取配置里的路线数据,如果没有,就询问是否用预置的
        var routeData = null;
        try {
            routeData = limit.dungeonEventRouteData === "" ? null : JSON.parse(limit.dungeonEventRouteData);
        } catch (e) {
            logException(e);
            toastLog("解析路线数据失败,停止运行");
            stopThread();
        }
        if (routeData == null) {
            if (dialogs.confirm("是否使用预置路线数据？", "是否使用预置的["+presetRouteData.description+"]？")) {
                routeData = presetRouteData;
            } else {
                let description = null;
                while (description == null || description === "") {
                    toast("请不要填入空值");
                    description = dialogs.rawInput("路线数据名称", "");
                }
                let regionNum = null;
                while (regionNum == null || isNaN(regionNum) || regionNum <= 0) {
                    toast("请填入一个正整数");
                    regionNum = parseInt(dialogs.rawInput("请输入区域编号(注意:如果当前游戏打开的是本次活动的挑战/剧情区域列表,那么请不要拖动列表!脚本无法点击屏幕范围外的项目!)", ""));
                }
                dialogs.alert("记录路线数据",
                    "脚本将从起始位置开始,询问在棋盘上每一步该怎么走,然后按照你的回答进行点击并记录步骤。\n"
                    +"注意!如果当前在剧情地图上并不是起始位置,请暂时先放弃这次记录的路线数据,然后请先手动完成这一次的所有战斗,之后再从头重新开始记录路线数据。\n"
                    +"对话框将会在5秒后重新出现。");
                let route = [];
                for (let isFinished=false; !isFinished; ) {
                    toast("对话框将在5秒后重新出现...");
                    sleep(5000);
                    if (route.length == 0 && mapStateIDs.find((id) => findIDFast(id)) == null) {
                        //游戏打开其他界面时很显然无法检测到活动地图的特征控件,所以要route.length == 0,避免在这里“死循环”
                        dialogs.alert("请先进入活动地图", "请先进入本次活动的剧情地图(也就是“跳棋棋盘”),务必要和之前输入的区域编号一致。");
                        continue;
                    }
                    if (!dialogs.confirm("第"+(route.length+1)+"步: 要继续记录路线数据吗？",
                        "如果战斗还没结算完成,或者看不清下一步会走到哪里,请点击\"取消\"(然后赶紧点掉结算界面、重新回到活动地图,并点击左下角的定位按钮),然后对话框将会在5秒后再次出现。\n"
                        +"如果出现意外情况,比如进入了错误的路线,请放弃这次记录的路线数据,下次再从头重新开始。"
                    )) {
                        continue;
                    }
                    while (findPopupInfoDetailTitle() != null) {
                        dialogs.alert("请先关闭弹窗");
                        sleep(2000);
                    }
                    let isGoingBack = false;
                    let currentMove = {};
                    while (currentMove.move == null) {
                        let dialogOptions = ["向左一整步", "向左半步", "向右一整步", "向右半步", "向上一整步", "向上半步", "没看清,等5秒后再问", "完成", "放弃"];
                        let dialogSelected = null;
                        dialogSelected = dialogOptions[dialogs.select("第"+(route.length+1)+"步: 移动方向", dialogOptions)];
                        if (dialogSelected != null) switch (dialogSelected) {
                            case "向左一整步":
                                currentMove.move = "left";
                                break;
                            case "向左半步":
                                currentMove.move = "halfLeft";
                                break;
                            case "向右一整步":
                                currentMove.move = "right";
                                break;
                            case "向右半步":
                                currentMove.move = "halfRight";
                                break;
                            case "向上一整步":
                                currentMove.move = "up";
                                break;
                            case "向上半步":
                                currentMove.move = "halfUp";
                                break;
                            case "没看清,等5秒后再问":
                                sleep(5000);
                                continue;
                            case "完成":
                                isFinished = true;
                                break;
                            case "放弃":
                                toastLog("放弃");
                                stopThread();
                                break;
                            default:
                                throw new Error("unknown dialogSelected");
                        }
                        if (dialogSelected != null) toastLog(dialogSelected);
                        if (isFinished) break;
                    }
                    if (!isFinished) while (currentMove.edge == null) {
                        let dialogOptions = ["左边缘", "右边缘", "不是边缘", "没看清,等5秒后再问"];
                        let dialogSelected = null;
                        dialogSelected = dialogOptions[dialogs.select("第"+(route.length+1)+"步: 当前处于地图边缘么？(比如往左拖动发现已经到顶,那就是右边缘)", dialogOptions)];
                        if (dialogSelected != null) switch (dialogSelected) {
                            case "左边缘":
                                currentMove.edge = "left";
                                break;
                            case "右边缘":
                                currentMove.edge = "right";
                                break;
                            case "不是边缘":
                                currentMove.edge = false;
                                break;
                            case "没看清,等5秒后再问":
                                sleep(5000);
                                continue;
                            default:
                                throw new Error("unknown dialogSelected");
                        }
                        if (dialogSelected != null) toastLog(dialogSelected);
                    }
                    if (!isFinished) while (currentMove.type == null) {
                        let dialogOptions = ["战斗", "宝箱", "回血", "地雷", "没看清,等5秒后再问"];
                        let dialogSelected = null;
                        dialogSelected = dialogOptions[dialogs.select("第"+(route.length+1)+"步: 移动后会进入什么", dialogOptions)];
                        if (dialogSelected != null) switch (dialogSelected) {
                            case "战斗":
                                currentMove.type = "battle";
                                break;
                            case "宝箱":
                                currentMove.type = "treasure";
                                break;
                            case "回血":
                                currentMove.type = "heal";
                                break;
                            case "地雷":
                                currentMove.type = "trap";
                                break;
                            case "没看清,等5秒后再问":
                                sleep(5000);
                                break;
                            default:
                                throw new Error("unknown dialogSelected");
                        }
                        if (dialogSelected != null) toastLog(dialogSelected);
                    }
                    if (!isFinished) {
                        while (findPopupInfoDetailTitle() != null) {
                            dialogs.alert("请先关闭弹窗");
                            sleep(2000);
                        }
                        let resetPositionButton = null;
                        while ((resetPositionButton = findIDFast("resetPosition")) == null) {
                            dialogs.alert("未找到重置位置的定位按钮");
                            toast("5秒后重试...");
                            sleep(5000);
                        }
                        toast("点击定位按钮,重置位置");
                        sleep(2000);
                        click(resetPositionButton.bounds().centerX(), resetPositionButton.bounds().centerY());
                        toast("在棋盘上点击第"+(route.length+1)+"步");
                        sleep(2000);
                        let unconvertedPoint = {};//需要先复制一遍,否则之前的步骤对坐标值的加减会累积
                        for (let key in pointsOnChessboard[currentMove.move]) unconvertedPoint[key] = pointsOnChessboard[currentMove.move][key];
                        switch (currentMove.edge) {
                            case "left":
                                unconvertedPoint.x -= 100;
                                break;
                            case "right":
                                unconvertedPoint.x += 100;
                                break;
                            case false:
                                break;
                            default:
                                throw new Error("unknown currentMove.edge value");
                        }
                        click(convertCoords(unconvertedPoint));
                        sleep(2000);
                        //可能点击了战斗,也可能点击了回血/宝箱/地雷
                        if (dialogs.confirm("点击位置正确么？",
                                "如果不正确,请点击\"取消\"。\n"
                                +"如果只是没点到,接下来重新记录这一步即可。\n"
                                +"如果出现意外情况,比如进入了错误的路线,请放弃这次记录的路线数据,下次再从头重新开始。"
                        )) {
                            while (findPopupInfoDetailTitle() != null) {
                                dialogs.alert("请关闭弹窗", "如果刚刚点击了战斗节点,请在这个对话框关闭后,在游戏中再点击一次\"确定\"进入战斗。非战斗节点也同理。");
                                sleep(2000);
                            }
                        } else {
                            toast("重新记录第"+(route.length+1)+"步");
                            continue;
                        }
                    }
                    //在路线中追加新节点
                    if (!isFinished) route.push(currentMove);
                    if (isFinished) {
                        if (route.length <= 1) {
                            toastLog("未记录任何数据,退出");
                            stopThread();
                        }
                        routeData = {
                            regionNum: regionNum,
                            description: description,
                            route: route,
                        };
                        limit.dungeonEventRouteData = JSON.stringify(routeData);
                        floatUI.storage.put("dungeonEventRouteData", limit.dungeonEventRouteData);
                        updateUI("dungeonEventRouteData", "setText", limit.dungeonEventRouteData);
                        backtoMain();
                        dialogs.alert("已保存路线数据", "请在战斗结束后重新启动脚本");
                        stopThread();
                    }
                }
            }
        }

        dialogs.alert("理子(DUNGEON类型)活动脚本",
            "路线名称: ["+routeData.description+"]\n"
            +"区域: ["+routeData.regionNum+"]\n"
            +"CP回复药: ["+(limit.drug5?"已启用,数量"+(limit.drug5num===""?"无限制":"限制为"+limit.drug5num+"个"):"已停用")+"]\n"
            +"等待CP自回分钟数: ["+(limit.drug5waitMinutes===""?"不等待,直接嗑药":limit.drug5waitMinutes)+"]\n"
            +"没药时等CP自回: ["+(limit.waitCP?"已启用":"已停用")+"]");

        //在活动地图上已经走了多少步
        var moveCount = null;
        while (moveCount == null || isNaN(moveCount) || moveCount < 0 || moveCount > routeData.route.length - 1) {
            toast("请输入一个非负整数,并且不能超出范围");
            moveCount = parseInt(dialogs.rawInput("请输入起始步数,也就是目前在活动地图上已经走了多少步？", "0"));
        }


        const STATE_CRASHED = 0;
        const STATE_LOGIN = 1
        const STATE_HOME = 2;
        const STATE_MENU = 3;
        const STATE_REGION_CONFIRM_START = 4;
        const STATE_TEAM = 5;
        const STATE_MAP = 6;
        const STATE_MOVE_POINT_CONFIRM = 7;
        const STATE_BATTLE = 8;
        const STATE_REWARD = 9;

        function detectState() {
            if (isGameDead()) return STATE_CRASHED;
            if (menuStateRegExps.find((regex) => matchFast(regex) == null) == null) return STATE_MENU;
            if (mapStateIDs.find((id) => findIDFast(id) == null) == null) return STATE_MAP;
            if (battleRewardIDs.find((id) => findIDFast(id)) != null) return STATE_REWARD;
            if (getAP() != null) return STATE_HOME;
            return STATE_BATTLE;//注意这里无法区分战斗状态和登录状态
        }

        var state = detectState();
        log("初始状态:"+state);
        switch (state) {
            case STATE_MENU:
                if (!dialogs.confirm("警告",
                    "检测到脚本启动时,游戏里打开的界面是本次活动的挑战/剧情区域列表。存在两个(潜在)问题:\n"
                    +"(1)脚本目前暂不支持拖动挑战/剧情区域列表,故无法点击列表中处于屏幕显示范围之外的区域。\n"
                    +"(2)因为游戏本身存在列表拖动bug,脚本通过无障碍服务获知的控件坐标数据也可能严重跑偏,为了避免点错,请最好回主页后重新在主菜单点击进入活动,然后避免拖动挑战/剧情区域列表。\n"
                    +"另外,如果之前已经选择进入了一个区域,请务必确保目前处于起始位置(或者输入了正确的起始步数),而且要保证这个区域和脚本使用的路线数据匹配！\n"
                    +"如果当前在剧情地图上并不是起始位置(或者输入了错误的起始步数),或者和脚本使用的路线数据并不匹配,请点击\"取消\"从而结束运行脚本,然后请先手动完成这一次的所有战斗,之后再启动脚本。\n"
                    +"点击\"确定\"继续运行脚本,\n"
                    +"点击\"取消\"结束运行脚本。"
                )) stopThread();
                break;
            case STATE_MAP:
                if (!dialogs.confirm("警告",
                    "检测到脚本启动时,游戏里打开的界面是本次活动的剧情地图(也就是“跳棋棋盘”)。\n"
                    +"请务必确保目前处于起始位置(或者输入了正确的起始步数)！\n"
                    +"如果当前在剧情地图上并不是起始位置(或者输入了错误的起始步数),或者和脚本使用的路线数据并不匹配,请点击\"取消\"从而结束运行脚本,然后请先手动完成这一次的所有战斗,之后再启动脚本。\n"
                    +"点击\"确定\"继续运行脚本,\n"
                    +"点击\"取消\"结束运行脚本。"
                )) stopThread();
                break;
            case STATE_HOME:
                if(!dialogs.confirm("警告",
                    "检测到脚本启动时,游戏里打开的界面【可能】是首页。\n"
                    +"如果当前确实在首页,请点击\"确定\",然后脚本会继续点击主菜单中的活动按钮。\n"
                    +"如果当前并不是首页,请点击\"取消\"从而结束运行脚本。\n"
                    +"另外,如果之前已经选择进入了一个区域,请务必确保目前处于起始位置(或者输入了正确的起始步数),而且要保证这个区域和脚本使用的路线数据匹配！\n"
                    +"如果当前在剧情地图上并不是起始位置(或者输入了错误的起始步数),或者和脚本使用的路线数据并不匹配,请点击\"取消\"从而结束运行脚本,然后请先手动完成这一次的所有战斗,之后再启动脚本。\n"
                )) stopThread();
                break;
            case STATE_BATTLE:
            case STATE_REWARD:
            default:
                //
                //即便是脚本看着战斗结束了,也不知道现在在棋盘上走到哪里了
                dialogs.alert("警告",
                    "脚本不太清楚当前游戏处于什么状态。\n"
                    +"请点击\"确定\"从而结束运行脚本。\n"
                    +"然后,请(先手动把当前的所有战斗完成,然后再)在本次活动的【挑战/剧情区域列表】或者是【剧情地图(也就是“跳棋棋盘”)】这两种界面启动脚本。\n"
                    +"而且,\n"
                    +"(1)对于【挑战/剧情区域列表】,为了避免触发列表拖动bug,请不要拖动列表。而且很遗憾,对于那些屏幕范围之外的、不拖动列表就显示不出来的挑战/剧情区域,目前脚本并不支持点击进入。\n"
                    +"(2)对于【剧情地图(也就是“跳棋棋盘”)】,请务必确保处于起始位置。如果不是,请先手动完成这一次的所有战斗,完成之后再启动脚本。"
                );
                stopThread();
        }
        var last_state = state;

        var currentMove = null;

        var battleStartTime = null;

        var battleCount = 0;
        var lastBattleCountOnKillGame = 0;
        var menuStateAbnormalityCount = 0;

        while (true) {
            //检测游戏是否闪退
            if (state != STATE_CRASHED && state != STATE_LOGIN && isGameDead(false)) {
                state = STATE_CRASHED;
            }

            //离开战斗状态时重置battleStartTime
            if (last_state == STATE_BATTLE && state != STATE_BATTLE) {
                battleStartTime = null;
            }
            //检测开始战斗时是否假死
            if (limit.dungeonBattleTimeoutSec !== "" && state == STATE_BATTLE) {
                let currentTime = new Date().getTime();
                let dungeonBattleTimeoutSec = parseInt(limit.dungeonBattleTimeoutSec);
                if (isNaN(dungeonBattleTimeoutSec) || dungeonBattleTimeoutSec <= 0) dungeonBattleTimeoutSec = 1200;
                if (battleStartTime != null && currentTime - battleStartTime > dungeonBattleTimeoutSec * 1000) {
                    log("战斗假死检测超时时间已到");
                    killGame();
                    state = STATE_CRASHED;
                    battleStartTime = null;
                }
            }

            //每隔几场战斗就杀进程重开一次
            if (limit.dungeonBattleCountBeforeKill !== "") {
                let currentTime = new Date().getTime();
                let dungeonBattleCountBeforeKill = parseInt(limit.dungeonBattleCountBeforeKill);
                if (isNaN(dungeonBattleCountBeforeKill) || dungeonBattleCountBeforeKill <= 0) dungeonBattleCountBeforeKill = 20;
                if (battleCount - lastBattleCountOnKillGame >= dungeonBattleCountBeforeKill) {
                    log("现在总共进行了"+battleCount+"场战斗,上次杀进程时总共进行了"+lastBattleCountOnKillGame+"场战斗,再次杀进程...");
                    killGame();
                    state = STATE_CRASHED;
                    lastBattleCountOnKillGame = battleCount;
                }
            }

            last_state = state;

            //然后根据目前状态分情况处理
            switch (state) {
                case STATE_CRASHED: {
                    clickAerrPopup();//先点掉系统的崩溃提示弹窗
                    switch (isGameDead(2000)) {
                        case "crashed":
                            log("等待5秒后重启游戏...");
                            sleep(5000);
                            reLaunchGame();
                            log("重启完成,再等待2秒...");
                            sleep(2000);
                            break;
                        case false: //isGameDead不知道游戏登录了没
                        case "logged_out":
                            log("闪退检测完成,进入登录页面");
                            state = STATE_LOGIN;
                            break;
                        default:
                            log("游戏闪退状态未知");
                            stopThread();
                    }
                    break;
                }
                case STATE_LOGIN: {
                    clickAerrPopup();//先点掉系统的崩溃提示弹窗
                    if (isGameDead(2000) == "crashed") {
                        state = STATE_CRASHED;
                        break;
                    }
                    if (!reLogin()) {
                        killGame(string.package_name);
                        state = STATE_CRASHED;
                        break;
                    }
                    state = detectState();
                    break;
                }
                case STATE_HOME: {
                    log("点击主菜单上的活动按钮");
                    click(eventButtonPoint);
                    log("等待10秒...");
                    sleep(10000);
                    state = detectState();
                    break;
                }
                case STATE_MENU: {
                    if (findPopupInfoDetailTitle(string.region_lose) != null) {
                        log("出现\"攻略区域失败\"弹窗,尝试关闭...");
                        click(convertCoords(clickSets.backToHomepage));
                        sleep(1000);
                        break;
                    }
                    if (findFast(string.battle_confirm) != null) {
                        log("进入区域选择确认");
                        state = STATE_REGION_CONFIRM_START;
                        break;
                    }
                    if (findFast(string.start) != null) {
                        log("进入队伍调整");
                        state = STATE_TEAM;
                        break;
                    }

                    let regionEntry = findFast(string.region+routeData.regionNum);
                    if (regionEntry != null) {
                        log("点击区域"+routeData.regionNum);
                        click(regionEntry.bounds().centerX(), regionEntry.bounds().centerY());
                        sleep(1000);
                        break;
                    }
                    break;
                }
                case STATE_REGION_CONFIRM_START: {
                    if (findFast(string.start) != null) {
                        //点击确定按钮时,可能误触到队伍调整中的某个队员的位置,导致魔法少女选择器打开
                        toastLog("等待5秒...");
                        sleep(5000);//比较卡的机器也许等魔法少女选择器弹出也需要一段时间
                        let charaListElms = findIDFast("charaListElms");
                        if (charaListElms != null && charaListElms.bounds().height() > 8) {
                            toastLog("应该是点击确定时,误触打开了魔法少女选择器,\n杀进程重开...");
                            killGame();
                            state = STATE_CRASHED;
                            break;
                        }
                        log("进入队伍调整");
                        state = STATE_TEAM;
                        break;
                    }

                    let OKButton = findFast(string.battle_confirm);
                    if (OKButton != null) {
                        log("点击确定");
                        click(OKButton.bounds().centerX(), OKButton.bounds().centerY());
                        sleep(2000);
                        while (findFast(string.cp_exhausted)) {
                            log("CP已耗尽");
                            if (!refillCP()) {
                                toastLog("回复CP失败,结束运行");
                                stopThread();
                            }
                            log("回复CP后再次点击确定");
                            click(OKButton.bounds().centerX(), OKButton.bounds().centerY());
                            sleep(1000);
                        }
                        break;
                    }
                    break;
                }
                case STATE_TEAM: {
                    let startButton = findFast(string.start);
                    if (startButton != null) {
                        log("点击开始");
                        click(startButton.bounds().centerX(), startButton.bounds().centerY());
                        sleep(1000);
                        break;
                    }
                    log("队伍调整的开始按钮消失了,重新检测状态");
                    //正常情况下应该进入地图才对,貌似有时候无障碍服务抽风了,就会因为什么控件都检测不到而误检测为战斗状态
                    let detectedState = detectState();
                    if (detectedState != STATE_MAP && detectedState != STATE_MENU) {
                        log("detectState()返回了既不是STATE_MAP也不是STATE_MENU的结果:["+detectedState+"]");
                        if (menuStateAbnormalityCount++ < 5) {
                            toastLog("等待2秒后重试...");
                            sleep(2000);
                        } else {
                            toastLog("多次重试后仍然不正常,杀进程重开游戏...");
                            killGame();
                            state = STATE_CRASHED;
                            menuStateAbnormalityCount = 0;
                        }
                    } else {
                        state = detectedState;
                        menuStateAbnormalityCount = 0;
                    }
                    break;
                }
                case STATE_MAP: {
                    currentMove = routeData.route[moveCount];
                    log("第"+(moveCount+1)+"步骤 "+currentMove.type+"类型 "+currentMove.move+"方向 "+currentMove.edge+"边缘");

                    if (findPopupInfoDetailTitle(string.move_to_node) != null) {
                        state = STATE_MOVE_POINT_CONFIRM;
                        break;
                    }

                    let resetPositionButton = findIDFast("resetPosition");
                    if (resetPositionButton != null) {
                        log("点击定位按钮,重置位置");
                        click(resetPositionButton.bounds().centerX(), resetPositionButton.bounds().centerY());
                        sleep(1000);
                        log("在棋盘上点击第"+(moveCount+1)+"步");
                        let unconvertedPoint = {};//需要先复制一遍,否则之前的步骤对坐标值的加减会累积
                        for (let key in pointsOnChessboard[currentMove.move]) unconvertedPoint[key] = pointsOnChessboard[currentMove.move][key];
                        switch (currentMove.edge) {
                            case "left":
                                unconvertedPoint.x -= 100;
                                break;
                            case "right":
                                unconvertedPoint.x += 100;
                                break;
                            case false:
                                break;
                            default:
                                throw new Error("unknown currentMove.edge value");
                        }
                        click(convertCoords(unconvertedPoint));
                        sleep(1000);
                    } else {
                        log("未找到重置位置的定位按钮");
                        sleep(1000);
                    }
                    break;
                }
                case STATE_MOVE_POINT_CONFIRM: {
                    //必须先发现“节点移动”弹窗出现过一次才应该转到这里
                    //这里本身无法保证上述条件,需要外边跳转进来时注意
                    if (findPopupInfoDetailTitle(string.move_to_node) != null) {
                        log("发现\"节点移动\"弹窗,点击\"确定\"");
                        click(convertCoords(clickSets.recover_battle));
                        sleep(1000);
                    } else {
                        log("\"节点移动\"弹窗已消失");
                        switch (currentMove.type) {
                            case "battle":
                                log("进入战斗状态");
                                state = STATE_BATTLE;
                                battleStartTime = new Date().getTime();
                                sleep(8000);//等待活动地图上出现BATTLE大字的动画效果过去、真正进入战斗
                                break;
                            case "treasure":
                            case "heal":
                            case "trap":
                                let dungeonClickNonBattleNodeWaitSec = parseInt(limit.dungeonClickNonBattleNodeWaitSec);
                                if (isNaN(dungeonClickNonBattleNodeWaitSec) || dungeonClickNonBattleNodeWaitSec <= 0) dungeonClickNonBattleNodeWaitSec = 8;
                                log("这一步不是战斗而是"+currentMove.type+" 等待"+dungeonClickNonBattleNodeWaitSec+"秒...");
                                sleep(dungeonClickNonBattleNodeWaitSec * 1000);
                                moveCount++;
                                state = STATE_MAP;
                                break;
                            default:
                                throw new Error("unknown currentMove.type value");
                        }
                    }
                    break;
                }
                case STATE_BATTLE: {
                    if (battleRewardIDs.find((id) => findIDFast(id)) != null) {
                        log("战斗已结束,进入结算");
                        state = STATE_REWARD;
                        battleCount++;//这只是赢了的情况,还有输了的情况
                        if (moveCount == routeData.route.length - 1) {
                            toastLog("已完成这一轮的所有战斗");
                            moveCount = 0;
                        } else {
                            moveCount++;
                        }
                        break;
                    }
                    if (findPopupInfoDetailTitle(string.region_lose) != null) {
                        log("出现\"攻略区域失败\"弹窗");
                        state = STATE_MENU;
                        battleCount++;//这只是输了的情况,还有赢了的情况
                        moveCount = 0;
                        break;
                    }
                    if (mapStateIDs.find((id) => findIDFast(id) == null) == null) {
                        //可能是(这一次战斗打赢了,但)点击掉线重连时意外点掉了结算,于是就错过了结算界面没检测到,
                        //也有可能是在设置了替补(而且替补没死)的情况下打输了。
                        //(以上两种情况无法分辨,所以脚本目前只能是不支持设置替补)
                        log("出现了活动地图的所有特征控件");
                        state = STATE_MAP;
                        battleCount++;
                        if (moveCount == routeData.route.length - 1) {
                            toastLog("已完成这一轮的所有战斗");
                            moveCount = 0;
                        } else {
                            moveCount++;
                        }
                        break;
                    }
                    if (limit.autoReconnect) {
                        clickReconnect();
                    }
                    sleep(1000);
                    break;
                }
                case STATE_REWARD: {
                    if (battleRewardIDs.find((id) => findIDFast(id)) == null) {
                        let dungeonPostRewardWaitSec = parseInt(limit.dungeonPostRewardWaitSec);
                        if (isNaN(dungeonPostRewardWaitSec) || dungeonPostRewardWaitSec <= 0) dungeonPostRewardWaitSec = 8;
                        log("已退出战斗结算界面,再等待"+dungeonPostRewardWaitSec+"秒...");
                        sleep(dungeonPostRewardWaitSec * 1000);//防止误判成STATE_HOME
                        state = detectState();
                        break;
                    }
                    if (findFast("OK")) {
                        log("点击玩家升级确认");
                        click(convertCoords(clickSets.levelup));
                        sleep(1000);
                    } else {
                        log("点击断线重连按钮所在区域");
                        click(convertCoords(clickSets.reconection));
                        sleep(1000);
                    }
                    break;
                }
                default: {
                    toastLog("错误:未知状态");
                    stopThread();
                }
            }
        }
    }

    function killGame(specified_package_name) {
        if (specified_package_name == null && last_alive_lang == null) {
            toastLog("不知道要强关哪个区服，退出");
            stopThread();
        }
        var name = specified_package_name == null ? strings[last_alive_lang][strings.name.findIndex((e) => e == "package_name")] : specified_package_name;
        toastLog("强关游戏...");
        if (limit.privilege && limit.rootForceStop) {
            log("使用am force-stop、killall和pkill命令...");
            while (true) {
                resetFatalKillerWatchDog(); //重设套娃监工WATCHDOG
                privShell("am force-stop "+name);
                sleep(500);
                privShell("killall "+name);
                privShell("pkill "+name);
                sleep(500);
                if (isGameDead(2000)) break;
                log("游戏仍在运行,再次尝试强行停止...");
            }
        } else {
            toastLog("为了有权限杀死进程,需要先把游戏切到后台...");
            while (true) {
                resetFatalKillerWatchDog(); //重设套娃监工WATCHDOG
                backtoMain();
                sleep(2000);
                if (detectGameLang() == null) break;
                log("游戏仍在前台...");
            };
            log("再等待2秒...");
            sleep(2000);
            killBackground(name);
            resetFatalKillerWatchDog(); //重设套娃监工WATCHDOG
            log("已调用杀死后台进程，等待5秒...");
            sleep(5000);
            resetFatalKillerWatchDog(); //重设套娃监工WATCHDOG
        }
    }

    function reLaunchGame(specified_package_name) {
        if (specified_package_name == null && last_alive_lang == null) {
            toastLog("不知道要重启哪个区服,退出");
            stopThread();
        }
        toastLog("重新启动游戏...");
        var it = new Intent();
        var name = specified_package_name == null ? strings[last_alive_lang][strings.name.findIndex((e) => e == "package_name")] : specified_package_name;
        log("app.launch("+name+")");
        app.launch(name);//是不是真的启动成功，在外边检测
        log("重启游戏完成");
        return true;
    }

    function reLogin() {
        //循环点击继续战斗按钮位置（和放弃断线重连按钮位置重合），直到能检测到AP
        if (last_alive_lang == null) {
            toastLog("不知道要重新登录哪个区服,退出");
            stopThread();
        }

        var startTime = new Date().getTime();

        const recoverOrAbandonBtn = {
            recover: {
                description: "恢复战斗",
                convertedPoint: convertCoords(clickSets.recover_battle),
            },
            abandon: {
                description: "放弃战斗",
                convertedPoint: convertCoords(clickSets.reconection),
            },
        }
        var isRecoverBtnClicked = false;

        toastLog("重新登录...");
        while (true) {
            resetFatalKillerWatchDog(); //重设套娃监工WATCHDOG
            if (isGameDead(1000) == "crashed") {
                log("检测到游戏再次闪退,无法继续登录");
                return false;
            }
            var found_popup = findPopupInfoDetailTitle(null, 1000);
            if (found_popup != null) {
                log("发现弹窗 标题: \""+found_popup.title+"\"");
                let expected_titles = [];
                for (let error_type of ["connection_lost", "auth_error", "generic_error", "error_occurred", "story_updated", "unexpected_error"]) {
                    expected_titles.push(string[error_type]);
                }
                let matched_title = expected_titles.find((val) => val == found_popup.title);
                if (matched_title != null) {
                    log("弹窗标题\""+matched_title+"\",没有关闭按钮,只有回首页按钮,点击回首页...");
                    click(convertCoords(clickSets.backToHomepage));
                } else {
                    log("弹窗标题为\""+found_popup.title+"\",尝试关闭...");
                    click(found_popup.close);
                }
                log("等待2秒...");
                sleep(2000);
                continue;
            }

            for (let resID of ["ResultWrap", "hasTotalRiche"]) {
                if (findID(resID, 200)) {
                    battle_end_found = true;
                    log("已进入战斗结算");
                    return false;
                }
            }

            var apinfo = getAP(200);
            var button = null;
            if (apinfo != null) {
                log("当前AP:"+apinfo.value+"/"+apinfo.total);
            } else {
                button = findID("nextPageBtn", 200);
            }
            if (apinfo != null || button != null) {
                toastLog("重新登录完成");
                return true;
            }

            let elapsedTime = new Date().getTime() - startTime;
            if (elapsedTime > 10 * 60 * 1000) {
                toastLog("超过10分钟没有登录成功");
                return false;//调用者会杀进程
            }

            if (limit.reLoginNeverAbandon) {
                let btn = recoverOrAbandonBtn.recover;
                log("点击"+btn.description+"按钮区域...");
                click(btn.convertedPoint);
                log("点击"+btn.description+"按钮区域完成,等待1秒...");
                sleep(1000);
            } else if (elapsedTime > 60 * 1000) {
                let btnName = null;
                if (!isRecoverBtnClicked) {
                    //“恢复战斗”按钮和断线重连的“否”重合，很蛋疼，但是没有控件可以检测，没办法
                    //不过恢复战斗又掉线的几率并不高，而且即便又断线了，点“否”后游戏会重新登录，然后还是可以再点一次“恢复战斗”
                    //只有第一次点击恢复战斗按钮,然后就改为总是点击放弃战斗按钮,这样才能避免误触碎钻复活确认
                    isRecoverBtnClicked = true;
                    log("超过1分钟还没登录成功,准备点击一次恢复战斗按钮");
                    btnName = "recover"
                } else {
                    btnName = "abandon";
                }
                let btn = recoverOrAbandonBtn[btnName];
                log("点击"+btn.description+"按钮区域...");
                click(btn.convertedPoint);
                log("点击"+btn.description+"按钮区域完成,等待1秒...");
                sleep(1000);
            }
            log("点击OK按钮区域...");
            click(convertCoords(clickSets.dataDownloadOK));
            log("点击OK按钮区域完成,等待1秒...");
            sleep(1000);
            log("点击战斗已结束OK按钮区域...");
            click(convertCoords(clickSets.battleFinishedOK));
            log("点击战斗已结束OK按钮区域完成,等待1秒...");
            sleep(1000);
        }
        return false;
    }

    //在logcat里监控游戏是否崩溃，在游戏崩溃后补刀杀掉游戏进程（因为貌似am force-stop也可能杀不掉），
    //并（重新）启动脚本（以防游戏崩溃时顺便带崩脚本），然后交给recoverLastWork函数
    //这里存在一个已知问题：脚本进程并没有重启，于是貌似脚本UI在这种重启后存在内存泄漏问题
    function startFatalKillerShellScript(specified_package_name) {
        if (specified_package_name == null && last_alive_lang == null) {
            toastLog("不知道在Shell脚本中要监控哪个区服,退出");
            stopThread();
        }
        var name = specified_package_name == null ? strings[last_alive_lang][strings.name.findIndex((e) => e == "package_name")] : specified_package_name;
        var filePath = "/data/local/tmp/auto_magireco_fatal_killer.sh";
        var selfProcessName = context.getPackageName();
        var scriptProcessName = selfProcessName+":script";
        var content = "#!/system/bin/sh"
            +"\ndonothing() { echo -ne \"SIGHUP received.\\n\"; }"
            +"\ntrap 'donothing' SIGHUP"
            +"\nmkdir /data/local/tmp/auto_magireco_fatal_killer.lock || sleep 1 && if [ -f /data/local/tmp/auto_magireco_fatal_killer.pid ]; then"
            +"\n    LAST_PID=$(cat /data/local/tmp/auto_magireco_fatal_killer.pid);"
            +"\n    if [ -f /proc/${LAST_PID}/cmdline ]; then"
            +"\n        LAST_CMDLINE=$(cat \"/proc/${LAST_PID}/cmdline\");"
            +"\n        if [[ \"$LAST_CMDLINE\" == *\"auto_magireco_fatal_killer\"* ]]; then"
            +"\n            if [[ $1 == \"stop\" ]]; then"
            +"\n                echo -ne \"Killing PID=${LAST_PID} ... \";"
            +"\n                kill \"${LAST_PID}\";"
            +"\n                rmdir /data/local/tmp/auto_magireco_fatal_killer.lock;"
            +"\n                echo -ne \"Done. Exit.\\n\";"
            +"\n                exit 0;"
            +"\n            fi"
            +"\n            echo -ne \"Already running, PID=${LAST_PID}. Exit now.\";"
            +"\n            exit 0;"
            +"\n        fi"
            +"\n    fi"
            +"\nfi"
            +"\nif [[ $1 == \"stop\" ]]; then"
            +"\n    echo -ne \"Stopped.\\n\";"
            +"\n    exit;"
            +"\nfi"
            +"\n"
            +"\necho test_grep | grep -o test_grep || exit -1;"
            +"\nWATCHDOG=0;"
            +"\nline_on_last_reset=\"\";"
            +"\nwhile true; do"
            +"\n    sleep 3;"
            +"\n    last_line=\"$(logcat -d -t 9999 *:V | grep -o momoe_auto_magireco_task_alive.* | tail -n1)\";"
            +"\n    if [[ \"$last_line\" != \"$line_on_last_reset\" ]]; then"
            +"\n        line_on_last_reset=\"$last_line\";"
            +"\n        WATCHDOG=0;"
            +"\n    else"
            +"\n        if ((WATCHDOG > 20)); then"
            +"\n            DATESTR=$(date);"
            +"\n            echo -ne \"${DATESTR} \";"
            +"\n            echo -ne \"Killing "+selfProcessName+" ... \";"
            +"\n            killall "+selfProcessName+" || echo -ne \"[killall failed]\";"
            +"\n            pkill "+selfProcessName+" || echo -ne \"[pkill failed]\";"
            +"\n            echo -ne \"Killing "+scriptProcessName+" ... \";"
            +"\n            killall "+scriptProcessName+" || echo -ne \"[killall failed]\";"
            +"\n            pkill "+scriptProcessName+" || echo -ne \"[pkill failed]\";"
            +"\n            echo -ne \"Killing "+name+" ... \";"
            +"\n            killall "+name+" || echo -ne \"[killall failed]\";"
            +"\n            pkill "+name+" || echo -ne \"[pkill failed]\";"
    +deObStr("\n            echo -ne \"Done, restarting CwvqLU ... \";")
            +"\n            am start -n \""+context.getPackageName()+"/"+splashActivityName+"\" || echo -ne \"[am start failed]\";"
            +"\n            echo -ne \"Done.\\n\";"
            +"\n            exit 0;"
            +"\n        fi;"
            +"\n    fi;"
            +"\n    echo WATCHDOG=$((WATCHDOG++));"
            +"\ndone &"
            +"\nPID=$!;"
            +"\necho \"${PID}\" > /data/local/tmp/auto_magireco_fatal_killer.pid;"
            +"\n"
        let binaryCopyFromPath = files.cwd()+"/bin/auto_magireco_fatal_killer.sh";
        files.ensureDir(binaryCopyFromPath);
        files.create(binaryCopyFromPath);
        files.write(binaryCopyFromPath, content);
        normalShell("chmod 644 "+binaryCopyFromPath);
        if (limit.privilege != null) {
            privShell("cat \""+binaryCopyFromPath+"\" > \""+filePath+"\"");
            privShell("chmod 755 "+filePath);
            var shellcmd = "runbg() { \""+filePath+"\" > /dev/null & }; runbgbg() { runbg & }; runbgbg & exit;\n";
            let t = threads.start(function () {privShell(shellcmd);});
            t.waitFor();
            log("已用root或adb权限启动shell脚本监工");
        } else {
            log("没有root或adb权限,无法启动shell脚本监工");
        }
    }
    stopFatalKillerShellScript = function () {
        let shellcmds = [
            "/data/local/tmp/auto_magireco_fatal_killer.sh stop",
            "killall auto_magireco_fatal_killer.sh",
        ];
        if (limit.privilege != null) {
            log("停止shell脚本监工...");
            shellcmds.forEach((shellcmd) => {
                privShell(shellcmd);
            });
        } else {
            log("没有root或adb权限,无法停止shell脚本监工");
        }
    }
    var lastFatalKillerWatchDogResetTime = new Date().getTime();
    function resetFatalKillerWatchDog() {
        if (!limit.autoRecover) return;
        let currentTime = new Date().getTime();
        if (currentTime - lastFatalKillerWatchDogResetTime > 3000) {
            privShell("log -p v momoe_auto_magireco_task_alive_"+currentTime);
            lastFatalKillerWatchDogResetTime = currentTime;
        }
    }

    function getScreenParams() {
        if (screen != null && gameoffset != null)
            return JSON.stringify({screen: screen, gameoffset: gameoffset});
    }

    function requestPrivilegeIfNeeded() {
        if (limit.privilege) return true;

        if (limit.rootForceStop || limit.firstRequestPrivilege) {
            limit.firstRequestPrivilege = false;
            if (dialogs.confirm("提示", "如果没有root或adb权限,\n部分模拟器等环境下可能无法杀进程强关游戏！真机则大多没有这个问题（但游戏不能被锁后台）。\n要使用root或adb权限么?"))
            {
                limit.firstRequestPrivilege = true;//如果这次没申请到权限，下次还会提醒
                limit["rootForceStop"] = true;
                floatUI.storage.put("rootForceStop", limit["rootForceStop"]);
                updateUI("rootForceStop", "setChecked", limit["rootForceStop"]);
                if (requestShellPrivilegeThread != null && requestShellPrivilegeThread.isAlive()) {
                    toastLog("已经在尝试申请root或adb权限了\n请稍后重试");
                } else {
                    requestShellPrivilegeThread = threads.start(requestShellPrivilege);
                    requestShellPrivilegeThread.waitFor();
                    threads.start(function () {
                        requestShellPrivilegeThread.join();
                        enableAutoService();
                    });
                }
                return false;//等到权限获取完再重试
            } else {
                limit.firstRequestPrivilege = false;//下次不会提醒了
                limit["rootForceStop"] = false;
                floatUI.storage.put("rootForceStop", limit["rootForceStop"]);
                updateUI("rootForceStop", "setChecked", limit["rootForceStop"]);
            }
        }
        return true;//可能没有特权，但用户选择不获取特权
    }

    //当前选关动作数据(预设或录制)
    var lastOpList = null;
    //用到预设数据时,需要先备份当前的非预设数据
    var lastNonPresetOpList = null;
    //标记当前选关动作数据是不是预设的
    var isLastOpListNonPreset = false;
    //默认动作录制数据保存位置
    var savedLastOpListPath = files.join(engines.myEngine().cwd(), "lastRecordedSteps.txt");

    //从文件读取上次录制的数据
    function loadOpList(justFileContent) {
        try {
            if (!files.isFile(savedLastOpListPath)) {
                toastLog("未找到动作录制数据文件");
                return null;
            }
        } catch (e) {
            logException(e);
            log("loadOpList中调用files.isFile时出错");
            return null;
        }

        let file_content = null;
        try {
            file_content = files.read(savedLastOpListPath);
        } catch (e) {
            logException(e);
            log("loadOpList读取文件时失败");
            return null;
        }
        if (justFileContent) return file_content;

        let loadedOpList = null;
        try {
            loadedOpList = JSON.parse(file_content);
        } catch (e) {
            logException(e);
            log("loadOpList解析JSON时失败");
            loadedOpList = null;
        }
        if (loadedOpList != null) return loadedOpList;
    }

    //保存上次录制的数据
    function saveOpList(opList) {
        if (opList == null) opList = lastOpList;//这里不应该传入stringify过的字符串
        if (opList == null) {
            toastLog("没有动作录制数据,无法保存");
            return false;
        }
        let opListStringified = JSON.stringify(opList);
        files.write(savedLastOpListPath, opListStringified);
        if (files.isFile(savedLastOpListPath)) {
            let file_content = files.read(savedLastOpListPath);
            if (file_content != null && file_content != "" && file_content == opListStringified) {
                toastLog("已保存动作录制数据");
                return true;
            } else {
                toastLog("保存动作录制数据时出错");
                if (!files.remove(savedLastOpListPath)) {
                    toastLog("无法删除有问题的动作录制数据文件");
                }
                return false;
            }
        } else {
            toastLog("无法保存动作录制数据:\n创建文件失败");
            return false;
        }
    }

    function chooseAction(step, isEventTypeBRANCH) {
        var result = null;
        while (true) {
            let options = ["点击", "滑动", "等待", "检测文字是否出现", "结束", "重录上一步", "放弃录制"];
            let actions = ["click", "swipe", "sleep", "checkText", "exit", "undo", "abandon"];
            if (isEventTypeBRANCH) {
                options.splice(2, 0, "在杜鹃花型活动地图上点击选关");
                actions.splice(2, 0, "BRANCHclick");
            }
            let selected = dialogs.select("请选择下一步(第"+(step+1)+"步)要录制什么动作", options);
            selected = parseInt(selected);
            if (isNaN(selected)) continue;
            result = actions[selected];
            if (result != null) break;
        }
        return result;
    }

    function getTimestamp() {
        let d = new Date();
        let result = "";
        result += d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
        result += "_";
        result += d.getHours()+"-"+d.getMinutes()+"-"+d.getSeconds();
        return result;
    }

    function recordOperations() {
        if (!requestPrivilegeIfNeeded()) {
            log("用户选择获取特权,但还没获取到,退出录制");
            stopThread();//等到权限获取完再重试
            return;
        }

        initialize();//不然的话string.package_name没更新

        let currentScreenParams = getScreenParams();
        if (currentScreenParams == null || currentScreenParams == "") {
            toastLog("获取屏幕参数失败,无法录制");
            return;
        }

        var result = {
            package_name: string.package_name,
            //现在的convertCoords只能从1920x1080转到别的分辨率，不能逆向转换
            //如果以后做了reverseConvertCoords，那就可以把isGeneric设为true了，然后录制的动作列表可以通用
            date: getTimestamp(),
            isGeneric: false,
            screenParams: currentScreenParams,
            defaultSleepTime: 1500,
            isEventTypeBRANCH: false,//杜鹃花型活动
            steps: []
        }
        while (true) {
            let result = dialogs.confirm("请务必先回到首页再开始录制！", "请确保游戏已经回到首页,然后才能点\"确定\"。\n否则请点\"取消\",然后将会在5秒后再次询问。");
            if (result) break;
            toast("5秒后会再次询问");
            sleep(5000);
        }
        let new_sleep_time = -1;
        do {
            new_sleep_time = dialogs.rawInput("每一步操作之间的默认等待时长设为多少毫秒？（除了强制要求的500毫秒安全检查之外）", "1500");
            new_sleep_time = parseInt(new_sleep_time);
            if (isNaN(new_sleep_time) || new_sleep_time <= 0) {
                toastLog("请输入一个正整数");
                continue;
            }
        } while (new_sleep_time <= 0 || isNaN(new_sleep_time));
        result.defaultSleepTime = new_sleep_time;
        toastLog("每一步操作之间将会等待"+result.defaultSleepTime+"毫秒");

        let isEventTypeBRANCH = null;
        do {
            isEventTypeBRANCH = dialogs.confirm("要录制的是杜鹃花型活动的选关动作么？",
                "如果是,请点\"确定\"。\n"
                +"如果并不是杜鹃花型活动,请点\"取消\"。\n"
                +"\n"
                +"杜鹃花型活动选关步骤一般是:\n"
                +"1.从首页点进活动地图,\n"
                +"2.(如果有需要)点击切换剧情第一/二部,\n"
                +"3.(如果有需要)拖动活动地图,\n"
                +"4.最后一步是[在杜鹃花型活动地图上点击选关]\n"
                +"注意:不需要专门去录制点击开始按钮,脚本自己会去点!"
            );
        } while (isEventTypeBRANCH !== true && isEventTypeBRANCH !== false);
        result.isEventTypeBRANCH = isEventTypeBRANCH;
        toastLog("要录制的【"+(result.isEventTypeBRANCH?"是":"不是")+"】\n杜鹃花型活动的选关动作");

        if (!result.isEventTypeBRANCH) {
            dialogs.alert("小贴士",
                "录制下来的选关动作一般包含这几个步骤:\n"
                +"1.在首页点击,进入主线/支线/活动剧情,\n"
                +"2.点击选择要打的关卡所在的章节,\n"
                +"3.利用\"检测文字是否出现\"来确保章节没有选错,如果检测到正确的章节文字就\"继续回放下一步\",检测不到就\"结束回放,报告失败\"并\"杀进程重开游戏\",\n"
                +"  注意: 在关卡列表这一步,只可以检测【章节名】,暂时不要检测【关卡名】。不是说关卡名不需要检测,关卡名是必须要检测的,但请在后面进入助战选择后的步骤中再检测,原因是游戏中存在列表拖动bug:\n"
                +"     (1)列表可能稍微拖动一点点就滑出去一大截;\n"
                +"     (2)重放拖动操作时,可能偶尔会没效果;\n"
                +"     (3)即便看上去拖动正常,脚本通过无障碍服务获知的控件坐标数据也可能严重跑偏,比如看上去在屏幕中央,但脚本获取到的错误坐标数据却指示它在屏幕显示范围之外。\n"
                +"4.点击选择要打的关卡,进入助战选择界面,\n"
                +"5.在助战选择界面再次利用\"检测文字是否出现\"来确保章节和关卡都没有选错,原理同上,\n"
                +"6.\"结束回放\"并\"报告成功\",并且在结束时\"什么也不做,继续执行脚本\"。"
            );
        }

        dialogs.alert("最后的叮嘱",
            "1.录制完成后会覆盖之前的数据！如果不想覆盖,接下来请选择\"放弃录制\",然后在脚本选单里选择启动\"导出动作录制数据\",保存妥当后,再重新开始录制。\n"
            +"2.录制时请务必跟着提示一步一步来,尤其是在录制点击和滑动操作时,请务必在屏幕变暗、并显示出相关操作提示后,再进行点击或滑动操作!");

        let endRecording = false;
        for (let step=0; !endRecording; step++) {
            log("录制第"+(step+1)+"步操作...");
            let op = {};
            op.action = chooseAction(step, result.isEventTypeBRANCH);
            if (
                  result.isEventTypeBRANCH
                  && result.steps.find((val) => val.action == "BRANCHclick") != null
                  && op.action != "exit" && op.action != "undo" && op.action != "abandon"
               )
            {
                let dialog_selected = dialogs.confirm("警告",
                    "您已经录制过在杜鹃花型活动地图上点击选关的动作,\n"
                    +"在此之后,动作录制/重放就结束了。\n"
                    +"要结束录制请点确定。点取消可以回到菜单,然后可以选择重录上一步/结束/放弃。"
                );
                if (dialog_selected) {
                    op.action = "exit";
                    op.exit = {kill: false, exitStatus: false};
                    result.steps.push(op);
                    toastLog("录制结束");
                    endRecording = true;
                } else {
                    toastLog("继续录制\n第"+(step+1)+"步");
                    step--;//这一步没录，所以需要-1
                }
                continue;
            }
            switch (op.action) {
                case "BRANCHclick":
                case "click":
                    log("等待录制点击动作...");
                    op.click = {};
                    op.click.point = capture("录制第"+(step+1)+"步操作\n请点击要记录下来的点击位置").pos_up;
                    if (op.click.point == null) {
                        toastLog("录制点击动作出错");
                        stopThread();
                    }
                    if (op.action == "BRANCHclick") {
                        let dialog_selected = dialogs.confirm("警告",
                            "要直接使用刚刚记录下来的点击坐标,而不进行校正么?"
                            +"\n在完成一局战斗后,杜鹃花型活动的剧情地图会发生移动,从而可能导致点击错位"
                            +"\n为避免点击错位,脚本将会自动拖动地图,让要点击的关卡按钮\"归中\","
                            +"\n然后提示您再点击一次关卡按钮。"
                            +"\n这个避免坐标错位的办法并不保证一定靠谱,只能说请多多测试以确保无误。"
                            +"\n点击\"确定\"后,会直接使用刚刚记录的点击坐标,而不会进行自动拖动地图校正坐标的额外步骤。"
                            +"\n点击\"取消\"后,则会开始校正步骤:先自动拖动地图,完成后,提示您再点击一次关卡按钮。"
                        );
                        if (!dialog_selected) {
                            let bounds = getFragmentViewBounds();
                            let opSwipe = {};
                            opSwipe.action = "swipe"
                            opSwipe.swipe = {};
                            opSwipe.swipe.points = [op.click.point, {x: bounds.centerX(), y: bounds.centerY()}];
                            opSwipe.swipe.duration = 6000;
                            result.steps.push(opSwipe);
                            step++;
                            toastLog("正在自动拖动剧情地图,需要6秒完成...");
                            swipe(op.click.point.x, op.click.point.y, bounds.centerX(), bounds.centerY(), 6000);
                            toast("自动拖动剧情地图已完成");
                            op.click.point = capture("录制第"+(step+1)+"步操作\n请点击要记录下来的点击位置").pos_up;
                            if (op.click.point == null) {
                                toastLog("录制点击动作出错");
                                stopThread();
                            }
                        }
                    }
                    click(op.click.point);
                    result.steps.push(op);
                    toastLog("已记录点击动作: ["+op.click.point.x+","+op.click.point.y+"]");
                    toast("如果点击没点到,请重录上一步");
                    sleep(4000);
                    break;
                case "swipe":
                    log("等待录制滑动动作...");
                    op.swipe = {};
                    op.swipe.points = [];
                    let swipe_data = capture("录制第"+(step+1)+"步操作\n请进行触控滑动操作\n为了增加重放成功的概率,请尽量慢一些");
                    if (swipe_data == null) {
                        toastLog("录制滑动动作出错");
                        stopThread();
                    }
                    for (let pos of ["pos_down", "pos_up"]) op.swipe.points.push(swipe_data[pos]);
                    op.swipe.duration = swipe_data.duration;
                    swipe(op.swipe.points[0], op.swipe.points[1], op.swipe.duration);
                    result.steps.push(op);
                    toastLog("已记录滑动动作: "
                             +"["+op.swipe.points[0].x+","+op.swipe.points[0].y+"]"
                             +" => "
                             +"["+op.swipe.points[1].x+","+op.swipe.points[1].y+"]"
                             +" ("+op.swipe.duration+"ms)"
                             );
                    toast("如果滑动没反应,请重录上一步");
                    sleep(4000);
                    break;
                case "sleep":
                    op.sleep = {};
                    let sleep_ms = 0;
                    do {
                        sleep_ms = dialogs.rawInput("录制第"+(step+1)+"步操作\n要等待多少毫秒", "3000");
                        sleep_ms = parseInt(sleep_ms);
                        if (isNaN(sleep_ms) || sleep_ms <= 0) {
                            toastLog("请输入一个正整数");
                            continue;
                        }
                    } while (sleep_ms <= 0 || isNaN(sleep_ms));
                    op.sleep.sleepTime = sleep_ms;
                    result.steps.push(op);
                    toastLog("录制第"+(step+1)+"步操作\n已记录等待动作,时间为"+op.sleep.sleepTime+"毫秒");
                    break;
                case "checkText":
                    op.checkText = {};
                    log("等待录制文字检测动作...");
                    let selected = -1;
                    let all_text = [];
                    let check_text_point = null;
                    let dialog_options = [];
                    let dialog_selected = null;
                    while (selected < 0) {
                        selected = -1;
                        check_text_point = capture("录制第"+(step+1)+"步操作\n请点击要检测的文字出现的位置").pos_up;
                        if (check_text_point == null) {
                            toastLog("录制检测文字是否出现动作出错");
                            stopThread();
                        }

                        let all_found_text = boundsContains(check_text_point.x, check_text_point.y, check_text_point.x, check_text_point.y)
                                             .find();
                        for (let i=0; i<all_found_text.length; i++) {
                            let found_text = all_found_text[i];
                            let content = getContent(found_text);
                            if (content != null && content != "") {
                                all_text.push(content);
                            }
                        }
                        switch (all_text.length) {
                            case 0:
                                toastLog("在点击位置没有检测到有文字的控件,请重新选择");
                                break;
                            case 1:
                                selected = 0;
                                break;
                            default:
                                selected = dialogs.select("录制第"+(step+1)+"步操作\n在点击位置检测到多个含有文字的控件,请选择:", all_text);
                                selected = parseInt(selected);
                                if (isNaN(selected)) selected = -1;
                        }
                    }
                    op.checkText.text = all_text[selected];
                    toastLog("录制第"+(step+1)+"步操作\n要检测的文字是\""+op.checkText.text+"\"");

                    dialog_options = ["横纵坐标都检测", "只检测横坐标X", "只检测纵坐标Y", "横纵坐标都不检测"];
                    do {
                        dialog_selected = dialogs.select("录制第"+(step+1)+"步操作\n是否要检测文字\""+op.checkText.text+"\"在屏幕出现的位置和现在是否一致?", dialog_options);
                        dialog_selected = parseInt(dialog_selected);
                        if (isNaN(dialog_selected)) dialog_selected = -1;
                    } while (dialog_selected < 0);
                    if (dialog_selected == 0 || dialog_selected == 1) {
                        op.checkText.centerX = check_text_point.x;
                    }
                    if (dialog_selected == 0 || dialog_selected == 2) {
                        op.checkText.centerY = check_text_point.y;
                    }
                    toastLog(dialog_options[dialog_selected]);
                    let deadEnd = true;//如果无论指定的文字是否被检测到,都设置要结束,那么录制也可以到此为止了
                    for (let found_or_not_found of ["found", "notFound"]) {
                        op.checkText[found_or_not_found] = {};
                        op.checkText[found_or_not_found].kill = false;
                        op.checkText[found_or_not_found].stopScript = false;
                        dialog_options = [
                            "继续回放下一步",
                            "结束回放,报告成功",
                            "结束回放,报告失败",
                        ];
                        do {
                            dialog_selected = dialogs.select("录制第"+(step+1)+"步操作\n"+(found_or_not_found=="notFound"?"未":"")+"检测到文字\""+op.checkText.text+"\"时要做什么?", dialog_options);
                            dialog_selected = parseInt(dialog_selected);
                            if (isNaN(dialog_selected)) dialog_selected = -1;
                        } while (dialog_selected < 0);
                        switch (dialog_selected) {
                            case 0:
                                op.checkText[found_or_not_found].nextAction = "ignore";
                                deadEnd = false;
                                break;
                            case 1:
                                op.checkText[found_or_not_found].nextAction = "success";
                                break;
                            case 2:
                                op.checkText[found_or_not_found].nextAction = "fail";
                                break;
                            default:
                                toastLog("询问检测文字后要做什么时出错");
                                stopThread();
                        }
                        toastLog("录制第"+(step+1)+"步操作\n"+(found_or_not_found=="notFound"?"未":"")+"检测到文字时要\n"+dialog_options[dialog_selected]);
                        if (dialog_selected == 1 || dialog_selected == 2) {
                            let dialog_selected_text = dialog_options[dialog_selected];//上一个对话框选中的选项文字
                            let warning_text = op.checkText[found_or_not_found].nextAction == "fail" ? "(一般别选)" : "";
                            dialog_options = [
                                warning_text+"什么也不做,继续执行脚本",
                                "杀进程重开游戏,继续执行脚本(让脚本重开游戏)",
                                "杀进程关掉游戏,终止脚本执行",
                                "不杀游戏进程,只是终止脚本执行",
                            ];
                            do {
                                dialog_selected = dialogs.select("录制第"+(step+1)+"步操作\n"+dialog_selected_text+"时要做什么?", dialog_options);
                                dialog_selected = parseInt(dialog_selected);
                                if (isNaN(dialog_selected)) dialog_selected = -1;
                            } while (dialog_selected < 0);
                            switch (dialog_selected) {
                                case 0:
                                    break;
                                case 1:
                                    op.checkText[found_or_not_found].kill = true;
                                    break;
                                case 2:
                                    op.checkText[found_or_not_found].stopScript = true;
                                    break;
                                case 3:
                                    op.checkText[found_or_not_found].kill = true;
                                    op.checkText[found_or_not_found].stopScript = true;
                                    break;
                                default:
                                    toastLog("询问检测文字后结束回放时要做什么时出错");
                                    stopThread();
                            }
                            toastLog("录制第"+(step+1)+"步操作\n"+(found_or_not_found=="notFound"?"未":"")+"检测到文字时要\n"+dialog_options[dialog_selected]);
                        }
                    }
                    if (
                          deadEnd
                          && result.isEventTypeBRANCH
                          && result.steps.find((val) => val.action == "BRANCHclick") == null
                       )
                    {
                        dialogs.alert("错误",
                            "您没有录制在活动地图的点击选关动作！\n"
                            +"既然是杜鹃花型活动,那么在活动地图上,必须指定最后需要点击哪里来选关,否则就不能正常选关"
                            );
                        toastLog("重新录制\n第"+(step+1)+"步");
                        step--;//这一步没录，所以需要-1
                        continue;
                    }
                    result.steps.push(op);
                    toastLog("已记录检测文字\""+op.checkText.text+"\"是否出现的动作");
                    if (deadEnd) {
                        endRecording = true;
                        toastLog("录制结束");
                    }
                    break;
                case "exit":
                    if (result.isEventTypeBRANCH) {
                        //杜鹃花型活动并不是必须要检测文字,默认检测类似event_branch_1032_part_1这样的特征即可
                        if (result.steps.find((val) => val.action == "BRANCHclick") == null) {
                            dialogs.alert("错误",
                                "您没有录制在活动地图的点击选关动作！\n"
                                +"既然是杜鹃花型活动,那么在活动地图上,必须指定最后需要点击哪里来选关,否则就不能正常选关"
                                );
                            toastLog("继续录制\n第"+(step+1)+"步");
                            step--;//这一步没录，所以需要-1
                            continue;
                        } else {
                            op.exit = {kill: false, exitStatus: false};
                            result.steps.push(op);
                            toastLog("录制结束");
                            endRecording = true;
                        }
                        break;
                    } else if (result.steps.length > 0 && (result.steps.find((val) => val.action == "checkText") == null)) {
                        dialog_selected = dialogs.confirm(
                            "警告", "您没有录制文字检测动作！\n"
                            +"您确定 不需要 检测文字么？\n"
                            +"重放时未必可以一次成功，点错并不是稀奇事。\n"
                            +"点错后可能发生各种不可预知的后果：从脚本因步调错乱而停滞不动，到误触误删文件，再到变成魔女，全都是有可能的哦！"
                            );
                        if (!dialog_selected) {
                            toastLog("重新录制\n第"+(step+1)+"步");
                            step--;//这一步没录，所以需要-1
                            continue;
                        } else {
                            toastLog("好吧，尊重你的选择：\n不检测文字\n祝你好运!");
                            sleep(1000);
                        }
                    }
                    //现在不考虑加入循环跳转什么的
                    op.exit = {};
                    op.exit.kill = false;
                    op.exit.stopScript = false;
                    do {
                        dialog_selected = dialogs.confirm("录制第"+(step+1)+"步操作\n结束时要报告成功还是失败?", "报告成功请点\"确定\"\n报告失败请点\"取消\"");
                    } while (dialog_selected == null);
                    op.exit.exitStatus = dialog_selected ? true : false;
                    let warning_text = dialog_selected ? "" : "(一般别选)";
                    dialog_options = [
                        warning_text+"什么也不做,继续执行脚本",
                        "杀进程重开游戏,继续执行脚本(让脚本重开游戏)",
                        "杀进程关掉游戏,终止脚本执行",
                        "不杀游戏进程,只是终止脚本执行",
                    ];
                    do {
                        dialog_selected = dialogs.select("录制第"+(step+1)+"步操作\n结束时除了"+(op.exit.exitStatus?"报告成功":"报告失败")+"还要做什么?", dialog_options);
                        dialog_selected = parseInt(dialog_selected);
                        if (isNaN(dialog_selected)) dialog_selected = -1;
                    } while (dialog_selected < 0);
                    switch (dialog_selected) {
                        case 0:
                            break;
                        case 1:
                            op.exit.kill = true;
                            break;
                        case 2:
                            op.exit.kill = true;
                            op.exit.stopScript = true;
                            break;
                        case 3:
                            op.exit.stopScript = true;
                            break;
                        default:
                            toastLog("询问结束时要做什么时出错");
                            stopThread();
                    }
                    toastLog("录制第"+(step+1)+"步操作\n结束时要"+(op.exit.exitStatus?"报告成功":"报告失败")+",并且"+dialog_options[dialog_selected]);
                    result.steps.push(op);
                    toastLog("录制结束");
                    endRecording = true;
                    break;
                case "undo":
                    if (result.steps.length > 0) {
                        let last_action = result.steps[result.steps.length-1].action;
                        step--;
                        result.steps.pop();
                        toastLog("重录第"+(step+1)+"步");
                        if (last_action == "click" || last_action == "swipe" || last_action == "BRANCHclick") {
                            sleep(3000);
                            toast("录制将会在 12 秒后继续...");
                            sleep(2000);
                            toast("请把游戏界面重新整理好");
                            sleep(2000);
                            toast("录制将会在 8 秒后继续...");
                            sleep(2000);
                            toast("请把游戏界面重新整理好");
                            sleep(2000);
                            toast("录制将会在 4 秒后继续...");
                            sleep(2000);
                            toast("请把游戏界面重新整理好");
                            sleep(2000);
                        }
                    } else {
                        toastLog("还没开始录制第1步");
                    }
                    step--;//这一步没录，所以需要再-1
                    continue;
                case null:
                case "abandon":
                    result = null;
                    toastLog("放弃录制");
                    stopThread();//lastOpList不会被重新赋值为null
                default:
                    toastLog("录制第"+(step+1)+"步操作\n出错: 未知动作", op.action);
                    stopThread();
            }
            log("录制第"+result.steps.length+"步动作完成");
        }
        if (result != null) {
            //先记录AP消耗数值
            let apCost = null;
            let detectedAPCost = detectCostAP();
            if (detectedAPCost == null) detectedAPCost = "";
            while (true) {
                let recordAPCost = null;
                apCost = dialogs.rawInputWithContent(
                    "记录关卡AP消耗",
                    "是否记录关卡AP消耗数值（如下）？（LAST MAGIA等活动在进入助战选择前无法检测关卡AP消耗数值）\n取消或留空则不记录",
                    String(detectedAPCost),
                    () => recordAPCost = true,
                    () => recordAPCost = false);
                if (recordAPCost == null) continue;
                else if (recordAPCost) {
                    if (!checkNumber(apCost) || parseInt(apCost) <= 0) {
                        toastLog("AP消耗数值必须是个正整数");
                    } else if (parseInt(apCost) > 50) {
                        toastLog("AP消耗数值过大（超过50）");
                    } else break;
                } else {
                    apCost = null;
                    break;
                }
            };
            if (apCost != null) result.apCost = parseInt(apCost);
            if (result.apCost != null) toastLog("已记录关卡AP消耗数值: "+result.apCost);
            else toastLog("未记录关卡AP消耗数值");

            saveOpList(result);//写入到文件
            lastOpList = result;
            lastNonPresetOpList = result; //备份刚刚录制好的数据
            isLastOpListNonPreset = true; //刚刚录制好的数据很显然不是预设的
            toastLog("录制完成,共记录"+result.steps.length+"步动作");
        }
        return result;
    }

    function validateOpList(opList) {
        //initialize(); //让调用者initialize
        //只是简单的检查，并没有仔细地检查
        if (opList.package_name == null || opList.package_name == "") {
            toastLog("动作录制数据无效: package_name为空");
            return false;
        }
        let currentScreenParams = getScreenParams();
        if (currentScreenParams == null || currentScreenParams == "") {
            toastLog("无法检验动作录制数据: 获取屏幕参数失败");
            return false;
        }
        if (opList.isGeneric) {
            if (opList.screenParams != null) {
                toastLog("动作录制数据无效: isGeneric为true但screenParams不为null");
                return false;
            }
        } else {
            if (opList.screenParams != currentScreenParams) {
                toastLog("动作录制数据无效: 屏幕参数不匹配");
                return false;
            }
        }
        return true;
    }

    const dangerousResIDs = [
        "charaListElms",    //魔法少女选择器，可能是无害的队伍调整页面，也可能是魔法少女强化页面
        "useItem",          //记忆结晶强化、突破的已选素材列表
        "gachaPickUpWrap",  //扭蛋PickUP对象展示区
    ];

    function safetyCheck() {
        for (let resID of dangerousResIDs) {
            if (findID(resID)) {
                log("检测到危险控件:\""+resID+"\"");
                return false;
            }
        }
        if (findID("listTitle") && (!findID("allReserve"))) {
            //listTitle可能是商店板块标题
            //任务窗口同时有listTitle和allReserve,其中allReserve是全部领取按钮
            log("检测到疑似商店的危险控件 (有\"listTitle\",无\"allReserve\")");
            return false;
        }
        return true;
    }

    function replayOperations(opList, dontStopOnError) {
        if (!requestPrivilegeIfNeeded()) {
            log("用户选择获取特权,但还没获取到,退出录制");
            stopThread();//等到权限获取完再重试
            return;
        }

        initialize(dontStopOnError); //如果是悬浮窗按钮调用，initialize出错就停止；否则不停

        var result = false;

        if (opList == null) opList = lastOpList;
        if (opList == null) {
            log("目前没有加载动作录制数据,本次重放结束后也不会加载重放过的数据");
            if (limit.usePresetOpList > 0) {
                opList = JSON.parse(floatUI.presetOpLists[limit.usePresetOpList].content);
                toastLog("即将开始重放:\n预设选关动作:\n["+floatUI.presetOpLists[limit.usePresetOpList].name+"]");
            } else {
                opList = loadOpList();
                toastLog("即将开始重放:\n之前录制的选关动作"+(opList.date==null?"":"\n录制日期: "+opList.date));
            }
        }
        if (opList == null) {
            toastLog("不知道要重放什么动作,退出");
            return false;
        }

        if (!validateOpList(opList)) {
            toastLog("重放失败\n动作录制数据无效");
            return false;
        }

        log("重放录制的操作...");

        let endReplaying = false;
        let defaultOpCycleWaitTime = 500 + parseInt(opList.defaultSleepTime);
        for (let i=0; i<opList.steps.length&&!endReplaying; i++) {
            resetFatalKillerWatchDog(); //重设套娃监工WATCHDOG
            switch (isGameDead()) {
                case "crashed":
                    log("游戏已经闪退,停止重放");
                    log("为了尽量避免幺蛾子出现,补刀再杀一次进程...");
                    killGame(string.package_name);
                    return false;
                case "logged_out":
                    log("游戏已经登出,停止重放");
                    return false;
                case false:
                    break;//没闪退
                default:
                    log("未知闪退状态,停止重放");
                    log("为了尽量避免幺蛾子出现,补刀再杀一次进程...");
                    killGame(string.package_name);
                    return false;
            }
            log("执行安全检查,同时等待"+defaultOpCycleWaitTime+"毫秒...");
            let opCycleStartTime = new Date().getTime();
            do {
                if (!safetyCheck()) {
                    toastLog("检测到可能涉及危险操作的控件,停止重放\n即将杀进程重开...");
                    killGame(string.package_name);
                    return false;
                }
                sleep(50);
            } while (new Date().getTime() < opCycleStartTime + defaultOpCycleWaitTime);

            let lastOp = i > 0 ? opList.steps[i-1] : null;
            if (lastOp != null) switch (lastOp.action) {
                case "click":
                case "swipe":
                    //如果AP不足就进不去助战选择
                    if (findPopupInfoDetailTitle(string.ap_refill_title) && find(string.out_of_ap)) {
                        refillAP();
                    }
                    break;
            }

            let op = opList.steps[i];
            log("第"+(i+1)+"步", op);
            switch (op.action) {
                case "BRANCHclick":
                    endReplaying = true;
                    if (match(string.regex_event_branch)) {
                        result = true;
                        toastLog("已进入杜鹃花型活动地图");
                    } else {
                        result = false;
                        toastLog("未进入杜鹃花型活动地图,重放失败终止,杀进程重开...");
                        log("先点击一下跳过剧情");
                        click(convertCoords(clickSets.skip));
                        log("强行停止游戏", opList.package_name);
                        killGame(opList.package_name);
                        log("强行停止完成");
                        break;
                    }
                    log("在杜鹃花型活动地图上点击选关...");
                case "click":
                    if (opList.isGeneric) {
                        click(convertCoords(op.click.point));
                    } else {
                        click(op.click.point);
                    }
                    if (op.action == "BRANCHclick") log("在杜鹃花型活动地图上点击选关完成,重放成功结束");
                    break;
                case "swipe":
                    let points = op.swipe.points;
                    if (opList.isGeneric) {
                        points = op.swipe.points.map((point) => convertCoords(point));
                    }
                    swipe(points[0], points[1], op.swipe.duration);
                    break;
                case "sleep":
                    sleep(op.sleep.sleepTime);
                    break;
                case "checkText":
                    let reallyFound = false;
                    let check_result = null;
                    if (opList.isGeneric) {
                        if (op.checkText.boundsCenter != null) {
                            let converted = convertCoords(op.checkText.boundsCenter);
                            op.checkText.centerX = op.checkText.boundsCenter.bypassCheckingX ? null : converted.x;
                            op.checkText.centerY = op.checkText.boundsCenter.bypassCheckingY ? null : converted.y;
                        }
                    }
                    let all_found_text = findAll(op.checkText.text, parseInt(limit.timeout));
                    if (all_found_text != null && all_found_text.length > 0) {
                        for (let j=0; j<all_found_text.length; j++) {
                            try {
                                let found_text = all_found_text[j];
                                //先排除大小为0或者干脆数值就不合法（比如左边缘比右边缘还靠右）的控件
                                //然后检查控件位置是否符合要求
                                //如果centerX/Y不是数值（比如undefined）那就不检查横/纵坐标中的这一项（另一项如果是数值还要检查）
                                let found_text_bounds = null;
                                if (typeof op.checkText.centerX == "number"
                                    || typeof op.checkText.centerY == "number")
                                {
                                    found_text_bounds = found_text.bounds();//注意Rect包含左/上边缘，不包括右/下边缘
                                }
                                if (typeof op.checkText.centerX == "number") {
                                    if (found_text_bounds.left >= found_text_bounds.right) {reallyFound = false; break;}
                                    if (found_text_bounds.left > op.checkText.centerX) {reallyFound = false; break;}
                                    if (found_text_bounds.right <= op.checkText.centerX) {reallyFound = false; break;}
                                }
                                if (typeof op.checkText.centerY == "number") {
                                    if (found_text_bounds.top >= found_text_bounds.bottom) {reallyFound = false; break;}
                                    if (found_text_bounds.top > op.checkText.centerY) {reallyFound = false; break;}
                                    if (found_text_bounds.bottom <= op.checkText.centerY) {reallyFound = false; break;}
                                }
                                //全部检查通过
                                reallyFound = true;
                                break;
                            } catch (e) {
                                reallyFound = false;
                                logException(e);
                                break;
                            }
                            reallyFound = false;
                        }
                    }
                    if (reallyFound) {
                        log("找到位于["+op.checkText.centerX+","+op.checkText.centerY+"],文字为\""+op.checkText.text+"\"的控件");
                        check_result = op.checkText.found;
                    } else {
                        log("未找到满足指定位置和文字内容条件的控件");
                        check_result = op.checkText.notFound;
                    }
                    switch (check_result.nextAction) {
                        case "success":
                            log("重放成功结束");
                            endReplaying = true;
                            result = true;
                            break;
                        case "fail":
                            log("重放失败终止");
                            endReplaying = true;
                            result = false;
                            break;
                        case "ignore":
                            log("继续重放");
                            break;
                        default:
                            log("未知nextAction", check_result.nextAction);
                    }
                    if (check_result.kill) {
                        log("强行停止游戏", opList.package_name);
                        killGame(opList.package_name);
                        log("强行停止完成");
                    }
                    if (check_result.stopScript === true) {
                        log("终止脚本执行");
                        stopThread();
                    }
                    break;
                case "exit":
                    log("结束重放");
                    endReplaying = true;
                    result = op.exit.exitStatus;
                    if (op.exit.kill) {
                        log("强行停止游戏", opList.package_name);
                        killGame(opList.package_name);
                        log("强行停止完成");
                    }
                    if (op.exit.stopScript === true) {
                        log("终止脚本执行");
                        stopThread();
                    }
                    break;
                default:
                    log("未知操作");
            }
            if (!endReplaying) {
                log("第"+(i+1)+"步操作完成");
            }
        }
        toastLog("所有动作重放完成,结果:"+(result?"成功":"失败"));
        return result;
    }

    function exportOpList() {
        //initialize(); //不要求游戏在前台，所以在脚本界面也可以导出
        let lastOpListStringified = null;

        //当前加载的lastOpList可能是预设的,所以不用lastOpList,直接读取文件内容
        let justFileContent = true;
        lastOpListStringified = loadOpList(justFileContent);

        if (lastOpListStringified != null && lastOpListStringified != "") {
            ui.run(() => {
                clip = android.content.ClipData.newPlainText("auto_export_op_list", lastOpListStringified);
                activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE).setPrimaryClip(clip);
                toast("内容已复制到剪贴板");
            });
            dialogs.rawInputWithContent("导出选关动作", "您可以 全选=>复制 以下内容，然后在别处粘贴保存。", lastOpListStringified);
            dialogs.alert("提示", "导出完成！\n不过很遗憾，目前只支持在同一台设备上重新导入，不支持在屏幕参数不一样的另一台设备上导入运行。");
        } else {
            toastLog("没有录下来的动作可供导出");
        }
    }

    function importOpList() {
        if (!requestPrivilegeIfNeeded()) {
            log("用户选择获取特权,但还没获取到,退出录制");
            stopThread();//等到权限获取完再重试
            return;
        }

        initialize(); //如果游戏不在前台则无法检验导入进来的动作录制数据

        let input = dialogs.rawInputWithContent(
            "导入选关动作",
            "您可以把之前录制并保存下来的动作重新导入进来。",
            "",
            function () {},
            function () {
                toastLog("取消导入动作录制数据");
            }
        );
        if (input != null) {
            log("确定导入动作录制数据");
            let importedOpList = null;
            try {
                importedOpList = JSON.parse(input);
            } catch (e) {
                logException(e);
                importedOpList = null;
                toastLog("导入失败");
            }
            if (importedOpList != null && typeof importedOpList != "string") {
                if (validateOpList(importedOpList)) {
                    lastOpList = importedOpList;
                    lastNonPresetOpList = lastOpList; //备份导入的数据
                    isLastOpListNonPreset = true; //导入的数据很显然不是预设的
                    toastLog("导入完成");
                    saveOpList(importedOpList);//写入到文件
                } else {
                    toastLog("导入失败\n动作录制数据无效");
                }
            }
        }
    }

    function clearOpList() {
        let lastOpListDateString = "";
        let opList = loadOpList();
        if (opList != null) lastOpListDateString = ((opList.date == null) ? "" : ("\n录制日期: "+opList.date));
        dialogs.confirm("清除选关动作录制数据", "确定要清除么？"+lastOpListDateString, () => {
            lastOpList = null;
            lastNonPresetOpList = null; //备份也清除掉,否则下次启动脚本时会从备份恢复
            isLastOpListNonPreset = false;
            if (!files.remove(savedLastOpListPath)) {
                toastLog("删除动作录制数据文件失败");
                return;
            }
            toastLog("已清除选关动作数据");
        }, () => {
            toastLog("未清除选关动作数据");
        });
    }

    function captureTextRunnable() {
        initialize();

        capture_text_point = capture("文字抓取\n请点击文字出现的位置").pos_up;
        if (capture_text_point == null) {
            toastLog("文字抓取出错");
            stopThread();
        }

        let all_text = [];
        let all_found_text = boundsContains(capture_text_point.x, capture_text_point.y, capture_text_point.x, capture_text_point.y)
                             .find();
        for (let i=0; i<all_found_text.length; i++) {
            let found_text = all_found_text[i];
            let content = getContent(found_text);
            if (content != null && content != "") {
                all_text.push(content);
            }
        }
        let selected = -1;
        switch (all_text.length) {
            case 0:
                toastLog("在点击位置没有检测到有文字的控件,请重新选择");
                break;
            case 1:
                selected = 0;
                break;
            default:
                selected = dialogs.select("在点击位置检测到多个含有文字的控件,请选择:", all_text);
                selected = parseInt(selected);
                if (isNaN(selected)) selected = -1;
        }
        let captured_text = all_text[selected];
        if (selected > -1 && captured_text != null) {
            ui.run(() => {
                clip = android.content.ClipData.newPlainText("auto_export_op_list", captured_text);
                activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE).setPrimaryClip(clip);
                toast("内容已复制到剪贴板");
            });
            dialogs.rawInputWithContent("文字抓取", "您可以 全选=>复制 以下内容，然后在别处粘贴保存。", captured_text);
        }
    }

    //返回游戏并继续运行脚本
    floatUI.backToGame = function () {
        if (isCurrentTaskPaused.compareAndSet(TASK_PAUSED, TASK_RESUMING)) {
            threads.start(reLaunchGame);//避免在UI线程运行
        } else {
            toastLog("脚本未处于暂停状态");
            return;
        }
    };

    function getCurrentVersion() {
        if (limit.version == "") return getProjectVersion();
        return limit.version;
    }

    function testSupportPicking() {
        initialize();

        if (find(string.support) == null) {
            do {
                toastLog("正在测试助战自动选择\n等待进入助战选择界面...");
            } while (find(string.support, 4000) == null);
        }

        //开始测试
        let testMode = true;
        let result = pickSupportWithMostPt(testMode);
        if (result == null || result.testdata == null || result.testdata == "") {
            sleep(2000);
            toastLog("选择助战时出错");
            sleep(2000);
            toastLog("请在助战选择界面拍一张快照,然后回到脚本主界面,点击右上角菜单里的\"报告问题\",谢谢！");
            sleep(2000);
            stopThread();
        } else {
            while (dialogs.confirm(
                "测试助战自动选择",
                "请检查游戏中实际显示的助战数目是否和下面的结果一致。"
                +"\n如果发现结果不对，请在助战选择界面拍一张快照，然后回到脚本主界面，点击右上角菜单里的\"报告问题\"，谢谢！"
                +"\n点击\"取消\"结束；点击\"确定\"后，对话框会先消失10秒再重新弹出。"
                +"\n\n"+result.testdata
            )) {
                toast("10秒后将重新弹出对话框");
                sleep(8000);
                toast("2秒后将重新弹出对话框");
                sleep(2000);
            };

            if (result.point != null) {
                if (dialogs.confirm(
                    "测试助战自动选择",
                    "要继续让脚本点击自动选择的助战么？如果是，请在点击\"确定\"后，拖动助战列表，使其回到初始状态，让第一个助战显示在顶部。"
                )) {
                    toastLog("5秒后将会自动点击助战...");
                    sleep(3000);
                    toastLog("2秒后将会自动点击助战...");
                    sleep(2000);
                    toast("请勿手动拖动助战列表!\n自动点击助战...");
                    click(swipeToPointIfNeeded(result.point));
                } else {
                    toastLog("助战选择测试结束");
                    return;
                }
                while (dialogs.confirm(
                    "测试助战自动选择",
                    "请检查游戏中实际出现在队伍里的助战角色是否正确。"
                    +"\n如果发现结果不对，请在助战选择界面拍一张快照，然后回到脚本主界面，点击右上角菜单里的\"报告问题\"，谢谢！"
                    +"\n点击\"取消\"结束；点击\"确定\"后，对话框会先消失5秒再重新弹出。"
                    +"\n"+result.testdata
                )) {sleep(5000);};
            }

            toastLog("助战选择测试结束");
        }
    }

    function detectInitialState() {
        log("检测初始状态...");

        let state = STATE_MENU;

        if (isGameDead()) {
            state = STATE_CRASHED;
            return state;
        }

        while (true) {
            let found_popup = findPopupInfoDetailTitle();
            log("弹窗检测结果", found_popup);
            if (found_popup == null) break;
            let expected_titles = [];
            for (let error_type of ["connection_lost", "auth_error", "generic_error", "error_occurred", "story_updated", "unexpected_error"]) {
                expected_titles.push(string[error_type]);
            }
            let matched_title = expected_titles.find((val) => val == found_popup.title);
            if (matched_title != null) {
                //没有关闭按钮
                log("游戏已经断线/登出/出错并强制回首页");
                state = STATE_CRASHED;
                return state;
            } else {
                log("关闭弹窗\""+found_popup.title+"\"...");
                click(found_popup.close);
            }
            sleep(1000);
        }

        if (findID("questLinkList")) {
            state = STATE_MENU;
        } else if (findID("questWrapTitle")) {
            state = STATE_MENU;
        } else if (findID("helpBtn")) {//“游戏方式”按钮,一般是说明活动玩法
            state = STATE_MENU;
        } else if (findID("questLinkListWrap")) {//星期副本
            state = STATE_MENU;
        } else if (find(string.support)) {
            state = STATE_SUPPORT;
        } else if (findID("nextPageBtn")) {
            state = STATE_TEAM;
        } else if (findID("ResultWrap")) {
            state = STATE_REWARD_CHARACTER;
        } else if (findID("hasTotalRiche")) {
            state = STATE_REWARD_MATERIAL;
        } else if (getAP() == null) {
            sleep(2000);
            if (limit.autoReconnect) {
                let dialog_selected = dialogs.confirm("警告",
                    "脚本猜测游戏正处于战斗状态。\n"
                    +"如果游戏并不是在战斗中,而是正在登录中/还没完成登录,请点击\"取消\"停止运行脚本！\n"
                    +"当前已经启用\"防断线模式\",然而\"防断线模式\"点击的断线重连按钮所在位置正好与重新登录并恢复战斗的放弃战斗按钮重合。\n"
                    +"点击\"取消\"即可避免因误触放弃战斗按钮而导致AP或门票白白损失。\n"
                    +"如果你确定当前确实是已经在战斗中了,或者虽然正在登录中,但并没有战斗要恢复,可以点击\"确定\",然后脚本会照常运行。"
                );
                if (!dialog_selected) {
                    toastLog("在登录游戏恢复战斗时,\n可能误触放弃战斗按钮,\n为防止误触,已停止运行脚本");
                    stopThread();
                }
            } else {
                toastLog("进入战斗状态\n如果当前不在战斗中，请停止脚本运行");
            }
            sleep(2000);
            state = STATE_BATTLE;
        } else {
            log("没有检测到典型的STATE_MENU状态控件");
            state = STATE_MENU;
        }

        log(StateNames[state]);

        return state;
    }

    function testReLaunchRunnable() {
        initialize();
        while (true) {
            dialogs.alert("测试闪退自动重开", "即将回到脚本界面并杀进程退出游戏。\n请确保游戏没有被锁后台,不然的话可能无法正常杀进程重开!");
            killGame();
            backtoMain();
            dialogs.alert("测试闪退自动重开", "即将重启游戏。\n如果弹出提示询问是否允许关联启动,请点\"允许\"");
            reLaunchGame();
            toast("等待5秒...");
            sleep(5000);
            dialogs.alert("测试闪退自动重开", "如果没出问题的话,游戏现在应该已经重启了。"
                +"\n同时你还可以观察游戏是不是回到了登录前的状态。如果没有返回到登录界面,则表示杀进程没有成功。");
            if (dialogs.confirm("测试闪退自动重开",
                    "游戏成功重启了么?\n"
                    +"看上去游戏好像"+(isGameDead()?"没启动":"启动了")+"。\n"
                    +"请自己观察判断有没有成功杀掉进程并重启游戏。(而不只是切到后台又原封不动地切回来)\n"
                    +"如果游戏只是原封不动地切到后台又切回来了,请检查游戏是不是被锁了后台!\n"
                    +"点\"确定\"结束测试,点\"取消\"重测一次\n"
                    +"强烈推荐至少重测一次!\n"
                    +"如果不能成功,请搜索你的手机品牌/型号是否有允许关联启动(白名单之类的)的设置方法")
               )
            {
                floatUI.storage.put("isRelaunchTested", true); //只表示是否测试过,不表示是否成功过
                break;
            }
        }
        log("测试闪退自动重开结束");
        for (let i=1; i<=2; i++) {
            toast("测试闪退自动重开结束\n如果没问题,可以进入游戏重新启动脚本了 ×"+i);
            sleep(2000);
        }
    }

    function requestTestReLaunchIfNeeded() {
        const title = "闪退自动重开";
        const text = "部分手机会拦截关联启动,阻碍自动重开游戏。\n"
        +"已知情况:\nMIUI上第一次会被拦截关联启动,点\"允许\"后就不会再拦截了。\n"
        +"强烈建议:点击\"确定\",这样会先停止脚本,然后测试脚本是否可以正常启动游戏。";
        if (floatUI.storage.get("isRelaunchTested", false)) {
            return;
        }
        if (dialogs.confirm(title, text))
        {
            replaceCurrentTask(floatUI.scripts.find((val) => val.name == "测试闪退自动重开"));
        }
    }

    /*
    //用来测速的函数,一般要注释掉
    var lastTime = 0;
    function logTime(name, divisor) {
        if (name == null) name = "";
        if (divisor == null) divisor = 1;
        let currentTime = new Date().getTime();
        if (lastTime != 0 && name !== false) {
            log("==== "+name+"耗时: "+((currentTime-lastTime)/divisor)+"ms ====");
        }
        lastTime = currentTime;
    }
    */

    function taskDefault() {
        isCurrentTaskPaused.set(TASK_RUNNING);//其他暂不（需要）支持暂停的脚本不需要加这一句

        var isCurrentTaskRecovered = false;
        if (limit.autoRecover && limit.last_saved_vars != null) {
            isCurrentTaskRecovered = true;
            log("根据上次保存的参数,恢复游戏崩溃带崩的脚本\n先重启游戏,再重新登录...");
            last_alive_lang = limit.last_saved_vars.last_alive_lang;
            for (let attempt=1; attempt<=10; attempt++) {
                log("恢复游戏崩溃带崩的脚本:第"+attempt+"次尝试重启游戏...");
                reLaunchGame();
                sleep(2000);
                detectGameLang();//给string赋值,避免isGameDead总是误以为游戏没启动
                if (!isGameDead(2000)) {
                    log("恢复游戏崩溃带崩的脚本:已成功重启游戏");
                    break;
                }
            }
            initialize();//否则reLogin不知道屏幕参数
            reLogin();
            isLastOpListNonPreset = limit.last_saved_vars.isLastOpListNonPreset;
            lastNonPresetOpList = limit.last_saved_vars.lastNonPresetOpList;
            lastOpList = limit.last_saved_vars.lastOpList;
            log("已恢复上次的选关动作录制数据");
            delete limit.last_saved_vars;
        }

        initialize();

        if (limit.usePresetOpList > 0) {
            //使用预设选关动作
            //如果当前数据不是预设的,则先备份再赋值覆盖
            if (isLastOpListNonPreset) lastNonPresetOpList = lastOpList;
            lastOpList = JSON.parse(floatUI.presetOpLists[limit.usePresetOpList].content);
            isLastOpListNonPreset = false;
        } else {
            //不使用预设选关动作
            //如果当前的lastOpList已被清除,或者是预设的,就用之前的非预设数据备份还原(没备份时也赋值为null)
            if (lastOpList == null || !isLastOpListNonPreset) {
                if (lastNonPresetOpList == null) {
                    lastOpList = null; //没有备份可供还原,清除掉当前的数据(是预设的,或者本来就已经清除掉了)
                    isLastOpListNonPreset = false;
                } else {
                    lastOpList = lastNonPresetOpList;
                    isLastOpListNonPreset = true;
                }
            }
        }
        let lastOpListDateString = "";
        if (lastOpList == null) {
            //不使用预设选关动作,也(暂时还没)加载录制的数据
            let opList = null;
            if (!limit.promptAutoRelaunch) {
                log("不弹窗询问是否加载选关动作录制数据");
            } else if (files.isFile(savedLastOpListPath) && ((opList = loadOpList()) != null)) {
                lastOpListDateString = ((opList.date == null) ? "" : ("\n录制日期: "+opList.date));
                if (dialogs.confirm("闪退自动重开", "要加载之前保存的选关动作录制数据吗?"
                    +"\n注意:4.9版或以前录制的杜鹃花型活动选关动作记录存在bug,没考虑点击坐标校正问题,可能在选关时点击错位,推荐删除重录。"
                    +lastOpListDateString)) {
                    lastOpList = opList;
                    lastNonPresetOpList = opList; //加载的数据视为非预设的,备份起来
                    isLastOpListNonPreset = true; //加载的数据应该是非预设的
                } else {
                    lastNonPresetOpList = null; //备份也清除掉(正常情况下本来就应该是已经清除掉的状态)
                    isLastOpListNonPreset = false;
                    if (dialogs.confirm("闪退自动重开", "要删除保存选关动作录制数据的文件么?")) {
                        if (!files.remove(savedLastOpListPath)) {
                            toastLog("删除动作录制数据文件失败");
                        } else {
                            toastLog("已删除动作录制数据文件");
                        }
                    } else if (false === dialogs.confirm("闪退自动重开",
                        "下次启动周回时,还要询问是否使用自动重开功能吗？\n"
                        +"点击\"取消\"后,将不再询问是否自动重开,并且默认不使用自动重开功能。\n"
                        +"如果暂时不想用自动重开,又不想清除掉导入进来或录制下来的选关动作数据,请点\"确定\"。\n"
                        +"点击\"取消\"后,如果又重新开始想要使用自动重开功能,可以在脚本设置中重新开启\"启动周回脚本时询问是否自动重开\"。\n"))
                    {
                        limit["promptAutoRelaunch"] = false;
                        floatUI.storage.put("promptAutoRelaunch", limit["promptAutoRelaunch"]);
                        updateUI("promptAutoRelaunch", "setChecked", limit["promptAutoRelaunch"]);
                    }
                }
            }
        } else {
            lastOpListDateString = ((lastOpList.date == null) ? "" : ("\n录制日期: "+lastOpList.date));
        }

        if (lastOpList == null) {
            toastLog("周回已开始。\n"+(limit.promptAutoRelaunch?"因为没有加载动作录制数据,\n所以":"")+"未启用闪退自动重开功能。");
        } else if (!limit.promptAutoRelaunch) {
            log("不弹窗询问是否启用自动重开");
            lastOpList = null;
        } else {
            if (!requestPrivilegeIfNeeded()) {
                log("用户选择获取特权,但还没获取到,退出录制");
                stopThread();//等到权限获取完再重试
                return;
            }
            if (!isCurrentTaskRecovered) requestTestReLaunchIfNeeded();//测试是否可以正常重开(但不能阻碍游戏崩溃带崩脚本后恢复)
            let presetNameString = "";
            if (limit.usePresetOpList > 0) {
                presetNameString = "\n使用预设选关动作录制数据: ["+floatUI.presetOpLists[limit.usePresetOpList].name+"]";
            }
            let loadedInfoString = "已加载动作录制数据,闪退自动重开已启用"+presetNameString+lastOpListDateString;
            if (!floatUI.storage.get("doNotAskAboutAutoReconnect", false) && !limit.autoReconnect) {
                if (dialogs.confirm("闪退自动重开",
                    "你好像忘了同时开启\"防断线模式\"！\n要开启吗？"))
                {
                    limit["autoReconnect"] = true;
                } else {
                    if (dialogs.confirm("闪退自动重开",
                        "再考虑一下吧？还是强烈推荐同时开启\"防断线模式\"！如果不开启,战斗中途如果掉线就需要等待更长时间！\n"
                        +"要开启吗？\n"
                        +"点击\"取消\"则不再询问。"))
                    {
                        limit["autoReconnect"] = true;
                    } else {
                        limit["autoReconnect"] = false;
                        floatUI.storage.put("doNotAskAboutAutoReconnect", true);
                    }
                }
                floatUI.storage.put("autoReconnect", limit["autoReconnect"]);
                log("autoReconnect", limit["autoReconnect"]);
                updateUI("autoReconnect", "setChecked", limit["autoReconnect"]);
            }
            //如果现在是游戏崩溃带崩脚本后恢复,那就不需要弹窗询问
            if (isCurrentTaskRecovered || dialogs.confirm("闪退自动重开",
                "即将开始周回。\n"
                +loadedInfoString+"\n"
                +"请务必确保游戏没有被锁后台,否则可能无法正常杀掉进程!\n"
                +"点\"确定\"继续。\n"
                +"点\"取消\"停用闪退自动重开。"))
            {
                toastLog("周回已开始。\n"+loadedInfoString);
            } else {
                lastOpList = null;
                lastNonPresetOpList = null; //备份也清除掉,否则下次启动脚本时会从备份恢复
                isLastOpListNonPreset = false;
                toastLog("周回已开始。\n已停用闪退自动重开。");
            }
        }

        if (limit.autoRecover && lastOpList != null) {
            //为游戏崩溃带崩脚本后恢复做准备
            let last_limit = {};
            last_limit.lastScriptTaskItemName = "副本周回(剧情/活动通用)";
            for (let key in limit) {
                if (key === "privilege") continue;
                if (key === "cutoutParams") continue;
                last_limit[key] = limit[key];
            }
            last_limit.last_saved_vars = {
                last_alive_lang: last_alive_lang,
                isLastOpListNonPreset: isLastOpListNonPreset,
                lastNonPresetOpList: lastNonPresetOpList,
                lastOpList: lastOpList,
            };
            let last_limit_json = JSON.stringify(last_limit);
            floatUI.storage.put("last_limit_json", last_limit_json);
            log("已保存参数以供游戏崩溃带崩脚本后恢复");
            startFatalKillerShellScript();
            log("已启动shell脚本监工以供游戏崩溃带崩脚本后恢复");
        }

        //检测初始状态，可以支持在更多状态下点启动，然后就是有些比较费时的检测还是不要放在周回里。
        var state = detectInitialState();
        var last_state = -1;

        var battlename = "";
        var charabound = null;
        var battlepos = null;
        var inautobattle = null; //null表示状态未知,另外注意undefined !== null
        var battleStartBtnClickTime = 0;
        var stuckStartTime = new Date().getTime();
        var lastStuckRemindTime = new Date().getTime();
        var lastReLaunchTime = new Date().getTime();
        var isFirstBRANCHClick = true; //在杜鹃花型活动地图点了启动脚本,无法保证一定能正确选关
        var BRANCHclickAttemptCount = 0;
        var bypassPopupCheckCounter = 0;
        var ensureGameDeadCounter = 0;
        var lastFoundPreferredChara = null;
        var isStartAutoRestartBtnAvailable = true; //一开始不知道自动续战按钮是否存在(后面检测了才知道),默认当作存在,详情见后
        var lastStateRewardCharacterStuckTime = null;
        lastFatalKillerWatchDogResetTime = new Date().getTime();
        /*
        //实验发现，在战斗之外环节掉线会让游戏重新登录回主页，无法直接重连，所以注释掉
        var stuckatreward = false;
        var rewardtime = null;
        */

        //统计周回数，开始前先归零
        currentTaskCycles = 0;

        while (true) {
            resetFatalKillerWatchDog(); //重设套娃监工WATCHDOG
            //先检查是否暂停
            if (isCurrentTaskPaused.compareAndSet(TASK_PAUSING, TASK_PAUSED)) {
                log("脚本已暂停运行");
                continue;
            } else if (isCurrentTaskPaused.compareAndSet(TASK_RESUMING, TASK_RUNNING)) {
                log("3秒后恢复脚本运行...");//等待游戏重现回到前台
                sleep(3000);
                log("脚本已恢复运行");
                continue;
            } else switch (isCurrentTaskPaused.get()) {
                case TASK_RUNNING:
                    break;
                case TASK_PAUSED:
                    sleep(200);
                    continue;
                    break;
                default:
                    throw new Error("Unknown isCurrentTaskPaused value");
            }

            //偶尔isGameDead会出现奇怪的“误判”:
            //游戏看上去还在运行,脚本却检测不到它在前台,而且游戏可能是黑屏假死状态,动弹不得
            //为尽量避免这个问题,这里进行“补刀”
            if (state == STATE_CRASHED || state == STATE_LOGIN) {
                ensureGameDeadCounter++;
                if (ensureGameDeadCounter >= 10) {
                    ensureGameDeadCounter = 0;
                    log("补刀再杀一次进程...");
                    killGame(string.package_name);
                    continue;
                }
            } else {
                ensureGameDeadCounter = 0;
            }

            //然后检测游戏是否闪退或掉线
            //因为STATE_TEAM状态下isGameDead里的掉线弹窗检查非常慢,故跳过头4回检查
            if (state == STATE_TEAM) {
                if (last_state != STATE_TEAM) bypassPopupCheckCounter = 4;
                if (bypassPopupCheckCounter-- > 0) {
                    bypassPopupCheck.set(1);
                } else {
                    bypassPopupCheck.set(0);
                }
            } else {
                bypassPopupCheckCounter = 0;
                bypassPopupCheck.set(0);
            }
            if (state != STATE_CRASHED && state != STATE_LOGIN && isGameDead(false)) {
                if (lastOpList != null) {
                    state = STATE_CRASHED;
                    log("进入闪退/登出重启前,先补刀再杀一次进程...");
                    killGame(string.package_name);
                    toastLog("进入闪退/登出重启...");
                    continue;
                } else {
                    toastLog("没有动作录制数据,不进入闪退/登出重启\n停止运行脚本...");
                    stopThread();
                }
            }

            //假死超时自动重开的计时点
            if (state != STATE_CRASHED && state != STATE_LOGIN) {
                if (state != last_state) {
                    stuckStartTime = new Date().getTime();
                } else if (!isNaN(parseInt(limit.forceStopTimeout))) {
                    let state_stuck_timeout = 1000 * parseInt(limit.forceStopTimeout);
                    let current_state_stuck_time = new Date().getTime() - stuckStartTime;
                    let stuck_seconds = parseInt(current_state_stuck_time / 1000);
                    if (current_state_stuck_time > state_stuck_timeout) {
                        if (lastOpList != null) {
                            toastLog("卡在状态"+StateNames[state]+"的时间太久("+stuck_seconds+"s),超过设定("+parseInt(limit.forceStopTimeout)+"s)\n杀进程重开...");
                            killGame(string.package_name);
                            state = STATE_CRASHED;
                        } else if (new Date().getTime() > lastStuckRemindTime + 10000) {
                            lastStuckRemindTime = new Date().getTime();
                            toastLog("卡在状态"+StateNames[state]+"的时间太久("+stuck_seconds+"s),超过设定("+parseInt(limit.forceStopTimeout)+"s)\n但是没加载选关动作录制数据\n不会杀进程重开");
                        }
                    }
                }
            }

            //无条件定时杀进程重开的计时点
            if (!isNaN(parseInt(limit.periodicallyKillTimeout))) {
                if (state == STATE_CRASHED || state == STATE_LOGIN) {
                    lastReLaunchTime = new Date().getTime();
                } else {
                    let deadlineTime = lastReLaunchTime + (parseInt(limit.periodicallyKillTimeout) * 1000);
                    if (state == STATE_BATTLE) {
                        //如果当前还是战斗状态就多等一段时间
                        let gracePeriod = parseInt(limit.periodicallyKillGracePeriod);
                        if (!isNaN(gracePeriod) && gracePeriod > 0) deadlineTime += gracePeriod * 1000;
                    }
                    if (new Date().getTime() > deadlineTime) {
                        let logString = "";
                        if (state == STATE_BATTLE) {
                            logString += "尽管战斗貌似还没结束(最多等待"+limit.periodicallyKillGracePeriod+"秒),\n";
                        }
                        logString += "无条件定时杀进程重开时间已到(每隔"+limit.periodicallyKillTimeout+"秒)。\n";
                        if (lastOpList != null) {
                            toastLog(logString+"杀进程重开...");
                            killGame(string.package_name);
                            state = STATE_CRASHED;
                        } else {
                            toastLog(logString+"但是没加载选关动作录制数据,不会杀进程重开");
                            lastReLaunchTime = new Date().getTime();
                        }
                    }
                }
            }

            //统计周回数(可能不准确)
            if (state != last_state && last_state == STATE_BATTLE) {
                updateCycleCount();
            }

            last_state = state;

            //打断官方自动周回的计时点
            switch(state) {
                case STATE_BATTLE:
                case STATE_REWARD_CHARACTER:
                case STATE_REWARD_MATERIAL:
                case STATE_REWARD_POST:
                    if (battleStartBtnClickTime == 0) {
                        battleStartBtnClickTime = new Date().getTime();
                    }
                    break;
                default:
                    battleStartBtnClickTime = 0;
            }

            //然后，再继续自动周回处理
            switch (state) {
                case STATE_CRASHED: {
                    if (lastOpList == null) {
                        toastLog("没有动作录制数据,退出");
                        stopThread();
                        break;
                    }
                    clickAerrPopup();//先点掉系统的崩溃提示弹窗
                    switch (isGameDead(2000)) {
                        case "crashed":
                            log("等待5秒后重启游戏...");
                            sleep(5000);
                            resetFatalKillerWatchDog(); //重设套娃监工WATCHDOG
                            reLaunchGame();
                            log("重启完成,再等待2秒...");
                            sleep(2000);
                            break;
                        case false: //isGameDead不知道游戏登录了没
                        case "logged_out":
                            log("闪退检测完成,进入登录页面");
                            state = STATE_LOGIN;
                            break;
                        default:
                            log("游戏闪退状态未知");
                            stopThread();
                    }
                    break;
                }
                case STATE_LOGIN: {
                    if (lastOpList == null) {
                        toastLog("没有动作录制数据,退出");
                        stopThread();
                        break;
                    }
                    clickAerrPopup();//先点掉系统的崩溃提示弹窗
                    if (isGameDead(2000) == "crashed") {
                        state = STATE_CRASHED;
                        break;
                    }
                    if (!reLogin()) {
                        if (findID("questLinkList") || findID("questWrapTitle")) {
                            state = STATE_MENU;
                            break;
                        }
                        if (find(string.support)) {
                            state = STATE_SUPPORT;
                            break;
                        }
                        if (findID("nextPageBtn")) {
                            state = STATE_TEAM;
                            break;
                        }
                        if (findID("ResultWrap") || findID("hasTotalRiche")) {
                            state = STATE_REWARD_CHARACTER;
                            break;
                        }
                        killGame(string.package_name);
                        state = STATE_CRASHED;
                        break;
                    }
                    if (replayOperations(lastOpList, true)) {//dontStopOnError设为true
                        toastLog("重放完成,报告成功,应该已经完成选关了");
                        state = STATE_MENU;
                        if (lastOpList != null && lastOpList.isEventTypeBRANCH) {
                            isFirstBRANCHClick = false;
                        }
                    }
                    //动作录制数据里会指定在失败时杀掉进程重启
                    break;
                }
                case STATE_MENU: {
                    waitAnyFast(
                        [
                            () => findFast(string.support),
                            () => findIDFast("helpBtn"),
                            () => matchFast(/^BATTLE.+/),
                            () => findIDFast("questLinkList"),
                            () => findIDFast("questWrapTitle"),
                            () => findIDFast("nextPageBtn"),
                            () => findIDFast("questLinkListWrap"),
                        ],
                        3000
                    );
                    // exit condition
                    if (find(string.support)) {
                        state = STATE_SUPPORT;
                        log("进入助战选择");
                        break;
                    }
                    if (findID("nextPageBtn")) {
                        state = STATE_TEAM;
                        toastLog("警告: 脚本不知道现在选了哪一关!"+
                                 "本轮"+((limit.useAuto&&(!limit.autoForPreferredOnly||(limit.preferredSupportCharaNames===""||limit.preferredSupportCharaNames==null||lastFoundPreferredChara)))?"官方周回":"战斗")+"结束后,\n"+
                                 "可能无法自动选关重新开始!");
                        log("进入队伍调整");
                        break;
                    }

                    let found_popup_ap_or_ticket_exhausted = findPopupInfoDetailTitle();
                    if (found_popup_ap_or_ticket_exhausted != null) switch (found_popup_ap_or_ticket_exhausted.title) {
                        case string.ticket_exhausted_title:
                           toastLog("门票耗尽,停止运行");
                           stopThread();
                           break;
                        case string.ap_refill_title:
                            //如果已经打开AP药选择窗口，就先尝试嗑药
                            //在 #31 之前,认为:
                            /* “走到这里的一种情况是:如果之前是在AP不足的情况下点击进入关卡，就会弹出AP药选择窗口” */
                            //但在合并 #31 之后，state在那种情况下会直接切换到STATE_SUPPORT，然后应该就不会走到这里了
                            refillAP();
                            //当初 #26 在这里加了break，认为：
                            /* “如果这里不break，在捕获了关卡坐标的情况下，继续往下执行就会错把助战当作关卡来点击
                               break后，下一轮循环state就会切换到STATE_SUPPORT，然后就避免了这个误点击问题” */
                            //但实际上这样并没有完全修正这个问题，貌似如果助战页面出现太慢，还是会出现误点击问题
                            //然后 #31 再次尝试修正这个问题
                           break;
                       default:
                           toastLog("出现意料之外的弹窗,标题:\n"+found_popup_ap_or_ticket_exhausted.title+"\n尝试关闭...");
                           click(found_popup_ap_or_ticket_exhausted.close);
                    }

                    //杜鹃花型活动需要在活动地图上点击开始按钮才能进入助战选择
                    let button = find(string.battle_confirm);
                    //LAST MAGIA活动的开始按钮
                    if (button == null) button = findID("battleStartBtn");
                    if (button) {
                        if (lastOpList != null && lastOpList.isEventTypeBRANCH) {
                            BRANCHclickAttemptCount = 0;
                        }
                        log("点击\""+getContent(button)+"\"(resID=\""+(button.id()!=null?button.id():"")+"\")进入battle");
                        let bound = button.bounds();
                        click(bound.centerX(), bound.centerY());
                        // wait for support screen for 5 seconds
                        find(string.support, parseInt(limit.timeout));
                    //按照之前记住的坐标自动选关
                    } else if (battlepos) {
                        log("尝试点击关卡坐标");
                        click(battlepos.x, battlepos.y);
                        waitAny(
                            [() => find(string.battle_confirm), () => find(string.support), () => find(string.out_of_ap)],
                            parseInt(limit.timeout)
                        );
                        if (find(string.out_of_ap)) {
                            log("点击关卡坐标后,弹出带\"AP不足\"的AP药选择窗口");
                            state = STATE_SUPPORT;
                        }
                    //没有之前记住的坐标,按关卡名自动选关
                    } else if (battlename) {
                        let battle = find(battlename);
                        if (battle) {
                            log("尝试点击关卡名称");
                            let bound = battle.bounds();
                            click(bound.centerX(), bound.centerY());
                            waitAny(
                                [() => find(string.battle_confirm), () => find(string.support), () => find(string.out_of_ap)],
                                parseInt(limit.timeout)
                            );
                            if (find(string.out_of_ap)) {
                                log("点击关卡坐标后,弹出带\"AP不足\"的AP药选择窗口");
                                state = STATE_SUPPORT;
                            }
                        }
                    //没有之前记住的坐标,没有关卡名,但有选关动作录制数据,根据情况:
                    } else if (lastOpList) {
                        toastLog("已加载动作录制数据");
                        //(1)如果是杜鹃花型活动则从动作录制数据里提取出选关坐标;
                        if (lastOpList.isEventTypeBRANCH) {
                            log("动作录制数据是杜鹃花型活动选关动作");
                            if (match(string.regex_event_branch)) {
                                toastLog("已进入活动地图");
                                if (isFirstBRANCHClick) {
                                    //在杜鹃花型活动地图点了启动脚本,无法保证一定能正确选关
                                    isFirstBRANCHClick = false;
                                    toastLog("无法保证一定能正确选关,先杀掉游戏再重启重新选关");
                                    killGame(string.package_name);
                                    break;
                                }
                                let op = lastOpList.steps.find((val) => val.action == "BRANCHclick");
                                if (op == null) {
                                    toastLog("错误: 没找到杜鹃花活动的点击选关动作,停止脚本");
                                    stopThread();
                                } else {
                                    if (BRANCHclickAttemptCount >= 5) {
                                        BRANCHclickAttemptCount = 0;
                                        toastLog("已进入活动地图,但之前点了5次选关都没成功,故杀进程重开...");
                                        killGame(string.package_name);
                                        break;
                                    }
                                    toastLog("在活动地图点击选关");
                                    if (lastOpList.isGeneric) {
                                        click(convertCoords(op.click.point));
                                    } else {
                                        click(op.click.point);
                                    }
                                    sleep(2000);
                                    BRANCHclickAttemptCount++;
                                }
                            } else {
                                BRANCHclickAttemptCount = 0;
                                toastLog("未进入活动地图,先杀掉游戏再重启重新选关");
                                killGame(string.package_name);
                            }
                        //(2)一般的选关动作录制数据,非杜鹃花,直接强关重开
                        } else {
                            toastLog("先杀掉游戏再重启重新选关");
                            killGame(string.package_name);
                        }
                    //没有之前记住的坐标,没有关卡名,也没有选关动作录制数据,那就捕获一个选关点击坐标
                    } else {
                        if (match(string.regex_event_branch)) {
                            //杜鹃花型活动
                            if (dialogs.confirm("警告",
                                   "看上去你已进入杜鹃花型活动的剧情地图。\n"
                                   +"请问在本次进入剧情地图后,你刚刚有没有把想刷的那一关重新通关一次？\n"
                                   +"即使之前已经通关过不止一次,只要你退出过(或者拖动过)游戏地图,现在也仍然需要先手动再通关一次。\n"
                                   +"别着急,耐心听我说完。魔纪这个游戏有个特点:\n"
                                   +"杜鹃花型活动在打完一局后,剧情地图会发生\"归中\"移动,导致一个严重的问题:\n"
                                   +"因为周回脚本目前并没有识图能力,只能闭着眼按照之前记录下来的坐标点击选关,\n"
                                   +"所以从第二轮周回开始,点击选关时就会错位,点到空白处,或者点到其他不想刷的关卡上。\n"
                                   +"\n"
                                   +"因此,你需要先打完一局,确保要打的那一关在剧情地图上已经\"归中\"过,这样坐标就固定下来不会变了。\n"
                                   +"\n"
                                   +"如果你已经这样准备好了,请点击\"确定\"。\n"
                                   +"不要偷懒,不要点进助战选择后直接点返回,一定要完整打一遍。\n"
                                   +"\n"
                                   +"如果你实在想偷懒,请点击\"取消\",脚本会尽量帮你校正点击坐标(但不保证一定准确),过程是:\n"
                                   +"  1.先提示你点击要刷的那一关;\n"
                                   +"  2.然后会自动把你点击的位置尽量往屏幕中心缓慢拖动(需要6秒完成);\n"
                                   +"  3.再次提示你点击要刷的那一关。"
                               ))
                            {
                                log("等待捕获关卡坐标");
                                battlepos = capture().pos_up;
                            } else {
                                log("等待第1次捕获杜鹃花关卡坐标");
                                let temp_battlepos = capture("请点击需要周回的battle").pos_up;
                                let bounds = getFragmentViewBounds();
                                toastLog("正在自动拖动剧情地图,需要6秒完成...");
                                swipe(temp_battlepos.x , temp_battlepos.y, bounds.centerX(), bounds.centerY(), 6000);
                                toast("自动拖动剧情地图已完成");
                                log("等待第2次捕获杜鹃花关卡坐标");
                                battlepos = capture("请再点击一次需要周回的battle").pos_up;
                            }
                        } else {
                            alert("警告",
                                "马上会提示你点击想刷的关卡。\n"
                                +"注意！关卡列表在完成一轮战斗后可能发生移动(一般是刚打完的那个关卡在战斗结束后会移动到列表顶端,不保证没有例外),\n"
                                +"因为目前周回脚本没有识图能力,\n"
                                +"所以这可能导致从第二轮周回开始,点击选关时就会错位,点到空白处,或者点到其他不想刷的关卡上。\n"
                                +"\n"
                                +"为了避免这个问题,在启动脚本前,请先把要刷的那一关重新打一遍,再用脚本周回。\n"
                                +"如果你没按照这样准备好,请先停止脚本,准备好了再启动。\n"
                                +"请不要偷懒,不要点进助战选择后直接点返回。一定要完整打一遍。\n"
                                +"如果实在是想偷懒,那么你可以先停止脚本,然后点进助战选择界面,在助战选择界面启动脚本(因为这样可以让脚本直接读取被选中的关卡名称),接着再观察这样能否正常周回。"
                            );
                            log("等待捕获关卡坐标");
                            battlepos = capture().pos_up;
                        }
                    }
                    break;
                }

                case STATE_SUPPORT: {
                    // exit condition
                    if (findID("nextPageBtn")) {
                        state = STATE_TEAM;
                        log("进入队伍调整");
                        break;
                    }
                    if (findID("detailTab")) {
                        //之前一轮循环中，选助战时，因为卡顿，点击变成了长按，
                        //然后就误触打开助战角色信息面版，需要关闭。
                        //因为后面refillAP出错时会break，等待“请选择支援角色”不出现也会break，
                        //所以，如果这里不检测助战角色信息面版就会死循环。
                        log("点击变长按，打开了detailTab，尝试返回");
                        click(convertCoords(clickSets.back));
                        find(string.support, parseInt(limit.timeout));
                    }
                    if (findID("questLinkList") || findID("questWrapTitle") || match(string.regex_event_branch)) {
                        //助战选择失败后会点击返回
                        //这里不检测BATTLE文字是否出现，避免叫做“BATTLE”的恶搞玩家名干扰
                        state = STATE_MENU;
                        log("进入关卡选择");
                        break;
                    }

                    //根据情况,如果需要就嗑药
                    if (refillAP() == "error") {
                        //AP检测失败，或者已经进入队伍调整
                        sleep(200);
                        break;
                    }

                    //等待“请选择支援角色”出现
                    log("等待\""+string.support+"\"出现...");
                    if (find(string.support, parseInt(limit.timeout)) == null) break;
                    log("等待\""+string.support+"\"已经出现");

                    // save battle name if needed
                    let battle = match(/^BATTLE.+/);
                    if (battle) {
                        battlename = getContent(battle);
                        log("已记下关卡名: \""+battlename+"\"");
                    }
                    // pick support
                    lastFoundPreferredChara = null;//是否匹配到优选助战
                    let pt_point = pickSupportWithMostPt();
                    if (pt_point != null) {
                        lastFoundPreferredChara = pt_point.foundPreferredChara;
                        pt_point = pt_point.point;
                    }
                    if (pt_point != null) {
                        toast("请勿手动拖动助战列表!\n自动点击助战...");
                        click(swipeToPointIfNeeded(pt_point));
                        // wait for start button for 5 seconds
                        if (findID("nextPageBtn", parseInt(limit.timeout))) {
                            state = STATE_TEAM;
                            log("进入队伍调整");
                        }
                        break;
                    } else {
                        toastLog("助战选择失败,点击返回重试");
                        click(convertCoords(clickSets.back));
                        //点击后等待默认最多5秒(可配置)
                        waitAny(
                          [
                            () => findID("questLinkList"),
                            () => findID("questWrapTitle")
                          ],
                          parseInt(limit.timeout)
                        );
                        break;
                    }
                    //以前这里是处理万一误触打开助战角色信息面版的情况的，现在移动到前面
                    break;
                }

                case STATE_TEAM: {
                    //如果在开启“优先使用官方自动续战”的同时,还开启了“只对优选助战使用官方自动续战”,
                    //那么是否要优先点击自动续战按钮还得考虑这一次(每次情况都可能不一样)有没有找到符合优选条件的助战
                    //这里赋值为true或false,避免把object或undefined赋值进去
                    var shouldUseAuto = (limit.useAuto&&(!limit.autoForPreferredOnly||(limit.preferredSupportCharaNames===""||limit.preferredSupportCharaNames==null||lastFoundPreferredChara))) ? true : false;

                    //走到这里时肯定至少已经检测到开始按钮,即nextPageBtn
                    //因为后面检测误触弹窗和按钮比较慢,先闭着眼点一下开始或自动续战按钮
                    //一开始不知道自动续战按钮是否存在(后面检测了才知道),默认当作存在,
                    //然后(如果需要优先点击自动续战的话)即便按钮实际不存在也只是多点空一次,无害,
                    //即使这次点空了,后面检测完按钮仍然会再点一次补上
                    var BtnNameStartOrAuto = shouldUseAuto && isStartAutoRestartBtnAvailable ? "startAutoRestart" : "start";
                    log("抢先点击"+(shouldUseAuto&&isStartAutoRestartBtnAvailable?"自动续战":"开始")+"按钮");
                    click(convertCoords(clickSets[BtnNameStartOrAuto]));
                    sleep(300);//避免过于频繁的反复点击、尽量避免游戏误以为长按没抬起（Issue #205）

                    //检测自动续战或开始按钮是否存在(但并不是每次都会把两个按钮都检测一遍)
                    var element = shouldUseAuto ? findID("nextPageBtnLoop") : findID("nextPageBtn");
                    if (shouldUseAuto) {
                        if (element) {
                            //这次需要点击自动续战按钮,确定这个按钮确实存在
                            isStartAutoRestartBtnAvailable = true;
                            inautobattle = true;
                        } else {
                            //这次需要点自动续战按钮,但没找到这个按钮,
                            //可能是这个副本确实没有自动续战按钮,只有开始按钮可以点,也可能是其实因为已经进入战斗了,所以两个按钮都找不到
                            element = findID("nextPageBtn");
                            if (element) {
                                //没有自动续战按钮,只有开始按钮
                                isStartAutoRestartBtnAvailable = false;
                                inautobattle = false;
                                log("未发现自动续战，改用标准战斗");
                            } else {
                                //应该只是进入战斗了,这个时候虽然确实检测不到自动续战按钮,
                                //但这(可能)并不是因为只有开始按钮、没有自动续战按钮,
                                //而仅仅是因为战斗开始后两个按钮(如果有自动续战的话)其实都消失了,
                                //所以,这个时候其实压根就没检测出来自动续战按钮是什么情况,
                                //就不对isStartAutoRestartBtnAvailable重新赋值了,
                                //让isStartAutoRestartBtnAvailable继续沿用之前的值就好
                                log("自动续战和开始按钮都没出现");
                                //对inautobattle则是必须重新赋值
                                inautobattle = shouldUseAuto && isStartAutoRestartBtnAvailable;
                                log("inautobattle="+inautobattle);
                            }
                        }
                    } else {
                        //如果这次本来就不需要点击自动续战按钮,那么只需要检测开始按钮是否存在,然后以此作为战斗是否开始的判定一句即可
                        //因为没去检测自动续战按钮是否存在,所以就不对isStartAutoRestartBtnAvailable重新赋值了(而且也用不到这个变量了)
                        inautobattle = false;
                    }
                    // exit condition
                    if (findID("android:id/content") && !element) {
                        if (inautobattle == null) {
                            //正常情况下应该走不到这里
                            let guessedinautobattle = shouldUseAuto && isStartAutoRestartBtnAvailable;
                            toastLog("警告:不知道本轮战斗是否使用了自动续战\n当作"+(guessedinautobattle?"使用了":"没使用")+"自动续战继续运行");
                            log("shouldUseAuto="+shouldUseAuto);
                            log("isStartAutoRestartBtnAvailable="+isStartAutoRestartBtnAvailable);
                            inautobattle = guessedinautobattle;
                        }
                        state = STATE_BATTLE;
                        log("进入战斗");
                        break;
                    }
                    // click start
                    if (element) {
                        battleStartBtnClickTime = new Date().getTime();
                        let bound = element.bounds();
                        log("再次点击"+getContent(element)+"按钮");
                        click(bound.centerX(), bound.centerY());
                        sleep(300);//避免过于频繁的反复点击、尽量避免游戏误以为长按没抬起（Issue #205）
                        waitElement(element, 200);
                    }

                    //如果之前误触了队伍名称变更，尝试关闭
                    //这个窗口出现时，点击开始或自动续战按钮都不会有影响，所以放到后面
                    var found_popup = null;
                    found_popup = findPopupInfoDetailTitle();
                    if (found_popup != null) {
                        log("在队伍调整界面发现有弹窗\""+found_popup.title+"\"已经打开");
                        if (found_popup.title != string.team_name_change) {
                            log("弹窗标题不是意料之中的\""+string.team_name_change+"\"！");
                        }
                        log("尝试关闭弹窗");
                        click(found_popup.close);
                        sleep(200);
                        break;
                    }

                    break;
                }

                case STATE_BATTLE: {
                    //点击开始或自动续战按钮，在按钮消失后，就会走到这里
                    //还在战斗，或者在战斗结束时弹出断线重连窗口，就会继续在这里循环
                    //直到战斗结束，和服务器成功通信后，进入结算

                    // exit condition
                    //这里会等待2秒，对于防断线模式来说就是限制每2秒点击一次重连按钮的所在位置
                    //另一方面，也可以极大程度上确保防断线模式不会在结算界面误点
                    waitAnyFast(
                        [
                            () => findIDFast("ResultWrap"),
                            () => findIDFast("hasTotalRiche")
                        ],
                        2000
                    );
                    if (findID("ResultWrap")) {
                        state = STATE_REWARD_CHARACTER;
                        log("进入角色结算");
                        break;
                    } else if (findID("hasTotalRiche")) {
                        state = STATE_REWARD_CHARACTER;
                        break;
                    } else if (getAP() != null) {
                        state = STATE_REWARD_POST;
                        log("检测到AP控件，之前可能并不处于战斗状态");
                        break;
                    }
                    //防断线模式
                    if (limit.autoReconnect) {
                        //无法判断断线重连弹窗是否出现，但战斗中点击一般也是无害的
                        //（不过也有可能因为机器非常非常非常卡，点击变成了长按，导致误操作取消官方自动续战）
                        clickReconnect();
                    }
                    let auto_cycle_break_duration = parseInt(limit.breakAutoCycleDuration);
                    if (!isNaN(auto_cycle_break_duration) && auto_cycle_break_duration > 0) {
                        if (
                            battleStartBtnClickTime != 0
                            && new Date().getTime() > battleStartBtnClickTime + 1000 * auto_cycle_break_duration
                           )
                        {
                            log("时间到,长按屏幕以打断官方自动周回...");
                            swipe(convertCoords(clickSets.reconection), convertCoords(clickSets.reconection), 5000);
                            log("长按操作已完成");
                        }
                    }
                    break;
                }

                case STATE_REWARD_CHARACTER: {
                    // exit condition
                    if (findID("hasTotalRiche")) {
                        state = STATE_REWARD_MATERIAL;
                        log("进入掉落结算");
                        break;
                    }
                    let pop_follow = findPopupInfoDetailTitle(string.follow);
                    if (pop_follow != null) {
                        //关注陌生人
                        //这里本来可以类似find(string[limit.autoFollow?"yesfocus":"nofocus"])这样，找“是”或“否”，
                        //但是我懒得开台服日服去找字符串了。另外万一要关注的玩家就叫“是”或“否”呢？
                        log("关注路人助战 "+(limit.autoFollow?"是":"否"));
                        click(convertCoords(clickSets[limit.autoFollow?"yesfocus":"nofocus"]));
                        break;
                    }
                    let pop_follow_append = findPopupInfoDetailTitle(string.follow_append);
                    if (pop_follow_append != null) {
                        //点“是”关注后会弹出关注追加弹窗，现在把它关闭
                        log("关闭关注追加弹窗");
                        //click(pop_follow_append.close); //在MuMu上点不到
                        click(convertCoords(clickSets.focusclose));
                        break;
                    }
                    let element = findID("ResultWrap");
                    if (element) {
                        if (element.bounds().height() > 0) charabound = element.bounds();
                        let targetConverted = convertCoords(clickSets.reconection);
                        let targetX = targetConverted.x;
                        let targetY = targetConverted.y;
                        // click if upgrade
                        element = find("OK");
                        if (element) {
                            log("点击玩家升级确认");
                            let bound = element.bounds();
                            targetX = bound.centerX();
                            targetY = bound.centerY();
                        }
                        click(targetX, targetY);
                    } else {
                        let currentTime = new Date().getTime();
                        let stuckTimeOutSeconds = 10;
                        if (lastStateRewardCharacterStuckTime == null) {
                            lastStateRewardCharacterStuckTime = currentTime;
                        } else if (currentTime > lastStateRewardCharacterStuckTime + stuckTimeOutSeconds * 1000) {
                            lastStateRewardCharacterStuckTime = null;
                            state = STATE_REWARD_MATERIAL; //如果开启了防断线模式，那就可以点击掉线重连
                            log("进入角色结算状态后ResultWrap控件消失了超过"+stuckTimeOutSeconds+"秒");
                            log("可能是自动续战中错过了掉落结算、然后在开始战斗时又掉线卡住");
                            log("进入掉落结算(虽然可能已经错过)");
                            break;
                        }
                    }
                    sleep(500);
                    break;
                }

                case STATE_REWARD_MATERIAL: {
                    //走到这里的可能情况：
                    // (1)点再战按钮，回到助战选择界面
                    // (2)没有再战按钮时点击，回到关卡选择界面

                    // exit condition
                    let element = findID("hasTotalRiche", 2000);
                    if (findID("android:id/content") && !element) {
                        state = STATE_REWARD_POST;
                        /*
                        //实验发现，在战斗之外环节掉线会让游戏重新登录回主页，无法直接重连，所以注释掉
                        stuckatreward = false;
                        rewardtime = null;
                        */
                        log("结算完成");
                        break;
                    }
                    /*
                    //防断线模式
                    //实验发现，在战斗之外环节掉线会让游戏重新登录回主页，无法直接重连，所以注释掉
                    if (limit.autoReconnect) {
                        if (!stuckatreward) {
                            //如果发现在这里停留了30秒以上，就认为已经是断线了
                            //然后就会尝试点击一次断线重连按钮
                            if (rewardtime == null) {
                                rewardtime = new Date().getTime();
                            } else if (new Date().getTime() - rewardtime > 30 * 1000) stuckatreward = true;
                        } else {
                            //尝试点击一次断线重连按钮，为防止误点，只点击一次就不再点，再观察30秒
                            clickReconnect();
                            stuckatreward = false;
                            rewardtime = null;
                        }
                    }
                    */
                    // try click rebattle
                    //设置了使用自动续战的时候，在结算界面优先点击自动续战而不是再战按钮
                    //inautobattle只有在（之前队伍调整界面检测过）确定知道有自动续战按钮时才才会是true，否则会是false（确定知道没有）或null（不知道有没有）
                    //然后，如果已经检测到了或加载了关卡名/关卡坐标/选关动作录制数据，即便点到了空白处（除非AP耗尽，这不应该发生）也仍然能自动选关
                    let clickLoopBtn = false;
                    if (inautobattle && (battlename || battlepos || lastOpList)) clickLoopBtn = true;
                    element = findID(clickLoopBtn ? "questLoopBtn" : "questRetryBtn");
                    if (element) {
                        log("点击"+(clickLoopBtn?"自动续战":"再战")+"按钮");
                        let bound = element.bounds();
                        click(bound.centerX(), bound.centerY());
                    } else {
                        //走到这里的可能情况:
                        //(1) AP不够再战一局（常见原因是官方自动续战）
                        //(2) UI控件树残缺，明明有再战按钮却检测不到
                        log("点击"+(clickLoopBtn?"自动续战":"再战")+"按钮区域");
                        //    (如果屏幕是宽高比低于16:9的“方块屏”，还会因为再战按钮距离charabound右下角太远而点不到再战按钮，然后就会回到关卡选择)
                        //if (charabound) click(charabound.right, charabound.bottom);
                        click(convertCoords(clickLoopBtn ? clickSets.restartIntoLoop : clickSets.restart));
                    }
                    sleep(500);
                    break;
                }

                case STATE_REWARD_POST: {
                    // wait 5 seconds for transition
                    let apinfo = getAP(5000);
                    // exit condition
                    if (findID("nextPageBtn")) {
                        state = STATE_SUPPORT;
                        log("进入助战选择");
                        break;
                    } else if (apinfo != null) {
                        state = STATE_MENU;
                        log("进入关卡选择");
                        break;
                    } else if (inautobattle == null) {
                        toastLog("无法识别状态,\n不知道是战斗/剧情播放还是其他状态");
                        if (lastOpList == null) {
                            toastLog("结束运行");
                            stopThread();
                        } else {
                            toastLog("杀进程重开游戏...");
                            killGame(string.package_name);
                        }
                        break;
                    } else if (inautobattle) {
                        state = STATE_BATTLE;
                        break;
                    }
                    //点击跳过剧情
                    //出现这些控件中的任何一个即说明已经跳过剧情，然后就可以避免误触MENU。
                    //有时候单单靠上面getAP检测AP余量控件是否出现还不够，还是可能偶发误触MENU按钮，
                    //因为AP余量控件可能会概率性玄学消失（用Android SDK里的UI Automator Viewer工具抓到的布局里也完全缺失这个控件）
                    //因此，只能尽量多检测几个控件id来尽可能降低误触MENU的风险。
                    let IDsToFind = ["menu", "helpBtn", "sideMenu", "menuBtns", "sideBigBtns"];
                    if (!IDsToFind.find((val) => id(val).findOnce() != null)) {
                        log("尝试跳过剧情");
                        click(convertCoords(clickSets.skip));
                    }
                    break;
                }
            }
        }
    }

    /* ~~~~~~~~ 截图兼容模块 开始 ~~~~~~~~ */
    var CwvqLUPkgName = context.getPackageName();
    var dataDir = files.cwd();

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
    //在/data/local/tmp/下安装scrcap2bmp
    var binarySetupDone = false;
    const binURLBase = "https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle@4.6.0";
    function setupBinary() {
        if (binarySetupDone) return binarySetupDone;

        let binaryFileName = "scrcap2bmp";
        let binaryCopyToPath = "/data/local/tmp/"+CwvqLUPkgName+"/sbin/"+binaryFileName;
        detectABI();

        let binaryCopyFromPath = dataDir+"/bin/"+binaryFileName+"-"+shellABI;
        if (!files.isFile(binaryCopyFromPath)) return;

        //adb shell的权限并不能修改APP数据目录的权限，所以先要用APP自己的身份来改权限
        normalShell("chmod a+x "+dataDir+"/../../"); // pkgname/
        normalShell("chmod a+x "+dataDir+"/../");    // pkgname/files/
        normalShell("chmod a+x "+dataDir);           // pkgname/files/project/
        normalShell("chmod a+x "+dataDir+"/bin");

        normalShell("chmod a+r "+binaryCopyFromPath);

        privShell("mkdir "+"/data/local/tmp/"+CwvqLUPkgName);
        privShell("mkdir "+"/data/local/tmp/"+CwvqLUPkgName+"/sbin");
        privShell("chmod 755 "+"/data/local/tmp/"+CwvqLUPkgName);
        privShell("chmod 755 "+"/data/local/tmp/"+CwvqLUPkgName+"/sbin");

        privShell("cat "+binaryCopyFromPath+" > "+binaryCopyToPath);
        privShell("chmod 755 "+binaryCopyToPath);

        binarySetupDone = true;
    }

    //申请截屏权限
    //可能是CwvqLUPro本身的问题，截图权限可能会突然丢失，logcat可见：
    //VirtualDisplayAdapter: Virtual display device released because application token died: top.momoe.auto
    //应该就是因为这个问题，截到的图是不正确的，会截到很长时间以前的屏幕（应该就是截图权限丢失前最后一刻的屏幕）
    //猜测这个问题与转屏有关，所以尽量避免转屏（包括切入切出游戏）
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
            if (!requestScreenCaptureSuccess) {
                try {
                    floatUI.hideAllFloaty();
                    requestScreenCaptureSuccess = requestScreenCapture(screencap_landscape);
                } catch (e) {
                    //logException(e); issue #126
                    try {log(e);} catch (e2) {};
                }
                floatUI.recoverAllFloaty();
            }
            if (requestScreenCaptureSuccess) {
                //雷电模拟器下，返回的截屏数据是横屏强制转竖屏的，需要检测这种情况
                initializeScreenCaptureFix();

                sleep(2000); //等待toast消失，比如“恢复显示悬浮窗”
                instantToast(
                    "获取截屏权限成功。\n为避免截屏出现问题，请务必不要转屏，也不要切换出游戏"
                );
                log("获取截屏权限成功");
                sleep(2000);
                canCaptureScreen = true;
                break;
            } else {
                log("第", attempt, "次获取截图权限失败");
                sleep(1000);
            }
        }

        if (!canCaptureScreen) {
            toastLog("截图权限获取失败，退出");
            stopThread();
        }

        return;
    }

    //有些模拟器无法截屏，返回的截屏数据是空白
    function isImageBlank(img) {
        if ([colors.BLACK, colors.WHITE].find((c) => images.findColor(img, c, {threshold: 254}) == null))
            return true;
        else
            return false;
    }
    // TODO 这个函数目前只在root权限截屏种使用，但内部也没检测是不是root权限截屏
    var isRootScreencapBlank = null;
    function testRootScreencapBlank() {
        if (isRootScreencapBlank == null) isRootScreencapBlank = isImageBlank(compatCaptureScreen());
        if (isRootScreencapBlank) {
            toastLog("截屏结果貌似是空白的，停止运行\n请尝试换一个模拟器");
            return true;
        } else {
            return false;
        }
    }

    //雷电模拟器下，返回的截屏数据是横屏强制转竖屏的，需要检测这种情况
    var needScreenCaptureFix = false;
    var needResizeWorkaround = null;
    function initializeScreenCaptureFix() {
        needResizeWorkaround = null;
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
            log("检测是否返回了空白图像...");
            if (isImageBlank(screenshot)) {
                toastLog("录屏API似乎返回了空白图像,\n脚本将停止运行。\n请使用root或adb权限截屏");
                throw new Error("initializeScreenCaptureFix detected blank screenshot");
            } else {
                log("检测完成,并不是空白图像");
            }
        } catch (e) {
            hasScreenCaptureError = true;
            dialogs.alert("截屏出错",
                "通过录屏API截屏时出错。\n"
                +"请尝试在识图自动战斗脚本设置中开启\"使用root或adb权限截屏\",或者换一个模拟器(比如安卓9的MuMu)再试试。");
            throw e;
        }
    }

    //用shizuku adb/root权限，或者直接用root权限截屏
    var screencapShellCmdThread = null;
    var screencapLength = -1;
    var localHttpListenPort = -1;
    function detectScreencapLength() {
        let result = privShell("screencap | "+"/data/local/tmp/"+CwvqLUPkgName+"/sbin/scrcap2bmp -a -l");
        if (result.code == 0) return parseInt(result.error);
        throw "detectScreencapLengthFailed"
    }
    function findListenPort() {
        for (let i=11023; i<65535; i+=16) {
            let cmd = "/data/local/tmp/"+CwvqLUPkgName+"/sbin/scrcap2bmp -t"+i;
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
                Error.captureStackTrace(e, renewImage); //不知道CwvqLU的Rhino是什么版本，不captureStackTrace的话，e.stack == null
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


    var staleScreenshot = {img: null, lastTime: 0, timeout: 1000};
    var compatCaptureScreen = syncer.syn(function () {
        if (limit.rootScreencap) {
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
                    let cmd = "screencap | "+"/data/local/tmp/"+CwvqLUPkgName+"/sbin/scrcap2bmp -a -w5 -p"+localHttpListenPort;
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
            //使用CwvqLU默认提供的录屏API截图
            let screenshot = captureScreen();
            let time = new Date().getTime();
            if (staleScreenshot.img == null) {
                staleScreenshot.img = screenshot;
                staleScreenshot.lastTime = time;
            }
            if (time > staleScreenshot.lastTime + staleScreenshot.timeout) {
                staleScreenshot.lastTime = time;
                //正常情况下老图应该已经被回收了,而且回收老图肯定不应该影响新图
                try {staleScreenshot.img.recycle();} catch (e) {}
                staleScreenshot.img = screenshot;
                try {images.pixel(screenshot, 0, 0);} catch (e) {
                    toastLog("截屏出错,多次尝试后截屏数据仍未刷新,\n将停止运行脚本运行。\n请尝试开启\"使用root或adb权限截屏\"");
                    throw e;
                }
            }
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

                if (needResizeWorkaround == null) {
                    try {
                        let testPixel = images.pixel(resizedImg, resizedImg.getWidth()-1, resizedImg.getHeight()-1);
                    } catch (e) {
                        logException(e);
                        needResizeWorkaround = true;
                        log(deObStr("检测到CwvqLU Pro的缩放截图崩溃bug,启用绕过措施"));
                    }
                    if (needResizeWorkaround == null) needResizeWorkaround = false;
                }
                if (needResizeWorkaround) {
                    let reclippedImg = images.clip(resizedImg, 0, 0, resizedImg.getWidth(), resizedImg.getHeight());
                    resizedImg.recycle();
                    resizedImg = reclippedImg;
                }

                return renewImage(resizedImg, "fixedScreenshot", tagOnly);
            } else {
                return screenshot;
            }
        }
    });
    /* ~~~~~~~~ 截图兼容模块 结束 ~~~~~~~~ */

    /* ~~~~~~~~ 镜界自动战斗 开始 ~~~~~~~~ */
    var clickSetsMod = {
        ap: {
            x: 1000,
            y: 50,
            pos: "top"
        },
        apDrug50: {
            x: 400,
            y: 900,
            pos: "center"
        },
        apDrugFull: {
            x: 900,
            y: 900,
            pos: "center"
        },
        apMoney: {
            x: 1500,
            y: 900,
            pos: "center"
        },
        apConfirm: {
            x: 1160,
            y: 730,
            pos: "center"
        },
        apclose: {
            x: 1900,
            y: 20,
            pos: "center"
        },
        start: {
            x: 1800,
            y: 1000,
            pos: "bottom"
        },
        startAutoRestart: {
            x: 1800,
            y: 750,
            pos: "bottom"
        },
        levelup: {
            x: 960,
            y: 870,
            pos: "center"
        },
        restart: {
            x: 1800,
            y: 1000,
            pos: "bottom"
        },
        reconnectYes: {
            x: 700,
            y: 750,
            pos: "center"
        },
        followConfirm: {
            x: 1220,
            y: 860,
            pos: "center"
        },
        followClose: {
            x: 950,
            y: 820,
            pos: "center"
        },
        skip: {
            x: 1870,
            y: 50,
            pos: "top"
        },
        huodongok: {
            x: 1600,
            y: 800,
            pos: "center"
        },
        bpExhaustToBpDrug: {
            x: 1180,
            y: 830,
            pos: "center"
        },
        bpDrugConfirm: {
            x: 960,
            y: 880,
            pos: "center"
        },
        bpDrugRefilledOK: {
            x: 960,
            y: 900,
            pos: "center"
        },
        bpClose: {
            x: 750,
            y: 830,
            pos: "center"
        },
        battlePan1: {
            x: 400,
            y: 950,
            pos: "bottom"
        },
        battlePan2: {
            x: 700,
            y: 950,
            pos: "bottom"
        },
        battlePan3: {
            x: 1000,
            y: 950,
            pos: "bottom"
        },
        mirrorsStartBtn: {
            x: 1423,
            y: 900,
            pos: "center"
        },
        mirrorsOpponent1: {
            x: 1113,
            y: 303,
            pos: "center"
        },
        mirrorsOpponent2: {
            x: 1113,
            y: 585,
            pos: "center"
        },
        mirrorsOpponent3: {
            x: 1113,
            y: 866,
            pos: "center"
        },
        mirrorsCloseOpponentInfo: {
            x: 1858,
            y: 65,
            pos: "center"
        },
        back: {
            x: 100,
            y: 50,
            pos: "top"
        },
        recover_battle: {
            x: 1230,
            y: 730,
            pos: "center"
        },
        skillPanelSwitch: {
            x: 1773,
            y: 927,
            pos: "bottom"
        }
    }

    //已知参照图像，包括A/B/C/M/D盘等
    const ImgPathBase = files.join(files.cwd(), "images");
    var knownImgs = {};
    const knownImgNames = [
        "accel",
        "blast",
        "charge",
        "magia",
        "doppel",
        "connectIndicator",
        "connectIndicatorBtnDown",
        "light",
        "dark",
        "water",
        "fire",
        "wood",
        "none",
        "lightBtnDown",
        "darkBtnDown",
        "waterBtnDown",
        "fireBtnDown",
        "woodBtnDown",
        "noneBtnDown",
        "mirrorsWinLetterI",
        "mirrorsLose",
        "skillLocked",
        "skillEmptyCHS",
        "skillEmptyCHT",
        "skillEmptyJP",
        "OKButton",
        "OKButtonGray",
    ];

    var loadAllImages = syncer.syn(function () {
            let hasNull = false;
            knownImgNames.forEach((key) => {
                if (knownImgs[key] == null) {
                    log("加载图片 "+key+" ...");
                    knownImgs[key] = images.read(files.join(ImgPathBase, key+".png"));
                    if (knownImgs[key] == null) hasNull = true;
                }
            });
            if (!hasNull) {
                log("全部图片加载完成");
                return true;
            } else {
                toastLog("有图片加载失败");
                return false;
            }
    });
    threads.start(function () {loadAllImages();});

    //矩形参数计算，宽度、高度、中心坐标等等
    function getAreaWidth_(topLeft, bottomRight) {
        return bottomRight.x - topLeft.x + 1;
    }
    function getAreaHeight_(topLeft, bottomRight) {
        return bottomRight.y - topLeft.y + 1;
    }
    function getAreaCenter_(topLeft, bottomRight) {
        var result = {x: 0, y: 0, pos: "top"};
        var width = getAreaWidth(topLeft, bottomRight);
        var height = getAreaHeight(topLeft, bottomRight);
        result.x = topLeft.x + parseInt(width / 2);
        result.y = topLeft.y + parseInt(height / 2);
        result.pos = topLeft.pos;
        return result;
    }
    function getAreaWidth() {
        switch(arguments.length) {
        case 1:
            var area = arguments[0];
            return getAreaWidth_(area.topLeft, area.bottomRight);
            break;
        case 2:
            var topLeft = arguments[0];
            var bottomRight = arguments[1];
            return getAreaWidth_(topLeft, bottomRight);
            break;
        default:
            throw "getAreaWidthArgcIncorrect"
        };
    }
    function getAreaHeight() {
        switch(arguments.length) {
        case 1:
            var area = arguments[0];
            return getAreaHeight_(area.topLeft, area.bottomRight);
            break;
        case 2:
            var topLeft = arguments[0];
            var bottomRight = arguments[1];
            return getAreaHeight_(topLeft, bottomRight);
            break;
        default:
            throw "getAreaWidthArgcIncorrect"
        };
    }
    function getAreaCenter() {
        switch(arguments.length) {
        case 1:
            var area = arguments[0];
            return getAreaCenter_(area.topLeft, area.bottomRight);
            break;
        case 2:
            var topLeft = arguments[0];
            var bottomRight = arguments[1];
            return getAreaCenter_(topLeft, bottomRight);
            break;
        default:
            throw "getAreaWidthArgcIncorrect"
        };
    }


    //已知左上角站位坐标等数据
    var knownFirstStandPointCoords = {
        our: {
            attrib: {
                topLeft:     { x: 1047, y: 274, pos: "center" },
                bottomRight: { x: 1076, y: 303, pos: "center" }
            },
            floor: {
                topLeft:     { x: 1048, y: 518, pos: "center" },
                bottomRight: { x: 1168, y: 575, pos: "center" }
            }
        },
        their: {
            attrib: {
                topLeft:     { x: 230, y: 275, pos: "center" },
                bottomRight: { x: 259, y: 304, pos: "center" }
            },
            floor: {
                topLeft:     { x: 258, y: 520, pos: "center" },
                bottomRight: { x: 361, y: 573, pos: "center" }
            }
        },
        //our
        //r1c1x: 1090, r1c1y: 280
        //r2c1x: 1165, r2c1y: 383
        //r2c2x: 1420, r2c2y: 383
        //their
        //r1c1x: 230, r1c1y: 275
        //r2c2y: 410, r2c2y: 378
        //r3c1x: 80,  r3c1y:481
        distancex: 255,
        distancey: 103,
        indent: 75
    }

    //我方阵地信息
    var battleField = {
        our: {
            topRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 2 }
            },
            middleRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 2 }
            },
            bottomRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 2 }
            }
        },
        their: {
            topRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 2 }
            },
            middleRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 2 }
            },
            bottomRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 2 }
            },
            lastAimedAtEnemy: { occupied: true, attrib: "none", charaID: -1, rowNum: 0, columnNum: 0 }
        }
    };
    var rows = ["topRow", "middleRow", "bottomRow"];
    var columns = ["left", "middle", "right"];
    var rowsNum = {topRow: 0, middleRow: 1, bottomRow: 2};
    var columnsNum = {left: 0, middle: 1, right: 2};


    //获取换算后的角色站位所需部分（血条右边框，地板等等）坐标
    function getStandPointCoords(whichSide, rowNum, columnNum, part, corner) {
        let convertedCoords = { x: 0, y: 0, pos: "bottom" };
        let firstStandPoint = knownFirstStandPointCoords[whichSide][part][corner];
        let distancex = knownFirstStandPointCoords.distancex;
        let distancey = knownFirstStandPointCoords.distancey;
        let indent = 0;
        if (whichSide == "our") {
            indent = knownFirstStandPointCoords.indent;
        } else if (whichSide == "their") {
            indent = 0 - knownFirstStandPointCoords.indent;
        } else {
            throw "getStandPointCoordsIncorrectwhichSide";
        }
        convertedCoords.x = firstStandPoint.x + rowNum * indent + distancex * columnNum;
        convertedCoords.y = firstStandPoint.y + rowNum * distancey;
        convertedCoords.pos = firstStandPoint.pos;
        return convertCoords(convertedCoords);
    }
    function getStandPointArea(whichSide, rowNum, columnNum, part) {
        let firstStandPointArea = {
            topLeft:     getStandPointCoords("our", 0, 0, part, "topLeft"),
            bottomRight: getStandPointCoords("our", 0, 0, part, "bottomRight")
        };
        let resultTopLeft = getStandPointCoords(whichSide, rowNum, columnNum, part, "topLeft");
        let result = {
            topLeft: resultTopLeft,
            bottomRight: { //防止图像大小不符导致MSSIM==-1
                x:   resultTopLeft.x + getAreaWidth(firstStandPointArea) - 1,
                y:   resultTopLeft.y + getAreaHeight(firstStandPointArea) - 1,
                pos: resultTopLeft.pos
            }
        };
        return result;
    }

    //截取指定站位所需部分的图像
    function getStandPointImg(screenshot, whichSide, rowNum, columnNum, part) {
        let area = getStandPointArea(whichSide, rowNum, columnNum, part);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    //识别指定站位的属性
    function getStandPointAttrib(screenshot, whichSide, rowNum, columnNum) {
        let similarity = -1;
        for (let i=0; i<diskAttribs.length; i++) {
            let img = getStandPointImg(screenshot, whichSide, rowNum, columnNum, "attrib");
            let testAttrib = diskAttribs[i];
            let refImg = knownImgs[testAttrib];
            let firstStandPointArea = getStandPointArea("our", 0, 0, "attrib");
            let gaussianX = parseInt(getAreaWidth(firstStandPointArea) / 2);
            let gaussianY = parseInt(getAreaHeight(firstStandPointArea) / 2);
            if (gaussianX % 2 == 0) gaussianX += 1;
            if (gaussianY % 2 == 0) gaussianY += 1;
            let gaussianSize = [gaussianX, gaussianY];
            let imgBlur = renewImage(images.gaussianBlur(img, gaussianSize));
            let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
            similarity = images.getSimilarity(refImgBlur, imgBlur, {"type": "MSSIM"});
            if (similarity > 2.1) {
                log("第", rowNum+1, "行，第", columnNum+1, "列站位【有人】 属性", testAttrib, "MSSIM=", similarity);
                return testAttrib;
            }
        }
        log("第", rowNum+1, "行，第", columnNum+1, "列站位无人 MSSIM=", similarity);
        throw "getStandPointAttribInconclusive";
    }

    //扫描战场信息
    function scanBattleField(whichSide)
    {
        log("scanBattleField("+whichSide+")");
        let screenshot = compatCaptureScreen();
        for(let i=0; i<3; i++) {
            for(let j=0; j<3; j++) {
                let whichStandPoint = battleField[whichSide][rows[i]][columns[j]];
                whichStandPoint.occupied = true;
                try {
                    whichStandPoint.attrib = getStandPointAttrib(screenshot, whichSide, i, j);
                } catch (e) {
                    if (e.toString() != "getStandPointAttribInconclusive") log(e);
                    whichStandPoint.attrib = "none";
                    whichStandPoint.occupied = false;
                }
                whichStandPoint.charaID = -1; //现在应该还不太能准确识别，所以统一填上无意义数值，在发动连携后会填上有意义的数值
            }
        }
    }

    //获取有存活角色的站位
    function getAliveStandPoints(whichSide) {
        let result = [];
        for(let i=0; i<3; i++) {
            for(let j=0; j<3; j++) {
                let standPoint = battleField[whichSide][rows[i]][columns[j]];
                if (standPoint.occupied) {
                    result.push(standPoint);
                }
            }
        }
        return result;
    }


    //获取行动盘信息

    //已知行动盘坐标
    var knownFirstDiskCoords = {
        action: {
            topLeft: {
                x:   359,
                y:   1016,
                pos: "bottom"
            },
            bottomRight: {
                x:   480,
                y:   1039,
                pos: "bottom"
            }
        },
        charaImg: {
            topLeft: {
                x:   393,
                y:   925,
                pos: "bottom"
            },
            bottomRight: {
                x:   449,
                y:   996,
                pos: "bottom"
            }
        },
        attrib: {
            topLeft: {
                x:   349,
                y:   966,
                pos: "bottom"
            },
            bottomRight: {
                x:   378,
                y:   995,
                pos: "bottom"
            }
        },
        connectIndicator: {
            topLeft: {
                x:   340, //第五个盘是1420
                y:   865,
                pos: "bottom"
            },
            bottomRight: {
                x:   370,
                y:   882,
                pos: "bottom"
            }
        },
        //行动盘之间的距离
        distance: 270
    };

    //行动盘信息
    var allActionDisks = [
        {
            position:    0,
            priority:    "first",
            down:        false,
            action:      "accel",
            attrib:      "none",
            charaImg:    null,
            charaID:     0,
            connectable: false,
            connectedTo:   -1
        },
        {
            position:    1,
            priority:    "second",
            down:        false,
            action:      "accel",
            attrib:      "none",
            charaImg:    null,
            charaID:     1,
            connectable: false,
            connectedTo:   -1
        },
        {
            position:    2,
            priority:    "third",
            down:        false,
            action:      "accel",
            attrib:      "none",
            img:         null,
            charaImg:    null,
            charaID:     2,
            connectable: false,
            connectedTo:   -1
        },
        {
            position:    3,
            priority:    "fourth",
            down:        false,
            action:      "accel",
            attrib:      "none",
            charaImg:    null,
            charaID:     3,
            connectable: false,
            connectedTo:   -1
        },
        {
            position:    4,
            priority:    "fifth",
            down:        false,
            action:      "accel",
            attrib:      "none",
            charaImg:    null,
            charaID:     4,
            connectable: false,
            connectedTo:   -1
        }
    ];
    var clickedDisksCount = 0;

    var ordinalWord = ["first", "second", "third", "fourth", "fifth"];
    var ordinalNum = {first: 0, second: 1, third: 2, fourth: 3, fifth: 4};
    var diskActions = ["accel", "blast", "charge", "magia", "doppel"];
    var diskAttribs = ["light", "dark", "water", "fire", "wood", "none"];
    var diskAttribsBtnDown = []; for (let i=0; i<diskAttribs.length; i++) { diskAttribsBtnDown.push(diskAttribs[i]+"BtnDown"); }

    function logDiskInfo(disk) {
        let isMagiaDoppel = false;
        if (disk.action == "magia" || disk.action == "doppel") isMagiaDoppel = true;
        let connectableStr = "不可连携";
        if (!isMagiaDoppel) {
            if (disk.connectable) connectableStr = "【连携】";
        }
        let downStr = "未按下"
        if (disk.down) downStr = "【按下】"
        if (isMagiaDoppel) {
            log("第", disk.position+1, "号盘", disk.action, disk.priority, /*"角色", disk.charaID, */"属性", disk.attrib, downStr);
        } else {
            log("第", disk.position+1, "号盘", disk.action, disk.priority, "角色", disk.charaID, "属性", disk.attrib, connectableStr, "连携到角色", disk.connectedTo, downStr);
        }
    }

    //获取换算后的行动盘所需部分（A/B/C盘，角色头像，连携指示灯等）的坐标
    function getDiskCoords(diskPos, part, corner) {
        let convertedCoords = { x: 0, y: 0, pos: "bottom" };
        let knownCoords = knownFirstDiskCoords[part][corner];
        let distance = knownFirstDiskCoords.distance;
        convertedCoords.x = knownCoords.x + diskPos * distance;
        convertedCoords.y = knownCoords.y;
        convertedCoords.pos = knownCoords.pos;
        return convertCoords(convertedCoords);
    }
    function getDiskArea(diskPos, part) {
        let firstDiskArea = null;
        if (part == "attrib") { //防止图像大小不符导致MSSIM==-1
            firstDiskArea = getStandPointArea("our", 0, 0, "attrib");
        } else {
            firstDiskArea = {
                topLeft:     getDiskCoords(0, part, "topLeft"),
                bottomRight: getDiskCoords(0, part, "bottomRight")
            };
        }
        let resultTopLeft = getDiskCoords(diskPos, part, "topLeft");
        let result = {
            topLeft: resultTopLeft,
            bottomRight: { //防止图像大小不符导致MSSIM==-1
                x:   resultTopLeft.x + getAreaWidth(firstDiskArea) - 1,
                y:   resultTopLeft.y + getAreaHeight(firstDiskArea) - 1,
                pos: resultTopLeft.pos
            }
        };
        return result;
    }

    //截取行动盘所需部位的图像
    function getDiskImg(screenshot, diskPos, part) {
        let area = getDiskArea(diskPos, part);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }
    function getDiskImgWithTag(screenshot, diskPos, part, tag) {
        let area = getDiskArea(diskPos, part);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)), tag);
    }

    //识别ABC盘或属性
    //除非要识别盘是否按下，否则假设所有盘都没按下
    function recognizeDisk_(capturedImg, recogWhat, threshold) {
        let maxSimilarity = -1.0;
        let mostSimilar = 0;

        let possibilities = null;
        if (recogWhat == "action") {
            possibilities = diskActions;
        } else if (recogWhat.startsWith("attrib")) {
            possibilities = [];
            let recogWhatArr = recogWhat.split("_");
            if (recogWhatArr.length <= 1) {
                throw "recognizeDiskIncorrectAttribrecogWhat";
            } else {
                if (recogWhatArr[1] == "all") {
                    // attrib_all 和按下的所有属性比对
                    for (let i=0; i<diskAttribs.length; i++){
                        possibilities.push(diskAttribs[i]);
                    }
                    for (let i=0; i<diskAttribsBtnDown.length; i++){
                        possibilities.push(diskAttribsBtnDown[i]);
                    }
                } else {
                    // attrib_light/dark/water/fire/wood/none 只和光/暗/水/火/木/无属性比对
                    possibilities = [recogWhatArr[1], recogWhatArr[1]+"BtnDown"];
                }
            }
        } else {
            throw "recognizeDiskUnknownrecogWhat"
        }
        for (let i=0; i<possibilities.length; i++) {
            let refImg = knownImgs[possibilities[i]];
            let firstDiskArea = getDiskArea(0, "action");
            let gaussianX = parseInt(getAreaWidth(firstDiskArea) / 3);
            let gaussianY = parseInt(getAreaHeight(firstDiskArea) / 3);
            if (gaussianX % 2 == 0) gaussianX += 1;
            if (gaussianY % 2 == 0) gaussianY += 1;
            let gaussianSize = [gaussianX, gaussianY];
            let capturedImgBlur = renewImage(images.gaussianBlur(capturedImg, gaussianSize));
            let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
            let similarity = images.getSimilarity(refImgBlur, capturedImgBlur, {"type": "MSSIM"});
            log("与", possibilities[i], "盘的相似度 MSSIM=", similarity);
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                mostSimilar = i;
            }
        }
        if (maxSimilarity < threshold) {
            log("MSSIM=", maxSimilarity, "小于阈值=", threshold, "无法识别", recogWhat);
            throw "recognizeDiskLowerThanThreshold";
        }
        log("识别为", possibilities[mostSimilar], "盘 MSSIM=", maxSimilarity);
        return possibilities[mostSimilar];
    }
    function recognizeDisk() {
        let result = null;
        let capturedImg = null;
        let recogWhat = null;
        let threshold = 0;
        switch (arguments.length) {
        case 2:
            capturedImg = arguments[0];
            recogWhat = arguments[1];
            threshold = 0;
            try {
                result = recognizeDisk_(capturedImg, recogWhat, threshold);
            } catch(e) {
                if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
                result = null;
            }
            if (result == null) {
                if (recogWhat == "action") result = "accel";
                log("当作", result, "盘，继续运行");
            }
            break;
        case 3:
            capturedImg = arguments[0];
            recogWhat = arguments[1];
            threshold = arguments[2];
            result = recognizeDisk_(capturedImg, recogWhat, threshold);
            break;
        default:
            throw "recognizeDiskArgcIncorrect"
        }
        return result;
    }
    function getDiskActionABC(screenshot, diskPos) {
        let actionImg = getDiskImg(screenshot, diskPos, "action");
        log("识别第", diskPos+1, "盘的A/B/C类型...");
        return recognizeDisk(actionImg, "action");
    }
    function getDiskActionMagiaDoppel(screenshot, diskPos) {
        let actionImg = getDiskImg(screenshot, diskPos, "action");
        log("识别第", diskPos+1, "盘的Magia/Doppel类型...");
        let result = null;
        try {
            result = recognizeDisk(actionImg, "action", 2.1);
        } catch (e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            result = null;
            log("第", diskPos+1, "盘处看上去没有盘");
        }
        return result;
    }
    function getDiskAttribDown(screenshot, diskPos) {
        let result = {attrib: null, down: false};
        let attribImg = getDiskImg(screenshot, diskPos, "attrib");
        log("识别第", diskPos+1, "盘的光/暗/水/火/木/无属性，以及盘是否被按下...");
        try {
            result.attrib = recognizeDisk(attribImg, "attrib_all", 2.1);
        } catch (e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            result.attrib = null;
        }
        if (result.attrib != null) {
            if (result.attrib.endsWith("BtnDown")) {
                result.down = true;
                let indexEnd = result.attrib.length;
                let indexStart = result.attrib.length - "BtnDown".length;
                result.attrib = result.attrib.substring(indexStart, indexEnd);
            } else {
                result.down = false;
            }
            log("识别结果", result);
            return result;
        }

        log("识别失败，当作没按下的无属性盘处理");
        result.attrib = "none";
        result.down = false;
        return result;
    }
    function isDiskDown(screenshot, diskPos) {
        //也可以接受disk作为参数，点击Magia/Doppel盘时可避免属性对不上
        let disk = null;
        if (typeof diskPos != "number") {
            disk = diskPos;
            diskPos = disk.position;
        } else {
            disk = allActionDisks[diskPos];
        }
        let attribImg = getDiskImg(screenshot, diskPos, "attrib");
        log("识别第", diskPos+1, "盘 (", disk.attrib, ") 是否被按下...");
        let recogResult = null;
        try {
           recogResult = recognizeDisk(attribImg, "attrib_"+disk.attrib, 2.1);
        } catch (e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            recogResult = null;
        }
        if (recogResult != null) {
            log("识别结果", recogResult);
            if (recogResult.endsWith("BtnDown")) return true;
            return false;
        }

        log("之前识别的盘属性", disk.attrib, "可能有误");
        recogResult = null;
        try {
            recogResult = recognizeDisk(attribImg, "attrib_all", 2.1);
        } catch (e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            recogResult = null;
        }
        if (recogResult != null) {
            log("识别结果", recogResult);
            if (recogResult.endsWith("BtnDown")) return true;
            return false;
        }

        log("无法识别盘是否被按下");
        throw "isDiskDownInconclusive";
    }

    //截取盘上的角色头像
    function getDiskCharaImg(screenshot, diskPos) {
        let tag = ""+diskPos;
        return getDiskImgWithTag(screenshot, diskPos, "charaImg", tag);
    }

    //判断盘是否可以连携
    function isDiskConnectableDown(screenshot, diskPos) {
        let img = getDiskImg(screenshot, diskPos, "connectIndicator");
        let refImg = knownImgs.connectIndicator;
        let firstDiskArea = getDiskArea(0, "connectIndicator");
        let gaussianX = parseInt(getAreaWidth(firstDiskArea) / 3);
        let gaussianY = parseInt(getAreaHeight(firstDiskArea) / 3);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
        let imgBlur = renewImage(images.gaussianBlur(img, gaussianSize));
        let similarity = images.getSimilarity(refImgBlur, imgBlur, {"type": "MSSIM"});
        let result = {connectable: false, down: false};
        if (similarity > 2.1) {
            log("第", diskPos+1, "号盘【可以连携】，MSSIM=", similarity);
            result.connectable = true;
            result.down = false;
            return result;
        }
        let refImgBtnDown = knownImgs.connectIndicatorBtnDown;
        let refImgBtnDownBlur = renewImage(images.gaussianBlur(refImgBtnDown, gaussianSize));
        similarity = images.getSimilarity(refImgBtnDownBlur, imgBlur, {"type": "MSSIM"});
        if (similarity > 2.1) {
            // 这里还无法分辨到底是盘已经按下了，还是因为没有其他人可以连携而灰掉
            log("第", diskPos+1, "号盘可以连携，但是已经被按下，或因为我方只剩一人而无法连携，MSSIM=", similarity);
            result.connectable = true;
            result.down = true;
            return result;
        }
        log("第", diskPos+1, "号盘不能连携，MSSIM=", similarity);
        result = {connectable: false, down: false}; //这里没有进一步判断down的值
        return result;
    }

    //判断两个盘是否是同一角色
    function areDisksSimilar(screenshot, diskAPos, diskBPos) {
        let diskA = allActionDisks[diskAPos];
        let diskB = allActionDisks[diskBPos];
        let imgA = diskA.charaImg;
        let imgB = diskB.charaImg;
        if (imgA == null) imgA = getDiskImg(screenshot, diskAPos, "charaImg");
        if (imgB == null) imgB = getDiskImg(screenshot, diskBPos, "charaImg");
        let firstDiskArea = getDiskArea(0, "charaImg");
        let gaussianX = parseInt(getAreaWidth(firstDiskArea) / 5);
        let gaussianY = parseInt(getAreaHeight(firstDiskArea) / 5);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let imgABlur = renewImage(images.gaussianBlur(imgA, gaussianSize));
        let imgBBlur = renewImage(images.gaussianBlur(imgB, gaussianSize));
        let similarity = images.getSimilarity(imgABlur, imgBBlur, {"type": "MSSIM"});
        if (similarity > 2.4) { //有属性克制时的闪光可能会干扰判断，会造成假阴性，实际上是同一个角色，却被误识别为不同的角色
            log("第", diskA.position+1, "盘与第", diskB.position+1,"盘【像是】同一角色 MSSIM=", similarity);
            return true;
        }
        log("第", diskA.position+1, "盘与第", diskB.position+1,"盘不像同一角色 MSSIM=", similarity);
        return false;
    }

    //扫描行动盘信息
    function scanDisks() {
        //重新赋值，覆盖上一轮选盘残留的数值
        for (let i=0; i<allActionDisks.length; i++) {
            allActionDisks[i].priority = ordinalWord[i];
            allActionDisks[i].down = false;
            allActionDisks[i].action = "accel";
            allActionDisks[i].charaImg = null;
            allActionDisks[i].attrib = "none";
            allActionDisks[i].charaID = i;
            allActionDisks[i].connectable = false;
            allActionDisks[i].connectedTo = -1;
        }
        clickedDisksCount = 0;

        //截屏，对盘进行识别
        //这里还是假设没有盘被按下
        let screenshot = compatCaptureScreen();
        for (let i=0; i<allActionDisks.length; i++) {
            let disk = allActionDisks[i];
            disk.action = getDiskActionABC(screenshot, i);
            disk.charaImg = getDiskCharaImg(screenshot, i);
            let isConnectableDown = isDiskConnectableDown(screenshot, i); //isConnectableDown.down==true也有可能是只剩一人无法连携的情况，
            disk.connectable = isConnectableDown.connectable && (!isConnectableDown.down); //所以这里还无法区分盘是否被按下，但是可以排除只剩一人无法连携的情况
            let diskAttribDown = getDiskAttribDown(screenshot, i);
            disk.attrib = diskAttribDown.attrib;
            disk.down = diskAttribDown.down; //这里，虽然getDiskAttribDown()可以识别盘是否按下，但是因为后面分辨不同的角色的问题还无法解决，所以意义不是很大
        }
        //分辨不同的角色，用charaID标记
        //如果有盘被点击过，在有属性克制的情况下，这个检测可能被闪光特效干扰
        //如果有按下的盘，这里也会把同一位角色误判为不同角色
        for (let i=0; i<allActionDisks.length-1; i++) {
            let diskI = allActionDisks[i];
            for (let j=i+1; j<allActionDisks.length; j++) {
                let diskJ = allActionDisks[j];
                if (areDisksSimilar(screenshot, i, j)) {
                    diskJ.charaID = diskI.charaID;
                }
            }
        }

        log("行动盘扫描结果：");
        for (let i=0; i<allActionDisks.length; i++) {
            logDiskInfo(allActionDisks[i]);
        }
    }

    //找出可以给出连携的盘
    function getConnectableDisks(disks) {
        let result = [];
        for (let i=0; i<disks.length; i++) {
            var disk = disks[i];
            if (disk.connectable && (!disk.down)) result.push(disk);
        }
        return result;
    }

    //找出某一角色的盘
    function findDisksByCharaID(disks, charaID) {
        let result = [];
        for (let i=0; i<disks.length; i++) {
            var disk = disks[i];
            if (disk.charaID == charaID) result.push(disk);
        }
        return result;
    }

    //找出指定（A/B/C）的盘
    function findSameActionDisks(disks, action) {
        let result = [];
        for (let i=0; i<disks.length; i++) {
            var disk = disks[i];
            if (disk.action == action) result.push(disk);
        }
        return result;
    }

    //找出出现盘数最多角色的盘
    function findSameCharaDisks(disks) {
        let result = [];
        diskCount = [0, 0, 0, 0, 0];
        //每个盘都属于哪个角色
        for (let i=0; i<disks.length; i++) {
            var disk = disks[i];
            //本角色出现盘数+1
            diskCount[disk.charaID]++;
        }

        //找到出现盘数最多的角色
        var max = 0;
        var mostDisksCharaID = 0;
        for (let i=0; i<diskCount.length; i++) {
            if (diskCount[i] > max) {
                max = diskCount[i];
                mostDisksCharaID = i;
            }
        }

        result = findDisksByCharaID(disks, mostDisksCharaID);
        return result;
    }

    //返回指定属性的盘（光/暗/水/火/木/无）
    function findSameAttribDisks(disks, attrib) {
        let result = [];
        for (let i=0; i<disks.length; i++) {
            var disk = disks[i];
            if (disk.attrib == attrib) result.push(disk);
        }
        return result;
    }

    //获取不被对面克制属性的盘
    function findNonDisadvAttribDisks(disks, enemies) {
        let result = [];
        for (let type of ["adv", "neutral"]) {
            let advOrNeutralAttribs = getAdvDisadvAttribsOfStandPoints(enemies, type);
            for (let attrib of advOrNeutralAttribs) {
                let advOrNeutralAttribDisks = findSameAttribDisks(disks, attrib)
                advOrNeutralAttribDisks.forEach((disk) => result.push(disk));
            }
        }
        //只留下不重复的
        let resultDedup = [];
        for (let disk of result) {
            if (resultDedup.find((val) => disk.position == val.position) == null) {
                resultDedup.push(disk);
            }
        }
        result = resultDedup;
        return result;
    }

    //返回优先第N个点击的盘
    function getDiskByPriority(disks, priority) {
        for (let i=0; i<disks.length; i++) {
            disk = disks[i];
            if (disk.priority == priority) return disk;
        }
    }

    //获取克制或被克制属性
    function getAdvDisadvAttribs(attrib, advOrDisadv) {
        let result = [];
        switch (advOrDisadv) {
        case "disadv":
            switch(attrib) {
            case "light": result = ["dark" ]; break;
            case "dark":  result = ["light"]; break;
            case "water": result = ["fire" ]; break;
            case "fire":  result = ["wood" ]; break;
            case "wood":  result = ["water"]; break;
            case "none":  result = [];        break;
            }
            break;
        case "adv":
            switch(attrib) {
            case "light": result = ["dark" ]; break;
            case "dark":  result = ["light"]; break;
            case "water": result = ["wood" ]; break;
            case "fire":  result = ["water"]; break;
            case "wood":  result = ["fire" ]; break;
            case "none":  result = [];        break;
            }
            break;
        case "neutral":
            switch(attrib) {
            case "light": result = ["none", "light"]; break;
            case "dark":  result = ["none", "dark" ]; break;
            case "water": result = ["none", "water"]; break;
            case "fire":  result = ["none", "fire" ]; break;
            case "wood":  result = ["none", "wood" ]; break;
            case "none":  result = ["none", "light", "dark", "water", "fire", "wood"]; break;
            }
            break;
        }
        return result;
    }

    //获取我方克制/弱点/中立属性（对于水队来说弱点属性就是木属性）
    function getAdvDisadvAttribsOfStandPoints(standPoints, advOrDisadv) {
        let result = [];
        let stats = {light: 0, dark: 0, water: 0, fire: 0, wood: 0, none: 0};
        let maxCount = 0;
        for (let i=0; i<standPoints.length; i++) {
            let standPoint = standPoints[i];
            let attribs = getAdvDisadvAttribs(standPoint.attrib, advOrDisadv);
            if (attribs != null) {
                attribs.forEach(function (attrib) {
                    stats[attrib]++;
                    if (stats[attrib] > maxCount) maxCount = stats[attrib];
                });
            }
        }
        //把出现多的排到前面
        for (let i=1; i<=maxCount; i++) {
            for (let attrib in stats) {
                let count = stats[attrib];
                if (count == i) {
                    result.splice(0, 0, attrib);
                }
            }
        }
        return result;
    }

    //选择指定属性的敌人
    function getEnemiesByAttrib(targetedAttrib) {
        log("getEnemiesByAttrib(", targetedAttrib, ")");
        let result = [];
        for (let i=0; i<rows.length; i++) {
            for (let j=0; j<columns.length; j++) {
                let standPoint = battleField.their[rows[i]][columns[j]];
                if (standPoint.occupied && standPoint.attrib == targetedAttrib) {
                    result.push(standPoint);
                    log(standPoint);
                }
            }
        }
        return result;
    }

    //瞄准指定的敌人
    function aimAtEnemy(enemy) {
        log("aimAtEnemy(", enemy, ")");
        let area = getStandPointArea("their", enemy.rowNum, enemy.columnNum, "floor");
        let areaCenter = getAreaCenter(area);
        let x = areaCenter.x;
        let y = areaCenter.y;
        // MuMu模拟器上tap无效，用swipe代替可解，不知道别的机器情况如何
        swipe(x, y, x, y, 100);
        sleep(50);
        if (!clickBackButtonIfShowed()) {
            log("误触打开了角色信息,多次尝试点击返回却没有效果,退出");
            stopThread();
        }
        battleField["their"].lastAimedAtEnemy = enemy;
    }

    //避免瞄准指定的敌人
    function avoidAimAtEnemies(enemiesToAvoid) {
        log("avoidAimAtEnemies(", enemiesToAvoid, ")");
        let allEnemies = [];
        for (let i=0; i<rows.length; i++) {
            for (let j=0; j<columns.length; j++) {
                let standPoint = battleField.their[rows[i]][columns[j]];
                if (standPoint.occupied) allEnemies.push(standPoint);
            }
        }

        let remainingEnemies = [];
        for (let i=0; i<allEnemies.length; i++) { remainingEnemies.push(allEnemies[i]); }
        for (let i=0; i<remainingEnemies.length; i++) {
            let thisEnemy = remainingEnemies[i];
            let deleted = false;
            for (let j=0; j<enemiesToAvoid.length; j++) {
                let enemyToAvoid = enemiesToAvoid[j];
                if (thisEnemy.rowNum == enemyToAvoid.rowNum || thisEnemy.columnNum == enemyToAvoid.columnNum) {
                    //绕开与指定敌人同一行或同一列的其他敌人，如果可能的话
                    deleted = true;
                }
            }
            if (deleted) {
                remainingEnemies.splice(i, 1);
                i--;
            }
        }
        if (remainingEnemies.length > 0) {
            aimAtEnemy(remainingEnemies[0]);
            return;//如果能绕开同一行或者同一列的其他敌人，那肯定就已经绕开了指定敌人本身
        }

        remainingEnemies = [];
        for (let i=0; i<allEnemies.length; i++) { remainingEnemies.push(allEnemies[i]); }
        for (let i=0; i<remainingEnemies.length; i++) {
            let thisEnemy = remainingEnemies[i];
            let deleted = false;
            for (let j=0; j<enemiesToAvoid.length; j++) {
                let enemyToAvoid = enemiesToAvoid[j];
                if (thisEnemy.rowNum == enemyToAvoid.rowNum && thisEnemy.columnNum == enemyToAvoid.columnNum) {
                    //绕开的指定要避免的敌人本身
                    deleted = true;
                }
            }
            if (deleted) {
                remainingEnemies.splice(i, 1);
                i--;
            }
        }
        if (remainingEnemies.length > 0) aimAtEnemy(remainingEnemies[0]);
    }

    //选盘，实质上是把选到的盘在allActionDisks数组里排到前面
    function prioritiseDisks(disks) {
        log("优先选盘：");
        for (let i=0; i<disks.length; i++) {
            logDiskInfo(disks[i]);
        }
        let replaceDiskAtThisPriority = clickedDisksCount;
        for (let i=0; i<disks.length&&replaceDiskAtThisPriority<ordinalWord.length; i++) {
            let targetDisk = getDiskByPriority(allActionDisks, ordinalWord[replaceDiskAtThisPriority]);
            let diskToPrioritise = disks[i];
            let posA = targetDisk.position;
            let posB = diskToPrioritise.position;
            let tempPriority = allActionDisks[posB].priority;
            allActionDisks[posB].priority = allActionDisks[posA].priority;
            allActionDisks[posA].priority = tempPriority;
            replaceDiskAtThisPriority++;
        }

        log("当前选盘情况：");
        for (let i=clickedDisksCount; i<allActionDisks.length; i++) {
            logDiskInfo(getDiskByPriority(allActionDisks, ordinalWord[i]));
        }
    }


    //进行连携
    function connectDisk(fromDisk) {
        //获取我方有人的站位
        let aliveStandPoints = getAliveStandPoints("our");
        //把不被克制的属性排在前面
        for (let type of ["neutral", "adv"]) {
            let attribs = getAdvDisadvAttribsOfStandPoints([battleField["their"].lastAimedAtEnemy], type);
            attribs.reverse();
            attribs.forEach(function (attrib) {
                let foundIndices = [];
                aliveStandPoints.forEach(function (standPoint, index) {
                    if (standPoint.attrib == attrib) {
                        foundIndices.push(index);
                    }
                });
                for (let i=0; i<foundIndices.length; i++) {
                    let temp = aliveStandPoints[i];
                    aliveStandPoints[i] = aliveStandPoints[foundIndices[i]];
                    aliveStandPoints[foundIndices[i]] = temp;
                }
            });
        }
        //开始尝试连携
        for (let thisStandPoint of aliveStandPoints) {
            if (thisStandPoint.charaID != fromDisk.charaID) {
                //找到有人、并且角色和连携发出角色不同的的站位
                log("从", fromDisk.position+1, "盘向第", thisStandPoint.rowNum+1, "行第", thisStandPoint.columnNum+1, "列站位进行连携");
                let src = getAreaCenter(getDiskArea(fromDisk.position, "charaImg"));
                let dst = getAreaCenter(getStandPointArea("our", thisStandPoint.rowNum, thisStandPoint.columnNum, "floor"));
                //连携划动
                swipe(src.x, src.y, dst.x, dst.y, 1000);
                sleep(1000);
                let screenshot = compatCaptureScreen();
                let isConnectableDown = isDiskConnectableDown(screenshot, fromDisk.position);
                if (isConnectableDown.down) {
                    log("连携动作完成");
                    clickedDisksCount++;
                    fromDisk.connectedTo = getConnectAcceptorCharaID(fromDisk, clickedDisksCount); //判断接连携的角色是谁
                    thisStandPoint.charaID = fromDisk.connectedTo;
                    break;
                } else {
                    log("连携动作失败，可能是因为连携到了自己身上");
                    //以后也许可以改成根据按下连携盘后地板是否发亮来排除自己
                }
            }
        }
    }

    //点击行动盘
    function clickDisk(disk) {
        log("点击第", disk.position+1, "号盘");
        let point = getAreaCenter(getDiskArea(disk.position, "charaImg"));
        let clickAttemptMax = 10;
        let inconclusiveCount = 0;
        for (let i=0; i<clickAttemptMax; i++) {
            //国服2.1.10更新后出现无法点击magia盘的问题，从click改成swipe即可绕开问题
            swipe(point.x, point.y, point.x, point.y, parseInt(limit.CVAutoBattleClickDiskDuration));
            //点击有时候会没效果，还需要监控盘是否按下了
            sleep(333);
            let screenshot = compatCaptureScreen();
            try {
                disk.down = isDiskDown(screenshot, disk);
            } catch (e) {
                if (e.toString() == "isDiskDownInconclusive") {
                    inconclusiveCount++;
                } else {
                    log(e);
                }
                //最后一个盘点击成功的表现就是行动盘消失，所以当然无法分辨盘是否被按下
                //这种情况下因为我方回合选盘已经结束，点击行动盘的位置没有影响，所以即便多点几次也是无害的
                if (clickedDisksCount == 2 && inconclusiveCount >= 1) {
                    log("看不到最后一个盘了，应该是点击动作完成了");
                    disk.down = true;
                } else {
                    disk.down = false;
                }
            }
            if (disk.down) break;
        }
        if (!disk.down) {
            log("点了", clickAttemptMax, "次都没反应，可能遇到问题，退出");
            stopThread();
        } else {
            log("点击动作完成");
            clickedDisksCount++;
        }
    }


    //判断接到连携的角色

    //已知接第一盘角色头像坐标
    var knownFirstSelectedConnectedDiskCoords = {
        topLeft: {
            x:   809,
            y:   112,
            pos: "top"
        },
        bottomRight: {
            x:   825,
            y:   133,
            pos: "top"
        },
        distance: 187.5
    };

    //获取换算后的行动盘所需部分（A/B/C盘，角色头像，连携指示灯等）的坐标
    function getSelectedConnectedDiskCoords(corner, which) {
        var convertedCoords = { x: 0, y: 0, pos: "bottom" };
        var knownCoords = knownFirstSelectedConnectedDiskCoords[corner];
        convertedCoords.x = knownCoords.x + knownFirstSelectedConnectedDiskCoords.distance * (which - 1);
        convertedCoords.y = knownCoords.y;
        convertedCoords.pos = knownCoords.pos;
        return convertCoords(convertedCoords);
    }
    function getSelectedConnectedDiskArea(which) {
        var result = {
            topLeft:     getSelectedConnectedDiskCoords("topLeft", which),
            bottomRight: getSelectedConnectedDiskCoords("bottomRight", which),
        };
        return result;
    }

    //截取行动盘所需部位的图像
    function getSelectedConnectedDiskImg(screenshot, which) {
        var area = getSelectedConnectedDiskArea(which);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    //返回接到连携的角色
    function getConnectAcceptorCharaID(fromDisk, which) {
        let screenshot = compatCaptureScreen();
        let imgA = getSelectedConnectedDiskImg(screenshot, which);

        let area = getSelectedConnectedDiskArea(which);
        let gaussianX = parseInt(getAreaWidth(area) / 5);
        let gaussianY = parseInt(getAreaHeight(area) / 5);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let imgABlur = renewImage(images.gaussianBlur(imgA, gaussianSize));

        let max = 0;
        let maxSimilarity = -1.0;
        for (let diskPos = 0; diskPos < allActionDisks.length; diskPos++) {
            let imgB = getDiskImg(screenshot, diskPos, "charaImg"); //这里还没考虑侧边刘海屏可能切掉画面的问题，不过除非侧边特别宽否则应该不会有影响
            let imgBShrunk = renewImage(images.resize(imgB, [getAreaWidth(area), getAreaHeight(area)]));
            let imgBShrunkBlur = renewImage(images.gaussianBlur(imgBShrunk, gaussianSize));
            let similarity = images.getSimilarity(imgABlur, imgBShrunkBlur, {"type": "MSSIM"});
            log("比对第", diskPos+1, "号盘与屏幕上方的第一个盘的连携接受者 MSSIM=", similarity);
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                max = diskPos;
            }
        }
        log("比对结束，与第", max+1, "号盘最相似，charaID=", allActionDisks[max].charaID, "MSSIM=", maxSimilarity);
        if (allActionDisks[max].charaID == fromDisk.charaID) {
            log("识图比对结果有误，和连携发出角色相同");
            log("为避免问题，返回 charaID=-1");
            return -1;
        }
        return allActionDisks[max].charaID;
    }

    //检测和使用主动技能

    const skillCharaDistance = 328;
    const skillDistance = 155;

    var knownFirstSkillCoords = {
        topLeft: {
            x: 31,
            y: 978,
            pos: "bottom"
        },
        bottomRight: {
            x: 163,
            y: 1015,
            pos: "bottom"
        }
    }

    var knownFirstSkillFullCoords = {
        topLeft: {
            x: 22,
            y: 920,
            pos: "bottom"
        },
        bottomRight: {
            x: 172,
            y: 1071,
            pos: "bottom"
        }
    }

    function getSkillArea(diskPos, skillNo, isFull) {
        let area = {};
        for (let corner of ["topLeft", "bottomRight"]) {
            area[corner] = {};
            area[corner].pos = "bottom";
            for (let axis of ["x", "y"]) {
                if (isFull) {
                    area[corner][axis] = knownFirstSkillFullCoords[corner][axis];
                } else {
                    area[corner][axis] = knownFirstSkillCoords[corner][axis];
                }
            }
            area[corner].x += diskPos * skillCharaDistance;
            area[corner].x += skillNo * skillDistance;
        }
        return getConvertedArea(area);
    }

    function getSkillFullArea(diskPos, skillNo) {
        return getSkillArea(diskPos, skillNo, true);
    }

    function getSkillImg(screenshot, diskPos, skillNo) {
        let area = getSkillArea(diskPos, skillNo);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    function getSkillFullImg(screenshot, diskPos, skillNo) {
        let area = getSkillFullArea(diskPos, skillNo);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    //检测技能是否可用
    function isSkillAvailable(screenshot, diskPos, skillNo) {
        log("检测第 "+(diskPos+1)+" 个位置的角色的第 "+(skillNo+1)+" 个技能是否可用...");
        let skillImg = getSkillImg(screenshot, diskPos, skillNo);
        let skillImgGRAY = renewImage(images.grayscale(skillImg));
        let skillImgGray = renewImage(images.cvtColor(skillImgGRAY, "GRAY2BGRA"));
        let skillImgBGRA = renewImage(images.cvtColor(skillImg, "BGR2BGRA"));
        let similarity = images.getSimilarity(skillImgGray, skillImgBGRA, {"type": "MSSIM"});
        log("技能按钮区域图像 去色前后的相似度 MSSIM=", similarity);
        if (similarity > 2.9) {
            let firstSkillArea = getSkillArea(0, 0);
            let gaussianX = parseInt(getAreaWidth(firstSkillArea) * 8);
            let gaussianY = parseInt(getAreaHeight(firstSkillArea) * 8);
            if (gaussianX % 2 == 0) gaussianX += 1;
            if (gaussianY % 2 == 0) gaussianY += 1;
            let gaussianSize = [gaussianX, gaussianY];
            let skillImgBlur = renewImage(images.gaussianBlur(skillImg, gaussianSize));
            let skillImgOnePx = renewImage(images.resize(skillImgBlur, [1, 1], "LINEAR"));
            if (images.detectsColor(skillImgOnePx, colors.WHITE, 0, 0, 8, "diff")) {
                log("技能【可用】且闪光到全白");
                return true;
            } else {
                log("技能不可用");
                return false;
            }
        } else {
            let skillFullImg = getSkillFullImg(screenshot, diskPos, skillNo);
            let skillFullImgGray = renewImage(images.grayscale(skillFullImg));
            let minRadius = parseInt(getAreaWidth(getSkillFullArea(0, 0)) * 0.33);
            let foundCircles = images.findCircles(skillFullImgGray, {minRadius: minRadius});
            log("找圆结果", foundCircles);
            if (foundCircles != null && foundCircles.length > 0) {
                let firstSkillArea = getSkillArea(0, 0);
                let gaussianX = parseInt(getAreaWidth(firstSkillArea) / 4);
                let gaussianY = parseInt(getAreaHeight(firstSkillArea) / 4);
                if (gaussianX % 2 == 0) gaussianX += 1;
                if (gaussianY % 2 == 0) gaussianY += 1;
                let gaussianSize = [gaussianX, gaussianY];
                let imgA = renewImage(images.gaussianBlur(skillImg, gaussianSize));
                similarity = -1;
                for (var imgName of ["skillLocked", "skillEmptyCHS", "skillEmptyCHT", "skillEmptyJP"]) {
                    let imgB = renewImage(images.gaussianBlur(knownImgs[imgName], gaussianSize));
                    let s = images.getSimilarity(imgA, imgB, {"type": "MSSIM"});
                    if (s > similarity) {
                        similarity = s;
                    }
                }
                log("与小锁或未装备图标比对的最高相似度 MSSIM=", similarity);
                if (similarity > 2.4) {
                    log("技能不存在", imgName);
                    return false;
                } else {
                    log("技能【可用】");
                    return true;
                }
            } else {
                log("技能不存在");
                return false;
            }
        }
    }

    //是否有我方行动盘出现
    function detectAppearingDiskType(screenshot) {
        let img = getDiskImg(screenshot, 0, "action");
        if (img != null) {
            log("已截取第一个盘的动作图片");
        } else {
            log("截取第一个盘的动作图片时出现问题");
        }
        let result = null;
        try {
            result = recognizeDisk(img, "action", 2.1);
            switch (result) {
                case "accel":
                case "blast":
                case "charge":
                    result = "abc";
                    break;
                case "magia":
                case "doppel":
                    result = "magiadoppel";
                    break;
                default:
                    throw new Error("detectAppearingDiskType: unknown disk action type");
            }
        } catch(e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            result = null;
        }
        return result;
    }
    function isMagiaDiskAppearing(screenshot) {
        return detectAppearingDiskType(screenshot) == "magiadoppel" ? true : false;
    }
    function isABCDiskAppearing(screenshot) {
        return detectAppearingDiskType(screenshot) == "abc" ? true : false;
    }
    function isDiskAppearing(screenshot) {
        switch (detectAppearingDiskType(screenshot)) {
            case "abc":
            case "magiadoppel":
                return true;
        }
        return false;
    }

    //打开或关闭技能面板
    function toggleSkillPanel(open) {
        log((open?"打开":"关闭")+"技能面板...");
        for (let attempt=0; isABCDiskAppearing(compatCaptureScreen())==open; attempt++) {
            if (attempt >= 10) {
                log((open?"打开":"关闭")+"技能面板时出错");
                stopThread();
            }
            if (attempt % 2 == 1) {
                log("点击取消按钮");
                click(convertCoords(clickSetsMod.reconnectYes));
                sleep(500);
            }
            if (!clickBackButtonIfShowed()) {
                log("误触打开了角色信息,多次尝试点击返回却没有效果,退出");
                stopThread();
            }
            log("点击切换技能面板/行动盘面板");
            click(convertCoords(clickSetsMod.skillPanelSwitch));
            sleep(1000);
        }
    }

    const knownBackButtonPoint = {
        x: 57,
        y: 64,
        pos: "top"
    };

    //用于防误触：
    //镜层角色详细信息出现时,返回按钮上,这里也是白色
    //剧情副本(而不是镜层)的MENU按钮可用时,这里就不是白色了
    //RGB=142,109,66
    const knownMenuButtonPoint = {
        x: 82,
        y: 54,
        pos: "top"
    };

    //进一步防误触：
    //没打开战斗任务内容窗口（三星任务等，auto设置也在这里）时,这里不是白色
    //打开战斗任务内容窗口后,这里就变成白色了
    const battleMenuCloseButtonPoints = [
        {
            x: 1763,
            y: 68,
            pos: "top"
        },
        {
            x: 1781,
            y: 73,
            pos: "top"
        },
    ];

    //点击时往下点,避免误触倍速按钮
    const battleMenuCloseButtonClickPoint = {
        x: 1777,
        y: 113,
        pos: "top"
    };

    //检测返回按钮是否出现
    function isBackButtonAppearing(screenshot) {
        let points = [knownBackButtonPoint, knownMenuButtonPoint].map((val) => convertCoords(val));
        if (points.find((val) => !images.detectsColor(screenshot, colors.WHITE, val.x, val.y, 32, "diff")) == null) {
            log("似乎出现了返回按钮");
            return true;
        } else {
            log("似乎没出现返回按钮");
            return false;
        }
    }

    //检测战斗任务内容窗口是否出现
    function isBattleMenuCloseButtonAppearing(screenshot) {
        let points = battleMenuCloseButtonPoints.map((val) => convertCoords(val));
        if (points.find((val) => !images.detectsColor(screenshot, colors.WHITE, val.x, val.y, 32, "diff")) == null) {
            log("似乎出现了战斗任务内容窗口");
            return true;
        } else {
            log("似乎没出现战斗任务内容窗口");
            return false;
        }
    }

    //有返回按钮出现时点击返回,或者出现战斗任务内容窗口时点击关闭
    function clickBackButtonIfShowed() {
        let lastClickTime = 0;
        let attemptMax = 10;
        for (let attempt=0; attempt<attemptMax; attempt++) {
            let screenshot = compatCaptureScreen();
            let isClickingBackNeeded = isBackButtonAppearing(screenshot);
            let isClickingCloseNeeded = isBattleMenuCloseButtonAppearing(screenshot);
            if (!(isClickingBackNeeded || isClickingCloseNeeded)) {
                return true;
            }
            let clickTime = new Date().getTime();
            if (lastClickTime == 0 || clickTime - lastClickTime > 2000) {
                lastClickTime = clickTime;
                if (isClickingBackNeeded) {
                    log("点击返回");
                    click(convertCoords(clickSetsMod.back));
                }
                if (isClickingCloseNeeded) {
                    log("点击关闭战斗任务内容窗口");
                    click(convertCoords(battleMenuCloseButtonClickPoint));
                }
            }
            sleep(500);
        }
        log("尝试点击返回或关闭多次仍然没有效果");
        return false;
    }

    var knownOKButtonCoords = {
        topLeft: {
            x: 1313, y: 705, pos: "center"
        },
        bottomRight: {
            x: 1381, y: 824, pos: "center"
        }
    };

    function getOKButtonArea() {
        return getConvertedArea(knownOKButtonCoords);
    }

    function getOKButtonImg(screenshot) {
        let area = getOKButtonArea();
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    //检测技能确认按钮是否出现
    function detectOKButtonStatus(screenshot) {
        let refImg = knownImgs["OKButton"];
        let img = getOKButtonImg(screenshot);
        let imgGRAY = renewImage(images.grayscale(img));
        let imgGray = renewImage(images.cvtColor(imgGRAY, "GRAY2BGRA"));
        let imgBGRA = renewImage(images.cvtColor(img, "BGR2BGRA"));
        let isGray = false;
        let similarity = images.getSimilarity(imgBGRA, imgGray, {"type": "MSSIM"});
        log("判断按钮区域图像是否为灰度 MSSIM=", similarity);
        if (similarity > 2.9) {
            isGray = true;
            refImg = knownImgs["OKButtonGray"];
        }
        let OKButtonArea = getOKButtonArea();
        let gaussianX = parseInt(getAreaWidth(OKButtonArea) / 3);
        let gaussianY = parseInt(getAreaHeight(OKButtonArea) / 3);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let imgBlur = renewImage(images.gaussianBlur(img, gaussianSize));
        let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
        similarity = images.getSimilarity(refImgBlur, imgBlur, {"type": "MSSIM"});
        log("判断技能确认按钮是否出现 MSSIM=", similarity);
        if (similarity > 2.1) {
            if (isGray) {
                log("技能按钮为灰色");
                return "grayed_out";
            } else {
                log("技能按钮可用");
                return "available";
            }
        } else {
            log("没有检测到技能按钮");
            return "not_detected";
        }
    }

    //闭着眼放出所有主动技能
    function clickAllSkills() {
        //打开技能面板
        toggleSkillPanel(true);

        for (let pass=1; pass<=3; pass++) { //只循环3遍
            var availableSkillCount = 0;
            let screenshot = renewImage(images.copy(compatCaptureScreen())); //复制一遍以避免toggleSkillPanel回收screenshot导致崩溃退出的问题
            for (let diskPos=0; diskPos<5; diskPos++) {
                for (let skillNo=0; skillNo<2; skillNo++) {
                    if (isSkillAvailable(screenshot, diskPos, skillNo)) {
                        availableSkillCount++;
                        let isSkillButtonClicked = false;
                        let lastOKClickTime = 0;
                        let lastCancelClickTime = 0;
                        let isSkillUsed = false;
                        let isSkillDone = false;
                        for (let startTime=new Date().getTime(); new Date().getTime()-startTime<15000; sleep(200)) {
                            let clickTime = 0;
                            if (!clickBackButtonIfShowed()) {
                                log("误触打开了角色信息,多次点击返回却没有效果,退出");
                                stopThread();
                            } else if (isSkillDone) {
                                if (!isSkillUsed) availableSkillCount--;
                                break;
                            } else switch (detectOKButtonStatus(compatCaptureScreen())) {
                                case "available":
                                    isSkillUsed = true;
                                    clickTime = new Date().getTime();
                                    if (lastOKClickTime == 0 || clickTime - lastOKClickTime > 4000) {
                                        lastOKClickTime = clickTime;
                                        log("点击确认按钮使用技能");
                                        click(convertCoords(clickSetsMod.recover_battle));
                                    }
                                    break;
                                case "grayed_out":
                                    isSkillUsed = false;
                                    clickTime = new Date().getTime();
                                    if (lastCancelClickTime == 0 || clickTime - lastCancelClickTime > 1000) {
                                        lastCancelClickTime = clickTime;
                                        log("确定按钮为灰色,点击取消按钮放弃使用技能");
                                        click(convertCoords(clickSetsMod.reconnectYes));
                                    }
                                    break;
                                case "not_detected":
                                default:
                                    if (isSkillButtonClicked) {
                                        isSkillDone = true;
                                        if (isSkillUsed) {
                                            log("技能使用完成");
                                        } else {
                                            log("技能不可用");
                                        }
                                    } else {
                                        isSkillButtonClicked = true;
                                        log("点击使用第 "+(diskPos+1)+" 个位置的角色的第 "+(skillNo+1)+" 个技能");
                                        click(getAreaCenter(getSkillArea(diskPos, skillNo)));
                                    } 
                            }
                        }
                        if (isSkillUsed) {
                            sleep(2000);
                            toggleSkillPanel(true); //如果发动了洗盘技能，就重新打开技能面板
                        }
                    }
                }
            }
            try {screenshot.recycle();} catch (e) {};
            if (availableSkillCount <= 0) break;
        }

        //关闭技能面板
        toggleSkillPanel(false);
        return false;
    }

    var knownMagiaButtonCoords = {
        topLeft: {
            x: 78, y: 894, pos: "bottom"
        },
        bottomRight: {
            x: 224, y: 976, pos: "bottom"
        }
    };

    function getMagiaButtonArea() {
        return getConvertedArea(knownMagiaButtonCoords);
    }

    function getMagiaButtonImg(screenshot) {
        let area = getMagiaButtonArea();
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    //有Magia/Doppel可用的时候,无论是否打开Magia面板,左边的切换按钮都不是灰色的
    //这是一个取巧的办法,如果行动盘还没显示出来,就可能误判成Magia可用
    function isMagiaAvailable(screenshot) {
        let img = getMagiaButtonImg(screenshot);
        let imgGRAY = renewImage(images.grayscale(img));
        let imgGray = renewImage(images.cvtColor(imgGRAY, "GRAY2BGRA"));
        let imgBGRA = renewImage(images.cvtColor(img, "BGR2BGRA"));
        let isGray = false;
        let similarity = images.getSimilarity(imgBGRA, imgGray, {"type": "MSSIM"});
        log("判断按钮区域图像是否为灰度 MSSIM=", similarity);
        if (similarity > 2.9) {
            log("Magia不可用");
            return false;
        } else {
            log("Magia可用,或者行动盘尚未显示");
            return true;
        }
    }

    //打开或关闭Magia面板
    function toggleMagiaPanel(open) {
        log((open?"打开":"关闭")+"Magia面板...");
        let screenshot = compatCaptureScreen();
        if (!isMagiaAvailable(screenshot)) return false;
        for (let attempt=0; open?!isMagiaDiskAppearing(screenshot):!isABCDiskAppearing(screenshot); attempt++) {
            if (attempt >= 10) {
                log((open?"打开":"关闭")+"Magia面板时出错");
                stopThread();
            }
            log("点击切换Magia面板/行动盘面板");
            click(getAreaCenter(getMagiaButtonArea()));
            sleep(1000);
            screenshot = compatCaptureScreen();
        }
        return open ? true : false;
    }

    function scanMagiaDisks() {
        let result = [];

        //截屏，对盘进行识别
        //这里还是假设没有盘被按下
        let screenshot = compatCaptureScreen();
        for (let i=0; i<allActionDisks.length; i++) {
            let disk = {
                position:    i,
                down:        false,
                action:      "magia",
                attrib:      "none",
                //charaImg:    null,
                //charaID:     0
            };
            let action = getDiskActionMagiaDoppel(screenshot, i);
            if (action != "magia" && action != "doppel") break;
            disk.action = action;
            //disk.charaImg = getDiskCharaImg(screenshot, i);
            let diskAttribDown = getDiskAttribDown(screenshot, i);
            disk.attrib = diskAttribDown.attrib;
            disk.down = diskAttribDown.down; //这里，虽然getDiskAttribDown()可以识别盘是否按下，但是因为后面分辨不同的角色的问题还无法解决，所以意义不是很大
            result.push(disk);
        }
        //分辨不同的角色，用charaID标记
        //如果有盘被点击过，在有属性克制的情况下，这个检测可能被闪光特效干扰
        //如果有按下的盘，这里也会把同一位角色误判为不同角色
        //for (let i=0; i<result.length-1; i++) {
        //    let diskI = result[i];
        //    for (let j=i+1; j<allActionDisks.length; j++) {
        //        let diskJ = allActionDisks[j];
        //        if (areDisksSimilar(screenshot, i, j)) {
        //            diskJ.charaID = diskI.charaID;
        //        }
        //    }
        //}

        log("行动盘扫描结果：");
        for (let i=0; i<result.length; i++) {
            logDiskInfo(result[i]);
        }

        return result;
    }

    //闭着眼放出所有Magia/Doppel大招
    function clickAllMagiaDisks() {
        //打开技能面板
        if (!toggleMagiaPanel(true)) return;

        let magiaDisks = scanMagiaDisks();
        for (let disk of magiaDisks) {
            clickDisk(disk);
            //如果已经点完3个盘就不用继续往下点了
            if (clickedDisksCount >= 3) return;
        }

        //关闭技能面板
        toggleMagiaPanel(false);
    }

    //等待己方回合
    function waitForOurTurn() {
        log("等待己方回合...");
        let result = false;
        let cycles = 0;
        let diskAppearedCount = 0;
        while(true) {
            cycles++;
            let screenshot = compatCaptureScreen();
            /*
            if (id("ArenaResult").findOnce() || (id("enemyBtn").findOnce() && id("rankMark").findOnce())) {
            */
            if (id("ArenaResult").findOnce() || id("enemyBtn").findOnce() || /*镜层结算*/
                id("ResultWrap").findOnce() || /*副本结算*/
                id("retryWrap").findOnce() || id("hasTotalRiche").findOnce()) {
            //不再通过识图判断战斗是否结束
            //if (didWeWin(screenshot) || didWeLose(screenshot)) {
                log("战斗已经结束，不再等待我方回合");
                result = false;
                break;
            }

            //如果有技能可用，会先闪过我方行动盘，然后闪过技能面板，最后回到显示我方行动盘
            //所以，必须是连续多次看到我方行动盘，这样才能排除还在闪烁式切换界面的情况
            let diskAppeared = isDiskAppearing(screenshot);
            if (diskAppeared) {
                log("出现我方行动盘");
                diskAppearedCount++;
            } else {
                log("未出现我方行动盘");
                diskAppearedCount = 0;
            }
            if (limit.CVAutoBattleDebug) {
                if (cycles < 30) {
                    if (cycles == 1) toastLog("识图自动战斗已启用调试模式\n不会点击任何行动盘\n将会在保存图片后退出");
                } else {
                    toastLog("开始保存图片...");
                    let snapshotDir = files.join(files.getSdcardPath(), "auto_magireco/");
                    let screenshotDir = files.join(snapshotDir, "screenshots/");
                    let img = getDiskImg(screenshot, 0, "action");
                    if (img != null) {
                        log("保存完整屏幕截图...");
                        let screenshotPath = files.join(screenshotDir, "screenshot.png");
                        files.ensureDir(screenshotPath);
                        images.save(screenshot, screenshotPath, "png");
                        log("保存完整屏幕截图完成");
                        log("保存第一个盘的动作图片...");
                        let imgPath = files.join(screenshotDir, "firstDisk.png");
                        files.ensureDir(imgPath);
                        images.save(img, imgPath, "png");
                        log("保存第一个盘的动作图片完成");
                        for (let action of ["accel", "blast", "charge"]) {
                            log("保存用于参考的"+action+"盘的动作图片...");
                            let refImgPath = files.join(screenshotDir, action+".png");
                            images.save(knownImgs[action], refImgPath, "png");
                            log("保存用于参考的"+action+"盘的动作图片完成");
                        }
                    }
                    toastLog("调试模式下已保存图片,退出识图自动战斗");
                    stopThread();
                }
            }
            if (diskAppearedCount >= 3) {
                if (!limit.CVAutoBattleDebug) {
                    //为保证调试模式有机会保存图片，调试模式开启时不break
                    result = true;
                    break;
                }
            }
            if(cycles>300*5) {
                log("等待己方回合已经超过10分钟，结束运行");
                stopThread();
            }
            sleep(333);
        }
        return result;
    }

    //判断是否胜利
    var knownMirrorsWinLoseCoords = {
        mirrorsWinLetterI: {
            topLeft: {
                x:   962,
                y:   370,
                pos: "center"
            },
            bottomRight: {
                x:   989,
                y:   464,
                pos: "center"
            }
        },
        mirrorsLose: {
            topLeft: {
                x:   757,
                y:   371,
                pos: "center"
            },
            bottomRight: {
                x:   1161,
                y:   463,
                pos: "center"
            }
        }
    };

    function getMirrorsWinLoseArea(winOrLose) {
        let knownArea = knownMirrorsWinLoseCoords[winOrLose];
        let convertedTopLeft = convertCoords(knownArea.topLeft);
        let convertedBottomRight = convertCoords(knownArea.bottomRight);
        let convertedArea = { topLeft: convertedTopLeft, bottomRight: convertedBottomRight };
        return convertedArea;
    }
    function getMirrorsWinLoseCoords(winOrLose, corner) {
        let area = getMirrorsWinLoseArea(winOrLose);
        return area.corner;
    }
    function getMirrorsWinLoseImg(screenshot, winOrLose) {
        let area = getMirrorsWinLoseArea(winOrLose);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }
    function didWeWinOrLose(screenshot, winOrLose) {
        //结算页面有闪光，会干扰判断，但是只会产生假阴性，不会出现假阳性
        let imgA = knownImgs[winOrLose];
        let imgB = getMirrorsWinLoseImg(screenshot, winOrLose);
        let similarity = images.getSimilarity(imgA, imgB, {"type": "MSSIM"});
        log("镜界胜负判断", winOrLose, " MSSIM=", similarity);
        if (similarity > 2.1) {
            return true;
        }
        return false;
    }
    function didWeWin(screenshot) {
        return didWeWinOrLose(screenshot, "mirrorsWinLetterI");
    }
    function didWeLose(screenshot) {
        return didWeWinOrLose(screenshot, "mirrorsLose");
    }

    var failedScreenShots = [null, null, null, null, null]; //保存图片，调查无法判定镜层战斗输赢的问题
    //判断最终输赢
    function clickMirrorsBattleResult() {
        var screenCenter = {
            x:   960,
            y:   540,
            pos: "center"
        };
        let failedCount = 0; //调查无法判定镜层战斗输赢的问题
        /* 演习模式没有rankMark
        while (id("ArenaResult").findOnce() || (id("enemyBtn").findOnce() && id("rankMark").findOnce())) {
        */
        while (id("ArenaResult").findOnce() || id("enemyBtn").findOnce()) {
            log("匹配到镜层战斗结算控件");
            let screenshot = compatCaptureScreen();
            //调查无法判定镜层战斗输赢的问题
            //failedScreenShots[failedCount] = images.clip(screenshot, 0, 0, scr.res.width, scr.res.height); //截图会被回收，导致保存失败；这样可以避免回收
            var win = false;
            if (didWeWin(screenshot)) {
                win = true;
                log("镜界战斗胜利");
            } else if (didWeLose(screenshot)) {
                win = false;
                log("镜界战斗败北");
            } else {
                //结算页面有闪光，会干扰判断
                log("没在屏幕上识别到镜界胜利或败北特征");
                //有时候点击结算页面后会无法正确判断胜利或失败
                failedCount++;
                failedCount = failedCount % 5;
            }
            log("即将点击屏幕以退出结算界面...");
            click(convertCoords(screenCenter));
            sleep(1000);
        }

        //用到副本而不是镜层的时候
        if (id("ResultWrap").findOnce() ||
            id("retryWrap").findOnce() || id("hasTotalRiche").findOnce()) {
            log("匹配到副本结算控件");
            //clickResult();
            toastLog("战斗已结束进入结算");
        }
    }


    //放缩参考图像以适配当前屏幕分辨率
    var resizeKnownImgsDone = false;
    function resizeKnownImgs() {
        if (resizeKnownImgsDone) return;
        let hasError = false;
        for (let imgName in knownImgs) {
            let newsize = [0, 0];
            let knownArea = null;
            if (diskActions.find((val) => val == imgName) != null) {
                knownArea = knownFirstDiskCoords["action"];
            } else if (diskAttribs.find((val) => val == imgName || val+"BtnDown" == imgName) != null) {
                knownArea = knownFirstStandPointCoords["our"]["attrib"]; //防止图像大小不符导致MSSIM==-1
            } else if (imgName == "connectIndicatorBtnDown") {
                knownArea = knownFirstDiskCoords["connectIndicator"];
            } else if (imgName == "skillLocked" || imgName.startsWith("skillEmpty")) {
                knownArea = knownFirstSkillCoords;
            } else if (imgName == "OKButton" || imgName == "OKButtonGray") {
                knownArea = knownOKButtonCoords;
            } else {
                knownArea = knownFirstStandPointCoords.our[imgName];
                if (knownArea == null) knownArea = knownFirstDiskCoords[imgName];
                if (knownArea == null) knownArea = knownMirrorsWinLoseCoords[imgName];
            }
            if (knownArea != null) {
                let convertedArea = getConvertedAreaNoCutout(knownArea); //刘海屏的坐标转换会把左上角的0,0加上刘海宽度，用在缩放图片这里会出错，所以要避免这个问题
                log("缩放图片 imgName", imgName, "knownArea", knownArea, "convertedArea", convertedArea);
                if (knownImgs[imgName] == null) {
                    hasError = true;
                    log("缩放图片出错 imgName", imgName);
                    break;
                }
                let resizedImg = images.resize(knownImgs[imgName], [getAreaWidth(convertedArea), getAreaHeight(convertedArea)]);
                knownImgs[imgName].recycle();
                knownImgs[imgName] = resizedImg;
            } else {
                hasError = true;
                log("缩放图片出错 imgName", imgName);
                break;
            }
        }
        resizeKnownImgsDone = !hasError;
    }



    function mirrorsSimpleAutoBattleMain() {
        initialize();

        var battleResultIDs = ["ArenaResult", "enemyBtn", "ResultWrap", "retryWrap", "hasTotalRiche"];
        var isBattleResult = false;

        var battleEndIDs = ["matchingWrap", "matchingList"];

        //简单镜层自动战斗
        while (true) {
            for (let n=0; n<8; n++) {
                log("n="+n);
                let isDiskClickable = [(n&4)==0, (n&2)==0, (n&1)==0];
                let breakable = false;
                for (let pass=1; pass<=4; pass++) {
                    for (let i=1; i<=3; i++) {
                        for (let resID of battleEndIDs) {
                            if (findID(resID)) {
                                log("找到", resID, ", 结束简单镜层自动战斗");
                                return;
                            } else {
                                log("未找到", resID);
                            }
                        }
                        isBattleResult = false;
                        battleResultIDs.forEach(function (val) {
                            if (findID(val, false) != null) {
                                log("找到", val);
                                isBattleResult = true;
                            }
                        });
                        if (!isBattleResult) {
                            if (isDiskClickable[i-1] || (pass >= 1 && pass <= 2)) {
                                click(convertCoords(clickSetsMod["battlePan"+i]));
                                sleep(1000);
                            }
                        } else {
                            breakable = true;
                            break;
                        }
                    }
                    if (breakable) break;
                }
                if (breakable) break;
            }

            //点掉镜层结算页面
            isBattleResult = false;
            battleResultIDs.forEach(function (val) {
                if (findID(val, false) != null) {
                    log("找到", val);
                    isBattleResult = true;
                }
            });
            if (isBattleResult) {
                click(convertCoords(clickSetsMod.levelup));
            }
            sleep(3000);

            //点掉副本结算页面（如果用在副本而不是镜层中）
            if (id("ResultWrap").findOnce() ||
                id("retryWrap").findOnce() || id("hasTotalRiche").findOnce()) {
                //clickResult();
                toastLog("战斗已结束进入结算");
                break;
            }
        }
    }

    function mirrorsAutoBattleMain() {
        if (!limit.privilege && (limit.useCVAutoBattle && limit.rootScreencap)) {
            toastLog("需要root或shizuku adb权限");
            if (requestShellPrivilegeThread == null || !requestShellPrivilegeThread.isAlive()) {
                requestShellPrivilegeThread = threads.start(requestShellPrivilege);
                requestShellPrivilegeThread.waitFor();
                threads.start(function () {
                    requestShellPrivilegeThread.join();
                    enableAutoService();
                });
            }
            return;
        }

        if (!loadAllImages()) {
            return;
        }

        initialize();

        log("缩放图片...");
        resizeKnownImgs();//必须放在initialize后面
        log("图片缩放完成");

        if (limit.useCVAutoBattle && limit.rootScreencap) {
            while (true) {
                log("setupBinary...");
                setupBinary();
                if (binarySetupDone) break;
                log("setupBinary失败,3秒后重试...");
                sleep(3000);
            }
            if (testRootScreencapBlank()) return;
        } else if (limit.useCVAutoBattle && (!limit.rootScreencap)) {
            startScreenCapture();
        }

        //利用截屏识图进行稍复杂的自动战斗（比如连携）
        //开始一次镜界自动战斗
        turn = 0;
        while(true) {
            if(!waitForOurTurn()) break;
            //我的回合，抽盘
            turn++;

            //扫描行动盘之前，先确保Magia面板没开
            if (isMagiaDiskAppearing(compatCaptureScreen())) {
                toggleMagiaPanel(false);
            }

            //扫描行动盘和战场信息
            scanDisks();
            scanBattleField("our");
            scanBattleField("their");

            //优先打能克制我方的属性
            let disadvAttribs = [];
            disadvAttribs = getAdvDisadvAttribsOfStandPoints(getAliveStandPoints("our"), "adv");
            let disadvAttrEnemies = [];
            disadvAttribs.forEach((attrib) => getEnemiesByAttrib(attrib).forEach((enemy) => disadvAttrEnemies.push(enemy)));
            if (disadvAttrEnemies.length > 0) {
                let disadvAttribsOfEnemies = [];
                disadvAttrEnemies.forEach(function (enemy) {
                    if (disadvAttribsOfEnemies.find((attrib) => attrib == enemy.attrib) == null) {
                        disadvAttribsOfEnemies.push(enemy.attrib);
                    }
                });
                if (disadvAttribsOfEnemies.length == 1) {
                    log("对面只有一种能克制我方的强势属性，优先集火");
                    aimAtEnemy(disadvAttrEnemies[0]);
                } else {
                    log("对面不止一种能克制我方的强势属性");
                    if (allActionDisks.find((disk) => disk.connectable) != null) {
                        log("我方可以发动连携");
                        let ourAttribs = [];
                        getAliveStandPoints("our").forEach(function (standPoint) {
                            if (ourAttribs.find((attrib) => attrib == standPoint.attrib) == null) {
                                //不是重复的
                                ourAttribs.push(standPoint.attrib);
                            }
                        });
                        let ourDesiredAttribs = [];
                        ourAttribs.forEach(function (attrib) {
                            let attribs = getAdvDisadvAttribs(attrib, "disadv");
                            if (attribs.length == 1) ourDesiredAttribs.push(attribs[0]);
                        });
                        let ourUndesiredAttribs = [];
                        ourAttribs.forEach(function (attrib) {
                            let attribs = getAdvDisadvAttribs(attrib, "adv");
                            if (attribs.length == 1) ourUndesiredAttribs.push(attribs[0]);
                        });
                        log("寻找能被我方场上任意角色克制的敌人...");
                        let desiredEnemy = disadvAttrEnemies.find((enemy) =>
                            ourDesiredAttribs.find((attrib) => attrib == enemy.attrib) != null
                        );
                        if (desiredEnemy != null) {
                            log("找到能被我方场上任意角色克制的敌人");
                            aimAtEnemy(desiredEnemy);
                        } else {
                            log("退而求其次，找至少不会克制我方的敌人...");
                            let desiredEnemy = disadvAttrEnemies.find((enemy) =>
                                ourUndesiredAttribs.find((attrib) => attrib == enemy.attrib) == null
                            );
                            if (desiredEnemy != null) {
                                log("找到至少不会克制我方的敌人");
                                aimAtEnemy(desiredEnemy);
                            } else {
                                log("只有克制我方的敌人，没办法");
                                aimAtEnemy(disadvAttrEnemies[0]);
                            }
                        }
                    } else {
                        log("我方没有连携可供发动");
                        let sameCharaDisks = findSameCharaDisks(allActionDisks);
                        let ourFirstDiskAttrib = null;
                        if (sameCharaDisks.length >= 3) {
                            log("我方可以选出Puella Combo盘");
                            ourFirstDiskAttrib = sameCharaDisks[0].attrib;
                        } else {
                            log("我方选不出Puella Combo盘");
                            let accelDisk = findSameActionDisks(allActionDisks, "accel");
                            if (accelDisk != null) {
                                log("没有连携也没有Puella Combo，Accel盘应会是第一个盘");
                                ourFirstDiskAttrib = accelDisk.attrib;
                            } else {
                                log("连Accel盘也没有，就看顺位第一个盘吧");
                                ourFirstDiskAttrib = allActionDisks[0].attrib;
                            }
                        }
                        log("在对面找能被我方属性克制的敌人，或是至少不克制我方的...");
                        let undesiredEnemyAttribs = getAdvDisadvAttribs(ourFirstDiskAttrib, "adv");
                        let desiredEnemyAttribs = getAdvDisadvAttribs(ourFirstDiskAttrib, "disadv");
                        log("寻找能被我方克制的敌人...");
                        let desiredEnemy = disadvAttrEnemies.find((enemy) =>
                            desiredEnemyAttribs.find((attrib) => attrib == enemy.attrib) != null
                        );
                        if (desiredEnemy != null) {
                            log("找到能被我方克制的敌人");
                            aimAtEnemy(desiredEnemy);
                        } else {
                            log("退而求其次，不克制我方就行...");
                            desiredEnemy = disadvAttrEnemies.find((enemy) =>
                                undesiredEnemyAttribs.find((attrib) => attrib == enemy.attrib) == null
                            );
                            if (desiredEnemy != null) {
                                log("找到不克制我方的敌人");
                                aimAtEnemy(desiredEnemy);
                            } else {
                                log("找不到，没办法，只能逆属性攻击了");
                                aimAtEnemy(disadvAttrEnemies[0]);
                            }
                        }
                    }
                }
            }

            if (disadvAttrEnemies.length == 0) {
                //敌方没有能克制我方的属性，推后打被我方克制的属性
                let advAttribs = [];
                advAttribs = getAdvDisadvAttribsOfStandPoints(getAliveStandPoints("our"), "disadv");
                let advAttrEnemies = [];
                if (advAttribs.length > 0) advAttrEnemies = getEnemiesByAttrib(advAttribs[0]);
                if (advAttrEnemies.length > 0) avoidAimAtEnemies(advAttrEnemies);
            }

            if (limit.CVAutoBattleClickAllSkills) {
                if (turn >= parseInt(limit.CVAutoBattleClickSkillsSinceTurn)) {
                    //一般在第3回合后主动技能才冷却完毕
                    //闭着眼放出所有主动技能
                    clickAllSkills();
                }
            }

            if (limit.CVAutoBattleClickAllMagiaDisks) {
                //闭着眼放出所有Magia/Doppel大招
                clickAllMagiaDisks();
                //如果三个盘都是Magia/Doppel那就不用选A/B/C盘了
                if (clickedDisksCount >= 3) continue;
            }

            //提前把不被克制的盘排到前面
            //这样一来，如果后面既没有接连携的角色更没有进一步（同角色）的Accel/Blast Combo
            //也没有无连携的Puella Combo和进一步（同角色）的Accel/Blast Combo
            //应该就会顺位选到它们
            let nonDisadvAttribDisks = findNonDisadvAttribDisks(allActionDisks, [battleField["their"].lastAimedAtEnemy]);
            prioritiseDisks(nonDisadvAttribDisks);

            //在所有盘中找第一个能连携的盘
            let connectableDisks = [];
            connectableDisks = getConnectableDisks(allActionDisks);

            if (connectableDisks.length > 0) {
                //如果有连携，第一个盘上连携
                let selectedDisk = connectableDisks[0];
                //连携尽量用accel/blast盘
                let AorBConnectableDisks = findSameActionDisks(connectableDisks, limit.CVAutoBattlePreferAccel ? "accel" : "blast");
                if (AorBConnectableDisks.length > 0) selectedDisk = AorBConnectableDisks[0];
                prioritiseDisks([selectedDisk]); //将当前连携盘从选盘中排除
                connectDisk(selectedDisk);
                //上连携后，尽量用接连携的角色
                let connectAcceptorDisks = findDisksByCharaID(allActionDisks, selectedDisk.connectedTo);
                prioritiseDisks(connectAcceptorDisks);
                //连携的角色尽量打出Accel/Blast/Charge Combo
                let sameActionComboDisks = findSameActionDisks(
                    limit.CVAutoBattlePreferABCCombo
                        ? allActionDisks.filter((val) => ordinalNum[val.priority] >= clickedDisksCount)
                        : connectAcceptorDisks,
                    selectedDisk.action
                );
                if (sameActionComboDisks.length >= 2) {
                    prioritiseDisks(sameActionComboDisks);
                    if (limit.CVAutoBattlePreferABCCombo) {
                        prioritiseDisks(sameActionComboDisks.filter(
                            (disk) => connectAcceptorDisks.find((val) => disk.position == val.position) != null
                        ));
                    }
                } else {
                    //凑不够Accel/Blast/Charge Combo，再试试XCA/XCB
                    let chargeDisks = findSameActionDisks(connectAcceptorDisks, "charge");
                    if (chargeDisks.length > 0) {
                        let AccelOrBlastDisks = findSameActionDisks(connectAcceptorDisks, limit.CVAutoBattlePreferAccel ? "accel" : "blast");
                        if (AccelOrBlastDisks.length == 0) {
                            AccelOrBlastDisks = findSameActionDisks(connectAcceptorDisks, limit.CVAutoBattlePreferAccel ? "blast" : "accel");
                        }
                        if (AccelOrBlastDisks.length > 0) {
                            prioritiseDisks([chargeDisks[0], AccelOrBlastDisks[0]]);
                        }
                    }
                }
            } else {
                //没有连携
                let candidateDisks = allActionDisks;
                //默认先找Puella Combo
                let sameCharaDisks = findSameCharaDisks(allActionDisks);
                if (sameCharaDisks.length >= 3) {
                    candidateDisks = limit.CVAutoBattlePreferABCCombo ? allActionDisks : sameCharaDisks;
                    if (!limit.CVAutoBattlePreferABCCombo) {
                        prioritiseDisks(sameCharaDisks);
                    }
                }
                //再依次找Accel/Blast/Charge Combo
                let comboDisks = [];
                let sameactionseq = limit.CVAutoBattlePreferAccel ? ["accel", "blast", "charge"] : ["blast", "accel", "charge"];
                for (let action of sameactionseq) {
                    comboDisks = findSameActionDisks(candidateDisks, action);
                    if (comboDisks.length >= 3) {
                        prioritiseDisks(comboDisks);
                        if (limit.CVAutoBattlePreferABCCombo) {
                            //已经优先凑出了Accel/Blast/Charge Combo，继续尝试在Accel/Blast/Charge Combo凑出Puella Combo
                            prioritiseDisks(findSameCharaDisks(comboDisks));
                        }
                        break;
                    }
                }
                let lastPreferredDisks = [];
                let lastPreferredDisksCandidates = {};
                if (comboDisks.length < 3) {
                    //再找ACB、ACA(如果开启优先用Accel盘,则优先找ACA、ACB)
                    //先找Puella Combo内的ACA、ACB，再找混合ACA、ACB
                    candidateDisks = sameCharaDisks.length >= 3 ? sameCharaDisks : allActionDisks;
                    for (let attempt=0,attemptMax=sameCharaDisks.length>=3?2:1; attempt<attemptMax; attempt++) {
                        let nonsameactionsequences = {
                            ACA: ["accel", "charge", "accel"],
                            ACB: ["accel", "charge", "blast"],
                        };
                        //如果开启优先用Accel盘,则优先找ACA、ACB
                        for (let name of (limit.CVAutoBattlePreferAccel ? ["ACA", "ACB"] : ["ACB", "ACA"])) {
                            if (lastPreferredDisksCandidates[name] == null)
                                lastPreferredDisksCandidates[name] = [];
                            let nonsameactionseq = nonsameactionsequences[name];
                            for (let action of nonsameactionseq) {
                                let foundDisks = findSameActionDisks(candidateDisks, action);
                                //找到之前没加进来过的
                                let foundDisk = foundDisks.find((disk) =>
                                    lastPreferredDisksCandidates[name].find((val) => val.position == disk.position) == null
                                );
                                if (foundDisk != null) {
                                    lastPreferredDisksCandidates[name].push(foundDisk);
                                }
                            }
                            if (lastPreferredDisksCandidates[name].length >= 3) {
                                lastPreferredDisks = lastPreferredDisksCandidates[name];
                                break;
                            }
                        }
                        if (lastPreferredDisks.length >= 3) {
                            prioritiseDisks(lastPreferredDisks);
                            break;
                        } else if (sameCharaDisks.length >= 3) {
                            //有Puella Combo但Puella Combo内没有ACA/ACB，那就Puella Combo
                            prioritiseDisks(sameCharaDisks);
                            break;
                        }
                        candidateDisks = allActionDisks;
                    }
                }
                if (clickedDisksCount > 0 && clickedDisksCount < 3) {
                    //(应该是点击了magia/doppel盘)没有连携,但已点击盘数大于0(且小于3,否则3个盘已经全点完了,不过点完3个M/D盘后也不应该走到这里),
                    //为了方便单鹤乃这种只有2个A的盘型(比如鹤乃是AABBC),放出magia后,就继续点击剩下2个A盘(总体上是点击了MAA这3个盘)
                    //简而言之,(只在开启“优先用Accel盘”的情况下)方便连续点击MAA这3个盘
                    let accelOrBlastDisks = findSameActionDisks(allActionDisks, limit.CVAutoBattlePreferAccel ? "accel" : "blast");
                    if (accelOrBlastDisks.length >= 2) {
                        //A/B盘有2个或以上,继续点击剩下的A/B盘
                        prioritiseDisks(accelOrBlastDisks);
                    } else if (accelOrBlastDisks.length >= 1) {
                        //只有1个A/B盘了
                        if (clickedDisksCount > 1) {
                            //前面应该是点了2个M/D盘,那么最后第3个盘留给A/B
                            prioritiseDisks(accelOrBlastDisks);
                        } else {
                            //前面应该是只点击了1个M/D盘,还剩2个盘没点,但现在只有1个A/B盘
                            let chargeDisks = findSameActionDisks(allActionDisks, "charge");
                            if (chargeDisks.length > 0) {
                                //如果有C盘,就把C盘放在A/B盘前面(于是是点击了MCA/MCB)
                                prioritiseDisks([chargeDisks[0], accelOrBlastDisks[0]]);
                            } else {
                                //没有C盘,那就(第2个盘)就单纯继续点击A/B盘,然后随缘
                                prioritiseDisks(accelOrBlastDisks[0]);
                            }
                        }
                    }
                }
            }

            //完成选盘，有连携就点完剩下两个盘；没连携就点完三个盘
            for (let i=clickedDisksCount; i<3; i++) {
                let diskToClick = getDiskByPriority(allActionDisks, ordinalWord[i]);
                //有时候点连携盘会变成长按拿起又放下，改成拖出去连携来避免这个问题
                if (diskToClick.connectable) {
                    //重新识别盘是否可以连携
                    //（比如两人互相连携，A=>B后，A本来可以连携的盘现在已经不能连携了，然后B=>A后又会用A的盘，这时很显然需要重新识别）
                    let isConnectableDown = isDiskConnectableDown(compatCaptureScreen(), diskToClick.position); //isConnectableDown.down==true也有可能是只剩一人无法连携的情况，
                    diskToClick.connectable = isConnectableDown.connectable && (!isConnectableDown.down); //所以这里还无法区分盘是否被按下，但是可以排除只剩一人无法连携的情况
                }
                if (diskToClick.connectable) {
                    connectDisk(diskToClick);
                } else {
                    clickDisk(diskToClick);
                }
            }
        }

        //战斗结算
        //点掉结算界面
        clickMirrorsBattleResult();
        //调查无法判定镜层战斗输赢的问题
        //for (i=0; i<failedScreenShots.length; i++) {
        //    if (failedScreenShots[i] != null) {
        //        let filename = "/sdcard/1/failed_"+i+".png";
        //        log("saving image... "+filename);
        //        images.save(failedScreenShots[i], filename);
        //        log("done. saved: "+filename);
        //    }
        //}

        //回收所有图片
        recycleAllImages();
    }



    var knownFirstMirrorsOpponentScoreCoords = {
        //[1246,375][1357,425]
        //[1246,656][1357,706]
        //[1246,937][1357,988]
        topLeft: {x: 1236, y: 370, pos: "center"},
        bottomRight: {x: 1400, y: 430, pos: "center"},
        distance: 281
    }
    //在匹配到的三个对手中，获取指定的其中一个（1/2/3）的战力值
    function getMirrorsScoreAt(position) {
        let distance = knownFirstMirrorsOpponentScoreCoords.distance * (position - 1);
        let knownArea = {
            topLeft: {x: 0, y: distance, pos: "center"},
            bottomRight: {x: 0, y: distance, pos: "center"}
        }
        for (point in knownArea) {
            for (axis of ["x", "y"]) {
                knownArea[point][axis] += knownFirstMirrorsOpponentScoreCoords[point][axis];
            }
        }
        let convertedArea = getConvertedArea(knownArea);
        let uiObjArr = boundsInside(convertedArea.topLeft.x, convertedArea.topLeft.y, convertedArea.bottomRight.x, convertedArea.bottomRight.y).find();
        for (let i=0; i<uiObjArr.length; i++) {
            let uiObj = uiObjArr[i];
            let score = parseInt(getContent(uiObj));
            if (isNaN(score)) continue;
            log("getMirrorsScoreAt position", position, "score", score);
            return score;
        }
        log("getMirrorsScoreAt position", position, "return 0");
        return 0;
    }

    var knownMirrorsSelfScoreCoords = {
        //[0,804][712,856]
        topLeft: {x: 0, y: 799, pos: "bottom"},
        bottomRight: {x: 717, y: 861, pos: "bottom"}
    }
    //获取自己的战力值
    function getMirrorsSelfScore() {
        let convertedArea = getConvertedArea(knownMirrorsSelfScoreCoords);
        let uiObjArr = boundsInside(convertedArea.topLeft.x, convertedArea.topLeft.y, convertedArea.bottomRight.x, convertedArea.bottomRight.y).find();
        for (let i=0; i<uiObjArr.length; i++) {
            let uiObj = uiObjArr[i];
            let score = parseInt(getContent(uiObj));
            if (score != null && !isNaN(score)) {
                log("getMirrorsSelfScore score", score);
                return score;
            }
        }
        return 0;
    }

    var knownFirstMirrorsLvCoords = {
        //r1c1 Lv: [232,236][253,258] 100: [260,228][301,260]
        //r3c3 Lv: [684,688][705,710] 100: [712,680][753,712]
        topLeft: {x: 227, y: 223, pos: "center"},
        bottomRight: {x: 306, y: 265, pos: "center"},
        distancex: 226,
        distancey: 226
    }
    //点开某个对手后会显示队伍信息。获取显示出来的角色等级
    function getMirrorsLvAt(rowNum, columnNum) {
        let distancex = knownFirstMirrorsLvCoords.distancex * (columnNum - 1);
        let distancey = knownFirstMirrorsLvCoords.distancey * (rowNum - 1);
        let knownArea = {
            topLeft: {x: distancex, y: distancey, pos: "center"},
            bottomRight: {x: distancex, y: distancey, pos: "center"}
        }
        for (point in knownArea) {
            for (axis of ["x", "y"]) {
                knownArea[point][axis] += knownFirstMirrorsLvCoords[point][axis];
            }
        }
        let convertedArea = getConvertedArea(knownArea);
        let uiObjArr = boundsInside(convertedArea.topLeft.x, convertedArea.topLeft.y, convertedArea.bottomRight.x, convertedArea.bottomRight.y).find();
        for (let i=0; i<uiObjArr.length; i++) {
            let uiObj = uiObjArr[i];
            let content = getContent(uiObj);
            if (content != null) {
                let matched = content.match(/\d+/);
                if (matched != null) content = matched[0];
            }
            lv = parseInt(content);
            if (lv != null && !isNaN(lv)) {
                log("getMirrorsLvAt rowNum", rowNum, "columnNum", columnNum, "lv", lv);
                return lv;
            }
        }
        return 0;
    }
    //在对手队伍信息中获取等级信息，用来计算人均战力
    function getMirrorsAverageScore(totalScore) {
        //刷新auto.root（也许只有心理安慰作用？）
        try { auto.root != null && auto.root.refresh(); } catch (e) {}; //只刷新一次

        if (totalScore == null) return 0;
        log("getMirrorsAverageScore totalScore", totalScore);
        let totalSqrtLv = 0;
        let totalLv = 0;
        let charaCount = 0;
        let highestLv = 0;

        let attemptMax = 5;
        for (let rowNum=1; rowNum<=3; rowNum++) {
            for (let columnNum=1; columnNum<=3; columnNum++) {
                let Lv = 0;
                for (let attempt=0; attempt<attemptMax; attempt++) {
                    Lv = getMirrorsLvAt(rowNum, columnNum);
                    if (Lv > 0) {
                        if (Lv > highestLv) highestLv = Lv;
                        totalLv += Lv;
                        totalSqrtLv += Math.sqrt(Lv);
                        charaCount += 1;
                        break;
                    }
                    if (attempt < attemptMax - 1) sleep(100);
                }
                attemptMax = 1;
            }
        }
        log("getMirrorsAverageScore charaCount", charaCount, "highestLv", highestLv, "totalLv", totalLv, "totalSqrtLv", totalSqrtLv);
        if (charaCount == 0) return 0; //对手队伍信息还没出现
        let avgScore = totalScore / totalSqrtLv * Math.sqrt(highestLv); //按队伍里的最高等级进行估计（往高了估，避免错把强队当作弱队）
        log("getMirrorsAverageScore avgScore", avgScore);
        return avgScore;
    }

    //在镜层自动挑选最弱的对手
    function mirrorsPickWeakestOpponent() {
        toast("挑选最弱的镜层对手...");

        var startTime = new Date().getTime();
        var deadlineTime = startTime + 60 * 1000; //最多等待一分钟
        var stopTime = new Date().getTime() + 5000;

        //刷新auto.root（也许只有心理安慰作用？）
        for (let attempt=0; attempt<10; attempt++) {
            try {if (auto.root != null && auto.root.refresh()) break;} catch (e) {};
            sleep(100);
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("等待auto.root刷新时间过长");
                return false;
            }
        }

        stopTime = new Date().getTime() + 5000;

        let lowestTotalScore = Number.MAX_SAFE_INTEGER;
        let lowestAvgScore = Number.MAX_SAFE_INTEGER;
        //数组第1个元素（下标0）仅用来占位
        let totalScore = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
        let avgScore = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
        let lowestScorePosition = 3;

        while (!id("matchingWrap").findOnce() && !id("matchingList").findOnce()) {
            log("等待对手列表出现...");
            sleep(1000);
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("没等到对手列表控件matchingWrap或matchingList出现,无法智能挑选最弱对手");
                return false;
            }
        }

        stopTime = new Date().getTime() + 5000;

        if (id("matchingList").findOnce()) {
            toastLog("当前处于演习模式");
            //演习模式下直接点最上面第一个对手
            while (id("matchingList").findOnce()) { //如果不小心点到战斗开始，就退出循环
                if (getMirrorsAverageScore(totalScore[1]) > 0) break; //如果已经打开了一个对手，直接战斗开始
                click(convertCoords(clickSetsMod["mirrorsOpponent"+"1"]));
                sleep(1000); //等待队伍信息出现，这样就可以点战斗开始
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到镜层对手队伍信息出现(也可能是虽然已经出现,但getMirrorsAverageScore没检测到导致的)");
                }
            }
            return true;
        }

        stopTime = new Date().getTime() + 5000;

        //如果已经打开了信息面板，先关掉
        for (let attempt=0; id("matchingWrap").findOnce(); attempt++) { //如果不小心点到战斗开始，就退出循环
            if (getMirrorsAverageScore(99999999) <= 0) break; //如果没有打开队伍信息面板，那就直接退出循环，避免点到MENU
            if (attempt % 5 == 0) click(convertCoords(clickSetsMod["mirrorsCloseOpponentInfo"]));
            sleep(1000);
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("没等到镜层对手队伍信息面板消失");
                return false;
            }
        }

        stopTime = new Date().getTime() + 5000;

        let selfScore = getMirrorsSelfScore();

        //获取每个对手的总战力
        for (let position=1; position<=3; position++) {
            for (let attempt=0; attempt<10; attempt++) {
                totalScore[position] = getMirrorsScoreAt(position);
                if (totalScore[position] > 0) break;
                sleep(100);
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到第"+position+"个镜层对手的队伍信息出现(也可能是虽然已经出现,但getMirrorsAverageScore没检测到导致的)");
                    return false;
                }
            }
            if (totalScore[position] <= 0) {
                toastLog("获取某个对手的总战力失败\n请尝试退出镜层后重新进入");
                log("获取第"+position+"个对手的总战力失败");
                return false;
            }
            if (totalScore[position] < lowestTotalScore) {
                lowestTotalScore = totalScore[position];
                lowestScorePosition = position;
            }
        }

        stopTime = new Date().getTime() + 5000;

        //福利队
        //因为队伍最多5人，所以总战力比我方总战力六分之一还少应该就是福利队
        if (lowestTotalScore < selfScore / 6) {
            toastLog("找到了战力低于我方六分之一的对手\n位于第"+lowestScorePosition+"个,战力="+totalScore[lowestScorePosition]);
            while (id("matchingWrap").findOnce()) { //如果不小心点到战斗开始，就退出循环
                click(convertCoords(clickSetsMod["mirrorsOpponent"+lowestScorePosition]));
                sleep(2000); //等待队伍信息出现，这样就可以点战斗开始
                if (getMirrorsAverageScore(totalScore[lowestScorePosition]) > 0) break;
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到镜层对手(福利队)的队伍信息出现");
                    return false;
                }
            }
            return true;
        }

        stopTime = new Date().getTime() + 5000;

        //找平均战力最低的
        for (let position=1; position<=3; position++) {
            toast("检查第"+position+"个镜层对手的队伍情况...");
            while (id("matchingWrap").findOnce()) { //如果不小心点到战斗开始，就退出循环
                click(convertCoords(clickSetsMod["mirrorsOpponent"+position]));
                sleep(2000); //等待对手队伍信息出现（avgScore<=0表示对手队伍信息还没出现）
                avgScore[position] = getMirrorsAverageScore(totalScore[position]);
                if (avgScore[position] > 0) {
                    if (avgScore[position] < lowestAvgScore) {
                        lowestAvgScore = avgScore[position];
                        lowestScorePosition = position;
                    }
                    break;
                }
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到第"+position+"个镜层对手的队伍信息出现");
                    return false;
                }
            }

            //关闭信息面板
            for (let attempt=0; id("matchingWrap").findOnce(); attempt++) { //如果不小心点到战斗开始，就退出循环
                if (position == 3) break; //第3个对手也有可能是最弱的，暂时不关面板
                if (attempt % 5 == 0) click(convertCoords(clickSetsMod["mirrorsCloseOpponentInfo"]));
                sleep(1000);
                if (getMirrorsAverageScore(totalScore[position]) <= 0) break;
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到第"+position+"个镜层对手的队伍信息出现");
                    return false;
                }
            }
        }

        stopTime = new Date().getTime() + 5000;

        log("找到平均战力最低的对手", lowestScorePosition, totalScore[lowestScorePosition], avgScore[lowestScorePosition]);

        if (lowestScorePosition == 3) return true; //最弱的就是第3个对手

        //最弱的不是第3个对手，先关掉第3个对手的队伍信息面板
        for (let attempt=0; id("matchingWrap").findOnce(); attempt++) { //如果不小心点到战斗开始，就退出循环
            if (attempt % 5 == 0) click(convertCoords(clickSetsMod["mirrorsCloseOpponentInfo"]));
            sleep(1000);
            if (getMirrorsAverageScore(totalScore[lowestScorePosition]) <= 0) break;
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("没等到第3个镜层对手(不是最弱)的队伍信息消失");
                return false;
            }
        }

        stopTime = new Date().getTime() + 5000;

        //重新打开平均战力最低队伍的队伍信息面板
        while (id("matchingWrap").findOnce()) { //如果不小心点到战斗开始，就退出循环
            click(convertCoords(clickSetsMod["mirrorsOpponent"+lowestScorePosition]));
            sleep(1000); //等待队伍信息出现，这样就可以点战斗开始
            if (getMirrorsAverageScore(totalScore[lowestScorePosition]) > 0) return true;
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("没等到第"+lowestScorePosition+"个镜层对手(最弱)的队伍信息出现");
                return false;
            }
        }
        log("id(\"matchingWrap\").findOnce() == null");
        return true;
    }

    function mirrorsPick1stOpponent() {
        toastLog("挑选第1个镜层对手...");
        id("matchingWrap").findOne();
        for (let attempt=0; attempt<3; attempt++) {
            if (id("battleStartBtn").findOnce()) break; //MuMu等控件树残缺环境下永远也找不到battleStartBtn（虽然实际上有战斗开始按钮）
            click(convertCoords(clickSets.mirrors1stOpponent));
            sleep(1500);
        }
        log("挑选第1个镜层对手完成");
    }

    function taskMirrors() {
        toast("镜层周回\n自动战斗策略:"+(limit.useCVAutoBattle?"识图":"无脑123盘"));

        if (!limit.privilege && (limit.useCVAutoBattle && limit.rootScreencap)) {
            toastLog("需要root或shizuku adb权限");
            if (requestShellPrivilegeThread == null || !requestShellPrivilegeThread.isAlive()) {
                requestShellPrivilegeThread = threads.start(requestShellPrivilege);
                requestShellPrivilegeThread.waitFor();
                threads.start(function () {
                    requestShellPrivilegeThread.join();
                    enableAutoService();
                });
            }
            return;
        }

        initialize();

        if (limit.useCVAutoBattle && limit.rootScreencap) {
            while (true) {
                log("setupBinary...");
                setupBinary();
                if (binarySetupDone) break;
                log("setupBinary失败,3秒后重试...");
                sleep(3000);
            }
            if (testRootScreencapBlank()) return;
        } else if (limit.useCVAutoBattle && (!limit.rootScreencap)) {
            startScreenCapture();
        }

        while (true) {
            var pickedWeakest = false;
            if (limit.smartMirrorsPick) {
                //挑选最弱的对手
                let pickWeakestAttemptMax = 2;
                for (let attempt=0; attempt<pickWeakestAttemptMax; attempt++) {
                    if (mirrorsPickWeakestOpponent()) {
                        pickedWeakest = true;
                        break;
                    }
                    toastLog("挑选镜层最弱对手时出错\n3秒后重试...");
                    sleep(3000);
                }
                if (!pickedWeakest) {
                    toastLog("多次尝试挑选镜层最弱对手时出错,回退到挑选第1个镜层对手...");
                }
            }
            if (!limit.smartMirrorsPick || !pickedWeakest) {
                mirrorsPick1stOpponent();
            }

            while (id("matchingWrap").findOnce() || id("matchingList").findOnce()) {
                sleep(1000)
                click(convertCoords(clickSetsMod.mirrorsStartBtn));
                sleep(1000)
                if (id("popupInfoDetailTitle").findOnce()) {
                    if (id("matchingList").findOnce()) {
                        log("镜层演习模式不嗑药");
                        log("不过，开始镜层演习需要至少有1BP");
                        log("镜层周回结束");
                        return;
                    } else if (isDrugEnabled(3)) {
                        while (!id("bpTextWrap").findOnce()) {
                            click(convertCoords(clickSetsMod.bpExhaustToBpDrug))
                            sleep(1500)
                        }
                        let attemptMax = 10;
                        for (let attempt=0; attempt<attemptMax; attempt++) {
                            if (!id("bpTextWrap").findOnce()) {
                                updateDrugLimit(3);
                                break;
                            }
                            if (attempt == attemptMax - 1) {
                                log("多次嗑BP药仍然没有反应,应该是BP药用完了,退出");
                                return;
                            }
                            click(convertCoords(clickSetsMod.bpDrugConfirm))
                            sleep(1500)
                        }
                        while (id("popupInfoDetailTitle").findOnce()) {
                            click(convertCoords(clickSetsMod.bpDrugRefilledOK))
                            sleep(1500)
                        }
                    } else {
                        click(convertCoords(clickSetsMod.bpClose))
                        log("镜层周回结束")
                        return;
                    }
                }
                sleep(1000)
            }
            log("进入战斗")
            if (limit.useCVAutoBattle) {
                //利用截屏识图进行稍复杂的自动战斗（比如连携）
                log("镜层周回 - 自动战斗开始：使用截屏识图");
                mirrorsAutoBattleMain();
            } else {
                //简单镜层自动战斗
                log("镜层周回 - 自动战斗开始：简单自动战斗");
                mirrorsSimpleAutoBattleMain();
            }
        }
    }

    /* ~~~~~~~~ 镜界自动战斗 结束 ~~~~~~~~ */

    function clickDiskWorkaroundRunnable() {
        const point = capture("请点击行动盘。若仍无反应，\n"
            +"可尝试修改“识图自动战斗脚本”脚本设置中的\n"
            +"“按下后等待多少毫秒后再松开行动盘”").pos_up;
        //国服2.1.10更新后出现无法点击magia盘的问题，从click改成swipe即可绕开问题
        swipe(point.x, point.y, point.x, point.y, parseInt(limit.CVAutoBattleClickDiskDuration));
    }

    /* ~~~~~~~~ 来自3.6.0版(以及点SKIP跳过剧情bug修正)的备用周回脚本 开始 ~~~~~~~~ */

    // strings constants
    const strings3_6_0 = {
        name: [
            "support",
            "revive_title",
            "revive_button",
            "revive_popup",
            "revive_confirm",
            "out_of_ap",
            "start",
            "follow",
            "follow_append",
            "battle_confirm",
            "cost_ap",
            "regex_drug",
            "regex_lastlogin",
            "regex_bonus",
            "regex_autobattle",
        ],
        zh_Hans: [
            "请选择支援角色",
            "AP回复",
            "回复",
            "回复确认",
            "回复",
            "AP不足",
            "开始",
            "关注",
            "关注追加",
            "确定",
            "消耗AP",
            /^\d+个$/,
            /^最终登录.+/,
            /＋\d+个$/,
            /[\s\S]*续战/,
        ],
        zh_Hant: [
            "請選擇支援角色",
            "AP回復",
            "回復",
            "回復確認",
            "進行回復",
            "AP不足",
            "開始",
            "關注",
            "追加關注",
            "決定",
            "消費AP",
            /^\d+個$/,
            /^最終登入.+/,
            /＋\d+個$/,
            /[\s\S]*周回/,
        ],
        ja: [
            "サポートキャラを選んでください",
            "AP回復",
            "回復",
            "回復確認",
            "回復する",
            "AP不足",
            "開始",
            "フォロー",
            "フォロー追加",
            "決定",
            "消費AP",
            /^\d+個$/,
            /^最終ログイン.+/,
            /＋\d+個$/,
            /[\s\S]*周回/,
        ],
    };

    var string3_6_0 = {};

    var druglimit3_6_0 = [NaN, NaN, NaN];
    // isolate logic for future adaption
    function ifUseDrug(index, count) {
        // when drug is valid
        if ((index < 2 && count > 0) || count > 4) {
            // unlimited
            if (isNaN(druglimit3_6_0[index])) return true;
            else if (druglimit3_6_0[index] > 0) return true;
        }
    }

    function updateDrugLimit3_6_0(index) {
        if (!isNaN(druglimit3_6_0[index])) {
            druglimit3_6_0[index]--;
            limit["drug" + (index + 1) + "num"] = "" + druglimit3_6_0[index];
        }
    }

    function refillAP3_6_0() {
        log("尝试使用回复药");
        var revive_title_element = null;
        var apinfo = null;

        do {
            let revive_title_attempt_max = 1500;
            for (let attempt=0; attempt<revive_title_attempt_max; attempt++) {
                log("等待AP药选择窗口出现...");
                revive_title_element = find(string3_6_0.revive_title, false);
                if (revive_title_element != null) {
                    log("AP药选择窗口已经出现");
                    break;
                }
                if (attempt == revive_title_attempt_max-1) {
                    log("长时间等待后，AP药选择窗口仍然没有出现，退出");
                    threads.currentThread().interrupt();
                }
                if (attempt % 5 == 0) {
                    apinfo = getAP();
                    if (apinfo) {
                        log("当前AP:" + apinfo.value + "/" + apinfo.total);
                        log("点击AP按钮");
                        click(apinfo.bounds.centerX(), apinfo.bounds.centerY());
                    } else {
                        log("检测AP失败");
                    }
                }
                sleep(200);
            }

            var usedrug = false;
            var numbers = matchAll(string3_6_0.regex_drug, true);
            var buttons = findAll(string3_6_0.revive_button);
            // when things seems to be correct
            if (numbers.length == 3 && buttons.length == 3) {
                for (let i = 0; i < 3; i++) {
                    if (ifUseDrug(i, parseInt(getContent(numbers[i]).slice(0, -1)))) {
                        log("使用第" + (i + 1) + "种回复药, 剩余" + druglimit3_6_0[i] + "次");
                        var bound = buttons[i].bounds();
                        do {
                            click(bound.centerX(), bound.centerY());
                            // wait for confirmation popup
                            var revive_popup_element = find(string3_6_0.revive_popup, 2000);
                        } while (revive_popup_element == null);
                        bound = find(string3_6_0.revive_confirm, true).bounds();
                        while (revive_popup_element.refresh()) {
                            log("找到确认回复窗口，点击确认回复");
                            click(bound.centerX(), bound.centerY());
                            waitElement(revive_popup_element, 5000);
                        }
                        log("确认回复窗口已消失");
                        usedrug = true;
                        updateDrugLimit3_6_0(i);
                        break;
                    }
                }
            }
            if (!usedrug && find(string3_6_0.out_of_ap)) {
                log("AP不足且未嗑药，退出");
                threads.currentThread().interrupt();
            }
            apinfo = getAP();
            log("当前AP:" + apinfo.value + "/" + apinfo.total);
        } while (usedrug && limit.useAuto && apinfo.value < apinfo.total * parseInt(limit.apmul));
        // now close the window
        revive_title_element = find(string3_6_0.revive_title, 2000); //不加这一行的时候，会出现卡在AP药选择窗口的问题（国服MuMu模拟器主线214上出现）
        while (revive_title_element != null && revive_title_element.refresh()) {
            log("关闭回复窗口");
            bound = revive_title_element.parent().bounds();
            click(bound.right, bound.top);
            waitElement(revive_title_element, 5000);
        }
        return usedrug;
    }

    function taskDefault3_6_0() {
        /* ~~~~ initialize begin ~~~~ */
        var usedrug = false;

        if (auto.root == null) {
            toastLog("未开启无障碍服务");
            //到这里还不会弹出申请开启无障碍服务的弹窗；后面执行到packageName()这个UI选择器时就会弹窗申请开启无障碍服务
        }
        var current = [];
        if (packageName("com.bilibili.madoka.bilibili").findOnce()) {
            log("检测为国服");
            current = strings3_6_0.zh_Hans;
        } else if (packageName("com.komoe.madokagp").findOnce()) {
            log("检测为台服");
            current = strings3_6_0.zh_Hant;
        } else if (packageName("com.aniplex.magireco").findOnce()) {
            log("检测为日服");
            current = strings3_6_0.ja;
        } else {
            toastLog("未在前台检测到魔法纪录");
            threads.currentThread().interrupt();
        }
        for (let i = 0; i < strings3_6_0.name.length; i++) {
            string3_6_0[strings3_6_0.name[i]] = current[i];
        }
        usedrug = false;
        for (let i = 0; i < 3; i++) {
            druglimit3_6_0[i] = limit["drug" + (i + 1)]
                ? parseInt(limit["drug" + (i + 1) + "num"])
                : 0;
            if (druglimit3_6_0[i] !== 0) {
                usedrug = true;
            }
        }
        /* ~~~~ initialize end ~~~~ */

        var state = STATE_MENU;
        var battlename = "";
        var charabound = null;
        var tryusedrug = true;
        var battlepos = null;
        var inautobattle = false;
        while (true) {
            switch (state) {
                case STATE_MENU: {
                    waitAny(
                        [
                            () => find(string3_6_0.support),
                            () => findID("helpBtn"),
                            () => match(/^BATTLE.+/),
                        ],
                        3000
                    );
                    // exit condition
                    if (find(string3_6_0.support)) {
                        state = STATE_SUPPORT;
                        log("进入助战选择");
                        break;
                    }
                    // if AP is not enough
                    if (findID("popupInfoDetailTitle")) {
                        // try use drug
                        tryusedrug = refillAP3_6_0();
                        break; //下一轮循环后会切换到助战选择状态，从而避免捕获关卡坐标后，错把助战当做关卡来误点击
                    }
                    // if need to click to enter battle
                    let button = find(string3_6_0.battle_confirm);
                    if (button) {
                        log("点击确认进入battle");
                        let bound = button.bounds();
                        click(bound.centerX(), bound.centerY());
                        // wait for support screen for 5 seconds
                        find(string3_6_0.support, 5000);
                    } else if (battlepos) {
                        log("尝试点击关卡坐标");
                        click(battlepos.x, battlepos.y);
                        waitAny(
                            [() => find(string3_6_0.battle_confirm), () => find(string3_6_0.support)],
                            5000
                        );
                    }
                    // click battle if available
                    else if (battlename) {
                        let battle = find(battlename);
                        if (battle) {
                            log("尝试点击关卡名称");
                            let bound = battle.bounds();
                            click(bound.centerX(), bound.centerY());
                            waitAny(
                                [() => find(string3_6_0.battle_confirm), () => find(string3_6_0.support)],
                                5000
                            );
                        }
                    } else {
                        log("等待捕获关卡坐标");
                        battlepos = capture().pos_up;
                    }
                    break;
                }

                case STATE_SUPPORT: {
                    // exit condition
                    if (findID("nextPageBtn")) {
                        state = STATE_TEAM;
                        log("进入队伍调整");
                        break;
                    }
                    // if we need to refill AP
                    let apinfo = getAP(5000);
                    let apcost = getCostAP();
                    log(
                        "消费AP",
                        apcost,
                        "用药",
                        usedrug,
                        "当前AP",
                        apinfo.value,
                        "AP上限",
                        apinfo.total
                    );
                    if (
                        ((limit.useAuto && apinfo.value < apinfo.total * parseInt(limit.apmul)) ||
                            (apcost && apinfo.value < apcost * 2)) &&
                        usedrug &&
                        tryusedrug
                    ) {
                        // open revive window
                        let revive_window;
                        do {
                            click(apinfo.bounds.centerX(), apinfo.bounds.centerY());
                            revive_window = findID("popupInfoDetailTitle", 5000);
                        } while (!revive_window);
                        // try use drug
                        tryusedrug = refillAP3_6_0();
                    }
                    // save battle name if needed
                    let battle = match(/^BATTLE.+/);
                    if (battle) {
                        battlename = getContent(battle);
                    }
                    // pick support
                    let ptlist = getPTList();
                    let playercount = matchAll(string3_6_0.regex_lastlogin).length;
                    log("候选数量" + ptlist.length + ",玩家数量" + playercount);
                    if (ptlist.length) {
                        let bound;
                        if (
                            ptlist.length > playercount &&
                            (limit.justNPC || ptlist[ptlist.length - 1].value > ptlist[0].value)
                        ) {
                            log("选择NPC助战");
                            // NPC comes in the end of list if available
                            bound = ptlist[ptlist.length - 1].bounds;
                        } else {
                            log("选择玩家助战");
                            // higher PT bonus goes ahead
                            bound = ptlist[0].bounds;
                        }
                        click(bound.centerX(), bound.centerY());
                        // wait for start button for 5 seconds
                        findID("nextPageBtn", 5000);
                        break;
                    }
                    // if unexpectedly treated as long touch
                    if (findID("detailTab")) {
                        log("误点击，尝试返回");
                        let element = className("EditText").findOnce();
                        if (element && element.refresh()) {
                            let bound = element.bounds();
                            click(bound.left, bound.top);
                        }
                        find(string3_6_0.support, 5000);
                    }
                    break;
                }

                case STATE_TEAM: {
                    var element = limit.useAuto ? findID("nextPageBtnLoop") : findID("nextPageBtn");
                    if (limit.useAuto) {
                        if (element) {
                            inautobattle = true;
                        } else {
                            element = findID("nextPageBtn");
                            if (element) {
                                inautobattle = false;
                                log("未发现自动续战，改用标准战斗");
                            }
                        }
                    }
                    // exit condition
                    if (findID("android:id/content") && !element) {
                        state = STATE_BATTLE;
                        log("进入战斗");
                        break;
                    }
                    // click start
                    if (element) {
                        let bound = element.bounds();
                        click(bound.centerX(), bound.centerY());
                        waitElement(element, 500);
                    }
                    break;
                }

                case STATE_BATTLE: {
                    // exit condition
                    if (findID("ResultWrap")) {
                        state = STATE_REWARD_CHARACTER;
                        log("进入角色结算");
                        break;
                    }
                    break;
                }

                case STATE_REWARD_CHARACTER: {
                    // exit condition
                    if (findID("hasTotalRiche")) {
                        state = STATE_REWARD_MATERIAL;
                        log("进入掉落结算");
                        break;
                    }
                    let element = findID("ResultWrap");
                    if (element) {
                        if (element.bounds().height() > 0) charabound = element.bounds();
                        let targetX = element.bounds().right;
                        let targetY = element.bounds().bottom;
                        // click if upgrade
                        element = find("OK");
                        if (element) {
                            log("点击玩家升级确认");
                            let bound = element.bounds();
                            targetX = bound.centerX();
                            targetY = bound.centerY();
                        }
                        click(targetX, targetY);
                    }
                    sleep(500);
                    break;
                }

                case STATE_REWARD_MATERIAL: {
                    // exit condition
                    let element = findID("hasTotalRiche");
                    if (findID("android:id/content") && !element) {
                        state = STATE_REWARD_POST;
                        log("结算完成");
                        break;
                    }
                    // try click rebattle
                    element = findID("questRetryBtn");
                    if (element) {
                        log("点击再战按钮");
                        let bound = element.bounds();
                        click(bound.centerX(), bound.centerY());
                    } else if (charabound) {
                        log("点击再战区域");
                        click(charabound.right, charabound.bottom);
                    }
                    sleep(500);
                    break;
                }

                case STATE_REWARD_POST: {
                    // wait 5 seconds for transition
                    match(/\d*\/\d*/, 5000);
                    // exit condition
                    if (findID("nextPageBtn")) {
                        state = STATE_SUPPORT;
                        log("进入助战选择");
                        break;
                    } else if (match(/\d*\/\d*/)) {
                        state = STATE_MENU;
                        log("进入关卡选择");
                        break;
                    } else if (inautobattle) {
                        state = STATE_BATTLE;
                        break;
                    }
                    // try to skip
                    let element = className("EditText").findOnce();
                    if (element && element.refresh() && !id("menu").findOnce()) {
                        log("尝试跳过剧情");
                        let bound = element.bounds();
                        click(bound.right - 50, bound.top + 50);
                    }
                    break;
                }
            }
        }
    }

    /* ~~~~~~~~ 来自3.6.0版(以及点SKIP跳过剧情bug修正)的备用周回脚本 结束 ~~~~~~~~ */

    function recoverLastWork() {
        //如果上次脚本在运行中崩溃了,
        //就在这里恢复limit里的设置参数（里面的last_saved_vars包含一些不在limit里但仍然需要保存的变量）,
        //然后恢复上次执行的工作

        if (!limit.autoRecover) {
            floatUI.storage.remove("last_limit_json");
            log("已停用游戏崩溃带崩脚本的临时解决方案，故不进行恢复，并在存储中删除恢复参数");
            return;
        }

        let lastScriptTaskItem = {name: "未成功恢复上次执行的脚本", fn: function () {}};

        let last_limit_json = floatUI.storage.get("last_limit_json", "null");
        let last_limit = null;
        try {
            last_limit = JSON.parse(last_limit_json);
        } catch (e) {
            logException(e);
            last_limit = null;
        }
        if (last_limit == null) {
            log("没有上次执行的脚本需要恢复");
            return;
        }
        if (typeof last_limit.lastScriptTaskItemName !== "string") {
            log("记录中的脚本名字不是字符串，故未能恢复上次执行的脚本");
            return;
        }
        let recoveredItem = floatUI.scripts.find((item) => item.name === last_limit.lastScriptTaskItemName);
        if (recoveredItem == null) {
            log("未找到名字符合的脚本，故未能恢复上次执行的脚本");
            return;
        }
        lastScriptTaskItem = recoveredItem;
        log("准备恢复执行脚本: ["+lastScriptTaskItem.name+"]");

        //准备开始恢复上次执行的脚本
        //特权和刘海屏参数要重新检测，故删去
        delete last_limit.privilege;
        delete last_limit.cutoutParams;
        //下次要恢复的脚本名字交由被恢复的脚本任务函数来决定，故删去
        delete last_limit.lastScriptTaskItemName;
        //只覆盖last_limit里（上面删去一部分后还剩下的）有的键值，并更新UI
        for (let key in last_limit) limit[key] = last_limit[key];
        ui.run(function () {
            //这里也会触发UI的onChangeListener，但limit中也可能有UI里没有的键值
            for (let key in limit) {
                if (ui[key]) setUIContent(key, limit[key]);
            }
        });
        //已经恢复limit中的参数，先删除存储中的last_limit_json，
        //然后交给被恢复的脚本任务函数自己重新保存
        floatUI.storage.remove("last_limit_json");

        //执行要恢复的脚本任务函数
        replaceCurrentTask(lastScriptTaskItem);
    }
    //导出这个函数
    floatUI.recoverLastWork = recoverLastWork;

    return {
        default: taskDefault,
        default3_6_0: taskDefault3_6_0,
        mirrors: taskMirrors,
        CVAutoBattle: mirrorsAutoBattleMain,
        simpleAutoBattle: mirrorsSimpleAutoBattleMain,
        reopen: enterLoop,
        dungeonEvent: dungeonEventRunnable,
        recordSteps: recordOperations,
        replaySteps: replayOperations,
        exportSteps: exportOpList,
        importSteps: importOpList,
        clearSteps: clearOpList,
        testSupportSel: testSupportPicking,
        testReLaunch: testReLaunchRunnable,
        captureText: captureTextRunnable,
        clickDiskWorkaround: clickDiskWorkaroundRunnable,
    };
}

//global utility functions
//MIUI上发现有时候转屏了getSize返回的还是没转屏的数据，但getRotation的结果仍然是转过屏的，所以 #89 才改成这样
var initialWindowSize = {initialized: false};
function detectInitialWindowSize() {
    ui.run(function () {
        if (initialWindowSize.initialized) return;

        let initialSize = new Point();
        try {
            let mWm = android.view.IWindowManager.Stub.asInterface(android.os.ServiceManager.checkService(android.content.Context.WINDOW_SERVICE));
            mWm.getInitialDisplaySize(android.view.Display.DEFAULT_DISPLAY, initialSize);
        } catch (e) {
            logException(e);
            toastLog("无法获取屏幕物理分辨率\n请尝试以竖屏模式重启");
            initialSize = new Point(device.width, device.height);
        }

        initialWindowSize = {size: initialSize, rotation: 0, initialized: true};
        log("initialWindowSize", initialWindowSize);
    });
};
function getWindowSize() {
    detectInitialWindowSize();
    let display = context.getSystemService(context.WINDOW_SERVICE).getDefaultDisplay();
    let currentRotation = display.getRotation();
    let relativeRotation = (4 + currentRotation - initialWindowSize.rotation) % 4;

    let x = initialWindowSize.size.x;
    let y = initialWindowSize.size.y;
    if (relativeRotation % 2 == 1) {
        let temp = x;
        x = y;
        y = temp;
    }

    let pt = new Point(x, y);
    return pt;
}

function killBackground(packageName) {
    var am = context.getSystemService(context.ACTIVITY_SERVICE);
    am.killBackgroundProcesses(packageName);
}

function backtoMain() {
    var it = new Intent();
    var name = context.getPackageName();
    if (name == deObStr("org.cwvqlu.cwvqlupro")) {
        it.setClassName(name, deObStr("com.stardust.cwvqlu.execution.ScriptExecuteActivity"));
    } else {
        it.setClassName(name, splashActivityName);
    }
    it.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    app.startActivity(it);
    floatUI.refreshUI();
}

module.exports = floatUI;