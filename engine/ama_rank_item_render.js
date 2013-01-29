var amaRankItemHtmlRender = {};
var wants = require("wants");
var logger = wants.logger;
var fs = require('fs');
var jquery = fs.readFileSync("../jquery.js").toString();
var jsdom = require("jsdom");
var emsg = {
	htmlerror : 'HTML格式有误'
};

amaRankItemHtmlRender.render = function(body, cb) {
	if (body) {
		jsdom.env({
			html : body,
			src : [ jquery ],
			done : function(errors, window) {
				var $ = window.$;
				try {
					var rows = $(body).find(".zg_itemRow");
					var items = [];
					$.each(rows, function(index, row) {
						var r = $(row);
						var img = r.find(".zg_itemImage_normal").find("img").attr("src");
						var title = r.find(".zg_title").find("a");
						if (!title) {
							logger.error("--------------error body begin-----------------");
							logger.error(body);
							logger.error("--------------error body end-----------------");
							return cb(emsg.htmlerror);
						} else {
							var name = title.text();
							var url = title.attr("href");
							var codes = amaRankItemHtmlRender.resolved_amazon_item_dp_url(url);
							var link_name = (codes.length = 2) ? codes[0] : "";
							var asin = (codes.length = 2) ? codes[1] : "";
							var rank_number = r.find(".zg_rankNumber").text();
							rank_number = $.trim(rank_number);
							rank_number = (rank_number) ? rank_number.substring(0, rank_number.length - 1) : rank_number;
							rank_number = (rank_number) ? parseInt(rank_number) : -1;
							var rank_meta = r.find(".zg_rankMeta").text();
							var review_star = r.find(".swSprite:first").attr("title");
							var review_count = r.find(".crAvgStars").find("a:last").text();
							review_count = (review_count) ? parseInt(review_count) : -1;
							var list_price = r.find(".listprice").text();
							var prices = r.find(".price");
							var price = (prices[0]) ? $(prices[0]).text() : "";
							var you_save = (prices[1]) ? $(prices[1]).text() : "";
							var other_price = (prices[2]) ? $(prices[2]).text() : "";
							items.push({
								asin : asin,
								link_name : link_name,
								img : $.trim(img),
								url : $.trim(url),
								rank_meta : $.trim(rank_meta),
								rank_number : rank_number,
								name : $.trim(name),
								review_star : $.trim(review_star),
								review_count : review_count,
								list_price : $.trim(list_price),
								price : $.trim(price),
								you_save : $.trim(you_save),
								other_price : $.trim(other_price)
							});
						}
					});
				} catch (e) {
					cb(e);
				}
				window.close();
				cb(null, items);
			}
		});
	} else {
		cb("empty response body");
	}

}
amaRankItemHtmlRender.resolved_amazon_item_dp_url = function(url) {
	// http://www.amazon.com/Cosco-High-Back-Booster-Ava/dp/B007HO4TJK/ref=zg_bsnr_baby-products_3/186-4389718-4216308
	if (url) {
		var s = url.split("/");
		return [ s[3], s[5] ];
	} else {
		return [];
	}

}

module.exports = amaRankItemHtmlRender;