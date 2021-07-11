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
    //isGameDead和getFragmentViewBounds其实是在后面定义的
    if (isGameDead() == "crashed") {
        log("游戏已经闪退,放弃点击");
        return;
    }
    if (y == null) {
        var point = x;
        x = point.x;
        y = point.y;
    }
    // limit range
    var sz = getFragmentViewBounds();
    if (x < sz.left) {
        x = sz.left;
    }
    if (x >= sz.right) {
        x = sz.right - 1;
    }
    if (y < sz.top) {
        y = sz.top;
    }
    if (y >= sz.bottom) {
        y = sz.bottom - 1;
    }
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
    //isGameDead和getFragmentViewBounds其实是在后面定义的
    if (isGameDead() == "crashed") {
        log("游戏已经闪退,放弃滑动");
        return;
    }
    // 解析参数
    var points = [];
    if (arguments.length > 5) throw new Error("compatSwipe: incorrect argument count");
    for (let i=0; i<arguments.length; i++) {
        if (isNaN(parseInt(arguments[i]))) {
            //参数本身就（可能）是一个坐标点对象
            points.push(arguments[i]);
        } else {
            //参数应该是坐标X值或滑动时长
            if (i < arguments.length-1) {
                //存在下一个参数，则把这个参数视为坐标X值，下一个参数视为坐标Y值
                points.push({x: parseInt(arguments[i]), y: parseInt(arguments[i+1])});
                i++;
            } else {
                //不存在下一个参数，这个参数应该是滑动时长
                duration = parseInt(arguments[i]);
            }
        }
        //坐标X、Y值应该都是数字
        if (isNaN(points[points.length-1].x) || isNaN(points[points.length-1].y))
            throw new Error("compatSwipe: invalid arguments (invalid point)");
        //又一个坐标点被加入，最多加入2个点，不允许加入第3个点
        if (points.length > 2) {
            throw new Error("compatSwipe invalid arguments (added more than 2 points)");
        }
    }
    x1 = points[0].x;
    y1 = points[0].y;
    x2 = points[1].x;
    y2 = points[1].y;

    // limit range
    var sz = getFragmentViewBounds();
    if (x1 < sz.left) {
        x1 = sz.left;
    }
    if (x1 >= sz.right) {
        x1 = sz.right - 1;
    }
    if (y1 < sz.top) {
        y1 = sz.top;
    }
    if (y1 >= sz.bottom) {
        y1 = sz.bottom - 1;
    }
    if (x2 < sz.left) {
        x2 = sz.left;
    }
    if (x2 >= sz.right) {
        x2 = sz.right - 1;
    }
    if (y2 < sz.top) {
        y2 = sz.top;
    }
    if (y2 >= sz.bottom) {
        y2 = sz.bottom - 1;
    }

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
    // system version higher than Android 7.0
    log("使用滑动模拟按住");
    compatSwipe(x, y, x, y, duration);
}
compatClickSwipe.press = compatPress;

module.exports = compatClickSwipe;