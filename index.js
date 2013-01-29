var http = require("http");
var wants = require("wants");
_wants = wants;// 全局变量
var utils = _wants_utils;
var logger = _wants_log;
var config = _wants_config;
_status = require("./global/status.js");// 用于存储异步队列运行状态信息
_monitor = require('./lib/monitor.js');// 用于存储系统运行统计信息

var httpServer = http.createServer(wants());
httpServer.listen(config.listenPort, function() {
	logger.debug("wants nodejs framework runing,version:" + utils.getVersion());
});
