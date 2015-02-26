/*

 Built by
   __                   ____
  / /___  ______  ___  / __/___  ____
 / __/ / / / __ \/ _ \/ /_/ __ \/ __ \
/ /_/ /_/ / /_/ /  __/ __/ /_/ / /_/ /
\__/\__, / .___/\___/_/  \____/\____/
 /____/_/
 */

var https = require('https');
var http = require('http');
var extend = require('extend');
var parser = require('xml2json');
var builder = require('xmlbuilder');
var path = require('path');
var util = require('util');

function USPS(args) {
  var $scope = this;
  $scope.hosts = {
    unsecure: 'production.shippingapis.com',
    secure: 'secure.shippingapis.com',
    test: 'testing.shippingapis.com'
  };
  $scope.exec = '/ShippingAPI.dll';
  $scope.execTest = '/ShippingAPITest.dll';
  var defaults = {
      imperial: true, // for inches/lbs, false for metric cm/kgs
      currency: 'USD',
      language: 'en-US',
      test: false,
      username: '',
      password: '',
      debug: false,
      pretty: false,
      user_agent: 'uh-sem-blee, Co | typefoo'
    };

  $scope.config = function(args) {
    $scope.options = extend(defaults, args);
    return $scope;
  };

  $scope.dimensionalWeight = function(weight, length, width, height) {
    var dimWeight = (length * width * height) / ($scope.options.imperial ? dimensional_weight_values.imperial : dimensional_weight_values.metric);
    if(dimWeight > weight) {
      return parseInt(dimWeight, 10);
    } else {
      return weight;
    }
  };

  $scope.density = function(weight, length, width, height) {
    return (weight / ((length * width * height) / 1728));
  };

  $scope.girth = function(width, length) {
    return (width*2) + (length*2);
  };

  function buildRatesRequest(data, options, resource, callback) {
    var root = builder.create('RateV4Request', {headless: true});
    root.att('USERID', $scope.options.username);
    var params = {
      Revision: data.Revision || '2',
      '#list': []
    };
    for(var i = 0; i < data.packages.length; i++) {
      data.packages[i]['@ID'] = i;
      params['#list'].push({Package: data.packages[i]});
    }
    root.ele(params);
    return root.end({pretty: $scope.options.pretty});
  }

  function handleRatesResponse(res, callback) {
    return callback(null, res);
  }

  function buildLabelRequest(data, options, resource, callback) {
    var root = builder.create('ExpressMailLabelRequest', {headless: true});
    root.att('USERID', $scope.options.username);
    root.ele(data);
    return root.end({pretty: $scope.options.pretty});
  }

  function handleLabelResponse(res, callback) {
    return callback(null, res);
  }

  function buildLabelInternationalRequest(data, options, resource, callback) {
    var root = builder.create('ExpressMailIntlRequest', {headless: true});
    root.att('USERID', $scope.options.username);
    root.ele(data);
    return root.end({pretty: $scope.options.pretty});
  }

  function handleLabelInternationalResponse(res, callback) {
    return callback(null, res);
  }

  function buildTrackingRequest(data, options, resource, callback) {
    var root = builder.create('TrackRequest', {headless: true});
    root.att('USERID', $scope.options.username);
    var params = {
      '#list': []
    };

    for(var i = 0; i < data.length; i++) {
      params['#list'].push({'TrackID': {'@ID': data[i]}});
    }
    root.ele(params);
    return root.end({pretty: $scope.options.pretty});
  }

  function handleTrackingResponse(res, callback) {
    return callback(null, res);
  }

  var resources = {
    rates: {f: buildRatesRequest, r: handleRatesResponse, api: 'RateV4', secure: false},
    label_domestic: {f: buildLabelRequest, r: handleLabelResponse, api: 'ExpressMailLabel', secure: true},
    label_international: {f: buildLabelInternationalRequest, r: handleLabelInternationalResponse, api: 'ExpressMailIntl', secure: true},
    track: {f: buildTrackingRequest, r: handleTrackingResponse, api: 'TrackV2', secure: false}
  };

  function doBuildParams(data, options, resource) {
    var body = resource.f(data, options);
    var params = {
      hostname: resource.secure ? ($scope.options.test ? $scope.hosts.test : $scope.hosts.secure) : $scope.hosts.unsecure,
      path: ($scope.options.test ? $scope.execTest : $scope.exec) + '?API=' + resource.api + '&XML=' + encodeURIComponent(body),
      method: 'GET',
      headers: {
        'User-Agent': $scope.options.user_agent
      }
    };

    return {
      body: body,
      params: params
    };
  }

  function doRequest(params, resource, callback) {
    if($scope.options.debug) {
      console.log((resource.secure ? 'Secure' : 'Unsecure') + ' Request: ');
      console.log(params);
    }

    var reqHttp = resource.secure ? https : http;

    var req = reqHttp.request(params);

    req.on('error', function(e) {
      return callback(e, null);
    });
    req.on('response', function(res) {
      var responseData = '';
      res.on('data', function(data) {
        responseData += data.toString();
      });

      res.on('end', function(data) {
        if(params.filter && typeof params.filter === 'function') {
          responseData = params.filter(responseData);
        }
        try {
          var json = parser.toJson(responseData, {coerce: false, object: true, sanitize: false});
        } catch(e) {
          return callback('Invalid JSON', null);
        }

        return callback(null, json);
      });
    });
    req.end();
  }

  function buildResourceFunction(i, resources) {
    return function(data, options, callback) {
      if(!callback) {
        callback = options;
        options = undefined;
      }

      var opts = doBuildParams(data, options, resources[i]);

      doRequest(opts.params, resources[i], function(err, res) {
        if(err) {
          return callback(err, null);
        }
        return resources[i].r(res, callback)
      });
    }
  }

  for(var i in resources) {
    $scope[i] = buildResourceFunction(i, resources);
  }

  return $scope.config(args);
}

module.exports = USPS;