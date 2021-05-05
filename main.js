"ui";
var Name = "AutoBattle";
var version = "2.7.0"
var appName = Name + " v" + version;

var floatUI = require('floatUI.js');

importClass(android.graphics.Color);
importClass(android.view.MenuItem)
importClass(Packages.androidx.core.graphics.drawable.DrawableCompat)
importClass(Packages.androidx.appcompat.content.res.AppCompatResources)
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
                        <Switch id="foreground" margin="0 3" w="*" textColor="#666666" text="前台服务（防止系统清理）" />
                    </vertical>

                    <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                        <text text="全局设置" textColor="#000000" padding="5" w="*" bg="#eeeeee"/>
                        <vertical padding="10 6 0 6" w="*" h="auto">
                            <linear margin="0 3">
                                <text text="默认执行脚本" layout_weight="1" textColor="#666666"/>
                                <spinner id="default" gravity="right" textSize="14" entries="{{floatUI.scripts.map(x=>x.name).join('|')}}"/>
                            </linear>
                            <text text="恢复药使用选择：" margin="0 5"/>
                            <vertical padding="10 3 0 3" w="*" h="auto">
                                <linear>
                                    <checkbox id="drug1" text="ap恢复药50" layout_weight="1" textColor="#666666"/>
                                    <input maxLength="3" id="drug1num" hint="可设置次数" text="" textSize="14" inputType="number|none" />
                                </linear>
                                <linear>
                                    <checkbox id="drug2" text="ap恢复药全" layout_weight="1" textColor="#666666"/>
                                    <input maxLength="3" id="drug2num" hint="可设置次数" text="" textSize="14" inputType="number|none" />
                                </linear>
                                <linear>
                                    <checkbox id="drug3" text="魔法石" layout_weight="1" textColor="#666666"/>
                                    <input maxLength="3" id="drug3num" hint="可设置次数" text="" textSize="14" inputType="number|none" />
                                </linear>
                                <linear>
                                    <checkbox id="jjcisuse" text="bp恢复药（镜层）" layout_weight="1" textColor="#666666"/>
                                    <input maxLength="3" id="jjcnum" hint="可设置次数" text="" textSize="14" inputType="number|none" />
                                </linear>
                            </vertical>
                            <Switch id="justNPC" w="*" margin="0 5" checked="false" textColor="#666666" text="只使用NPC（不选则先互关好友，后NPC）" />
                        </vertical>
                    </vertical>

                    <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                        <text text="坐标定位脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee"/>
                        <vertical padding="10 6 0 6" w="*" h="auto">
                            <Switch id="isStable" w="*" margin="0 3" checked="false" textColor="#666666" text="稳定模式（战斗中不断点击重连弹窗位置）" />
                            <linear margin="0 3">
                                <text text="活动周回关卡位置 x，y坐标自定义：" />
                                <input maxLength="4" id="battlex" text="" hint="横坐标" textSize="14" inputType="number|none" />
                                <input maxLength="4" id="battley" text="" hint="纵坐标" textSize="14" inputType="number|none" />
                            </linear>
                            <linear margin="0 3">
                                <text text="助战x，y坐标自定义：" />
                                <input maxLength="4" id="helpx" text="" hint="横坐标" textSize="14" inputType="number|none" />
                                <input maxLength="4" id="helpy" text="" hint="纵坐标" textSize="14" inputType="number|none" />
                            </linear>
                        </vertical>
                    </vertical>

                    <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                        <text text="控件定位脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee"/>
                        <vertical padding="10 6 0 6" w="*" h="auto">
                            <Switch id="useAuto" w="*" margin="0 3" checked="false" textColor="#666666" text="使用自动续战（如设置用药则回复到4倍上限）" />
                        </vertical>
                    </vertical>
                    
                    <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                        <text text="关于" textColor="#000000" padding="5" w="*" bg="#eeeeee"/>
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
        <button id="start" layout_alignParentBottom="true" w="*" text="修改配置" tag="ScriptTag" color="#ffffff" bg="#FF4FB3FF" foreground="?selectableItemBackground" />
    </relative>
);

ui.emitter.on("create_options_menu", menu=>{
    let item = menu.add("查看日志");
    item.setIcon(getTintDrawable("ic_assignment_black_48dp", colors.WHITE));
    item.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM | MenuItem.SHOW_AS_ACTION_WITH_TEXT);
});

ui.emitter.on("options_item_selected", (e, item)=>{
    switch(item.getTitle()){
        case "查看日志":
            app.startActivity("console")
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
    if (!checked && auto.service) auto.service.disableSelf()
    ui.autoService.setChecked(auto.service != null)
});

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
if (!floaty.checkPermission()) {
    app.startActivity({
        packageName: "com.android.settings",
        className: "com.android.settings.Settings$AppDrawOverlaySettingsActivity",
        data: "package:" + context.getPackageName(),
    });
} else {
    floatUI.main();
    floatIsActive = true;
}

var storage = storages.create("soha4");
const persistParamList = ["foreground", "default", "isStable", "justNPC", "helpx", "helpy", "battlex", "battley", "useAuto"]
const tempParamList = ["drug1", "drug2", "drug3", "jjcisuse", "drug1num", "drug2num", "drug3num", "jjcnum"]

function syncValue(key, value)
{
    switch(ui[key].getClass().getSimpleName()) {
        // input
        case "JsEditText":
            if(value!==undefined)
                ui[key].setText(value)
            return ui[key].getText() + ""
        case "Switch":
        case "CheckBox":
            if(value!==undefined)
                ui[key].setChecked(value)
            return ui[key].isChecked()
        case "JsSpinner":
            if(value!==undefined && ui[key].getCount()>value)
                ui[key].setSelection(value, true)
            return ui[key].getSelectedItemPosition()
    }
}

for(let key of persistParamList) {
    let value = storage.get(key)
    syncValue(key, value)
    floatUI.adjust(key, value)
}

ui.start.click(() => {
    for(let key of persistParamList) {
        let value = syncValue(key)
        log("保存参数：", key, value)
        storage.put(key, value)
        floatUI.adjust(key, value)
    }

    for(let key of tempParamList) {
        let value = syncValue(key)
        floatUI.adjust(key, value)
    }

    toastLog("修改完成")
});

//版本获取
http.__okhttp__.setTimeout(5000);
try {
    let res = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle/project.json");
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

    } catch (error) {
        toastLog("请求超时，可再一次尝试")
    }
}