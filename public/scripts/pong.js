
$(document).ready(function() {
	var socket = io.connect();
	var gameModule = require(['/scripts/game/pong_game_web.js']);
	
	var gameSettings = {
		refreshIntervalMs: 100,
		playerIdx: -1,
		game: null,

		playerNumber: function() {
			return this.playerIdx + 1;
		}
	};

	// Reference DOM elements.
	var $board = $('#board');
	var $alert = $('#alert');
	var $canvas = $('#game-canvas');
	var canvas = document.getElementById('game-canvas');
	var board_padding = parseInt($board.css('padding'));


	// ==========================
	// START
	// --------------------------
	// Start after initialized.
	var afterInit = function() {
		console.log('in afterInit');

		// Receive display events.
		socket.on('alert', function(alert) {
			
			$alert.show(1000);
			$alert.text(alert);
			//if (!perpetual) $alert.hide(1000 );

		});

		// Sync with the server.
		socket.on('sync', function(game) {
			// TODO: Sync the local game instance with the provided
		});


		// TODO: Move requirements-checking to right after page load.
		// if (!canvas.getContext()) {
		// 	alert('Your browser doesn\'t support the canvas!');
		// 	return;
		// }

		// Run the simple game loop.
		var ctx = canvas.getContext('2d');
		setInterval(function() {
			if (gameSettings.game != undefined){
				gameSettings.game.render(ctx);
			}
		}, gameSettings.refreshIntervalMs);

		// Send paddle position.
		$(document).mousemove(function(e) {
			// Get the relative y-pos to the board.
			var relativeY = e.pageY-$board.offset().top;
			var paddleMaxY = canvas.height;
			
			// Get the constrained y-pos.
			var constrY = relativeY < board_padding
				? board_padding : relativeY > paddleMaxY 
					? paddleMaxY : relativeY;

			// console.log('relative: ' + relativeY);
			// console.log('constrained: ' + constrY);

			// Update the server.
			//var update = { playerIdx: gameSettings.playerIdx, y: constrY };
			socket.emit('update-paddley', constrY);
		});
	};

	// Init the game.
	socket.on('init', function(playerIdx, game) {
		console.log('in init');
		console.log('received init: player=' + playerIdx);
		gameSettings.playerIdx = playerIdx;
		gameSettings.game = game;

		// Invoke after-init code.
		afterInit();
	});

});