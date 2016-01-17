var Board = require("./board.js");
var InputArea = require("./inputArea.js");
var helper = require("./helper.js");

window.onload = function(){
    var visibleCanvas = document.getElementById('drawingCanvas');
    var board = new Board(visibleCanvas);
    var inputArea = new InputArea(visibleCanvas, board);
    var v = helper.viewport();
    //canvas.width  = v.width - 20;
    board.setHeight(v.height - 100);

    document.getElementById("widthButton").addEventListener("click", function() {
        board.setWidth(prompt("Set width:"));
    });

    document.getElementById("clearButton").addEventListener("click", function() {
        board.reset();
    });

    document.getElementById("roundButton").addEventListener("click", function() {
        board.round();
    });

    document.getElementById("infoButton").addEventListener("click", function() {
        alert("Total points: " + board.normalizedPenX.length);
    });
};
