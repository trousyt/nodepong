"use strict";

/*
 * Contains the main game loop, socket event connection
 * logic, and event handlers and emitters.
 *
 * @module pong_server
 */

 var requirejs = require("requirejs");
 requirejs.config({
 	baseUrl: "./modules/game/",
 	nodeRequire: require
 });

var gameModule = requirejs("./pong_game"),
	debug = requirejs("./debug");

// Server vars.
var gameLoopInterval = 50;	// .05s
var gameSyncInterval = 20000;	// 20s
var games = [];

// Text resource strings.
var res = {
	CONFIGURATION_ERROR:"A configuration error occurred.",
	WAITING_FOR_PLAYER: "Waiting for another player...",
	WAITING_FOR_TURN: "Game full. Waiting for turn...",
	GAME_STARTING: "Game starting! Get ready..."
};

/**
 * Registers the pong game socket logic with the provided SocketIO instance.
 *
 * @method register
 * @param {Object} socketio The SocketIO instance to register with.
 * @param {Function} callback The function invoked when the game is registered.
 */
exports.register = function(socketio, callback) {

	/**
	 * Creates a new game instance and pushes it onto the games array.
	 *
	 * @method createGameInstance
	 * @return {Object} A new PongGame instance.
	 */
	var createGameInstance = function() {
		var game = gameModule.create();
		games.push(game);
		return game;
	};

	/**
	 * Finds an open game if one is available.
	 *
	 * @method findOpenGame
	 * @param {Function} callback Callback that is invoked when a new instance is created.
	 * @return {Object} An open game instance.
	 */
	var findOpenGame = function(initCallback) {
		if (games.length === 0) {
			games[0] = createGameInstance();
			initCallback(games[0]);
		} else {
			if (games[0].isFull()) {
				return null;
			}
		}
		return games[0];
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

	/*
	 * SocketIO Event: `Connection`
	 * Handles connection to the main channel.
	 */
	socketio.sockets.on("connection", function(socket) {
		socketDebug(socket, "A new connection was made");

		/*
		 * Game Setup
		 */
		// Find an open game (or create new) 
		// and add the player to the game.
		var game = findOpenGame(function(newGame) {
			newGame.sockets = [];
		});

		// If no game could be joined, just return.
		// TODO: Add the player to a queue.
		if (game === null) {
			sendMessage(socket, res.WAITING_FOR_TURN);
			return;
		}

		// We found a new game, so direct the client
		// to connect to the new game channel.
		var gameChannelName = "/game-" + game.gameId;
		socket.emit("game-redirect", gameChannelName);

		/*
		 * SocketIO Event: `Connection`
		 * Handles connection to the game channel.
		 */
		var gameChannel = socketio.of(gameChannelName).on("connection", function(socket) {
			socketDebug(socket, "Joined '" + gameChannelName + "'");

			// Add the player to the game.
			var playerIdx = game.addPlayer(socket);
			if (playerIdx === -1) return; // TODO: The user couldn't be added, so redirect the client back to the lobby.

			var playerNumber = playerIdx + 1;
			socketDebug(socket, "Added player " + playerNumber + " to game instance " + game.gameId);

			// Store the socket on game with the player index.
			// By placing this code here, PongGame doesn't have
			// to know anything about sockets.
			game.sockets[playerIdx] = socket;

			/*
			 * Initialization
			 */
			// Send game init.
			socketDebug(socket, "Initializing client");
			socket.emit("game-init", {
				gameLoopInterval: gameLoopInterval,
				playerIdx: playerIdx,
				game: game.getSyncPayload()
			});

			// Receive paddle updates from client.
			socket.on("paddle-updatey", function(y){
				socketDebug(socket, "Player set paddle-y: " + y);
				game.paddles[playerIdx].y = y;

				// Immediately send this paddle y-pos to the opponent.
				var opponentPlayerIdx = 1 - playerIdx;
				var opponentSocket = game.sockets[opponentPlayerIdx];
				if (opponentSocket){
					opponentSocket.emit("paddle-updateoppy", y);	
				}
			});

			game.on("paddleBounce", function(ball){
				gameChannel.emit("ball-sync", ball);
			});

			// Verify the game meets all sufficient conditions to start
			if (!game.isFull()) {
				sendMessage(socket, res.WAITING_FOR_PLAYER);
				return;
			}

			/*
			 * Game Loop
			 */
			setInterval(function(){

				// // Verify the game meets all sufficient conditions to start
				// if (!game.isFull()) {
				// 	sendMessage(socket, res.WAITING_FOR_PLAYER);
				// 	return;
				// }

				// If we get here, the game is full and we can start.
				// When we start, sync the client again.
				if (!game.started) {
					socketDebug(socket, "Starting game!");
					sendMessage(gameChannel, res.GAME_STARTING, true);
					game.start();
					gameChannel.emit("match-init", game.getSyncPayload());
				}

				// Update the game, which will in turn update the physics.
				game.update();
			}, gameLoopInterval);

			/*
			 * Sync Loop
			 */ 
			setInterval(function() {
				if (!game.started) return;
				gameChannel.emit("game-sync", game.getSyncPayload());
			}, gameSyncInterval);


			/*
			 * Handle player disconnects.
			 */
			socket.on("disconnect", function() {
				// Remove the player from the game. By removing the player,
				// the game will pause and we'll start waiting for the next
				// player to join.
				socketDebug(socket, "Player " + playerIdx + " disconnected");
				game.removePlayer(playerIdx);
			});

		}); // /Game Channel

	}); // /Connection Event

	callback();

}; // /register
