window.onload = function(){
    var visibleCanvas = document.getElementById('drawingCanvas');
    var board = new Board(visibleCanvas);
    var inputArea = new InputArea(visibleCanvas, board);
    var v = viewport();
    //canvas.width  = v.width - 20;
    board.setHeight(v.height - 100);

    document.getElementById("widthButton").addEventListener("click", function() {
        board.setWidth(prompt("Set width:"));
    });

    document.getElementById("clearButton").addEventListener("click", function() {
    board.reset();
    });
};

var NORMALIZED_WIDTH = 1;
var NORMALIZED_HEIGHT = 1.5;
var NORMALIZED_PEN_WIDTH = 0.05;
var SAMPLE_DISTANCE_THRESHOLD = 0.02;
var HOOK_THRESHOLD = 120 * Math.PI / 180;

var BLACK = "#000000";
var DARK_GREY = "#7a7a7a";
var RED = "#c40000";
var GREY = "#b2b2b2";
var BLUE = "#2d96ff";
var GREEN = "#a8ee3e";

//INPUT AREA

function InputArea(canvas, drawingManager) {
  var self = this;
  self.canvas = canvas;
  self.drawingManager = drawingManager;
  if ("ontouchstart" in window) {
    log("init touch");
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
    log("init mouse");
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

//BOARD

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
  self.hasBuffer = false;
  self.bufferX;
  self.bufferY;
  self.redraw();
};

Board.prototype.startPen = function(x, y) {
  var self = this;
  self.addPoint(self.normalize(x), self.normalize(y), false, false);
  self.drawBuffer();
  self.isDrawing = true;
};

Board.prototype.movePen = function(x, y) {
  var self = this;
  if (self.isDrawing) {
    var normX = self.normalize(x);
    var normY = self.normalize(y);
    var refX = self.normalizedPenX[self.normalizedPenX.length - 1];
    var refY = self.normalizedPenY[self.normalizedPenY.length - 1];
    if (self.hasBuffer && distanceToLine(refX, refY, self.bufferX, self.bufferY, normX, normY) > SAMPLE_DISTANCE_THRESHOLD) {
      self.addPoint(self.bufferX, self.bufferY, true, false);
    }
    self.hasBuffer = true;
    self.bufferX = normX;
    self.bufferY = normY;
    self.drawBuffer();
  }
};

Board.prototype.stopPen = function(x, y) {
  var self = this;
  if (self.hasBuffer) {
    self.hasBuffer = false;
    self.addPoint(self.bufferX, self.bufferY, true, true);
    self.drawBuffer();
  }
  self.isDrawing = false;
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

Board.prototype.addPoint = function(x, y, dragging, close) {
  var self = this;
  self.normalizedPenX.push(x);
  self.normalizedPenY.push(y);
  self.penDragging.push(dragging);
  self.drawMaster(self.penDragging.length - 1, close);
};

Board.prototype.drawMaster = function(index, close) {
  var self = this;
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
};

Board.prototype.redraw = function() {
  var self = this;
  self.master.clear();
  for (var i = 0; i < self.normalizedPenX.length; i++) {
    self.drawMaster(i, i == self.normalizedPenX.length - 1);
  }
  self.drawBuffer();
};

Board.prototype.normalize = function(value) {
  return value / this.master.scaleFactor;
};

//SCALABLE CANVAS

function ScalableCanvas(canvas) {
  var self = this;
  self.canvas = canvas;
  self.context = self.canvas.getContext("2d");
  self.scaleFactor = 1;
}

ScalableCanvas.prototype.initDrawingStyle = function() {
  var self = this;
  self.context.strokeStyle = DARK_GREY;
  self.context.lineJoin = "round";
  self.context.lineCap = "round";
  self.context.lineWidth = self.scaleFactor * NORMALIZED_PEN_WIDTH;
}

ScalableCanvas.prototype.setWidth = function(width) {
  var self = this;
  self.canvas.width = width;
  self.scaleFactor = width / NORMALIZED_WIDTH;
  self.canvas.height = self.scaleFactor * NORMALIZED_HEIGHT;
  self.initDrawingStyle();
};

ScalableCanvas.prototype.setHeight = function(height) {
  var self = this;
  self.canvas.height = height;
  self.scaleFactor = height / NORMALIZED_HEIGHT;
  self.canvas.width = self.scaleFactor * NORMALIZED_WIDTH;
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
  if (angle(x0, y0, x1, y1, x2, y2) >= HOOK_THRESHOLD) {
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

//HELPERS

function log(text) {
  console.log(text);
}

function distanceToLine(x0, y0, x1, y1, x2, y2) {
  return Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
}

function angle(xa, ya, xb, yb, xc, yc) {
  var AB = Math.sqrt(Math.pow(xb - xa, 2) + Math.pow(yb - ya, 2));
  var BC = Math.sqrt(Math.pow(xb - xc, 2) + Math.pow(yb - yc, 2));
  var AC = Math.sqrt(Math.pow(xc - xa, 2) + Math.pow(yc - ya, 2));
  return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
}

function viewport(){
    var e = window, a = 'inner';
    if (!('innerWidth' in window)){
        a = 'client';
        e = document.documentElement || document.body;
    }
    return {width:e[a + 'Width'], height:e[a + 'Height']};
}
