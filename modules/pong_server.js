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
var gameLoopInterval = 100;		// .1s
var gameSyncInterval = 20000;	// 25s
var games = [];

// Text resource strings.
var res = {
	CONFIGURATION_ERROR:"A configuration error occurred.",
	WAITING_FOR_PLAYER: "Waiting for another player...",
	WAITING_FOR_TURN: 	"Waiting for turn..."
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

	var findOpenGame = function() {
		for (var i=0; i < games.length; i++) {
			var game = games[i];
			if (!game.isFull()) {
				return game;
			}
		}
		return null;
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

		// Join a game (if one open), or create new.
		var game = undefined;
		while (game == undefined) {
			game = findOpenGame() || createGameInstance();

			// Attempt to add the player to an open game.
			var playerIdx = game.addPlayer();
			if (playerIdx < 0) {
				console.log("Couldn't be added to game " + game.gameId);
				game = undefined;
			}
		}

		var playerNumber = playerIdx + 1;
		debug("Added player " + playerNumber + " to game instance " + game.gameId);

		/*
		 * Initialization
		 */
		// Send game init.
		debug("Initializing client");
		socket.emit("init", { 
			gameLoopInterval: gameLoopInterval,
			playerIdx: playerIdx,
			game: game
		});

		// Receive paddle updates from client.
		socket.on("update-paddley", function(y){
			debug("Player set paddle-y: " + y);
			game.paddles[playerIdx].y = y;
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
				game.start();
				socket.emit("init-match", game);
			}

			// Update the game instance, which will in turn update the physics.
			game.update();
			
			// TODO: Replace 'draw' event with 'sync' event.
			// This can run on a much slower interval.
			//socket.emit('draw', ball_pos, paddles);
			//socket.emit('sync', game);

		}, gameLoopInterval);

	});

	callback();
};