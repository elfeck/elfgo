$(function() {
    treeDim = [326, 135];
    boardcanvas = Raphael("board-canvas", 401, 401);
    treecanvas = Raphael("tree-canvas", treeDim[0], treeDim[1]);
    toolcanvas = Raphael("tool-canvas", 341, 30);
    boardcanvas.renderfix();
    lastMouseover = null;
    offs = 20.5;
    treeOffs = 12;
    width = 20;
    currentMove = 0;
    dimX = 19;
    dimY = 19;
    stoneRadius = 9;
    treeRadius = 8;
    numbersVisible = false;

    board = new Array(dimX);
    gameTree = new TreeNode(null, currentMove, true, null);
    currentTreePos = gameTree;
    currentTreePosMarker = treecanvas.rect(0, 0, treeRadius * 2 + 2,
					   treeRadius * 2 + 2);
    currentTreePosMarker.attr("fill", "#ff0000");
    currentTreePosMarker.attr("fill-opacity", 0.45);
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
	    board[coord[0]][coord[1]].showMouseover();
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
	board[x][y].state = getCurrentColor();
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
	var putMove = new Move(board[x][y], 0);
	board[x][y].state = oldState;
	//check if a child of currentTreePos is this move
	if(currentTreePos.children.length > 0) {
	    for(var i = 0; i < currentTreePos.children.length; i++) {
		if(movesEqual(currentTreePos.children[i].moves[0], putMove)) {
		    //move already exists
		    currentTreePos.children[i].playMove(false);
		    currentTreePos = currentTreePos.children[i];
		    drawTree();
		    currentMove++;
		    return;
		}
	    }
	}
	//move did not exist
	board[x][y].putStone(getCurrentColor(), currentMove + 1);
	var moves = new Array();
	moves.push(putMove);
	for(var i = 0; i < board.length; i++) {
	    for(var j = 0; j < board[i].length; j++) {
		if(board[i][j].toRemove) {
		    moves.push(new Move(board[i][j], 1));
		    board[i][j].removeStone();
		}
	    }
	}
	currentTreePos = currentTreePos.addChild(moves, currentMove + 1);
	drawTree();
	console.log(gameTree.writeTree());
	currentMove++;
    });
    $(document).on("keyup", function(e) {
	if(e.keyCode == 66) {
	    if(currentTreePos.isRoot) return;
	    currentTreePos.playMove(true);
	    currentTreePos = currentTreePos.parent;
	    drawTree();
	    currentMove--
	    if(lastMouseover != null) {
		board[lastMouseover[0]][lastMouseover[1]].
		    showMouseover();
	    }
	}
	if(e.keyCode == 70) {
	    if(currentTreePos.children.length > 0) {
		currentTreePos = currentTreePos.children[0];
		currentTreePos.playMove(false);
		drawTree();
		currentMove++;
		if(lastMouseover != null) {
		    board[lastMouseover[0]][lastMouseover[1]].
			showMouseover();
		}
	    }
	}
	if(e.keyCode == 78) {
	    toggleNumbersVisible();
	}
    });
});

getCurrentColor = function() {
    return currentMove % 2 + 1;
}

resetBoard = function() {
    for(var i = 0; i < board.length; i++) {
	for(var j = 0; j < board[i].length; j++) board[i][j].clearField();
    }
}

drawTree = function() {
    gameTree.drawTree(0, 0);
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

loadFromNode = function(node) {
    resetBoard();
    currentTreePos = node;
    var path = gameTree.searchFor(node).reverse();
    for(var i = 0; i < path.length; i++) path[i].playMove(false);
    currentMove = path.length - 1;
    drawTree();
}

movesEqual = function(m1, m2) {
    return m1.color == m2.color && m1.position[0] == m2.position[0] &&
	m1.position[1] == m2.position[1] && m1.action == m2.action;
}

toggleNumbersVisible = function() {
    numbersVisible = !numbersVisible;
    for(var i = 0; i < board.length; i++) {
	for(var j = 0; j < board.length; j++) board[i][j].toggleText();
    }
}

// empty = 0
// black = 1
// white = 2
// mouseover = 3
FieldPoint = function(x, y) {
    this.x = x;
    this.y = y;
    this.state = 0;
    this.gmarked = false;
    this.lmarked = false;
    this.toRemove = false;
    this.isInit = false;
}

FieldPoint.prototype.init = function() {
    this.circle = boardcanvas.circle(this.x * width + offs,
				     this.y * width + offs, stoneRadius);
    this.numText = boardcanvas.text(this.x * width + offs,
				    this.y * width + offs, "");
    this.circle.attr("stroke", "#000000");
    this.numText.attr("font-size", 13);
    this.circle.hide();
    this.numText.hide();
    this.isInit = true;
}

FieldPoint.prototype.putStone = function(color, moveNumber) {
    if(!this.isInit) this.init();
    if(this.state == 0 || this.state == 3) {
	if(color == 1) {
	    this.circle.attr("fill", "#000000");
	    this.numText.attr("fill", "#ffffff");
	}
	if(color == 2) {
	    this.circle.attr("fill", "#ffffff");
	    this.numText.attr("fill", "#000000");
	}
	this.circle.attr("fill-opacity", 1.0);
	this.circle.attr("stroke-opacity", 1.0);
	this.circle.attr("stroke-width", 1);
	this.numText.attr("text", moveNumber);
	this.state = color;
	this.circle.show();
	if(numbersVisible) this.numText.show();
    } else {
	console.log("fieldpoint [" + this.x + " " + this.y + "] taken");
    }
}

FieldPoint.prototype.removeStone = function() {
    if(this.state == 1 || this.state == 2) {
	this.circle.hide();
	this.numText.hide();
	this.state = 0;
	this.toRemove = false;
    } else {
	console.log("fieldpoint [" + this.x + " " + this.y + "] empty");
    }
}

FieldPoint.prototype.clearField = function() {
    if(this.isInit) {
	this.circle.hide();
	this.numText.hide();
    }
    this.state = 0;
    this.toRemove = false;
}

FieldPoint.prototype.toggleText = function() {
    if(!this.isInit) return;
    if(numbersVisible && (this.state == 1 || this.state == 2)) {
	this.numText.show();
    } else {
	this.numText.hide();
    }
}

FieldPoint.prototype.showMouseover = function() {
    if(!this.isInit) this.init();
    if(this.state == 0) {
	if(getCurrentColor() == 1) this.circle.attr("fill", "#000000");
	if(getCurrentColor() == 2) this.circle.attr("fill", "#ffffff");
	this.circle.attr("fill-opacity", 0.6);
	this.circle.attr("stroke-opacity", 0.6);
	this.circle.show();
	this.state = 3;
    }
    if(this.state == 3) {
	if(getCurrentColor() == 1) this.circle.attr("fill", "#000000");
	if(getCurrentColor() == 2) this.circle.attr("fill", "#ffffff");
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

var go = function(fp, gr, lib) {
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

TreeNode = function(moves, moveNumber, root, parent) {
    this.parent = parent;
    this.children = [];
    this.moveNumber = moveNumber;
    this.isRoot = root;

    //content
    if(!this.isRoot) this.numText = treecanvas.text(0, 0, this.moveNumber);
    else this.numText = treecanvas.text(0, 0, "");
    this.numText.attr("font-size", 11);
    if(!root) {
	this.moves = moves;
	this.circle = treecanvas.circle(0, 0, treeRadius);
	this.circle.attr("stroke", "#000000");
	if(moves[0].color == 1) {
	    this.circle.attr("fill", "#000000");
	    this.numText.attr("fill", "#ffffff");
	}
	if(moves[0].color == 2) {
	    this.circle.attr("fill", "#ffffff");
	    this.numText.attr("fill", "#000000");
	}
	this.numText.hide();
	this.circle.hide();
    } else {
	this.circle = treecanvas.circle(0, 0, Math.floor(treeRadius - 2));
	this.circle.attr("fill", "#884444");
	this.circle.hide();
    }
    this.numText.toFront();
    this.circle.mC = treecanvas.circle(0, 0, treeRadius + 2);
    this.circle.mC.attr("stroke-width", 1);
    this.circle.mC.attr("stroke-opacity", 1);
    this.circle.mC.attr("stroke", "#000000");
    this.circle.mC.hide();
    this.circle.tN = this;
    this.numText.mC = this.circle.mC;
    this.numText.tN = this.circle.tN;

    this.circleSet = treecanvas.set();
    this.circleSet.push(this.circle);
    this.circleSet.push(this.numText);

    this.circleSet.mouseover(function() {
	this.mC.show();
    });
    this.circleSet.mouseout(function() {
	this.mC.hide();
    });
    this.circleSet.mouseup(function() {
	loadFromNode(this.tN);
    });
    return this;
}

TreeNode.prototype.addChild = function(moves, moveNumber) {
    var child = new TreeNode(moves, moveNumber, false, this);
    this.children.push(child);
    return child;
}

TreeNode.prototype.writeTree = function() {
    var str = "";
    var compact = false;
    if(this.parent != null) compact = this.parent.children.length == 1;
    if(!compact) str += "(";
    //str += this.toString();
    str += "O";
    for(var i = 0; i < this.children.length; i++) {
	str += this.children[i].writeTree();
    }

    if(!compact) str += ")";
    return str;
}

TreeNode.prototype.drawTree = function(col, row) {
    var xoffs = treeOffs + 0.5 + col * (2 * treeRadius + 2);
    var yoffs = treeOffs + row * (2 * treeRadius + 5);
    if(xoffs + 10 > treeDim[0]) {
	treeDim[0] += 3 * (2 * treeRadius + 2);
	treecanvas.setSize(treeDim[0], treeDim[1]);
	$("#tree-canvas").scrollLeft($(document).outerWidth());
    }
    if(yoffs + 4 > treeDim[1]) {
	treeDim[1] += 1 * (2 * treeRadius + 5);
	treecanvas.setSize(treeDim[0], treeDim[1]);
	$("#tree-canvas").scrollTop($("#tree-canvas")[0].scrollHeight);
    }
    this.circle.transform("T" + xoffs + "," + yoffs);
    this.circle.mC.transform("T" + xoffs + "," + yoffs);
    this.circle.show();
    this.numText.transform("T" + xoffs + "," + yoffs);
    this.numText.show();
    if(this == currentTreePos) {
	currentTreePosMarker.transform(
	    "T" + (xoffs - Math.sqrt(2) * treeRadius + 2.25) + "," +
		(yoffs - Math.sqrt(2) * treeRadius + 2.25));
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

TreeNode.prototype.playMove = function(reversed) {
    if(this.isRoot) return;
    for(var i = 0; i < this.moves.length; i++) {
	var move = this.moves[i];
	if(reversed != (move.action == 0)) {
	    board[move.position[0]][move.position[1]].
		putStone(move.color, this.moveNumber);
	} else {
	    board[move.position[0]][move.position[1]].removeStone();
	}
    }
}

TreeNode.prototype.toString = function() {
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

TreeNode.prototype.searchFor = function(node) {
    if(this == node) {
	var path = new Array();
	path.push(this);
	if(this.parent == null) return path;
	path.push(this.parent);
	var par = this.parent;
	while(par.parent != null) {
	    path.push(par.parent);
	    par = par.parent;
	}
	return path;
    }
    for(var i = 0; i < this.children.length; i++) {
	var p = this.children[i].searchFor(node);
	if(p != null) return p;
    }
    return null;
}

//0 place
//1 remove
Move = function(fp, action) {
    this.color = fp.state;
    this.position = [fp.x, fp.y];
    this.action = action;
    return this;
}
