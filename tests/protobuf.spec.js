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

var message = require('../message');
var Header = message.Header;
var Message = message.Message;
var Field = message.Field;
var ProtoBuf = require("protobufjs");
var ByteBuffer = require("bytebuffer");
var Long = require('Long');

function build_msg() {
    var m = new Message();
    var f = new Field();

    m.uuid = '0123456789012345';
    m.type = 'demo';
    m.timestamp = 1000000;
    f.name = 'myfield'
        f.representation = "";
    m.fields = [f];
    return m;
}

function int64_ts_msg(ts_as_ns) {
    // This generate a message with an int64 timestamp
    var m = new Message();
    m.uuid = '0123456789012345';
    m.type = 'demo';
    m.setTimestamp(ts_as_ns);
    return m;
}

function compute_hex(array_buff) {
    var hex_values = [];
    for (var i = 0; i < array_buff.byteLength; i++) {
        var hex_val = Number(array_buff[i]).toString(16);
        if (hex_val.length < 2) {
            hex_val = '0' + hex_val;
        }
        hex_values = hex_values.concat(hex_val);
    }
    return hex_values.join(":");
}

function check(msg, expected) {
    var buff = msg.encode().toArrayBuffer();
    var buff_hex = compute_hex(buff);
    expect(buff_hex).toEqual(expected);
}

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
        var new_header = Header.decode(buff);
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
            myTest.b = ByteBuffer.wrap(string_buffer);
            var expected = myTest.b.array;

            var jsbuf = myTest.encode().toArrayBuffer();
            var testCopy = Test.decode(jsbuf);
            var actual = myTest.b.array;
            expect(actual).toEqual(expected);
        });
    });

});

describe('ProtocolBuffer msg serializes fields', function() {
    it ("with string", function() {
        var expected = '0a:10:30:31:32:33:34:35:36:37:38:39:30:31:32:33:34:35:10:c0:84:3d:1a:04:64:65:6d:6f:52:14:0a:07:6d:79:66:69:65:6c:64:10:00:1a:00:22:05:68:65:6c:6c:6f';
        var m = build_msg();
        var f = m.fields[0];
        f.value_type = Field.ValueType.STRING;
        f.value_string.push("hello")
        check(m, expected);
    });

    it ("with bytes", function() {
        var expected = '0a:10:30:31:32:33:34:35:36:37:38:39:30:31:32:33:34:35:10:c0:84:3d:1a:04:64:65:6d:6f:52:19:0a:07:6d:79:66:69:65:6c:64:10:01:1a:00:2a:0a:73:6f:6d:65:5f:62:79:74:65:73';
        var m = build_msg();
        var f = m.fields[0];
        f.value_type = Field.ValueType.BYTES;
        f.value_bytes.push("some_bytes")
        check(m, expected);
    });

    it ("with integer", function() {
         var expected = '0a:10:30:31:32:33:34:35:36:37:38:39:30:31:32:33:34:35:10:c0:84:3d:1a:04:64:65:6d:6f:52:10:0a:07:6d:79:66:69:65:6c:64:10:02:1a:00:32:01:05';

        var m = build_msg();
        var f = m.fields[0];
        f.value_type = Field.ValueType.INTEGER;
        f.value_integer.push(5)
        check(m, expected);

    });
    it ("with bool", function() {
        var expected = '0a:10:30:31:32:33:34:35:36:37:38:39:30:31:32:33:34:35:10:c0:84:3d:1a:04:64:65:6d:6f:52:10:0a:07:6d:79:66:69:65:6c:64:10:04:1a:00:42:01:01';
        var m = build_msg();
        var f = m.fields[0];
        f.value_type = Field.ValueType.BOOL;
        f.value_bool.push(true);
        check(m, expected);
    });

    it("with double", function() {
        var EXPECTED_PYTHON_OUTPUT = '0a:10:30:31:32:33:34:35:36:37:38:39:30:31:32:33:34:35:10:c0:84:3d:1a:04:64:65:6d:6f:52:17:0a:07:6d:79:66:69:65:6c:64:10:03:1a:00:3a:08:1f:85:eb:51:b8:1e:09:40';
        var m = build_msg();
        var f = m.fields[0];
        f.value_type = Field.ValueType.DOUBLE;
        f.value_double.push(3.14);
        check(m, EXPECTED_PYTHON_OUTPUT);
    });

});

describe('ProtocolBuffer msg timestamps', function() {
    it("with a full int64 value", function() {
        var ts_as_ns = 133306560000000000;
        var msg = int64_ts_msg(ts_as_ns);
        var buff = msg.encode().toArrayBuffer();
        var buff_hex = compute_hex(buff);

        var new_msg = Message.decode(buff);
        expect(new_msg.timestamp.toNumber()).toEqual(ts_as_ns);
    });
});
