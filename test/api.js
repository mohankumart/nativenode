/*
* API tests
*/
var assert = require('assert');
var http = require('http');

var app = require('./../index');
var config = require('./../lib/config');

var api = {};

var helpers = {};

helpers.makeGetRequest = function(path, callback){
    var requestDetails = {
        'protocol': 'http:',
        'hostname': 'localhost',
        'port': config.httpPort,
        'method': 'GET',
        'path': path,
        'headers': {
            'Content-Type': 'application/json'
        }
    };

    var req = http.request(requestDetails, function(res){
        callback(res);
    });

    req.end();
};

// The main init function should be able to run without throwing

api['app.init should start without throwinf error'] = function(done){
    assert.doesNotThrow(function(){
        app.init(function(err){
            done();
        },TypeError)
    });
};

//Make the request to /ping

api['/ping should respond to GET with 200'] = function(done){
    helpers.makeGetRequest('/ping', function(res){
        assert.equal(res.statusCode, 200);
        done();
    });
};

//Make a request to /api/users/
api['/api/users should respond to GET with 200'] = function(done){
    assert.equal(400, 300);
    done();
    // helpers.makeGetRequest('/api/users', function(res){
    //     //assert.equal(res.statusCode, 300);
    //     done();
    // });
};

//Make a request to /api/users/
api['A random path should respond to GET with 404'] = function(done){
    helpers.makeGetRequest('/this/path/users', function(res){
        assert.equal(res.statusCode, 404);
        done();
    });
};


module.exports = api;