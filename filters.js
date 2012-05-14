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

var severityMax = function(client, config, msg) {
    if (msg['severity'] > config['severity']) {
        return false;
    };
    return true;
};


var typeBlacklist = function(client, config, msg) {
    if (msg['type'] in config['types']) {
        return false;
    };
    return true;
};


var typeWhitelist = function(client, config, msg) {
    if (!(msg['type'] in config['types'])) {
        return false;
    };
    return true;
};


var typeSeverityMax = function(client, config, msg) {
    typeSpec = config['types'][msg['type']];
    if (typeof(typeSpec) === 'undefined') {
        return true;
    };
    return severityMax(client, typeSpec, msg);
};

exports.severityMax = severityMax;
exports.typeBlacklist = typeBlacklist;
exports.typeWhitelist = typeWhitelist;
exports.typeSeverityMax = typeSeverityMax;
