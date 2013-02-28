var should = require("should");
var GenericDao = require("../dao/generic_dao");

var TaskQueue = require("../lib/task_queue");

var testDao = new GenericDao({
    colname:"test"
});

var httpConnector = require("../lib/http_connector");

var get_options_no_proxy = {
    url:"http://d.mamplus.com:12999/google/translate",
    query:"from=en&to=zh-CN&q=test case&q=test"
};

describe("Task Queue", function () {
    describe("push", function (done) {
        it("single task", function (done) {
            var queue = new TaskQueue({
                size:2,
                drain:function () {
                    console.log("task drain");
                    if (queue.status.error == 0) {
                        queue.status.success.should.equal(1);
                        done();
                    } else {
                        done("task execute with error");
                    }
                }
            });
            var task = {
                data:{
                    key:"key"
                },
                run:function (cb) {
                    testDao.findone(this.data, false, function (err, res) {
                        cb(err, res);
                    });
                }
            };
            queue.push(task, function (error, data) {
                if (!error)
                    data.key.should.eql("key");
            });
        });
        it("multi task", function (done) {
            var queue = new TaskQueue({
                size:10,
                drain:function () {
                    console.log("task drain,\n" + JSON.stringify(queue.status));
                    queue.status.success.should.above(0);
                    done();
                }
            });

            testDao.findCursor({
                key:"key"
            }, false, function (item) {
                var task = {
                    data:item,
                    run:function (cb) {
                        var that = this;
                        httpConnector.get({
                            url:"http://d.mamplus.com:12999/google/translate",
                            query:"from=en&to=zh-CN&q=" + that.data.value,
                            timeout:5000
                        }, false, false, function (error, res) {
                            cb(error, res);
                        });
                    }
                };
                queue.push(task, function (error, data) {
                    if (!error) {
                        data = JSON.parse(data);
                        console.log(data);
                        data.status.should.eql(1);
                    } else {
                        console.log(error);
                    }
                });
            }, function (error) {
                console.log(error);
            }, function () {
                console.log("db cursor query done");
            })
        });
    });
});
