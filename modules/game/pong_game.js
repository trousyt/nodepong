/* PongGame
 * board: {width, height, padding}
 * paddles[idx] = {y, height, width, offset}
 * ball = {x, y, angle, dx, dy, da}
 */

// Constants
var options = {
	pointInRound: 10
};

// Private instance vars.
var nextGameId = 0;
var options = {};
var physics = null;

function PongGame(board, physicsInst, assetsMod, opts) {
	this.board = board;			// The board instance
	this.paddles = [];			// Paddle array (max size 2)
	this.balls = [];			// Balls array
	this.scores = [0,0];		// Scores array
	this.round = 1;				// Round counter
	this.gameId = nextGameId++;	// Unique game identifier

	physics = physicsInst;
	options.paddleInit = assetsMod.paddle.createDefault;
	options.ballInit = assetsMod.ball.createDefault;
	
	// Use the passed in options (if any)
	if (opts) {
		for(var prop in opts) {
			if (opts.hasOwnProperty(prop)) {
				options[prop] = opts[prop];
			}
		}	
	}
}

PongGame.prototype.setPaddleInitializer = function(fn) {
	options.paddleInit = fn;
};

PongGame.prototype.setBallInitializer = function(fn) {
	options.ballInit = fn;
}

PongGame.prototype.addPlayer = function() {
	var playerIdx = this.getPlayerIdx();
	if (playerIdx < 0) return -1;
	this.paddles[playerIdx] = options.paddleInit();
	return playerIdx;
};

PongGame.prototype.addBall = function(ball) {
	ball = ball || options.ballInit();
	this.balls.push(ball);
};

PongGame.prototype.getPlayerIdx = function() {
	if (this.isFull()) return -1;
	return this.paddles[0] ? 1 : 0;
};

PongGame.prototype.isFull = function() {
	return this.paddles[0] && this.paddles[1];
};

PongGame.prototype.start = function() {
	if (this.balls.length === 0) {
		this.balls.push()
	}
};

PongGame.prototype.update = function() {
	if (!physics) {
		console.log("Physics needs to run but isn't initialized yet");
		return;
	}

	physics.update(this, function(playerIdx) {
		this.scores[playerIdx]++;
		// Notify caller here that a point was scored.

		for (var score in this.scores) {
			if (score >= DEFAULTS.POINTSINROUND) {
				this.round++;
				// Notify caller here that a new round has begun.
			}
		}
	});
};

PongGame.prototype.render = function(ctx) {
	for (var paddle in this.paddles) {
		paddle.render(ctx);
	}
};

/*
 * Exports
 */
module.exports = {
	create: function(board, physicsInst, assetsMod, options) {
		return new PongGame(board, physicsInst, assetsMod, options);
	}
};