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
"use strict";
var dev = require('./dev.js');
var udp = require('./udp.js');

exports.debugStreamFactory = dev.debugStreamFactory;
exports.fileStreamFactory = dev.fileStreamFactory;
exports.stdoutStreamFactory = dev.stdoutStreamFactory;
exports.udpStreamFactory = udp.udpStreamFactory;
