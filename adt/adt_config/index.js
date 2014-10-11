var Ajax = require("3vot-model/lib/3vot-model-vfr");

var Account = require("./code/models/account");

Account.query("select id,name from account")
.then( function(){ console.log(Account.all()) } )
.fail( function(err){ console.log(err);} )
