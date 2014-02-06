"use strict";

$(document).ready(function() {
	var that = this;
	var debug = function(message) {
		console.log(message);
	}

	require(["scripts/game/pong_game"], function(gameModule) {
		var socket = io.connect();

		/*
		 * SocketIO Event: `game-redirect`
		 * Redirects the client to a game channel.
		 */
		socket.on("game-redirect", function(channel) {
			debug("got game redirect");
			socket = io.connect(channel);

			var gameCtx = {
				settings: {	
					gameLoopInterval: 50  // .05s
				}
			};

			// Reference DOM elements.
			var $alert = $("#alert");
			var canvas = document.getElementById("game-canvas");
			var $canvas = $(canvas);

			// ==========================
			// START
			// --------------------------
			function syncGame(payload) {
				gameCtx.game.sync(payload);
				debug("Finished syncing game");
			};

			// Start after initialized.
			function afterInit() {
				gameCtx.oppPlayerIdx = 1 - gameCtx.playerIdx;
				// var myPaddle = gameCtx.game.paddles[gameCtx.playerIdx],
				// 	oppPaddle = gameCtx.game.paddles[oppIdx];

				/*
				 * SocketIO Event: `alert`
				 * Receive alerts to be displayed.
				 */
				socket.on("alert", function(alert) {
					$alert.show(1000);
					$alert.text(alert);
				});

				/* 
				 * SocketIO Event: `update-opponent`
				 * Update location of opponent's paddle.
				 */
				socket.on("paddle-updateoppy", function(y) {
					var oppPaddle = gameCtx.game.paddles[gameCtx.oppPlayerIdx];
					//debug("opponent's paddle-y changed: " + y);
					oppPaddle.y = y;
				});

				/* 
				 * SocketIO Event: `game-sync`
				 * Syncs the server game payload with the client.
				 */
				socket.on("game-sync", function(payload) {
					syncGame(payload);
				});

				// Run the game loop.
				var ctx = canvas.getContext("2d");
				setInterval(function() {
					gameCtx.game.update();
					gameCtx.game.render(ctx);
				}, gameCtx.settings.gameLoopInterval);

				// Send paddle position.
				$(document).mousemove(function(e) {
					// Get the relative y-pos to the board.
					var relativeY = e.pageY - $canvas.offset().top;
					var paddleMaxY = canvas.height - gameCtx.game.paddles[gameCtx.playerIdx].height;
					
					//debug("offset: " + $canvas.offset().top);
					//debug("relative: " + relativeY);
					//debug("max: " + paddleMaxY);
					// Get the constrained y-pos.
					var constrY = relativeY < 0
						? 0 : relativeY > paddleMaxY 
							? paddleMaxY : relativeY;
					//debug("constrained: " + constrY);

					// Update the server.
					socket.emit("paddle-updatey", constrY);

					// Update the paddle pos on the game instance.
					var myPaddle = gameCtx.game.paddles[gameCtx.playerIdx];
					myPaddle.y = constrY;
				});
			};

			/*
			 * SocketIO Event: `match-init`
			 * Initializes a new match.
			 */
			 socket.on("match-init", function(init) {
			 	gameCtx.game.start();
			 	syncGame(init);
			 });

			/*
			 * SocketIO Event: `game-init`
			 * Initializes the client with settings and game object.
			 */
			socket.on("game-init", function(init) {
				debug("Received init for player " + init.playerIdx);

				// Update game board CSS settings from init.game.board
				canvas.width = init.game.board.width;
				canvas.height = init.game.board.height;

				// Create the game instance and immediately sync it.
				gameCtx.playerIdx = init.playerIdx;
				gameCtx.game = gameModule.create();
				syncGame(init.game);

				// Invoke after-init code.
				afterInit();

			});	// /game-init

		}); // /game-redirect

	}); // /require

});