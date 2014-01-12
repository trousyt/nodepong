/*
 * pong_assets.js
 * Contains pong asset classes (ball, paddles, etc.)
 * Utilized on both the server and client.
 */
var DEFAULTS = {};

/*
 * Ball
 */

DEFAULTS.ball = {
	size: 10,
	x: 0,
	y: 0,
	angle: 0,
	dx: 10,
	dy: 10,
	da: 10
}

function Ball(size, x, y, angle, dx, dy, da) {
	this.size = size || 10;
	this.x = x || 0;
	this.y = y || 0;
	this.angle = angle || 0;
	this.dx = dx || 0;
	this.dy = dy || 0;
	this.da = da || 0;

	// this.move = function(newx, newy, newangle, newdx, newdy, newda) {
	// 	var x = newx || this.x;
	// 	var y = newy || this.y;
	// 	var angle = newangle || this.angle;
	// 	var dx = newdx || this.dx;
	// 	var dy = newdy || this.dy;
	// 	var da = newda || this.da;


	// }

	this.render = function(ctx) {
		var size = this.size;
		var x = this.x;
		var y = this.y;

		ctx.save();
		ctx.beginPath();
		ctx.arc(x, y, size / 2, 0, 2 * Math.PI, false);
		ctx.fillStyle = 'black';
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
}

/*
 * Paddle
 */

DEFAULTS.paddle = {
	x: 0,
	y: 0,
	width: 5,
	height: 10	
}

function Paddle(x, y, width, height, padding) {
	this.x = x || 0;
	this.y = y || 0;
	this.width = width || 20;
	this.height = height || 80;
	this.padding = padding || 10;

	this.move = function(x, y) {
		this.x = x;
		this.y = y;
	}

	this.render = function(ctx) {
		var width = ctx.canvas.width();
		var height = ctx.canvas.height();

		// When the coordinates are out of bounds,
		// just return immediately.
		if (this.x > width || this.y > height) {
			return;
		}

		ctx.save();
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.restore();
	}
}

module.exports = (function() {
	var ball = {};
	ball.create = function(x, y, angle, dx, dy, da) {
		return new Ball(x, y, angle, dx, dy, da);
	};
	ball.createFromExisting = function(tmpl) {
		return ball.create(tmpl.x, tmpl.y, tmpl.angle, tmpl.dx, tmpl.dy, tmpl.da);
	};
	ball.createDefault = function() {
		return ball.createFromExisting(DEFAULTS.ball);
	};

	var paddle = {};
	paddle.create = function(x, y, width, height, padding) {
		return new Paddle(x, y, width, height, padding);
	};
	paddle.createFromExisting = function(tmpl) {
		return paddle.create(tmpl.x, tmpl.y, tmpl.width, tmpl.height, tmpl.padding);
	};
	paddle.createDefault = function() {
		return paddle.createFromExisting(DEFAULTS.paddle);
	};

	return {
		ball: ball,
		paddle: paddle
	}
})();