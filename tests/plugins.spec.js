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


var _ = require('underscore');
var heka = require('../client.js');
var configModule = require('../config.js');

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

var makeMockSender = function(senderConfig) {
    if (typeof(senderConfig.foo) !== 'undefined') {
        mockSender.foo = senderConfig.foo;
    };
    return mockSender;
};
var makeMockSenderString = './tests/plugins.spec.js:makeMockSender';

var showLoggerProvider = function(pluginConfig) {
    var label = pluginConfig.label !== undefined ? pluginConfig.label : 'logger';
    var showLogger = function() {
        return label + ': ' + this.logger;
    };
    return showLogger
};
var showLoggerProviderString = './tests/plugins.spec.js:showLoggerProvider'

describe("CEF plugin", function() {
    it("is loadable", function() {
        var customLabel = 'LOGGER, YO';
        var config = {
            'sender': {'factory': makeMockSenderString},
            'logger': 'test',
            'plugins': {'showLogger': {'provider': showLoggerProviderString,
                                       'label': customLabel}}
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        expect(client._dynamicMethods['showLogger']).not.toBe(undefined);
        expect(client.showLogger()).toEqual(customLabel+': '+'test');
    });
});

exports.makeMockSender = makeMockSender
exports.showLoggerProvider = showLoggerProvider
