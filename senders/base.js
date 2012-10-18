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

var encoders = require('./encoders');

var abstractSender = function() {
    /*
     * This is an abstract sender which all senders should reuse.
     * We need to enforce that all senders *must* have a default
     * encoder of JSON for serialization over the wire.
     */
    this.init = function(encoder) {
        if (typeof(encoder) === 'function') {
            this.encoder = encoder;
        } else {
            this.encoder = encoders.jsonEncoder;
        };
    };

    this.sendMessage = function(msg) {
        output = this.encoder(msg);

        // The implementation of send_msg should *not* alter the
        // content in anyway prior to transmission.  This ensures that
        // switching to an alternate encoder is always safe.
        this._send_msg(output);
    };

};

exports.abstractSender = abstractSender;
