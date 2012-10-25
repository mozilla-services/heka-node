/*
 * This is a simple HTTP server which responds to
 *
 *    http://localhost:8000/echo/<some_text_here>
 *
 * ex:
 *    http://localhost:8000/echo/blahblahblah
 *
 */
"use strict";

var metlog = require('metlog');
var _ = require('underscore');
var restify = require('restify');

var METLOG_CONF = {
    'sender': {'factory': 'metlog/Senders:udpSenderFactory',
               'hosts': '192.168.20.2',
               'ports': 5565},
    'logger': 'test',
    'severity': 5
};
var jsonConfig = JSON.stringify(METLOG_CONF);
var log = metlog.clientFromJsonConfig(jsonConfig);

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
    response.send(request.params);
    block(10);
    log.incr('demo.node.incr_thing');
    return next();
};

server.get('/echo/:name', log.timer(echo_func, 'timed_echo'));

server.listen(8000, function () {
      console.log('%s listening at %s', server.name, server.url);
});
