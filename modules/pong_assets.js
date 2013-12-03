/*
 * pong_assets.js
 * Contains pong asset classes (ball, paddles, etc.)
 * Used on both the server and client.
 */

/*
 * board: {width, height, padding}
 * paddles[idx] = {y, height, width, offset}
 * ball = {x, y, angle, dx, dy, da}
 */

public function Physics(board, paddles, ball, scoreCallback) {
	this.board = board;
	this.paddles = paddles;
	this.ball = ball;
	this.scoreCallback = scoreCallback;

	this.movePaddle = function(idx, y) {
		paddles[idx].y = y;
	}

	this.update = function() {
		var board = this.board;
		var paddles = this.paddles;
		var ball = this.ball;

		ball.x = ball.x + Math.cos(ball.angle) * ball.da;
		ball.y = ball.y + Math.sin(ball.angle) * ball.da;
		
		// The ball hit a side-wall.
		// A score happened!
		// Todo: Reset the ball position and increment the round (impl init_round event)
		if (ball.x <= 0) {
			//scores[1] = scores[1]++;
			//round = round++;
			scoreCallback(0, 1);
			ball.angle = Math.PI - ball.angle;
		} else if (ball.x >= board.width) {
			//scores[0] = scores[0]++;
			//round = round++;
			scoreCallback(1, 1);
			ball.angle = Math.PI - ball.angle;
		}

		// The ball hit a paddle.
		// Todo: I need to get the width (offset) between the paddle and the board (in CSS, the padding)
		var paddle_offset = 10;

		//console.log('ball-y: ' + this.y + ', paddle-y: ' + paddles[0])
		if (ball.x <= (board.padding + paddles.offset + paddles.width) && 
			ball.x >= paddles.offset &&
			ball.y >= paddles[0] &&
			ball.y <= paddles[0] + paddles.height) || ///top
		   (ball.x >= board.width - (paddles.offset + paddles.width) && 
			ball.x <= board.width - paddles.offset &&
			ball.y >= paddles[1] && 
			ball.y <= paddles[1] + paddles.height) {
			ball.angle = Math.PI - ball_angle;
		}
	
		// The ball hit a top/bottom wall.
		if (ball.y <= 0) {
			ball.y = ball.dx;
			ball.angle = 0 - ball.angle;
			console.log("hit y<=0");
		} else if (ball.y >= board.height) {
			ball.y = board.height - ball.dx;
			ball.angle = 0 - ball.angle;
			console.log("hit y>= height");
		}
	}
}

/*
 * Ball
 */
public function Ball(x, y, angle, dx, dy, da) {
	this.x = x;
	this.y = y;
	this.angle = angle;
	this.dx = dx;
	this.dy = dy;
	this.da = da;
}

/*
 * Paddle
 */
public function Paddle(x, y, width, height, padding) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.padding = padding;

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