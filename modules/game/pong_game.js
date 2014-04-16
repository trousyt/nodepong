/**
 * Module that provides logic and construction for the PongGame class.
 *	board: {width, height, padding}
 * 	paddles[idx] = {x, y, height, width, offset}
 * 	ball = {x, y, angle, dx, dy, da}
 *
 * @module pong_game
 * @requires pong_physics, pong_assets
 */
define(["./pong_physics", "./pong_board", "./pong_ball", "./pong_paddle", "./pong_settings", "../common/ext_pubsub", "../common/debug"], 
	function(physicsModule, boardModule, ballModule, paddleModule, settings, pubsub, debug) {
		"use strict";

		debug.write("Initializing Game module");
		var physics = physicsModule.create();
		var nextGameId = 1;

		// Private instance vars.
		var options = {
			pointsInRound: settings.pointsInRound
		};

		/**
		 * Container class for the game logic, physics, and all assets.
		 *
		 * @class PongGame
		 * @constructor
		 * @param {Object} board The board to use for this game instance.
		 * @param {Object} [opts] The options to use for this game instance.
		 */
		function PongGame(board, opts) {
			var that = this;

			options.initializers = {
				paddle: paddleModule.createDefault,
				board: boardModule.createDefault,
				ball: ballModule.createDefault
			};

			this.board = board || boardModule.createDefault();	// The board instance
			this.paddles = [];			// Paddle array (max size 2)
			this.balls = [];			// Balls array
			this.scores = [0,0];		// Scores array
			this.round = 1;				// Round counter
			this.gameId = nextGameId++;	// Unique game identifier
			this.started = false;
			this.paused = false;

			// Use the passed in options (if any)
			if (opts) {
				for(var prop in opts) {
					if (opts.hasOwnProperty(prop)) {
						options[prop] = opts[prop];
					}
				}
			}

			// Handle ball scoring logic.
			// We want to reset asset positions and increment the
			// score whenever the physics instance reports a score.
			physics.on("score", function(playerIdx) {
				debug.write("Player '" + playerIdx + "' scored!");

				that.scores[playerIdx]++;
				that.fire("score", playerIdx);
				that.resetBalls();

				for (var i=0; i < that.scores.length; i++) {
					var score = that.scores[i];
					if (score >= options.pointsInRound) {
						that.round++;
						that.resetScores();
						that.fire("newRound", that.round);
					}
				}
			});
			
			physics.on("paddleBounce", function(ball) {
				debug.write("Firing paddleBounce in Game");
				that.fire("paddleBounce", ball);
			});

		};	// /PongGame

		// Extend this class with publish-subscribe functionality.
		pubsub(PongGame.prototype);

		/**
		 * Creates a new asset of the provided property name.
		 * 
		 * @method createAsset
		 * @private
		 * @param {String} name The name of the property on the game instance.
		 * @return {Object} A new instance of the object associated with the property name.
		 */
		function createAsset(name) {
			var creators = {
				"paddles": options.initializers.paddle,
				"balls": options.initializers.ball,
				"board": options.initializers.board
			};

			// Handle error case where the type isn't known.
			if (typeof creators[name] === "undefined") {
				return {};
			}

			debug.write("Creating object of type '" + name + "'");
			var asset = creators[name]();
			return asset;
		};

		/**
		 * Sets the initializer used to create new paddle instances.
		 *
		 * @method setPaddleInitializer
		 * @param {Function} fn The paddle initializer function.
		 */
		PongGame.prototype.setPaddleInitializer = function(fn) {
			options.paddleInit = fn;
		};

		/**
		 * Sets the initializer used to create new ball instances.
		 *
		 * @method setBallInitializer
		 * @param {Function} fn The ball initializer function.
		 */
		PongGame.prototype.setBallInitializer = function(fn) {
			options.ballInit = fn;
		};

		/**
		 * Gets the next available player index.
		 *
		 * @method getNextPlayerIdx
		 * @private
		 * @return {Number} Returns the next available index, or -1 if the game is full.
		 */
		var getNextPlayerIdx = function(game) {
			return game.isFull() ? -1 :
				game.paddles.length === 0 ? 0 :
				game.paddles[0] ? 1 : 0;
		};

		/**
		 * Add a new player to the game and create a paddle for them.
		 *
		 * @method addPlayer
		 * @return {Number} Returns the player's index, or -1 if the player couldn't be added.
		 */
		PongGame.prototype.addPlayer = function() {
			var playerIdx = getNextPlayerIdx(this);
			if (playerIdx < 0) return -1;

			this.addPaddle(playerIdx);
			this.fire("playerAdded", playerIdx);
			return playerIdx;
		};

		/** 
		 * Removes a player from the game.
		 *
		 * @method removePlayer
		 * @param {Number} The index of the player to remove.
		 */
		PongGame.prototype.removePlayer = function(playerIdx) {
			debug.write("removePlayer playerIdx = " + playerIdx);

			if (typeof this.paddles[playerIdx] === 'undefined') {
				throw {
					name: "InvalidPlayerIdx",
					message: "The player at index " + playerIdx + " isn't a valid player."
				};
			}

			// Remove the player's paddle and pause the game.
			this.paddles.slice(playerIdx, 1);	// TODO: This isn't causing isFull to return false
			this.pause();
		}

		/**
		 * Adds a new ball instance to the game.
		 *
		 * @method addBall
		 * @param {Object} [ball] The ball instance to add.
		 */
		PongGame.prototype.addBall = function(ball) {
			ball = ball || options.initializers.ball();

			if (!ball) {
				throw {
					name: "NoBallCreated",
					message: "No ball could be created. A ball initializer or ball asset must be provided."
				};
			}

			this.balls.push(ball);
			this.fire("ballAdded", ball);
			return ball;
		};

		/**
		 * Resets the ball position.
		 * 
		 * @method resetBalls
		 */
		PongGame.prototype.resetBalls = function() {
			if (this.balls && this.balls.length > 0) {
				var ball = this.balls[0];
				ball.x = this.board.width / 2;
				ball.y = this.board.height / 2;
				ball.angle = 0;
			}
		};

		/**
		 * Resets the game scores.
		 * 
		 * @method resetScores
		 */	
		PongGame.prototype.resetScores = function() {
			if (this.scores && this.scores.length > 1) {
				this.scores[0] = this.scores[1] = 0;
			}
		};

		/**
		 * Provided with a game instance, index, and paddle, initializes the paddle's x position.
		 *
		 * @method initPaddlePosition
		 * @private
		 * @return {Object} The paddle instance.
		 */
		var initPaddlePosition = function(game, idx, paddle) {
			paddle.x = idx === 0 ?
				game.board.padding :
				game.board.width - (paddle.width + game.board.padding);
			return paddle;
		};

		/** 
		 * Adds a new paddle insetance to the game.
		 *
		 * @method addPaddle
		 * @param {Number} idx The index of the paddle.
		 * @param {Object} [paddle] The paddle instance to add.
		 */
		PongGame.prototype.addPaddle = function(idx, paddle) {
			paddle = paddle || options.initializers.paddle();

			if (!paddle) {
				throw {
					name: "NoPaddleCreated",
					message: "No paddle could be created. A paddle initializer or paddle asset must be provided."
				}
			}

			initPaddlePosition(this, idx, paddle);
			this.paddles.push(paddle);
			this.fire("paddleAdded", [idx, paddle]);
			return paddle;
		};

		/**
		 * Returns true if the game is full.
		 * 
		 * @method isFull
		 * @return {Boolean} True if the game is full; otherwise false.
		 */
		PongGame.prototype.isFull = function() {
			return this.paddles.length === 2 && 
				this.paddles[0] && this.paddles[1];
		};

		/**
		 * Returns true if the game is empty.
		 *
		 * @method isEmpty
		 * @return {Boolean} True if the game is empty; otherwise false.
		 */
		PongGame.prototype.isEmpty = function() {
			return this.paddles.length === 0;
		};

		/**
		 * Starts the game and adds the first ball.
		 *
		 * @method start
		 */
		PongGame.prototype.start = function() {
			if (this.started) return;

			this.started = true;
			this.paused = false;
			if (this.balls.length === 0) {
				this.addBall();
			}
			this.fire("started");
		};

		/**
		 * Pauses the game and stops rendering.
		 *
		 * @method pause
		 */
		PongGame.prototype.pause = function() {
			if (!this.started) return;

			this.paused = true;
			this.fire("paused");
		}

		/**
		 * Returns a payload object for properties that should be sync'd.
		 * 
		 * @method getSyncPayload
		 */
		PongGame.prototype.getSyncPayload = function() {
			var payloadItems = [
				"board", "paddles", "balls", "scores", "round", "gameId", "started"
			];

			// Loop through the defined payload items and create 
			// a new object with matching properties.
			var payload = {};
			var that = this;
			payloadItems.forEach(function(x) { payload[x] = that[x]; });
			return payload;
		};

		/**
		 * Syncs this game instance against a game payload provided.
		 * 
		 * @method sync
		 * @param {Object} payload The payload to sync with this game instance.
		 */
		PongGame.prototype.sync = function(payload) {
			var parent = "";
			var that = this;
			var sync = function(source, target, level) {
				level = level || 0;

				for (var prop in source) {
					if (!source.hasOwnProperty(prop)) continue;

					// Make note of the parent so we can create the 
					// proper object when necessary.
					if (level === 0) parent = prop;
					if (typeof source[prop] === "object") {
						target[prop] = target[prop] || createAsset(parent);
						sync(source[prop], target[prop], level + 1);
						continue;
					}

					target[prop] = source[prop];
				} // /for
			}; // /sync

			sync(payload, that);
			this.fire("synced");
		};

		/**
		 * Returns true if the game is in a running state.
		 *
		 * @method isRunning
		 * @return {Boolean} True if the game is running; false otherwise.
		 */
		PongGame.prototype.isRunning = function() {
			return this.started && !this.paused;
		};

		/**
		 * Updates the game asset positions.
		 *
		 * @method update
		 */
		PongGame.prototype.update = function() {
			if (!this.isRunning()) return;

			if (!physics) {
				throw { 
					name: "PhysicsNotInitialized",
					message: "Physics needs to run, but isn't initialized yet"
				};
			}

			physics.update(this);
		};

		/**
		 * Renders the game to the provided canvas context.
		 *
		 * @method render
		 * @param {Object} ctx The canvas 2d context.
		 */
		PongGame.prototype.render = function(ctx) {
			if (!this.isRunning()) return;

			// Clear the board so we can redraw.
			ctx.clearRect(0, 0, this.board.width, this.board.height);

			// Render board.
			this.board.render(ctx, this.round, this.scores);

			// Render paddles.
			if (this.paddles.length > 0) {
				for ( var i=0; i < this.paddles.length; i++ ) {
					this.paddles[i].render(ctx);
				}
			}

			// Render balls.
			if (this.balls.length > 0) {
				if (this.balls.length > 1){
					console.log("MULTIBALLS!!")	
				}
				
				for ( var i=0; i < this.balls.length; i++ ) {
					this.balls[i].render(ctx);
				}
			}
		};

		// --------

		return {
			create: function(board, options) {
				return new PongGame(board, options);
			}
		};
		
	}
); // /define
