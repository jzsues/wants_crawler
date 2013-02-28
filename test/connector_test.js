var should = require("should");

var httpConnector = require("../lib/http_connector");

var get_options_no_proxy = {
    url:"http://d.mamplus.com:12999/google/translate",
    query:"from=en&to=zh-CN&q=test case&q=test"
};
var get_options_with_proxy = {
    url:"http://d.mamplus.com:12999/google/translate",
    query:"from=en&to=zh-CN&q=test case",
    proxy:"http://d.mamplus.com:8000"
};

var post_options_no_proxy = {
    url:"http://d.mamplus.com:12999/google/translate",
    // body : "from=en&to=zh-CN&q=test case"
    body:{
        from:"en",
        to:"zh-CN",
        q:"test case"
    }
};
var post_options_with_proxy = {
    url:"http://d.mamplus.com:12999/google/translate",
    body:{
        from:"en",
        to:"zh-CN",
        q:[ "test case", "hello world", "i love you" ]
    },
    proxy:"http://d.mamplus.com:8000"
};

var post_body = "from=en&to=zh-CN&q=test case";

describe("HTTP Connector", function () {
    describe("method", function () {
        describe("get", function () {
            it("with no proxy", function (done) {
                httpConnector.get(get_options_no_proxy, null, null, function (err, body) {
                    if (err)
                        done(err);
                    should.exist(body);
                    done();
                });
            });
            it("with proxy", function (done) {
                httpConnector.get(get_options_with_proxy, null, null, function (err, body) {
                    if (err)
                        done(err);
                    should.exist(body);
                    done();
                });
            });
        });
        describe("post", function () {
            it("with no proxy", function (done) {
                httpConnector.post(post_options_no_proxy, null, null, function (err, body) {
                    if (err)
                        done(err);
                    should.exist(body);
                    done();
                });
            });
            it("with  proxy", function (done) {
                httpConnector.post(post_options_with_proxy, null, null, function (err, body) {
                    if (err)
                        done(err);
                    should.exist(body);
                    done();
                });
            });
        });
    });
});
