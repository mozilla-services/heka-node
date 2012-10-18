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


try
{
    var msgpack = require('msgpack');
} catch(err) {
    var msgpack = null;
}

var jsonEncoder = function(data) {
    return JSON.stringify(data) + "\n";
}

var msgpackEncoder = function(data) {
    return msgpack.pack(data);
}

exports.msgpackEncoder = msgpackEncoder;
exports.jsonEncoder = jsonEncoder;
