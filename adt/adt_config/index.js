var Ajax = require("3vot-model/lib/3vot-model-vfr");

var superagent = require("superagent")

var container = document.querySelector("._3vot")

container.innerHTML = require("./code/layout")()

var Api = {};
Api.notification = container.querySelector(".notification")
Api.appsBox = container.querySelector(".apps-box");

Api.domain = container.querySelector(".txt-domain");
Api.url = container.querySelector(".txt-url");
Api.logo = container.querySelector(".txt-logo");

container.querySelector(".btn-reset-token").onclick = function(){
	Api.resetAccounts();
}

container.querySelector(".btn-app-config").onclick = function(){
	Api.appConfig();
}

container.querySelector(".btn-register").onclick = function(){
	Api.register();
}

Api.resetAccounts = function(){

		Visualforce.remoting.Manager.invokeAction(
	    'SFC_External_Controller.resetTokens',
	    handleResult,
	    { buffer: false, escape: false, timeout: 30000 }
		);

	function handleResult(result, event){
		Api.showNotification("Accounts have been provided with a Secure Token, they can Login.")
	 } 

}

Api.appConfig = function(json){

		Visualforce.remoting.Manager.invokeAction(
	    'SFC_External_Controller.appConfig',
	    Api.appsBox.value,
	    handleResult,
	    { buffer: false, escape: false, timeout: 30000 }
		);

	function handleResult(result, event){
		Api.showNotification("Applications have configured for all Accounts.")
	 } 
}


Api.register = function(json){
	var credentials= {
		domain: Api.domain.value,
		url: Api.url.value,
		logo: Api.logo.value
	}
	var url = 'https://jsonp.nodejitsu.com/?url=https://sfccontrolcenter-developer-edition.na17.force.com/api/services/apexrest/sfc?domain='+JSON.stringify(credentials);
	var that = this;
  superagent.get(url).end(function(res){
    var parsed = JSON.parse(res.body);

		Api.showNotification("Domain Registered, for changes please contact us.")
  })
}

Api.showNotification = function(message){
	Api.notification.classList.add("show")
	Api.notification.innerHTML = message;
		setTimeout(function(){
			Api.notification.innerHTML=""
			Api.notification.classList.remove("show")
		}, 2500)
}