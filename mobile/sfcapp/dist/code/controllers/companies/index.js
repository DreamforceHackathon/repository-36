//GET LIST OF STORES FROM LOCAL STORAGE

var Layout = require("./view")
var Item = require("./item")
var AddBtn = require("./addBtn")

var sfcStore = require("../../models/sfcStore");

var domify = require('domify');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

function ObjectList(){

	var that = this;
	this.el = domify( Layout() );
	

	this.list = this.el.querySelector(".company-list")
	this.el.onclick = function(e){
		if(e.target.classList.contains('item-add') == false){
			that.onItemClick(e);
		}
		else if(e.target.classList.contains('item-add') ){
			that.onItemAdd(e);
		}
	}

	sfcStore.fetch();
	this.render()

}
inherits(ObjectList, EventEmitter);



ObjectList.prototype.render = function(){
	this.list.innerHTML = AddBtn();
	var models = sfcStore.all();
	for (var i = models.length - 1; i >= 0; i--) {
		var model = models[i];
		this.list.innerHTML += ( Item(model) );
	};
}

ObjectList.prototype.onItemAdd = function(e){
	var objectName = e.target.dataset.name;
	this.emit("ADD_COMPANY");
}

ObjectList.prototype.onItemClick = function(e){
	var target = e.target;
	if( !target.classList.contains("item-company") ) target = target.parentNode;
	
	var id = target.dataset.id;

	this.emit("SELECT_COMPANY",id)
}

	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;

