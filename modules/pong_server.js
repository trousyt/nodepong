var sass = require('node-sass');

// Screen asset dimensions.
var width = 640, height = 480;
var paddle_width = 20;
var paddle_height = 80;
var ball_size = 20;

// Server vars.
var gameLoopInterval = 100;
var sockets = [0, 0];
var paddles = [0, 0];
var scores = [0, 0];
var ball_speed = 20;
var ball_angle = 0;
var ball_pos = {x: width/2, y: height/2};

// Text resource strings.
var res = {
	WAITING_FOR_PLAYER: 'Waiting for another player...',
	WAITING_FOR_TURN: 	'Waiting for turn...'
};


/**
 * Initializes the pong server. Called on register().
 */
var initialize = function() {
	// sass.render({
	//   file: '/public/stylesheets/pong.scss',
	//   success: function() {
	//   	console.log('Initialized pong server assets');
	//   }
	// });
}

/**
 * Registers socketio with the pong server and starts the game loop.
 * @param {object} socketio - The socket.io server instance.
 */
exports.register = function(socketio, callback) {

	initialize();

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

		// Conditions for the game to start.
		var canStart = function() {
			// Can start if both sockets are connected (truthy).
			return socket[0] && socket[1];
		};

		//--------
		// SETUP
		//--------
		// Assign sockets.
		var setSocketIndex = function() {
			var socketIdx = !sockets[0] ? 0 : !sockets[1] ? 1 : -1;
			console.log('assigning socket #' + socketIdx);
			socket[socketIdx] = socket;
			return socketIdx;
		};

		// Get/set the socket index.
		var socketIndex = setSocketIndex(socket);
		if (socketIndex < 0) {
			sendMessage(res.WAITING_FOR_TURN);
		}

		//--------
		// START
		//--------
		// Send init.
		socket.emit('init', { 
			player: socketIndex, paddle_width: 20, paddle_height: 80, ball_size: 20 
		});

		// Receive paddle updates from client.
		socket.on('update', function(data){
			paddles[data.player] = data.y;
		});

		// Game loop.
		var loopInterval = gameLoopInterval;
		setInterval(function(){

			// Verify the game meets all sufficient conditions to start
			if (!canStart()) {
				sendMessage(res.WAITING_FOR_PLAYER);

				// Can't start yet - slow down the interval.
				loopInterval = 5000;
				return;
			}

			ball_pos.x = ball_pos.x + Math.cos(ball_angle) * ball_speed;
			ball_pos.y = ball_pos.y - Math.sin(ball_angle) * ball_speed;
			
			//console.log(ball_pos.x);

			if (ball_pos.x <= 0) {
				ball_pos.x = 0;
				ball_angle = Math.PI - ball_angle;
				scores[1] = scores[1] + 1;
			}else if (ball_pos.x >= width) {
				ball_pos.x = width;
				ball_angle = Math.PI - ball_angle;
				scores[0] = scores[0] + 1;
			}

			if (ball_pos.y <= 0) {
				ball_pos.y = 0;
				ball_angle = Math.PI - ball_angle;
			}else if (ball_pos.y >= height) {
				ball_pos.y = height;
				ball_angle = Math.PI - ball_angle;
			}
			
			socket.emit('draw', ball_pos);
		}, loopInterval);

	});

	callback();
}