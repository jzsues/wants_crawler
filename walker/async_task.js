var emitter = require("./event_emitter");

var AsyncTask = function (obj, runFn) {
    this.obj = obj;
    this.runFn = runFn;
};

AsyncTask.prototype.run = function (callback) {
    emitter.emit("async.task.begin", this.obj);
    if (this.runFn && typeof (this.runFn) == "function") {
        this.runFn(this.obj, callback);
    } else {
        callback("async task run function undefined");
    }
};

module.exports = AsyncTask;