//LOGIN TO COMPANY API

//GET BACK TOKEN AND COMPANY APP FROM STORE

var Layout = require("./view")
var domify = require('domify');

var sfcStore = require("../../models/sfcStore");


var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
inherits(ObjectList, EventEmitter);
var superagent = require("superagent")


function ObjectList(){

	var that = this;
	this.el = domify( Layout() );
	this.username = this.el.querySelector("#txt_username")
	this.password = this.el.querySelector("#txt_password")
	var btnSend = this.el.querySelector(".btn_send")
	var btnCancel = this.el.querySelector(".btn_cancel")

	btnSend.onclick = function(e){
		that.loginToApi(e);
	}

	btnCancel.onclick = function(e){
		that.onCancel(e);
	}

	
}
inherits(ObjectList, EventEmitter);

ObjectList.prototype.activate = function(){
	this.el.querySelector(".account_name").innerHTML = sfcStore.current.Name;
}


ObjectList.prototype.loginToApi = function(e){
	
	var url = 'https://jsonp.nodejitsu.com/?url='+ sfcStore.current.Apiurl +'/services/apexrest/sfc?credentials={"username": "user","password":"pass"}';
	var that = this;
  superagent.get(url).end(function(res){
    if(res.ok){
    	var parsed = JSON.parse(res.body);
    	that.emit("LOGIN_COMPLETE", parsed);
    }
    else{
			that.emit("BACK");
    }
  }).on('error', function(){ that.emit("BACK"); })

}


ObjectList.prototype.onSend = function(e){
	//LOGIN WITH ACTUAL ORG


	//IF SUCCESS
	this.emit("LOGIN_COMPLETE");
}

ObjectList.prototype.onCancel = function(e){
	this.emit("BACK");
}

	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;

