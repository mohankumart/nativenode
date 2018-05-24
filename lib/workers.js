//these are workers related tasks.

//Dependencies

var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');

var _data = require('./data');
var helpers = require('./helpers');


var workers = {};

workers.gatherAllChecks = function(){
    //get all the checks
    _data.list('checks', function(err, checks){
        if(checks && checks.length > 0){
            checks.forEach(function(check){
                _data.read('checks', check, function(err, originalCheckData){
                    if(!err && originalCheckData){
                        //pass it to the check validator, and let that continue
                        workers.validateCheckData(originalCheckData);
                    }else{
                        console.log('Error reading one of the check data!!!');
                    }
                });
            });
        }else{
            console.log('Error: could not find any checks to process');
        }
    });
};

workers.validateCheckData = function(originalCheckData){
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData != null ? originalCheckData: false;
    originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.length == 20 ? originalCheckData.id.trim(): false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.length == 10 ? originalCheckData.userPhone.trim(): false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http','https'].indexOf(originalCheckData.protocol)  > -1 ? originalCheckData.protocol.trim(): false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.length > 0 ? originalCheckData.url.trim(): false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post','get','put','delete'].indexOf(originalCheckData.method)  > -1 ? originalCheckData.method.trim(): false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length  > 0 ? originalCheckData.successCodes: false;    
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5? originalCheckData.timeoutSeconds: false;

    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up','down'].indexOf(originalCheckData.state)  > -1 ? originalCheckData.state.trim(): 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked  > 0 ? originalCheckData.lastChecked: false;

    //if all the checks passed. pass the all the data next step for process
    if(originalCheckData.id &&
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.url &&
        originalCheckData.method &&
        originalCheckData.successCodes &&
        originalCheckData.timeoutSeconds){
       workers.performCheck(originalCheckData);     
    }else{
        console.log("Error: One of the checks is not properly");
    }
};

workers.performCheck = function(originalCheckData){
    //prepare the intial check outcome
    var checkOutcome = {
        'error': false,
        'responseCode': false
    };

    // Mark the outcome 

    var outcomeSent = false;

    var parseUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
    var hostName = parseUrl.hostname;
    var path = parseUrl.path;

    //construct the request

    var requestDetails = {
        'protocol': originalCheckData.protocol+':',
        'hostname': hostName,
        'method': originalCheckData.method,
        'path': path,
        'timeout': originalCheckData.timeoutSeconds * 1000
    };

    // Instantiate the request using http or https module

    //what module to use

    var _moduleToUse = originalCheckData.protocol == 'http'? http: https;

    var req = _moduleToUse.request(requestDetails, function(res){
        var status = res.statusCode;

        checkOutcome.responseCode = status;
        if(!outcomeSent){
            workers.performCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', function(e){
        checkOutcome.error = {
            'Error': true,
            'value': e
        };

        if(!outcomeSent){
            workers.performCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', function(e){
        checkOutcome.error = {
            'Error': true,
            'value': 'timeout'
        };

        if(!outcomeSent){
            workers.performCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // end the request

    req.end();

};

workers.alertUserStatusChange = function(newCheckData){
    var msg = 'Alert: your check for: '+newCheckData.method.toUpperCase()+ '' +newCheckData.protocol + '://'+ newCheckData.url+ 'is currebtly '+ newCheckData.state;

    helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err){
        if(!err){
            console.log('User is updated the status via sms');
        }else{
            console.log('Could not send sms alert who has state chnage in their alert');
        }
    });
};

workers.performCheckOutcome = function(originalCheckData, checkOutcome){
    var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1? 'up': 'down';

    // Decide if an alerts is warranted
    var alertWarrented = originalCheckData.lastChecked && originalCheckData.state !== state? true: false;

    //update the check data
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    _data.update('checks', newCheckData.id, newCheckData, function(err){
        if(!err){
            if(alertWarrented){
                workers.alertUserStatusChange(newCheckData);
            }else{
                console.log('checkout outcome has not changhed');
            }
        }else{
            console.log("Error trying to save check data");
        }
    });
};

workers.loop = function(){
    setInterval(function(){
        workers.gatherAllChecks();
    },8000);
};


workers. init = function(){
    // Execute all the checks
    workers.gatherAllChecks();
    //call the loop so the checks can execute themseleves
    workers.loop();
};

module.exports = workers;

