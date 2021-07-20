//设置界面模块

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var settingsUI = {};
var MODULES = {};


importClass(android.view.View)
importClass(android.graphics.Color)
importClass(android.view.MenuItem)
importClass(com.stardust.autojs.project.ProjectConfig)
importClass(com.stardust.autojs.core.ui.inflater.util.Ids)
importClass(Packages.androidx.core.graphics.drawable.DrawableCompat)
importClass(Packages.androidx.appcompat.content.res.AppCompatResources)

//注意:这个函数只会返回打包时的版本，而不是在线更新后的版本！
function getProjectVersion() {
    var conf = ProjectConfig.Companion.fromProjectDir(engines.myEngine().cwd());
    if (conf) return conf.versionName;
}

//将会被长久保存的设置参数
const persistParamList = [
    "foreground",
    "stopOnVolUp",
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
settingsUI.persistParamList = persistParamList;

//不会被长久保存、完全退出后就会恢复默认值的设置参数
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
settingsUI.tempParamList = tempParamList;

function init() { ui.run(function () {
    //在传入版本号appVersion、已加载模块列表MODULES之后,init函数才会执行
    MODULES = settingsUI.MODULES;

    var Name = "AutoBattle";
    var version = settingsUI.appVersion;
    var appName = Name + " v" + version;

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
                            <Switch id="autoService" margin="0 3" w="*" checked="{{auto.service != null}}" textColor="#666666" text="无障碍服务" />
                            <Switch id="exitOnServiceSettings" margin="0 3" w="*" checked="false" textColor="#666666" text="修正OPPO手机拒绝开启无障碍服务" />
                            <text id="fixOPPOtext1" visibility="gone" textSize="12" text="如果不是OPPO则不建议打开这个选项" textColor="#666666" />
                            <text id="fixOPPOtext2" visibility="gone" textSize="12" text="OPPO等部分品牌的手机在有悬浮窗(比如“加速球”)存在时会拒绝开启无障碍服务" textColor="#666666" />
                            <text id="fixOPPOtext3" visibility="gone" textSize="12" text="启用这个选项后，在弹出无障碍设置时，脚本会完全退出、从而关闭悬浮窗来避免触发这个问题" textColor="#666666" />
                            <text id="fixOPPOtext4" visibility="gone" textSize="12" text="与此同时请关闭其他有悬浮窗的应用(简单粗暴的方法就是清空后台)以确保无障碍服务可以顺利开启" textColor="#666666" />
                            <Switch id="foreground" margin="0 3" w="*" textColor="#000000" text="前台服务（常被鲨进程可以开启，按需）" />
                            <Switch id="stopOnVolUp" margin="0 3" w="*" textColor="#000000" text="按音量上键完全退出脚本" />
                        </vertical>

                        <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                            <text text="全局设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                            <vertical padding="10 6 0 6" w="*" h="auto">
                                <linear margin="0 3">
                                    <text text="默认执行脚本" layout_weight="1" layout_gravity="center_vertical" textColor="#000000" />
                                    <spinner id="default" h="auto" gravity="right" textSize="14" textColor="#000000" entries="{{MODULES.floatUI.scripts.map(x=>x.name).join('|')}}" />
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
                            <vertical id="DefaultExtraSettings1" visibility="gone" padding="0 8 0 0" w="*" h="auto">
                                <Switch id="autoFollow" w="*" margin="0 3" checked="true" textColor="#000000" text="自动关注路人" />
                                <text text="启用后如果助战选到了路人,会在结算时关注他。停用这个选项则不会关注路人,在结算时如果出现询问关注的弹窗,会直接关闭。" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultExtraSettings2" visibility="gone" padding="0 8 0 0" w="*" h="auto">
                                <linear>
                                    <text text="每隔" textColor="#000000" />
                                    <input maxLength="5" id="breakAutoCycleDuration" hint="留空即不打断" text="" textSize="14" inputType="number|none" />
                                    <text text="秒打断官方自动续战" textColor="#000000" />
                                </linear>
                                <text text="经过设定的秒数后,长按打断官方自动周回" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultExtraSettings3" visibility="gone" padding="0 8 0 0" w="*" h="auto">
                                <linear>
                                    <text text="假死检测超时" textColor="#000000" />
                                    <input maxLength="5" id="forceStopTimeout" hint="留空即不强关重开" text="" textSize="14" inputType="number|none" />
                                    <text text="秒" textColor="#000000" />
                                </linear>
                                <text text="如果停留在一个状态超过设定的秒数,就认为游戏已经假死,然后杀进程重开" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultExtraSettings4" visibility="gone" padding="0 8 0 0" w="*" h="auto">
                                <linear>
                                    <text text="无条件杀进程重开,每隔" textColor="#000000" />
                                    <input maxLength="5" id="periodicallyKillTimeout" hint="留空即不强关重开" text="" textSize="14" inputType="number|none" />
                                    <text text="秒一次" textColor="#000000" />
                                </linear>
                                <text text="有的时候游戏会发生内存泄露,内存占用持续上升直至爆炸,可能导致脚本进程也被杀死。这种情况下,设置假死检测、打断官方自动续战可能都没用,于是就不得不设置这个万不得已的选项。" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultExtraSettings5" visibility="gone" padding="0 8 0 0" w="*" h="auto">
                                <linear padding="0 0 0 0" w="*" h="auto">
                                    <text text="等待控件超时" textColor="#000000" />
                                    <input maxLength="6" margin="5 0 0 0" id="timeout" hint="5000" text="5000" textSize="14" inputType="number|none" />
                                    <text text="毫秒" textColor="#000000" />
                                </linear>
                                <text text="修改“等待控件超时”并不能让脚本变快,数值太小反而可能出错。如果不是机器特别卡(这种情况也要把这个值改得更大,而不是更小)请不要改,退格可自动恢复默认(5000毫秒)" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultExtraSettings6" visibility="gone" padding="0 8 0 6" w="*" h="auto">
                                <Switch id="rootForceStop" w="*" margin="0 3" checked="false" textColor="#000000" text="优先使用root或adb权限杀进程" />
                                <text text="部分模拟器等环境下,没有root或adb(Shizuku)权限可能无法杀死进程。真机则一般可以把游戏先切到后台(然后一般就暂停运行了)再杀死。如果你无法获取root或adb权限,而且先切到后台再杀进程这个办法奏效,就可以关掉这个选项。" textColor="#000000" />
                            </vertical>
                        </vertical>
                        <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                            <text text="镜层周回脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                            <vertical padding="10 6 0 6" w="*" h="auto">
                                <vertical padding="0 8 0 6" w="*" h="auto">
                                    <Switch id="toggleMirrorsExtraSettings" w="*" margin="0 3" checked="false" textColor="#666666" text="显示更多选项" />
                                </vertical>
                                <vertical id="MirrorsExtraSettings1" visibility="gone" padding="0 8 0 6" w="*" h="auto">
                                    <Switch id="smartMirrorsPick" w="*" margin="0 3" checked="true" textColor="#000000" text="智能挑选最弱对手" />
                                    <text text="开启此项后会先找总战力低于我方六分之一的弱队,如果找不到就挨个点开队伍详情计算平均战力,从而找到最弱对手。如果碰到问题可以关闭这个选项,然后就只会挑选第3个对手" textColor="#000000" />
                                </vertical>
                                <vertical id="MirrorsExtraSettings2" visibility="gone" padding="0 8 0 6" w="*" h="auto">
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
                                <vertical id="CVAutoBattleExtraSettings1" visibility="gone" padding="0 8 0 6" w="*" h="auto">
                                    <Switch id="rootScreencap" w="*" margin="0 3" checked="false" textColor="#000000" text="使用root或adb权限截屏" />
                                    <text text="部分环境下截屏权限会在一段时间后丢失,或者出现截屏后处理数据时报错崩溃的问题。这些情况下可以开启这个选项,但开启后截图效率会下降" textColor="#000000" />
                                    <text text="注意!超级用户授权通知会遮挡屏幕、干扰截屏识图,所以务必要关掉这个通知(对模拟器来说,一般可以在系统设置里找到超级用户设置)。也可以改用不会弹出通知的Shizuku来授权" textColor="#FF0000" />
                                </vertical>
                                <vertical id="CVAutoBattleExtraSettings2" visibility="gone" padding="0 8 0 6" w="*" h="auto">
                                    <Switch id="CVAutoBattleDebug" w="*" margin="0 3" checked="false" textColor="#000000" text="识图自动战斗启用调试模式" />
                                    <text text="开启后,识图自动战斗将不会点击行动盘,只会在保存一些图片后结束运行,以方便排查bug" textColor="#000000" />
                                </vertical>
                                <vertical id="CVAutoBattleExtraSettings3" visibility="gone" padding="0 8 0 6" w="*" h="auto">
                                    <Switch id="CVAutoBattleClickAllSkills" w="*" margin="0 3" checked="true" textColor="#000000" text="使用主动技能" />
                                    <text text="开启后,从第3回合开始,会放出所有可用的主动技能。如果遇到问题可以关闭" textColor="#000000" />
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
                                <text id="versionMsg" layout_weight="1" w="*" gravity="center" color="#666666" text="正在获取最新版本信息..." />
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

    ui.emitter.on("options_item_selected", (e, item) => {
        switch (item.getTitle()) {
            case "报告问题":
                MODULES.bugReporter.reportBug();
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
        if (checked && !auto.service) {
            app.startActivity({
                action: "android.settings.ACCESSIBILITY_SETTINGS"
            });
            //部分品牌的手机在有悬浮窗的情况下拒绝开启无障碍服务（目前只发现OPPO是这样）
            //为了关闭悬浮窗，最简单的办法就是退出脚本
            ui.run(function () {
                if (ui["exitOnServiceSettings"].isChecked()) exit();
            });
        }
        if (!checked && auto.service) {
            if (device.sdkInt >= 24) {
                auto.service.disableSelf();
            } else {
                toastLog("Android 6.0或以下请到系统设置里手动关闭无障碍服务");
                app.startActivity({
                    action: "android.settings.ACCESSIBILITY_SETTINGS"
                });
            }
        }
        ui.autoService.setChecked(auto.service != null)
    });
    ui.exitOnServiceSettings.setOnCheckedChangeListener(function (widget, checked) {
        for (let i=1; i<=4; i++) ui["fixOPPOtext"+i].setVisibility(checked?View.VISIBLE:View.GONE);
    });
    //前台服务
    ui.foreground.setChecked($settings.isEnabled('foreground_service'));
    ui.foreground.setOnCheckedChangeListener(function (widget, checked) {
        $settings.setEnabled('foreground_service', checked);
    });
    //按音量上键完全退出脚本
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
    for (let key of ["Default", "Mirrors", "CVAutoBattle"]) {
        setToggleListener(key);
    }

    //回到本界面时，resume事件会被触发
    ui.emitter.on("resume", () => {
        // 此时根据无障碍服务的开启情况，同步开关的状态
        ui.autoService.checked = auto.service != null;
        if (!floatIsActive) {
            MODULES.floatUI.main()
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
            MODULES.onlineUpdate.updateEverythingToLatest();
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
        MODULES.floatUI.main();
        floatIsActive = true;
    }

    var storage = storages.create("auto_mr");

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
                    MODULES.floatUI.adjust(key, value);
                }
                })
                );
                break;
            case "Switch":
            case "CheckBox":
                ui[key].setOnCheckedChangeListener(
                function (widget, checked) {
                    saveParamIfPersist(key, checked);
                    MODULES.floatUI.adjust(key, checked);
                }
                );
                break;
            case "JsSpinner":
                ui[key].setOnItemSelectedListener(
                new android.widget.AdapterView.OnItemSelectedListener({
                onItemSelected: function (spinnerparent, spinnerview, spinnerposition, spinnerid) {
                    saveParamIfPersist(key, spinnerposition);
                    MODULES.floatUI.adjust(key, spinnerposition);
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
                        MODULES.floatUI.adjust(key, name);
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
            MODULES.floatUI.adjust(drugname, checked);
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

    //传递当前版本号给MODULES.floatUI
    MODULES.floatUI.adjust("version", version);

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

    //返回游戏并继续运行脚本按钮点击事件
    ui["task_paused_button"].setOnClickListener(new android.view.View.OnClickListener({
        onClick: function (view) {
            MODULES.floatUI.backToGame();
        }
    }));

    //版本获取
    threads.start(function () {
        let latest = MODULES.onlineUpdate.getLatestVersion();
        if (latest.hasError) {
            ui.run(function () {
                ui.versionMsg.setText("获取失败");
                ui.versionMsg.setTextColor(colors.parseColor("#666666"));
            });
            return;
        }
        if (latest.upgradable) {
            ui.run(function () {
                ui.versionMsg.setText("最新版本为"+latest.newVersion+",下拉进行更新");
                ui.versionMsg.setTextColor(colors.RED);
            });
            return;
        }
        ui.run(function () {
            ui.versionMsg.setText("当前无需更新");
            ui.versionMsg.setTextColor(colors.parseColor("#666666"));
        });
        return;
    });    
}); };
settingsUI.init = init;

module.exports = settingsUI;