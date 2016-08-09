
require('co-mocha');
var sleep = require('co-sleep');
var should = require('chai').should();

var redis = require('ioredis');
var mongoose = require('mongoose');
var MongooseRedis = require('../index');


var redisClient, User;
var cacheOptions = {
  cache: true,
  expires: 30,
  prefix: 'TestMongooseRedisCache'
};

var delRedisKeys = function* (pattern) {
    var keys = yield redisClient.keys(pattern);
    for (var i in keys) {
      key = keys[i];
      yield redisClient.del(key);
    }
};

describe('MongooseRedisCache', function() {

  before(function* () {
    redisClient = redis.createClient();
    mongoose.connect('mongodb://localhost/mongoose-redis-test');

    var userSchama = new mongoose.Schema({
      name: String,
      age: Number,
    });
    User = mongoose.model('User', userSchama);

    yield User.remove({});
    yield User.create({name: 'efei', age: 20});
    yield User.create({name: 'jane', age: 22});

    MongooseRedis(mongoose, redisClient, cacheOptions);

    yield delRedisKeys(cacheOptions.prefix + '*');
  });

  after(function* () {
    yield User.remove({});
    yield delRedisKeys(cacheOptions.prefix + '*');
  });

  afterEach(function* () {
    yield delRedisKeys(cacheOptions.prefix + '*');
  });

  it('should read data correctly', function* () {
    var user = yield User.findOne({name: 'efei'}, {_id: 0, name: 1, age: 1}).lean().exec();
    user.should.be.a('object');
    user.should.have.property('name', 'efei');
    user.should.have.property('age', 20);
  });

  it('should generate correct cache', function* () {
    var user = yield User.findOne({name: 'efei'}, {_id: 0, name: 1, age: 1}).lean().exec();
    var keys = yield redisClient.keys(cacheOptions.prefix + '*');

    keys.should.have.length(1);
    var cacheUser = yield redisClient.get(keys[0]);
    cacheUser = JSON.parse(cacheUser);

    user.should.eql(cacheUser);
  });

  it('should use cache preferentially', function* () {
    yield User.findOne({name: 'efei'}, {_id: 0, name: 1, age: 1}).lean().exec();

    var keys = yield redisClient.keys(cacheOptions.prefix + '*');
    var key = keys[0];
    var user = {name: 'sun'};
    var value = JSON.stringify(user);
    yield redisClient.setex(key, cacheOptions.expires, value);

    var cacheUser = yield User.findOne({name: 'efei'}, {_id: 0, name: 1, age: 1}).lean().exec();
    user.should.eql(cacheUser);
  });

  it('should use query cache options preferentially', function* () {
    var user = yield User.findOne({name: 'efei'}, {_id: 0, name: 1, age: 1})
      .setOptions({cacheOptions: {cache: false}})
      .lean().exec();
    var keys = yield redisClient.keys(cacheOptions.prefix + '*');
    keys.should.have.length(0);
  });

  it('cache should fail by expires', function* () {
    yield User.findOne({name: 'efei'}, {_id: 0, name: 1, age: 1})
      .setOptions({cacheOptions: {expires: 1}})
      .lean().exec();
    var keys = yield redisClient.keys(cacheOptions.prefix + '*');
    keys.should.have.length(1);
    yield sleep(1200);
    var keys = yield redisClient.keys(cacheOptions.prefix + '*');
    keys.should.have.length(0);
  });

  it('should not cache without lean', function* () {
    yield User.findOne({name: 'efei'}, {_id: 0, name: 1, age: 1}).exec();
    var keys = yield redisClient.keys(cacheOptions.prefix + '*');
    keys.should.have.length(0);
  });

  it('should work with array results', function* () {
    var users = yield User.find({}, {_id: 0, name: 1, age: 1}).lean().exec();
    var keys = yield redisClient.keys(cacheOptions.prefix + '*');
    keys.should.have.length(1);
    var cacheUsers = yield User.find({}, {_id: 0, name: 1, age: 1}).lean().exec();
    users.should.eql(cacheUsers);
  });

  it('should also work with node callback', function() {
    User.findOne({name: 'efei'}, {_id: 0, name: 1, age: 1}).lean()
      .exec(function(err, result) {
        if (err) err;
        else {
          result.should.be.a('object');
          result.should.have.property('name', 'efei');
        }
      });
  });

});
