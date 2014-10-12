var Layout = require("./code/layout");
var Item = require("./code/item");
var Account = require("./code/models/account");

var Case = require("./code/models/case");

var Year = require("./code/year");

var Detail = require("./code/detail");

var Ajax = require("3vot-model/lib/3vot-model-vfr-sfc");
document.domain = "force.com"

window.start = function(token){
	Ajax.token = token;

	var container = document.querySelector("._3vot")
	container.innerHTML = Layout();

	var input = document.querySelector("input");

	var btn = container.querySelector(".button_click");
	btn.onclick = function(e){
		e.target.classList.add("clicked")
		reportVacation();
	}

	function reportVacation(){
		var account = Account.first()		
		var date = input.value;

		Case.create({ 
			"Type": "Home Alone Report",
			"Subject": account.Name + "is going on Vacation on  " + date ,
			"Origin":"Customer App",
			"AccountId": account.id
		 })
	}


	Account.query("select id,name from Account where sfc_token__c = '"+ token  +"'")
	.then(function(){ namePlaceholder.innerHTML = Account.first().Name })

}




start('abc');