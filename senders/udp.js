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
 *  Victor Ng (vng@mozilla.com)
 *
 ***** END LICENSE BLOCK *****
 */
"use strict";

var _ = require('underscore');

var UdpSender = function(host, port) {
    /* 
     * TODO: enable multiple host/port support
     * and extend missing port numbers to the last port in the list
     */

    if (!Array.isArray(host))
    {
        host = [host];
    }

    if (!Array.isArray(port))
    {
        port = [port];
    }

    /* extend the ports list */
    var num_extra_hosts = host.length - port.length

    for (var i=0; i<num_extra_hosts; i++)
    {
        port[port.length+i] = port[port.length-1]
    }

    this._destination = _.zip(host, port)

    this.dgram = require('dgram');
};

UdpSender.prototype.sendMessage = function(msg) {
    var message = new Buffer(msg);
    var client = this.dgram.createSocket("udp4");

    _.each(this._destination, function(elem) {
        var host = elem[0];
        var port = elem[1];
        client.send(message, 0, message.length, port, host, function(err, bytes) {
              client.close();
        });
    })
};

var udpSenderFactory = function(host, port) {
    return new UdpSender(host, port);
};

exports.UdpSender = UdpSender;
exports.udpSenderFactory = udpSenderFactory;
