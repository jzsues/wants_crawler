var postDatas = {
	getDealMetadataURL : function() {
		return "http://www.amazon.com/xa/goldbox/GetDealMetadata";
	},
	getDealsURL : function() {
		return "http://www.amazon.com/xa/goldbox/GetDeals";
	},
	getMarketplaceID : function() {
		return "ATVPDKIKX0DER";
	},
	getDealMetadataPostData : function() {
		return {
			"requestMetadata" : {
				"marketplaceID" : this.getMarketplaceID()
			},
			"filters" : {
				"all" : {
					"__type" : "AndDealFilter:http://internal.amazon.com/coral/com.amazon.DealService.model/",
					"children" : [ {
						"__type" : "OrDealFilter:http://internal.amazon.com/coral/com.amazon.DealService.model/",
						"children" : [ {
							"__type" : "EndDateDealFilter:http://internal.amazon.com/coral/com.amazon.DealService.model/",
							"from" : null,
							"to" : "now"
						}, {
							"__type" : "SoldOutDealFilter:http://internal.amazon.com/coral/com.amazon.DealService.model/",
							"soldOut" : false
						} ]
					}, {
						"slots" : [ "LD:ALL" ],
						"__type" : "SlotDealFilter:http://internal.amazon.com/coral/com.amazon.DealService.model/"
					} ]
				}
			},
			"orderings" : {
				"start" : [ {
					"__type" : "StartDateDealOrder:http://internal.amazon.com/coral/com.amazon.DealService.model/"
				} ]
			},
			"includeVariations" : true
		};
	},
	getDealsPostData : function() {
		return {
			"requestMetadata" : {
				"marketplaceID" : this.getMarketplaceID()
			},
			"customerID" : "",
			"filter" : {
				"__type" : "DealIDDealFilter:http://internal.amazon.com/coral/com.amazon.DealService.model/",
				"dealIDs" : []
			},
			"ordering" : [],
			"page" : 1,
			"resultsPerPage" : 10,
			"includeVariations" : true
		};
	}
};
var wants = require("wants");
var logger = wants.logger;
var config = wants.config;
var TaskQueue = require("../lib/task_queue");
var HttpAgent = require("../lib/http_agent");
var GenericDao = require("../dao/generic_dao");
var async = require("async");

var AmaGoldboxTracker = function(options) {

};

AmaGoldboxTracker.prototype.track = function(callback) {
	var self = this;
	async.auto({
		_meta : function(cb) {
			self.trackMeta(cb);
		},
		_data : [ "_meta", function(cb, datas) {
			self.trackData(cb, datas["_meta"]);
		} ]
	}, function(err, results) {
		callback(err, (results) ? {
			meta : results["_meta"],
			data : results["_data"]
		} : {});
	});
};

AmaGoldboxTracker.prototype.trackMeta = function(callback) {
	var httpAgent = new HttpAgent();
	httpAgent.post({
		url : postDatas.getDealMetadataURL(),
		json : postDatas.getDealMetadataPostData()
	}, null, null, function(error, meta) {
		callback(error, meta);
	});
};

AmaGoldboxTracker.prototype.trackData = function(callback, meta) {
	var dealIDs = meta.filters.all;
	var dealsPostData = postDatas.getDealsPostData();
	dealsPostData.filter.dealIDs = dealIDs;
	dealsPostData.resultsPerPage = dealIDs.length;
	var httpAgent = new HttpAgent();
	httpAgent.post({
		url : postDatas.getDealsURL(),
		json : dealsPostData
	}, null, null, function(err, data) {
		if (err) {
			callback(err);
		} else {
			callback(null, data);
		}
	});
};

module.exports = AmaGoldboxTracker;
