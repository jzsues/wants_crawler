var wants = require('wants');
var request = require('request');
var qs = require('qs');
var logger = wants.logger;
var utils = wants.utils;

var HttpAgent = function(options) {
	this.options = {
		timeout : 30000,
		headers : {
			'Accept' : 'text/html',
			'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11'
		}
	};
	if (options) {
		this.options = utils.merge(utils.merge({}, this.options), options);
	}
};

HttpAgent.prototype._parse = function(querystring) {
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
HttpAgent.prototype.get = function(options, render, context, callback) {
	options = utils.merge(utils.merge({}, this.options), options);
	options.method = "GET";
	if (!options.query)
		options.query = "";
	var qstr = this._parse(options.query);
	options.url = options.url + "?" + qstr;
	// logger.debug("get with options: \n" + JSON.stringify(options));
	try {
		request(options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				if (render) {
					try {
						render(body, callback, context);
					} catch (err) {
						callback("http get with http error:" + err, null, context);
					}
				} else {
					callback(null, body, context);
				}
				// logger.debug("get url:" + options.url + " success!");
			} else {
				callback("http get with http error:" + error, null, context);
			}
		});
	} catch (e) {
		callback("http get with http error:" + error, null, context);
	}
}
HttpAgent.prototype.post = function(options, render, context, callback) {
	options = utils.merge(utils.merge({}, this.options), options);
	options.method = "POST";
	options.headers["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
	if (!options.body)
		options.body = "";

	options.body = this._parse(options.body);
	options.headers["ContentLength"] = options.body.length;
	logger.debug("post with options: \n" + JSON.stringify(options));
	request(options, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			if (render) {
				try {
					render(body, callback, context);
				} catch (err) {
					callback("http get with http error:" + err, null, context);
				}
			} else {
				callback(null, body, context);
			}
			logger.debug("post url:" + options.url + " success!");
		} else {
			if (error) {
				callback(error);
			} else {
				logger.error("http status code:" + response.statusCode + ",post options:\n" + JSON.stringify(options));
				callback("http post with http error status code");
			}
		}
	});
};

module.exports = HttpAgent;