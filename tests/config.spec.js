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

var configModule = require('../config');

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
var makeMockSenderString = './tests/config.spec:makeMockSender';

var payloadIsFilter = function(client, config, msg) {
    if (config.payload === msg.payload) {
        return false;
    };
    return true;
};
var payloadIsFilterString = './tests/config.spec:payloadIsFilter';

var showLoggerProvider = function(pluginConfig) {
    var label = pluginConfig.label !== undefined ? pluginConfig.label : 'logger';
    var showLogger = function() {
        return label + ': ' + this.logger;
    };
    return showLogger
};
var showLoggerProviderString = './tests/config.spec:showLoggerProvider'

describe('config', function() {

    beforeEach(function() {
        mockSender.reset();
    });

    it('sets up a basic client', function() {
        var config = {
            'sender': {'factory': makeMockSenderString},
            'logger': 'test',
            'severity': 5
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        expect(client.logger).toEqual(config.logger);
        expect(client.sender).toBe(mockSender);
        expect(client.sender.foo).toEqual('bar');
        expect(client.severity).toEqual(config.severity);
        var msgOpts = {'payload': 'whadidyusay?'};
        var type = 'test-type'
        client.metlog(type, msgOpts);
        expect(client.sender.msgs.length).toEqual(1);
        var msg = client.sender.msgs[0]
        expect(msg.type).toEqual(type);
        expect(msg.payload).toEqual(msgOpts.payload);
        expect(msg.severity).toEqual(config.severity);
    });

    it('configures sender correctly', function() {
        var config = {
            'sender': {'factory': makeMockSenderString,
                       'foo': 'bawlp'},
            'logger': 'test'
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        expect(mockSender.foo).toEqual('bawlp');
    });

    it('sets, updates, and clears globals', function() {
        var mergeObjects = function(obs) {
            var result = {};
            for (var i=0; i<obs.length; i++) {
                var ob = obs[i];
                for (var attr in ob) {
                    if (ob.hasOwnProperty(attr)) {
                        result[attr] = ob[attr];
                    };
                };
            };
            return result;
        };

        var globalParam1 = {'some': 'globalvalue'};
        var config1 = {
            'sender': {'factory': makeMockSenderString},
            'logger': 'test',
            'global': globalParam1
        };
        var jsonConfig = JSON.stringify(config1);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        expect(configModule.getGlobalConfig()).toEqual(globalParam1);

        var globalParam2 = {'another': 'globalsetting'};
        var config2 = {
            'sender': {'factory': makeMockSenderString},
            'logger': 'test',
            'global': globalParam2
        };
        jsonConfig = JSON.stringify(config2)
        client = configModule.clientFromJsonConfig(jsonConfig, client);
        var expected = mergeObjects([globalParam1, globalParam2]);
        expect(configModule.getGlobalConfig()).toEqual(expected);

        client = configModule.clientFromJsonConfig(jsonConfig, client, true);
        expect(configModule.getGlobalConfig()).toEqual(globalParam2);
    });

    it('sets up filters', function() {
        var filterConfig = {'payload': 'nay!'};
        var config = {
            'sender': {'factory': makeMockSenderString},
            'logger': 'test',
            'filters': [[payloadIsFilterString, filterConfig]]
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        var filters = client.filters;
        expect(filters.length).toEqual(1);
        expect(filters[0].fn).toBe(payloadIsFilter);
        expect(filters[0].config).toEqual(filterConfig);
        client.metlog('test', {'payload': 'aye'});
        client.metlog('test', {'payload': 'nay!'});
        expect(client.sender.msgs.length).toEqual(1);
        expect(client.sender.msgs[0].payload).toEqual('aye');
    });

    it('sets up plugins', function() {
        var customLabel = 'LOGGER, YO'
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

exports.makeMockSender = makeMockSender;
exports.payloadIsFilter = payloadIsFilter;
exports.showLoggerProvider = showLoggerProvider;