/*
* Primary file for the API
*/


//dependecies

var server = require('./lib/server');
var workers = require('./lib/workers');

// Declare the app

var app = {};

app.init = function(){
    server.init();
    //workers.init();
};

// execute that function;


app.init();

module.exports = app;
