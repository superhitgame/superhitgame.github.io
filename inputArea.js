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

