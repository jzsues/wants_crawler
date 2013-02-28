var should = require("should");

var Walker = require("../walker/walker.js");

var GenericDao = require("../dao/generic_dao");

var categoryDao = new GenericDao({
    colname:"ama_category"
});

describe("Walker", function () {
    it("db provider", function (done) {
        var walker = new Walker({
            rootLoader:function (callback) {
                categoryDao.findone({
                    category:"baby-products"
                }, false, function (error, data) {
                    callback(error, data)
                });
            },
            childLoader:function (parent, callback) {
                categoryDao.find({
                    parent:parent.category
                }, false, false, false, false, function (error, datas) {
                    callback(error, datas)
                });
            }
        });
        walker.child(null, function (error, datas) {
            walker.child(datas, function (error, results) {
                console.log(results);
                done();
            });
        });
    });
});