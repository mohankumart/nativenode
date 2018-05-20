/*
* These are the request handlers
*/


//Dependencies
var helpers = require('./helpers');
var _data = require('./data');

//Define handlers
var handlers = {};

// Users
handlers.users = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    }else{
        callback(405)
    }
}

// containers for the users submethods
handlers._users = {};

//users post
handlers._users.post = function(data, callback){
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0? data.payload.firstName: false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0? data.payload.lastName: false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10? data.payload.phone: false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0? data.payload.password: false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true? true: false;
    debugger
    if(firstName && lastName && password && tosAgreement){
        // Make sure that user does not already exists
        _data.read('users', phone, function(err, data){
            if(err){
                // Hash the password
                var hashedPassword = helpers.hash(password);   
                
                // create the user object
                if(hashedPassword){
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': tosAgreement
                    }
    
                    _data.create('users',phone,userObject, function(err){
                        if(!err){
                            callback(200)
                        }else{
                            callback(500, {'Error': 'Could not create the new user'})
                        }
                    });
                }else{
                    callback(400, {'Error': 'Could ot hash user password'})
                }
                
            }else{
                // User already exists
                callback(400, {'Error': 'A user with that phone number already exists'})
            }
        });
    }else{
        callback(400, {'Error': 'Missing required fields'});
    }


}

//users get
handlers._users.get = function(data, callback){
    //check that phone provided is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10? data.queryStringObject.phone.trim(): false;
    if(phone){
        _data.read('users',phone, function(err, data){
            if(!err && data){
                // Remove the hashed password for the user object before retirning it to user
                delete data.hashedPassword
                callback(200, data);
            }else{
                callback(400)
            }
        });
    }else{
        callback(400, {'Error': 'Missing phone number field'})
    }
}

//users put
handlers._users.put = function(data, callback){
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10? data.payload.phone.trim(): false;

    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0? data.payload.firstName: false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0? data.payload.lastName: false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0? data.payload.password: false;
    
    //Error is the phone is invalid
    if(phone){
        if(firstName || lastName || password){
            _data.read('users', phone, function(err, data){
                debugger;
                if(!err && data){
                    if(firstName){
                        data.firstName = firstName
                    }

                    if(lastName){
                        data.lastName = lastName
                    }

                    if(password){
                        data.hashedPassword = helpers.hash(password)
                    }

                    //store the new updates

                    _data.update('users', phone, data, function(err){
                        if(!err){
                            callback(200);
                        }else{
                            console.log(err);
                            callback(500, {'Error': 'Could not update the user'})
                        }     
                    });

                }else{
                    callback(400, {'Error': 'The specified user does not Exists'})
                }
            });
        }else{
            callback(400, {'Error':'Missing the update fields'})
        }
    }else{
        callback(400, {'Error':'Missing the required filed'})
    }
};

//users delete
handlers._users.delete = function(data, callback){
  // check that phone number is valid
  //check that phone provided is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10? data.queryStringObject.phone.trim(): false;
  if(phone){
      _data.read('users',phone, function(err, data){
          if(!err && data){
             _data.delete('users', phone, function(err){
                if(!err){
                    callback(200)
                }else{
                    callback(500, {'Error': 'Could not delete speified user'})
                }    
              });
          }else{
              callback(400, {'Error': 'Could not be find the specified user'})
          }
      });
  }else{
      callback(400, {'Error': 'Missing phone number field'})
  }  
};


handlers.ping = function(data, callback){
    callback(200);
};

handlers.notFound = function(data, callback){
    callback(404);
};

// define a request router
handlers.router = {
    'ping': handlers.ping,
    'users': handlers.users
};

//Export the handlers
module.exports = handlers