var Ajax = require("3vot-model/lib/3vot-model-vfr-sfc");
Ajax.token = "abc";

var Account = require("./code/models/account");

Account.query("select id,name from account")
.then( function(){ document.querySelector("._3vot").innerHTML  = JSON.stringify(Account.all()); } )
.fail( function(err){ console.log(err);} )
