"ui";
var Name = "AutoBattle";
var version = "2.4.0"
var appName = Name + " v" + version;

ui.statusBarColor("#FF4FB3FF")
ui.layout(
    <ScrollView id="drawer">
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
                        <text text="药使用时的AP(大于等于副本ap*2)：" />
                        <input maxLength="3" id="limitAP" text="" inputType="number|none" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <text text="恢复药使用选择：" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="drug1" text="ap恢复药50" layout_weight="1" />
                        <input maxLength="3" id="drug1num" hint="可设置次数" text="" textSize="12" inputType="number|none" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="drug2" text="ap恢复药全" layout_weight="1" />
                        <input maxLength="3" id="drug2num" hint="可设置次数" text="" textSize="12" inputType="number|none" />
                    </linear>
                    <View h="5" />
                    <linear>
                        <checkbox id="drug3" text="魔法石" layout_weight="1" />
                        <input maxLength="3" id="drug3num" hint="可设置次数" text="" textSize="12" inputType="number|none" />
                    </linear>
                </vertical>
                <vertical padding="10 6 0 6" bg="#ffffff" w="*" h="auto" margin="0 0 0 5" elevation="1dp">
                    <Switch id="isStable" w="*" checked="false" textColor="#666666" text="稳定模式（战斗中会不断点击，去除网络连接失败弹窗,经常有连接失败弹窗情况下开启）" />
                    <Switch id="justNPC" w="*" checked="false" textColor="#666666" text="只使用npc（不设置此项，默认优先 互关好友-npc）" />
                    <linear>
                        <text text="助战x，y坐标自定义：" />
                        <input maxLength="4" id="helpx" text="" inputType="number|none" />
                        <input maxLength="4" id="helpy" text="" inputType="number|none" />
                    </linear>
                    {/* <Switch id="isRoot" w="*" checked="false" textColor="#666666" text="android7以下适配(需要root)" /> */}
                </vertical>
                <vertical margin="0 0 0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear>
                        <text text="踩水活动 x，y坐标自定义：" />
                        <input maxLength="4" id="shuix" text="" inputType="number|none" />
                        <input maxLength="4" id="shuiy" text="" inputType="number|none" />
                    </linear>
                    <linear>
                        <checkbox id="isSkip" text="是否会进行跳过剧情" layout_weight="1" />
                    </linear>
                </vertical>
                <vertical margin="0 0 0 5" bg="#ffffff" elevation="1dp" padding="5 5 10 5" w="*" h="auto">
                    <linear>
                        <checkbox id="jjcisuse" text="镜界是否嗑药" layout_weight="1" />
                    </linear>
                </vertical>

                <linear>
                    <text layout_weight="1" size="19" color="#222222" text="日志" />
                    <button id="tolog" h="40" text="全部日志" style="Widget.AppCompat.Button.Borderless.Colored" />
                </linear>
                <linear padding="5 5 0 5" bg="#ffffff" margin="0 0 0 5" >

                </linear>
                <linear padding="10 6 0 6" bg="#ffffff">
                    <text id="versionMsg" layout_weight="1" color="#666666" text="尝试获取最新版本信息" />
                    <text id="versionMsg2" layout_weight="1" color="#ff0000" text="" />
                </linear>
                <linear padding="10 6 0 6" bg="#ffffff">
                    <text id="" layout_weight="1" color="#666666" text="版权声明，本app仅供娱乐学习使用，且永久免费，不可进行出售盈利。作者bilibili 虹之宝玉  群号：453053507" />
                </linear>
                <list bg="#ffffff" elevation="1dp" h="*" id="logList">
                </list>
            </vertical>
            <View h="5" />
            <button id="start" text="修改配置" tag="ScriptTag" color="#ffffff" bg="#FF4FB3FF" foreground="?selectableItemBackground" />
        </vertical>
    </ScrollView>
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

//-----------------自定义逻辑-------------------------------------------
var floatUI = require('floatUI.js');
floatUI.main()

var storage = storages.create("soha");
var data = storage.get("data");
const paramsList = ["limitAP", "shuix", "shuiy", "helpx", "helpy"]
const paramsNotInitList = ["drug1", "drug2", "drug3", "isStable", "justNPC", "isSkip", "jjcisuse"]
var paramsMap = {}



//若没有存储信息进行存储初始化
if (data == undefined) {
    for (let i = 0; i < paramsList.length; i++) {
        if (i == 0) {
            //特殊初始值
            paramsMap[paramsList[i]] = "20"
        } else {
            paramsMap[paramsList[i]] = ""
        }

    }
    // log(JSON.stringify(paramsMap))
    storage.put("data", JSON.stringify(paramsMap))
}
else {
    paramsMap = JSON.parse(data)
}
//ui界面赋值
for (let i = 0; i < paramsList.length; i++) {
    let key = paramsList[i]
    let value = paramsMap[key]
    if (value != null) {
        ui.run(function () {
            ui[key].setText(value)
        });
    }
}

//无需复制的属性
for (let i = 0; i < paramsNotInitList.length; i++) {
    paramsMap[paramsNotInitList[i]] = false;
}
paramsMap["version"] = version

paramsMap["drug1num"] = ""
paramsMap["drug2num"] = ""
paramsMap["drug3num"] = ""

//同步值
floatUI.adjust(paramsMap)

ui.start.click(() => {
    for (let i = 0; i < paramsList.length; i++) {
        let key = paramsList[i]
        let value = ui[key].getText() + ""
        // log(value)
        if (value == "") {
            paramsMap[key] = ""
        }
        else {
            paramsMap[key] = value
        }

    }
    // log(paramsMap)
    // log(JSON.stringify(paramsMap))
    storage.remove("data")
    storage.put("data", JSON.stringify(paramsMap))
    for (let i = 0; i < paramsNotInitList.length; i++) {
        paramsMap[paramsNotInitList[i]] = ui[paramsNotInitList[i]].isChecked();
    }
    paramsMap["version"] = version
    paramsMap["drug1num"] = ui["drug1num"].getText()+""
    paramsMap["drug2num"] = ui["drug2num"].getText()+""
    paramsMap["drug3num"] = ui["drug3num"].getText()+""
    floatUI.adjust(paramsMap)
    toastLog("修改完成")
});

http.__okhttp__.setTimeout(5000);
//版本获取
try {
    let res = http.get("https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle/project.json");
    if (res.statusCode != 200) {
        log("请求失败: " + res.statusCode + " " + res.statusMessage);
        ui.run(function () {
            ui.versionMsg.setText("获取失败")
        })
    } else {
        let resJson = res.body.json();
        if (parseInt(resJson.versionName.split(".").join("")) == parseInt(version.split(".").join(""))) {
            ui.run(function () {
                ui.versionMsg.setText("当前为最新版本")
            });
        } else {
            ui.run(function () {
                ui.versionMsg.setText("")
                ui.versionMsg2.setText("最新版本为" + resJson.versionName + ",点击悬浮窗第五个按钮进行在线更新")
            });
        }
    }
} catch (e) {
    ui.run(function () {
        ui.versionMsg.setText("请求超时")
    })
}
