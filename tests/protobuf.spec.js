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
 *  Victor Ng (vng@mozilla.com)
 *
 ***** END LICENSE BLOCK *****
 */
"use strict";

var crypto = require('crypto');
var message = require('../message');
var helpers = require('../message/helpers');
var Header = message.Header;
var Message = message.Message;
var Field = message.Field;
var toArrayBuffer = helpers.toArrayBuffer;

var ProtoBuf = require("protobufjs");
var ByteBuffer = require("bytebuffer");

describe('ProtocolBuffer', function() {

    var header = new Header();
    header.message_length = 11;

    it('messages can be decoded from arraybuffer', function() {
        var buff = header.encode().toArrayBuffer();

        var new_header = Header.decode(buff);
        expect(new_header).toEqual(header);
    });

    it('messages can be decoded from nodejs Buffers', function() {
        var buff = header.encode().toBuffer();

        // Force the use of arraybuffer all the time or else bad
        // things happen
        var new_header = Header.decode(toArrayBuffer(buff));
        expect(new_header).toEqual(header);
        expect(new_header.message_length).toEqual(header.message_length);
    });

    describe('works with byte definitions', function() {
        it ('with a constructor', function() {
            var str_proto = "message Test { required bytes b = 0; }";
            var builder = ProtoBuf.protoFromString(str_proto);
            var Test = builder.build("Test");
            var bb = new ByteBuffer(4).writeUint32(0x12345678).flip();

            // this isn't obvious at all as the example code in the
            // ProtobufJS testsuite passes the bb buffer right into 
            // the constructor of Test which makes no sense at all

            // This is what's in the actual testcase
            // var myTest = new Test(bb); 

            // This is what actually works
            var myTest = new Test({b: bb});

            expect(myTest.b.array).toEqual(bb.array);
            var bb2 = new ByteBuffer(6);
            myTest.encode(bb2);
            expect(bb2.toHex()).toEqual("<02 04 12 34 56 78>");
            myTest = Test.decode(bb2);
            expect(myTest.b.BE().readUint32()).toEqual(0x12345678);
        });

        it('with assignment', function() {
            var str_proto = "message Test { required bytes b = 0; }";
            var builder = ProtoBuf.protoFromString(str_proto);
            var Test = builder.build("Test");
            var bb = new ByteBuffer(4).writeUint32(0x12345678).flip();

            // this isn't obvious at all as the example code in the
            // ProtobufJS testsuite passes the bb buffer right into 
            // the constructor of Test which makes no sense at all

            // This is what's in the actual testcase
            // var myTest = new Test(bb); 

            // This is what actually works
            var myTest = new Test();
            myTest.b = bb;

            expect(myTest.b.array).toEqual(bb.array);
            var bb2 = new ByteBuffer(6);
            myTest.encode(bb2);
            expect(bb2.toHex()).toEqual("<02 04 12 34 56 78>");
            myTest = Test.decode(bb2);
            expect(myTest.b.BE().readUint32()).toEqual(0x12345678);
        });

        it('with byte strings', function() {
            var str_proto = "message Test { required bytes b = 0; }";
            var builder = ProtoBuf.protoFromString(str_proto);
            var Test = builder.build("Test");
            var string_buffer = new Buffer('hello world');

            var myTest = new Test();
            myTest.b = ByteBuffer.wrap(toArrayBuffer(string_buffer));
            var expected = myTest.b.array;

            var jsbuf = myTest.encode().toArrayBuffer();
            var testCopy = Test.decode(jsbuf);
            var actual = myTest.b.array;
            expect(actual).toEqual(expected);
        });

        it('with hmac byte arrays', function() {
            var str_proto = "message Test { required bytes b = 0; }";
            var builder = ProtoBuf.protoFromString(str_proto);
            var Test = builder.build("Test");

            var key = 'my key';
            var text = 'my content';

            // This is a precomputed SHA1 hmac from python
            var py_hmac = '5e7a65776a38b5526daa8725ec31db31a7a8b50a';
            var digest = crypto.createHmac('sha1', key).update(text).digest();

            expect(digest.toString('hex')).toEqual(py_hmac);
            expect(digest.toString('hex').length).toEqual(40);

            var myTest = new Test();
            //var bb = new ByteBuffer(digest);
            myTest.b = new ByteBuffer(digest.length);

            for (var i = 0; i < digest.length; i++) {
                myTest.b.writeUint8(digest[i], i);
            }
            myTest.b.length = 20;
            //myTest.b.flip();

            var expected = myTest.b.array;

            var bb_encoded = myTest.encode();
            var ab = bb_encoded.toArrayBuffer();
            var testCopy = Test.decode(ab);

            // This is crazy.  Something about decoding array data
            // causes two extra bytes
            var bad_bytes = testCopy.b.array.slice(0,2);

            // These two bytes shouldn't be here.  at all.
            expect(bad_bytes[0]).toBe(2);
            expect(bad_bytes[1]).toBe(20);

            var actual = testCopy.b.array.slice(2);

            expect(actual).toEqual(expected);

            var actual_hex = ByteBuffer.wrap(actual).toHex().replace(/[\s|<|>]/g, '').toLowerCase();
            expect(actual_hex).toEqual(py_hmac);
        });

        it("doesn't know about arrays of double", function() {
            var m = new Message();
            var f = new Field();
            m.uuid = '0123456789012345';
            m.timestamp = 10;
            f.name = 'blah';
            f.value_format = Field.ValueFormat.RAW;
            f.value_type = Field.ValueType.DOUBLE;
            f.value_double.push(0.25);
            m.fields = [f];

            var buff = m.encode().toArrayBuffer();
            var new_msg = Message.decode(buff);
            console.log(new_msg.fields[0]);
            console.log(m.fields[0]);

            // TODO: this seems to work in test, but not in real code
            // with real messages.  
            expect(new_msg.fields[0]).toEqual(m.fields[0]);
        });
    });
});
