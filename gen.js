const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const crypto = require("crypto");


const rootpath = __dirname;
const hashFuncName = 'sha256';
const includeRules = [
    {
        dirname: ".",
        recursive: false,
        filename: /\.(js|json|xml)$/,
    },
    {
        dirname: "bin",
        recursive: false,
        filename: /.+/,
    },
    {
        dirname: "images",
        recursive: false,
        filename: /\.(png|jpg|ico|gif|bmp)$/,
    },
    {
        dirname: "modules",
        recursive: true,
        filename: /.+/,
    },
    {
        dirname: "autowebViewBuild/dist",
        recursive: true,
        filename: /.+/,
    },
]


//May return null
async function walkThrough(fullpath) {
    let relativepath = path.relative(rootpath, fullpath).replace(new RegExp('\\' + path.sep, 'g'), '/');

    if ((await fsPromises.stat(fullpath)).isDirectory()) {
        if (includeRules.find((rule) => {
            if (rule.dirname === path.dirname(relativepath)) {
                return true;
            } else if (rule.recursive) {
                let fullpath2 = path.resolve(rule.dirname);
                if (!path.relative(fullpath2, fullpath).includes(".."))
                    return true;
                if (!path.relative(fullpath, fullpath2).includes(".."))
                    return true;
            }
            return false;
        })) {
            let result = [];
            let dirContent = await fsPromises.readdir(fullpath);
            for (let i=0; i<dirContent.length; i++) {
                let filename = dirContent[i];
                let item = await walkThrough(path.join(fullpath, filename));
                if (item != null) result.push(item);
            };
            return result.length > 0 ? result : null;
        }
    } else {
        if (includeRules.find((rule) => {
            if (path.basename(relativepath).match(rule.filename)) {
                if (rule.dirname === path.dirname(relativepath)) {
                    return true;
                } else if (rule.recursive) {
                    let fullpath2 = path.resolve(rule.dirname);
                    if (!path.relative(fullpath2, fullpath).includes(".."))
                        return true;
                }
            }
            return false;
        })) {
            let hash = crypto.createHash(hashFuncName);
            let content = await fsPromises.readFile(fullpath);
            hash.update(content);
            let digest = hash.digest("base64");
            return {
                src: relativepath,
                integrity: hashFuncName+"-"+digest,
            };
        }
    }
}


const resultDir = path.join(rootpath, "update");
const resultPath = path.join(resultDir, "updateList.json");


async function regenerate() {
    console.log("Regenerating update/updateList.json ...");
    let result = await walkThrough(rootpath);
    if (result == null) result = [];
    try {
        let stat = await fsPromises.stat(resultDir);
        if (!stat.isDirectory()) {
            throw new Error("Cannot create directory at path "+resultDir+", file already exists.");
        }
    } catch (e) {
        if (e.code === 'ENOENT') {
            await fsPromises.mkdir(resultDir);
        } else {
            throw e;
        }
    }
    await fsPromises.writeFile(resultPath, JSON.stringify(result));
    console.log("Written to "+resultPath);
    return result;
}
regenerate();


//https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/development_environmentc
const http = require("http");
const hostname = '127.0.0.1';
var port = 9090;

const HTMLHead1 =
   "<html>"
+"\n    <meta charset='UTF-8'>"
+"\n    <meta http-equiv=\"cache-control\" content=\"no-cache\" />"
+"\n    <head>"
+"\n        <title>Dev Server</title>"
+"\n    </head>";
const HTMLHead2 =
 "\n    <body>"
+"\n        <script>"
+"\n            function blobToDataURI(blob, callback) {"
+"\n                var reader = new FileReader();"
+"\n                reader.onload = function (e) {"
+"\n                    callback(e.target.result);"
+"\n                }"
+"\n                reader.readAsDataURL(blob);"
+"\n            }"
+"\n            function downloadFileAsync(fileInfo, callback) {"
+"\n                let options = {mode: \"cors\"};"
+"\n                if (fileInfo.integrity != null) options.integrity = fileInfo.integrity;"
+"\n                let request = new Request(fileInfo.url, options);"
+"\n                console.log(request.url, request.integrity);"
+"\n                fetch(request)"
+"\n                .then(response => {"
+"\n                    if (!response.ok) {"
+"\n                        throw new Error(\"Fetching failed\");"
+"\n                    } else {"
+"\n                        return response.blob();"
+"\n                    }"
+"\n                })"
+"\n                .then(blob => {"
+"\n                    blobToDataURI(blob, (result) => callback(result));"
+"\n                })"
+"\n                .catch(error => {"
+"\n                    alert(\"SRI-enabled fetch has failed.\\nintegrity=[\"+request.integrity+\"]\\nURL=[\"+request.url+\"]\");"
+"\n                    console.error(error);"
+"\n                });"
+"\n            }"
+"\n            function clickHandler(e) {"
+"\n                if (e.title != null && typeof e.title === \"string\" && e.title.startsWith(\"data:\")) {"
+"\n                    document.getElementById(\"iframeOfData\").setAttribute(\"src\", e.title, 0);"
+"\n                    alert(\"This link has been downloaded through SRI-enabled fetch, and its SRI hash is consistent.\\nDownloaded data is shown above.\");"
+"\n                    return false;"
+"\n                }"
+"\n                alert(\"Downloading data through SRI-enabled fetch...\");"
+"\n                downloadFileAsync({url: e.href, integrity: e.id}, (result) => {"
+"\n                    document.getElementById(\"iframeOfData\").setAttribute(\"src\", e.title, 0);"
+"\n                    e.title = result;"
+"\n                    e.target = \"\";"
+"\n                    document.getElementById(\"iframeOfData\").setAttribute(\"src\", e.title, 0);"
+"\n                    alert(\"SRI-enabled fetch completed successfully.\\nDownloaded data will be shown above.\");"
+"\n                    return;"
+"\n                });"
+"\n                return false;"
+"\n            }"
+"\n        </script>"
+"\n        <b>JSON data of all files (URLs and SRI hashes):</b><br>"
+"\n        <a href=\"update/updateList.json\" target=\"_blank\"><b>application/json</b> update/updateList.json</a><br>"
+"\n        <b>SRI-consistent downloaded data (click links below to show here):</b><br>"
+"\n        <iframe id=\"iframeOfData\" width=\"100%\" height=\"50%\"></iframe>"
+"\n        <b>Links of all files:</b><br>"
const HTMLTail =
 "\n    </body>"
+"\n    <style>"
+"\n        article {"
+"\n            margin: .5rem"
+"\n        }"
+"\n    </style>"
+"\n</html>";

const mimeTypes = {
    js:   'text/javascript',
    json: 'application/json',
    txt:  'text/plain',
    htm:  'text/html',
    html: 'text/html',
    css:  'text/css',
    xml:  'text/xml',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    ico:  'image/vnd.microsoft.icon',
    gif:  'image/gif',
    bmp:  'image/bmp',
    webp: 'image/webp',
};
function getMimeType(filename) {
    let mimetype = mimeTypes[path.extname(filename).replace(/^\./, '')];
    if (mimetype == null) mimetype = 'application/octect-stream';
    return mimetype;
}
function getMimeTypeUTF8(filename) {
    let contenttype = getMimeType(filename);
    if (contenttype === 'application/json' || contenttype.match(/^text((\/)|())/))
        contenttype += "; charset=utf-8";
    return contenttype;
}
function generateATags(data) {
    let aLines = "";
    if (Array.isArray(data)) {
        if (data.length > 0) {
            aLines += "\n<article>";
            data.forEach((item) => {
                aLines += generateATags(item);
            });
            aLines += "\n</article>";
        }
    } else {
        aLines += "\n<a href=\""+data.src+"\" id=\""+data.integrity+"\" onclick=\"return clickHandler(this);\" target=\"_blank\"><b>"+getMimeType(data.src)+"</b> "+data.src+"</a><br>";
    }
    return aLines;
}
async function generateHTMLResult(data) {
    if (data == null) data = await regenerate();
    let linkLines = "";
    let aLines = generateATags(data);
    return HTMLHead1+linkLines+HTMLHead2+aLines+HTMLTail;
}
var rateLimit = {
    lastTime: new Date().getTime(),
    remainingReqCount: 50,
};
function isTooFrequent() {
    let currentTime = new Date().getTime();
    if (currentTime > rateLimit.lastTime + 10000) {
        rateLimit = {
            lastTime: currentTime,
            remainingReqCount: 50,
        };
    } else {
        if (rateLimit.remainingReqCount-- <= 0) {
            rateLimit.remainingReqCount = 0;
            return true;
        }
    }
    return false;
}
const server = http.createServer(async (req, res) => {
    let relativepath = req.url.replace(/^\//, "");
    let fullpath = path.resolve(relativepath);
    let found = includeRules.find((rule) => {
        if (path.basename(relativepath).match(rule.filename)) {
            if (rule.dirname === path.dirname(relativepath)) {
                return true;
            } else if (rule.recursive) {
                let fullpath2 = path.resolve(rule.dirname);
                if (!path.relative(fullpath2, fullpath).includes(".."))
                    return true;
            }
        }
        return false;
    });
    if (req.url === "/") {
        if (isTooFrequent()) {
            res.statusCode = 429;
            res.end('429 Too Many Requests\n');
            return;
        };
        await regenerate();
        res.statusCode = 200;
        res.setHeader('Content-Type', getMimeTypeUTF8("index.html"));
        res.setHeader('Access-Control-Allow-Origin', '*');
        console.log(`Serving index page`);
        res.end(await generateHTMLResult(await regenerate()));
    } else if ("/update/updateList.json" === req.url) {
        if (isTooFrequent()) {
            res.statusCode = 429;
            res.end('429 Too Many Requests\n');
            return;
        };
        await regenerate();
        res.statusCode = 200;
        res.setHeader('Content-Type', getMimeTypeUTF8("/update/updateList.json"));
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-control', 'no-cache');
        console.log(`Serving JSON data`);
        res.end(JSON.stringify(await regenerate()));
    } else if (found != null) {
        res.setHeader('Cache-control', 'no-cache');
        let servingfilepath = path.resolve(path.join(rootpath, relativepath));
        if (path.relative(rootpath, servingfilepath).includes("..") || relativepath.includes(":") || relativepath.includes("$")) {
            res.statusCode = 403;
            res.end('403 Forbidden\n');
        } else {
            try {
                let stat = await fsPromises.stat(servingfilepath);
                if (stat.isDirectory()) {
                    res.statusCode = 403;
                    console.log(`isDirectory: ${servingfilepath}`);
                    res.end('403 Forbidden\n');
                } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', getMimeTypeUTF8(path.basename(relativepath)));
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    console.log(`Serving file: ${servingfilepath}`);
                    res.end(await fsPromises.readFile(servingfilepath));
                    //setTimeout(() => {
                    //    res.end(await fsPromises.readFile(servingfilepath) + (relativepath.includes("main.js")?"/*DEBUG*/":""));//DEBUG
                    //}, 1000);
                }
            } catch (e) {
                if (e.code === 'ENOENT') {
                    res.statusCode = 404;
                    console.log(`Not found: ${servingfilepath}`);
                    res.end('404 Not found\n');
                } else {
                    throw e;
                }
            }
        }
    } else {
        res.statusCode = 403;
        res.end('403 Forbidden\n');
    }
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.log(`EADDRINUSE, retrying port ${++port}...`);
        setTimeout(() => {
            server.close();
            server.listen(port, hostname);
        }, 1000);
    }
});
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    console.log(`You may set up reverse port forwarding for Android device with this command:`);
    console.log(`adb -d reverse tcp:${port} tcp:${port}`);
    console.log(`or emulator:`);
    console.log(`adb -e reverse tcp:${port} tcp:${port}`);
    console.log(`so that the device/emulator will be able to reach this dev server!`);
});
