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
var resolver = require('../resolver');
var message = require('../message');
var crypto = require('crypto');
var ByteBuffer = require('bytebuffer');
var helpers = require('../message/helpers');
var toArrayBuffer = helpers.toArrayBuffer;

var resolveName = resolver.resolveName;

var HASHNAME_TO_ENUM = { 'sha1': message.Header.HmacHashFunction.SHA1,
    'md5': message.Header.HmacHashFunction.MD5};

var abstractSender = function() {
    /*
     * This is an abstract sender which all senders should reuse.
     * We need to enforce that all senders *must* have a default
     * encoder of JSON for serialization over the wire.
     */
    this.init = function(encoder, hmc) {
        if (typeof encoder === 'string') {
            this.encoder = resolveName(encoder);
        }

        if (encoder === undefined) {
            this.encoder = encoders.jsonEncoder;
        };


        if (hmc === undefined) {
            this.hmc = null;
        } else {
            this.hmc = hmc;
        }
    };

    this.buildHeader = function(msg, msg_length) {

        var header = new message.Header();
        header.message_encoding = this.encoder.encoder_type;

        header.message_length = msg_length;
        if (this.hmc != null) {
            var hmac = crypto.createHmac(this.hmc.hash_function, this.hmc.key);
            hmac.update(msg.encode().toBuffer());

            header.hmac_signer = this.hmc.signer;

            header.hmac_key_version = this.hmc.key_version;

            // TODO: handle the case where we don't have a match to
            // the hash function
            header.hmac_hash_function = HASHNAME_TO_ENUM[this.hmc.hash_function];
            header.hmac = ByteBuffer.wrap(toArrayBuffer(new Buffer(hmac.digest('hex'), 'hex')));
        }

        return header;
    };


    this.sendMessage = function(msg) {
        /*
         * Wire format is:
         *
         * 1 byte : RECORD_SEPARATOR
         * 1 byte : HEADER_LENGTH
         * N bytes : header
         * 1 byte : UNIT_SEPARATOR
         * N bytes : messsage bytes
         */
        var msg_buff = this.encoder.encode(msg);
        var header = this.buildHeader(msg, msg_buff.length);

        var header_buff = header.encode().toBuffer();

        var buff = new Buffer(2);
        buff.writeUInt8(message.RECORD_SEPARATOR, 0);
        buff.writeUInt8(header_buff.length, 1);

        var unit_buff = new Buffer(1);
        unit_buff.writeUInt8(message.UNIT_SEPARATOR, 0);

        var result_buff = Buffer.concat([buff, header_buff, unit_buff, msg_buff])
        // The implementation of send_msg should *not* alter the
        // content in anyway prior to transmission.  This ensures that
        // switching to an alternate encoder is always safe.
        this._send_msg(result_buff);
    };

};

exports.abstractSender = abstractSender;
