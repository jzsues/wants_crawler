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

		crawler.start('B000IDSLOG',function(err, item){
			console.log(item);
			done();
		});
				
	});

	// it("testing KVParser", function(done) {
	// 	var txt = fs.readFileSync('./data/B000IDSLOG.htm','UTF-8');
	// 	//txt = txt.replace(/<script[^<>]*>(.|\n|\r)*<\/script>|<style[^<>]*>(.|\n|\r)*<\/style>|&nbsp;/ig,'');
	// 	//console.log(txt);
	// 	KVParser.parseKeyvalues(txt,KVParser.KV_PATTERN_PROD_DETAILS);
	// 	done();
	// });

});