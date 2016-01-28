/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Board = __webpack_require__(1);
	var InputArea = __webpack_require__(7);
	var helper = __webpack_require__(5);
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
	    var drawingCanvas = document.getElementById('drawingCanvas');
	    var tempCanvas = document.getElementById('tempCanvas');
	    var board = new Board(drawingCanvas, tempCanvas, config);
	    var inputArea = new InputArea(tempCanvas, board);
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
	        alert("Total points: " + board.penX.length);
	    });

	    var sampleDistance = document.getElementById("sampleDistance");
	    var sampleHook = document.getElementById("sampleHook");
	    var straightAngle = document.getElementById("straightAngle");
	    var penWidth = document.getElementById("penWidth");
	    var debugDraw = document.getElementById("debugDraw");
	    var showMouse = document.getElementById("showMouse");
	    var mousePoints = document.getElementById("mousePoints");
	    var drawAll = document.getElementById("drawAll");

	    debugDraw.addEventListener("click", function() {
	        update();
	    });

	    showMouse.addEventListener("click", function() {
	        update();
	    });

	    drawAll.addEventListener("click", function() {
	        update();
	    });

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
	        board.distanceThreshold = sampleDistance.value * board.master.scaleFactor;
	        config.SAMPLE_HOOK_DEGREES = sampleHook.value; 
	        config.SAMPLE_HOOK_THRESHOLD = sampleHook.value * Math.PI / 180;
	        config.HOOK_DEGREES = straightAngle.value;
	        config.HOOK_THRESHOLD = straightAngle.value * Math.PI / 180;
	        config.NORMALIZED_PEN_WIDTH = penWidth.value;
	        config.DEBUG_DRAW = debugDraw.checked;
	        config.SHOW_MOUSE = showMouse.checked;
	        config.DRAW_ALL= drawAll.checked;
	        mousePoints.innerHTML = board.penX.length;
	        board.reconstruct();
	    };

	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Board;

	var ScalableCanvas = __webpack_require__(2);
	var helper = __webpack_require__(5);
	var logger = __webpack_require__(3);
	var colors = __webpack_require__(4);
	var filter = __webpack_require__(6);

	function Board(drawingCanvas, tempCanvas, config) {
	    this.config = config;
	    this.buffer = new ScalableCanvas(tempCanvas, config);
	    this.master = new ScalableCanvas(drawingCanvas, config);
	    this.reset();
	}

	Board.prototype.reset = function() {
	    this.penX = new Array();
	    this.penY = new Array();
	    this.penDragging = new Array();
	    this.isDrawing = false;
	    this.redraw();
	};

	Board.prototype.startPen = function(x, y, reconstructing) {
	    this.addPoint(x, y, false);
	    this.isDrawing = true;
	};


	Board.prototype.movePen = function(x, y, reconstructing) {
	    if (this.isDrawing) {
	        this.addPoint(x, y, true);
	    }
	};

	Board.prototype.stopPen = function(x, y, reconstructing) {
	    this.addPoint(x, y, true, true);
	    this.isDrawing = false;
	};

	Board.prototype.setWidth = function(width) {
	    var originalScaleFactor = this.master.scaleFactor;
	    this.buffer.setWidth(width);
	    this.master.setWidth(width);
	    var newScaleFactor = this.master.scaleFactor;
	    this.distanceThreshold = this.config.SAMPLE_DISTANCE_THRESHOLD * newScaleFactor;
	    this.rescale(originalScaleFactor, newScaleFactor);
	    this.redraw();
	};

	Board.prototype.setHeight = function(height) {
	    var originalScaleFactor = this.master.scaleFactor;
	    this.buffer.setHeight(height);
	    this.master.setHeight(height);
	    var newScaleFactor = this.master.scaleFactor;
	    this.distanceThreshold = this.config.SAMPLE_DISTANCE_THRESHOLD * newScaleFactor;
	    this.rescale(originalScaleFactor, newScaleFactor);
	    this.redraw();
	};

	Board.prototype.addPoint = function(x, y, dragging, close) {
	    if(typeof x !== 'undefined' &&
	            (this.penX.length == 0 ||
	             x != this.penX[this.penX.length - 1] ||
	             y != this.penY[this.penY.length - 1])){
	        this.penX.push(x);
	        this.penY.push(y);
	        this.penDragging.push(dragging);
	    }
	    this.draw(this.penDragging.length - 1, close);
	};

	Board.prototype.draw = function(index, close) {
	    if(this.hasBuffer){
	        //this.buffer.clear();
	        this.buffer.clearBuffer(this.bufferFromX, this.bufferFromY, this.bufferToX, this.bufferToY);
	        this.hasBuffer = false;
	    }
	    if (!this.penDragging[index]) {
	        this.master.drawPoint(this.penX[index], this.penY[index]);
	    } else if (this.penDragging[index - 1]) {
	        var xc0 = (this.penX[index - 2] + this.penX[index - 1]) / 2;
	        var yc0 = (this.penY[index - 2] + this.penY[index - 1]) / 2;
	        if (close) {
	            this.master.drawSmoothLine(xc0, yc0, this.penX[index - 1], this.penY[index - 1], this.penX[index], this.penY[index]);
	        } else {
	            var xc1 = (this.penX[index - 1] + this.penX[index]) / 2;
	            var yc1 = (this.penY[index - 1] + this.penY[index]) / 2;
	            this.master.drawSmoothLine(xc0, yc0, this.penX[index - 1], this.penY[index - 1], xc1, yc1);
	            this.buffer.drawLine(xc1, yc1, this.penX[index], this.penY[index]);
	            this.hasBuffer = true;
	            this.bufferFromX = xc1;
	            this.bufferFromY = yc1;
	            this.bufferToX = this.penX[index];
	            this.bufferToY = this.penY[index];
	        }
	    } else if (close) {
	        this.master.drawLine(this.penX[index - 1], this.penY[index - 1], this.penX[index], this.penY[index]);
	    } else {
	        var xc = (this.penX[index - 1] + this.penX[index]) / 2;
	        var yc = (this.penY[index - 1] + this.penY[index]) / 2;
	        this.master.drawLine(this.penX[index - 1], this.penY[index - 1], xc, yc);
	        this.buffer.drawLine(xc, yc, this.penX[index], this.penY[index]);
	        this.hasBuffer = true;
	        this.bufferFromX = xc;
	        this.bufferFromY = yc;
	        this.bufferToX = this.penX[index];
	        this.bufferToY = this.penY[index];
	    }
	}

	Board.prototype.redraw = function() {
	    this.master.initDrawingStyle();
	    this.buffer.initDrawingStyle();
	    this.master.clear();
	    this.buffer.clear();
	    this.master.drawSmoothLines(this.penX, this.penY, this.penDragging);
	};

	Board.prototype.reconstruct = function() {
	    var filtered = filter.filter(this.penX, this.penY, this.penDragging, this.config.SAMPLE_HOOK_THRESHOLD, this.distanceThreshold);
	    this.master.clear();
	    this.buffer.clear();
	    this.master.drawSmoothLines(filtered.x, filtered.y, filtered.dragging);

	    if(this.config.SHOW_MOUSE){
	        this.master.context.strokeStyle = colors.RED;
	        this.master.drawPoints(this.penX, this.penY); 
	        this.master.context.strokeStyle = colors.DARK_GREY;
	    }

	    document.getElementById("samplePoints").innerHTML = filtered.x.length;
	};

	Board.prototype.normalize = function(value) {
	  return value / this.master.scaleFactor;
	};

	Board.prototype.denormalize = function(value) {
	  return value * this.master.scaleFactor;
	};

	Board.prototype.rescale = function(origFactor, newFactor) {
	    var factor = newFactor / origFactor;
	    for(var i = 0; i < this.penX.length; i++){
	        this.penX[i] = factor * this.penX[i];
	        this.penY[i] = factor * this.penY[i];
	    }
	};


	Board.prototype.round = function(){
	    var normX = 1 / this.config.NORMALIZED_WIDTH / this.config.NORMALIZED_WIDTH * this.config.ROUNDING_FACTOR_X;
	    var denormX = 1 / this.config.ROUNDING_FACTOR_X * this.config.NORMALIZED_WIDTH * this.config.NORMALIZED_WIDTH;

	    var normY = 1 / this.config.NORMALIZED_HEIGHT/ this.config.NORMALIZED_HEIGHT * this.config.ROUNDING_FACTOR_Y;
	    var denormY = 1 / this.config.ROUNDING_FACTOR_Y * this.config.NORMALIZED_HEIGHT* this.config.NORMALIZED_HEIGHT;

	    for(var i = 0; i < this.penX.length; i++){
	        this.penX[i] = Math.round(this.penX[i] * normX) * denormX;
	        this.penY[i] = Math.round(this.penY[i] * normY) * denormY;
	    }
	    this.redraw();
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = ScalableCanvas;

	var logger = __webpack_require__(3);
	var colors = __webpack_require__(4);
	var helper = __webpack_require__(5);

	function ScalableCanvas(canvas, config) {
	    this.config = config;
	    this.canvas = canvas;
	    this.context = this.canvas.getContext("2d");
	    this.scaleFactor = 1;
	}

	ScalableCanvas.prototype.initDrawingStyle = function() {
	    this.context.strokeStyle = colors.DARK_GREY;
	    this.context.lineJoin = "round";
	    this.context.lineCap = "round";
	    this.context.lineWidth = this.scaleFactor * this.config.NORMALIZED_PEN_WIDTH;
	}

	ScalableCanvas.prototype.setWidth = function(width) {
	    this.canvas.width = width;
	    this.scaleFactor = width / this.config.NORMALIZED_WIDTH;
	    this.canvas.height = this.scaleFactor * this.config.NORMALIZED_HEIGHT;
	};

	ScalableCanvas.prototype.setHeight = function(height) {
	    this.canvas.height = height;
	    this.scaleFactor = height / this.config.NORMALIZED_HEIGHT;
	    this.canvas.width = this.scaleFactor * this.config.NORMALIZED_WIDTH;
	};

	ScalableCanvas.prototype.drawPoint = function(x, y) {
	    this.context.beginPath();
	    this.context.moveTo(x - 1, y);
	    this.context.lineTo(x, y);
	    this.context.stroke();
	};

	ScalableCanvas.prototype.drawPoints = function(pointsX, pointsY) {
	    this.context.beginPath();
	    for(var i = 0; i < pointsX.length; i++) {
	        this.context.moveTo(pointsX[i] - 1, pointsY[i]);
	        this.context.lineTo(pointsX[i], pointsY[i]);
	    }
	    this.context.stroke();
	};

	ScalableCanvas.prototype.drawLine = function(x0, y0, x1, y1) {
	    this.context.beginPath();
	    this.context.moveTo(x0 - 1, y0);
	    this.context.lineTo(x1, y1);
	    this.context.stroke();
	};

	ScalableCanvas.prototype.drawLines = function(pointsX, pointsY, dragging) {
	    this.context.beginPath();
	    for (var i = 0; i < pointsX.length; i++) {
	        if (!dragging[i]) {
	            this.context.moveTo(pointsX[i] - 1, pointsY[i]);
	            this.context.lineTo(pointsX[i], pointsY[i]);
	        } else {
	            this.context.moveTo(pointsX[i - 1] - 1, pointsY[i - 1]);
	            this.context.lineTo(pointsX[i], pointsY[i]);
	        }
	    }
	    this.context.stroke();
	}

	ScalableCanvas.prototype.drawSmoothLine = function(x0, y0, x1, y1, x2, y2) {
	    this.context.beginPath();
	    this.context.moveTo(x0, y0);
	    if (helper.angle(x0, y0, x1, y1, x2, y2) >= this.config.HOOK_THRESHOLD) {
	        this.context.quadraticCurveTo(x1, y1, x2, y2);
	    } else {
	        this.context.lineTo(x1, y1);
	        this.context.lineTo(x2, y2);
	    }
	    this.context.stroke();
	}

	ScalableCanvas.prototype.drawSmoothLines = function(pointsX, pointsY, dragging) {
	    this.context.beginPath();
	    for (var i = 0; i < pointsX.length; i++) {
	        if (!dragging[i]) {
	        this.context.moveTo(pointsX[i] - 1, pointsY[i]);
	        this.context.lineTo(pointsX[i], pointsY[i]);
	        } else if (i < pointsX.length - 1) {
	        if (dragging[i + 1]) {
	            var xc = (pointsX[i] + pointsX[i + 1]) / 2;
	            var yc = (pointsY[i] + pointsY[i + 1]) / 2;
	            if (helper.angle(pointsX[i - 1], pointsY[i - 1], pointsX[i], pointsY[i], pointsX[i + 1], pointsY[i + 1]) >= this.config.HOOK_THRESHOLD) {
	                this.context.quadraticCurveTo(pointsX[i], pointsY[i], xc, yc);
	            } else {
	                this.context.lineTo(pointsX[i], pointsY[i]);
	                this.context.lineTo(xc, yc);
	            }
	        } else {
	            this.context.lineTo(pointsX[i], pointsY[i]);
	        }
	        } else if (close) {
	            this.context.lineTo(pointsX[i], pointsY[i]);
	        }
	    }
	    this.context.stroke();
	}

	ScalableCanvas.prototype.drawCanvas = function(scalableCanvas) {
	    this.context.drawImage(scalableCanvas.canvas, 0, 0);
	};

	ScalableCanvas.prototype.clearBuffer = function(bufferFromX, bufferFromY, bufferToX, bufferToY) {
	    var width, height, x, y;
	    if(bufferFromX < bufferToX){
	        width = bufferToX - bufferFromX;
	        x = bufferToX;
	    } else {
	        width = bufferFromX - bufferToX;
	        x = bufferFromX;
	    }

	    if(bufferFromY < bufferToY){
	        height = bufferToY - bufferFromY;
	        y = bufferToY;
	    } else {
	        height = bufferFromY - bufferToY;
	        y = bufferFromY;
	    }

	    this.context.clearRect(x, y, width, height);
	    //this.context.rect(x, y, width, height);
	    //this.context.stroke();
	};

	ScalableCanvas.prototype.clear = function() {
	    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	};



/***/ },
/* 3 */
/***/ function(module, exports) {

	exports.log = function(text) {
	  console.log(text);
	};


/***/ },
/* 4 */
/***/ function(module, exports) {

	exports.BLACK = "#000000";
	exports.DARK_GREY = "#7a7a7a";
	exports.RED = "#c40000";
	exports.GREY = "#b2b2b2";
	exports.BLUE = "#2d96ff";
	exports.GREEN = "#a8ee3e";


/***/ },
/* 5 */
/***/ function(module, exports) {

	//distance from point (x0, y0) to line defined by points (x1, y1) and (x2, y2)

	exports.distanceToLine = function(x0, y0, x1, y1, x2, y2) {
	  return Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
	};

	exports.distance = function(x0, y0, x1, y1) {
	  return Math.sqrt((y1 - y0) * (y1 - y0) + (x1 - x0) * (x1 - x0));
	}


	exports.angle = function(xa, ya, xb, yb, xc, yc) {
	  var AB = Math.sqrt(Math.pow(xb - xa, 2) + Math.pow(yb - ya, 2));
	  var BC = Math.sqrt(Math.pow(xb - xc, 2) + Math.pow(yb - yc, 2));
	  var AC = Math.sqrt(Math.pow(xc - xa, 2) + Math.pow(yc - ya, 2));
	  return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
	}

	exports.viewport = function(){
	    var e = window, a = 'inner';
	    if (!('innerWidth' in window)){
	        a = 'client';
	        e = document.documentElement || document.body;
	    }
	    return {width:e[a + 'Width'], height:e[a + 'Height']};
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var helper = __webpack_require__(5);

	exports.filter = function(pointsX, pointsY, dragging, hookThreshold, distanceThreshold){
	    var filteredX = new Array();
	    var filteredY = new Array();
	    var filteredDragging = new Array();

	    var origX, origY, refX, refY, bufferX, bufferY, x, y;
	    var hasReference = false;

	    for(var i = 0; i < pointsX.length; i++){
	        x = pointsX[i];
	        y = pointsY[i];
	        if(!dragging[i] || i == pointsX.length - 1 || !dragging[i + 1]){
	           filteredX.push(x); 
	           filteredY.push(y); 
	           filteredDragging.push(dragging[i]); 
	           origX = x;
	           origY = y;
	        } else if(!hasReference){
	            if(x != origX || y != origY){
	               hasReference = true; 
	               refX = x;
	               refY = y;
	            }
	        } else if(helper.angle(origX, origY, bufferX, bufferY, x, y) < hookThreshold){
	            filteredX.push(bufferX); 
	            filteredY.push(bufferY); 
	            filteredDragging.push(true);
	            origX = x;
	            origY = y;
	            hasReference = false;
	        } else if(helper.distanceToLine(x, y, origX, origY, refX, refY) > distanceThreshold){  
	            filteredX.push(x); 
	            filteredY.push(y); 
	            filteredDragging.push(true);
	            origX = x;
	            origY = y;
	            hasReference = false;
	        } 
	        bufferX = x;
	        bufferY = y;
	    }
	    return {x: filteredX, y: filteredY, dragging: filteredDragging};
	}


/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = InputArea;

	function InputArea(canvas, drawingManager) {
	  var self = this;
	  self.canvas = canvas;
	  self.drawingManager = drawingManager;
	  if ("ontouchstart" in window) {
	    //log("init touch");
	    self.canvas.addEventListener("touchstart", function(e) {
	      e.preventDefault();
	      self.drawingManager.startPen(e.touches[0].pageX - self.canvas.offsetLeft, e.touches[0].pageY - self.canvas.offsetTop);
	    }, false);
	    self.canvas.addEventListener("touchend", function(e) {
	      e.preventDefault();
	      self.drawingManager.stopPen();
	    }, false);
	    self.canvas.addEventListener("touchmove", function(e) {
	      e.preventDefault();
	      self.drawingManager.movePen(e.touches[0].pageX - self.canvas.offsetLeft, e.touches[0].pageY - self.canvas.offsetTop);
	    }, false);
	  } else {
	    //log("init mouse");
	    self.canvas.addEventListener("mousedown", function(e) {
	      e.preventDefault();
	      self.drawingManager.startPen(e.pageX - self.canvas.offsetLeft, e.pageY - self.canvas.offsetTop);
	    }, false);
	    self.canvas.addEventListener("mouseup", function(e) {
	      e.preventDefault();
	      self.drawingManager.stopPen(e.pageX - self.canvas.offsetLeft, e.pageY - self.canvas.offsetTop);
	    }, false);
	    self.canvas.addEventListener("mousemove", function(e) {
	      e.preventDefault();
	      self.drawingManager.movePen(e.pageX - self.canvas.offsetLeft, e.pageY - self.canvas.offsetTop);
	    }, false);
	  }
	}



/***/ }
/******/ ]);