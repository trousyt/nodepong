$(document).ready(function() {
	"use strict";
	var that = this;

	require(["scripts/game/pong_game", "scripts/game/debug"], function(gameModule, debug) {
		var socket = io.connect();

		/*
		 * SocketIO Event: `game-redirect`
		 * Redirects the client to a game channel.
		 */
		socket.on("game-redirect", function(channel) {
			debug.write("Received game redirect to " + channel);
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

			//---------------------------------

			function syncGame(payload) {
				gameCtx.game.sync(payload);
				debug.write("Finished syncing game");
			};

			// Runs game logic after the game is initialized.
			// --
			function afterInit() {

				/*
				 * SocketIO Event: `alert`
				 * Receive alerts to be displayed.
				 */
				socket.on("alert", function(alert) {
					$alert.show(1000);
					$alert.text(alert);
				});

				/* 
				 * SocketIO Event: `game-sync`
				 * Syncs the server game payload with the client.
				 */
				socket.on("game-sync", function(payload) {
					syncGame(payload);
				});

				socket.on("ball-sync", function(ball) {
					debug.write("Ball-sync called");
					debug.write(ball);
					gameCtx.game.balls[0].sync(ball);
				});

				/* 
				 * SocketIO Event: `update-opponent`
				 * Update location of opponent's paddle.
				 */
				socket.on("paddle-updateoppy", function(y) {
					//debug.write("opponent's paddle-y changed: " + y);
					var oppPaddle = gameCtx.game.paddles[gameCtx.oppPlayerIdx];					
					if ( oppPaddle ) {
						oppPaddle.y = y;
					}
				});

				// Run the game loop.
				var ctx = canvas.getContext("2d");
				setInterval(function() {
					gameCtx.game.update();
					gameCtx.game.render(ctx);
				}, gameCtx.settings.gameLoopInterval);

				// Capture mouse movement and update 
				// the game server.
				$canvas.mousemove(function(e) {

					// Get the relative y-pos to the board.
					var myPaddle = gameCtx.game.paddles[gameCtx.playerIdx];
					var mouseY = e.pageY - (myPaddle.height / 2),
						relativeY = mouseY - $canvas.offset().top,
						maxY = canvas.height - myPaddle.height;
					
					// Get the constrained y-pos.
					var constrY = relativeY < 0 ?
						0 : relativeY > maxY ?
							maxY : relativeY;

					// Update the server.
					socket.emit("paddle-updatey", constrY);

					// Update the paddle pos on the game instance.
					myPaddle.y = constrY;
				});
			};

			/*
			 * SocketIO Event: `match-init`
			 * Initializes a new match.
			 */
			 socket.on("match-init", function(init) {
			 	debug.write("Received match init");
			 	gameCtx.game.start();
			 	syncGame(init);
			 });

			/*
			 * SocketIO Event: `game-init`
			 * Initializes the client with settings and game object.
			 */
			socket.on("game-init", function(init) {
				debug.write("Received init for player " + init.playerIdx);

				// Update game board CSS settings.
				canvas.width = init.game.board.width;
				canvas.height = init.game.board.height;

				// Create the game instance and immediately sync it.
				gameCtx.settings.gameLoopInterval = init.gameLoopInterval;
				gameCtx.playerIdx = init.playerIdx;
				gameCtx.oppPlayerIdx = 1 - init.playerIdx;
				gameCtx.game = gameModule.create();
				syncGame(init.game);

				// Invoke after-init code.
				afterInit();

			});	// /game-init
		}); // /game-redirect
	}); // /require

});
