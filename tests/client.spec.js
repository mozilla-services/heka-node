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
var sys = require('util');
var os = require('os');
var heka = require('../client.js');

var resolver = require('../resolver');
var resolveName = resolver.resolveName;


var helpers = require('../message/helpers');
var dict_to_fields = helpers.dict_to_fields;

var path = require('path');
module.paths.push(path.resolve('..'))

describe('client', function() {
    function makeMockStream() {
        var makeMockStreamString = './streams:debugStreamFactory';
        var streamFactory = resolveName(makeMockStreamString);
        return streamFactory({});
    }
    var mockStream = makeMockStream();

    var loggerVal = 'bogus';
    var client;
    var dateToNano = heka.DateToNano;

    beforeEach(function() {
        client = new heka.HekaClient(mockStream,
            loggerVal,
            heka.SEVERITY.INFORMATIONAL,
            ['disabled_timer_name']
            );
    });

    function block(ms) {
        // naive cpu consuming "sleep", should never be used in real code
        var start = new Date();
        var now;
        do {
            now = new Date();
        } while (now - start < ms);
    };

    function typeFilter(msg) {
        if (msg.type in {'foo':0, 'bar':0}) {
            return false;
        };
        return true;
    };

    it('initializes correctly', function() {
        expect(client.stream).toEqual(mockStream);
        expect(client.logger).toEqual(loggerVal);
        expect(client.severity).toEqual(6);
    });

    it('initializes w alternate defaults', function() {
        var otherLoggerVal = 'sugob';
        var otherSeverity = 3;
        var otherClient = new heka.HekaClient(mockStream, otherLoggerVal, otherSeverity);
        expect(otherClient.stream).toBe(mockStream);
        expect(otherClient.logger).toEqual(otherLoggerVal);
        expect(otherClient.severity).toEqual(otherSeverity);
    });

    it('delivers to sender', function() {
        var timestamp = dateToNano(new Date());
        var type = 'vanilla'
        var payload = 'drippy dreamy icy creamy';
        client.heka(type, {'timestamp': timestamp,
                             'payload': payload});
        expect(mockStream.msgs.length).toEqual(1);
        var wire_buff = mockStream.msgs.pop();
        var decoded = helpers.decode_message(wire_buff);
        var header = decoded['header'];
        var msg = decoded['message'];
        expect(msg.type).toEqual(type);
        
        // TODO: this seem slike a bug in serializing timestamps
        expect(Math.abs(msg.timestamp-timestamp)).toBeLessThan(300);

        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        expect(msg.payload).toEqual(payload);
        expect(msg.fields).toEqual(dict_to_fields({}));
    });

    /*
    it('sends incr message', function() {
        var timestamp = new Date();
        var name = 'counter name';
        client.incr(name, {'timestamp': timestamp});
        expect(mockSender.sent).toEqual(1)
        var msg = mockSender.msgs[mockSender.msgs.length - 1];
        expect(msg.type).toEqual('counter');
        expect(msg.timestamp).toEqual(dateToNano(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual(dict_to_fields({'name': name, 'rate': 1.0}));
        expect(msg.payload).toEqual('1');
    });

    it('formats nanosecond dates properly', function() {
        var timestamp = new Date(Date.UTC(2013,0,1,2,3,4,50));
        expect(dateToNano(timestamp)).toEqual(1357005784050000000);
    });

    it('sends incr different count', function() {
        var timestamp = new Date();
        var name = 'counter name';
        var count = 3;
        client.incr(name, {'timestamp': timestamp,
                           'count': count});
        expect(mockSender.sent).toEqual(1)
        var msg = mockSender.msgs[mockSender.msgs.length - 1];
        expect(msg.type).toEqual('counter');
        expect(msg.timestamp).toEqual(dateToNano(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual(dict_to_fields({'name': name, 'rate': 1.0}));
        expect(msg.payload).toEqual('3');
    });

    it('sends timed message', function() {
        var timestamp = new Date();
        var name = 'timed name';
        var elapsed = 35;
        var diffLogger = 'different'
        client.timer_send(elapsed, name, {'timestamp': timestamp,
                                     'logger': diffLogger});
        expect(mockSender.sent).toEqual(1);
        var msg = mockSender.msgs[mockSender.msgs.length - 1];
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp).toEqual(dateToNano(timestamp));
        expect(msg.logger).toEqual(diffLogger);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual(dict_to_fields({'name': name,
                                    'rate': 1}));
        expect(msg.payload).toEqual(String(elapsed));
    });

    it('honors incr rate', function() {
        var timestamp = new Date();
        var name = 'counter name';

        var rate = 0.1;
        var repeats = 1000;
        for (var i=0; i < repeats; i++) {
            client.incr(name, {'timestamp': timestamp}, rate);
        }
        // this is a very weak test, w/ a small probability of failing incorrectly :(

        // we shouldn't get *twice* as many messages as the upper
        // limit
        expect(mockSender.sent).toBeLessThan(repeats * rate * 2);
        expect(mockSender.sent).toBeGreaterThan(0);
    });

    it('honors timer rate', function() {
        var timestamp = new Date();
        var name = 'timed name';
        var elapsed = 35;
        var rate = 0.1;
        var repeats = 1000;
        for (var i=0; i < repeats; i++) {
            client.timer_send(elapsed, name, {'timestamp': timestamp,
                                         'rate': rate});
        };
        // this is a very weak test, w/ a small probability of failing incorrectly :(

        // we shouldn't get *twice* as many messages as the upper
        // limit
        expect(mockSender.sent).toBeLessThan(repeats * rate * 2);
        expect(mockSender.sent).toBeGreaterThan(0);
    });

    it('can use no options with timer calls', function() {
        var minWait = 40;  // in milliseconds
        var sleeper = function() {
            block(minWait);
        };
        var name = 'decorator';
        var timestamp = new Date();
        var diffSeverity = 4;
        // wrap it
        sleeper = client.timer(sleeper, name);
        // call it
        sleeper();
        expect(mockSender.sent).toEqual(1);
        var msg = mockSender.msgs[mockSender.msgs.length - 1];
        expect(msg.type).toEqual('timer');
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());

        // Default severity
        expect(msg.severity).toEqual(heka.SEVERITY.INFORMATIONAL);

        expect(msg.fields).toEqual(dict_to_fields({'name': name,
                                    'rate': 1}));

        var elapsed = parseInt(msg.payload);
        expect(elapsed >= minWait).toBeTruthy();

    });

    it('decorates w timer correctly', function() {
        var minWait = 40;  // in milliseconds
        var sleeper = function() {
            block(minWait);
        };
        var name = 'decorator';
        var timestamp = new Date();
        var diffSeverity = 4;
        // wrap it
        sleeper = client.timer(sleeper, name, {'timestamp': timestamp,
                                               'severity': diffSeverity,});
        // call it
        sleeper();
        expect(mockSender.sent).toEqual(1);
        var msg = mockSender.msgs[mockSender.msgs.length - 1];
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp).toEqual(dateToNano(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(diffSeverity);
        expect(msg.fields).toEqual(dict_to_fields({'name': name,
                                    'rate': 1}));

        var elapsed = parseInt(msg.payload);
        expect(elapsed >= minWait).toBeTruthy();
        // call it again
        sleeper();
        expect(mockSender.sent).toEqual(2);
        var msg = mockSender.msgs[mockSender.msgs.length - 1];
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp).toEqual(dateToNano(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);

        expect(msg.hostname).toEqual(os.hostname());

        expect(msg.severity).toEqual(diffSeverity);

        expect(msg.fields).toEqual(dict_to_fields({'name': name,
                                    'rate': 1}));
        expect(elapsed >= minWait).toBeTruthy();
    });

    it('supports filter functions', function() {
        var origFilters = client.filters;
        client.filters = [typeFilter]
        client.heka('foo');
        client.heka('baz');
        client.heka('bar');
        client.heka('bawlp');
        expect(mockSender.sent).toEqual(2)
        expect(mockSender.msgs[0].type).toEqual('baz');
        expect(mockSender.msgs[1].type).toEqual('bawlp');
    });

    it('supports dynamic methods', function() {
        var sendFoo = function(msg) {
            this.heka('foo', {'payload': 'FOO: ' + msg});
        };
        client.addMethod('sendFoo', sendFoo);
        expect(client._dynamicMethods).toEqual({'sendFoo': sendFoo});
        client.sendFoo('bar');
        expect(mockSender.sent).toEqual(1);
        expect(mockSender.msgs[0].type).toEqual('foo');
        expect(mockSender.msgs[0].payload).toEqual('FOO: bar');
    });

    it('overrides properties correctly', function() {
        var sendFoo = function(msg) {
            this.heka('foo', {'payload': 'FOO: ' + msg});
        };
        expect(function() {
            client.addMethod('incr', sendFoo)
        }).toThrow(new Error('The name incr is already in use'));

        client.addMethod('incr', sendFoo, true);
        client.incr('bar');
        expect(mockSender.sent).toEqual(1);
        expect(mockSender.msgs[0].type).toEqual('foo');
        expect(mockSender.msgs[0].payload).toEqual('FOO: bar');
    });

    it("provides simple oldstyle logging methods", function() {
        var msg_pairs = [[client.debug, "debug_msg"],
        [client.info, "info_msg"],
        [client.warn, "warn_msg"],
        [client.error, "err_msg"],
        [client.exception, "exc_msg"],
        [client.critical, "crit_msg"]]

        _.each(msg_pairs, function(elem) {
            var method = elem[0];
            var data = elem[1];
            method.call(client, data)
            expect(_.last(client.sender.msgs).payload).toEqual(data);
        });
        expect(client.sender.msgs.length).toEqual(6);
    });

    it('honors disabledTimers', function() {
        var minWait = 40;  // in milliseconds
        var sleeper = function() {
            block(minWait);
        };
        var name = 'disabled_timer_name';
        var timestamp = new Date();
        var diffSeverity = 4;
        // wrap it
        sleeper = client.timer(sleeper, name, {'timestamp': timestamp,
                                               'severity': diffSeverity,});
        // call it
        sleeper();
        expect(mockSender.sent).toEqual(0);
    });

    it('honors wildcard disabledTimers', function() {
        client = new heka.HekaClient(mockSender,
            loggerVal,
            heka.SEVERITY.INFORMATIONAL,
            ['*']
            );
        var minWait = 40;  // in milliseconds
        var sleeper = function() {
            block(minWait);
        };
        var name = 'any timer name';
        var timestamp = new Date();
        var diffSeverity = 4;
        // wrap it
        sleeper = client.timer(sleeper, name, {'timestamp': timestamp,
                                               'severity': diffSeverity,});
        // call it
        sleeper();
        expect(mockSender.sent).toEqual(0);
    });
    */


});
