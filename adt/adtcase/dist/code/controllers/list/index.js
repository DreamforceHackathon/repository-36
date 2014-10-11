var Layout = require("./view")
var Item = require("./item")
var ListViewItem = require("./listViewItem")

var Detail = require("./detail")
var Loading = require("./loading")
var NotFound = require("./notfound")

var Sf1Fields = require("../../models/sf1fields");
var ListView = require("../../models/listView");
var ListViewResults = require("../../models/listViewResults");

var domify = require('domify');

var _3Model = require("3vot-model")
var Ajax = require("3vot-model/lib/3vot-model-vfr");

var ItemList = function(){
	var that = this;
	this.models = {}
	
	this.el = domify( Layout() );
	
	this.ul = this.el.querySelector(".list-items");
	this.ulListViews = this.el.querySelector(".list-views");
	this.search = this.el.querySelector("input");
	this.label = this.el.querySelector(".label");

	this.ul.onclick = function(e){
		that.onItemClick(e);
	}

	this.ulListViews.onclick = function(e){
		that.onListViewClick(e);
	}

	this.search.onchange = function(e){
		that.onSearch(e);
	}

	this.el.querySelector(".btn-back").onclick = function(){
		Sf1Fields.trigger("BACK_SELECTED");
	}

	ListViewResults.bind("refresh",function(){
		that.render( ListViewResults.all() );
	})

	ListView.bind("refresh", function(){

		that.ulListViews.innerHTML = ""
		var src = ""
		var views = ListView.all();
		for (var i = views.length - 1; i >= 0; i--) {
			var view = views[i];
			src += ListViewItem(view);
		};
		that.ulListViews.innerHTML = src;
	})
}

ItemList.prototype.setupModel = function(objectName){
	var that = this;

	this.objectName = objectName;
	this.objectFields  = Sf1Fields.getFields(this.objectName);
	this.fieldNames = Sf1Fields.fieldsToNames(this.objectFields);

	ListView.getViews(this.objectName);

	this.label.innerHTML = this.objectName;

	this.ul.innerHTML = Loading();
	this.ulListViews.innerHTML = Loading();

	if( this.models[this.objectName] ) return this.model = this.models[this.objectName];

	this.model = _3Model.setup(this.objectName, this.fieldNames.join(",")  );
	this.model.ajax = Ajax;
	this.model.ajax.namespace = "threevot_apps."

	this.model.objectName = this.objectName;
	this.model.objectFields = this.objectFields;
	this.model.fieldNames = this.fieldNames;

	this.models[this.objectName] = this.model;

	this.model.bind("refresh", function(){ that.render(); });

	this.model.getRecords = function(objectName, fields, viewId){

		Visualforce.remoting.Manager.invokeAction(
	    'threevot_apps.sfafields.ListViewRecords',
	    objectName,
	    fields,
	    viewId,
	    handleResult,
	    { buffer: false, escape: false, timeout: 30000 }
		);

		function handleResult(result, event){
			that.model.destroyAll({ignoreAjax: true});
			that.model.refresh(result);
	 	} 
	}
}

ItemList.prototype.query = function(type, value){
	this.model.destroyAll({ ignoreAjax: true});
	var that = this;
	if(!type) return this.model.query("select " + this.fieldNames.join(",") + " from " + this.objectName + " order by LastModifiedDate limit 10" )
		.fail(function(){ that.model.refresh([]); console.error(arguments[0].message);  })
	var where = " where Name LIKE '%" + value + "%'"
	this.model.query("select " + this.fieldNames.join(",") + " from " + this.objectName + where )
}


ItemList.prototype.render = function(results){
	this.ul.innerHTML = "";
	var items = results || this.model.all();
	var mainField = this.getMainField();
	if(items.length == 0 ) return this.ul.innerHTML+= NotFound();

	for (var i = items.length - 1; i >= 0; i--) {
		var item = items[i];
		item.sf1fields_mainField = mainField;
		this.ul.innerHTML+= Item(item);
	};
}

ItemList.prototype.getMainField = function(){
	if( this.fieldNames.indexOf("Name") > -1) return "Name";
	for (var i = 0; i < this.fieldNames.length; i++) {
		var fieldName = this.fieldNames[i];
		if(fieldName != "id" && fieldName != "Id") return fieldName;
	};
	return "id";
}

ItemList.prototype.onItemClick = function(e){
	var target  = e.target;
	if(target.classList.contains("btn-view-id")) return sforce.one.navigateToSObject( target.dataset.id );

	while(target.classList.contains("list-item") == false) target = target.parentNode;

	// if( target.querySelector(".detail-view") ) return false;

	//Check and Toggle
	var detailView = target.querySelector(".detail-view"); 
	if( detailView ){
		target.querySelector(".icon").classList.remove("icon-arrow-up");
		return target.removeChild(detailView);
	}else{
		target.querySelector(".icon").classList.add("icon-arrow-up")
	}
	
	var id = e.target.dataset.id;
	var item = this.model.find(id);
	var renderValues = {model: this.model, item: item } ;

	target.appendChild( domify( Detail( renderValues ) ) );
}

ItemList.prototype.onListViewClick = function(e){
	var target  = e.target;
	var id = e.target.dataset.id;
	this.model.getRecords( this.objectName, this.fieldNames.join(","), id );
}

ItemList.prototype.onSearch = function(e){
	this.ul.innerHTML = Loading();
	var target  = e.target;
	this.query( "name", target.value );
}

module.exports = ItemList;