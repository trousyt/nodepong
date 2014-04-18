/**
 * Extends objectsmixin_ with publish and subscribe functionality.
 *
 * @module mixin_pubsub
 */
define(["./debug"], function(debug) {
	"use strict";

	var pubsub = function(extend) {

		var eventRegistry = {};


		/**
		 * Registers an event handler with a given alias.
		 *
		 * @param {String} event The name of the event to subscribe to.
		 * @param {String} alias The alias of the handler to subscribe.
		 * @param {Function} fn The function to be called when the event is fired.
		 */
		function addHandler(event, fn, alias) {
			// Create a new handler array for the event
			// if this is the first handler to be registered.
			if (!eventRegistry.hasOwnProperty(event)) {
				eventRegistry[event] = [];
			}

			eventRegistry[event].push({
				alias: alias,
				fn: fn
			});
		}

		/**
		 * Subscribes an event handler with the given alias only once.
		 * 
		 * @method once
		 * @param {String} event The name of the event to subscribe to.
		 * @param {String} alias The alias of the handler to subscribe.
		 * @param {Function} fn The function to be called when the event is fired.
		 */
		extend.once = function(event, alias, fn) {
			// If no event name or function supplied, simply return.
			if (!event) return;
			if (!fn) return;

			// If an alias was provided, we check to see if it has
			// already been defined on a registered handler.
			// If it has, we simply exit out without re-adding.
			if (alias) {
				var handlers = eventRegistry[event];
				if (handlers && handlers.length > 0) {
					for (var i=0; i < handlers.length; i++) {
						var blias = handlers[i].alias;
						if (blias && blias === alias) {
							return;
						}
					}
				}
			}

			addHandler(event, fn, alias);
		}

		/**
		 * Subscribes an event handler.
		 * 
		 * @method on
		 * @param {String} event The name of the event to subscribe to.
		 * @param {Function} fn The function to be called when the event is fired.
		 */
		extend.on = function(event, fn) {
			if (!event) return;
			if (!fn) return;

			addHandler(event, fn);
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

			// Loop through all registered handlers and
			// call each of them synchronously.
			var handlers = eventRegistry[event];
			for (var i=0; i < handlers.length; i++) {
				var fnobj = handlers[i];

				if (!(params instanceof Array)) {
					params = [params];
				}

				fnobj.fn.apply(extend, params || [event]);
			}
			return this;
		};

		return extend;
	};	// /pubsub

	return pubsub;

}); // /define
