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
"use strict"

var config = require('./config');
var env_version = '0.8';
var os = require('os');
var Senders = require('./senders/index');
var _ = require('underscore');

// Put a namespace around RFC 3164 syslog messages
var SEVERITY = {
    EMERGENCY: 0,
    ALERT: 1,
    CRITICAL: 2,
    ERROR: 3,
    WARNING: 4,
    NOTICE: 5,
    INFORMATIONAL: 6,
    DEBUG: 7
}

function IsoDateString(d) {
    function zeroFill(number, width)
    {
      width -= number.toString().length;
      if ( width > 0 )
      {
        return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
      }
      return number + ""; // always return a string
    }

    return d.getUTCFullYear() + '-'
        + zeroFill(d.getUTCMonth() + 1, 2) + '-'
        + zeroFill(d.getUTCDate(), 2) + 'T'
        + zeroFill(d.getUTCHours(), 2) + ':'
        + zeroFill(d.getUTCMinutes(), 2) + ':'
        + zeroFill(d.getUTCSeconds(), 2) + "."
        + zeroFill(d.getUTCMilliseconds() * 1000, 6) + 'Z'
}

var HekaClient = function(sender, logger, severity, disabledTimers, filters) 
{
    this.setup(sender, logger, severity, disabledTimers, filters);
};

HekaClient.prototype.setup = function(sender, logger, severity, disabledTimers,
        filters)
{
    this.sender = sender;
    this.logger = typeof(logger) != 'undefined' ? logger : '';
    this.severity = typeof(severity) != 'undefined' ? severity : 6;
    this.disabledTimers = typeof(disabledTimers) != 'undefined' ? disabledTimers : [];
    this.filters = typeof(filters) != 'undefined' ? filters : [];
    this._dynamicMethods = {};

    this.pid = process.pid;
    this.hostname = os.hostname();

};

HekaClient.prototype._sendMessage = function(msg) {
    // Apply any filters and pass on the sender if message gets through
    for (var i=0; i<this.filters.length; i++) {
        var filter = this.filters[i];
        if (!filter(msg)) {
            return;
        };
    };
    this.sender.sendMessage(msg);
};

HekaClient.prototype.heka = function(type, opts) {
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

    if (opts.pid === undefined) opts.pid = this.pid;
    if (opts.hostname === undefined) opts.hostname = this.hostname;


    var fullMsg = {'type': type, 'timestamp': opts.timestamp,
        'logger': opts.logger, 'severity': opts.severity,
        'payload': opts.payload, 'fields': opts.fields,
        'env_version': env_version,
        'heka_pid': opts.pid,
        'heka_hostname': opts.hostname
    };
    this._sendMessage(fullMsg);
};

HekaClient.prototype.addMethod = function(name, method, override) {
    if (typeof(method) !== 'function') {
        throw new Error('`method` argument must be a function');
    };
    if (!override && name in this) {
        throw new Error('The name ' + name + ' is already in use');
    };
    this._dynamicMethods[name] = method;
    this[name] = method;
};

HekaClient.prototype.incr = function(name, opts, sample_rate) {
    // opts = count, timestamp, logger, severity, fields
    if (opts === undefined) opts = {};
    if (opts.count === undefined) opts.count = 1;
    if (opts.fields === undefined) opts.fields = {};
    if (typeof sample_rate === 'undefined') sample_rate = 1.0;
    opts.payload = String(opts.count);
    opts.fields['name'] = name;
    opts.fields['rate'] = sample_rate;

    if (sample_rate < 1 && Math.random(1) >= sample_rate) {
        // do nothing
        return;
    };
    this.heka('counter', opts);
};

HekaClient.prototype.timer_send = function(elapsed, name, opts) {
    // opts = timestamp, logger, severity, fields, rate
    if (opts === undefined) opts = {};
    if (opts.rate === undefined) opts.rate = 1;
    if (opts.rate < 1 && Math.random(1) >= opts.rate) {
        // do nothing
        return;
    };
    if (opts.fields === undefined) opts.fields = {};
    opts.fields['name'] = name;
    opts.fields['rate'] = opts.rate;
    opts.payload = String(elapsed);
    this.heka('timer', opts);
};

HekaClient.prototype.timer = function(fn, name, opts) {
    // opts = timestamp, logger, severity, fields, rate

    var NoOpTimer = function() {
        return null;
    }

    // Check if this is a disabled timer
    if (_.contains(this.disabledTimers, name) || _.contains(this.disabledTimers, '*'))
    {
        return NoOpTimer;
    }

    // Check rate to see if we need to skip this
    if ((opts.rate < 1.0) && (Math.random() >= opts.rate))
    {
        return NoOpTimer;
    }

    //
    //
    if (opts === undefined) opts = {};
    var currentClient = this;

    return function() {
        var startTime = new Date().getTime();
        // The decorated function may yield during invocation
        // so the timer may return a higher value than the actual
        // execution time of *just* the decorated function
        var retVal = fn.apply(this, arguments);
        var endTime = new Date().getTime();
        var elapsed = endTime - startTime;
        currentClient.timer_send(elapsed, name, opts);
        return retVal;
    };
};

HekaClient.prototype._oldstyle = function(severity, msg, opts) {
    if (opts === undefined) opts = {};
    if (opts.fields === undefined) opts.fields = {};
    opts.payload = String(msg);
    this.heka('oldstyle', opts);
}

HekaClient.prototype.debug = function(msg, opts) {
    this._oldstyle(SEVERITY.DEBUG, msg, opts);
}

HekaClient.prototype.info = function(msg, opts) {
    this._oldstyle(SEVERITY.INFORMATIONAL, msg, opts);
}

HekaClient.prototype.warn = function(msg, opts) {
    this._oldstyle(SEVERITY.WARNING, msg, opts);
}

HekaClient.prototype.error = function(msg, opts) {
    this._oldstyle(SEVERITY.ERROR, msg, opts);
}

HekaClient.prototype.exception = function(msg, opts) {
    this._oldstyle(SEVERITY.ALERT, msg, opts);
}

HekaClient.prototype.critical = function(msg, opts) {
    this._oldstyle(SEVERITY.CRITICAL, msg, opts);
}

exports.IsoDateString = IsoDateString;
exports.HekaClient = HekaClient;
exports.clientFromJsonConfig = config.clientFromJsonConfig;
exports.SEVERITY = SEVERITY;
exports.Senders = Senders;
