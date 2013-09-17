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
 *  Victor Ng (vng@mozilla.com)
 *
 ***** END LICENSE BLOCK *****
 */
"use strict";

var message = require("./index.js");
var ByteBuffer = require('bytebuffer');

var push_value = function(is_array, f_value, v, v0) {
    if (is_array) {
        for (var i = 0; i < v.length; i++) {
            f_value.push(v[i]);
        }
    } else {
        f_value.push(v0);
    }
}

var dict_to_fields = function (field_dict, prefix)  {
    var results = [];
    for (var k in field_dict) {
        var v = field_dict[k];
        var v0 = null;
        var f = new message.Field();

        var full_name = null;

        if (prefix === undefined) {
            full_name = k;
        } else  {
            full_name = prefix + "." + k;
        }

        f.name = full_name;
        f.representation = "";

        var is_array = false;
        if (v instanceof Array) {
            is_array = true;
            v0 = v[0];
        } else {
            v0 = v;
        }

        if (isInt(v0)) {
            f.value_type = message.Field.ValueType.INTEGER;
            push_value(is_array, f.value_integer, v, v0);
            results.push(f);
            continue;
        } else if (isFloat(v0)) {
            f.value_type = message.Field.ValueType.DOUBLE;
            push_value(is_array, f.value_double, v, v0);
            results.push(f);
            continue;
        } else if (typeof v0 === 'string') {
            f.value_type = message.Field.ValueType.STRING;
            push_value(is_array, f.value_string, v, v0);
            results.push(f);
            continue;
        } else if (typeof v0 === 'object') {
            dict_to_fields(v0, prefix=full_name);
        } else {
            f.value_type = message.Field.ValueType.BOOL;
            push_value(is_array, f.value_bool, v, v0);
            results.push(f);
            continue;
        }
    }
    return results;
}

var isInt = function(n) {
    return typeof n === 'number' && n % 1 == 0;
}

var isFloat = function(n) {
    return typeof n === 'number' && n % 1 != 0;
}


/*
 * Protobuf.js internally uses array
 */
function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; i++) {
        view[i] = buffer[i];
    }
    return ab;
}

// Convert from ArrayBuffer to Node.js Buffer
function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}

function decode_message(bytes_buffer) {
    /*
     * Decode theheader and message object
     */
    var header_len = bytes_buffer[1];
    var header_bytes_buffer = bytes_buffer.slice(2,2+header_len);

    //  Now double check the header
    var header_bb = ByteBuffer.wrap(header_bytes_buffer);
    var header = message.Header.decode(header_bb);
    var msg = message.Message.decode(ByteBuffer.wrap(bytes_buffer.slice(header_len+3)));
    return {'header': header, 'message': msg};
}

function compute_hex(array_buff) {
    var hex_values = [];
    for (var i = 0; i < array_buff.byteLength; i++) {
        var hex_val = Number(array_buff[i]).toString(16);
        if (hex_val.length < 2) {
            hex_val = '0' + hex_val;
        }
        hex_values = hex_values.concat(hex_val);
    }
    return hex_values.join(":");
}


exports.toArrayBuffer = toArrayBuffer;
exports.toBuffer = toBuffer;
exports.dict_to_fields = dict_to_fields;
exports.decode_message = decode_message;
exports.compute_hex = compute_hex;
