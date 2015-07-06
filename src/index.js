Tools = {
    PLAY: 0,
    BLACK: 1,
    WHITE: 2,
    ALPHA: 3,
    NUM: 4,
    CIRC: 5,
    QUAD: 6,
    TRI: 7,
    REM: 8
};
FpState = {
    EMPTY: 0,
    BLACK: 1,
    WHITE: 2,
    ALPHA: 3,
    NUM: 4,
    CIRC: 5,
    QUAD: 6,
    TRI: 7,
    MOVENUM: 8
};
NodeType = {
    BLACK: 1,
    WHITE: 2,
    ALPHA: 3,
    NUM: 4,
    CIRC: 5,
    QUAD: 6,
    TRI: 7,
    BLACKREM: 8,
    WHITEREM: 9
}
ActionType = {
    PUT: 0,
    REM: 1,
    PASS: 2
}

$(function() {
    treeDim = [326, 135];
    boardcanvas = Raphael("board-canvas", 401, 401);
    treecanvas = Raphael("tree-canvas", treeDim[0], treeDim[1]);
    boardcanvas.renderfix();
    treecanvas.renderfix();
    lastMO = null;
    offs = 20.5;
    treeOffs = 12;
    width = 20;
    currentMove = 0;
    dimX = 19;
    dimY = 19;
    stoneRadius = 9;
    treeRadius = 8;
    numbersVisible = false;
    currentTool = Tools.PLAY;
    treePaths = new Array();

    board = new Array(dimX);
    gameTree = new TreeNode([], currentMove, true, null);
    currentTreePos = gameTree;
    currentTreePosMarker = treecanvas.rect(0, 0, treeRadius * 2 + 2,
					   treeRadius * 2 + 2);
    currentTreePosMarker.attr("fill", "#ff0000");
    currentTreePosMarker.attr("fill-opacity", 0.4);
    currentTreePosMarker.attr("stroke-width", 0);
    currentTreePosMarker.hide();

    for(var x = 0; x < dimX; x++) {
	board[x] = new Array(dimY);
	for(var y = 0; y < dimY; y++) board[x][y] = new FieldPoint(x, y);
    }

    addTools();
    drawTree();

    $("#board-canvas").on("mousemove", function(e) {
	var mx = offsetMouse(this, e)[0];
	var my = offsetMouse(this, e)[1];
	// move out of canvas
	if(mx < 10.5 || mx > 388.5 || my < 10 || my > 388) {
	    if(lastMO != null) {
		board[lastMO[0]][lastMO[1]].hideMouseover(FpState.EMPTY);
		lastMO = null;
	    }
	    return;
	}
	var coord = mouseToIndex(mx, my);
	if(lastMO == null ||
	   lastMO[0] != coord[0] || lastMO[1] != coord[1]) {
	    if(lastMO != null) {
		board[lastMO[0]][lastMO[1]].hideMouseover(FpState.EMPTY);
	    }
	    lastMO = coord;
	    board[coord[0]][coord[1]].showMouseover(mouseoverToolToState());
	}
    });
    $("#board-canvas").on("mouseup", function(e) {
	var mx = offsetMouse(this, e)[0];
	var my = offsetMouse(this, e)[1];
	if(mx < 10.5 || mx > 388.5 || my < 10 || my > 388) return;
	var coord = mouseToIndex(mx, my);
	var x = coord[0];
	var y = coord[1];

	switch(currentTool) {
	case Tools.PLAY:
	    play(x, y);
	    break;
	case Tools.BLACK:
	    putStone(x, y, NodeType.BLACK);
	    break;
	case Tools.WHITE:
	    putStone(x, y, NodeType.WHITE);
	    break;
	}
    });
    $(document).on("keyup", function(e) {
	if(e.keyCode == 66) goBackward();
	if(e.keyCode == 70) goForward();
	if(e.keyCode == 80) pass();
	if(e.keyCode == 78) toggleNumbersVisible();
	if(e.keyCode == 83) console.log(writeSgf());
    });
});

play = function(x, y) {
    if(!board[x][y].isFree()) return;

    var oldState = board[x][y].state;

    //simulate move
    board[x][y].state = getCurrentColor();
    //get potentially dead groups
    var neigh = board[x][y].getNeighbours().filter(
	function(f) { return haveOppositeState(board[x][y], f); });
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
    var act = new NodeAction(ActionType.PUT, getCurrentColor(), [x, y]);
    board[x][y].state = oldState;
    //check if a child of currentTreePos is this move
    if(currentTreePos.children.length > 0) {
	for(var i = 0; i < currentTreePos.children.length; i++) {
	    if(actionsEq(currentTreePos.children[i].actions[0], act)) {
		//move already exists
		currentTreePos.children[i].applyNode(false);
		currentTreePos = currentTreePos.children[i];
		drawTree();
		currentMove++;
		return;
	    }
	}
    }
    //move did not exist
    board[x][y].setState(getCurrentColor());
    board[x][y].mouseover = false;
    var actions = new Array();
    actions.push(act);
    for(var i = 0; i < board.length; i++) {
	for(var j = 0; j < board[i].length; j++) {
	    if(board[i][j].toRemove) {
		actions.push(new NodeAction(ActionType.REM,
					    getOppositeCurrentColor(),
					    [i, j]));
		board[i][j].setState(FpState.EMPTY);
		board[i][j].toRemove = false;
	    }
	}
    }
    currentTreePos = currentTreePos.addChild(actions, currentMove + 1);
    drawTree();
    currentMove++;
}

pass = function() {
    var acts = [new NodeAction(ActionType.PASS, getCurrentColor(), [])];
    currentTreePos = currentTreePos.addChild(acts, currentMove + 1);
    drawTree();
    currentMove++;
}

putStone = function(x, y, color) {
    if(!board[x][y].isFree()) {
	if(board[x][y].stoneRemovable != FpState.EMPTY) {
	    var act = new NodeAction(ActionType.REM,
				     board[x][y].stoneRemovable + 7, [x,y]);
	    currentTreePos.actions.push(act);
	    if(board[x][y].stoneRemovable != color) {
		var nact = new NodeAction(ActionType.PUT, color + 7, [x,y]);
		currentTreePos.actions.push(nact);
		board[x][y].setState(color);
		board[x][y].mouseover = false;
		board[x][y].stoneRemovable = color;
	    } else {
		board[x][y].setState(FpState.EMPTY);
		board[x][y].stoneRemovable = FpState.EMPTY;
		if(lastMO != null) {
		    board[lastMO[0]][lastMO[1]].
			showMouseover(mouseoverToolToState());
		}
	    }
	} else {
	    return;
	}
    } else {
	var act = new NodeAction(ActionType.PUT, color + 7, [x,y]);
	currentTreePos.actions.push(act);
	board[x][y].setState(color);
	board[x][y].mouseover = false;
	board[x][y].stoneRemovable = color;
    }
    currentTreePos.simplifyActions();
}

goForward = function() {
    if(currentTreePos.children.length > 0) {
	currentTreePos = currentTreePos.children[0];
	currentTreePos.applyNode(false);
	drawTree();
	currentMove++;
	if(lastMO != null) {
	    board[lastMO[0]][lastMO[1]].
		showMouseover(mouseoverToolToState());
	}
    }
}

goBackward = function() {
    if(currentTreePos.isRoot) return;
    currentTreePos.applyNode(true);
    currentTreePos = currentTreePos.parent;
    drawTree();
    currentMove--
    if(lastMO != null) {
	board[lastMO[0]][lastMO[1]].showMouseover(mouseoverToolToState());
    }
}

mouseoverToolToState = function() {
    switch(currentTool) {
    case Tools.PLAY: return getCurrentColor();
    case Tools.REM: return FpState.EMPTY();
    }
    // only works because Tools matches FpState
    return currentTool;
}

getCurrentColor = function() { return currentMove % 2 + 1; }
getOppositeCurrentColor = function() { return (currentMove + 1) % 2 + 1; }

resetBoard = function() {
    for(var i = 0; i < board.length; i++) {
	for(var j = 0; j < board[i].length; j++) board[i][j].clearField();
    }
}

drawTree = function() {
    for(var i = 0; i < treePaths.length; i++) treePaths[i].remove();
    treePaths = [];
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

haveOppositeState = function(fp1, fp2) {
    if(fp1.state == FpState.BLACK && fp2.state == FpState.WHITE) return true;
    if(fp1.state == FpState.WHITE && fp2.state == FpState.BLACK) return true;
    return false;
}

loadFromNode = function(node) {
    resetBoard();
    currentTreePos = node;
    var path = gameTree.searchFor(node).reverse();
    for(var i = 0; i < path.length; i++) path[i].applyNode(false);
    currentMove = path.length - 1;
    drawTree();
}

actionsEq = function(m1, m2) {
    return m1.actionType == m2.actionType && m1.nodeType == m2.nodeType &&
	m1.pos[0] == m2.pos[0] && m1.pos[1] == m2.pos[1];
}

toggleNumbersVisible = function() {
    numbersVisible = !numbersVisible;
    for(var i = 0; i < board.length; i++) {
	for(var j = 0; j < board.length; j++) board[i][j].toggleText();
    }
}

FieldPoint = function(x, y) {
    this.x = x;
    this.y = y;

    this.state = FpState.EMPTY;
    this.overlayState = FpState.EMPTY;
    this.text = ""; // for ALPH, NUM and MoveNumber

    this.mouseover = false;
    this.image = null;

    this.stoneRemovable = FpState.EMPTY;

    // For capture logic
    this.gmarked = false;
    this.lmarked = false;
    this.toRemove = false;
}

FieldPoint.prototype.setState = function(state) {
    this.state = state;
    if(this.image != null) this.image.remove();
    this.image = null;

    switch(this.state) {
    case FpState.EMPTY: break;
    case FpState.BLACK:
	this.image = boardcanvas.circle(this.x * width + offs,
					this.y * width + offs, stoneRadius);
	this.image.attr("stroke", "#000000");
	this.image.attr("fill", "#000000");
	break;
    case FpState.WHITE:
    	this.image = boardcanvas.circle(this.x * width + offs,
					this.y * width + offs, stoneRadius);
	this.image.attr("stroke", "#000000");
	this.image.attr("fill", "#ffffff");
	break;
    }
}

FieldPoint.prototype.setOverlayState = function(state) {

}

FieldPoint.prototype.isFree = function() {
    return this.mouseover || this.state == FpState.EMPTY;
}

FieldPoint.prototype.clearField = function() {
    this.setState(FpState.EMPTY);
    this.mouseover = false;
    this.toRemove = false;
    this.stoneRemovable = FpState.EMPTY;
}

FieldPoint.prototype.showMouseover = function(mstate) {
    if(this.state == FpState.EMPTY) {
	this.setState(mstate);
	this.image.attr("stroke-opacity", 0.6);
	this.image.attr("fill-opacity", 0.6);
	this.mouseover = true;
    }
}

FieldPoint.prototype.hideMouseover = function() {
    if(this.mouseover) {
	this.setState(FpState.EMPTY);
	this.mouseover = false;
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
	if(nei[i].state == FpState.EMPTY || nei[i].toRemove) {
	    lib++;
	    nei[i].fmarked = true;
	} else if(nei[i].state == fp.state) {
	    lib = go(nei[i], gr, lib);
	}
    }
    return lib;
}

// nodeType for the color, nodeAction for the base-action: play w/b or pass
TreeNode = function(actions, moveNumber, isRoot, parent) {
    this.parent = parent;
    this.children = [];
    this.moveNumber = moveNumber;
    this.isRoot = isRoot;
    this.actions = actions;

    this.circle = treecanvas.circle(0, 0, treeRadius);
    this.circle.attr("stroke", "#000000");
    this.circle.hide();
    this.numText = treecanvas.text(0, 0, moveNumber);
    this.numText.attr("font-size", 11);
    this.numText.toFront();
    this.numText.hide();

    if(!isRoot) {
	var action = actions[0];
	if(!((action.actionType == ActionType.PUT ||
	      action.actionType == ActionType.PASS) && action.nodeType < 3)) {
	    console.log("invalid node");
	}
	this.actions.push(action);

	switch(action.nodeType) {
	case NodeType.BLACK:
	    this.circle.attr("fill", "#000000");
	    this.numText.attr("fill", "#ffffff");
	    break;
	case NodeType.WHITE:
	    this.circle.attr("fill", "#ffffff");
	    this.numText.attr("fill", "#000000");
	    break;
	}
	if(action.actionType == ActionType.PASS) {
	    this.numText.attr("fill", "#ff0000");
	    this.numText.attr("font-weight", "bold");
	    this.numText.attr("text", "P");
	}
    } else {
	this.circle.attr("r", treeRadius - 2);
	this.circle.attr("fill", "#884444");
	this.numText.attr("text", "");
    }
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

TreeNode.prototype.addChild = function(action, moveNumber) {
    var child = new TreeNode(action, moveNumber, false, this);
    this.children.push(child);
    return child;
}

TreeNode.prototype.writeTree = function() {
    var str = "";
    var compact = false;
    if(this.isRoot) compact = true;
    if(!this.isRoot) compact = this.parent.children.length == 1;
    if(!compact) str += "(";

    if(!this.isRoot) {
	if(this.actions[0].actionType != ActionType.PASS) {
	    str += ";" + getNodeColor(this) + "[" +
		coordToAlphabetic(this.actions[0].pos) + "]";
	} else {
	    str += ";" + getNodeColor(this) + "[tt]";
	}
    }

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
    if(this.isRoot && this.children.length > 0) {
	treePaths.push(treecanvas.path("M" + (xoffs + treeRadius - 2) + " " +
				       (yoffs) + "L" +
				       (xoffs + 2 + treeRadius) + " " +
				       yoffs));
    }
    var rrow = 0;
    for(var i = 0; i < this.children.length; i++) {
	if(i > 0) {
	    var roffs = this.isRoot ? 2 : 0;
	    var yyoffs = yoffs + (2 * treeRadius + 5) * (i + rrow);
	    var xxoffs = xoffs + (2 * treeRadius + 2);
	    var path = treecanvas.path(
		"M" + xoffs + " " + (yoffs + treeRadius - roffs) +
		    "L" + xoffs + " " + yyoffs +
		    "L" + (xxoffs - treeRadius) + " " + yyoffs);
	    treePaths.push(path);
	}
	rrow += this.children[i].drawTree(col + 1, row + rrow + i);
    }
    return Math.max(0, this.children.length - 1) + rrow;
}

TreeNode.prototype.applyNode = function(reversed) {
    if(this.isRoot) return;
    for(var i = 0; i < this.actions.length; i++) {
	var action = this.actions[i];
	var x = action.pos[0];
	var y = action.pos[1];
	if(action.actionType == ActionType.PASS) continue;
	if(reversed != (action.actionType == ActionType.PUT)) {
	    if(action.nodeType > 7) {
		board[x][y].stoneRemovable = action.nodeType - 7;
		board[x][y].setState(action.nodeType - 7);
		board[x][y].mouseover = false;
	    } else {
		board[x][y].setState(action.nodeType);
		board[x][y].mouseover = false;
	    }
	} else {
	    if(action.nodeType > 7) {
		board[x][y].stoneRemovable = FpState.EMPTY;
	    }
	    board[x][y].mouseover = false;
	    board[x][y].setState(FpState.EMPTY);
	}
    }
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

TreeNode.prototype.simplifyActions = function() {
    var simplified = [];
    for(var i = 0; i < this.actions.length; i++) {
	this.actions[i].smarked = false;
    }
    for(var i = 0; i < this.actions.length; i++) {
	if(this.actions[i].smarked) continue;

	var candidates = [this.actions[i]]
	for(var j = 0; j < this.actions.length; j++) {
	    if(i == j) continue;
	    if(possibleRedundant(this.actions[i], this.actions[j])) {
		candidates.push(this.actions[j]);
		this.actions[j].smarked = true;
	    }
	}
	if(candidates.length == 1) {
	    simplified.push(candidates[0]);
	} else {
	    var sum = 0;
	    for(var k = 0; k < candidates.length; k++) {
		if(candidates[k].actionType == ActionType.PUT) sum += 1;
		else sum -= 1;
	    }
	    if(sum > 0) {
		simplified.push(new NodeAction(ActionType.PUT,
					       candidates[0].nodeType,
					       candidates[0].pos));
	    }
	}
    }
    this.actions = simplified;
}

possibleRedundant = function(a1, a2) {
    return a1.pos[0] == a2.pos[0] && a1.pos[1] == a2.pos[1] &&
	a1.nodeType == a2.nodeType;
}

NodeAction = function(actionType, nodeType, pos) {
    this.actionType = actionType;
    this.nodeType = nodeType;
    this.pos = pos;

    //for simplify
    this.smarked = false;
    return this;
}

writeSgf = function() {
    var sgf = "(;GM[1]FF[4]CA[UTF-8][SZ" + Math.max(dimX, dimY) + "]"
    sgf += gameTree.writeTree() + ")";
    return sgf;
}

coordToAlphabetic = function(coord) {
    var x = coord[0];
    var y = coord[1];
    var str = "";
    str += String.fromCharCode(96 + x + 1);
    str += String.fromCharCode(96 + y + 1);
    return str;
}

getNodeColor = function(node) {
    if(node.actions[0].nodeType == NodeType.BLACK) return "B";
    if(node.actions[0].nodeType == NodeType.WHITE) return "W";
    console.log("Color error");
}

addTools = function() {
    var fst = '<div id="';
    var snd = '" class="toolstool but buttonidle"></div>';
    var snd2 = '" class="toolstool sel unselected"></div>';
    $("#tools").append(fst + 'bpass' + snd);
    $("#tools").append(fst + 'bbw' + snd);
    $("#tools").append(fst + 'bbww' + snd);
    $("#tools").append(fst + 'bfww' + snd);
    $("#tools").append(fst + 'bfw' + snd);
    $("#tools").append(fst + 'bshow' + snd);
    $("#tools").
	append(fst + 'tplay' + '" class="toolstool sel selected"></div>');
    $("#tools").append(fst + 'tblack' + snd2);
    $("#tools").append(fst + 'twhite' + snd2);
    $("#tools").append(fst + 'talph' + snd2);
    $("#tools").append(fst + 'tnum' + snd2);
    $("#tools").append(fst + 'tcirc' + snd2);
    $("#tools").append(fst + 'tquad' + snd2);
    $("#tools").append(fst + 'ttri' + snd2);
    $("#tools").append(fst + 'trem' + snd2);

    $("#tools").children("div.but").each(function() {
	registerButton($(this), toolButtonPress, this.id);
    });
    $("#tools").children("div.sel").each(function() {
	registerSelectButton($(this), $("#tools").children("div.sel"),
			     toolSelectPress, this.id);
    });
}

toolButtonPress = function(buttonId) {
    switch(buttonId) {
    case "bpass": pass(); break;
    case "bshow": toggleNumbersVisible(); break;
    case "bbw": goBackward(); break;
    case "bfw": goForward(); break;
    case "bbww": {
	for(var i = 0; i < 5; i++) goBackward();
	break;
    }
    case "bfww": {
	for(var i = 0; i < 5; i++) goForward();
	break;
    }
    }
}

toolSelectPress = function(buttonId) {
    switch(buttonId) {
    case "tplay": currentTool = Tools.PLAY; break;
    case "tblack": currentTool = Tools.BLACK; break;
    case "twhite": currentTool = Tools.WHITE; break;
    }
}
