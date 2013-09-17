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

var severityMaxProvider = function(config) {
    var severityMax = function(msg) {
        if (msg['severity'] > config['severity']) {
            return false;
        };
        return true;
    };
    return severityMax;
};


var typeBlacklistProvider = function(config) {
    var typeBlacklist = function(msg) {
        if (msg['type'] in config['types']) {
            return false;
        };
        return true;
    };
    return typeBlacklist;
};


var typeWhitelistProvider = function(config) {
    var typeWhitelist = function(msg) {
        if (!(msg['type'] in config['types'])) {
            return false;
        };
        return true;
    };
    return typeWhitelist;
};


var typeSeverityMaxProvider = function(config) {
    var typeFilters = {};
    var typeName = null;
    for (typeName in config.types) {
        if (config.types.hasOwnProperty(typeName)) {
            var typeConfig = config.types[typeName];
            typeFilters[typeName] = severityMaxProvider(typeConfig);
        };
    };

    var typeSeverityMax = function(msg) {
        var severityMax = typeFilters[msg['type']];
        if (severityMax === undefined) {
            return true;
        };
        return severityMax(msg);
    };
    return typeSeverityMax;
};


exports.severityMaxProvider = severityMaxProvider;
exports.typeBlacklistProvider = typeBlacklistProvider;
exports.typeWhitelistProvider = typeWhitelistProvider;
exports.typeSeverityMaxProvider = typeSeverityMaxProvider;
