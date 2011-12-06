/*
 **** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is metlog.js.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Rob Miller (rmiller@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 ***** END LICENSE BLOCK *****
 */
"use strict";

var sys = require('util');
var module = require('../client.js');


describe('client', function() {
    var mockSender = {
        sent: 0,
        sendMessage: function(msg) {
            this.sent += 1;
            this.msg = msg;
        }
    };

    var loggerVal = 'bogus';
    var client;
    var isoConvert = module.IsoDateString

    beforeEach(function() {
        mockSender.sent = 0;
        mockSender.msg = '';
        client = new module.client(mockSender, loggerVal);
    });

    function block(ms) {
        // naive cpu consuming "sleep", should never be used in real code
        var start = new Date();
        var now;
        do {
            now = new Date();
        } while (now - start < ms);
    };

    it('initializes correctly', function() {
        expect(client.sender).toBe(mockSender);
        expect(client.logger).toEqual(loggerVal);
        expect(client.severity).toEqual(6);
    });

    it('initializes w alternate defaults', function() {
        var otherLoggerVal = 'sugob';
        var otherSeverity = 3;
        var otherClient = new module.client(mockSender, otherLoggerVal,
                                            otherSeverity);
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
        var msg = mockSender.msg;
        expect(msg.type).toEqual(type);
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.severity).toEqual(6);
        expect(msg.payload).toEqual(payload);
        expect(msg.fields).toEqual({});
    });

    it('sends incr message', function() {
        var timestamp = new Date();
        var name = 'counter name';
        client.incr(name, {'timestamp': timestamp});
        expect(mockSender.sent).toEqual(1)
        var msg = mockSender.msg;
        expect(msg.type).toEqual('counter');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual({'name': name});
        expect(msg.payload).toEqual('1');
    });

    it('sends incr different count', function() {
        var timestamp = new Date();
        var name = 'counter name';
        var count = 3;
        client.incr(name, {'timestamp': timestamp,
                           'count': count});
        expect(mockSender.sent).toEqual(1)
        var msg = mockSender.msg;
        expect(msg.type).toEqual('counter');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual({'name': name});
        expect(msg.payload).toEqual('3');
    });

    it('sends timed message', function() {
        var timestamp = new Date();
        var name = 'timed name';
        var elapsed = 35;
        var diffLogger = 'different'
        client.timed(elapsed, name, {'timestamp': timestamp,
                                     'logger': diffLogger});
        expect(mockSender.sent).toEqual(1);
        var msg = mockSender.msg;
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(diffLogger);
        expect(msg.severity).toEqual(6);
        expect(msg.fields).toEqual({'name': name,
                                    'rate': 1});
        expect(msg.payload).toEqual(String(elapsed));
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
        var msg = mockSender.msg;
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.severity).toEqual(diffSeverity);
        expect(msg.fields).toEqual({'name': name,
                                    'rate': 1});
        var elapsed = parseInt(msg.payload);
        expect(elapsed >= minWait).toBeTruthy();
        // call it again
        sleeper();
        expect(mockSender.sent).toEqual(2);
        var msg = mockSender.msg;
        expect(msg.type).toEqual('timer');
        expect(msg.timestamp).toEqual(isoConvert(timestamp));
        expect(msg.logger).toEqual(loggerVal);
        expect(msg.severity).toEqual(diffSeverity);
        expect(msg.fields).toEqual({'name': name,
                                    'rate': 1});
        expect(elapsed >= minWait).toBeTruthy();
    });
});