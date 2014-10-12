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

	var input = document.querySelector("input");

	var btn = container.querySelector(".button_click");
	btn.onclick = function(e){
		e.target.classList.add("clicked")
		types.push(e.target.dataset.type)
		reportPick();
	}

	function reportPick(){

		setTimeout(function(){

			var account = Account.first()		
			
			Case.create({ 
				"Type": "Empty the Bins!",
				"Subject": "Pick up " + types.join(",") + " for " + account.Name,
				"Origin":"Customer App",
				"AccountId": account.id
			 })

		},1000)


	}


	Account.query("select id,name from Account where sfc_token__c = '"+ token  +"'")
	.then(function(){ namePlaceholder.innerHTML = Account.first().Name })

}




start('abc');