function $(id){return document.getElementById(id)}

function _mk_html(input, clsname, index){
  var div = $(clsname)
  var htmls = []
  var keys = []
  for (var i = 0; i < input.length; i++) {
    var kv = input[i]
    var k = kv[0]
    var v = kv[1]
    if (keys.indexOf(k) == -1){
      keys.push(k)
      htmls.push(`<label style="margin-left: 20px" >${k}<br /> </label>`)
    }
    htmls.push(`
      <label style="margin-left: 40px; display:block" >
        <input class="${clsname}-e2" checked=true type="checkbox" data-key="config-hook-${k}-${v}" vilame="${index}" />
          ${k} ${v}
        <br />
      </label> `)
  }
  div.innerHTML += htmls.join('')
}

_mk_html(v_getsets, 'getsets_all', 0)
_mk_html(v_funcs, 'funcs_all', 0)

function update_encrypt_state(){
  document.querySelectorAll("input").forEach(function(e){
    if (e.dataset.key == 'config-hook-encrypt-normal'){
      var allow_ls = [
        'config-hook-JSON.parse',
        'config-hook-JSON.stringify',
        'config-hook-decodeURI',
        'config-hook-decodeURIComponent',
        'config-hook-encodeURI',
        'config-hook-encodeURIComponent',
        'config-hook-escape',
        'config-hook-unescape',
        'config-hook-atob',
        'config-hook-btoa',
        'config-hook-setTimeout',
        'config-hook-setInterval',
      ]
      document.querySelectorAll("input").forEach(function(v){
        if (allow_ls.indexOf(v.dataset.key) != -1){ v.disabled = !e.checked }
      })
    }
  })
}

function update_cookie_state(){
  document.querySelectorAll("input").forEach(function(e){
    if (e.dataset.key == 'config-hook-cookie'){
      var allow_ls = [
        'config-hook-cookie-add-debugger',
        'config-hook-cookie-get',
        'config-hook-cookie-set',
      ]
      document.querySelectorAll("input").forEach(function(v){
        if (allow_ls.indexOf(v.dataset.key) != -1){ v.disabled = !e.checked }
      })
    }
  })
}

function update_domobj_state(){
  var ck;
  document.querySelectorAll("input").forEach(function(e){
    if (e.dataset.key == 'config-hook-domobj'){
      ck = e.checked
      document.querySelectorAll("input").forEach(function(v){
        if (v.className?.indexOf('getsets_all') != -1
          ||v.className?.indexOf('funcs_all') != -1
          ||v.dataset.key=='config-hook-domobj-get'
          ||v.dataset.key=='config-hook-domobj-set'
          ||v.dataset.key=='config-hook-domobj-func'){
          v.disabled = !e.checked
        }
      })
    }
  })
  return ck
}

function update_getset_state(){
  var a, b;
  document.querySelectorAll("input").forEach(function(e){
    if (e.dataset.key == 'config-hook-domobj-get'){ a = e.checked }
    if (e.dataset.key == 'config-hook-domobj-set'){ b = e.checked }
  })
  document.querySelectorAll("input").forEach(function(v){
    if (v.className?.indexOf('getsets_all') != -1){
      v.disabled = !(a || b)
    }
  })
}

function update_func_state(){
  var a;
  document.querySelectorAll("input").forEach(function(e){
    if (e.dataset.key == 'config-hook-domobj-func'){ a = e.checked }
  })
  document.querySelectorAll("input").forEach(function(v){
    if (v.className?.indexOf('funcs_all') != -1){
      v.disabled = !a
    }
  })
}

function update_state(){
  if (update_domobj_state()){
    update_getset_state()
    update_func_state()
  }
  update_encrypt_state()
  update_cookie_state()
}

var cache_ls = []
var chche_v = {}
var txtls = ['text', 'password']
document.querySelectorAll("input").forEach(function(v){
  if(!v.dataset.key) return
  cache_ls.push(v.dataset.key)
  chche_v[v.dataset.key] = v
  v.addEventListener("change", function (e) {
    if (v.type == 'checkbox'){ chrome.storage.local.set({ [e.target.dataset.key]: e.target.checked }) }
    if (txtls.indexOf(v.type) != -1){ chrome.storage.local.set({ [e.target.dataset.key]: e.target.value }) }
    update_state()
  })
})

chrome.storage.local.get(cache_ls, function (e) {
  for (var i = 0; i < cache_ls.length; i++) {
    var v = chche_v[cache_ls[i]]
    if (v.type == 'checkbox'){ v.checked = e[v.dataset.key]; }
    if (txtls.indexOf(v.type) != -1){ v.value = e[v.dataset.key] || ''; }
  }
  update_state()
})

function make_default_set(toggle){
  return function(e){
    var openlist = [
      'config-hook-global',
      'config-hook-log-toggle',
      'config-hook-log-at',
      'config-hook-cookie',
      'config-hook-cookie-get',
      'config-hook-cookie-set',
      'config-hook-encrypt-normal',
      'config-hook-JSON.parse',
      'config-hook-JSON.stringify',
      'config-hook-decodeURI',
      'config-hook-decodeURIComponent',
      'config-hook-encodeURI',
      'config-hook-encodeURIComponent',
      'config-hook-escape',
      'config-hook-unescape',
      'config-hook-atob',
      'config-hook-btoa',
      'config-hook-setTimeout',
      'config-hook-setInterval',
      'config-hook-domobj',
      'config-hook-domobj-get',
      'config-hook-domobj-set',
      'config-hook-domobj-func',
    ]
    var default_false = [
      'config-hook-setTimeout',
      'config-hook-setInterval',
    ]
    var setd = {}
    setd['config-hook-log-toggle'] = toggle
    document.querySelectorAll("input").forEach(function(v){
      if (openlist.indexOf(v.dataset.key) != -1
        || v.className?.indexOf('getsets_all') != -1
        || v.className?.indexOf('funcs_all') != -1
      ){
        setd[v.dataset.key] = v.checked = toggle
      }else{
        setd[v.dataset.key] = v.checked = false
      }
    })
    document.querySelectorAll("input").forEach(function(v){
      if (default_false.indexOf(v.dataset.key) != -1){
        setd[v.dataset.key] = v.checked = false
      }
    })
    chrome.storage.local.set(setd, function(){
      sub_logger()
    })
    update_state()
  }
}

$('normal_config')?.addEventListener("click", make_default_set(true))
$('clear_config')?.addEventListener("click", make_default_set(false))