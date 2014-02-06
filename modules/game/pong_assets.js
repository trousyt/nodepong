/*
 * pong_assets.js
 * Contains pong asset classes (ball, paddles, etc.)
 * Utilized on both the server and client.
 */
"use strict";

 define(function() {

 	var options = {};

	/*
	 * Ball
	 */

	 options.ballDefaults = {
		size: 10,
		x: 50,
		y: 50,
		angle: 0,
		dx: 10,
		dy: 10,
		speed: 10
	};

	function Ball(size, x, y, angle, dx, dy, speed) {
		this.size = size || 10;
		this.x = x || 0;
		this.y = y || 0;
		this.angle = angle || 0;
		this.dx = dx || 0;
		this.dy = dy || 0;
		this.speed = speed || 0;

		// this.move = function(newx, newy, newangle, newdx, newdy, newda) {
		// 	var x = newx || this.x;
		// 	var y = newy || this.y;
		// 	var angle = newangle || this.angle;
		// 	var dx = newdx || this.dx;
		// 	var dy = newdy || this.dy;
		// 	var da = newda || this.da;


		// }
	}

	Ball.prototype.render = function(ctx) {
		var size = this.size;
		var x = this.x;
		var y = this.y;

		ctx.save();
		ctx.fillStyle = "white";
		ctx.fillRect(this.x, this.y, this.size, this.size);
		ctx.restore();
	};

	/*
	 * Paddle
	 */

	 options.paddleDefaults = {
		x: 10,	
		y: 10,
		width: 20,
		height: 80
	};

	function Paddle(x, y, width, height, padding) {
		this.x = x || 0;
		this.y = y || 0;
		this.width = width || 20;
		this.height = height || 80;
		this.padding = padding || 10;
	}

	Paddle.prototype.move = function(x, y) {
		this.x = x;
		this.y = y;
	};

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
		var ball = {
			create: function(size, x, y, angle, dx, dy, speed) {
				return new Ball(size, x, y, angle, dx, dy, speed);
			},
			createFromExisting: function(tmpl) {
				return ball.create(tmpl.size, tmpl.x, tmpl.y, tmpl.angle, tmpl.dx, tmpl.dy, tmpl.speed);
			},
			createDefault: function() {
				return ball.createFromExisting(options.ballDefaults);
			}
		};

		var paddle = {
			create: function(x, y, width, height, padding) {
				return new Paddle(x, y, width, height, padding);
			},
			createFromExisting: function(tmpl) {
				return paddle.create(tmpl.x, tmpl.y, tmpl.width, tmpl.height, tmpl.padding);
			},
			createDefault: function() {
				return paddle.createFromExisting(options.paddleDefaults);
			}
		};

		return {
			ball: ball,
			paddle: paddle
		};
	})();

 }); // /define
