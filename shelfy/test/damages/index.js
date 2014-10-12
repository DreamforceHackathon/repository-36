var Layout = require("./code/layout");
var Item = require("./code/item");
var Opp = require("./code/models/oportunity");
var Account = require("./code/models/account");

var Year = require("./code/year");

var Detail = require("./code/detail");

var Ajax = require("3vot-model/lib/3vot-model-vfr-sfc");
document.domain = "force.com"

window.start = function(token){
	Ajax.token = token;

	var container = document.querySelector("._3vot")
	container.innerHTML = Layout();

	var oppList = container.querySelector(".oppList");

	var namePlaceholder = container.querySelector(".name")

	oppList.onclick = function(e){

		if(e.target.classList.contains("product-item")){
			console.log(e.target.dataset)
			var opp = Opp.find(e.target.dataset.id)
			
			Detail(container,opp );
		}
		else return false
	}
	
	Account.query("select id,name from Account where sfc_token__c = '"+ token  +"'")
	.then(function(){ namePlaceholder.innerHTML = Account.first().Name })

	Opp.query("select id , Name,CloseDate from Opportunity where CloseDate > 2013-01-01 order by CloseDate desc" )
	.then(function(){

		var map = Opp.group();

		renderYear("2014")
		renderYear("2013")

		function renderYear(year){
			var opps = map[year];
			oppList.innerHTML += Year(year)

			for (var i = opps.length - 1; i >= 0; i--) {
				oppList.innerHTML += Item(opps[i])
			};
		}

		

	})




}




start('abc');