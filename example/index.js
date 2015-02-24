var uspsAPI = require('../lib/index');
var util = require('util');
var fs = require('fs');

var usps = new uspsAPI({
  environment: 'sandbox', // or live
  debug: true,
  username: 'USERNAME',
  password: 'PASSWORD',
  imperial: true // set to false for metric
});
