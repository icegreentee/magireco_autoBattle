"ui";
var Name = "AutoBattle";
var version = "1.3.1"
var appName = Name + " v" + version;

ui.statusBarColor("#FF4FB3FF")
ui.layout(
    <drawer id="drawer">
        <vertical>
            <appbar>
                <toolbar id="toolbar" bg="#ff4fb3ff" title="{{appName}}" />
            </appbar>
            <vertical gravity="center" layout_weight="1">

                <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="0 5" elevation="1dp">
                    <Switch id="autoService" w="*" checked="{{auto.service != null}}" textColor="#666666" text="无障碍服务" />
                </vertical>

                <vertical margin="0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear>
                        <text text="恢复药使用,当AP小于：" />
                        <input maxLength="3" id="limitAP" text="20" inputType="number" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <text text="恢复药使用选择：" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="drug1" text="ap恢复药50" layout_weight="1" />
                        <input maxLength="4" id="drug1y" text="910" inputType="number" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="drug2" text="ap恢复药全" layout_weight="1" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="drug3" text="魔法石" layout_weight="1" />
                    </linear>
                </vertical>
                <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="0 0" elevation="1dp">
                    <Switch id="justNPC" w="*" checked="false" textColor="#666666" text="只使用NPC" />
                </vertical>
                <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="0 0" elevation="1dp">
                    <Switch id="stable" w="*" checked="false" textColor="#666666" text="稳定模式（战斗中会不断点击，去除网络连接失败弹窗,经常有连接失败弹窗情况下开启）" />
                </vertical>
                <linear>
                    <text layout_weight="1" size="19" color="#222222" text="日志" />
                    <button id="tolog" h="40" text="全部日志" style="Widget.AppCompat.Button.Borderless.Colored" />
                </linear>
                <linear padding="10 6 0 6" bg="#ffffff">
                    <text id="versionMsg" layout_weight="1"  color="#666666" text="尝试获取最新版本信息" />
                </linear>
                <list bg="#ffffff" elevation="1dp" h="*" id="logList">
                </list>
            </vertical>
            <button id="start" text="修改配置" tag="ScriptTag" color="#ffffff" bg="#FF4FB3FF" foreground="?selectableItemBackground" />
        </vertical>
    </drawer>
);


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

ui.tolog.click(() => {
    app.startActivity("console")
})


//回到本界面时，resume事件会被触发
ui.emitter.on("resume", () => {
    // 此时根据无障碍服务的开启情况，同步开关的状态
    ui.autoService.checked = auto.service != null;
});

var floatUI = require('floatUI.js');
floatUI.main()

ui.start.click(() => {
    floatUI.adjust({
        limitAP: ui.limitAP.getText(),
        drug1: ui.drug1.isChecked(),
        drug2: ui.drug2.isChecked(),
        drug3: ui.drug3.isChecked(),
        isStable: ui.stable.isChecked(),
        justNPC:ui.justNPC.isChecked(),
        drug1y:ui.drug1y.getText()
    })
});
//版本获取
var res = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle/project.json");
if (res.statusCode != 200) {
    log("请求失败: " + res.statusCode + " " + res.statusMessage);
    ui.versionMsg.setText("获取失败")
} else {
    let resJson = res.body.json();
    log(resJson.versionName);
    if(resJson.versionName.slice(0,resJson.versionName.length-2)==version.slice(0,version.length-2)){
        ui.versionMsg.setText("当前为最新版本")
    }else{
        ui.versionMsg.setText("最新版本为"+resJson.versionName+",需要更新")
    }
}