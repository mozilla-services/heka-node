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

describe('uuid', function() {
    it('encodes hex to binary properly', function(){
        var actual = uuid.hex_to_bin('0a1d');
        var expected = [0x0a, 0x1d];
        expect(actual.length).toEqual(expected.length);
        expect(actual).toEqual(String.fromCharCode(0x0a, 0x1d));
    });

    it('strips out non-hex characters before conversion to binary', function(){
        var actual = uuid.hex_to_bin('ba209999-0c6c-11d2-97cf-00c04f8eea45');
        var expected = [0xba, 0x20, 0x99, 0x99, 0x0c, 0x6c, 0x11, 0xd2, 0x97, 0xcf, 0x00, 0xc0, 0x4f, 0x8e, 0xea, 0x45];
        expect(actual.length).toEqual(expected.length);

        expect(actual).toEqual(String.fromCharCode(
                        0xba, 0x20, 0x99, 0x99, 0x0c, 0x6c, 0x11, 0xd2, 0x97, 0xcf, 0x00, 0xc0, 0x4f, 0x8e, 0xea, 0x45
                        ));
    });
});
