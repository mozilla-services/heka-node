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

var ZmqPubSender = function(bindstrs, queueLength) {
    if (typeof(bindstrs) == "string") {
        bindstrs = [bindstrs];
    };
    this.zmq = require('zmq');
    queueLength = typeof(queueLength) != 'undefined' ? queueLength : 1000;
    var publisher = this.zmq.createSocket('pub');
    publisher['highWaterMark'] = queueLength;
    for (var i = 0; i < bindstrs.length; i++) {
        publisher.bind(bindstrs[i]);
    };
    this.publisher = publisher;
};

ZmqPubSender.prototype.sendMessage = function(msg) {
    var jsonMsg = JSON.stringify(msg);
    this.publisher.send(jsonMsg)
};

function zmqPubSenderFactory(config) {
    var bindstrs = config['bindstrs'];
    var queueLength = config['queueLength'];
    return new ZmqPubSender(bindstrs, queueLength);
};

//exports.ZmqPubSender = ZmqPubSender;
exports.zmqPubSenderFactory = zmqPubSenderFactory;
