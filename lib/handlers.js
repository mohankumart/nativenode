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
    debugger;
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
        debugger;
        var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        //verify that given token from headers is valid for specified user

        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if(tokenIsValid){
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
                callback(403, {'Error': 'required token is missing or wrong'});
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
        var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;

        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if(tokenIsValid){
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
                callback(403, {'Error': 'required token is missing or wrong'});
            }
        });
        
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
    var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;

    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
        if(tokenIsValid){
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
            callback(403, {'Error': 'required token is missing or wrong'});
        }
    });
  }else{
      callback(400, {'Error': 'Missing phone number field'})
  }  
};


// Tokens
handlers.tokens = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    }else{
        callback(405)
    }
}

handlers._tokens = {};

//required data to be phone and password
handlers._tokens.post = function(data, callback){
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10? data.payload.phone: false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0? data.payload.password: false;

    if(phone && password){
        _data.read('users', phone, function(err, userData){
            if(!err){
                // Hash the password
                var hashedPassword = helpers.hash(password); 
                if(hashedPassword == userData.hashedPassword){
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    debugger;
                    var tokenObject = {
                        phone,
                        id: tokenId,
                        expires
                    }
                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if(!err){
                            callback(200, tokenObject);
                        }else{
                            callback(500, {'Error': 'Could not write the token data to file'});
                        }
                    });
                }else{
                    callback(400, {'Error': 'Could not find the specified user'})
                }
            }else{
                callback(400, {'Error': 'Could not find the specified user'});
            }
        });
    }else{
        callback(400, {'Error': 'Missing required fields.'})
    }
};

handlers._tokens.get = function(data, callback){
    //check that phone provided is valid
    debugger
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20? data.queryStringObject.id.trim(): false;
    if(id){
        debugger;
        _data.read('tokens',id, function(err, data){
            if(!err && data){
                callback(200, data);
            }else{
                callback(400)
            }
        });
    }else{
        callback(400, {'Error': 'Missing id number field'})
    }
};

handlers._tokens.put = function(data, callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.length == 20? data.payload.id.trim(): false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true? data.payload.extend: false;

    if(id && extend){
        _data.read('tokens', id, function(err, data){
            if(!err && data){
                if(data.expires > Date.now()){
                    data.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', id, data, function(err){
                        if(!err){
                            debugger;
                            callback(200);
                        }else{
                            callback(500, {'Error': 'Could not extend token expiration'})
                        }
                    });
                }else{
                    callback(400, {'Error': 'Token has already expired and cannot be extended'});
                }
            }else{
                callback(400, {'Error': 'specified token does not exists'})
            }
        });
    }else{
        callabck(400, {'Error': 'Required fields are missing or invalid'})
    }
};

handlers._tokens.delete = function(data, callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.length == 20? data.payload.id.trim(): false;
    if(id){
        _data.read('tokens',id, function(err, data){
            if(!err && data){
               _data.delete('tokens', id, function(err){
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
        callback(400, {'Error': 'Missing id number field'})
    } 
};

handlers._tokens.verifyToken = function(id, phone, callback){
    _data.read('tokens', id, function(err, tokenData){
        if(!err && tokenData){
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            }else{
                callback(fakse);
            }
        }else{
            callback(false);
        }
    });
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
    'users': handlers.users,
    'tokens': handlers.tokens
};

//Export the handlers
module.exports = handlers