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
            var config = {'severity': i};
            var severityMax = filters.severityMaxProvider(config);
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

    it('filters correctly', function() {
        var config = {'types': {'foo': 0}};
        var typeBlacklist = filters.typeBlacklistProvider(config);
        var trues = countTrues(typeBlacklist, msgs);
        expect(trues).toEqual(3);

        config = {'types': {'foo': 0, 'bar': 0, 'baz': 0}};
        typeBlacklist = filters.typeBlacklistProvider(config);
        trues = countTrues(typeBlacklist, msgs);
        expect(trues).toEqual(1);
    });
});


describe('typeWhitelist filter', function() {

    var msgs = [new Message({'type': 'foo'}),
                new Message({'type': 'bar'}),
                new Message({'type': 'baz'}),
                new Message({'type': 'bawlp'})];

    it('filters correctly', function() {
        var config = {'types': {'foo': 0}};
        var typeWhitelist = filters.typeWhitelistProvider(config);
        var trues = countTrues(typeWhitelist, msgs);
        expect(trues).toEqual(1);

        config = {'types': {'foo': 0, 'bar': 0, 'baz': 0}};
        typeWhitelist = filters.typeWhitelistProvider(config);
        trues = countTrues(typeWhitelist, msgs);
        expect(trues).toEqual(3);
    });
});


describe('typeSeverityMax filter', function() {

    var msgs = [new Message({'type': 'foo', 'severity': 0}),
                new Message({'type': 'foo', 'severity': 6}),
                new Message({'type': 'bar', 'severity': 0}),
                new Message({'type': 'bar', 'severity': 6})];

    if('filters correctly', function() {
        var config = {'types': {'foo': {'severity': 3}}};
        var typeSeverityMax = filters.typeSeverityMaxProvider(config);
        var trues = countTrues(typeSeverityMax, msgs);
        expect(trues).toEqual(3);

        config['types']['bar'] = {'severity': 3};
        trues = countTrues(typeSeverityMax, msgs);
        expect(trues).toEqual(2);
    });
});
