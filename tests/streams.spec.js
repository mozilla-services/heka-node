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

var heka = require('../client.js');
var horaa = require('horaa');
var ByteBuffer = require('bytebuffer');
var streams = require('../streams');
var udpHoraa = horaa('dgram');
var fsHoraa = horaa('fs');

var message = require('../message');
var Message = message.Message;

var m_helpers = require('../message/helpers');
var toArrayBuffer = m_helpers.toArrayBuffer;
var compute_hex = m_helpers.compute_hex;
var encoders = require('../encoders');

var uuid = require('../uuid');
var compute_oid_uuid = uuid.compute_oid_uuid;

var path = require('path');
module.paths.push(path.resolve('..'))

var monkeyStdoutWrite = function(fakeWrite) {
    var origWrite = process.stdout.write;
    process.stdout.write = fakeWrite;
    return function() {
        process.stdout.write = origWrite;
    };
};

function build_test_msg() {
    var msg = new Message();
    msg.payload = "some payload content here";
    msg.timestamp=100;
    msg.uuid = '0000000000000000';
    var oid_uuid = compute_oid_uuid(msg.encode());
    msg.uuid = '0123456789012345';
    return msg;
}

function check_message_bytes(wire_buff, expected_msg_buff) {
    // Verification is a bit involved, we decode the bytes off the
    // wire and then re-encode the message portion to compare
    // *just* the message portion.

    var decoded = m_helpers.decode_message(wire_buff);
    var wire_msg = decoded['message'];
    var wire_buff = encoders.protobufEncoder.encode(wire_msg);
    var expected_msg_hex = compute_hex(toArrayBuffer(expected_msg_buff));
    var wire_msg_hex = compute_hex(toArrayBuffer(expected_msg_buff));

    // All messages should be at least 5 bytes
    expect(wire_buff.length).toBeGreaterThan(5);
    expect(expected_msg_buff.length).toBeGreaterThan(5);
    expect(wire_msg_hex).toEqual(expected_msg_hex);
}

describe('StdoutStream configuration', function() {
    it('is loadable by config.js', function() {
        // Note that the stream factory string is non-standard as
        // we're running from a testcase.  You will normally need to
        // use something like 'heka:streams.udpStreamFactory' from
        // your own application
        var config = {
            'stream': {'factory': './client:streams.stdoutStreamFactory'},
            'logger': 'test',
            'severity': heka.SEVERITY.INFORMATIONAL
        };
        var jsonConfig = JSON.stringify(config);
        var client = heka.clientFromJsonConfig(jsonConfig);
        expect(client.stream._is_stdout).toBeTruthy();
    });
});

describe('StdoutStream', function() {

    var msgs = [];
    var unhook;
    var mockStdoutWrite = function(string, encoding, fd) {
        msgs.push(string);
    };

    beforeEach(function() {
        msgs.length = 0;
        unhook = monkeyStdoutWrite(mockStdoutWrite);
    });

    afterEach(function() {
        unhook();
    });


    it('encodes messages', function() {
        var testMsg = build_test_msg();
        var stream = streams.stdoutStreamFactory();

        var encoder = encoders.protobufEncoder;
        var streamdata = encoder.encode(testMsg);

        expect(msgs.length).toEqual(0);
        stream.sendMessage(streamdata);
        expect(msgs.length).toEqual(1);
        unhook();

        var wire_buff = msgs[0];
        var expected_msg_buff = encoders.protobufEncoder.encode(testMsg);
        check_message_bytes(wire_buff, expected_msg_buff);
    });
});

describe('UdpStream', function() {

    var mockUdpSocket = {
        msgs: [],
        hosts: [],
        ports: [],
        send: function(msg, options, length, port, host, callback) {
            this.msgs[this.msgs.length] = msg;
            this.hosts[this.hosts.length] = host;
            this.ports[this.ports.length] = port;
        },
        close: function() {
        }
    };

    var testMsg = build_test_msg();
    var expected_msg_buff = encoders.protobufEncoder.encode(testMsg);

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

    it('is loadable by config.js', function() {
        // Note that the stream factory string is non-standard as
        // we're running from a testcase.  You will normally need to
        // use something like 'heka:streams.udpStreamFactory' from
        // your own application
        var config = {
            'stream': {'factory': './client:streams.udpStreamFactory',
                       'hosts': ['localhost', '10.0.0.1'],
                       'ports': [5565],
            },
            'logger': 'test',
            'severity': heka.SEVERITY.INFORMATIONAL
        };
        var jsonConfig = JSON.stringify(config);
        var client = heka.clientFromJsonConfig(jsonConfig);
        // The UDP configuration should have a dgram object
        expect(client.stream.dgram).not.toBeNull();
    });

    it('encodes messages', function() {
        var stream = streams.udpStreamFactory({hosts: 'localhost', 
                                               ports: 5565});
        var encoder = encoders.protobufEncoder;
        var streamdata = encoder.encode(testMsg);

        expect(mockUdpSocket.msgs.length).toEqual(0);
        stream.sendMessage(streamdata);
        expect(mockUdpSocket.msgs.length).toEqual(1);

        expect(mockUdpSocket.hosts[0]).toEqual('localhost');
        expect(mockUdpSocket.ports[0]).toEqual(5565);

        var wire_buff = mockUdpSocket.msgs.pop();
        check_message_bytes(wire_buff, expected_msg_buff);
    });

    it('sends messages with more hosts than ports', function() {
        var stream = streams.udpStreamFactory({hosts: ['localhost', '10.0.0.1'], 
                                               ports: 5565});
        var encoder = encoders.protobufEncoder;
        var streamdata = encoder.encode(testMsg);
        stream.sendMessage(streamdata);

        expect(mockUdpSocket.msgs.length).toEqual(2);

        var wire_buff = mockUdpSocket.msgs.pop();
        check_message_bytes(wire_buff, expected_msg_buff);
        wire_buff = mockUdpSocket.msgs.pop();
        check_message_bytes(wire_buff, expected_msg_buff);

        expect(mockUdpSocket.hosts[0]).toEqual('localhost');
        expect(mockUdpSocket.hosts[1]).toEqual('10.0.0.1');
        expect(mockUdpSocket.ports[0]).toEqual(5565);
        expect(mockUdpSocket.ports[1]).toEqual(5565);
    });

    it('sends messages with hosts and ports', function() {
        var stream = streams.udpStreamFactory({hosts: ['localhost', '10.0.0.1'], 
                                               ports: [2345, 5565]});
        var encoder = encoders.protobufEncoder;
        var streamdata = encoder.encode(testMsg);
        stream.sendMessage(streamdata);

        expect(mockUdpSocket.msgs.length).toEqual(2);

        var wire_buff = mockUdpSocket.msgs.pop();
        check_message_bytes(wire_buff, expected_msg_buff);
        wire_buff = mockUdpSocket.msgs.pop();
        check_message_bytes(wire_buff, expected_msg_buff);

        expect(mockUdpSocket.hosts[0]).toEqual('localhost');
        expect(mockUdpSocket.hosts[1]).toEqual('10.0.0.1');

        expect(mockUdpSocket.ports[0]).toEqual(2345);
        expect(mockUdpSocket.ports[1]).toEqual(5565);
    });
});

describe('FileStream', function() {
    var mockFileStream = {
        msgs : [],
        write: function(msg_buff) {
            this.msgs.push(msg_buff);
        },
        close: function() {
        }
    };

    beforeEach(function() {
        mockFileStream.msgs.length = 0;
        fsHoraa.hijack('createWriteStream', function(fpath) {
            return mockFileStream;
        });
    });

    afterEach(function() {
        fsHoraa.restore('createWriteStream');
    });

    it('is loadable by config.js', function() {
        // Note that the stream factory string is non-standard as
        // we're running from a testcase.  You will normally need to
        // use something like 'heka:streams.udpStreamFactory' from
        // your own application
        var config = {
            'stream': {'factory': './client:streams.fileStreamFactory',
                       'filepath': '/tmp/some_path.txt'
            },
            'logger': 'test',
            'severity': heka.SEVERITY.INFORMATIONAL
        };
        var jsonConfig = JSON.stringify(config);
        var client = heka.clientFromJsonConfig(jsonConfig);

        expect(client.stream.filepath).not.toBeNull();
        expect(client.stream).not.toBeNull();
    });

    it('encodes messages', function() {
        var testMsg = build_test_msg();
        var stream = streams.fileStreamFactory();

        var encoder = encoders.protobufEncoder;
        var streamdata = encoder.encode(testMsg);

        expect(mockFileStream.msgs.length).toEqual(0);
        stream.sendMessage(streamdata);
        expect(mockFileStream.msgs.length).toEqual(1);

        var wire_buff = mockFileStream.msgs.pop();
        var expected_msg_buff = encoders.protobufEncoder.encode(testMsg);
        check_message_bytes(wire_buff, expected_msg_buff);
    });
});
