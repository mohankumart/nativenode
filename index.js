/*
* Primary file for the API
*/

// Dependecies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const {StringDecoder} = require('string_decoder')

const config = require('./lib/config')
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')

// The server shold respond to request with a string
var httpServer = http.createServer(function(req, res){
    unifiedServer(req, res)
});

// start the server, and have it listen on port 3000
httpServer.listen(config.httpPort, function(){
    console.log(`The server ius listening on port ${config.httpPort} in ${config.envName} mode`)
});

// The server shold respond to request with a string
var httpsServerOptions = {
    'key': fs.readFileSync(__dirname+'/https/key.pem'),
    'cert': fs.readFileSync(__dirname+'/https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req, res)
});

// start the server, and have it listen on port 3000
httpsServer.listen(config.httpsPort, function(){
    console.log(`The server ius listening on port ${config.httpsPort} in ${config.envName} mode`)
});

// All the server logic for both http and https
var unifiedServer = function(req, res){
    // Get the url and parse it
    var parsedUrl = url.parse(req.url, true)

    // Get th path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '')

    //Get the query string
    var queryStringObject = parsedUrl.query;

    //Get the HTTP Method
    var method = req.method.toLocaleLowerCase();

    //Get the headers as an object
    var headers = req.headers

    // Get the payload, if any 
    var decoder = new StringDecoder('utf-8')
    var buffer = '';

    req.on('data', (data)=>{
        buffer += decoder.write(data)
    });

    req.on('end', ()=>{
        buffer += decoder.end()
        debugger;
        var choosenHandler = typeof(handlers.router[trimmedPath]) != 'undefined'? handlers.router[trimmedPath]: handlers.notFound;
        
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.pasreJsonToObject(buffer)
        };

        
        choosenHandler(data, function(statusCode, payload){
            debugger;
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200
            payload = typeof(payload) == 'object' ? payload: {}

            //Convert the payload to string
            var payloadString = JSON.stringify(payload);
            
            // Send the response
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode);
            res.end(payloadString);

            // log the request path
            console.log('Returning this response', statusCode, payloadString)
        });
    });
}
