module.exports = InputArea;

function InputArea(canvas, drawingManager) {
    var self = this;
    self.canvas = canvas;
    self.drawingManager = drawingManager;
    self.mouseDown = false;
    if ("ontouchstart" in window) {
        //log("init touch"); 
        self.canvas.addEventListener("touchstart", function(e) {
            e.preventDefault();
            var outer = self.canvas.getBoundingClientRect();
            self.drawingManager.startPen(e.touches[0].pageX - outer.left, e.touches[0].pageY - outer.top);
        }, false);
        self.canvas.addEventListener("touchend", function(e) {
            e.preventDefault();
            self.drawingManager.stopPen();
        }, false);
        self.canvas.addEventListener("touchmove", function(e) {
            e.preventDefault();
            var outer = self.canvas.getBoundingClientRect();
            self.drawingManager.movePen(e.touches[0].pageX - outer.left, e.touches[0].pageY - outer.top);
        }, false);
    } else {
        //log("init mouse");
        self.canvas.addEventListener("mousedown", function(e) {
            var outer = self.canvas.getBoundingClientRect();
            self.drawingManager.startPen(e.pageX - outer.left, e.pageY - outer.top);
            self.mouseDown = true;
        });
        document.addEventListener("mousemove", function(e) {
            e.preventDefault();
            var outer = self.canvas.getBoundingClientRect();
            self.drawingManager.movePen(e.pageX - outer.left, e.pageY - outer.top);
        });
        document.documentElement.addEventListener('mouseup', function(e){
            var outer = self.canvas.getBoundingClientRect();
            self.drawingManager.stopPen(e.pageX - outer.left, e.pageY - outer.top);
        }); 
        document.documentElement.addEventListener('mouseover', function(e){
            if (e.target == this && e.relatedTarget == null) {
                if (mouseDown && !e.button) {
                    //Mouse up (entering document without pressing button));
                    mouseDown = false;
                    self.drawingManager.stopPen();
                }
            }
        });
    }
}

