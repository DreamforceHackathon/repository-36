//STORE IS IN SF COMPANY AND IT'S RETREIVED AT LOGIN

//APPS ARE UPDATED ON STORE ENTER

//THIS IS IN LOCALSTORAGE

var Local = {
  extended: function() {
    this.change(this.saveLocal);
    return this.fetch(this.loadLocal);
  },
  saveLocal: function() {
    var result;
    result = JSON.stringify(this);
    return localStorage[this.className] = result;
  },
  loadLocal: function(options) {
    var result;
    if (options == null) {
      options = {};
    }
    if (!options.hasOwnProperty('clear')) {
      options.clear = true;
    }
    result = localStorage[this.className];
    return this.refresh(result || [], options);
  }
};

var _3Model = require("3vot-model")

SfcStore = _3Model.setup("SfcStore", ["Name","Logo","Apiurl","Apps","Token"]);
SfcStore.extend(Local);

SfcStore.prototype.loadFromCompany = function(){
	//MAKE CALL
}

module.exports= SfcStore



