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

var path = require('path');
var Long = require('Long');

module.paths.push(path.resolve('..'))

describe('client', function() {
    function makeMockStream() {
        var makeMockStreamString = './streams:debugStreamFactory';
        var streamFactory = resolveName(makeMockStreamString);
        return streamFactory({});
    }
    var mockStream = null;

    var loggerVal = 'bogus';
    var client;

    beforeEach(function() {
        // Blow away the mockstream and recreate it
        mockStream = makeMockStream();

        client = new heka.HekaClient(mockStream,
            loggerVal,
            heka.SEVERITY.INFORMATIONAL,
            ['disabled_timer_name']
            );

    });

    function msg_from_stream(stream) {
        var wire_buff = stream.msgs.pop();
        var decoded = helpers.decode_message(wire_buff);
        var header = decoded['header'];
        var msg = decoded['message'];
        return msg;
    }

    function check_simple_field(msg, name) {
        if (name == undefined) {
            expect(msg.fields.length).toEqual(0);
            return
        }

        var name_field = msg.fields[0];
        var rate_field = msg.fields[1];
        expect(name_field.value_string[0]).toEqual(name);
        // ** Note that the rate is defined as an int64 which requires
        // Long.js
        var int_val = rate_field.value_integer[0];
        expect(int_val.toNumber()).toEqual(1);
    }

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

    it('delivers to stream', function() {
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
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
        
        // Timestamps in nanoseconds requires
        // int64 precision which needs to explicitly use the Long
        // library or else you're going to have pain
        expect(msg.timestamp.toString()).toEqual(Long.fromNumber(timestamp).toString());

        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        expect(msg.payload).toEqual(payload);

        check_simple_field(msg);
    });

    it('sends incr message', function() {
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
        var name = 'counter name';
        client.incr(name, {'timestamp': timestamp});
        expect(mockStream.msgs.length).toEqual(1)

        var wire_buff = mockStream.msgs.pop();
        var decoded = helpers.decode_message(wire_buff);
        var header = decoded['header'];
        var msg = decoded['message'];

        expect(msg.type).toEqual('counter');

        expect(msg.timestamp.toNumber()).toEqual(timestamp);

        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
       
        check_simple_field(msg, name);

        expect(msg.payload).toEqual('1');
    });

    it('formats nanosecond dates properly', function() {
        // These 3 are all equivalent timestamps
        var mydate = new Date(Date.UTC(2012,2,30));
        var num_ts_as_ns =  1333065600000000000;
        var str_ts_as_ns = '1333065600000000000';

        expect(heka.DateToNano(mydate)).toEqual(num_ts_as_ns);
        expect(Long.fromString(str_ts_as_ns).toString()).toEqual(str_ts_as_ns);
        expect(Long.fromString(str_ts_as_ns).toNumber()).toEqual(num_ts_as_ns);
    });

    it('sends incr different count', function() {
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
        var name = 'counter name';
        var count = 3;
        client.incr(name, {'timestamp': timestamp,
                           'count': count});
        expect(mockStream.msgs.length).toEqual(1)
        var msg = msg_from_stream(mockStream);
        expect(msg.type).toEqual('counter');
        expect(msg.timestamp.toNumber()).toEqual(timestamp);
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);

        check_simple_field(msg, name);

        expect(msg.payload).toEqual('3');
    });

    it('sends timed message', function() {
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
        var name = 'timed name';
        var elapsed = 35;
        var diffLogger = 'different'
        client.timer_send(elapsed, name, {'timestamp': timestamp,
                                     'logger': diffLogger});

        expect(mockStream.msgs.length).toEqual(1);
        var msg = msg_from_stream(mockStream);

        expect(msg.type).toEqual('timer');
        expect(msg.timestamp.toNumber()).toEqual(timestamp);
        expect(msg.logger).toEqual(diffLogger);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(6);
        check_simple_field(msg, name);
        expect(msg.payload).toEqual(String(elapsed));
    });

    it('honors incr rate', function() {
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
        var name = 'counter name';

        var rate = 0.1;
        var repeats = 1000;
        for (var i=0; i < repeats; i++) {
            client.incr(name, {'timestamp': timestamp}, rate);
        }
        // this is a very weak test, w/ a small probability of failing incorrectly :(
        // we shouldn't get *twice* as many messages as the upper
        // limit
        expect(mockStream.msgs.length).toBeLessThan(repeats * rate * 2);
        expect(mockStream.msgs.length).toBeGreaterThan(0);
    });

    it('honors timer rate', function() {
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
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
        expect(mockStream.msgs.length).toBeLessThan(repeats * rate * 2);
        expect(mockStream.msgs.length).toBeGreaterThan(0);
    });

    it('can use no options with timer calls', function() {
        var minWait = 40;  // in milliseconds
        var sleeper = function() {
            block(minWait);
        };
        var name = 'decorator';
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
        var diffSeverity = 4;
        // wrap it
        var sleep_timer = client.timer(sleeper, name);
        // call it
        sleep_timer();
        expect(mockStream.msgs.length).toEqual(1);
        var msg = msg_from_stream(mockStream);
        expect(msg.type).toEqual('timer');
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());

        // Default severity
        expect(msg.severity).toEqual(heka.SEVERITY.INFORMATIONAL);

        check_simple_field(msg, name);

        var elapsed = parseInt(msg.payload);
        expect(elapsed >= minWait).toBeTruthy();

    });

    it('decorates w/ timer correctly', function() {
        var minWait = 40;  // in milliseconds
        var sleeper = function() {
            block(minWait);
        };
        var name = 'decorator';
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
        var diffSeverity = 4;
        // wrap it
        sleeper = client.timer(sleeper, name, {'timestamp': timestamp,
                                               'severity': diffSeverity,});
        // call it
        sleeper();
        expect(mockStream.msgs.length).toEqual(1);
        var msg = msg_from_stream(mockStream);
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp.toNumber()).toEqual(timestamp);
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);
        expect(msg.hostname).toEqual(os.hostname());
        expect(msg.severity).toEqual(diffSeverity);
        check_simple_field(msg, name)

        var elapsed = parseInt(msg.payload);
        expect(elapsed >= minWait).toBeTruthy();
        // call it again
        sleeper();
        expect(mockStream.msgs.length).toEqual(1);
        var msg = msg_from_stream(mockStream);
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp.toNumber()).toEqual(timestamp);
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.pid).toEqual(process.pid);

        expect(msg.hostname).toEqual(os.hostname());

        expect(msg.severity).toEqual(diffSeverity);

        check_simple_field(msg, name)
        expect(elapsed >= minWait).toBeTruthy();
    });

    it('supports filter functions', function() {
        var origFilters = client.filters;
        client.filters = [typeFilter]
        client.heka('foo');
        client.heka('baz');
        client.heka('bar');
        client.heka('bawlp');
        expect(mockStream.msgs.length).toEqual(2)

        // Messages are popped in reverse order
        var msg2 = msg_from_stream(mockStream)
        var msg1 = msg_from_stream(mockStream)

        expect(msg1.type).toEqual('baz');
        expect(msg2.type).toEqual('bawlp');
    });

    it('supports dynamic methods', function() {
        var sendFoo = function(msg) {
            this.heka('foo', {'payload': 'FOO: ' + msg});
        };
        client.addMethod('sendFoo', sendFoo);
        expect(client._dynamicMethods).toEqual({'sendFoo': sendFoo});
        client.sendFoo('bar');
        expect(mockStream.msgs.length).toEqual(1);

        var msg = msg_from_stream(mockStream)
        expect(msg.type).toEqual('foo');
        expect(msg.payload).toEqual('FOO: bar');
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
        expect(mockStream.msgs.length).toEqual(1);
        var msg = msg_from_stream(mockStream)

        expect(msg.type).toEqual('foo');
        expect(msg.payload).toEqual('FOO: bar');
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
            var msg = msg_from_stream(client.stream);
            expect(msg.payload).toEqual(data);
        });

        expect(client.stream.msgs.length).toEqual(0);
    });

    it('honors disabledTimers', function() {
        var minWait = 40;  // in milliseconds
        var sleeper = function() {
            block(minWait);
        };
        var name = 'disabled_timer_name';
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
        var diffSeverity = 4;

        // wrap it
        sleeper = client.timer(sleeper, name, {'timestamp': timestamp,
                                               'severity': diffSeverity,});
        // call it
        sleeper();
        expect(mockStream.msgs.length).toEqual(0);
    });

    it('honors wildcard disabledTimers', function() {
        client = new heka.HekaClient(mockStream,
            loggerVal,
            heka.SEVERITY.INFORMATIONAL,
            ['*']
            );
        var minWait = 40;  // in milliseconds
        var sleeper = function() {
            block(minWait);
        };
        var name = 'any timer name';
        var timestamp = heka.DateToNano(new Date(Date.UTC(2012,2,30)));
        var diffSeverity = 4;
        // wrap it
        sleeper = client.timer(sleeper, name, {'timestamp': timestamp,
                                               'severity': diffSeverity,});
        // call it
        sleeper();
        expect(mockStream.msgs.length).toEqual(0);
    });

});
