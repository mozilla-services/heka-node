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
"use strict"

var metlog = require('metlog');
var _ = require('underscore');
var restify = require('restify');


var config = {
    'sender': {'factory': './example/config_imports:makeMockSender' },
    'logger': 'test',
    'severity': metlog.SEVERITY.INFORMATIONAL,
    'disabledTimers': ['disabled_timer_name'],
    'filters': [['./example/config_imports:payloadIsFilterProvider' , {'payload': 'nay!'}]],
    'plugins': {'showLogger': {'provider': './example/config_imports:showLoggerProvider',
                                'label': 'some-label-thing' }}
};
var jsonConfig = JSON.stringify(config);
var client = metlog.clientFromJsonConfig(jsonConfig);
console.log(client);
