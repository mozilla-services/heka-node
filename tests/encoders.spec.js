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

var msgpack = require('msgpack');
var encoders = require('../senders/encoders');

describe('msgpack', function() {

    if (typeof msgpack !== 'undefined') {
        it('encodes msgpack correctly', function() {
            var expected = {foo: 42};
            var serialized = encoders.msgpackEncoder(expected);
            expect(msgpack.unpack(serialized)).toEqual(expected);
        });
    }

});
