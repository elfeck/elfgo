// empty = 0
// black = 1
// white = 2
// mouseover = 3

$(function() {
    treeDim = [341, 150];
    boardcanvas = Raphael("board-canvas", 401, 401);
    treecanvas = Raphael("tree-canvas", treeDim[0], treeDim[1]);
    toolcanvas = Raphael("tool-canvas", 341, 30);
    boardcanvas.renderfix();
    lastMouseover = null;
    offs = 20.5;
    treeOffs = 15;
    width = 20;
    currentColor = 1;
    dimX = 19;
    dimY = 19;

    //testTree();

    board = new Array(dimX);
    gameTree = new TreeNode(new GameNode(null, true), null);
    currentTreePos = gameTree;
    currentTreePosMarker = treecanvas.circle(0, 0, 4);
    currentTreePosMarker.attr("fill", "#ff0000");
    currentTreePosMarker.attr("stroke-width", 0);
    currentTreePosMarker.hide();

    for(var x = 0; x < dimX; x++) {
	board[x] = new Array(dimY);
	for(var y = 0; y < dimY; y++) {
	    board[x][y] = new FieldPoint(x, y);
	}
    }

    drawTree();

    $("#board-canvas").on("mousemove", function(e) {
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
    $("#board-canvas").on("mouseup", function(e) {
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
	    var group = neigh[i].getGroup();
	    if(group.liberties == 0) deadGroups.push(group);
	}
	for(var i = 0; i < deadGroups.length; i++) {
	    for(var j = 0; j < deadGroups[i].stones.length; j++) {
		deadGroups[i].stones[j].toRemove = true;
	    }
	}
	//get liberties with potentially dead groups removed
	var group = board[x][y].getGroup();
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
	var moves = new Array();
	moves.push(new Move(board[x][y], 0));
	for(var i = 0; i < board.length; i++) {
	    for(var j = 0; j < board[i].length; j++) {
		if(board[i][j].toRemove) {
		    moves.push(new Move(board[i][j], 1));
		    board[i][j].removeStone();
		}
	    }
	}
	currentTreePos = currentTreePos.addChild(new GameNode(moves, false));
	drawTree();
	console.log(gameTree.writeTree());
	switchCurrentColor();
    });
    $(document).on("keyup", function(e) {
	if(e.keyCode == 66) {
	    if(currentTreePos.isRoot) return;
	    currentTreePos.data.playMove(true);
	    currentTreePos = currentTreePos.parent;
	    drawTree();
	    switchCurrentColor();
	    board[lastMouseover[0]][lastMouseover[1]].
		showMouseover(currentColor);
	}
    });
});

switchCurrentColor = function() {
    if(currentColor == 1) currentColor = 2;
    else if(currentColor == 2) currentColor = 1;
}

FieldPoint = function(x, y) {
    this.x = x;
    this.y = y;
    this.state = 0;
    this.gmarked = false;
    this.lmarked = false;
    this.toRemove = false;

    this.circle = boardcanvas.circle(x * width + offs, y * width + offs, 9);
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
    if(this.state == 3) {
	if(color == 1) this.circle.attr("fill", "#000000");
	if(color == 2) this.circle.attr("fill", "#ffffff");
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

FieldPoint.prototype.getGroup = function() {
    for(var x = 0; x < dimX; x++) {
	for(var y = 0; y < dimY; y++) {
	    board[x][y].gmarked = false;
	    board[x][y].lmarked = false;
	}
    }
    var group = new Array();
    lib = go(this, group , 0);

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

TreeNode = function(data, parent) {
    this.data = data;
    this.parent = parent;
    this.children = [];
    return this;
}

TreeNode.prototype.addChild = function(data) {
    var child = new TreeNode(data, this);
    this.children.push(child);
    return child;
}

TreeNode.prototype.writeTree = function() {
    var str = "";
    var compact = false;
    if(this.parent != null) compact = this.parent.children.length == 1;
    if(!compact) str += "(";
    //str += this.data.toString();
    str += "O";
    for(var i = 0; i < this.children.length; i++) {
	str += this.children[i].writeTree();
    }

    if(!compact) str += ")";
    return str;
}

TreeNode.prototype.drawTree = function(col, row) {
    var xoffs = treeOffs + 0.5 + col * 23;
    var yoffs = treeOffs + row * 25;
    if(!this.data.isDrawn) {
	this.data.circle.transform("");
	this.data.circle.transform("T" + xoffs + "," + yoffs);
	this.data.circle.show();
	this.data.isDrawn = true;
    }
    if(this == currentTreePos) {
	currentTreePosMarker.transform("");
	currentTreePosMarker.transform("T" + xoffs + "," + yoffs);
	currentTreePosMarker.toFront();
	if(currentTreePosMarker.node.style.display == "none") {
	    currentTreePosMarker.show();
	}
    }
    var rrow = 0;
    for(var i = 0; i < this.children.length; i++) {
	rrow += this.children[i].drawTree(col + 1, row + rrow + i);
    }
    return Math.max(0, this.children.length - 1) + rrow;
}

//0 place
//1 remove
Move = function(fp, action) {
    this.color = fp.state;
    this.position = [fp.x, fp.y];
    this.action = action;
    return this;
}

GameNode = function(moves, root) {
    this.isRoot = root;
    this.isDrawn = false;
    if(!root) {
	this.moves = moves;
	this.circle = treecanvas.circle(0, 0, 9);
	this.circle.attr("stroke", "#000000");
	if(moves[0].color == 1) this.circle.attr("fill", "#000000");
	if(moves[0].color == 2) this.circle.attr("fill", "#ffffff");
	this.circle.hide();
    } else {
	this.circle = treecanvas.circle(0, 0, 3);
	this.circle.attr("fill", "#000000");
	this.circle.hide();
    }
    return this;
}

GameNode.prototype.playMove = function(reversed) {
    for(var i = 0; i < this.moves.length; i++) {
	var move = this.moves[i];
	if(reversed != (move.action == 0)) {
	    board[move.position[0]][move.position[1]].putStone(move.color);
	} else {
	    board[move.position[0]][move.position[1]].removeStone();
	}
    }
}

GameNode.prototype.toString = function() {
    var str = "{"
    for(var i = 0; i < this.moves.length; i++) {
	var move = this.moves[i];
	if(move.action == 0) {
	    str += "P" + move.color + "[" + move.position[0] + " " +
		move.position[1] + "]";
	} else {
	    str += "R" + move.color + "[" + move.position[0] + " " +
		move.position[1] + "]";
	}
    }
    str += "}";
    return str;
}

drawTree = function() {
    gameTree.drawTree(0, 0);
}
