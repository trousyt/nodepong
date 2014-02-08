"use strict";

/**
 * Module that provides logic and construction for the PongGame class.
 *	board: {width, height, padding}
 * 	paddles[idx] = {x, y, height, width, offset}
 * 	ball = {x, y, angle, dx, dy, da}
 *
 * @module pong_game
 * @requires pong_physics, pong_assets
 */

// "Global" game counter.
var nextGameId = 0;

define(["./pong_physics", "./pong_board", "./pong_ball", "./pong_paddle", "./debug"], 
	function(physicsModule, boardModule, ballModule, paddleModule, debug) {
	var physics = physicsModule.create();

	// Private instance vars.
	var options = {
		pointsInRound: 10
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

		options.paddleInit = paddleModule.createDefault;
		options.boardInit = boardModule.createDefault;
		options.ballInit = ballModule.createDefault;

		this.board = board || options.boardInit();	// The board instance
		this.paddles = [];			// Paddle array (max size 2)
		this.balls = [];			// Balls array
		this.scores = [0,0];		// Scores array
		this.round = 1;				// Round counter
		this.gameId = nextGameId++;	// Unique game identifier
		this.started = false;

		// Use the passed in options (if any)
		if (opts) {
			for(var prop in opts) {
				if (opts.hasOwnProperty(prop)) {
					options[prop] = opts[prop];
				}
			}	
		}
	};	// /PongGame

	/**
	 * Creates a new asset of the provided property name.
	 * 
	 * @method createAsset
	 * @private
	 * @param {String} name The name of the property on the game instance.
	 * @return {Object} A new instance of the object associated with the property name.
	 */
	var createAsset = function(name) {
		var creators = {
			"paddles": options.paddleInit,
			"balls": options.ballInit,
			"board": options.boardInit
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
		return playerIdx;
	};

	/**
	 * Adds a new ball instance to the game.
	 *
	 * @method addBall
	 * @param {Object} [ball] The ball instance to add.
	 */
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
		paddle = paddle || options.paddleInit();

		if (!paddle) {
			throw {
				name: "NoPaddleCreated",
				message: "No paddle could be created. A paddle initializer or paddle asset must be provided."
			}
		}

		initPaddlePosition(this, idx, paddle);
		this.paddles.push(paddle);
	};

	/**
	 * Returns true if the game is full.
	 * 
	 * @method isFull
	 * @return {Boolean} True if the game is full. Otherwise, false.
	 */
	PongGame.prototype.isFull = function() {
		return this.paddles.length === 2 && 
			this.paddles[0] && this.paddles[1];
	};

	/**
	 * Starts the game and adds the first ball.
	 *
	 * @method start
	 */
	PongGame.prototype.start = function() {
		if (this.started) return;

		this.started = true;
		if (this.balls.length === 0) {
			this.addBall();
		}	
	};

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
					//console.log("Syncing object: " + prop);
					target[prop] = target[prop] || createAsset(parent);
					sync(source[prop], target[prop], level + 1);
					continue;
				}

				//console.log("Syncing property: '" + prop + "' with value '" + source[prop] + "'");;
				target[prop] = source[prop];
			} // /for
		}; // /sync

		sync(payload, that);
	};

	/**
	 * Updates the game asset positions.
	 *
	 * @method update
	 */
	PongGame.prototype.update = function() {
		if (!physics) {
			throw { 
				name: "PhysicsNotInitialized",
				message: "Physics needs to run, but isn't initialized yet"
			};
		}

		var that = this;
		physics.update(this, function(playerIdx) {
			that.scores[playerIdx]++;
			// TODO: Notify caller here that a point was scored.

			for ( var i=0; i < that.scores.length; i++ ) {
				var score = that.scores[i];
				if ( score >= options.pointsInRound ) {
					that.round++;
					// TODO: Notify caller here that a new round has begun.
				}
			}
		});
	};

	/**
	 * Renders the game to the provided canvas context.
	 *
	 * @method render
	 * @param {Object} ctx The canvas 2d context.
	 */
	PongGame.prototype.render = function(ctx) {
		ctx.clearRect(0, 0, this.board.width, this.board.height);

		// Render board.
		this.board.render(ctx, this.scores);

		// Render paddles.
		if (this.paddles.length > 0) {
			for ( var i=0; i < this.paddles.length; i++ ) {
				this.paddles[i].render(ctx);
			}
		}

		// Render balls.
		if (this.balls.length > 0) {
			for ( var i=0; i < this.balls.length; i++ ) {
				this.balls[i].render(ctx);
			}
		}
	};

	return {
		create: function(board, options) {
			return new PongGame(board, options);
		}
	};

}); // /define
