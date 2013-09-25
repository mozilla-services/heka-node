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

var streams = require('./streams/index');
var _ = require('underscore');
var superscore = require('superscore');
var config = require('./config');
var env_version = '0.8';
var message = require('./message');
var helpers = require('./message/helpers');
var Field = message.Field;
var os = require('os');
var ByteBuffer = require('bytebuffer');

var uuid = require('./uuid');
var compute_oid_uuid = uuid.compute_oid_uuid;
var dict_to_fields = helpers.dict_to_fields;

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

var PB_NAMETYPE_TO_INT = {'STRING': 0,
                          'BYTES': 1,
                          'INTEGER': 2,
                          'DOUBLE': 3,
                          'BOOL': 4};

var PB_TYPEMAP = {0: 'STRING',
                  1: 'BYTES',
                  2: 'INTEGER',
                  3: 'DOUBLE',
                  4: 'BOOL'};

var PB_FIELDMAP = {0: 'value_string',
                   1: 'value_bytes',
                   2: 'value_integer',
                   3: 'value_double',
                   4: 'value_bool'};

function DateToNano(d) {
    // TODO: this needs to return an instance of Long.js's Long object
    // as JS doesn't support int64 out of the box
    return d.getTime() * 1000000;
}


var HekaClient = function(stream, logger, severity, disabledTimers, filters)
{
    this.setup(stream, logger, severity, disabledTimers, filters);
};

HekaClient.prototype.setup = function(stream, logger, severity, disabledTimers,
        filters)
{
    this.stream = stream;
    this.logger = typeof(logger) != 'undefined' ? logger : '';
    this.severity = typeof(severity) != 'undefined' ? severity : SEVERITY.INFORMATIONAL;
    this.disabledTimers = typeof(disabledTimers) != 'undefined' ? disabledTimers : [];
    this.filters = typeof(filters) != 'undefined' ? filters : [];
    this._dynamicMethods = {};

    this.pid = process.pid;
    this.hostname = os.hostname();

};

HekaClient.prototype._sendMessage = function(msg_obj) {
    // Apply any filters and pass on the stream if message gets through
    for (var i=0; i<this.filters.length; i++) {
        var filter = this.filters[i];
        if (!filter(msg_obj)) {
            return;
        };
    };
    this.stream.sendMessage(msg_obj.encode().toBuffer());
};

HekaClient.prototype.heka = function(type, opts) {
    if (opts === undefined) opts = {};

    if (opts.timestamp === undefined) opts.timestamp = new Date();
    if (opts.logger === undefined) opts.logger = this.logger;
    if (opts.severity === undefined) opts.severity = this.severity;
    if (opts.payload === undefined) opts.payload = '';
    if (opts.fields === undefined) opts.fields = {};
    if (opts.pid === undefined) opts.pid = this.pid;
    if (opts.hostname === undefined) opts.hostname = this.hostname;

    var msg = new message.Message();
    msg.timestamp = opts.timestamp;

    msg.type = type;
    msg.logger = opts.logger;
    msg.severity = opts.severity;
    msg.payload = opts.payload;

    var fields = dict_to_fields(opts.fields);
    for (var i = 0; i < fields.length; i++) {
        msg.fields.push(fields[i]);
    }

    msg.env_version = env_version;
    msg.pid =  opts.pid;
    msg.hostname = opts.hostname;

    msg.uuid = '0000000000000000';

    var msg_buffer = msg.encode().toBuffer();

    msg.uuid = compute_oid_uuid(msg_buffer);

    this._sendMessage(msg);
};


HekaClient.prototype.addMethod = function(name, method, override) {
    if (typeof method !== 'function') {
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

    if (typeof sample_rate === 'undefined') {
        sample_rate = new helpers.BoxedFloat(1);
    }

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
    if (opts.rate === undefined) opts.rate = new helpers.BoxedFloat(1);
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
    if (opts === undefined) opts = {};
    if (opts.rate === undefined) opts.rate = new helpers.BoxedFloat(1);

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
    opts.severity = opts.severity || severity;
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

HekaClient.prototype.notice = function(msg, opts) {
    this._oldstyle(SEVERITY.NOTICE, msg, opts);
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



/***************************/

exports.DateToNano = DateToNano;
exports.HekaClient = HekaClient;
exports.clientFromJsonConfig = config.clientFromJsonConfig;
exports.SEVERITY = SEVERITY;
exports.streams = streams;
