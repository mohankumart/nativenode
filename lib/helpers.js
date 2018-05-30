//Dependencies
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var path = require('path');
var fs = require('fs');

var config = require('./config');

var helpers = {};

// Sample for testing that simply returns a number
helpers.getNumber = function(){
    return 1;
};

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

helpers.getTemplate = function(templateName, data, callback){
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data != null? data : {};

    if(templateName){
        var templateDir = path.join(__dirname, '/../templates/');
        fs.readFile(templateDir+templateName+'.html', 'utf8', function(err, str){
            if(!err && str){
                //interpolate the str before it returns
                var finalString = helpers.interpolate(str, data);
                callback(false, finalString);
            }else{
                callback('No template is found');
            }
        });
    }else{
        callback('A valid template name was not specified');
    }
};

// Add universal header and footstring and pass provided data object
helpers.addUniversalTemplates = function(str, data, callback){
    str = typeof(str) == 'string' && str.length ? str:'';
    data = typeof(data) == 'object' && data != null? data : {};

    //Get the header

    helpers.getTemplate('_header', data, function(err, headerString){
        if(!err && headerString){
            //Get the footer
            helpers.getTemplate('_footer', data, function(err, footerString){
                if(!err && footerString){
                    // Add the all together
                    var fullString = headerString + str + footerString;
                    callback(false, fullString);
                }else{
                    callback('Could not find the footer template');
                }
            });
        }else{
            callback('Could not find the header template');
        }
    });
};


//Take give string and data object and find replace all keys in it

helpers.interpolate = function(str, data){
    str = typeof(str) == 'string' && str.length ? str:'';
    data = typeof(data) == 'object' && data != null? data : {};

    for(var keyName in config.templatesGlobals){
        if(config.templatesGlobals.hasOwnProperty(keyName)){
            data['global.'+keyName] =config.templatesGlobals[keyName];
        }
    }

    //For each value in data object, insert in template string

    for(key in data){
        if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
            var replace = data[key];
            var find = '{' + key + '}';
            str = str.replace(find, replace);
        }
    }

    return str;
};

helpers.getStaticAsset = function(fileName, callback){
 fileName = typeof(fileName) && fileName.length > 0 ? fileName : false;
 if(fileName){
    var publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+fileName, function(err, data){
        if(!err && data){
            callback(false, data);
        }else{
            callback('No file could be found');
        }
    });
 }else{
     callback('A valid fileName is not specified');
 }
}



module.exports = helpers