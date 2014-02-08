"use strict";

/**
 * Module to provide debug functionality app-wide.
 *
 * @module debug
 */
define(function() {

	var my = {};

	my.write = function(message) {
		console.log(message);
	};

	return my;

}); // /define