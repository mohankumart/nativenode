/**
 * Example TCP client
 */

 var net = require('net');

 var outboundMessage = 'ping';

 var client = net.createConnection({'port': 6000}, function(){
     client.write(outboundMessage);
 });

 client.on('data', function(inboundMessage){
    var inboundMessageString = inboundMessage.toString();
    console.log(inboundMessageString);
    client.end();
 });