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
	debug = requirejs("./common/debug");

/**
 * Registers the pong game socket logic with the provided SocketIO instance.
 *
 * @method register
 * @param {Object} socketio The SocketIO instance to register with.
 * @param {Function} callback The function invoked when the game is registered.
 */
exports.register = function(socketio, callback) {

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

	/**
	 * Writes a debug message prefixed with the socket identifier.
	 *
	 * @method socketDebug
	 * @param {Object} socket The socket instance to emit the message on.
	 * @param {String} msg The message to write.
	 */
	var socketDebug = function(socket, msg) {
		debug.write(socket.id + " " + msg);
	}

	pongManager.on("queued", function(skt) {
		debug.write("Socket " + skt.id + " queued");
	});

	pongManager.on("joined", function(e) {
		debug.write("Socket " + e.socket.id + " joined game " + e.game.gameId);
	});

	/**
	 * SocketIO Event: `Connection`
	 * Handles connection to the main channel.
	 */
	socketio.sockets.on("connection", function(socket) {
		socketDebug(socket, "A new connection was made");

		pongManager.on("queued", function(skt) {
			if (socket === skt) {
				sendMessage(socket, "Waiting for turn");
			}
		}); // /Queued event

		pongManager.on("joined", function(e) {
			if (socket !== e.socket) return;
			debug.write("Handling socket game join");

			var game = e.game;
			var playerIdx = e.playerIdx;

			// Receive paddle updates from client.
			socket.on("paddle-updatey", function(y){
				debug.write(socket.id + " Player " + playerIdx + " set paddle-y: " + y);
				game.paddles[playerIdx].y = y;

				// Immediately send this paddle y-pos to the opponent.
				var opponentPlayerIdx = 1 - playerIdx;
				var opponentSocket = game.__sockets[opponentPlayerIdx];
				if (opponentSocket){
					opponentSocket.emit("paddle-updateoppy", y);	
				}
			});

			// Handle physics bounce events.
			game.on("paddleBounce", function(ball){
				socket.emit("ball-sync", ball);
			});

			// Game loop
			setInterval(function(){
				game.update();
			}, settings.gameLoopInterval);

			// Sync loop
			setInterval(function() {
				if (!game.isRunning()) return;
				socket.emit("game-sync", game.getSyncPayload());
			}, settings.gameSyncInterval);

		}); // /Joined event

		// Register the socket with the game manager.
		pongManager.registerSocket(socket);

	}); // /Connection event

	callback();

}; // /register
