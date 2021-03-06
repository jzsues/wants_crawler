var wants = require("wants");
var logger = wants.logger;
var utils = wants.utils;
var config = wants.config;
var TaskQueue = require("../lib/task_queue");
var HttpAgent = require("../lib/http_agent");
var AmaRankItemHtmlRender = require("./ama_rank_item_render");
var GenericDao = require("../dao/generic_dao");
var TreeLoader = require("../lib/tree_loader");
var emitter = require("./event_emitter");

var amaRankItem = {
	category_name : "ama_category",
	rank_item_name : "ama_rank_item",
	item_index_name : "ama_item_index",
	rank_types : [ "bestsellers", "new-releases", "movers-and-shakers", "top-rated", "most-wished-for", "most-gifted" ],
	limit_page : 6,
	batch : utils.fdate(),
	parent_meta_category : "baby-products",
	current_category : "baby-products",
	metas : []
};

var treeLoader = new TreeLoader({
	rootLoader : function(callback) {
		categoryDao.findone({
			category : "baby-products"
		// $or : [ {
		// batch : {
		// $ne : amaRankItem.batch
		// }
		// }, {
		// status : {
		// $ne : _status.success
		// }
		// } ]
		}, false, function(error, data) {
			callback(error, data)
		});
	},
	childLoader : function(parent, callback) {
		categoryDao.find({
			parent : parent.category
		// $or : [ {
		// batch : {
		// $ne : amaRankItem.batch
		// }
		// }, {
		// status : {
		// $ne : _status.success
		// }
		// } ]
		}, false, false, false, false, function(error, datas) {
			callback(error, datas)
		});
	}
});

var categoryDao = new GenericDao({
	colname : amaRankItem.category_name
});

var rankItemDao = new GenericDao({
	colname : amaRankItem.rank_item_name
});

var itemIndexDao = new GenericDao({
	colname : amaRankItem.item_index_name
});

var dbQueue = new TaskQueue({
	size : config.dbConnectPoolSize,
	drain : function() {
		// logger.debug("rank item update Db Queue drain");
	}
});

var httpQueue = new TaskQueue({
	retryable : true,
	size : config.httpConnectPoolSize,
	drain : function() {
		logger.debug("rank item Http Queue drain");
		amaRankItem.loop();
	}
});
amaRankItem.loop = function() {
	treeLoader.all(function(error, results) {
		if (results.length > 0) {
			var i = 0;
			results.forEach(function(data) {
				if (data.status == _status.success && data.batch == amaRankItem.batch) {
					logger.debug("category:" + data.category + ",name:" + data.name + " had been fetch");
					i++;
				} else {
					logger.debug("start fetch category:" + data.category);
					amaRankItem.fetch(data, function(error, category) {
						var task = null;
						if (error) {
							logger.error("amaRankItem fetch with error:" + error);
							task = {
								category : category,
								run : function(cb) {
									categoryDao.update({
										category : this.category
									}, {
										batch : amaRankItem.batch,
										status : _status.error
									}, function(err, data) {
										if (err)
											cb(err)
										else
											cb(null, data);
									});
								}
							};
						} else {
							task = {
								category : category,
								run : function(cb) {
									categoryDao.update({
										category : this.category
									}, {
										batch : amaRankItem.batch,
										status : _status.success
									}, function(err, data) {
										if (err)
											cb(err)
										else
											cb(null, data);
									});
								}
							};
						}
						dbQueue.push(task, function(err, data) {
							if (err)
								logger.error("dbQueue update with error:" + err);
						});
					});
				}
			});
			logger.error(results.length + " category had been scaned");
			if (i == results.length) {
				logger.debug("all category had been scaned");
				_ama_rank_item_scan_status = _status.stop;
				emitter.emit("rank.item.end");
			}
		} else {
			logger.debug("all category had been scan");
			_ama_rank_item_scan_status = _status.stop;
			emitter.emit("rank.item.end");
		}
	});
};

amaRankItem.start = function(callback) {
	if (_ama_rank_item_scan_status == _status.stop) {
		amaRankItem.batch = utils.fdate();
		_ama_rank_item_scan_status = _status.runing;
		emitter.emit("rank.item.begin");
		amaRankItem.loop();
	} else {
		logger.debug("ama rank item scan queue is runing!");
	}
	if (callback) {
		callback();
	}
};

amaRankItem.fetch = function(category, callback) {
	var types = amaRankItem.rank_types;
	types.forEach(function(type) {
		var fetchTasks = amaRankItem.fetchRankItemTask(category, type);
		httpQueue.pushAll(fetchTasks, function(error, items, context) {
			logger.debug("fetch category done,context:");
			logger.debug(context);
			if (error) {
				callback(error, context.category);
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
							batch : amaRankItem.batch,
							price : item.price
						};
						var updateRankTask = amaRankItem.updateRankItemTask(rank);
						dbQueue.push(updateRankTask, function(e, d) {
							if (e)
								logger.error("dbQueue with error:" + e);
						});
						var updateIndexTask = amaRankItem.updateItemIndexTask(rank);
						dbQueue.push(updateIndexTask, function(e, d) {
							if (e)
								logger.error("dbQueue with error:" + e);
						});
					});
				}
				callback(null, context.category);
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
				cb(error, data);
			});
		}
	};
}

amaRankItem.updateItemIndexTask = function(item) {
	return {
		data : item,
		run : function(cb) {
			if (this.data._id) {
				delete this.data._id;
			}
			itemIndexDao.update({
				asin : this.data.asin
			}, {
				asin : this.data.asin,
				batch : this.data.batch
			}, function(error, data) {
				cb(error, data);
			});
		}
	}
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
				var rankItemHtmlRender = new AmaRankItemHtmlRender();
				var httpAgent = new HttpAgent();
				httpAgent.get({
					url : this.data.url,
					query : this.data.query
				}, rankItemHtmlRender.render, {
					category : this.data.category.category,
					type : this.data.type
				}, function(error, items, context) {
					cb(error, items, context);
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
				var rankItemHtmlRender = new AmaRankItemHtmlRender();
				var httpAgent = new HttpAgent();
				httpAgent.get({
					url : this.data.url,
					query : this.data.query
				}, rankItemHtmlRender.render, {
					category : this.data.category.category,
					type : this.data.type
				}, function(error, items, context) {
					cb(error, items, context);
				});
			}
		};
		tasks.push(not_above_task);
		tasks.push(above_task);
	}
	return tasks;
};

module.exports = amaRankItem;