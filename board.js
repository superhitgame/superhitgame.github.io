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
  self.penX = new Array();
  self.penY = new Array();
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
  self.mouseType = new Array();
  document.getElementById("totalPoints").innerHTML = self.penX.length;
  self.redraw();
};

Board.prototype.startPen = function(x, y, reconstructing) {
  var self = this;
  self.addPoint(x, y, false);
  if(!reconstructing){
    self.drawBuffer();
    self.mouseX.push(x);
    self.mouseY.push(y);
    self.mouseType.push('start');
  }
  self.isDrawing = true;
};


Board.prototype.movePen = function(x, y, reconstructing) {
  var self = this;
  if (self.isDrawing) {
    var lastX = self.penX[self.penX.length - 1];
    var lastY = self.penY[self.penY.length - 1];

    if(self.config.DRAW_ALL){
        self.addPoint(x, y, true);
    } else {
        if(!self.hasReference){
            if((x != lastX || y != lastY)){
    		    self.hasReference = true;
      	        self.refX = x;
    		    self.refY = y;
            }
        } else if(self.shouldSampleBasedOnAngle(lastX, lastY, self.bufferX, self.bufferY, x, y)){
            logger.log("angle sample");
            self.addPoint(self.bufferX, self.bufferY, true);
            self.hasReference = false;
        } else if(helper.distanceToLine(x, y, lastX, lastY, self.refX, self.refY) > self.config.SAMPLE_DISTANCE_THRESHOLD){  
      	    self.addPoint(x, y, true);
            self.hasReference = false;
        } 
        self.bufferX = x;
        self.bufferY = y;
        self.hasBuffer = true;
    }

    if(!reconstructing){
        self.drawBuffer();
        self.mouseX.push(x);
        self.mouseY.push(y);
        self.mouseType.push('move');
    }
  }
};

Board.prototype.shouldSampleBasedOnAngle = function(lastX, lastY, bufferX, bufferY, x, y){
    var self = this;
    var angle = helper.angle(lastX, lastY, bufferX, bufferY, x, y);
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
        self.mouseType.push('stop');
    }
};

Board.prototype.setWidth = function(width) {
  var self = this;
  var originalScaleFactor = self.master.scaleFactor;
  self.buffer.setWidth(width);
  self.master.setWidth(width);
  var newScaleFactor = self.master.scaleFactor;
  self.rescale(originalScaleFactor, newScaleFactor);
  self.redraw();
};

Board.prototype.setHeight = function(height) {
  var self = this;
  var originalScaleFactor = self.master.scaleFactor;
  self.buffer.setHeight(height);
  self.master.setHeight(height);
    var newScaleFactor = self.master.scaleFactor;
  self.rescale(originalScaleFactor, newScaleFactor);
  self.redraw();
};

Board.prototype.addPoint = function(x, y, dragging) {
    var self = this;
    if(x != self.penX[self.penX.length - 1] || y != self.penY[self.penY.length - 1]){
        self.penX.push(x);
        self.penY.push(y);
        self.penDragging.push(dragging);
        self.drawMaster(self.penDragging.length - 1);
        document.getElementById("totalPoints").innerHTML = self.penX.length;
    }
};

Board.prototype.drawMaster = function(index, doClose) {
  var self = this;
  var close = doClose === true && (index === self.penDragging.length - 1 || !self.penDragging[index + 1]);
  if (!self.penDragging[index]) {
    self.master.drawPoint(self.penX[index], self.penY[index]);
  } else if (self.penDragging[index - 1]) {
    var xc0 = (self.penX[index - 2] + self.penX[index - 1]) / 2;
    var yc0 = (self.penY[index - 2] + self.penY[index - 1]) / 2;
    if (close) {
      self.master.drawSmoothLine(xc0, yc0, self.penX[index - 1], self.penY[index - 1], self.penX[index], self.penY[index]);
    } else {
      var xc1 = (self.penX[index - 1] + self.penX[index]) / 2;
      var yc1 = (self.penY[index - 1] + self.penY[index]) / 2;
      self.master.drawSmoothLine(xc0, yc0, self.penX[index - 1], self.penY[index - 1], xc1, yc1);
    }
  } else if (close) {
    self.master.drawLine(self.penX[index - 1], self.penY[index - 1], self.penX[index], self.penY[index]);
  } else {
    var xc = (self.penX[index - 1] + self.penX[index]) / 2;
    var yc = (self.penY[index - 1] + self.penY[index]) / 2;
    self.master.drawLine(self.penX[index - 1], self.penY[index - 1], xc, yc);
  }
}

Board.prototype.drawBuffer = function() {
  var self = this;
  var index = self.penX.length - 1;
  
  self.buffer.clear();
  self.buffer.drawCanvas(self.master);
  if (self.hasBuffer) {
    if (self.penDragging[index]) {
      var xc = (self.penX[index - 1] + self.penX[index]) / 2;
      var yc = (self.penY[index - 1] + self.penY[index]) / 2;
      self.buffer.drawSmoothLine(xc, yc, self.penX[index], self.penY[index], self.bufferX, self.bufferY);
    } else {
      self.buffer.drawLine(self.penX[index], self.penY[index], self.bufferX, self.bufferY);
    }
  }

  if(self.config.DEBUG_DRAW){
    self.buffer.context.strokeStyle = colors.RED;
    self.buffer.drawPoints(self.penX, self.penY);

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
  for (var i = 0; i < self.penX.length; i++) {
    self.drawMaster(i, true);
  }
  self.drawBuffer();
};

Board.prototype.reconstruct = function() {
  var self = this;
    self.penX = new Array();
  self.penY = new Array();
  self.penDragging = new Array();

  self.master.initDrawingStyle();
  self.buffer.initDrawingStyle();
  self.master.clear();

  if(self.config.SHOW_MOUSE){
    self.master.context.strokeStyle = colors.RED;
    self.master.drawPoints(self.mouseX, self.mouseY); 
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

Board.prototype.denormalize = function(value) {
  return value * this.master.scaleFactor;
};

Board.prototype.rescale = function(origFactor, newFactor) {
    var self = this;
    var factor = newFactor / origFactor;
    for(var i = 0; i < self.penX.length; i++){
        self.penX[i] = factor * self.penX[i];
        self.penY[i] = factor * self.penY[i];
        self.mouseX[i] = factor * self.mouseX[i];
        self.mouseY[i] = factor * self.mouseY[i];
    }
};


Board.prototype.round = function(){
    var self = this;

    var normX = 1 / self.config.NORMALIZED_WIDTH / self.config.NORMALIZED_WIDTH * self.config.ROUNDING_FACTOR_X;
    var denormX = 1 / self.config.ROUNDING_FACTOR_X * self.config.NORMALIZED_WIDTH * self.config.NORMALIZED_WIDTH;

    var normY = 1 / self.config.NORMALIZED_HEIGHT/ self.config.NORMALIZED_HEIGHT * self.config.ROUNDING_FACTOR_Y;
    var denormY = 1 / self.config.ROUNDING_FACTOR_Y * self.config.NORMALIZED_HEIGHT* self.config.NORMALIZED_HEIGHT;

    for(var i = 0; i < self.penX.length; i++){
        self.penX[i] = Math.round(self.penX[i] * normX) * denormX;
        self.penY[i] = Math.round(self.penY[i] * normY) * denormY;
    }
    self.redraw();
};
