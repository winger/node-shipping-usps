var uspsAPI = require('../lib/index');
var util = require('util');
var fs = require('fs');

var usps = new uspsAPI({
  debug: true,
  username: 'USERNAME',
  password: 'PASSWORD',
  imperial: true // set to false for metric
});

/**
 * RATES
 */
usps.rates({
  packages: [
    {
      Service: 'FIRST CLASS',
      FirstClassMailType: 'LETTER',
      ZipOrigination: '44106',
      ZipDestination: '28262',
      Pounds: 0,
      Ounces: 3.5,
      Container: null,
      Size: 'REGULAR',
      Machinable: 'true'
    }
  ]
}, function(err, res) {
  if(err) {
    return console.log(util.inspect(err, {depth: null}));
  }

  console.log(util.inspect(res, {depth: null}));
});

/**
 * TRACKING
 */
usps.track(['EJ123456780US', '12345'], function(err, res) {
  if(err) {
    return console.log(util.inspect(err, {depth: null}));
  }

  console.log(util.inspect(res, {depth: null}));
});