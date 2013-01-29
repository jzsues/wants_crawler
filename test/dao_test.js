var should = require("should");

var GenericDao = require("../dao/generic_dao");

var testDao = new GenericDao({
	colname : "test"
});
var data = {
	key : "key",
	name : "test name",
	value : "test value"
};

describe("Generic", function() {
	describe("base", function() {
		it('data should not empty', function(done) {
			should.exist(data);
			done();
		});
		it('dao should not empty', function(done) {
			should.exist(testDao);
			done();
		});
	});
	describe("dao", function() {
		describe("function", function() {
			it("#findone", function(done) {
				testDao.findone({
					key : "key"
				},{sort:{"_id":1}}, function(err, result) {
					if (err) {
						return done(err);
					}
					should.exist(result);
					//(result._id+"").should.eql("51065df0fa28a27d05000001");
					done();
				});
			});
			it("#find", function(done) {
				testDao.find({
					key : "key"
				}, 1, false, false, {
					"timestamp" : "asc"
				}, function(err, data) {
					if (err) {
						return done(err);
					}
					should.exist(data);
					data.should.with.length(1);
					done();
				});
			});
	
			it("#add", function(done) {
				testDao.add(data, function(err, result) {
					if (err) {
						return done(err);
					}
					should.exist(result);
					result.should.have.property("_id");
					done();
				});
			});
			it("#update", function(done) {
				delete data._id;
				var newName = "test name new";
				data.name = newName
				testDao.update({
					key : "key"
				}, data, function(err, result) {
					if (err) {
						return done(err);
					}
					should.exist(result);
					result.should.above(0);
					done();
				});
			});
			it("#cursor", function(done) {
				testDao.findCursor({
					key : "key"
				},{
					sort:{
						key:1
					}
				}, function( result) {
					console.log(result);
					should.exist(result);
				},function(error){
					done(error);
				},function(){
					done();
				});
			});
		});
	});
});