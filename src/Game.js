$(function() { initGame(); });
var initGame = function() {
    var dim = [19, 19];
    var bsize = [$("#board-canvas").width(), $("#board-canvas").height()];
    var tsize = [$("#tree-canvas").width(), $("#tree-canvas").height()];

    boardcanvas = Raphael("board-canvas", bsize[0], bsize[1]);
    boardcanvas.renderfix();

    $("#board-canvas")[0].setAttribute("shape-rendering", "crispEdges");

    treecanvas = Raphael("tree-canvas", tsize[0], tsize[1]);
    treecanvas.renderfix();

    game = new Game();
    game.init(dim, bsize);
    addTools();

    $("#board-canvas").on("mousemove", handleMousemove);
    $("#board-canvas").on("mouseleave", handleMouseleave);

    $("#board-canvas").on("mouseup", handleClick);
    $(document).on("keyup", handleKey);
}

Game = function() {
    this.alphaArray = new Array(26);
    this.numArray = new Array(99);

    this.currentTool = ToolSt.PLAY;
    this.currentMove = 0;

    this.treeDim = [$("#tree-canvas").width(), $("#tree-canvas").height()];
    this.treeOffs = 12;
    this.treeRadius = null;

    this.board = null;
    this.tree = null;
    this.currentTreePos = null;
    this.currentTreePosMarker = null;
}
Game.prototype.goForward = function() {
    if(this.currentTreePos.children.length > 0) {
	this.resetLabels();
	this.currentTreePos = this.currentTreePos.children[0];
	this.currentTreePos.applyNode(false);
	this.currentMove++;
	this.tree.draw();
    }
}
Game.prototype.goBackward = function() {
    if(!this.currentTreePos.isRoot()) {
	this.currentTreePos.applyNode(true);
	this.currentTreePos = this.currentTreePos.parent;
	this.currentTreePos.applyLabelsOnly();
	if(this.currentTreePos.isRoot()) {
	    this.board.setLastPlayed(null);
	} else {
	    if(this.currentTreePos.actions[0].type != ActSt.PASS) {
		this.board.setLastPlayed(
		    this.currentTreePos.actions[0].point);
	    } else {
		this.board.setLastPlayed(null); // should set to last non-pass
	    }
	}
	this.currentMove--;
	this.tree.draw();
    }

}
Game.prototype.loadFromNode = function(node) {
    this.board.resetStones();
    this.currentTreePos = node;
    var path = this.tree.searchFor(node).reverse();
    for(var i = 0; i < path.length; i++) {
	this.resetLabels();
	path[i].applyNode(false);
    }
    this.currentMove = path.length - 1;
    if(this.currentMove == 0) this.board.setLastPlayed(null);
    this.tree.draw();
}
Game.prototype.pass = function() {
    var act = new NodeAction(ActSt.PASS, this.currentColor(), null);
    this.currentMove++;
    var child = this.currentTreePos.addChild([act], this.currentMove);
    this.currentTreePos = child;
    this.resetLabels();
    this.tree.draw();
}
Game.prototype.resetLabels = function() {
    for(var i = 0; i < 26; i++) this.alphaArray[i] = false;
    for(var i = 0; i < 99; i++) this.numArray[i] = false;
    this.board.resetLabels();
}
Game.prototype.init = function(dim, size) {
    this.board = new Board(dim, size);

    this.treeRadius = this.board.stoneRadius - 2;
    this.tree = new TreeNode(null, 0, []);

    this.currentTreePos = this.tree;
    this.currentTreePosMarker = treecanvas.rect(0, 0,
						this.treeRadius * 2 + 2,
						this.treeRadius * 2 + 2);
    this.currentTreePosMarker.attr("fill", "#ff0000");
    this.currentTreePosMarker.attr("fill-opacity", 0.4);
    this.currentTreePosMarker.attr("stroke-width", 0);
    this.currentTreePosMarker.hide();

    this.resetLabels();
    this.tree.draw();
}

Game.prototype.toolImage = function(tool, color, info) {
    var image = null;
    switch(tool) {
    case ToolSt.PLAY:
	image = boardcanvas.circle(0.5, 0.5, this.board.stoneRadius - 1);
	if(this.currentColor() == StoneSt.BLACK) {
	    image.attr("fill", "#000000");
	}
	else  {
	    image.attr("fill", "#ffffff");
	}
	break;
    case ToolSt.BLACK:
	image = boardcanvas.circle(0.5, 0.5, this.board.stoneRadius - 1);
	image.attr("fill", "#000000");
	break;
    case ToolSt.WHITE:
	image = boardcanvas.circle(0.5, 0.5, this.board.stoneRadius - 1);
	image.attr("fill", "#ffffff");
	break;
    case ToolSt.ALPHA:
	image = boardcanvas.text(0.5, 0.5, String.fromCharCode(info + 65));
	image.attr("font-size", 17);
	image.attr("font-family", "Sans");
	image.attr("fill", this.stateToColor(color));
	break;
    case ToolSt.NUM:
	image = boardcanvas.text(0.5, 0.5, info + 1);
	image.attr("font-size", 17);
	image.attr("font-family", "Sans");
	image.attr("fill", this.stateToColor(color));
	break;
    case ToolSt.CIRC:
	image = boardcanvas.circle(0.5, 0.5, this.board.stoneRadius - 5);
	image.attr("stroke-width", 2);
	image.attr("stroke", this.stateToColor(color));
	break;
    case ToolSt.QUAD:
	var sqrt2 = Math.sqrt(2);
	var slen = (this.board.stoneRadius - 5.5) * 2;
	var rx = -slen * 0.5;
	image = boardcanvas.rect(rx, rx, slen, slen);
	image.attr("stroke-width", 2);
	image.attr("stroke", this.stateToColor(color));
	break;
    case ToolSt.TRI:
	var slen = (this.board.stoneRadius - 5) * 2;
	var y = Math.tan(Math.PI / 6) * slen * 0.5;
	var p1 = [-slen * 0.5 + 0.5, y + 0.5];
	var p2 = [0.5 * slen + 0.5, y + 0.5];
	var p3 = [0.5, -Math.sqrt(0.75 * slen * slen) + y + 0.5];
	image = boardcanvas.path("M" + p1[0] + "," + p1[1] + "," +
				 p2[0] + "," + p2[1] + "," +
				 p3[0] + "," + p3[1] + "z");
	image.attr("stroke-width", 2);
	image.attr("stroke", this.stateToColor(color));
	break;
    case ToolSt.CROSS:
	var slen = (this.board.stoneRadius - 5.5) * 2;
	var rx = -slen * 0.5;
	var p1 = [rx + 0.5, rx + 0.5];
	var p2 = [slen + rx + 0.5, slen + rx + 0.5];
	var p3 = [slen + rx + 0.5, rx + 0.5];
	var p4 = [rx + 0.5, slen + rx + 0.5];
	image = boardcanvas.path("M" + p1[0] + " " + p1[1] +
				 "L" + p2[0] + " " + p2[1] +
				 "M" + p3[0] + " " + p3[1] +
				 "L" + p4[0] + " " + p4[1]);
	image.attr("stroke", this.stateToColor(color));
	image.attr("stroke-width", 2);
	break;
    case ToolSt.REM:
	break;
    }
    return image;
}
Game.prototype.lastPlayedImage = function(color) {
    var slen = this.board.stoneRadius - 1.5;
    var p1 = [-0.5, -0.5];
    var p2 = [-0.5, slen - 0.5];
    var p3 = [slen - 0.5, -0.5];
    var image = boardcanvas.path("M" + p1[0] + "," + p1[1] + "," +
				 p2[0] + "," + p2[1] + "," +
				 p3[0] + "," + p3[1] + "z");
    image.attr("stroke-opacity", 0);
    if(color == StoneSt.BLACK) image.attr("fill", "#1111dd");
    else image.attr("fill", "#ffffff");
    return image;
}
Game.prototype.toolAction = function(point) {
    if(this.currentTool == ToolSt.PLAY) {
	if(point.hasStone()) return;
	var actions = this.board.playMove(point, this.currentColor());
	if(actions.length > 0) {
	    if(this.actionIsForward(actions[0])) {
		this.goForward();
	    } else {
		this.currentMove++;
		var n = this.currentTreePos.addChild(actions,
						     this.currentMove);
		this.currentTreePos = n;
		this.resetLabels();
		this.currentTreePos.applyNode(false);
		this.tree.draw();
	    this.board.removeMouseover();
	    }
	}
    } else if(this.currentTool < 3) {
	if(point.hasStone()) {
	    if(!point.stone.removable) {
		return;
	    } else {
		var n1 = new NodeAction(ActSt.REM, point.stone.state + 8,
					point);
		var oldColor = point.oppositeColor();
		this.currentTreePos.addAction(n1);
		n1.applyAction(false);
		if(this.currentTool != oldColor) {
		    this.board.attemptMouseover([point.x, point.y]);
		    return;
		}
		var n2 = new NodeAction(ActSt.PUT, this.currentTool + 8,
					point);
		this.currentTreePos.addAction(n2);
		n2.applyAction(false);
		this.board.removeMouseover();
	    }
	} else {
	    var n = new NodeAction(ActSt.PUT, this.currentTool + 8, point);
	    this.currentTreePos.addAction(n);
	    n.applyAction(false);
	    this.board.removeMouseover();
	}
    } else if(this.currentTool < 9) {
	if(point.hasOverlay()) {
	    var n1 = new NodeAction(ActSt.REM, point.overlay.state, point);
	    var oldState = point.overlay.state;
	    n1.info = point.overlay.info;
	    this.currentTreePos.addAction(n1);
	    n1.applyAction(false);
	    if(this.currentTool == oldState) {
		this.board.attemptMouseover([point.x, point.y]);
		return;
	    }
	}
	var info = null;
	var n2 = new NodeAction(ActSt.PUT, this.currentTool, point);
	if(this.currentTool == ToolSt.ALPHA) {
	    info = getFirstFree(this.alphaArray);
	    takeFirstFree(this.alphaArray);
	} else if(this.currentTool == ToolSt.NUM) {
	    info = getFirstFree(this.numArray);
	    takeFirstFree(this.numArray);
	}
	n2.info = info;
	this.currentTreePos.addAction(n2);
	n2.applyAction(false);
	this.board.removeMouseover();
    }
}
Game.prototype.actionIsForward = function(act) {
    if(this.currentTreePos.children.length > 0) {
	if(this.currentTreePos.children[0].actions.length > 0) {
	    return NodeAction.
		actionsEqual(act, this.currentTreePos.children[0].actions[0]);
	}
    }
    return false;
}
Game.prototype.currentColor = function() {
    return (this.currentMove) % 2 + 1;
}
Game.prototype.stateToColor = function(c) {
    if(c == StoneSt.BLACK) return "#000000";
    if(c == StoneSt.WHITE) return "#ffffff";
}
Game.prototype.freeOverlayInfo = function(state, info) {
    if(state == ToolSt.ALPHA) freeFirstFree(this.alphaArray, info);
    if(state == ToolSt.NUM) freeFirstFree(this.numArray, info);
}
Game.prototype.takeOverlayInfo = function(state, info) {
    if(state == ToolSt.ALPHA) takeSpecificFree(this.alphaArray, info);
    if(state == ToolSt.NUM) takeSpecificFree(this.numArray, info);
}
var handleClick = function(e) {
    var relCoord = offsetMouse($("#board-canvas"), e);
    game.board.mouseclick([relCoord[0] - 2, relCoord[1] - 2]);
}
var handleKey = function(e) {

}
var handleMousemove = function(e) {
    var relCoord = offsetMouse($("#board-canvas"), e);
    game.board.mousemove([relCoord[0] - 2, relCoord[1] - 2]);
}
var handleMouseleave = function(e) {
    game.board.mouseleave();
}
var addTools = function() {
    var fst = '<div id="';
    var snd = '" class="toolstool but buttonidle"></div>';
    var snd2 = '" class="toolstool sel unselected"></div>';
    $("#tools").append(fst + 'bbw' + snd);
    $("#tools").append(fst + 'bbww' + snd);
    $("#tools").append(fst + 'bfww' + snd);
    $("#tools").append(fst + 'bfw' + snd);
    $("#tools").append(fst + 'bpass' + snd);
    $("#tools").append(fst + 'bshow' + snd);
    $("#tools").append('<div id="placeholder"></div>');
    $("#tools").
	append(fst + 'tplay' + '" class="toolstool sel selected"></div>');
    $("#tools").append(fst + 'tblack' + snd2);
    $("#tools").append(fst + 'twhite' + snd2);
    $("#tools").append(fst + 'talph' + snd2);
    $("#tools").append(fst + 'tnum' + snd2);
    $("#tools").append(fst + 'tcirc' + snd2);
    $("#tools").append(fst + 'tquad' + snd2);
    $("#tools").append(fst + 'tcross' + snd2);
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
var toolButtonPress = function(buttonId) {
    switch(buttonId) {
    case "bpass": game.pass(); break;
    case "bbw": game.goBackward(); break;
    case "bfw": game.goForward(); break;
    case "bbww":
	for(var i = 0; i < 5; i++) game.goBackward();
	break;
    case "bfww":
	for(var i = 0; i < 5; i++) game.goForward();
	break;
    }
}

var toolSelectPress = function(buttonId) {
    switch(buttonId) {
    case "tplay": game.currentTool = ToolSt.PLAY; break;
    case "tblack": game.currentTool = ToolSt.BLACK; break;
    case "twhite": game.currentTool = ToolSt.WHITE; break;
    case "talph": game.currentTool = ToolSt.ALPHA; break;
    case "tnum": game.currentTool = ToolSt.NUM; break;
    case "tcirc": game.currentTool = ToolSt.CIRC; break;
    case "tquad": game.currentTool = ToolSt.QUAD; break;
    case "ttri": game.currentTool = ToolSt.TRI; break;
    case "tcross": game.currentTool = ToolSt.CROSS; break;
    }
}
