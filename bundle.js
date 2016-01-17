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
	var helper = __webpack_require__(6);

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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Board;

	var ScalableCanvas = __webpack_require__(2);
	var helper = __webpack_require__(6);
	var logger = __webpack_require__(3);
	var config = __webpack_require__(4);
	var colors = __webpack_require__(5);

	function Board(visibleCanvas) {
	  var self = this;
	  self.buffer = new ScalableCanvas(visibleCanvas);
	  self.master = new ScalableCanvas(document.createElement("canvas"));
	  self.reset();
	}

	Board.prototype.reset = function() {
	  var self = this;
	  self.normalizedPenX = new Array();
	  self.normalizedPenY = new Array();
	  self.penDragging = new Array();
	  self.isDrawing = false;
	  self.hasReference = false;
	  self.hasBuffer;
	  self.bufferX;
	  self.bufferY;
	  self.refX;
	  self.refY;
	  self.redraw();
	};

	Board.prototype.startPen = function(x, y) {
	  var self = this;
	  self.addPoint(self.normalize(x), self.normalize(y), false);
	  self.drawBuffer();
	  self.isDrawing = true;
	};


	Board.prototype.movePen = function(x, y) {
	  var self = this;
	  if (self.isDrawing) {
	    var normX = self.normalize(x);
	    var normY = self.normalize(y);
	    var lastX = self.normalizedPenX[self.normalizedPenX.length - 1];
	    var lastY = self.normalizedPenY[self.normalizedPenY.length - 1];
	    if(!self.hasReference){
	        if((normX != lastX && normY != lastY) || helper.distance(normX, normY, lastX, lastY) > config.START_DISTANCE_THRESHOLD){
	            //logger.log((lastX - normX) + " - " + (lastY - normY));
	    		self.hasReference = true;
	      	    self.refX = normX;
	    		self.refY = normY;
	        }
	    } else if(helper.angle(lastX, lastY, self.bufferX, self.bufferY, normX, normY) <= config.SAMPLE_HOOK_THRESHOLD){
	        self.addPoint(self.bufferX, self.bufferY, true);
	        self.hasReference = false;
	    } else if(helper.distanceToLine(normX, normY, lastX, lastY, self.refX, self.refY) > config.SAMPLE_DISTANCE_THRESHOLD){  
	      	self.addPoint(normX, normY, true);
	        self.hasReference = false;
	    } 
	    self.bufferX = normX;
	    self.bufferY = normY;
	    self.hasBuffer = true;
	    self.drawBuffer();
	  }
	};

	Board.prototype.stopPen = function(x, y) {
	    var self = this;
	    if (self.hasBuffer) {
	        self.hasReference = false;
	        self.hasBuffer = false;
	        logger.log("added point");
	        self.addPoint(self.bufferX, self.bufferY, true);
	    }
	    self.isDrawing = false;
	    self.drawMaster(self.penDragging.length - 1, true); 
	    self.drawBuffer();
	};

	Board.prototype.setWidth = function(width) {
	  var self = this;
	  self.buffer.setWidth(width);
	  self.master.setWidth(width);
	  self.redraw();
	};

	Board.prototype.setHeight = function(height) {
	  var self = this;
	  self.buffer.setHeight(height);
	  self.master.setHeight(height);
	  self.redraw();
	};

	Board.prototype.addPoint = function(x, y, dragging) {
	    var self = this;
	    if(x != self.normalizedPenX[self.normalizedPenX.length - 1] || y != self.normalizedPenY[self.normalizedPenY.length - 1]){
	        self.normalizedPenX.push(x);
	        self.normalizedPenY.push(y);
	        self.penDragging.push(dragging);
	        self.drawMaster(self.penDragging.length - 1);
	    }
	};

	Board.prototype.drawMaster = function(index, doClose) {
	  var self = this;
	  var close = doClose === true && (index === self.penDragging.length - 1 || !self.penDragging[index + 1]);
	  if (!self.penDragging[index]) {
	    self.master.drawPoint(self.normalizedPenX[index], self.normalizedPenY[index]);
	  } else if (self.penDragging[index - 1]) {
	    var xc0 = (self.normalizedPenX[index - 2] + self.normalizedPenX[index - 1]) / 2;
	    var yc0 = (self.normalizedPenY[index - 2] + self.normalizedPenY[index - 1]) / 2;
	    if (close) {
	      self.master.drawSmoothLine(xc0, yc0, self.normalizedPenX[index - 1], self.normalizedPenY[index - 1], self.normalizedPenX[index], self.normalizedPenY[index]);
	    } else {
	      var xc1 = (self.normalizedPenX[index - 1] + self.normalizedPenX[index]) / 2;
	      var yc1 = (self.normalizedPenY[index - 1] + self.normalizedPenY[index]) / 2;
	      self.master.drawSmoothLine(xc0, yc0, self.normalizedPenX[index - 1], self.normalizedPenY[index - 1], xc1, yc1);
	    }
	  } else if (close) {
	    self.master.drawLine(self.normalizedPenX[index - 1], self.normalizedPenY[index - 1], self.normalizedPenX[index], self.normalizedPenY[index]);
	  } else {
	    var xc = (self.normalizedPenX[index - 1] + self.normalizedPenX[index]) / 2;
	    var yc = (self.normalizedPenY[index - 1] + self.normalizedPenY[index]) / 2;
	    self.master.drawLine(self.normalizedPenX[index - 1], self.normalizedPenY[index - 1], xc, yc);
	  }
	}

	Board.prototype.drawBuffer = function() {
	  var self = this;
	  var index = self.normalizedPenX.length - 1;
	  
	  self.buffer.clear();
	  self.buffer.drawCanvas(self.master);
	  if (self.hasBuffer) {
	    if (self.penDragging[index]) {
	      var xc = (self.normalizedPenX[index - 1] + self.normalizedPenX[index]) / 2;
	      var yc = (self.normalizedPenY[index - 1] + self.normalizedPenY[index]) / 2;
	      self.buffer.drawSmoothLine(xc, yc, self.normalizedPenX[index], self.normalizedPenY[index], self.bufferX, self.bufferY);
	    } else {
	      self.buffer.drawLine(self.normalizedPenX[index], self.normalizedPenY[index], self.bufferX, self.bufferY);
	    }
	  }

	  if(config.DEBUG_DRAW){
	    self.buffer.context.strokeStyle = colors.RED;
	    self.buffer.drawPoints(self.normalizedPenX, self.normalizedPenY);

	    self.buffer.context.strokeStyle = colors.BLUE;
	    self.buffer.drawPoint(self.refX, self.refY);

	    if(self.hasBuffer){
	        self.buffer.context.strokeStyle = colors.GREEN;
	        self.buffer.drawPoint(self.trueX, self.trueY);
	    }
	    
	    self.buffer.context.strokeStyle = colors.DARK_GREY;
	  }
	};

	Board.prototype.redraw = function() {
	  var self = this;
	  self.master.clear();
	  for (var i = 0; i < self.normalizedPenX.length; i++) {
	    self.drawMaster(i, true);
	  }
	  self.drawBuffer();
	};

	Board.prototype.normalize = function(value) {
	  return value / this.master.scaleFactor;
	};

	Board.prototype.round = function(){
	    var self = this;
	    for(var i = 0; i < self.normalizedPenX.length; i++){
	        self.normalizedPenX[i] = Math.round(self.normalizedPenX[i] / config.NORMALIZED_WIDTH * config.ROUNDING_FACTOR_X) / config.ROUNDING_FACTOR_X * config.NORMALIZED_WIDTH;
	        self.normalizedPenY[i] = Math.round(self.normalizedPenY[i] / config.NORMALIZED_HEIGHT * config.ROUNDING_FACTOR_Y) / config.ROUNDING_FACTOR_Y * config.NORMALIZED_HEIGHT;
	    }
	    self.redraw();
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = ScalableCanvas;

	var logger = __webpack_require__(3);
	var config = __webpack_require__(4);
	var colors = __webpack_require__(5);
	var helper = __webpack_require__(6);

	function ScalableCanvas(canvas) {
	  var self = this;
	  self.canvas = canvas;
	  self.context = self.canvas.getContext("2d");
	  self.scaleFactor = 1;
	}

	ScalableCanvas.prototype.initDrawingStyle = function() {
	  var self = this;
	  self.context.strokeStyle = colors.DARK_GREY;
	  self.context.lineJoin = "round";
	  self.context.lineCap = "round";
	  self.context.lineWidth = self.scaleFactor * config.NORMALIZED_PEN_WIDTH;
	}

	ScalableCanvas.prototype.setWidth = function(width) {
	  var self = this;
	  self.canvas.width = width;
	  self.scaleFactor = width / config.NORMALIZED_WIDTH;
	  self.canvas.height = self.scaleFactor * config.NORMALIZED_HEIGHT;
	  self.initDrawingStyle();
	};

	ScalableCanvas.prototype.setHeight = function(height) {
	  var self = this;
	  self.canvas.height = height;
	  self.scaleFactor = height / config.NORMALIZED_HEIGHT;
	  self.canvas.width = self.scaleFactor * config.NORMALIZED_WIDTH;
	  self.initDrawingStyle();
	};

	ScalableCanvas.prototype.drawPoint = function(x, y) {
	  var self = this;
	  self.context.beginPath();
	  self.context.moveTo(x * self.scaleFactor - 1, y * self.scaleFactor);
	  self.context.lineTo(x * self.scaleFactor, y * self.scaleFactor);
	  self.context.stroke();
	};

	ScalableCanvas.prototype.drawPoints = function(pointsX, pointsY) {
	  var self = this;
	  self.context.beginPath();
	  for (var i = 0; i < pointsX.length; i++) {
	    self.context.moveTo(pointsX[i] * self.scaleFactor - 1, pointsY[i] * self.scaleFactor);
	    self.context.lineTo(pointsX[i] * self.scaleFactor, pointsY[i] * self.scaleFactor);
	  }
	  self.context.stroke();
	};

	ScalableCanvas.prototype.drawLine = function(x0, y0, x1, y1) {
	  var self = this;
	  self.context.beginPath();
	  self.context.moveTo(x0 * self.scaleFactor - 1, y0 * self.scaleFactor);
	  self.context.lineTo(x1 * self.scaleFactor, y1 * self.scaleFactor);
	  self.context.stroke();
	};

	ScalableCanvas.prototype.drawLines = function(pointsX, pointsY, dragging) {
	  var self = this;
	  self.context.beginPath();
	  for (var i = 0; i < pointsX.length; i++) {
	    if (!dragging[i]) {
	      self.context.moveTo(pointsX[i] * self.scaleFactor - 1, pointsY[i] * self.scaleFactor);
	      self.context.lineTo(pointsX[i] * self.scaleFactor, pointsY[i] * self.scaleFactor);
	    } else {
	      self.context.moveTo(pointsX[i - 1] * self.scaleFactor - 1, pointsY[i - 1] * self.scaleFactor);
	      self.context.lineTo(pointsX[i] * self.scaleFactor, pointsY[i] * self.scaleFactor);
	    }
	  }
	  self.context.stroke();
	}

	ScalableCanvas.prototype.drawSmoothLine = function(x0, y0, x1, y1, x2, y2) {
	  var self = this;
	  self.context.beginPath();
	  self.context.moveTo(x0 * self.scaleFactor, y0 * self.scaleFactor);
	  if (helper.angle(x0, y0, x1, y1, x2, y2) >= config.HOOK_THRESHOLD) {
	    //self.context.strokeStyle = GREY;
	    self.context.quadraticCurveTo(x1 * self.scaleFactor, y1 * self.scaleFactor, x2 * self.scaleFactor, y2 * self.scaleFactor);
	  } else {
	    //self.context.strokeStyle = RED;
	    self.context.lineTo(x1 * self.scaleFactor, y1 * self.scaleFactor);
	    self.context.lineTo(x2 * self.scaleFactor, y2 * self.scaleFactor);
	  }
	  self.context.stroke();
	}

	ScalableCanvas.prototype.drawSmoothLines = function(pointsX, pointsY, dragging, close) {
	  var self = this;
	  self.context.beginPath();
	  for (var i = 0; i < pointsX.length; i++) {
	    if (!dragging[i]) {
	      self.context.moveTo(pointsX[i] * self.scaleFactor - 1, pointsY[i] * self.scaleFactor);
	      self.context.lineTo(pointsX[i] * self.scaleFactor, pointsY[i] * self.scaleFactor);
	    } else if (i < pointsX.length - 1) {
	      if (dragging[i + 1]) {
	        var xc = (pointsX[i] * self.scaleFactor + pointsX[i + 1] * self.scaleFactor) / 2;
	        var yc = (pointsY[i] * self.scaleFactor + pointsY[i + 1] * self.scaleFactor) / 2;
	        self.context.quadraticCurveTo(pointsX[i] * self.scaleFactor, pointsY[i] * self.scaleFactor, xc, yc);
	      } else {
	        self.context.lineTo(pointsX[i] * self.scaleFactor, pointsY[i] * self.scaleFactor);
	      }
	    } else if (close) {
	      self.context.lineTo(pointsX[i] * self.scaleFactor, pointsY[i] * self.scaleFactor);
	    }
	  }
	  self.context.stroke();
	}


	ScalableCanvas.prototype.drawCanvas = function(scalableCanvas) {
	  var self = this;
	  self.context.drawImage(scalableCanvas.canvas, 0, 0);
	};

	ScalableCanvas.prototype.clear = function() {
	  var self = this;
	  self.context.clearRect(0, 0, self.context.canvas.width, self.context.canvas.height);
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

	// PARAMS

	exports.DEBUG_DRAW = false;


	exports.START_DISTANCE_THRESHOLD = 0.005;

	//sample when we divert this distance from current straight line
	//0 = sample each point
	//>0.2 = never sample
	exports.SAMPLE_DISTANCE_THRESHOLD = 0.004;

	//sample when we make an angle smaller this threshold
	//0 = never sample
	//180 = sample each point
	exports.SAMPLE_HOOK_THRESHOLD = 100 * Math.PI / 180; //first number is the angle in degrees

	//draw straight lines, instead of smooth when angle between smaple points is smaller than this threshold
	//0 = always smooth
	//180 = always straight
	//var HOOK_THRESHOLD = 130 * Math.PI / 180; //first number is the angle in degrees
	exports.HOOK_THRESHOLD = 120 * Math.PI / 180; //first number is the angle in degrees

	// ////////////////////////////

	exports.NORMALIZED_PEN_WIDTH = 0.03;

	// ////////////////////////////

	exports.NORMALIZED_WIDTH = 1;
	exports.NORMALIZED_HEIGHT = 1.5;

	exports.ROUNDING_FACTOR_X = 1000;
	exports.ROUNDING_FACTOR_Y = 1000;



/***/ },
/* 5 */
/***/ function(module, exports) {

	exports.BLACK = "#000000";
	exports.DARK_GREY = "#7a7a7a";
	exports.RED = "#c40000";
	exports.GREY = "#b2b2b2";
	exports.BLUE = "#2d96ff";
	exports.GREEN = "#a8ee3e";


/***/ },
/* 6 */
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