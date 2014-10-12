var Layout = require("./view")
var Item = require("./item")

var Sf1Fields = require("../../models/sf1fields");

var domify = require('domify');

var ObjectList = function(){

	var that = this;
	this.el = domify( Layout() );
	
	this.ul = this.el.querySelector("ul");
	this.ul.onclick = function(e){
		that.onItemClick(e);
	}
	Sf1Fields.bind("refresh", function(){ that.render(); });
}

ObjectList.prototype.render = function(){
	var models = Sf1Fields.getObjects();
	for (var i = models.length - 1; i >= 0; i--) {
		var model = models[i];
		this.ul.innerHTML+= Item(model);
	};
}

ObjectList.prototype.onItemClick = function(e){
	var objectName = e.target.dataset.name;
	Sf1Fields.trigger("OBJECT_SELECTED", objectName);
}

module.exports = ObjectList;

