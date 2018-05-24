


// Dependecies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const {StringDecoder} = require('string_decoder')
const path = require('path');

const config = require('./config')
const handlers = require('./handlers')
const helpers = require('./helpers')

var server = {};

// The server shold respond to request with a string
server.httpServer = http.createServer(function(req, res){
    unifiedServer(req, res)
});

// The server shold respond to request with a string
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
    server.unifiedServer(req, res)
});



// All the server logic for both http and https
server.unifiedServer = function(req, res){
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

//export server

server.init = function(){
    // start the server, and have it listen on port 3000
    server.httpServer.listen(config.httpPort, function(){
        console.log(`The server ius listening on port ${config.httpPort} in ${config.envName} mode`)
    });

    // start the server, and have it listen on port 3000
    server.httpsServer.listen(config.httpsPort, function(){
        console.log(`The server ius listening on port ${config.httpsPort} in ${config.envName} mode`)
    });
}

module.exports = server;