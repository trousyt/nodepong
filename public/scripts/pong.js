
$(document).ready(function() {

	var that = this;
	require(['scripts/game/pong_game'], function(gameModule) {
		var socket = io.connect();

		var gameCtx = {
			settings: {	
				refreshInterval: 100
			}
		};

		// Reference DOM elements.
		var $board = $('#board');
		var $alert = $('#alert');
		var canvas = document.getElementById('game-canvas');
		var board_padding = parseInt($board.css('padding'));


		// ==========================
		// START
		// --------------------------
		var self = that;
		var syncGame = function(game) {
			gameCtx.game.sync(game);
			console.log('Finished syncing game');
		};

		// Init the game.
		socket.on('init', function(init) {
			console.log('Received init for player ' + init.playerIdx);

			// Create the game instance and immediately sync it.
			gameCtx.game = gameModule.create();
			gameCtx.game.playerIdx = init.playerIdx;
			syncGame(init.game);

			// Invoke after-init code.
			afterInit();
		});

		// Start after initialized.
		var afterInit = function() {

			/*
			 * Event: alert
			 * Receive display events.
			 */
			socket.on('alert', function(alert) {
				$alert.show(1000);
				$alert.text(alert);
				//if (!perpetual) $alert.hide(1000 );
			});

			/* 
			 * Event: sync
			 * Syncs the server game instance with the client.
			 */
			socket.on('sync', function(game) {
				console.log('in sync handler');
				console.log(game);
				gameCtx.game.sync(game);
			});


			// TODO: Move requirements-checking to right after page load.
			// if (!canvas.getContext()) {
			// 	alert('Your browser doesn\'t support the canvas!');
			// 	return;
			// }

			// Run the simple game loop.
			var ctx = canvas.getContext('2d');
			setInterval(function() {
				gameCtx.game.render(ctx);
			}, gameCtx.settings.refreshInterval);

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

	}); // /requirejs

});