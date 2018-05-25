


// Dependecies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const {StringDecoder} = require('string_decoder')
const path = require('path');
var util = require('util');

var debug = util.debuglog('server');

const config = require('./config')
const handlers = require('./handlers')
const helpers = require('./helpers')

var server = {};

// The server shold respond to request with a string
server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req, res)
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
        var choosenHandler = typeof(server.router[trimmedPath]) != 'undefined'? server.router[trimmedPath]: server.notFound;
        
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.pasreJsonToObject(buffer)
        };

        debugger
        choosenHandler(data, function(statusCode, payload, contentType){
            //Determine the type of response (fallback to json)

            contentType = typeof(contentType) == 'string' ? contentType : 'json';

            statusCode = typeof(statusCode) == 'number' ? statusCode : 200
            

            // Send the response parts that are content specific
            var payloadString = '';
            if(contentType == 'json'){
                res.setHeader('Content-Type', 'application/json');
                payload = typeof(payload) == 'object' ? payload: {}
                //Convert the payload to string
                payloadString = JSON.stringify(payload);
            }

            if(contentType == 'html'){
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof(payload) == 'string' ? payload: '';
            }

            //common to all request
            res.writeHead(statusCode);
            res.end(payloadString);

            // log the request path
            if(statusCode == 200){
                debug('\x1b[32m%s\x1b[0m',`Returning this response ${statusCode}, ${payloadString}`)
            }else{
                debug('\x1b[31m%s\x1b[0m', `Returning this response ${statusCode}, ${payloadString}`)
            }
            
        });
    });
}

//export server

server.init = function(){
    // start the server, and have it listen on port 3000
    server.httpServer.listen(config.httpPort, function(){
        console.log('\x1b[35m%s\x1b[0m',`The server ius listening on port ${config.httpPort} in ${config.envName} mode`)
    });

    // start the server, and have it listen on port 3000
    server.httpsServer.listen(config.httpsPort, function(){
        console.log('\x1b[36m%s\x1b[0m',`The server ius listening on port ${config.httpsPort} in ${config.envName} mode`)
    });
}

// define a request router
server.router = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.edit,
    'account/deleted': handlers.delete,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'checks/all': handlers.checksList,
    'checks/create': handlers.checksCreate,
    'checks/edit': handlers.checksEdit,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks
};

module.exports = server;