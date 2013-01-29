var wants = require("wants");
var logger = wants.logger;
var TaskQueue = require("../lib/task_queue");
var httpConnector = require("../lib/http_connector");
var categoryHtmlRender = require("./ama_category_render");
var GenericDao = require("../dao/generic_dao");

var amaCategory = {
	name : "ama_category",
	beginUrl : "http://www.amazon.com/gp/new-releases"
};

var categoryUpdateDao = new GenericDao({
	colname : amaCategory.name
});

var categoryQueryDao = new GenericDao({
	colname : amaCategory.name
});

var categoryDbQueue = new TaskQueue({
	size : 50,
	drain : function() {
		logger.debug("category Db Queue drain");
	}
});

var httpQueue = new TaskQueue({
	size : 50,
	drain : function() {
		logger.debug("category Http Queue drain");
		amaCategory.loop();
	}
});

amaCategory.loop = function() {
	categoryQueryDao.find({
		status : {
			$in : [ "initial", "error" ]
		}
	}, 50, false, false, {
		"_id" : 1
	}, function(error, datas) {
		if (!error) {
			if (datas.length > 0) {
				datas.forEach(function(data) {
					amaCategory.execute(data);
				});
			} else {
				_ama_category_scan_status = _status.stop;
			}
		}
	});
}

amaCategory.start = function(callback) {
	if (_ama_category_scan_status == _status.stop) {
		_ama_category_scan_status = _status.runing;
		categoryQueryDao.count({}, function(error, count) {
			if (error)
				logger.error(error);
			if (count == 0) {
				amaCategory.execute({
					url : amaCategory.beginUrl
				});
			} else {
				amaCategory.loop();
			}
		});
	} else {
		logger.debug("ama category scan queue is runing!");
	}
	callback();
};

amaCategory.execute = function(parent) {
	var task = amaCategory.fetchTask(parent);
	httpQueue.push(task, function(error, data) {
		if (error)
			logger.error(error + "__2");
	});
}
amaCategory.fetchTask = function(parent) {
	return {
		parent : parent,
		run : function(cb) {
			amaCategory.fetch(this.parent, cb);
		}
	};
}
amaCategory.fetch = function(parent, callback) {
	parent.category = (parent.category) ? parent.category : "root"
	httpConnector.get({
		url : parent.url
	}, categoryHtmlRender.render, {
		parent : parent.category
	}, function(err, items) {
		if (!err) {
			items.forEach(function(item) {
				var task = {
					data : item,
					run : function(cb) {
						categoryUpdateDao.update({
							category : this.data.category
						}, this.data, function(error, result) {
							if (error)
								cb(error);
							cb(error, result);
						});
					}
				};
				categoryDbQueue.push(task, function(error, data) {
					if (error)
						logger.error(error + "__1");
				});
			});
			delete parent._id;
			parent.status = "success";
		} else {
			delete parent._id;
			parent.status = "error";
		}
		amaCategory.updateTask(parent, function(error, data) {
			callback(error, data);
		})
	});
};
amaCategory.updateTask = function(item, callback) {
	var updateTask = {
		data : item,
		run : function(cb) {
			categoryUpdateDao.update({
				category : this.data.category
			}, this.data, function(error, data) {
				cb(error, data);
			});
		}
	};
	categoryDbQueue.push(updateTask, function(error) {
		if (error)
			callback(error);
		callback(null, updateTask.data);
	});
}

module.exports = amaCategory;