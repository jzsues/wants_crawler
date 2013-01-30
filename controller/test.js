var Test = {};

var categoryCrawler = require("../engine/ama_category_crawler");
var rankItemCrawler = require("../engine/ama_rank_item_crawler");

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

module.exports = Test;