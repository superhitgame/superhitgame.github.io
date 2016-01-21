var Board = require("./board.js");
var InputArea = require("./inputArea.js");
var helper = require("./helper.js");
//var config = require("./configuration.js");


var config = {
    DRAW_ALL: true,
    DEBUG_DRAW: false,
    SHOW_MOUSE: true,
    //sample when we divert this distance from current straight line
    //0 = sample each point
    //>0.2 = never sample
    SAMPLE_DISTANCE_THRESHOLD: 0.003,
    //sample when we make an angle smaller this threshold
    //0 = never sample
    //180 = sample each point
    SAMPLE_HOOK_DEGREES: 140,
    SAMPLE_HOOK_THRESHOLD: 175 * Math.PI / 180, //first number is the angle in degrees

    //draw straight lines, instead of smooth when angle between smaple points is smaller than this threshold
    //0 = always smooth
    //180 = always straight
    //var HOOK_THRESHOLD = 130 * Math.PI / 180; //first number is the angle in degrees
    HOOK_DEGREES: 130,
    HOOK_THRESHOLD: 130 * Math.PI / 180, //first number is the angle in degrees
   
    // ////////////////////////////
  
    NORMALIZED_PEN_WIDTH: 0.03,
 
    // ////////////////////////////

    NORMALIZED_WIDTH: 1,
    NORMALIZED_HEIGHT: 1.5,

    ROUNDING_FACTOR_X: 1000,
    ROUNDING_FACTOR_Y: 1000
};



window.onload = function(){
    var visibleCanvas = document.getElementById('drawingCanvas');
    var board = new Board(visibleCanvas, config);
    var inputArea = new InputArea(visibleCanvas, board);
    var v = helper.viewport();
    //canvas.width  = v.width - 20;
    board.setHeight(v.height - 200);

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

    var sampleDistance = document.getElementById("sampleDistance");
    var sampleHook = document.getElementById("sampleHook");
    var straightAngle = document.getElementById("straightAngle");
    var penWidth = document.getElementById("penWidth");
    var debugDraw = document.getElementById("debugDraw");
    var showMouse = document.getElementById("showMouse");
    var totalPoints = document.getElementById("totalPoints");
    var drawAll = document.getElementById("drawAll");

    sampleDistance.value = config.SAMPLE_DISTANCE_THRESHOLD;
    sampleHook.value = config.SAMPLE_HOOK_DEGREES; 
    straightAngle.value = config.HOOK_DEGREES;
    penWidth.value = config.NORMALIZED_PEN_WIDTH;
    debugDraw.checked = config.DEBUG_DRAW;
    showMouse.checked = config.SHOW_MOUSE;
    drawAll.checked = config.DRAW_ALL;

    document.getElementById("update").addEventListener("click", function() {
        update();
    });

    document.onkeydown=function(e){
        if(e.which == 13){
            e.preventDefault();
            update();
            return false;
        }
    }

    var update = function(){
        config.SAMPLE_DISTANCE_THRESHOLD = sampleDistance.value;
        config.SAMPLE_HOOK_DEGREES = sampleHook.value; 
        config.SAMPLE_HOOK_THRESHOLD = sampleHook.value * Math.PI / 180;
        config.HOOK_DEGREES = straightAngle.value;
        config.HOOK_THRESHOLD = straightAngle.value * Math.PI / 180;
        config.NORMALIZED_PEN_WIDTH = penWidth.value;
        config.DEBUG_DRAW = debugDraw.checked;
        config.SHOW_MOUSE = showMouse.checked;
        config.DRAW_ALL= drawAll.checked;
        totalPoints.innerHTML = board.normalizedPenX.length;
        board.reconstruct();
    };

};
