var Ajax = require("3vot-model/lib/3vot-model-vfr");
document.domain = "force.com"
	var Account = require("./code/models/account");

var created;
window.start = function(token){
	Ajax.token = token;

	Account.query("select id,name from account")
	.then( function(){ console.log("query ok"); testCreate(); } )
	.fail( function(err){ console.log(err);} )

}

function testCreate(){
	Account.create({ Name: "mycacun" })
	.then( function(){ console.log("create ok"); testUpdate() } )
}

function testUpdate(){
	Account.first().Name = 'other name';
	Account.first().save()
	.then(function(){ console.log("update ok"); })
}

//start('abc');