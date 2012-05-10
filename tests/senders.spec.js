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

var horaa = require('horaa');
var sys = require('util');
var module = require('../senders.js');
var zmqHoraa = horaa('zmq');

describe('ZmqPubSender', function() {

    var mockPublisher = {
        sent: 0,
        msg: '',
        bound: [],
        send: function(msg) {
            this.sent += 1;
            this.msg = msg;
        },
        bind: function(bindstr) {
            this.bound[this.bound.length] = bindstr;
        }
    };

    beforeEach(function() {
        mockPublisher.sent = 0;
        mockPublisher.msg = '';
        mockPublisher.bound = [];
        zmqHoraa.hijack('createSocket', function(type) {
            if (type === 'pub') {
                return mockPublisher;
            };
        });
    });

    afterEach(function() {
        zmqHoraa.restore('createSocket');
    });

    it('initializes correctly', function() {
        var bindstr = 'tcp://127.0.0.1:9988';
        var sender = new module.zmqPubSender(bindstr);
        expect(sender.publisher).toBe(mockPublisher);
        expect(mockPublisher.highWaterMark).toEqual(1000);
        expect(mockPublisher.bound).toEqual([bindstr]);
        expect(mockPublisher.sent).toEqual(0);
    });

    it('initializes w/ non-defaults', function() {
        var bindstrs = ['tcp://10.10.10.1:9988',
                        'tcp://10.10.10.2:8877'];
        var queueLength = 500;
        var sender = new module.zmqPubSender(bindstrs, queueLength);
        expect(sender.publisher).toBe(mockPublisher);
        expect(mockPublisher.highWaterMark).toEqual(queueLength);
        expect(mockPublisher.bound).toEqual(bindstrs);
        expect(mockPublisher.sent).toEqual(0);
    });

    it('sends messages', function() {
        var bindstr = 'tcp://127.0.0.1:9988';
        var sender = new module.zmqPubSender(bindstr);
        var msg = {'hello': 'world',
                   'goodbye': 'friend'};
        sender.sendMessage(msg);
        expect(mockPublisher.sent).toEqual(1);
        expect(mockPublisher.msg).toEqual(JSON.stringify(msg));
        var msg2 = {'until': 'we',
                    'meet': 'again'};
        sender.sendMessage(msg2);
        expect(mockPublisher.sent).toEqual(2);
        expect(mockPublisher.msg).toEqual(JSON.stringify(msg2));
    });

});