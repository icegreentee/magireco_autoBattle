"ui";
importClass(android.view.View)
importClass(android.graphics.Color)
importClass(android.view.MenuItem)
importClass(com.stardust.autojs.project.ProjectConfig)
importClass(com.stardust.autojs.core.ui.inflater.util.Ids)
importClass(Packages.androidx.core.graphics.drawable.DrawableCompat)
importClass(Packages.androidx.appcompat.content.res.AppCompatResources)

var Name = "AutoBattle";
var version = "4.8.0";
var appName = Name + " v" + version;

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}


//isDevMode为true时不检查模块哈希值
const isDevMode = true;

//已加载模块列表
var MODULES = {};

function checkModuleByName(moduleName) {
    if (MODULES.onlineUpdate == null) {
        log("尚未加载模块 [onlineUpdate] 故暂不检查哈希值");
        return true;
    }
    if (typeof MODULES.onlineUpdate.verifyModule != "function") {
        log("错误: 未定义onlineUpdate.verifyModule函数");
        return false;
    }
    if (!MODULES.onlineUpdate.verifyModule(moduleName, false)) {
        return false;
    }
    return true;
}

function loadLocalModule(moduleInfo) {
    let moduleName = moduleInfo.name;
    if (moduleName == "main") {
        log("loadLocalModule错误: moduleName是main");
        return false;
    }

    log("从本地加载模块 ["+moduleName+"] ...");
    let moduleDeps = moduleInfo.deps;
    for (let depName of moduleDeps) {
        if (MODULES[depName] == null) {
            log("错误: 模块 ["+moduleName+"] 所依赖的 ["+depName+"] 尚未加载");
            return false;
        }
    }

    try {
        MODULES[moduleName] = require("modules/"+moduleName+"/"+moduleName+".js");
    } catch (e) {
        logException(e);
        log("加载模块 ["+moduleName+"] 时出错");
        return false;
    }

    let mod = MODULES[moduleName];
    mod.appVersion = version;
    mod.MODULES = MODULES;

    if (typeof mod.init == "function") {
        log("初始化模块 ["+moduleName+"] ...");
        try {
            mod.init();
        } catch (e) {
            logException(e);
            log("初始化模块 ["+moduleName+"] 时出错");
            return false;
        }
    }

    log("模块 ["+moduleName+"] 已加载完成");
    return true;
}

var localModuleInfoList = null;
try {
    localModuleInfoList = JSON.parse(files.read(files.join(files.cwd(), "modules.json")));
} catch (e) {
    log(e);
    localModuleInfoList = null;
}

var isAllModulesLoaded = false;
function loadAllLocalModules() {
    if (localModuleInfoList == null) {
        return false;
    }
    //优先加载onlineUpdate模块
    let onlineUpdateModuleInfo = localModuleInfoList.find((val) => val.name == "onlineUpdate");
    if (!loadLocalModule(onlineUpdateModuleInfo)) {
        return false;
    }
    MODULES.onlineUpdate.isDevMode = isDevMode;
    if (!isDevMode) {
        //检查主程序哈希值
        if (!checkModuleByName("main")) {
            return false;
        }
        //检查所有模块的的哈希值
        for (let moduleInfo of localModuleInfoList) {
            if (!checkModuleByName(moduleInfo.name)) return false;
        }
    }
    //加载其余的所有模块
    for (let moduleInfo of localModuleInfoList) {
        if (moduleInfo.name == "onlineUpdate") continue;
        if (!loadLocalModule(moduleInfo)) {
            return false;
        }
    }
    return true;
}
isAllModulesLoaded = loadAllLocalModules();

/* 加载模块失败 */

if (!isAllModulesLoaded) {
    //显示升级UI
    ui.statusBarColor("#FF4FB3FF");
    ui.layout(
        <relative id="container">
            <appbar id="appbar" w="*">
                <toolbar id="toolbar" bg="#ff4fb3ff" title="{{appName}}" />
            </appbar>
            <androidx.swiperefreshlayout.widget.SwipeRefreshLayout id="swipe" layout_below="appbar">
                <ScrollView id="content">
                    <vertical gravity="center" layout_weight="1">
                        <vertical id="upgrading_vertical" margin="0 5" padding="10 6 0 6" bg="#ffffff" w="*" h="auto" elevation="1dp">
                            <text id="upgrading_title" text="升级中,请稍等..." textColor="#FFCC00" textSize="20" w="wrap_content" h="wrap_content"/>
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
        return wrapped;
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
        item = menu.add("查看日志");
        item.setIcon(getTintDrawable("ic_assignment_black_48dp", colors.WHITE));
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_WITH_TEXT);
    });

    ui.emitter.on("options_item_selected", (e, item) => {
        switch (item.getTitle()) {
            case "查看日志":
                app.startActivity("console")
                break;
        }
        e.consumed = true;
    });

    activity.setSupportActionBar(ui.toolbar);

    //下载onlineUpdate模块
    function downloadOnlineUpdateModule() {
        toastLog("下载在线更新模块 [onlineUpdate] ...");
        const updateURLBase = "https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle";
        let updateURLBaseWithVersion = updateURLBase+"@latest";
        let url = updateURLBaseWithVersion+"/modules/onlineUpdate/onlineUpdate.js"
        http.__okhttp__.setTimeout(5000);
        let response = null;
        try {
            response = http.get(url);
        } catch (e) {
            logException(e);
            toastLog("下载在线更新模块 [onlineUpdate] 时出错");
            return false;
        }
        if (response.statusCode != 200) {
            toastLog("下载在线更新模块 [onlineUpdate] 时出错\n"+response.statusCode+" "+response.statusMessage);
            log("完整URL: ["+url+"]");
            return false;
        }
        log("写入文件 [onlineUpdate.js] ...");
        let downloadedString = response.body.string();
        let downloadedStringLF = downloadedString.split("\r").join("");
        let path = files.join(files.cwd(), "modules");
        path = files.join(path, "onlineUpdate");
        path = files.join(path, "onlineUpdate.js");
        files.ensureDir(path);
        files.write(path, downloadedString);
        if (!files.isFile(path)) {
            toastLog("写入文件 [onlineUpdate.js] 失败");
            return false;
        }
        log("加载在线更新模块 [onlineUpdate] ...");
        try {
            MODULES.onlineUpdate = require("modules/onlineUpdate/onlineUpdate.js");
            MODULES.onlineUpdate.appVersion = version;
            MODULES.onlineUpdate.MODULES = MODULES;
            MODULES.onlineUpdate.isDevMode = isDevMode;
        } catch (e) {
            logException(e);
            toastLog("加载模块 [onlineUpdate] 失败");
            return false;
        }
        log("在线更新模块 [onlineUpdate] 下载并加载完成");
        return true;
    }

    var updateOnSwipeRunnable = sync(function () {
        if (!downloadOnlineUpdateModule()) return;
        if (typeof MODULES.onlineUpdate.updateEverythingToLatest == "function") {
            //更新所有组件到最新版
            if (MODULES.onlineUpdate.updateEverythingToLatest(true)) {
                //更新成功,重启
                MODULES.onlineUpdate.restart();
            }
        } else {
            toastLog("更新错误,未定义updateEverythingToLatest函数");
        }
    });

    //监听刷新事件
    ui.swipe.setOnRefreshListener({
        onRefresh: function () {
            threads.start(function () {
                updateOnSwipeRunnable();
                ui.run(function () {ui.swipe.setRefreshing(false);});
            });
        },
    });

    //开始在线更新/修复
    threads.start(function () {
        if (!downloadOnlineUpdateModule()) return;
        if (localModuleInfoList == null) {
            if (typeof MODULES.onlineUpdate.updateEverythingToLatest == "function") {
                //modules.json文件缺失或解析失败,干脆直接更新所有组件到最新版
                if (MODULES.onlineUpdate.updateEverythingToLatest(true)) {
                    //更新成功,重启
                    MODULES.onlineUpdate.restart();
                }
            } else {
                toastLog("更新错误,未定义updateEverythingToLatest函数");
            }
        } else if (typeof MODULES.onlineUpdate.verifyModule == "function") {
            //检查并修复现有版本
            if (isDevMode) {
                if (MODULES.onlineUpdate.updateEverythingToLatest(true)) {
                    MODULES.onlineUpdate.restart();
                }
            } else {
                let isAllSucceeded = true;
                if (!MODULES.onlineUpdate.verifyModule("main", false)) {
                    if (!MODULES.onlineUpdate.updateModuleToVersion("main", version)) {
                        isAllSucceeded = false;
                    }
                }
                localModuleInfoList.forEach(function (val) {
                    if (!MODULES.onlineUpdate.updateModuleToVersion(val.name, version)) {
                        isAllSucceeded = false
                    }
                });
                if (isAllSucceeded) {
                    //重启
                    MODULES.onlineUpdate.restart();
                }
            }
        } else {
            toastLog("更新错误,未定义verifyModule函数");
        }
    });
}