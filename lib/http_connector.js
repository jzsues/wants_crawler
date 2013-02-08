var monitor = require('../lib/monitor.js');// 用于存储系统运行统计信息
var wants = require('wants');
var request = require('request');
var qs = require('qs');
var logger = wants.logger;
var utils = wants.utils;

var httpCollector = {
	get_name : "http_collector_get",
	post_name : "http_collector_post"
};
var get_live = 0;
var get_sum = 0;
var get_success = 0;
var get_error = 0;

var post_live = 0;
var post_sum = 0;
var post_success = 0;
var post_error = 0;

httpCollector.request_options = {
	timeout : 30000,
	headers : {
		'Accept' : 'text/html',
		'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11'
	}
}
httpCollector._parse = function(querystring) {
	var obj = (typeof (querystring) == obj) ? querystring : qs.parse(querystring);
	var qstr = "qs=parse";
	for ( var key in obj) {
		var value = obj[key];
		if (typeof (value) == "object") {
			for ( var i in value) {
				var s = encodeURIComponent(value[i]);
				qstr = qstr + "&" + key + "=" + s;
			}
		} else {
			var s = encodeURIComponent(value);
			qstr = qstr + "&" + key + "=" + s;
		}
	}
	return qstr;
};

httpCollector.get = function(options, render, context, callback) {
	options = utils.merge(utils.merge({}, httpCollector.request_options), options);
	options.method = "GET";
	if (get_sum == 0) {
		monitor.onProcessStart(httpCollector.get_name);
	}
	if (!options.query)
		options.query = "";
	var qstr = httpCollector._parse(options.query);
	get_sum++;
	get_live++;
	options.url = options.url + "?" + qstr;
	logger.debug("get with options: \n" + JSON.stringify(options));
	request(options, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			if (render) {
				render(body, callback, context);
			} else {
				callback(null, body, context);
			}
			logger.debug("get url:" + options.url + " success!");
			get_success++;
		} else {
			callback("http get with http error:" + error, null, context);
			get_error++;
		}
		get_live--;
		monitor.nextProcessStage(httpCollector.get_name, {
			live_request : get_live,
			sum_request : get_sum,
			success_request : get_success,
			error_request : get_error
		});
	});
}
httpCollector.post = function(options, render, context, callback) {
	options = utils.merge(utils.merge({}, httpCollector.request_options), options);
	options.method = "POST";
	options.headers["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
	if (!options.body)
		options.body = "";

	options.body = httpCollector._parse(options.body);
	options.headers["ContentLength"] = options.body.length;
	logger.debug("post with options: \n" + JSON.stringify(options));
	if (post_sum == 0) {
		monitor.onProcessStart(httpCollector.post_name);
	}
	post_sum++;
	post_live++;
	request(options, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			if (render) {
				render(body, callback, context);
			} else {
				callback(null, body, context);
			}
			logger.debug("post url:" + options.url + " success!");
			post_success++;
		} else {
			if (error) {
				callback(error);
			} else {
				logger.error("http status code:" + response.statusCode + ",post options:\n" + JSON.stringify(options));
				callback("http post with http error status code");
			}
			post_error++;
		}
		post_live--;
		monitor.nextProcessStage(httpCollector.post_name, {
			live_request : post_live,
			sum_request : post_sum,
			success_request : post_success,
			error_request : post_error
		});
	});
}

module.exports = httpCollector;