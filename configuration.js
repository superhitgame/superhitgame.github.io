// PARAMS

exports.DEBUG_DRAW = true;


exports.START_DISTANCE_THRESHOLD = 0.005;

//sample when we divert this distance from current straight line
//0 = sample each point
//>0.2 = never sample
exports.SAMPLE_DISTANCE_THRESHOLD = 0.004;

//sample when we make an angle smaller this threshold
//0 = never sample
//180 = sample each point
exports.SAMPLE_HOOK_THRESHOLD = 100 * Math.PI / 180; //first number is the angle in degrees

//draw straight lines, instead of smooth when angle between smaple points is smaller than this threshold
//0 = always smooth
//180 = always straight
//var HOOK_THRESHOLD = 130 * Math.PI / 180; //first number is the angle in degrees
exports.HOOK_THRESHOLD = 180 * Math.PI / 180; //first number is the angle in degrees

// ////////////////////////////

exports.NORMALIZED_PEN_WIDTH = 0.03;

// ////////////////////////////

exports.NORMALIZED_WIDTH = 1;
exports.NORMALIZED_HEIGHT = 1.5;

exports.ROUNDING_FACTOR_X = 1000;
exports.ROUNDING_FACTOR_Y = 1000;

