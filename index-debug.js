/*
* Primary file for the API
*/


//dependecies

var server = require('./lib/server');
var workers = require('./lib/workers');
var cli = require('./lib/cli');

var exampleDebuggingProblem = require('./lib/exampleDebuggingProblem');


// Declare the app

var app = {};

app.init = function(){
    debugger;
    server.init();
    workers.init();

    // start the CLI, but make sure it start that

    setTimeout(function(){
        debugger;
        cli.init();
    },5000);
debugger;
    var foo = 1;

    foo = foo * foo;
    foo++;
debugger;
    foo = foo.toString();

    exampleDebuggingProblem.init();
};

// execute that function;


app.init();

module.exports = app;
