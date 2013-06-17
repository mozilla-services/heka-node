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

var message = require("../message");
var Field = message.Field;

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
        var f = new Field();

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
            f.value_type = Field.ValueType.INTEGER;
            push_value(is_array, f.value_integer, v, v0);
            results.push(f);
            continue;
        } else if (isFloat(v0)) {
            f.value_type = Field.ValueType.DOUBLE;
            push_value(is_array, f.value_double, v, v0);
            results.push(f);
            continue;
        } else if (typeof v0 === 'string') {
            f.value_type = Field.ValueType.STRING;
            push_value(is_array, f.value_string, v, v0);
            results.push(f);
            continue;
        } else if (typeof v0 === 'object') {
            dict_to_fields(v0, prefix=full_name);
        } else {
            f.value_type = Field.ValueType.BOOL;
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

exports.toArrayBuffer = toArrayBuffer;
exports.dict_to_fields = dict_to_fields;
