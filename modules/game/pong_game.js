/* 
 * pong_game.js
 * board: {width, height, padding}
 * paddles[idx] = {x, y, height, width, offset}
 * ball = {x, y, angle, dx, dy, da}
 */
"use strict";

var nextGameId = 0;

define(["./pong_physics", "./pong_assets"], function(physicsModule, assetsModule) {
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
		this.started = false;

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

	var getPlayerIdx = function(game) {
		return game.isFull() ? -1 :
			game.paddles.length === 0 ? 0 :
			game.paddles[0] ? 1 : 0;
	};

	PongGame.prototype.setPaddleInitializer = function(fn) {
		options.paddleInit = fn;
	};

	PongGame.prototype.setBallInitializer = function(fn) {
		options.ballInit = fn;
	}

	PongGame.prototype.addPlayer = function() {
		var playerIdx = getPlayerIdx(this);
		if (playerIdx < 0) return -1;
		this.addPaddle(playerIdx);
		return playerIdx;
	};

	PongGame.prototype.addBall = function(ball) {
		ball = ball || options.ballInit();

		if (!ball) {
			throw {
				name: "NoBallCreated",
				message: "No ball could be created. A ball initializer or ball asset must be provided."
			};
		}

		this.balls.push(ball);
	};

	PongGame.prototype.addPaddle = function(idx, paddle) {
		paddle = paddle || options.paddleInit();
		if (idx != 0){
			//paddle.x = this.board.width - paddle.width - this.board.padding;
			paddle.x = 15;	
		}

		if (!paddle) {
			throw {
				name: "NoPaddleCreated",
				message: "No paddle could be created. A paddle initializer or paddle asset must be provided."
			}
		}

		this.paddles.push(paddle);
	}

	PongGame.prototype.isFull = function() {
		return this.paddles.length === 2 && 
			this.paddles[0] && this.paddles[1];
	};

	PongGame.prototype.start = function() {
		if (this.started) return;

		this.started = true;
		if (this.balls.length === 0) {
			this.balls.push()
		}	
	};

	PongGame.prototype._createAsset = function(name) {
		console.log("Creating asset for " + name);
		var creators = {
			"paddles": options.paddleInit,
			"balls": options.ballInit
		};

		// Handle error case.
		if (typeof creators[name] === "undefined") {
			return {};
			// throw {
			// 	name: "NoObjCreatorDefined",
			// 	message: "No object creator was defined for object " + name
			// };
		}

		return creators[name]();
	};

	PongGame.prototype.sync = function(source) {
		var parent = "";
		var that = this;
		var sync = function(source, target, level) {
			level = level || 0;

			for (var prop in source) {
				if (!source.hasOwnProperty(prop)) continue;

				// Make note of the parent so we can create the proper object
				// when necessary.
				if (level === 0) parent = prop;
				if (typeof source[prop] === "object") {
					console.log("Syncing object: " + prop);
					target[prop] = target[prop] || that._createAsset(parent);
					sync(source[prop], target[prop], level + 1);
					continue;
				}

				console.log("Syncing property: '" + prop + "' with value '" + source[prop] + "'");;
				target[prop] = source[prop];
			} // /for
		}; // /sync

		sync(source, this);
	};

	PongGame.prototype.update = function() {
		if (!physics) {
			throw { 
				name: "PhysicsNotInitialized",
				message: "Physics needs to run, but isn't initialized yet"
			};
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
		ctx.clearRect(0, 0, this.board.width, this.board.height);

		//console.log(this.paddles);
		if (this.paddles.length > 0) {
			for (var idx in this.paddles) {
				//console.log("Attempting to render paddle " + idx);
				this.paddles[idx].render(ctx);
			}
		}

		//console.log(this.balls);
		if (this.balls.length > 0) {
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
