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


/*
* Fetch a module attribute by name and return the actual object (usually
* a function) to which the name refers.
*
* @param name: String referring to the callable. Should consist of a module
*              name (can be a bare name or a file path, anything that will
*              work with `require`) and an exported module attribute name
*              separated by a colon. For example, this function itself would
*              be specified by './config:resolveName'.
*/
var resolveName = function(name) {
    var pieces = name.split(':');
    var module = require(pieces[0]);

    var fn_path = pieces[1].split(".");

    var fn = null;
    fn = module[fn_path.shift()];
    for (; fn_path.length > 0;) {
        fn = fn[fn_path.shift()];
    }

    if (fn === undefined) {
        var msg = "ERROR loading: ["+pieces[0]+":" + pieces[1] + "]. Make sure you've exported it properly.";
        throw new Error(msg);
    }
    return fn;
};

exports.resolveName = resolveName;
