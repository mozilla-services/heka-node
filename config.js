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
var clientModule = require('./client');
var resolver = require('./resolver');

var resolveName = resolver.resolveName;

var getattr = function(obj, attr, defaultValue) {
    defaultValue = typeof(defaultValue) !== 'undefined' ? defaultValue : {};
    var value = typeof(obj[attr]) !== 'undefined' ? obj[attr] : defaultValue;
    return value;
};


var streamFromConfig = function(config) {
    if (typeof(config.factory) == 'undefined')
    {
        throw new Error("factory attribute is missing from config");
    }

    var streamFactory = resolveName(config.factory);
    if (streamFactory === undefined) {
        throw new Error("Unable to resolve the streamFactory: ["+config.factory+"]")
    }
    var stream = streamFactory(config);
    return stream;
};

var clientFromJsonConfig = function(config, client) {
    config = JSON.parse(config);
    var streamConfig = getattr(config, 'stream');
    var stream = streamFromConfig(streamConfig);
    var logger = getattr(config, 'logger', '');
    var severity = getattr(config, 'severity', 6);
    var disabledTimers = getattr(config, 'disabledTimers', []);
    var plugins = getattr(config, 'plugins');

    var filterNames = getattr(config, 'filters', []);
    var filters = [];
    for (var i=0; i<filterNames.length; i++) {
        var provider = resolveName(filterNames[i][0]);
        var filterfn = provider(filterNames[i][1]);
        filters.push(filterfn);
    };

    if (typeof(client) === 'undefined') {
        client = new clientModule.HekaClient(stream, logger, severity,
                                               disabledTimers, filters);
    } else {
        client.setup(stream, logger, severity, disabledTimers, filters);
    };

    for (var name in plugins) {
        if (plugins.hasOwnProperty(name)) {
            var pluginConfig = plugins[name];
            var provider = resolveName(pluginConfig.provider);
            var pluginMethod = provider(pluginConfig);
            client.addMethod(name, pluginMethod, pluginConfig.override);
        };
    };

    return client;
};

exports.resolveName = resolveName;
exports.clientFromJsonConfig = clientFromJsonConfig;
