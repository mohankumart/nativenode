
/*
* Unit tests
*/

var helpers = require('./../lib/helpers');
var assert = require('assert');
var logs = require('./../lib/logs');
var exampleDebuggingProblem = require('./../lib/exampleDebuggingProblem');

var unit = {};

// Assert that the getNumber function is returning a number
unit['helpers.getNumber should return number'] = function(done){
    var val = helpers.getNumber();
    assert.equal(typeof(val), 'number');
    done();
};

// Assert that the getNumber function is returning a 1
unit['helpers.getNumber should return 1'] = function(done){
    var val = helpers.getNumber();
    assert.equal(val, 1);
  
    done();
};


// Assert that the getNumber function is returning a 2
unit['helpers.getNumber should return 2'] = function(done){
    var val = helpers.getNumber();
    assert.equal(val, 2);
    done();
};

// logs list should callback a false
unit['logs lost should callback a false error and a array of log names'] = function(done){
    logs.list(true, function(error, logFileNames){
        assert.equal(error, false);
        assert.ok(logFileNames instanceof Array);
        assert.ok(logFileNames.length > 1);
        done();
    });
};

unit['logs.truncate shoould not throw if the logId does not exists'] = function(done){
    assert.doesNotThrow(function(){
        logs.truncate('I do not exists', function(err){
            assert.ok(err);
            done();
        });
    },TypeError);
};

unit['exampleDebugging problem should not throw error when called'] = function(done){
    assert.doesNotThrow(function(){
        debugger
        exampleDebuggingProblem.init();
        done();
    },TypeError);
};

module.exports = unit;