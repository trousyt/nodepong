"use strict";

/**
 * Extends objects with publish and subscribe functionality.
 *
 * @module ext_pubsub
 */
define(["./debug"], function(debug) {

	var pubsub = function(extend) {

		var eventRegistry = {};

		/**
		 * Subscribes an event handler.
		 * 
		 * @method on
		 * @param {String} event The name of the event to subscribe to.
		 * @param {Function} fn The function to be called when the event is fired.
		 */
		extend.on = function(event, fn) {
			if (!eventRegistry.hasOwnProperty(event)) {
				eventRegistry[event] = [];
			}

			eventRegistry[event].push(fn);
			return this;
		};

		/**
		 * Fires an event.
		 *
		 * @method fire
		 * @param {String} event The name of the event to fire.
		 * @param {Array} params An array of parameters.
		 */
		extend.fire = function(event, params) {
			if (!eventRegistry.hasOwnProperty(event)) {
				return;
			}

			var handlers = eventRegistry[event];
			for (var i=0; i < handlers.length; i++) {
				var fn = handlers[i];

				if (typeof params !== "array") {
					params = [params];
				}

				fn.apply(extend, params || [event]);
			}
			return this;
		};

		return extend;
	};	// /pubsub

	return pubsub;

}); // /define
