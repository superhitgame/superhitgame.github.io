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
	var InputArea = __webpack_require__(6);
	var helper = __webpack_require__(5);
	//var config = require("./configuration.js");


	var config = {
	    DRAW_ALL: true,
	    DEBUG_DRAW: false,
	    SHOW_MOUSE: true,
	    START_DISTANCE_THRESHOLD: 0.005, 
	    //sample when we divert this distance from current straight line
	    //0 = sample each point
	    //>0.2 = never sample
	    SAMPLE_DISTANCE_THRESHOLD: 0.003,
	    //sample when we make an angle smaller this threshold
	    //0 = never sample
	    //180 = sample each point
	    SAMPLE_HOOK_DEGREES: 175,
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

	    var referenceDistance = document.getElementById("referenceDistance");
	    var sampleDistance = document.getElementById("sampleDistance");
	    var sampleHook = document.getElementById("sampleHook");
	    var straightAngle = document.getElementById("straightAngle");
	    var penWidth = document.getElementById("penWidth");
	    var debugDraw = document.getElementById("debugDraw");
	    var showMouse = document.getElementById("showMouse");
	    var totalPoints = document.getElementById("totalPoints");
	    var drawAll = document.getElementById("drawAll");

	    referenceDistance.value = config.START_DISTANCE_THRESHOLD;
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
	        config.START_DISTANCE_THRESHOLD = referenceDistance.value;
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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = Board;

	var ScalableCanvas = __webpack_require__(2);
	var helper = __webpack_require__(5);
	var logger = __webpack_require__(3);
	var colors = __webpack_require__(4);

	function Board(visibleCanvas, config) {
	  var self = this;
	  self.config = config;
	  self.buffer = new ScalableCanvas(visibleCanvas, config);
	  self.master = new ScalableCanvas(document.createElement("canvas"), config);
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
	  self.mouseX = new Array();
	  self.mouseY = new Array();
	  self.normalizedMouseX = new Array();
	  self.normalizedMouseY = new Array();
	  self.mouseType = new Array();
	  document.getElementById("totalPoints").innerHTML = self.normalizedPenX.length;
	  self.redraw();
	};

	Board.prototype.startPen = function(x, y, reconstructing) {
	  var self = this;
	  self.addPoint(self.normalize(x), self.normalize(y), false);
	  if(!reconstructing){
	    self.drawBuffer();
	    self.mouseX.push(x);
	    self.mouseY.push(y);
	    self.normalizedMouseX.push(self.normalize(x));
	    self.normalizedMouseY.push(self.normalize(y));
	    self.mouseType.push('start');
	  }
	  self.isDrawing = true;
	};


	Board.prototype.movePen = function(x, y, reconstructing) {
	  var self = this;
	  if (self.isDrawing) {
	    var normX = self.normalize(x);
	    var normY = self.normalize(y);
	    var lastX = self.normalizedPenX[self.normalizedPenX.length - 1];
	    var lastY = self.normalizedPenY[self.normalizedPenY.length - 1];

	    if(self.config.DRAW_ALL){
	        self.addPoint(normX, normY, true);
	    } else {
	        if(!self.hasReference){
	            if((normX != lastX || normY != lastY)){
	    		    self.hasReference = true;
	      	        self.refX = normX;
	    		    self.refY = normY;
	            }
	        } else if(self.shouldSampleBasedOnAngle(lastX, lastY, self.bufferX, self.bufferY, normX, normY)){
	            logger.log("angle sample");
	            self.addPoint(self.bufferX, self.bufferY, true);
	            self.hasReference = false;
	        } else if(helper.distanceToLine(normX, normY, lastX, lastY, self.refX, self.refY) > self.config.SAMPLE_DISTANCE_THRESHOLD){  
	      	    self.addPoint(normX, normY, true);
	            self.hasReference = false;
	        } 
	        self.bufferX = normX;
	        self.bufferY = normY;
	        self.hasBuffer = true;
	    }

	    if(!reconstructing){
	        self.drawBuffer();
	        self.mouseX.push(x);
	        self.mouseY.push(y);
	        self.normalizedMouseX.push(self.normalize(x));
	        self.normalizedMouseY.push(self.normalize(y));
	        self.mouseType.push('move');
	    }
	  }
	};

	Board.prototype.shouldSampleBasedOnAngle = function(lastX, lastY, bufferX, bufferY, normX, normY){
	    var self = this;
	    var angle = helper.angle(lastX, lastY, bufferX, bufferY, normX, normY);
	    return angle <= self.config.SAMPLE_HOOK_THRESHOLD;

	};

	Board.prototype.stopPen = function(x, y, reconstructing) {
	    var self = this;
	    if (self.hasBuffer) {
	        self.hasReference = false;
	        self.hasBuffer = false;
	        logger.log("added point");
	        self.addPoint(self.bufferX, self.bufferY, true);
	    }
	    self.isDrawing = false;
	    self.drawMaster(self.penDragging.length - 1, true); 
	    if(!reconstructing){
	        self.drawBuffer();
	        self.mouseX.push(x);
	        self.mouseY.push(y);
	        self.normalizedMouseX.push(self.normalize(x));
	        self.normalizedMouseY.push(self.normalize(y));
	        self.mouseType.push('stop');
	    }
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
	        document.getElementById("totalPoints").innerHTML = self.normalizedPenX.length;
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

	  if(self.config.DEBUG_DRAW){
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
	  self.master.initDrawingStyle();
	  self.buffer.initDrawingStyle();
	  self.master.clear();
	  for (var i = 0; i < self.normalizedPenX.length; i++) {
	    self.drawMaster(i, true);
	  }
	  self.drawBuffer();
	};

	Board.prototype.reconstruct = function() {
	  var self = this;
	    self.normalizedPenX = new Array();
	  self.normalizedPenY = new Array();
	  self.penDragging = new Array();

	  self.master.initDrawingStyle();
	  self.buffer.initDrawingStyle();
	  self.master.clear();

	  if(self.config.SHOW_MOUSE){
	    self.master.context.strokeStyle = colors.RED;
	    self.master.drawPoints(self.normalizedMouseX, self.normalizedMouseY); 
	    self.master.context.strokeStyle = colors.DARK_GREY;
	  }

	  for (var i = 0; i < self.mouseX.length; i++) {
	      if(self.mouseType[i] === 'start'){
	        self.startPen(self.mouseX[i], self.mouseY[i], true);    
	      } else if(self.mouseType[i] === 'move'){
	        self.movePen(self.mouseX[i], self.mouseY[i], true);    
	      } else {
	        self.stopPen(self.mouseX[i], self.mouseY[i], true);    
	      }
	  }

	  
	  
	  self.drawBuffer();
	};

	Board.prototype.normalize = function(value) {
	  return value / this.master.scaleFactor;
	};

	Board.prototype.round = function(){
	    var self = this;
	    for(var i = 0; i < self.normalizedPenX.length; i++){
	        self.normalizedPenX[i] = Math.round(self.normalizedPenX[i] / self.config.NORMALIZED_WIDTH * self.config.ROUNDING_FACTOR_X) / self.config.ROUNDING_FACTOR_X * self.config.NORMALIZED_WIDTH;
	        self.normalizedPenY[i] = Math.round(self.normalizedPenY[i] / self.config.NORMALIZED_HEIGHT * self.config.ROUNDING_FACTOR_Y) / self.config.ROUNDING_FACTOR_Y * self.config.NORMALIZED_HEIGHT;
	    }
	    self.redraw();
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = ScalableCanvas;

	var logger = __webpack_require__(3);
	var colors = __webpack_require__(4);
	var helper = __webpack_require__(5);

	function ScalableCanvas(canvas, config) {
	  var self = this;
	  self.config = config;
	  self.canvas = canvas;
	  self.context = self.canvas.getContext("2d");
	  self.scaleFactor = 1;
	}

	ScalableCanvas.prototype.initDrawingStyle = function() {
	  var self = this;
	  self.context.strokeStyle = colors.DARK_GREY;
	  self.context.lineJoin = "round";
	  self.context.lineCap = "round";
	  self.context.lineWidth = self.scaleFactor * self.config.NORMALIZED_PEN_WIDTH;
	}

	ScalableCanvas.prototype.setWidth = function(width) {
	  var self = this;
	  self.canvas.width = width;
	  self.scaleFactor = width / self.config.NORMALIZED_WIDTH;
	  self.canvas.height = self.scaleFactor * self.config.NORMALIZED_HEIGHT;
	};

	ScalableCanvas.prototype.setHeight = function(height) {
	  var self = this;
	  self.canvas.height = height;
	  self.scaleFactor = height / self.config.NORMALIZED_HEIGHT;
	  self.canvas.width = self.scaleFactor * self.config.NORMALIZED_WIDTH;
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
	  if (helper.angle(x0, y0, x1, y1, x2, y2) >= self.config.HOOK_THRESHOLD) {
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