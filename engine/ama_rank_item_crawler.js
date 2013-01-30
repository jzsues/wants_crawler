var wants = require("wants");
var logger = wants.logger;
var utils = wants.utils;
var TaskQueue = require("../lib/task_queue");
var httpConnector = require("../lib/http_connector");
var rankItemHtmlRender = require("./ama_rank_item_render");
var GenericDao = require("../dao/generic_dao");

var amaRankItem = {
	category_name : "ama_category",
	rank_item_name : "ama_rank_item",
	rank_types : [ "bestsellers", "new-releases", "movers-and-shakers", "top-rated", "most-wished-for", "most-gifted" ],
	limit_page : 6,
	batch : utils.fdate(),
	parent_meta_category : "baby-products",
	current_category : "baby-products",
	metas : []
};

var categoryDao = new GenericDao({
	colname : amaRankItem.category_name
});

var rankItemDao = new GenericDao({
	colname : amaRankItem.rank_item_name
});

var categoryDbQueue = new TaskQueue({
	size : 10,
	drain : function() {
		// logger.debug("category Db Queue drain");
	}
});

var rankItemUpdateDbQueue = new TaskQueue({
	size : 20,
	drain : function() {
		// logger.debug("rank item update Db Queue drain");
	}
});

var httpQueue = new TaskQueue({
	size : 10,
	drain : function() {
		logger.debug("rank item Http Queue drain");
		amaRankItem.loop();
	}
});

amaRankItem.loop = function() {
	logger.debug("begin loop parent category:" + amaRankItem.current_category);
	categoryDao.find({
		parent : amaRankItem.current_category,
		batch : {
			$ne : amaRankItem.batch
		}
	}, 1, false, false, {
		"_id" : 1
	}, function(error, datas) {
		if (!error) {
			if (datas.length > 0) {
				datas.forEach(function(data) {
					amaRankItem.fetch(data, function(error, category) {
						if (error) {
							logger.error("amaRankItem fetch with error:" + error);
						} else {
							var task = {
								category : category,
								run : function(cb) {
									categoryDao.update({
										category : this.category
									}, {
										batch : amaRankItem.batch
									}, function(err, data) {
										if (err)
											cb(err)
										cb(null, data);
									});
								}
							};
							categoryDbQueue.push(task, function(err, data) {
								if (err)
									logger.error("categoryDao update with error:" + err);
							});
						}
					});
				});
			} else {
				if (amaRankItem.metas.length == 0) {
					_ama_rank_item_scan_status = _status.stop;
				} else {
					amaRankItem.current_category = amaRankItem.metas.pop();
					amaRankItem.loop();
				}
			}
		}
	});
};

amaRankItem.findMetaCategory = function(callback) {
	categoryDao.find({
		parent : amaRankItem.parent_meta_category
	}, false, false, false, {
		"_id" : 1
	}, function(error, datas) {
		if (error)
			callback(error);
		else {
			var parents = [];
			datas.forEach(function(data) {
				parents.push(data.category);
				amaRankItem.metas.push(data.category);
			});
			categoryDao.find({
				parent : {
					$in : parents
				}
			}, false, false, false, {
				"_id" : 1
			}, function(err, ds) {
				if (err)
					callback(err);
				else {
					ds.forEach(function(data) {
						amaRankItem.metas.push(data.category);
					});
					callback(null);
				}
			});
		}
	});
};

amaRankItem.start = function(callback) {
	if (_ama_rank_item_scan_status == _status.stop) {
		amaRankItem.batch = utils.fdate();
		_ama_rank_item_scan_status = _status.runing;
		amaRankItem.findMetaCategory(function(error) {
			if (error)
				logger.error("ama rank item scan meta category query with error:" + error);
			else
				amaRankItem.loop();
			callback();
		});
	} else {
		logger.debug("ama rank item scan queue is runing!");
		callback();
	}
};

amaRankItem.fetch = function(category, callback) {
	var types = amaRankItem.rank_types;
	types.forEach(function(type) {
		var fetchTasks = amaRankItem.fetchRankItemTask(category, type);
		httpQueue.pushAll(fetchTasks, function(error, items, context) {
			if (error) {
				callback(error);
			} else {
				if (items) {
					items.forEach(function(item) {
						var key = item.asin + "_" + item.category + "_" + item.type + "_" + amaRankItem.batch;
						var rank = {
							md5 : utils.md5(key),
							asin : item.asin,
							category : item.category,
							type : item.type,
							rank_number : item.rank_number,
							batch : amaRankItem.batch
						};
						var updateTask = amaRankItem.updateRankItemTask(rank);
						rankItemUpdateDbQueue.push(updateTask, function(e, d) {
							if (e)
								logger.error("rankItemUpdateDbQueue with error:" + e);
						});
					});
				}
				if (context) {
					callback(null, context.category);
				} else {
					logger.debug(arguments);
				}
			}
		});

	});
};

amaRankItem.updateRankItemTask = function(item) {
	return {
		data : item,
		run : function(cb) {
			if (this.data._id) {
				delete this.data._id;
			}
			rankItemDao.update({
				md5 : this.data.md5
			}, this.data, function(error, data) {
				if (error)
					cb(error);
				cb(null, data);
			});
		}
	};
}

amaRankItem.fetchRankItemTask = function(category, type) {
	var tasks = [];
	for ( var page = 1; page < amaRankItem.limit_page; page++) {
		var url = category.url.replace("new-releases", type);
		var url_not_above = "_encoding=UTF8&pg=" + page + "&ajax=1&isAboveTheFold=0";
		var url_above = "_encoding=UTF8&pg=" + page + "&ajax=1&isAboveTheFold=1";
		var not_above_task = {
			data : {
				category : category,
				url : url,
				query : url_not_above,
				type : type
			},
			run : function(cb) {
				httpConnector.get({
					url : this.data.url,
					query : this.data.query
				}, rankItemHtmlRender.render, {
					category : this.data.category.category,
					type : this.data.type
				}, function(error, items, context) {
					if (error)
						cb(error);
					cb(null, items, context);
				});
			}
		};
		var above_task = {
			data : {
				category : category,
				url : url,
				query : url_above,
				type : type
			},
			run : function(cb) {
				httpConnector.get({
					url : this.data.url,
					query : this.data.query
				}, rankItemHtmlRender.render, {
					category : this.data.category.category,
					type : this.data.type
				}, function(error, items, context) {
					if (error)
						cb(error);
					cb(null, items, context);
				});
			}
		};
		tasks.push(not_above_task);
		tasks.push(above_task);
	}
	return tasks;
};

module.exports = amaRankItem;