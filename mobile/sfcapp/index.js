var Ajax = require("3vot-model/lib/3vot-model-vfr");
Ajax.token = "abc";

var FastClick = require('fastclick');
FastClick(document.body);

var container = document.querySelector("._3vot");

var Manager = require("./code/manager");
var manager = new Manager(container);

//var Account = require("./code/models/account");

