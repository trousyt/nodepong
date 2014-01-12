/*
 * pong_server.js
 * Contains the main game loop and socket event handlers/emitters.
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

// Screen assets.
var board = {
	width: 640,
	height: 480,
	padding: 10
}

// CreateGameInstance
var assetsModule = require('./pong_assets'), 
	gameModule = require('./pong_game');

var createGameInstance = function() {
	var game = gameModule.create(board, 
		assetsModule.paddle.createDefault, 
		assetsModule.ball.createDefault
		);

	games.push(game);
	return game;
}

var getOpenGame = function() {

	for (var i=0; i < games.length; i++) {
		var game = games[i];
		if (!game.isFull()) {
			return game;
		}
	}
	return null;
}

/**
 * Registers socketio with the pong server and starts the game loop.
 * @param {object} socketio - The socket.io server instance.
 */
exports.register = function(socketio, callback) {

	// Catch socket connection events.
	socketio.sockets.on('connection', function(socket) {

		// Fxs
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
		// Assign sockets.
		// var setSocketIndex = function() {
		// 	var socketIdx = !sockets[0] ? 0 : !sockets[1] ? 1 : -1;
		// 	console.log('assigning socket #' + socketIdx);
		// 	sockets[socketIdx] = socket;
		// 	return socketIdx;
		// };

		// Get a game to join (or create new).
		var game = undefined;
		while (game == undefined) {
			game = getOpenGame() || createGameInstance();
		}


		var playerIdx = game.addPlayer();
		console.log('Player ' + playerIdx + ' added to game instance ' + game.gameId);

		// // Get/set the socket index.
		// var socketIndex = setSocketIndex(socket);
		// if (socketIndex < 0) {
		// 	sendMessage(res.CONFIGURATION_ERROR);
		// }

		//--------
		// START
		//--------
		// Send init.
		socket.emit('init', { 
			playerIdx: playerIdx,
			game: game
			// player: playerIdx, 
			// balls: game.balls,
			// paddles: game.paddles
		});

		// Receive paddle updates from client.
		socket.on('update-paddley', function(update){
			console.log('paddle-y for player ' + update.playerIdx + ': ' + update.y);
			game.paddles[update.playerIdx] = update.y;
		});

		// Game loop.
		var loopInterval = game.isFull() ? gameLoopIntervalMs : 5000;
		setInterval(function(){

			// Verify the game meets all sufficient conditions to start
			if (!game.isFull()) {
				sendMessage(res.WAITING_FOR_PLAYER);
				return;
			}

			// TODO: Physics class should handle ball.
			game.update();
			
			// TODO: Replace 'draw' event with 'sync' event.
			//socket.emit('draw', ball_pos, paddles);
			socket.emit('sync', game);

		}, loopInterval);

	});

	callback();
}