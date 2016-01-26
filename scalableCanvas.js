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
  self.context.moveTo(x - 1, y);
  self.context.lineTo(x, y);
  self.context.stroke();
};

ScalableCanvas.prototype.drawPoints = function(pointsX, pointsY) {
  var self = this;
  self.context.beginPath();
  for (var i = 0; i < pointsX.length; i++) {
    self.context.moveTo(pointsX[i] - 1, pointsY[i]);
    self.context.lineTo(pointsX[i], pointsY[i]);
  }
  self.context.stroke();
};

ScalableCanvas.prototype.drawLine = function(x0, y0, x1, y1) {
  var self = this;
  self.context.beginPath();
  self.context.moveTo(x0 - 1, y0);
  self.context.lineTo(x1, y1);
  self.context.stroke();
};

ScalableCanvas.prototype.drawLines = function(pointsX, pointsY, dragging) {
  var self = this;
  self.context.beginPath();
  for (var i = 0; i < pointsX.length; i++) {
    if (!dragging[i]) {
      self.context.moveTo(pointsX[i] - 1, pointsY[i]);
      self.context.lineTo(pointsX[i], pointsY[i]);
    } else {
      self.context.moveTo(pointsX[i - 1] - 1, pointsY[i - 1]);
      self.context.lineTo(pointsX[i], pointsY[i]);
    }
  }
  self.context.stroke();
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
  var self = this;
  self.context.drawImage(scalableCanvas.canvas, 0, 0);
};

ScalableCanvas.prototype.clear = function() {
  var self = this;
  self.context.clearRect(0, 0, self.context.canvas.width, self.context.canvas.height);
};

