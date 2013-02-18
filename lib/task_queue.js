var async = require('async');
var underscore = require("underscore");
var wants = require('wants');
var logger = wants.logger;
var utils = wants.utils;
var TaskQueue = function(options) {
	this.size = options.size ? options.size : 10;
	this.retryable = options.retryable ? options.retryable : false;
	this.maxRetry = options.maxRetry ? options.maxRetry : 5;
	this.queue = async.queue(function(task, callback) {
		task.run(callback);
	}, this.size);
	this.status = {
		success : 0,
		error : 0,
		retry : {

		},
		errorTask : []
	};
	this._init(options);
};

TaskQueue.prototype._init = function(options) {
	// 所有任务执行完
	var drain = options.drain;
	// 最后一个任务交给worker
	var empty = options.empty;
	// worker数量将用完
	var saturated = options.saturated;
	this.queue.drain = drain;
	this.queue.empty = empty;
	this.queue.saturated = saturated;
}
TaskQueue.prototype.pushAll = function(tasks, callback) {
	var that = this;
	tasks.forEach(function(task) {
		that.push(task, callback);
	});
};

TaskQueue.prototype.retry = function(task, callback) {
	logger.debug("retry task:");
	logger.debug(task);
	this.push(task, callback);
}

TaskQueue.prototype.push = function(task, callback) {
	var that = this;
	if (!task.uid) {
		task.uid = underscore.uniqueId("task_");
	}
	if ((task.run && typeof (task.run) == "function") || typeof (task) == "object") {
		this.queue.push(task, function(error, data, context) {
			if (error) {
				if (that.retryable) {
					var retry = that.status.retry[task.uid];
					retry = retry ? retry : 0;
					if (retry < that.maxRetry) {
						that.status.retry[task.uid] = retry + 1;
						that.retry(task, callback);
					}
				}
				that.status.error++;
				that.status.errorTask.push(task);
				callback(error, null, context);
			} else {
				that.status.success++;
				callback(null, data, context);
			}
		});
	} else {
		that.status.error++;
		that.status.errorTask.push(task);
		callback("queue task must have run function", null, context);
	}
};

module.exports = TaskQueue;