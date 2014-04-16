/**
 * Module that contains logic for collision and movement
 * of game assets.
 *
 * @module pong_physics
 */
define(["../common/ext_pubsub", "../common/debug"], function(pubsub, debug) {
	"use strict";

	/**
	 * Provides the logic for collision and movement of game assets.
	 *
	 * @class PongPhysics
	 * @constructor
	 */
	function PongPhysics() {
		// Noop
	};

	// Extend this class with publish-subscribe functionality.
	pubsub(PongPhysics.prototype);

	/**
	 * Updates the game assets according to movement and collision logic.
	 *
	 * @method update
	 * @param {Object} game The game instance to update.
	 */
	PongPhysics.prototype.update = function(game) {
		var board = game.board;
		var paddles = game.paddles;
		var balls = game.balls;

		for ( var i=0; i < balls.length; i++ ) {
			var ball = balls[i];

			//define deltaX and deltaY
			var dx = Math.cos(ball.angle) * ball.speed;
			var dy = Math.sin(ball.angle) * ball.speed;
			
			ball.dx = dx;
			ball.dy = dy;

			//new ball location
			ball.x = ball.x + dx; 
			ball.y = ball.y + dy;

			//console.log("ball_x: " + ball.x);
			//console.log("ball_y: " + ball.y);
			//console.log("board padding: " + board.padding);
			
			// The ball hit a side-wall.
			// A score happened!
			// TODO: Reset the ball position and increment the round (impl init_round event)
			if (ball.x <= 0) {					// Left wall
				ball.angle = Math.PI - ball.angle;
				this.fire("score", 1);
			} else if (ball.x >= board.width) {	// Right wall
				ball.angle = Math.PI - ball.angle;
				this.fire("score", 0);
			}

			// The ball hit a paddle.
			//var paddleOffset = board.padding;
			/*var paddle = 2;*/

			// Calculate new ball angle after bouncing off of a paddle.	
			var paddleBounce = function(i){
				//var paddleIdx = paddle - 1;

				var paddleMid = paddles[i].y + (paddles[i].height / 2);
				var ballMid = ball.y + (ball.size / 2);

				var midDistance = ballMid - paddleMid;
				var fullMidDistance = (paddles[i].height / 2) + (ball.size / 2);

				var angle = (midDistance / fullMidDistance) *  (Math.PI / 2);

				//angle = (Math.PI / 2) - angle;

				if (i == 1){
					ball.x = paddles[i].x - ball.size;
					angle = Math.PI - angle;
				}else if (i == 0){
					ball.x = paddles[i].x;
				}

				console.log("ball angle: " + angle)

				return angle;
			};
			
			// check each paddle for ball collision
			for ( var i =0; i < paddles.length; i++ ) {
				// 0 = left paddle, 1 = paddle
				if((( (i == 0) && (dx < 0) && (ball.x < paddles[i].x + paddles[i].width) ) ||
					( (i == 1) && (dx > 0) && (ball.x + ball.size > paddles[i].x) )) &&
					(ball.y > (paddles[i].y - ball.size) ) &&
					(ball.y < (paddles[i].y + paddles[i].height) )){

					ball.angle = paddleBounce(i);

					debug.write("Firing paddleBounce in Physics");
					this.fire("paddleBounce", ball);
					//ball.angle = paddleBounce(i);

					/*if (((i == 0) && (dx < 0) && (ball.x < (paddle[i].x + paddles[i].width))) ||
						((i == 1) && (dx > 0)) && (ball.x > (paddles[i].x - ball.size))){
						paddle = i;
					}*/
				}
			}

/*			if (paddle != 2){
				ball.angle = paddleBounce(paddle);
				paddle = 2;

				debug.write("Firing paddleBounce in Physics");
				this.fire("paddleBounce", ball);

			}
*/		
			// Calculate new ball angle after bouncing off of top or bottom walls
			var topBottomBounce = function(angle){
				angle = (2 * Math.PI) - angle;

				return angle;
			};

			// The ball hit a top/bottom wall.
			if (ball.y <= 0) {
				ball.y = 0;						// Top wall
				ball.angle = topBottomBounce(ball.angle);
				debug.write("hit y <= 0");
			} else if (ball.y >= board.height) {	// Bottom wall
				ball.y = board.height -  ball.size;
				ball.angle = topBottomBounce(ball.angle);
				debug.write("hit y >= height");
			}	

			// Convert ball angle to remain positive
			if (ball.angle < 0){
				ball.angle = (2 * Math.PI) + ball.angle;
			}
			
		} // /for
	}; // /update

	return {
		create: function() {
			return new PongPhysics();
		}
	};

}); // /define
