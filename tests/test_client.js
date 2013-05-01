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
"use strict"


var util = require("util");
var heka = require('../client');

/*
 *
    'sender': {'factory': './senders:udpSenderFactory',
               'hosts': 'localhost',
               'ports': 5565,
               'encoder': "./senders/encoders:protobufEncoder"},
               //'encoder': "./senders/encoders:jsonEncoder",
               },
               //'hmc': {signer: 'my_signer',
               //        key_version: '1.0',
               //        hash_function: 'sha1',
               //        key: 'abc'}},
 */

// The sender here is not correct
var heka_conf = {
    'sender': {'factory': './senders:udpSenderFactory',
               'hosts': 'localhost',
               'ports': 5565,
               'encoder': "./senders/encoders:protobufEncoder"},
    'logger': 'test',
    'severity': 5
};
var jsonConfig = JSON.stringify(heka_conf);
var log = heka.clientFromJsonConfig(jsonConfig);

var my_buff = Buffer(300);
var mock_send_msg = function(buff) {

    buff.copy(my_buff);

}

//log.sender._send_msg = mock_send_msg;
/*
  log.heka('foo', {fields: {cef_meta: {syslog_facility: 'KERN',
                            syslog_options: 'PID,NDELAY',
                            syslog_ident: 'some_identifier',
                            syslog_priority: 'EMERG',
*/
log.incr('foo');

