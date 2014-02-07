"use strict";

/**
 * Module that models and contains logic for the rendering
 * and movement of a game paddle.
 *
 * @module pong_paddle
 */
 define(function() {

 	var options = {
 		defaults: {
			x: 10,	
			y: 10,
			width: 20,
			height: 80
		}
	};

	/**
	 * Game paddle class that models a paddle and provides movement
	 * and rendering logic.
	 *
	 * @class Paddle
	 * @constructor
	 * @param {Number} x The starting x position of the paddle.
	 * @param {Number} y The starting y position of the paddle.
	 * @param {Number} width The width of the paddle.
	 * @param {Number} height The height of the paddle.
	 */
	function Paddle(x, y, width, height, padding) {
		this.x = x || 0;
		this.y = y || 0;
		this.width = width || 20;
		this.height = height || 80;
		this.padding = padding || 10;
	};

	/**
	 * Moves the paddle to the specified coordinates.
	 *
	 * @method move
	 * @param {Number} x The x-coordinate to move to.
	 * @param {Number} y The y-coordinate to move to.
	 */
	Paddle.prototype.move = function(x, y) {
		this.x = x;
		this.y = y;
	};

	/**
	 * Renders the paddle on a canvas.
	 * 
	 * @method render
	 * @param {Object} ctx The 2d context of the canvas.
	 */
	Paddle.prototype.render = function(ctx) {
		var width = ctx.canvas.width;
		var height = ctx.canvas.height;
		
		//console.log("canvas height: " + height);
		// When the coordinates are out of bounds,
		// just return immediately.
		if (this.x > width || this.y > height) {
			return;
		}

		ctx.save();
		ctx.fillStyle = "white";
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.restore();
	};

	return (function() {
		var exports = {
			create: function(x, y, width, height, padding) {
				return new Paddle(x, y, width, height, padding);
			},
			createFromExisting: function(paddle) {
				return exports.create(paddle.x, paddle.y, paddle.width, paddle.height, paddle.padding);
			},
			createDefault: function() {
				return exports.createFromExisting(options.defaults);
			}
		};
		return exports;
	})();

 }); // /define
