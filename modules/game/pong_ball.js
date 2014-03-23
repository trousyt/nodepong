/**
 * Module that models and contains logic for the rendering
 * and movement of a game ball.
 *
 * @module pong_ball
 */
 define(["./debug"], function(debug) {
 	"use strict";

 	var options = {
 		defaults: {
 			size: 10,
			x: 50,
			y: 50,
			angle: 0,
			dx: 10,
			dy: 10,
			speed: 10
 		}
 	};

	/**
	 * Game ball class that models a ball and provides movement
	 * and rendering logic.
	 *
	 * @class Ball
	 * @constructor
	 * @param {Number} size The size (width and height) of the ball.
	 * @param {Number} x The starting x position of the ball.
	 * @param {Number} y The starting y position of the ball.
	 * @param {Number} angle The starting angle of the ball.
	 * @param {Number} dx The change in x position on every move.
	 * @param {Number} dy The change in y position on every move.
	 * @param {Number} speed The movement speed of the ball.
	 * @param {Object} opts Options for the ball object.
	 */
	function Ball(size, x, y, angle, dx, dy, speed, opts) {
		this.size = size || 10;
		this.x = x || 0;
		this.y = y || 0;
		this.angle = angle || 0;
		this.dx = dx || 0;
		this.dy = dy || 0;
		this.speed = speed || 0;

		for(var prop in opts) {
			if (options.hasOwnProperty(prop)) {
				options[prop] = opts[prop];
			}
		}

		// this.move = function(newx, newy, newangle, newdx, newdy, newda) {
		// 	var x = newx || this.x;
		// 	var y = newy || this.y;
		// 	var angle = newangle || this.angle;
		// 	var dx = newdx || this.dx;
		// 	var dy = newdy || this.dy;

		// }
	};

	Ball.prototype.sync = function(ball) {
		this.x = ball.x;
		this.y = ball.y;
		this.angle = ball.angle;
		this.speed = ball.speed;
		this.size =  ball.size;
		this.dx = ball.dx;
		this.dy = ball.dy;
	};

	/**
	 * Renders the ball on a canvas.
	 *
	 * @method render
	 * @param {Object} ctx The 2d context of the canvas.
	 */
	Ball.prototype.render = function(ctx) {
		var size = this.size;
		var x = this.x;
		var y = this.y;

		ctx.save();
		ctx.fillStyle = "white";
		ctx.fillRect(this.x, this.y, this.size, this.size);
		ctx.restore();
	};

	return (function() {
		var exports = {
			create: function(size, x, y, angle, dx, dy, speed) {
				return new Ball(size, x, y, angle, dx, dy, speed);
			},
			createFromExisting: function(ball) {
				return exports.create(ball.size, ball.x, ball.y, ball.angle, ball.dx, ball.dy, ball.speed);
			},
			createDefault: function() {
				return exports.createFromExisting(options.defaults);
			}
		};
		return exports;
	})();

 }); // /define
