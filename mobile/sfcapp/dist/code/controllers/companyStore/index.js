//GET APP LIST FROM COMPANY API

var Layout = require("./view")
var Item = require("./item")

var sfcStore = require("../../models/sfcStore");

var domify = require('domify');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
inherits(ObjectList, EventEmitter);

function ObjectList(){
	this.el = domify( Layout() );
}
inherits(ObjectList, EventEmitter);

ObjectList.prototype.renderStore = function(){
	var that = this;
	this.el = domify( Layout() );
	this.body = this.el.querySelector(".mobile-body")
	this.frame = this.el.querySelector(".vf-iframe")
	this.menu = this.el.querySelector(".mobile-menu");
	this.appList = this.el.querySelector(".app-list");
	//this.title = this.el.querySelector(".title");

	var btnMenu = this.el.querySelector(".btn-menu");
	btnMenu.onclick = function(e){
		that.onMenuClick(e);
	}
	
	this.appList.onclick = function(e){
		that.onAppClick(e);
	}

	this.onMenuClick();
}

ObjectList.prototype.activate = function(){
	document.domain = "force.com"
	var that = this;
	this.renderStore();
	this.adjustIFrame();
	this.frame.src = sfcStore.current.Apiurl + "/" + sfcStore.current.Apps[0]
	this.frame.onload = function(){ 
		that.frame.contentWindow.start(sfcStore.current.Token) 
	}

	
	this.renderApps();
}

ObjectList.prototype.adjustIFrame = function(){
	var that = this;
	setTimeout(function(){
		that.frame.style.height = that.body.offsetHeight + "px"
		that.frame.style.width = that.body.offsetWidth + "px"
	},100)

}

ObjectList.prototype.renderApps = function(){
	var store = sfcStore.current;
	for (var i = store.Apps.length - 1; i >= 0; i--) {
		var model = store.Apps[i];
		this.appList.innerHTML += Item(model);
	};
	this.appList.innerHTML += Item("Exit")
}

ObjectList.prototype.onMenuClick = function(e){
	if(this.menu.style.left=="-100px") this.menu.style.left="0px";
	else this.menu.style.left="-100px";
}

ObjectList.prototype.onAppClick = function(e){
	var app = e.target.dataset.app
	
	if(app == "Exit") return this.emit("BACK")
	this.frame.src = sfcStore.current.Apiurl + "/" + app
	this.onMenuClick();
}

	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;



