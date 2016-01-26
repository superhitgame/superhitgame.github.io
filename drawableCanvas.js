module.exports = SimpleBoard;

var logger = require("./logger.js");
var colors = require("./colors.js");
var helper = require("./helper.js");

function SimpleBoard(canvas, config) {
  var self = this;
  self.config = config;
  self.canvas = canvas;
  self.context = self.canvas.getContext("2d");
  self.scaleFactor = 1;
}

SimpleBoard.prototype.initDrawingStyle = function() {
  var self = this;
  self.context.strokeStyle = colors.DARK_GREY;
  self.context.lineJoin = "round";
  self.context.lineCap = "round";
  self.context.lineWidth = self.scaleFactor * self.config.NORMALIZED_PEN_WIDTH;
}

SimpleBoard.prototype.setWidth = function(width) {
  var self = this;
  self.canvas.width = width;
  self.scaleFactor = width / self.config.NORMALIZED_WIDTH;
  self.canvas.height = self.scaleFactor * self.config.NORMALIZED_HEIGHT;
};

SimpleBoard.prototype.setHeight = function(height) {
  var self = this;
  self.canvas.height = height;
  self.scaleFactor = height / self.config.NORMALIZED_HEIGHT;
  self.canvas.width = self.scaleFactor * self.config.NORMALIZED_WIDTH;
};

SimpleBoard.prototype.drawPoint = function(x, y) {
  var self = this;
  self.context.beginPath();
  self.context.moveTo(x - 1, y);
  self.context.lineTo(x, y);
  self.context.stroke();
};

SimpleBoard.prototype.drawPoints = function(pointsX, pointsY) {
  var self = this;
  self.context.beginPath();
  for (var i = 0; i < pointsX.length; i++) {
    self.context.moveTo(pointsX[i] - 1, pointsY[i]);
    self.context.lineTo(pointsX[i], pointsY[i]);
  }
  self.context.stroke();
};

SimpleBoard.prototype.drawLine = function(x0, y0, x1, y1) {
  var self = this;
  self.context.beginPath();
  self.context.moveTo(x0 - 1, y0);
  self.context.lineTo(x1, y1);
  self.context.stroke();
};

SimpleBoard.prototype.drawLines = function(pointsX, pointsY, dragging) {
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

SimpleBoard.prototype.drawSmoothLine = function(x0, y0, x1, y1, x2, y2) {
  var self = this;
  self.context.beginPath();
  self.context.moveTo(x0, y0);
  if (helper.angle(x0, y0, x1, y1, x2, y2) >= self.config.HOOK_THRESHOLD) {
    self.context.quadraticCurveTo(x1, y1, x2, y2);
  } else {
    self.context.lineTo(x1, y1);
    self.context.lineTo(x2, y2);
  }
  self.context.stroke();
}

SimpleBoard.prototype.drawSmoothLines = function(pointsX, pointsY, dragging) {
  var self = this;
  self.context.beginPath();
  for (var i = 0; i < pointsX.length; i++) {
    if (!dragging[i]) {
      self.context.moveTo(pointsX[i] - 1, pointsY[i]);
      self.context.lineTo(pointsX[i], pointsY[i]);
    } else if (i < pointsX.length - 1) {
      if (dragging[i + 1]) {
        var xc = (pointsX[i] + pointsX[i + 1]) / 2;
        var yc = (pointsY[i] + pointsY[i + 1]) / 2;
        self.context.quadraticCurveTo(pointsX[i], pointsY[i], xc, yc);
      } else {
        self.context.lineTo(pointsX[i], pointsY[i]);
      }
    } else {
      self.context.lineTo(pointsX[i], pointsY[i]);
    }
  }
  self.context.stroke();
}


SimpleBoard.prototype.drawCanvas = function(scalableCanvas) {
  var self = this;
  self.context.drawImage(scalableCanvas.canvas, 0, 0);
};

SimpleBoard.prototype.clear = function() {
  var self = this;
  self.context.clearRect(0, 0, self.context.canvas.width, self.context.canvas.height);
};

