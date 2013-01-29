var monitor = {};

monitor.statistics = {};

monitor.getStatistics = function(name) {
	return monitor.statistics[name];
}

monitor.isRunning = function(name) {
	var stat = monitor.statistics[name];
	if (!stat) {
		return false;
	} else {
		return stat
	}
}

monitor.onProcessStart = function(name) {
	monitor.statistics[name] = {
		status : "start",
		stage : 0,
		error : 0,
		errorCauses : [],
		startTime : new Date(),
		costTime : 0,
		avgTime : 0

	};
}

monitor.nextProcessStage = function(name, addtions) {
	monitor.statistics[name].status = "running";
	monitor.statistics[name].stage += 1;
	monitor.statistics[name].addtions = addtions;
	monitor.statistics[name].costTime = (new Date()).getTime() - monitor.statistics[name].startTime.getTime();
	monitor.statistics[name].avgTime = monitor.statistics[name].costTime / monitor.statistics[name].stage;
}

monitor.onProcessError = function(name, cause) {
	monitor.statistics[name].error += 1;
	if (cause) {
		monitor.statistics[name].errorCauses.push(cause);
	}
}

monitor.onProcessStop = function(name) {
	monitor.statistics[name].status = "stop";
}

module.exports = monitor;
