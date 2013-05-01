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

var Header = require('../message').Header;

/*
 * Encoders are classes implement an encode(msg) method and
 * serialize to a node.js Buffer.
 *
 * They must also export an attribute `encoder_type` which
 * provides a lookup value into the ProtocolBuffer definition
 * in Header.MessageEncoding
 * 
 */

var PB_NAMETYPE_TO_INT = {'STRING': 0,
                          'BYTES': 1,
                          'INTEGER': 2,
                          'DOUBLE': 3,
                          'BOOL': 4};

var PB_TYPEMAP = {0: 'STRING',
                  1: 'BYTES',
                  2: 'INTEGER',
                  3: 'DOUBLE',
                  4: 'BOOL'};

var PB_FIELDMAP = {0: 'value_string',
                   1: 'value_bytes',
                   2: 'value_integer',
                   3: 'value_double',
                   4: 'value_bool'};

var JSONEncoder = function() {
    this.setup();
}

JSONEncoder.prototype.setup = function() {
    this.encoder_type = Header.MessageEncoding.JSON;
}

JSONEncoder.prototype.encode = function(msg) {

    jdata = {}
    jdata['uuid'] = new Buffer(msg.uuid).toString('base64');
    jdata['timestamp'] = msg.timestamp;
    jdata['type'] = msg.type;
    jdata['logger'] = msg.logger;
    jdata['severity'] = msg.severity;
    jdata['payload'] = msg.payload;
    jdata['env_version'] = msg.env_version;
    jdata['pid'] = msg.pid;
    jdata['hostname'] = msg.hostname;
    jdata['fields'] = [];

    for (var i = 0; i < msg.fields.length; i++) {
        var f = msg.fields[i];

        var field_dict = {'value_type': f.value_type, 'value_format': 0};
        if (f.value_string.length !== 0) {
            field_dict['value_string'] = [f.value_string[0]];
            jdata['fields'].push(field_dict);
        } else if (f.value_bytes.length !== 0) {
            field_dict['value_bytes'] = [(new Buffer(f.value_bytes[0])).toString('base64')];
            jdata['fields'].push(field_dict);
        } else if (f.value_integer.length !== 0) {
            field_dict['value_integer'] = [f.value_integer[0]];
            jdata['fields'].push(field_dict);
        } else if (f.value_double.length !== 0) {
            field_dict['value_double'] = [f.value_double[0]];
            jdata['fields'].push(field_dict);
        } else if (f.value_bool.length !== 0) {
            field_dict['value_bool'] = [f.value_bool[0]];
            jdata['fields'].push(field_dict);
        }
    }

    var data = JSON.stringify(jdata)

    return new Buffer(data);
}



var ProtoBufEncoder = function() {
    this.setup();
}

ProtoBufEncoder.prototype.setup = function() {
    this.encoder_type = Header.MessageEncoding.PROTOCOL_BUFFER;
}

ProtoBufEncoder.prototype.encode = function(msg) {
    return msg.encode().toBuffer()
}

exports.jsonEncoder = new JSONEncoder();
exports.protobufEncoder = new ProtoBufEncoder();
