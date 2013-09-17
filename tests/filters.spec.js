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

var filters = require('../filters.js');
var configModule = require('../config.js');
var Message = require('../message').Message;

var countTrues = function(filter, msgs) {
    var trues = 0;
    for (var i=0; i<msgs.length; i++) {
        if (filter(msgs[i])) {
            trues++;
        };
    };
    return trues;
};


var makeMockStreamString = './streams:debugStreamFactory';

describe('typeSeverityMax filter', function() {

    var msgs = [new Message({'type': 'foo', 'severity': 0}),
                new Message({'type': 'foo', 'severity': 6}),
                new Message({'type': 'bar', 'severity': 0}),
                new Message({'type': 'bar', 'severity': 6})];

    var typeSeverityMaxProvider = './filters:typeSeverityMaxProvider';

    var filterConfig = {'types': {'foo': {'severity': 3}}};
    var config = {
        'stream': {'factory': makeMockStreamString},
        'logger': 'test',
        'severity': 5,
        'filters': [[typeSeverityMaxProvider, filterConfig]]
    };

    it('allows (foo and severity > 3) | (any bar message)', function() {
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        var typeSeverityMax = client.filters[0];

        var trues = countTrues(typeSeverityMax, msgs);
        expect(trues).toEqual(3);
    });

    it('allows (foo and severity > 3) | (bar and severity > 3)', function() {
        filterConfig['types']['bar'] = {'severity': 3};
        config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'severity': 5,
            'filters': [[typeSeverityMaxProvider, filterConfig]]
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        var typeSeverityMax = client.filters[0];

        var trues = countTrues(typeSeverityMax, msgs);
        expect(trues).toEqual(2);
    });
});

describe('severityMax filter', function() {

    var msgs = [new Message({'severity': 0}),
                new Message({'severity': 1}),
                new Message({'severity': 2}),
                new Message({'severity': 3}),
                new Message({'severity': 4}),
                new Message({'severity': 5}),
                new Message({'severity': 6}),
                new Message({'severity': 7})];


    it('filters correctly', function() {

        for (var i=0; i<msgs.length; i++) {
            var severityMaxProvider = './filters:severityMaxProvider';
            var filterConfig = {'severity': i};
            var config = {
                'stream': {'factory': makeMockStreamString},
                'logger': 'test',
                'severity': 5,
                'filters': [[severityMaxProvider, filterConfig]]
            };
            var jsonConfig = JSON.stringify(config);
            var client = configModule.clientFromJsonConfig(jsonConfig);
            var severityMax = client.filters[0];

            for (var j=0; j<msgs.length; j++) {
                var passed = severityMax(msgs[j]);
                if (j > i) {
                    expect(passed).toEqual(false);
                } else {
                    expect(passed).toEqual(true);
                };
            };
        };
    });
});


describe('typeBlacklist filter', function() {
    var msgs = [new Message({'type': 'foo'}),
                new Message({'type': 'bar'}),
                new Message({'type': 'baz'}),
                new Message({'type': 'bawlp'})];

    var typeBlacklistProvider = './filters:typeBlacklistProvider';
    it('filters foo messages out', function() {
        var filterConfig = {'types': {'foo': 0}};
        var config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'severity': 5,
            'filters': [[typeBlacklistProvider, filterConfig]]
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        var typeBlacklist = client.filters[0];

        var trues = countTrues(typeBlacklist, msgs);
        expect(trues).toEqual(3);
    });

    it('filters foo, bar and baz  messages out', function() {
        var filterConfig = {'types': {'foo': 0, 'bar': 0, 'baz': 0}};
        var config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'severity': 5,
            'filters': [[typeBlacklistProvider, filterConfig]]
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        var typeBlacklist = client.filters[0];

        var trues = countTrues(typeBlacklist, msgs);
        expect(trues).toEqual(1);
    });
});

describe('typeWhitelist filter', function() {

    var msgs = [new Message({'type': 'foo'}),
                new Message({'type': 'bar'}),
                new Message({'type': 'baz'}),
                new Message({'type': 'bawlp'})];

    var typeWhitelistProvider = './filters:typeWhitelistProvider';

    it('allows only foo messages', function() {
        var filterConfig = {'types': {'foo': 0}};

        var config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'severity': 5,
            'filters': [[typeWhitelistProvider, filterConfig]]
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        var typeWhitelist = client.filters[0];

        var trues = countTrues(typeWhitelist, msgs);
        expect(trues).toEqual(1);
    });

    it('allows foo, bar and baz messages', function() {
        var filterConfig = {'types': {'foo': 0, 'bar': 0, 'baz': 0}};
        var config = {
            'stream': {'factory': makeMockStreamString},
            'logger': 'test',
            'severity': 5,
            'filters': [[typeWhitelistProvider, filterConfig]]
        };
        var jsonConfig = JSON.stringify(config);
        var client = configModule.clientFromJsonConfig(jsonConfig);
        var typeWhitelist = client.filters[0];

        var trues = countTrues(typeWhitelist, msgs);
        expect(trues).toEqual(3);
    });
});


