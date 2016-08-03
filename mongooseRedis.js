var _ = require('lodash');
var Promise = require('bluebird');
var crypto = require('crypto');


RegExp.prototype.toJSON = function() {
  var json = {
    $regexp: this.source
  };
  var str = this.toString();
  var ind = str.lastIndexOf('/');
  var opts = str.slice(ind + 1);
  if (opts.length > 0) {
    json.$options = opts;
  }
  return json;
}

var mongooseRedis = function(mongoose, redisClient, options) {
  var _defaultOptions = {
    cache: true,
    expires: 60,  // unit: s
    prefix: 'RedisCache'
  };

  var _cacheOptions = _.assign(_.clone(_defaultOptions), options);
  var redisClient = mongoose.redisClient = redisClient;

  // store original Query.exec
  mongoose.Query.prototype._exec = mongoose.Query.prototype.exec;

  // custom exec to use cache
  mongoose.Query.prototype._exec_callback = function(callback) {
    var self = this;

    var model = this.model;
    var query = this._conditions || {};
    var options = this._optionsForExec(model) || {};
    var fields = _.clone(this._fields) || {};
    // diefferent from mongoose-redis-cache,
    // var populate = this.options.populate || {};
    var populate = this._mongooseOptions.populate || {};
    var collectionName = model.collection.name;


    // console.log(this._mongooseOptions);

    // use cache options set up by query statements first
    // also diffrent from mongoose-redis-cache,
    // as setOptions() set options in this._optionsForExec(model)
    // but not this._mongooseOptions ???
    var cacheOptions = _.assign(_.clone(_cacheOptions), options.cacheOptions);
    // cache only work in lean query
    if (!this._mongooseOptions.lean) cacheOptions.cache = false;

    // remove cacheOptions from options, for better redis key
    delete options.cacheOptions;

    if (!cacheOptions.cache) {
      return mongoose.Query.prototype._exec.apply(self, arguments);
    }

    var hash = crypto.createHash('md5')
      .update(JSON.stringify(query))
      .update(JSON.stringify(options))
      .update(JSON.stringify(fields))
      .update(JSON.stringify(populate))
      .digest('hex');
    var key = [cacheOptions.prefix, collectionName, hash].join(':');

    redisClient.get(key, function(err, result) {
      var dosc, k, path;
      if (err) return callback(err);
      if (!result) {
        // ???
        for (var k in populate) {
          path = populate[k];
          path.options = path.options || {};
          _.defaults(path.options, {
            cacheOptions: {cache: false} });
        }
        return mongoose.Query.prototype._exec.call(self, function(err, docs) {
          if (err) return callback(err);
          var str = JSON.stringify(docs);
          redisClient.setex(key, cacheOptions.expires, str);
          return callback(null, docs);
        });
      }
      else {
        docs = JSON.parse(result);
        return callback(null, docs);
      }
    });

    return this;
  };

  // support both callback style and promise
  mongoose.Query.prototype.exec = function(callback) {
    var self = this;
    return new Promise(function(resolve, reject) {
      mongoose.Query.prototype._exec_callback.call(self, function(err, result) {
        if (err) return reject(err);
        else resolve(result);
      })
    }).nodeify(callback);
  }
};


module.exports = mongooseRedis;
