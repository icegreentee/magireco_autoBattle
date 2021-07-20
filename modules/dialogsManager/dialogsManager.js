//对话框模块，用来避免脚本停了对话框却没消失的问题

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var dialogsManager = {};
var MODULES = {};


function init() {
    MODULES = dialogsManager.MODULES;
}
dialogsManager.init = init;

//被打开的所有对话框（用于在线程退出时dismiss）
var openedDialogs = {openedDialogCount: 0};
var openedDialogsLock = threads.lock();

function deleteDialogAndSetResult(openedDialogsNode, result) {
    //调用dialogs.build时貌似又会触发一次dismiss，然后造成openedDialogsLock死锁，所以这里return来避免这个死锁
    if (openedDialogsNode.alreadyDeleted.getAndIncrement() != 0) return;

    let count = openedDialogsNode.count;

    try {
        openedDialogsLock.lock();
        delete openedDialogs[""+count];
    } catch (e) {
        logException(e);
        throw e;
    } finally {
        openedDialogsLock.unlock();
    }

    openedDialogsNode.dialogResult.setAndNotify(result);
}

function buildAndShow() { let openedDialogsNode = {}; try {
    openedDialogsLock.lock();

    let count = ++openedDialogs.openedDialogCount;
    openedDialogs[""+count] = {node: openedDialogsNode};
    openedDialogsNode.count = count;

    var dialogType = arguments[0];
    var title = arguments[1];
    var content = arguments[2];
    var prefill = content;
    var callback1 = arguments[3];
    var callback2 = arguments[4];
    if (dialogType == "rawInputWithContent") {
        prefill = arguments[3];
        callback1 = arguments[4];
        callback2 = arguments[5];
    }
    if (title == null) title = "";
    if (content == null) content = "";
    if (prefill == null) prefill = "";

    openedDialogsNode.dialogResult = threads.disposable();

    let dialogParams = {title: title};
    if (dialogType != "select") dialogParams.positive = "确定";

    switch (dialogType) {
        case "alert":
            dialogParams["content"] = content;
            break;
        case "select":
            if (callback2 != null) dialogParams["negative"] = "取消";
            dialogParams["items"] = content;
            dialogParams["itemsSelectMode"] = "select";
            break;
        case "confirm":
            dialogParams["negative"] = "取消";
            dialogParams["content"] = content;
            break;
        case "rawInputWithContent":
            if (content != null && content != "") dialogParams["content"] = content;
        case "rawInput":
            if (callback2 != null) dialogParams["negative"] = "取消";
            dialogParams["inputPrefill"] = prefill;
            break;
    }

    let newDialog = dialogs.build(dialogParams);

    openedDialogsNode.alreadyDeleted = threads.atomic(0);
    newDialog = newDialog.on("dismiss", () => {
        //dismiss应该在positive/negative/input之后，所以应该不会有总是传回null的问题
        //其中，positive/input之后应该不会继续触发dismiss，只有negative才会
        deleteDialogAndSetResult(openedDialogsNode, null);
    });

    if (dialogType != "rawInput" && dialogType != "rawInputWithContent" && dialogType != "select") {
        newDialog = newDialog.on("positive", () => {
            if (callback1 != null) callback1();
            //如果dialogs.build是第一次触发dismiss并调用deleteDialogAndSetResult，仍然会死锁，所以这里也要避免这个问题
            deleteDialogAndSetResult(openedDialogsNode, true);
        });
    }

    switch (dialogType) {
        case "alert":
            break;
        case "select":
            newDialog = newDialog.on("item_select", (index, item, dialog) => {
                if (callback1 != null) callback1();
                deleteDialogAndSetResult(openedDialogsNode, index);
            });
            //不break
        case "confirm":
            newDialog = newDialog.on("negative", () => {
                if (callback2 != null) callback2();
                //如果dialogs.build是第一次触发dismiss并调用deleteDialogAndSetResult，仍然会死锁，所以这里也要避免这个问题
                deleteDialogAndSetResult(openedDialogsNode, false);
            });
            break;
        case "rawInputWithContent":
        case "rawInput":
            newDialog = newDialog.on("input", (input) => {
                if (callback1 != null) callback1();
                //如果dialogs.build是第一次触发dismiss并调用deleteDialogAndSetResult，仍然会死锁，所以这里也要避免这个问题
                deleteDialogAndSetResult(openedDialogsNode, input);
            });
            newDialog = newDialog.on("negative", () => {
                if (callback2 != null) callback2();
                //如果dialogs.build是第一次触发dismiss并调用deleteDialogAndSetResult，仍然会死锁，所以这里也要避免这个问题
                deleteDialogAndSetResult(openedDialogsNode, null);
            });
            break;
    }

    openedDialogsNode.dialog = newDialog;

    newDialog.show();
} catch (e) {
    logException(e);
    throw e;
} finally {
    openedDialogsLock.unlock();
} return openedDialogsNode.dialogResult.blockedGet(); }
dialogsManager.buildAndShow = buildAndShow;

function alert(title, content, callback) {
    return buildAndShow("alert", title, content, callback);
}
dialogsManager.alert = alert;

function select(title, items, callback1, callback2) {
    return buildAndShow("select", title, items, callback1, callback2);
}
dialogsManager.select = select;

function confirm(title, content, callback1, callback2) {
    return buildAndShow("confirm", title, content, callback1, callback2);
}
dialogsManager.confirm = confirm;

function rawInput(title, prefill, callback1, callback2) {
    return buildAndShow("rawInput", title, prefill, callback1, callback2);
}
dialogsManager.rawInput = rawInput;

function rawInputWithContent(title, content, prefill, callback1, callback2) {
    return buildAndShow("rawInputWithContent", title, content, prefill, callback1, callback2);
}
dialogsManager.rawInputWithContent = rawInputWithContent;

function dismissAll() {
    log("关闭所有无主对话框...");
    try {
        openedDialogsLock.lock();//先加锁，dismiss会等待解锁后再开始删
        for (let key in openedDialogs) {
            if (key != "openedDialogCount") {
                openedDialogs[key].node.dialog.dismiss();
            }
        }
    } catch (e) {
        logException(e);
        throw e;
    } finally {
        openedDialogsLock.unlock();
    }
    //等待dismiss删完，如果不等删完的话，下一次启动的脚本调用对话框又会死锁
    log("等待无主对话框全部清空...");
    while (true) {
        let remaining = 0;
        try {
            openedDialogsLock.lock();
            for (let key in openedDialogs) {
                if (key != "openedDialogCount") {
                    remaining++;
                }
            }
        } catch (e) {
            logException(e);
            throw e;
        } finally {
            openedDialogsLock.unlock();
        }
        if (remaining == 0) break;
        sleep(100);
    }
    log("无主对话框已全部清空");
}
dialogsManager.dismissAll = dismissAll;


module.exports = dialogsManager;