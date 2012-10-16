var metlog = require('metlog');

console.log(metlog);

var config = {
    'sender': {'factory': 'metlog/Senders:udpSenderFactory'},
    'logger': 'test',
    'severity': 5
};
var jsonConfig = JSON.stringify(config);
var client = metlog.Config.clientFromJsonConfig(jsonConfig);
console.log('----------');
console.log(client);

