/*
 ***** BEGIN LICENSE BLOCK *****
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Rob Miller (rmiller@mozilla.com)
 *  Victor Ng (vng@mozilla.com)
 *
 ***** END LICENSE BLOCK *****
 */
"use strict";

var horaa = require('horaa');
var sys = require('util');
var senders = require('../senders');
var zmqHoraa = horaa('zmq');
var udpHoraa = horaa('dgram');

describe('ZmqPubSender', function() {

    var mockPublisher = {
        sent: 0,
        msg: '',
        bound: [],
        send: function(msg) {
            this.sent += 1;
            this.msg = msg;
        },
        bind: function(bindstr) {
            this.bound[this.bound.length] = bindstr;
        }
    };

    beforeEach(function() {
        mockPublisher.sent = 0;
        mockPublisher.msg = '';
        mockPublisher.bound = [];
        zmqHoraa.hijack('createSocket', function(type) {
            if (type === 'pub') {
                return mockPublisher;
            };
        });
    });

    afterEach(function() {
        zmqHoraa.restore('createSocket');
    });

    it('initializes correctly', function() {
        var bindstr = 'tcp://127.0.0.1:9988';
        var sender = senders.zmqPubSenderFactory({bindstrs: bindstr})

        expect(sender.publisher).toBe(mockPublisher);
        expect(mockPublisher.highWaterMark).toEqual(1000);
        expect(mockPublisher.bound).toEqual([bindstr]);
        expect(mockPublisher.sent).toEqual(0);
    });

    it('initializes w/ non-defaults', function() {
        var bindstrs = ['tcp://10.10.10.1:9988',
                        'tcp://10.10.10.2:8877'];
        var queueLength = 500;
        var sender = senders.zmqPubSenderFactory({bindstrs: bindstrs, 
                                                   queueLength: queueLength});
        expect(sender.publisher).toBe(mockPublisher);
        expect(mockPublisher.highWaterMark).toEqual(queueLength);
        expect(mockPublisher.bound).toEqual(bindstrs);
        expect(mockPublisher.sent).toEqual(0);
    });

    it('sends messages', function() {
        var bindstr = 'tcp://127.0.0.1:9988';
        var sender = senders.zmqPubSenderFactory({bindstrs: bindstr});

        var msg = {'hello': 'world',
                   'goodbye': 'friend'};
        sender.sendMessage(msg);
        expect(mockPublisher.sent).toEqual(1);
        expect(mockPublisher.msg).toEqual(JSON.stringify(msg)+"\n");
        var msg2 = {'until': 'we',
                    'meet': 'again'};
        sender.sendMessage(msg2);
        expect(mockPublisher.sent).toEqual(2);
        expect(mockPublisher.msg).toEqual(JSON.stringify(msg2) + "\n");
    });

});


var monkeyStdoutWrite = function(fakeWrite) {
    var origWrite = process.stdout.write;
    process.stdout.write = fakeWrite;
    return function() {
        process.stdout.write = origWrite;
    };
};


describe('StdoutSender', function() {

    var unhook;
    var msgs = [];
    var testMsg = {'foo': 'bar', 'baz': 'bawlp'};
    var mockStdoutWrite = function(string, encoding, fd) {
        msgs.push(string);
    };

    beforeEach(function() {
        msgs = [];
        unhook = monkeyStdoutWrite(mockStdoutWrite);
    });

    afterEach(function() {
        unhook();
    });

    it('sends messages', function() {
        var sender = senders.stdoutSenderFactory();
        sender.sendMessage(testMsg);
        expect(msgs.length).toEqual(1);
        expect(msgs[0]).toEqual(JSON.stringify(testMsg) + "\n");
    });

    it('supports alternate encoders', function() {
        var newFormatter = function(msg) {
            return ':::' + JSON.stringify(msg) + ':::';
        };
        var sender = senders.stdoutSenderFactory({encoder: newFormatter});
        sender.sendMessage(testMsg);
        expect(msgs.length).toEqual(1);
        expect(msgs[0]).toEqual(newFormatter(testMsg));
    });
});

describe('UdpSender', function() {

    var mockUdpSocket = {
        msgs: [],
        hosts: [],
        ports: [],
        send: function(msg, options, length, port, host, callback) {
            this.msgs[this.msgs.length] = msg.toString("utf8");

            this.hosts[this.hosts.length] = host;
            this.ports[this.ports.length] = port;
        },
        close: function() {
        }
    };


    var testMsg = "foo bar";

    beforeEach(function() {
        mockUdpSocket.msgs = [];
        mockUdpSocket.hosts = [];
        mockUdpSocket.ports = [];
        udpHoraa.hijack('createSocket', function(type) {
            if (type === 'udp4') {
                return mockUdpSocket;
            };
        });
    });

    afterEach(function() {
        udpHoraa.restore('createSocket');
    });


    it('sends messages', function() {
        var sender = senders.udpSenderFactory({hosts: 'localhost', 
                                               ports: 5565});
        sender.sendMessage(testMsg);
        expect(mockUdpSocket.msgs.length).toEqual(1);
        expect(mockUdpSocket.msgs[0]).toEqual(sender.encoder(testMsg));
        expect(mockUdpSocket.hosts[0]).toEqual('localhost');
        expect(mockUdpSocket.ports[0]).toEqual(5565);
    });

    it('sends messages with more hosts than ports', function() {
        var sender = senders.udpSenderFactory({hosts: ['localhost', '10.0.0.1'], 
                                               ports: 5565});
        sender.sendMessage(testMsg);
        expect(mockUdpSocket.msgs.length).toEqual(2);

        expect(mockUdpSocket.msgs[0]).toEqual(sender.encoder(testMsg));
        expect(mockUdpSocket.msgs[1]).toEqual(sender.encoder(testMsg));

        expect(mockUdpSocket.hosts[0]).toEqual('localhost');
        expect(mockUdpSocket.hosts[1]).toEqual('10.0.0.1');

        expect(mockUdpSocket.ports[0]).toEqual(5565);
        expect(mockUdpSocket.ports[1]).toEqual(5565);
    });


    it('sends messages with hosts and ports', function() {
        var sender = senders.udpSenderFactory({hosts: ['localhost', '10.0.0.1'], 
                                               ports: [2345, 5565]});
        sender.sendMessage(testMsg);
        expect(mockUdpSocket.msgs.length).toEqual(2);

        expect(mockUdpSocket.msgs[0]).toEqual(sender.encoder(testMsg));
        expect(mockUdpSocket.msgs[1]).toEqual(sender.encoder(testMsg));

        expect(mockUdpSocket.hosts[0]).toEqual('localhost');
        expect(mockUdpSocket.hosts[1]).toEqual('10.0.0.1');

        expect(mockUdpSocket.ports[0]).toEqual(2345);
        expect(mockUdpSocket.ports[1]).toEqual(5565);
    });


    /*
    it('raises errors on bad host/port pairs', function() {
        throw new Error("test not implemented");
    }

    it('works with factory functions', function() {
        // We need a way to run the 
        throw new Error("test not implemented");
    }
    */

    it('serializes to JSON by default', function() {
        var encoders = require('../senders/encoders');
        var sender = senders.udpSenderFactory({hosts: ['localhost', '10.0.0.1'], 
                                               ports: [2345, 5565]});
        expect(sender.encoder).toEqual(encoders.jsonEncoder);
    });

});
