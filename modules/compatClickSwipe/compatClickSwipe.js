//兼容Android 7以下的点击模块

// 捕获异常时打log记录详细的调用栈
function logException(e) {
    try { throw e; } catch (caught) {
        Error.captureStackTrace(caught, logException);
        //log(e, caught.stack); //输出挤在一行里了，不好看
        log(e);
        log(caught.stack);
    }
}

var compatClickSwipe = {};
compatClickSwipe.shellCmd = null;//需要外部传入

//虽然函数名里有Root，实际上用的可能还是adb shell权限
function clickOrSwipeRoot(x1, y1, x2, y2, duration) {
    var cmd = null;
    var logString = null;
    switch (arguments.length) {
        case 5:
            cmd = "input swipe "+x1+" "+y1+" "+x2+" "+y2+(duration==null?"":(" "+duration));
            logString = "模拟滑动: ["+x1+","+y1+" => "+x2+","+y2+"]"+(duration==null?"":(" ("+duration+"ms)"));
            break;
        case 2:
            cmd = "input tap "+x1+" "+y1;
            logString = "模拟点击: ["+x1+","+y1+"]";
            break;
        default:
            throw new Error("clickOrSwipeRoot: invalid argument count");
    }
    if (compatClickSwipe.shellCmd == null) {
        throw new Error("shellCmd module not passed in");
    } else {
        compatClickSwipe.shellCmd.privShell(cmd, logString);
    }
}

function compatClick(x, y) {
    // system version higher than Android 7.0
    if (device.sdkInt >= 24) {
        // now accessibility gesture APIs are available
        log("使用无障碍服务模拟点击坐标 "+x+","+y);
        click(x, y);
        log("点击完成");
    } else {
        clickOrSwipeRoot(x, y);
    }
}
compatClickSwipe.click = compatClick;

function getDefaultSwipeDuration(x1, x2, y1, y2) {
    // 默认滑动时间计算，距离越长时间越长
    let swipe_distance = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
    let screen_diagonal = Math.sqrt(Math.pow((device.width), 2) + Math.pow((device.height), 2));
    return parseInt(1500 + 3000 * (swipe_distance / screen_diagonal));
}

function compatSwipe(x1, y1, x2, y2, duration) {
    // system version higher than Android 7.0
    if (device.sdkInt >= 24) {
        log("使用无障碍服务模拟滑动 "+x1+","+y1+" => "+x2+","+y2+(duration==null?"":(" ("+duration+"ms)")));
        swipe(x1, y1, x2, y2, duration != null ? duration : getDefaultSwipeDuration(x1, x2, y1, y2)); //最后一个参数不能缺省
        log("滑动完成");
    } else {
        clickOrSwipeRoot(x1, y1, x2, y2, duration != null ? duration : getDefaultSwipeDuration(x1, x2, y1, y2));
    }
}
compatClickSwipe.swipe = compatSwipe;

function compatPress(x, y, duration) {
    log("使用滑动模拟按住");
    compatSwipe(x, y, x, y, duration);
}
compatClickSwipe.press = compatPress;

module.exports = compatClickSwipe;