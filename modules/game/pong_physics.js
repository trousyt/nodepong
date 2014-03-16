/**
 * Module that contains logic for collision and movement
 * of game assets.
 *
 * @module pong_physics
 */
define(["./ext_pubsub", "./debug"], function(pubsub, debug) {
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

			ball.x = ball.x + Math.cos(ball.angle) * ball.speed;
			ball.y = ball.y + Math.sin(ball.angle) * ball.speed;

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
			var paddleOffset = board.padding;
			if ((ball.x <= (paddleOffset + paddles[0].width) && 				// Left paddle
				ball.x >= paddleOffset &&
				ball.y >= paddles[0].y &&
				ball.y <= paddles[0].y + paddles[0].height) ||	
			    (ball.x >= board.width - (paddleOffset + paddles[1].width) && 	// Right paddle
				ball.x <= board.width - paddleOffset &&
				ball.y >= paddles[1].y && 
				ball.y <= paddles[1].y + paddles[1].height)) {

				ball.angle = Math.PI - ball.angle;
			}
		
			// The ball hit a top/bottom wall.
			if (ball.y <= 0) {						// Top wall
				ball.angle = ball.angle - Math.PI;
				debug.write("hit y <= 0");
			} else if (ball.y >= board.height) {	// Bottom wall
				ball.y = board.height;
				ball.angle = ball.angle - Math.PI;
				debug.write("hit y >= height");
			}	

			// Convert ball angle to remain positive
			if (ball.angle < 0){
				ball.angle = (2 * Math.PI) - ball.angle;
			}
			
		} // /for
	}; // /update

	return {
		create: function() {
			return new PongPhysics();
		}
	};

}); // /define
