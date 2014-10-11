//GET APP LIST FROM COMPANY API

var Layout = require("./view")
var Item = require("./item")


var sfcStore = require("../../models/sfcStore");

var domify = require('domify');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
inherits(ObjectList, EventEmitter);

function ObjectList(){

	var that = this;
	this.el = domify( Layout() );
	this.body = this.el.querySelector(".mobile-body")
	this.frame = this.el.querySelector(".vf-iframe")
	this.menu = this.el.querySelector(".mobile-menu");
	this.appList = this.el.querySelector(".app-list");

	var btnMenu = this.el.querySelector(".btn-menu");
	btnMenu.onclick = function(e){
		that.onMenuClick(e);
	}
	
	this.appList.onclick = function(e){
		that.onAppClick(e);
	}

	this.onMenuClick();
}
inherits(ObjectList, EventEmitter);

ObjectList.prototype.activate = function(){
	this.adjustIFrame();
	this.frame.src= sfcStore.current.Apiurl + "/" + sfcStore.current.Apps[0]
	this.renderApps();
}

ObjectList.prototype.adjustIFrame = function(){
	this.frame.style.height = this.body.offsetHeight + "px"
	this.frame.style.width = this.body.offsetWidth + "px"
}

ObjectList.prototype.renderApps = function(){
	var store = sfcStore.current;
	for (var i = store.Apps.length - 1; i >= 0; i--) {
		var model = store.Apps[i];
		this.appList.innerHTML+= Item(model);
	};
}

ObjectList.prototype.onMenuClick = function(e){
	if(this.menu.style.left=="-100px") this.menu.style.left="0px";
	else this.menu.style.left="-100px";
}

ObjectList.prototype.onAppClick = function(e){
	this.frame.src = sfcStore.current.Apiurl + "/" + e.target.dataset.app
	this.onMenuClick();
}

	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;



