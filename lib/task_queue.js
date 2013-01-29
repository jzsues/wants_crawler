var async = require('async');
var TaskQueue = function(options) {
	this.size = options.size ? options.size : 10;
	this.queue = async.queue(function(task, callback) {
		task.run(callback);
	}, this.size);
	this.status = {
		success : 0,
		error : 0,
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
	for ( var task in tasks) {
		this.push(task, callback);
	}
};

TaskQueue.prototype.push = function(task, callback) {
	var that = this;
	if (task.run && typeof (task.run) == "function") {
		this.queue.push(task, function(error, data) {
			if (error) {
				that.status.error++;
				that.status.errorTask.push(task);
				callback(error);
			} else {
				that.status.success++;
				callback(error, data);
			}
		});
	} else {
		that.status.error++;
		that.status.errorTask.push(task);
		callback("queue task must have run function");
	}
};

module.exports = TaskQueue;