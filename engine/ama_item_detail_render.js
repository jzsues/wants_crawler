var AmaItemDetailRender = function() {

};
// var jq = require('jquery');
var fs = require('fs');
var KVParser = require("./parser_util");
var jquery = fs.readFileSync("./jquery.js").toString();
var jsdom = require("jsdom");
var emsg = {
	htmlerror : 'HTML格式有误'
};
var wants = require("wants");
var logger = wants.logger;
var config = wants.config;
AmaItemDetailRender.prototype.render = function(body, cb, context) {
	if (body) {
		jsdom.env({
			html : body,
			src : [ jquery ],
			done : function(errors, window) {
				if (errors) {
					cb(errors, null, context);
				} else {
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
						
						var e_prd_specifications = find(page, "Product Specifications");
						
						var e_prd_details = page.find("#prodDetails");
						if (e_prd_details.length > 0) {
							console.log("asin:" + context.asin + " selector #prodDetails success");
						} else {
							console.log("asin:" + context.asin + " selector #prodDetails fail");
							e_prd_details = find(page, "Product Details");
						}
						
						var e_prd_desc = find(page, "Product Description");

						try {
							data.prd_features = parseProductFeatures(e_prd_features.html());
							data.prd_spec = parseProductSpec(e_prd_specifications.html());
							data.prd_details = parseProductDetails(e_prd_details.html());
							data.prd_desc = parseProductDescription(e_prd_desc.html());
						} catch (e1) {
							logger.debug('html1>>>>>>>>>>>: \n' + (e_prd_features.html())?"success":"error" + '\n<<<<<<<<<<<');
							logger.debug('html2>>>>>>>>>>>: \n' + (e_prd_specifications.html())?"success":"error"+ '\n<<<<<<<<<<');
							logger.debug('html3>>>>>>>>>>>: \n' + (e_prd_details.html())?"success":"error"+ '\n<<<<<<<<<<');
							logger.debug('html4>>>>>>>>>>>: \n' + (e_prd_desc.html())?"success":"error"+ '\n<<<<<<<<<<');
							logger.debug(e1);
							cb(e1, null, context);
						}

						cb(null, data, context);
					} catch (e) {
						cb(e, null, context);
					}
					window.close();
				}
			}
		});
	} else {
		cb("empty response body", null, context);
	}

};

function parseProductDetails(htmlfragment) {
	var obj = {};

	if (htmlfragment) {
		var kvs = KVParser.parseKeyvalues(htmlfragment, KVParser.KV_PATTERN_PROD_DETAILS);
		for (var i = 0; i < kvs.length; i++) {
			var k = kvs[i].k.replace(/\s/g,'_').toLowerCase();
			obj[k] = kvs[i].v;
		};

	}

	return obj;
}

function parseProductFeatures (htmlfragment) {
	if (htmlfragment) {
		var kvs = KVParser.parseKeyvalues(htmlfragment, KVParser.KV_PATTERN_PROD_FEATURES, true);
		return kvs;
	} else {
		return [];
	}

}

function parseProductDescription (htmlfragment) {
	//return htmlfragment;
	return KVParser.text(htmlfragment);
}

function parseProductSpec (htmlfragment) {

	var obj = {};

	if (htmlfragment) {
		var kvs = KVParser.parseKeyvalues(htmlfragment, KVParser.KV_PATTERN_PROD_SPEC);
		for (var i = 0; i < kvs.length; i++) {
			var k = kvs[i].k.replace(/\s/g,'_').toLowerCase();
			obj[k] = kvs[i].v;
		};
	}	

	return obj;
}

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