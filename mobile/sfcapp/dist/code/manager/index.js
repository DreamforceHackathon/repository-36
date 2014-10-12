var container;

var sfcStore = require("../models/sfcStore");

var Ajax = require("3vot-model/lib/3vot-model-vfr");

function Manager(container_param){
	var manager = this;
	this.container= container_param;

	var SplashController = require("../controllers/splash");
	var CompaniesController = require("../controllers/companies");
	var SearchCompanyController = require("../controllers/searchCompany");
	var CompanyStoreController = require("../controllers/companyStore");
	var LoginController = require("../controllers/login")

	this.companiesController = new CompaniesController();
	this.searchCompanyController = new SearchCompanyController();
	this.companyStoreController = new CompanyStoreController();
	this.loginController = new LoginController();
	this.splashController = new SplashController();

	this.companiesController.on("ADD_COMPANY", function(){ manager.showController( manager.searchCompanyController )  });

	this.companiesController.on("SELECT_COMPANY", function(id){
		sfcStore.current = sfcStore.find(id);

		manager.companyStoreController.activate();
		manager.showController( manager.companyStoreController );  
	});

	this.searchCompanyController.on("SELECT_COMPANY", function(id){ 
		var company = Company.find(id);
		var found = sfcStore.findByAttribute("Name", company.Name)
		if( found == null ) sfcStore.current = sfcStore.create({ Name: company.Name, Apiurl: company.apiurl__c, Logo: company.Logo__c });
		else{
			found.Apiurl = company.apiurl__c;
			found.save();
			sfcStore.current = found;
		}
		manager.loginController.activate()
		manager.showController( manager.loginController )  
	});

	this.loginController.on("LOGIN_COMPLETE", function(response){
		sfcStore.current.Token = response.sfc_token__c;
		response.sfc_apps__c = response.sfc_apps__c || '{apps:[]}'
		if(response.sfc_apps__c=='') response.sfc_apps__c = '{apps:[]}';
		
		try{
		sfcStore.current.Apps = JSON.parse( response.sfc_apps__c ).apps;
		}catch(e){sfcStore.current.Apps = [];}
		
		sfcStore.current.save()
		
		manager.showController(manager.companiesController);
		manager.companiesController.render();
		
		sfcStore.current=null;
	})

	this.searchCompanyController.on("BACK", function(){
	 	manager.showController( manager.companiesController );
	});

	this.loginController.on("BACK", function(){
		console.log("back")
	 	manager.showController( manager.searchCompanyController );
	});

	this.companyStoreController.on("BACK", function(){
		console.log(manager.companyStoreController)
	 	manager.showController( manager.companiesController );
	});

	this.initialAnimation();

}

Manager.prototype.showController = function(controller){
	while (this.container.firstChild) {
    this.container.removeChild(this.container.firstChild);
	}
	this.container.appendChild( controller.el );
	this.currentContainer = controller;
}

Manager.prototype.initialAnimation  = function(){
	var manager = this;

	this.showController(this.splashController);
	setTimeout(function(){
		manager.showController(manager.companiesController);
	},2.5)


}


module.exports = Manager;