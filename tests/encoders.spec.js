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

var message = require('../message');
var encoders = require('../senders/encoders.js');
var client = require('../client');
var DateToNano = client.DateToNano;
var helpers = require("../message/helpers");
var dict_to_fields = helpers.dict_to_fields;
var uuid = require('../uuid');
var compute_oid_uuid = uuid.compute_oid_uuid;

// ProtocolBuffers encodes itself automatically through the reflection
// API

function build_test_msg(d) {
    var msg = new message.Message();
    msg.timestamp = DateToNano(d);

    msg.type = 'foo';

    var fields = dict_to_fields({name: 'bar', value: 42});
    for (var i = 0; i < fields.length; i++) {
        msg.fields.push(fields[i]);
    }

    msg.uuid = '0000000000000000';
    var msg_encoded = msg.encode();
    msg.uuid = compute_oid_uuid(msg_encoded.toBuffer());
    return msg;
}

describe('json', function() {
    var d = new Date(Date.UTC(2013,1,1));
    var msg = build_test_msg(d);
    it('encodes json correctly', function() {
        var serialized = encoders.jsonEncoder.encode(msg);
        var expected = "{\"uuid\":\"bJYrLoc/XZ2TCh9Qc+k6CA==\",\"timestamp\":1359676800000000000,\"type\":\"foo\",\"logger\":null,\"severity\":null,\"payload\":null,\"env_version\":null,\"pid\":null,\"hostname\":null,\"fields\":[{\"name\":\"name\",\"value_type\":0,\"value_format\":0,\"value_string\":[\"bar\"]},{\"name\":\"value\",\"value_type\":2,\"value_format\":0,\"value_integer\":[42]}]}";

        expect(serialized.toString('utf8')).toEqual(expected);
    });
});
