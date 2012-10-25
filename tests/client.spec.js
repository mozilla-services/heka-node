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
var metlog = require('metlog');

describe('client', function() {
    var mockSender = {
        sent: 0,
        msgs: [],
        sendMessage: function(msg) {
            this.sent += 1;
            this.msgs.push(msg);
        }
    };

    var loggerVal = 'bogus';
    var client;
    var isoConvert = metlog.IsoDateString

    beforeEach(function() {
        mockSender.sent = 0;
        mockSender.msgs = [];
        client = new metlog.MetlogClient(mockSender,
            loggerVal,
            metlog.SEVERITY.INFORMATIONAL,
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
        expect(client.sender).toBe(mockSender);
        expect(client.logger).toEqual(loggerVal);
        expect(client.severity).toEqual(6);
    });

    it('initializes w alternate defaults', function() {
        var otherLoggerVal = 'sugob';
        var otherSeverity = 3;
        var otherClient = new metlog.MetlogClient(mockSender, otherLoggerVal, otherSeverity);
        expect(otherClient.sender).toBe(mockSender);
        expect(otherClient.logger).toEqual(otherLoggerVal);
        expect(otherClient.severity).toEqual(otherSeverity);
    });

    it('delivers to sender', function() {
        var timestamp = new Date();
        var type = 'vanilla'
        var payload = 'drippy dreamy icy creamy';
        client.metlog(type, {'timestamp': timestamp,
                             'payload': payload});
        expect(mockSender.sent).toEqual(1);
        var msg = mockSender.msgs[mockSender.msgs.length - 1];
        expect(msg.type).toEqual(type);
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.metlog_pid).toEqual(process.pid);
        expect(msg.metlog_hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        expect(msg.payload).toEqual(payload);
        expect(msg.fields).toEqual({});
    });

    it('sends incr message', function() {
        var timestamp = new Date();
        var name = 'counter name';
        client.incr(name, {'timestamp': timestamp});
        expect(mockSender.sent).toEqual(1)
        var msg = mockSender.msgs[mockSender.msgs.length - 1];
        expect(msg.type).toEqual('counter');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.metlog_pid).toEqual(process.pid);
        expect(msg.metlog_hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual({'name': name, 'rate': 1.0});
        expect(msg.payload).toEqual('1');
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
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.metlog_pid).toEqual(process.pid);
        expect(msg.metlog_hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual({'name': name, 'rate': 1.0});
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
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(diffLogger);
        expect(msg.metlog_pid).toEqual(process.pid);
        expect(msg.metlog_hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual({'name': name,
                                    'rate': 1});
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
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.metlog_pid).toEqual(process.pid);
        expect(msg.metlog_hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(diffSeverity);
        expect(msg.fields).toEqual({'name': name,
                                    'rate': 1});
        var elapsed = parseInt(msg.payload);
        expect(elapsed >= minWait).toBeTruthy();
        // call it again
        sleeper();
        expect(mockSender.sent).toEqual(2);
        var msg = mockSender.msgs[mockSender.msgs.length - 1];
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.metlog_pid).toEqual(process.pid);
        expect(msg.metlog_hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(diffSeverity);
        expect(msg.fields).toEqual({'name': name,
                                    'rate': 1});
        expect(elapsed >= minWait).toBeTruthy();
    });

    it('supports filter functions', function() {
        var origFilters = client.filters;
        client.filters = [typeFilter]
        client.metlog('foo');
        client.metlog('baz');
        client.metlog('bar');
        client.metlog('bawlp');
        expect(mockSender.sent).toEqual(2)
        expect(mockSender.msgs[0].type).toEqual('baz');
        expect(mockSender.msgs[1].type).toEqual('bawlp');
    });

    it('supports dynamic methods', function() {
        var sendFoo = function(msg) {
            this.metlog('foo', {'payload': 'FOO: ' + msg});
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
            this.metlog('foo', {'payload': 'FOO: ' + msg});
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
        client = new metlog.MetlogClient(mockSender,
            loggerVal,
            metlog.SEVERITY.INFORMATIONAL,
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


});
