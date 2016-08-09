/**
 * Created by efei on 16-7-7.
 */

var co = require('co');

var mode = 'debug';
global.C = require('../config')(mode);
global.M = require(C.dir.model)();


var fences = [
  {id: 'fence10001', type: 'bdfinal', center: {type: 'Point', coordinates: [120, 40]}, radius: 500, seminfo: '商圈A'},
  {id: 'fence10002', type: 'mifamily', center: {type: 'Point', coordinates: [121, 40]}, radius: 500, seminfo: '米家A'}
];

var userFences = [
  {
    user: 'user10001',
    verify: 'verify10001',
    fences: [
      {id: 'fence10001', type: 'bdfinal', source: 'bd'},
      {id: 'fence10002', type: 'mifamily', source: 'bd'}
    ]
  },
  {
    user: 'user10002',
    verify: 'verify10002',
    fences: [
      {id: 'fence10001', type: 'bdfinal', source: 'bd'}
    ]
  }
];

var fenceGeoInfos = [
  {
    id: 'fence10001',
    verify: 'verify20001',
    geoInfos: [
      {type: 'cell', key: 'cell10001', loc: [120.1, 40]},
      {type: 'cell', key: 'cell10002', loc: [120.2, 40]},
      {type: 'wifi', key: 'wifi10001', loc: [119.1, 40]},
      {type: 'wifi', key: 'wifi10002', loc: [119.9, 40]}
    ]
  },
  {
    id: 'fence10002',
    verify: 'verify20002',
    geoInfos: [
      {type: 'cell', key: 'cell20001', loc: [121.1, 40]},
      {type: 'cell', key: 'cell20002', loc: [121.2, 40]},
      {type: 'wifi', key: 'wifi20001', loc: [120.1, 40]},
      {type: 'wifi', key: 'wifi20002', loc: [120.9, 40]}
    ]
  }
];

var userFavorites = {
  user: 'user10001',
  verify: 'verify30001',
  fences: [
    {
      id: 'fence10002',
      type: 'mifamily',
      geoinfo: {
        center: [120, 40],
        radius: 500,
      },
      seminfo: '米家B',
      fenceinfos: [
        {type: 'cell', key: 'cell20001', loc: [121.1, 40]},
        {type: 'cell', key: 'cell20002', loc: [121.2, 40]},
        {type: 'wifi', key: 'wifi20001', loc: [120.1, 40]},
        {type: 'wifi', key: 'wifi20002', loc: [120.9, 40]}
      ]
    }
  ]
};

var clearDB = function* () {
  yield M.Fence.remove({});
  yield M.UserFence.remove({});
  yield M.FenceGeoInfo.remove({});
  yield M.UserFavorite.remove({});
};

co(function *(){
  yield clearDB();
  yield M.Fence.create(fences);
  yield M.UserFence.create(userFences);
  yield M.FenceGeoInfo.create(fenceGeoInfos);
  yield M.UserFavorite.create(userFavorites);
}).then(function() {
  console.log('done');
  process.exit();
}).catch(function(e) {
  console.log(e);
  console.log(e.stack);
  process.exit();
});


