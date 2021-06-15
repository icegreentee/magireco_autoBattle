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

var tasks = algo_init();
// touch capture, will be initialized in main
var capture = () => { };
// 停止脚本线程，尤其是防止停止自己的时候仍然继续往下执行少许语句（同上，会在main函数中初始化）
var stopThread = () => { };
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
];

floatUI.main = function () {
    // space between buttons compare to button size
    var space_factor = 1.5;
    // size for icon compare to button size
    var logo_factor = 7.0 / 11;
    // button size in dp
    var button_size = 44;
    // current running thread
    var currentTask = null;

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
        //while循环也会阻塞执行，防止继续运行下去产生误操作
        //为防止 isAlive() 不靠谱（虽然还没有这方面的迹象），停止自己的线程时用 isSelf 短路，直接死循环
        while (isSelf || (thread != null && thread.isAlive())) {
            try {thread.interrupt();} catch (e) {}
            //因为可能在UI线程调用，所以不能sleep
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
            log(e);
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
        if (currentTask && currentTask.isAlive()) {
            toastLog("停止之前的脚本");
            stopThread(currentTask);
        }
        toastLog("执行 " + floatUI.scripts[limit.default].name + " 脚本");
        currentTask = threads.start(floatUI.scripts[limit.default].fn);
    }

    function taskWrap() {
        layoutTaskPopup();
        task_popup.container.setVisibility(View.VISIBLE);
        task_popup.setTouchable(true);
    }

    function cancelWrap() {
        toastLog("停止脚本");
        if (currentTask && currentTask.isAlive()) stopThread(currentTask);
    }

    // get to main activity
    function settingsWrap() {
        backtoMain();
    }

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
            if (currentTask && currentTask.isAlive()) {
                toastLog("停止之前的脚本");
                stopThread(currentTask);
            }
            toastLog("执行 " + item.name + " 脚本");
            currentTask = threads.start(item.fn);
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

    var touch_pos = null;
    var overlay = floaty.rawWindow(
        <frame id="container" w="*" h="*">
            <frame w="*" h="*" bg="#000000" alpha="0.2"></frame>
            <text
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
        if (event.getAction() == event.ACTION_UP) {
            touch_pos = {
                x: parseInt(event.getRawX()),
                y: parseInt(event.getRawY()),
            };
            log("捕获点击坐标", touch_pos.x, touch_pos.y);
            overlay.setTouchable(false);
            overlay.container.setVisibility(View.INVISIBLE);
        }
        return true;
    });

    capture = function () {
        touch_pos = null;
        ui.post(() => {
            var sz = getWindowSize();
            overlay.setSize(sz.x, sz.y);
            overlay.container.setVisibility(View.VISIBLE);
            overlay.setTouchable(true);
        });
        while (overlay.container.getVisibility() == View.INVISIBLE) {
            sleep(200);
        }
        while (overlay.container.getVisibility() == View.VISIBLE) {
            sleep(200);
        }
        return touch_pos;
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
    //脚本启动时检测一次
    adjustCutoutParams();

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
    apmul: "",
    timeout: "5000"
}
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
                let count = parseInt(limit.drug4num);
                if (limit.drug4 && (isNaN(count) || count > 0)) {
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
                    limit.drug4num = '' + (count - 1);
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
    }
}

floatUI.logParams = function () {
    log("\n参数:\n", limit);
}

// compatible action closure
function algo_init() {

    var useShizuku = true;
    var isFirstRootClick = true;

    function clickRoot(x, y) {
        if (isFirstRootClick) {
            toastLog("Android 7 以下设备运行脚本需要root或Shizuku(adb)权限\n正在尝试Shizuku...");
            isFirstRootClick = false;
        }
        //第一次会尝试使用Shizuku，如果失败，则不再尝试Shizuku，直到脚本退出
        if (useShizuku) {
            log("使用Shizuku模拟点击坐标 "+x+","+y);
            $shell.setDefaultOptions({adb: true});
            var result = null;
            try {
                result = $shell("input tap "+x+" "+y, false);
            } catch (e) {
                useShizuku = false;
                toastLog("Shizuku未安装/未启动,或者未授权\n尝试直接使用root权限...");
                log(e);
            }

            //这里useShizuku实际上指示了是否捕获到抛出的异常
            if (!useShizuku || result == null || result.code != 0) {
                useShizuku = false;
                log("使用Shizuku执行模拟点击命令失败,尝试直接使用root权限");
            } else {
                log("模拟点击完成");
                return;//命令成功执行
            }
        }

        //第一次尝试Shizuku失败后也会走到这里
        if (!useShizuku) {
            log("直接使用root权限模拟点击坐标 "+x+","+y);
            $shell.setDefaultOptions({adb: false});
            result = $shell("input tap "+x+" "+y, true);//第二个参数true表示使用root权限
            if (result == null || result.code != 0) {
                toastLog("Android 7 以下设备运行脚本需要root\n没有root权限,退出");
                stopThread();
            } else {
                log("模拟点击完成");
            }
        }
    }

    function click(x, y) {
        if (y == null) {
            var point = x;
            x = point.x;
            y = point.y;
        }
        // limit range
        var sz = getWindowSize();
        if (x >= sz.x) {
            x = sz.x - 1;
        }
        if (y >= sz.y) {
            y = sz.y - 1;
        }
        // system version higher than Android 7.0
        if (device.sdkInt >= 24) {
            // now accessibility gesture APIs are available
            log("使用无障碍服务模拟点击坐标 "+x+","+y);
            press(x, y, 50);
            log("点击完成");
        } else {
            clickRoot(x, y);
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
                log(e);
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
                log(e);
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
                log(e);
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
                log(e);
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
                log(e);
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
            sleep(100);
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
        if (element) {
            return (element.text() === "" || element.text() == null) ? element.desc() : element.text();
        }
    }

    function checkNumber(content) {
        return !isNaN(Number(content)) && !isNaN(parseInt(content));
    }

    //检测AP，缺省wait的情况下只检测一次就退出
    function getAP(wait) {
        var startTime = 0;
        if (wait != null) startTime = new Date().getTime();

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
            } while (wait != null && new Date().getTime() < startTime + wait);
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
            } while (wait != null && new Date().getTime() < startTime + wait);
        }
    }

    function getPTList() {
        let results = [];
        //在收集可能是Pt的控件之前，应该先找到“请选择支援角色”
        //如果找不到，那应该是出现意料之外的情况了，这里也不好应对处理
        let string_support_element = find(string.support, limit.timeout);
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

    const STATE_LOGIN = 0;
    const STATE_HOME = 1;
    const STATE_MENU = 2;
    const STATE_SUPPORT = 3;
    const STATE_TEAM = 4;
    const STATE_BATTLE = 5;
    const STATE_REWARD_CHARACTER = 6;
    const STATE_REWARD_MATERIAL = 7;
    const STATE_REWARD_POST = 8;

    // strings constants
    const strings = {
        name: [
            "support",
            "ap_refill_title",
            "ap_refill_button",
            "ap_refill_popup",
            "ap_refill_confirm",
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
            "regex_until",
            "package_name",
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
            /.+截止$/,
            "com.bilibili.madoka.bilibili",
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
            /.+為止$/,
            "com.komoe.madokagp",
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
            /.+まで$/,
            "com.aniplex.magireco",
        ],
    };

    var string = {};
    var lang = null;

    function detectGameLang() {
        let detectedLang = null;
        for (detectedLang in strings) {
            if (detectedLang == "name") continue;
            if (findPackageName(strings[detectedLang][strings.name.findIndex((e) => e == "package_name")], 1000)) {
                log("区服", detectedLang);
                break;
            }
            detectedLang = null;
        }
        if (detectedLang != null) {
            lang = detectedLang;
            for (let i = 0; i < strings.name.length; i++) {
                string[strings.name[i]] = strings[lang][i];
            }
            return detectedLang;
        }
        return null;
    }

    var screen = {width: 0, height: 0, type: "normal"};
    var gamebounds = null;
    var gameoffset = {x: 0, y: 0, center: {y: 0}, bottom: {y: 0}};

    function detectScreenParams() {
        //开始脚本前可能转过屏之类的，所以参数需要先重置
        screen = {width: 0, height: 0, type: "normal"};
        gamebounds = null;
        gameoffset = {x: 0, y: 0, center: {y: 0}, bottom: {y: 0}};

        screen.width = device.width;
        screen.height = device.height;
        if (screen.height > screen.width) {
            //魔纪只能横屏运行
            let temp = screen.height;
            screen.height = screen.width;
            screen.width = temp;
        }
        if (screen.width * 9 > screen.height * 16) {
            screen.type = "wider";
            scalerate = screen.height / 1080;
            gameoffset.x = parseInt((screen.width - (1920 * scalerate)) / 2);
        } else {
            scalerate = screen.width / 1920;
            if (screen.width * 9 == screen.height * 16) {
                screen.type = "normal";
            } else {
                screen.type = "higher";
                gameoffset.bottom.y = parseInt(screen.height - (1080 * scalerate));
                gameoffset.center.y = parseInt((screen.height - (1080 * scalerate)) / 2);
            }
        }
        log("screen", screen, "gameoffset", gameoffset);

        let element = selector().packageName(string.package_name).className("android.widget.EditText").algorithm("BFS").findOnce();
        log("EditText bounds", element.bounds());
        element = element.parent();
        gamebounds = element.bounds();
        log("gamebounds", gamebounds);

        //刘海屏
        //(1)假设发生画面裁切时，实际显示画面上下（或左右）被裁切的宽度一样（刘海总宽度的一半），
        let isGameoffsetAdjusted = false;
        if (device.sdkInt >= 28) {
            //Android 9或以上有原生的刘海屏API
            //处理转屏
            if (limit.cutoutParams != null && limit.cutoutParams.cutout != null) {
                let initialRotation = limit.cutoutParams.rotation;
                let display = context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay();
                let currentRotation = display.getRotation();
                log("currentRotation", currentRotation, "initialRotation", initialRotation);

                if (currentRotation != null && initialRotation != null
                    && currentRotation >= 0 && currentRotation <= 3
                    && initialRotation >= 0 && initialRotation <= 3)
                {
                    let relativeRotation = (4 + currentRotation - initialRotation) % 4;
                    log("relativeRotation", relativeRotation);

                    let safeInsets = {};;
                    for (let key of ["Left", "Top", "Right", "Bottom"]) {
                        safeInsets[key] = limit.cutoutParams.cutout["getSafeInset"+key]();
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

                    gameoffset.x += (safeInsets.Left - safeInsets.Right) / 2;
                    gameoffset.y += (safeInsets.Top - safeInsets.Bottom) / 2;

                    isGameoffsetAdjusted = true;
                }
            }
        }
        log("isGameoffsetAdjusted", isGameoffsetAdjusted);
        if (!isGameoffsetAdjusted) {
            //Android 8.1或以下没有刘海屏API；或者因为未知原因虽然是Android 9或以上但没有成功获取刘海屏参数
            //(2)假设gamebounds就是实际显示的游戏画面(模拟器测试貌似有时候不对)
            //所以结合(1)考虑，游戏画面中点减去屏幕中点就得到偏移量
            //（因为刘海宽度未知，所以不能直接用游戏左上角当偏移量）
            gameoffset.x += parseInt(gamebounds.centerX() - (screen.width / 2));
            gameoffset.y += parseInt(gamebounds.centerY() - (screen.height / 2));
        }
        log("gameoffset", gameoffset);
    }

    function initialize() {
        if (auto.root == null) {
            toastLog("未开启无障碍服务");
            selector().depth(0).findOnce();//弹出申请开启无障碍服务的弹窗
        }

        //检测区服
        if (detectGameLang() == null) {
            toastLog("未在前台检测到魔法纪录,退出");
            stopThread();
        }

        //检测屏幕参数
        detectScreenParams();
    }

    //绿药或红药，每次消耗1个
    //魔法石，每次碎5钻
    const drugCosts = [1, 1, 5];

    function isDrugEnough(index, count) {
        if (index < 0 || index > 2) throw new Error("index out of range");

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
        if (remainingnum < drugCosts[index]) return false;
        return true;
    }

    //嗑药后，更新设置中的嗑药个数限制
    function updateDrugLimit(index) {
        if (index < 0 || index > 2) throw new Error("index out of range");
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

    function refillAP() {
        log("根据情况,如果需要,就使用AP回复药");

        //检测AP药选择窗口在最开始是不是打开的状态
        var ap_refill_title_appeared = false;
        var ap_refill_title_element = find(string.ap_refill_title, 200);
        if (ap_refill_popup_element != null) ap_refill_title_appeared = true;

        var apCost = getCostAP();

        //循环嗑药到设定的AP上限倍数，并且达到关卡消耗的2倍
        var apMultiplier = parseInt(0+limit.apmul);
        while (true) {
            var apinfo = getAP(limit.timeout);
            if (apinfo == null) {
                log("检测AP失败");
                break;
            }
            log("当前AP:"+apinfo.value+"/"+apinfo.total);

            var apMax = apinfo.total * apMultiplier;
            log("要嗑药到"+apMultiplier+"倍AP上限,即"+apMax+"AP");

            if (apinfo.value >= apMax) {
                log("当前AP已经达到设置的上限倍数");
                if (apCost == null) {
                    log("关卡AP消耗未知,视为30");
                    apCost = 30;
                } else {
                    log("关卡消耗"+apCost+"AP");
                }
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

            var isDrugUsed = false;

            //确保AP药选择窗口已经打开
            let ap_refill_title_attempt_max = 1500;
            for (let attempt=0; attempt<ap_refill_title_attempt_max; attempt++) {
                log("等待AP药选择窗口出现...");
                ap_refill_title_element = find(string.ap_refill_title, false);
                if (ap_refill_title_element != null) {
                    log("AP药选择窗口已经出现");
                    ap_refill_title_appeared = true;
                    break;
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
                            var ap_refill_popup_element = find(string.ap_refill_popup, 2000);
                        } while (ap_refill_popup_element == null);

                        bound = find(string.ap_refill_confirm, true).bounds();
                        while (ap_refill_popup_element.refresh()) {
                            log("找到确认回复窗口，点击确认回复");
                            click(bound.centerX(), bound.centerY());
                            waitElement(ap_refill_popup_element, 5000);
                        }
                        log("确认回复窗口已消失");
                        isDrugUsed = true;

                        //更新嗑药个数限制数值，减去用掉的数量
                        updateDrugLimit(i);

                        break; //防止一次连续磕到三种不同的药
                    } else {
                        log("第"+(i+1)+"种回复药剩余数量不足或已经达到嗑药个数限制");
                    }
                }
            }

            if (!isDrugUsed) {
                if (find(string.out_of_ap)) {
                    log("AP不足且未嗑药,退出");
                    stopThread();
                }
                log("未嗑药");
                break; //可能AP还够完成一局，所以只结束while循环、继续往下执行关闭嗑药窗口，不退出
            }
        }

        //关闭AP药选择窗口
        if (ap_refill_title_element == null || !ap_refill_title_element.refresh()) {
            //AP药选择窗口之前可能被关闭过一次，又重新打开
            //在这种情况下需要重新寻找控件并赋值，否则会出现卡在AP药窗口的问题

            //不过，如果AP药选择窗口在最开始的时候就没出现过，后来也没故意要打开它，
            //现在就认为它自从自始至终就从来没出现过，所以就不需要寻找它并等待它出现

            if (ap_refill_title_appeared) ap_refill_title_element = find(string.ap_refill_title, 2000);
        }
        while (ap_refill_title_element != null && ap_refill_title_element.refresh()) {
            log("关闭AP回复窗口");
            bound = ap_refill_title_element.parent().bounds();
            click(bound.right, bound.top);
            waitElement(ap_refill_title_element, 5000);
        }
        return isDrugUsed;
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
        click(convertCoords({x: 700, y: 730, pos: "center"}));
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
                    let window=findID("android:id/content")
                    if(window){
                        click(window.bounds().centerX(),window.bounds().centerY())
                    }
                    break;
                }
                case STATE_HOME:{
                    if(find("BATTLE 1")){
                        state=STATE_MENU;
                        log("进入关卡选择");
                        break;
                    }
                    if (findID("popupInfoDetailTitle")) {
                        let element = className("EditText").findOnce();
                        if (element && element.refresh()) {
                            log("尝试关闭弹窗");
                            let bound = element.bounds();
                            click(bound.right-8, bound.top+8);
                        }
                    }
                    let element=match(string.regex_until)
                    if(element){
                        click(element.bounds().centerX(),element.bounds().centerY())
                    }
                    break;
                }

                case STATE_MENU:{
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
                        log("误点击，尝试返回");
                        let element = className("EditText").findOnce();
                        if (element && element.refresh()) {
                            let bound = element.bounds();
                            click(bound.left, bound.top);
                        }
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

    function taskDefault() {
        initialize();
        var state = STATE_MENU;
        var battlename = "";
        var charabound = null;
        var battlepos = null;
        var inautobattle = false;
        /*
        //实验发现，在战斗之外环节掉线会让游戏重新登录回主页，无法直接重连，所以注释掉
        var stuckatreward = false;
        var rewardtime = null;
        */
        while (true) {
            switch (state) {
                case STATE_MENU: {
                    waitAny(
                        [
                            () => find(string.support),
                            () => findID("helpBtn"),
                            () => match(/^BATTLE.+/),
                        ],
                        3000
                    );
                    // exit condition
                    if (find(string.support)) {
                        state = STATE_SUPPORT;
                        log("进入助战选择");
                        break;
                    }

                    if (findID("popupInfoDetailTitle")) {
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
                    } else {
                        log("等待捕获关卡坐标");
                        battlepos = capture();
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

                    //根据情况,如果需要就嗑药
                    refillAP();

                    //等待“请选择支援角色”出现
                    if (find(string.support, limit.timeout) == null) break;

                    // save battle name if needed
                    let battle = match(/^BATTLE.+/);
                    if (battle) {
                        battlename = getContent(battle);
                    }
                    // pick support
                    let ptlist = getPTList();
                    let playercount = matchAll(string.regex_lastlogin).length;
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
                        findID("nextPageBtn", parseInt(limit.timeout));
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
                        find(string.support, parseInt(limit.timeout));
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
                    //点击开始或自动续战按钮，在按钮消失后，就会走到这里
                    //还在战斗，或者在战斗结束时弹出断线重连窗口，就会继续在这里循环
                    //直到战斗结束，和服务器成功通信后，进入结算

                    // exit condition
                    //这里会等待2秒，对于防断线模式来说就是限制每2秒点击一次重连按钮的所在位置
                    //另一方面，也可以极大程度上确保防断线模式不会在结算界面误点
                    if (findID("charaWrap", 2000)) {
                        state = STATE_REWARD_CHARACTER;
                        log("进入角色结算");
                        break;
                    }
                    //防断线模式
                    if (limit.autoReconnect) {
                        //无法判断断线重连弹窗是否出现，但战斗中点击一般也是无害的
                        //（不过也有可能因为机器非常非常非常卡，点击变成了长按，导致误操作取消官方自动续战）
                        clickReconnect();
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
                        click(convertCoords({x: 1680, y: 980, pos: "bottom"}));
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
        reopen: enterLoop
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