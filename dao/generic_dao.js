var mongoDao = require('./mongo_dao.js');
var md5 = _wants_utils.md5;

var GenericDao = function(options) {
	this.colname = options.colname;
	this.mongoDao = mongoDao.mongodcol;
};

GenericDao.prototype.findone = function(query, options, callback) {
	this.mongoDao(this.colname, function(err, col, release, genid) {
		if (err)
			return callback(err);
		if (query._id) {
			query._id = genid(query._id);
		}
		options = (options) ? options : {};
		if (!options.sort) {
			options.sort = {
				"_id" : 0
			};
		}
		col.findOne(query, options, function(err, doc) {
			if (err)
				return callback(err) || release();
			release();
			callback(null, doc);
		});
	});
};

GenericDao.prototype.find = function(query, limit, id, isnext, sortc, callback) {
	this.mongoDao(this.colname, function(err, col, release, genid) {
		if (err)
			return callback(err);
		var queryC = (query) ? query : {}, reservt = false;
		var options = sortc ? {
			sort : sortc
		} : {
			sort : {
				"_id" : 1
			}
		};
		if (id && isnext)
			queryC['_id'] = {
				"$gt" : genid(id)
			};// 是否传id分页，如果是下一页
		else if (id && !isnext) {
			queryC['_id'] = {
				"$lt" : genid(id)
			};// 是否传id分页，如果是上一页
			options.sort = {
				"_id" : 1
			};
			reservt = true;
		}
		if (limit)
			options['limit'] = limit;// 是否传递limit条件
		col.find(queryC, {}, options).toArray(function(err, docArray) {
			if (err)
				return callback(err) || release();
			release();
			var len = docArray.length;
			var docArray2 = [];
			if (reservt && len > 1) {// 如果是上一页反转数组
				while (len--) {
					docArray2.push(docArray[len]);
				}
			} else {
				docArray2 = docArray;
			}
			callback(null, docArray2);
		});
	});
};

GenericDao.prototype.findCursor = function(query, options, each, exception, done) {
	this.mongoDao(this.colname, function(err, col, release, genid) {
		if (err)
			exception(err);
		query = (query) ? query : {};
		options = (options) ? options : {
			sort : {
				"_id" : 1
			}
		};
		var cursor = col.find(query, options);
		cursor.each(function(error, doc) {
			if (err) {
				release();
				if (exception) {
					exception(err);
				}
			} else {
				if (doc) {
					each(doc);
				} else {
					release();
					if (done) {
						done();
					}
				}
			}
		});
	});
};

GenericDao.prototype.count = function(query, callback) {
	this.mongoDao(this.colname, function(err, col, release, genid) {
		var cursor = col.find(query);
		cursor.count(function(err, count) {
			if (err)
				return callback(err) || release();
			release();
			callback(null, count);

		});
	});
};

GenericDao.prototype.add = function(data, callback) {
	this.mongoDao(this.colname, function(err, col, release) {
		if (err)
			return callback(err);
		data.timestamp = Date.now();
		col.insert(data, {
			safe : true
		}, function(err, doc) {
			if (err)
				return callback(err) || release();
			release();
			callback(null, doc[0]);
		});
	});
};
GenericDao.prototype.update = function(query, data, callback) {
	this.mongoDao(this.colname, function(err, col, release) {
		if (err)
			return callback(err);
		data.timestamp = Date.now();
		col.update(query, {
			$set : data
		}, {
			safe : true,
			upsert : true
		}, function(error, _doc) {
			if (error)
				return callback(error) || release();
			release();
			callback(null, _doc);
		});
	});
}

module.exports = GenericDao;