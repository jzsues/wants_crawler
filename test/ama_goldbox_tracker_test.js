var should = require("should");

var AmaGoldboxTracker = require("../ama/ama_goldbox_tracker");

describe("amazon goldbox", function() {
	it("meta", function(done) {
		var agt = new AmaGoldboxTracker();
		agt.track(function(error, data) {
			console.log(JSON.stringify(arguments));
			done();
		});
	});
});