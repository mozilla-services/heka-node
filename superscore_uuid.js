/*
 * superscore uuid.js 0.2.2
 * (c) 2012 David Souther
 * superscore is freely distributable under the MIT license.
 * For all details and documentation:
 * https://github.com/DavidSouther/superscore
 *
 */
var Sha1 = require('./sha1.js').Sha1;
var rvalid = /^\{?[0-9a-f]{8}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{12}\}?$/i;

// Convert a string UUID to binary format.
//
// @param   string  uuid
// @return  string
var bin = function(uuid) {
	if ( ! uuid.match(rvalid))
	{	//Need a real UUID for this...
		return false;
	}

	// Get hexadecimal components of uuid
	var hex = uuid.replace(/[\-{}]/g, '');

	// Binary Value
	var bin = '';

	for (var i = 0; i < hex.length; i += 2)
	{	// Convert each character to a bit
		bin += String.fromCharCode(parseInt(hex.charAt(i) + hex.charAt(i + 1), 16));
	}

	return bin;
};

function uuid_v5(msg, namespace) {
	var nst = bin(namespace || '00000000-0000-0000-0000-000000000000');

	var hash = Sha1.hash(nst + msg, true);
	var uuid =  hash.substring(0, 8) +	//8 digits
		'-' + hash.substring(8, 12)	+ //4 digits
//			// four most significant bits holds version number 5
		'-' + ((parseInt(hash.substring(12, 16), 16) & 0x0fff) | 0x5000).toString(16) +
//			// two most significant bits holds zero and one for variant DCE1.1
		'-' + ((parseInt(hash.substring(16, 20), 16) & 0x3fff) | 0x8000).toString(16) +
		'-' + hash.substring(20, 32);	//12 digits
	return uuid;
};

exports.uuid_v5 = uuid_v5;
