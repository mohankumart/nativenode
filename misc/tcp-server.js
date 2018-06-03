/**
 * Example TCP (Net) server
 */

 var net = require('net');
 var fs = require('fs');
 var path = require('path');

 // Create the server

 var server = net.createServer(function(connection){
    var outboundMessage = 'pong';
    connection.write(outboundMessage);

    connection.on('data', function(inboundMessage){
        var messageString = inboundMessage.toString();
        console.log('i wrote outbound message  '+messageString);
    });
 });


 server.listen(6000);