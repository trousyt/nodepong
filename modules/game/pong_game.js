/* 
 * pong_game.js
 * board: {width, height, padding}
 * paddles[idx] = {y, height, width, offset}
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

	PongGame.prototype.setPaddleInitializer = function(fn) {
		options.paddleInit = fn;
	};

	PongGame.prototype.setBallInitializer = function(fn) {
		options.ballInit = fn;
	}

	PongGame.prototype.addPlayer = function() {
		var playerIdx = this._getPlayerIdx();
		console.log("got player idx with id " + playerIdx);
		if (playerIdx < 0) return -1;
		this.paddles.push(options.paddleInit());
		return playerIdx;
	};

	PongGame.prototype.addBall = function(ball) {
		ball = ball || options.ballInit();
		this.balls.push(ball);
	};

	PongGame.prototype._getPlayerIdx = function() {
		return this.isFull() || this.paddles.length === 0 ? -1 :
				this.paddles[0] ? 1 : 0;
	};

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

	PongGame.prototype.createAsset = function(name) {
		var creators = {
			"paddles": this.options.paddleInit,
			"balls": this.options.ballInit
		};

		// Handle error case.
		if (typeof creators[name] === "undefined") {
			throw {
				name: "NoObjCreatorDefined",
				message: "No object creator was defined for object " + name
			};
		}

		return creators[name]();
	};

	PongGame.prototype.sync = function(source) {

		var sync = function(source, target, prefix) {
			prefix = prefix || "";

			for (var prop in source) {
				if (source.hasOwnProperty(prop)) {
					if (typeof source[prop] === "object") {
						console.log(prefix + "Syncing object: " + prop);
						target[prop] = target[prop] || {};	// TODO: Create the asset properly
						sync(source[prop], target[prop], prefix + ">");
						continue;
					}

					console.log(prefix + "Syncing property: '" + prop + "' with value '" + source[prop] + "'");;
					target[prop] = source[prop];
				} // /if
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
		//console.log(this.paddles);
		if (this.paddles.length > 0) {
			for (var idx in this.paddles) {
				console.log("Attempting to render paddle " + idx);
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
