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
"use strict"

var env_version = '0.8';

function IsoDateString(d) {
    function pad(n) {return n<10 ? '0'+n : n};
    return d.getUTCFullYear() + '-'
        + pad(d.getUTCMonth() + 1) + '-'
        + pad(d.getUTCDate()) + 'T'
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds()) + 'Z'}

// constructor that accepts the required attributes
var client = function(sender, logger, severity) {
    this.sender = sender;
    this.logger = typeof(logger) != 'undefined' ? logger : '';
    this.severity = typeof(severity) != 'undefined' ? severity : 6;
};

client.prototype.metlog = function(type, opts) {
    // opts = timestamp, logger, severity, payload, fields
    if (opts === undefined) opts = {};
    if (opts.timestamp === undefined) opts.timestamp = new Date();
    if (opts.logger === undefined) opts.logger = this.logger;
    if (opts.severity === undefined) opts.severity = this.severity;
    if (opts.payload === undefined) opts.payload = '';
    if (opts.fields === undefined) opts.fields = {};
    if (opts.timestamp instanceof Date) {
        opts.timestamp = IsoDateString(opts.timestamp);
    };
    var fullMsg = {'type': type, 'timestamp': opts.timestamp,
                   'logger': opts.logger, 'severity': opts.severity,
                   'payload': opts.payload, 'fields': opts.fields,
                   'env_version': env_version};
    this.sender.sendMessage(fullMsg);
};

client.prototype.incr = function(name, opts) {
    // opts = count, timestamp, logger, severity, fields
    if (opts === undefined) opts = {};
    if (opts.count === undefined) opts.count = 1;
    if (opts.fields === undefined) opts.fields = {};
    opts.payload = String(opts.count);
    opts.fields['name'] = name;
    this.metlog('counter', opts);
};

client.prototype.timed = function(elapsed, name, opts) {
    // opts = timestamp, logger, severity, fields, rate
    if (opts.rate === undefined) opts.rate = 1;
    if (opts.rate < 1 && Math.random(1) >= opts.rate) {
        // do nothing
        return;
    };
    if (opts === undefined) opts = {};
    if (opts.fields === undefined) opts.fields = {};
    opts.fields['name'] = name;
    opts.fields['rate'] = opts.rate;
    opts.payload = String(elapsed);
    this.metlog('timer', opts);
};

client.prototype.timer = function(fn, name, opts) {
    // opts = timestamp, logger, severity, fields, rate
    if (opts === undefined) opts = {};
    var currentClient = this;
    return function() {
        var startTime = new Date().getTime();
        // might this yield at the function call boundaries?
        var retVal = fn.apply(this, arguments);
        var endTime = new Date().getTime();
        var elapsed = endTime - startTime;
        currentClient.timed(elapsed, name, opts);
        return retVal;
    };
};

exports.IsoDateString = IsoDateString;
exports.client = client;
