var wants = require("wants");
var logger = wants.logger;
var TaskQueue = require("../lib/task_queue");
var httpConnector = require("../lib/http_connector");
var categoryHtmlRender = require("./ama_category_render");
var GenericDao = require("../dao/generic_dao");

var amaRankItem = {};

amaRankItem.loop = function() {
	
};

amaRankItem.start = function(callback) {

};

module.exports = amaRankItem;