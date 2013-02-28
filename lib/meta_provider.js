var wants = require("wants");
var utils = wants.utils;
var logger = wants.logger;
var async = require("async");

var MetaProvider = function(options) {
	this.loader = options.loader;
	this.parser = options.parser;
};

MetaProvider.prototype.each = function(context, callback) {
	async.auto({
		_load : function(cb) {
			context.obj.loader(context.paramter, function(error, datas) {
				cb(error, datas);
			});
		},
		_parse : [ "_load", function(cb, datas) {
			if (typeof (context.obj.parser) == "function") {
				async.map(datas["_load"], context.obj.parser, function(err, results) {
					cb(err, results);
				});
			} else {
				cb(null, datas);
			}
		} ],
		_report : [ "_parse", function(cb, results) {
			cb(null, results["_parse"]);
		} ]
	}, function(err, results) {
		callback(null, results["_report"]);
	});
};

MetaProvider.prototype.batch = function(items, callback) {
	var contexts = [];
	var that = this;
	items.forEach(function(item) {
		contexts.push({
			obj : that,
			paramter : item
		});
	});
	async.map(contexts, that.each, function(error, results) {
		callback(error, results);
	});
}

module.exports = MetaProvider;