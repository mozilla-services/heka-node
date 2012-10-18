var metlog = require('metlog');
var _ = require('underscore');

var config = {
    'sender': {'factory': 'metlog/Senders:udpSenderFactory',
               'hosts': 'localhost',
               'ports': 5565},
    'logger': 'test',
    'severity': 5
};
var jsonConfig = JSON.stringify(config);
var client = metlog.clientFromJsonConfig(jsonConfig);
console.log('----------');
console.log(client.sender.toString());
var timestamp = new Date();
client.incr("blah", {'timestamp': timestamp});




