var should = require("should");

var rankItemCrawler = require("../engine/ama_rank_item_crawler");

describe("amazon rank item", function() {
	it("test case", function(done) {
		rankItemCrawler.start(function(error, data) {
			if (error)
				done(error);
			done();
		});
	});
});