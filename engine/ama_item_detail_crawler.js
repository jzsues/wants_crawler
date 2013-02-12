var wants = require("wants");
var logger = wants.logger;
var utils = wants.utils;
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
	httpAgent : new HttpAgent()
};

var itemIndexDao = new GenericDao({
	colname : amaItemDetail.item_index_name
});

var itemDetailDao = new GenericDao({
	colname : amaItemDetail.item_detail_name
});
var dbQueue = new TaskQueue({
	size : 30,
	drain : function() {
		logger.debug("db Queue drain");
	}
});
var httpQueue = new TaskQueue({
	size : 50,
	drain : function() {
		logger.debug("item detail Http Queue drain");
		amaItemDetail.loop();
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
					if (!error) {
						var updateItemDetailTask = amaItemDetail.updateItemDetailTask(item);
						dbQueue.push(updateItemDetailTask, function(err, res) {
							if (err) {
								logger.error("update item detail with " + err);
							}
						});
						var index = {
							asin : context.asin,
							status : "success"
						};
						var updateItemIndexTask = amaItemDetail.updateItemIndexTask(index);
						dbQueue.push(updateItemIndexTask, function(err, res) {
							if (err) {
								logger.error("update item index with " + err);
							}
						});
					}
				});
			} else {
				logger.debug(" item detail scan task finish ");
				_ama_item_detail_scan_status = _status.stop;
			}
		}
	});
};

amaItemDetail.start = function(callback) {
	if (_ama_item_detail_scan_status == _status.stop) {
		_ama_item_detail_scan_status = _status.runing;
		amaItemDetail.loop();
	} else {
		logger.debug("ama item detail scan queue is runing!");
	}
	if (callback) {
		callback();
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