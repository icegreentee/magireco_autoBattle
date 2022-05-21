"ui";

//缓解报毒问题
function deObStr(s) {
    return s.replace(/cwvqlu/gi, ss => ss.split("").map(c => String.fromCharCode(c.charCodeAt(0)-2)).join(""));
}

importClass(android.view.View)
importClass(android.graphics.Color)
importClass(android.view.MenuItem)
importClass(com.stardust[deObStr("cwvqlu")].project.ProjectConfig)
importClass(com.stardust[deObStr("cwvqlu")].core.ui.inflater.util.Ids)
importClass(Packages.androidx.core.graphics.drawable.DrawableCompat)
importClass(Packages.androidx.appcompat.content.res.AppCompatResources)


// 捕获异常时打log记录详细的调用栈
// 貌似（在处理http.get下载失败时？）会导致崩溃，注释掉
//function logException(e) {
//    try { throw e; } catch (caught) {
//        Error.captureStackTrace(caught, logException);
//        //log(e, caught.stack); //输出挤在一行里了，不好看
//        log(e);
//        log(caught.stack);
//    }
//}

const updateListPath = ["update", "updateList.json"].reduce((p, c) => files.join(p, c), files.cwd());
const updateListSigPath = ["update", "updateList.json.sig.txt"].reduce((p, c) => files.join(p, c), files.cwd());

const knownPubKeyBase64 = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1NaWmmEr4JkbtG5TTp7F"
    +"o0ZuXJy018JxO0nsKKGc+KfBVFai6EizRj2cff5VZC5mTX2UfmvRHktquCYk5ZYQ"
    +"wiqmUzAmwvRuCa9gOvaEdxmGZ4Fe5W5LGvZS8AY6hzxB+o/RkVvEAJ4ud5v+9BRY"
    +"PPFGDDC3BZaY9uUB7KxvBNPDQUkZJGcF7fnjaylRGoSzo+OH6qStJffbAuGbW/UD"
    +"gH95VpqEK65kDaiHR8L5bT++T5I+sxaSJ1X7K/GklCCwAd3rIqJ5Kcabpea9I8vm"
    +"HUosZ6gQyAweNgvZBdV7x+2BGKsMmLxtJWnqxXEwtyzuQLSU0nLWJIqfEsmOWQ+n"
    +"OQIDAQAB";

function decodeBase64(encodedStr) {
    return android.util.Base64.decode(encodedStr, android.util.Base64.DEFAULT);
}
function base64Encode(bytes) {
    return android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP);
}

function verifySignature(msgBase64, sigBase64, pubkeyBase64) {
    if (typeof msgBase64 !== "string" || typeof sigBase64 !== "string" || typeof pubkeyBase64 !== "string") {
        log("msgBase64/sigBase64/pubkeyBase64 must be string");
        return false;
    }
    try {
        const msgBytes = decodeBase64(msgBase64);
        const sigBytes = decodeBase64(sigBase64);
        const pubKeySpec = new java.security.spec.X509EncodedKeySpec(decodeBase64(pubkeyBase64));
        const pubKey = java.security.KeyFactory.getInstance("RSA").generatePublic(pubKeySpec);
        const verifier = java.security.Signature.getInstance("SHA256withRSA");
        verifier.initVerify(pubKey);
        verifier.update(msgBytes);
        return verifier.verify(sigBytes);
    } catch (e) {
        log(e);
        return false;
    }
}

function readUpdateList() {
    log("读取文件数据列表...");
    try {
        if ([updateListPath, updateListSigPath].find((path) => !files.exists(path) || !files.isFile(path))) {
            log("文件数据列表路径不存在");
            return;
        }
        let fileContent = files.read(updateListPath)
        let fileBytes = new java.lang.String(fileContent).getBytes();
        let sigBase64 = files.read(updateListSigPath);
        log("已读取文件数据列表，校验数字签名...");
        if (!verifySignature(base64Encode(fileBytes), sigBase64, knownPubKeyBase64)) {
            log("文件数据列表数字签名校验失败");
            return;
        }
        log("文件数据列表数字签名校验通过");
        let result = JSON.parse(fileContent);
        return result;
    } catch (e) {
        log(e);
        log("读取文件数据列表时出错");
    }
}

//返回打包时的版本，而不是在线更新后的版本！
function getProjectVersion() {
    var conf = ProjectConfig.Companion.fromProjectDir(engines.myEngine().cwd());
    if (conf) return conf.versionName;
}

//返回在线更新后的版本，如果没有updateList.json则返回null
function getUpdatedVersion() {
    let updateListObj = readUpdateList();

    if (updateListObj != null && updateListObj.versionName != null && typeof updateListObj.versionName === "string")
        return updateListObj.versionName;

    return null;
}

function getCurrentVersion() {
    let updatedVersion = getUpdatedVersion();
    if (updatedVersion != null) {
        return updatedVersion;
    } else {
        return getProjectVersion();
    }
}

const Name = "AutoBattle";
const version = getCurrentVersion();
const appName = getUpdatedVersion() == null ? Name : Name + " v" + version;

var floatUI = require('floatUI.js');

ui.statusBarColor("#FF4FB3FF")
ui.layout(
    <relative id="container">
        <appbar id="appbar" w="*">
            <toolbar id="toolbar" bg="#ff4fb3ff" title="{{appName}}" />
        </appbar>
        <vertical id="running_stats" visibility="gone" w="fill_parent" h="fill_parent" layout_below="appbar" gravity="center_horizontal">
            <text id="running_stats_title" text="脚本运行中" textColor="#00D000" textSize="20" w="wrap_content" h="wrap_content"/>
        </vertical>
        <androidx.swiperefreshlayout.widget.SwipeRefreshLayout id="swipe" layout_below="appbar">
            <ScrollView id="content">
                <vertical gravity="center" layout_weight="1">
                    <vertical id="cwvqlu_ver_vertical" visibility="gone" margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                        <text id="cwvqlu_ver_text" text="" textColor="#FFCC00" textSize="16" w="wrap_content" h="wrap_content"/>
                    </vertical>

                    <vertical id="task_paused_vertical" visibility="gone" margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                        <text id="task_paused_title" text="脚本已暂停" textColor="#FFCC00" textSize="20" w="wrap_content" h="wrap_content"/>
                        <button id="task_paused_button" text="返回游戏并继续运行脚本" textColor="#000000" textSize="16" w="wrap_content" h="wrap_content"/>
                    </vertical>

                    <vertical id="versionMsg_vertical" margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                        <text id="versionMsg" layout_weight="1" w="*" gravity="center" color="#666666" text="获取最新版本信息..." />
                    </vertical>

                    <vertical margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                        <Switch id="autoService" margin="0 3" w="*" checked="{{auto.service != null}}" textColor="#666666" text="无障碍服务" />
                        <Switch id="foreground" margin="0 3" w="*" textColor="#000000" text="前台服务(常驻通知,防止脚本进程被杀)" />
                        <Switch id="stopOnVolUp" margin="0 3" w="*" textColor="#000000" text="按音量上键停止全部脚本" />
                        <Switch id="showExperimentalFixes" margin="0 3" w="*" checked="false" textColor="#666666" text="显示实验性问题修正选项" />
                        <vertical id="experimentalFixes" visibility="gone" margin="5 3" w="*">
                            <Switch id="exitOnServiceSettings" margin="0 3" w="*" checked="false" textColor="#000000" text="OPPO手机拒绝开启无障碍服务 备用对策" />
                            <text id="exitOnServiceSettingsText1" visibility="gone" textSize="12" text="如果不是OPPO则不建议打开这个选项" textColor="#000000" />
                            <text id="exitOnServiceSettingsText2" visibility="gone" textSize="12" text="OPPO等部分品牌的手机在有悬浮窗(比如“加速球”)存在时会拒绝开启无障碍服务" textColor="#000000" />
                            <text id="exitOnServiceSettingsText3" visibility="gone" textSize="12" text="本程序已经加入了这个问题的对策，如果无障碍还没开启，在切换出这个设置界面时会隐藏悬浮窗，但还不知道这个对策是不是总是能够奏效" textColor="#000000" />
                            <text id="exitOnServiceSettingsText4" visibility="gone" textSize="12" text="启用这个选项后，在弹出无障碍设置时，脚本会完全退出、从而关闭悬浮窗来避免触发这个问题" textColor="#000000" />
                            <text id="exitOnServiceSettingsText5" visibility="gone" textSize="12" text="与此同时请关闭其他有悬浮窗的应用(简单粗暴的方法就是清空后台)以确保无障碍服务可以顺利开启" textColor="#000000" />
                            <Switch id="doNotHideFloaty" margin="0 3" w="*" checked="false" textColor="#000000" text="切出设置界面时不隐藏悬浮窗" />
                            <text id="doNotHideFloatyText1" visibility="gone" textSize="12" text="默认情况下，为了避免OPPO等品牌手机在有悬浮窗时拒绝开启无障碍服务的问题，如果没开启无障碍服务，在切出这个设置界面时就会自动隐藏悬浮窗，在切回来时再重新显示。" textColor="#000000" />
                            <text id="doNotHideFloatyText2" visibility="gone" textSize="12" text="开启这个选项后，切出这个设置界面时就不会再自动隐藏悬浮窗。" textColor="#000000" />
                            <Switch id="doNotToggleForegroundService" margin="0 3" w="*" checked="false" textColor="#000000" text="脚本开始/结束时,不自动开启/停用前台服务" />
                            <text id="doNotToggleForegroundServiceText1" visibility="gone" textSize="12" text="在脚本运行时开启无障碍服务,目的是为了尽量防止脚本进程被杀。" textColor="#000000" />
                            <text id="doNotToggleForegroundServiceText2" visibility="gone" textSize="12" text="但是,在前台服务开启时,会在通知栏显示一条常驻通知,比较扰民。所以,默认是只在脚本运行时开启前台服务,脚本结束运行后即自动停用前台服务,而且,不仅会自动停用前台服务,如果之前申请了截屏权限,还会把截屏权限也一并停用。" textColor="#000000" />
                            <text id="doNotToggleForegroundServiceText3" visibility="gone" textSize="12" text="如果不想让脚本自己控制前台服务、不想让脚本自己停用截屏权限,那就把这个选项开启。" textColor="#000000" />
                            <Switch id="autoEnableAccSvc" margin="0 3" w="*" checked="false" textColor="#000000" text="自动开启无障碍服务" />
                            <text id="autoEnableAccSvcText1" visibility="gone" textSize="12" text="必须先手动成功开启一次无障碍服务，之后才能自动开启。最好在手动开启成功后，再重新开关一下这个选项。" textColor="#ff0000" />
                            <text id="autoEnableAccSvcText2" visibility="gone" textSize="12" text="（需要root或adb权限）在脚本启动时自动开启无障碍服务。" textColor="#000000" />
                            <Switch id="autoRecover" margin="0 3" w="*" checked="false" textColor="#000000" text="游戏崩溃带崩脚本的临时解决方案" />
                            <text id="autoRecoverText1" visibility="gone" textSize="12" text="强烈建议把上面的“自动开启无障碍服务”也一并开启！" textColor="#FF0000" />
                            <text id="autoRecoverText2" visibility="gone" textSize="12" text="脚本可以监工游戏,防止游戏因为掉线/闪退/内存泄漏溢出而中断自动周回。但是游戏闪退时貌似有几率会带着脚本一起崩溃,原因不明。" textColor="#000000" />
                            <text id="autoRecoverText3" visibility="gone" textSize="12" text="为了对付这个问题,目前有个临时的办法(需要root或adb权限),就是在logcat里监控脚本是否还在运行,如果发现脚本超过1分钟没动弹,就杀死脚本和游戏进程,然后重启脚本,再由脚本重启游戏。目前只有“副本周回(剧情/活动通用)”脚本支持这个功能。" textColor="#000000" />
                        </vertical>
                    </vertical>

                    <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                        <text text="全局设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                        <vertical padding="10 6 0 6" w="*" h="auto">
                            <linear margin="0 3">
                                <text text="默认执行脚本" layout_weight="1" layout_gravity="center_vertical" textColor="#000000" />
                                <spinner id="default" h="auto" gravity="right" textSize="14" textColor="#000000" entries="{{floatUI.scripts.map(x=>x.name).join('|')}}" />
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
                                <linear>
                                    <checkbox id="drug5" text="CP回复药(理子类活动)" layout_weight="1" textColor="#666666" />
                                    <text text="个数限制" textColor="#666666" />
                                    <input maxLength="3" id="drug5num" hint="留空即无限制" text="0" textSize="14" inputType="number|none" />
                                </linear>
                            </vertical>
                            <text text="如果AP/BP/CP能在设定分钟数内自回,则等待自回,而不嗑药:" margin="0 5" />
                            <vertical padding="10 3 0 3" w="*" h="auto">
                                <linear>
                                    <text text="等待CP自回分钟数:" layout_weight="1" textColor="#666666" />
                                    <input maxLength="2" id="drug5waitMinutes" hint="留空直接嗑CP药" text="" textSize="14" inputType="number|none" />
                                </linear>
                            </vertical>
                            <text text="没药时,等待AP/BP/CP自回:" layout_weight="1" margin="0 5" />
                            <vertical padding="10 3 0 3" w="*" h="auto">
                                <linear>
                                    <checkbox id="waitCP" text="没药时等CP自回" layout_weight="1" textColor="#666666" />
                                </linear>
                            </vertical>
                            <text text="注意:回复药和自回设置不会永久保存,在脚本完全退出后,这些设置会被重置!" textColor="#666666" />
                            <Switch id="justNPC" w="*" margin="0 5" checked="false" textColor="#000000" text="只使用NPC(不选则先互关好友,后NPC)" />
                            <Switch id="autoReconnect" w="*" margin="0 3" checked="true" textColor="#000000" text="防断线模式(尽可能自动点击断线重连按钮)" />
                            <vertical padding="0 3 0 0" w="*" h="auto">
                                <text textColor="#000000" text="防断线模式仅限于在战斗中自动点击断线重连按钮,无法应对强制回首页的情况。闪退自动重开可以应对强制回首页。" />
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
                            <vertical id="DefaultExtraSettings1" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <Switch id="dragSupportList" w="*" margin="0 3" checked="false" textColor="#000000" text="拖动助战列表" />
                                <text text="警告:因为游戏本身存在列表拖动bug,所以很不推荐开启这个选项。开启后,如果触发了列表拖动bug,选择助战时可能错点到单向好友或路人助战身上,导致Pt收益大幅下降(互关好友或NPC助战的三分之一),或者也有可能死循环反复点击没有助战的空白处。" textColor="#ff0000" />
                            </vertical>
                            <vertical id="DefaultExtraSettings2" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <Switch id="autoFollow" w="*" margin="0 3" checked="true" textColor="#000000" text="自动关注路人" />
                                <text text="启用后如果助战选到了路人,会在结算时关注他。停用这个选项则不会关注路人,在结算时如果出现询问关注的弹窗,会直接关闭。" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultExtraSettings3" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <linear>
                                    <input id="preferredSupportCharaNames" hint="留空即不优先选择" text="" textSize="14" inputType="textMultiLine"/>
                                </linear>
                                <text text="在助战列表中优先选择上面指定的角色。可以设置多个角色名,使用逗号(英文半角(,)或中文全角(，)均可)或换行分隔,脚本会按顺序依次尝试匹配,只有上一个角色名在助战列表里一个都匹配不到的时候才会继续尝试匹配下一个。" textColor="#000000" />
                                <text text="注意:" textColor="#ff0000" />
                                <text text="(1)角色名哪怕只差一个字符也无法匹配。" textColor="#ff0000" />
                                <text text="(2)角色名中允许出现空格,比如“鹿目圆 盛装”,空格不会把这个分隔成两个角色名,仍然视为一个角色名。" textColor="#ff0000" />
                                <text text="(3)很遗憾,脚本不能区分玩家名和角色名,所以可能错把玩家名当作角色名识别。带空格的角色名虽然被视为一个角色名,但实际上会被分开处理。比如一个玩家名叫“盛装”,那么普通版本的“鹿目圆”也会被误匹配上。" textColor="#ff0000" />
                                <text text="(4)如果要排除类似“盛装”“眼镜”这样不同版本的角色,上面的输入框无法完成这个设置,请在下面的输入框中设置需要排除的角色名,或者角色类型(然后会排除所有这个类型的角色):" textColor="#ff0000" />
                                <linear>
                                    <input id="excludedSupportCharaNames" hint="留空即不排除" text="" textSize="14" inputType="textMultiLine"/>
                                </linear>
                                <text text="提示:可在脚本选择列表中启动“文字抓取”来从游戏界面中抓取文字并复制到剪贴板。" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultExtraSettings4" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <Switch id="autoForPreferredOnly" w="*" margin="0 3" checked="false" textColor="#000000" text="只对优选助战使用官方自动续战" />
                                <text text="这个选项默认关闭,也就是默认情况下只要开启了“优先使用官方自动续战”就总是尽量使用官方自动续战。开启这个选项后,即便开启了“优先使用官方自动续战”,也只在找到了符合优选条件的助战(比如找到了龙城明日香)的时候使用自动续战,从而能够锁定优选到的助战反复使用,如果没找到符合优选条件的助战则不使用官方自动续战。" textColor="#000000" />
                                <text text="警告:相比默认总是使用官方自动续战的情况,开启“只对优选助战使用官方自动续战”可能会大大加快互关好友助战的消耗速度!如果互关好友助战耗尽(助战冷却恢复速度追不上消耗速度),而且又没有NPC助战的话,脚本会继续使用单向好友和路人,导致Pt收益大幅下降(降为互关好友的三分之一)!" textColor="#ff0000"/>
                                <text text="如果确实要开启“只对优选助战使用官方自动续战”,请确认互关好友中有很多人都设置了符合优选条件的助战!另外,推荐检查一下“无条件杀进程重开”设置!" textColor="#ff0000"/>
                            </vertical>
                            <vertical id="DefaultExtraSettings5" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <linear>
                                    <text text="每隔" textColor="#000000" />
                                    <input maxLength="5" id="breakAutoCycleDuration" hint="留空即不打断" text="" textSize="14" inputType="number|none" />
                                    <text text="秒打断官方自动续战" textColor="#000000" />
                                </linear>
                                <text text="经过设定的秒数后,长按打断官方自动周回。这样可以一定程度上兼顾周回速度和照顾互关好友。" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultExtraSettings6" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <linear padding="0 0 0 0" w="*" h="auto">
                                    <text text="等待控件超时" textColor="#000000" />
                                    <input maxLength="6" margin="5 0 0 0" id="timeout" hint="5000" text="5000" textSize="14" inputType="number|none" />
                                    <text text="毫秒" textColor="#000000" />
                                </linear>
                                <text text="修改“等待控件超时”并不能让脚本变快,数值太小反而可能出错。如果不是机器特别卡(这种情况也要把这个值改得更大,而不是更小)请不要改,退格可自动恢复默认(5000毫秒)" textColor="#000000" />
                            </vertical>
                            <vertical padding="0 8 0 0" w="*" h="auto">
                                <Switch id="toggleDefaultCrashRestartExtraSettings" text="显示闪退自动重开设置" textColor="#666666" />
                                <text text="[录制闪退重开选关动作]或[导入动作录制数据]后即可在[副本周回(剧情/活动通用)]脚本启动时选择启用闪退自动重开,应对闪退或掉线后强制回首页的情况。" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultCrashRestartExtraSettings1" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <text text="使用预设选关动作录制数据:" textColor="#000000" />
                                <spinner id="usePresetOpList" textSize="14" textColor="#000000" entries="{{floatUI.presetOpLists.map(x=>x.name).join('|')}}" />
                            </vertical>
                            <vertical id="DefaultCrashRestartExtraSettings2" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <Switch id="promptAutoRelaunch" text="启动周回脚本时询问是否自动重开" checked="true" textColor="#000000" />
                                <text text="想要使用自动重开功能的话,务必开启这个选项。如果暂时不想使用自动重开功能,感觉每次启动都弹出对话框很烦人,又不想清除掉导入进来或录制下来的选关动作数据,可以在这里关闭弹窗提示。" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultCrashRestartExtraSettings3" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <Switch id="reLoginNeverAbandon" text="重新登录时只点击恢复战斗" checked="false" textColor="#000000" />
                                <text text="在重新登录时,默认是在前1分钟只点击屏幕中央两个OK按钮可能出现的位置,如果到1分钟还没成功登录,就点击(且只点击一次)恢复战斗按钮所在位置(但脚本不知道恢复战斗按钮是否出现了),然后就反复点击放弃战斗按钮所在位置,以及屏幕中央两个OK按钮(于是一共是3个按钮)所在位置。" textColor="#000000" />
                                <text text="开启这个选项后,就不再是上述的默认行为,而是从一开始就反复点击恢复战斗按钮,以及屏幕中央两个OK按钮(于是一共是3个按钮)所在位置。" textColor="#000000" />
                                <text text="注意:碎钻复活按钮和恢复战斗按钮所在位置正好是重合的。所以如果碰到打输了的情况,就可能误触到碎钻复活按钮。"  textColor="#ff0000" />
                            </vertical>
                            <vertical id="DefaultCrashRestartExtraSettings4" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <linear>
                                    <text text="假死检测超时" textColor="#000000" />
                                    <input maxLength="5" id="forceStopTimeout" hint="留空即不强关重开" text="600" textSize="14" inputType="number|none" />
                                    <text text="秒" textColor="#000000" />
                                </linear>
                                <text text="（只有在启用自动重开功能时才会杀进程）如果停留在一个状态超过设定的秒数,就认为游戏已经假死,然后杀进程重开。一般用来对付黑屏上只显示一个环彩羽(或者其他角色)Live2D、而未能正常显示选关列表的问题。一般设为5到10分钟(300到600秒)。" textColor="#000000" />
                            </vertical>
                            <vertical id="DefaultCrashRestartExtraSettings5" visibility="gone" padding="10 8 0 0" w="*" h="auto">
                                <linear>
                                    <text text="定时杀进程重开,每隔" textColor="#000000" />
                                    <input maxLength="5" id="periodicallyKillTimeout" hint="留空即不强关重开" text="3600" textSize="14" inputType="number|none" />
                                    <text text="秒一次," textColor="#000000" />
                                </linear>
                                <text text="但如果战斗还没结束," textColor="#000000" />
                                <linear>
                                    <text text="就再多等" textColor="#000000" />
                                    <input maxLength="5" id="periodicallyKillGracePeriod" hint="留空即不等待战斗结束" text="540" textSize="14" inputType="number|none" />
                                    <text text="秒后再杀进程" textColor="#000000" />
                                </linear>
                                <text text="（只有在启用自动重开功能时才会杀进程）有的时候游戏会发生内存泄露,内存占用持续上升直至爆炸,可能导致脚本进程也被杀死。这种情况下,设置假死检测超时、打断官方自动续战可能都没用,于是就不得不设置这个万不得已的选项。一般设为1小时(3600秒)杀一次进程,如果战斗还没结束就再多等9分钟(540秒)。" textColor="#000000" />
                                <text text="警告:在使用官方自动续战的情况下,定时杀进程会显著加快互关好友助战的消耗速度,如果助战冷却速度赶不上消耗的速度,导致互关好友助战耗尽,而且又没有NPC助战的话,脚本会继续使用单向好友和路人,导致Pt收益大幅下降(降为互关好友的三分之一)!" textColor="#ff0000"/>
                                <text text="所以请不要把无条件定时杀进程的时间间隔设置得太短!另外,推荐检查一下“只对优选助战使用官方自动续战”设置!" textColor="#ff0000"/>
                            </vertical>
                            <vertical id="DefaultCrashRestartExtraSettings6" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <Switch id="rootForceStop" w="*" margin="0 3" checked="false" textColor="#000000" text="优先使用root或adb权限杀进程" />
                                <text text="（只有在启用自动重开功能时才会杀进程）部分模拟器等环境下,没有root或adb(Shizuku)权限可能无法杀死进程。真机则一般没有这个问题（但游戏不能被锁后台）,脚本可以把游戏先切到后台(然后一般就暂停运行了)再杀死。如果你无法获取root或adb权限,而且先切到后台再杀进程这个办法奏效,就可以关掉这个选项。" textColor="#000000" />
                            </vertical>
                        </vertical>
                    </vertical>
                    <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                        <text text="理子活动脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                        <vertical padding="10 6 0 6" w="*" h="auto">
                            <vertical padding="0 8 0 6" w="*" h="auto">
                                <Switch id="toggleDungeonExtraSettings" w="*" margin="0 3" checked="false" textColor="#666666" text="显示更多选项" />
                            </vertical>
                            <vertical id="DungeonExtraSettings1" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <text text="路线数据:" textColor="#000000" />
                                <input id="dungeonEventRouteData" hint="留空即使用预设数据" text="" textSize="14" inputType="textMultiLine|none" />
                            </vertical>
                            <vertical id="DungeonExtraSettings2" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <text text="点击非战斗节点后的等待时间:" textColor="#000000" />
                                <linear>
                                    <input maxLength="3" id="dungeonClickNonBattleNodeWaitSec" hint="8" text="8" textSize="14" inputType="number|none" />
                                    <text text="秒" textColor="#000000" />
                                </linear>
                                <text text="警告:把点击非战斗节点后的等待时间改得太小可能导致走错路线等意想不到的错误！" textColor="#ff0000" />
                            </vertical>
                            <vertical id="DungeonExtraSettings3" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <text text="战斗结束后的等待时间:" textColor="#000000" />
                                <linear>
                                    <input maxLength="3" id="dungeonPostRewardWaitSec" hint="8" text="8" textSize="14" inputType="number|none" />
                                    <text text="秒" textColor="#000000" />
                                </linear>
                                <text text="警告:把战斗结束后的等待时间改得太小可能导致脚本误识别游戏状态！" textColor="#ff0000" />
                            </vertical>
                            <vertical id="DungeonExtraSettings4" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <text text="战斗假死检测超时:" textColor="#000000" />
                                <linear>
                                    <input maxLength="5" id="dungeonBattleTimeoutSec" hint="留空即不强关重开" text="1200" textSize="14" inputType="number|none" />
                                    <text text="秒" textColor="#000000" />
                                </linear>
                                <text text="有时候会在进入战斗时等待太久。默认超过20分钟就会杀进程重开。" textColor="#000000" />
                            </vertical>
                            <vertical id="DungeonExtraSettings5" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <text text="定时杀进程重开,每隔多少场战斗1次:" textColor="#000000" />
                                <linear>
                                    <text text="每隔" textColor="#000000" />
                                    <input maxLength="3" id="dungeonBattleCountBeforeKill" hint="留空即不强关重开" text="20" textSize="14" inputType="number|none" />
                                    <text text="场战斗" textColor="#000000" />
                                </linear>
                                <text text="游戏本身存在内存泄漏bug,为避免内存占用越攒越多后把脚本挤出去以及导致游戏自行崩溃,而且理子活动不需要助战(于是就不需要考虑等待助战刷新),默认每过20场战斗杀进程重开一次。" textColor="#000000" />
                            </vertical>
                        </vertical>
                    </vertical>
                    <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                        <text text="镜层周回脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
                        <vertical padding="10 6 0 6" w="*" h="auto">
                            <vertical padding="0 8 0 6" w="*" h="auto">
                                <Switch id="toggleMirrorsExtraSettings" w="*" margin="0 3" checked="false" textColor="#666666" text="显示更多选项" />
                            </vertical>
                            <vertical id="MirrorsExtraSettings1" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <Switch id="smartMirrorsPick" w="*" margin="0 3" checked="true" textColor="#000000" text="智能挑选最弱对手" />
                                <text text="开启此项后会先找总战力低于我方六分之一的弱队,如果找不到就挨个点开队伍详情计算平均战力,从而找到最弱对手。如果碰到问题可以关闭这个选项,然后就只会挑选第1个对手" textColor="#000000" />
                            </vertical>
                            <vertical id="MirrorsExtraSettings2" visibility="gone" padding="10 8 0 6" w="*" h="auto">
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
                            <vertical id="CVAutoBattleExtraSettings1" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <Switch id="rootScreencap" w="*" margin="0 3" checked="false" textColor="#000000" text="使用root或adb权限截屏" />
                                <text text="部分环境下截屏权限会在一段时间后丢失,或者出现截屏后处理数据时报错崩溃的问题。这些情况下可以开启这个选项,但开启后截图效率会下降" textColor="#000000" />
                                <text text="注意!超级用户授权通知会遮挡屏幕、干扰截屏识图,所以务必要关掉这个通知(对模拟器来说,一般可以在系统设置里找到超级用户设置)。也可以改用不会弹出通知的Shizuku来授权" textColor="#FF0000" />
                            </vertical>
                            <vertical id="CVAutoBattleExtraSettings2" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <Switch id="CVAutoBattleDebug" w="*" margin="0 3" checked="false" textColor="#000000" text="识图自动战斗启用调试模式" />
                                <text text="开启后,识图自动战斗将不会点击行动盘,只会在保存一些图片后结束运行,以方便排查bug" textColor="#000000" />
                            </vertical>
                            <vertical id="CVAutoBattleExtraSettings3" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <Switch id="CVAutoBattleClickAllSkills" w="*" margin="0 3" checked="true" textColor="#000000" text="使用主动技能" />
                                <text text="开启后,从(默认)第3回合开始,会放出所有可用的主动技能。如果遇到问题可以关闭。" textColor="#000000" />
                                <linear>
                                    <text text="从第" textColor="#000000" />
                                    <input maxLength="2" id="CVAutoBattleClickSkillsSinceTurn" hint="3" text="3" textSize="14" inputType="number|none" />
                                    <text text="回合起使用主动技能" textColor="#000000" />
                                </linear>
                                <text text="脚本暂不能识别技能面板切换按钮(行动盘右边的大“SKILL”按钮)是否处于闪烁状态,考虑到在镜层(如果不是镜层而是副本,那情况又不一样,一般是第1回合即可发动主动技能)大多数主动技能都只在第3回合才冷却完毕,为了避免点开技能面板后又关闭导致浪费时间,默认只从第3回合开始使用主动技能。" textColor="#000000" />
                            </vertical>
                            <vertical id="CVAutoBattleExtraSettings4" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <Switch id="CVAutoBattleClickAllMagiaDisks" w="*" margin="0 3" checked="true" textColor="#000000" text="使用Magia/Doppel大招" />
                                <text text="开启后,会放出所有可用Magia/Doppel大招。如果遇到问题可以关闭" textColor="#000000" />
                            </vertical>
                            <vertical id="CVAutoBattleExtraSettings5" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <Switch id="CVAutoBattlePreferAccel" w="*" margin="0 3" checked="false" textColor="#000000" text="优先用Accel盘" />
                                <text text="默认选盘倾向于用Blast盘。开启后,改为倾向于Accel。" textColor="#000000" />
                                <text text="比如: 由比鹤乃单人队,因为队伍里只有一个成员也就是鹤乃,每回合的发牌就固定是鹤乃的盘型AABBC(只是顺序会随机打乱),然后,开启这个选项后,虽然从AABBC里可以挑选出ACB,但脚本仍然选择ACA。" textColor="#000000" />
                                <text text="只有开启了这个选项,才能让单鹤乃(或者类似的情况)连续每回合都点击MAA这个3个盘。" textColor="#ff0000" />
                            </vertical>
                            <vertical id="CVAutoBattleExtraSettings6" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <Switch id="CVAutoBattlePreferABCCombo" w="*" margin="0 3" checked="false" textColor="#000000" text="优先凑A/B/C Combo" />
                                <text text="默认优先凑出Puella Combo(3个盘都是同一个角色)。开启后,改为优先凑出Accel/Blast/Charge Combo(比如3个盘都是Accel)。" textColor="#000000" />
                            </vertical>
                            <vertical id="CVAutoBattleExtraSettings7" visibility="gone" padding="10 8 0 6" w="*" h="auto">
                                <linear>
                                    <text text="按下后等待" textColor="#000000" />
                                    <input maxLength="3" id="CVAutoBattleClickDiskDuration" hint="50" text="50" textSize="14" inputType="number|none" />
                                    <text text="毫秒后再松开行动盘" textColor="#000000" />
                                </linear>
                                <text text="国服2.1.10版更新后出现magia盘点不下去的问题,默认按住50毫秒后松开即可绕开这个问题,如果还有问题可以尝试调整这个数值。" textColor="#000000" />
                            </vertical>
                        </vertical>
                    </vertical>
                    <vertical margin="0 5" bg="#ffffff" elevation="1dp" w="*" h="auto">
                        <text text="副本/活动周回2(备用可选)脚本设置" textColor="#000000" padding="5" w="*" bg="#eeeeee" />
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
                            <text id="" layout_weight="1" color="#666666" text="版权声明，本app仅供娱乐学习使用，且永久免费，不可进行出售盈利。作者bilibili 虹之宝玉  群号：453053507" />
                        </linear>
                    </vertical>
                </vertical>
            </ScrollView>
        </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>
    </relative>
);
ui["cwvqlu_ver_text"].setText(deObStr("CwvqLU Pro 引擎版本过低"));

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
    item = menu.add("检查文件数据");
    item.setIcon(getTintDrawable("ic_find_in_page_black_48dp", colors.WHITE));
    item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
    item = menu.add("切换下载源");
    item.setIcon(getTintDrawable("ic_cloud_download_black_48dp", colors.WHITE));
    item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
    item = menu.add("魔纪百科");
    item.setIcon(getTintDrawable("ic_book_black_48dp", colors.WHITE));
    item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
    item = menu.add("模拟抽卡");
    item.setIcon(getTintDrawable("ic_store_black_48dp", colors.WHITE));
    item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
});

function setFollowRedirects(value) {
    let newokhttp = new Packages.okhttp3.OkHttpClient.Builder().followRedirects(value);
    http.__okhttp__.muteClient(newokhttp);
}

const logMaxSize = 1048576;
var reportTask = null;
function reportBug() {
    toastLog("正在上传日志和最近一次的快照,请耐心等待...");

    log(appName);
    try{floatUI.logParams();} catch (e) {}
    log("Android API Level", device.sdkInt);
    log("屏幕分辨率", device.width, device.height);
    var str = "";
    for (let key of ["brand", "device", "model", "product", "hardware"]) {
        str += "\n"+key+" "+device[key];
    }
    log(str);

    var snapshotDir = files.join(files.getSdcardPath(), "auto_magireco");
    var listedFilenames = files.listDir(snapshotDir, function (filename) {
        return filename.match(/^\d+-\d+-\d+_\d+-\d+-\d+\.xml$/) != null && files.isFile(files.join(snapshotDir, filename));
    });
    var latest = [0,0,0,0,0,0];
    if (listedFilenames != null) {
        for (let i=0; i<listedFilenames.length; i++) {
            let filename = listedFilenames[i];
            let timestamp = filename.match(/^\d+-\d+-\d+_\d+-\d+-\d+/)[0];
            let timevalues = timestamp.split('_').join('-').split('-').map((val) => parseInt(val));
            let isNewer = false;
            for (let j=0; j<6; j++) {
                if (timevalues[j] > latest[j]) {
                    isNewer = true;
                    break;
                } else if (timevalues[j] < latest[j]) {
                    isNewer = false;
                    break;
                } //相等的话继续比下一项数值
            }
            if (isNewer) for (let j=0; j<6; j++) {
                latest[j] = timevalues[j];
            }
        }
    }
    var snapshotContent = null;
    if (listedFilenames != null && listedFilenames.length > 0) {
        let latestSnapshotFilename = latest.slice(0, 3).join('-') + "_" + latest.slice(3, 6).join('-') + ".xml";
        log("要上传的快照文件名", latestSnapshotFilename);
        snapshotContent = files.read(files.join(snapshotDir, latestSnapshotFilename));
        let snapshotBytes = files.readBytes(files.join(snapshotDir, latestSnapshotFilename));
        let snapshotSize = snapshotBytes.length;
        log("快照大小", snapshotSize+"字节", snapshotContent.length+"字符");
        if (snapshotSize > logMaxSize) {
            //大于1MB时不上传
            snapshotContent = null;
            toastLog("快照文件太大，请采取其他方式上传");
        }
    }

    var parentDir = files.join(engines.myEngine().cwd(), "..");
    var logDir = files.join(parentDir, "logs");
    var logContent = files.read(files.join(logDir, "log.txt"));
    let logBytes = files.readBytes(files.join(logDir, "log.txt"));
    let logSize = logBytes.length;
    log("日志大小", logSize+"字节", logContent.length+"字符");
    if (logSize > logMaxSize) {
        //大于1MB时只截取尾部
        //算法太渣，很慢，需要改
        let excessSize = logSize - logMaxSize;
        let rate = logSize / logContent.length;
        let est = excessSize / rate;
        do {
            var logTailContent = new java.lang.String(logContent).substring(est, logContent.length-1);
            var logTailSize = new java.lang.String(logTailContent).getBytes().length;
            est += (logTailSize - logMaxSize) / rate;
            sleep(1000);
        } while (logTailSize - logMaxSize > 0 || logTailSize - logMaxSize <= -32);
        logContent = logTailContent;
        log("截取尾部 日志大小", logTailSize+"字节", logContent.length+"字符");
    }

    var resultLinks = "";

    var uploadContents = {
        log: {content: logContent, syntax: "text"},
        snapshot: {content: snapshotContent, syntax: "xml"}
    };
    for (let key in uploadContents) {
        if (uploadContents[key].content == null) {
            log("读取"+key+"内容失败");
            continue;
        }
        if (uploadContents[key].content == "") {
            log(key+"内容为空,无法上传");
            continue;
        }

        toastLog("上传"+key+"...");

        http.__okhttp__.setTimeout(60 * 1000);
        setFollowRedirects(false);
        let response = null;
        try {
            response = http.post("https://pastebin.ubuntu.com/", {
                poster: deObStr("cwvqlu_")+key,
                syntax: uploadContents[key].syntax,
                expiration: "week",
                content: uploadContents[key].content
            });
        } catch (e) {
            toastLog("请求超时,请稍后再试");
        }
        setFollowRedirects(true);

        if (response == null) {
            log(key+"上传失败");
        } else if (response.statusCode != 302) {
            log(key+"上传失败", response.statusCode, response.statusMessage);
        } else {
            if (resultLinks != "") resultLinks += "\n";
            let location = response.headers["Location"];
            resultLinks += key+"已上传至: ";
            if (location != null) {
                resultLinks += "https://pastebin.ubuntu.com"+location;
            } else {
                log(key+"链接获取失败");
                resultLinks += "链接获取失败";
            }
            toastLog(key+"上传完成!\n等待2秒后继续...");
            sleep(2000);
        }
    }

    if (resultLinks != "") {
        log(resultLinks);
        ui.run(() => {
            clip = android.content.ClipData.newPlainText("auto_bugreport_result", resultLinks);
            activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE).setPrimaryClip(clip);
            toast("内容已复制到剪贴板");
        });
        dialogs.build({
            title: "上传完成",
            content: "别忘了全选=>复制，然后粘贴给群里的小伙伴们看看哦~ 不然的话，我们也不知道你上传到哪里了啊！！！",
            inputPrefill: resultLinks
        }).show();
        log("报告问题对话框已关闭");
    }
}

ui.emitter.on("options_item_selected", (e, item) => {
    switch (item.getTitle()) {
        case "报告问题":
            if (reportTask && reportTask.isAlive()) {
                toastLog("已经在上传了,请稍后再试");
            } else {
                reportTask = threads.start(reportBug);
            }
            break;
        case "查看日志":
            app.startActivity("console")
            break;
        case "检查文件数据":
            threads.start(function () {checkAgainstUpdateListAndFix(true);});
            break;
        case "切换下载源":
            chooseDownloadSource();
            break;
        case "魔纪百科":
            app.openUrl("https://magireco.moe/");
            break;
        case "模拟抽卡":
            app.openUrl("https://jp.rika.ren/playground/gachaEmulator/");
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

//检测CwvqLU引擎版本

//经测试发现app.cwvqlu.versionName不能用
//以下数值通过实际运行一遍代码取得，取自Pro 8.8.13-0
const lowestVersionCode = 8081200;

function detectCwvqLUVersion() {
    ui.run(function() {
        let currentVersionCode = NaN;
        try {
            currentVersionCode = parseInt(app[deObStr("cwvqlu")].versionCode);
        } catch (e) {
            currentVersionCode = NaN;
        }
        if (isNaN(currentVersionCode)) {
            ui.cwvqlu_ver_text.setText(deObStr("无法检测 CwvqLU Pro 引擎版本\n继续使用可能碰到问题\n推荐下载最新apk安装包进行更新"));
            ui.cwvqlu_ver_vertical.setVisibility(View.VISIBLE);
            return;
        }
        if (currentVersionCode < lowestVersionCode) {
            ui.cwvqlu_ver_text.setText(deObStr("CwvqLU Pro 引擎版本过低\n当前版本versionCode=["+currentVersionCode+"]\n最低要求versionCode=["+lowestVersionCode+"]\n继续使用可能碰到问题\n推荐下载最新apk安装包进行更新"));
            ui.cwvqlu_ver_vertical.setVisibility(View.VISIBLE);
            return;
        }
    });
}
detectCwvqLUVersion();

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
ui.showExperimentalFixes.setOnCheckedChangeListener(function (widget, checked) {
    ui.experimentalFixes.setVisibility(checked?View.VISIBLE:View.GONE);
});
//前台服务
$settings.setEnabled('foreground_service', $settings.isEnabled('foreground_service')); //修正刚安装好后返回错误的数值，点进设置再出来又变成正确的数值的问题
ui.foreground.setChecked($settings.isEnabled('foreground_service'));
ui.foreground.setOnCheckedChangeListener(function (widget, checked) {
    $settings.setEnabled('foreground_service', checked);
});
//按音量上键完全退出脚本
$settings.setEnabled('stop_all_on_volume_up', $settings.isEnabled('stop_all_on_volume_up')); //修正刚安装好后返回错误的数值，点进设置再出来又变成正确的数值的问题
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
for (let key of ["Default", "DefaultCrashRestart", "Dungeon", "Mirrors", "CVAutoBattle"]) {
    setToggleListener(key);
}

//回到本界面时，resume事件会被触发
ui.emitter.on("resume", () => {
    // 此时根据无障碍服务的开启情况，同步开关的状态
    ui.autoService.checked = auto.service != null;
    if (floatIsActive) {
        floatUI.refreshUI();
        floatUI.recoverAllFloaty();
        floatUI.enableAutoService();
    } else {
        floatUI.storage = storage; //必须放在floatUI.main()前面
        floatUI.main();
        floatIsActive = true;
    }
    if ($settings.isEnabled('foreground_service') != ui.foreground.isChecked())
        ui.foreground.setChecked($settings.isEnabled('foreground_service'));
    if ($settings.isEnabled('stop_all_on_volume_up') != ui.stopOnVolUp.isChecked())
        ui.stopOnVolUp.setChecked($settings.isEnabled('stop_all_on_volume_up'));
});
ui.emitter.on("pause", () => {
    //未开启无障碍时,在切出脚本界面时隐藏悬浮窗,避免OPPO等品牌手机拒绝开启无障碍服务
    if (floatIsActive) {
        if (auto.service == null && !ui.doNotHideFloaty.isChecked()) {
            floatUI.hideAllFloaty();
        }
    }
});

//监听刷新事件
ui.swipe.setOnRefreshListener({
    onRefresh: function () {
        threads.start(function () {toUpdate();});
    },
});
//-----------------自定义逻辑-------------------------------------------

var storage = storages.create("auto_mr");
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
        log(e);
    }
    if (failed) {
        failed = false;
        toastLog("申请悬浮窗权限时出错\n再次申请...");
        try {
            $floaty.requestPermission();
        } catch (e) {
            failed = true;
            log(e);
        }
    }
    if (failed) {
        toastLog("申请悬浮窗权限时出错\n请到应用设置里手动授权");
    } else {
        toast("请重新启动脚本");
    }
    exit();
} else {
    floatUI.storage = storage; //必须放在floatUI.main()前面
    floatUI.main();
    floatIsActive = true;
}

const persistParamList = [
    "foreground",
    "stopOnVolUp",
    "exitOnServiceSettings",
    "doNotHideFloaty",
    "doNotToggleForegroundService",
    "autoEnableAccSvc",
    "autoRecover",
    "promptAutoRelaunch",
    "reLoginNeverAbandon",
    "usePresetOpList",
    "default",/* 放在usePresetOpList后面,这样启动时弹的toast还是默认执行脚本 */
    "autoReconnect",
    "justNPC",
    "dragSupportList",
    "preferredSupportCharaNames",
    "excludedSupportCharaNames",
    //"preferredSupportMemorias",//未实现
    "autoForPreferredOnly",
    "helpx",
    "helpy",
    "battleNo",
    "useAuto",
    "autoFollow",
    "breakAutoCycleDuration",
    "forceStopTimeout",
    "periodicallyKillTimeout",
    "periodicallyKillGracePeriod",
    "timeout",
    "rootForceStop",
    "rootScreencap",
    "smartMirrorsPick",
    "useCVAutoBattle",
    "CVAutoBattleDebug",
    "CVAutoBattleClickAllSkills",
    "CVAutoBattleClickSkillsSinceTurn",
    "CVAutoBattleClickAllMagiaDisks",
    "CVAutoBattlePreferAccel",
    "CVAutoBattlePreferABCCombo",
    "CVAutoBattleClickDiskDuration",
    "dungeonEventRouteData",
    "dungeonClickNonBattleNodeWaitSec",
    "dungeonPostRewardWaitSec",
    "dungeonBattleTimeoutSec",
    "dungeonBattleCountBeforeKill",
];
const tempParamList = [
    "drug1",
    "drug2",
    "drug3",
    "drug4",
    "drug5",
    "waitCP",
    "drug1num",
    "drug2num",
    "drug3num",
    "drug4num",
    "drug5num",
    "drug5waitMinutes",
    "apmul",
];

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
            if (value !== undefined && ui[key].getCount() > value) {
                ui[key].setSelection(value, true)
            } else {
                ui[key].setSelection(0, true) //FIXME when list is empty
            }
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
                floatUI.adjust(key, value);
            }
            })
            );
            break;
        case "CheckBox":
        case "Switch":
            ui[key].setOnCheckedChangeListener(
            function (widget, checked) {
                for (let i=1; ui[key+"Text"+i]!=null; i++) {
                    ui[key+"Text"+i].setVisibility(checked?View.VISIBLE:View.GONE);
                }
                saveParamIfPersist(key, checked);
                floatUI.adjust(key, checked);
            }
            );
            break;
        case "JsSpinner":
            ui[key].setOnItemSelectedListener(
            new android.widget.AdapterView.OnItemSelectedListener({
            onItemSelected: function (spinnerparent, spinnerview, spinnerposition, spinnerid) {
                saveParamIfPersist(key, spinnerposition);
                floatUI.adjust(key, spinnerposition);
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
                    floatUI.adjust(key, name);
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

//限制CVAutoBattleClickSkillsSinceTurn的取值
ui["CVAutoBattleClickSkillsSinceTurn"].addTextChangedListener(
new android.text.TextWatcher({
afterTextChanged: function (s) {
    let str = ""+s;
    let value = parseInt(str);
    if (isNaN(value) || value < 1 || value > 99) {
        s.replace(0, str.length, "3");
    }
}
})
);

//限制CVAutoBattleClickDiskDuration的取值
ui["CVAutoBattleClickDiskDuration"].addTextChangedListener(
new android.text.TextWatcher({
afterTextChanged: function (s) {
    let str = ""+s;
    let value = parseInt(str);
    if (isNaN(value) || value < 1 || value > 999) {
        s.replace(0, str.length, "50");
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
        floatUI.adjust(drugname, checked);
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

//传递当前版本号给floatUI
floatUI.adjust("version", version);

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
        floatUI.backToGame();
    }
}));

//版本获取
function setVersionMsg(textMsg, color, isVisible) {
    if (color == null) color = colors.RED;
    if (isVisible == null) isVisible = View.VISIBLE;

    if (typeof color === "string") color = colors.parseColor(color);
    if (typeof isVisible === "boolean") isVisible = isVisible ? View.VISIBLE : View.GONE;

    //ui.run(function () {
    ui.post(function () {
        ui.versionMsg.setText(textMsg);
        ui.versionMsg.setTextColor(color);
        ui.versionMsg_vertical.setVisibility(isVisible);
    })
}
function setVersionMsgLog(textMsg, color, isVisible) {
    log(textMsg);
    setVersionMsg(textMsg, color, isVisible);
}
function setVersionMsgToastLog(textMsg, color, isVisible) {
    toastLog(textMsg);
    setVersionMsg(textMsg, color, isVisible);
}
var latestVersionName = null;
var refreshUpdateStatus = sync(function () {
    http.__okhttp__.setTimeout(5000);
    try {
        const updateStatusURLs = isDevMode ? [urlBases.local+"/project.json"] : [
            "https://api.github.com/repos/magirecoautobattle/magireco_autoBattle/releases/latest",
            urlBases.githubPages+"/project.json",
            urlBases.cloudflarePages+"/project.json",
            urlBases.jsdelivr+"@latest/project.json",
        ];
        let resJson = null;
        updateStatusURLs.find((url) => {
            try {
                log("尝试检测更新 URL=["+url+"] ...");
                res = http.get(url);
                if (res.statusCode == 200) {
                    resJson = res.body.json();
                    return true;
                }
            } catch (e) {
                log(e);
                resJson = null;
            }
            log("尝试检测更新 URL=["+url+"] 失败");
        });
        if (resJson == null) {
            setVersionMsgToastLog("更新信息获取失败 "+res.statusCode+" "+res.statusMessage, "#666666", true);
        } else {
            latestVersionName = null;
            if (resJson.tag_name != null) {
                latestVersionName = resJson.tag_name;
                log("从GitHub获取最新版本号"+latestVersionName);
            } else if (resJson.versionName != null) {
                latestVersionName = resJson.versionName;
                log("从其他途径获取最新版本号"+latestVersionName);
            }
            if (parseInt(latestVersionName.split(".").join("")) <= parseInt(version.split(".").join(""))) {
                setVersionMsgLog("当前无需更新", "#666666", false);
            } else {
                setVersionMsgLog("最新版本为" + latestVersionName + ",下拉进行更新", colors.RED, true);
            }
        }
    } catch (e) {
        log(e);
        setVersionMsgToastLog("获取更新信息时出错", "#666666", true);
    }
});
threads.start(function () {
    //绕开CwvqLU 9.1.0版上的奇怪假死问题，refreshUpdateStatus里的ui.run貌似必须等到对悬浮窗的Java反射操作完成后再进行，否则会假死
    //floatUI.main在UI线程中第一个执行，然后会上锁，等到反射相关操作做完了才会解锁
    //然后这里才能上锁（还有showHideAllFloaty里也会尝试上锁，但和这里谁先谁后应该无所谓）
    floatUI.floatyHangWorkaroundLock.lock();
    floatUI.floatyHangWorkaroundLock.unlock();
    refreshUpdateStatus();
    //检查当前版本的文件数据
    checkAgainstUpdateListAndFix();
});

//版本更新
const urlBases = {
    jsdelivr: "https://fastly.jsdelivr.net/gh/magirecoautobattle/magireco_autoBattle",
    githubPages: "https://magirecoautobattle.github.io/magireco_autoBattle",
    cloudflarePages: "https://magireco-autobattle.pages.dev",
    local: "http://127.0.0.1:9090", //用于调试，从本地gen.js开发服务器下载文件
}

var isDevMode = false;
//isDevMode = true;


function getChosenDownloadSource() {
    if (isDevMode) return "local";
    else return storage.get("chosenDownloadSource", "jsdelivr");
}

function getDownloadURLBase(specifiedVersionName) {
    let chosen = getChosenDownloadSource();
    let urlBase = urlBases[chosen];
    if (urlBase == null) throw new Error("urlBases[chosen] is null");
    let suffix = "";
    if (chosen === "jsdelivr") {
        suffix = "@"+(specifiedVersionName==null?"latest":specifiedVersionName);
    }
    return urlBase+suffix;
}

function chooseDownloadSource() {
    let oldSource = storage.get("chosenDownloadSource", "jsdelivr");
    let sources = [];
    for (let sourceName in urlBases) {
        if (sourceName === "local") continue;
        if (oldSource === sourceName) sourceName += " [✓]";
        sources.push(sourceName);
    }
    dialogs.select("请选择新的下载源"+(isDevMode?"\nisDevMode==true 固定使用本地下载源":""), sources).then((i) => {
        let newSource = sources[i];
        if (newSource == null) {
            toastLog("未切换下载源，继续使用 ["+oldSource+"]");
            return;
        }
        storage.put("chosenDownloadSource", newSource);
        toastLog("下载源已切换到 ["+newSource+"]");
    });
}

var updateRestartPending = false;

function restartApp() {
    events.on("exit", function () {
        //通过execScriptFile好像会有问题，比如点击悬浮窗QB=>齿轮然后就出现两个QB
        //engines.execScriptFile(engines.myEngine().cwd() + "/main.js")
        app.launch(context.getPackageName());
        toast("更新完毕")
    })
    updateRestartPending = true;
    engines.stopAll();
}

function walkThrough(data) {
    let result = [];
    function _recurse(data) {
        if (Array.isArray(data)) {
            data.forEach((item) => _recurse(item));
        } else {
            result.push(data);
        }
    }
    _recurse(data);
    return result;
}

function downloadAndVerifyEssentialFiles(versionName, extraFileNames) {
    if (typeof versionName !== "string") throw new Error("versionName must be string");
    if (extraFileNames == null || !Array.isArray(extraFileNames)) throw new Error("extraFileNames must be array");
    const msgFileName = "update/updateList.json", sigFileName = "update/updateList.json.sig.txt";
    const fileNames = [msgFileName, sigFileName].concat(extraFileNames);
    let downloaded = {}, expectedHashes = {};
    for (let i=0; i<fileNames.length; i++) {
        let fileName = fileNames[i];
        try {
            log("下载文件 ["+fileName+"] ...");
            let resp = http.get(getDownloadURLBase(versionName)+"/"+fileName);
            if (resp.statusCode != 200) throw new Error("download failed status=["+resp.statusCode+"]");
            let fileContent = ""+resp.body.string();
            let fileBytes = new java.lang.String(fileContent).getBytes();
            log("下载文件 ["+fileName+"] 完成");
            switch (fileName) {
                case msgFileName:
                    let fileRootNode = JSON.parse(fileContent).fileRootNode;
                    walkThrough(fileRootNode).forEach((item) => expectedHashes[item.src] = item.integrity);
                    break;
                case sigFileName:
                    let msgBase64 = base64Encode(downloaded[msgFileName]);
                    let sigBase64 = "" + fileContent;
                    if (!verifySignature(msgBase64, sigBase64, knownPubKeyBase64))
                        throw new Error("invalid signature");
                    break;
                default:
                    let actualFileHash = "sha256-"+$crypto.digest(fileBytes, "SHA-256", {input: "bytes", output: "base64"});
                    if (expectedHashes[fileName] == null)
                        throw new Error("expected hash not found");
                    if (actualFileHash !== expectedHashes[fileName])
                        throw new Error("hash mismatch");
            }
            //验证通过
            downloaded[fileName] = fileBytes;
        } catch (e) {
            log("文件 ["+fileName+"] 下载或验证失败");
            log(e);
            break;
        }
    }
    if (fileNames.find((fileName) => downloaded[fileName] == null)) {
        log("有文件下载或验证失败");
        return null;
    }
    return downloaded;
}

var toUpdate = sync(function () {
    refreshUpdateStatus();
    if (updateRestartPending) {
        ui.run(function() {ui.swipe.setRefreshing(false);});
        return;
    }
    try {
        if (latestVersionName == null) {
            toastLog("无法获取最新版本号");
            return;
        }
        log("isDevMode=["+isDevMode+"] 之前已经获取到最新版本号latestVersionName=["+latestVersionName+"]");
        if (!isDevMode && parseInt(latestVersionName.split(".").join("")) <= parseInt(version.split(".").join(""))) {
            toastLog("无需更新");
            //检查当前版本的文件数据
            checkAgainstUpdateListAndFix();
            return;
        }
        const extraFileNames = ["main.js", "floatUI.js"];
        let downloaded = downloadAndVerifyEssentialFiles(latestVersionName, extraFileNames);
        if (downloaded == null) {
            setVersionMsgToastLog("有文件下载或验证失败，请稍后重试");
            return;
        }
        setVersionMsgLog("已下载必要文件，写入...", "#666666", true);
        for (let fileName in downloaded) {
            let writeToPath = fileName.split("/").reduce((p, c) => files.join(p, c), files.cwd());
            files.ensureDir(writeToPath);
            files.writeBytes(writeToPath, downloaded[fileName]);
        }
        restartApp(); //如果有文件缺失或损坏，重启后会处理
    } catch (e) {
        toastLog("更新过程出错");
        log(e);
    } finally {
        ui.run(function() {ui.swipe.setRefreshing(false);});
    }
});

//检查或下载文件数据
function downloadAndWriteUpdateListJSON(specifiedVersionName) {
    let downloaded = downloadAndVerifyEssentialFiles(specifiedVersionName, []);
    if (downloaded == null) {
        setVersionMsgToastLog("下载文件数据列表失败");
        return;
    }

    try {
        for (let fileName in downloaded) {
            let result = downloaded[fileName];
            let writeToPath = fileName.split("/").reduce((p, c) => files.join(p, c), files.cwd());
            files.ensureDir(writeToPath);
            if (files.exists(writeToPath) && files.isEmptyDir(writeToPath)) {
                log("为了写入文件数据列表而删除占位的空目录");
                files.remove(writeToPath);
            }
            if (files.exists(writeToPath) && !files.isFile(writeToPath)) {
                toastLog("可能被非空目录占位，无法写入文件数据列表到文件");
                return;
            }
            log("写入文件数据列表到文件");
            files.writeBytes(writeToPath, result);
        }
        return downloaded["update/updateList.json"];
    } catch (e) {
        log(e);
        setVersionMsgToastLog("写入文件数据列表失败");
    }
}

function checkFile(fileName, fileHash) {
    let filePath = files.join(files.cwd(), fileName);
    if (!files.exists(filePath) || !files.isFile(filePath)) {
        log("发现缺失的文件: ["+fileName+"]");
        return false;
    }

    let fileBytes = null;
    try {
        fileBytes = files.readBytes(filePath);
    } catch (e) {
        log(e);
        log("读取文件时出错 ["+fileName+"]");
        return false;
    }

    let actualFileHash = "sha256-"+$crypto.digest(fileBytes, "SHA-256", {input: "bytes", output: "base64"});
    if (actualFileHash !== fileHash) {
        log("发现哈希值校验不符的文件: ["+fileName+"]");
        return false;
    }

    log("文件校验通过: ["+fileName+"]");
    return true;
}

function findCorruptOrMissingFile() {
    //从6.1.4开始修正在线更新认不清版本的bug
    //从6.2.0开始验证数字签名
    let specifiedVersionName = version;
    if (parseInt(version.split(".").join("")) < parseInt("6.2.0".split(".").join(""))) {
        specifiedVersionName = "6.2.0";
        log("版本低于6.2.0，先更新文件数据列表到6.2.0");
        if (downloadAndWriteUpdateListJSON(specifiedVersionName) == null) {
            //如果下载或写入不成功
            ui.post(function () {dialogs.alert("警告",
                "下载文件数据列表失败，无法检查文件数据，不能确保文件数据无误。\n"
                +"可以试试在右上角菜单中选择\"切换下载源\"。"
            );});
            return;
        }
    }

    let updateListObj = readUpdateList();

    if (updateListObj == null) {
        downloadAndWriteUpdateListJSON(specifiedVersionName);
        updateListObj = readUpdateList();
    }

    if (updateListObj == null) {
        toastLog("无法读取或下载文件数据列表");
        return;
    }
    if (updateListObj.versionName == null) {
        toastLog("文件数据列表缺失版本号");
        return;
    }
    if (updateListObj.fileRootNode == null || !Array.isArray(updateListObj.fileRootNode) || updateListObj.fileRootNode.length == 0) {
        toastLog("文件数据列表不含有效文件信息");
        return;
    }

    let updateList = walkThrough(updateListObj.fileRootNode);

    let corruptOrMissingFileList = [];
    updateList.forEach((item) => {
        //覆写project.json会导致下次启动时文件被强制回滚
        if (item.src === "project.json" || item.src === "/project.json" || item.src === "./project.json") {
            item.origFileName = item.src;
            item.src = item.src.replace("project.json", "project-updated.json");
        }

        //先检查project.json哈希值是否符合，如果符合就不加入corruptOrMissingFileList，也就不会被覆写
        if (item.origFileName != null && checkFile(item.origFileName, item.integrity)) return;
        //如果不符合，后面下载时会用project.json这个文件名，而写入时会用project-updated.json
        //除了这个特例之外的其他一般文件也是直接检查即可
        else if (checkFile(item.src, item.integrity)) return;

        corruptOrMissingFileList.push(item);
    });

    (corruptOrMissingFileList.length == 0 ? log : setVersionMsgLog)("发现 "+corruptOrMissingFileList.length+" 个文件丢失或损坏");

    return {
        versionName: updateListObj.versionName,
        corruptOrMissingFileList: corruptOrMissingFileList,
    };
}

var fixFiles = sync(function (corruptOrMissingFileList, specifiedVersionName) {
    if (corruptOrMissingFileList == null || !Array.isArray(corruptOrMissingFileList) || corruptOrMissingFileList.length == 0) {
        toastLog("未传入有效的损坏或丢失文件列表，无法继续进行修复");
        return false;
    }
    if (specifiedVersionName == null || typeof specifiedVersionName !== "string") {
        toastLog("未传入有效版本号，无法继续进行修复");
        return false;
    }

    if (corruptOrMissingFileList.length == 0) {
        toastLog("传入了空的损坏或丢失文件列表，无法继续进行修复");
        return false;
    }

    setVersionMsgLog("开始下载文件数据以供修复...", "#666666");

    let downloadedCount = corruptOrMissingFileList.filter((item) => item.dataBytes != null).length;
    corruptOrMissingFileList.forEach((item) => {
        if (item.dataBytes == null) try {
            log("下载文件 ["+item.src+"]");
            let resp = http.get(getDownloadURLBase(specifiedVersionName)+"/"+(item.origFileName != null ? item.origFileName : item.src));
            if (resp.statusCode == 200) {
                let downloadedBytes = resp.body.bytes();

                let downloadedHash = "sha256-"+$crypto.digest(downloadedBytes, "SHA-256", {input: "bytes", output: "base64"});
                if (downloadedHash !== item.integrity) {
                    log("下载到的文件哈希值校验不符: ["+item.src+"]");
                    return;
                }

                item.dataBytes = downloadedBytes;
                downloadedCount++;
                setVersionMsg("已下载文件 "+downloadedCount+"/"+corruptOrMissingFileList.length+" 个", "#666666");
            } else {
                log("下载文件 ["+item.src+"] 失败\n"+resp.statusCode+" "+resp.statusMessage);
            }
        } catch (e) {
            log(e);
            log("下载文件 ["+item.src+"] 出错");
        }
    });

    if (corruptOrMissingFileList.find((item) => item.dataBytes == null)) {
        setVersionMsgToastLog("有"+(corruptOrMissingFileList.length-downloadedCount)+"个文件下载失败");
        return false;
    }

    let writtenCount = 0;
    corruptOrMissingFileList.forEach((item) => {
        let filePath = files.join(files.cwd(), item.src);
        try {
            files.ensureDir(filePath);

            if (files.exists(filePath) && files.isEmptyDir(filePath)) {
                log("删除空目录 ["+item.src+"]");
                files.remove(filePath);
            }

            if (!files.exists(filePath) || files.isFile(filePath)) {
                log("写入文件 ["+item.src+"]");
                files.writeBytes(filePath, item.dataBytes);
                item.isWritten = true;
                writtenCount++;
                setVersionMsg("已写入文件 "+writtenCount+"/"+corruptOrMissingFileList.length+" 个", "#666666");
            } else {
                log("可能被非空目录占位，无法写入文件 ["+item.src+"]");
                item.isWritten = false;
            }
        } catch (e) {
            log(e);
            log("写入文件时出错 ["+item.src+"]");
            item.isWritten = false;
        }
    });

    if (corruptOrMissingFileList.find((item) => !item.isWritten)) {
        setVersionMsgToastLog("有"+(corruptOrMissingFileList.length-writtenCount)+"个文件写入失败");
        return false;
    }

    setVersionMsgLog("文件数据更新完成\n即将重启app", "#666666");

    restartApp();

    return true;
});

var checkAgainstUpdateListAndFix = sync(function (showResult) {
    let ret = findCorruptOrMissingFile();
    if (ret == null) {
        toastLog("检查文件时出错");
        return;
    }
    let corruptOrMissingFileList = ret.corruptOrMissingFileList;
    let specifiedVersionName = ret.versionName;
    if (Array.isArray(corruptOrMissingFileList)) {
        if (corruptOrMissingFileList.length > 0) {
            if (specifiedVersionName !== latestVersionName && getChosenDownloadSource() !== "jsdelivr") {
                dialogs.alert("发现文件缺失或损坏", "请确保网络通畅，然后下拉更新到最新版");
                return; //只有jsdelivr支持指定版本号下载
            }
            function promptRepair(textMsg) {ui.post(function () {
                dialogs.confirm(
                    "发现文件缺失或损坏",
                    textMsg
                ).then((value) => {
                    if (value) {
                        threads.start(function () {
                            if (!fixFiles(corruptOrMissingFileList, specifiedVersionName)) {
                                promptRepair("下载或写入文件失败。要重试么？\n"
                                +"也可以试试先点击\"取消\"再在右上角菜单中选择\"切换下载源\"。\n"
                                +"一共有"+corruptOrMissingFileList.length+"个文件需要修复，\n"
                                +"其中有"+corruptOrMissingFileList.filter((item) => item.dataBytes == null).length+"个文件需要重新下载。");
                            }
                        });
                    }
                });
            });}
            promptRepair("检查发现有"+corruptOrMissingFileList.length+"个文件缺失或损坏，要尝试重新下载来修复么？");
        } else if (version !== specifiedVersionName) {
            ui.post(function () {
                dialogs.confirm("更新完毕", "马上会再重启一次app")
                .then(function () {
                    restartApp();
                });
            });
        } else {
            if (showResult) {
                ui.run(function () {
                    dialogs.alert("检查完成", "未发现有文件缺失或损坏");
                });
            }
        }
    }
});

floatUI.enableToastParamChanges();
function delayedRecoverLastWork(countDown) {
    if (countDown == null) countDown = 10;
    if (!(countDown > 0)) return;
    ui.post(function () {
        if (auto.service != null && auto.root != null) {
            log("无障碍服务已开启，恢复上次执行的脚本...");
            floatUI.recoverLastWork();
        } else {
            if (--countDown > 0) {
                log("无障碍服务还未开启，稍后重试恢复上次执行的脚本（剩余重试次数："+countDown+"）");
                delayedRecoverLastWork(countDown);
            } else {
                log("没等到无障碍服务开启，不再重试恢复上次执行的脚本");
            }
        }
    }, 2000);
}
if (floatUI.storage.get("autoRecover", false)) {
    let lastTask = null;
    try {
        let lastTaskJson = floatUI.storage.get("last_limit_json", "null");
        lastTask = JSON.parse(lastTaskJson);
    } catch (e) {
        lastTask = null;
    }
    if (lastTask != null) {
        delayedRecoverLastWork(10);
    }
}