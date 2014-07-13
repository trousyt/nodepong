"use strict";

/*
 * Contains the main game loop, socket event connection
 * logic, and event handlers and emitters.
 *
 * @module pong_server
 */

 var requirejs = require("requirejs");
 requirejs.config({
 	baseUrl: "./modules",
 	nodeRequire: require
 });

var pongManager = requirejs("./pong_socket_manager"),
	settings = requirejs("./game/pong_settings"),
	debug = requirejs("./common/debug"),
	resx = requirejs("./game/resources");

/**
 * Registers the pong game socket logic with the provided SocketIO instance.
 *
 * @method register
 * @param {Object} socketio The SocketIO instance to register with.
 * @param {Function} callback The function invoked when the game is registered.
 */
exports.register = function(socketio, callback) {

	debug.socketwrite = function(socket, msg) {
		debug.write(socket.id + " " + msg);
	};

	/**
	 * Sends a message to all connections on the provided socket.
	 *
	 * @method sendMessage
	 * @param {Object} socket The socket instance to emit the message on.
	 * @param {String} msg The message to emit.
	 */
	var sendMessage = function(socket, msg) {
		socket.emit("alert", msg);
	};

	pongManager.on("queued", function(socket) {
		debug.socketwrite(socket, "Queued");
	});

	pongManager.on("joined", function(e) {
		debug.socketwrite(e.socket, "Joined game " + e.game.gameId);
	});

	/**
	 * SocketIO Event: `Connection`
	 * Handles connection to the main channel.
	 */
	socketio.sockets.on("connection", function(socket) {
		debug.socketwrite(socket, "A new connection was made");

		pongManager.on("queued", function(skt) {
			if (socket === skt) {
				sendMessage(socket, resx.waitingForTurn);
			}
		}); // /Queued event

		pongManager.on("joined", function(e) {
			if (socket !== e.socket) return;
			debug.socketwrite(socket, "Handling socket game join");

			var game = e.game;
			var playerIdx = e.playerIdx;

			// Receive paddle updates from client.
			socket.on("paddle-updatey", function(y){
				debug.socketwrite(socket, "Player " + playerIdx + " set paddle-y: " + y);
				if (game.paddles[playerIdx]) {
					game.paddles[playerIdx].y = y;
				}

				// Immediately send this paddle y-pos to the opponent.
				var opponentPlayerIdx = 1 - playerIdx;
				var opponentSocket = game.__sockets[opponentPlayerIdx];
				if (opponentSocket){
					opponentSocket.emit("paddle-updateoppy", y);	
				}
			});

			// Return payload when a sync is requested.
			socket.on("game-sync", function() {
				socket.emit("game-sync", game.getSyncPayload());
			});

			// Handle physics bounce events.
			game.on("paddleBounce", function(ball){
				socket.emit("ball-sync", ball);
			});

			game.on("score", function(){
				socket.emit("score-sync", game.scores);
			});

			// Handle game started event.
			game.once("started", function() {
				debug.write("Game " + game.gameId + " started");

				// Send each socket match-init.
				game.__sockets.forEach(function(skt) {
					skt.emit("match-init", game.getSyncPayload());
				});

				// Game loop
				setInterval(function(){
					game.update();
				}, settings.gameLoopInterval);

				// Sync loop
				setInterval(function() {
					if (!game.isRunning()) return;
					socket.emit("ball-sync", game.balls);
				}, settings.gameSyncInterval);
			});

			// Handle game paused event.
			game.once("paused", function() {
				socket.emit("game-pause", resx.pauseDisconnected);
			});

		}); // /Joined event

		// Register the socket with the game manager.
		pongManager.registerSocket(socket);

	}); // /Connection event

	callback();

}; // /register
