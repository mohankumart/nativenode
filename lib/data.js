/*
* Libraray for storing and editing the data
*/

var fs = require('fs');
var path = require('path');

var helpers = require('./helpers')

// container for the module (to be exported)
var lib = {}

//define the base directory of data folder
lib.baseDir = path.join(__dirname,'/../.data/');

//write data to a file
lib.create = function(dir, file, data, callback){
    //open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
        if(!err && fileDescriptor){
            //convert data to string
            var stringData = JSON.stringify(data);

            //write to file and close it
            fs.writeFile(fileDescriptor, stringData, function(err){
                if(!err){
                      fs.close(fileDescriptor, function(err){
                        if(!err){
                            callback(false)        
                        }else{
                            callback('Error closing the file')
                        }
                      });  
                }else{
                    callback('Error writing to new file');
                }
            });
        }else{
            callback('Could not create a new file, it may already exists')
        }
    });
};

// Read data from the file
lib.read = function(dir, file, callback){
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf-8', function(err, data){
        if(!err && data){
            var pasrsedData = helpers.pasreJsonToObject(data);
            callback(false, pasrsedData);
        }else{
            callback(err, data)
        }
        
    });
};

// Update data inside a file
lib.update = function(dir, file, data, callback){
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+', function(err, fileDescriptor){
        if(!err){
            var stringData = JSON.stringify(data)

            //Truncate the file
            fs.truncate(fileDescriptor, function(err,){
                if(!err){
                    fs.writeFile(fileDescriptor, stringData, function(err){
                        if(!err){
                            fs.close(fileDescriptor, function(err){
                                if(!err){
                                    callback(false)
                                }else{
                                    callback('Error closing the file'); 
                                }
                            }); 
                        }else{
                            callback('Error writing to file');
                        }
                    })
                }else{
                    callback('Error truncating the file');
                }
            });
        }else{
            callback('Could not open file for updating, it may not exists');
        }
    });
}

// Delete the file
lib.delete = function(dir, file, callback){
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err){
        if(!err){
            callback(false);
        }else{
            callback('Error deleting the fuile.');
        }
    });
}

// list all the items in a directory

lib.list = function(dir, callback){
    fs.readdir(lib.baseDir+dir+'/', function(err, data){
        if(!err && data && data.length > 0){
            var trimmedFilesNames = [];
            data.forEach(function(fileName){
                trimmedFilesNames.push(fileName.replace('.json', ''));
            });
            callback(false,trimmedFilesNames);
        }else{
            callback(500, {'Error': 'Unable to open directory'})
        }
    });
};

module.exports = lib