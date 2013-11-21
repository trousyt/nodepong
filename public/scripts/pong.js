$(document).ready(function() {
	var socket = io.connect();

	// Define default settings.
	var settings = {
		player_id: -1,
		player: -1,
		ball: {
			location: { x: 30, y: 30 },
			dimensions: { height: 10, width: 10 }
		},
		paddle: {
			dimensions: { height: 80, width: 10 }
		}
	};

	// Reference DOM elements.
	var $board = $('#board');
	var $alert = $('#alert');
	var $ball = $('#ball');
	var $paddle1 = $('#paddle1');
	var $paddle2 = $('#paddle2');
	var $paddles = $('.paddle');
	var board_padding = parseInt($board.css('padding'));


	// ==========================
	// START
	// --------------------------
	// Start after initialized.
	var afterInit = function() {

		// Receive display events.
		socket.on('alert', function(alert) {
			
			$alert.show(1000);
			$alert.text(alert);
			//if (!perpetual) $alert.hide(1000 );

		});

		// Receive board positions.
		socket.on('draw', function(pos) {
			$ball.css({
				left: pos.x,
				top: pos.y
			})
		});

		var paddleMaxY = $board.innerHeight() - 
			board_padding - settings.paddle.dimensions.height;

		// Send paddle position.
		$(document).mousemove(function(e) {
			// Get the relative y-pos to the board.
			var relativeY = e.pageY-$board.offset().top;
			
			// Get the constrained y-pos.
			var constrY = relativeY < board_padding
				? board_padding : relativeY > paddleMaxY 
					? paddleMaxY : relativeY;

			// console.log('relative: ' + relativeY);
			// console.log('constrained: ' + constrY);

			// Update the server.
			var update = { player: settings.player_id, y: constrY };
			socket.emit('update', update);

			// Move the paddle.
			var $currentPaddle = $('#paddle'+settings.player);
			$currentPaddle.css({
				top: constrY
			});
		});
	};

	// Initialize the board.
	var initBoard = function(settings) {
		// Ball
		$ball.css({
			left: settings.ball.location.x,
			top: settings.ball.location.y,
			height: settings.ball.dimensions.height,
			width: settings.ball.dimensions.width
		});
		$ball.removeClass('hidden');

		// Paddles
		$paddles.css({
			height: settings.paddle.dimensions.height,
			width: settings.paddle.dimensions.width
		});		

		// Position paddles.
		$paddle1.css({
			left: $board.css('padding-left')
		});
		$paddle2.css({
			left: ($board.innerWidth()-parseInt($board.css('padding-right')))-$paddle2.width()
		});
		$paddles.removeClass('hidden');
	}

	// Init the game.
	socket.on('init', function(data) {
		console.log('received init: player=' + data.player);
		settings.player_id = data.player;
		settings.player = data.player + 1;
		settings.ball.dimensions.height = settings.ball.dimensions.width = data.ball_size;
		settings.paddle.dimensions.height = data.paddle_height;
		settings.paddle.dimensions.width = data.paddle_width;

		// Init the board.
		initBoard(settings);

		// Invoke after-init code.
		afterInit();
	});

});