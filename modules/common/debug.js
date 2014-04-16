/**
 * Module to provide debug functionality app-wide.
 *
 * @module debug
 */
define(function() {
	"use strict";

	var dbg = {};

	dbg.write = function(message) {
		console.log(message);
	};

	return dbg;

}); // /define