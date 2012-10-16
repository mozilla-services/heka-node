var metlog = require('metlog');

console.log(metlog);

var config = {
    'sender': {'factory': 'metlog/Senders:udpSenderFactory',
               'host': 'localhost',
               'port': 5565},
    'logger': 'test',
    'severity': 5
};
var jsonConfig = JSON.stringify(config);
var client = metlog.Config.clientFromJsonConfig(jsonConfig);
console.log('----------');
console.log(client);

