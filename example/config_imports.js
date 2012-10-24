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

"use strict"

var metlog = require('metlog');
var _ = require('underscore');

var showLoggerProvider = function(pluginConfig) {
    var label = pluginConfig.label !== undefined ? pluginConfig.label : 'logger';
    var showLogger = function() {
        // This logging method just returns the label and logger name
        return label + ': ' + this.logger;
    };
    return showLogger
};


var makeMockSender = function(senderConfig) {
    var mockSender = {
        foo: 'bar',
        msgs: [],
        sendMessage: function(msg) {
            this.msgs.push(msg);
        },
        reset: function() {
            this.foo = 'bar';
            this.msgs = [];
        }
    };

    if (typeof(senderConfig.foo) !== 'undefined') {
        mockSender.foo = senderConfig.foo;
    };
    return mockSender;
};
var payloadIsFilterProvider = function(config) {
    var payloadIsFilter = function(msg) {
        if (config.payload === msg.payload) {
            return false;
        };
        return true;
    };
    return payloadIsFilter;
};

exports.makeMockSender = makeMockSender;
exports.payloadIsFilterProvider = payloadIsFilterProvider;
exports.showLoggerProvider = showLoggerProvider;
