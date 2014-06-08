/**
 * Module that oversees mapping sockets to games and handling queueing logic.
 *
 * @module pong_socket_manager
 * @requires pong_socket, debug
 *
 * TODO: Add method documentation
 */
define(["./game/pong_game", "./game/pong_settings", "./common/ext_pubsub", "./common/debug"], 
	function(gameModule, settings, pubsub, debug) {
	"use strict";

	var SOCKET_STATE = {
		JOINED_TO_GAME: 1,
		WAITING: 2
	};

	var games = [],
		sockets = [],
		waitingQueue = [];

	/**
	 * Creates a new game instance and pushes it onto the games array.
	 *
	 * @method createGameInstance
	 * @return {Object} A new PongGame instance.
	 */
	function createGameInstance() {
		var game = gameModule.create();
		games.push(game);
		return game;
	};

	/**
	 * Joins a new game with the provided socket.
	 *
	 * @method joinToGame
	 * @return {Object} An existing or new game instance; null if no game could be joined.
	 */
	function joinToGame(socket) {
		var game = null;

		// Check for any open games.
		debug.write("Searching for open game...");
		for (var i=0; i < games.length; i++) {
			if (!games[i].isFull()) {
				game = games[i];
			}
		}

		// If max games NOT created, create new game.
		if (!game && games.length !== settings.maxGames) {
			debug.write("Creating new game");

			// Create a new game.
			var idx = games.length;
			game = createGameInstance();
			games.push(game);
		}

		if (game) {
			debug.write("Adding player to game");
			var playerIdx = game.addPlayer();
			game.__sockets = game.__sockets || [];
			game.__sockets[playerIdx] = socket;

			//debug.write(game.__sockets.length + " sockets registered to game");
			//debug.write(game.__sockets);

			// Hookup game events.
			//debug.write("Hooking up game events");
			//hookupGameEvents(game, playerIdx, socket);

			// Return the player index.
			return {
				game: game,
				playerIdx: playerIdx
			};
		}

		return null;
	};

	/**
	 * Initializes client.
	 *
	 * @method initializeClient
	 */	
	function initializeClient(socket, game, playerIdx) {

		// Initialize the client.
		debug.write("Initializing client");
		socket.emit("game-init", {
			game: game.getSyncPayload(),
			playerIdx: playerIdx
		});

		// If game is full, start it.
		if (game.isFull()) {
			game.__sockets.forEach(function(skt) { 
				debug.write("Sending match init to socket " + skt.id);
				skt.emit("match-init", game.getSyncPayload()); 
			});

			game.start();
		} else {
			socket.emit("alert", "Waiting for player");
		}
	};

	/**
	 * Removes the socket from the game.
	 *
	 * @method removeFromGame
	 * @param {Object} socket The socket to remove from the game.
	 */
	function removeFromGame(socket) {
		// Pseudo
		// Remove the player from the game
		// Notify removal of player from game
		// Reset the game

		for (var i=0; i < sockets.length; i++) {
			var struct = sockets[i];
			if (struct.socket.id === socket.id) {
				var game = struct.game;
				game.removePlayer(struct.playerIdx);
			}
		};
	};

	/**
	 * Joins the socket to the waiting queue.
	 *
	 * @method joinToWaitingQueue
	 * @param {Object} socket The socket to join to the waiting queue.
	 */
	function joinToWaitingQueue(socket) {
		if (waitingQueue.indexOf(socket) === -1) {
			waitingQueue.push(socket);
		}
	};

	/**
	 * Removes a socket from the waiting queue.
	 *
	 * @method removeFromWaitingQueue
	 * @param {Object} socket The socket to remove from the waiting queue.
	 */
	function removeFromWaitingQueue(socket) {
		if (waitingQueue.length === 0) return;
		waitingQueue = waitingQueue.splice(waitingQueue.indexOf(socket), 1);
	};

	/**
	 * Hooks up handlers to socket events.
	 *
	 * @method hookupSocketEvents
	 * @param {Object} manager The PongManager instance.
	 * @param {Object} socket The socket instance.
	 */
	function hookupSocketEvents(manager, socket) {
		// Handle player disconnects.
		socket.on("disconnect", function() {
			// Remove the player from the game. By removing the player,
			// the game will pause and we'll start waiting for the next
			// player to join.
			//socketDebug(socket, "Player " + playerIdx + " disconnected");
			debug.write(socket.id + " Socket disconnected");
			manager.deregisterSocket(socket); //game.removePlayer(playerIdx);
		});
	};

	/**
	 * Hooks up handlers to game events.
	 *
	 * @method hookupGameEvents
	 * @param {Object} game The PongGame instance.
	 * @param {Object} socket The socket instance.
	 */
	function hookupGameEvents(game, playerIdx, socket) {
		
	};

	// ------------

	function PongManager() {
		// Noop
	};

	// Extend this class with publish-subscribe functionality.
	pubsub(PongManager.prototype);

	/**
     * Handles joining sockets to a game or waiting queue and
     * mapping the socket to a status.
     *
     * @method registerSocket
     * @return {Object} PongGame instance if one was joined.
     */
	PongManager.prototype.registerSocket = function(socket) {
		hookupSocketEvents(this, socket);

		// Try to join existing game or create a new game.
		debug.write("Attempting to join socket to game");
		var response = joinToGame(socket);

		if (response) {
			var game = response.game;
			var playerIdx = response.playerIdx;

			sockets.push({
				socket: socket,
				state: SOCKET_STATE.JOINED_TO_GAME,
				game: game,
				playerIdx: playerIdx
			});

			// Fire an event when a game is joined.
			this.fire("joined", {
				socket: socket,
				game: game,
				playerIdx: playerIdx
			});

			initializeClient(socket, game, playerIdx);
			return response.game;

		} else {
			debug.write("Game not available; queueing!");

			// Nothing available, so join the waiting queue.
			joinToWaitingQueue(socket);
			sockets.push({
				socket: socket,
				state: SOCKET_STATE.WAITING
			});

			// Fire an event when a socket is 'queued'.
			this.fire("queued", socket);
		}
	};

	/**
	 * Deregisters a socket with the manager.
	 *
	 * @method deregisterSocket
	 */
	PongManager.prototype.deregisterSocket = function(socket) {
		for (var i=0; i < sockets.length; i++) {
			if (socket.id === sockets[i].socket.id) {
				var matchedSocket = sockets[i];

				switch (matchedSocket.state) {
					case SOCKET_STATE.JOINED_TO_GAME: 
						removeFromGame(socket);
						break;
					case SOCKET_STATE.WAITING:
						removeFromWaitingQueue(socket);
						break;
				}

				// Remove the socket from tracked sockets.
				sockets.splice(i, 1);
				break;
			}
		}
	};

	return new PongManager;
});

