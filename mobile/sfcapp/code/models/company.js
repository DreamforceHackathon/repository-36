//COMPANY IS IN SFC CONTROL CENTER

var _3Model = require("3vot-model")

Company = _3Model.setup("Company", ["name","apiurl__c","logo"]);


Company.fetch = function(objectName){

		Visualforce.remoting.Manager.invokeAction(
	    'SFC_Admin_Controller.getCompanies',
	    handleResult,
	    { buffer: false, escape: false, timeout: 30000 }
		);

	function handleResult(result, event){
		Company.destroyAll();
		if(!result || event.status==false) return Company.refresh([]);
		//var parsedResults = JSON.parse(result)
	 	Company.refresh(result);
	 } 

}


module.exports= Company