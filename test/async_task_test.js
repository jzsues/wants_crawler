var should = require("should");
var AsyncTask = require("../walker/async_task");
var TaskQueue = require("../lib/task_queue");
var TaskCargo = require("../lib/task_cargo");
var httpConnector = require("../lib/http_connector");
var emitter = require("../walker/event_emitter");
var get_options_no_proxy = {
    url:"http://d.mamplus.com:12999/google/translate",
    query:"from=en&to=zh-CN&q=test case&q=test"
};

describe("Async task", function () {
    it("event emitter", function (done) {
        // var task = new AsyncTask("test", function(obj, callback) {
        // callback(null, obj);
        // });
        // task.run(function(error, data) {
        // setTimeout(function() {
        // task.run(function(error, data) {
        // setTimeout(function() {
        // task.run(function(error, data) {
        // done();
        // });
        // }, 1 * 1000);
        // });
        // }, 2 * 1000);
        //
        // });
        done();
    });
    it("task queue", function (done) {
        var queue = new TaskQueue({
            size:5,
            drain:function () {
                console.log("task queue drain");
                done();
            }
        });
        var tasks = [];
        for (var i = 0; i < 100; i++) {
            var task = new AsyncTask("test " + i, function (obj, callback) {
                httpConnector.get({
                    url:"http://d.mamplus.com:12999/google/translate",
                    query:"from=en&to=zh-CN&q=" + obj,
                    timeout:5000
                }, false, false, function (error, res) {
                    callback(error, res);
                });
            });
            queue.push(task, function (error, data) {
                if (error)
                    emitter.emit("async.task.end", error);
                else
                    emitter.emit("async.task.end", data);
            });
        }
    });
});