/* PongGame
 * board: {width, height, padding}
 * paddles[idx] = {y, height, width, offset}
 * ball = {x, y, angle, dx, dy, da}
 */

// Constants
var POINTS_IN_ROUND = 10;

// Physics Engine
var physicsModule = require('./pong_physics');
var pongPhysics = physicsModule.create();
var nextGameId = 0;

function PongGame(board, paddleTemplateFn, ballTemplateFn) {
	this.paddleTemplate = paddleTemplateFn;
	this.ballTemplate = ballTemplateFn;
	this.board = board;			// The board instance
	this.paddles = [];			// Paddle array (max size 2)
	this.balls = [];			// Balls array
	this.scores = [0,0];		// Scores array
	this.round = 1;				// Round counter
	this.gameId = nextGameId++;	// Unique game identifier

	this.getPlayerIdx = function() {
		if (this.isFull()) return -1;
		return this.paddles[0] ? 1 : 0;
	}

	this.addPlayer = function() {
		var playerIdx = this.getPlayerIdx();
		if (playerIdx < 0) return -1;
		this.paddles[playerIdx] = this.paddleTemplate();
		return playerIdx;
	}

	this.addBall = function(ball) {
		ball = ball || this.ballTemplate();
		this.balls.push(ball);
	}

	this.isFull = function() {
		return this.paddles[0] && this.paddles[1];
	}

	this.start = function() {
		if (this.balls.length === 0) {
			this.balls.push()
		}
	}

	this.update = function() {
		pongPhysics.update(this, function(playerIdx) {
			this.scores[playerIdx]++;
			// Notify caller here that a point was scored.

			for (var score in this.scores) {
				if (score >= POINTS_IN_ROUND) {
					this.round++;
					// Notify caller here that a new round has begun.
				}
			}
		});
	}

	this.render = function(ctx) {
		for (var paddle in this.paddles) {
			paddle.render(ctx);
		}
	}
}

module.exports = {
	create: function(board, paddleTemplate, ballTemplate) {
		return new PongGame(board, paddleTemplate, ballTemplate);
	}
}