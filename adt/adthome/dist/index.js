(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
var _3Model = require("3vot-model")
var Ajax = require("3vot-model/lib/3vot-model-vfr");

Account = _3Model.setup("Account", ["id","name"]);
Account.ajax = Ajax;

module.exports= Account
},{"3vot-model":7,"3vot-model/lib/3vot-model-vfr":4}],3:[function(require,module,exports){
var Ajax = require("3vot-model/lib/3vot-model-vfr");
document.domain = "force.com"


window.start = function(token){
	Ajax.token = token;
	var Account = require("./code/models/account");

	Account.query("select id,name from account")
	.then( function(){ document.querySelector("._3vot").innerHTML  = JSON.stringify( Account.first()); } )
	.fail( function(err){ console.log(err);} )

}
},{"./code/models/account":2,"3vot-model/lib/3vot-model-vfr":4}],4:[function(require,module,exports){

var VFR= require("./3vot-vfr")

var Ajax = function(eventName, model, options){
  if(eventName == "create") return Ajax.post.call(this, model,options )
  else if(eventName == "update") return Ajax.put.call(this, model,options )
  else if(eventName == "destroy") return Ajax.del.call(this, model,options )
  
  //Sho
  var params = model;
  if(eventName == "query") return Ajax.query.call(this, params, options);  
  else if(eventName == "read") return Ajax.get.call(this, params, options);
  else if(eventName == "api") return Ajax.api.call(this, params, options);

}

Ajax.api = function(){
  if(!this.ajax.namespace) this.ajax.namespace = ""
  var args = Array.prototype.slice(arguments);
  var remoteAction = args[0];
  var callArgs = []
  for (var i = 1; i < args.length-1; i++) {
    callArgs.push(args[i]);
  };
  options = args[args.length-1];
  if(typeof remoteAction != "string" ) throw "First Argument should be the Remote Action (string)"
  if(options == remoteAction) options = {};

  var send = VFR( this.namespace + remoteAction, options, options.nullok || false );
  callArgs.push(Ajax.token);
  return send.apply( VFR, callArgs );
}

Ajax.query = function(params, options){
  if(!this.ajax.namespace) this.ajax.namespace =""

  var pctEncodeSpaces = true;
  var params = encodeURIComponent(params).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, pctEncodeSpaces ? '%20' : '+');
  
  var send = VFR(this.ajax.namespace + "SFC_Controller.handleRest" );
  return send( "get", "/query?query=" + params , "", Ajax.token )
  .then(function(results){ 
    for (var i = results.length - 1; i >= 0; i--) {
      results[i].id = results[i].Id
      delete results[i].Id;
    };
    return results;
   })
}

Ajax.get = function(id, options){
  if(!this.ajax.namespace) this.ajax.namespace =""

  var send = VFR(this.ajax.namespace + "SFC_Controller.handleRest" );
  return send( "get", Ajax.generateURL(this) + "/" + id, "", Ajax.token )
  .then(function(data){
    data.id = data.Id;
    delete results[i].Id;
    return data;
  });
}

Ajax.post = function(model, options){
  if(!model.ajax.namespace) model.namespace =""
  var _this = this;

  var id = this.id;
  this.id = null;
  var send = VFR(model.ajax.namespace + "SFC_Controller.handleRest" );
  return send( "post", Ajax.generateURL(model) , JSON.stringify(this.toJSON()), Ajax.token )
  .then( function(data){ _this.id = id; return data; } )
}

Ajax.put = function(model, options){
  if(!model.ajax.namespace) model.ajax.namespace =""

  var id = this.id;
  this.id = null;
  var _this = this;

  var send = VFR(model.ajax.namespace + "SFC_Controller.handleRest", {}, true );
  return send( "put", Ajax.generateURL(model, id ), JSON.stringify(this.toJSON()), Ajax.token )
  .then( function(data){ _this.id = id; return data; } )
}

Ajax.del = function(model, options){
  if(!model.ajax.namespace) model.ajax.namespace =""

  var send = VFR(model.ajax.namespace + "SFC_Controller.handleRest", {}, true );
  return send( "del", Ajax.generateURL(model, this.id ), "", Ajax.token );
}

Ajax.generateURL = function() {
  var args, collection, object, path, scope;
  object = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  collection = object.className;
  
  args.unshift(collection);
  args.unshift(scope);
  path = args.join('/');
  path = path.replace(/(\/\/)/g, "/");
  path = path.replace(/^\/|\/$/g, "");
  return "/"+path;
};

module.exports = Ajax;


},{"./3vot-vfr":5}],5:[function(require,module,exports){
var Q = require("kew");


  /*
   * Kevin o'Hara released premote, a nice lib for wrapping
   * visualforce remoting calls in a promise interface. this
   * function .send() is largely a gentle refactoring of his
   * work, found in "premote" here:
   *    https://github.com/kevinohara80/premote

  /*
   * Code Implementation and idea borrowed from Kevin Poorman
   * https://github.com/noeticpenguin/ngForce
   */
  /**
   * Returns a function that, when called, invokes the js
   * remoting method specified in this call.
   * @param  {String}   remoteAction class.methodName string representing the Apex className and Method to invoke
   * @param  {Object}   options      Object containing at least the timeout and escaping options. Passed to Remoting call
   * @param  {Boolean}  nullok       Can this method return null and it be OK?
   * @param  {Object}   visualforce  Used for Testing
   * @return {Function}              Function engaged with the NG execution loop, making Visualforce remoting calls.
   */
VisualforceRemoting = function(remoteAction, options, nullok) {
  //Injection for Testing
  if(VisualforceRemoting.Visualforce) Visualforce = VisualforceRemoting.Visualforce;
  
  if (typeof Visualforce != 'object') {
    throw new Error('Visualforce is not available globally!');
  }

  if(!options || options === {} ) options = VisualforceRemoting.standardOptions;

  var namespace, controller, method;
  var Manager = Visualforce.remoting.Manager;
  var remoteActionParts = remoteAction.split('.');
  var instance = this;
  
  return callToSend;

  function callToSend(){
    var deferred = Q.defer();
    var args;
    if (arguments.length) {
      args = Array.prototype.slice.apply(arguments);
    } else {
      args = [];
    }
    args.splice(0, 0, remoteAction);
    args.push(function(result, event) {
      VisualforceRemoting.handleResultWithPromise(result, event, nullok, deferred);
    });
    if (options) {
      args.push(options);
    }
    Manager.invokeAction.apply(Manager, args);

    return deferred.promise;
  }
}

VisualforceRemoting.handleResultWithPromise = function(result, event, nullok, deferred) {
  if (result) {
    if (typeof result !== 'object') {
      result = JSON.parse(result);
    }
    if (Array.isArray(result) && result.length > 0 && result[0].message && result[0].errorCode) {
      deferred.reject(result);
    } else {
      deferred.resolve(result);
    }
  } else if (typeof nullok !== 'undefined' && nullok) {
    deferred.resolve();
  } else {
    deferred.reject({
      message: 'Null returned by RemoteAction not called with nullOk flag',
      errorCode: 'NULL_RETURN'
    });
  }
}

VisualforceRemoting.standardOptions= {
    escape: false,
    timeout: 10000
}

module.exports = VisualforceRemoting;

},{"kew":9}],6:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
(function() {
  var Events, trim,
    __slice = [].slice;

  trim = function(text) {
    var rtrim, _ref;
    rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        if ((_ref = text === null) != null) {
      _ref;
    } else {
      ({
        "": (text + "").replace(rtrim, "")
      });
    };
    return text;
  };

  Events = {
    bind: function(ev, callback) {
      var calls, evs, name, _i, _len;
      evs = ev.split(' ');
      if (this.hasOwnProperty('_callbacks') && this._callbacks) {
        calls = this._callbacks;
      } else {
        this._callbacks = {};
        calls = this._callbacks;
      }
      for (_i = 0, _len = evs.length; _i < _len; _i++) {
        name = evs[_i];
        calls[name] || (calls[name] = []);
        calls[name].push(callback);
      }
      return this;
    },
    one: function(ev, callback) {
      var handler;
      return this.bind(ev, handler = function() {
        this.unbind(ev, handler);
        return callback.apply(this, arguments);
      });
    },
    trigger: function() {
      var args, callback, ev, list, _i, _len, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      ev = args.shift();
      list = this.hasOwnProperty('_callbacks') && ((_ref = this._callbacks) != null ? _ref[ev] : void 0);
      if (!list) {
        return;
      }
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        callback = list[_i];
        if (callback.apply(this, args) === false) {
          break;
        }
      }
      return true;
    },
    listenTo: function(obj, ev, callback) {
      obj.bind(ev, callback);
      this.listeningTo || (this.listeningTo = []);
      this.listeningTo.push({
        obj: obj,
        ev: ev,
        callback: callback
      });
      return this;
    },
    listenToOnce: function(obj, ev, callback) {
      var handler, listeningToOnce;
      listeningToOnce = this.listeningToOnce || (this.listeningToOnce = []);
      obj.bind(ev, handler = function() {
        var i, idx, lt, _i, _len;
        idx = -1;
        for (i = _i = 0, _len = listeningToOnce.length; _i < _len; i = ++_i) {
          lt = listeningToOnce[i];
          if (lt.obj === obj) {
            if (lt.ev === ev && lt.callback === callback) {
              idx = i;
            }
          }
        }
        obj.unbind(ev, handler);
        if (idx !== -1) {
          listeningToOnce.splice(idx, 1);
        }
        return callback.apply(this, arguments);
      });
      listeningToOnce.push({
        obj: obj,
        ev: ev,
        callback: callback,
        handler: handler
      });
      return this;
    },
    stopListening: function(obj, events, callback) {
      var ev, evts, i, idx, listeningTo, lt, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;
      if (arguments.length === 0) {
        _ref = [this.listeningTo, this.listeningToOnce];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          listeningTo = _ref[_i];
          if (!listeningTo) {
            continue;
          }
          for (_j = 0, _len1 = listeningTo.length; _j < _len1; _j++) {
            lt = listeningTo[_j];
            lt.obj.unbind(lt.ev, lt.handler || lt.callback);
          }
        }
        this.listeningTo = void 0;
        return this.listeningToOnce = void 0;
      } else if (obj) {
        _ref1 = [this.listeningTo, this.listeningToOnce];
        _results = [];
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          listeningTo = _ref1[_k];
          if (!listeningTo) {
            continue;
          }
          events = events ? events.split(' ') : [void 0];
          _results.push((function() {
            var _l, _len3, _results1;
            _results1 = [];
            for (_l = 0, _len3 = events.length; _l < _len3; _l++) {
              ev = events[_l];
              _results1.push((function() {
                var _m, _ref2, _results2;
                _results2 = [];
                for (idx = _m = _ref2 = listeningTo.length - 1; _ref2 <= 0 ? _m <= 0 : _m >= 0; idx = _ref2 <= 0 ? ++_m : --_m) {
                  lt = listeningTo[idx];
                  if ((!ev) || (ev === lt.ev)) {
                    lt.obj.unbind(lt.ev, lt.handler || lt.callback);
                    if (idx !== -1) {
                      _results2.push(listeningTo.splice(idx, 1));
                    } else {
                      _results2.push(void 0);
                    }
                  } else if (ev) {
                    evts = lt.ev.split(' ');
                    if (~(i = evts.indexOf(ev))) {
                      evts.splice(i, 1);
                      lt.ev = trim(evts.join(' '));
                      _results2.push(lt.obj.unbind(ev, lt.handler || lt.callback));
                    } else {
                      _results2.push(void 0);
                    }
                  } else {
                    _results2.push(void 0);
                  }
                }
                return _results2;
              })());
            }
            return _results1;
          })());
        }
        return _results;
      }
    },
    unbind: function(ev, callback) {
      var cb, evs, i, list, name, _i, _j, _len, _len1, _ref;
      if (arguments.length === 0) {
        this._callbacks = {};
        return this;
      }
      if (!ev) {
        return this;
      }
      evs = ev.split(' ');
      for (_i = 0, _len = evs.length; _i < _len; _i++) {
        name = evs[_i];
        list = (_ref = this._callbacks) != null ? _ref[name] : void 0;
        if (!list) {
          continue;
        }
        if (!callback) {
          delete this._callbacks[name];
          continue;
        }
        for (i = _j = 0, _len1 = list.length; _j < _len1; i = ++_j) {
          cb = list[i];
          if (!(cb === callback)) {
            continue;
          }
          list = list.slice();
          list.splice(i, 1);
          this._callbacks[name] = list;
          break;
        }
      }
      return this;
    }
  };

  Events.on = Events.bind;

  Events.off = Events.unbind;

  Events.emit = Events.trigger;

  module.exports = Events;

}).call(this);

},{}],7:[function(require,module,exports){
var Events = require("./events");

var Module = require("./module");

var ModelUtils = require("../utils/model")

var Model = (function() {
  Module.clone(Model,Module);

  Model.extend(Events);

  Model.records = [];

  Model.irecords = {};

  Model.attributes = [];

  Model.configure = function() {
    var attributes, name;
    name = arguments[0], attributes = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    this.className = name;
    this.deleteAll();
    if (attributes.length) {
      this.attributes = attributes;
    }
    this.attributes && (this.attributes = makeArray(this.attributes));
    this.attributes || (this.attributes = []);
    this.unbind();
    return this;
  };

  Model.toString = function() {
    return "" + this.className + "(" + (this.attributes.join(", ")) + ")";
  };

  Model.find = function(id, notFound) {
    if (notFound == null) {
      notFound = this.notFound;
    }
    var _ref = this.irecords[id]
    return (this.irecords[id] != null ? _ref.clone() : void 0) || (typeof notFound === "function" ? notFound(id) : void 0);
  };

  Model.findAll = function(ids, notFound) {
    var id, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      if (this.find(id, notFound)) {
        _results.push(this.find(id));
      }
    }
    return _results;
  };

  Model.notFound = function(id) {
    return null;
  };

  Model.exists = function(id) {
    return Boolean(this.irecords[id]);
  };

  Model.addRecord = function(record, options) {
    var _base, _base1, _name, _name1;
    if (options == null) {
      options = {};
    }
    if (record.id && this.irecords[record.id]) {
      this.irecords[record.id].remove(options);
      if (!options.clear) {
        record = this.irecords[record.id].load(record);
      }
    }
    record.id || (record.id = record.cid);
    if ((_base = this.irecords)[_name = record.id] == null) {
      _base[_name] = record;
    }
    if ((_base1 = this.irecords)[_name1 = record.cid] == null) {
      _base1[_name1] = record;
    }
    return this.records.push(record);
  };

  Model.refresh = function(values, options) {
    var record, records, result, _i, _len;
    if (options == null) {
      options = {};
    }
    if (options.clear) {
      this.deleteAll();
    }
    records = this.fromJSON(values);
    if (!isArray(records)) {
      records = [records];
    }
    for (_i = 0, _len = records.length; _i < _len; _i++) {
      record = records[_i];
      this.addRecord(record, options);
    }
    this.sort();
    result = this.cloneArray(records);
    this.trigger('refresh', result, options);
    return result;
  };

  Model.select = function(callback) {
    var record, _i, _len, _ref, _results;
    _ref = this.records;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      record = _ref[_i];
      if (callback(record)) {
        _results.push(record.clone());
      }
    }
    return _results;
  };

  Model.findByAttribute = function(name, value) {
    var record, _i, _len, _ref;
    _ref = this.records;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      record = _ref[_i];
      if (record[name] === value) {
        return record.clone();
      }
    }
    return null;
  };

  Model.findAllByAttribute = function(name, value) {
    return this.select(function(item) {
      return item[name] === value;
    });
  };

  Model.each = function(callback) {
    var record, _i, _len, _ref, _results;
    _ref = this.records;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      record = _ref[_i];
      _results.push(callback(record.clone()));
    }
    return _results;
  };

  Model.all = function() {
    return this.cloneArray(this.records);
  };

  Model.slice = function(begin, end) {
    if (begin == null) {
      begin = 0;
    }
    return this.cloneArray(this.records.slice(begin, end));
  };

  Model.first = function(end) {
    var _ref;
    if (end == null) {
      end = 1;
    }
    if (end > 1) {
      return this.cloneArray(this.records.slice(0, end));
    } else {
      return (_ref = this.records[0]) != null ? _ref.clone() : void 0;
    }
  };

  Model.last = function(begin) {
    var _ref;
    if (typeof begin === 'number') {
      return this.cloneArray(this.records.slice(-begin));
    } else {
      return (_ref = this.records[this.records.length - 1]) != null ? _ref.clone() : void 0;
    }
  };

  Model.count = function() {
    return this.records.length;
  };

  Model.deleteAll = function() {
    this.records = [];
    return this.irecords = {};
  };

  Model.destroyAll = function(options) {
    var record, _i, _len, _ref, _results;
    _ref = this.records;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      record = _ref[_i];
      _results.push(record.destroy(options));
    }
    return _results;
  };

  Model.update = function(id, atts, options) {
    return this.find(id).updateAttributes(atts, options);
  };

  Model.create = function(atts, options) {
    var record;
    record = new this(atts);
    return record.save(options);
  };

  Model.destroy = function(id, options) {
    return this.find(id).destroy(options);
  };

  Model.change = function(callbackOrParams) {
    if (typeof callbackOrParams === 'function') {
      return this.bind('change', callbackOrParams);
    } else {
      return this.trigger.apply(this, ['change'].concat(__slice.call(arguments)));
    }
  };

  Model.fetch = function(callbackOrParams) {
    if (typeof callbackOrParams === 'function') {
      return this.bind('fetch', callbackOrParams);
    } else {
      return this.trigger.apply(this, ['fetch'].concat(__slice.call(arguments)));
    }
  };

  Model.toJSON = function() {
    return this.records;
  };

  Model.fromJSON = function(objects) {
    var value, _i, _len, _results;
    if (!objects) {
      return;
    }
    if (typeof objects === 'string') {
      objects = JSON.parse(objects);
    }
    if (isArray(objects)) {
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        value = objects[_i];
        if (value instanceof this) {
          _results.push(value);
        } else {
          _results.push(new this(value));
        }
      }
      return _results;
    } else {
      if (objects instanceof this) {
        return objects;
      }
      return new this(objects);
    }
  };

  Model.fromForm = function() {
    var _ref;
    return (_ref = new this).fromForm.apply(_ref, arguments);
  };

  Model.sort = function() {
    if (this.comparator) {
      this.records.sort(this.comparator);
    }
    return this;
  };

  Model.cloneArray = function(array) {
    var value, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      value = array[_i];
      _results.push(value.clone());
    }
    return _results;
  };

  Model.idCounter = 0;

  Model.uid = function(prefix) {
    var uid;
    if (prefix == null) {
      prefix = '';
    }
    uid = prefix + this.idCounter++;
    if (this.exists(uid)) {
      uid = this.uid(prefix);
    }
    return uid;
  };

  function Model(atts) {
    Model.__super__.constructor.apply(this, arguments);
    if ((this.constructor.uuid != null) && typeof this.constructor.uuid === 'function') {
      this.cid = this.constructor.uuid();
      if (!this.id) {
        this.id = this.cid;
      }
    } else {
      this.cid = (atts != null ? atts.cid : void 0) || this.constructor.uid('c-');
    }
    if (atts) {
      this.load(atts);
    }
  }

  Model.prototype.isNew = function() {
    return !this.exists();
  };

  Model.prototype.isValid = function() {
    return !this.validate();
  };

  Model.prototype.validate = function() {};

  Model.prototype.load = function(atts) {
    var key, value;
    if (atts.id) {
      this.id = atts.id;
    }
    for (key in atts) {
      value = atts[key];
      if (typeof this[key] === 'function') {
        if (typeof value === 'function') {
          continue;
        }
        this[key](value);
      } else {
        this[key] = value;
      }
    }
    return this;
  };

  Model.prototype.attributes = function() {
    var key, result, _i, _len, _ref;
    result = {};
    _ref = this.constructor.attributes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      if (key in this) {
        if (typeof this[key] === 'function') {
          result[key] = this[key]();
        } else if(this[key] != null){
          result[key] = this[key];
        }
      }
    }
    if (this.id) {
      result.id = this.id;
    }
    return result;
  };

  Model.prototype.eql = function(rec) {
    return rec && rec.constructor === this.constructor && ((rec.cid === this.cid) || (rec.id && rec.id === this.id));
  };



  Model.prototype.stripCloneAttrs = function() {
    var key, value;
    if (this.hasOwnProperty('cid')) {
      return;
    }
    for (key in this) {
      if (!__hasProp.call(this, key)) continue;
      value = this[key];
      if ([].indexOf.call(this.constructor.attributes, key) >= 0) {
        delete this[key];
      }
    }
    return this;
  };

  Model.prototype.updateAttribute = function(name, value, options) {
    var atts;
    atts = {};
    atts[name] = value;
    return this.updateAttributes(atts, options);
  };

  Model.prototype.updateAttributes = function(atts, options) {
    this.load(atts);
    return this.save(options);
  };

  Model.prototype.changeID = function(id) {
    var records;
    if (id === this.id) {
      return;
    }
    records = this.constructor.irecords;
    records[id] = records[this.id];
    if (this.cid !== this.id) {
      delete records[this.id];
    }
    this.id = id;
    return this.save({ignoreAjax: true});
  };

  Model.prototype.remove = function(options) {
    var i, record, records, _i, _len;
    if (options == null) {
      options = {};
    }
    records = this.constructor.records.slice(0);
    for (i = _i = 0, _len = records.length; _i < _len; i = ++_i) {
      record = records[i];
      if (!(this.eql(record))) {
        continue;
      }
      records.splice(i, 1);
      break;
    }
    this.constructor.records = records;
    if (options.clear) {
      delete this.constructor.irecords[this.id];
      return delete this.constructor.irecords[this.cid];
    }
  };



  Model.prototype.dup = function(newRecord) {
    var atts;
    if (newRecord == null) {
      newRecord = true;
    }
    atts = this.attributes();
    if (newRecord) {
      delete atts.id;
    } else {
      atts.cid = this.cid;
    }
    return new this.constructor(atts);
  };

  Model.prototype.clone = function() {
    return createObject(this);
  };

  Model.prototype.reload = function() {
    var original;
    if (this.isNew()) {
      return this;
    }
    original = this.constructor.find(this.id);
    this.load(original.attributes());
    return original;
  };



  Model.prototype.toJSON = function() {
    return this.attributes();
  };

  Model.prototype.toString = function() {
    return "<" + this.constructor.className + " (" + (JSON.stringify(this)) + ")>";
  };

  Model.prototype.fromForm = function(form) {
    var checkbox, key, name, result, _i, _j, _k, _len, _len1, _len2, _name, _ref, _ref1, _ref2;
    result = {};
    _ref = $(form).find('[type=checkbox]:not([value])');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      checkbox = _ref[_i];
      result[checkbox.name] = $(checkbox).prop('checked');
    }
    _ref1 = $(form).find('[type=checkbox][name$="[]"]');
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      checkbox = _ref1[_j];
      name = checkbox.name.replace(/\[\]$/, '');
      result[name] || (result[name] = []);
      if ($(checkbox).prop('checked')) {
        result[name].push(checkbox.value);
      }
    }
    _ref2 = $(form).serializeArray();
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      key = _ref2[_k];
      result[_name = key.name] || (result[_name] = key.value);
    }
    return this.load(result);
  };

  Model.prototype.exists = function() {
    return this.constructor.exists(this.id);
  };

  Model.prototype.refresh = function(data) {
    var root;
    root = this.constructor.irecords[this.id];
    root.load(data);
    this.trigger('refresh');
    return this;
  };

  Model.prototype.save = function(options) {
    var error, record;
    if (options == null) {
      options = {};
    }
    if (options.validate !== false) {
      error = this.validate();
      if (error) {
        this.trigger('error', error);
        return false;
      }
    }
    this.trigger('beforeSave', options);
    record = this.isNew() ? this.create(options) : this.update(options);
    this.stripCloneAttrs();
    this.trigger('save', options);
    return record;
  };

  Model.query = function(params,options){
    var _this = this;
    if(this.ajax) return this.ajax.call(this, 'query', params, options )
      .then(function(responseData){ 
        _this.refresh(responseData); 
        return responseData; 
      });
    throw "Ajax Module not defined"
  }

  Model.read = function(id, options){
    var _this = this;
    if(this.ajax) return this.ajax.call(this, 'read', id, options )
      .then(function(data){ 
        var instance = _this.exists(id);
        if(instance){ instance.refresh(data); return instance; } 
        return _this.create(data, { ignoreAjax: true }); 
      });
    throw "Ajax Module not defined"
  }

  Model.api = function(){
    var _this = this;
    if(this.ajax && this.ajax.api) return this.ajax.api.apply(this, arguments )
    throw "Ajax Module or api method not defined"
  }

  Model.prototype.create = function(options) {
    if(!options) options = {};
    var clone, record;
    var _this = this;
    this.trigger('beforeCreate', options);
    this.id || (this.id = this.cid);
    record = this.dup(false);
    var parentModel = this.constructor;
    parentModel.addRecord(record);
    parentModel.sort();
    clone = record.clone();
    clone.trigger('create', options);
    clone.trigger('change', 'create', options);


    if(parentModel.ajax && !options.ignoreAjax) return parentModel.ajax.call(clone, 'create', this.constructor, options )
      .then(function(data){ 
        if (!(ModelUtils.isBlank(data) || _this.destroyed)) {
          if (data.id && _this.id !== data.id) {
            _this.changeID(data.id);
          }
          _this.refresh(data);

          return _this;
        }
      });

    return clone;
  };


  Model.prototype.update = function(options) {
    if(!options) options = {};
    var _this = this;
    var clone, records;
    this.trigger('beforeUpdate', options);
    records = this.constructor.irecords;
    var parentModel = this.constructor;

    records[this.id].load(this.attributes());
    this.constructor.sort();
    clone = records[this.id].clone();
    clone.trigger('update', options);
    clone.trigger('change', 'update', options);
    if(parentModel.ajax  && !options.ignoreAjax) return parentModel.ajax.call(clone, 'update', this.constructor, options )
      .then(function(data){ if(data){_this.refresh(data)}; return clone; });

    return clone;
  };

  Model.prototype.destroy = function(options) {
    if (options == null) options = {};
    if (options.clear == null) options.clear = true;
    var _this = this;
    var parentModel = this.constructor;
    this.trigger('beforeDestroy', options);
    this.remove(options);
    this.destroyed = true;
    this.trigger('destroy', options);
    this.trigger('change', 'destroy', options);
    if (this.listeningTo) {
      this.stopListening();
    }
    this.unbind();
    if(parentModel.ajax  && !options.ignoreAjax) return parentModel.ajax.call(this, 'destroy', this.constructor, options )
      .then(function(){ return _this; });
    return this;
  };

  Model.prototype.bind = function(events, callback) {
    var binder, singleEvent, _fn, _i, _len, _ref;
    this.constructor.bind(events, binder = (function(_this) {
      return function(record) {
        if (record && _this.eql(record)) {
          return callback.apply(_this, arguments);
        }
      };
    })(this));
    _ref = events.split(' ');
    _fn = (function(_this) {
      return function(singleEvent) {
        var unbinder;
        return _this.constructor.bind("unbind", unbinder = function(record, event, cb) {
          if (record && _this.eql(record)) {
            if (event && event !== singleEvent) {
              return;
            }
            if (cb && cb !== callback) {
              return;
            }
            _this.constructor.unbind(singleEvent, binder);
            return _this.constructor.unbind("unbind", unbinder);
          }
        });
      };
    })(this);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      singleEvent = _ref[_i];
      _fn(singleEvent);
    }
    return this;
  };

  Model.prototype.one = function(events, callback) {
    var handler;
    return this.bind(events, handler = (function(_this) {
      return function() {
        _this.unbind(events, handler);
        return callback.apply(_this, arguments);
      };
    })(this));
  };

  Model.prototype.trigger = function() {
    var args, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    args.splice(1, 0, this);
    return (_ref = this.constructor).trigger.apply(_ref, args);
  };

  Model.prototype.listenTo = function() {
    return Events.listenTo.apply(this, arguments);
  };

  Model.prototype.listenToOnce = function() {
    return Events.listenToOnce.apply(this, arguments);
  };

  Model.prototype.stopListening = function() {
    return Events.stopListening.apply(this, arguments);
  };

  Model.prototype.unbind = function(events, callback) {
    var event, _i, _len, _ref, _results;
    if (arguments.length === 0) {
      return this.trigger('unbind');
    } else if (events) {
      _ref = events.split(' ');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        _results.push(this.trigger('unbind', event, callback));
      }
      return _results;
    }
  };

  return Model;

})();

Model.setup = function(name, attributes) {
  var Instance;
  if (attributes == null) {
    attributes = [];
  }
  Instance = (function(_super) {
    
    Module.clone(Instance, _super);

    function Instance() {
      return Instance.__super__.constructor.apply(this, arguments);
    }

    return Instance;

  })(this);
  
  Instance.configure.apply(Instance, [name].concat(__slice.call(attributes)));
  return Instance;
};

Model.options = {};

var createObject = ModelUtils.createObject;
var isArray = ModelUtils.isArray;
var makeArray = ModelUtils.makeArray;

module.exports = Model

Model.prototype.on = Model.prototype.bind;
Model.prototype.off = Model.prototype.unbind;
Model.prototype.emit = Model.prototype.trigger;

__hasProp = {}.hasOwnProperty,
__slice = [].slice;
},{"../utils/model":10,"./events":6,"./module":8}],8:[function(require,module,exports){
var moduleKeywords = ['included', 'extended'];


var Module = function(){

  function Module() {
    if (typeof this.init === "function") {
      this.init.apply(this, arguments);
    }
  }
}

Module.include = function(obj) {
  if (!obj) throw new Error('include(obj) requires obj');
  for (var key in obj) if ( moduleKeywords.indexOf(key)  < 0) this.prototype[key] = obj[key];
  if (obj.included) obj.included.apply(this);
  return this;
};

Module.extend = function(obj) {
  if (!obj) throw new Error('extend(obj) requires obj');
  for (key in obj) if (moduleKeywords.indexOf(key) < 0) this[key] = obj[key];
  if (obj.extended) obj.extended.apply(this);
  return this;
};

Module.proxy = function(func) {
  return (function(_this) {
    return function() {
      return func.apply(_this, arguments);
    };
  })(this);
};

Module.prototype.proxy = Module.proxy;
  
Module.create = Module.sub = function(instances, statics) {
  var Result;
  Result = (function(_super) {
    Module.clone(Result, _super);

    function Result() {
      return Result.__super__.constructor.apply(this, arguments);
    }
    return Result;

  })(this);

  if (instances) {
    Result.include(instances);
  }
  if (statics) {
    Result.extend(statics);
  }
  if (typeof Result.unbind === "function") {
    Result.unbind();
  }
  return Result;
};


Module.clone = function(child, parent) { 
  for (var key in parent) { 
    if ({}.hasOwnProperty.call(parent, key)){
      child[key] = parent[key]; 
    }
  } 

  function ctor() { 
    this.constructor = child; 
  } 
  ctor.prototype = parent.prototype; 
  child.prototype = new ctor(); 
  child.__super__ = parent.prototype; 
  return child; 
};

module.exports = Module;
},{}],9:[function(require,module,exports){
var process=require("__browserify_process");
/**
 * An object representing a "promise" for a future value
 *
 * @param {?function(T, ?)=} onSuccess a function to handle successful
 *     resolution of this promise
 * @param {?function(!Error, ?)=} onFail a function to handle failed
 *     resolution of this promise
 * @constructor
 * @template T
 */
function Promise(onSuccess, onFail) {
  this.promise = this
  this._isPromise = true
  this._successFn = onSuccess
  this._failFn = onFail
  this._scope = this
  this._boundArgs = null
  this._hasContext = false
  this._nextContext = undefined
  this._currentContext = undefined
}

/**
 * @param {function()} callback
 */
function nextTick (callback) {
  callback()
}

if (typeof process !== 'undefined') {
  nextTick = process.nextTick
}

/**
 * All callback execution should go through this function.  While the
 * implementation below is simple, it can be replaced with more sophisticated
 * implementations that enforce QoS on the event loop.
 *
 * @param {Promise} defer
 * @param {Function} callback
 * @param {Object|undefined} scope
 * @param {Array} args
 */
function nextTickCallback (defer, callback, scope, args) {
  try {
    defer.resolve(callback.apply(scope, args))
  } catch (thrown) {
    defer.reject(thrown)
  }
}

/**
 * Used for accessing the nextTick function from outside the kew module.
 *
 * @return {Function}
 */
function getNextTickFunction () {
  return nextTick
}

/**
 * Used for overriding the nextTick function from outside the kew module so that
 * the user can plug and play lower level schedulers
 * @param {Function} fn
 */
function setNextTickFunction (fn) {
  nextTick = fn
}

/**
 * Keep track of the number of promises that are rejected along side
 * the number of rejected promises we call _failFn on so we can look
 * for leaked rejections.
 * @constructor
 */
function PromiseStats() {
  /** @type {number} */
  this.errorsEmitted = 0

  /** @type {number} */
  this.errorsHandled = 0
}

var stats = new PromiseStats()

Promise.prototype._handleError = function () {
  if (!this._errorHandled) {
    stats.errorsHandled++
    this._errorHandled = true
  }
}

/**
 * Specify that the current promise should have a specified context
 * @param  {*} context context
 * @private
 */
Promise.prototype._useContext = function (context) {
  this._nextContext = this._currentContext = context
  this._hasContext = true
  return this
}

Promise.prototype.clearContext = function () {
  this._hasContext = false
  this._nextContext = undefined
  return this
}

/**
 * Set the context for all promise handlers to follow
 *
 * NOTE(dpup): This should be considered deprecated.  It does not do what most
 * people would expect.  The context will be passed as a second argument to all
 * subsequent callbacks.
 *
 * @param {*} context An arbitrary context
 */
Promise.prototype.setContext = function (context) {
  this._nextContext = context
  this._hasContext = true
  return this
}

/**
 * Get the context for a promise
 * @return {*} the context set by setContext
 */
Promise.prototype.getContext = function () {
  return this._nextContext
}

/**
 * Resolve this promise with a specified value
 *
 * @param {*=} data
 */
Promise.prototype.resolve = function (data) {
  if (this._error || this._hasData) throw new Error("Unable to resolve or reject the same promise twice")

  var i
  if (data && isPromise(data)) {
    this._child = data
    if (this._promises) {
      for (i = 0; i < this._promises.length; i += 1) {
        data._chainPromise(this._promises[i])
      }
      delete this._promises
    }

    if (this._onComplete) {
      for (i = 0; i < this._onComplete.length; i+= 1) {
        data.fin(this._onComplete[i])
      }
      delete this._onComplete
    }
  } else if (data && isPromiseLike(data)) {
    data.then(
      function(data) { this.resolve(data) }.bind(this),
      function(err) { this.reject(err) }.bind(this)
    )
  } else {
    this._hasData = true
    this._data = data

    if (this._onComplete) {
      for (i = 0; i < this._onComplete.length; i++) {
        this._onComplete[i]()
      }
    }

    if (this._promises) {
      for (i = 0; i < this._promises.length; i += 1) {
        this._promises[i]._useContext(this._nextContext)
        this._promises[i]._withInput(data)
      }
      delete this._promises
    }
  }
}

/**
 * Reject this promise with an error
 *
 * @param {!Error} e
 */
Promise.prototype.reject = function (e) {
  if (this._error || this._hasData) throw new Error("Unable to resolve or reject the same promise twice")

  var i
  this._error = e
  stats.errorsEmitted++

  if (this._ended) {
    this._handleError()
    process.nextTick(function onPromiseThrow() {
      throw e
    })
  }

  if (this._onComplete) {
    for (i = 0; i < this._onComplete.length; i++) {
      this._onComplete[i]()
    }
  }

  if (this._promises) {
    this._handleError()
    for (i = 0; i < this._promises.length; i += 1) {
      this._promises[i]._useContext(this._nextContext)
      this._promises[i]._withError(e)
    }
    delete this._promises
  }
}

/**
 * Provide a callback to be called whenever this promise successfully
 * resolves. Allows for an optional second callback to handle the failure
 * case.
 *
 * @param {?function(this:void, T, ?): RESULT|undefined} onSuccess
 * @param {?function(this:void, !Error, ?): RESULT=} onFail
 * @return {!Promise.<RESULT>} returns a new promise with the output of the onSuccess or
 *     onFail handler
 * @template RESULT
 */
Promise.prototype.then = function (onSuccess, onFail) {
  var promise = new Promise(onSuccess, onFail)
  if (this._nextContext) promise._useContext(this._nextContext)

  if (this._child) this._child._chainPromise(promise)
  else this._chainPromise(promise)

  return promise
}

/**
 * Provide a callback to be called whenever this promise successfully
 * resolves. The callback will be executed in the context of the provided scope.
 *
 * @param {function(this:SCOPE, ...): RESULT} onSuccess
 * @param {SCOPE} scope Object whose context callback will be executed in.
 * @param {...*} var_args Additional arguments to be passed to the promise callback.
 * @return {!Promise.<RESULT>} returns a new promise with the output of the onSuccess
 * @template SCOPE, RESULT
 */
Promise.prototype.thenBound = function (onSuccess, scope, var_args) {
  var promise = new Promise(onSuccess)
  if (this._nextContext) promise._useContext(this._nextContext)

  promise._scope = scope
  if (arguments.length > 2) {
    promise._boundArgs = Array.prototype.slice.call(arguments, 2)
  }

  // Chaining must happen after setting args and scope since it may fire callback.
  if (this._child) this._child._chainPromise(promise)
  else this._chainPromise(promise)

  return promise
}

/**
 * Provide a callback to be called whenever this promise is rejected
 *
 * @param {function(this:void, !Error, ?)} onFail
 * @return {!Promise.<T>} returns a new promise with the output of the onFail handler
 */
Promise.prototype.fail = function (onFail) {
  return this.then(null, onFail)
}

/**
 * Provide a callback to be called whenever this promise is rejected.
 * The callback will be executed in the context of the provided scope.
 *
 * @param {function(this:SCOPE, ...)} onFail
 * @param {SCOPE} scope Object whose context callback will be executed in.
 * @param {...?} var_args
 * @return {!Promise.<T>} returns a new promise with the output of the onSuccess
 * @template SCOPE
 */
Promise.prototype.failBound = function (onFail, scope, var_args) {
  var promise = new Promise(null, onFail)
  if (this._nextContext) promise._useContext(this._nextContext)

  promise._scope = scope
  if (arguments.length > 2) {
    promise._boundArgs = Array.prototype.slice.call(arguments, 2)
  }

  // Chaining must happen after setting args and scope since it may fire callback.
  if (this._child) this._child._chainPromise(promise)
  else this._chainPromise(promise)

  return promise
}

/**
 * Provide a callback to be called whenever this promise is either resolved
 * or rejected.
 *
 * @param {function()} onComplete
 * @return {!Promise.<T>} returns the current promise
 */
Promise.prototype.fin = function (onComplete) {
  if (this._hasData || this._error) {
    onComplete()
    return this
  }

  if (this._child) {
    this._child.fin(onComplete)
  } else {
    if (!this._onComplete) this._onComplete = [onComplete]
    else this._onComplete.push(onComplete)
  }

  return this
}

/**
 * Mark this promise as "ended". If the promise is rejected, this will throw an
 * error in whatever scope it happens to be in
 *
 * @return {!Promise.<T>} returns the current promise
 * @deprecated Prefer done(), because it's consistent with Q.
 */
Promise.prototype.end = function () {
  this._end()
  return this
}


/**
 * Mark this promise as "ended".
 * @private
 */
Promise.prototype._end = function () {
  if (this._error) {
    this._handleError()
    throw this._error
  }
  this._ended = true
  return this
}

/**
 * Close the promise. Any errors after this completes will be thrown to the global handler.
 *
 * @param {?function(this:void, T, ?)=} onSuccess a function to handle successful
 *     resolution of this promise
 * @param {?function(this:void, !Error, ?)=} onFailure a function to handle failed
 *     resolution of this promise
 * @return {void}
 */
Promise.prototype.done = function (onSuccess, onFailure) {
  var self = this
  if (onSuccess || onFailure) {
    self = self.then(onSuccess, onFailure)
  }
  self._end()
}

/**
 * Return a new promise that behaves the same as the current promise except
 * that it will be rejected if the current promise does not get fulfilled
 * after a certain amount of time.
 *
 * @param {number} timeoutMs The timeout threshold in msec
 * @param {string=} timeoutMsg error message
 * @return {!Promise.<T>} a new promise with timeout
 */
 Promise.prototype.timeout = function (timeoutMs, timeoutMsg) {
  var deferred = new Promise()
  var isTimeout = false

  var timeout = setTimeout(function() {
    deferred.reject(new Error(timeoutMsg || 'Promise timeout after ' + timeoutMs + ' ms.'))
    isTimeout = true
  }, timeoutMs)

  this.then(function (data) {
    if (!isTimeout) {
      clearTimeout(timeout)
      deferred.resolve(data)
    }
  },
  function (err) {
    if (!isTimeout) {
      clearTimeout(timeout)
      deferred.reject(err)
    }
  })

  return deferred.promise
}

/**
 * Attempt to resolve this promise with the specified input
 *
 * @param {*} data the input
 */
Promise.prototype._withInput = function (data) {
  if (this._successFn) {
    this._nextTick(this._successFn, [data, this._currentContext])
  } else {
    this.resolve(data)
  }

  // context is no longer needed
  delete this._currentContext
}

/**
 * Attempt to reject this promise with the specified error
 *
 * @param {!Error} e
 * @private
 */
Promise.prototype._withError = function (e) {
  if (this._failFn) {
    this._nextTick(this._failFn, [e, this._currentContext])
  } else {
    this.reject(e)
  }

  // context is no longer needed
  delete this._currentContext
}

/**
 * Calls a function in the correct scope, and includes bound arguments.
 * @param {Function} fn
 * @param {Array} args
 * @private
 */
Promise.prototype._nextTick = function (fn, args) {
  if (this._boundArgs) {
    args = this._boundArgs.concat(args)
  }
  nextTick(nextTickCallback.bind(null, this, fn, this._scope, args))
}

/**
 * Chain a promise to the current promise
 *
 * @param {!Promise} promise the promise to chain
 * @private
 */
Promise.prototype._chainPromise = function (promise) {
  var i
  if (this._hasContext) promise._useContext(this._nextContext)

  if (this._child) {
    this._child._chainPromise(promise)
  } else if (this._hasData) {
    promise._withInput(this._data)
  } else if (this._error) {
    // We can't rely on _withError() because it's called on the chained promises
    // and we need to use the source's _errorHandled state
    this._handleError()
    promise._withError(this._error)
  } else if (!this._promises) {
    this._promises = [promise]
  } else {
    this._promises.push(promise)
  }
}

/**
 * Utility function used for creating a node-style resolver
 * for deferreds
 *
 * @param {!Promise} deferred a promise that looks like a deferred
 * @param {Error=} err an optional error
 * @param {*=} data optional data
 */
function resolver(deferred, err, data) {
  if (err) deferred.reject(err)
  else deferred.resolve(data)
}

/**
 * Creates a node-style resolver for a deferred by wrapping
 * resolver()
 *
 * @return {function(?Error, *)} node-style callback
 */
Promise.prototype.makeNodeResolver = function () {
  return resolver.bind(null, this)
}

/**
 * Return true iff the given object is a promise of this library.
 *
 * Because kew's API is slightly different than other promise libraries,
 * it's important that we have a test for its promise type. If you want
 * to test for a more general A+ promise, you should do a cap test for
 * the features you want.
 *
 * @param {*} obj The object to test
 * @return {boolean} Whether the object is a promise
 */
function isPromise(obj) {
  return !!obj._isPromise
}

/**
 * Return true iff the given object is a promise-like object, e.g. appears to
 * implement Promises/A+ specification
 *
 * @param {*} obj The object to test
 * @return {boolean} Whether the object is a promise-like object
 */
function isPromiseLike(obj) {
  return typeof obj === 'object' && typeof obj.then === 'function'
}

/**
 * Static function which creates and resolves a promise immediately
 *
 * @param {T} data data to resolve the promise with
 * @return {!Promise.<T>}
 * @template T
 */
function resolve(data) {
  var promise = new Promise()
  promise.resolve(data)
  return promise
}

/**
 * Static function which creates and rejects a promise immediately
 *
 * @param {!Error} e error to reject the promise with
 * @return {!Promise}
 */
function reject(e) {
  var promise = new Promise()
  promise.reject(e)
  return promise
}

/**
 * Replace an element in an array with a new value. Used by .all() to
 * call from .then()
 *
 * @param {!Array} arr
 * @param {number} idx
 * @param {*} val
 * @return {*} the val that's being injected into the array
 */
function replaceEl(arr, idx, val) {
  arr[idx] = val
  return val
}

/**
 * Replace an element in an array as it is resolved with its value.
 * Used by .allSettled().
 *
 * @param {!Array} arr
 * @param {number} idx
 * @param {*} value The value from a resolved promise.
 * @return {*} the data that's being passed in
 */
function replaceElFulfilled(arr, idx, value) {
  arr[idx] = {
    state: 'fulfilled',
    value: value
  }
  return value
}

/**
 * Replace an element in an array as it is rejected with the reason.
 * Used by .allSettled().
 *
 * @param {!Array} arr
 * @param {number} idx
 * @param {*} reason The reason why the original promise is rejected
 * @return {*} the data that's being passed in
 */
function replaceElRejected(arr, idx, reason) {
  arr[idx] = {
    state: 'rejected',
    reason: reason
  }
  return reason
}

/**
 * Takes in an array of promises or literals and returns a promise which returns
 * an array of values when all have resolved. If any fail, the promise fails.
 *
 * @param {!Array.<!Promise>} promises
 * @return {!Promise.<!Array>}
 */
function all(promises) {
  if (arguments.length != 1 || !Array.isArray(promises)) {
    promises = Array.prototype.slice.call(arguments, 0)
  }
  if (!promises.length) return resolve([])

  var outputs = []
  var finished = false
  var promise = new Promise()
  var counter = promises.length

  for (var i = 0; i < promises.length; i += 1) {
    if (!promises[i] || !isPromiseLike(promises[i])) {
      outputs[i] = promises[i]
      counter -= 1
    } else {
      promises[i].then(replaceEl.bind(null, outputs, i))
      .then(function decrementAllCounter() {
        counter--
        if (!finished && counter === 0) {
          finished = true
          promise.resolve(outputs)
        }
      }, function onAllError(e) {
        if (!finished) {
          finished = true
          promise.reject(e)
        }
      })
    }
  }

  if (counter === 0 && !finished) {
    finished = true
    promise.resolve(outputs)
  }

  return promise
}

/**
 * Takes in an array of promises or values and returns a promise that is
 * fulfilled with an array of state objects when all have resolved or
 * rejected. If a promise is resolved, its corresponding state object is
 * {state: 'fulfilled', value: Object}; whereas if a promise is rejected, its
 * corresponding state object is {state: 'rejected', reason: Object}.
 *
 * @param {!Array} promises or values
 * @return {!Promise.<!Array>} Promise fulfilled with state objects for each input
 */
function allSettled(promises) {
  if (!Array.isArray(promises)) {
    throw Error('The input to "allSettled()" should be an array of Promise or values')
  }
  if (!promises.length) return resolve([])

  var outputs = []
  var promise = new Promise()
  var counter = promises.length

  for (var i = 0; i < promises.length; i += 1) {
    if (!promises[i] || !isPromiseLike(promises[i])) {
      replaceElFulfilled(outputs, i, promises[i])
      if ((--counter) === 0) promise.resolve(outputs)
    } else {
      promises[i]
        .then(replaceElFulfilled.bind(null, outputs, i), replaceElRejected.bind(null, outputs, i))
        .then(function () {
          if ((--counter) === 0) promise.resolve(outputs)
        })
    }
  }

  return promise
}

/**
 * Create a new Promise which looks like a deferred
 *
 * @return {!Promise}
 */
function defer() {
  return new Promise()
}

/**
 * Return a promise which will wait a specified number of ms to resolve
 *
 * @param {*} delayMsOrVal A delay (in ms) if this takes one argument, or ther
 *     return value if it takes two.
 * @param {number=} opt_delayMs
 * @return {!Promise}
 */
function delay(delayMsOrVal, opt_delayMs) {
  var returnVal = undefined
  var delayMs = delayMsOrVal
  if (typeof opt_delayMs != 'undefined') {
    delayMs = opt_delayMs
    returnVal = delayMsOrVal
  }

  if (typeof delayMs != 'number') {
    throw new Error('Bad delay value ' + delayMs)
  }

  var defer = new Promise()
  setTimeout(function onDelay() {
    defer.resolve(returnVal)
  }, delayMs)
  return defer
}

/**
 * Returns a promise that has the same result as `this`, but fulfilled
 * after at least ms milliseconds
 * @param {number} ms
 */
Promise.prototype.delay = function (ms) {
  return this.then(function (val) {
    return delay(val, ms)
  })
}

/**
 * Return a promise which will evaluate the function fn in a future turn with
 * the provided args
 *
 * @param {function(...)} fn
 * @param {...*} var_args a variable number of arguments
 * @return {!Promise}
 */
function fcall(fn, var_args) {
  var rootArgs = Array.prototype.slice.call(arguments, 1)
  var defer = new Promise()
  nextTick(nextTickCallback.bind(null, defer, fn, undefined, rootArgs))
  return defer
}


/**
 * Returns a promise that will be invoked with the result of a node style
 * callback. All args to fn should be given except for the final callback arg
 *
 * @param {function(...)} fn
 * @param {...*} var_args a variable number of arguments
 * @return {!Promise}
 */
function nfcall(fn, var_args) {
  // Insert an undefined argument for scope and let bindPromise() do the work.
  var args = Array.prototype.slice.call(arguments, 0)
  args.splice(1, 0, undefined)
  return bindPromise.apply(undefined, args)()
}


/**
 * Binds a function to a scope with an optional number of curried arguments. Attaches
 * a node style callback as the last argument and returns a promise
 *
 * @param {function(...)} fn
 * @param {Object} scope
 * @param {...*} var_args a variable number of arguments
 * @return {function(...)}: !Promise}
 */
function bindPromise(fn, scope, var_args) {
  var rootArgs = Array.prototype.slice.call(arguments, 2)
  return function onBoundPromise(var_args) {
    var defer = new Promise()
    try {
      fn.apply(scope, rootArgs.concat(Array.prototype.slice.call(arguments, 0), defer.makeNodeResolver()))
    } catch (e) {
      defer.reject(e)
    }
    return defer
  }
}

module.exports = {
    all: all
  , bindPromise: bindPromise
  , defer: defer
  , delay: delay
  , fcall: fcall
  , isPromise: isPromise
  , isPromiseLike: isPromiseLike
  , nfcall: nfcall
  , resolve: resolve
  , reject: reject
  , stats: stats
  , allSettled: allSettled
  , Promise: Promise
  , getNextTickFunction: getNextTickFunction
  , setNextTickFunction: setNextTickFunction
}

},{"__browserify_process":1}],10:[function(require,module,exports){
var createObject = Object.create || function(o) {
  var Func;
  Func = function() {};
  Func.prototype = o;
  return new Func();
};

var isArray = function(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
};


var makeArray = function(args) {
  return Array.prototype.slice.call(args, 0);
};

var isBlank = function(value) {
    var key;
    if (!value) {
      return true;
    }
    for (key in value) {
      return false;
    }
    return true;
  };

module.exports = {
	createObject: createObject,
	isArray: isArray,
	makeArray: makeArray,
	isBlank: isBlank
}
},{}]},{},[3])