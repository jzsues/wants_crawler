var wants = require("wants");
var utils = wants.utils;
var logger = wants.logger;
var MetaProvider = require("../lib/meta_provider.js");
var async = require("async");

var Walker = function (options) {
    this.rootLoader = options.rootLoader;
    this.childLoader = options.childLoader;
    this._init();
};

Walker.prototype._init = function () {
    var self = this;
    self.provider = new MetaProvider({
        loader:function (item, cb) {
            self.childLoader(item, function (error, datas) {
                cb(error, datas);
            });
        },
        parser:function (data, cb) {
            cb(null, data);
        }
    });
}

Walker.prototype.root = function (callback) {
    this.rootLoader(function (error, data) {
        callback(error, data);
    });
}

Walker.prototype.child = function (parent, callback) {
    var self = this;
    async.auto({
        _parent:function (cb) {
            if (parent) {
                cb(null, parent);
            } else {
                self.root(function (error, data) {
                    cb(error, data)
                });
            }
        },
        _child:[ "_parent", function (cb, datas) {
            var _parent = datas["_parent"];
            if (_parent.length) {
                self.provider.batch(_parent, function (err, results) {
                    cb(err, results);
                });
            } else {
                self.provider.each({
                    obj:self.provider,
                    paramter:_parent
                }, function (err, results) {
                    cb(err, results);
                });
            }
        } ]
    }, function (error, results) {
        callback(error, results["_child"]);
    });
};

module.exports = Walker;