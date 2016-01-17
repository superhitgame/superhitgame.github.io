//distance from point (x0, y0) to line defined by points (x1, y1) and (x2, y2)

exports.distanceToLine = function(x0, y0, x1, y1, x2, y2) {
  return Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
};

exports.distance = function(x0, y0, x1, y1) {
  return Math.sqrt((y1 - y0) * (y1 - y0) + (x1 - x0) * (x1 - x0));
}


exports.angle = function(xa, ya, xb, yb, xc, yc) {
  var AB = Math.sqrt(Math.pow(xb - xa, 2) + Math.pow(yb - ya, 2));
  var BC = Math.sqrt(Math.pow(xb - xc, 2) + Math.pow(yb - yc, 2));
  var AC = Math.sqrt(Math.pow(xc - xa, 2) + Math.pow(yc - ya, 2));
  return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
}

exports.viewport = function(){
    var e = window, a = 'inner';
    if (!('innerWidth' in window)){
        a = 'client';
        e = document.documentElement || document.body;
    }
    return {width:e[a + 'Width'], height:e[a + 'Height']};
}
