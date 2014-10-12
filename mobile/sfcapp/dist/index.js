(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="grid-list-item grid-list-item__noapp " style="padding-right: 0px;margin-left: 0px;">\n\t<a class=" company-item  item-add">\n\t\t\n\t\t<svg class=" " style="position: relative; left: 0px;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="00px" y="0px"\n\t\twidth="48.497px" height="50px" viewBox="0 0 48.497 50" enable-background="new 0 0 48.497 50" xml:space="preserve">\n\n\t\t\t<g class="" id="Layer_33">\n\n\t\t\t<g class="">\n\t\t\t<path fill="#FFFFFF" d="M27.256,0v22.087h21.241v5.639H27.256V50h-6.015V27.726H0v-5.639h21.241V0H27.256z"/>\n\t\t\t</g>\n\t\t\t</g>\n\t\t</svg>\n\n\t</a>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],4:[function(require,module,exports){
//GET LIST OF STORES FROM LOCAL STORAGE

var Layout = require("./view")
var Item = require("./item")
var AddBtn = require("./addBtn")

var sfcStore = require("../../models/sfcStore");

var domify = require('domify');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

function ObjectList(){

	var that = this;
	this.el = domify( Layout() );
	

	this.list = this.el.querySelector(".company-list")
	this.el.onclick = function(e){
		var target = e.target;
		var found=false;
		while(!found){
			if(target.classList.contains('item-company') ){
				that.onItemClick(e);
				found=true;
			}
			else if(target.classList.contains('item-add') ){
				that.onItemAdd(e);
				found=true
			}
			else target = target.parentNode;
		}
	}

	sfcStore.fetch();
	this.render()

}
inherits(ObjectList, EventEmitter);



ObjectList.prototype.render = function(){
	this.list.innerHTML = AddBtn();
	var models = sfcStore.all();
	for (var i = models.length - 1; i >= 0; i--) {
		var model = models[i];
		this.list.innerHTML += ( Item(model) );
	};
}

ObjectList.prototype.onItemAdd = function(e){
	var objectName = e.target.dataset.name;
	this.emit("ADD_COMPANY");
}

ObjectList.prototype.onItemClick = function(e){
	var target = e.target;
	if( !target.classList.contains("item-company") ) target = target.parentNode;
	


	var id = target.dataset.id;

	this.emit("SELECT_COMPANY",id)
}

	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;


},{"../../models/sfcStore":17,"./addBtn":3,"./item":5,"./view":6,"domify":26,"events":1,"inherits":27}],5:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\t  <div class="grid-list-item ">\n\t    <div  class="icon  company-item item-company " data-id="');
    
      __out.push(__sanitize(this.id));
    
      __out.push('">\n\t    </div>\n\t    <span>');
    
      __out.push(__sanitize(this.Name));
    
      __out.push('</span>\n\n\n\t  </div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],6:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="mobile-body">\n\t\n\t<div class="company-list grid-list ">\n\n\t</div>\n\n\t<div class="powered" ></div>\n\n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],7:[function(require,module,exports){
//GET APP LIST FROM COMPANY API

var Layout = require("./view")
var Item = require("./item")

var sfcStore = require("../../models/sfcStore");

var domify = require('domify');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
inherits(ObjectList, EventEmitter);

function ObjectList(){
	this.el = domify( Layout() );
}
inherits(ObjectList, EventEmitter);

ObjectList.prototype.renderStore = function(){
	var that = this;
	this.el = domify( Layout() );
	this.body = this.el.querySelector(".mobile-body")
	this.frame = this.el.querySelector(".vf-iframe")
	this.menu = this.el.querySelector(".mobile-menu");
	this.appList = this.el.querySelector(".app-list");
	this.title = this.el.querySelector(".title");

	var btnMenu = this.el.querySelector(".btn-menu");
	btnMenu.onclick = function(e){
		that.onMenuClick(e);
	}
	
	this.appList.onclick = function(e){
		that.onAppClick(e);
	}

	this.onMenuClick();
}

ObjectList.prototype.activate = function(){
	document.domain = "force.com"
	var that = this;
	this.renderStore();
	this.adjustIFrame();
	this.frame.src = sfcStore.current.Apiurl + "/" + sfcStore.current.Apps[0]
	this.frame.onload = function(){ 
		that.frame.contentWindow.start(sfcStore.current.Token) 
	}

	
	this.title.innerHTML = sfcStore.current.Name
	this.renderApps();
}

ObjectList.prototype.adjustIFrame = function(){
	var that = this;
	setTimeout(function(){
		that.frame.style.height = that.body.offsetHeight + "px"
		that.frame.style.width = that.body.offsetWidth + "px"
	},100)

}

ObjectList.prototype.renderApps = function(){
	var store = sfcStore.current;
	for (var i = store.Apps.length - 1; i >= 0; i--) {
		var model = store.Apps[i];
		this.appList.innerHTML += Item(model);
	};
	this.appList.innerHTML += Item("Exit")
}

ObjectList.prototype.onMenuClick = function(e){
	if(this.menu.style.left=="-100px") this.menu.style.left="0px";
	else this.menu.style.left="-100px";
}

ObjectList.prototype.onAppClick = function(e){
	var app = e.target.dataset.app
	
	if(app == "Exit") return this.emit("BACK")
	this.frame.src = sfcStore.current.Apiurl + "/" + app
	this.onMenuClick();
}

	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;




},{"../../models/sfcStore":17,"./item":8,"./view":9,"domify":26,"events":1,"inherits":27}],8:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<a class="thumbnail app-item" data-app="');
    
      __out.push(__sanitize(this));
    
      __out.push('">');
    
      __out.push(__sanitize(this));
    
      __out.push('</a>\n\t\t ');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],9:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="company-store padded-container__menu">\n\t\n\t<div class="mobile-menu">\n\t\t<div class="app-list">\n\n\t\t</div>\n\n\t</div>\n\n\t<div class="mobile-header">\n\t\t<a class="btn btn-primary btn-menu">|||</a>\t\n\t\t<span class="title"></span>\n\t</div>\n\n\t<div class="mobile-body">\n  \t\t<iframe class="embed-responsive-item vf-iframe" src=""></iframe>\n\t</div>\n\t\t\n\t</div>\n\n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],10:[function(require,module,exports){
//LOGIN TO COMPANY API

//GET BACK TOKEN AND COMPANY APP FROM STORE

var Layout = require("./view")
var domify = require('domify');

var sfcStore = require("../../models/sfcStore");


var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
inherits(ObjectList, EventEmitter);
var superagent = require("superagent")


function ObjectList(){

	var that = this;
	this.el = domify( Layout() );
	this.username = this.el.querySelector("#txt_username")
	this.password = this.el.querySelector("#txt_password")
	var btnSend = this.el.querySelector(".btn_send")
	var btnCancel = this.el.querySelector(".btn_cancel")

	btnSend.onclick = function(e){
		that.loginToApi(e);
	}

	btnCancel.onclick = function(e){
		that.onCancel(e);
	}

	
}
inherits(ObjectList, EventEmitter);

ObjectList.prototype.activate = function(){
	this.el.querySelector(".account_name").innerHTML = sfcStore.current.Name;
}


ObjectList.prototype.loginToApi = function(e){
	
	var url = 'https://jsonp.nodejitsu.com/?url='+ sfcStore.current.Apiurl +'/services/apexrest/sfc?credentials={"username": "user","password":"pass"}';
	var that = this;
  superagent.get(url).end(function(res){
    if(res.ok){
    	var parsed = JSON.parse(res.body);
    	that.emit("LOGIN_COMPLETE", parsed);
    }
    else{
			that.emit("BACK");
    }
  }).on('error', function(){ that.emit("BACK"); })

}


ObjectList.prototype.onSend = function(e){
	//LOGIN WITH ACTUAL ORG


	//IF SUCCESS
	this.emit("LOGIN_COMPLETE");
}

ObjectList.prototype.onCancel = function(e){
	this.emit("BACK");
}

	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;


},{"../../models/sfcStore":17,"./view":11,"domify":26,"events":1,"inherits":27,"superagent":28}],11:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="mobile-body">\n\t\n\t<div class="login-view">\n\t\n\t<div class="title">\n\t\tLogin to <span class="account_name"></span>\n\t</div>\n\n\t<input id="txt_username" class="form-control" />\n\n\t<input id="txt_password" type="password" class="form-control" />\n\n\t<div class="row">\n\t\t<a class="btn btn-primary btn_send pull-right">Login</a>\n\t\t<a class="btn btn-default btn_cancel">Cancel</a>\n\t</div>\n\n</div>\n\n\t<div class="powered" ></div>\n\n</div>\n\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],12:[function(require,module,exports){
//GET LIST OF COMPANIES FROM SFC CONTROL CENTER

//ONCE COMPANY IS SELECTED , TAKE TO LOGIN WITH API URL


var Layout = require("./view")
var Item = require("./item")

var sfcStore = require("../../models/sfcStore");

var Company = require("../../models/company");

var domify = require('domify');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
inherits(ObjectList, EventEmitter);

function ObjectList(){

	var that = this;
	this.el = domify( Layout() );

	this.list = this.el.querySelector(".company-list");
	this.list.onclick = function(e){
		that.onItemClick(e);
	}
	
	var btnBack = this.el.querySelector(".btn-back");
	btnBack.onclick = function(){
		that.emit("BACK");
	}

	Company.fetch();
	Company.bind("refresh", function(){ that.render() });
	
//	Sf1Fields.bind("refresh", function(){ that.render(); });
}
inherits(ObjectList, EventEmitter);

ObjectList.prototype.render = function(){
	var models = Company.all();
	for (var i = models.length - 1; i >= 0; i--) {
		var model = models[i];
		this.list.innerHTML+= Item(model);
	};
}

ObjectList.prototype.onItemClick = function(e){

	var id = e.target.dataset.id;
	
	this.emit("SELECT_COMPANY",id)
}


	//Sf1Fields.trigger("OBJECT_SELECTED", objectName);


module.exports = ObjectList;


},{"../../models/company":16,"../../models/sfcStore":17,"./item":13,"./view":14,"domify":26,"events":1,"inherits":27}],13:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n\t  <div class="grid-list-item grid-list-item__light">\n\t    <div  class="icon  company-item item-company " data-id="');
    
      __out.push(__sanitize(this.id));
    
      __out.push('">\n\t    </div>\n\t    <span>');
    
      __out.push(__sanitize(this.Name));
    
      __out.push('</span>\n\n\t  </div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],14:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="view">\n\t<div class="mobile-header mobile-header__colored">\n\t\t<a class="btn-back"> < </a>\n\t\t\t<input class=" " />\n\n\t</div>\n\n\t<div class="mobile-body__withheader">\n\t\t<div class="list-title">Available Apps</div>\t\t\n\n\t\t<div class=" company-list grid-list " style="padding-left: 14px;"></div>\n\t\t\n\t\t<div class="list-divider"></div>\n\t\t\t<div class="list-title">Upcoming Releases</div>\n\n\t\t<div class=" app-list grid-list " style="padding-left: 14px;">\n\t  \t<div class="grid-list-item grid-list-item__light">\n\t    \t<div  class="icon  company-item item-company"></div> <span>Coca Cola</span> \n\t    </div>\n\n\t\t\t<div class="grid-list-item grid-list-item__light">\n\t    \t<div  class="icon  company-item item-company"></div> <span>Delta</span> \n\t    </div>\n\n\t\t\t<div class="grid-list-item grid-list-item__light">\n\t    \t<div  class="icon  company-item item-company"></div> <span>Coca Cola</span> \n\t    </div>\n\n\t\t\t<div class="grid-list-item grid-list-item__light">\n\t    \t<div  class="icon  company-item item-company"></div> <span>Coca Cola</span> \n\t    </div>\n\n\t\t\t<div class="grid-list-item grid-list-item__light">\n\t    \t<div  class="icon  company-item item-company"></div> <span>Coca Cola</span> \n\t    </div>\n\n\t\t\t<div class="grid-list-item grid-list-item__light">\n\t    \t<div  class="icon  company-item item-company"></div> <span>Coca Cola</span> \n\t    </div>\n\n\t\t\t<div class="grid-list-item grid-list-item__light">\n\t    \t<div  class="icon  company-item item-company"></div> <span>Coca Cola</span> \n\t    </div>\n\n\n\t\t</div>\n\n\n\t</div>\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],15:[function(require,module,exports){
var container;

var sfcStore = require("../models/sfcStore");

var Ajax = require("3vot-model/lib/3vot-model-vfr");

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

		manager.companyStoreController.activate();
		manager.showController( manager.companyStoreController );  
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
		manager.loginController.activate()
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

	this.loginController.on("BACK", function(){
	 	manager.showController( manager.searchCompanyController );
	});

	this.companyStoreController.on("BACK", function(){
		console.log(manager.companyStoreController)
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
},{"../controllers/companies":4,"../controllers/companyStore":7,"../controllers/login":10,"../controllers/searchCompany":12,"../models/sfcStore":17,"3vot-model/lib/3vot-model-vfr":19}],16:[function(require,module,exports){
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
},{"3vot-model":22}],17:[function(require,module,exports){
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




},{"3vot-model":22}],18:[function(require,module,exports){
var Ajax = require("3vot-model/lib/3vot-model-vfr");
Ajax.token = "abc";

var container = document.querySelector("._3vot");

var Manager = require("./code/manager");
var manager = new Manager(container);

//var Account = require("./code/models/account");


},{"./code/manager":15,"3vot-model/lib/3vot-model-vfr":19}],19:[function(require,module,exports){

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
  return send.apply( VFR, callArgs );
}

Ajax.query = function(params, options){
  if(!this.ajax.namespace) this.ajax.namespace =""

  var pctEncodeSpaces = true;
  var params = encodeURIComponent(params).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, pctEncodeSpaces ? '%20' : '+');
  
  var send = VFR(this.ajax.namespace + "ThreeVotApiController.handleRest" );
  return send( "get", "/query?query=" + params , "" )
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

  var send = VFR(this.ajax.namespace + "ThreeVotApiController.handleRest" );
  return send( "get", Ajax.generateURL(this) + "/" + id, "" )
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
  var send = VFR(model.ajax.namespace + "ThreeVotApiController.handleRest" );
  return send( "post", Ajax.generateURL(model) , JSON.stringify(this.toJSON()) )
  .then( function(data){ _this.id = id; return data; } )
}

Ajax.put = function(model, options){
  if(!model.ajax.namespace) model.ajax.namespace =""

  var id = this.id;
  this.id = null;
  var _this = this;

  var send = VFR(model.ajax.namespace + "ThreeVotApiController.handleRest", {}, true );
  return send( "put", Ajax.generateURL(model, id ), JSON.stringify(this.toJSON()) )
  .then( function(data){ _this.id = id; return data; } )
}

Ajax.del = function(model, options){
  if(!model.ajax.namespace) model.ajax.namespace =""

  var send = VFR(model.ajax.namespace + "ThreeVotApiController.handleRest", {}, true );
  return send( "del", Ajax.generateURL(model, this.id ), "" );
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


},{"./3vot-vfr":20}],20:[function(require,module,exports){
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

},{"kew":24}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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
},{"../utils/model":25,"./events":21,"./module":23}],23:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
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

},{"__browserify_process":2}],25:[function(require,module,exports){
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
},{}],26:[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var div = document.createElement('div');
// Setup
div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
// Make sure that link elements get serialized correctly by innerHTML
// This requires a wrapper element in IE
var innerHTMLBug = !div.getElementsByTagName('link').length;
div = undefined;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(html, doc) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // default to the global `document` object
  if (!doc) doc = document;

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return doc.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = doc.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = doc.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = doc.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}],27:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],28:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.xhr.responseText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse && str && str.length
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    try {
      var res = new Response(self);
      if ('HEAD' == method) res.text = null;
      self.callback(null, res);
    } catch(e) {
      var err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      self.callback(err);
    }
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":29,"reduce":30}],29:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],30:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}]},{},[18])