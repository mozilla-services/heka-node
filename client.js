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
    function pad(n) {return n<10 ? '0'+n : n};
    return d.getUTCFullYear() + '-'
        + pad(d.getUTCMonth() + 1) + '-'
        + pad(d.getUTCDate()) + 'T'
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds()) + 'Z'}

var MetlogClient = function(sender, logger, severity, disabledTimers, filters) 
{
    this.setup(sender, logger, severity, disabledTimers, filters);
};

MetlogClient.prototype.setup = function(sender, logger, severity, disabledTimers,
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

MetlogClient.prototype._sendMessage = function(msg) {
    // Apply any filters and pass on the sender if message gets through
    for (var i=0; i<this.filters.length; i++) {
        var filter = this.filters[i];
        if (!filter(msg)) {
            return;
        };
    };
    this.sender.sendMessage(msg);
};

MetlogClient.prototype.metlog = function(type, opts) {
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
        'metlog_pid': opts.pid,
        'metlog_hostname': opts.hostname
    };
    this._sendMessage(fullMsg);
};

MetlogClient.prototype.addMethod = function(name, method, override) {
    if (typeof(method) !== 'function') {
        throw new Error('`method` argument must be a function');
    };
    if (!override && name in this) {
        throw new Error('The name ' + name + ' is already in use');
    };
    this._dynamicMethods[name] = method;
    this[name] = method;
};

MetlogClient.prototype.incr = function(name, opts, sample_rate) {
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
    this.metlog('counter', opts);
};

MetlogClient.prototype.timer_send = function(elapsed, name, opts) {
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
    this.metlog('timer', opts);
};

MetlogClient.prototype.timer = function(fn, name, opts) {
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

MetlogClient.prototype._oldstyle = function(severity, msg, opts) {
    if (opts === undefined) opts = {};
    if (opts.fields === undefined) opts.fields = {};
    opts.payload = String(msg);
    this.metlog('oldstyle', opts);
}

MetlogClient.prototype.debug = function(msg, opts) {
    this._oldstyle(SEVERITY.DEBUG, msg, opts);
}

MetlogClient.prototype.info = function(msg, opts) {
    this._oldstyle(SEVERITY.INFORMATIONAL, msg, opts);
}

MetlogClient.prototype.warn = function(msg, opts) {
    this._oldstyle(SEVERITY.WARNING, msg, opts);
}

MetlogClient.prototype.error = function(msg, opts) {
    this._oldstyle(SEVERITY.ERROR, msg, opts);
}

MetlogClient.prototype.exception = function(msg, opts) {
    this._oldstyle(SEVERITY.ALERT, msg, opts);
}

MetlogClient.prototype.critical = function(msg, opts) {
    this._oldstyle(SEVERITY.CRITICAL, msg, opts);
}

exports.IsoDateString = IsoDateString;
exports.MetlogClient = MetlogClient;
exports.clientFromJsonConfig = config.clientFromJsonConfig;
exports.SEVERITY = SEVERITY;
