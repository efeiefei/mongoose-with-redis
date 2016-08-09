This project borrowed from [mongoose-redis-cache](https://github.com/conancat/mongoose-redis-cache).
The difference is that this project using javascript alternative coffeescript, support custom redis client, and change some internal logics and using methods.

## Installation
`npm install mongooseRedis`

## Example Usage
```Javascript
var mongoose = require('mongoose');
var redis = require('ioredis');
var MongooseRedis = require('mongooseRedis');
// custom schema and model as usual
var userSchama = new mongoose.Schema({
  name: String,
  age: Number,
});
User = mongoose.model('User', userSchama);

var redisClient = redis.createClient();
mongoose.connect('mongodb://localhost/mongoose-redis-test');

// The follwing is default config if you pass no cacheOptions.
var cacheOptions = {
  cache: true,
  expires: 60,
  prefix: 'RedisCache'
};
MongooseRedis(mongoose, redisClient, cacheOptions);

// Works with lean() and exec(), the same query will use redis cache next time.
var user = yield User.findOne({name: 'xxx'}).lean().exec();
// It won't work when lack lean() or exec().
var user = yield User.findOne({name: 'xxx'}).exec();
// We will also set cacheOption in each query statement
// It won't affect other queries.
var user = yield User.findOne({name: 'xxx'})
    .setOptions({cacheOptions: {cache: false}})
    .lean().exec();
```
