module.exports = Board;

var helper = require("./helper.js");
var logger = require("./logger.js");
var colors = require("./colors.js");

function Board(canvas, config) {
    this.config = config;
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.scaleFactor = 1;
    this.reset();
}

Board.prototype.reset = function() {
    this.mouseX = new Array();
    this.mouseY = new Array();
    this.mouseDragging = new Array();
    this.sampleX = new Array();
    this.sampleY = new Array();
    this.sampleDragging = new Array();
    this.isDrawing = false;
    this.lastX = null;
    this.lastY = null;
    document.getElementById("mousePoints").innerHTML = this.mouseX.length;
    document.getElementById("samplePoints").innerHTML = this.sampleX.length;
    this.initDrawingStyle();
    this.redraw();
};

Board.prototype.initDrawingStyle = function() {
  this.context.strokeStyle = colors.DARK_GREY;
  this.context.lineJoin = "round";
  this.context.lineCap = "round";
  this.context.lineWidth = this.scaleFactor * this.config.NORMALIZED_PEN_WIDTH;
}

Board.prototype.startPen = function(x, y) {
    this.addMousePoint(x, y, false);
    this.isDrawing = true;
};


Board.prototype.movePen = function(x, y) {
    if (this.isDrawing) {
        this.addMousePoint(x, y, true);
    }
};

Board.prototype.stopPen = function(x, y) {
    this.addMousePoint(x, y, true);
    this.isDrawing = false;
};

Board.prototype.addMousePoint = function(x, y, dragging){
    if(typeof x !== 'undefined' && (this.lastX != x || this.lastY != y)){
        this.mouseX.push(x);
        this.mouseY.push(y);
        this.mouseDragging.push(dragging);
        if(dragging){
            this.drawLine(this.lastX, this.lastY, x, y);
        } else {
            this.drawPoint(x, y);
        }
        this.lastX = x;
        this.lastY = y;
        document.getElementById("mousePoints").innerHTML = this.mouseX.length;
    }
}

Board.prototype.setWidth = function(width) {
    var originalScaleFactor = this.scaleFactor;
    this.canvas.width = width;
    this.scaleFactor = width / this.config.NORMALIZED_WIDTH;
    this.canvas.height = this.scaleFactor * this.config.NORMALIZED_HEIGHT;
    this.initDrawingStyle();
    this.rescale(originalScaleFactor, this.scaleFactor);
    this.redraw();
};

Board.prototype.setHeight = function(height) {
    var originalScaleFactor = this.scaleFactor;
    this.canvas.height = height;
    this.scaleFactor = height / this.config.NORMALIZED_HEIGHT;
    this.canvas.width = this.scaleFactor * this.config.NORMALIZED_WIDTH;
    this.initDrawingStyle();
    this.rescale(originalScaleFactor, this.scaleFactor);
    this.redraw();
}

Board.prototype.rescale = function(origFactor, newFactor) {
    var factor = newFactor / origFactor;
    for(var i = 0; i < this.mouseX.length; i++){
        this.mouseX[i] = factor * this.mouseX[i];
        this.mouseY[i] = factor * this.mouseX[i];
    }
};

Board.prototype.redraw = function(){
    this.clear();
    this.drawLines(this.mouseX, this.mouseY, this.mouseDragging);
};

Board.prototype.drawPoint = function(x, y) {
    this.context.beginPath();
    this.context.moveTo(x - 1, y);
    this.context.lineTo(x, y);
    this.context.stroke();
};

Board.prototype.drawLine = function(x0, y0, x1, y1) {
    this.context.beginPath();
    this.context.moveTo(x0 - 1, y0);
    this.context.lineTo(x1, y1);
    this.context.stroke();
};

Board.prototype.drawLines = function(pointsX, pointsY, dragging) {
    this.context.beginPath();
    for (var i = 0; i < pointsX.length; i++) {
        if (dragging[i]) {
            this.context.moveTo(pointsX[i - 1] - 1, pointsY[i - 1]);
            this.context.lineTo(pointsX[i], pointsY[i]);
        } else {
            this.context.moveTo(pointsX[i] - 1, pointsY[i]);
            this.context.lineTo(pointsX[i], pointsY[i]);
        }
    }
    this.context.stroke();
}

Board.prototype.clear = function() {
  this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
};

/*
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
*/
