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

var configModule = require('../config.js');

var m_helpers = require('../message/helpers');

var path = require('path');
module.paths.push(path.resolve('..'))
var makeMockStreamString = './streams:debugStreamFactory';

var payloadIsFilterProvider = function(config) {
    var payloadIsFilter = function(msg) {
        if (config.payload === msg.payload) {
            return false;
        };
        return true;
    };
    return payloadIsFilter;
};
var payloadIsFilterString = './tests/config.spec:payloadIsFilterProvider';

var showLoggerProvider = function(pluginConfig) {
    var label = pluginConfig.label !== undefined ? pluginConfig.label : 'logger';
    var showLogger = function() {
        return label + ': ' + this.logger;
    };
    return showLogger
};
var showLoggerProviderString = './tests/config.spec:showLoggerProvider'

describe('config', function() {

    it('sets up a basic client', function() {
        var config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'severity': 5
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        expect(client.logger).toEqual(config.logger);
        expect(client.severity).toEqual(config.severity);

        var msgOpts = {'payload': 'whadidyusay?'};
        var type = 'test-type'

        client.heka(type, msgOpts);

        expect(client.stream.msgs.length).toEqual(1);

        var wire_buff = client.stream.msgs.pop();
        var decoded = m_helpers.decode_message(wire_buff);
        var header = decoded['header'];
        var msg = decoded['message'];
        expect(msg.type).toEqual(type);
        expect(msg.payload).toEqual(msgOpts.payload);
        expect(msg.severity).toEqual(config.severity);
    });

    it('sets up filters', function() {
        var filterConfig = {'payload': 'nay!'};
        var config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'filters': [[payloadIsFilterString, filterConfig]]
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        var filters = client.filters;
        expect(filters.length).toEqual(1);
        client.heka('test', {'payload': 'aye'});
        client.heka('test', {'payload': 'nay!'});
        expect(client.stream.msgs.length).toEqual(1);

        var wire_buff = client.stream.msgs.pop();
        var decoded = m_helpers.decode_message(wire_buff);
        expect(decoded['message'].payload).toEqual('aye');
    });

    it('sets up plugins', function() {
        var customLabel = 'LOGGER, YO';
        var config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'plugins': {'showLogger': {'provider': showLoggerProviderString,
                                       'label': customLabel}}
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        expect(client._dynamicMethods['showLogger']).not.toBe(undefined);
        expect(client.showLogger()).toEqual(customLabel+': '+'test');
    });

    it('honors plugin `override` settings', function() {
        var customLabel = 'LOGGER, YO'
        var config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'plugins': {'incr': {'provider': showLoggerProviderString,
                                 'label': customLabel}}
        };
        var jsonConfig = JSON.stringify(config);
        expect(function() {
            configModule.clientFromJsonConfig(jsonConfig);
        }).toThrow(new Error('The name incr is already in use'));
        config.plugins.incr.override = true;
        jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        expect(client._dynamicMethods['incr']).not.toBe(undefined);
        expect(client.incr()).toEqual(customLabel+': '+'test');
    });

    it('raises errors when no factory attribute exists', function() {
        var config = {
            'stream': {}
        };
        var jsonConfig = JSON.stringify(config);
        expect(function() {
            configModule.clientFromJsonConfig(jsonConfig);
        }).toThrow(new Error("factory attribute is missing from config"));

    });

    it('sets up filters and plugins', function() {
        var customLabel = 'LOGGER, YO'
        var filterConfig = {'payload': 'nay!'};
        var config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'filters': [[payloadIsFilterString, filterConfig]],
            'plugins': {'showLogger': {'provider': showLoggerProviderString,
                                       'label': customLabel}}
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        var filters = client.filters;
        expect(filters.length).toEqual(1);
        client.heka('test', {'payload': 'aye'});
        client.heka('test', {'payload': 'nay!'});
        expect(client.stream.msgs.length).toEqual(1);

        var wire_buff = client.stream.msgs.pop();
        var decoded = m_helpers.decode_message(wire_buff);
        var header = decoded['header'];
        var msg = decoded['message'];

        expect(msg.payload).toEqual('aye');
        expect(client._dynamicMethods['showLogger']).not.toBe(undefined);
        expect(client.showLogger()).toEqual(customLabel+': '+'test');

    });

});

exports.payloadIsFilterProvider = payloadIsFilterProvider;
exports.showLoggerProvider = showLoggerProvider;
