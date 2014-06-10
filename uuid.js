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

var ByteBuffer = require('bytebuffer');

var NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
var NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
var NAMESPACE_OID = '6ba7b812-9dad-11d1-80b4-00c04fd430c8';
var NAMESPACE_X500 = '6ba7b814-9dad-11d1-80b4-00c04fd430c8';

var uuid_v5 = require('./superscore_uuid.js').uuid_v5;

/*
 * Convert a hexadecimal UUID to a bytebuffer in read-only mode.
 */
function hex_to_bin(uuid) {
    var hex = uuid.replace(/[\-{}]/g, '');
    var buff_len = hex.length/2;
    var bb = new ByteBuffer(buff_len);
    for (var i = 0; i < hex.length; i += 2)
    {   // Convert each character to a bit
        bb.writeUint8(parseInt(hex.charAt(i) + hex.charAt(i + 1), 16));
    }
    bb.flip();
    return bb;
};

/*
 * Compute a UUID based on object data
 */
function compute_oid_uuid(data)
{
    return hex_to_bin(uuid_v5(data, NAMESPACE_OID));
}

exports.compute_oid_uuid = compute_oid_uuid;
exports.hex_to_bin = hex_to_bin;
