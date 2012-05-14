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

var filters = require('../filters');


var countTrues = function(filter, config, msgs) {
    var trues = 0;
    for (var i=0; i<msgs.length; i++) {
        if (filter('client', config, msgs[i])) {
            trues++;
        };
    };
    return trues;
};


describe('severityMax filter', function() {

    var msgs = [{'severity': 0}, {'severity': 1}, {'severity': 2},
                {'severity': 3}, {'severity': 4}, {'severity': 5},
                {'severity': 6}, {'severity': 7}];

    it('filters correctly', function() {
        for (var i=0; i<msgs.length; i++) {
            var config = {'severity': i};
            for (var j=0; j<msgs.length; j++) {
                var passed = filters.severityMax('client', config, msgs[j]);
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

    var msgs = [{'type': 'foo'}, {'type': 'bar'}, {'type': 'baz'},
                {'type': 'bawlp'}];

    it('filters correctly', function() {
        var config = {'types': {'foo': 0}};
        var trues = countTrues(filters.typeBlacklist, config, msgs);
        expect(trues).toEqual(3);

        config = {'types': {'foo': 0, 'bar': 0, 'baz': 0}};
        trues = countTrues(filters.typeBlacklist, config, msgs);
        expect(trues).toEqual(1);
    });
});


describe('typeWhitelist filter', function() {

    var msgs = [{'type': 'foo'}, {'type': 'bar'}, {'type': 'baz'},
                {'type': 'bawlp'}];

    it('filters correctly', function() {
        var config = {'types': {'foo': 0}};
        var trues = countTrues(filters.typeWhitelist, config, msgs);
        expect(trues).toEqual(1);

        config = {'types': {'foo': 0, 'bar': 0, 'baz': 0}};
        trues = countTrues(filters.typeWhitelist, config, msgs);
        expect(trues).toEqual(3);
    });
});


describe('typeSeverityMax filter', function() {

    var msgs = [{'type': 'foo', 'severity': 0}, {'type': 'foo', 'severity': 6},
                {'type': 'bar', 'severity': 0}, {'type': 'bar', 'severity': 6}];

    if('filters correctly', function() {
        var config = {'types': {'foo': {'severity': 3}}};
        var trues = countTrues(filters.typeSeverityMax, config, msgs);
        expect(trues).toEqual(3);

        config['types']['bar'] = {'severity': 3};
        trues = countTrues(filters.typeSeverityMax, config, msgs);
        expect(trues).toEqual(2);
    });
});