Board = function(dim, size) {
    this.dim = dim;
    this.size = size;
    this.border = 20;
    this.step = ((this.size[0] - 2 * this.border)) / (this.dim[0] - 1);

    this.stoneRadius = (this.step / 2);

    this.mouseoverImage = null;
    this.lastMo = null;

    this.points = new Array();
    for(var x = 0; x < dim[0]; x++) {
	this.points.push(new Array());
	for(var y = 0; y < dim[1]; y++) {
	    this.points[x].push(new BoardPoint(this, x, y));
	}
    }

    this.initBoardImage();
}
Board.prototype.mousemove = function(coord) {
    this.attemptMouseover(this.toBoardIndices(coord));
}
Board.prototype.mouseclick = function(coord) {
    var ind = this.toBoardIndices(coord);
    if(ind == null) return;
    game.toolAction(this.points[ind[0]][ind[1]]);
}
Board.prototype.mouseleave = function() {
    this.removeMouseover();
    this.lastMo = null;
}
Board.prototype.initBoardImage = function() {
    for(var i = 0; i < this.dim[0]; i++) {
	var x = this.border + i * this.step + 0.5;
	var y0 = this.border + 0.5;
	var y1 = this.size[1] - this.border + 0.5;
	var pathStr = "M" + x + " " + y0 + "L" + x + " " + y1;
	var path = boardcanvas.path(pathStr);
	path.attr("stroke", "#888888");
    }
    for(var i = 0; i < this.dim[1]; i++) {
	var y = this.border + i * this.step + 0.5;
	var x0 = this.border + 0.5;
	var x1 = this.size[0] - this.border + 0.5;
	var pathStr = "M" + x0 + " " + y + "L" + x1 + " " + y;
	var path = boardcanvas.path(pathStr);
	path.attr("stroke", "#888888");
    }
    var points = [this.border + 3 * this.step + 0.5,
		  this.border + 9 * this.step + 0.5,
		  this.border + 15 * this.step + 0.5]
    for(var i = 0; i < points.length; i++) {
	for(var j = 0; j < points.length; j++) {
	    var circ = boardcanvas.circle(points[i], points[j], 2.5);
	    circ.attr("stroke-opacity", 0);
	    circ.attr("fill", "#000000");
	    circ.attr("fill-opacity", 0.5);
	}
    }
}
Board.prototype.toBoardCoord = function(coord) {
    if(!this.withinBoard(coord)) return null;
    return [coord[0] - this.border, coord[1] - this.border];
}
Board.prototype.toBoardIndices = function(coord) {
    if(!this.withinBoard(coord)) return null;
    var x = Math.round((coord[0] - this.border) / this.step);
    var y = Math.round((coord[1] - this.border) / this.step);
    if(x < 0 || x > 18 || y < 0 || y > 18) return null;
    return [x, y];
}
Board.prototype.withinBoard = function(coord) {
    return coord[0] >= 0 && coord[0] < this.size[0]
	&& coord[1] >= 0 && coord[1] < this.size[1]
}
Board.prototype.moEqual = function(m1, m2) {
    if(m1 == null || m2 == null) return false;
    return m1.tool == m2.tool && m1.ind[0] == m2.ind[0]
	&& m1.ind[1] == m2.ind[1];
}
Board.prototype.attemptMouseover = function(ind) {
    if(ind != null) {
	var mo = {
	    ind: ind,
	    tool: game.currentTool
	};
	if(this.moEqual(this.lastMo, mo)) {
	    return;
	}
	var cx = this.border + ind[0] * this.step;
	var cy = this.border + ind[1] * this.step;
	if(this.mouseoverImage != null) this.mouseoverImage.remove();
	this.mouseoverImage = null;
	if((game.currentTool < 3 && !this.points[ind[0]][ind[1]].hasStone())
	   || (game.currentTool >= 3 &&
	       !this.points[ind[0]][ind[1]].hasOverlay() &&
	       this.points[ind[0]][ind[1]].lastPlayed == null)) {
	    var color = this.points[ind[0]][ind[1]].oppositeColor();
	    var info = null;
	    if(game.currentTool == ToolSt.ALPHA) {
		info = getFirstFree(game.alphaArray);
	    }
	    if(game.currentTool == ToolSt.NUM) {
		info = getFirstFree(game.numArray);
	    }
	    this.mouseoverImage = game.toolImage(game.currentTool, color,
						 info);
	    if(game.currentTool < 3) {
		this.mouseoverImage.attr("stroke-opacity", 0.6);
		this.mouseoverImage.attr("fill-opacity", 0.6);
	    }
	    this.mouseoverImage.transform("T" + cx + " " + cy);
	    this.mouseoverImage.toFront();
	}
	this.lastMo = mo;
    }
}
Board.prototype.removeMouseover = function() {
    if(this.mouseoverImage != null) this.mouseoverImage.remove();
    this.mouseoverImage = null;
    this.lastMo = null;
}
Board.prototype.playMove = function(point, color) {
    point.simulateState = color;
    var neigh = point.getNeighbours().filter(function(n) {
	return Board.haveOppositeSimState(point, n);
    });
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
    var group = point.getGroup();
    if(group.liberties == 0) {
	this.playMoveCleanup();
	return [];
    } else {
	actions = [new NodeAction(ActSt.PUT, color, point)];
	for(var i = 0; i < this.dim[0]; i++) {
	    for(var j = 0; j < this.dim[1]; j++) {
		if(this.points[i][j].toRemove) {
		    var a = new NodeAction(ActSt.REM,
					   this.points[i][j].stone.state,
					   this.points[i][j]);
		    actions.push(a);
		}
	    }
	}
	this.playMoveCleanup();
	return actions;
    }
}
Board.prototype.playMoveCleanup = function() {
    for(var i = 0; i < this.dim[0]; i++) {
	for(var j = 0; j < this.dim[1]; j++) {
	    this.points[i][j].simulateState = 0;
	    this.points[i][j].toRemove = false;
	    this.points[i][j].gmarked = false;
	    this.points[i][j].lmarked = false;
	}
    }
}
// pass null for remove only
Board.prototype.setLastPlayed = function(point) {
    if(this.lastPl != null) this.lastPl.toggleLastPlayed(false);
    this.lastPl = point;
    if(point != null) this.lastPl.toggleLastPlayed(true);
}

Board.prototype.resetLabels = function() {
    for(var i = 0; i < this.dim[0]; i++) {
	for(var j = 0; j < this.dim[1]; j++) {
	    if(this.points[i][j].hasOverlay()) {
		this.points[i][j].removeOverlay();
	    }
	}
    }
}
Board.prototype.resetStones = function() {
    for(var i = 0; i < this.dim[0]; i++) {
	for(var j = 0; j < this.dim[1]; j++) {
	    if(this.points[i][j].hasStone()) {
		this.points[i][j].removeStone();
	    }
	}
    }
}
Board.haveOppositeSimState = function(p1, p2) {
    var c1 = p1.stone == null ? p1.simulateState : p1.stone.state;
    var c2 = p2.stone == null ? p2.simulateState : p2.stone.state;
    return c1 > 0 && c2 > 0 && c1 != c2
}
Board.haveSameSimState = function(p1, p2) {
    var c1 = p1.stone == null ? p1.simulateState : p1.stone.state;
    var c2 = p2.stone == null ? p2.simulateState : p2.stone.state;
    return c1 > 0 && c2 > 0 && c1 == c2
}
