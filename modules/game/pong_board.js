/**
 * Module that models and contains logic for the rendering
 * and movement of a game board.
 *
 * @module pong_board
 */
 define(["../common/debug"], function(debug) {
 	"use strict";

 	var options = {
 		defaults: {
 			width: 640,
			height: 480,
			padding: 10
 		}
 	};

	/**
	 * Game board class that models the board and provides
	 * rendering logic.
	 *
	 * @class Board
	 * @constructor
	 * @param {Number} width The width of the board.
	 * @param {Number} height The height of the board.
	 * @param {Number} padding The padding of the board.
	 */
	function Board(width, height, padding) {
		this.width = width;
		this.height = height;
		this.padding = padding;
	};

	/**
	 * Renders the ball on a canvas.
	 *
	 * @method render
	 * @param {Object} ctx The 2d context of the canvas.
	 */
	Board.prototype.render = function(ctx, round, scores) {
		var width = this.width;
		var height = this.height;
		var padding = this.padding;

		ctx.save();

		// Draw the middle line.
		ctx.strokeStyle = "white";
		ctx.lineWidth = 15;
		ctx.moveTo(width / 2, 0);
		ctx.lineTo(width / 2, height);
		ctx.stroke();

		// TODO: Clear rect every X number of pixels to make it dotted.

		// Draw the scores and round.
		var textOffset = 20;
		var textWidth = ctx.measureText(scores[0]).width;
		ctx.font = "30px Courier";
		ctx.fillStyle = "white";
		ctx.fillText(round, 0 + textOffset, 40);
		ctx.fillText(scores[0], (width / 2) - textOffset - textWidth, 40);
		ctx.fillText(scores[1], (width / 2) + textOffset, 40);

		ctx.restore();
	};

	return (function() {
		var exports = {
			create: function(width, height, padding) {
				return new Board(width, height, padding);
			},
			createFromExisting: function(board) {
				return exports.create(board.width, board.height, board.padding);
			},
			createDefault: function() {
				return exports.createFromExisting(options.defaults);
			}
		};
		return exports;
	})();

 }); // /define
