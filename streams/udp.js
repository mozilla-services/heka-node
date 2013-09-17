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
var base = require('./base');

var UdpStream = function(host, port, hmc) {
    this.init(hmc);

    if (!Array.isArray(host))
    {
        host = [host];
    }

    if (!Array.isArray(port))
    {
        port = [port];
    }

    /* 
     * Multiple host/port support is included.
     * We extend missing port numbers to the last port in the list
     */
    var num_extra_hosts = host.length - port.length;

    for (var i=0; i<num_extra_hosts; i++)
    {
        port[port.length+i] = port[port.length-1];
    }

    this._destination = _.zip(host, port);
    this.dgram = require('dgram');


    this._send_msg = function(buffer) {
        var client = this.dgram.createSocket("udp4");

        _.each(this._destination, function(elem) {
            var host = elem[0];
            var port = elem[1];
            // datagram sockets expect to write a Node.js Buffer
            // object
            client.send(buffer, 0, buffer.length, port, host, function(err, bytes) {
                client.close();
            });
        })
    };

    this.toString = function()
    {
        var result = "UdpStream ---\n";
        _.each(this._destination, function(elem) {
            var host = elem[0];
            var port = elem[1];
            result += "Destination : "+host+":"+port+"\n";
        });
        result += "---UdpStream \n";
        return result;
    };

};
base.abstractStream.call(UdpStream.prototype);


var udpStreamFactory = function(sender_config) {
    var hosts = sender_config['hosts'];
    var ports = sender_config['ports'];
    // var encoder = sender_config['encoder'];
    var hmc = sender_config['hmc'];

    if ((hosts == null) || (ports == null)) {
        throw new Error("Invalid host/port combination: ["+hosts+"] ["+ports+"]");
    }

    var sender = new UdpStream(hosts, ports, hmc);
    return sender;
};

exports.udpStreamFactory = udpStreamFactory;
