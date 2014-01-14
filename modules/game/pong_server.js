/*
 * pong_server.js
 * Contains the main game loop and socket event handlers/emitters.
 * 
 * TO-DO:
 * The server shouldn't care about screen size on the client; take out all code for this
 * 
 */

// Server vars.
var gameLoopIntervalMs = 100; //75;
var sockets = [];
var games = [];

// Text resource strings.
var res = {
	CONFIGURATION_ERROR:'A configuration error occurred.',
	WAITING_FOR_PLAYER: 'Waiting for another player...',
	WAITING_FOR_TURN: 	'Waiting for turn...'
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

	// CreateGameInstance
	var	physicsModule = require('./pong_physics'),
		assetsModule = require('./pong_assets'), 
		gameModule = require('./pong_game');

	var createGameInstance = function() {
		var game = gameModule.create(
			board,
			physicsModule.create(),
			assetsModule
			);
		games.push(game);
		return game;
	};

	var getOpenGame = function() {
		for (var i=0; i < games.length; i++) {
			var game = games[i];
			if (!game.isFull()) {
				return game;
			}
		}
		return null;
	};


	// Catch socket connection events.
	socketio.sockets.on('connection', function(socket) {

		// Define socket-specific functions.
		var lastMessageSent;
		var sendMessage = function(msg) {
			if (msg !== lastMessageSent) {
				// Notify the user that they must wait...
				lastMessageSent = msg;
				socket.emit('alert', msg);;
			}
		};

		//--------
		// SETUP
		//--------
		// Join a game (if one open), or create new.
		var game = undefined;
		while (game == undefined) {
			game = getOpenGame() || createGameInstance();
		}

		// Get the current player index.
		var playerIdx = game.addPlayer();
		var playerNumber = playerIdx + 1;
		console.log('Player ' + playerNumber + ' added to game instance ' + game.gameId);

		//--------
		// START
		//--------
		// Send game init.
		socket.emit('init', { 
			playerIdx: playerIdx,
			game: game
		});

		// Receive paddle updates from client.
		socket.on('update-paddley', function(y){
			console.log('paddle-y for player ' + playerNumber + ': ' + y);
			game.paddles[playerIdx] = y;
		});

		// Game loop.
		var loopInterval = gameLoopIntervalMs; //game.isFull() ? gameLoopIntervalMs : 5000;
		setInterval(function(){

			// Verify the game meets all sufficient conditions to start
			if (!game.isFull()) {
				sendMessage(res.WAITING_FOR_PLAYER);
				return;
			}

			// Update the game instance, which
			// will in turn update the physics.
			game.update();
			
			// TODO: Replace 'draw' event with 'sync' event.
			//socket.emit('draw', ball_pos, paddles);
			//socket.emit('sync', game);

		}, loopInterval);

	});

	callback();
}