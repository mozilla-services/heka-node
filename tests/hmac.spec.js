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
var m_helpers = require('../message/helpers');

var Message = message.Message;
var Header = message.Header;
var toArrayBuffer = m_helpers.toArrayBuffer;
var compute_hex = m_helpers.compute_hex;

var crypto = require('crypto');
var encoders = require('../encoders');
var jsonEncoder = encoders.jsonEncoder;


var monkeyStdoutWrite = function(fakeWrite) {
    var origWrite = process.stdout.write;
    process.stdout.write = fakeWrite;
    return function() {
        process.stdout.write = origWrite;
    };
};

function build_test_msg() {
    var msg = new Message();
    msg.uuid='0123456789012345',
    msg.type='hmac'
    msg.timestamp=1000000;
    return msg;
}


describe('HMAC signatures are computed correctly', function() {
    var hmac_config = {signer: 'vic',
        key_version: 1,
        hash_function: 'md5',
        key: 'some_key'};

    var stream = streams.debugStreamFactory({hmc: hmac_config});

    var msgs = stream.msgs;

    beforeEach(function() {
        msgs.length = 0;
    });

    it('with MD5', function() {
        var expected_hmac = "a8:73:fd:c8:54:28:2e:55:d6:63:68:e8:b9:1b:58:69";
        var msg = build_test_msg();
        var encoder = encoders.protobufEncoder;
        var msg_buffer = encoder.encode(msg);

        expect(msgs.length).toEqual(0);
        var stream_buffer = stream.sendMessage(msg_buffer);
        expect(msgs.length).toEqual(1);

        var full_msg_bytes = compute_hex(toArrayBuffer(msgs.pop()));

        var decoded = m_helpers.decode_message(stream_buffer);
        var header = decoded['header'];
        var msg = decoded['message'];

        expect(header.hmac_signer).toEqual(hmac_config.signer);
        expect(header.hmac_key_version).toEqual(hmac_config.key_version);
        expect(header.hmac_hash_function).toEqual(Header.HmacHashFunction.MD5);
        expect(compute_hex(header.hmac.toArrayBuffer())).toEqual(expected_hmac);
    });

    it('with SHA1', function() {
        throw "NotImplementedError";
    })

})
