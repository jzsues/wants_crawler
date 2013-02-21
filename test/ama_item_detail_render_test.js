var should = require("should");
var fs = require('fs');
_status = require("../global/status")
var AmaItemDetailRender = require("../engine/ama_item_detail_render");
var KVParser = require("../engine/parser_util");
var crawler = require("../engine/ama_item_detail_crawler")
var renderer = new AmaItemDetailRender();

describe("ItemRendererTester", function() {
	it("testing", function(done) {
		// var i1 = fs.readFileSync('./data/i1','UTF-8');

		// renderer.render(i1, function(err, json, ctx){
		// 	console.log(json);
		// },{asin:1});

		crawler.start('B000FTD1HK',function(err, item){
			console.log(item);
			done();
		});
				
	});

	// it("testing KVParser", function() {
	// 	var txt = '<h2>Product Details</h2>\n\n\n  \n\n<div class="disclaim">Platform: <strong>Nintendo Wii</strong></div>\n\n\n\n\n\n\n\n\n\n\n\n    \n      <div class="content">\n\n\n\n\n\n\n\n<ul>\n\n\n\n\n\n\n\n<li><b>Shipping: </b>This item is also available for shipping to select countries outside the U.S.</li>\n\n  \n\n\n<li><b>ASIN:</b> B0088I8M10</li>\n\n\n\n\n\n\n\n\n\n\n\n                                                                                \n\n\n    <li><b>\n    Product Dimensions: \n    </b>\n    7.5 x 5.3 x 0.6 inches ; 2.9 ounces\n    </li>\n\n\n\n<li><b>Media:</b> Video Game</li>\n\n\n\n\n\n\n\n\n      <li><b> Release Date:</b> October 23, 2012</li>'
	// 	//console.log(txt);
	// 	KVParser.parseKeyvalues(txt);
	// 	done();
	// });
});