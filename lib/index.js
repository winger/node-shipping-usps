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
var extend = require('extend');
var parser = require('xml2json');
var soap = require('soap');
var path = require('path');
var util = require('util');

function USPS(args) {
  var $scope = this;
  $scope.hosts = {
    sandbox: 'https://secure.shippingapis.com/ShippingAPI.dll',
    live: 'https://secure.shippingapis.com/ShippingAPI.dll'
  };
  var defaults = {
      imperial: true, // for inches/lbs, false for metric cm/kgs
      currency: 'USD',
      language: 'en-US',
      environment: 'sandbox',
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

  function buildRatesRequest(data, options, resource, callback) {

  }

  function handleRatesResponse(res, callback) {
    return callback(null, res);
  }

  function buildShipRequest(data, options, resource, callback) {

  }

  function handleShipResponse(res, callback) {
    return callback(null, res);
  }

  function buildTrackingRequest(data, options, resource, callback) {

  }

  function handleTrackingResponse(res, callback) {
    return callback(null, res);
  }

  var resources = {
    rates: {f: buildRatesRequest, r: handleRatesResponse},
    ship: {f: buildShipRequest, r: handleShipResponse},
    track: {f: buildTrackingRequest, r: handleTrackingResponse}
  };

  function doBuildParams(data, options, resource) {
    var body = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>' + resource.f(data, options);;
    var params = {
      host: hosts[$scope.options.environment],
      path: resource.p,
      method: 'POST',
      headers: {
        'Content-Length': body.length,
        'Content-Type': 'text/xml',
        'User-Agent': $scope.options.user_agent
      }
    };

    return {
      body: body,
      params: params
    };
  }

  function doRequest(params, body, callback) {
    if(!callback) {
      callback = body;
      body = null;
    }

    if($scope.options.debug) {
      console.log(body);
      console.log('Request: ');
      console.log(params);
    }

    var req = https.request(params);

    req.write(body);
    req.on('error', function(e) {
      return callback(e, null);
    });
    req.on('response', function(res) {
      var responseData = '';

      res.on('data', function(data) {
        responseData += data.toString();
      });

      res.on('end', function() {
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

      doRequest(opts.params, opts.body, function(err, res) {
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