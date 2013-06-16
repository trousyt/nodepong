
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , socketio = require('socket.io');

var app = express();

//var socket1, socket2;
var sockets = [0, 0];
var paddles = [0, 0];
var width = 640, height = 480;
var ball_speed = 20;
var ball_angle = 0;
var ball_pos = {x: width/2, y: height/2};

var paddle_width = 20;
var paddle_height = 80;
var ball_size = 20;


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app),
	io = socketio.listen(server);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function(socket) {

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
		socket.emit('draw', ball_pos);
	}, 100);

});
