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


module.exports = helpers