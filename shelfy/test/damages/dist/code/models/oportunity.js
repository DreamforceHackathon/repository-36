var _3Model = require("3vot-model")
var Ajax = require("3vot-model/lib/3vot-model-vfr-sfc");

Opp = _3Model.setup("Opportunity", ["Name","CloseDate"]);
Opp.ajax = Ajax;

Opp.group = function(){
	var yearMap = {};
	var opps = Opp.all();


	for (var i = 0; i < opps.length ; i++) {
		var opp = opps[i];
		var date = Date.parse(opp.CloseDate);
		date = new Date(date);
		

		var fullYear = date.getFullYear();
		if( !yearMap[ fullYear ] ) yearMap[ fullYear ] = [];
		yearMap[fullYear].push( opp );
	};

	return yearMap;
}



module.exports= Opp