"use strict";

var http = require("http");
var qs = require("querystring");
var url = require("url");
var AWS = require("aws-sdk");
var _ = require("underscore");

var debug = true;

var config = require("./config.json");

AWS.Request.prototype.promise = function () {
    var deferred = require("q").defer();
    this.on("complete", function (res) {
        if (res.error) deferred.reject(res.error);
        else deferred.resolve(res.data);
    });
    this.send();
    return deferred.promise;
};


// @TODO: 認証はどうしようかね。。
AWS.config.loadFromPath("./credentials.json");

var server = http.createServer();
server.on("request", onRequest);
server.listen(config.port, function () { console.log("server running on port: " + config.port + "."); });

/**
 * @method onRequest
 * @param req [Object] http.IncomingMessage
 * @param res [Object] http.ServerResponse
 */
function onRequest (req, res) {
    if (debug) console.log(req.url);
    if (isValidRequest(req)) {
        getRequestParameter(req)
            .then(function (reqParam) {
                var requests = parseRequestUrl(req);
                if (requests.className === "Config") {
                    var q = require("q").defer();
                    AWS.config[requests.method](reqParam);
                    q.resolve({success: true, "class": "Config", method: requests.method});
                    return q.promise;
                } else {
                    return proxyRequestToAWS(parseRequestUrl(req), reqParam);
                }
            })
            .then(
                function (awsreq) {
                    res.writeHead(200, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    });
                    res.end(JSON.stringify(awsreq));
                },
                function (result) { if (debug) console.log(awsreq); }
            )
            .done();
    } else {
        res.writeHead(400);
        res.end();
    }
}

/**
 *
 */
function getRequestParameter (req) {
    var q = require("q").defer();
    if (req.method === "POST") {
        var data = "";
        req.on("data", function (chunk) { data += chunk; });
        req.on("end", function () { q.resolve(require("querystring").parse(data)); });
    } else if (req.method === "GET") {
        q.resolve(url.parse(req.url, true).query);
    } else {
        q.reject();
    }
    return q.promise;
}

/**
 * @method proxyRequestToAWS
 * @param req [Object] 
 * @return [q.promise]
 */
function proxyRequestToAWS (req, param) {
    // @TODO: サービス名の大文字小文字をどうやって解消するか。
    var serviceInstance = new AWS[req.className];
    return serviceInstance[req.method](param || {}).promise();
}

/**
 * @method parseRequestUrl
 * @param req [Object] http.request
 * @return [Object]
 */
function parseRequestUrl (req) {
    var pathes = url.parse(req.url).pathname.split("/");
    return {className: pathes[1], method: pathes[2]};
}

/**
 * @method isValidRequest
 * @param req [Object] http.request
 * @return [boolean]
 */
function isValidRequest (req) {
    var requests = parseRequestUrl(req);
    if (!requests.className) return false;
    // @TODO: 多分utilとかは除外しないといけないかな？
    var isValidClass = _(AWS)
        .chain()
        .keys()
        .some(function (i) { return new RegExp(requests.className, "i").test(i); })
        .value();
    if (!isValidClass) return false;
    return true;
}

