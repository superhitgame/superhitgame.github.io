module.exports = ScalableCanvas;

var logger = require("./logger.js");
var colors = require("./colors.js");
var helper = require("./helper.js");

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

