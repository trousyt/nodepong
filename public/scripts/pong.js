"use strict";

$(document).ready(function() {
	var that = this;

	require(["scripts/game/pong_game"], function(gameModule) {
		var socket = io.connect();

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
		var syncGame = function(payload) {
			gameCtx.game.sync(payload);
			console.log("Finished syncing game");
		};

		// Start after initialized.
		var afterInit = function() {
			var opIdx = gameCtx.playerIdx === 0 ? 1 : 0;
			var myPaddle = gameCtx.game.paddles[gameCtx.playerIdx],
				opPaddle = gameCtx.game.paddles[opIdx];

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
			socket.on("update-opponent", function(y) {
				console.log("opponent's paddle-y changed: " + y);
				gameCtx.game.paddles[opIdx].y = y;
			});

			/* 
			 * SocketIO Event: `sync`
			 * Syncs the server game payload with the client.
			 */
			socket.on("sync", function(payload) {
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
				
				//console.log("offset: " + $canvas.offset().top);
				//console.log("relative: " + relativeY);
				//console.log("max: " + paddleMaxY);
				// Get the constrained y-pos.
				var constrY = relativeY < 0
					? 0 : relativeY > paddleMaxY 
						? paddleMaxY : relativeY;

				
				// console.log("constrained: " + constrY);

				// Update the server.
				socket.emit("update-paddley", constrY);

				// TODO: Update the paddle pos on the game instance.
				myPaddle.y = constrY;
				//gameCtx.game.paddles[gameCtx.playerIdx].y = constrY;
			});
		};

		/*
		 * SocketIO Evnet: `init-match`
		 * Initializes a new match.
		 */
		 socket.on("init-match", function(init) {
		 	console.log("rece")
		 	syncGame(init);
		 });

		/*
		 * SocketIO Event: `init`
		 * Initializes the client with settings and game object.
		 */
		socket.on("init-conn", function(init) {
			console.log("Received init for player " + init.playerIdx);

			// Update game board CSS settings from init.game.board
			canvas.width = init.game.board.width;
			canvas.height = init.game.board.height;

			// Create the game instance and immediately sync it.
			gameCtx.playerIdx = init.playerIdx;
			gameCtx.game = gameModule.create();
			syncGame(init.game);

			// Invoke after-init code.
			afterInit();
		});

		

	}); // /require

});