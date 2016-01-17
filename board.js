module.exports = Board;

var ScalableCanvas = require("./scalableCanvas.js");
var helper = require("./helper.js");
var logger = require("./logger.js");
var colors = require("./colors.js");

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
        if((normX != lastX && normY != lastY) || helper.distance(normX, normY, lastX, lastY) > self.config.START_DISTANCE_THRESHOLD){
            //logger.log((lastX - normX) + " - " + (lastY - normY));
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
    self.drawBuffer();
  }
};

Board.prototype.shouldSampleBasedOnAngle = function(lastX, lastY, bufferX, bufferY, normX, normY){
    var self = this;
    var angle = helper.angle(lastX, lastY, bufferX, bufferY, normX, normY);
    //return angle <= self.config.SAMPLE_HOOK_THRESHOLD;
    return angle <= self.config.SAMPLE_HOOK_THRESHOLD && angle > self.config.SAMPLE_HOOK_DEAD_ZONE_START_THRESHOLD;

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
