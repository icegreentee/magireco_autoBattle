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

//申请截屏权限
//可能是AutoJSPro本身的问题，截图权限可能会突然丢失，logcat可见：
//VirtualDisplayAdapter: Virtual display device released because application token died: top.momoe.auto
//应该就是因为这个问题，截到的图是不正确的，会截到很长时间以前的屏幕（应该就是截图权限丢失前最后一刻的屏幕）
//猜测这个问题与转屏有关，所以尽量避免转屏（包括切入切出游戏）
var scrCapLock = threads.lock();
var canCaptureScreen = false;
var screenCapThread = null;
function startScreenCapture() {
    scrCapLock.lock();
    if (canCaptureScreen) {
        log("已经获取到截图权限了");
        return;
    }
    scrCapLock.unlock();

    var isThreadAlive = false;
    try {
        isThreadAlive = screenCapThread.isAlive();
    } catch(err) {
        isThreadAlive = false;
    }

    if (isThreadAlive) return;

    screenCapThread = threads.start(function() {
        let success = false;
        $settings.setEnabled("stop_all_on_volume_up", false);
        $settings.setEnabled("foreground_service", true);
        sleep(500);
        for (let attempt = 1; attempt <= 3; attempt++) {
            let screencap_landscape = true;
            if (requestScreenCapture(screencap_landscape)) {
                sleep(500);
                toastLog("获取截图权限成功。\n为避免截屏出现问题，请务必不要转屏，也不要切换出游戏");
                sleep(3000);
                toastLog("转屏可能导致截屏失败，请务必不要转屏，也不要切换出游戏×2");
                sleep(3000);
                success = true;
                break;
            } else {
                log("第", attempt, "次获取截图权限失败");
                sleep(1000);
            }
        }
        scrCapLock.lock();
        canCaptureScreen = success;
        scrCapLock.unlock();
        if (!success) {
            log("截图权限获取失败，退出");
            exit();
        }
    });

    return;
}
function waitUntilScreenCaptureReady() {
    while(true){
        sleep(500);
        scrCapLock.lock();
        if (!canCaptureScreen) {
            scrCapLock.unlock();
            //截图权限申请失败时会在screenCapThread里直接exit()
            continue;
        } else {
            scrCapLock.unlock();
            break;
        }
        sleep(500);
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
        if (limit.mirrorsUseScreenCapture) {
            toastLog("镜界周回启动 - 复杂策略")
        } else {
            toastLog("镜界周回启动 - 简单策略")
        }
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
    drug1: false,
    drug2: false,
    drug3: false,
    isStable: false,
    justNPC: false,
    isSkip: false,
    BPAutoRefill: false,
    mirrorsUseScreenCapture: false,
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


//有root权限的情况下解决Android 7.0以下不能按坐标点击的问题
function compatClick() {
    if (arguments.length != 2 || device.sdkInt >= 24) {
        //Android 7.0及以上，以及非坐标点击
        click.apply(this, arguments);
    } else if (arguments.length == 2) {
        //Android 7.0以下，需要root权限
        let coords = " " + arguments[0] + " " + arguments[1];
        coords = coords.match(/^ \d+ \d+$/)[0];
        let shellcmd = "input tap" + coords;
        let root = true;
        log("点击屏幕 root shell command: \""+shellcmd+"\"");
        shell(shellcmd, root);
    }
}

//检测AP
function detectAP() {
    while (true) {
        let detectAttempt = 0;
        log("开始检测ap");
        let IDEqualsAP = id("ap").find();
        if (IDEqualsAP.empty()) {
            log("没找到resource-id为\"ap\"的控件");
        } else {
            log("resource-id为\"ap\"的控件：", IDEqualsAP);
        }
        
        let knownApComCoords = {
            topLeft: {x: 880, y: 0, pos: "top"},
            bottomRight: {x: 1210, y: 120, pos: "top"}
        };
        let convertedApComCoords = {
            topLeft: convertCoords(knownApComCoords.topLeft),
            bottomRight: convertCoords(knownApComCoords.bottomRight)
        };
        let apComLikes = [];
        
        let apComLikesRegExp = [];
        let apComLikesAltRegExp = [];
        let apCom = null;
        let useDesc = {no: false, yes: true};
        for (let whether in useDesc) {
            log("useDesc:", whether);
            if (useDesc[whether]) {
                apComLikesRegExp = descMatches(/^\d+\/\d+$/).find();
                apComLikesAltRegExp = descMatches(/((^\/$)|(^\d+$))/).find();
            } else {
                apComLikesRegExp = textMatches(/^\d+\/\d+$/).find();
                apComLikesAltRegExp = textMatches(/((^\/$)|(^\d+$))/).find();
            }
            if (apComLikesRegExp.empty()) {
                log("正则/^\\d+\\/\\d+$/未匹配到AP控件");
            } else {
                log("正则/^\\d+\\/\\d+$/匹配到：", apComLikesRegExp);
            }
            if (apComLikesAltRegExp.empty()) {
                log("备用正则/^\\d+$/未匹配到AP控件");
            } else {
                log("备用正则/^\\d+$/匹配到：", apComLikesAltRegExp);
            }
        
            let arr = [apComLikesRegExp, apComLikesAltRegExp, IDEqualsAP]
            for (let arrindex in arr) {
                thisApComLikes = arr[arrindex];
                apComLikes = [];
                let sanity = false;
                let apMin = Number.MAX_SAFE_INTEGER-1;
                for (let i=0; i<thisApComLikes.length; i++) {
                    let apComLikeTop = thisApComLikes[i].bounds().top;
                    let apComLikeLeft = thisApComLikes[i].bounds().left;
                    let apComLikeBottom = thisApComLikes[i].bounds().bottom;
                    let apComLikeRight = thisApComLikes[i].bounds().right;
                    if (apComLikeTop >= convertedApComCoords.topLeft.y && apComLikeLeft >= convertedApComCoords.topLeft.x &&
                    apComLikeBottom <= convertedApComCoords.bottomRight.y && apComLikeRight <= convertedApComCoords.bottomRight.x) {
                        apComLikes.push(thisApComLikes[i]);
                        let apCom = thisApComLikes[i];
                        let apStr = "";
                        if (useDesc[whether]) {
                            apStr = apCom.desc();
                        } else {
                            apStr = apCom.text();
                        }
                        if (apStr.includes("/")) sanity = true; //即便AP控件拆开了，也至少应该可以找到一个斜杠
        
                        let apNum = Number.MAX_SAFE_INTEGER;
                        let ap = apStr.match(/\d+/);
                        if (ap != null) apNum = parseInt(ap[0]);
                        if (apNum < apMin) apMin = apNum;
                    } //end if
                }
                log("useDesc", whether, "arrindex", arrindex, "在坐标范围内的控件", apComLikes);
                log("apMin", apMin);
                if (sanity && apMin < Number.MAX_SAFE_INTEGER - 2) return apMin;
            }// end for (iteration)
        }//end for (useDesc)
        log("检测AP失败，等待1秒后重试...");
        sleep(1000);
        detectAttempt++;
        if (detectAttempt > 300) {
            log("超过5分钟没有成功检测AP，退出");
            exit();
        }
    } //end while
    throw "detectAPFailed" //should never reach here
}//end function

//嗑药
function refillAP() {
    //打开ap面板
    log("开启嗑药面板")
    //确定要嗑药后等3s，打开面板
    while (!id("popupInfoDetailTitle").findOnce()) {
        sleep(1000)
        screenutilClick(clickSets.ap)
        sleep(2000)
    }
    let apDrugNums = textMatches(/^\d+個$/).find()
    if (apDrugNums.empty()) {
        apDrugNums = descMatches(/^\d+個$/).find()
    }
    if (currentLang == "chs") {
        apDrugNums = textMatches(/^\d+个$/).find()
        if (apDrugNums.empty()) {
            apDrugNums = descMatches(/^\d+个$/).find()
        }
    }
    //获得回复药水数量
    let readDesc = false;
    let apDrug50txt = apDrugNums[0].text();
    if (apDrug50txt == null) readDesc = true;
    if (apDrug50txt == "") readDesc = true;
    let apDrug50Num = 0
    let apDrugFullNum = 0
    let apMoneyNum = 0;
    if (readDesc) {
        apDrug50Num = getDrugNum(apDrugNums[0].desc())
        apDrugFullNum = getDrugNum(apDrugNums[1].desc())
        apMoneyNum = getDrugNum(apDrugNums[2].desc())
    } else {
        apDrug50Num = getDrugNum(apDrugNums[0].text())
        apDrugFullNum = getDrugNum(apDrugNums[1].text())
        apMoneyNum = getDrugNum(apDrugNums[2].text())
    }
    log("药数量分别为", apDrug50Num, apDrugFullNum, apMoneyNum)
    // 根据条件选择药水

    if (apDrug50Num > 0 && limit.drug1 && druglimit.drug1limit != "0") {
        if (druglimit.drug1limit) {
            druglimit.drug1limit = (parseInt(druglimit.drug1limit) - 1) + ""
        }
        while ((!text(keywords.confirmRefill[currentLang]).findOnce())&&(!desc(keywords.confirmRefill[currentLang]).findOnce())) {
            sleep(1000)
            screenutilClick(clickSets.ap50)
            sleep(2000)
        }
        while ((!text(keywords.refill[currentLang]).findOnce())&&(!desc(keywords.refill[currentLang]).findOnce())) {
            sleep(1000);
        }
        sleep(1500)
        log("确认回复")
        while (text(keywords.confirmRefill[currentLang]).findOnce()||desc(keywords.confirmRefill[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.aphui)
            sleep(2000)
        }
    } else if (apDrugFullNum > 0 && limit.drug2 && druglimit.drug2limit != "0") {
        if (druglimit.drug2limit) {
            druglimit.drug2limit = (parseInt(druglimit.drug2limit) - 1) + ""
        }
        while ((!text(keywords.confirmRefill[currentLang]).findOnce())&&(!desc(keywords.confirmRefill[currentLang]).findOnce())) {
            sleep(1000)
            screenutilClick(clickSets.apfull)
            sleep(2000)
        }
        while ((!text(keywords.refill[currentLang]).findOnce())&&(!desc(keywords.refill[currentLang]).findOnce())) {
            sleep(1000);
        }
        sleep(1500)
        log("确认回复")
        while (text(keywords.confirmRefill[currentLang]).findOnce()||desc(keywords.confirmRefill[currentLang]).findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.aphui)
            sleep(2000)
        }
    }
    else if (apMoneyNum > 5 && limit.drug3 && druglimit.drug3limit != "0") {
        if (druglimit.drug3limit) {
            druglimit.drug3limit = (parseInt(druglimit.drug3limit) - 1) + ""
        }
        while ((!text(keywords.confirmRefill[currentLang]).findOnce())&&(!desc(keywords.confirmRefill[currentLang]).findOnce())) {
            sleep(1000)
            screenutilClick(clickSets.apjin)
            sleep(2000)
        }
        while ((!text(keywords.refill[currentLang]).findOnce())&&(!desc(keywords.refill[currentLang]).findOnce())) {
            sleep(1000);
        }
        sleep(1500)
        log("确认回复")
        while (text(keywords.confirmRefill[currentLang]).findOnce()||desc(keywords.confirmRefill[currentLang]).findOnce()) {
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
} //end function

//选择Pt最高的助战
function pickSupportWithTheMostPt() {
    log("选择助战")
    // -----------选援助----------------
    // 15为npc助战  0~14为玩家助战
    // Pt数值控件显示范围
    let knownPtArea = {
      topLeft: {x: 1680, y: 280, pos: "top"},
      bottomRight: {x: 1870, y: 1079, pos: "bottom"}
    };
    let ptArea = {
      topLeft: {x: 0, y: 0, pos: "top"},
      bottomRight: {x: 0, y: 0, pos: "bottom"}
    };
    ptArea.topLeft = convertCoords(knownPtArea.topLeft);
    ptArea.bottomRight = convertCoords(knownPtArea.bottomRight);
    log("ptAreatopLeft", ptArea.topLeft.x, ptArea.topLeft.y);
    log("ptAreabottomRight", ptArea.bottomRight.x, ptArea.bottomRight.y);
    let ptCom = textMatches(/^\+{0,1}\d+$/).find();
    if (ptCom.empty()) ptCom = descMatches(/^\+{0,1}\d+$/).find();
    //可见的助战列表
    let ptComVisible = [];
    let ptComCanClick = [];
    var highestPt = 0;
    for (let i = 0; i < ptCom.length; i++) {
        //在可见范围内
        if (ptCom[i].bounds().centerX() > ptArea.topLeft.x && ptCom[i].bounds().centerX() < ptArea.bottomRight.x &&
            ptCom[i].bounds().centerY() > ptArea.topLeft.y && ptCom[i].bounds().centerY() < ptArea.bottomRight.y) {
            //找到最大pt值
            if (highestPt < getPt(ptCom[i])) highestPt = getPt(ptCom[i]);
            ptComVisible.push(ptCom[i])
            log(ptCom[i].bounds())
        }
    }
    log("可见助战列表", ptComVisible);
    log("从可见助战列表中筛选最高Pt的助战，并按照显示位置排序");
    for (let i = 0; i < ptComVisible.length; i++) {
        if (getPt(ptComVisible[i]) == highestPt) {
            ptComCanClick.push(ptComVisible[i]);
        }
    }
    //根据助战Y坐标排序，最上面的NPC排到前面 （这个排序算法很烂，不过元素少，无所谓）
    for (let i = 0; i < ptComCanClick.length - 1; i++) {
        for (let j = i + 1; j < ptComCanClick.length; j++) {
            if (ptComCanClick[j].bounds().centerY() < ptComCanClick[i].bounds().centerY()) {
                let tempPtCom = ptComCanClick[i];
                ptComCanClick[i] = ptComCanClick[j];
                ptComCanClick[j] = tempPtCom;
            }
        }
    }
    log("候选助战列表", ptComCanClick);
    // 是单纯选npc还是，优先助战
    if (limit.justNPC) {
        log("justNPC==true");
        finalPt = ptComCanClick[0];
    } else {
        finalPt = ptComCanClick[ptComCanClick.length - 1];
    }
    log("选择", finalPt)
    return finalPt;
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

        while (!id("friendWrap").findOnce()) {
            log("等待好友列表控件出现...");
            sleep(1000);
        }
        while (id("friendWrap").findOnce()) {
            //选择Pt最高的助战点击
            finalPt = pickSupportWithTheMostPt();
            compatClick(finalPt.bounds().centerX(), finalPt.bounds().centerY())
            sleep(2000)
        }

        // -----------开始----------------
        //开始按钮部分手机无法确定位置 需要改
        //国台服不同
        while ((!text(keywords.start[currentLang]).findOnce())&&(!desc(keywords.start[currentLang]).findOnce())) {
            sleep(1000);
        }
        log("进入开始")
        while (text(keywords.start[currentLang]).findOnce()||desc(keywords.start[currentLang]).findOnce()) {
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
            if (text(keywords.follow[currentLang]).findOnce()||desc(keywords.follow[currentLang]).findOnce()) {
                while (text(keywords.follow[currentLang]).findOnce()||desc(keywords.follow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(keywords.appendFollow[currentLang]).findOnce()||desc(keywords.appendFollow[currentLang]).findOnce()) {
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
        while ((!text("确定").findOnce())&&(!desc("确定").findOnce())) {
            sleep(1500)
            compatClick(parseInt(limit.shuix), parseInt(limit.shuiy))
            sleep(1500)
        }

        while (text("确定").findOnce()||desc("确定").findOnce()) {
            sleep(1000)
            screenutilClick(clickSets.huodongok)
            sleep(1500)
        }

        while (!id("friendWrap").findOnce()) {
            log("等待好友列表控件出现...");
            sleep(1000);
        }
        while (id("friendWrap").findOnce()) {
            //选择Pt最高的助战点击
            finalPt = pickSupportWithTheMostPt();
            compatClick(finalPt.bounds().centerX(), finalPt.bounds().centerY())
            sleep(2000)
        }

        // -----------开始----------------
        //开始按钮部分手机无法确定位置 需要改
        //国台服不同
        while ((!text(keywords.start[currentLang]).findOnce())&&(!desc(keywords.start[currentLang]).findOnce())){
            sleep(1000);
        }
        log("进入开始")
        while (text(keywords.start[currentLang]).findOnce()||desc(keywords.start[currentLang]).findOnce()) {
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
            if (text(keywords.follow[currentLang]).findOnce()||desc(keywords.follow[currentLang]).findOnce()) {
                while (text(keywords.follow[currentLang]).findOnce()||desc(keywords.follow[currentLang]).findOnce()) {
                    sleep(1000)
                    screenutilClick(clickSets.yesfocus)
                    sleep(3000)
                }
                while (text(keywords.appendFollow[currentLang]).findOnce()||desc(keywords.appendFollow[currentLang]).findOnce()) {
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


//镜界自动战斗

//已知参照图像，包括A/B/C盘等
var knownImgs = {
    accel: images.read("./images/accel.png"),
    blast: images.read("./images/blast.png"),
    charge: images.read("./images/charge.png"),
    connectIndicator: images.read("./images/connectIndicator.png"),
    connectIndicatorBtnDown: images.read("./images/connectIndicatorBtnDown.png"),
    HPBarRightEdge: images.read("./images/HPBarRightEdge.png"),
    mirrorsWinLetterI: images.read("./images/mirrorsWinLetterI.png"),
    mirrorsLose: images.read("./images/mirrorsLose.png")
};


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
    HPBarRightEdge: {
        topLeft: {
            x:   1188,
            y:   282,
            pos: "center"
        },
        bottomRight: {
            x:   1191,
            y:   291,
            pos: "center"
        }
    },
    floor: {
        topLeft: {
            x:   1025,
            y:   529,
            pos: "center"
        },
        bottomRight: {
            x:   1114,
            y:   567,
            pos: "center"
        }
    },
    //r1c1x: 1090, r1c1y: 280,
    //r2c1x: 1165, r2c1y: 383,
    //r2c2x: 1420, r2c2y: 383,
    distancex: 1420-1165,
    distancey: 383-280,
    indent: 1165-1090
}

//我方阵地信息
var ourBattleField = {
    topRow: {
        left: {
            occupied: false,
            charaID: -1
        },
        middle: {
            occupied: false,
            charaID: -1
        },
        right: {
            occupied: false,
            charaID: -1
        }
    },
    middleRow: {
        left: {
            occupied: false,
            charaID: -1
        },
        middle: {
            occupied: false,
            charaID: -1
        },
        right: {
            occupied: false,
            charaID: -1
        }
    },
    bottomRow: {
        left: {
            occupied: false,
            charaID: -1
        },
        middle: {
            occupied: false,
            charaID: -1
        },
        right: {
            occupied: false,
            charaID: -1
        }
    }
};
var rows = ["topRow", "middleRow", "bottomRow"];
var columns = ["left", "middle", "right"];
var rowsNum = {topRow: 0, middleRow: 1, bottomRow: 2};
var columnsNum = {left: 0, middle: 1, right: 2};


//获取换算后的角色站位所需部分（血条右边框，地板等等）坐标
function getStandPointCoords(row, column, part, corner) {
    var convertedCoords = {
        x:   0,
        y:   0,
        pos: "bottom"
    };
    var knownCoords = knownFirstStandPointCoords[part][corner];
    var distancex = knownFirstStandPointCoords.distancex;
    var distancey = knownFirstStandPointCoords.distancey;
    var indent = knownFirstStandPointCoords.indent;
    convertedCoords.x = knownCoords.x + row * indent + distancex * column;
    convertedCoords.y = knownCoords.y + row * distancey;
    convertedCoords.pos = knownCoords.pos;
    return convertCoords(convertedCoords);
}
function getStandPointArea(row, column, part) {
    var result = {
        topLeft:     getStandPointCoords(row, column, part, "topLeft"),
        bottomRight: getStandPointCoords(row, column, part, "bottomRight"),
    };
    return result;
}

//截取指定站位所需部分的图像
function getStandPointImg(screenshot, row, column, part) {
    var area = getStandPointArea(row, column, part);
    return images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area));
}

//判断某个站位有没有人（根据是否显示血条右边缘）
function isStandPointOccupied(screenshot, row, column) {
    var img = getStandPointImg(screenshot, row, column, "HPBarRightEdge");
    var similarity = images.getSimilarity(knownImgs.HPBarRightEdge, img, {"type": "MSSIM"});
    if (similarity > 2.4) {
        log("第", row+1, "行，第", column+1, "列站位【有】人 MSSIM=", similarity);
        return true;
    }
    log("第", row+1, "行，第", column+1, "列站位无人 MSSIM=", similarity);
    return false;
}

//扫描我方战场信息
function scanOurBattleField()
{
    var screenshot = compatCaptureScreen();
    for(let i=0; i<3; i++) {
        for(let j=0; j<3; j++) {
            ourBattleField[rows[i]][columns[j]].occupied = isStandPointOccupied(screenshot, i, j);
            ourBattleField[rows[i]][columns[j]].charaID = -1; //现在应该还不太能准确识别，所以统一填上无意义数值，在发动连携后会填上有意义的数值
        }
    }
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
        action:      "accel",
        charaImg:    null,
        charaID:     0,
        connectable: false,
        connectTo:   -1
    },
    {
        position:    1,
        priority:    "second",
        action:      "accel",
        charaImg:    null,
        charaID:     1,
        connectable: false,
        connectTo:   -1
    },
    {
        position:    2,
        priority:    "third",
        action:      "accel",
        img:         null,
        charaImg:    null,
        charaID:     2,
        connectable: false,
        connectTo:   -1
    },
    {
        position:    3,
        priority:    "fourth",
        action:      "accel",
        charaImg:    null,
        charaID:     3,
        connectable: false,
        connectTo:   -1
    },
    {
        position:    4,
        priority:    "fifth",
        action:      "accel",
        charaImg:    null,
        charaID:     4,
        connectable: false,
        connectTo:   -1
    }
];
var clickedDisksCount = 0;

var ordinalWord = ["first", "second", "third", "fourth", "fifth"];
var ordinalNum = {first: 0, second: 1, third: 2, fourth: 3};
var diskActions = ["accel", "blast", "charge"];

function logDiskInfo(disk) {
    let connectableStr = "不可连携";
    if (disk.connectable) connectableStr = "【连携】";
    log("第", disk.position+1, "号盘", disk.action, "角色", disk.charaID, connectableStr, "要连携到角色", disk.connectTo);

}

//获取换算后的行动盘所需部分（A/B/C盘，角色头像，连携指示灯等）的坐标
function getDiskCoords(diskPos, part, corner) {
    var convertedCoords = {
        x:   0,
        y:   0,
        pos: "bottom"
    };
    var knownCoords = knownFirstDiskCoords[part][corner];
    var distance = knownFirstDiskCoords.distance;
    convertedCoords.x = knownCoords.x + diskPos * distance;
    convertedCoords.y = knownCoords.y;
    convertedCoords.pos = knownCoords.pos;
    return convertCoords(convertedCoords);
}
function getDiskArea(diskPos, part) {
    var result = {
        topLeft:     getDiskCoords(diskPos, part, "topLeft"),
        bottomRight: getDiskCoords(diskPos, part, "bottomRight"),
    };
    return result;
}

//截取行动盘所需部位的图像
function getDiskImg(screenshot, diskPos, part) {
    var area = getDiskArea(diskPos, part);
    return images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area));
}

//识别ABC盘
function recognizeDiskAction_(actionImg, threshold) {
    var maxSimilarity = -1.0;
    var mostSimilar = 0;
    for (let i=0; i<diskActions.length; i++) {
        var refImg = knownImgs[diskActions[i]];
        var similarity = images.getSimilarity(refImg, actionImg, {"type": "MSSIM"});
        log("与", diskActions[i], "盘的相似度 MSSIM=", similarity);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mostSimilar = i;
        }
    }
    if (maxSimilarity < threshold) {
        log("MSSIM=", maxSimilarity, "小于阈值=", threshold, "无法识别ABC盘");
        throw "recognizeDiskActionLowerThanThreshold"
    }
    log("识别为", diskActions[mostSimilar], "盘 MSSIM=", maxSimilarity);
    return diskActions[mostSimilar];
}
function recognizeDiskAction(actionImg) {
    var result = "accel";
    switch (arguments.length) {
    case 1:
        try {
            result = recognizeDiskAction_(actionImg, 0.5);
        } catch(err) {
            log("当作accel盘，继续运行");
            result = "accel";
        }
        break;
    case 2:
        threshold = arguments[1];
        result = recognizeDiskAction_(actionImg, threshold);
        break;
    default:
        throw "recognizeDiskActionArgcIncorrect"
    }
    return result;
}

//返回ABC盘识别结果
function getDiskAction(screenshot, diskPos) {
    var actionImg = getDiskImg(screenshot, diskPos, "action");
    log("识别第", diskPos+1, "盘的A/B/C类型...");
    return allActionDisks[diskPos].action = recognizeDiskAction(actionImg);
}

//截取盘上的角色头像
function getDiskCharaImg(screenshot, diskPos) {
    return getDiskImg(screenshot, diskPos, "charaImg");
}

//判断盘是否可以连携
function isDiskConnectable(screenshot, diskPos) {
    var img = getDiskImg(screenshot, diskPos, "connectIndicator");
    var similarity = images.getSimilarity(knownImgs.connectIndicator, img, {"type": "MSSIM"});
    if (similarity > 2.1) {
        log("第", diskPos+1, "号盘【可以连携】，MSSIM=", similarity);
        return true;
    }
    similarity = images.getSimilarity(knownImgs.connectIndicatorBtnDown, img, {"type": "MSSIM"});
    if (similarity > 2.1) {
        log("第", diskPos+1, "号盘可以连携，并且已经被按下，MSSIM=", similarity);
        return false; //只剩下一个人，无法连携时的识别结果是一样的，只能返回false避免误识别
        //已经按下的连携盘也不应再点击（会取消），所以也应该返回false。需要用来判断连携是否完成时，应该用isConnectableDiskDown()函数
    }
    log("第", diskPos+1, "号盘不能连携，MSSIM=", similarity);
    return false;
}

//判断连携盘是否成功按下
function isConnectableDiskDown(screenshot, diskPos) {
    var img = getDiskImg(screenshot, diskPos, "connectIndicator");
    similarity = images.getSimilarity(knownImgs.connectIndicatorBtnDown, img, {"type": "MSSIM"});
    if (similarity > 2.1) {
        log("第", diskPos+1, "号连携盘处于【按下】状态，MSSIM=", similarity);
        return true;
    }
    var similarity = images.getSimilarity(knownImgs.connectIndicator, img, {"type": "MSSIM"});
    if (similarity > 2.1) {
        log("第", diskPos+1, "号连携盘处于没有按下的状态，MSSIM=", similarity);
        return false;
    }
    log("第", diskPos+1, "号盘不像是连携盘，MSSIM=", similarity);
    return false;
}

//判断两个盘是否是同一角色
function areDisksSimilar(screenshot, diskAPos, diskBPos) {
    var diskA = allActionDisks[diskAPos];
    var diskB = allActionDisks[diskBPos];
    var imgA = diskA.charaImg;
    var imgB = diskB.charaImg;
    if (imgA == null) imgA = getDiskImg(screenshot, diskAPos, "charaImg");
    if (imgB == null) imgB = getDiskImg(screenshot, diskBPos, "charaImg");
    var similarity = images.getSimilarity(imgA, imgB, {"type": "MSSIM"});
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
        allActionDisks[i].action = "accel";
        allActionDisks[i].charaImg = null;
        allActionDisks[i].charaID = i;
        allActionDisks[i].connectable = false;
        allActionDisks[i].connectTo = -1;
    }
    clickedDisksCount = 0;

    //截屏，对盘进行识别
    var screenshot = compatCaptureScreen();
    for (let i=0; i<allActionDisks.length; i++) {
        var disk = allActionDisks[i];
        disk.action = getDiskAction(screenshot, i);
        disk.charaImg = getDiskCharaImg(screenshot, i);
        disk.connectable = isDiskConnectable(screenshot, i);
    }
    //分辨不同的角色，用charaID标记
    for (let i=0; i<allActionDisks.length-1; i++) {
        var diskI = allActionDisks[i];
        for (let j=i+1; j<allActionDisks.length; j++) {
            var diskJ = allActionDisks[j];
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

//找出第一个可以给出连携的盘
function getFirstConnectableDisk(disks) {
    for (let i=0; i<disks.length; i++) {
        var disk = disks[i];
        if (disk.connectable) return disk;
    }
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

//返回优先第N个点击的盘
function getDiskByPriority(disks, priority) {
    for (let i=0; i<disks.length; i++) {
        disk = disks[i];
        if (disk.priority == priority) return disk;
    }
}

//选盘，实质上是把选到的盘在allActionDisks数组里排到前面
function prioritiseDisks(disks) {
    let replaceDiskAtThisPriority = clickedDisksCount;
    for (let i=0; i<disks.length; i++) {
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
    for (let i=0; i<allActionDisks.length; i++) {
        logDiskInfo(allActionDisks[i]);
    }
}


//进行连携
function connectDisk(fromDisk) {
    isConnectDone = false;
    for (let row=0; row<3; row++) {
        for (let column=0; column<3; column++) {
            if (ourBattleField[rows[row]][columns[column]].occupied) {
                //找到有人的站位
                log("从", fromDisk.position+1, "盘向第", row+1, "行第", column+1, "列站位进行连携");
                var src = getAreaCenter(getDiskArea(fromDisk.position, "charaImg"));
                var dst = getAreaCenter(getStandPointArea(row, column, "floor"));
                //连携划动
                swipe(src.x, src.y, dst.x, dst.y, 1000);
                sleep(1000);
                if (isConnectableDiskDown(compatCaptureScreen(), fromDisk.position)) {
                    log("连携动作完成");
                    clickedDisksCount++;
                    isConnectDone = true;
                    break;
                } else {
                    log("连携动作失败，可能是因为连携到了自己身上");
                    //以后也许可以改成根据按下连携盘后地板是否发亮来排除自己
                }
            }
        }
        if (isConnectDone) break;
    }
}

//点击行动盘
function clickDisk(disk) {
    log("点击第", disk.position+1, "号盘");
    var point = getAreaCenter(getDiskArea(disk.position, "charaImg"));
    compatClick(point.x, point.y);
    sleep(1000);
    log("点击动作完成");
    clickedDisksCount++;
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
    }
};

//获取换算后的行动盘所需部分（A/B/C盘，角色头像，连携指示灯等）的坐标
function getFirstSelectedConnectedDiskCoords(corner) {
    var convertedCoords = {
        x:   0,
        y:   0,
        pos: "bottom"
    };
    var knownCoords = knownFirstSelectedConnectedDiskCoords[corner];
    convertedCoords.x = knownCoords.x;
    convertedCoords.y = knownCoords.y;
    convertedCoords.pos = knownCoords.pos;
    return convertCoords(convertedCoords);
}
function getFirstSelectedConnectedDiskArea() {
    var result = {
        topLeft:     getFirstSelectedConnectedDiskCoords("topLeft"),
        bottomRight: getFirstSelectedConnectedDiskCoords("bottomRight"),
    };
    return result;
}

//截取行动盘所需部位的图像
function getFirstSelectedConnectedDiskImg(screenshot) {
    var area = getFirstSelectedConnectedDiskArea();
    return images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area));
}

//返回接到连携的角色
function getConnectAcceptorCharaID(fromDisk) {
    var screenshot = compatCaptureScreen();
    var imgA = getFirstSelectedConnectedDiskImg(screenshot);

    var max = 0;
    var maxSimilarity = -1.0;
    for (let diskPos = 0; diskPos < allActionDisks.length; diskPos++) {
        var imgB = getDiskImg(screenshot, diskPos, "charaImg");
        var area = getFirstSelectedConnectedDiskArea();
        var imgBshrunk = images.resize(imgB, [getAreaWidth(area), getAreaHeight(area)]);
        var similarity = images.getSimilarity(imgA, imgBshrunk, {"type": "MSSIM"});
        log("比对第", diskPos+1, "号盘与屏幕上方的第一个盘的连携接受者 MSSIM=", similarity);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            max = diskPos;
        }
    }
    log("比对结束，与第", max+1, "号盘最相似，charaID=", allActionDisks[max].charaID, "MSSIM=", maxSimilarity);
    if (allActionDisks[max].charaID == fromDisk.charaID) {
        log("识图比对结果有误，和连携发出角色相同");
        for (let diskPos = 0; diskPos < allActionDisks.length; diskPos++) {
            if (allActionDisks[diskPos].charaID != fromDisk.charaID) {
                log("为避免问题，返回另一位不同的角色 charaID=", allActionDisks[diskPos].charaID);
                return allActionDisks[diskPos].charaID;
            }
        }
    }
    return allActionDisks[max].charaID;
}


//等待己方回合
function waitForOurTurn() {
    var result = false;
    log("等待己方回合...");
    var diskAppearedCount = 0;
    var cycles = 0;
    while(true) {
        cycles++;
        var screenshot = compatCaptureScreen();
        if (id("ArenaResult").findOnce()) {
        //不再通过识图判断战斗是否结束
        //if (didWeWin(screenshot) || didWeLose(screenshot)) {
            log("战斗已经结束，不再等待我方回合");
            result = false;
            break;
        }
        var diskAppeared = true;
        var img = getDiskImg(screenshot, 0, "action");
        if (img != null) {
            log("已截取第一个盘的动作图片");
         } else {
            log("截取第一个盘的动作图片时出现问题");
         }
        try {
            recognizeDiskAction(img, 2.1);
        } catch(e) {
            if (e.toString() != "recognizeDiskActionLowerThanThreshold") log(e);
            diskAppeared = false;
        }
        if (diskAppeared) {
            log("出现我方行动盘");
            diskAppearedCount++;
        } else {
            log("未出现我方行动盘");
            diskAppearedCount = 0;
        }
        if (diskAppearedCount >= 5) {
            log("已来到己方回合");
            result = true;
            break;
        }
        if(cycles>300*5) {
            log("等待己方回合已经超过10分钟，结束运行");
            exit();
        }
        sleep(200);
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
    return knownMirrorsWinLoseCoords[winOrLose];
}
function getMirrorsWinLoseCoords(winOrLose, corner) {
    var knownArea = getMirrorsWinLoseArea(winOrLose);
    return convertCoords(knownArea.corner);
}
function getMirrorsWinLoseImg(screenshot, winOrLose) {
    var area = getMirrorsWinLoseArea(winOrLose);
    return images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area));
}
function didWeWinOrLose(screenshot, winOrLose) {
    //结算页面有闪光，会干扰判断，但是只会产生假阴性，不会出现假阳性
    var imgA = knownImgs[winOrLose];
    var imgB = getMirrorsWinLoseImg(screenshot, winOrLose);
    var similarity = images.getSimilarity(imgA, imgB, {"type": "MSSIM"});
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
    while (id("ArenaResult").findOnce()) {
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
        screenutilClick(screenCenter);
        sleep(1000);
    }
}


//放缩参考图像以适配当前屏幕分辨率
for (let imgName in knownImgs) {
    var newsize = [0, 0];
    var area = null;
    if (imgName == "accel" || imgName == "blast" || imgName == "charge") {
        area = knownFirstDiskCoords["action"];
    } else if (imgName == "connectIndicatorBtnDown") {
        area = knownFirstDiskCoords["connectIndicator"];
    } else {
        area = knownFirstStandPointCoords[imgName];
        if (area == null) area = knownFirstDiskCoords[imgName];
        if (area == null) area = knownMirrorsWinLoseCoords[imgName];
    }
    if (area != null) {
        log("缩放图片 imgName", imgName, "area", area);
        var resizedImg = images.resize(knownImgs[imgName], [getAreaWidth(area), getAreaHeight(area)]);
        knownImgs[imgName] = resizedImg;
    } else {
        log("缩放图片出错 imgName", imgName);
    }
}


function mirrorsSimpleAutoBattleMain() {
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    waitForGameForeground(); //注意，函数里还有游戏区服的识别

    //简单镜层自动战斗
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

function mirrorsAutoBattleMain() {
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    waitForGameForeground(); //注意，函数里还有游戏区服的识别
    startScreenCapture();
    waitUntilScreenCaptureReady();

    //利用截屏识图进行稍复杂的自动战斗（比如连携）
    //开始一次镜界自动战斗
    turn = 0;
    while(true) {
        if(!waitForOurTurn()) break;
        //我的回合，抽盘
        turn++;

        //扫描行动盘和己方战场信息
        scanDisks();
        scanOurBattleField();

        //在所有盘中找第一个能连携的盘
        var connectableDisk = null;
        connectableDisk = getFirstConnectableDisk(allActionDisks);

        if (connectableDisk != null) {
            //如果有连携，第一个盘上连携
            prioritiseDisks([connectableDisk]); //将当前连携盘从选盘中排除
            connectDisk(connectableDisk);
            //判断接连携的角色是谁
            var connectAcceptorCharaID = getConnectAcceptorCharaID(connectableDisk);
            //上连携后，尽量用接连携的角色
            var connectAcceptorDisks = findDisksByCharaID(allActionDisks, connectAcceptorCharaID);
            prioritiseDisks(connectAcceptorDisks);
            //连携的角色尽量打出Blast Combo
            var blastDisks = findSameActionDisks(connectAcceptorDisks, "blast");
            prioritiseDisks(blastDisks);
        } else {
            //没有连携
            //先找Puella Combo
            var sameCharaDisks = findSameCharaDisks(allActionDisks);
            prioritiseDisks(sameCharaDisks);
            //Pcombo内尽量Blast Combo
            var blastDisks = findSameActionDisks(sameCharaDisks, "blast");
            prioritiseDisks(blastDisks);
        }

        //完成选盘，有连携就点完剩下两个盘；没连携就点完三个盘
        for (let i=clickedDisksCount; i<3; i++) {
            clickDisk(getDiskByPriority(allActionDisks, ordinalWord[i]));
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
}


function jingMain() {
    //强制必须先把游戏切换到前台再开始运行脚本，否则退出
    waitForGameForeground(); //注意，函数里还有游戏区服的识别
    if (limit.mirrorsUseScreenCapture) {
        startScreenCapture();
        waitUntilScreenCaptureReady();
    }

    while (true) {
        let matchWrap = id("matchingWrap").findOne().bounds()
        while (!id("battleStartBtn").findOnce()) {
            sleep(1000)
            compatClick(matchWrap.centerX(), matchWrap.bottom - 50)
            sleep(2000)
        }
        let btn = id("battleStartBtn").findOne().bounds()
        while (id("battleStartBtn").findOnce()) {
            sleep(1000)
            compatClick(btn.centerX(), btn.centerY())
            sleep(1000)
            if (id("popupInfoDetailTitle").findOnce()) {
                if (limit.BPAutoRefill) {
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
                    log("镜层周回结束")
                    return;
                }
            }
            sleep(1000)
        }
        log("进入战斗")
        if (limit.mirrorsUseScreenCapture) {
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


function getPt(com) {
    let txt = com.text()
    if (txt==null) txt = com.desc();
    if (txt=="") txt = com.desc();
    return parseInt(txt.match(/\d+/)[0]);
}
function getDrugNum(text) {
    return parseInt(text.match(/\d+/)[0]);
}

floatUI.adjust = function (config) {
    limit = config
    log("参数：", limit)
    if (limit.mirrorsUseScreenCapture) {
        log("镜层自动战斗使用截屏识图");
    } else {
        log("镜层使用简单自动战斗");
    }
}

module.exports = floatUI;