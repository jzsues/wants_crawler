var wants = require("wants");
var utils = wants.utils;
var logger = wants.logger;
var categoryCrawler = require("../engine/ama_category_crawler");
var rankItemCrawler = require("../engine/ama_rank_item_crawler");
var itemDetailCrawler = require("../engine/ama_item_detail_crawler");
var EventEmitter2 = require('eventemitter2').EventEmitter2;

var emitter = new EventEmitter2({
	wildcard : true, // should the event emitter use wildcards.
	delimiter : '.', // the delimiter used to segment namespaces, defaults to
	// `.`.
	newListener : false, // if you want to emit the newListener event set to
	// true.
	maxListeners : 20, // the max number of listeners that can be assigned to
// an event, defaults to 10.
});

emitter.on("rank.item.begin", function() {
	console.log(this.event, (new Date()).getTime());
});

emitter.on("rank.item.end", function() {
	console.log(this.event, (new Date()).getTime());
	itemDetailCrawler.start();
});

emitter.on("item.detail.begin", function() {
	console.log(this.event, (new Date()).getTime());
});

emitter.on("item.detail.end", function() {
	console.log(this.event, (new Date()).getTime());
});

module.exports = emitter;
