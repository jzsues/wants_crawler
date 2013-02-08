var wants = require("wants");
var utils = wants.utils;
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

emitter.snapshots = {};

emitter.retriveSnapshot = function(key) {
	var snapshot = this.snapshots[key];
	if (snapshot) {
		snapshot.preTime = snapshot.lastTime;
		snapshot.lastTime = (new Date()).getTime();
		var rate = snapshot.lastTime - snapshot.preTime;
		snapshot.count++;
		if (snapshot.rate == -1) {
			snapshot.rate = rate;
		} else {
			snapshot.rate = (snapshot.rate * (snapshot.count - 1) + rate) / (snapshot.count);
		}
	} else {
		snapshot = {};
		snapshot.lastTime = (new Date()).getTime();
		snapshot.preTime = -1;
		snapshot.rate = -1;
		snapshot.count = 1;
		this.snapshots[key] = snapshot;
	}
	return this.snapshots[key];
};

emitter.key = function(event, data) {
	var key = event + "_" + utils.md5(data);
	return key;
}

emitter.on("async.task.*", function(data) {
	// var key = emitter.key(this.event, data);
	// var snapshot = emitter.retriveSnapshot(key);
	console.log(this.event, data, (new Date()).getTime());
});

module.exports = emitter;
