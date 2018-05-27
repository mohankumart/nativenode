//these are workers related tasks.

//Dependencies

var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var util = require('util');
var debug = util.debuglog('workers');

var _data = require('./data');
var helpers = require('./helpers');
var _logs = require('./logs');

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
                        debug('Error reading one of the check data!!!');
                    }
                });
            });
        }else{
            debug('Error: could not find any checks to process');
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
        debug("Error: One of the checks is not properly");
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
            debug('User is updated the status via sms');
        }else{
            debug('Could not send sms alert who has state chnage in their alert');
        }
    });
};

workers.performCheckOutcome = function(originalCheckData, checkOutcome){
    
    var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1? 'up': 'down';

    // Decide if an alerts is warranted
    var alertWarrented = originalCheckData.lastChecked && originalCheckData.state !== state? true: false;

    //log the outcome
    var timeOfCheck = Date.now();
    workers.log(originalCheckData, checkOutcome, state, alertWarrented, timeOfCheck);


    //update the check data
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    debug("original");
    _data.update('checks', newCheckData.id, newCheckData, function(err){
        if(!err){
            if(alertWarrented){
                workers.alertUserStatusChange(newCheckData);
            }else{
                debug('checkout outcome has not changhed');
            }
        }else{
            debug("Error trying to save check data");
        }
    });
};

workers.log = function(originalCheckData, checkOutcome, state, alertWarrented, timeOfCheck){
    var logData = {
        'check': originalCheckData,
        'outcome': checkOutcome,
        'state': state,
        'alert': alertWarrented,
        'time': timeOfCheck
    };

    //convert the data to a string
    var logString = JSON.stringify(logData);

    // Determine the name of the log
    var logFileName = originalCheckData.id;

    _logs.append(logFileName, logString, function(err){
        if(!err){
            debug("Logging to file succeeded");
        }else{
            debug("Logging to file failed");
        }
    });
};

workers.loop = function(){
    setInterval(function(){
        workers.gatherAllChecks();
    },1000 * 20);
};


// Rotate to compress the log file
workers.rotateLogs = function(){
    // List all the (non compressed) log files
    _logs.list(false, function(err, logs){
        if(!err && logs && logs.length > 0){
            logs.forEach(function(logName){
                // Compress the data to different file
                var logId = logName.replace('.log', '');
                var newFileId = logId+'-'+Date.now();
                _logs.compress(logId, newFileId, function(err){
                    if(!err){
                        _logs.truncate(logId, function(err){
                            if(!err){
                                debug('Truncated log file.');
                            }else{
                                debug.log("Error truncating log file");
                            }
                        });
                    }else{
                        cons.log('Unable to compress log files');
                    }
                });
            });
        }else{

        }
    });
};

workers.logRotationLoop = function(){
    setInterval(function(){
        debugger;
        workers.rotateLogs();
    },1000 * 60);
};


workers. init = function(){

    // Send to console in yello
    console.log('\x1b[33m%s\x1b[0m', 'Workers started...'); 

    // Execute all the checks
    //workers.gatherAllChecks();
    //call the loop so the checks can execute themseleves
    workers.loop();

    // compress all the logs immediately
    workers.rotateLogs();

    // call the compression loop so logs will be compresses later on
    workers.logRotationLoop();
};

module.exports = workers;

