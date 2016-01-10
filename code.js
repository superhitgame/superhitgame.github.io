var canvas;
var context;

var colorRed = "#c40000";
var colorGrey = "#b2b2b2";
var colorBlue = "#2d96ff";
var colorGreen = "#a8ee3e";

window.onload = function(){

    //log(distanceToLine(100, 100, 0, 100, 0, 200));

    canvas = document.getElementById('drawingCanvas');
    context = canvas.getContext("2d");

    context.strokeStyle = "#df4b26";
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = 5;
   
    /*
    canvas.addEventListener("touchstart", handleTouchStart, false);
    canvas.addEventListener("touchend", handleTouchEnd, false);
    canvas.addEventListener("touchcancel", handleTouchCancel, false);
    canvas.addEventListener("touchmove", handleTouchMove, false);
    */

    if("ontouchstart" in window){
        log("init touch");
        canvas.addEventListener("touchstart", handleTouchStart, false);
        canvas.addEventListener("touchend", handleTouchEnd, false);
        canvas.addEventListener("touchcancel", handleTouchCancel, false);
        canvas.addEventListener("touchmove", handleTouchMove, false);
    } else {
        log("init mouse");
        canvas.addEventListener("mousedown", handleStart, false);
        canvas.addEventListener("mouseup", handleEnd, false);
        canvas.addEventListener("mousemove", handleMove, false);
    }

    log("initialized");
    var v = viewport();
    log(v.width + " - " + v.height);
};

//TOUCH

function handleTouchStart(e) {
    e.preventDefault();
    log("touch start");
    var touch = e.touches[0];
    startPen(touch.pageX - canvas.offsetLeft, touch.pageY - canvas.offsetTop);
}

function handleTouchEnd(e) {
    e.preventDefault();
    log("touch end");
    var touch = e.touches[0];
    stopPen(touch.pageX - canvas.offsetLeft, touch.pageY - canvas.offsetTop);
}

function handleTouchMove(e) {
    e.preventDefault();
    log("touch move");
    var touch = e.touches[0];
    movePen(touch.pageX - canvas.offsetLeft, touch.pageY - canvas.offsetTop);
}

function handleTouchCancel(e){
    e.preventDefault();
    log("touch cancel");
}


//MOUSE

function handleStart(e) {
    e.preventDefault();
    //log("touchstart.");
    startPen(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
}

function handleEnd(e) {
    e.preventDefault();
    //log("touchend.");
    stopPen(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
}

function handleMove(e) {
    e.preventDefault();
    //log("touchmove.");
    movePen(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
}

//DRAWING

var drawing = false;
var penX = new Array();
var penY = new Array();
var penDragging = new Array();

var lastX;
var lastY;
var currentX;
var currentY;
var dragging = false;

function startPen(x, y){
    drawing = true;

    penX.push(x);
    penY.push(y);
    penDragging.push(false);
    lastX = x;
    lastY = y;
    currentX = x;
    currentY = y;
    //preDraw();
    //debugDraw(x, y, 'start');
}

function stopPen(x, y){
    //log(canvas.toDataURL());
    //document.write('<img src="' + canvas.toDataURL('image/jpeg') + '"/>');
    log("Points registered: " + penX.length);
    if(dragging){
        penX.push(x);
        penY.push(y);
        penDragging.push(true);
        //debugDraw(x, y, 'stop');
    }

    drawing = false;
    dragging = false;
    counter = 0;
    //redraw();
    
    //var myJsonString = JSON.stringify(penX);
    //log(myJsonString);
}

var counter = 0;

//TEMP
var lastRefX;
var lastRefY;
var lastX;
var lastY;

var distanceThreshold = 1.5;

function movePen(x, y){
    if(drawing){
        dragging = true;
        if(counter == 0){
            lastRefX = penX[penX.length - 1];
            lastRefY = penY[penY.length - 1];
        } else if(counter > 1){
            if(distanceToLine(lastX, lastY, lastRefX, lastRefY, x, y) > distanceThreshold){
                penX.push(lastX);
                penY.push(lastY);
                lastRefX = lastX;
                lastRefY = lastY;
                penDragging.push(true);   
                //redraw();
                //debugDraw(lastX, lastY, 'move');
            } else {
                //debugDraw(lastX, lastY, 'move', true);
            }
        }

        lastX = x;    
        lastY = y;
        
        counter++;

        lastX = currentX;
        lastY = currentY;
        currentX = x;
        currentY = y;
        //redraw();
        preDraw();
    }
}

//END TEMP

/*
function movePen(x, y){
    if(drawing){
        dragging = true;
        if(counter >= 10){
            penX.push(x);
            penY.push(y);
            penDragging.push(true);
            counter = 0;
            //redraw();
            debugDraw(x, y, 'move');
        } else {
            debugDraw(x, y, 'move', true);
        }
        counter++;

        lastX = currentX;
        lastY = currentY;
        currentX = x;
        currentY = y;
        //preDraw();
    }
}
*/

function debugDraw(x, y, type, dropped){
    if(dropped){
        context.strokeStyle = colorGrey;
    } else if(type == 'start'){
        context.strokeStyle = colorGreen;
    } else if(type == 'move'){
        context.strokeStyle = colorBlue;
    } else if(type == 'stop'){
        context.strokeStyle = colorRed;
    }
    context.beginPath();
    context.moveTo(x - 1, y);
    context.lineTo(x, y);
    context.stroke();
}

function preDraw(){
    context.beginPath();
    if(currentX != lastX || currentY != lastY){
        context.moveTo(lastX, lastY);
    } else {
        context.moveTo(currentX - 1, currentY);
    }
    context.lineTo(currentX, currentY);
    context.stroke();
}


function redraw(){
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
    context.beginPath();
    for(var i = 0; i < penX.length; i++){
        //context.moveTo(penX[i]-1, penY[i]);
        //context.lineTo(penX[i], penY[i]);
        if(!penDragging[i]){
            context.moveTo(penX[i]-1, penY[i]);
            if(i == penX.length - 1 || !penDragging[i + 1]){
                context.lineTo(penX[i], penY[i]);
            }
        } else if(i < penX.length - 1 && penDragging[i + 1]){
            var xc = (penX[i] + penX[i + 1]) / 2;
            var yc = (penY[i] + penY[i + 1]) / 2;
            context.quadraticCurveTo(penX[i], penY[i], xc, yc);
            //context.lineTo(penX[i], penY[i]);
        } else {
            context.lineTo(penX[i], penY[i]);
        }
    }
    if(dragging){
        context.lineTo(lastX, lastY);
    }

    context.stroke();
}


//NORMAL
/*
function redraw(){
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  
    for(var i = 0; i < penX.length; i++){
        context.beginPath();
        if(i > 0 && penDragging[i]){
            context.moveTo(penX[i-1], penY[i-1]);
        } else {
            //create small offset to draw point
            context.moveTo(penX[i]-1, penY[i]);
        }
        context.lineTo(penX[i], penY[i]);
        context.closePath();
        context.stroke();
    }
}
*/


/*
var drawing = false;
var penEvents = new Array();

function startPen(x, y){
    drawing = true;
    penEvents.push({x: x, y: y, dragging: false});
    redraw();
}

function stopPen(x, y){
    drawing = false;
}

function movePen(x, y){
    if(drawing){
        penEvents.push({x: x, y: y, dragging: true});
        redraw();
    }
}

function redraw(){
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  
    context.strokeStyle = "#df4b26";
    context.lineJoin = "round";
    context.lineWidth = 5;

    var previousPenEvent;
    penEvents.forEach(function(penEvent){
        context.beginPath();
        log(penEvent);
        if(previousPenEvent && penEvent.dragging){
            log("previous");
            context.moveTo(previousPenEvent.x, previousPenEvent.y);
        } else {
            //create small offset to draw point
            context.moveTo(penEvent.x - 1, penEvent.y);
        }
        context.lineTo(penEvent.x, penEvent.y);
        context.closePath();
        context.stroke();
        previousPenEvent = penEvent;
    });
}
*/


//TOUCH
/*
function handleTouchStart(e) {
    e.preventDefault();
    log("touchstart.");
    var touch = e.changedTouches[0];
}

function handleTouchEnd(e) {
    e.preventDefault();
    log("touchend.");
    var touch = e.changedTouches[0];
}

function handleTouchCancel(e) {
    e.preventDefault();
    log("touchcancel.");
    var touch = e.changedTouches[0];
}

function handleTouchMove(e) {
    e.preventDefault();
    log("touchmove.");
    var touch = e.changedTouches[0];
}
*/

function distanceToLine(x0, y0, x1, y1, x2, y2){
    return Math.abs((y2 - y1)*x0 - (x2 - x1)*y0 + x2*y1 - y2*x1) / Math.sqrt((y2 - y1)*(y2 - y1) + (x2 - x1)*(x2 - x1));
}


function log(text){
    console.log(text);
    document.getElementById("log").innerHTML = text + "<br>" + document.getElementById("log").innerHTML;
};

function viewport(){
    var e = window, a = 'inner';
    if (!('innerWidth' in window)){
        a = 'client';
        e = document.documentElement || document.body;
    }
    return {width:e[a + 'Width'], height:e[a + 'Height']};
}

