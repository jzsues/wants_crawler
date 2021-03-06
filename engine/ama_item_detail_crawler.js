var wants = require("wants");
var logger = wants.logger;
var utils = wants.utils;
var config = wants.config;
var TaskQueue = require("../lib/task_queue");
var HttpAgent = require("../lib/http_agent");
var ItemDetailHtmlRender = require("./ama_item_detail_render");
var GenericDao = require("../dao/generic_dao");
var amaItemDetail = {
	rank_item_name : "ama_rank_item",
	item_detail_name : "ama_item_detail",
	item_index_name : "ama_item_index",
	base_url : "http://www.amazon.com/gp/product/_asin_",
	batch : utils.fdate(),
	httpAgent : new HttpAgent(),
	manual : false
};

var itemIndexDao = new GenericDao({
	colname : amaItemDetail.item_index_name
});

var itemDetailDao = new GenericDao({
	colname : amaItemDetail.item_detail_name
});
var dbQueue = new TaskQueue({
	size : config.dbConnectPoolSize,
	drain : function() {
		// logger.debug("db Queue drain");
	}
});
var httpQueue = new TaskQueue({
	retryable : true,
	size : config.httpConnectPoolSize,
	drain : function() {
		logger.debug("item detail Http Queue drain");
		if (amaItemDetail.manual) {
			amaItemDetail.manual = false;
		} else {
			amaItemDetail.loop();
		}
	}
});

amaItemDetail.loop = function() {
	itemIndexDao.find({
		batch : amaItemDetail.batch,
		status : {
			$ne : "success"
		}
	}, 100, false, false, false, function(error, datas) {
		if (error) {
			logger.error(error);
		} else {
			if (datas.length > 0) {
				var fetchTasks = [];
				datas.forEach(function(index) {
					var fetchTask = amaItemDetail.fetchTask(index);
					fetchTasks.push(fetchTask);
				});
				httpQueue.pushAll(fetchTasks, function(error, item, context) {
					amaItemDetail.saveFetchResult(error, item, context);
				});
			} else {
				logger.debug("item detail batch scan task finish ");
				_ama_item_detail_scan_status = _status.stop;
			}
		}
	});
};
amaItemDetail.saveFetchResult = function(error, item, context) {
	logger.debug("item detail scan task done, asin: " + context.asin);
	var index = {
		asin : context.asin,
		status : "success"
	};
	if (!error) {
		var updateItemDetailTask = amaItemDetail.updateItemDetailTask(item);
		dbQueue.push(updateItemDetailTask, function(err, res) {
			if (err) {
				logger.error("update item detail with " + err);
			}
		});
	} else {
		index.status = "error";
		logger.error("fetch item detail with " + error);
	}
	var updateItemIndexTask = amaItemDetail.updateItemIndexTask(index);
	dbQueue.push(updateItemIndexTask, function(err, res) {
		if (err) {
			logger.error("update item index with " + err);
		}
	});
};

amaItemDetail.start = function(asin, callback) {
	if (_ama_item_detail_scan_status == _status.stop) {
		if (asin) {
			logger.debug("manual scan item,asin:" + asin);
			amaItemDetail.manual = true;
			var fetchTask = amaItemDetail.fetchTask({
				asin : asin
			});
			httpQueue.push(fetchTask, function(error, item, context) {
				amaItemDetail.saveFetchResult(error, item, context);
				if (callback) {
					callback(error, item);
				}
			});
		} else {
			_ama_item_detail_scan_status = _status.runing;
			amaItemDetail.loop();
			if (callback) {
				callback(null, null);
			}
		}
	} else {
		logger.debug("ama item detail scan queue is runing!");
		if (callback) {
			callback(null, null);
		}
	}
}

amaItemDetail.updateItemIndexTask = function(index) {
	return {
		data : index,
		run : function(cb) {
			itemIndexDao.update({
				asin : this.data.asin
			}, this.data, function(error, result) {
				cb(error, result);
			});
		}
	}
}

amaItemDetail.updateItemDetailTask = function(item) {
	return {
		data : item,
		run : function(cb) {
			itemDetailDao.update({
				asin : this.data.asin
			}, this.data, function(error, result) {
				cb(error, result);
			});
		}
	};
}

amaItemDetail.fetchTask = function(item) {
	return {
		data : item.asin,
		run : function(cb) {
			var asin = this.data;
			var url = amaItemDetail.base_url;
			url = url.replace("_asin_", asin);
			var itemDetailHtmlRender = new ItemDetailHtmlRender();
			amaItemDetail.httpAgent.get({
				url : url
			}, itemDetailHtmlRender.render, {
				asin : asin
			}, function(error, item, context) {
				cb(error, item, context);
			});
		}
	};
};

module.exports = amaItemDetail;