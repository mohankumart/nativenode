//Dependencies
var crypto = require('crypto');

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

module.exports = helpers