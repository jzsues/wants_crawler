var amaCategoryHtmlRender = {};
// var $ = require('jquery');
var fs = require('fs');
var jquery = fs.readFileSync("./jquery.js").toString();
var jsdom = require("jsdom");
var emsg = {
	htmlerror : 'HTML格式有误'
};

// 处理原始html字符串
amaCategoryHtmlRender.render = function(body, cb, context) {
	if (body) {
		try {
			jsdom.env({
				html : body,
				src : [ jquery ],
				done : function(errors, window) {
					var $ = window.$;
					try {
						// 截取页面左边物品类型html元素
						var begin = body.indexOf("<ul id=\"zg_browseRoot\">");
						var end = body.indexOf("<div class=\"zg_displayAd\">");
						if (begin == -1 || end == -1) {
							cb(emsg.htmlerror);
						}
						var content = body.substring(begin, end);
						// console.log(content);
						amaCategoryHtmlRender.process($, content, cb, context);
					} catch (e) {
						cb(e);
					}
					window.close();
				}
			});
		} catch (e) {
			cb(e, null, context);
		}
	} else {
		cb("empty response body", null, context);
	}

}

amaCategoryHtmlRender.process = function($, content, cb, context) {
	// console.log("begin process");
	var ul = $(content);
	var selected = ul.find(".zg_selected");
	var the_ul = selected.parent().parent().find("ul");
	var isLeaf = false;
	if (the_ul.length == 0) {
		isLeaf = true;
	}
	var hrefs = the_ul.find("a");
	var tmps = [];
	$.each(hrefs, function(i, n) {
		var href = $(n).attr("href");
		var name = $(n).text();
		var category = amaCategoryHtmlRender.resolved_url(href);
		var meta = {
			category : category,
			name : name,
			url : href,
			status : "initial",
			parent : context.parent.category,
			isLeaf : isLeaf
		};
		tmps.push(meta);
	});
	cb(null, tmps, context);

}

amaCategoryHtmlRender.resolved_url = function(url) {
	url = url.split("ref=")[0];
	var tmps = url.split("/");
	if (tmps.length == 7) {
		return amaCategoryHtmlRender.resolved_amazon_url(url);
	} else {
		return amaCategoryHtmlRender.resolved_amazon_sub_url(url);
	}
}
amaCategoryHtmlRender.resolved_amazon_url = function(url) {
	// http://www.amazon.com/gp/new-releases/appliances/ref=zg_bsnr_nav_0
	if (url) {
		return url.split("/")[5];
	} else {
		return "";
	}
}
amaCategoryHtmlRender.resolved_amazon_sub_url = function(url) {
	// "http://www.amazon.com/gp/new-releases/hi/3754161/ref=zg_bsnr_nav_hi_1_hi"
	if (url) {
		return url.split("/")[6];
	} else {
		return "";
	}
}
module.exports = amaCategoryHtmlRender;