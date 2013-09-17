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

/*
 * Encoders are classes implement an encode(Message) method and
 * serialize to a node.js Buffer.
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


var ProtoBufEncoder = function() {
    this.setup();
}

ProtoBufEncoder.prototype.setup = function() {
}

ProtoBufEncoder.prototype.encode = function(msg) {
    return msg.encode().toBuffer()
}

exports.protobufEncoder = new ProtoBufEncoder();
