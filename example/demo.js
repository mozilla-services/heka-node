/*
 * This is a simple HTTP server which responds to
 *
 *    http://localhost:8000/echo/<some_text_here>
 *
 * ex:
 *    http://localhost:8000/echo/blahblahblah
 *
 *
 * To view the data, you will need hekad running and listening on
 * localhost:5565 for UDP messages.
 *
 * A minimal hekad 0.2.0 configuration in TOML is:
 *
 * -----
 *    [UdpInput]
 *    address = "127.0.0.1:5565"
 *
 *    [LogOutput]
 *    message_matcher = "Type == 'counter' || Type == 'timer'" 
 *    payload_only = false
 * -----
 *
 */
"use strict";

var heka = require('heka');
var _ = require('underscore');
var restify = require('restify');

var heka_CONF = {
    'stream': {'factory': 'heka/streams:udpStreamFactory',
               'hosts': 'localhost',
               'ports': 5565,
               'encoder': 'heka/senders/encoders:protobufEncoder'
    },
    'logger': 'test',
    'severity': 5
};
var jsonConfig = JSON.stringify(heka_CONF);
var log = heka.clientFromJsonConfig(jsonConfig);

var server = restify.createServer({
      name: 'myapp',
      version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

function block(ms) {
    // naive cpu consuming "sleep", should never be used in real code
    var start = new Date();
    var now;
    do {
        now = new Date();
    } while (now - start < ms);
};

var echo_func = function(request, response, next) {
    // Send incr() messages 90% of the time
    log.incr('demo.node.incr_thing', {count:2, my_meta:42}, new heka.BoxedFloat(0.9));
    response.send(request.params);
    block(10);
    return next();
};

server.get('/echo/:name', log.timer(echo_func, 'timed_echo'));

server.listen(8000, function () {
      console.log('%s listening at %s', server.name, server.url);
});
