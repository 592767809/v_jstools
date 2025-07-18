
(function(){

function make_env_1(envs, keys){
    function make_long_string(idx){
        if (idx == 3){
            return `function init_cookie(cookie){
  var cache = (cookie || "").trim();
  if (!cache){
    cache = ''
  }else if (cache.charAt(cache.length-1) != ';'){
    cache += '; '
  }else{
    cache += ' '
  }
  Object.defineProperty(Document.prototype, 'cookie', {
    get: function() {
      var r = cache.slice(0,cache.length-2);
      v_console_log('  [*] document -> cookie[get]', r)
      return r
    },
    set: function(c) {
      v_console_log('  [*] document -> cookie[set]', c)
      var ncookie = c.split(";")[0].split("=");
      if (!ncookie.slice(1).join('')){
        return c
      }
      var key = ncookie[0].trim()
      var val = ncookie.slice(1).join('').trim()
      var newc = key+'='+val
      var flag = false;
      var temp = cache.split("; ").map(function(a) {
        if (a.split("=")[0] === key) {
          flag = true;
          return newc;
        }
        return a;
      })
      cache = temp.join("; ");
      if (!flag) {
        cache += newc + "; ";
      }
      return cache;
    }
  });
}
function v_hook_href(obj, name, initurl){
  var r = Object.defineProperty(obj, 'href', {
    get: function(){
      if (!(this.protocol) && !(this.hostname)){
        r = ''
      }else{
        r = this.protocol + "//" + this.hostname + (this.port ? ":" + this.port : "") + this.pathname + this.search + this.hash;
      }
      v_console_log(\`  [*] \${name||obj.constructor.name} -> href[get]:\`, JSON.stringify(r))
      return r
    },
    set: function(href){
      href = href.trim()
      v_console_log(\`  [*] \${name||obj.constructor.name} -> href[set]:\`, JSON.stringify(href))
      if (href.startsWith("http://") || href.startsWith("https://")){/*ok*/}
      else if(href.startsWith("//")){ href = (this.protocol?this.protocol:'http:') + href}
      else{ href = this.protocol+"//"+this.hostname + (this.port?":"+this.port:"") + '/' + ((href[0]=='/')?href.slice(1):href) }
      var a = href.match(/([^:]+:)\\/\\/([^/:?#]+):?(\\d+)?([^?#]*)?(\\?[^#]*)?(#.*)?/);
      this.protocol = a[1] ? a[1] : "";
      this.hostname = a[2] ? a[2] : "";
      this.port     = a[3] ? a[3] : "";
      this.pathname = a[4] ? a[4] : "";
      this.search   = a[5] ? a[5] : "";
      this.hash     = a[6] ? a[6] : "";
      this.host     = this.hostname + (this.port?":"+this.port:"") ;
      this.origin   = this.protocol + "//" + this.hostname + (this.port ? ":" + this.port : "");
    }
  });
  if (initurl && initurl.trim()){ var temp=v_new_toggle; v_new_toggle = true; r.href = initurl; v_new_toggle = temp; }
  return r
}
function v_hook_storage(){
  Storage.prototype.clear      = v_saf(function(){          v_console_log(\`  [*] Storage -> clear[func]:\`); var self=this;Object.keys(self).forEach(function (key) { delete self[key]; }); }, 'clear')
  Storage.prototype.getItem    = v_saf(function(key){       v_console_log(\`  [*] Storage -> getItem[func]:\`, key); var r = (this.hasOwnProperty(key)?String(this[key]):null); return r}, 'getItem')
  Storage.prototype.setItem    = v_saf(function(key, val){  v_console_log(\`  [*] Storage -> setItem[func]:\`, key, val); this[key] = (val === undefined)?null:String(val) }, 'setItem')
  Storage.prototype.key        = v_saf(function(key){       v_console_log(\`  [*] Storage -> key[func]:\`, key); return Object.keys(this)[key||0];} , 'key')
  Storage.prototype.removeItem = v_saf(function(key){       v_console_log(\`  [*] Storage -> removeItem[func]:\`, key); delete this[key];}, 'removeItem')
  Object.defineProperty(Storage.prototype, 'length', {get: function(){
    if(this===Storage.prototype){ throw TypeError('Illegal invocation') }return Object.keys(this).length
  }})
  window.sessionStorage = new Proxy(sessionStorage,{ set:function(a,b,c){ v_console_log(\`  [*] Storage -> [set]:\`, b, c); return a[b]=String(c)}, get:function(a,b){ v_console_log(\`  [*] Storage -> [get]:\`, b, a[b]); return a[b]},})
  window.localStorage = new Proxy(localStorage,{ set:function(a,b,c){ v_console_log(\`  [*] Storage -> [set]:\`, b, c); return a[b]=String(c)}, get:function(a,b){ v_console_log(\`  [*] Storage -> [get]:\`, b, a[b]); return a[b]},})
}
function v_init_document(){
  Document.prototype.documentElement = v_proxy(_createElement('html'), 'documentElement')
  Document.prototype.createElement = v_saf(function createElement(){ return v_proxy(_createElement(arguments[0]), 'createElement '+arguments[0]) })
  Document.prototype.getElementById = v_saf(function getElementById(name){ var r = v_getele(name, 'getElementById'); v_console_log('  [*] Document -> getElementById', name, r); return r })
  Document.prototype.querySelector = v_saf(function querySelector(name){ var r = v_getele(name, 'querySelector'); v_console_log('  [*] Document -> querySelector', name, r); return r })
  Document.prototype.getElementsByClassName = v_saf(function getElementsByClassName(name){ var r = v_geteles(name, 'getElementsByClassName'); v_console_log('  [*] Document -> getElementsByClassName', name, r); return r })
  Document.prototype.getElementsByName = v_saf(function getElementsByName(name){ var r = v_geteles(name, 'getElementsByName'); v_console_log('  [*] Document -> getElementsByName', name, r); return r })
  Document.prototype.getElementsByTagName = v_saf(function getElementsByTagName(name){ var r = v_geteles(name, 'getElementsByTagName'); v_console_log('  [*] Document -> getElementsByTagName', name, r); return r })
  Document.prototype.getElementsByTagNameNS = v_saf(function getElementsByTagNameNS(name){ var r = v_geteles(name, 'getElementsByTagNameNS'); v_console_log('  [*] Document -> getElementsByTagNameNS', name, r); return r })
  Document.prototype.querySelectorAll = v_saf(function querySelectorAll(name){ var r = v_geteles(name, 'querySelectorAll'); v_console_log('  [*] Document -> querySelectorAll', name, r); return r })
  var v_head = v_new(HTMLHeadElement)
  var v_body = v_new(HTMLBodyElement)
  Object.defineProperties(Document.prototype, {
    head: {get(){ v_console_log("  [*] Document -> head[get]", v_head);return v_proxy(v_head, 'document.head') }},
    body: {get(){ v_console_log("  [*] Document -> body[get]", v_body);return v_proxy(v_body, 'document.body') }},
  })
}
function v_init_canvas(){
  HTMLCanvasElement.prototype.getContext = function(){
    if (arguments[0]=='2d'){var r = v_proxy(v_new(CanvasRenderingContext2D), 'canvas2d', function(a){return function(){v_console_log(a,...arguments)}}); return r}; 
    if (arguments[0]=='webgl' || arguments[0]=='experimental-webgl'){var r = v_proxy(v_new(WebGLRenderingContext), 'webgl', function(a){return function(){v_console_log(a,...arguments)}}); r._canvas = this; return r}; 
    return null
  }
  HTMLCanvasElement.prototype.toDataURL = function(){return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAEYklEQVR4Xu3UAQkAAAwCwdm/9HI83BLIOdw5AgQIRAQWySkmAQIEzmB5AgIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlACBB1YxAJfjJb2jAAAAAElFTkSuQmCC"}
}
var v_start_stamp = +new Date
var v_fake_stamp = +new Date
function v_init_event_target(){
  v_events = {}
  function add_event(_this, x){
    if (!v_events[x[0]]){
      v_events[x[0]] = []
    }
    v_events[x[0]].push([_this, x[1].bind(_this)])
  }
  function _mk_mouse_event(type, canBubble, cancelable, view, detail, screenX, screenY, clientX, clientY, ctrlKey, altKey, shiftKey, metaKey, button, relatedTarget){
    if (type == 'click'){
      var m = new v_saf(function PointerEvent(){})
      m.pointerType = "mouse"
    }else{
      var m = new v_saf(function MouseEvent(){})
    }
    m.isTrusted = true
    m.type = type
    m.canBubble = canBubble
    m.cancelable = cancelable
    m.view = view
    m.detail = detail
    m.screenX = screenX; m.movementX = screenX
    m.screenY = screenY; m.movementY = screenY
    m.clientX = clientX; m.layerX = clientX; m.offsetX = clientX; m.pageX = clientX; m.x = clientX;
    m.clientY = clientY; m.layerY = clientY; m.offsetY = clientY; m.pageY = clientY; m.y = clientY;
    m.ctrlKey = ctrlKey
    m.altKey = altKey
    m.shiftKey = shiftKey
    m.metaKey = metaKey
    m.button = button
    m.relatedTarget = relatedTarget
    return m
  }
  function make_mouse(type, x, y){
    return _mk_mouse_event(type, true, true, window, 0, 0, 0, x, y, false, false, false, false, 0, null)
  }
  function mouse_click(x, y){
    for (var i = 0; i < (v_events['click'] || []).length; i++) { v_events['click'][i][1](make_mouse('click', x, y)) }
    for (var i = 0; i < (v_events['mousedown'] || []).length; i++) { v_events['mousedown'][i][1](make_mouse('mousedown', x, y)) }
    for (var i = 0; i < (v_events['mouseup'] || []).length; i++) { v_events['mouseup'][i][1](make_mouse('mouseup', x, y)) }
  }
  var offr = Math.random()
  function make_touch(_this, type, x, y, timeStamp){
    var offx = Math.random()
    var offy = Math.random()
    var t = v_new(new v_saf(function Touch(){}))
    t = clientX = offx + x
    t = clientY = offy + y
    t = force = 1
    t = identifier = 0
    t = pageX = offx + x
    t = pageY = offy + y
    t = radiusX = 28 + offr
    t = radiusY = 28 + offr
    t = rotationAngle = 0
    t = screenX = 0
    t = screenY = 0
    var e = v_new(new v_saf(function TouchEvent(){}))
    e.isTrusted = true
    e.altKey = false
    e.bubbles = true
    e.cancelBubble = false
    e.cancelable = false
    e.changedTouches = e.targetTouches = e.touches = [t]
    e.composed = true
    e.ctrlKey = false
    e.currentTarget = null
    e.defaultPrevented = false
    e.detail = 0
    e.eventPhase = 0
    e.metaKey = false
    e.path = _this == window ? [window] : [_this, window]
    e.returnValue = true
    e.shiftKey = false
    e.sourceCapabilities = new v_saf(function InputDeviceCapabilities(){this.firesTouchEvents = true})
    e.srcElement = _this
    e.target = _this
    e.type = type
    e.timeStamp = timeStamp == undefined ? (new Date - v_start_stamp) : ((v_fake_stamp += Math.random()*20) - v_start_stamp)
    e.view = window
    e.which = 0
    return e
  }
  function make_trace(x1, y1, x2, y2){
    // 贝塞尔曲线
    function step_len(x1, y1, x2, y2){
      var ln = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
      return (ln / 10) ^ 0
    }
    var slen = step_len(x1, y1, x2, y2)
    if (slen < 3){
      return []
    }
    function factorial(x){
      for(var y = 1; x > 1;  x--) {
        y *= x
      }
      return y;
    }
    var lp = Math.random()
    var rp = Math.random()
    var xx1 = (x1 + (x2 - x1) / 12 * (4-lp*4)) ^ 0
    var yy1 = (y1 + (y2 - y1) / 12 * (8+lp*4)) ^ 0
    var xx2 = (x1 + (x2 - x1) / 12 * (8+rp*4)) ^ 0
    var yy2 = (y1 + (y2 - y1) / 12 * (4-rp*4)) ^ 0
    var points = [[x1, y1], [xx1, yy1], [xx2, yy2], [x2, y2]]
    var N = points.length
    var n = N - 1 
    var traces = []
    var step = slen
    for (var T = 0; T < step+1; T++) {
      var t = T*(1/step)
      var x = 0
      var y = 0
      for (var i = 0; i < N; i++) {
        var B = factorial(n)*t**i*(1-t)**(n-i)/(factorial(i)*factorial(n-i))
        x += points[i][0]*B
        y += points[i][1]*B
      }
      traces.push([x^0, y^0])
    }
    return traces
  }
  function touch(x1, y1, x2, y2){
    if (x2 == undefined && y2 == undefined){
      x2 = x1
      y2 = y1
    }
    var traces = make_trace(x1, y1, x2, y2)
    v_console_log('traces:', traces)
    for (var i = 0; i < (v_events['touchstart'] || []).length; i++) { v_events['touchstart'][i][1](make_touch(v_events['touchstart'][i][0], 'touchstart', x1, y1)) }
    for (var j = 0; j < traces.length; j++) {
      var x = traces[j][0]
      var y = traces[j][0]
      for (var i = 0; i < (v_events['touchmove'] || []).length; i++) { v_events['touchmove'][i][1](make_touch(v_events['touchmove'][i][0], 'touchmove', x, y)) }
    }
    for (var i = 0; i < (v_events['touchend'] || []).length; i++) { v_events['touchend'][i][1](make_touch(v_events['touchend'][i][0], 'touchend', x2, y2)) }
  }
  function mouse_move(x1, y1, x2, y2){
    if (x2 == undefined && y2 == undefined){
      x2 = x1
      y2 = y1
    }
    var traces = make_trace(x1, y1, x2, y2)
    v_console_log('traces:', traces)
    for (var j = 0; j < traces.length; j++) {
      var x = traces[j][0]
      var y = traces[j][0]
      for (var i = 0; i < (v_events['mousemove'] || []).length; i++) { v_events['mousemove'][i][1](make_touch(v_events['mousemove'][i][0], 'mousemove', x, y)) }
    }
  }
  window.make_mouse = make_mouse
  window.mouse_click = mouse_click
  window.mouse_move = mouse_move
  window.touch = touch
  EventTarget.prototype.addEventListener = function(){v_console_log('  [*] EventTarget -> addEventListener[func]', this===window?'[Window]':this===document?'[Document]':this, [].slice.call(arguments)); add_event(this, [].slice.call(arguments)); return null}
  EventTarget.prototype.dispatchEvent = function(){v_console_log('  [*] EventTarget -> dispatchEvent[func]', this===window?'[Window]':this===document?'[Document]':this, [].slice.call(arguments)); add_event(this, [].slice.call(arguments)); return null}
  EventTarget.prototype.removeEventListener = function(){v_console_log('  [*] EventTarget -> removeEventListener[func]', this===window?'[Window]':this===document?'[Document]':this, [].slice.call(arguments)); add_event(this, [].slice.call(arguments)); return null}
}
function v_init_Element_prototype(){
  Element.prototype.appendChild            = Element.prototype.appendChild            || v_saf(function appendChild(){v_console_log("  [*] Element -> appendChild[func]", [].slice.call(arguments));})
  Element.prototype.removeChild            = Element.prototype.removeChild            || v_saf(function removeChild(){v_console_log("  [*] Element -> removeChild[func]", [].slice.call(arguments));})
  Element.prototype.getAnimations          = Element.prototype.getAnimations          || v_saf(function getAnimations(){v_console_log("  [*] Element -> getAnimations[func]", [].slice.call(arguments));})
  Element.prototype.getAttribute           = Element.prototype.getAttribute           || v_saf(function getAttribute(){v_console_log("  [*] Element -> getAttribute[func]", [].slice.call(arguments));})
  Element.prototype.getAttributeNS         = Element.prototype.getAttributeNS         || v_saf(function getAttributeNS(){v_console_log("  [*] Element -> getAttributeNS[func]", [].slice.call(arguments));})
  Element.prototype.getAttributeNames      = Element.prototype.getAttributeNames      || v_saf(function getAttributeNames(){v_console_log("  [*] Element -> getAttributeNames[func]", [].slice.call(arguments));})
  Element.prototype.getAttributeNode       = Element.prototype.getAttributeNode       || v_saf(function getAttributeNode(){v_console_log("  [*] Element -> getAttributeNode[func]", [].slice.call(arguments));})
  Element.prototype.getAttributeNodeNS     = Element.prototype.getAttributeNodeNS     || v_saf(function getAttributeNodeNS(){v_console_log("  [*] Element -> getAttributeNodeNS[func]", [].slice.call(arguments));})
  Element.prototype.getBoundingClientRect  = Element.prototype.getBoundingClientRect  || v_saf(function getBoundingClientRect(){v_console_log("  [*] Element -> getBoundingClientRect[func]", [].slice.call(arguments));})
  Element.prototype.getClientRects         = Element.prototype.getClientRects         || v_saf(function getClientRects(){v_console_log("  [*] Element -> getClientRects[func]", [].slice.call(arguments));})
  Element.prototype.getElementsByClassName = Element.prototype.getElementsByClassName || v_saf(function getElementsByClassName(){v_console_log("  [*] Element -> getElementsByClassName[func]", [].slice.call(arguments));})
  Element.prototype.getElementsByTagName   = Element.prototype.getElementsByTagName   || v_saf(function getElementsByTagName(){v_console_log("  [*] Element -> getElementsByTagName[func]", [].slice.call(arguments));})
  Element.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS || v_saf(function getElementsByTagNameNS(){v_console_log("  [*] Element -> getElementsByTagNameNS[func]", [].slice.call(arguments));})
  Element.prototype.getInnerHTML           = Element.prototype.getInnerHTML           || v_saf(function getInnerHTML(){v_console_log("  [*] Element -> getInnerHTML[func]", [].slice.call(arguments));})
  Element.prototype.hasAttribute           = Element.prototype.hasAttribute           || v_saf(function hasAttribute(){v_console_log("  [*] Element -> hasAttribute[func]", [].slice.call(arguments));})
  Element.prototype.hasAttributeNS         = Element.prototype.hasAttributeNS         || v_saf(function hasAttributeNS(){v_console_log("  [*] Element -> hasAttributeNS[func]", [].slice.call(arguments));})
  Element.prototype.hasAttributes          = Element.prototype.hasAttributes          || v_saf(function hasAttributes(){v_console_log("  [*] Element -> hasAttributes[func]", [].slice.call(arguments));})
  Element.prototype.hasPointerCapture      = Element.prototype.hasPointerCapture      || v_saf(function hasPointerCapture(){v_console_log("  [*] Element -> hasPointerCapture[func]", [].slice.call(arguments));})
  Element.prototype.webkitMatchesSelector  = Element.prototype.webkitMatchesSelector  || v_saf(function webkitMatchesSelector(){v_console_log("  [*] Element -> webkitMatchesSelector[func]", [].slice.call(arguments));})
}
function v_init_HTMLElement(){
  try{
    Object.defineProperties(HTMLElement.prototype, {
      style: {set: undefined, enumerable: true, configurable: true, get: v_saf(function style(){v_console_log("  [*] HTMLElement -> style[get]", [].slice.call(arguments)); return this.v_style })},
    })
  }catch(e){
    v_console_log(e)
  }
}
function v_init_DOMTokenList_prototype(){
  DOMTokenList.prototype.add = DOMTokenList.prototype.add || v_saf(function add(){v_console_log("  [*] DOMTokenList -> add[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.contains = DOMTokenList.prototype.contains || v_saf(function contains(){v_console_log("  [*] DOMTokenList -> contains[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.entries = DOMTokenList.prototype.entries || v_saf(function entries(){v_console_log("  [*] DOMTokenList -> entries[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.forEach = DOMTokenList.prototype.forEach || v_saf(function forEach(){v_console_log("  [*] DOMTokenList -> forEach[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.item = DOMTokenList.prototype.item || v_saf(function item(){v_console_log("  [*] DOMTokenList -> item[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.keys = DOMTokenList.prototype.keys || v_saf(function keys(){v_console_log("  [*] DOMTokenList -> keys[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.length = DOMTokenList.prototype.length || v_saf(function length(){v_console_log("  [*] DOMTokenList -> length[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.remove = DOMTokenList.prototype.remove || v_saf(function remove(){v_console_log("  [*] DOMTokenList -> remove[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.replace = DOMTokenList.prototype.replace || v_saf(function replace(){v_console_log("  [*] DOMTokenList -> replace[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.supports = DOMTokenList.prototype.supports || v_saf(function supports(){v_console_log("  [*] DOMTokenList -> supports[func]", [].slice.call(arguments));})
  DOMTokenList.prototype.toggle = DOMTokenList.prototype.toggle || v_saf(function toggle(){v_console_log("  [*] DOMTokenList -> toggle[func]", [].slice.call(arguments));})
}
function v_init_CSSStyleDeclaration_prototype(){
  CSSStyleDeclaration.prototype["zoom"] = ''
  CSSStyleDeclaration.prototype["resize"] = ''
  CSSStyleDeclaration.prototype["text-rendering"] = ''
  CSSStyleDeclaration.prototype["text-align-last"] = ''
}
function v_init_PointerEvent_prototype(){
  PointerEvent.prototype.getCoalescedEvents = v_saf(function getCoalescedEvents(){v_console_log("  [*] PointerEvent -> getCoalescedEvents[func]", [].slice.call(arguments));})
  PointerEvent.prototype.getPredictedEvents = v_saf(function getPredictedEvents(){v_console_log("  [*] PointerEvent -> getPredictedEvents[func]", [].slice.call(arguments));})
}
function v_init_PerformanceTiming_prototype(){
  try{
    Object.defineProperties(PerformanceTiming.prototype, {
      connectEnd: {set: undefined, enumerable: true, configurable: true, get: v_saf(function connectEnd(){v_console_log("  [*] PerformanceTiming -> connectEnd[get]", [].slice.call(arguments));})},
      connectStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function connectStart(){v_console_log("  [*] PerformanceTiming -> connectStart[get]", [].slice.call(arguments));})},
      domComplete: {set: undefined, enumerable: true, configurable: true, get: v_saf(function domComplete(){v_console_log("  [*] PerformanceTiming -> domComplete[get]", [].slice.call(arguments));})},
      domContentLoadedEventEnd: {set: undefined, enumerable: true, configurable: true, get: v_saf(function domContentLoadedEventEnd(){v_console_log("  [*] PerformanceTiming -> domContentLoadedEventEnd[get]", [].slice.call(arguments));})},
      domContentLoadedEventStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function domContentLoadedEventStart(){v_console_log("  [*] PerformanceTiming -> domContentLoadedEventStart[get]", [].slice.call(arguments));})},
      domInteractive: {set: undefined, enumerable: true, configurable: true, get: v_saf(function domInteractive(){v_console_log("  [*] PerformanceTiming -> domInteractive[get]", [].slice.call(arguments));})},
      domLoading: {set: undefined, enumerable: true, configurable: true, get: v_saf(function domLoading(){v_console_log("  [*] PerformanceTiming -> domLoading[get]", [].slice.call(arguments));})},
      domainLookupEnd: {set: undefined, enumerable: true, configurable: true, get: v_saf(function domainLookupEnd(){v_console_log("  [*] PerformanceTiming -> domainLookupEnd[get]", [].slice.call(arguments));})},
      domainLookupStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function domainLookupStart(){v_console_log("  [*] PerformanceTiming -> domainLookupStart[get]", [].slice.call(arguments));})},
      fetchStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function fetchStart(){v_console_log("  [*] PerformanceTiming -> fetchStart[get]", [].slice.call(arguments));})},
      loadEventEnd: {set: undefined, enumerable: true, configurable: true, get: v_saf(function loadEventEnd(){v_console_log("  [*] PerformanceTiming -> loadEventEnd[get]", [].slice.call(arguments));})},
      loadEventStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function loadEventStart(){v_console_log("  [*] PerformanceTiming -> loadEventStart[get]", [].slice.call(arguments));})},
      navigationStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function navigationStart(){v_console_log("  [*] PerformanceTiming -> navigationStart[get]", [].slice.call(arguments));})},
      redirectEnd: {set: undefined, enumerable: true, configurable: true, get: v_saf(function redirectEnd(){v_console_log("  [*] PerformanceTiming -> redirectEnd[get]", [].slice.call(arguments));})},
      redirectStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function redirectStart(){v_console_log("  [*] PerformanceTiming -> redirectStart[get]", [].slice.call(arguments));})},
      requestStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function requestStart(){v_console_log("  [*] PerformanceTiming -> requestStart[get]", [].slice.call(arguments));})},
      responseEnd: {set: undefined, enumerable: true, configurable: true, get: v_saf(function responseEnd(){v_console_log("  [*] PerformanceTiming -> responseEnd[get]", [].slice.call(arguments));})},
      responseStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function responseStart(){v_console_log("  [*] PerformanceTiming -> responseStart[get]", [].slice.call(arguments));})},
      secureConnectionStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function secureConnectionStart(){v_console_log("  [*] PerformanceTiming -> secureConnectionStart[get]", [].slice.call(arguments));})},
      unloadEventEnd: {set: undefined, enumerable: true, configurable: true, get: v_saf(function unloadEventEnd(){v_console_log("  [*] PerformanceTiming -> unloadEventEnd[get]", [].slice.call(arguments));})},
      unloadEventStart: {set: undefined, enumerable: true, configurable: true, get: v_saf(function unloadEventStart(){v_console_log("  [*] PerformanceTiming -> unloadEventStart[get]", [].slice.call(arguments));})},
    })
  }catch(e){}
}
function mk_atob_btoa(r){var a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",t=new Array(-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,52,53,54,55,56,57,58,59,60,61,-1,-1,-1,-1,-1,-1,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,-1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1);return{atob:function(r){var a,e,o,h,c,i,n;for(i=r.length,c=0,n="";c<i;){do{a=t[255&r.charCodeAt(c++)]}while(c<i&&-1==a);if(-1==a)break;do{e=t[255&r.charCodeAt(c++)]}while(c<i&&-1==e);if(-1==e)break;n+=String.fromCharCode(a<<2|(48&e)>>4);do{if(61==(o=255&r.charCodeAt(c++)))return n;o=t[o]}while(c<i&&-1==o);if(-1==o)break;n+=String.fromCharCode((15&e)<<4|(60&o)>>2);do{if(61==(h=255&r.charCodeAt(c++)))return n;h=t[h]}while(c<i&&-1==h);if(-1==h)break;n+=String.fromCharCode((3&o)<<6|h)}return n},btoa:function(r){var t,e,o,h,c,i;for(o=r.length,e=0,t="";e<o;){if(h=255&r.charCodeAt(e++),e==o){t+=a.charAt(h>>2),t+=a.charAt((3&h)<<4),t+="==";break}if(c=r.charCodeAt(e++),e==o){t+=a.charAt(h>>2),t+=a.charAt((3&h)<<4|(240&c)>>4),t+=a.charAt((15&c)<<2),t+="=";break}i=r.charCodeAt(e++),t+=a.charAt(h>>2),t+=a.charAt((3&h)<<4|(240&c)>>4),t+=a.charAt((15&c)<<2|(192&i)>>6),t+=a.charAt(63&i)}return t}}}
var atob_btoa = mk_atob_btoa()
window.btoa = window.btoa || v_saf(atob_btoa.btoa, 'btoa')
window.atob = window.atob || v_saf(atob_btoa.atob, 'atob')
window.postMessage = v_saf(function(){v_console_log('  [*] [postMessage]', arguments)}, 'postMessage')
window.matchMedia = v_saf(function(){v_console_log('  [*] [matchMedia]', arguments); return v_proxy({}, 'matchMedia{}')}, 'matchMedia')
`
        }
        if (idx == 2){
            return `
var win = {
  window: window,
  frames: window,
  parent: window,
  self: window,
  top: window,
}
function v_repair_this(){
  win = {
    window: __globalThis__,
    frames: __globalThis__,
    parent: __globalThis__,
    self: __globalThis__,
    top: __globalThis__,
  }
}
Object.defineProperties(window, {
  window: {get:function(){return win.window},set:function(e){return true}},
  frames: {get:function(){return win.frames},set:function(e){return true}},
  parent: {get:function(){return win.parent},set:function(e){return true}},
  self:   {get:function(){return win.self},  set:function(e){return true}},
  top:    {get:function(){return win.top},   set:function(e){return true}},
})
      `
        }
        if (idx == 0){
            return `
  this.getRandomValues = function(){
    v_console_log('  [*] Crypto -> getRandomValues[func]')
    var e=arguments[0]; return e.map(function(x, i){return e[i]=v_random()*1073741824});}
  this.randomUUID = function(){
    v_console_log('  [*] Crypto -> randomUUID[func]')
    function get2(){return (v_random()*255^0).toString(16).padStart(2,'0')}
    function rpt(func,num){var r=[];for(var i=0;i<num;i++){r.push(func())};return r.join('')}
    return [rpt(get2,4),rpt(get2,2),rpt(get2,2),rpt(get2,2),rpt(get2,6)].join('-')}`
        }
        if (idx == 1){
            return `
  function WebGLBuffer(){}
  function WebGLProgram(){}
  function WebGLShader(){}
  this._toggle = {}
  this.createBuffer = function(){ v_console_log('  [*] WebGLRenderingContext -> createBuffer[func]'); return v_new(WebGLBuffer) }
  this.createProgram = function(){ v_console_log('  [*] WebGLRenderingContext -> createProgram[func]'); return v_new(WebGLProgram) }
  this.createShader = function(){ v_console_log('  [*] WebGLRenderingContext -> createShader[func]'); return v_new(WebGLShader) }
  this.getSupportedExtensions = function(){
    v_console_log('  [*] WebGLRenderingContext -> getSupportedExtensions[func]')
    return [
      "ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_color_buffer_half_float", "EXT_disjoint_timer_query", "EXT_float_blend", "EXT_frag_depth",
      "EXT_shader_texture_lod", "EXT_texture_compression_bptc", "EXT_texture_compression_rgtc", "EXT_texture_filter_anisotropic", "WEBKIT_EXT_texture_filter_anisotropic", "EXT_sRGB",
      "KHR_parallel_shader_compile", "OES_element_index_uint", "OES_fbo_render_mipmap", "OES_standard_derivatives", "OES_texture_float", "OES_texture_float_linear",
      "OES_texture_half_float", "OES_texture_half_float_linear", "OES_vertex_array_object", "WEBGL_color_buffer_float", "WEBGL_compressed_texture_s3tc", 
      "WEBKIT_WEBGL_compressed_texture_s3tc", "WEBGL_compressed_texture_s3tc_srgb", "WEBGL_debug_renderer_info", "WEBGL_debug_shaders",
      "WEBGL_depth_texture","WEBKIT_WEBGL_depth_texture","WEBGL_draw_buffers","WEBGL_lose_context","WEBKIT_WEBGL_lose_context","WEBGL_multi_draw",
    ]
  }
  var self = this
  this.getExtension = function(key){
    v_console_log('  [*] WebGLRenderingContext -> getExtension[func]:', key)
    class WebGLDebugRendererInfo{
      get UNMASKED_VENDOR_WEBGL(){self._toggle[37445]=1;return 37445}
      get UNMASKED_RENDERER_WEBGL(){self._toggle[37446]=1;return 37446}
    }
    class EXTTextureFilterAnisotropic{}
    class WebGLLoseContext{
      loseContext(){}
      restoreContext(){}
    }
    if (key == 'WEBGL_debug_renderer_info'){ var r = new WebGLDebugRendererInfo }
    if (key == 'EXT_texture_filter_anisotropic'){ var r = new EXTTextureFilterAnisotropic }
    if (key == 'WEBGL_lose_context'){ var r = new WebGLLoseContext }
    else{ var r = new WebGLDebugRendererInfo }
    return r
  }
  this.getParameter = function(key){
    v_console_log('  [*] WebGLRenderingContext -> getParameter[func]:', key)
    if (this._toggle[key]){
      if (key == 37445){ return "Google Inc. (NVIDIA)" }
      if (key == 37446){ return "ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0, D3D11-27.21.14.5671)" }
    }else{
      if (key == 33902){ return new Float32Array([1,1]) }
      if (key == 33901){ return new Float32Array([1,1024]) }
      if (key == 35661){ return 32 }
      if (key == 34047){ return 16 }
      if (key == 34076){ return 16384 }
      if (key == 36349){ return 1024 }
      if (key == 34024){ return 16384 }
      if (key == 34930){ return 16 }
      if (key == 3379){ return 16384 }
      if (key == 36348){ return 30 }
      if (key == 34921){ return 16 }
      if (key == 35660){ return 16 }
      if (key == 36347){ return 4095 }
      if (key == 3386){ return new Int32Array([32767, 32767]) }
      if (key == 3410){ return 8 }
      if (key == 7937){ return "WebKit WebGL" }
      if (key == 35724){ return "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)" }
      if (key == 3415){ return 0 }
      if (key == 7936){ return "WebKit" }
      if (key == 7938){ return "WebGL 1.0 (OpenGL ES 2.0 Chromium)" }
      if (key == 3411){ return 8 }
      if (key == 3412){ return 8 }
      if (key == 3413){ return 8 }
      if (key == 3414){ return 24 }
      return null
    }
  }
  this.getContextAttributes = function(){
    v_console_log('  [*] WebGLRenderingContext -> getContextAttributes[func]')
    return {
      alpha: true,
      antialias: true,
      depth: true,
      desynchronized: false,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "default",
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      stencil: false,
      xrCompatible: false,
    }
  }
  this.getShaderPrecisionFormat = function(a,b){
    v_console_log('  [*] WebGLRenderingContext -> getShaderPrecisionFormat[func]')
    function WebGLShaderPrecisionFormat(){}
    var r1 = v_new(WebGLShaderPrecisionFormat)
    r1.rangeMin = 127
    r1.rangeMax = 127
    r1.precision = 23
    var r2 = v_new(WebGLShaderPrecisionFormat)
    r2.rangeMin = 31
    r2.rangeMax = 30
    r2.precision = 0
    if (a == 35633 && b == 36338){ return r1 } if (a == 35633 && b == 36337){ return r1 } if (a == 35633 && b == 36336){ return r1 } 
    if (a == 35633 && b == 36341){ return r2 } if (a == 35633 && b == 36340){ return r2 } if (a == 35633 && b == 36339){ return r2 }
    if (a == 35632 && b == 36338){ return r1 } if (a == 35632 && b == 36337){ return r1 } if (a == 35632 && b == 36336){ return r1 }
    if (a == 35632 && b == 36341){ return r2 } if (a == 35632 && b == 36340){ return r2 } if (a == 35632 && b == 36339){ return r2 }
    throw Error('getShaderPrecisionFormat')
  }
  v_saf(this.createBuffer, 'createBuffer')
  v_saf(this.createProgram, 'createProgram')
  v_saf(this.createShader, 'createShader')
  v_saf(this.getSupportedExtensions, 'getSupportedExtensions')
  v_saf(this.getExtension, 'getExtension')
  v_saf(this.getParameter, 'getParameter')
  v_saf(this.getContextAttributes, 'getContextAttributes')
  v_saf(this.getShaderPrecisionFormat, 'getShaderPrecisionFormat')`
        }
    }
    var _envs = envs
    var envs = _envs[0]
    var eles = _envs[1]
    var configs = {
        EventTarget: {
            addEventListener: { ban: true },
        },
        Document: {
            createElement: { ban: true },
            documentElement: { ban: true },
            cookie: { ban: true },
            getElementById: { ban: true },
            getElementsByClassName: { ban: true },
            getElementsByName: { ban: true },
            getElementsByTagName: { ban: true },
            getElementsByTagNameNS: { ban: true },
            querySelector: { ban: true },
            querySelectorAll: { ban: true },
            body: { ban: true },
            head: { ban: true },
        },
        Navigator:{
            javaEnabled:{ value: 'return true' },
            plugins: {value: `return this._plugins || []`},
            mimeTypes:  {value: `return this._mimeTypes || []`},
            __init__: {value: `this._plugins = typeof PluginArray=='undefined'?[]:v_new(PluginArray); this._mimeTypes = typeof MimeTypeArray=='undefined'?[]:v_new(MimeTypeArray)`}
        },
        Node: {
            appendChild: {value: ''},
            removeChild: {value: ''},
        },
        XMLHttpRequest: {
            onreadystatechange: { ban: true },
            readyState: { ban: true },
            timeout: { ban: true },
            withCredentials: { ban: true },
            upload: { ban: true },
            responseURL: { ban: true },
            status: { ban: true },
            statusText: { ban: true },
            responseType: { ban: true },
            response: { ban: true },
            responseText: { ban: true },
            responseXML: { ban: true },
            UNSENT: { ban: true },
            OPENED: { ban: true },
            HEADERS_RECEIVED: { ban: true },
            LOADING: { ban: true },
            DONE: { ban: true },
            abort: { ban: true },
            getAllResponseHeaders: { ban: true },
            getResponseHeader: { ban: true },
            open: { ban: true },
            overrideMimeType: { ban: true },
            send: { ban: true },
            setRequestHeader: { ban: true },
        },
        MouseEvent: {
            type: { ban: true },
            canBubble: { ban: true },
            cancelable: { ban: true },
            view: { ban: true },
            detail: { ban: true },
            screenX: { ban: true },
            movementX: { ban: true },
            screenY: { ban: true },
            movementY: { ban: true },
            clientX: { ban: true },
            layerX: { ban: true },
            offsetX: { ban: true },
            pageX: { ban: true },
            x: { ban: true },
            clientY: { ban: true },
            layerY: { ban: true },
            offsetY: { ban: true },
            pageY: { ban: true },
            y: { ban: true },
            ctrlKey: { ban: true },
            altKey: { ban: true },
            shiftKey: { ban: true },
            metaKey: { ban: true },
            button: { ban: true },
            relatedTarget: { ban: true },
        },
        HTMLElement: {
            style: { ban: true },
        },
        Element: {
            innerHTML: { ban: true },
            outerHTML: { ban: true },
            tagName: {value: 'return this.v_tagName'},
        },
        Storage:{
            clear:{ ban: true },
            getItem:{ ban: true },
            setItem:{ ban: true },
            key:{ ban: true },
            removeItem:{ ban: true },
            length:{ ban: true },
        },
        PluginArray: {
            __init__: {
                value: function(){
                    var _plugins = navigator.plugins
                    var _ret = []
                    for (var i = 0; i < _plugins.length; i++) {
                        _ret.push([
                            `  this[${i}]=v_new(Plugin);`,
                            `this[${i}].description=${JSON.stringify(_plugins[i].description)};`,
                            `this[${i}].filename=${JSON.stringify(_plugins[i].filename)};`,
                            `this[${i}].length=${JSON.stringify(_plugins[i].length)};`,
                            `this[${i}].name=${JSON.stringify(_plugins[i].name)};`,
                        ].join(''))
                    }
                    return '\n' + _ret.join('\n')
                }
            }
        },
        Plugin:{
            description: { ban: true },
            filename: { ban: true },
            length: { ban: true },
            name: { ban: true },
        },
        Crypto: {
            getRandomValues: { ban: true },
            randomUUID: { ban: true },
            __init__: {
                value: make_long_string(0)
            },
        },
        MimeTypeArray: {
            __init__: {
                value: function(){
                    var _mimeTypes = navigator.mimeTypes
                    var _ret = []
                    for (var i = 0; i < _mimeTypes.length; i++) {
                        _ret.push([
                            `  this[${i}]=v_new(Plugin);`,
                            `this[${i}].description=${JSON.stringify(_mimeTypes[i].description)};`,
                            `this[${i}].enabledPlugin=${JSON.stringify(_mimeTypes[i].enabledPlugin)};`,
                            `this[${i}].suffixes=${JSON.stringify(_mimeTypes[i].suffixes)};`,
                            `this[${i}].type=${JSON.stringify(_mimeTypes[i].type)};`,
                        ].join(''))
                    }
                    return '\n' + _ret.join('\n')
                }
            }
        },
        MimeType:{
            description: { ban: true },
            enabledPlugin: { ban: true },
            suffixes: { ban: true },
            type: { ban: true },
        },
        SVGElement: {
            style: {value: ''},
        },
        Image:{
            __init__: {value: 'return v_new(HTMLImageElement)'}
        },
        HTMLCanvasElement:{
            getContext: {value: `if (arguments[0]=='2d'){var r = v_new(CanvasRenderingContext2D); return r}; if (arguments[0]=='webgl' || arguments[0]=='experimental-webgl'){var r = v_new(WebGLRenderingContext); r._canvas = this; return r}; return null`},
            toDataURL: { ban: true },
        },
        WebGLRenderingContext: {
            canvas: {value: `return this._canvas`},
            createBuffer: { ban: true },
            createProgram: { ban: true },
            createShader: { ban: true },
            getSupportedExtensions: { ban: true },
            getExtension: { ban: true },
            getParameter: { ban: true },
            getContextAttributes: { ban: true },
            getShaderPrecisionFormat: { ban: true },
            __init__:{
                value: make_long_string(1)
            },
        },
        HTMLDocument: {__init__:{
            value: `Object.defineProperty(this, 'location', {get(){return location}})`
        }},
        Performance:{
            timing:{
                value: `return v_new(PerformanceTiming)`
            },
            getEntriesByType:{
                value: `if (arguments[0]=='resource'){return v_new(PerformanceResourceTiming)}`
            }
        },
        HTMLAnchorElement:{
            __init__:{
                value: `v_hook_href(this, 'HTMLAnchorElement', location.href)`
            },
            href: { ban: true },
            protocol: { ban: true },
            host: { ban: true },
            search: { ban: true },
            hash: { ban: true },
            hostname: { ban: true },
            port: { ban: true },
            pathname: { ban: true },
        },
    }
    var avoid_obj = ['URL']
    function make_chain(name){
        if (avoid_obj.indexOf(name) != -1){
            return []
        }
        var _name = name
        var list = []
        if (window[_name]){
            list.push(_name)
        }
        while(window[_name]){
            _name = Object.getPrototypeOf(window[_name]).name
            if (_name){
                list.push(_name)
            }
        }
        return list
    }
    function is_literal(value){
        var allc = ['string', 'number', 'boolean', 'undefined']
        return allc.indexOf(typeof value) != -1 || value === null
    }
    function get_class_name(obj){
        return /\[object ([^\]]+)\]/.exec(Object.prototype.toString.call(obj))[1]
    }
    function check_ban(clazz, name){
        return configs[clazz] && configs[clazz][name] && configs[clazz][name].ban
    }
    function make_return(clazz, name, value, type){
        var ret
        var tog
        if (configs[clazz] && configs[clazz][name]){
            ret = configs[clazz][name].value
            if (typeof ret == 'function'){
                ret = ret()
            }
            tog = true
        }
        else if (typeof value != 'undefined'){
            ret = 'return ' + value
        }
        else{
            ret = ''
        }
        var prefix = ''
        if (type != 'get'){
            var prefix = `v_console_log("  [*] ${clazz} -> ${name}[${type}]", [].slice.call(arguments))`
        }else{
            var val = /return (.*)|(.*)/.exec(ret)
            var val = val[1] || val[2]
            var prefix = `v_console_log("  [*] ${clazz} -> ${name}[${type}]", ${tog?val:value})`
        }
        return prefix + ';' + ret
    }
    function make_init(clazz){
        var ret;
        if (configs[clazz] && configs[clazz]['__init__']){
            ret = configs[clazz]['__init__'].value
            if (typeof ret == 'function'){
                ret = ret()
            }
        }else{
            ret = ''
        }
        return ret
    }
    var v_window_cache = {}
    var v_window_cache_list = []
    var v_winkeys = Object.getOwnPropertyNames(window)
    for (var i = 0; i < v_winkeys.length; i++) {
        if (typeof v_winkeys[i] == 'string'){
            v_window_cache[v_winkeys[i]] = window[v_winkeys[i]]
            v_window_cache_list.push({name:v_winkeys[i], value:window[v_winkeys[i]]})
        }
    }
    function get_objname_in_win(clazz){
        for (var i = 0; i < v_window_cache_list.length; i++) {
            if (v_window_cache_list[i].value instanceof clazz){
                return v_window_cache_list[i]
            }
        }
    }
    function make_s(renv, clazz_f, isout){
        var clazz = clazz_f[0]
        var father = clazz_f[1]
        if (!renv[clazz]){
            var lst = []
        }else{
            var lst = Object.keys(renv[clazz])
        }
        var inner = []
        try{
            new window[clazz]
            var cannew = true
        }catch(e){
            var cannew = false
        }
        for (var i = 0; i < lst.length; i++) {
            var name = lst[i]
            var temp = renv[clazz][name]
            if (check_ban(clazz, name)){
                continue
            }
            if (temp.get||temp.set){
                var alls = []
                if (temp.get){
                    var value = JSON.stringify(temp.get.value)
                    var getter = `get(){ ${make_return(clazz, name, value, 'get')} }`
                    alls.push(getter)
                }
                if (temp.set){
                    var setter = `set(){ ${make_return(clazz, name, value, 'set')} }`
                    alls.push(setter)
                }

                inner.push(`  ${name}: {${alls.join(',')}},`)
            }
            if (temp.func){
                inner.push(`  ${name}: {value: v_saf(function ${name}(){${make_return(clazz, name, undefined, 'func')}})},`)
            }
        }
        var plist = Object.keys((v_window_cache[clazz] || window[clazz]).prototype)
        plist.push(Symbol.toStringTag)
        for (var i = 0; i < plist.length; i++) {
            try{
                var _desc = Object.getOwnPropertyDescriptors(window[clazz].prototype)[plist[i]]
                if (_desc.value){
                    var value = window[clazz].prototype[plist[i]]
                    if (is_literal(value)){
                        var _desc = Object.getOwnPropertyDescriptors(window[clazz].prototype)[plist[i]]
                        if (_desc){
                            inner.push(`  ${plist[i]}: ${JSON.stringify(_desc)},`)
                        }
                    }
                }
                if (_desc.get){
                    var obj = get_objname_in_win(window[clazz])
                    if (obj.name){
                        if (check_ban(clazz, plist[i])){
                            continue
                        }
                        var val = obj.value[plist[i]]
                        if (typeof val == 'string' 
                            ||typeof val == 'number'
                            ||typeof val == 'boolean'
                            ||plist[i] == 'languages'){
                            // console.log(clazz, plist[i], check_ban(clazz, plist[i]), obj.value[plist[i]])
                            inner.push(`  ${plist[i]}: {"enumerable":${_desc.enumerable},"configurable":${_desc.enumerable},"get":function(){return ${JSON.stringify(val)}},"set":function(){return true}},`)
                        }
                    }
                    // inner.push(`  ${plist[i]}: ${JSON.stringify(_desc)},`)
                }
            }catch(e){}
        }
        inner.push(`  [Symbol.toStringTag]: {value:"${clazz}",writable:false,enumerable:false,configurable:true},`)
        if (inner.length){
            inner.unshift(`Object.defineProperties(${clazz}.prototype, {`)
            inner.push(`})`)
        }
        var init = make_init(clazz, name)
        var ls = [
            `${clazz} = v_saf(function ${clazz}(){${cannew?'':'if (!v_new_toggle){ throw TypeError("Illegal constructor") }'};${init}})` + (father?`; _inherits(${clazz}, ${father})`:''),
        ]
        if (isout){
          return [ls, inner]
        }
        defines.push(...ls)
        definepros.push(...inner)
        // return ls.join('\n')
    }

    var ekeys = Object.keys(envs)
    var renv = {}
    var maxlen = 0
    if (!keys){ keys = ekeys }
    if (typeof keys == 'string'){ keys = [keys] }
    var collect = []
    for (var i = 0; i < keys.length; i++) {
        var e = envs[keys[i]]
        var temp = Object.keys(e)
        for (var j = 0; j < temp.length; j++) {
            renv[temp[j]] = renv[temp[j]] || {}
            var funcs = Object.keys(e[temp[j]])
            for (var k = 0; k < funcs.length; k++) {
                renv[temp[j]][funcs[k]] = renv[temp[j]][funcs[k]] || {}
                var types = Object.keys(e[temp[j]][funcs[k]])
                for (var l = 0; l < types.length; l++) {
                    renv[temp[j]][funcs[k]][types[l]] = renv[temp[j]][funcs[k]][types[l]] || {}
                    renv[temp[j]][funcs[k]][types[l]].value = e[temp[j]][funcs[k]][types[l]].value
                }
            }
            var ls = make_chain(temp[j])
            collect.push(ls)
            maxlen = ls.length > maxlen ? ls.length : maxlen
        }
    }
    // if (!maxlen){ return }
    for (var i = 0; i < collect.length; i++) {
        var len = maxlen - collect[i].length
        for (var j = 0; j < len; j++) {
            collect[i].unshift(undefined)
        }
    }
    var sorted = []
    var dicter = {}
    for (var i = maxlen - 1; i >= 0; i--) {
        for (var j = 0; j < collect.length; j++) {
            var temp = collect[j][i]
            var pref = collect[j][i+1]
            if (temp && sorted.indexOf(temp) == -1){
                dicter[temp] = [temp, pref]
                sorted.push(temp)
            }
        }
    }
    var prefix = [
        `function _inherits(t, e) {`,
        `  t.prototype = Object.create(e.prototype, {`,
        `    constructor: { value: t, writable: !0, configurable: !0 }`,
        `  }), e && Object.setPrototypeOf(t, e) }`,
        `Object.defineProperty(Object.prototype, Symbol.toStringTag, {`,
        `  get() { return Object.getPrototypeOf(this).constructor.name }, configurable:true,`,
        `});`,

        'var v_new_toggle = true',
        // 'Object.freeze(console)//only for javascript-obfuscator anti console debug.',
        'var v_console_logger = console.log',
        'var v_allow_types = ["string", "number", "boolean"]',
        'console.log=v_saf(function(a){if (v_allow_types.indexOf(typeof a)!=-1){v_console_logger.apply(this, arguments)}}, "log")',
        'console.debug=v_saf(function(a){if (v_allow_types.indexOf(typeof a)!=-1){v_console_logger.apply(this, arguments)}}, "debug")',
        'console.warn=v_saf(function(a){if (v_allow_types.indexOf(typeof a)!=-1){v_console_logger.apply(this, arguments)}}, "warn")',
        'console.info=v_saf(function(a){if (v_allow_types.indexOf(typeof a)!=-1){v_console_logger.apply(this, arguments)}}, "info")',
        //'console.groupEnd=v_saf(function(){}, "groupEnd")',
        'var v_console_log = function(){if (!v_new_toggle){ v_console_logger.apply(this, arguments) }}',
        'var v_random = (function() { var seed = 276951438; return function random() { return seed = (seed * 9301 + 49297) % 233280, (seed / 233280)} })()',
        'var v_new = function(v){var temp=v_new_toggle; v_new_toggle = true; var r = new v; v_new_toggle = temp; return r}',
    ]
    var defines = []
    var definepros = []
    for (var i = 0; i < sorted.length; i++) {
        make_s(renv, dicter[sorted[i]])
    }

    function patcher(name){
      var list = make_chain(name)
      if (list.length >= 3){
        var lsinner = []
        for (var i = 0; i < list.length-1; i++) {
          if (!dicter[list[i]]){
            dicter[list[i]] = 1; 
            lsinner.push(make_s(renv, [list[i], list[i+1]], true))
          }
        }
        for (var i = lsinner.length - 1; i >= 0; i--) {
          var _lsin = lsinner[i]
          defines.push(..._lsin[0])
          definepros.push(..._lsin[1])
        }
      }else{
        if (!dicter[name]){
          dicter[name] = 1; 
          make_s(renv, make_chain(name))
        }
      }
    }
    patcher('Window')
    patcher('Screen')
    patcher('HTMLDocument')
    patcher('HTMLHtmlElement')
    patcher('HTMLHeadElement')
    patcher('HTMLBodyElement')
    patcher('Navigator')
    patcher('PluginArray')
    patcher('Plugin')
    patcher('MimeTypeArray')
    patcher('MimeType')
    patcher('CSSStyleDeclaration')
    patcher('Location')
    patcher('HTMLCanvasElement')
    patcher('WebGLRenderingContext')
    patcher('CanvasRenderingContext2D')
    patcher('Performance')
    patcher('PerformanceEntry')
    patcher('PerformanceElementTiming')
    patcher('PerformanceEventTiming')
    patcher('PerformanceLongTaskTiming')
    patcher('PerformanceMark')
    patcher('PerformanceMeasure')
    patcher('PerformanceNavigation')
    patcher('PerformanceNavigationTiming')
    patcher('PerformanceObserver')
    patcher('PerformanceObserverEntryList')
    patcher('PerformancePaintTiming')
    patcher('PerformanceResourceTiming')
    patcher('PerformanceServerTiming')
    patcher('PerformanceTiming')
    patcher('PerformanceResourceTiming')
    patcher('Image')
    patcher('HTMLImageElement')
    patcher('HTMLMediaElement')
    patcher('HTMLUnknownElement')
    patcher('XMLHttpRequest')
    patcher('Storage')
    patcher('DOMTokenList')
    patcher('Touch')
    patcher('TouchEvent')
    patcher('Event')
    patcher('MouseEvent')
    patcher('PointerEvent')
    
    var _global = []
    var _gcache = []
    var _mpname = []
    var list = Object.keys(window)
    var _list = []
    var _first = ['self', 'top', 'frames', 'parent']
    for (var i = 0; i < list.length; i++) {
        if (_first.indexOf(list[i]) != -1){
            _list.unshift(list[i])
        }else if (list[i] != 'window'){
            _list.push(list[i])
        }
    }
    _list.unshift('window')

    var htmlmap = {
      HTMLElement: ["abbr", "address", "article", "aside", "b", "bdi", "bdo", "cite", "code", "dd", "dfn", "dt", "em", 
                    "figcaption", "figure", "footer", "header", "hgroup", "i", "kbd", "main", "mark", "nav", "noscript", 
                    "rp", "rt", "ruby", "s", "samp", "section", "small", "strong", "sub", "summary", "sup", "u", "var", "wbr"],
      HTMLAnchorElement: ["a"],          HTMLImageElement: ["img"],         HTMLFontElement: ["font"],                                HTMLOutputElement: ["output"], 
      HTMLAreaElement: ["area"],         HTMLInputElement: ["input"],       HTMLFormElement: ["form"],                                HTMLParagraphElement: ["p"], 
      HTMLAudioElement: ["audio"],       HTMLLabelElement: ["label"],       HTMLFrameElement: ["frame"],                              HTMLParamElement: ["param"], 
      HTMLBaseElement: ["base"],         HTMLLegendElement: ["legend"],     HTMLFrameSetElement: ["frameset"],                        HTMLPictureElement: ["picture"], 
      HTMLBodyElement: ["body"],         HTMLLIElement: ["li"],             HTMLHeadingElement: ["h1", "h2", "h3", "h4", "h5", "h6"], HTMLPreElement: ["listing", "pre", "xmp"], 
      HTMLBRElement: ["br"],             HTMLLinkElement: ["link"],         HTMLHeadElement: ["head"],                                HTMLProgressElement: ["progress"], 
      HTMLButtonElement: ["button"],     HTMLMapElement: ["map"],           HTMLHRElement: ["hr"],                                    HTMLQuoteElement: ["blockquote", "q"], 
      HTMLCanvasElement: ["canvas"],     HTMLMarqueeElement: ["marquee"],   HTMLHtmlElement: ["html"],                                HTMLScriptElement: ["script"], 
      HTMLDataElement: ["data"],         HTMLMediaElement: [],              HTMLIFrameElement: ["iframe"],                            HTMLTimeElement: ["time"], 
      HTMLDataListElement: ["datalist"], HTMLMenuElement: ["menu"],         HTMLSelectElement: ["select"],                            HTMLTitleElement: ["title"], 
      HTMLDetailsElement: ["details"],   HTMLMetaElement: ["meta"],         HTMLSlotElement: ["slot"],                                HTMLTableRowElement: ["tr"], 
      HTMLDialogElement: ["dialog"],     HTMLMeterElement: ["meter"],       HTMLSourceElement: ["source"],                            HTMLTableSectionElement: ["thead", "tbody", "tfoot"], 
      HTMLDirectoryElement: ["dir"],     HTMLModElement: ["del", "ins"],    HTMLSpanElement: ["span"],                                HTMLTemplateElement: ["template"], 
      HTMLDivElement: ["div"],           HTMLObjectElement: ["object"],     HTMLStyleElement: ["style"],                              HTMLTextAreaElement: ["textarea"], 
      HTMLDListElement: ["dl"],          HTMLOListElement: ["ol"],          HTMLTableCaptionElement: ["caption"],                     HTMLTrackElement: ["track"], 
      HTMLEmbedElement: ["embed"],       HTMLOptGroupElement: ["optgroup"], HTMLTableCellElement: ["th", "td"],                       HTMLUListElement: ["ul"], 
      HTMLFieldSetElement: ["fieldset"], HTMLOptionElement: ["option"],     HTMLTableColElement: ["col", "colgroup"],                 HTMLUnknownElement: [], 
      HTMLTableElement: ["table"],       HTMLVideoElement: ["video"]
    }
    var v_new_htmlmap = {}
    var v_eles = Object.keys(dicter)
    for (var i = 0; i < v_eles.length; i++) {
        if (htmlmap[v_eles[i]]){
            v_new_htmlmap[v_eles[i]] = htmlmap[v_eles[i]]
        }
    }
    v_new_htmlmap['HTMLAnchorElement'] = ["a"]; // 确保a标签存在
    v_new_htmlmap = htmlmap
    var v_createE = JSON.stringify(v_new_htmlmap, 0, 0)
    var v_cele = []
    if (v_createE.length > 3){
        v_cele.push('function _createElement(name){')
        v_cele.push('  '+ 'var htmlmap = ' + v_createE)
        v_cele.push(...[
            `  var ret, htmlmapkeys = Object.keys(htmlmap)`,
            `  name = name.toLocaleLowerCase()`,
            `  for (var i = 0; i < htmlmapkeys.length; i++) {`,
            `    if (htmlmap[htmlmapkeys[i]].indexOf(name) != -1){`,
            `      if (!window[htmlmapkeys[i]]){`,
            `        break`,
            `      }`,
            `      ret = v_new(window[htmlmapkeys[i]])`,
            `      break`,
            `    }`,
            `  }`,
            `  if (!ret){ ret = v_proxy(v_new(HTMLUnknownElement), 'HTMLUnknownElement', function(a){return function(){v_console_log(a,...arguments)}}) }`,
            `  if (typeof CSSStyleDeclaration != 'undefined') { ret.v_style = v_proxy(v_new(CSSStyleDeclaration), 'style') }`,
            `  ret.v_tagName = name.toUpperCase()`,
            `  return ret`,
        ])
        v_cele.push('}')
    }

    list = _list
    for (var i = 0; i < list.length; i++) {
        var obj = window[list[i]]
        var name = get_class_name(obj)
        if (dicter[name]){
            var idx = _gcache.indexOf(obj)
            if (idx == -1){
                _gcache.push(obj)
                _mpname.push(list[i])
                if (list[i] == 'window'){
                    _global.push(`if (typeof __dirname != 'undefined'){ __dirname = undefined }
if (typeof __filename != 'undefined'){ __filename = undefined }
if (typeof require != 'undefined'){ require = undefined }
if (typeof exports != 'undefined'){ exports = undefined }
if (typeof module != 'undefined'){ module = undefined }
if (typeof Buffer != 'undefined'){ Buffer = undefined }
var avoid_log = ['Symbol','Object','Number','RegExp','Boolean','String','constructor']
var __globalThis__ = typeof global != 'undefined' ? global : this
var window = new Proxy(v_new(Window), {
  get(a,b){ if(b=='global'){return}
    var r = a[b] || __globalThis__[b] 
    if (typeof b !== 'symbol' && avoid_log.indexOf(b) == -1){
      v_console_log('  [*] [window get '+b+'] ==>', r)
    }
    return r
  },
  set(a,b,c){ 
    if (b == 'onclick' && typeof c == 'function') { window.addEventListener('click', c) }
    if (b == 'onmousedown' && typeof c == 'function') { window.addEventListener('mousedown', c) }
    if (b == 'onmouseup' && typeof c == 'function') { window.addEventListener('mouseup', c) }
    __globalThis__[b] = a[b] = c 
    return true 
  },
})
function v_proxy(obj, name, func){
  return new Proxy(obj, {
    get(a,b){ if(b=='global'){return}
      var r = a[b]
      if (typeof b !== 'symbol' && avoid_log.indexOf(b) == -1){
        v_console_log('  [*] ['+name+' get '+b+'] ==>', r)
      }
      if (func && typeof r == 'undefined'){
        r = func(name)
      }
      return r
    },
    set(a,b,c){ 
      if (typeof b !== 'symbol' && avoid_log.indexOf(b) == -1){
        v_console_log('  [*] ['+name+' set '+b+'] <--', c)
      }
      a[b] = c 
      return true 
    },
  })
}
var v_hasOwnProperty = Object.prototype.hasOwnProperty
Object.prototype.hasOwnProperty = v_saf(function hasOwnProperty(){
  var r;
  if (this === window){ r = v_hasOwnProperty.apply(__globalThis__, arguments) }
  else{ r = v_hasOwnProperty.apply(this, arguments) }
  v_console_log('  [*] [hasOwnProperty]', this===window?window:this, [].slice.call(arguments), r)
  return r
})
Object.defineProperties(__globalThis__, {[Symbol.toStringTag]:{value:'Window'}})
Object.defineProperties(__globalThis__, Object.getOwnPropertyDescriptors(window))
Object.setPrototypeOf(__globalThis__, Object.getPrototypeOf(window))`)
                }else{
                    if (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(list[i]+'')){
                        _global.push(`window.${list[i]} = v_proxy(v_new(${name}), ${JSON.stringify(list[i])})`)
                    }else{
                        _global.push(`window[${JSON.stringify(list[i])}] = v_proxy(v_new(${name}), ${JSON.stringify(list[i])})`)
                    }
                }
            }else{
                var vname = _mpname[idx]
                if (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(list[i]+'')){
                    _global.push(`window.${list[i]} = ${vname}`)
                }else{
                    _global.push(`window[${JSON.stringify(list[i])}] = ${vname}`)
                }
            }
        }
    }
    _global.push(make_long_string(2))

    var tail = [
        make_long_string(3),
        `init_cookie(${JSON.stringify(document.cookie)})`,
        `v_hook_href(window.location, 'location', ${JSON.stringify(location.href)})`,
        `Location.prototype.toString = v_saf(function toString(){ return ${JSON.stringify(location.href)} })`,
        `window.alert = v_saf(function alert(){})`,
        `v_hook_storage()`,
        `v_init_HTMLElement()`,
        `v_init_document()`,
        `v_init_canvas()`,
        `v_init_event_target()`,
        `v_init_Element_prototype()`,
        `v_init_DOMTokenList_prototype()`,
        `v_init_CSSStyleDeclaration_prototype()`,
        `v_init_PointerEvent_prototype()`,
        `v_init_PerformanceTiming_prototype()`,
        `window.innerWidth = ${window.innerWidth}`,
        `window.innerHeight = ${window.innerHeight}`,
        `window.outerHeight = ${window.outerHeight}`,
        `window.outerWidth = ${window.outerWidth}`,
        `window.isSecureContext = true`,
        `window.origin = location.origin`,
    ]

    var v_getele = eles.v_getele||{}
    var v_geteles = eles.v_geteles||{}
    var v_getele_inner = Object.keys(v_getele).map(function(e){
      var clzname = get_class_name(v_getele[e][1])
      patcher(clzname)
      return `  if(name.toLocaleLowerCase() == ${JSON.stringify(e.toLocaleLowerCase())} && func == ${JSON.stringify(v_getele[e][0])}){ return v_new(${clzname}) }`
    })
    v_getele_inner.push('  return null')
    tail.push(...[
      `function v_getele(name, func){`,
      ...v_getele_inner,
      `}`,
    ])

    var v_geteles_inner = Object.keys(v_geteles).map(function(e){
      var _clzs = []
      var _eles = v_geteles[e][1]
      for (var i = 0; i < _eles.length; i++) {
        var clzname = get_class_name(_eles[i])
        patcher(clzname)
        _clzs.push(`v_new(${clzname})`)
      }
      return `  if(name == ${JSON.stringify(e)} && func == ${JSON.stringify(v_geteles[e][0])}){ return [${_clzs.join(',')}] }`
    })
    v_geteles_inner.push('  return null')
    tail.push(...[
      `function v_geteles(name, func){`,
      ...v_geteles_inner,
      `}`,
    ])
    tail.push(`var v_Date = Date;`)
    tail.push(`var v_base_time = +new Date;`)
    tail.push(`(function(){`)
    tail.push(`  function ftime(){`)
    tail.push(`    return new v_Date() - v_base_time + v_to_time`)
    tail.push(`  }`)
    tail.push(`  Date = function(_Date) {`)
    tail.push(`    var bind = Function.bind;`)
    tail.push(`    var unbind = bind.bind(bind);`)
    tail.push(`    function instantiate(constructor, args) {`)
    tail.push(`      return new (unbind(constructor, null).apply(null, args));`)
    tail.push(`    }`)
    tail.push(`    var names = Object.getOwnPropertyNames(_Date);`)
    tail.push(`    for (var i = 0; i < names.length; i++) {`)
    tail.push(`      if (names[i]in Date)`)
    tail.push(`        continue;`)
    tail.push(`      var desc = Object.getOwnPropertyDescriptor(_Date, names[i]);`)
    tail.push(`      Object.defineProperty(Date, names[i], desc);`)
    tail.push(`    }`)
    tail.push(`    function Date() {`)
    tail.push(`      var date = instantiate(_Date, [ftime()]);`)
    tail.push(`      return date;`)
    tail.push(`    }`)
    tail.push(`    Date.prototype = _Date.prototype`)
    tail.push(`    return v_saf(Date);`)
    tail.push(`  }(Date);`)
    tail.push(`  Date.now = v_saf(function now(){ return ftime() })`)
    tail.push(`})();`)
    tail.push(`var v_to_time = +new v_Date`)
    tail.push(`// var v_to_time = +new v_Date('Sat Sep 03 2022 11:11:58 GMT+0800') // 自定义起始时间`)
    tail.push(``)
    tail.push(`v_repair_this() // 修复 window 指向global`)
    tail.push('v_new_toggle = false')
    tail.push('\n'.repeat(3))
    tail.push('// v_console_log = function(){} // 关闭日志输出')
    tail.push('// setTimeout = function(){} // 关闭定时器')
    tail.push('// setInterval = function(){} // 关闭定时器')
    var rets = [
        `var v_saf;!function(){var n=Function.toString,t=[],i=[],o=[].indexOf.bind(t),e=[].push.bind(t),r=[].push.bind(i);function u(n,t){return-1==o(n)&&(e(n),r(\`function \${t||n.name||""}() { [native code] }\`)),n}Object.defineProperty(Function.prototype,"toString",{enumerable:!1,configurable:!0,writable:!0,value:function(){return"function"==typeof this&&i[o(this)]||n.call(this)}}),u(Function.prototype.toString,"toString"),v_saf=u}();`,
        '\n',
        ...prefix,
        '\n',
        ...defines,
        ...definepros,
        '\n\n\n',
        ..._global,
        ...v_cele,
        ...tail,
        'return window'
    ]
    rets = rets.join('\n').split('\n')
    for (var i = 0; i < rets.length; i++) {
        rets[i] = '  ' + rets[i]
    }
    rets.unshift('window = (function(){')
    rets.push('})()')
    return rets.join('\n') + ';'
}

var OpenWindow = (function openwin() {
    var OpenWindow = window.open("about:blank", "1", "height=600, width=800,toolbar=no,scrollbars=" + scroll + ",menubar=no");
    OpenWindow.document.write(`<!DOCTYPE html><html><head><title></title></head><body><h3>从下面的窗口直接复制生成的代码使用</h3><textarea style="width: 100%; height: 85vh" id="txt" spellcheck="false"></textarea></body></html>`)
    var left = 100
    var top = 100
    OpenWindow.moveTo(left, top);
    OpenWindow.document.close()
    OpenWindow.txt.value = '请稍等...'
    return OpenWindow
})()

setTimeout(function(){
    var v_env = window.v_collect_for_make_env || [[],[]]
    console.log(v_env)
    OpenWindow.txt.value = make_env_1(v_env)
}, 100)

})()
