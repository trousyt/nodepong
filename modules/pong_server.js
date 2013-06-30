
// Server vars.
var sockets = [0, 0];
var paddles = [0, 0];
var scores = [0, 0];
var ball_speed = 20;
var sball_angle = 0;
var ball_pos = {x: width/2, y: height/2};

// Screen asset dimensions.
var width = 640, height = 480;
var paddle_width = 20;
var paddle_height = 80;
var ball_size = 20;

/**
 * Registers socketio with the pong server and starts the game loop.
 * @param {object} socketio - The socket.io server instance.
 */
exports.register = function(socketio, callback) {

	// Catch socket connection events.
	socketio.sockets.on('connection', function(socket) {

		var setSocketIndex = function() {
			if (!sockets[0]) {
				socket[0] = socket;
				return 0;
			} else if (!sockets[1]) {
				socket[1] = socket;
				return 1;
			}
		}

		// Get/set the socket index.
		var socketIndex = setSocketIndex(socket);

		// Send init.
		socket.emit('init', { 
			player: socketIndex, paddle_width: 20, paddle_height: 80, ball_size: 20 
		});

		// Receive paddle updates.
		socket.on('update', function(data){
			paddles[data.player] = data.y;
		});

		// Game loop.
		setInterval(function(){

			ball_pos.x = ball_pos.x + Math.cos(ball_angle) * ball_speed;
			ball_pos.y = ball_pos.y - Math.sin(ball_angle) * ball_speed;
			
			console.log(ball_pos.x);

			if (ball_pos.x <= 0) {
				ball_pos.x = 0;
				ball_angle = Math.PI - ball_angle;
				scores[1] = scores[1] + 1;
			}else if (ball_pos.x >= width) {
				ball_pos = width;
				ball_angle = Math.PI - ball_angle;
				scores[0] = scores[0] + 1;
			}

			if (ball_pos.y <= 0) {
				ball_pos.y = 0;
				ball_angle = Math.PI - ball_angle;
			}else if (ball_pos.y >= height) {
				ball_pos = height;
				ball_angle = Math.PI - ball_angle;
			}
			
			socket.emit('draw', ball_pos);
		}, 100);

	});

	callback();
}