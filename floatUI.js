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

var tasks = algo_init()
// touch capture, will be initialized in main
var capture = ()=>{};
// available script list
floatUI.scripts = [
    {
        name: "控件定位周回",
        fn: tasks.default,
    },
    {
        name: "标准周回（坐标定位）",
        fn: autoMain,
    },
    {
        name: "活动周回（坐标定位）",
        fn: autoMainver1,
    },
    {
        name: "Auto周回（坐标定位）",
        fn: autoMainver3,
    },
    {
        name: "自动镜层（坐标定位）",
        fn: jingMain,
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

    function snapshotWrap() {
        toastLog("开始快照");
        var text = recordElement(auto.root, 0, "");

        var d = new Date();
        var timestamp = "" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() +
            "_" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
        var path = files.getSdcardPath();
        path = files.join(path, "auto_magireco");
        path = files.join(path, timestamp + ".xml");
        files.ensureDir(path);
        files.write(path, text);
        toastLog("快照保存至" + path);
    }    
    
    function defaultWrap() {
        toastLog("执行 " + floatUI.scripts[limit.default].name + " 脚本");
        currentTask = threads.start(floatUI.scripts[limit.default].fn);
    }

    function taskWrap() {
        layoutTaskPopup()
        task_popup.container.setVisibility(View.VISIBLE);
        task_popup.setTouchable(true);
    }

    function cancelWrap() {
        toastLog("停止脚本");
        if (currentTask && currentTask.isAlive()) currentTask.interrupt();
    }

    // get to main activity
    function settingsWrap() {
        var it = new Intent();
        var name = context.getPackageName()
        if(name != "org.autojs.autojspro")
            it.setClassName(name, "com.stardust.autojs.inrt.SplashActivity");
        else
            it.setClassName(name, "com.stardust.autojs.execution.ScriptExecuteActivity");
        it.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        app.startActivity(it);
    }

    var task_popup = floaty.rawWindow(
        <frame id="container" w="*" h="*">
            <vertical w="*" h="*" bg="#f8f8f8" margin="0 15 15 0">
                <vertical bg="#4fb3ff">
                    <text text="选择需要执行的脚本" padding="4 2" textColor="#ffffff" />
                </vertical>
                <list id="list">
                    <text id="name" text="{{name}}" h="45" gravity="center" margin="4 1" w="*" bg="#ffffff" />
                </list>
            </vertical>
            <frame id="close_button" w="30" h="30" layout_gravity="top|right">
                <img w="30" h="30" src="#881798" circle="true" />
                <img w="21" h="21" src="@drawable/ic_close_black_48dp" tint="#ffffff" layout_gravity="center"/>
            </frame>
        </frame>
    );

    function layoutTaskPopup() {
        var sz = getWindowSize();
        task_popup.setSize(sz.x / 2, sz.y / 2);
        task_popup.setPosition(sz.x / 4, sz.y / 4);
    }

    task_popup.container.setVisibility(View.INVISIBLE);
    ui.post(()=>{task_popup.setTouchable(false)})
    task_popup.list.setDataSource(floatUI.scripts);
    task_popup.list.on("item_click", function (item, i, itemView, listView) {
        task_popup.container.setVisibility(View.INVISIBLE);
        task_popup.setTouchable(false);
        if (item.fn) {
            toastLog("执行 " + item.name + " 脚本");
            currentTask = threads.start(item.fn);
        }
    });
    task_popup.close_button.click(()=>{
        task_popup.container.setVisibility(View.INVISIBLE);
        task_popup.setTouchable(false);
    })

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
    ui.post(()=>{submenu.setTouchable(false)})

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
            submenu.setPosition(0, parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2));
        else{
            let sz = getWindowSize();
            submenu.setPosition(
                sz.x - submenu.getWidth(),
                parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2)
            );
        }

        for (var i = 0; i < menu_list.length; i++) {
            var params = submenu["entry" + i].getLayoutParams();
            var horizontal_margin = parseInt(size_base * (space_factor + 0.5) * Math.sin(angle_base * (2 * i + 1)));
            var vertical_margin = parseInt(size_base * (space_factor + 0.5) * (1 - Math.cos(angle_base * (2 * i + 1))));
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
                    (isleft ? -1 : 1) * size_base * (space_factor + 0.5) * Math.sin(angle_base * (2 * i + 1))
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
            <img id="img_logo" w="32" h="32" 
                src="https://cdn.jsdelivr.net/gh/icegreentee/cdn/img/other/qb.png"
                layout_gravity="center" />
        </frame>
    );

    ui.post(()=>{menu.setPosition(0, parseInt(getWindowSize().y / 4))})

    function calcMenuY()
    {
        var sz=getWindowSize()
        var minMargin=parseInt((submenu.getHeight()-menu.getHeight())/2)
        var y=menu.getY()
        if(y<minMargin)
            return minMargin
        else if(y>sz.y-minMargin-menu.getHeight())
            return sz.y-minMargin-menu.getHeight()
        else
            return y
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
                    let sz=getWindowSize()
                    let current = menu.getX();
                    let animator = ValueAnimator.ofInt(
                        current,
                        current < sz.x / 2 ? 0 : sz.x - menu.getWidth()
                    );
                    let menu_y=calcMenuY()
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

    var receiver=new BroadcastReceiver({
        onReceive:function(ctx, it){
            if(menu && menu.logo) {
                var sz=getWindowSize()
                var x=menu.getX()
                if(x<=0){
                    menu.setPosition(0, calcMenuY())
                    submenu.setPosition(0, parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2))
                } else {
                    menu.setPosition(sz.x-menu.getWidth(), calcMenuY())
                    submenu.setPosition(sz.x-submenu.getWidth(), parseInt(menu.getY() - (submenu.getHeight() - menu.getHeight()) / 2))
                }
            } else {
                context.unregisterReceiver(receiver)
            }
        }
    })

    context.registerReceiver(receiver, new IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED))

    var touch_pos = null;
    var overlay = floaty.rawWindow(
        <frame id="container" w="*" h="*">
            <frame w="*" h="*" bg="#000000" alpha="0.2"></frame>
            <text w="auto" h="auto" text="请点击需要周回的battle{{'\n'}}(请通关一次后再用，避免错位)" bg="#ffffff" textColor="#FF0000" layout_gravity="center_horizontal|top" textAlignment="center"/>
        </frame>
    );
    overlay.container.setVisibility(View.INVISIBLE);
    ui.post(()=>{overlay.setTouchable(false)})
    overlay.container.setOnTouchListener(function (self, event) {
        if(event.getAction()==event.ACTION_UP) {
            touch_pos = {
                x: parseInt(event.getRawX()),
                y: parseInt(event.getRawY())
            }
            log("捕获点击坐标", touch_pos.x, touch_pos.y);
            overlay.setTouchable(false);
            overlay.container.setVisibility(View.INVISIBLE);
        }
        return true;
    })

    capture = function() {
        touch_pos=null;
        ui.post(()=>{
            var sz=getWindowSize();
            overlay.setSize(sz.x, sz.y);
            overlay.container.setVisibility(View.VISIBLE);
            overlay.setTouchable(true);
        })
        while(overlay.container.getVisibility()==View.INVISIBLE){
            sleep(200);
        }
        while(overlay.container.getVisibility()==View.VISIBLE){
            sleep(200);
        }
        return touch_pos;
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
    helpx: '',
    helpy: '',
    battleNo: 'cb3',
    drug1: false,
    drug2: false,
    drug3: false,
    isStable: false,
    justNPC: false,
    jjcisuse: false,
    drug1num: '',
    drug2num: '',
    drug3num: '',
    jjcnum: '',
    default: 0,
    useAuto: false,
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
function autoMainver3() {
    waitForGameForeground();
    // 初始化嗑药数量
    let druglimit = {
        drug1limit: limit.drug1num,
        drug2limit: limit.drug2num,
        drug3limit: limit.drug3num
    }
    while (true) {
        //开始
        let notdrug = !limit.drug1 && !limit.drug2 && !limit.drug3
        if (!notdrug) {

        }
        // -----------选援助----------------
        FriendHelpFunction();
        // -----------开始----------------
        autoBeginFunction();
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
                let count=parseInt(limit.jjcnum);
                if (limit.jjcisuse && (isNaN(count)||count>0)) {
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
                    limit.jjcnum=''+(count-1);
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
    if (limit.isStable) {
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
    if (limit.isStable) {
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
    if(value!==undefined) {
        limit[key]=value
        log("更新参数：", key, value)
    }
}

// compatible action closure
function algo_init() {
    // for debug
    const AUTO_LIMIT = 2
    // click with root permission
    function clickRoot(x, y) {
        var result = shell("su\ninput tap " + x + " " + y + "\nexit\n");
        // detect reason when click did not succeed
        if (result.code != 0) {
            result = shell("which su");
            if (result.code == 0) {
                // device already rooted, but permission not granted
                toastLog("root权限获取失败");
            } else {
                // device not rooted
                toastLog("Android 7 以下设备运行脚本需要root");
            }
            // terminate when click cannot be successfully performed
            threads.currentThread().interrupt();
        }
    }

    function click(x, y) {
        // limit range
        var sz=getWindowSize()
        if (x >= sz.x) {
            x = sz.x - 1;
        }
        if (y >= sz.y) {
            y = sz.y - 1;
        }
        // system version higher than Android 7.0
        if (device.sdkInt >= 24) {
            // now accessibility gesture APIs are available
            press(x, y, 50);
        } else {
            clickRoot(x, y);
        }
    }

    // find first element using regex
    function match(reg, wait) {
        var startTime = new Date().getTime();
        var result=null;
        var it=0;
        do {
            it++;
            auto.root.refresh()
            result = textMatches(reg).findOnce();
            if (result && result.refresh()) break;
            result = descMatches(reg).findOnce();
            if (result && result.refresh()) break;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        log("match "+reg+ " for "+(new Date().getTime()-startTime) + " with " + it +" limit "+wait)
        return result;
    }

    // find all element using regex
    function matchAll(reg, wait) {
        var startTime = new Date().getTime();
        var result=[];
        var it=0;
        do {
            it++;
            result = textMatches(reg).find();
            result = result.filter(x=>x.refresh());
            if (result.length >= 1) break;
            result = descMatches(reg).find();
            result = result.filter(x=>x.refresh());
            if (result.length >= 1) break;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        log("match all "+reg+ " for "+(new Date().getTime()-startTime) + " with " + it +" limit "+wait)
        return result;
    }

    // find first element using plain text
    function find(txt, wait) {
        var startTime = new Date().getTime();
        var result=null;
        var it=0;
        do {
            it++;
            result = text(txt).findOnce();
            if (result && result.refresh()) break;
            result = desc(txt).findOnce();
            if (result && result.refresh()) break;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        log("find "+txt+ " for "+(new Date().getTime()-startTime) + " with " + it +" limit "+wait)
        return result;
    }

    // find all element using plain text
    function findAll(txt, wait) {
        var startTime = new Date().getTime();
        var result=[];
        var it=0;
        do {
            it++;
            auto.root.refresh()
            result = text(txt).find();
            result = result.filter(x=>x.refresh());
            if (result.length >= 1) break;
            result = desc(txt).find();
            result = result.filter(x=>x.refresh());
            if (result.length >= 1) break;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        log("find all "+txt+ " for "+(new Date().getTime()-startTime)+ " with " + it +" limit "+wait)
        return result;
    }

    function findMultiple(txt_list, wait) {
        var startTime = new Date().getTime();
        var result=null;
        var it=0;
        var current=0;
        do {
            it++;
            if(current>=txt_list.length)current=0;
            result = text(txt_list[current]).findOnce();
            if (result && result.refresh()) break;
            result = desc(txt_list[current]).findOnce();
            if (result && result.refresh()) break;
            current++;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        log("find "+txt_list.join(',')+ " for "+(new Date().getTime()-startTime) + " with " + it +" limit "+wait)
        return result;
    }

    function findID(name, wait) {
        var startTime = new Date().getTime();
        var result=null;
        var it=0;
        do {
            it++;
            auto.root.refresh()
            result = id(name).findOnce();
            if (result && result.refresh()) break;
            sleep(100);
        } while (wait === true || (wait && new Date().getTime() < startTime + wait));
        log("find id "+name+ " for "+(new Date().getTime()-startTime)+ " with " + it +" limit "+wait)
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

    // do not use, nodes may conflict
    function waitAny(fnlist) {
        var counter=threads.atomic(0);
        for(var fn of fnlist)
        {
            threads.start(((f)=>function(){
                f();
                counter.incrementAndGet();
            })(fn))
        }
        while(counter.get()==0){
            sleep(100);
        }
    }

    function getContent(element) {
        if (element) {
            return element.text() === "" ? element.desc() : element.text();
        }
    }

    function checkNumber(content) {
        return !isNaN(Number(content)) && !isNaN(parseInt(content));
    }

    function getAP() {
        if (findID("baseContainer")) {
            // values and seperator are together
            while (true) {
                let result = null;
                let h = getWindowSize().y; 
                let elements = matchAll(/^\d+\/\d+$/, true);
                for(let element of elements) {
                    if(element.bounds().top<h){
                        if(element.indexInParent()==element.parent().childCount()-1 || 
                            !(""+getContent(element.parent().child(element.indexInParent() + 1))).startsWith("Rank")){
                            let content = getContent(element);
                            h = element.bounds().top;
                            result={
                                value: parseInt(content.split('/')[0]),
                                total: parseInt(content.split('/')[1]),
                                bounds: element.bounds(),
                            };
                        }
                        
                    }
                }
                if(result) 
                    return result;
                sleep(500)
            }
        } else {
            // ... are seperate
            while (true) {
                let result = null;
                let h = getWindowSize().y; 
                let elements = findAll("/", true);
                for(let element of elements) {
                    if(element.bounds().top<h){
                        if(element.indexInParent()>1 && element.indexInParent()<element.parent().childCount()-1) {
                            var previous = element.parent().child(element.indexInParent() - 1);
                            var next = element.parent().child(element.indexInParent() + 1);
                            if (checkNumber(getContent(previous)) && checkNumber(getContent(next))) {
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
                if(result) 
                    return result;
                sleep(500)
            }
        }
    }

    function getPTList() {
        let elements = matchAll(/^\+\d*$/);
        let results = [];
        let left = 0;
        log("PT匹配结果数量" + elements.length);
        for (var element of elements) {
            var content = getContent(element);
            // pt value and "+" are seperate
            if (content == "+") {
                if(element.indexInParent() < element.parent().childCount()-1){
                    var next = element.parent().child(element.indexInParent() + 1);
                    if (checkNumber(getContent(next))) {
                        results.push({
                            value: Number(getContent(next)),
                            bounds: element.bounds(),
                        });
                        if (element.bounds().left > left) left = element.bounds().left;
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
                    if (element.bounds().left > left) left = element.bounds().left;
                }
            }
        }

        return results.filter((result) => result.bounds.left == left);
    }

    function getCostAP() {
        let elements = findAll(string.cost_ap);
        for(let element of elements) {
            if(element.indexInParent() < element.parent().childCount()-1){
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

    var string = {};
    var druglimit = [NaN, NaN, NaN];
    var usedrug = false;
    var currentname = "";

    function initialize() {
        var element = auto.root;
        if (element) {
            currentname = element.packageName();
            var current = [];
            if (currentname == "com.bilibili.madoka.bilibili") {
                log("检测为国服");
                current = strings.zh_Hans;
            } else if (currentname == "com.komoe.madokagp") {
                log("检测为台服");
                current = strings.zh_Hant;
            } else if (currentname == "com.aniplex.magireco") {
                log("检测为日服");
                current = strings.ja;
            }
            for (let i = 0; i < strings.name.length; i++) {
                string[strings.name[i]] = current[i];
            }
            usedrug = false;
            for (let i = 0; i < 3; i++) {
                druglimit[i] = limit["drug" + (i + 1)] ? parseInt(limit["drug" + (i + 1) + "num"]) : 0;
                if (druglimit[i] !== 0) {
                    usedrug = true;
                }
            }
        } else {
            toastLog("未在前台检测到魔法纪录");
            threads.currentThread().interrupt();
        }
    }

    // isolate logic for future adaption
    function ifUseDrug(index, count) {
        // when drug is valid
        if ((index < 2 && count > 0) || count > 4) {
            // unlimited
            if (isNaN(druglimit[index])) return true;
            else if (druglimit[index] > 0) return true;
        }
    }

    function updateDrugLimit(index) {
        if (!isNaN(druglimit[index])) {
            druglimit[index]--;
            limit["drug" + (index + 1) + "num"]=""+druglimit[index];
        }
    }

    function refillAP() {
        log("尝试使用回复药");
        do {
            var usedrug = false;
            var numbers = matchAll(string.regex_drug, true);
            var buttons = findAll(string.revive_button);
            // when things seems to be correct
            if (numbers.length == 3 && buttons.length == 3) {
                for (let i = 0; i < 3; i++) {
                    if (ifUseDrug(i, parseInt(getContent(numbers[i]).slice(0, -1)))) {
                        log("使用第" + (i + 1) + "种回复药, 剩余" + druglimit[i] + "次");
                        var bound = buttons[i].bounds();
                        do{
                            click(bound.centerX(), bound.centerY());
                            // wait for confirmation popup
                        } while(!find(string.revive_popup, 2000))
                        log("点击确认回复");
                        bound = find(string.revive_confirm, true).bounds();
                        click(bound.centerX(), bound.centerY());
                        usedrug = true;
                        updateDrugLimit(i);
                        break;
                    }
                }
            }
            if (!usedrug && find(string.out_of_ap)) {
                log("AP不足且未嗑药，退出");
                threads.currentThread().interrupt();
            }
            // wait for refill window to be back
            var element = find(string.revive_title, true);
            var apinfo = getAP();
            log("当前AP:"+apinfo.value+"/"+apinfo.total)
        } while(usedrug && limit.useAuto && apinfo.value <= apinfo.total*AUTO_LIMIT)
        // now close the window
        while (element.refresh()) {
            log("关闭回复窗口");
            bound = element.parent().bounds();
            click(bound.right, bound.top);
            waitElement(element, 5000);
        }
        return usedrug;
    }

    var overlay = floaty.rawWindow(
        <frame id="container" w="*" h="*">
            <text w="auto" h="auto" layout_gravity="center_horizontal|top" bg="#ffffff" color="#ff0000"/>
            <frame id="curtain" w="*" h="*" bg="#000000" alpha="0.2"></frame>
        </frame>
    );

    function selectBattle() {}

    function taskDefault() {
        initialize();
        var state = STATE_MENU;
        var battlename = "";
        var charabound = null;
        var tryusedrug = true;
        var battlepos = null;
        while (true) {
            switch (state) {
                case STATE_MENU: {
                    // exit condition
                    if (find(string.support)) {
                        state = STATE_SUPPORT;
                        log("进入助战选择");
                        break;
                    }
                    // if AP is not enough
                    if (findID("popupInfoDetailTitle")) {
                        // try use drug
                        tryusedrug = refillAP();
                    }
                    // if need to click to enter battle
                    let button = find(string.battle_confirm);
                    if (button) {
                        log("点击确认进入battle")
                        let bound = button.bounds();
                        click(bound.centerX(), bound.centerY());
                        // wait for support screen for 5 seconds
                        find(string.support, 5000);
                    }
                    else if (battlepos) {
                        log("尝试点击关卡坐标")
                        click(battlepos.x, battlepos.y);
                        findMultiple([string.battle_confirm, string.support], 5000);
                    }
                    // click battle if available
                    else if (battlename) {
                        let battle = find(battlename);
                        if (battle) {
                            log("尝试点击关卡名称")
                            let bound = battle.bounds();
                            click(bound.centerX(), bound.centerY());
                            // wait for support screen for 5 seconds
                            findMultiple([string.battle_confirm, string.support], 5000);
                        }
                    }
                    else {
                        log("等待捕获关卡坐标")
                        battlepos=capture();
                    }
                    break;
                }

                case STATE_SUPPORT: {
                    // exit condition
                    if (find(string.start)) {
                        state = STATE_TEAM;
                        log("进入队伍调整");
                        break;
                    }
                    // if we need to refill AP
                    let apinfo = getAP();
                    let apcost = getCostAP();
                    log("消费AP", apcost, "用药", usedrug, "当前AP", apinfo.value, "AP上限", apinfo.total)
                    if (((limit.useAuto && apinfo.value<= apinfo.total*AUTO_LIMIT) || (apcost && apinfo.value < apcost * 2)) && usedrug && tryusedrug) {
                        // open revive window
                        let revive_window;
                        do {
                            click(apinfo.bounds.centerX(), apinfo.bounds.centerY());
                            revive_window = findID("popupInfoDetailTitle", 5000);
                        } while (!revive_window);
                        // try use drug
                        tryusedrug = refillAP();
                    }
                    // save battle name if needed
                    let battle = match(/^BATTLE.+/);
                    if (battle) {
                        battlename = getContent(battle);
                    }
                    // if unexpectedly treated as long touch
                    if (findID("detailTab")) {
                        log("误点击，尝试返回")
                        let element = className("EditText").findOnce();
                        if (element && element.refresh()) {
                            let bound = element.bounds();
                            click(bound.left, bound.top);
                        }
                        find(string.support, 5000);
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
                        find(string.start, 5000);
                    }
                    break;
                }

                case STATE_TEAM: {
                    var element = limit.useAuto ? match(string.regex_autobattle):find(string.start);
                    if(limit.useAuto && !element) {
                        log("未发现自动续战，改用标准战斗")
                        element = find(string.start);
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
                    if (findID("charaWrap")) {
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
                    let element = findID("charaWrap");
                    if (element) {
                        if(element.bounds().height() > 0)
                            charabound = element.bounds();
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
                    if (find(string.support)) {
                        state = STATE_SUPPORT;
                        log("进入助战选择");
                        break;
                    } else {
                        state = STATE_MENU;
                        log("进入关卡选择");
                        break;
                    }
                    // try to skip
                    let element = className("EditText").findOnce();
                    if (element && element.refresh()) {
                        log("尝试跳过剧情")
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
    };
}

//global utility functions

function getWindowSize() {
    var wm = context.getSystemService(context.WINDOW_SERVICE);
    var pt = new Point()
    wm.getDefaultDisplay().getSize(pt)
    return pt
}

module.exports = floatUI;