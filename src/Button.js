registerButton = function(button, pressFunction, args) {
    button.on("mouseenter", function() {
	button.removeClass("buttonidle");
	button.addClass("buttonhover");
    });
    button.on("mouseout", function() {
	button.removeClass("buttonpress");
	button.removeClass("buttonhover");
	button.addClass("buttonidle");
    });
    button.on("mousedown", function() {
	button.removeClass("buttonhover");
	button.addClass("buttonpress");
    });
    button.on("mouseup", function() {
	button.removeClass("buttonpress");
	button.addClass("buttonhover");
	pressFunction(args);
    });
}

registerSelectButton = function(button, allSelects, pressFunction, args) {
    button.on("mouseenter", function() {
	if(button.attr("class").indexOf(" selected") < 0) {
	    button.removeClass("unselected");
	    button.addClass("hoverselect");
	}
    });
    button.on("mouseout", function() {
	if(button.attr("class").indexOf(" selected") < 0) {
	    button.removeClass("hoverselect");
	    button.addClass("unselected");
	}
    });
    button.on("mouseup", function() {
	for(var i = 0; i < allSelects.length; i++) {
	    ($(allSelects[i])).removeClass("selected");
	    ($(allSelects[i])).removeClass("hoverselect");
	    ($(allSelects[i])).addClass("unselected");
	}
	button.removeClass("hoverselected");
	button.addClass("selected");
	pressFunction(args);
    });

}
