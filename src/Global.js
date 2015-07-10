OverlSt = { LAST: 1, MOVENUM: 2, ALPHA: 3, NUM: 4, CIRC: 5,
	    QUAD: 6, TRI: 7, CROSS: 8 };
StoneSt = { BLACK: 1, WHITE: 2 };
ToolSt = { PLAY: 0, BLACK: 1, WHITE: 2, ALPHA: 3, NUM: 4, CIRC: 5, QUAD: 6,
	   TRI: 7, CROSS: 8, REM: 9 };
ActSt = { PUT: 0, REM: 1, PASS: 2 };
NodeSt = { BLACK: 1, WHITE: 2, ALPHA: 3, NUM: 4, CIRC: 5, QUAD: 6, TRI: 7,
	   CROSS: 8, BLACKREM: 9, WHITEREM: 10 };

dbg = function(str) {
    console.log(str);
}
offsetMouse = function(element, e) {
    var parentOffset = $(element).offset();
    var relX = e.pageX - parentOffset.left;
    var relY = e.pageY - parentOffset.top;
    return [relX, relY];
}
getFirstFree = function(array) {
    var ind = -1;
    for(var i = 0; i < array.length; i++) {
	if(!array[i]) {
	    ind = i;
	    break;
	}
    }
    if(ind == -1) ind = array.length - 1;
    return ind;
}
takeFirstFree = function(array) {
    var ind = -1;
    for(var i = 0; i < array.length; i++) {
	if(!array[i]) {
	    array[i] = true;
	    ind = i;
	    break;
	}
    }
    if(ind == -1) ind = array.length - 1;
    return ind;
}
freeFirstFree = function(array, ind) {
    array[ind] = false;
}
takeSpecificFree = function(array, ind) {
    array[ind] = true;
}
