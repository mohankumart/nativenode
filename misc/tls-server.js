/**
 * Example TLS server
 */

 var tls = require('tls');
 var fs = require('fs');
 var path = require('path');

 // Create the server

var options = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

 var server = tls.createServer(options,function(connection){
    var outboundMessage = 'pong';
    connection.write(outboundMessage);

    connection.on('data', function(inboundMessage){
        var messageString = inboundMessage.toString();
        console.log('i wrote outbound message  '+messageString);
    });
 });


 server.listen(6000);