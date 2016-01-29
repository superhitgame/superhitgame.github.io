module.exports = Board;

var ScalableCanvas = require("./scalableCanvas.js");
var helper = require("./helper.js");
var logger = require("./logger.js");
var colors = require("./colors.js");
var filter = require("./smoothingFilter.js");

function Board(drawingCanvas, tempCanvas, config) {
    this.config = config;
    this.buffer = new ScalableCanvas(tempCanvas, config);
    this.master = new ScalableCanvas(drawingCanvas, config);
    this.scaleFactor = 1;
    drawingCanvas.addEventListener('resize', helper.debounce(this.updateSize, 250));
    this.reset();
}

Board.prototype.reset = function() {
    this.penX = new Array();
    this.penY = new Array();
    this.penDragging = new Array();
    this.isDrawing = false;
    this.redraw();
};

Board.prototype.startPen = function(x, y, reconstructing) {
    logger.log(x + " - " + y);
    this.addPoint(x, y, false);
    this.isDrawing = true;
};


Board.prototype.movePen = function(x, y, reconstructing) {
    if (this.isDrawing) {
        this.addPoint(x, y, true);
    }
};

Board.prototype.stopPen = function(x, y, reconstructing) {
    this.addPoint(x, y, true, true);
    this.isDrawing = false;
};

Board.prototype.updateSize = function() {
    this.buffer.updateSize();
    this.master.updateSize();
    var newScaleFactor = this.master.canvas.width / this.config.NORMALIZED_WIDTH;
    this.distanceThreshold = this.config.SAMPLE_DISTANCE_THRESHOLD * newScaleFactor;
    this.rescale(this.scaleFactor, newScaleFactor);
    this.scaleFactor = newScaleFactor;
    this.redraw();
}

Board.prototype.addPoint = function(x, y, dragging, close) {
    if(typeof x !== 'undefined' &&
            (this.penX.length == 0 ||
             x != this.penX[this.penX.length - 1] ||
             y != this.penY[this.penY.length - 1])){
        this.penX.push(x);
        this.penY.push(y);
        this.penDragging.push(dragging);
    }
    this.draw(this.penDragging.length - 1, close);
};

Board.prototype.draw = function(index, close) {
    if(this.hasBuffer){
        //this.buffer.clear();
        this.buffer.clearBuffer(this.bufferFromX, this.bufferFromY, this.bufferToX, this.bufferToY);
        this.hasBuffer = false;
    }
    if (!this.penDragging[index]) {
        this.master.drawPoint(this.penX[index], this.penY[index]);
    } else if (this.penDragging[index - 1]) {
        var xc0 = (this.penX[index - 2] + this.penX[index - 1]) / 2;
        var yc0 = (this.penY[index - 2] + this.penY[index - 1]) / 2;
        if (close) {
            this.master.drawSmoothLine(xc0, yc0, this.penX[index - 1], this.penY[index - 1], this.penX[index], this.penY[index]);
        } else {
            var xc1 = (this.penX[index - 1] + this.penX[index]) / 2;
            var yc1 = (this.penY[index - 1] + this.penY[index]) / 2;
            this.master.drawSmoothLine(xc0, yc0, this.penX[index - 1], this.penY[index - 1], xc1, yc1);
            this.buffer.drawLine(xc1, yc1, this.penX[index], this.penY[index]);
            this.hasBuffer = true;
            this.bufferFromX = xc1;
            this.bufferFromY = yc1;
            this.bufferToX = this.penX[index];
            this.bufferToY = this.penY[index];
        }
    } else if (close) {
        this.master.drawLine(this.penX[index - 1], this.penY[index - 1], this.penX[index], this.penY[index]);
    } else {
        var xc = (this.penX[index - 1] + this.penX[index]) / 2;
        var yc = (this.penY[index - 1] + this.penY[index]) / 2;
        this.master.drawLine(this.penX[index - 1], this.penY[index - 1], xc, yc);
        this.buffer.drawLine(xc, yc, this.penX[index], this.penY[index]);
        this.hasBuffer = true;
        this.bufferFromX = xc;
        this.bufferFromY = yc;
        this.bufferToX = this.penX[index];
        this.bufferToY = this.penY[index];
    }
}

Board.prototype.redraw = function() {
    this.master.clear();
    this.buffer.clear();
    this.master.drawSmoothLines(this.penX, this.penY, this.penDragging);
};

Board.prototype.reconstruct = function() {
    var filtered = filter.filter(this.penX, this.penY, this.penDragging, this.config.SAMPLE_HOOK_THRESHOLD, this.distanceThreshold);
    this.master.clear();
    this.buffer.clear();
    this.master.drawSmoothLines(filtered.x, filtered.y, filtered.dragging);

    if(this.config.SHOW_MOUSE){
        this.master.context.strokeStyle = colors.RED;
        this.master.drawPoints(this.penX, this.penY); 
        this.master.context.strokeStyle = colors.DARK_GREY;
    }

    document.getElementById("samplePoints").innerHTML = filtered.x.length;
};

Board.prototype.rescale = function(origFactor, newFactor) {
    var factor = newFactor / origFactor;
    for(var i = 0; i < this.penX.length; i++){
        this.penX[i] = factor * this.penX[i];
        this.penY[i] = factor * this.penY[i];
    }
};

Board.prototype.round = function(){
    var normX = 1 / this.config.NORMALIZED_WIDTH / this.config.NORMALIZED_WIDTH * this.config.ROUNDING_FACTOR_X;
    var denormX = 1 / this.config.ROUNDING_FACTOR_X * this.config.NORMALIZED_WIDTH * this.config.NORMALIZED_WIDTH;

    var normY = 1 / this.config.NORMALIZED_HEIGHT/ this.config.NORMALIZED_HEIGHT * this.config.ROUNDING_FACTOR_Y;
    var denormY = 1 / this.config.ROUNDING_FACTOR_Y * this.config.NORMALIZED_HEIGHT* this.config.NORMALIZED_HEIGHT;

    for(var i = 0; i < this.penX.length; i++){
        this.penX[i] = Math.round(this.penX[i] * normX) * denormX;
        this.penY[i] = Math.round(this.penY[i] * normY) * denormY;
    }
    this.redraw();
};
