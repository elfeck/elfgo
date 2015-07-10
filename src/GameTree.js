TreeNode = function(parent, moveNumber, actions) {
    this.parent = parent;
    this.children = [];
    this.moveNumber = moveNumber;
    this.actions = actions;

    this.initGraphics();
}

TreeNode.treePaths = [];

TreeNode.prototype.isRoot = function() { return this.parent == null; }

TreeNode.prototype.addChild = function(actions, moveNumber) {
    var child = new TreeNode(this, moveNumber, actions);
    this.children.push(child);
    return child;
}
TreeNode.prototype.addAction = function(action) {
    this.actions.push(action);
    this.simplifyActions();
}
TreeNode.prototype.applyNode = function(reversed) {
    for(var i = 0; i < this.actions.length; i++) {
	this.actions[i].applyAction(reversed);
    }
}
TreeNode.prototype.applyLabelsOnly = function() {
    for(var i = 0; i < this.actions.length; i++) {
	var action = this.actions[i];
	if(action.state > 2 && action.state < 9) action.applyAction(false);
    }
}
TreeNode.prototype.draw = function() {
    for(var i = 0; i < TreeNode.treePaths.length; i++) {
	TreeNode.treePaths[i].remove();
    }
    TreeNode.treePaths = [];
    this.drawTree(0, 0);
}
TreeNode.prototype.searchFor = function(node) {
    if(this == node) {
	var path = [];
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
TreeNode.prototype.drawTree = function(col, row) {
    var xoffs = game.treeOffs + 0.5 + col * (2 * game.treeRadius + 2);
    var yoffs = game.treeOffs + row * (2 * game.treeRadius + 5);
    if(xoffs + 10 > game.treeDim[0]) {
	game.treeDim[0] += 3 * (2 * game.treeRadius + 2);
	treecanvas.setSize(game.treeDim[0], game.treeDim[1]);
	$("#tree-canvas").scrollLeft($(document).outerWidth());
    }
    if(yoffs + 4 > game.treeDim[1]) {
	game.treeDim[1] += 1 * (2 * game.treeRadius + 5);
	treecanvas.setSize(game.treeDim[0], game.treeDim[1]);
	$("#tree-canvas").scrollTop($("#tree-canvas")[0].scrollHeight);
    }
    this.circle.transform("T" + xoffs + "," + yoffs);
    this.circle.mC.transform("T" + xoffs + "," + yoffs);
    this.circle.show();
    this.numText.transform("T" + xoffs + "," + yoffs);
    this.numText.show();

    // current pos marker
    if(this == game.currentTreePos) {
	game.currentTreePosMarker.transform(
	    "T" + (xoffs - Math.sqrt(2) * game.treeRadius + 2.25) + "," +
		(yoffs - Math.sqrt(2) * game.treeRadius + 2.25));
	game.currentTreePosMarker.toFront();
	if(game.currentTreePosMarker.node.style.display == "none") {
	    game.currentTreePosMarker.show();
	}
    }

    // paths
    if(this.isRoot() && this.children.length > 0) {
	var pathStr =
	    "M" + (xoffs + game.treeRadius - 2) + " " + yoffs +
	    "L" + (xoffs + 2 + game.treeRadius) + " " + yoffs;
	TreeNode.treePaths.push(treecanvas.path(pathStr));
    }
    var rrow = 0;
    for(var i = 0; i < this.children.length; i++) {
	if(i > 0) {
	    var roffs = this.isRoot() ? 2 : 0;
	    var yyoffs = yoffs + (2 * game.treeRadius + 5) * (i + rrow);
	    var xxoffs = xoffs + (2 * game.treeRadius + 2);
	    var path = treecanvas.path(
		"M" + xoffs + " " + (yoffs + game.treeRadius - roffs) +
		    "L" + xoffs + " " + yyoffs +
		    "L" + (xxoffs - game.treeRadius) + " " + yyoffs);
	    TreeNode.treePaths.push(path);
	}
	rrow += this.children[i].drawTree(col + 1, row + rrow + i);
    }
    return Math.max(0, this.children.length - 1) + rrow;
}

TreeNode.prototype.initGraphics = function() {
    this.circle = treecanvas.circle(0, 0, game.treeRadius);
    this.circle.attr("stroke", "#000000");
    this.circle.hide();

    this.numText = treecanvas.text(0, 0, this.moveNumber);
    this.numText.attr("font-size", 11);
    this.numText.toFront();
    this.numText.hide();

    if(!this.isRoot()) {
	var action = this.actions[0];

	switch(action.state) {
	case NodeSt.BLACK:
	    this.circle.attr("fill", "#000000");
	    this.numText.attr("fill", "#ffffff");
	    break;
	case NodeSt.WHITE:
	    this.circle.attr("fill", "#ffffff");
	    this.numText.attr("fill", "#000000");
	    break;
	}
	if(action.type == ActSt.PASS) {
	    this.numText.attr("fill", "#ff0000");
	    this.numText.attr("font-weight", "bold");
	    this.numText.attr("text", "P");
	}
    } else {
	this.circle.attr("r", game.treeRadius - 2);
	this.circle.attr("fill", "#884444");
	this.numText.attr("text", "");
    }
    this.circle.mC = treecanvas.circle(0, 0, game.treeRadius + 2);
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
	game.loadFromNode(this.tN);
    });
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
	    var lastinfo = null;
	    for(var k = 0; k < candidates.length; k++) {
		if(candidates[k].type == ActSt.PUT) {
		    sum += 1;
		    lastinfo = candidates[k].info;
		} else {
		    sum -= 1;
		}
	    }
	    if(sum > 0) {
		var saction = new NodeAction(ActSt.PUT,
					     candidates[0].state,
					     candidates[0].point);
		saction.info = lastinfo;
		simplified.push(saction);
	    }
	}
    }
    this.actions = simplified;
}
var possibleRedundant = function(a1, a2) {
    if(a1.type == ActSt.PASS || a2.type == ActSt.PASS) return false;
    return a1.point.x == a2.point.x && a1.point.y == a2.point.y &&
	a1.state == a2.state;
}
NodeAction = function(type, state, point) {
    this.type = type;
    this.state = state;
    this.point = point;
    this.info = null;

    this.smarked = false;
}
NodeAction.prototype.applyAction = function(reversed) {
    if(this.type == ActSt.PASS) {
	return;
    }
    if(this.type == ActSt.REM != reversed) {
	// REM
	if(this.state < 3) {
	    this.point.removeStone();
	} else if(this.state < 9) {
	    this.point.removeOverlay();
	    game.freeOverlayInfo(this.state, this.info);
	} else if(this.state < 11) {
	    this.point.removeStone();
	}
    } else {
	// PUT
	if(this.state < 3) {
	    this.point.placeStone(this.state, false);
	    game.board.setLastPlayed(this.point);
	} else if(this.state < 9) {
	    this.point.placeOverlay(this.state, this.info);
	    game.takeOverlayInfo(this.state, this.info);
	} else if(this.state < 11) {
	    this.point.placeStone(this.state - 8, true);
	}
    }
}
NodeAction.actionsEqual = function(a1, a2) {
    if(a1.type == ActSt.PASS || a2.type == ActSt.PASS) {
	return a1.type == a2.type && a1.state == a2.state;
    }
    return a1.point.x == a2.point.x && a1.point.y == a2.point.y &&
	a1.type == a2.type && a1.state == a2.state;
}
