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


var defaultFormatter = function(msg) {
    return JSON.stringify(msg);
};


var asStreamSender = function() {
    this.init = function(formatter) {
        if (typeof(formatter) === 'function') {
            this.formatter = formatter;
        } else {
            this.formatter = defaultFormatter;
        };
    };

    this.sendMessage = function(msg) {
        output = this.formatter(msg);
        this.stream.write(output + '\n');
    };

};


var StdoutSender = function(formatter) {
    this.stream = process.stdout;
    this.init(formatter);
};
asStreamSender.call(StdoutSender.prototype);

var stdoutSenderFactory = function(formatter) {
    return new StdoutSender(formatter);
};


var FileSender = function(filePath, formatter) {
    this.stream = fs.createWriteStream(filePath);
    this.init(formatter);
};
asStreamSender.call(FileSender.prototype)

var fileSenderFactory = function(filePath, formatter) {
    return new FileSender(filePath, formatter);
};


exports.StdoutSender = StdoutSender;
exports.stdoutSenderFactory = stdoutSenderFactory;
exports.FileSender = FileSender;
exports.fileSenderFactory = fileSenderFactory;