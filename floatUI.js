var floatUI = {}

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

//记录当前版本是否测试过助战的文件
var supportPickingTestRecordPath = files.join(engines.myEngine().cwd(), "support_picking_tested");

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
const drugCosts = [1, 1, 5, 1];
var updateDrugLimit = () => { };
var updateDrugConsumingStats = () => { };
var isDrugEnough = () => { };
// 周回数统计
var updateCycleCount = () => { };

// available script list
floatUI.scripts = [
    {
        name: "副本周回（剧情，活动通用）",
        fn: tasks.default,
    },
    {
        name: "镜层周回",
        fn: jingMain,
    },
    {
        name: "副本周回2（备用可选）",
        fn: autoMain,
    },
    {
        name: "活动周回2（备用可选）",
        fn: autoMainver1,
    },
    {
        name: "每小时自动重开，刷剧情1",
        fn: tasks.reopen,
    },
    {
        name: "录制选关动作",
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
        name: "测试助战自动选择",
        fn: tasks.testSupportSel,
    }
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
var menuItems = [];
function lockUI(isLocked) {
    ui.run(() => {
        //隐藏或显示设置界面
        ui["swipe"].setVisibility(isLocked?View.GONE:View.VISIBLE);
        ui["running_stats"].setVisibility(isLocked?View.VISIBLE:View.GONE);
        activity.setSupportActionBar(isLocked?null:ui.toolbar);
        let menu = ui["toolbar"].getMenu();
        menu.close();
        if (isLocked) {
            for (let i=0; i<menu.size(); i++) menuItems.push(menu.getItem(i));
            menu.clear();
        } else {
            menu.clear();
            while (menuItems.length > 0) {
                menu.add(menuItems[0].getTitle())
                    .setIcon(menuItems[0].getIcon())
                    .setShowAsAction(android.view.MenuItem.SHOW_AS_ACTION_WITH_TEXT);
                menuItems.splice(0, 1);
            }
        }

        //更新状态监控文字
        ui["running_stats_params_text"].setText(getParamsText());//实际上嗑药数量设置会不断扣减，这里没有更新显示
        ui["running_stats_status_text"].setText(getStatusText());
    });
}
function getUIContent(key) {
    switch (ui[key].getClass().getSimpleName()) {
        case "JsEditText":
            return ui[key].getText() + "";
        case "Switch":
        case "CheckBox":
            return ui[key].isChecked()?"已启用":"已停用";
        case "JsSpinner":
            return ui[key].getSelectedItemPosition();
        case "RadioGroup": {
            let name = "";
            let id = ui[key].getCheckedRadioButtonId();
            if (id >= 0)
                name = idmap[ui[key].getCheckedRadioButtonId()];
            return name;
        }
    }
}
function getParamsText() {
    if (!ui.isUiThread()) throw new Error("getParamsText not in UI thread");
    let result = "";

    let drugnumarr = [];
    for (let i=1; i<=4; i++) {
        let drugName = ui["drug"+i].text;
        let drugNum = ui["drug"+i+"num"].getText();
        let ischecked = ui["drug"+i].isChecked();
        drugnumarr.push("<font color='#"+(ischecked?"000000'>":"808080'>")+" "+drugName+" "+(ischecked?"已启用":"已停用")+" 个数限制"+drugNum+"</font>");
    }
    result += drugnumarr.join("<br>")+"<br>";

    const globalTaskParams = {
        justNPC: "只使用NPC",
        autoReconnect: "防断线模式",
    };
    const defTaskParams = {
        useAuto: "优先使用官方自动续战",
        apmul: "嗑药至AP上限倍数",
        breakAutoCycleDuration: "每隔多少秒打断官方自动续战",
        forceStopTimeout: "假死检测超时秒数",
        rootForceStop: "优先使用root或adb权限杀进程",
    };
    let bakTaskParams = {
        battleNo: "活动周回关卡选择",
    };
    let extraTaskParams = {};
    switch (currentTaskName) {
        case "副本周回（剧情，活动通用）":
            extraTaskParams = defTaskParams;
            break;
        case "副本周回2（备用可选）":
        case "活动周回2（备用可选）":
            extraTaskParams = bakTaskParams;
            break;
    }
    let taskparamarr = [];
    for (let taskParams of [globalTaskParams, extraTaskParams]) {
        for (let key in taskParams) {
            let name = taskParams[key];
            let content = getUIContent(key);
            let isdisabled = (content=="" || content=="已停用");
            content = content==""?ui[key].hint:content;
            taskparamarr.push("<font color='#"+(!isdisabled?"000000'>":"808080'>")+" "+name+" "+content+"</font>");
        }
    }
    result += taskparamarr.join("<br>")+"<br>";

    return android.text.Html.fromHtml(result);
}
function getStatusText() {
    if (!ui.isUiThread()) throw new Error("getStatusText not in UI thread");
    let result = "";

    switch (currentTaskName) {
        case "副本周回（剧情，活动通用）":
        case "镜层周回":
            break;
        default:
            //其他脚本暂不支持统计数字
            return android.text.Html.fromHtml(result);;
    }

    result += "<font color='#000000'>";

    result += "已运行周回数(可能不准确): "+currentTaskCycles;
    result += "<br>"
    result += "已磕药数: ";
    const drugnames = {
        drug1: "绿药",
        drug2: "红药",
        drug3: "魔法石",
        drug4: "蓝药",
    };
    let consumedarr = [];
    for (let key in drugnames) {
        let consumed = currentTaskDrugConsumed[key];
        consumed = consumed==null ? 0 : consumed;
        consumedarr.push(drugnames[key]+":"+consumed+"个");
    }
    result += consumedarr.join("  ");

    result += "</font>";

    return android.text.Html.fromHtml(result);
}

//监视当前任务的线程
var monitoredTask = null;

var syncedReplaceCurrentTask = sync(function(taskItem, callback) {
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
        log("关闭所有无主对话框...");
        try {
            openedDialogsLock.lock();//先加锁，dismiss会等待解锁后再开始删
            for (let key in openedDialogs) {
                if (key != "openedDialogCount") {
                    openedDialogs[key].node.dialog.dismiss();
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
    });
    monitoredTask.waitFor();
});
//syncedReplaceCurrentTask函数也需要新开一个线程来执行，
//如果在UI线程直接调用，第二次调用就会卡在monitoredTask.join()这里
function replaceCurrentTask(taskItem, callback) {
    //确保前一个脚本停下后会新开一个线程执行callback
    threads.start(function () {syncedReplaceCurrentTask(taskItem, callback);}).waitFor();
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
        toastLog("执行 " + floatUI.scripts[limit.default].name + " 脚本");
        replaceCurrentTask(floatUI.scripts[limit.default]);
    }

    function taskWrap() {
        layoutTaskPopup();
        task_popup.container.setVisibility(View.VISIBLE);
        task_popup.setTouchable(true);
    }

    function cancelWrap() {
        toastLog("停止脚本");
        replaceCurrentTask({name:"未运行任何脚本", fn: function () {}});
    }

    // get to main activity
    function settingsScrollToTop(isPaused) {
        //scrollview内容有变动时滚动回顶端
        ui.run(function() {
            //尝试过OnGlobalLayoutListener，但仍然没解决问题；
            //可能是这个事件被触发过很多次，然后就不知道应该在第几次触发时注销Listener
            ui["content"].postDelayed(function () {
                ui["content"].smoothScrollTo(0, 0);
            }, 600);
            if (isPaused) {
                ui["task_paused_vertical"].setVisibility(View.VISIBLE);
            }
            ui["content"].smoothScrollTo(0, 0);//单靠这一句会出现滚动没到最顶端的问题
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
                    ui.run(function() {ui["task_paused_vertical"].setVisibility(View.GONE);});
                    lockUI(true);
                    return;
                    break;
                case TASK_STOPPED:
                    log("脚本已停止运行");
                    ui.run(function() {ui["task_paused_vertical"].setVisibility(View.GONE);});
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
    function settingsWrap() {sync(function () {
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

    var task_popup = floaty.rawWindow(
        <frame id="container" w="*" h="*">
            <vertical w="*" h="*" bg="#f8f8f8" margin="0 15 15 0">
                <vertical bg="#4fb3ff">
                    <text text="选择需要执行的脚本" padding="4 2" textColor="#ffffff" />
                </vertical>
                <list id="list">
                    <text
                        id="name"
                        text="{{name}}"
                        h="45"
                        gravity="center"
                        margin="4 1"
                        w="*"
                        bg="#ffffff"
                    />
                </list>
            </vertical>
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
        task_popup.setSize(sz.x / 2, sz.y / 2);
        task_popup.setPosition(sz.x / 4, sz.y / 4);
    }

    task_popup.container.setVisibility(View.INVISIBLE);
    ui.post(() => {
        task_popup.setTouchable(false);
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
    ui.post(() => {
        submenu.setTouchable(false);
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
        var isleft = menu.getX() <= 0;

        if (menu.getX() <= 0)
            submenu.setPosition(
                0,
                parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2)
            );
        else {
            let sz = getWindowSize();
            submenu.setPosition(
                sz.x - submenu.getWidth(),
                parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2)
            );
        }

        for (var i = 0; i < menu_list.length; i++) {
            var params = submenu["entry" + i].getLayoutParams();
            var horizontal_margin = parseInt(
                size_base * (space_factor + 0.5) * Math.sin(angle_base * (2 * i + 1))
            );
            var vertical_margin = parseInt(
                size_base * (space_factor + 0.5) * (1 - Math.cos(angle_base * (2 * i + 1)))
            );
            if (isleft) {
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
                    (isleft ? -1 : 1) *
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
        <frame id="logo" w="44" h="44" alpha="0.4">
            <img w="44" h="44" src="#ffffff" circle="true" />
            <img
                id="img_logo"
                w="32"
                h="32"
                src="https://cdn.jsdelivr.net/gh/icegreentee/cdn/img/other/qb.png"
                layout_gravity="center"
            />
        </frame>
    );

    ui.post(() => {
        menu.setPosition(0, parseInt(getWindowSize().y / 4));
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
                    let animator = ValueAnimator.ofInt(
                        current,
                        current < sz.x / 2 ? 0 : sz.x - menu.getWidth()
                    );
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

    var receiver = new BroadcastReceiver({
        onReceive: function (ctx, it) {
            if (menu && menu.logo) {
                var sz = getWindowSize();
                var x = menu.getX();
                if (x <= 0) {
                    menu.setPosition(0, calcMenuY());
                    submenu.setPosition(
                        0,
                        parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2)
                    );
                } else {
                    menu.setPosition(sz.x - menu.getWidth(), calcMenuY());
                    submenu.setPosition(
                        sz.x - submenu.getWidth(),
                        parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2)
                    );
                }
            } else {
                context.unregisterReceiver(receiver);
            }
        },
    });

    context.registerReceiver(receiver, new IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED));

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
        overlay.setTouchable(false);
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
        if (logstring !== false) log("直接使用root权限"+logstring+" 完成");
        return $shell(shellcmd, true);
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
        if (logstring !== false) log("不使用特权"+logstring+" 完成");
        return $shell(shellcmd);
    }

    //检查并申请root或adb权限
    getEUID = function (procStatusContent) {
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
    requestShellPrivilege = function () {
        if (limit.privilege) {
            log("已经获取到root或adb权限了");
            return limit.privilege;
        }

        let rootMarkerPath = files.join(engines.myEngine().cwd(), "hasRoot");

        let shellcmd = "cat /proc/self/status";
        let result = null;
        try {
            result = shizukuShell(shellcmd);
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
        }

        if (limit.privilege != null) return;

        if (!files.isFile(rootMarkerPath)) {
            toastLog("Shizuku没有安装/没有启动/没有授权\n尝试直接获取root权限...");
            sleep(2500);
            toastLog("请务必选择“永久”授权，而不是一次性授权！");
        } else {
            log("Shizuku没有安装/没有启动/没有授权\n之前成功直接获取过root权限,再次检测...");
        }
        result = rootShell(shellcmd);
        if (result.code == 0) euid = getEUID(result.result);
        if (euid == 0) {
            log("直接获取root权限成功");
            limit.privilege = {shizuku: null};
            files.create(rootMarkerPath);
        } else {
            toastLog("直接获取root权限失败！");
            sleep(2500);
            limit.privilege = null;
            files.remove(rootMarkerPath);
            if (device.sdkInt >= 23) {
                toastLog("请下载安装Shizuku,并按照说明启动它\n然后在Shizuku中给本应用授权");
                $app.openUrl("https://shizuku.rikka.app/zh-hans/download.html");
            } else {
                toastLog("Android版本低于6，Shizuku不能使用最新版\n请安装并启动Shizuku 3.6.1，并给本应用授权");
                $app.openUrl("https://github.com/RikkaApps/Shizuku/releases/tag/v3.6.1");
            }
        }

        return limit.privilege;
    }

    if (device.sdkInt < 24) {
        if (requestShellPrivilegeThread == null || !requestShellPrivilegeThread.isAlive()) {
            requestShellPrivilegeThread = threads.start(requestShellPrivilege);
        }
    }

    //嗑药后，更新设置中的嗑药个数限制
    updateDrugLimit = function (index) {
        if (index < 0 || index > 3) throw new Error("index out of range");
        let drugnum = parseInt(limit["drug"+(index+1)+"num"]);
        //parseInt("") == NaN，NaN视为无限大处理（所以不需要更新数值）
        if (!isNaN(drugnum)) {
            if (drugnum >= drugCosts[index]) {
                drugnum -= drugCosts[index];
                limit["drug"+(index+1)+"num"] = ""+drugnum;
                if (drugnum < drugCosts[index]) {
                    limit["drug"+(index+1)] = false;
                }
                ui.run(() => {
                    //注意,这里会受到main.js里注册的listener影响
                    ui["drug"+(index+1)+"num"].setText(limit["drug"+(index+1)+"num"]);
                    let drugcheckbox = ui["drug"+(index+1)];
                    let newvalue = limit["drug"+(index+1)];
                    if (drugcheckbox.isChecked() != newvalue) drugcheckbox.setChecked(newvalue);
                });
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
        if (index < 0 || index > 3) throw new Error("index out of range");
        if (currentTaskDrugConsumed["drug"+(index+1)] == null) {
            currentTaskDrugConsumed["drug"+(index+1)] = 0;
        }
        currentTaskDrugConsumed["drug"+(index+1)] += drugCosts[index];
        log("drug"+(index+1)+"已经磕了"+currentTaskDrugConsumed["drug"+(index+1)]+"个");
        ui.run(function () {
            //实际上嗑药数量设置会不断扣减，这里没有更新显示
            ui["running_stats_status_text"].setText(getStatusText());
        });
    }

    isDrugEnough = function (index, count) {
        if (index < 0 || index > 3) throw new Error("index out of range");

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

        //如果传入了undefined、""等等，parseInt将会返回NaN，然后NaN与数字比大小的结果将会是是false
        if (limitnum < drugCosts[index]) return false;

        //BP蓝药数量暂时还不能检测，当作数量足够
        if (index == 3) {
            return true;
        } else if (remainingnum < drugCosts[index]) return false;

        return true;
    }

    updateCycleCount = function () {
        currentTaskCycles++;
        log("周回数增加到", currentTaskCycles);
        ui.run(function () {
            ui["running_stats_status_text"].setText(getStatusText());
        });
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
    helpx: '',
    helpy: '',
    battleNo: 'cb3',
    drug1: false,
    drug2: false,
    drug3: false,
    autoReconnect: false,
    justNPC: false,
    drug4: false,
    drug1num: '0',
    drug2num: '0',
    drug3num: '0',
    drug4num: '0',
    default: 0,
    useAuto: true,
    breakAutoCycleDuration: "",
    forceStopTimeout: "",
    apmul: "",
    timeout: "5000",
    rootScreencap: false,
    rootForceStop: false,
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
    ap50: {
        x: 400,
        y: 900,
        pos: "center"
    },
    apfull: {
        x: 900,
        y: 900,
        pos: "center"
    },
    apjin: {
        x: 1500,
        y: 900,
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
    reconection: {
        x: 700,
        y: 750,
        pos: "center"
    },
    yesfocus: {
        x: 1220,
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
    }
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
                screenutilClick(clickSets.ap50)
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
                screenutilClick(clickSets.apfull)
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
                screenutilClick(clickSets.apjin)
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

floatUI.adjust = function (key, value) {
    if (value !== undefined) {
        limit[key] = value
        log("更新参数：", key, value)

        //如果需要就弹窗申请root或adb权限
        let isPrivNeeded = false;
        if (key == "rootForceStop" && value) isPrivNeeded = true;
        if (key == "rootScreencap" && value) isPrivNeeded = true;
        if (!limit.privilege && isPrivNeeded) {
            if (requestShellPrivilegeThread == null || !requestShellPrivilegeThread.isAlive()) {
                requestShellPrivilegeThread = threads.start(requestShellPrivilege);
            }
        }
    }
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
                shellcmd = "input tap "+x1+" "+y1;
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
    function match(reg, wait) {
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
            result = textMatches(reg).findOnce();
            if (result && result.refresh()) break;
            result = descMatches(reg).findOnce();
            if (result && result.refresh()) break;
            sleep(100);
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
    function find(txt, wait) {
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
            result = text(txt).findOnce();
            if (result && result.refresh()) break;
            result = desc(txt).findOnce();
            if (result && result.refresh()) break;
            sleep(100);
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

    function findID(name, wait) {
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
            result = id(name).findOnce();
            if (result && result.refresh()) break;
            sleep(100);
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

    function waitAny(fnlist, wait) {
        var startTime = new Date().getTime();
        var result = null;
        var it = 0;
        var current = 0;
        do {
            it++;
            if (current >= fnlist.length) current = 0;
            result = fnlist[current]();
            if (result && result.refresh()) break;
            current++;
            sleep(50);
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

        let element = findID("popupInfoDetailTitle", wait);

        if (element == null) return null;
        result.element = element;

        let element_text = getContent(element);

        if (element_text != null && element_text != "") {
            //MuMu模拟器上popupInfoDetailTitle自身就有文字
            let title = getContent(element);
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

        if (title_to_find != null && result.title != title_to_find) return null;

        let half_height = parseInt(element.bounds().height() / 2);
        if (result.title != null && element.bounds().width > result.title.length * (half_height * 2)) {
            let close_x = element.bounds().right + (half_height * 2);
            if (close_x <= default_x) result.close.x = close_x;
        }
        result.close.y = element.bounds().top - half_height;
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

    function getCostAP() {
        let elements = findAll(string.cost_ap);
        for (let element of elements) {
            if (element.indexInParent() < element.parent().childCount() - 1) {
                var next = element.parent().child(element.indexInParent() + 1);
                if (checkNumber(getContent(next))) {
                    return Number(getContent(next));
                }
            }
        }
    }

    const knownFirstPtPoint = {
        x: 1808,
        y: 325,
        pos: "top"
    }
    const ptDistanceY = 243.75;

    function pickSupportWithMostPt(isTestMode) {
        var hasError = false;
        //Lv/ATK/DEF/HP [Rank] 玩家名 [最终登录] Pt
        //Lv/ATK/DEF/HP 玩家名 [Rank] [最终登录] Pt
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
            +"\n  类似Pt的控件个数:            "+PtLikeIndices.length);

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
                PlayerLvIndices.push(index);
                AllLvIndices.push(index);
                return
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

            //倒过来从后往前搜Pt控件，防止碰到类似Pt的恶搞玩家名
            let ptIndex = PtLikeIndices.reverse().find((val) => val > index && val < nextIndex);
            //恢复原状
            PtLikeIndices.reverse();

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
            if (point.y >= getWindowSize().y - 1) {
                toastLog("推算出的第一个互关好友坐标已经超出屏幕范围");
                //在click里会限制到屏幕范围之内
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
            "ap_refill_title",
            "ap_refill_button",
            "ap_refill_popup",
            "ap_refill_confirm",
            "out_of_ap",
            "team_name_change",
            "start",
            "follow",
            "follow_append",
            "battle_confirm",
            "cost_ap",
            "regex_drug",
            "regex_lastlogin",
            "regex_bonus",
            "regex_autobattle",
            "regex_until",
            "package_name",
            "connection_lost",
            "auth_error",
            "generic_error",
        ],
        zh_Hans: [
            "请选择支援角色",
            "AP回复",
            "回复",
            "回复确认",
            "回复",
            "AP不足",
            "队伍名称变更",
            "开始",
            "关注",
            "关注追加",
            "确定",
            "消耗AP",
            /^\d+个$/,
            /^最终登录.+/,
            /＋\d+个$/,
            /[\s\S]*续战/,
            /.+截止$/,
            "com.bilibili.madoka.bilibili",
            "连线超时",
            "认证错误",//被踢下线
            "错误",
        ],
        zh_Hant: [
            "請選擇支援角色",
            "AP回復",
            "回復",
            "回復確認",
            "進行回復",
            "AP不足",
            "變更隊伍名稱",
            "開始",
            "關注",
            "追加關注",
            "決定",
            "消費AP",
            /^\d+個$/,
            /^最終登入.+/,
            /＋\d+個$/,
            /[\s\S]*周回/,
            /.+為止$/,
            "com.komoe.madokagp",
            "連線超時",
            "認證錯誤",//被踢下线
            "錯誤",
        ],
        ja: [
            "サポートキャラを選んでください",
            "AP回復",
            "回復",
            "回復確認",
            "回復する",
            "AP不足",
            "チーム名変更",
            "開始",
            "フォロー",
            "フォロー追加",
            "決定",
            "消費AP",
            /^\d+個$/,
            /^最終ログイン.+/,
            /＋\d+個$/,
            /[\s\S]*周回/,
            /.+まで$/,
            "com.aniplex.magireco",
            "通信エラー",
            "認証エラー",//这个是脑补的。实际上日服貌似只能引继，没有多端登录，所以也就没有被“顶号”、被踢下线……
            "エラー",
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

            openedDialogsNode.dialogResult = threads.disposable();

            let dialogParams = {title: title, positive: "确定"};
            switch (dialogType) {
                case "alert":
                    dialogParams["content"] = content;
                    break;
                case "select":
                    if (callback2 != null) dialogParams["negative"] = "取消";
                    dialogParams["items"] = content;
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

            if (dialogType != "rawInput" && dialogType != "rawInputWithContent") {
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
        } return openedDialogsNode.dialogResult.blockedGet(); },
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

        do {
            let found_popup = null;
            for (let error_type of ["connection_lost", "auth_error", "generic_error"]) {
                try {
                    found_popup = findPopupInfoDetailTitle(string[error_type]);
                } catch (e) {
                    logException(e);
                    found_popup = null;
                }
                if (found_popup != null) break;
            }
            if (found_popup) {
                log("游戏已经断线/登出/出错,并强制回首页");
                return "logged_out";
            }
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));

        return false;
    }

    function getFragmentViewBounds() {
        if (string == null || string.package_name == null || string.package_name == "") {
            try {
                throw new Error("getFragmentViewBounds: null/empty string.package_name");
            } catch (e) {
                logException(e);
            }
            let sz = getWindowSize();
            return new android.graphics.Rect(0, 0, sz.x, sz.y);
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
            return new android.graphics.Rect(0, 0, sz.x, sz.y);
        }
        return bounds;
    }

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
        if (!auto.service) {
            toastLog("未开启无障碍服务");
            selector().depth(0).findOnce();//弹出申请开启无障碍服务的弹窗
        }

        if ($settings.isEnabled("stable_mode")) {
            toastLog("警告: 发现AutoJS的无障碍服务\"稳定模式\"被开启!\n\"稳定模式\"会干扰控件信息抓取!\n尝试关闭...");
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
        while (true) {
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
            var apinfo = getAP(parseInt(limit.timeout));
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
            }

            log("继续嗑药");

            //确保AP药选择窗口已经打开
            let ap_refill_title_attempt_max = 1500;
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
                    log("长时间等待后，AP药选择窗口仍然没有出现，退出");
                    stopThread();
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
                        var bound = buttons[i].bounds();
                        do {
                            log("点击使用第"+(i+1)+"种回复药");
                            click(bound.centerX(), bound.centerY());
                            // wait for confirmation popup
                            var ap_refill_confirm_popup = findPopupInfoDetailTitle(string.ap_refill_popup, 2000);
                        } while (ap_refill_confirm_popup == null);

                        bound = find(string.ap_refill_confirm, true).bounds();
                        while (ap_refill_confirm_popup.element.refresh()) {
                            log("找到确认回复窗口，点击确认回复");
                            click(bound.centerX(), bound.centerY());
                            waitElement(ap_refill_confirm_popup.element, 5000);
                        }
                        log("确认回复窗口已消失");
                        result = "drug_used";

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

    function clickReconnect() {
        log("点击断线重连按钮所在区域");
        click(convertCoords(clickSets.reconection));
    }

    function selectBattle() { }

    function enterLoop(){
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
                    } else if(((Date.now()>last+1000*60*60) && findID("charaWrap"))||(Date.now()>last+1000*60*65)){
                        log("尝试关闭游戏进程");
                        backtoMain();
                        sleep(5000)
                        killBackground(pkgName);
                        sleep(10000)
                    } else if (limit.autoReconnect && !findID("charaWrap")) {
                        clickReconnect();
                        //slow down
                        findID("charaWrap",2000);
                    }
                    break;
                }
            }
            sleep(1000);
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
            log("使用am force-stop命令...");
            while (true) {
                privShell("am force-stop "+name);
                sleep(1000);
                if (isGameDead(2000)) break;
                log("游戏仍在运行,再次尝试强行停止...");
            }
        } else {
            toastLog("为了有权限杀死进程,需要先把游戏切到后台...");
            while (true) {
                backtoMain();
                sleep(2000);
                if (detectGameLang() == null) break;
                log("游戏仍在前台...");
            };
            log("再等待2秒...");
            sleep(2000);
            killBackground(name);
            log("已调用杀死后台进程，等待5秒...")
            sleep(5000);
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

        toastLog("重新登录...");
        while (true) {
            if (isGameDead(1000) == "crashed") {
                log("检测到游戏再次闪退,无法继续登录");
                return false;
            }
            var found_popup = findPopupInfoDetailTitle(null, 1000);
            if (found_popup != null) {
                log("发现弹窗 标题: \""+found_popup.title+"\"");
                let expected_titles = [];
                for (let error_type of ["connection_lost", "auth_error", "generic_error"]) {
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

            for (let resID of ["charaWrap", "hasTotalRiche"]) {
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

            if (new Date().getTime() - startTime > 10 * 60 * 1000) {
                toastLog("超过10分钟没有登录成功");
                return false;//调用者会杀进程
            }

            //“恢复战斗”按钮和断线重连的“否”重合，很蛋疼，但是没有控件可以检测，没办法
            //不过恢复战斗又掉线的几率并不高，而且即便又断线了，点“否”后游戏会重新登录，然后还是可以再点一次“恢复战斗”
            log("点击恢复战斗按钮区域...");
            click(convertCoords(clickSets.recover_battle));
            log("点击恢复战斗按钮区域完成,等待1秒...");
            sleep(1000);
        }
        return false;
    }

    function getScreenParams() {
        if (screen != null && gameoffset != null)
            return JSON.stringify({screen: screen, gameoffset: gameoffset});
    }

    function requestPrivilegeIfNeeded() {
        if (limit.privilege) return true;

        if (limit.rootForceStop || limit.firstRequestPrivilege) {
            limit.firstRequestPrivilege = false;
            if (dialogs.confirm("提示", "如果没有root或adb权限,\n部分模拟器等环境下可能无法杀进程强关游戏!\n要使用root或adb权限么?"))
            {
                limit.firstRequestPrivilege = true;//如果这次没申请到权限，下次还会提醒
                ui.run(() => {
                    ui["rootForceStop"].setChecked(true);
                });
                if (requestShellPrivilegeThread != null && requestShellPrivilegeThread.isAlive()) {
                    toastLog("已经在尝试申请root或adb权限了\n请稍后重试");
                } else {
                    requestShellPrivilegeThread = threads.start(requestShellPrivilege);
                }
                return false;//等到权限获取完再重试
            } else {
                limit.firstRequestPrivilege = false;//下次不会提醒了
                ui.run(() => {
                    ui["rootForceStop"].setChecked(false);
                });
            }
        }
        return true;//可能没有特权，但用户选择不获取特权
    }

    //上次录制的关卡选择动作列表
    var lastOpList = null;
    //默认动作录制数据保存位置
    var savedLastOpListPath = files.join(engines.myEngine().cwd(), "lastRecordedSteps.txt");

    //从文件读取上次录制的数据
    function loadOpList(justFileContent) {
        if (!files.isFile(savedLastOpListPath)) {
            toastLog("未找到动作录制数据文件");
            return null;
        }

        let file_content = files.read(savedLastOpListPath);
        if (justFileContent) return file_content;

        let loadedOpList = null;
        try {
            loadedOpList = JSON.parse(file_content);
        } catch (e) {
            logException(e);
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

    function chooseAction(step) {
        var result = null;
        let options = ["点击", "滑动", "等待", "检测文字是否出现", "结束", "重录上一步", "放弃录制"];
        let selected = dialogs.select("请选择下一步(第"+(step+1)+"步)要录制什么动作", options);
        let actions = ["click", "swipe", "sleep", "checkText", "exit", "undo", null];
        result = actions[selected];
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
            isGeneric: false,
            screenParams: currentScreenParams,
            defaultSleepTime: 1500,
            steps: []
        }
        toastLog("请务必先回到首页再开始录制！");
        sleep(2000);
        let new_sleep_time = -1;
        do {
            new_sleep_time = dialogs.rawInput("每一步操作之间的默认等待时长设为多少毫秒？（除了强制要求的500毫秒安全检查之外）", "1500");
            new_sleep_time = parseInt(new_sleep_time);
            if (isNaN(new_sleep_time) || new_sleep_time <= 0) {
                toastLog("请输入一个正整数");
            }
        } while (new_sleep_time <= 0);
        result.defaultSleepTime = new_sleep_time;
        toastLog("每一步操作之间将会等待"+result.defaultSleepTime+"毫秒");

        let endRecording = false;
        for (let step=0; !endRecording; step++) {
            log("录制第"+(step+1)+"步操作...");
            let op = {};
            op.action = chooseAction(step);
            switch (op.action) {
                case "click":
                    log("等待录制点击动作...");
                    op.click = {};
                    op.click.point = capture("录制第"+(step+1)+"步操作\n请点击要记录下来的点击位置").pos_up;
                    if (op.click.point == null) {
                        toastLog("录制点击动作出错");
                        stopThread();
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
                    } while (sleep_ms <= 0);
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
                        }
                    }
                    op.checkText.text = all_text[selected];
                    toastLog("录制第"+(step+1)+"步操作\n要检测的文字是\""+op.checkText.text+"\"");

                    dialog_options = ["横纵坐标都检测", "只检测横坐标X", "只检测纵坐标Y", "横纵坐标都不检测"];
                    dialog_selected = dialogs.select("录制第"+(step+1)+"步操作\n是否要检测文字\""+op.checkText.text+"\"在屏幕出现的位置和现在是否一致?", dialog_options);
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
                        dialog_options = ["什么也不做,继续执行", "报告成功并结束", "报告失败并结束", "先强关游戏再报告成功并结束", "先强关游戏再报告失败并结束"];
                        dialog_selected = dialogs.select("录制第"+(step+1)+"步操作\n"+(found_or_not_found=="notFound"?"未":"")+"检测到文字\""+op.checkText.text+"\"时要做什么?", dialog_options);
                        switch (dialog_selected) {
                            case 0:
                                op.checkText[found_or_not_found].nextAction = "ignore";
                                deadEnd = false;
                                break;
                            case 3:
                                op.checkText[found_or_not_found].kill = true;//不break
                            case 1:
                                op.checkText[found_or_not_found].nextAction = "success";
                                break;
                            case 4:
                                op.checkText[found_or_not_found].kill = true;//不break
                            case 2:
                                op.checkText[found_or_not_found].nextAction = "fail";
                                break;
                            default:
                                toastLog("询问检测文字后要做什么时出错");
                                stopThread();
                        }
                        toastLog("录制第"+(step+1)+"步操作\n"+(found_or_not_found=="notFound"?"未":"")+"检测到文字时要\n"+dialog_options[dialog_selected]);
                    }
                    result.steps.push(op);
                    toastLog("已记录检测文字\""+op.checkText.text+"\"是否出现的动作");
                    if (deadEnd) {
                        endRecording = true;
                        toastLog("录制结束");
                    }
                    break;
                case "exit":
                    if (result.steps.length > 0 && (result.steps.find((val) => val.action == "checkText") == null)) {
                        dialog_selected = dialogs.confirm(
                            "警告", "您没有录制文字检测动作！\n"
                            +"您确定 不需要 检测文字么？\n"
                            +"重放时未必可以一次成功，点错并不是稀奇事。\n"
                            +"点错后可能发生各种不可预知的后果：从脚本因步调错乱而停滞不动，到误触误删文件，再到变成魔女，全都是有可能的哦！"
                            );
                        if (!dialog_selected) {
                            let last_action = result.steps[result.steps.length-1].action;
                            toastLog("继续录制\n第"+(step+1)+"步");
                            step--;//这一步没录，所以需要-1
                            break;
                        } else {
                            toastLog("好吧，尊重你的选择：\n不检测文字\n祝你好运!");
                            sleep(1000);
                        }
                    }
                    //现在不考虑加入循环跳转什么的
                    op.exit = {};
                    op.exit.kill = false;
                    dialog_options = ["报告成功", "报告失败", "先强关游戏再报告成功", "先强关游戏再报告失败"];
                    dialog_selected = dialogs.select("录制第"+(step+1)+"步操作\n结束时要报告成功还是失败?", dialog_options);
                    switch (dialog_selected) {
                        case 2:
                            op.exit.kill = true;//不break
                        case 0:
                            op.exit.exitStatus = true;
                            break;
                        case 3:
                            op.exit.kill = true;//不break
                        case 1:
                            op.exit.exitStatus = false;
                            break;
                        default:
                            toastLog("询问结束时报告成功还是失败时出错");
                            stopThread();
                    }
                    toastLog("录制第"+(step+1)+"步操作\n结束时要"+dialog_options[dialog_selected]);
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
                        if (last_action == "click" || last_action == "swipe") {
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
                    break;
                case null:
                    result = null;
                    toastLog("放弃录制");
                    stopThread();//lastOpList不会被重新赋值为null
                default:
                    toastLog("录制第"+(step+1)+"步操作\n出错: 未知动作", op.action);
                    stopThread();
            }
            if (op.action != "undo") log("录制第"+result.steps.length+"步动作完成");
        }
        if (result != null) {
            saveOpList(result);//写入到文件
            lastOpList = result;
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
            switch (isGameDead()) {
                case "crashed":
                    log("游戏已经闪退,停止重放");
                    return false;
                    break;
                case "logged_out":
                    log("游戏已经登出,停止重放");
                    return false;
                    break;
                case false:
                    break;//没闪退
                default:
                    log("未知闪退状态,停止重放");
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

            let op = opList.steps[i];
            log("第"+(i+1)+"步", op);
            switch (op.action) {
                case "click":
                    if (opList.isGeneric) {
                        click(convertCoords(op.click.point));
                    } else {
                        click(op.click.point);
                    }
                    break;
                case "swipe":
                    let points = op.swipe.points;
                    if (opList.isGeneric) {
                        points = op.swipe.points.map((point) => convertCoords(point));
                    }
                    swipe(points[0], points[1]);
                    break;
                case "sleep":
                    sleep(op.sleep.sleepTime);
                    break;
                case "checkText":
                    let reallyFound = false;
                    let check_result = null;
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
        if (lastOpList == null) {
            //动作录制数据还没加载，那就直接尝试读取文件内容（不过不保证读出来的内容可以通过检查）
            toastLog("未加载动作录制数据\n尝试从文件读取(但暂不加载使用)");
            let justFileContent = true;
            lastOpListStringified = loadOpList(justFileContent);
            //不对lastOpList重新赋值
        } else {
            try {
                lastOpListStringified = JSON.stringify(lastOpList);
            } catch (e) {
                logException(e);
                toastLog("导出失败");
                return;
            }
        }
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
                    toastLog("导入完成");
                    saveOpList(importedOpList);//写入到文件
                } else {
                    toastLog("导入失败\n动作录制数据无效");
                }
            }
        }
    }

    function clearOpList() {
        dialogs.confirm("清除选关动作录制数据", "确定要清除么？", () => {
            lastOpList = null;
            if (!files.remove(savedLastOpListPath)) {
                toastLog("删除动作录制数据文件失败");
                return;
            }
            toastLog("已清除选关动作数据");
        }, () => {
            toastLog("未清除选关动作数据");
        });
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

    var is_support_picking_tested = false;

    function getCurrentVersion() {
        if (limit.version == "") return getProjectVersion();
        return limit.version;
    }

    function testSupportPicking() {
        initialize();

        if (find(string.support) == null) {
            do {
                toastLog("等待进入助战选择界面...");
            } while (find(string.support, 10000) == null);
        }

        //写入文件，来记录曾经测试过
        is_support_picking_tested = true;
        files.create(supportPickingTestRecordPath);
        let test_record = files.read(supportPickingTestRecordPath);
        let tested_versions = test_record.split('\n');
        if (tested_versions.find((val) => val == getCurrentVersion()) == null) {
            files.append(supportPickingTestRecordPath, "\n"+getCurrentVersion()+"\n"); //会产生空行，但无所谓
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
                    toastLog("10秒后将会自动点击助战...");
                    sleep(8000);
                    toastLog("2秒后将会自动点击助战...");
                    sleep(2000);
                    toast("请勿拖动助战列表!\n自动点击助战...");
                    click(result.point);
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
            for (let error_type of ["connection_lost", "auth_error", "generic_error"]) {
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
        } else if (find(string.support)) {
            state = STATE_SUPPORT;
        } else if (findID("nextPageBtn")) {
            state = STATE_TEAM;
        } else if (findID("charaWrap")) {
            state = STATE_REWARD_CHARACTER;
        } else if (findID("hasTotalRiche")) {
            state = STATE_REWARD_MATERIAL;
        } else if (getAP() == null) {
            sleep(2000);
            toastLog("进入战斗状态\n如果当前不在战斗中，请停止脚本运行");
            sleep(2000);
            state = STATE_BATTLE;
        } else {
            log("没有检测到典型的STATE_MENU状态控件");
            state = STATE_MENU;
        }

        log(StateNames[state]);

        return state;
    }

    function startSupportPickTestingIfNeeded() {
        if (is_support_picking_tested) return;

        if (files.isFile(supportPickingTestRecordPath)) {
            let test_record = files.read(supportPickingTestRecordPath);
            let tested_versions = test_record.split('\n');
            if (tested_versions.find((val) => val == getCurrentVersion()) != null) {
                is_support_picking_tested = true;
            } else {
                is_support_picking_tested = false;
            }
        } else {
            is_support_picking_tested = false;
        }
        if (!is_support_picking_tested) {
            if (dialogs.confirm("测试助战自动选择",
                "安装这个版本以来还没有测试过助战自动选择是否可以正常工作。"
                +"\n要测试吗？"))
            {
                replaceSelfCurrentTask(floatUI.scripts.find((val) => val.name == "测试助战自动选择"));
                //测试完再写入文件，来记录是否曾经测试过
            } else {
                files.create(supportPickingTestRecordPath);
                files.append(supportPickingTestRecordPath, "\n"+getCurrentVersion()+"\n");//会产生空行，但无所谓
            }
        }
    }

    function taskDefault() {
        isCurrentTaskPaused.set(TASK_RUNNING);//其他暂不（需要）支持暂停的脚本不需要加这一句

        initialize();

        if (lastOpList == null) {
            if (files.isFile(savedLastOpListPath)) {
                if (dialogs.confirm("自动选关", "要加载之前保存的选关动作录制数据吗?")) {
                    lastOpList = loadOpList();
                } else {
                    if (dialogs.confirm("自动选关", "要删除保存选关动作录制数据的文件么?")) {
                        if (!files.remove(savedLastOpListPath)) {
                            toastLog("删除动作录制数据文件失败");
                        } else {
                            toastLog("已删除动作录制数据文件");
                        }
                    }
                }
            }
        }

        if (lastOpList == null) {
            toastLog("没有动作录制数据\n不会启用闪退自动重启功能");
        } else {
            if (!requestPrivilegeIfNeeded()) {
                log("用户选择获取特权,但还没获取到,退出录制");
                stopThread();//等到权限获取完再重试
                return;
            }
            toastLog("已加载动作录制数据\n游戏闪退时将自动重启");
        }

        startSupportPickTestingIfNeeded();//如果选择开始测试会不再继续往下运行

        var state = detectInitialState();
        var last_state = -1;

        var battlename = "";
        var charabound = null;
        var battlepos = null;
        var inautobattle = false;
        var battleStartBtnClickTime = 0;
        var stuckStartTime = new Date().getTime();
        /*
        //实验发现，在战斗之外环节掉线会让游戏重新登录回主页，无法直接重连，所以注释掉
        var stuckatreward = false;
        var rewardtime = null;
        */

        //统计周回数，开始前先归零
        currentTaskCycles = 0;

        while (true) {
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

            //然后检测游戏是否闪退或掉线
            if (state != STATE_CRASHED && state != STATE_LOGIN && isGameDead(false)) {
                if (lastOpList != null) {
                    state = STATE_CRASHED;
                    log("进入闪退/登出重启");
                    continue;
                } else {
                    log("没有动作录制数据,不进入闪退/登出重启\n停止运行");
                    stopThread();
                }
            }

            //假死超时自动重开的计时点
            if (state != STATE_CRASHED && state != STATE_LOGIN) {
                if (state != last_state) {
                    stuckStartTime = new Date().getTime();
                } else if (!isNaN(parseInt(limit.forceStopTimeout))) {
                    let state_stuck_timeout = 1000 * parseInt(limit.forceStopTimeout);
                    if (new Date().getTime() > stuckStartTime + state_stuck_timeout) {
                        if (lastOpList != null) {
                            toastLog("卡在状态"+StateNames[state]+"的时间太久,超过设定("+parseInt(limit.forceStopTimeout)+"s)\n杀进程重开...");
                            killGame(limit.package_name);
                            state = STATE_CRASHED;
                        } else {
                            toastLog("卡在状态"+StateNames[state]+"的时间太久,超过设定("+parseInt(limit.forceStopTimeout)+"s)\n等待10秒...");
                            sleep(10000);
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
                    if (lastOpList == null) {
                        toastLog("没有动作录制数据,退出");
                        stopThread();
                        break;
                    }
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
                        if (findID("charaWrap") || findID("hasTotalRiche")) {
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
                    }
                    //动作录制数据里会指定在失败时杀掉进程重启
                    break;
                }
                case STATE_MENU: {
                    waitAny(
                        [
                            () => find(string.support),
                            () => findID("helpBtn"),
                            () => match(/^BATTLE.+/),
                            () => findID("questLinkList"),
                            () => findID("questWrapTitle"),
                            () => findID("nextPageBtn"),
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
                                 "本轮"+(limit.useAuto?"官方周回":"战斗")+"结束后,\n"+
                                 "可能无法自动选关重新开始!");
                        log("进入队伍调整");
                        break;
                    }

                    if (findPopupInfoDetailTitle()) {
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
                    }

                    // if need to click to enter battle
                    let button = find(string.battle_confirm);
                    if (button) {
                        log("点击确认进入battle");
                        let bound = button.bounds();
                        click(bound.centerX(), bound.centerY());
                        // wait for support screen for 5 seconds
                        find(string.support, parseInt(limit.timeout));
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
                    }
                    // click battle if available
                    else if (battlename) {
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
                    // 重放动作录制之前需要先回主页，最简单粗暴的办法就是杀进程重开
                    } else if (lastOpList) {
                        toastLog("已加载动作录制数据,先杀掉游戏再重启重新选关");
                        killGame(string.package_name);
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
                    if (findID("detailTab")) {
                        //之前一轮循环中，选助战时，因为卡顿，点击变成了长按，
                        //然后就误触打开助战角色信息面版，需要关闭。
                        //因为后面refillAP出错时会break，等待“请选择支援角色”不出现也会break，
                        //所以，如果这里不检测助战角色信息面版就会死循环。
                        log("点击变长按，打开了detailTab，尝试返回");
                        click(convertCoords(clickSets.back));
                        find(string.support, parseInt(limit.timeout));
                    }
                    if (findID("questLinkList") || findID("questWrapTitle")) {
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
                    let pt_point = pickSupportWithMostPt();
                    if (pt_point != null) pt_point = pt_point.point;
                    if (pt_point != null) {
                        toast("请勿拖动助战列表!\n自动点击助战...");
                        click(pt_point);
                        // wait for start button for 5 seconds
                        findID("nextPageBtn", parseInt(limit.timeout));
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
                    //如果之前误触了队伍名称变更，先尝试关闭
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
                        battleStartBtnClickTime = new Date().getTime();
                        let bound = element.bounds();
                        click(bound.centerX(), bound.centerY());
                        waitElement(element, 500);
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
                    waitAny(
                        [
                            () => findID("charaWrap"),
                            () => findID("hasTotalRiche")
                        ],
                        2000
                    );
                    if (findID("charaWrap")) {
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
                    let element = findID("charaWrap");
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
                    element = findID("questRetryBtn");
                    if (element) {
                        log("点击再战按钮");
                        let bound = element.bounds();
                        click(bound.centerX(), bound.centerY());
                    } else if (charabound) {
                        //走到这里的可能情况:
                        //(1) AP不够再战一局（常见原因是官方自动续战）
                        //(2) UI控件树残缺，明明有再战按钮却检测不到
                        log("点击再战区域");
                        //    (如果屏幕是宽高比低于16:9的“方块屏”，还会因为再战按钮距离charabound右下角太远而点不到再战按钮，然后就会回到关卡选择)
                        //click(charabound.right, charabound.bottom);
                        click(convertCoords(clickSets.restart));
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
                    } else if (inautobattle) {
                        state = STATE_BATTLE;
                        break;
                    }
                    // try to skip
                    let element = className("EditText").findOnce();
                    if (element && element.refresh()) {
                        log("尝试跳过剧情");
                        let bound = element.bounds();
                        click(bound.right, bound.top);
                    }
                    break;
                }
            }
        }
    }

    return {
        default: taskDefault,
        reopen: enterLoop,
        recordSteps: recordOperations,
        replaySteps: replayOperations,
        exportSteps: exportOpList,
        importSteps: importOpList,
        clearSteps: clearOpList,
        testSupportSel: testSupportPicking,
    };
}

//global utility functions
function getWindowSize() {
    var wm = context.getSystemService(context.WINDOW_SERVICE);
    var pt = new Point();
    wm.getDefaultDisplay().getSize(pt);
    return pt;
}

function killBackground(packageName) {
    var am = context.getSystemService(context.ACTIVITY_SERVICE);
    am.killBackgroundProcesses(packageName);
}

function backtoMain() {
    var it = new Intent();
    var name = context.getPackageName();
    if (name != "org.autojs.autojspro")
        it.setClassName(name, "com.stardust.autojs.inrt.SplashActivity");
    else it.setClassName(name, "com.stardust.autojs.execution.ScriptExecuteActivity");
    it.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    app.startActivity(it);
}

module.exports = floatUI;