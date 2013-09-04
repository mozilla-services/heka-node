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
var ByteBuffer = require('bytebuffer');
var sys = require('util');
var streams = require('../streams');
var udpHoraa = horaa('dgram');
var message = require('../message');
var Message = message.Message;
var m_helpers = require('../message/helpers');
var toArrayBuffer = m_helpers.toArrayBuffer;

var encoders = require('../encoders');

var uuid = require('../uuid');
var compute_oid_uuid = uuid.compute_oid_uuid;


var monkeyStdoutWrite = function(fakeWrite) {
    var origWrite = process.stdout.write;
    process.stdout.write = fakeWrite;
    return function() {
        process.stdout.write = origWrite;
    };
};

function build_test_msg() {
    var msg = new Message();
    msg.timestamp=100;
    msg.uuid = '0000000000000000';
    var oid_uuid = compute_oid_uuid(msg.encode());
    msg.uuid = new ByteBuffer(16).writeLString(oid_uuid).flip().compact();
    return msg;
}


function utf8(buff) {
    return buff.toString('utf8');
}

var msgs = [];

describe('StdoutSender', function() {

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

    /*
    it('sends messages', function() {
        expect(msgs.length).toEqual(0);
        var stream = streams.stdoutStreamFactory();
        expect(msgs.length).toEqual(0);

        var encoder = encoders.protobufEncoder;
        var streamdata = encoder.encode(testMsg);
        stream.sendMessage(streamdata);

        expect(msgs.length).toEqual(1);
        unhook();

        // The header is going to be 10 bytes long including all the
        // sentinel bytes, so just strip it off.
        //
        // node.js makes me cry.  comparing buffer slices doesn't work
        // with the toEqual method, so you need to stringify the JSON
        // encoded message
        var actual = utf8(msgs[0].slice(9));
        var expected = utf8(protobufEncoder.encode(testMsg));
        expect(actual).toEqual(expected);
    });
    */

});

describe('UdpSender', function() {

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
        var stream = streams.udpStreamFactory({hosts: 'localhost', 
                                               ports: 5565});
        var encoder = encoders.protobufEncoder;
        var streamdata = encoder.encode(testMsg);
        stream.sendMessage(streamdata);

        expect(mockUdpSocket.msgs.length).toEqual(1);

        var actual_data = mockUdpSocket.msgs[0];


        var decoded = m_helpers.decode_message(actual_data);

        var actual = decoded['message'];

        // Compare UUIDs
        var actual_uuid = actual.uuid.readLString();
        var testMsg_uuid = testMsg.uuid.readLString();
        expect(actual_uuid).toEqual(testMsg_uuid);
        expect(actual_uuid.length).toEqual(16);

        expect(mockUdpSocket.hosts[0]).toEqual('localhost');
        expect(mockUdpSocket.ports[0]).toEqual(5565);
    });

    /*
    it('sends messages with more hosts than ports', function() {
        var stream = streams.udpStreamFactory({hosts: ['localhost', '10.0.0.1'], 
                                               ports: 5565});
        var encoder = encoders.protobufEncoder;
        var streamdata = encoder.encode(testMsg);
        stream.sendMessage(streamdata);

        expect(mockUdpSocket.msgs.length).toEqual(2);

        expect(utf8(mockUdpSocket.msgs[0].slice(9))).toEqual(utf8(encoder.encode(testMsg)));
        expect(utf8(mockUdpSocket.msgs[1].slice(9))).toEqual(utf8(encoder.encode(testMsg)));

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

        expect(utf8(mockUdpSocket.msgs[0].slice(9))).toEqual(utf8(streamdata));
        expect(utf8(mockUdpSocket.msgs[1].slice(9))).toEqual(utf8(streamdata));

        expect(mockUdpSocket.hosts[0]).toEqual('localhost');
        expect(mockUdpSocket.hosts[1]).toEqual('10.0.0.1');

        expect(mockUdpSocket.ports[0]).toEqual(2345);
        expect(mockUdpSocket.ports[1]).toEqual(5565);
    });
    */


});
