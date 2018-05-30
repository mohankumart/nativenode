/*
* Primary file for the API
*/


//dependecies

var server = require('./lib/server');
var workers = require('./lib/workers');
var cli = require('./lib/cli');

// Declare the app

var app = {};

app.init = function(callback){
    server.init();
    workers.init();

    // start the CLI, but make sure it start that

    setTimeout(function(){
        debugger;
        cli.init();
        callback()
    },50);
};

// execute that function;

//self invoking only calling directly
if(require.main == module){
    app.init(function(){});
}


module.exports = app;
