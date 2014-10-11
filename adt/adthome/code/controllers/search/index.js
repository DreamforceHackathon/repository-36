var el;
var Layout = require("./view")

function init(target){

	el= document.getElementById(target);
	el.innerHTML = Layout();

	var input = el.querySelector("input");
	input.onchange = input_onChange;

	var back = el.querySelector(".js_back_btn")
	back.style.display=  "none"
	back.onclick = onBackClick

	init.backBtn = back;

	init.el = el;
}

function input_onChange(e){
	var searchString = e.target.value;
	search(searchString);
	return true;
}

function search(name){
	DataModel.query("select "+window.fields.account.join(",")+" from Account");
}

function onBackClick(){
	DataModel.trigger("list");
}

module.exports = init;