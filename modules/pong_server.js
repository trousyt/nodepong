/*
 * pong_server.js
 * Contains the main game loop and socket event handlers/emitters.
 * 
 * TO-DO:
 * The server shouldn't care about screen size on the client; take out all code for this
 * 
 */
"use strict";

 var requirejs = require("requirejs");
 requirejs.config({
 	baseUrl: "./modules/game/",
 	nodeRequire: require
 });

var gameModule = requirejs("./pong_game");

// Server vars.
var gameLoopInterval = 1000;	// .1s
var gameSyncInterval = 20000;	// 25s
var games = [];

// Text resource strings.
var res = {
	CONFIGURATION_ERROR:"A configuration error occurred.",
	WAITING_FOR_PLAYER: "Waiting for another player...",
	WAITING_FOR_TURN: "Game full. Waiting for turn...",
	GAME_STARTING: "Game starting! Get ready..."
};

// Screen dimensions.
var board = {
	width: 640,
	height: 480,
	padding: 10
}

/**
 * Registers socketio with the pong server and starts the game loop.
 * @param {object} socketio - The socket.io server instance.
 */
exports.register = function(socketio, callback) {

	var createGameInstance = function() {
		var game = gameModule.create(board);
		games.push(game);
		return game;
	};

	var findOpenGame = function(callback) {
		if (games.length === 0) {
			games[0] = createGameInstance();
			callback(games[0]);
		} else {
			if (games[0].isFull()) {
				return null;
			}
		}
		return games[0];
	};

	/*
	 * SocketIO Event: `Connection`
	 * Initialize socket and game.
	 */
	socketio.sockets.on("connection", function(socket) {

		// Define socket-specific functions.
		var debug = function(message) {
			if (socket) {
				console.log(socket.id + " " + message);
			}
		};
		var lastMessageSent;
		var sendMessage = function(msg) {
			if (msg !== lastMessageSent) {
				// Notify the user that they must wait...
				lastMessageSent = msg;
				socket.emit("alert", msg);;
			}
		};

		debug("A new connection was made");

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
			sendMessage(res.WAITING_FOR_TURN);
			return;
		}

		var playerIdx = game.addPlayer(socket);
		var playerNumber = playerIdx + 1;
		debug("Added player " + playerNumber + " to game instance " + game.gameId);

		// Store the socket on game with the player index.
		// By placing this code here, PongGame doesn't have
		// to know anything about sockets.
		game.sockets[playerIdx] = socket;

		/*
		 * Initialization
		 */
		// Send game init.
		debug("Initializing client");
		socket.emit("init-conn", { 
			gameLoopInterval: gameLoopInterval,
			playerIdx: playerIdx,
			game: game.getSyncPayload()
		});

		// Receive paddle updates from client.
		socket.on("update-paddley", function(y){
			debug("Player set paddle-y: " + y);
			game.paddles[playerIdx].y = y;	

			// Immediately send this paddle y-pos to the opponent.
			var opponentPlayerIdx = playerIdx === 0 ? 1 : 0;
			var opponentSocket = game.sockets[opponentPlayerIdx];
			if (opponentSocket){
				opponentSocket.emit("update-opponent", y);	
			}
			
		});

		/*
		 * Game Loop
		 */
		setInterval(function(){

			// Verify the game meets all sufficient conditions to start
			if (!game.isFull()) {
				sendMessage(res.WAITING_FOR_PLAYER);
				return;
			}

			// If we get here, the game is full and we can start.
			// When we start, sync the client again.
			if (!game.started) {
				debug("Starting game!");
				sendMessage(res.GAME_STARTING);
				game.start();
				socket.emit("init-match", game.getSyncPayload());
			}

			// Update the game, which will in turn update the physics.
			game.update();

		}, gameLoopInterval);

		/*
		 * Sync Loop
		 */ 
		 setInterval(function() {
		 	if (!game.started) return;
			socket.emit("sync", game.getSyncPayload());
		 }, gameSyncInterval);


		 socket.on("disconnect", function() {
			// TODO: Complete disconnect logic.
		});

	}); // /Connection Event

	callback();
};