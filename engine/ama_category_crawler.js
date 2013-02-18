var wants = require("wants");
var logger = wants.logger;
var config = wants.config;
var TaskQueue = require("../lib/task_queue");
var HttpAgent = require("../lib/http_agent");
var CategoryHtmlRender = require("./ama_category_render");
var GenericDao = require("../dao/generic_dao");

var amaCategory = {
	name : "ama_category",
	beginUrl : "http://www.amazon.com/gp/new-releases",
	httpAgent : new HttpAgent()
};

var categoryUpdateDao = new GenericDao({
	colname : amaCategory.name
});

var categoryQueryDao = new GenericDao({
	colname : amaCategory.name
});

var categoryDbQueue = new TaskQueue({
	size : config.dbConnectPoolSize,
	drain : function() {
		// logger.debug("category Db Queue drain");
	}
});

var httpQueue = new TaskQueue({
	retryable : true,
	size : config.httpConnectPoolSize,
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
			if (count) {
				logger.debug("start a resume category base scan,count:" + count);
				amaCategory.loop();
			} else {
				logger.debug("start a new category base scan,base url:" + amaCategory.beginUrl);
				amaCategory.execute({
					url : amaCategory.beginUrl
				});
			}
		});
	} else {
		logger.debug("ama category scan queue is runing!");
	}
	if (callback) {
		callback();
	}
};

amaCategory.execute = function(parent) {
	var task = amaCategory.fetchTask(parent);
	httpQueue.push(task, function(error, data) {
		logger.debug("category scan task done, task parent:");
		logger.debug(task.parent);
		if (error)
			logger.error(error);
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
	parent.category = (parent.category) ? parent.category : "root";
	var categoryHtmlRender = new CategoryHtmlRender();
	amaCategory.httpAgent.get({
		url : parent.url
	}, categoryHtmlRender.render, {
		parent : parent
	}, function(err, items, context) {
		if (context && context.parent) {
			var p = context.parent;
			if (!err) {
				items.forEach(function(item) {
					amaCategory.updateTask(item, function(error, data) {
						// callback(error, data);
					});
				});
				delete p._id;
				p.status = "success";
			} else {
				delete p._id;
				p.status = "error";
			}
			amaCategory.updateTask(p, callback)
		} else {
			callback("ama category fetch error");
		}
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
		if (error) {
			callback(error);
		} else {
			callback(null, updateTask.data);
		}

	});
}

module.exports = amaCategory;