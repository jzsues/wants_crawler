var Test = {};

var categoryCrawler = require("../engine/ama_category_crawler");

Test.category = function(req, res) {
	categoryCrawler.start();
	res.sendJson(_monitor.statistics);
};

module.exports = Test;