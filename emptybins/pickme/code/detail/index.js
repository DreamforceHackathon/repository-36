var Layout = require("./detail")

var Account = require("../models/account");
var Case = require("../models/case");


function Detail(container, product){
	container.innerHTML = Layout(product);


	var reportbtn = container.querySelector("#reportbtn");
	var askbtn = container.querySelector("#askbtn");
	var thanksbtn = container.querySelector("#thanksbtn");
	var description = container.querySelector("textarea");

	reportbtn.onclick = function(e){
		e.target.style.display = "none";
		askbtn.style.display = "block"
	}

	askbtn.onclick = function(e){
		askbtn.style.display = "none";	
		thanksbtn.style.display = "block";
		var type = e.target.dataset.type;
		createCase(type);
	}

	function createCase(type){

		Case.create({ 
			"Description": description.value,
			"Type": type,
			"Subject": "Damage reporte for " + product.Name  ,
			"Origin":"Customer App",
			"AccountId": Account.first().id
		 })

	}


}





module.exports = Detail;