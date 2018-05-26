/*
* These are the request handlers
*/


//Dependencies
var helpers = require('./helpers');
var _data = require('./data');
var config = require('./config');

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
  debugger;
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10? data.queryStringObject.phone.trim(): false;
  if(phone){
    var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;

    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
        if(tokenIsValid){
            _data.read('users',phone, function(err, userData){
                if(!err && userData){
                   _data.delete('users', phone, function(err){
                       
                        if(!err){
                            debugger
                            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks: [];
                            var checkstoDelete = userChecks.length;
                            if(checkstoDelete > 0){
                                var checksDeleted = 0;
                                var deletionErrors = false;
                                userChecks.forEach(checkedId => {
                                    _data.delete('delete', checkedId, function(err){
                                        if(err){
                                            deletionErrors = true;
                                        }
                                        checksDeleted++;
                                        if(checksDeleted == checkstoDelete){
                                            if(!deletionErrors){
                                                callback(200);
                                            }else{
                                                callback(500, {'Error':'Errors occurred during user deletion.'})
                                            }
                                        }
                                    });
                                });
                            }else{
                                callback(200);
                            }
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
                callback(false);
            }
        }else{
            callback(false);
        }
    });
};

// Tokens
handlers.checks = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._checks[data.method](data, callback);
    }else{
        callback(405)
    }
}

handlers._checks = {};

handlers._checks.post = function(data, callback){
    //validate the inputs
    var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol: false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url: false;
    var method = typeof(data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method: false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array &&  data.payload.successCodes.length > 0 ? data.payload.successCodes: false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5? data.payload.timeoutSeconds: false;
    debugger;
    if(protocol && url && method && successCodes && timeoutSeconds){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        _data.read('tokens', token, function(err, tokenData){
            if(!err && tokenData){
                var userPhone = tokenData.phone;
                _data.read('users',userPhone, function(err, userData){
                    if(!err && userData){
                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks: [];
                        //verify that the user has less the number of max-checks
                        if(userChecks.length < config.maxChecks){
                            var checkId = helpers.createRandomString(20);
                            //create the check object, and include the users phone
                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds 
                            };
                            _data.create('checks',checkId, checkObject, function(err){
                                if(!err){
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    _data.update('users', userPhone, userData, function(err){
                                        if(!err){
                                            callback(200, checkObject);
                                        }else{
                                            callback(500, {'Error': 'Could not update the user with the new check'})
                                        }        
                                    });
                                }else{
                                    callback(500, {'Error': 'Could not create the new check'})
                                }
                            });
                        }else{
                            callback(400, {'Error': 'User already has maximum number of checks ('+userData.checks.length+')'});
                        }

                    }else{
                        callback(403);
                    }
                });
            }else{
                callback(403);
            }
        }); 
    }else{
        callback(400, {'Error': 'Missing inputs or inputs are invalid'})
    }
}

//checks get
handlers._checks.get = function(data, callback){
    //check that id provided is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20? data.queryStringObject.id.trim(): false;
    if(id){
        debugger;

        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){
                var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                //verify that given token from headers is valid for specified user
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                    if(tokenIsValid){
                        callback(200, checkData);
                    }else{
                        callback(403);
                    }
                });
            }else{
                callback(404);
            }
        });
        

        
    }else{
        callback(400, {'Error': 'Invalid checkid'})
    }
}

handlers._checks.put = function(data, callabck){
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20? data.queryStringObject.id.trim(): false;

    var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol: false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url: false;
    var method = typeof(data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method: false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array &&  data.payload.successCodes.length > 0 ? data.payload.successCodes: false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5? data.payload.timeoutSeconds: false;

    if(id){
        if(protocol || url || method || successCodes || timeoutSeconds){
            _data.read('checks', id, function(err, checkData){
                if(!err && checkData){
                    var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                    handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                        if(tokenIsValid){
                            if(protocol){
                                checkData.protocol = protocol;
                            }
                            if(method){
                                checkData.method = method;
                            }
                            if(successCodes){
                                checkData.successCodes = successCodes;
                            }
                            if(timeoutSeconds){
                                checkData.timeoutSeconds = timeoutSeconds;
                            }
                            _data.update('checks', id, checkData, function(err){
                                if(!err){
                                    callabck(200)
                                }else{
                                    callabck('500', {'Error': 'Could not update the check data'})
                                }
                            });
                        }else{
                            callback(403);
                        }
                    })
                }else{
                    callabck(400, {'Error': 'Check ID did not exists'});
                }
            });
        }else{
            callabck(400, {'Error':'Missing fields'})
        }
    }else{
        callabck(400, {'Error':'Missing required field'})
    }
};

//checks delete
handlers._checks.delete = function(data, callback){
    // check that phone number is valid
    //check that phone provided is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20? data.queryStringObject.id.trim(): false;
    if(id){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;

        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){
                var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                    if(tokenIsValid){
                        //delete the checkdata
                        _data.delete('checks', id, function(err){
                            if(!err){
                                _data.read('users',checkData.userPhone, function(err, userData){
                                    if(!err && userData){
                                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks: [];
                                        
                                        var checkPosition = userChecks.indexOf(id);

                                        if(checkPosition){
                                            userChecks.splice(checkPosition, 1);
                                            userData.checks.length = 0;
                                            userData.checks = userChecks;
                                        }else{
                                            callback(500, {'Error':'could not find the check on users object'})
                                        }
                                        
                                        _data.update('users',checkData.userPhone, userData, function(err){
                                            if(!err){
                                                callback(200);
                                            }else{
                                                callback(500, {'Error':'Could not remove checked id from users'})
                                            }
                                        });
                                        
                
                                    }else{
                                        callback(403);
                                    }
                                });
                            }else{
                                callback(500, {'Error': 'Could not delete the check'})
                            }
                        });
                        //update the users checks
                    }else{
                        callback(403);
                    }
                })
            }else{
                callback(400, {'Error': 'Check ID did not exists'});
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

/*
* html handlers
*/

handlers.index = function(data, callback){

    if(data.method == 'get'){
        //read the index template as string.

        //prepare data for interpolation

        var templateData = {
            'head.title': 'Uptime Monitoring - made Simple',
            'header.description': 'We offer free, simple uptime monitoring fpr http/https sites of all kinds. When your site goes down, we will send text',
            'body.title': 'Hello Templated World!!!',
            'body.class': 'index'

        };
debugger;
        helpers.getTemplate('index', templateData, function(err, str){
            if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, fullString){
                    if(!err && fullString){
                        callback(200, fullString, 'html');
                    }else{
                        callback(500, undefined, 'html');
                    }
                });
            }else{
                callback(500, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html');
    }
};


//create account handler
handlers.accountCreate = function(data, callback){

    if(data.method == 'get'){
        //read the index template as string.

        //prepare data for interpolation

        var templateData = {
            'head.title': 'Create an Account',
            'header.description': 'SignUp is easy and only take few seconds',
            'body.title': 'Hello Templated World!!!',
            'body.class': 'Account Create'

        };
debugger;
        helpers.getTemplate('accountCreate', templateData, function(err, str){
            if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, fullString){
                    if(!err && fullString){
                        callback(200, fullString, 'html');
                    }else{
                        callback(500, undefined, 'html');
                    }
                });
            }else{
                callback(500, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html');
    }
};

handlers.sessionCreate = function(data, callback){

    if(data.method == 'get'){
        //read the index template as string.

        //prepare data for interpolation

        var templateData = {
            'head.title': 'Login to your account',
            'header.description': 'Please enter your phone and password',
            'body.title': 'Hello Templated World!!!',
            'body.class': 'Session Create'

        };
debugger;
        helpers.getTemplate('sessionCreate', templateData, function(err, str){
            if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, fullString){
                    if(!err && fullString){
                        callback(200, fullString, 'html');
                    }else{
                        callback(500, undefined, 'html');
                    }
                });
            }else{
                callback(500, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html');
    }
};

handlers.sessionDeleted = function(data, callback){

    if(data.method == 'get'){
        //read the index template as string.

        //prepare data for interpolation

        var templateData = {
            'head.title': 'Logged Out',
            'header.description': 'You have been logged out of the account',
            'body.title': 'Hello Templated World!!!',
            'body.class': 'Session Deleted'

        };
debugger;
        helpers.getTemplate('sessionDeleted', templateData, function(err, str){
            if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, fullString){
                    if(!err && fullString){
                        callback(200, fullString, 'html');
                    }else{
                        callback(500, undefined, 'html');
                    }
                });
            }else{
                callback(500, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html');
    }
};

handlers.accountEdit = function(data, callback){
    if(data.method == 'get'){
        //read the index template as string.

        //prepare data for interpolation

        var templateData = {
            'head.title': 'Account Edit',
            'header.description': 'Edit Account',
            'body.title': 'Hello Templated World!!!',
            'body.class': 'accountEdit'

        };
debugger;
        helpers.getTemplate('accountEdit', templateData, function(err, str){
            if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, fullString){
                    if(!err && fullString){
                        callback(200, fullString, 'html');
                    }else{
                        callback(500, undefined, 'html');
                    }
                });
            }else{
                callback(500, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html');
    }
};

handlers.accountDeleted = function(data, callback){
    if(data.method == 'get'){
        //read the index template as string.

        //prepare data for interpolation

        var templateData = {
            'head.title': 'Account Deleted',
            'header.description': 'Account Deleted',
            'body.title': 'Hello Templated World!!!',
            'body.class': 'accountDeleted'

        };
debugger;
        helpers.getTemplate('accountDeleted', templateData, function(err, str){
            if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, fullString){
                    if(!err && fullString){
                        callback(200, fullString, 'html');
                    }else{
                        callback(500, undefined, 'html');
                    }
                });
            }else{
                callback(500, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html');
    }
};

handlers.checksCreate = function(data, callback){
    if(data.method == 'get'){
        //read the index template as string.

        //prepare data for interpolation

        var templateData = {
            'head.title': 'Create a New Check',
            'body.class': 'checksCreate'

        };
debugger;
        helpers.getTemplate('checksCreate', templateData, function(err, str){
            if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, fullString){
                    if(!err && fullString){
                        callback(200, fullString, 'html');
                    }else{
                        callback(500, undefined, 'html');
                    }
                });
            }else{
                callback(500, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html');
    }
};

handlers.checksList = function(data, callback){
    if(data.method == 'get'){
        //read the index template as string.

        //prepare data for interpolation

        var templateData = {
            'head.title': 'Dashboard',
            'body.class': 'checksList'

        };
debugger;
        helpers.getTemplate('checksList', templateData, function(err, str){
            if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, fullString){
                    if(!err && fullString){
                        callback(200, fullString, 'html');
                    }else{
                        callback(500, undefined, 'html');
                    }
                });
            }else{
                callback(500, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html');
    }
};

handlers.checksEdit = function(data, callback){
    if(data.method == 'get'){
        //read the index template as string.

        //prepare data for interpolation

        var templateData = {
            'head.title': 'Edit A Check',
            'body.class': 'checksEdit'

        };
debugger;
        helpers.getTemplate('checksEdit', templateData, function(err, str){
            if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, fullString){
                    if(!err && fullString){
                        callback(200, fullString, 'html');
                    }else{
                        callback(500, undefined, 'html');
                    }
                });
            }else{
                callback(500, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html');
    }
};

//favicon
handlers.favicon = function(data, callback){
    debugger;
    if(data.method == 'get'){
        helpers.getStaticAsset('favicon.ico',function(err, data){
            if(!err && data){
                callback(200, data, 'favicon');
            }else{
                callback(500);
            }
        });
    }else{
        callbcak(405);
    }
};

handlers.public = function(data, callback){
    debugger;
    if(data.method == 'get'){
        // get the filename being requested
        var trimmedAssetName = data.trimmedPath.replace('public/','').trim();
        if(trimmedAssetName.length > 0){
            // read in the asset data
            helpers.getStaticAsset(trimmedAssetName,function(err, data){
                if(!err && data){
                    //Determine the content type 
                    var contentType = 'plain';
                    if(trimmedAssetName.indexOf('.css') > -1){
                        contentType = 'css';
                    }

                    if(trimmedAssetName.indexOf('.png') > -1){
                        contentType = 'png';
                    }

                    if(trimmedAssetName.indexOf('.jpeg') > -1){
                        contentType = 'jpeg';
                    }

                    if(trimmedAssetName.indexOf('.ico') > -1){
                        contentType = 'favicon';
                    }

                    if(trimmedAssetName.indexOf('.js') > -1){
                        contentType = 'js';
                    }
                    callback(false, data, contentType);
                }else{
                    callback(404);
                }
            });

        }else{
            callback(404);
        }
    }else{
        callback(405);
    }
};

//Export the handlers
module.exports = handlers