/* Physics
 * game: PongGame instance
 * scoreCallback = function(playerIdx, increment)
 */

function PongPhysics() {
	// Noop
}

 PongPhysics.prototype.update = function(game, scoreCallback) {
	var board = game.board;
	var paddles = game.paddles;
	var balls = game.balls;

	for (var ball in balls) {

		ball.x = ball.x + Math.cos(ball.angle) * ball.da;
		ball.y = ball.y + Math.sin(ball.angle) * ball.da;
		
		// The ball hit a side-wall.
		// A score happened!
		// Todo: Reset the ball position and increment the round (impl init_round event)
		if (ball.x <= 0) {
			ball.angle = Math.PI - ball.angle;
			if (scoreCallback) {
				scoreCallback(0);
			}				
		} else if (ball.x >= board.width) {
			ball.angle = Math.PI - ball.angle;
			if (scoreCallback) {
				scoreCallback(1);
			}
		}

		// The ball hit a paddle.
		// Todo: I need to get the width (offset) between the paddle and the board (in CSS, the padding)
		var paddle_offset = 10;

		//console.log('ball-y: ' + this.y + ', paddle-y: ' + paddles[0])
		if ((ball.x <= (board.padding + paddles.offset + paddles.width) && 
			ball.x >= paddles.offset &&
			ball.y >= paddles[0] &&
			ball.y <= paddles[0] + paddles.height) ||	
		    (ball.x >= board.width - (paddles.offset + paddles.width) && 
			ball.x <= board.width - paddles.offset &&
			ball.y >= paddles[1] && 
			ball.y <= paddles[1] + paddles.height)) {	
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
	} // /for
}; // /update

/*
 * Exports
 */
module.exports = {
	create: function() {
		return new PongPhysics();
	}
};