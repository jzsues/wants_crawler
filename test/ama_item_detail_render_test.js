var should = require("should");
var fs = require('fs');

var AmaItemDetailRender = require("../engine/ama_item_detail_render");
//var KVParser = require("../engine/parser_util");
var r = new AmaItemDetailRender();

describe("ItemRendererTester", function() {
	it("testing", function(done) {
		var i1 = fs.readFileSync('./data/i1','UTF-8');

		r.render(i1, function(err, json, ctx){
			// var kvs = KVParser.parseKeyvalues(json.prd_details);
			// json.prd_details = {};
			// for (var i = 0; i < kvs.length; i++) {
			// 	var k = kvs[i].k.replace(/\s/g,'_').toLowerCase();
			// 	json.prd_details[k] = kvs[i].v;
			// };

			console.log(json.prd_details);
		},{asin:1});

		done();
	});
});