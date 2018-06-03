/**
 * UDP client
 */

var dgram = require('dgram');

 //create the client

var client = dgram.createSocket('udp4');

 // Define the message 

var messageString = 'This is message';
var messageBuffer = Buffer.from(messageString);

client.send(messageBuffer, 6000, 'localhost', function(err){
    client.close()
});
