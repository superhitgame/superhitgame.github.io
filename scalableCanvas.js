module.exports = ScalableCanvas;

var logger = require("./logger.js");
var colors = require("./colors.js");
var helper = require("./helper.js");

function ScalableCanvas(canvas, config) {
    this.config = config;
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.scaleFactor = 1;
    this.clearMargin = 1;
}

ScalableCanvas.prototype.initDrawingStyle = function() {
    this.context.strokeStyle = colors.DARK_GREY;
    this.context.lineJoin = "round";
    this.context.lineCap = "round";
    this.context.lineWidth = this.scaleFactor * this.config.NORMALIZED_PEN_WIDTH;
    this.clearMargin = this.context.lineWidth;
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
        width = bufferToX - bufferFromX + 2 * this.clearMargin;
        x = bufferFromX - this.clearMargin;
    } else {
        width = bufferFromX - bufferToX + 2 * this.clearMargin;
        x = bufferToX - this.clearMargin;
    }

    if(bufferFromY < bufferToY){
        height = bufferToY - bufferFromY + 2 * this.clearMargin;
        y = bufferFromY - this.clearMargin;
    } else {
        height = bufferFromY - bufferToY + 2 * this.clearMargin;
        y = bufferToY - this.clearMargin;
    }

    //this.context.clearRect(x, y, width, height);
    var origColor = this.context.strokeStyle
    var origWidth = this.context.lineWidth;
    this.context.strokeStyle = colors.RED;
    var origWidth = 1;
    this.context.rect(x, y, width, height);
    this.context.stroke();
    this.context.strokeStyle = origColor;
    this.context.lineWidth = origWidth;
};

ScalableCanvas.prototype.clear = function() {
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
};

