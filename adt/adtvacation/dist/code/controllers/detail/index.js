var el;
var Layout = require("./view")
var container;

var domify = require('domify');

function init(){
	el = domify( Layout() )
	container = el.querySelector(".js-container");
}

function render(model, item, target){	
	el.innerHTML = Layout( {model: model, item: item } );
}

module.exports = init;
init.render = render;