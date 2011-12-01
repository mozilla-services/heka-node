var sys = require('util');
var clientModule = require('../client.js');


describe('client', function() {
    var mockSender = {
        sent: 0,
        sendMessage: function(msg) {
            this.sent += 1;
            this.msg = msg
        }
    };

    var loggerVal = 'bogus';
    var client;
    var isoConvert = clientModule.IsoDateString

    beforeEach(function() {
        mockSender.sent = 0;
        mockSender.msg = '';
        client = new clientModule.client(mockSender, loggerVal);
    });

    it('initializes correctly', function() {
        expect(client.sender).toBe(mockSender);
        expect(client.logger).toEqual(loggerVal);
        expect(client.severity).toEqual(6);
    });

    it('initializes w alternate defaults', function() {
        var otherLoggerVal = 'sugob';
        var otherSeverity = 3;
        otherClient = new clientModule.client(mockSender, otherLoggerVal,
                                              otherSeverity);
        expect(otherClient.sender).toBe(mockSender);
        expect(otherClient.logger).toEqual(otherLoggerVal);
        expect(otherClient.severity).toEqual(otherSeverity);
    });

    it('delivers to sender', function() {
        var timestamp = new Date();
        var type = 'vanilla'
        var payload = 'drippy dreamy icy creamy';
        client.metlog(type, {'timestamp': timestamp,
                             'payload': payload});
        expect(mockSender.sent).toEqual(1);
        var msg = mockSender.msg;
        expect(msg.type).toEqual(type);
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.severity).toEqual(6);
        expect(msg.payload).toEqual(payload);
        expect(msg.fields).toEqual({});
    });

    it('sends incr message', function() {
        var timestamp = new Date();
        var name = 'counter name';
        client.incr(name, {'timestamp': timestamp});
        expect(mockSender.sent).toEqual(1)
        var msg = mockSender.msg;
        expect(msg.type).toEqual('counter');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual({'name': name});
        expect(msg.payload).toEqual('1');
    });

    it('sends incr different count', function() {
        var timestamp = new Date();
        var name = 'counter name';
        var count = 3;
        client.incr(name, {'timestamp': timestamp,
                           'count': count});
        expect(mockSender.sent).toEqual(1)
        var msg = mockSender.msg;
        expect(msg.type).toEqual('counter');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual({'name': name});
        expect(msg.payload).toEqual('3');
    });

    it('sends timed message', function() {
        var timestamp = new Date();
        var name = 'timed name';
        var elapsed = 35;
        var diffLogger = 'different'
        client.timed(elapsed, name, {'timestamp': timestamp,
                                     'logger': diffLogger});
        var msg = mockSender.msg;
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(diffLogger);
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual({'name': name,
                                    'rate': 1});
        expect(msg.payload).toEqual(String(elapsed));
    });
});