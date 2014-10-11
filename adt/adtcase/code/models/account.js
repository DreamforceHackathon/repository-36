var _3Model = require("3vot-model")
var Ajax = require("3vot-model/lib/3vot-model-vfr-sfc");

Account = _3Model.setup("Account", ["id","name"]);
Account.ajax = Ajax;

module.exports= Account