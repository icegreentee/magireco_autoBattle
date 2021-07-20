    /* ~~~~~~~~ 镜界自动战斗 开始 ~~~~~~~~ */
    var clickSetsMod = {
        ap: {
            x: 1000,
            y: 50,
            pos: "top"
        },
        apDrug50: {
            x: 400,
            y: 900,
            pos: "center"
        },
        apDrugFull: {
            x: 900,
            y: 900,
            pos: "center"
        },
        apMoney: {
            x: 1500,
            y: 900,
            pos: "center"
        },
        apConfirm: {
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
        startAutoRestart: {
            x: 1800,
            y: 750,
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
        reconnectYes: {
            x: 700,
            y: 750,
            pos: "center"
        },
        followConfirm: {
            x: 1220,
            y: 860,
            pos: "center"
        },
        followClose: {
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
        bpExhaustToBpDrug: {
            x: 1180,
            y: 830,
            pos: "center"
        },
        bpDrugConfirm: {
            x: 960,
            y: 880,
            pos: "center"
        },
        bpDrugRefilledOK: {
            x: 960,
            y: 900,
            pos: "center"
        },
        bpClose: {
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
        mirrorsStartBtn: {
            x: 1423,
            y: 900,
            pos: "center"
        },
        mirrorsOpponent1: {
            x: 1113,
            y: 303,
            pos: "center"
        },
        mirrorsOpponent2: {
            x: 1113,
            y: 585,
            pos: "center"
        },
        mirrorsOpponent3: {
            x: 1113,
            y: 866,
            pos: "center"
        },
        mirrorsCloseOpponentInfo: {
            x: 1858,
            y: 65,
            pos: "center"
        },
        back: {
            x: 100,
            y: 50,
            pos: "top"
        },
        recover_battle: {
            x: 1230,
            y: 730,
            pos: "center"
        },
        skillPanelSwitch: {
            x: 1773,
            y: 927,
            pos: "bottom"
        }
    }

    //已知参照图像，包括A/B/C盘等
    const ImgURLBase = "https://cdn.jsdelivr.net/gh/icegreentee/magireco_autoBattle@4.6.0";
    var knownImgs = {};
    const knownImgURLs = {
        accel: ImgURLBase+"/images/accel.png",
        blast: ImgURLBase+"/images/blast.png",
        charge: ImgURLBase+"/images/charge.png",
        connectIndicator: ImgURLBase+"/images/connectIndicator.png",
        connectIndicatorBtnDown: ImgURLBase+"/images/connectIndicatorBtnDown.png",
        light: ImgURLBase+"/images/light.png",
        dark: ImgURLBase+"/images/dark.png",
        water: ImgURLBase+"/images/water.png",
        fire: ImgURLBase+"/images/fire.png",
        wood: ImgURLBase+"/images/wood.png",
        none: ImgURLBase+"/images/none.png",
        lightBtnDown: ImgURLBase+"/images/lightBtnDown.png",
        darkBtnDown: ImgURLBase+"/images/darkBtnDown.png",
        waterBtnDown: ImgURLBase+"/images/waterBtnDown.png",
        fireBtnDown: ImgURLBase+"/images/fireBtnDown.png",
        woodBtnDown: ImgURLBase+"/images/woodBtnDown.png",
        noneBtnDown: ImgURLBase+"/images/noneBtnDown.png",
        mirrorsWinLetterI: ImgURLBase+"/images/mirrorsWinLetterI.png",
        mirrorsLose: ImgURLBase+"/images/mirrorsLose.png",
        skillLocked: ImgURLBase+"/images/skillLocked.png",
        skillEmptyCHS: ImgURLBase+"/images/skillEmptyCHS.png",
        skillEmptyCHT: ImgURLBase+"/images/skillEmptyCHT.png",
        skillEmptyJP: ImgURLBase+"/images/skillEmptyJP.png",
        OKButton: ImgURLBase+"/images/OKButton.png",
        OKButtonGray: ImgURLBase+"/images/OKButtonGray.png",
    };

    var downloadAllImages = sync(function () {
        while (true) {
            let hasNull = false;
            for (let key in knownImgURLs) {
                if (knownImgs[key] == null) {
                    log("下载图片 "+knownImgURLs[key]+" ...");
                    knownImgs[key] = images.load(knownImgURLs[key]);
                    if (knownImgs[key] == null) hasNull = true;
                }
            }
            if (!hasNull) {
                log("全部图片下载完成");
                break;
            } else {
                log("有图片没下载成功,2秒后重试...");
                sleep(2000);
            }
        }
    });
    threads.start(function () {downloadAllImages();});

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
        our: {
            attrib: {
                topLeft:     { x: 1047, y: 274, pos: "center" },
                bottomRight: { x: 1076, y: 303, pos: "center" }
            },
            floor: {
                topLeft:     { x: 1048, y: 518, pos: "center" },
                bottomRight: { x: 1168, y: 575, pos: "center" }
            }
        },
        their: {
            attrib: {
                topLeft:     { x: 230, y: 275, pos: "center" },
                bottomRight: { x: 259, y: 304, pos: "center" }
            },
            floor: {
                topLeft:     { x: 258, y: 520, pos: "center" },
                bottomRight: { x: 361, y: 573, pos: "center" }
            }
        },
        //our
        //r1c1x: 1090, r1c1y: 280
        //r2c1x: 1165, r2c1y: 383
        //r2c2x: 1420, r2c2y: 383
        //their
        //r1c1x: 230, r1c1y: 275
        //r2c2y: 410, r2c2y: 378
        //r3c1x: 80,  r3c1y:481
        distancex: 255,
        distancey: 103,
        indent: 75
    }

    //我方阵地信息
    var battleField = {
        our: {
            topRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 2 }
            },
            middleRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 2 }
            },
            bottomRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 2 }
            }
        },
        their: {
            topRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 0, columnNum: 2 }
            },
            middleRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 1, columnNum: 2 }
            },
            bottomRow: {
                left:   { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 0 },
                middle: { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 1 },
                right:  { occupied: false, attrib: "none", charaID: -1, rowNum: 2, columnNum: 2 }
            },
            lastAimedAtEnemy: { occupied: true, attrib: "none", charaID: -1, rowNum: 0, columnNum: 0 }
        }
    };
    var rows = ["topRow", "middleRow", "bottomRow"];
    var columns = ["left", "middle", "right"];
    var rowsNum = {topRow: 0, middleRow: 1, bottomRow: 2};
    var columnsNum = {left: 0, middle: 1, right: 2};


    //获取换算后的角色站位所需部分（血条右边框，地板等等）坐标
    function getStandPointCoords(whichSide, rowNum, columnNum, part, corner) {
        let convertedCoords = { x: 0, y: 0, pos: "bottom" };
        let firstStandPoint = knownFirstStandPointCoords[whichSide][part][corner];
        let distancex = knownFirstStandPointCoords.distancex;
        let distancey = knownFirstStandPointCoords.distancey;
        let indent = 0;
        if (whichSide == "our") {
            indent = knownFirstStandPointCoords.indent;
        } else if (whichSide == "their") {
            indent = 0 - knownFirstStandPointCoords.indent;
        } else {
            throw "getStandPointCoordsIncorrectwhichSide";
        }
        convertedCoords.x = firstStandPoint.x + rowNum * indent + distancex * columnNum;
        convertedCoords.y = firstStandPoint.y + rowNum * distancey;
        convertedCoords.pos = firstStandPoint.pos;
        return convertCoords(convertedCoords);
    }
    function getStandPointArea(whichSide, rowNum, columnNum, part) {
        let firstStandPointArea = {
            topLeft:     getStandPointCoords("our", 0, 0, part, "topLeft"),
            bottomRight: getStandPointCoords("our", 0, 0, part, "bottomRight")
        };
        let resultTopLeft = getStandPointCoords(whichSide, rowNum, columnNum, part, "topLeft");
        let result = {
            topLeft: resultTopLeft,
            bottomRight: { //防止图像大小不符导致MSSIM==-1
                x:   resultTopLeft.x + getAreaWidth(firstStandPointArea) - 1,
                y:   resultTopLeft.y + getAreaHeight(firstStandPointArea) - 1,
                pos: resultTopLeft.pos
            }
        };
        return result;
    }

    //截取指定站位所需部分的图像
    function getStandPointImg(screenshot, whichSide, rowNum, columnNum, part) {
        let area = getStandPointArea(whichSide, rowNum, columnNum, part);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    //识别指定站位的属性
    function getStandPointAttrib(screenshot, whichSide, rowNum, columnNum) {
        let similarity = -1;
        for (let i=0; i<diskAttribs.length; i++) {
            let img = getStandPointImg(screenshot, whichSide, rowNum, columnNum, "attrib");
            let testAttrib = diskAttribs[i];
            let refImg = knownImgs[testAttrib];
            let firstStandPointArea = getStandPointArea("our", 0, 0, "attrib");
            let gaussianX = parseInt(getAreaWidth(firstStandPointArea) / 2);
            let gaussianY = parseInt(getAreaHeight(firstStandPointArea) / 2);
            if (gaussianX % 2 == 0) gaussianX += 1;
            if (gaussianY % 2 == 0) gaussianY += 1;
            let gaussianSize = [gaussianX, gaussianY];
            let imgBlur = renewImage(images.gaussianBlur(img, gaussianSize));
            let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
            similarity = images.getSimilarity(refImgBlur, imgBlur, {"type": "MSSIM"});
            if (similarity > 2.1) {
                log("第", rowNum+1, "行，第", columnNum+1, "列站位【有人】 属性", testAttrib, "MSSIM=", similarity);
                return testAttrib;
            }
        }
        log("第", rowNum+1, "行，第", columnNum+1, "列站位无人 MSSIM=", similarity);
        throw "getStandPointAttribInconclusive";
    }

    //扫描战场信息
    function scanBattleField(whichSide)
    {
        log("scanBattleField("+whichSide+")");
        let screenshot = compatCaptureScreen();
        for(let i=0; i<3; i++) {
            for(let j=0; j<3; j++) {
                let whichStandPoint = battleField[whichSide][rows[i]][columns[j]];
                whichStandPoint.occupied = true;
                try {
                    whichStandPoint.attrib = getStandPointAttrib(screenshot, whichSide, i, j);
                } catch (e) {
                    if (e.toString() != "getStandPointAttribInconclusive") log(e);
                    whichStandPoint.attrib = "none";
                    whichStandPoint.occupied = false;
                }
                whichStandPoint.charaID = -1; //现在应该还不太能准确识别，所以统一填上无意义数值，在发动连携后会填上有意义的数值
            }
        }
    }

    //获取有存活角色的站位
    function getAliveStandPoints(whichSide) {
        let result = [];
        for(let i=0; i<3; i++) {
            for(let j=0; j<3; j++) {
                let standPoint = battleField[whichSide][rows[i]][columns[j]];
                if (standPoint.occupied) {
                    result.push(standPoint);
                }
            }
        }
        return result;
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
        attrib: {
            topLeft: {
                x:   349,
                y:   966,
                pos: "bottom"
            },
            bottomRight: {
                x:   378,
                y:   995,
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
            down:        false,
            action:      "accel",
            attrib:      "none",
            charaImg:    null,
            charaID:     0,
            connectable: false,
            connectedTo:   -1
        },
        {
            position:    1,
            priority:    "second",
            down:        false,
            action:      "accel",
            attrib:      "none",
            charaImg:    null,
            charaID:     1,
            connectable: false,
            connectedTo:   -1
        },
        {
            position:    2,
            priority:    "third",
            down:        false,
            action:      "accel",
            attrib:      "none",
            img:         null,
            charaImg:    null,
            charaID:     2,
            connectable: false,
            connectedTo:   -1
        },
        {
            position:    3,
            priority:    "fourth",
            down:        false,
            action:      "accel",
            attrib:      "none",
            charaImg:    null,
            charaID:     3,
            connectable: false,
            connectedTo:   -1
        },
        {
            position:    4,
            priority:    "fifth",
            down:        false,
            action:      "accel",
            attrib:      "none",
            charaImg:    null,
            charaID:     4,
            connectable: false,
            connectedTo:   -1
        }
    ];
    var clickedDisksCount = 0;

    var ordinalWord = ["first", "second", "third", "fourth", "fifth"];
    var ordinalNum = {first: 0, second: 1, third: 2, fourth: 3};
    var diskActions = ["accel", "blast", "charge"];
    var diskAttribs = ["light", "dark", "water", "fire", "wood", "none"];
    var diskAttribsBtnDown = []; for (let i=0; i<diskAttribs.length; i++) { diskAttribsBtnDown.push(diskAttribs[i]+"BtnDown"); }

    function logDiskInfo(disk) {
        let connectableStr = "不可连携";
        if (disk.connectable) connectableStr = "【连携】";
        let downStr = "未按下"
        if (disk.down) downStr = "【按下】"
        log("第", disk.position+1, "号盘", disk.action, "角色", disk.charaID, "属性", disk.attrib, connectableStr, "连携到角色", disk.connectedTo, downStr);

    }

    //获取换算后的行动盘所需部分（A/B/C盘，角色头像，连携指示灯等）的坐标
    function getDiskCoords(diskPos, part, corner) {
        let convertedCoords = { x: 0, y: 0, pos: "bottom" };
        let knownCoords = knownFirstDiskCoords[part][corner];
        let distance = knownFirstDiskCoords.distance;
        convertedCoords.x = knownCoords.x + diskPos * distance;
        convertedCoords.y = knownCoords.y;
        convertedCoords.pos = knownCoords.pos;
        return convertCoords(convertedCoords);
    }
    function getDiskArea(diskPos, part) {
        let firstDiskArea = null;
        if (part == "attrib") { //防止图像大小不符导致MSSIM==-1
            firstDiskArea = getStandPointArea("our", 0, 0, "attrib");
        } else {
            firstDiskArea = {
                topLeft:     getDiskCoords(0, part, "topLeft"),
                bottomRight: getDiskCoords(0, part, "bottomRight")
            };
        }
        let resultTopLeft = getDiskCoords(diskPos, part, "topLeft");
        let result = {
            topLeft: resultTopLeft,
            bottomRight: { //防止图像大小不符导致MSSIM==-1
                x:   resultTopLeft.x + getAreaWidth(firstDiskArea) - 1,
                y:   resultTopLeft.y + getAreaHeight(firstDiskArea) - 1,
                pos: resultTopLeft.pos
            }
        };
        return result;
    }

    //截取行动盘所需部位的图像
    function getDiskImg(screenshot, diskPos, part) {
        let area = getDiskArea(diskPos, part);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }
    function getDiskImgWithTag(screenshot, diskPos, part, tag) {
        let area = getDiskArea(diskPos, part);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)), tag);
    }

    //识别ABC盘或属性
    //除非要识别盘是否按下，否则假设所有盘都没按下
    function recognizeDisk_(capturedImg, recogWhat, threshold) {
        let maxSimilarity = -1.0;
        let mostSimilar = 0;

        let possibilities = null;
        if (recogWhat == "action") {
            possibilities = diskActions;
        } else if (recogWhat.startsWith("attrib")) {
            possibilities = [];
            let recogWhatArr = recogWhat.split("_");
            if (recogWhatArr.length <= 1) {
                throw "recognizeDiskIncorrectAttribrecogWhat";
            } else {
                if (recogWhatArr[1] == "all") {
                    // attrib_all 和按下的所有属性比对
                    for (let i=0; i<diskAttribs.length; i++){
                        possibilities.push(diskAttribs[i]);
                    }
                    for (let i=0; i<diskAttribsBtnDown.length; i++){
                        possibilities.push(diskAttribsBtnDown[i]);
                    }
                } else {
                    // attrib_light/dark/water/fire/wood/none 只和光/暗/水/火/木/无属性比对
                    possibilities = [recogWhatArr[1], recogWhatArr[1]+"BtnDown"];
                }
            }
        } else {
            throw "recognizeDiskUnknownrecogWhat"
        }
        for (let i=0; i<possibilities.length; i++) {
            let refImg = knownImgs[possibilities[i]];
            let firstDiskArea = getDiskArea(0, "action");
            let gaussianX = parseInt(getAreaWidth(firstDiskArea) / 3);
            let gaussianY = parseInt(getAreaHeight(firstDiskArea) / 3);
            if (gaussianX % 2 == 0) gaussianX += 1;
            if (gaussianY % 2 == 0) gaussianY += 1;
            let gaussianSize = [gaussianX, gaussianY];
            let capturedImgBlur = renewImage(images.gaussianBlur(capturedImg, gaussianSize));
            let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
            let similarity = images.getSimilarity(refImgBlur, capturedImgBlur, {"type": "MSSIM"});
            log("与", possibilities[i], "盘的相似度 MSSIM=", similarity);
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                mostSimilar = i;
            }
        }
        if (maxSimilarity < threshold) {
            log("MSSIM=", maxSimilarity, "小于阈值=", threshold, "无法识别", recogWhat);
            throw "recognizeDiskLowerThanThreshold";
        }
        log("识别为", possibilities[mostSimilar], "盘 MSSIM=", maxSimilarity);
        return possibilities[mostSimilar];
    }
    function recognizeDisk() {
        let result = null;
        let capturedImg = null;
        let recogWhat = null;
        let threshold = 0;
        switch (arguments.length) {
        case 2:
            capturedImg = arguments[0];
            recogWhat = arguments[1];
            threshold = 0;
            try {
                result = recognizeDisk_(capturedImg, recogWhat, threshold);
            } catch(e) {
                if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
                result = null;
            }
            if (result == null) {
                if (recogWhat == "action") result = "accel";
                log("当作", result, "盘，继续运行");
            }
            break;
        case 3:
            capturedImg = arguments[0];
            recogWhat = arguments[1];
            threshold = arguments[2];
            result = recognizeDisk_(capturedImg, recogWhat, threshold);
            break;
        default:
            throw "recognizeDiskArgcIncorrect"
        }
        return result;
    }
    function getDiskAction(screenshot, diskPos) {
        let actionImg = getDiskImg(screenshot, diskPos, "action");
        log("识别第", diskPos+1, "盘的A/B/C类型...");
        return recognizeDisk(actionImg, "action");
    }
    function getDiskAttribDown(screenshot, diskPos) {
        let result = {attrib: null, down: false};
        let attribImg = getDiskImg(screenshot, diskPos, "attrib");
        log("识别第", diskPos+1, "盘的光/暗/水/火/木/无属性，以及盘是否被按下...");
        try {
            result.attrib = recognizeDisk(attribImg, "attrib_all", 2.1);
        } catch (e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            result.attrib = null;
        }
        if (result.attrib != null) {
            if (result.attrib.endsWith("BtnDown")) {
                result.down = true;
                let indexEnd = result.attrib.length;
                let indexStart = result.attrib.length - "BtnDown".length;
                result.attrib = result.attrib.substring(indexStart, indexEnd);
            } else {
                result.down = false;
            }
            log("识别结果", result);
            return result;
        }

        log("识别失败，当作没按下的无属性盘处理");
        result.attrib = "none";
        result.down = false;
        return result;
    }
    function isDiskDown(screenshot, diskPos) {
        let attribImg = getDiskImg(screenshot, diskPos, "attrib");
        let disk = allActionDisks[diskPos];
        log("识别第", diskPos+1, "盘 (", disk.attrib, ") 是否被按下...");
        let recogResult = null;
        try {
           recogResult = recognizeDisk(attribImg, "attrib_"+disk.attrib, 2.1);
        } catch (e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            recogResult = null;
        }
        if (recogResult != null) {
            log("识别结果", recogResult);
            if (recogResult.endsWith("BtnDown")) return true;
            return false;
        }

        log("之前识别的盘属性", disk.attrib, "可能有误");
        recogResult = null;
        try {
            recogResult = recognizeDisk(attribImg, "attrib_all", 2.1);
        } catch (e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            recogResult = null;
        }
        if (recogResult != null) {
            log("识别结果", recogResult);
            if (recogResult.endsWith("BtnDown")) return true;
            return false;
        }

        log("无法识别盘是否被按下");
        throw "isDiskDownInconclusive";
    }

    //截取盘上的角色头像
    function getDiskCharaImg(screenshot, diskPos) {
        let tag = ""+diskPos;
        return getDiskImgWithTag(screenshot, diskPos, "charaImg", tag);
    }

    //判断盘是否可以连携
    function isDiskConnectableDown(screenshot, diskPos) {
        let img = getDiskImg(screenshot, diskPos, "connectIndicator");
        let refImg = knownImgs.connectIndicator;
        let firstDiskArea = getDiskArea(0, "connectIndicator");
        let gaussianX = parseInt(getAreaWidth(firstDiskArea) / 3);
        let gaussianY = parseInt(getAreaHeight(firstDiskArea) / 3);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
        let imgBlur = renewImage(images.gaussianBlur(img, gaussianSize));
        let similarity = images.getSimilarity(refImgBlur, imgBlur, {"type": "MSSIM"});
        let result = {connectable: false, down: false};
        if (similarity > 2.1) {
            log("第", diskPos+1, "号盘【可以连携】，MSSIM=", similarity);
            result.connectable = true;
            result.down = false;
            return result;
        }
        let refImgBtnDown = knownImgs.connectIndicatorBtnDown;
        let refImgBtnDownBlur = renewImage(images.gaussianBlur(refImgBtnDown, gaussianSize));
        similarity = images.getSimilarity(refImgBtnDownBlur, imgBlur, {"type": "MSSIM"});
        if (similarity > 2.1) {
            // 这里还无法分辨到底是盘已经按下了，还是因为没有其他人可以连携而灰掉
            log("第", diskPos+1, "号盘可以连携，但是已经被按下，或因为我方只剩一人而无法连携，MSSIM=", similarity);
            result.connectable = true;
            result.down = true;
            return result;
        }
        log("第", diskPos+1, "号盘不能连携，MSSIM=", similarity);
        result = {connectable: false, down: false}; //这里没有进一步判断down的值
        return result;
    }

    //判断两个盘是否是同一角色
    function areDisksSimilar(screenshot, diskAPos, diskBPos) {
        let diskA = allActionDisks[diskAPos];
        let diskB = allActionDisks[diskBPos];
        let imgA = diskA.charaImg;
        let imgB = diskB.charaImg;
        if (imgA == null) imgA = getDiskImg(screenshot, diskAPos, "charaImg");
        if (imgB == null) imgB = getDiskImg(screenshot, diskBPos, "charaImg");
        let firstDiskArea = getDiskArea(0, "charaImg");
        let gaussianX = parseInt(getAreaWidth(firstDiskArea) / 5);
        let gaussianY = parseInt(getAreaHeight(firstDiskArea) / 5);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let imgABlur = renewImage(images.gaussianBlur(imgA, gaussianSize));
        let imgBBlur = renewImage(images.gaussianBlur(imgB, gaussianSize));
        let similarity = images.getSimilarity(imgABlur, imgBBlur, {"type": "MSSIM"});
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
            allActionDisks[i].down = false;
            allActionDisks[i].action = "accel";
            allActionDisks[i].charaImg = null;
            allActionDisks[i].attrib = "none";
            allActionDisks[i].charaID = i;
            allActionDisks[i].connectable = false;
            allActionDisks[i].connectedTo = -1;
        }
        clickedDisksCount = 0;

        //截屏，对盘进行识别
        //这里还是假设没有盘被按下
        let screenshot = compatCaptureScreen();
        for (let i=0; i<allActionDisks.length; i++) {
            let disk = allActionDisks[i];
            disk.action = getDiskAction(screenshot, i);
            disk.charaImg = getDiskCharaImg(screenshot, i);
            let isConnectableDown = isDiskConnectableDown(screenshot, i); //isConnectableDown.down==true也有可能是只剩一人无法连携的情况，
            disk.connectable = isConnectableDown.connectable && (!isConnectableDown.down); //所以这里还无法区分盘是否被按下，但是可以排除只剩一人无法连携的情况
            let diskAttribDown = getDiskAttribDown(screenshot, i);
            disk.attrib = diskAttribDown.attrib;
            disk.down = diskAttribDown.down; //这里，虽然getDiskAttribDown()可以识别盘是否按下，但是因为后面分辨不同的角色的问题还无法解决，所以意义不是很大
        }
        //分辨不同的角色，用charaID标记
        //如果有盘被点击过，在有属性克制的情况下，这个检测可能被闪光特效干扰
        //如果有按下的盘，这里也会把同一位角色误判为不同角色
        for (let i=0; i<allActionDisks.length-1; i++) {
            let diskI = allActionDisks[i];
            for (let j=i+1; j<allActionDisks.length; j++) {
                let diskJ = allActionDisks[j];
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

    //找出可以给出连携的盘
    function getConnectableDisks(disks) {
        let result = [];
        for (let i=0; i<disks.length; i++) {
            var disk = disks[i];
            if (disk.connectable && (!disk.down)) result.push(disk);
        }
        return result;
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

    //返回指定属性的盘（光/暗/水/火/木/无）
    function findSameAttribDisks(disks, attrib) {
        let result = [];
        for (let i=0; i<disks.length; i++) {
            var disk = disks[i];
            if (disk.attrib == attrib) result.push(disk);
        }
        return result;
    }

    //获取不被对面克制属性的盘
    function findNonDisadvAttribDisks(disks, enemies) {
        let result = [];
        for (let type of ["adv", "neutral"]) {
            let advOrNeutralAttribs = getAdvDisadvAttribsOfStandPoints(enemies, type);
            for (let attrib of advOrNeutralAttribs) {
                let advOrNeutralAttribDisks = findSameAttribDisks(disks, attrib)
                advOrNeutralAttribDisks.forEach((disk) => result.push(disk));
            }
        }
        //只留下不重复的
        let resultDedup = [];
        for (let disk of result) {
            if (resultDedup.find((val) => disk.position == val.position) == null) {
                resultDedup.push(disk);
            }
        }
        result = resultDedup;
        return result;
    }

    //返回优先第N个点击的盘
    function getDiskByPriority(disks, priority) {
        for (let i=0; i<disks.length; i++) {
            disk = disks[i];
            if (disk.priority == priority) return disk;
        }
    }

    //获取克制或被克制属性
    function getAdvDisadvAttribs(attrib, advOrDisadv) {
        let result = [];
        switch (advOrDisadv) {
        case "disadv":
            switch(attrib) {
            case "light": result = ["dark" ]; break;
            case "dark":  result = ["light"]; break;
            case "water": result = ["fire" ]; break;
            case "fire":  result = ["wood" ]; break;
            case "wood":  result = ["water"]; break;
            case "none":  result = [];        break;
            }
            break;
        case "adv":
            switch(attrib) {
            case "light": result = ["dark" ]; break;
            case "dark":  result = ["light"]; break;
            case "water": result = ["wood" ]; break;
            case "fire":  result = ["water"]; break;
            case "wood":  result = ["fire" ]; break;
            case "none":  result = [];        break;
            }
            break;
        case "neutral":
            switch(attrib) {
            case "light": result = ["none", "light"]; break;
            case "dark":  result = ["none", "dark" ]; break;
            case "water": result = ["none", "water"]; break;
            case "fire":  result = ["none", "fire" ]; break;
            case "wood":  result = ["none", "wood" ]; break;
            case "none":  result = ["none", "light", "dark", "water", "fire", "wood"]; break;
            }
            break;
        }
        return result;
    }

    //获取我方克制/弱点/中立属性（对于水队来说弱点属性就是木属性）
    function getAdvDisadvAttribsOfStandPoints(standPoints, advOrDisadv) {
        let result = [];
        let stats = {light: 0, dark: 0, water: 0, fire: 0, wood: 0, none: 0};
        let maxCount = 0;
        for (let i=0; i<standPoints.length; i++) {
            let standPoint = standPoints[i];
            let attribs = getAdvDisadvAttribs(standPoint.attrib, advOrDisadv);
            if (attribs != null) {
                attribs.forEach(function (attrib) {
                    stats[attrib]++;
                    if (stats[attrib] > maxCount) maxCount = stats[attrib];
                });
            }
        }
        //把出现多的排到前面
        for (let i=1; i<=maxCount; i++) {
            for (let attrib in stats) {
                let count = stats[attrib];
                if (count == i) {
                    result.splice(0, 0, attrib);
                }
            }
        }
        return result;
    }

    //选择指定属性的敌人
    function getEnemiesByAttrib(targetedAttrib) {
        log("getEnemiesByAttrib(", targetedAttrib, ")");
        let result = [];
        for (let i=0; i<rows.length; i++) {
            for (let j=0; j<columns.length; j++) {
                let standPoint = battleField.their[rows[i]][columns[j]];
                if (standPoint.occupied && standPoint.attrib == targetedAttrib) {
                    result.push(standPoint);
                    log(standPoint);
                }
            }
        }
        return result;
    }

    //瞄准指定的敌人
    function aimAtEnemy(enemy) {
        log("aimAtEnemy(", enemy, ")");
        let area = getStandPointArea("their", enemy.rowNum, enemy.columnNum, "floor");
        let areaCenter = getAreaCenter(area);
        let x = areaCenter.x;
        let y = areaCenter.y;
        // MuMu模拟器上tap无效，用swipe代替可解，不知道别的机器情况如何
        swipe(x, y, x, y, 100);
        sleep(50);
        if (!clickBackButtonIfShowed()) {
            log("误触打开了角色信息,多次尝试点击返回却没有效果,退出");
            stopThread();
        }
        battleField["their"].lastAimedAtEnemy = enemy;
    }

    //避免瞄准指定的敌人
    function avoidAimAtEnemies(enemiesToAvoid) {
        log("avoidAimAtEnemies(", enemiesToAvoid, ")");
        let allEnemies = [];
        for (let i=0; i<rows.length; i++) {
            for (let j=0; j<columns.length; j++) {
                let standPoint = battleField.their[rows[i]][columns[j]];
                if (standPoint.occupied) allEnemies.push(standPoint);
            }
        }

        let remainingEnemies = [];
        for (let i=0; i<allEnemies.length; i++) { remainingEnemies.push(allEnemies[i]); }
        for (let i=0; i<remainingEnemies.length; i++) {
            let thisEnemy = remainingEnemies[i];
            let deleted = false;
            for (let j=0; j<enemiesToAvoid.length; j++) {
                let enemyToAvoid = enemiesToAvoid[j];
                if (thisEnemy.rowNum == enemyToAvoid.rowNum || thisEnemy.columnNum == enemyToAvoid.columnNum) {
                    //绕开与指定敌人同一行或同一列的其他敌人，如果可能的话
                    deleted = true;
                }
            }
            if (deleted) {
                remainingEnemies.splice(i, 1);
                i--;
            }
        }
        if (remainingEnemies.length > 0) {
            aimAtEnemy(remainingEnemies[0]);
            return;//如果能绕开同一行或者同一列的其他敌人，那肯定就已经绕开了指定敌人本身
        }

        remainingEnemies = [];
        for (let i=0; i<allEnemies.length; i++) { remainingEnemies.push(allEnemies[i]); }
        for (let i=0; i<remainingEnemies.length; i++) {
            let thisEnemy = remainingEnemies[i];
            let deleted = false;
            for (let j=0; j<enemiesToAvoid.length; j++) {
                let enemyToAvoid = enemiesToAvoid[j];
                if (thisEnemy.rowNum == enemyToAvoid.rowNum && thisEnemy.columnNum == enemyToAvoid.columnNum) {
                    //绕开的指定要避免的敌人本身
                    deleted = true;
                }
            }
            if (deleted) {
                remainingEnemies.splice(i, 1);
                i--;
            }
        }
        if (remainingEnemies.length > 0) aimAtEnemy(remainingEnemies[0]);
    }

    //选盘，实质上是把选到的盘在allActionDisks数组里排到前面
    function prioritiseDisks(disks) {
        log("优先选盘：");
        for (let i=0; i<disks.length; i++) {
            logDiskInfo(disks[i]);
        }
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
        for (let i=clickedDisksCount; i<allActionDisks.length; i++) {
            logDiskInfo(getDiskByPriority(allActionDisks, ordinalWord[i]));
        }
    }


    //进行连携
    function connectDisk(fromDisk) {
        //获取我方有人的站位
        let aliveStandPoints = getAliveStandPoints("our");
        //把不被克制的属性排在前面
        for (let type of ["neutral", "adv"]) {
            let attribs = getAdvDisadvAttribsOfStandPoints([battleField["their"].lastAimedAtEnemy], type);
            attribs.reverse();
            attribs.forEach(function (attrib) {
                let foundIndices = [];
                aliveStandPoints.forEach(function (standPoint, index) {
                    if (standPoint.attrib == attrib) {
                        foundIndices.push(index);
                    }
                });
                for (let i=0; i<foundIndices.length; i++) {
                    let temp = aliveStandPoints[i];
                    aliveStandPoints[i] = aliveStandPoints[foundIndices[i]];
                    aliveStandPoints[foundIndices[i]] = temp;
                }
            });
        }
        //开始尝试连携
        for (let thisStandPoint of aliveStandPoints) {
            if (thisStandPoint.charaID != fromDisk.charaID) {
                //找到有人、并且角色和连携发出角色不同的的站位
                log("从", fromDisk.position+1, "盘向第", thisStandPoint.rowNum+1, "行第", thisStandPoint.columnNum+1, "列站位进行连携");
                let src = getAreaCenter(getDiskArea(fromDisk.position, "charaImg"));
                let dst = getAreaCenter(getStandPointArea("our", thisStandPoint.rowNum, thisStandPoint.columnNum, "floor"));
                //连携划动
                swipe(src.x, src.y, dst.x, dst.y, 1000);
                sleep(1000);
                let screenshot = compatCaptureScreen();
                let isConnectableDown = isDiskConnectableDown(screenshot, fromDisk.position);
                if (isConnectableDown.down) {
                    log("连携动作完成");
                    clickedDisksCount++;
                    fromDisk.connectedTo = getConnectAcceptorCharaID(fromDisk, clickedDisksCount); //判断接连携的角色是谁
                    thisStandPoint.charaID = fromDisk.connectedTo;
                    break;
                } else {
                    log("连携动作失败，可能是因为连携到了自己身上");
                    //以后也许可以改成根据按下连携盘后地板是否发亮来排除自己
                }
            }
        }
    }

    //点击行动盘
    function clickDisk(disk) {
        log("点击第", disk.position+1, "号盘");
        let point = getAreaCenter(getDiskArea(disk.position, "charaImg"));
        let clickAttemptMax = 10;
        let inconclusiveCount = 0;
        for (let i=0; i<clickAttemptMax; i++) {
            click(point.x, point.y);
            //点击有时候会没效果，还需要监控盘是否按下了
            sleep(333);
            let screenshot = compatCaptureScreen();
            try {
                disk.down = isDiskDown(screenshot, disk.position);
            } catch (e) {
                if (e.toString() == "isDiskDownInconclusive") {
                    inconclusiveCount++;
                } else {
                    log(e);
                }
                //最后一个盘点击成功的表现就是行动盘消失，所以当然无法分辨盘是否被按下
                //这种情况下因为我方回合选盘已经结束，点击行动盘的位置没有影响，所以即便多点几次也是无害的
                if (clickedDisksCount == 2 && inconclusiveCount >= 1) {
                    log("看不到最后一个盘了，应该是点击动作完成了");
                    disk.down = true;
                } else {
                    disk.down = false;
                }
            }
            if (disk.down) break;
        }
        if (!disk.down) {
            log("点了", clickAttemptMax, "次都没反应，可能遇到问题，退出");
            stopThread();
        } else {
            log("点击动作完成");
            clickedDisksCount++;
        }
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
        },
        distance: 187.5
    };

    //获取换算后的行动盘所需部分（A/B/C盘，角色头像，连携指示灯等）的坐标
    function getSelectedConnectedDiskCoords(corner, which) {
        var convertedCoords = { x: 0, y: 0, pos: "bottom" };
        var knownCoords = knownFirstSelectedConnectedDiskCoords[corner];
        convertedCoords.x = knownCoords.x + knownFirstSelectedConnectedDiskCoords.distance * (which - 1);
        convertedCoords.y = knownCoords.y;
        convertedCoords.pos = knownCoords.pos;
        return convertCoords(convertedCoords);
    }
    function getSelectedConnectedDiskArea(which) {
        var result = {
            topLeft:     getSelectedConnectedDiskCoords("topLeft", which),
            bottomRight: getSelectedConnectedDiskCoords("bottomRight", which),
        };
        return result;
    }

    //截取行动盘所需部位的图像
    function getSelectedConnectedDiskImg(screenshot, which) {
        var area = getSelectedConnectedDiskArea(which);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    //返回接到连携的角色
    function getConnectAcceptorCharaID(fromDisk, which) {
        let screenshot = compatCaptureScreen();
        let imgA = getSelectedConnectedDiskImg(screenshot, which);

        let area = getSelectedConnectedDiskArea(which);
        let gaussianX = parseInt(getAreaWidth(area) / 5);
        let gaussianY = parseInt(getAreaHeight(area) / 5);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let imgABlur = renewImage(images.gaussianBlur(imgA, gaussianSize));

        let max = 0;
        let maxSimilarity = -1.0;
        for (let diskPos = 0; diskPos < allActionDisks.length; diskPos++) {
            let imgB = getDiskImg(screenshot, diskPos, "charaImg"); //这里还没考虑侧边刘海屏可能切掉画面的问题，不过除非侧边特别宽否则应该不会有影响
            let imgBShrunk = renewImage(images.resize(imgB, [getAreaWidth(area), getAreaHeight(area)]));
            let imgBShrunkBlur = renewImage(images.gaussianBlur(imgBShrunk, gaussianSize));
            let similarity = images.getSimilarity(imgABlur, imgBShrunkBlur, {"type": "MSSIM"});
            log("比对第", diskPos+1, "号盘与屏幕上方的第一个盘的连携接受者 MSSIM=", similarity);
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                max = diskPos;
            }
        }
        log("比对结束，与第", max+1, "号盘最相似，charaID=", allActionDisks[max].charaID, "MSSIM=", maxSimilarity);
        if (allActionDisks[max].charaID == fromDisk.charaID) {
            log("识图比对结果有误，和连携发出角色相同");
            log("为避免问题，返回 charaID=-1");
            return -1;
        }
        return allActionDisks[max].charaID;
    }

    //检测和使用主动技能

    const skillCharaDistance = 328;
    const skillDistance = 155;

    var knownFirstSkillCoords = {
        topLeft: {
            x: 31,
            y: 978,
            pos: "bottom"
        },
        bottomRight: {
            x: 163,
            y: 1015,
            pos: "bottom"
        }
    }

    var knownFirstSkillFullCoords = {
        topLeft: {
            x: 22,
            y: 920,
            pos: "bottom"
        },
        bottomRight: {
            x: 172,
            y: 1071,
            pos: "bottom"
        }
    }

    function getSkillArea(diskPos, skillNo, isFull) {
        let area = {};
        for (let corner of ["topLeft", "bottomRight"]) {
            area[corner] = {};
            area[corner].pos = "bottom";
            for (let axis of ["x", "y"]) {
                if (isFull) {
                    area[corner][axis] = knownFirstSkillFullCoords[corner][axis];
                } else {
                    area[corner][axis] = knownFirstSkillCoords[corner][axis];
                }
            }
            area[corner].x += diskPos * skillCharaDistance;
            area[corner].x += skillNo * skillDistance;
        }
        return getConvertedArea(area);
    }

    function getSkillFullArea(diskPos, skillNo) {
        return getSkillArea(diskPos, skillNo, true);
    }

    function getSkillImg(screenshot, diskPos, skillNo) {
        let area = getSkillArea(diskPos, skillNo);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    function getSkillFullImg(screenshot, diskPos, skillNo) {
        let area = getSkillFullArea(diskPos, skillNo);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    //检测技能是否可用
    function isSkillAvailable(screenshot, diskPos, skillNo) {
        log("检测第 "+(diskPos+1)+" 个位置的角色的第 "+(skillNo+1)+" 个技能是否可用...");
        let skillImg = getSkillImg(screenshot, diskPos, skillNo);
        let skillImgGRAY = renewImage(images.grayscale(skillImg));
        let skillImgGray = renewImage(images.cvtColor(skillImgGRAY, "GRAY2BGRA"));
        let skillImgBGRA = renewImage(images.cvtColor(skillImg, "BGR2BGRA"));
        let similarity = images.getSimilarity(skillImgGray, skillImgBGRA, {"type": "MSSIM"});
        log("技能按钮区域图像 去色前后的相似度 MSSIM=", similarity);
        if (similarity > 2.9) {
            let firstSkillArea = getSkillArea(0, 0);
            let gaussianX = parseInt(getAreaWidth(firstSkillArea) * 8);
            let gaussianY = parseInt(getAreaHeight(firstSkillArea) * 8);
            if (gaussianX % 2 == 0) gaussianX += 1;
            if (gaussianY % 2 == 0) gaussianY += 1;
            let gaussianSize = [gaussianX, gaussianY];
            let skillImgBlur = renewImage(images.gaussianBlur(skillImg, gaussianSize));
            let skillImgOnePx = renewImage(images.resize(skillImgBlur, [1, 1], "LINEAR"));
            if (images.detectsColor(skillImgOnePx, colors.WHITE, 0, 0, 8, "diff")) {
                log("技能【可用】且闪光到全白");
                return true;
            } else {
                log("技能不可用");
                return false;
            }
        } else {
            let skillFullImg = getSkillFullImg(screenshot, diskPos, skillNo);
            let skillFullImgGray = renewImage(images.grayscale(skillFullImg));
            let minRadius = parseInt(getAreaWidth(getSkillFullArea(0, 0)) * 0.33);
            let foundCircles = images.findCircles(skillFullImgGray, {minRadius: minRadius});
            log("找圆结果", foundCircles);
            if (foundCircles != null && foundCircles.length > 0) {
                let firstSkillArea = getSkillArea(0, 0);
                let gaussianX = parseInt(getAreaWidth(firstSkillArea) / 4);
                let gaussianY = parseInt(getAreaHeight(firstSkillArea) / 4);
                if (gaussianX % 2 == 0) gaussianX += 1;
                if (gaussianY % 2 == 0) gaussianY += 1;
                let gaussianSize = [gaussianX, gaussianY];
                let imgA = renewImage(images.gaussianBlur(skillImg, gaussianSize));
                similarity = -1;
                for (var imgName of ["skillLocked", "skillEmptyCHS", "skillEmptyCHT", "skillEmptyJP"]) {
                    let imgB = renewImage(images.gaussianBlur(knownImgs[imgName], gaussianSize));
                    let s = images.getSimilarity(imgA, imgB, {"type": "MSSIM"});
                    if (s > similarity) {
                        similarity = s;
                    }
                }
                log("与小锁或未装备图标比对的最高相似度 MSSIM=", similarity);
                if (similarity > 2.4) {
                    log("技能不存在", imgName);
                    return false;
                } else {
                    log("技能【可用】");
                    return true;
                }
            } else {
                log("技能不存在");
                return false;
            }
        }
    }

    //是否有我方行动盘出现
    function isDiskAppearing(screenshot) {
        let img = getDiskImg(screenshot, 0, "action");
        if (img != null) {
            log("已截取第一个盘的动作图片");
        } else {
            log("截取第一个盘的动作图片时出现问题");
        }
        let diskAppeared = true;
        try {
            recognizeDisk(img, "action", 2.1);
        } catch(e) {
            if (e.toString() != "recognizeDiskLowerThanThreshold") log(e);
            diskAppeared = false;
        }
        return diskAppeared;
    }

    //打开或关闭技能面板
    function toggleSkillPanel(open) {
        log((open?"打开":"关闭")+"技能面板...");
        for (let attempt=0; isDiskAppearing(compatCaptureScreen())==open; attempt++) {
            if (attempt >= 10) {
                log((open?"打开":"关闭")+"技能面板时出错");
                stopThread();
            }
            if (attempt % 2 == 1) {
                log("点击取消按钮");
                click(convertCoords(clickSetsMod.reconnectYes));
                sleep(500);
            }
            if (!clickBackButtonIfShowed()) {
                log("误触打开了角色信息,多次尝试点击返回却没有效果,退出");
                stopThread();
            }
            log("点击切换技能面板/行动盘面板");
            click(convertCoords(clickSetsMod.skillPanelSwitch));
            sleep(1000);
        }
    }

    const knownBackButtonPoint = {
        x: 57,
        y: 64,
        pos: "top"
    };

    //检测返回按钮是否出现
    function isBackButtonAppearing(screenshot) {
        let point = convertCoords(knownBackButtonPoint);
        if (images.detectsColor(screenshot, colors.WHITE, point.x, point.y, 32, "diff")) {
            log("似乎出现了返回按钮");
            return true;
        } else {
            log("似乎没出现返回按钮");
            return false;
        }
    }

    //有返回按钮出现时点击
    function clickBackButtonIfShowed() {
        let lastClickTime = 0;
        let attemptMax = 10;
        for (let attempt=0; attempt<attemptMax; attempt++) {
            if (!isBackButtonAppearing(compatCaptureScreen())) {
                return true;
            }
            let clickTime = new Date().getTime();
            if (lastClickTime == 0 || clickTime - lastClickTime > 2000) {
                lastClickTime = clickTime;
                log("点击返回");
                click(convertCoords(clickSetsMod.back));
            }
            sleep(500);
        }
        log("尝试点击返回多次仍然没有效果");
        return false;
    }

    var knownOKButtonCoords = {
        topLeft: {
            x: 1313, y: 705, pos: "center"
        },
        bottomRight: {
            x: 1381, y: 824, pos: "center"
        }
    };

    function getOKButtonArea() {
        return getConvertedArea(knownOKButtonCoords);
    }

    function getOKButtonImg(screenshot) {
        let area = getOKButtonArea();
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }

    //检测技能确认按钮是否出现
    function detectOKButtonStatus(screenshot) {
        let refImg = knownImgs["OKButton"];
        let img = getOKButtonImg(screenshot);
        let imgGRAY = renewImage(images.grayscale(img));
        let imgGray = renewImage(images.cvtColor(imgGRAY, "GRAY2BGRA"));
        let imgBGRA = renewImage(images.cvtColor(img, "BGR2BGRA"));
        let isGray = false;
        let similarity = images.getSimilarity(imgBGRA, imgGray, {"type": "MSSIM"});
        log("判断按钮区域图像是否为灰度 MSSIM=", similarity);
        if (similarity > 2.9) {
            isGray = true;
            refImg = knownImgs["OKButtonGray"];
        }
        let OKButtonArea = getOKButtonArea();
        let gaussianX = parseInt(getAreaWidth(OKButtonArea) / 3);
        let gaussianY = parseInt(getAreaHeight(OKButtonArea) / 3);
        if (gaussianX % 2 == 0) gaussianX += 1;
        if (gaussianY % 2 == 0) gaussianY += 1;
        let gaussianSize = [gaussianX, gaussianY];
        let imgBlur = renewImage(images.gaussianBlur(img, gaussianSize));
        let refImgBlur = renewImage(images.gaussianBlur(refImg, gaussianSize));
        similarity = images.getSimilarity(refImgBlur, imgBlur, {"type": "MSSIM"});
        log("判断技能确认按钮是否出现 MSSIM=", similarity);
        if (similarity > 2.1) {
            if (isGray) {
                log("技能按钮为灰色");
                return "grayed_out";
            } else {
                log("技能按钮可用");
                return "available";
            }
        } else {
            log("没有检测到技能按钮");
            return "not_detected";
        }
    }

    //闭着眼放出所有主动技能
    function clickAllSkills() {
        //打开技能面板
        toggleSkillPanel(true);

        for (let pass=1; pass<=3; pass++) { //只循环3遍
            var availableSkillCount = 0;
            let screenshot = renewImage(images.copy(compatCaptureScreen())); //复制一遍以避免toggleSkillPanel回收screenshot导致崩溃退出的问题
            for (let diskPos=0; diskPos<5; diskPos++) {
                for (let skillNo=0; skillNo<2; skillNo++) {
                    if (isSkillAvailable(screenshot, diskPos, skillNo)) {
                        availableSkillCount++;
                        let isSkillButtonClicked = false;
                        let lastOKClickTime = 0;
                        let lastCancelClickTime = 0;
                        let isSkillUsed = false;
                        let isSkillDone = false;
                        for (let startTime=new Date().getTime(); new Date().getTime()-startTime<15000; sleep(200)) {
                            let clickTime = 0;
                            if (!clickBackButtonIfShowed()) {
                                log("误触打开了角色信息,多次点击返回却没有效果,退出");
                                stopThread();
                            } else if (isSkillDone) {
                                if (!isSkillUsed) availableSkillCount--;
                                break;
                            } else switch (detectOKButtonStatus(compatCaptureScreen())) {
                                case "available":
                                    isSkillUsed = true;
                                    clickTime = new Date().getTime();
                                    if (lastOKClickTime == 0 || clickTime - lastOKClickTime > 4000) {
                                        lastOKClickTime = clickTime;
                                        log("点击确认按钮使用技能");
                                        click(convertCoords(clickSetsMod.recover_battle));
                                    }
                                    break;
                                case "grayed_out":
                                    isSkillUsed = false;
                                    clickTime = new Date().getTime();
                                    if (lastCancelClickTime == 0 || clickTime - lastCancelClickTime > 1000) {
                                        lastCancelClickTime = clickTime;
                                        log("确定按钮为灰色,点击取消按钮放弃使用技能");
                                        click(convertCoords(clickSetsMod.reconnectYes));
                                    }
                                    break;
                                case "not_detected":
                                default:
                                    if (isSkillButtonClicked) {
                                        isSkillDone = true;
                                        if (isSkillUsed) {
                                            log("技能使用完成");
                                        } else {
                                            log("技能不可用");
                                        }
                                    } else {
                                        isSkillButtonClicked = true;
                                        log("点击使用第 "+(diskPos+1)+" 个位置的角色的第 "+(skillNo+1)+" 个技能");
                                        click(getAreaCenter(getSkillArea(diskPos, skillNo)));
                                    } 
                            }
                        }
                        toggleSkillPanel(true); //如果发动了洗盘技能，就重新打开技能面板
                    }
                }
            }
            try {screenshot.recycle();} catch (e) {};
            if (availableSkillCount <= 0) break;
        }

        //关闭技能面板
        toggleSkillPanel(false);
        return false;
    }

    //等待己方回合
    function waitForOurTurn() {
        log("等待己方回合...");
        let result = false;
        let cycles = 0;
        let diskAppearedCount = 0;
        while(true) {
            cycles++;
            let screenshot = compatCaptureScreen();
            /*
            if (id("ArenaResult").findOnce() || (id("enemyBtn").findOnce() && id("rankMark").findOnce())) {
            */
            if (id("ArenaResult").findOnce() || id("enemyBtn").findOnce() || /*镜层结算*/
                id("ResultWrap").findOnce() || id("charaWrap").findOnce() || /*副本结算*/
                id("retryWrap").findOnce() || id("hasTotalRiche").findOnce()) {
            //不再通过识图判断战斗是否结束
            //if (didWeWin(screenshot) || didWeLose(screenshot)) {
                log("战斗已经结束，不再等待我方回合");
                result = false;
                break;
            }

            //如果有技能可用，会先闪过我方行动盘，然后闪过技能面板，最后回到显示我方行动盘
            //所以，必须是连续多次看到我方行动盘，这样才能排除还在闪烁式切换界面的情况
            let diskAppeared = isDiskAppearing(screenshot);
            if (diskAppeared) {
                log("出现我方行动盘");
                diskAppearedCount++;
            } else {
                log("未出现我方行动盘");
                diskAppearedCount = 0;
            }
            if (limit.CVAutoBattleDebug) {
                if (cycles < 30) {
                    if (cycles == 1) toastLog("识图自动战斗已启用调试模式\n不会点击任何行动盘\n将会在保存图片后退出");
                } else {
                    toastLog("开始保存图片...");
                    let snapshotDir = files.join(files.getSdcardPath(), "auto_magireco/");
                    let screenshotDir = files.join(snapshotDir, "screenshots/");
                    let img = getDiskImg(screenshot, 0, "action");
                    if (img != null) {
                        log("保存完整屏幕截图...");
                        let screenshotPath = files.join(screenshotDir, "screenshot.png");
                        files.ensureDir(screenshotPath);
                        images.save(screenshot, screenshotPath, "png");
                        log("保存完整屏幕截图完成");
                        log("保存第一个盘的动作图片...");
                        let imgPath = files.join(screenshotDir, "firstDisk.png");
                        files.ensureDir(imgPath);
                        images.save(img, imgPath, "png");
                        log("保存第一个盘的动作图片完成");
                        for (let action of ["accel", "blast", "charge"]) {
                            log("保存用于参考的"+action+"盘的动作图片...");
                            let refImgPath = files.join(screenshotDir, action+".png");
                            images.save(knownImgs[action], refImgPath, "png");
                            log("保存用于参考的"+action+"盘的动作图片完成");
                        }
                    }
                    toastLog("调试模式下已保存图片,退出识图自动战斗");
                    stopThread();
                }
            }
            if (diskAppearedCount >= 3) {
                if (!limit.CVAutoBattleDebug) {
                    //为保证调试模式有机会保存图片，调试模式开启时不break
                    result = true;
                    break;
                }
            }
            if(cycles>300*5) {
                log("等待己方回合已经超过10分钟，结束运行");
                stopThread();
            }
            sleep(333);
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
        let knownArea = knownMirrorsWinLoseCoords[winOrLose];
        let convertedTopLeft = convertCoords(knownArea.topLeft);
        let convertedBottomRight = convertCoords(knownArea.bottomRight);
        let convertedArea = { topLeft: convertedTopLeft, bottomRight: convertedBottomRight };
        return convertedArea;
    }
    function getMirrorsWinLoseCoords(winOrLose, corner) {
        let area = getMirrorsWinLoseArea(winOrLose);
        return area.corner;
    }
    function getMirrorsWinLoseImg(screenshot, winOrLose) {
        let area = getMirrorsWinLoseArea(winOrLose);
        return renewImage(images.clip(screenshot, area.topLeft.x, area.topLeft.y, getAreaWidth(area), getAreaHeight(area)));
    }
    function didWeWinOrLose(screenshot, winOrLose) {
        //结算页面有闪光，会干扰判断，但是只会产生假阴性，不会出现假阳性
        let imgA = knownImgs[winOrLose];
        let imgB = getMirrorsWinLoseImg(screenshot, winOrLose);
        let similarity = images.getSimilarity(imgA, imgB, {"type": "MSSIM"});
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
        /* 演习模式没有rankMark
        while (id("ArenaResult").findOnce() || (id("enemyBtn").findOnce() && id("rankMark").findOnce())) {
        */
        while (id("ArenaResult").findOnce() || id("enemyBtn").findOnce()) {
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
            click(convertCoords(screenCenter));
            sleep(1000);
        }

        //用到副本而不是镜层的时候
        if (id("ResultWrap").findOnce() || id("charaWrap").findOnce() ||
            id("retryWrap").findOnce() || id("hasTotalRiche").findOnce()) {
            log("匹配到副本结算控件");
            //clickResult();
            toastLog("战斗已结束进入结算");
        }
    }


    //放缩参考图像以适配当前屏幕分辨率
    var resizeKnownImgsDone = false;
    function resizeKnownImgs() {
        if (resizeKnownImgsDone) return;
        let hasError = false;
        for (let imgName in knownImgs) {
            let newsize = [0, 0];
            let knownArea = null;
            if (imgName == "accel" || imgName == "blast" || imgName == "charge") {
                knownArea = knownFirstDiskCoords["action"];
            } else if (imgName.startsWith("light") || imgName.startsWith("dark") || imgName.startsWith("water") || imgName.startsWith("fire") || imgName.startsWith("wood") || imgName.startsWith("none")) {
                knownArea = knownFirstStandPointCoords["our"]["attrib"]; //防止图像大小不符导致MSSIM==-1
            } else if (imgName == "connectIndicatorBtnDown") {
                knownArea = knownFirstDiskCoords["connectIndicator"];
            } else if (imgName == "skillLocked" || imgName.startsWith("skillEmpty")) {
                knownArea = knownFirstSkillCoords;
            } else if (imgName == "OKButton" || imgName == "OKButtonGray") {
                knownArea = knownOKButtonCoords;
            } else {
                knownArea = knownFirstStandPointCoords.our[imgName];
                if (knownArea == null) knownArea = knownFirstDiskCoords[imgName];
                if (knownArea == null) knownArea = knownMirrorsWinLoseCoords[imgName];
            }
            if (knownArea != null) {
                let convertedArea = getConvertedAreaNoCutout(knownArea); //刘海屏的坐标转换会把左上角的0,0加上刘海宽度，用在缩放图片这里会出错，所以要避免这个问题
                log("缩放图片 imgName", imgName, "knownArea", knownArea, "convertedArea", convertedArea);
                if (knownImgs[imgName] == null) {
                    hasError = true;
                    log("缩放图片出错 imgName", imgName);
                    break;
                }
                let resizedImg = images.resize(knownImgs[imgName], [getAreaWidth(convertedArea), getAreaHeight(convertedArea)]);
                knownImgs[imgName].recycle();
                knownImgs[imgName] = resizedImg;
            } else {
                hasError = true;
                log("缩放图片出错 imgName", imgName);
                break;
            }
        }
        resizeKnownImgsDone = !hasError;
    }



    function mirrorsSimpleAutoBattleMain() {
        initialize();

        var battleResultIDs = ["ArenaResult", "enemyBtn", "ResultWrap", "charaWrap", "retryWrap", "hasTotalRiche"];
        var isBattleResult = false;

        var battleEndIDs = ["matchingWrap", "matchingList"];

        //简单镜层自动战斗
        while (true) {
            for (let n=0; n<8; n++) {
                log("n="+n);
                let isDiskClickable = [(n&4)==0, (n&2)==0, (n&1)==0];
                let breakable = false;
                for (let pass=1; pass<=4; pass++) {
                    for (let i=1; i<=3; i++) {
                        for (let resID of battleEndIDs) {
                            if (findID(resID)) {
                                log("找到", resID, ", 结束简单镜层自动战斗");
                                return;
                            } else {
                                log("未找到", resID);
                            }
                        }
                        isBattleResult = false;
                        battleResultIDs.forEach(function (val) {
                            if (findID(val, false) != null) {
                                log("找到", val);
                                isBattleResult = true;
                            }
                        });
                        if (!isBattleResult) {
                            if (isDiskClickable[i-1] || (pass >= 1 && pass <= 2)) {
                                click(convertCoords(clickSetsMod["battlePan"+i]));
                                sleep(1000);
                            }
                        } else {
                            breakable = true;
                            break;
                        }
                    }
                    if (breakable) break;
                }
                if (breakable) break;
            }

            //点掉镜层结算页面
            isBattleResult = false;
            battleResultIDs.forEach(function (val) {
                if (findID(val, false) != null) {
                    log("找到", val);
                    isBattleResult = true;
                }
            });
            if (isBattleResult) {
                click(convertCoords(clickSetsMod.levelup));
            }
            sleep(3000);

            //点掉副本结算页面（如果用在副本而不是镜层中）
            if (id("ResultWrap").findOnce() || id("charaWrap").findOnce() ||
                id("retryWrap").findOnce() || id("hasTotalRiche").findOnce()) {
                //clickResult();
                toastLog("战斗已结束进入结算");
                break;
            }
        }
    }

    function mirrorsAutoBattleMain() {
        if (!MODULES.shellCmd.privilege && (limit.useCVAutoBattle && limit.rootScreencap)) {
            toastLog("需要root或shizuku adb权限");
            requestShellPrivilege();
            return;
        }

        downloadAllImages();

        initialize();

        log("缩放图片...");
        resizeKnownImgs();//必须放在initialize后面
        log("图片缩放完成");

        if (limit.useCVAutoBattle && (!limit.rootScreencap)) {
            startScreenCapture();
        }

        //利用截屏识图进行稍复杂的自动战斗（比如连携）
        //开始一次镜界自动战斗
        turn = 0;
        while(true) {
            if(!waitForOurTurn()) break;
            //我的回合，抽盘
            turn++;

            if (limit.CVAutoBattleClickAllSkills) {
                if (turn >= 3) {
                    //一般在第3回合后主动技能才冷却完毕
                    //闭着眼放出所有主动技能
                    clickAllSkills();
                }
            }

            //扫描行动盘和战场信息
            scanDisks();
            scanBattleField("our");
            scanBattleField("their");

            //优先打能克制我方的属性
            let disadvAttribs = [];
            disadvAttribs = getAdvDisadvAttribsOfStandPoints(getAliveStandPoints("our"), "adv");
            let disadvAttrEnemies = [];
            disadvAttribs.forEach((attrib) => getEnemiesByAttrib(attrib).forEach((enemy) => disadvAttrEnemies.push(enemy)));
            if (disadvAttrEnemies.length > 0) {
                let disadvAttribsOfEnemies = [];
                disadvAttrEnemies.forEach(function (enemy) {
                    if (disadvAttribsOfEnemies.find((attrib) => attrib == enemy.attrib) == null) {
                        disadvAttribsOfEnemies.push(enemy.attrib);
                    }
                });
                if (disadvAttribsOfEnemies.length == 1) {
                    log("对面只有一种能克制我方的强势属性，优先集火");
                    aimAtEnemy(disadvAttrEnemies[0]);
                } else {
                    log("对面不止一种能克制我方的强势属性");
                    if (allActionDisks.find((disk) => disk.connectable) != null) {
                        log("我方可以发动连携");
                        let ourAttribs = [];
                        getAliveStandPoints("our").forEach(function (standPoint) {
                            if (ourAttribs.find((attrib) => attrib == standPoint.attrib) == null) {
                                //不是重复的
                                ourAttribs.push(standPoint.attrib);
                            }
                        });
                        let ourDesiredAttribs = [];
                        ourAttribs.forEach(function (attrib) {
                            let attribs = getAdvDisadvAttribs(attrib, "disadv");
                            if (attribs.length == 1) ourDesiredAttribs.push(attribs[0]);
                        });
                        let ourUndesiredAttribs = [];
                        ourAttribs.forEach(function (attrib) {
                            let attribs = getAdvDisadvAttribs(attrib, "adv");
                            if (attribs.length == 1) ourUndesiredAttribs.push(attribs[0]);
                        });
                        log("寻找能被我方场上任意角色克制的敌人...");
                        let desiredEnemy = disadvAttrEnemies.find((enemy) =>
                            ourDesiredAttribs.find((attrib) => attrib == enemy.attrib) != null
                        );
                        if (desiredEnemy != null) {
                            log("找到能被我方场上任意角色克制的敌人");
                            aimAtEnemy(desiredEnemy);
                        } else {
                            log("退而求其次，找至少不会克制我方的敌人...");
                            let desiredEnemy = disadvAttrEnemies.find((enemy) =>
                                ourUndesiredAttribs.find((attrib) => attrib == enemy.attrib) == null
                            );
                            if (desiredEnemy != null) {
                                log("找到至少不会克制我方的敌人");
                                aimAtEnemy(desiredEnemy);
                            } else {
                                log("只有克制我方的敌人，没办法");
                                aimAtEnemy(disadvAttrEnemies[0]);
                            }
                        }
                    } else {
                        log("我方没有连携可供发动");
                        let sameCharaDisks = findSameCharaDisks(allActionDisks);
                        let ourFirstDiskAttrib = null;
                        if (sameCharaDisks.length >= 3) {
                            log("我方可以选出Puella Combo盘");
                            ourFirstDiskAttrib = sameCharaDisks[0].attrib;
                        } else {
                            log("我方选不出Puella Combo盘");
                            let accelDisk = findSameActionDisks(allActionDisks, "accel");
                            if (accelDisk != null) {
                                log("没有连携也没有Puella Combo，Accel盘应会是第一个盘");
                                ourFirstDiskAttrib = accelDisk.attrib;
                            } else {
                                log("连Accel盘也没有，就看顺位第一个盘吧");
                                ourFirstDiskAttrib = allActionDisks[0].attrib;
                            }
                        }
                        log("在对面找能被我方属性克制的敌人，或是至少不克制我方的...");
                        let undesiredEnemyAttribs = getAdvDisadvAttribs(ourFirstDiskAttrib, "adv");
                        let desiredEnemyAttribs = getAdvDisadvAttribs(ourFirstDiskAttrib, "disadv");
                        log("寻找能被我方克制的敌人...");
                        let desiredEnemy = disadvAttrEnemies.find((enemy) =>
                            desiredEnemyAttribs.find((attrib) => attrib == enemy.attrib) != null
                        );
                        if (desiredEnemy != null) {
                            log("找到能被我方克制的敌人");
                            aimAtEnemy(desiredEnemy);
                        } else {
                            log("退而求其次，不克制我方就行...");
                            desiredEnemy = disadvAttrEnemies.find((enemy) =>
                                undesiredEnemyAttribs.find((attrib) => attrib == enemy.attrib) == null
                            );
                            if (desiredEnemy != null) {
                                log("找到不克制我方的敌人");
                                aimAtEnemy(desiredEnemy);
                            } else {
                                log("找不到，没办法，只能逆属性攻击了");
                                aimAtEnemy(disadvAttrEnemies[0]);
                            }
                        }
                    }
                }
            }

            if (disadvAttrEnemies.length == 0) {
                //敌方没有能克制我方的属性，推后打被我方克制的属性
                let advAttribs = [];
                advAttribs = getAdvDisadvAttribsOfStandPoints(getAliveStandPoints("our"), "disadv");
                let advAttrEnemies = [];
                if (advAttribs.length > 0) advAttrEnemies = getEnemiesByAttrib(advAttribs[0]);
                if (advAttrEnemies.length > 0) avoidAimAtEnemies(advAttrEnemies);
            }

            //提前把不被克制的盘排到前面
            //这样一来，如果后面既没有接连携的角色更没有进一步（同角色）的Blast Combo
            //也没有无连携的Puella Combo和进一步（同角色）的Blast Combo
            //应该就会顺位选到它们
            let nonDisadvAttribDisks = findNonDisadvAttribDisks(allActionDisks, [battleField["their"].lastAimedAtEnemy]);
            prioritiseDisks(nonDisadvAttribDisks);

            //在所有盘中找第一个能连携的盘
            let connectableDisks = [];
            connectableDisks = getConnectableDisks(allActionDisks);

            if (connectableDisks.length > 0) {
                //如果有连携，第一个盘上连携
                let selectedDisk = connectableDisks[0];
                //连携尽量用blast盘
                let blastConnectableDisks = findSameActionDisks(connectableDisks, "blast");
                if (blastConnectableDisks.length > 0) selectedDisk = blastConnectableDisks[0];
                prioritiseDisks([selectedDisk]); //将当前连携盘从选盘中排除
                connectDisk(selectedDisk);
                //上连携后，尽量用接连携的角色
                let connectAcceptorDisks = findDisksByCharaID(allActionDisks, selectedDisk.connectedTo);
                prioritiseDisks(connectAcceptorDisks);
                //连携的角色尽量打出Blast Combo
                let blastDisks = findSameActionDisks(connectAcceptorDisks, "blast");
                prioritiseDisks(blastDisks);
            } else {
                //没有连携
                //先找Puella Combo
                let candidateDisks = allActionDisks;
                let sameCharaDisks = findSameCharaDisks(allActionDisks);
                if (sameCharaDisks.length >= 3) {
                    candidateDisks = sameCharaDisks;
                    prioritiseDisks(sameCharaDisks);
                }
                //再依次找Blast/Accel/Charge Combo
                let comboDisks = [];
                for (let action of ["blast", "accel", "charge"]) {
                    comboDisks = findSameActionDisks(candidateDisks, action);
                    if (comboDisks.length >= 3) {
                        prioritiseDisks(comboDisks);
                        break;
                    }
                }
                let ACBDisks = [];
                if (comboDisks.length < 3) {
                    //再找ACB
                    //先找Puella Combo内的ACB，再找混合ACB
                    let ACBAttemptMax = sameCharaDisks.length >= 3 ? 2 : 1;
                    candidateDisks = sameCharaDisks.length >= 3 ? sameCharaDisks : allActionDisks;
                    for (let ACBAttempt=0; ACBAttempt<ACBAttemptMax; ACBAttempt++) {
                        for (let action of ["accel", "charge", "blast"]) {
                            let foundDisks = findSameActionDisks(candidateDisks, action);
                            if (foundDisks.length > 0) ACBDisks.push(foundDisks[0]);
                        }
                        if (ACBDisks.length >= 3) {
                            prioritiseDisks(ACBDisks);
                            break;
                        } else if (sameCharaDisks.length >= 3) {
                            //有Puella Combo但Puella Combo内没有ACB，那就Puella Combo
                            prioritiseDisks(sameCharaDisks);
                            break;
                        }
                        candidateDisks = allActionDisks;
                    }
                }
            }

            //完成选盘，有连携就点完剩下两个盘；没连携就点完三个盘
            for (let i=clickedDisksCount; i<3; i++) {
                let diskToClick = getDiskByPriority(allActionDisks, ordinalWord[i]);
                //有时候点连携盘会变成长按拿起又放下，改成拖出去连携来避免这个问题
                if (diskToClick.connectable) {
                    //重新识别盘是否可以连携
                    //（比如两人互相连携，A=>B后，A本来可以连携的盘现在已经不能连携了，然后B=>A后又会用A的盘，这时很显然需要重新识别）
                    let isConnectableDown = isDiskConnectableDown(compatCaptureScreen(), diskToClick.position); //isConnectableDown.down==true也有可能是只剩一人无法连携的情况，
                    diskToClick.connectable = isConnectableDown.connectable && (!isConnectableDown.down); //所以这里还无法区分盘是否被按下，但是可以排除只剩一人无法连携的情况
                }
                if (diskToClick.connectable) {
                    connectDisk(diskToClick);
                } else {
                    clickDisk(diskToClick);
                }
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

        //回收所有图片
        recycleAllImages();
    }



    var knownFirstMirrorsOpponentScoreCoords = {
        //[1246,375][1357,425]
        //[1246,656][1357,706]
        //[1246,937][1357,988]
        topLeft: {x: 1236, y: 370, pos: "center"},
        bottomRight: {x: 1400, y: 430, pos: "center"},
        distance: 281
    }
    //在匹配到的三个对手中，获取指定的其中一个（1/2/3）的战力值
    function getMirrorsScoreAt(position) {
        let distance = knownFirstMirrorsOpponentScoreCoords.distance * (position - 1);
        let knownArea = {
            topLeft: {x: 0, y: distance, pos: "center"},
            bottomRight: {x: 0, y: distance, pos: "center"}
        }
        for (point in knownArea) {
            for (key in knownArea.topLeft) {
                knownArea[point][key] += knownFirstMirrorsOpponentScoreCoords[point][key];
            }
        }
        let convertedArea = getConvertedArea(knownArea);
        let uiObjArr = boundsInside(convertedArea.topLeft.x, convertedArea.topLeft.y, convertedArea.bottomRight.x, convertedArea.bottomRight.y).find();
        for (let i=0; i<uiObjArr.length; i++) {
            let uiObj = uiObjArr[i];
            let score = parseInt(getContent(uiObj));
            if (isNaN(score)) continue;
            log("getMirrorsScoreAt position", position, "score", score);
            return score;
        }
        log("getMirrorsScoreAt position", position, "return 0");
        return 0;
    }

    var knownMirrorsSelfScoreCoords = {
        //[0,804][712,856]
        topLeft: {x: 0, y: 799, pos: "bottom"},
        bottomRight: {x: 717, y: 861, pos: "bottom"}
    }
    //获取自己的战力值
    function getMirrorsSelfScore() {
        let convertedArea = getConvertedArea(knownMirrorsSelfScoreCoords);
        let uiObjArr = boundsInside(convertedArea.topLeft.x, convertedArea.topLeft.y, convertedArea.bottomRight.x, convertedArea.bottomRight.y).find();
        for (let i=0; i<uiObjArr.length; i++) {
            let uiObj = uiObjArr[i];
            let score = parseInt(getContent(uiObj));
            if (score != null && !isNaN(score)) {
                log("getMirrorsSelfScore score", score);
                return score;
            }
        }
        return 0;
    }

    var knownFirstMirrorsLvCoords = {
        //r1c1 Lv: [232,236][253,258] 100: [260,228][301,260]
        //r3c3 Lv: [684,688][705,710] 100: [712,680][753,712]
        topLeft: {x: 227, y: 223, pos: "center"},
        bottomRight: {x: 306, y: 265, pos: "center"},
        distancex: 226,
        distancey: 226
    }
    //点开某个对手后会显示队伍信息。获取显示出来的角色等级
    function getMirrorsLvAt(rowNum, columnNum) {
        let distancex = knownFirstMirrorsLvCoords.distancex * (columnNum - 1);
        let distancey = knownFirstMirrorsLvCoords.distancey * (rowNum - 1);
        let knownArea = {
            topLeft: {x: distancex, y: distancey, pos: "center"},
            bottomRight: {x: distancex, y: distancey, pos: "center"}
        }
        for (point in knownArea) {
            for (key in knownArea.topLeft) {
                knownArea[point][key] += knownFirstMirrorsLvCoords[point][key];
            }
        }
        let convertedArea = getConvertedArea(knownArea);
        let uiObjArr = boundsInside(convertedArea.topLeft.x, convertedArea.topLeft.y, convertedArea.bottomRight.x, convertedArea.bottomRight.y).find();
        for (let i=0; i<uiObjArr.length; i++) {
            let uiObj = uiObjArr[i];
            let content = getContent(uiObj);
            if (content != null) {
                let matched = content.match(/\d+/);
                if (matched != null) content = matched[0];
            }
            lv = parseInt(content);
            if (lv != null && !isNaN(lv)) {
                log("getMirrorsLvAt rowNum", rowNum, "columnNum", columnNum, "lv", lv);
                return lv;
            }
        }
        return 0;
    }
    //在对手队伍信息中获取等级信息，用来计算人均战力
    function getMirrorsAverageScore(totalScore) {
        //刷新auto.root（也许只有心理安慰作用？）
        try { auto.root != null && auto.root.refresh(); } catch (e) {}; //只刷新一次

        if (totalScore == null) return 0;
        log("getMirrorsAverageScore totalScore", totalScore);
        let totalSqrtLv = 0;
        let totalLv = 0;
        let charaCount = 0;
        let highestLv = 0;

        let attemptMax = 5;
        for (let rowNum=1; rowNum<=3; rowNum++) {
            for (let columnNum=1; columnNum<=3; columnNum++) {
                let Lv = 0;
                for (let attempt=0; attempt<attemptMax; attempt++) {
                    Lv = getMirrorsLvAt(rowNum, columnNum);
                    if (Lv > 0) {
                        if (Lv > highestLv) highestLv = Lv;
                        totalLv += Lv;
                        totalSqrtLv += Math.sqrt(Lv);
                        charaCount += 1;
                        break;
                    }
                    if (attempt < attemptMax - 1) sleep(100);
                }
                attemptMax = 1;
            }
        }
        log("getMirrorsAverageScore charaCount", charaCount, "highestLv", highestLv, "totalLv", totalLv, "totalSqrtLv", totalSqrtLv);
        if (charaCount == 0) return 0; //对手队伍信息还没出现
        let avgScore = totalScore / totalSqrtLv * Math.sqrt(highestLv); //按队伍里的最高等级进行估计（往高了估，避免错把强队当作弱队）
        log("getMirrorsAverageScore avgScore", avgScore);
        return avgScore;
    }

    //在镜层自动挑选最弱的对手
    function mirrorsPickWeakestOpponent() {
        toast("挑选最弱的镜层对手...");

        var startTime = new Date().getTime();
        var deadlineTime = startTime + 60 * 1000; //最多等待一分钟
        var stopTime = new Date().getTime() + 5000;

        //刷新auto.root（也许只有心理安慰作用？）
        for (let attempt=0; attempt<10; attempt++) {
            try {if (auto.root != null && auto.root.refresh()) break;} catch (e) {};
            sleep(100);
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("等待auto.root刷新时间过长");
                return false;
            }
        }

        stopTime = new Date().getTime() + 5000;

        let lowestTotalScore = Number.MAX_SAFE_INTEGER;
        let lowestAvgScore = Number.MAX_SAFE_INTEGER;
        //数组第1个元素（下标0）仅用来占位
        let totalScore = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
        let avgScore = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
        let lowestScorePosition = 3;

        while (!id("matchingWrap").findOnce() && !id("matchingList").findOnce()) {
            log("等待对手列表出现...");
            sleep(1000);
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("没等到对手列表控件matchingWrap或matchingList出现,无法智能挑选最弱对手");
                return false;
            }
        }

        stopTime = new Date().getTime() + 5000;

        if (id("matchingList").findOnce()) {
            toastLog("当前处于演习模式");
            //演习模式下直接点最上面第一个对手
            while (id("matchingList").findOnce()) { //如果不小心点到战斗开始，就退出循环
                if (getMirrorsAverageScore(totalScore[1]) > 0) break; //如果已经打开了一个对手，直接战斗开始
                click(convertCoords(clickSetsMod["mirrorsOpponent"+"1"]));
                sleep(1000); //等待队伍信息出现，这样就可以点战斗开始
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到镜层对手队伍信息出现(也可能是虽然已经出现,但getMirrorsAverageScore没检测到导致的)");
                }
            }
            return true;
        }

        stopTime = new Date().getTime() + 5000;

        //如果已经打开了信息面板，先关掉
        for (let attempt=0; id("matchingWrap").findOnce(); attempt++) { //如果不小心点到战斗开始，就退出循环
            if (getMirrorsAverageScore(99999999) <= 0) break; //如果没有打开队伍信息面板，那就直接退出循环，避免点到MENU
            if (attempt % 5 == 0) click(convertCoords(clickSetsMod["mirrorsCloseOpponentInfo"]));
            sleep(1000);
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("没等到镜层对手队伍信息面板消失");
                return false;
            }
        }

        stopTime = new Date().getTime() + 5000;

        let selfScore = getMirrorsSelfScore();

        //获取每个对手的总战力
        for (let position=1; position<=3; position++) {
            for (let attempt=0; attempt<10; attempt++) {
                totalScore[position] = getMirrorsScoreAt(position);
                if (totalScore[position] > 0) break;
                sleep(100);
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到第"+position+"个镜层对手的队伍信息出现(也可能是虽然已经出现,但getMirrorsAverageScore没检测到导致的)");
                    return false;
                }
            }
            if (totalScore[position] <= 0) {
                toastLog("获取某个对手的总战力失败\n请尝试退出镜层后重新进入");
                log("获取第"+position+"个对手的总战力失败");
                return false;
            }
            if (totalScore[position] < lowestTotalScore) {
                lowestTotalScore = totalScore[position];
                lowestScorePosition = position;
            }
        }

        stopTime = new Date().getTime() + 5000;

        //福利队
        //因为队伍最多5人，所以总战力比我方总战力六分之一还少应该就是福利队
        if (lowestTotalScore < selfScore / 6) {
            toastLog("找到了战力低于我方六分之一的对手\n位于第"+lowestScorePosition+"个,战力="+totalScore[lowestScorePosition]);
            while (id("matchingWrap").findOnce()) { //如果不小心点到战斗开始，就退出循环
                click(convertCoords(clickSetsMod["mirrorsOpponent"+lowestScorePosition]));
                sleep(2000); //等待队伍信息出现，这样就可以点战斗开始
                if (getMirrorsAverageScore(totalScore[lowestScorePosition]) > 0) break;
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到镜层对手(福利队)的队伍信息出现");
                    return false;
                }
            }
            return true;
        }

        stopTime = new Date().getTime() + 5000;

        //找平均战力最低的
        for (let position=1; position<=3; position++) {
            toast("检查第"+position+"个镜层对手的队伍情况...");
            while (id("matchingWrap").findOnce()) { //如果不小心点到战斗开始，就退出循环
                click(convertCoords(clickSetsMod["mirrorsOpponent"+position]));
                sleep(2000); //等待对手队伍信息出现（avgScore<=0表示对手队伍信息还没出现）
                avgScore[position] = getMirrorsAverageScore(totalScore[position]);
                if (avgScore[position] > 0) {
                    if (avgScore[position] < lowestAvgScore) {
                        lowestAvgScore = avgScore[position];
                        lowestScorePosition = position;
                    }
                    break;
                }
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到第"+position+"个镜层对手的队伍信息出现");
                    return false;
                }
            }

            //关闭信息面板
            for (let attempt=0; id("matchingWrap").findOnce(); attempt++) { //如果不小心点到战斗开始，就退出循环
                if (position == 3) break; //第3个对手也有可能是最弱的，暂时不关面板
                if (attempt % 5 == 0) click(convertCoords(clickSetsMod["mirrorsCloseOpponentInfo"]));
                sleep(1000);
                if (getMirrorsAverageScore(totalScore[position]) <= 0) break;
                if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                    log("没等到第"+position+"个镜层对手的队伍信息出现");
                    return false;
                }
            }
        }

        stopTime = new Date().getTime() + 5000;

        log("找到平均战力最低的对手", lowestScorePosition, totalScore[lowestScorePosition], avgScore[lowestScorePosition]);

        if (lowestScorePosition == 3) return true; //最弱的就是第3个对手

        //最弱的不是第3个对手，先关掉第3个对手的队伍信息面板
        for (let attempt=0; id("matchingWrap").findOnce(); attempt++) { //如果不小心点到战斗开始，就退出循环
            if (attempt % 5 == 0) click(convertCoords(clickSetsMod["mirrorsCloseOpponentInfo"]));
            sleep(1000);
            if (getMirrorsAverageScore(totalScore[lowestScorePosition]) <= 0) break;
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("没等到第3个镜层对手(不是最弱)的队伍信息消失");
                return false;
            }
        }

        stopTime = new Date().getTime() + 5000;

        //重新打开平均战力最低队伍的队伍信息面板
        while (id("matchingWrap").findOnce()) { //如果不小心点到战斗开始，就退出循环
            click(convertCoords(clickSetsMod["mirrorsOpponent"+lowestScorePosition]));
            sleep(1000); //等待队伍信息出现，这样就可以点战斗开始
            if (getMirrorsAverageScore(totalScore[lowestScorePosition]) > 0) return true;
            if (new Date().getTime() > (stopTime<deadlineTime?stopTime:deadlineTime)) {
                log("没等到第"+lowestScorePosition+"个镜层对手(最弱)的队伍信息出现");
                return false;
            }
        }
        log("id(\"matchingWrap\").findOnce() == null");
        return true;
    }

    function mirrorsPick3rdOpponent() {
        toastLog("挑选第3个镜层对手...");
        let matchWrap = id("matchingWrap").findOne().bounds()
        for (let attempt=0; attempt<3; attempt++) {
            if (id("battleStartBtn").findOnce()) break; //MuMu等控件树残缺环境下永远也找不到battleStartBtn（虽然实际上有战斗开始按钮）
            click(matchWrap.centerX(), matchWrap.bottom - 50);
            sleep(1500);
        }
        log("挑选第3个镜层对手完成");
    }

    function taskMirrors() {
        toast("镜层周回\n自动战斗策略:"+(limit.useCVAutoBattle?"识图":"无脑123盘"));

        if (!MODULES.shellCmd.privilege && (limit.useCVAutoBattle && limit.rootScreencap)) {
            toastLog("需要root或shizuku adb权限");
            requestShellPrivilege();
            return;
        }

        initialize();

        if (limit.useCVAutoBattle && (!limit.rootScreencap)) {
            startScreenCapture();
        }

        while (true) {
            var pickedWeakest = false;
            if (limit.smartMirrorsPick) {
                //挑选最弱的对手
                let pickWeakestAttemptMax = 2;
                for (let attempt=0; attempt<pickWeakestAttemptMax; attempt++) {
                    if (mirrorsPickWeakestOpponent()) {
                        pickedWeakest = true;
                        break;
                    }
                    toastLog("挑选镜层最弱对手时出错\n3秒后重试...");
                    sleep(3000);
                }
                if (!pickedWeakest) {
                    toastLog("多次尝试挑选镜层最弱对手时出错,回退到挑选第3个镜层对手...");
                }
            }
            if (!limit.smartMirrorsPick || !pickedWeakest) {
                mirrorsPick3rdOpponent();
            }

            while (id("matchingWrap").findOnce() || id("matchingList").findOnce()) {
                sleep(1000)
                click(convertCoords(clickSetsMod.mirrorsStartBtn));
                sleep(1000)
                if (id("popupInfoDetailTitle").findOnce()) {
                    if (id("matchingList").findOnce()) {
                        log("镜层演习模式不嗑药");
                        log("不过，开始镜层演习需要至少有1BP");
                        log("镜层周回结束");
                        return;
                    } else if (isDrugEnough(3)) {
                        while (!id("bpTextWrap").findOnce()) {
                            click(convertCoords(clickSetsMod.bpExhaustToBpDrug))
                            sleep(1500)
                        }
                        while (id("bpTextWrap").findOnce()) {
                            click(convertCoords(clickSetsMod.bpDrugConfirm))
                            sleep(1500)
                        }
                        while (id("popupInfoDetailTitle").findOnce()) {
                            click(convertCoords(clickSetsMod.bpDrugRefilledOK))
                            sleep(1500)
                        }
                        updateDrugLimit(3);
                    } else {
                        click(convertCoords(clickSetsMod.bpClose))
                        log("镜层周回结束")
                        return;
                    }
                }
                sleep(1000)
            }
            log("进入战斗")
            if (limit.useCVAutoBattle) {
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

    /* ~~~~~~~~ 镜界自动战斗 结束 ~~~~~~~~ */