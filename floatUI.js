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

//提醒用户先把游戏切到前台，否则结束脚本运行
//切到前台后，检测区服
var currentLang = "chs";
function waitForGameForeground() {
    let isGameFg = false;
    for (let i = 1; i <= 5; i++) {
        if (packageName("com.aniplex.magireco").findOnce()) {
            isGameFg = true;
            log("检测到日服");
            currentLang = "jp";
        }
        if (packageName("com.bilibili.madoka.bilibili").findOnce()) {
            isGameFg = true;
            log("检测到国服");
            currentLang = "chs";
        }
        if (packageName("com.komoe.madokagp").findOnce()) {
            isGameFg = true;
            log("检测到台服");
            currentLang = "cht";
        }
        if (isGameFg) {
            log("游戏在前台");
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

floatUI.main = function () {
    let task = null;
    let logo_switch = false;//全局: 悬浮窗的开启关闭检测
    let logo_buys = false;//全局: 开启和关闭时占用状态 防止多次点击触发
    let logo_fx = true//全局: 悬浮按钮所在的方向 真左 假右
    let time_0, time_1, time_3//全局: 定时器 点击退出悬浮窗时定时器关闭
    //可修改参数
    let logo_ms = 200//全局:  动画播放时间
    let DHK_ms = 200//全局:  对话框动画播放时间
    let tint_color = "#00000"//全局:  对话框图片颜色
    /**
     * 需要三个悬浮窗一起协作达到Auto.js悬浮窗效果
     * win  子菜单悬浮窗 处理子菜单选项点击事件
     * win_1  主悬浮按钮 
     * win_2  悬浮按钮动画替身,只有在手指移动主按钮的时候才会被触发 
     * 触发时,替身Y值会跟主按钮Y值绑定一起,手指弹起时代替主按钮显示跳动的小球动画
     */
    let win = floaty.rawWindow(
        <frame >//子菜单悬浮窗
        <frame id="id_logo" w="150" h="210" alpha="0"  >
                <frame id="id_0" w="44" h="44" margin="33 0 0 0" alpha="1">
                    <img w="44" h="44" src="#009687" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_play_arrow_black_48dp" tint="#ffffff" gravity="center" layout_gravity="center" />
                    <img id="id_0_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_1" w="44" h="44" margin="86 28 0 0" alpha="1">
                    <img w="44" h="44" src="#ee534f" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_play_arrow_black_48dp" tint="#ffffff" gravity="center" layout_gravity="center" />
                    <img id="id_1_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_2" w="44" h="44" margin="0 83 0 0" alpha="1" gravity="right" layout_gravity="right">
                    <img w="44" h="44" src="#40a5f3" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_play_arrow_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_2_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_3" w="44" h="44" margin="86 0 0 28" alpha="1" gravity="bottom" layout_gravity="bottom">
                    <img w="44" h="44" src="#fbd834" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_clear_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_3_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
                <frame id="id_4" w="44" h="44" margin="33 0 0 0" alpha="1" gravity="bottom" layout_gravity="bottom">
                    <img w="44" h="44" src="#bfc1c0" circle="true" />
                    <img w="28" h="28" src="@drawable/ic_settings_black_48dp" tint="#ffffff" margin="8" />
                    <img id="id_4_click" w="*" h="*" src="#ffffff" circle="true" alpha="0" />
                </frame>
            </frame>
            <frame id="logo" w="44" h="44" marginTop="83" alpha="1" />
            <frame id="logo_1" w="44" h="44" margin="0 83 22 0" alpha="1" layout_gravity="right" />
        </frame>
    )
    // win.setTouchable(false);//设置子菜单不接收触摸消息

    let cwd_str = files.cwd();
    //悬浮按钮
    let win_1_xmlstr = "<frame id=\"logo\" w=\"44\" h=\"44\" alpha=\"0.4\" ><img w=\"44\" h=\"44\" src=\"#ffffff\" circle=\"true\" alpha=\"0.8\" />";
    win_1_xmlstr += "<img id=\"img_logo\" w=\"32\" h=\"32\" src=\"file://";
    win_1_xmlstr += cwd_str;
    win_1_xmlstr += "/res/icon.png\" gravity=\"center\" layout_gravity=\"center\" />";
    win_1_xmlstr += "<img id=\"logo_click\" w=\"*\" h=\"*\" src=\"#ffffff\" alpha=\"0\" />";
    win_1_xmlstr += "</frame>";
    let win_1 = floaty.rawWindow(win_1_xmlstr);
    // win_1.setPosition(-30, device.height / 4)//悬浮按钮定位

    //悬浮按钮 弹性替身
    let win_2_xmlstr = "<frame id=\"logo\" w=\"{{device.width}}px\" h=\"44\" alpha=\"0\" >";
    win_2_xmlstr += "<img w=\"44\" h=\"44\" src=\"#ffffff\" circle=\"true\" alpha=\"0.8\" />";
    win_2_xmlstr += "<img id=\"img_logo\" w=\"32\" h=\"32\" src=\"file://";
    win_2_xmlstr += cwd_str;
    win_2_xmlstr += "/res/icon.png\" margin=\"6 6\" />";
    win_2_xmlstr += "</frame>";
    let win_2 = floaty.rawWindow(win_2_xmlstr);
    // win_2.setTouchable(false);//设置弹性替身不接收触摸消息

    /**
     * 脚本广播事件
     */
    let XY = [], XY1 = [], TT = [], TT1 = [], img_dp = {}, dpZ = 0, logo_right = 0, dpB = 0, dp_H = 0
    events.broadcast.on("定时器关闭", function (X) { clearInterval(X) })
    events.broadcast.on("悬浮开关", function (X) {
        ui.run(function () {
            switch (X) {
                case true:
                    win.id_logo.setVisibility(0)
                    win.setTouchable(true);
                    logo_switch = true
                    break;
                case false:
                    win.id_logo.setVisibility(4)
                    win.setTouchable(false);
                    logo_switch = false
            }
        })

    });

    events.broadcast.on("悬浮显示", function (X1) {
        ui.run(function () {
            win_2.logo.attr("alpha", "0");
            win_1.logo.attr("alpha", "0.4");
        })
    });

    /**
     * 等待悬浮窗初始化
     */
    let terid = setInterval(() => {
        // log("13")
        if (TT.length == 0 && win.logo.getY() > 0) {// 不知道界面初始化的事件  只能放到这里将就下了
            ui.run(function () {
                TT = [win.logo.getX(), win.logo.getY()], TT1 = [win.logo_1.getLeft(), win.logo_1.getTop()], anX = [], anY = []// 获取logo 绝对坐标
                XY = [
                    [win.id_0, TT[0] - win.id_0.getX(), TT[1] - win.id_0.getY()],//  获取子菜单 视图和子菜单与logo绝对坐标差值
                    [win.id_1, TT[0] - win.id_1.getX(), TT[1] - win.id_1.getY()],
                    [win.id_2, TT[0] - win.id_2.getX(), 0],
                    [win.id_3, TT[0] - win.id_3.getX(), TT[1] - win.id_3.getY()],
                    [win.id_4, TT[0] - win.id_4.getX(), TT[1] - win.id_4.getY()]]
                // log("上下Y值差值:" + XY[0][2] + "DP值:" + (XY[0][2] / 83))
                dpZ = XY[0][2] / 83
                dpB = dpZ * 22
                XY1 = [
                    [parseInt(dpZ * 41), TT1[0] - win.id_0.getLeft(), TT1[1] - win.id_0.getTop()],
                    [parseInt(dpZ * -65), TT1[0] - win.id_1.getLeft(), TT1[1] - win.id_1.getTop()],
                    [parseInt(dpZ * -106), TT1[0] - win.id_2.getLeft(), TT1[1] - win.id_2.getTop()],
                    [parseInt(dpZ * -65), TT1[0] - win.id_3.getLeft(), TT1[1] - win.id_3.getTop()],
                    [parseInt(dpZ * 41), TT1[0] - win.id_4.getLeft(), TT1[1] - win.id_4.getTop()]]
                img_dp.h_b = XY[0][2]//两个悬浮窗Y差值
                img_dp.w = parseInt(dpZ * 9)//计算logo左边隐藏时 X值
                img_dp.ww = parseInt(dpZ * (44 - 9))//计算logo右边隐藏时 X值
                logo_right = win.id_2.getX() - parseInt(dpZ * 22)
                win.setTouchable(false);
                win_1.setPosition(0 - img_dp.w, device.height / 4)
                win_2.setTouchable(false);
                win.id_logo.setVisibility(4)
                win.id_logo.attr("alpha", "1")
                events.broadcast.emit("定时器关闭", terid)
            })
        }
    }, 100)

    time_0 = setInterval(() => {
        //log("11")
    }, 1000)

    /**
     * 子菜单点击事件
     */
    function img_down() {
        win_1.logo.attr("alpha", "0.4")
        logo_switch = false
        动画()
    }
    win.id_0_click.on("click", () => {
        toastLog("境界启动")
        if (task) {
            task.interrupt()
        }
        task = threads.start(jingMain)
        img_down()
    })

    win.id_1_click.on("click", () => {
        toastLog("活动sp启动")
        if (task) {
            task.interrupt()
        }
        task = threads.start(autoMainver2)
        img_down()
    })

    win.id_2_click.on("click", () => {
        toastLog("启动")
        if (task) {
            task.interrupt()
        }
        task = threads.start(autoMain)
        img_down()
    })

    win.id_3_click.on("click", () => {
        toastLog("结束")
        if (task != null) {
            task.interrupt()
        }
        img_down()
    })

    win.id_4_click.on("click", () => {
        try {
            let res = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle/project.json");
            if (res.statusCode != 200) {
                toastLog("请求超时")
            } else {
                let resJson = res.body.json();
                if (parseInt(resJson.versionName.split(".").join("")) == parseInt(limit.version.split(".").join(""))) {
                    toastLog("为最新版本，无需更新")
                } else {
                    let main_script = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle/main.js");
                    let float_script = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle/floatUI.js");
                    if (main_script.statusCode == 200 && float_script.statusCode == 200) {
                        toastLog("更新加载中");
                        let mainjs = main_script.body.string();
                        let floatjs = float_script.body.string();
                        files.write(engines.myEngine().cwd() + "/main.js", mainjs)
                        files.write(engines.myEngine().cwd() + "/floatUI.js", floatjs)
                        engines.stopAll()
                        events.on("exit", function () {
                            engines.execScriptFile(engines.myEngine().cwd() + "/main.js")
                            toast("更新完毕")
                        })
                    } else {
                        toast("脚本获取失败！这可能是您的网络原因造成的，建议您检查网络后再重新运行软件吧\nHTTP状态码:" + main_script.statusMessage, "," + float_script.statusMessag);
                    }
                }
            }
            // -------

        } catch (error) {
            toastLog("请求超时，可再一次尝试")
        }

        img_down();
    })




    /**
     * 补间动画
     */
    function 动画() {
        let anX = [], anY = [], slX = [], slY = []
        if (logo_switch) {
            if (logo_fx) {
                for (let i = 0; i < XY.length; i++) {
                    anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", parseInt(XY[i][1]), 0);
                    anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", parseInt(XY[i][2]), 0);
                    slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 0, 1)
                    slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 0, 1)
                }
            } else {
                for (let i = 0; i < XY.length; i++) {
                    anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", XY1[i][1], XY1[i][0]);
                    anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", XY1[i][2], 0);
                    slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 0, 1)
                    slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 0, 1)
                }
            }
        } else {
            if (logo_fx) {
                for (let i = 0; i < XY.length; i++) {
                    anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", 0, parseInt(XY[i][1]));
                    anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", 0, parseInt(XY[i][2]));
                    slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 1, 0)
                    slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 1, 0)
                }
            } else {
                for (let i = 0; i < XY.length; i++) {
                    anX[i] = ObjectAnimator.ofFloat(XY[i][0], "translationX", XY1[i][0], XY1[i][1]);
                    anY[i] = ObjectAnimator.ofFloat(XY[i][0], "translationY", 0, XY1[i][2]);
                    slX[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleX", 1, 0)
                    slY[i] = ObjectAnimator.ofFloat(XY[i][0], "scaleY", 1, 0)
                }
            }
        }
        set = new AnimatorSet();
        set.playTogether(
            anX[0], anX[1], anX[2], anX[3], anX[4],
            anY[0], anY[1], anY[2], anY[3], anY[4],
            slX[0], slX[1], slX[2], slX[3], slX[4],
            slY[0], slY[1], slY[2], slY[3], slY[4]);
        set.setDuration(logo_ms);
        threads.start(function () {//动画的结束事件一直没有明白 只能拿线程代替了
            logo_buys = true
            if (logo_switch) {
                //log("开启")
                events.broadcast.emit("悬浮开关", true)
                sleep(logo_ms)
            } else {
                //log("关闭")
                sleep(logo_ms + 100)
                events.broadcast.emit("悬浮开关", false)
            }
            logo_buys = false
        });
        set.start();
    }
    function 对话框动画(X, Y, Z) {//X布尔值 标识显示还是隐藏 Y背景的视图 Z对话框的视图
        let anX = [], anY = [], slX = [], slY = []
        if (X) {
            anX = ObjectAnimator.ofFloat(Z, "translationX", win_1.getX() - (Z.getRight() / 2) + dpB - Z.getLeft(), 0);
            anY = ObjectAnimator.ofFloat(Z, "translationY", win_1.getY() - (Z.getBottom() / 2) + img_dp.h_b - Z.getTop(), 0);
            slX = ObjectAnimator.ofFloat(Z, "scaleX", 0, 1)
            slY = ObjectAnimator.ofFloat(Z, "scaleY", 0, 1)
            animator = ObjectAnimator.ofFloat(Y, "alpha", 0, 0.5)
            animator1 = ObjectAnimator.ofFloat(Z, "alpha", 1, 1)
        } else {
            anX = ObjectAnimator.ofFloat(Z, "translationX", 0, win_1.getX() - (Z.getRight() / 2) + dpB - Z.getLeft());
            anY = ObjectAnimator.ofFloat(Z, "translationY", 0, win_1.getY() - (Z.getBottom() / 2) + img_dp.h_b - Z.getTop());
            slX = ObjectAnimator.ofFloat(Z, "scaleX", 1, 0)
            slY = ObjectAnimator.ofFloat(Z, "scaleY", 1, 0)
            animator = ObjectAnimator.ofFloat(Y, "alpha", 0.5, 0)
            animator1 = ObjectAnimator.ofFloat(Z, "alpha", 1, 0)
        }
        set = new AnimatorSet()
        set.playTogether(
            anX, anY, slX, slY, animator, animator1);
        set.setDuration(DHK_ms);
        set.start();
    }

    //记录按键被按下时的触摸坐标
    let x = 0,
        y = 0;
    //记录按键被按下时的悬浮窗位置
    let windowX, windowY; G_Y = 0
    //记录按键被按下的时间以便判断长按等动作
    let downTime; yd = false;
    win_1.logo.setOnTouchListener(function (view, event) {
        if (logo_buys) { return false }
        // log(event.getAction())
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                x = event.getRawX();
                y = event.getRawY();
                windowX = win_1.getX();
                windowY = win_1.getY();
                downTime = new Date().getTime();
                return true;
            case event.ACTION_MOVE:
                if (logo_switch) { return true; }
                if (!yd) {//如果移动的距离大于h值 则判断为移动 yd为真
                    if (Math.abs(event.getRawY() - y) > 30 || Math.abs(event.getRawX() - x) > 30) { win_1.logo.attr("alpha", "1"); yd = true }
                } else {//移动手指时调整两个悬浮窗位置
                    win_1.setPosition(windowX + (event.getRawX() - x),//悬浮按钮定位
                        windowY + (event.getRawY() - y));
                    win_2.setPosition(0, windowY + (event.getRawY() - y));//弹性 替身定位(隐藏看不到的,松开手指才会出现)
                }
                return true;
            case event.ACTION_UP:                //手指弹起
                //触摸时间小于 200毫秒 并且移动距离小于30 则判断为 点击
                if (logo_buys) { return }//如果在动画正在播放中则退出事件 无操作
                if (Math.abs(event.getRawY() - y) < 30 && Math.abs(event.getRawX() - x) < 30) {
                    //toastLog("点击弹起")
                    if (logo_switch) {
                        logo_switch = false
                        win_1.logo.attr("alpha", "0.4")
                    } else if (logo_fx) {
                        // log("左边")
                        win.setPosition(windowX + (event.getRawX() - x),
                            windowY + (event.getRawY() - y) - img_dp.h_b);
                        win.id_logo.setVisibility(0)
                        logo_switch = true
                        win_1.logo.attr("alpha", "0.9")
                    } else {
                        win.setPosition(win_1.getX() + (event.getRawX() - x) - logo_right,
                            win_1.getY() + (event.getRawY() - y) - img_dp.h_b);
                        win.id_logo.setVisibility(0)
                        logo_switch = true
                        win_1.logo.attr("alpha", "0.9")
                    }
                    动画()
                } else if (!logo_switch) {
                    //toastLog("移动弹起")
                    G_Y = windowY + (event.getRawY() - y)
                    win_1.logo.attr("alpha", "0.4")

                    if (windowX + (event.getRawX() - x) < device.width / 2) {
                        //toastLog("左边")
                        logo_fx = true
                        animator = ObjectAnimator.ofFloat(win_2.logo, "translationX", windowX + (event.getRawX() - x), 0 - img_dp.w);
                        mTimeInterpolator = new BounceInterpolator();
                        animator.setInterpolator(mTimeInterpolator);
                        animator.setDuration(300);
                        win_2.logo.attr("alpha", "0.4")//动画 替身上场
                        win_1.logo.attr("alpha", "0");//悬浮按钮隐藏
                        win_1.setPosition(0 - img_dp.w, G_Y)//悬浮按钮移动到终点位置等待替身动画结束
                        animator.start();
                    } else {
                        //toastLog("右边")
                        logo_fx = false
                        animator = ObjectAnimator.ofFloat(win_2.logo, "translationX", windowX + (event.getRawX() - x), device.width - img_dp.ww);
                        mTimeInterpolator = new BounceInterpolator();
                        animator.setInterpolator(mTimeInterpolator);
                        animator.setDuration(300);
                        win_2.logo.attr("alpha", "0.4")//动画替身上场
                        win_1.logo.attr("alpha", "0");//悬浮按钮隐藏
                        win_1.setPosition(device.width - img_dp.ww, G_Y)//悬浮按钮移动到终点位置等待替身动画结束
                        animator.start();
                    }
                    threads.start(function () {//动画的结束事件一直没有明白 只能拿线程代替了
                        logo_buys = true
                        sleep(logo_ms + 100)
                        events.broadcast.emit("悬浮显示", 0)

                        logo_buys = false
                    });
                }
                yd = false
                return true;
        }
        return true;
    });
}
// ------------主要逻辑--------------------
var keywords = {
    confirmRefill: {
        chs: "回复确认",
        jp:   "回復確認",
        cht: "回復確認"
    },
    refill: {
        chs: "回复",
        jp:   "回復する",
        cht: "進行回復"
    },
    start: {
        chs: "开始",
        jp:   "開始",
        cht: "開始"
    },
    follow: {
        chs: "关注",
        jp:   "フォロー",
        cht: "關注"
    },
    appendFollow: {
        chs: "关注追加",
        jp:   "フォロー追加",
        cht: "追加關注"
    }
};
var currentLang = "chs";
var limit = {
    limitAP: '20',
    shuix: '',
    shuiy: '',
    helpx: '',
    helpy: '',
    drug1: false,
    drug2: false,
    drug3: false,
    isStable: false,
    justNPC: false,
    isSkip: false,
    jjcisuse: false,
    version: '2.2.0',
    drug1num: '',
    drug2num: '',
    drug3num: ''
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
}

//坐标转换
//初始化变量
var known = {
  res: {width: 0, height: 0}, //在开发者自己的手机上截图取已知坐标时用的分辨率，后面会填上1920x1080
  ratio: {x: 0, y: 0}         //宽高比，后面会填上16:9
};
var scr = {
  res: {width: 0, height: 0}, //当前真实屏幕的分辨率
  ratio: {x: 0, y: 0},        //宽高比
  ref: {                      //ref是假想的16:9参照屏幕，宽或高放缩到和当前屏幕一样
    width: 0, height: 0,
    offset: {
      wider: {x: 0, y: 0},    //带鱼屏。假想的参照屏幕高度缩放到和当前真实屏幕一样，宽度比当前真实屏幕小。实际上带鱼屏左右两侧有黑边。
      higher: {               //方块屏。假想的参照屏幕宽度缩放到和当前真实屏幕一样，高度比当前真实屏幕小。
        top: {x: 0, y: 0},    //  实际上方块屏在纵向可以容纳更多控件，
        center: {x: 0, y: 0}, //  所以要让居中控件下移；
        bottom: {x: 0, y: 0}  //  底端控件需要下移更多距离。
      }
    }
  }
};
var conversion_mode = "simple_scaling";

//已知控件坐标是在1920x1080下测得的，宽高比16:9，以此为参照
known.res.width = 1920;
known.res.height = 1080;
known.ratio.x = 16;
known.ratio.y = 9;

//获取当前屏幕分辨率
if(device.height > device.width){
  //魔纪只能横屏显示
  scr.res.width = device.height;
  scr.res.height = device.width;
} else {
  scr.res.width = device.width;
  scr.res.height = device.height;
}

//判断当前屏幕的宽高比
//辗转相除法取最大公约数
function get_gcd(a, b) {
    if (a % b === 0) {
        return b;
    }
    return get_gcd(b, a % b);
}
var gcd = get_gcd(scr.res.width, scr.res.height);
//得到宽高比
scr.ratio.x = Math.round(scr.res.width / gcd);
scr.ratio.y = Math.round(scr.res.height / gcd);
log("当前屏幕分辨率", scr.res.width, "x", scr.res.height, "宽高比", scr.ratio.x, ":", scr.ratio.y);

if (scr.ratio.x == known.ratio.x && scr.ratio.y == known.ratio.y) {
  //最简单的等比例缩放
  conversion_mode = "simple_scaling";
  scr.ref.width = scr.res.width;  // reference width, equals to actual
  scr.ref.height = scr.res.height;  // reference height, equals to actual
} else {
  if (scr.ratio.x * known.ratio.y > known.ratio.x * scr.ratio.y) {
    //带鱼屏，其实还是简单的等比例缩放，只是左右两侧有黑边要跳过
    conversion_mode = "wider_screen";
    scr.ref.width = parseInt(scr.res.height * known.res.width / known.res.height);  // reference width, smaller than actual
    scr.ref.height = scr.res.height;                                                // reference height
    scr.ref.offset.wider.x = parseInt((scr.res.width - scr.ref.width) / 2);         // black bar width, assuming ref screen is at the center
  } else if (scr.ratio.x * known.ratio.y < known.ratio.x * scr.ratio.y) {
    //方块屏，略复杂，其实还是等比例缩放，但是X轴布局不变，Y轴布局变了，有更大空间显示更多控件
    conversion_mode = "higher_screen";
    scr.ref.width = scr.res.width;                                                  // reference width
    scr.ref.height = parseInt(scr.res.width * known.res.height / known.res.width);  // reference height, smaller than actual
    //居中控件和底端控件需要对应下移
    scr.ref.offset.higher.center.y = parseInt((scr.res.height - scr.ref.height) / 2);      // height gap, assuming ref screen is at the center
    scr.ref.offset.higher.bottom.y = scr.res.height - scr.ref.height;                      // height gap, assuming ref screen is at the bottom
  } else {
    throw "unexpected_error";
  }
}

//换算坐标 1920x1080=>当前屏幕分辨率
function convertCoords(d)
{
  var verboselog = false
  if (verboselog) log("换算前的坐标: x=", d.x, " y=", d.y, " pos=", d.pos);
  var actual = {
    x:   0,
    y:   0,
    pos: 0
  };
  var pos = d.pos;
  //输入的X、Y是1920x1080下测得的
  //想象一个放大过的16:9的参照屏幕，覆盖在当前的真实屏幕上
  actual.x = d.x * scr.ref.width / known.res.width;
  actual.y = d.y * scr.ref.height / known.res.height;
  if (conversion_mode == "simple_scaling") {
    //简单缩放，参照屏幕完全覆盖真实屏幕，无需进一步处理
  if (verboselog) log("  换算方法：简单缩放");
  } else if (conversion_mode == "wider_screen") {
    //左右黑边，参照屏幕在Y轴方向正好完全覆盖，在X轴方向不能完全覆盖，所以需要右移
    if (verboselog) log("  换算方法：放缩后跳过左右黑边");
    actual.x += scr.ref.offset.wider.x;
  } else if (conversion_mode == "higher_screen") {
    //最麻烦的方块屏
    if (verboselog) log("  换算方法：放缩后下移居中和底端控件");
    if (pos == "top") {
      //顶端控件无需进一步处理
      if (verboselog) log("    顶端控件");
    } else if (pos == "center") {
      //居中控件，想象一个放大过的16:9的参照屏幕，覆盖在当前这个方块屏的正中央，X轴正好完全覆盖，Y轴只覆盖了中间部分，所以需要下移
      if (verboselog) log("    居中控件");
      actual.y += scr.ref.offset.higher.center.y;
    } else if (pos == "bottom") {
      //底端控件同理，只是参照屏幕位于底端，需要下移更远
      if (verboselog) log("    底端控件");
      actual.y += scr.ref.offset.higher.bottom.y;
    } else {
      if (verboselog) log("    未知控件类型");
      throw "unknown_pos_value";
    }
  } else {
    if (verboselog) log("  未知换算方法");
    throw "unknown_conversion_mode"
  }
  actual.x = parseInt(actual.x);
  actual.y = parseInt(actual.y);
  actual.pos = d.pos;
  if (verboselog) log("换算后的坐标", " x=", actual.x, " y=", actual.y);
  return actual;
}

//按换算后的坐标点击屏幕
function screenutilClick(d) {
  var converted = convertCoords(d);
  log("按换算后的坐标点击屏幕");
  //用换算后的实际坐标点击屏幕
  compatClick(converted.x, converted.y);
}

function detectAP() {
    log("开始检测ap")
    id("ap").findOne()
    sleep(1000)
    let apComlikes = textMatches(/^\d+\/\d+$/).find()
    log(apComlikes)
    let apCom = apComlikes[0]
    log(apCom.bounds())
    for (let i = 1; i < apComlikes.length; i++) {
        log(apComlikes[i].bounds())
        if (apCom.bounds().top > apComlikes[i].bounds().top) {
            apCom = apComlikes[i]
        }
    }
    sleep(1000)
    let aps = apCom.text()
    log("ap:", aps)
    // aps  55/122  获得字符串中第一串数字
    let apNow = parseInt(aps.match(/\d+/)[0])
    return apNow;
}

function refillAP() {
    //嗑药
    //打开ap面板
    log("嗑药面板开启")
    //确定要嗑药后等3s，打开面板
    while (!id("popupInfoDetailTitle").findOnce()) {
        sleep(1000)
        screenutilClick(clickSets.ap)
        sleep(2000)
    }
    let apDrugNums = textMatches(/^\d+個$/).find()

    if (currentLang == "chs") {
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
        while (!text(keywords.confirmRefill[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.ap50)
            sleep(2000)
        }
        text(keywords.refill[currentLang]).findOne()
        sleep(1500)
        log("确认回复")
        while (text(keywords.confirmRefill[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.aphui)
            sleep(2000)
        }
    } else if (apDrugFullNum > 0 && limit.drug2 && druglimit.drug2limit != "0") {
        if (druglimit.drug2limit) {
            druglimit.drug2limit = (parseInt(druglimit.drug2limit) - 1) + ""
        }
        while (!text(keywords.confirmRefill[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.apfull)
            sleep(2000)
        }
        text(keywords.refill[currentLang]).findOne()
        sleep(1500)
        log("确认回复")
        while (text(keywords.confirmRefill[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.aphui)
            sleep(2000)
        }
    }
    else if (apMoneyNum > 5 && limit.drug3 && druglimit.drug3limit != "0") {
        if (druglimit.drug3limit) {
            druglimit.drug3limit = (parseInt(druglimit.drug3limit) - 1) + ""
        }
        while (!text(keywords.confirmRefill[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.apjin)
            sleep(2000)
        }
        text(keywords.refill[currentLang]).findOne()
        sleep(1500)
        log("确认回复")
        while (text(keywords.confirmRefill[currentLang]).findOnce()) {
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

//选择Pt最高的助战
function pickSupportWithTheMostPt() {
    log("选择助战")
    // -----------选援助----------------
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
    else if (currentLang != "chs") {
        while (id("friendWrap").findOnce()) {
            sleep(1000)
            click(friendWrap.centerX(), friendWrap.top + 100)
            sleep(2000)
        }
    } else {
        let ptCom = textMatches(/^\+\d+$/).find()
        //可点击的助战列表
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
                log(ptCom[i].bounds())
            }
        }
        log("候选列表", ptComCanClick)
        log(getPt(ptComCanClick[0]), getPt(ptComCanClick[ptComCanClick.length - 1]))
        // 是单纯选npc还是，优先助战
        let finalPt = ptComCanClick[0]
        if (limit.justNPC || getPt(finalPt) < getPt(ptComCanClick[ptComCanClick.length - 1])) {
            finalPt = ptComCanClick[ptComCanClick.length - 1]
        }
        log("选择", finalPt)
        while (id("friendWrap").findOnce()) {
            sleep(1000)
            click(finalPt.bounds().centerX(), finalPt.bounds().centerY())
            sleep(2000)
        }
    }
}

function autoMain() {
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    waitForGameForeground(); //注意，函数里还有游戏区服的识别

    let druglimit = {
        drug1limit: limit.drug1num,
        drug2limit: limit.drug2num,
        drug3limit: limit.drug3num
    }
    while (true) {
        //开始
        //检测AP
        let apNow = detectAP();

        log("嗑药设置", limit.drug1, limit.drug2, limit.drug3)
        log("嗑药设置体力：", limit.limitAP)
        log("当前体力为" + apNow)
        if (!(!limit.drug1 && !limit.drug2 && !limit.drug3) && apNow <= parseInt(limit.limitAP)) {
            //嗑药
            refillAP();
        }
        //选择Pt最高的助战并点击
        pickSupportWithTheMostPt();

        // -----------开始----------------
        //开始按钮部分手机无法确定位置 需要改
        //国台服不同
        text(keywords.start[currentLang]).findOne()
        log("进入开始")
        while (text(keywords.start[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.start)
            sleep(3000)
        }
        log("进入战斗")
        //---------战斗------------------
        // 断线重连位置
        if (limit.isStable) {
            while (!id("ResultWrap").findOnce()) {
                sleep(3000)
                // 循环点击的位置为短线重连确定点
                screenutilClick(clickSets.reconection)
                sleep(2000)
            }
        }
        //------------开始结算-------------------
        id("ResultWrap").findOne()
        sleep(3000)

        while (!id("retryWrap").findOnce()) {
            //-----------如果有升级弹窗点击----------------------
            if (text(keywords.follow[currentLang]).findOnce()) {
                while (text(keywords.follow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(keywords.appendFollow[currentLang]).findOnce()) {
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

function autoMainver2() {
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    waitForGameForeground(); //注意，函数里还有游戏区服的识别

    let druglimit = {
        drug1limit: limit.drug1num,
        drug2limit: limit.drug2num,
        drug3limit: limit.drug3num
    }
    while (true) {
        //开始

        //检测AP
        let apNow = detectAP();

        log("嗑药设置", limit.drug1, limit.drug2, limit.drug3)
        log("嗑药设置体力：", limit.limitAP)
        log("当前体力为" + apNow)
        if (!(!limit.drug1 && !limit.drug2 && !limit.drug3) && apNow <= parseInt(limit.limitAP)) {
            //嗑药
            refillAP();
        }
        //----------------------------------
        log(limit.shuix, limit.shuiy)
        while (!text("确定").findOnce()) {
            sleep(1500)
            click(parseInt(limit.shuix), parseInt(limit.shuiy))
            sleep(1500)
        }

        while (text("确定").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.huodongok)
            sleep(1500)
        }

        //选择Pt最高的助战并点击
        pickSupportWithTheMostPt();

        // -----------开始----------------
        //开始按钮部分手机无法确定位置 需要改
        //国台服不同
        text(keywords.start[currentLang]).findOne()
        log("进入开始")
        while (text(keywords.start[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.start)
            sleep(3000)
        }
        log("进入战斗")
        //---------战斗------------------
        // 断线重连位置
        if (limit.isStable) {
            while (!id("ResultWrap").findOnce()) {
                sleep(3000)
                // 循环点击的位置为短线重连确定点
                screenutilClick(clickSets.reconection)
                sleep(2000)
            }
        }
        //------------开始结算-------------------
        id("ResultWrap").findOne()
        sleep(3000)

        while (id("ResultWrap").findOnce()) {
            //-----------如果有升级弹窗点击----------------------
            if (text(keywords.follow[currentLang]).findOnce()) {
                while (text(keywords.follow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(keywords.appendFollow[currentLang]).findOnce()) {
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
        //--------------skip--------------------------
        if (limit.isSkip) {
            while (!id("ap").findOnce()) {
                screenutilClick(clickSets.skip)
                sleep(4000)
            }
        }
    }
}
function jingMain() {
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    waitForGameForeground(); //注意，函数里还有游戏区服的识别

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
                if (limit.jjcisuse) {
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


function getPt(com) {
    let txt = com.text()
    return parseInt(txt.slice(1))
}
function getDrugNum(text) {
    return parseInt(text.slice(0, text.length - 1))
}

floatUI.adjust = function (config) {
    limit = config
    log("参数：", limit)
}

module.exports = floatUI;