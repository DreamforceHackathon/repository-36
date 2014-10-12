var Layout = require("./code/layout");
var Item = require("./code/item");
var Account = require("./code/models/account");

var Case = require("./code/models/case");

var Year = require("./code/year");

var Detail = require("./code/detail");

var Ajax = require("3vot-model/lib/3vot-model-vfr-sfc");
document.domain = "force.com"

var types = [];

window.start = function(token){
	Ajax.token = token;

	var container = document.querySelector("._3vot")
	container.innerHTML = Layout();


	var btn = container.querySelector(".button_click");
	btn.onclick = function(e){
		if(!e.target.classList.contains('button_click')) return false;
		e.target.classList.add("clicked")
		types.push(e.target.dataset.type)
		reportPick();
		btn.onclick = function(){}
	}

	function reportPick(){

			var account = Account.first()		
			
			Case.create({ 
				"Type": "Order",
				"Subject": "Send Pizza to Latitude:37.801429°, Longitude:-122.433081°",
				"Origin":"Customer App",
				"AccountId": account.id
			 })

	}


	Account.query("select id,name from Account where sfc_token__c = '"+ token  +"'")
	.then(function(){ namePlaceholder.innerHTML = Account.first().Name })

}




start('abc');