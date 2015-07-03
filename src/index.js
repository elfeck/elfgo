// empty = 0
// black = 1
// white = 2
// mouseover = 3

$(function() {
    canvas = Raphael("raphael-canvas", 401, 401);
    canvas.renderfix();
    lastMouseover = null;
    offs = 20.5;
    width = 20;
    currentColor = 1;
    dimX = 19;
    dimY = 19;

    board = new Array(dimX);
    for(var x = 0; x < dimX; x++) {
	board[x] = new Array(dimY);
	for(var y = 0; y < dimY; y++) {
	    board[x][y] = new FieldPoint(x, y);
	}
    }
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
	var x = coord[0];
	var y = coord[1];

	if(board[x][y].state == 1 || board[x][y].state == 2) return;
	var oldState = board[x][y].state;

	//simulate move
	board[x][y].state = currentColor;
	//get potentially dead groups
	var neigh = board[x][y].getNeighbours().filter(
	    function(f) { return oppositeState(board[x][y], f); });
	var deadGroups = new Array();
	for(var i = 0; i < neigh.length; i++) {
	    var group = getGroup(neigh[i]);
	    if(group.liberties == 0) deadGroups.push(group);
	}
	for(var i = 0; i < deadGroups.length; i++) {
	    for(var j = 0; j < deadGroups[i].stones.length; j++) {
		deadGroups[i].stones[j].toRemove = true;
	    }
	}
	//get liberties with potentially dead groups removed
	var group = getGroup(board[x][y]);
	board[x][y].state = oldState;
	//if still 0 liberties invalid move
	if(group.liberties == 0) {
	    //invalid move
	    console.log("invalid move");
	    board[x][y].state = oldState;
	    //undo removal
	    for(var i = 0; i < deadGroups.length; i++) {
		for(var j = 0; j < deadGroups[i].stones.length; j++) {
		    deadGroups[i].stones[j].toRemove = false;
		}
	    }
	    return;
	}
	//move is valid
	board[x][y].state = oldState;
	board[x][y].putStone(currentColor);
	for(var i = 0; i < board.length; i++) {
	    for(var j = 0; j < board[i].length; j++) {
		if(board[i][j].toRemove) board[i][j].removeStone();
	    }
	}
	if(currentColor == 1) currentColor = 2;
	else if(currentColor == 2) currentColor = 1;
    });
});

FieldPoint = function(x, y) {
    this.x = x;
    this.y = y;
    this.state = 0;
    this.gmarked = false;
    this.lmarked = false;
    this.toRemove = false;

    this.circle = canvas.circle(x * width + offs, y * width + offs, 9);
    this.circle.attr("stroke", "#000000");
    this.circle.hide();
}

FieldPoint.prototype.putStone = function(color) {
    if(this.state == 0 || this.state == 3) {
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
	this.state = 0;
	this.toRemove = false;
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
	if(n[i][0] >= 0 && n[i][0] < dimX && n[i][1] >= 0 && n[i][1] < dimY) {
	    result.push(board[n[i][0]][n[i][1]]);
	}
    }
    return result;
}

getGroup = function(fp) {
    for(var x = 0; x < dimX; x++) {
	for(var y = 0; y < dimY; y++) {
	    board[x][y].gmarked = false;
	    board[x][y].lmarked = false;
	}
    }
    var group = new Array();
    lib = go(fp, group , 0);

    var group = {
	stones: group,
	liberties: lib
    };
    return group;
}

go = function(fp, gr, lib) {
    var nei = fp.getNeighbours().filter(function(f) {
	return !f.gmarked && !f.gmarked;
    });
    fp.gmarked = true;
    gr.push(fp);
    for(var i = 0; i < nei.length; i++) {
	if(nei[i].state == 0 || nei[i].toRemove) {
	    lib++;
	    nei[i].fmarked = true;
	} else if(nei[i].state == fp.state) {
	    lib = go(nei[i], gr, lib);
	}
    }
    return lib;
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

oppositeState = function(fp1, fp2) {
    if(fp1.state == 1 && fp2.state == 2) return true;
    if(fp1.state == 2 && fp2.state == 1) return true;
    return false;
}
