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

    it('deliversToSender', function() {
        var timestamp = new Date();
        //client.metlog('type');
    });
});