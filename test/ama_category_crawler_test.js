var should = require("should");

var categoryCrawler = require("../engine/ama_category_crawler");

describe("amazon category", function() {
	it("begin page", function(done) {
		categoryCrawler.start(function(error, data) {
			if (error)
				done(error);
			console.log(data);
			done();
		});
	});
});