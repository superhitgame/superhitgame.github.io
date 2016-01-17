var Board = require("./board.js");
var InputArea = require("./inputArea.js");
var helper = require("./helper.js");
//var config = require("./configuration.js");


var config = {
    DEBUG_DRAW: false,
    START_DISTANCE_THRESHOLD: 0.005, 
    //sample when we divert this distance from current straight line
    //0 = sample each point
    //>0.2 = never sample
    SAMPLE_DISTANCE_THRESHOLD: 0.003,
    //sample when we make an angle smaller this threshold
    //0 = never sample
    //180 = sample each point
    SAMPLE_HOOK_DEGREES: 160,
    SAMPLE_HOOK_THRESHOLD: 160 * Math.PI / 180, //first number is the angle in degrees

    SAMPLE_HOOK_DEAD_ZONE_START_DEGREES: 0,
    SAMPLE_HOOK_DEAD_ZONE_START_THRESHOLD: 0 * Math.PI / 180, //first number is the angle in degrees

    //draw straight lines, instead of smooth when angle between smaple points is smaller than this threshold
    //0 = always smooth
    //180 = always straight
    //var HOOK_THRESHOLD = 130 * Math.PI / 180; //first number is the angle in degrees
    HOOK_DEGREES: 180,
    HOOK_THRESHOLD: 180 * Math.PI / 180, //first number is the angle in degrees
   
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
    var deadZoneStart = document.getElementById("deadZoneStart");
    var straightAngle = document.getElementById("straightAngle");
    var penWidth = document.getElementById("penWidth");
    var debugDraw = document.getElementById("debugDraw");

    sampleDistance.value = config.SAMPLE_DISTANCE_THRESHOLD;
    sampleHook.value = config.SAMPLE_HOOK_DEGREES; 
    deadZoneStart.value = config.SAMPLE_HOOK_DEAD_ZONE_START_DEGREES; 
    straightAngle.value = config.HOOK_DEGREES;
    penWidth.value = config.NORMALIZED_PEN_WIDTH;
    debugDraw.checked = config.DEBUG_DRAW;

    document.getElementById("update").addEventListener("click", function() {
        config.SAMPLE_DISTANCE_THRESHOLD = sampleDistance.value;
        config.SAMPLE_HOOK_DEGREES = sampleHook.value; 
        config.SAMPLE_HOOK_THRESHOLD = sampleHook.value * Math.PI / 180;
        config.SAMPLE_HOOK_DEAD_ZONE_START_DEGREES = deadZoneStart.value; 
        config.SAMPLE_HOOK_DEAD_ZONE_START_THRESHOLD = deadZoneStart.value * Math.PI / 180;
        config.HOOK_DEGREES = straightAngle.value;
        config.HOOK_THRESHOLD = straightAngle.value * Math.PI / 180;
        config.NORMALIZED_PEN_WIDTH = penWidth.value;
        config.DEBUG_DRAW = debugDraw.checked;
        board.redraw();
    });

};
