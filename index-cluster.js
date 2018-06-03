/*
* Primary file for the API
*/

var os = require('os');
var cluster = require('cluster');

//dependecies

var server = require('./lib/server');
var workers = require('./lib/workers');
var cli = require('./lib/cli');


// Declare the app

var app = {};

app.init = function(callback){
    
    if(cluster.isMaster){
        console.log(os.cpus().length);
        workers.init();

        //start the CLI, but make sure it start that
    
        setTimeout(function(){
            cli.init();
            callback()
        },50);

        // Fork the process
        for(var i=0; i<os.cpus().length; i++){
            cluster.fork();
        }
    }else{
        //if we are not on master thread, start the HTTP server
        server.init();
    }  
};

// execute that function;

//self invoking only calling directly
if(require.main == module){
    app.init(function(){});
}


module.exports = app;
