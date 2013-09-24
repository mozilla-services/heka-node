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
 *
 ***** END LICENSE BLOCK *****
 */
"use strict";

var uuid = require('../uuid');
var ByteBuffer = require('bytebuffer');

describe('uuid', function() {
    it('encodes hex to binary properly', function(){
        var actual = uuid.hex_to_bin('0a1d');
        expect(actual.toHex()).toEqual("<0A 1D>");
    });

    it('strips out non-hex characters before conversion to binary', function(){
        var actual = uuid.hex_to_bin('ba209999-0c6c-11d2-97cf-00c04f8eea45');
        var expected = "<BA 20 99 99 0C 6C 11 D2 97 CF 00 C0 4F 8E EA 45>";
        expect(actual.toHex()).toEqual(expected);
    });

    it('writes bytebuffer correctly', function() {
        var bb = uuid.hex_to_bin('12345678-ffaabb12-01234567-890abcde');
        expect(bb.toHex()).toEqual("<12 34 56 78 FF AA BB 12 01 23 45 67 89 0A BC DE>");
    });

});
