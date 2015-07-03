// empty = 0
// black = 1
// white = 2
// mouseover = 3

$(function() {
    canvas = Raphael("raphael-canvas", 401, 401);
    canvas.renderfix();
    board = new Array(19);
    lastMouseover = null;
    offs = 21;
    width = 20;
    currentColor = 1;

    for(var x = 0; x < 19; x++) {
	board[x] = new Array(19);
	for(var y = 0; y < 19; y++) {
	    board[x][y] = new FieldPoint(x, y);
	}
    }
    board[0][0].getNeighbours();
    board[18][18].getNeighbours();
    $("#raphael-canvas").on("mousemove", function(e) {
	var mx = offsetMouse(this, e)[0];
	var my = offsetMouse(this, e)[1];
	if(mx < 10.5 || mx > 388.5 || my < 10 || my > 388) {
	    if(lastMouseover != null) {
		board[lastMouseover[0]][lastMouseover[1]].hideMouseover();
		lastMouseover = null;
	    }
	    return;
	}
	var coord = mouseToIndex(mx, my);
	if(lastMouseover == null ||
	   lastMouseover[0] != coord[0] || lastMouseover[1] != coord[1]) {
	    if(lastMouseover != null) {
		board[lastMouseover[0]][lastMouseover[1]].hideMouseover();
	    }
	    lastMouseover = coord;
	    board[coord[0]][coord[1]].showMouseover(currentColor);
	}
    });
    $("#raphael-canvas").on("mouseup", function(e) {
	var mx = offsetMouse(this, e)[0];
	var my = offsetMouse(this, e)[1];
	if(mx < 10.5 || mx > 388.5 || my < 10 || my > 388) return;
	var coord = mouseToIndex(mx, my);
	board[coord[0]][coord[1]].putStone(currentColor);
	if(currentColor == 1) currentColor = 2;
	else if(currentColor == 2) currentColor = 1;
    });
});

FieldPoint = function(x, y) {
    this.x = x;
    this.y = y;
    this.state = 0;

    this.circle = canvas.circle(x * width + offs, y * width + offs, 9);
    this.circle.attr("stroke", "#000000");
    this.circle.hide();
}
FieldPoint.prototype.putStone = function(color) {
    if(this.state == 0 || this.state == 3) {
	console.log(color);
	if(color == 1) this.circle.attr("fill", "#000000");
	if(color == 2) this.circle.attr("fill", "#ffffff");
	this.circle.attr("fill-opacity", 1.0);
	this.circle.attr("stroke-opacity", 1.0);
	this.state = color;
	this.circle.show();
    } else {
	console.log("fieldpoint [" + this.x + " " + this.y + "] taken");
    }
}

FieldPoint.prototype.removeStone = function() {
    if(this.state == 1 || this.state == 2) {
	this.circle.hide();
    } else {
	console.log("fieldpoint [" + this.x + " " + this.y + "] empty");
    }
}

FieldPoint.prototype.showMouseover = function(color) {
    if(this.state == 0) {
	if(color == 1) this.circle.attr("fill", "#000000");
	if(color == 2) this.circle.attr("fill", "#ffffff");
	this.circle.attr("fill-opacity", 0.6);
	this.circle.attr("stroke-opacity", 0.6);
	this.circle.show();
	this.state = 3;
    }
}

FieldPoint.prototype.hideMouseover = function() {
    if(this.state == 3) {
	this.state = 0;
	this.circle.hide();
    }
}

FieldPoint.prototype.getNeighbours = function() {
    var n = [[this.x - 1, this.y], [this.x + 1, this.y],
	     [this.x, this.y - 1], [this.x, this.y + 1]];
    var result = new Array();
    for(var i = 0; i < 4; i++) {
	if(n[i][0] >= 0 && n[i][0] < 19 && n[i][1] >= 0 && n[i][1] < 19) {
	    result.push(board[n[i][0]][n[i][1]]);
	}
    }
    return result;
}

offsetMouse = function(element, e) {
    var parentOffset = $(element).offset();
    var relX = e.pageX - parentOffset.left;
    var relY = e.pageY - parentOffset.top;
    return [relX, relY];
}

mouseToIndex = function(mx, my) {
    var x = Math.round((mx - 0.5) / width) - 1;
    var y = Math.round((my) / width) - 1;
    return [x, y];
}
