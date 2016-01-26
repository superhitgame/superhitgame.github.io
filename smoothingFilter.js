var helper = require("./helper.js");

exports.filter = function(pointsX, pointsY, dragging, hookThreshold, distanceThreshold){
    var filteredX = new Array();
    var filteredY = new Array();
    var filteredDragging = new Array();

    var origX, origY, refX, refY, bufferX, bufferY, x, y;
    var hasReference = false;

    for(var i = 0; i < pointsX.length; i++){
        x = pointsX[i];
        y = pointsY[i];
        if(!dragging[i] || i == pointsX.length - 1 || !dragging[i + 1]){
           filteredX.push(x); 
           filteredY.push(y); 
           filteredDragging.push(dragging[i]); 
           origX = x;
           origY = y;
        } else if(!hasReference){
            if(x != origX || y != origY){
               hasReference = true; 
               refX = x;
               refY = y;
            }
        } else if(helper.angle(origX, origY, bufferX, bufferY, x, y) < hookThreshold){
            filteredX.push(bufferX); 
            filteredY.push(bufferY); 
            filteredDragging.push(true);
            origX = x;
            origY = y;
            hasReference = false;
        } else if(helper.distanceToLine(x, y, origX, origY, refX, refY) > distanceThreshold){  
            filteredX.push(x); 
            filteredY.push(y); 
            filteredDragging.push(true);
            origX = x;
            origY = y;
            hasReference = false;
        } 
        bufferX = x;
        bufferY = y;
    }
    return {x: filteredX, y: filteredY, dragging: filteredDragging};
}
