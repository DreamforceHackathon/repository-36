var _3Model = require("3vot-model")
var Ajax = require("3vot-model/lib/3vot-model-vfr-sfc");

Case = _3Model.setup("Case", ["Type","Subject","RecordTypeId","Origin","AccountId","Description"]);
Case.ajax = Ajax;



module.exports= Case