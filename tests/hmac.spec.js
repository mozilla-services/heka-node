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
var senders = require('../senders');
var udpHoraa = horaa('dgram');
var message = require('../message');
var m_helpers = require('../message/helpers');

var Message = message.Message;
var Header = message.Header;
var toArrayBuffer = m_helpers.toArrayBuffer;

var crypto = require('crypto');
var encoders = require('../senders/encoders');
var jsonEncoder = encoders.jsonEncoder;


var monkeyStdoutWrite = function(fakeWrite) {
    var origWrite = process.stdout.write;
    process.stdout.write = fakeWrite;
    return function() {
        process.stdout.write = origWrite;
    };
};

function build_test_header() {
    var header = new Header();
    header.message_length = 0;
    return header;
}

function build_test_msg() {
    var msg = new Message();
    msg.uuid='1234567890123456';
    msg.timestamp=100;
    return msg;
}

var testMsg = build_test_msg();

function utf8(buff) {
    return buff.toString('utf8');
}


describe('hmac', function() {
    var hmac_config = {signer: 'my_signer',
        key_version: '1.0',
        hash_function: 'sha1',
        key: 'abc'};

    var sender = senders.debugSenderFactory({hmc: hmac_config});

    var msgs = sender.msgs;

    beforeEach(function() {
        msgs.length = 0;
    });

    it('encodes into the header', function() {
        sender.sendMessage(testMsg);
        expect(msgs.length).toEqual(1);

        var m = msgs[0];
        var header_size = m[1];
        var msg_start = header_size + 3;

        // byte offset 24-44 is where the HMAC is going to be
        var actual = m.slice(24,44);

        var header_bytes = m.slice(2, header_size+2);
        var new_header = Header.decode(ByteBuffer.wrap(toArrayBuffer(header_bytes)));
        expect(new_header.hmac_signer).toEqual(hmac_config.signer);

        var expected_hmac = crypto.createHmac(hmac_config.hash_function, hmac_config.key);
        expected_hmac.update(testMsg.encode().toBuffer());

        var expected = new Buffer(expected_hmac.digest('hex'), 'hex');

        expect(expected.length).toEqual(actual.length);
        for (var i = 0; i < expected.length; i ++) {
            expect(expected[i]).toEqual(actual[i]);
        }

    });

})
