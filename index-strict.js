/*
* Primary file for the API
*/


//dependecies

var server = require('./lib/server');
var workers = require('./lib/workers');
var cli = require('./lib/cli');

// Declare the app

var app = {};

// Declare a global variable

foo = 'bar';

app.init = function(){
    server.init();
    workers.init();

    // start the CLI, but make sure it start that

    setTimeout(function(){
        debugger;
        cli.init();
    },5000);
};

// execute that function;


app.init();

module.exports = app;
