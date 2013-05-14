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

var ProtoBuf = require("protobufjs");

var heka = require('../client');
var path = require('path');

var proto_path = path.join(__dirname, '../protobuf/message.proto');

var builder = ProtoBuf.protoFromFile(proto_path);
var message = builder.build("message");

var MAX_HEADER_SIZE = 255
var MAX_MESSAGE_SIZE = 64 * 1024
var RECORD_SEPARATOR = 0x1e
var UNIT_SEPARATOR = 0x1f
var UUID_SIZE = 16

/**********************************************/

// Constants useful for packing message bytes
exports.MAX_HEADER_SIZE = MAX_HEADER_SIZE
exports.MAX_MESSAGE_SIZE = MAX_MESSAGE_SIZE
exports.RECORD_SEPARATOR = RECORD_SEPARATOR
exports.UNIT_SEPARATOR = UNIT_SEPARATOR
exports.UUID_SIZE = UUID_SIZE

// Protocol Buffer definitions
exports.Message = message.Message;
exports.Header = message.Header;
exports.Field = message.Field;

