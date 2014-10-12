//GET LIST OF STORES FROM LOCAL STORAGE

var Layout = require("./view")
var domify = require('domify');

function ObjectList(){

	var that = this;
	this.el = domify( Layout() );

	var counter = 20000;
	for (var i = 20000 ; i >= 0; i--) {
		setTimeout( function(){ that.el.opacity -= 1; },55 )
	}

}
module.exports = ObjectList;

