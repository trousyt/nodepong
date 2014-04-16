$(document).ready(function() {
	"use strict";
	var that = this;

	require(["scripts/game/pong_game", "scripts/game/pong_settings", "scripts/common/debug"], 
		function(gameModule, settings, debug) {
		var socket = io.connect();

		// Reference DOM elements.
		var $alert = $("#alert");
		var canvas = document.getElementById("game-canvas");
		var $canvas = $(canvas);
		var gameCtx = {};

		//---------------------------------

		function syncGame(payload) {
			gameCtx.game.sync(payload);
			debug.write("Finished syncing game");
		};

		function registerHandlers() {
			debug.write("Registering handlers");

			/* 
			 * SocketIO Event: `game-sync`
			 * Syncs the server game payload with the client.
			 */
			socket.on("game-sync", function(payload) {
				syncGame(payload);
			});

			/* 
			 * SocketIO Event: `ball-sync`
			 * Syncs the server ball with the client.
			 */
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
				if (oppPaddle) oppPaddle.y = y;
			});
		};

		// Runs game logic after the game is initialized.
		// --
		function afterInit() {
			registerHandlers();

			// Run the game loop.
			var ctx = canvas.getContext("2d");
			setInterval(function() {
				if (!gameCtx.game.isRunning()) return;
				gameCtx.game.update();
				gameCtx.game.render(ctx);
			}, settings.gameLoopInterval);

			// Capture mouse movement and update 
			// the game server.
			$canvas.mousemove(function(e) {
				if (!gameCtx.game.isRunning()) return;

				// Get the relative y-pos to the board.
				var myPaddle = gameCtx.game.paddles[gameCtx.playerIdx];
				var mouseY = e.pageY - (myPaddle.height / 2),
					relativeY = mouseY - $canvas.offset().top,
					maxY = canvas.height - myPaddle.height;
				
				// Get the constrained y-pos.
				var constrY = relativeY < 0 ? 0 :
					relativeY > maxY ? maxY :
						relativeY;

				// Update the server.
				debug.write("Sending paddle Y-pos");
				socket.emit("paddle-updatey", constrY);

				// Update the paddle pos on the game instance.
				myPaddle.y = constrY;
			});
		};

		/*
		 * SocketIO Event: `alert`
		 * Receive alerts to be displayed.
		 */
		socket.on("alert", function(alert) {
			debug.write("Received alert");
			$alert.show(1000);
			$alert.text(alert);
		});

		/*
		 * SocketIO Event: `game-redirect`
		 * Redirects the client to a game channel.
		 */
		// socket.on("game-redirect", function(channel) {
		// 	debug.write("Received game redirect to " + channel);
		// 	socket = io.connect(channel);
		// });

		/*
		 * SocketIO Event: `match-init`
		 * Initializes a new match.
		 */
		 socket.on("match-init", function(init) {
		 	debug.write("Received match init");
		 	syncGame(init);
		 	gameCtx.game.start();
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
			gameCtx.playerIdx = init.playerIdx;
			gameCtx.oppPlayerIdx = 1 - init.playerIdx;
			gameCtx.game = gameModule.create();
			syncGame(init.game);

			// Invoke after-init code.
			afterInit();

		});	// /game-init
	}); // /require

});
