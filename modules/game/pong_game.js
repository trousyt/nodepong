/* 
 * pong_game.js
 * board: {width, height, padding}
 * paddles[idx] = {y, height, width, offset}
 * ball = {x, y, angle, dx, dy, da}
 */

var nextGameId = 0;

define(['./pong_physics', './pong_assets'], function(physicsModule, assetsModule) {

	var physics = physicsModule.create();

	// Private instance vars.
	var options = {
		pointsInRound: 10
	};

	function PongGame(board, opts) {
		this.board = board;			// The board instance
		this.paddles = [];			// Paddle array (max size 2)
		this.balls = [];			// Balls array
		this.scores = [0,0];		// Scores array
		this.round = 1;				// Round counter
		this.gameId = nextGameId++;	// Unique game identifier

		options.paddleInit = assetsModule.paddle.createDefault;
		options.ballInit = assetsModule.ball.createDefault;
		
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
		console.log('got player idx with id ' + playerIdx);
		if (playerIdx < 0) return -1;
		this.paddles.push(options.paddleInit());
		return playerIdx;
	};

	PongGame.prototype.addBall = function(ball) {
		ball = ball || options.ballInit();
		this.balls.push(ball);
	};

	PongGame.prototype.getPlayerIdx = function() {
		return this.isFull() || this.paddles.count === 0 ? -1 :
				this.paddles[0] ? 1 : 0;
	};

	PongGame.prototype.isFull = function() {
		return this.paddles.count > 0 && 
			this.paddles[0] && this.paddles[1];
	};

	PongGame.prototype.start = function() {
		if (this.balls.length === 0) {
			this.balls.push()
		}
	};

	PongGame.prototype.sync = function(source) {

		var sync = function(source, target, prefix) {
			prefix = prefix || '';

			for (var prop in source) {
				if (source.hasOwnProperty(prop)) {
					if (typeof source[prop] === 'object') {
						console.log(prefix + 'Syncing object: ' + prop);
						console.log(source[prop]);
						target[prop] = target[prop] || {};
						sync(source[prop], target[prop], prefix + '>');
						//console.log(prefix + 'Object is now:');
						//console.log(target[prop]);
						continue;
					}

					console.log(prefix + 'Syncing property: "' + prop + '" with value "' + source[prop] + '"');
					//target = target || {};
					target[prop] = source[prop];
					console.log(prefix + 'Target property is now: ' + target[prop]);
				}
			}
		};

		sync(source, this);
		
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
				if (score >= options.pointsInRound) {
					this.round++;
					// Notify caller here that a new round has begun.
				}
			}
		});
	};

	PongGame.prototype.render = function(ctx) {
		//console.log(this.paddles);
		if (this.paddles.count > 0) {
			for (var paddle in this.paddles) {
				paddle.render(ctx);
			}
		}

		//console.log(this.balls);
		if (this.balls.count > 0) {
			for (var ball in this.balls) {
				ball.render(ctx);
			}
		}
	};

	return {
		create: function(board, options) {
			return new PongGame(board, options);
		}
	};

}); // /define
