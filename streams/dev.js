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
var fs = require('fs');
var base = require('./base');

var StdoutStream = function(encoder, hmc) {
    this.stream = process.stdout;
    this.init(hmc);

    this._is_stdout = true;
    this._send_msg = function(text) {
        this.stream.write(text);
    }
};
base.abstractStream.call(StdoutStream.prototype);

var stdoutStreamFactory = function(config) {
    var config = typeof config !== 'undefined' ? config : {};
    var encoder = config['encoder'];
    var hmc = config['hmc'];
    return new StdoutStream(encoder, hmc);
};


var FileStream = function(filepath, encoder, hmc) {
    this.stream = fs.createWriteStream(filepath);
    this.init(hmc);

    this._send_msg = function(msg_buff) {
        this.stream.write(msg_buff);
    }
};
base.abstractStream.call(FileStream.prototype)

var fileStreamFactory = function(config) {
    var config = typeof config !== 'undefined' ? config : {};

    var filepath = config['filepath'];
    var encoder = config['encoder'];
    var hmc = config['hmc'];

    return new FileStream(filepath, encoder, hmc);
};


var DebugStream = function(encoder, hmc) {
    this.init(hmc);
    this.msgs = [];
    this._send_msg = function(text) {
        this.msgs.push(text);
    }
};
base.abstractStream.call(DebugStream.prototype);

var debugStreamFactory = function(config) {
    var config = typeof config !== 'undefined' ? config : {};
    var encoder = config['encoder'];
    var hmc = config['hmc'];
    return new DebugStream(encoder, hmc);
};


exports.fileStreamFactory = fileStreamFactory;
exports.stdoutStreamFactory = stdoutStreamFactory;
exports.debugStreamFactory = debugStreamFactory;
