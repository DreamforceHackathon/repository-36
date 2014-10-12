//GET LIST OF COMPANIES FROM SFC CONTROL CENTER

//ONCE COMPANY IS SELECTED , TAKE TO LOGIN WITH API URL


var Layout = require("./view")
var Item = require("./item")

var sfcStore = require("../../models/sfcStore");

var Company = require("../../models/company");

var domify = require('domify');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
inherits(ObjectList, EventEmitter);

function ObjectList(){

	var that = this;
	this.el = domify( Layout() );

	this.list = this.el.querySelector(".company-list");
	this.list.onclick = function(e){
		that.onItemClick(e);
	}
	
	var btnBack = this.el.querySelector(".btn-back");
	btnBack.onclick = function(){
		that.emit("BACK");
	}

	Company.fetch();
	Company.bind("refresh", function(){ that.render() });
	
//	Sf1Fields.bind("refresh", function(){ that.render(); });
}
inherits(ObjectList, EventEmitter);

ObjectList.prototype.render = function(){
	var models = Company.all();
	for (var i = models.length - 1; i >= 0; i--) {
		var model = models[i];
		this.list.innerHTML+= Item(model);
	};
}

ObjectList.prototype.onItemClick = function(e){

	var id = e.target.dataset.id;
	
	this.emit("SELECT_COMPANY",id)
}


	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;

