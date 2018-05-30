/*
* Test runner
*/

var helpers = require('./../lib/helpers');

var assert = require('assert');

//Application logic for test runner and container for test

_app = {};


_app.tests = {
    'unit': {}
};

// Assert that the getNumber function is returning a number
_app.tests.unit['helpers.getNumber should return number'] = function(done){
    var val = helpers.getNumber();
    assert.equal(typeof(val), 'number');
    done();
};

// Assert that the getNumber function is returning a 1
_app.tests.unit['helpers.getNumber should return 1'] = function(done){
    var val = helpers.getNumber();
    assert.equal(val, 1);
    done();
};


// Assert that the getNumber function is returning a 2
_app.tests.unit['helpers.getNumber should return 2'] = function(done){
    var val = helpers.getNumber();
    assert.equal(val, 2);
    done();
};

_app.countTests = function(){
    var counter = 0;
    for(var key in _app.tests){
        if(_app.tests.hasOwnProperty(key)){
            var subTests = _app.tests[key];
            for(var testName in subTests){
                if(subTests.hasOwnProperty(testName)){
                    counter++;
                }   
            }
        }
    }
    return counter;
};

_app.produceTestReport = function(limit, successes, errors){
    console.log("");
    console.log("-------BEGIN TEST REPORT---------");
    console.log("");
    console.log("Total Tests: ", limit);
    console.log("Pass: ", successes);
    console.log("Fail:", errors.length);

    // if there are errors, print indetail

    if(errors.length){
        console.log("-------BEGIN ERROR DETAILS---------");
        console.log("");

        errors.forEach(function(testError){
            console.log('\x1b[31m%s\x1b[0m', testError.name); 
            console.log(testError.error);
        });



        console.log("-------END ERROR DETAILS---------");

    }

    console.log("");
    console.log("-------END TEST REPORT---------");
};

// Run all the tests, collecting the errors and success
_app.runTest = function(){
    var errors = [];
    var successes = 0;
    var limit = _app.countTests();
    var counter = 0;

    for(var key in _app.tests){
        if(_app.tests.hasOwnProperty(key)){
            var subTests = _app.tests[key];
            for(var testName in subTests){
                if(subTests.hasOwnProperty(testName)){
                    (function(){
                        var tempTestName = testName;
                        var testValue = subTests[testName];
                        // call the test
                        try{
                            testValue(function(){
                                console.log('\x1b[32m%s\x1b[0m', tempTestName); 
                                counter++;
                                successes++;
                                if(counter == limit){
                                    _app.produceTestReport(limit, successes, errors)
                                }
                            });
                        }catch(e){
                            errors.push({
                                'name': tempTestName,
                                'error': e
                            });
                            counter++;
                            console.log('\x1b[32\1m%s\x1b[0m', tempTestName); 
                            if(counter == limit){
                                _app.produceTestReport(limit, successes, errors)
                            }
                        }
                    })();
                }
            }
        }
    }
};

_app.runTest();