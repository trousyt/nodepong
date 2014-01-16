
$(document).ready(function() {

	require(['scripts/game/pong_game'], function(gameModule) {
		var socket = io.connect();

		this.game = null;
		this.gameSettings = {	
			refreshIntervalMs: 100,
			playerNumber: function() {
				return that.game.playerIdx + 1;
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
		var that = this;
		var syncGame = function(game) {
			this.game.sync(game);
			console.log('Finished syncing game');
			console.log(this.game);
		};

		// Init the game.
		socket.on('init', function(playerIdx, game) {
			console.log('in init');
			console.log('received init: player=' + playerIdx);
			console.log(that);

			// Create the game instance and immediately sync it.
			that.game = gameModule.create();
			that.game.playerIdx = playerIdx;
			syncGame(game);

			// Invoke after-init code.
			afterInit();
		});

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

	}); // /requirejs

});