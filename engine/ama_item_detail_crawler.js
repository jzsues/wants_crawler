var wants = require("wants");
var logger = wants.logger;
var utils = wants.utils;
var TaskQueue = require("../lib/task_queue");
var httpConnector = require("../lib/http_connector");
var itemDetailHtmlRender = require("./ama_item_detail_render");
var GenericDao = require("../dao/generic_dao");
var amaItemDetail = {
	rank_item_name : "ama_rank_item",
	item_detail_name : "item_detail",
	base_url : "http://www.amazon.com/gp/product/_asin_",
	batch : utils.fdate()
};

var rankItemDao = new GenericDao({
	colname : amaItemDetail.rank_item_name
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
	size : 20,
	drain : function() {
		logger.debug("item detail Http Queue drain");
		amaItemDetail.loop();
	}
});

amaItemDetail.loop = function() {
	rankItemDao.find({
		fetch_mark_batch : null
	}, 100, false, false, false, function(error, datas) {
		if (error) {
			logger.error(error);
		} else {
			if (datas.length > 0) {
				datas.forEach(function(rank) {
					var fetchTask = amaItemDetail.fetchTask(rank);
					httpQueue.push(fetchTask, function(error, item, context) {
						if (!error) {
							var updateItemDetailTask = amaItemDetail.updateItemDetailTask(item);
							dbQueue.push(updateItemDetailTask, function(err, res) {
								if (err) {
									logger.error("update item detail with " + err);
								}
							});
							var updateRankTask = amaItemDetail.updateRankTask(context.asin);
							dbQueue.push(updateRankTask, function(err, res) {
								if (err)
									logger.error("update item rank with " + err);
							});
						}
					});
				});
			} else {
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
	callback();
}

amaItemDetail.updateRankTask = function(asin) {
	return {
		data : asin,
		run : function(cb) {
			rankItemDao.update({
				asin : this.data
			}, {
				fetch_mark_batch : amaItemDetail.batch
			}, function(error, result) {
				cb(error, result);
			});
		}
	};
};

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

amaItemDetail.fetchTask = function(rank) {
	return {
		data : rank.asin,
		run : function(cb) {
			var asin = this.data;
			var url = amaItemDetail.base_url;
			url = url.replace("_asin_", asin);
			httpConnector.get({
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