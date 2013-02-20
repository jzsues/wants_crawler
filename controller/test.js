var Test = {};

var categoryCrawler = require("../engine/ama_category_crawler");
var rankItemCrawler = require("../engine/ama_rank_item_crawler");
var itemDetailCrawler = require("../engine/ama_item_detail_crawler");

Test.category = function(req, res) {
	categoryCrawler.start(function() {
		res.sendjson(_monitor.statistics);
	});
};

Test.rank = function(req, res) {
	rankItemCrawler.start(function() {
		res.sendjson(_monitor.statistics);
	});
};

Test.detail = function(req, res) {
	var asin = req.param.asin;
	itemDetailCrawler.start(asin, function(error, item) {
		if(item){
			res.sendjson(item);
		}else{
			res.sendjson(_monitor.statistics);
		}
		
	});
};

module.exports = Test;