var AmaItemDetailRender = function() {

};
// var jq = require('jquery');
var fs = require('fs');
var jquery = fs.readFileSync("./jquery.js").toString();
var jsdom = require("jsdom");
var emsg = {
	htmlerror : 'HTML格式有误'
};
AmaItemDetailRender.prototype.render = function(body, cb, context) {
	if (body) {
		jsdom.env({
			html : body,
			src : [ jquery ],
			done : function(errors, window) {
				var $ = window.$;
				try {
					var data = {
						asin : context.asin
					};
					var page = $("body");
					var e_name = page.find("#btAsinTitle");
					if (!e_name) {
						restlog.error("--------------error body begin-----------------");
						restlog.error(body);
						restlog.error("--------------error body end-----------------");
						return cb(emsg.htmlerror, null, context);
					}
					data.name = e_name.text();
					var e_list_price = page.find("#listPriceValue");
					data.list_price = e_list_price.text();
					var e_price = page.find("#actualPriceValue");
					data.price = e_price.text();
					var e_you_save = page.find("#youSaveValue");
					data.you_save = e_you_save.text();
					var e_cover_img = page.find("#prodImageContainer");
					// console.log(e_cover_img.find("img").length);
					if (e_cover_img.find("img").length == 0) {
						e_cover_img = page.find("#prodImageCell");
						// console.log(e_cover_img.html());
					}
					if (e_cover_img.find("img").length == 0) {
						e_cover_img = page.find("#holderMainImage");
						// console.log(e_cover_img.html());
					}
					data.cover_img = e_cover_img.find("img").attr("src");
					var e_thumb_strip = page.find("#thumb_strip");
					if (e_thumb_strip) {
						data.thumbs = [];
						var imgs = e_thumb_strip.find("img");
						$.each(imgs, function(index, img) {
							data.thumbs.push($(img).attr("src"));
						});
					}
					// var form = page.find("#handleBuy");
					var e_prd_features = find(page, "Product Features");
					data.prd_features = e_prd_features.html();
					var e_prd_specifications = find(page, "Product Specifications");
					data.prd_spec = e_prd_specifications.html();
					var e_prd_details = find(page, "Product Details");
					data.prd_details = e_prd_details.html();
					var e_prd_desc = find(page, "Product Description");
					data.prd_desc = e_prd_desc.html();
					cb(null, data, context);
				} catch (e) {
					cb(e, null, context);
				}
				window.close();
			}
		});
	} else {
		cb("empty response body", null, context);
	}

};
function removeStyleAndScript(element) {
	if (element.html() != "") {
		var style = element.find("style");
		console.log(style);
		style.remove();
	}
}
function find(page, key_word) {
	var e = page.find("h2:contains('" + key_word + "')");
	if (e.length == 0) {
		e = page.find("strong:contains('" + key_word + "')");
		e = e.parent().parent();
	} else {
		e = e.parent();
	}
	return e ? e : {
		html : function() {
			return "";
		}
	};
};

module.exports = AmaItemDetailRender;