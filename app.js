
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

var socket1, socket2;
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

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.on('connection', function(socket) {
	if (!socket1){
		socket1 = socket;	
	}else if (!socket2){
		socket2 = socket;
	}

	var i;

	socket.emit('init', function(){
		if (socket == socket1){
			i = 1;
		}else if (socket == socket2){
			i = 2;
		}

		return {player: i, paddle_width: 20, paddle_height: 80, ball_size: 20};
	});

	socket.on('update', function(data){
		if (data.player == 1){
			paddles[0] = data.y;
		}else if (data.player == 2){
			paddles[1] = data.y;
		}
	});

	setInterval(function(){
		ball_pos.x = ball_pos.x + Math.cos(ball_angle) * ball_speed;
		ball_pos.y = ball_pos.y - Math.sin(ball_angle) * ball_speed;		
		socket.emit('draw', ball_pos);
	}, 100);

});
