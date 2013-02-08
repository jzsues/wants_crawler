var wants = require("wants");
var utils = wants.utils;
var logger = wants.logger;
var async = require("async");
var TaskQueue = require("../lib/task_queue");

var TaskExecutor = function(options) {
	this.taskQueue = new TaskQueue(options);
};

TaskExecutor.prototype.each = function(context, callback) {

}

TaskExecutor.prototype.all = function(items, callback) {

}

module.exports = TaskExecutor;