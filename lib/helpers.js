//Dependencies
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');

var config = require('./config');

var helpers = {};

// Create a SHA256 has
helpers.hash = function(password){
    if(typeof(password) == 'string' && password.length > 0){
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex');
        return hash;
    }else{
        return false;
    }
}

//parse json string into object
helpers.pasreJsonToObject = function(buffer){
    try{
        var obj = JSON.parse(buffer);
        return obj;
    }catch(e){
        return {};
    }
    
}

helpers.createRandomString = function(stringLength){
    stringLength = typeof(stringLength) == 'number' && stringLength > 0 ? stringLength:false;
    if(stringLength){
        var possibleCharacters = 'abcdefghijklmnopqrstvuwxyz0123456789';
        var str = '';
        debugger
        for(i=1; i<=stringLength; i++){
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random()* possibleCharacters.length)); 
            str+=randomCharacter;
        }
        return str;
    }else{
        return false;
    }
};


helpers.sendTwilioSms = function(phone, msg, callback){
    debugger;
    phone = typeof(phone) == 'string' && phone.trim().length > 0 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length < 2000 ? msg.trim() : false;
    
    if(phone && msg){
        var payload = {
            'From': config.twilio.fromPhone,
            'To': '+919482105436',
            'Body': msg
        };

        var stringPayload = querystring.stringify(payload);
        var requestDetails = {
            'protocol': 'https:',
            'hostname' : 'api.twilio.com',
            'mehtod': 'POST',
            'path': '/2010-04-01/Accounts/'+ config.twilio.accountSid+'/Messages.json',
            'auth': config.twilio.accountSid+':'+config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        //instantiate the request

        var req = https.request(requestDetails, function(res){
            var status = res.statusCode;
            debugger;
            if(status == 200 || status == 201){
                callback(false)
            }else{
                callback('Staus code returned was'+ status)
            }
        });

        //bind to to the error event so it doesnt get thrown

        req.on('error', function(e){
            callback(e);
        });

        req.write(stringPayload);

        req.end();

    }else{
        callback('Given parameters were missing or invalid');
    }
};

module.exports = helpers