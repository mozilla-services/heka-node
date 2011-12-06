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