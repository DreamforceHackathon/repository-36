//LOGIN TO COMPANY API

//GET BACK TOKEN AND COMPANY APP FROM STORE

var Layout = require("./view")
var domify = require('domify');

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


ObjectList.prototype.loginToApi = function(e){
	
	var url = 'https://jsonp.nodejitsu.com/?url=https://sf1c-developer-edition.na17.force.com/api/services/apexrest/sfc?credentials={"username": "user","password":"pass"}';
	var that = this;
  superagent.get(url).end(function(res){
    var parsed = JSON.parse(res.body);

    that.emit("LOGIN_COMPLETE", parsed);
  })

}


ObjectList.prototype.onSend = function(e){
	//LOGIN WITH ACTUAL ORG


	//IF SUCCESS
	this.emit("LOGIN_COMPLETE");
}

ObjectList.prototype.onCancel = function(e){
	this.emit("LOGIN_CANCEL");
}

	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;

