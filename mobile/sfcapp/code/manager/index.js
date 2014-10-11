var container;

var sfcStore = require("../models/sfcStore");


function Manager(container_param){
	var manager = this;
	this.container= container_param;

	var CompaniesController = require("../controllers/companies");
	var SearchCompanyController = require("../controllers/searchCompany");
	var CompanyStoreController = require("../controllers/companyStore");
	var LoginController = require("../controllers/login")

	this.companiesController = new CompaniesController();
	this.searchCompanyController = new SearchCompanyController();
	this.companyStoreController = new CompanyStoreController();
	this.loginController = new LoginController();

	this.companiesController.on("ADD_COMPANY", function(){ manager.showController( manager.searchCompanyController )  });

	this.companiesController.on("SELECT_COMPANY", function(id){
		sfcStore.current = sfcStore.find(id);
		manager.showController( manager.companyStoreController );  
		manager.companyStoreController.activate();
	});

	this.searchCompanyController.on("SELECT_COMPANY", function(id){ 
		var company = Company.find(id);
		var found = sfcStore.findByAttribute("Name", company.Name)
		if( found == null ) sfcStore.current = sfcStore.create({ Name: company.Name, Apiurl: company.apiurl__c });
		else{
			found.Apiurl = company.apiurl__c;
			found.save();
			sfcStore.current = found;
		}
		manager.showController( manager.loginController )  
	});




	this.loginController.on("LOGIN_COMPLETE", function(response){
		sfcStore.current.Token = response.sfc_token__c;
		response.sfc_apps__c = response.sfc_apps__c || '{apps:[]}'
		if(response.sfc_apps__c=='') response.sfc_apps__c = '{apps:[]}';
		
		
		sfcStore.current.Apps = JSON.parse( response.sfc_apps__c ).apps;
		sfcStore.current.Logo = response.Logo;
		
		sfcStore.current.save()
		manager.showController(manager.companiesController);
		manager.companiesController.render();
		sfcStore.current=null;
	})

	this.searchCompanyController.on("BACK", function(){
	 	manager.showController( manager.companiesController );
	});

	this.companyStoreController.on("BACK", function(){
	 	manager.showController( manager.companiesController );
	});

	this.showController(this.companiesController);
}

Manager.prototype.showController = function(controller){
	while (this.container.firstChild) {

    this.container.removeChild(this.container.firstChild);
	}

	this.container.appendChild( controller.el );
	this.currentContainer = controller;
}

module.exports = Manager;