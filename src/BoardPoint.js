BoardPoint = function(board, x, y) {
    this.board = board;
    this.x = x;
    this.y = y;

    this.stone = null;
    this.overlay = null;
    this.lastPlayed = null;

    this.simulateState = 0;
    this.gmarked = false;
    this.lmarked = false;
    this.toRemove = false;
}
BoardPoint.prototype.hasStone = function() {
    return this.stone != null;
}
BoardPoint.prototype.hasOverlay = function() {
    return this.overlay != null;
}
BoardPoint.prototype.isStoneRemovable = function() {
    if(!this.hasStone()) return false;
    return this.stone.removable;
}
BoardPoint.prototype.placeStone = function(type, removable) {
    if(this.hasStone()) {
	dbg("Put Stone on: [" + this.x + " " + this.y +
	    "] impossible. Not empty.");
	return;
    }
    this.stone = new BoardStone(this, type, removable);
    if(this.overlay != null) {
	if(this.overlay.color == type) {
	    this.overlay.color = this.oppositeColor();
	    this.overlay.replaceBecauseColor();
	}
	this.overlay.image.toFront();
    }
}
BoardPoint.prototype.placeOverlay = function(type, info) {
    if(this.hasOverlay()) {
	dbg("Put Overlay on: [" + this.x + " " + this.y +
	    "] impossible. Not empty.");
	return;
    }
    this.overlay = new BoardOverlay(this, type, info);
    if(this.lastPlayed != null) this.overlay.image.hide();
}
BoardPoint.prototype.removeStone = function() {
    if(!this.hasStone()) {
	dbg("Removing Stone on: [" + this.x + " " + this.y +
	    "] impossible. Empty.");
	return;
    }
    this.stone.image.remove();
    this.stone = null;
    if(this.overlay != null) {
	if(this.overlay.color == StoneSt.WHITE) {
	    this.overlay.color = StoneSt.BLACK;
	    this.overlay.replaceBecauseColor();
	}
    }
}
BoardPoint.prototype.removeOverlay = function() {
    if(!this.hasOverlay()) {
	dbg("Removing Overlay on: [" + this.x + " " + this.y +
	    "] impossible. Empty.");
	return;
    }
    this.overlay.image.remove();
    this.overlay = null;
}
BoardPoint.prototype.toggleLastPlayed = function(isShow) {
    if(this.overlay != null) {
	if(!isShow) this.overlay.image.show();
	else this.overlay.image.hide();
    }
    if(isShow) {
	var coord = this.getBoardCoord();
	this.lastPlayed = game.lastPlayedImage(this.oppositeColor());
	this.lastPlayed.transform("T" + coord[0] + " " + coord[1]);
    } else {
	this.lastPlayed.remove();
	this.lastPlayed = null;
    }
}

BoardPoint.prototype.getBoardCoord = function() {
    return [this.x * game.board.step + game.board.border,
	    this.y * game.board.step + game.board.border];
}
BoardPoint.prototype.getNeighbours = function() {
    var n = [[this.x - 1, this.y], [this.x + 1, this.y],
	     [this.x, this.y - 1], [this.x, this.y + 1]];
    var result = new Array();
    for(var i = 0; i < 4; i++) {
	if(n[i][0] >= 0 && n[i][0] < game.board.dim[0] &&
	   n[i][1] >= 0 && n[i][1] < game.board.dim[1])
	{
	    result.push(game.board.points[n[i][0]][n[i][1]]);
	}
    }
    return result;
}
BoardPoint.prototype.getGroup = function() {
    for(var x = 0; x < game.board.dim[0]; x++) {
	for(var y = 0; y < game.board.dim[1]; y++) {
	    game.board.points[x][y].gmarked = false;
	    game.board.points[x][y].lmarked = false;
	}
    }
    var group = new Array();
    var lib = go(this, group, 0);
    return new StoneGroup(group, lib);
}
var BoardStone = function(bp, type, removable) {
    this.bp = bp;
    this.state = type;
    this.removable = removable;

    var coord = bp.getBoardCoord();
    this.image = game.toolImage(type, null);
    this.image.transform("T" + coord[0] + " " + coord[1]);
}
BoardPoint.prototype.oppositeColor = function() {
    if(!this.hasStone()) return StoneSt.BLACK;
    if(this.stone.state == StoneSt.BLACK) return StoneSt.WHITE;
    else return StoneSt.BLACK;
}
var BoardOverlay = function(bp, type, info) {
    this.bp = bp;
    this.state = type;
    this.color = bp.oppositeColor();
    this.info = info;

    var coord = bp.getBoardCoord();
    this.image = game.toolImage(this.state, this.color, this.info);
    this.image.transform("T" + coord[0] + " " + coord[1]);
}
BoardOverlay.prototype.replaceBecauseColor = function() {
    var coord = this.bp.getBoardCoord();
    this.image.remove();
    this.image = game.toolImage(this.state, this.color, this.info);
    this.image.transform("T" + coord[0] + " " + coord[1]);
}
var StoneGroup = function(stones, liberties) {
    this.stones = stones;
    this.liberties = liberties;
}
var go = function(p, grp, lib) {
    var nei = p.getNeighbours().filter(function(n) {
	return !n.gmarked;
    });
    p.gmarked = true;
    grp.push(p);
    for(var i = 0; i < nei.length; i++) {
	if((nei[i].simulateState == 0 &&
	    nei[i].stone == null) || nei[i].toRemove) {
	    lib++;
	    nei[i].lmarked = true;
	} else {
	    if(Board.haveSameSimState(p, nei[i])) lib = go(nei[i], grp, lib);
	}
    }
    return lib;
}
