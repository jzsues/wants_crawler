var wants = require("wants");
var utils = wants.utils;
var logger = wants.logger;
var MetaProvider = require("./meta_provider.js");
var async = require("async");

var TreeLoader = function(options) {
	this.rootLoader = options.rootLoader;
	this.childLoader = options.childLoader;
	this._init();
};

TreeLoader.prototype._init = function() {
	var self = this;
	self.provider = new MetaProvider({
		loader : function(item, cb) {
			self.childLoader(item, function(error, datas) {
				cb(error, datas);
			});
		},
		parser : function(data, cb) {
			cb(null, data);
		}
	});
}

TreeLoader.prototype.root = function(callback) {
	this.rootLoader(function(error, data) {
		callback(error, data);
	});
}

TreeLoader.prototype.all = function(callback) {
	var self = this;
	var res = [];
	self.root(function(error, root) {
		if (error)
			callback(error);
		else {
			res.push(root);
			self.child(root, function(err, parents) {
				if (err)
					callback(error);
				else {
					res = res.concat(parents);
					self.child(parents, function(e, childs) {
						if (e)
							callback(e);
						else {
							childs.forEach(function(child) {
								res = res.concat(child)
							});
							callback(null, res);
						}
					});
				}
			});
		}
	});
};

TreeLoader.prototype.child = function(parent, callback) {
	var self = this;
	async.auto({
		_parent : function(cb) {
			if (parent) {
				cb(null, parent);
			} else {
				self.root(function(error, data) {
					cb(error, data)
				});
			}
		},
		_child : [ "_parent", function(cb, datas) {
			var _parent = datas["_parent"];
			if (_parent.length) {
				self.provider.batch(_parent, function(err, results) {
					cb(err, results);
				});
			} else {
				self.provider.each({
					obj : self.provider,
					paramter : _parent
				}, function(err, results) {
					cb(err, results);
				});
			}
		} ]
	}, function(error, results) {
		callback(error, results["_child"]);
	});
};

module.exports = TreeLoader;