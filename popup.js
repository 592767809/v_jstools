function $(id){return document.getElementById(id)}
function svLocal(k,v){chrome.storage.local.set({[k]: v})}
function gtLocal(k,f){chrome.storage.local.get([k],function(e){f(e[k])})}
function gtLocalList(ks,f){chrome.storage.local.get(ks,function(e){f(e)})}
function try_some(f,d){ return function(...a){ try{var r=f(...a)}catch(e){var r=f(d)};return r; }}
function svLocalDict(k,v,f){chrome.storage.local.set({[k]: try_some(JSON.stringify,'{}')(v)}, f)}
function gtLocalDict(k,f){chrome.storage.local.get([k],  try_some(function(e){f(JSON.parse(e[k]))}, {[k]:'{}'}) )}
var Lg = console.log

function init_input_ele(){
  document.querySelectorAll("input").forEach(function(v){
    if (!v.dataset.key){ return }
    chrome.storage.local.get([v.dataset.key], function (result) {
      update_proxy_label()
      if (v.type == 'checkbox'){
        v.checked = result[v.dataset.key];
      }
    })
    v.addEventListener("change", function (e) {
      if (v.type == 'checkbox'){
        chrome.storage.local.set({
          [e.target.dataset.key]: e.target.checked
        }, function(){
          update_proxy_label()
        })
        if (e.target.dataset.key == "config-hook-global" && e.target.checked){
          update_hook_log_toggle()
          hook_config_tips()
        }
      }
    })
  })
}

function update_hook_log_toggle(){
  document.querySelectorAll("input").forEach(function(v){
    var name = 'config-hook-log-toggle'
    if (v.dataset.key == name){
      chrome.storage.local.get([name], function(e){
        if (!e[name]){
          v.checked = true
          chrome.storage.local.set({[name]: true})
        }
      })
    }
  })
}

function make_hook_config_tips_string(){
  return `
启动挂钩时没有配置“挂钩”相关的功能！
是否“跳转”到配“挂钩配置”页面配置开关？

确认跳转`
}

function hook_config_tips(){
  var mustopen = ["config-hook-cookie", "config-hook-encrypt-normal", "config-hook-domobj"]
  chrome.storage.local.get(mustopen, function(e){
    var tg = false
    for (var i = 0; i < mustopen.length; i++) {
      if (e[mustopen[i]]){
        tg = true
      }
    }
    if (!tg){
      var result = confirm(make_hook_config_tips_string());
      if (result){
        chrome.tabs.create({ url: chrome.runtime.getURL('tools/html_hook/hook_options.html') })
      }
    }
  })
}

function closePopup() {
  window.close();
  document.body.style.opacity = 0;
  setTimeout(function() { history.go(0); }, 300);
}

function update_proxy_label(){
  chrome.storage.local.get(['config-tools-easy-proxy', 'config-pac_proxy', 'config-proxy_config'], function(res){
    if (!res['config-tools-easy-proxy']){ return }
    if (res['config-pac_proxy']){
      if (res['config-proxy_config']){
        var showlabel = get_proxy_by_config(res['config-proxy_config']).replace(/^PROXY /g, '')
        if (showlabel.length > 21){
          showlabel = showlabel.slice(0,21)+'...'
        }
        if (!showlabel){
          showlabel = '无:请配置代理'
        }
        $('proxy_label').innerText = `代理[${showlabel}]`
        return
      }else{
        $('proxy_label').innerText = `代理[无:请配置代理]`
        return
      }
    }
    $('proxy_label').innerText = '代理'
  })
}

function make_confirm_info(){
  return `
启用该功能需要让以下四个配置选中：
1: 是否启用挂钩 DOM 对象的原型的功能调试输出
2: hook-domobj-显示get输出
3: hook-domobj-显示set输出
4: hook-domobj-显示func输出

点击 “确认” 会刷新页面并自动选中所需配置，
然后重新点击 “生成临时环境” 即可生成代码。`
}

var check_list = ["config-hook-global", "config-hook-domobj", "config-hook-domobj-get", "config-hook-domobj-set", "config-hook-domobj-func"]
function init_normel_hook_config(){
  function make_hook(input){
    var ret = []
    for (var i = 0; i < input.length; i++) {
      var kv = input[i]
      var k = kv[0]
      var v = kv[1]
      ret.push(`config-hook-${k}-${v}`)
    }
    return ret
  }
  var all_list = ["config-hook-log-toggle", 'config-tools-hook-api']
  .concat(check_list)
  .concat(make_hook(v_getsets))
  .concat(make_hook(v_funcs))
  var config_target = {}
  for (var i = 0; i < all_list.length; i++) {
    config_target[all_list[i]] = true
  }
  function flash_page(tabs){
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => { setTimeout(function(){ location = location }, 100); },
      args: [],
      injectImmediately: true,
    });
  }
  chrome.storage.local.set(config_target, function(e){
    sub_logger()
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      flash_page(tabs)
    });
  })
}

function get_curr_tabId(f){
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    f(tabs[0].id)
  });
}

function create_env(config){
  get_curr_tabId(function(tabId){
    chrome.runtime.sendMessage({
      action: "executeScript",
      tabId: tabId,
      config: config
    }, (response) => {
      Lg("执行结果:", response);
    });
  })
}

function check_make_env_1_config(){
  chrome.storage.local.get(check_list, function (result) {
    if (!(result["config-hook-global"] 
      && result["config-hook-domobj"] 
      && result["config-hook-domobj-get"] 
      && result["config-hook-domobj-set"] 
      && result["config-hook-domobj-func"])
    ){
      var result = confirm(make_confirm_info());
      if(result){
        init_normel_hook_config()
        setTimeout(function(){
          create_env({ file: "tools/common/make_env_1_v3.js", need: 'v1' })
          closePopup()
        }, 2000)
      }
      return
    }else{
      create_env({ file: "tools/common/make_env_1_v3.js", need: 'v1' })
    }
  })
}

function send_to_bg_events(){
  gtLocal("config-inject_data", function(e){
    chrome.runtime.sendMessage({
      action: "inject_code",
      config: e
    }, (response) => {
      Lg("执行结果:", response);
    });
  })
}





function style_checkbox(data_key, label, label_id){
  var div = document.createElement('div')
  div.classList.add('settings-item')
  div.innerHTML = `
  <label class="switch"><input type="checkbox" data-key="${data_key}"><div class="slider"></div></label>
  <div class="switch-label" ${label_id?('id="'+label_id+'"'):''}>${label}</div>
  `
  return div
}
function style_line(){
  var hr = document.createElement('hr')
  hr.style = "border: none; height: 2px; background: #ccc; margin: 2px 0;"
  return hr
}
function add_tail(cls){
  if (cls.length % 2 == 1){
    cls.push(['', '', 'btn btn-main debug-placeholder'])
  }
}
function style_two(a,b){
  var div = document.createElement('div')
  div.classList.add('btn-pair')
  div.innerHTML = `
  <button id="${a[1]}" class="${a[2]}"><span>${a[0]}</span></button>
  <button id="${b[1]}" class="${b[2]}"><span>${b[0]}</span></button>
  `
  return div
}
function style_one(a){
  var div = document.createElement('div')
  div.classList.add('btn-pair')
  div.innerHTML = `
  <button id="${a[1]}" class="${a[2]}"><span>${a[0]}</span></button>
  `
  return div
}
var config_tg = [
  ['是否开启挂钩', 'config-hook-global', ''],
  ['是否输出挂钩日志', 'config-hook-log-toggle', ''],
  ['代理', 'config-pac_proxy', 'proxy_label'],
  ['迷你油猴(VMP)', 'config-hook-global-vmp', '']
]
var config_list = [
  ['挂钩配置', 'hook_options', 'btn btn-main'],
  ['代理配置', 'proxy_page', 'btn btn-main'],
  ['迷你油猴', 'inject_vmp_code_cfg', 'btn btn-main'],
]
var config_list2 = [
  ['注入代码', 'inject_code', "btn"],
  ['注入配置', 'inject_code_cfg', "btn btn-main"],
]
var config_list3 = [
  ['生成临时环境', 'create_env', "btn"],
  ['生成高级环境', 'create_high_env', "btn"],
  ['拷贝当前页面', 'copy_curr_page_html', "btn"],
  ['监听页面事件', 'hook_and_record_events', "btn"],
  ['拷贝页面资源', 'copy_curr_page_resource', "btn"],
  ['自动化断点', 'meta_debugger_v1', 'btn'],
  ['自动绕debug', 'meta_debugger_v2', 'btn']
]
var config_list4 = [
  ['文本对比页', 'diff_page', 'btn btn-main'],
  ['JS 脚本库', 'pack_code_model', 'btn btn-main'],
  ['AST 语法', 'ast_page', 'btn btn-main'],
  ['AST 工具', 'deobjs_page', 'btn btn-main'],
  ['AST 分析', 'inject_deobjs_page', 'btn'],
  ['WASM 分析', 'inject_wasm_page', 'btn'],
]
var config_one_list = [
  ['[manifest v3]:1.0 功能配置', 'base_config', 'btn btn-main']
]
function add_two_in_html(cls){
  add_tail(cls)
  if (cls.length){ $('config_box').appendChild(style_line()) }
  for (var i = 0; i < cls.length; i++) {
    $('config_box').appendChild(style_two(cls[i], cls[++i]))
  }
}
function add_one_in_html(cls){
  if (cls.length){ $('config_box').appendChild(style_line()) }
  for (var i = 0; i < cls.length; i++) {
    $('config_box').appendChild(style_one(cls[i]))
  }
}
function add_tg_in_html(cls){
  for (var i = 0; i < cls.length; i++) {
    $('config_box').appendChild(style_checkbox(cls[i][1], cls[i][0], cls[i][2]))
  }
}
function add_ad_in_html(){
  var div = document.createElement('div')
  div.innerHTML = `
    <div style="margin-top: 5px;align-items: center;padding: 5px 15px;margin-bottom: 0px;border: 1px solid #e1e5eb;border-radius: 8px;transition: all 0.3s ease;background: white;">
      <div>扫码并备注 “jstools” 申请加入工具交流群</div>
      <div style="text-align: center">
        <img src="./tools/common/a.png" alt="" style="width: 120px; height: 120px">
      </div>
    </div>
  `
  $('config_box').appendChild(div)
}

function add_inject_short_config(){
  var div = document.createElement('div')
  div.classList.add('label-container')
  div.innerHTML = `
    <div class="label-header" id="toggleLabelList_id">
      <span class="label-title">注入脚本管理</span>
      <span class="label-arrow">▼</span>
    </div>
    <div class="label-list" id="labelList">
    </div>
  `
  $('config_box').appendChild(div)
  function send_to_bg_events(){
    gtLocal('config-inject_data', function(e){
      chrome.runtime.sendMessage({
        action: "inject_code",
        config: e
      }, (response) => {
        console.log("执行结果:", response);
      });
    })
  }
  gtLocalDict("config-inject_data", function(e){
    var config = e || {}
    var keys = Object.keys(e)
    for (var i = 0; i < keys.length; i++) {
      var row_name = e[keys[i]].field1
      var row_enabled = e[keys[i]].enabled
      var row_key = 'v_row_' + keys[i]
      var row_div = document.createElement('div')
      row_div.classList.add("label-item")
      row_div.innerHTML = `
        <span class="label-name">${row_name}</span>
        <label class="label-switch">
          <input type="checkbox" id=${row_key}>
          <span class="label-slider"></span>
        </label>
      `
      $('labelList').appendChild(row_div)
      !function(row_key, row_id){
        $(row_key).checked = row_enabled
        $(row_key).addEventListener('change', function(){
          config[row_id].enabled = this.checked
          svLocalDict('config-inject_data', config, function(){
            send_to_bg_events()
          })
          svLocalDict('config-hook-config-normal', config)
        })
      }(row_key, keys[i])
    }
  })
  var expanded_tg_name = 'config-popup_expanded'
  function toggleLabelList() {
    const list = document.getElementById('labelList');
    const arrow = document.querySelector('.label-arrow');
    list.classList.toggle('expanded');
    if (list.classList.contains('expanded')) {
      arrow.textContent = '▲';
      arrow.style.transform = 'rotate(0deg)';
      svLocal(expanded_tg_name, true)
    } else {
      arrow.textContent = '▼';
      arrow.style.transform = 'rotate(0deg)';
      svLocal(expanded_tg_name, false)
    }
  }
  $('toggleLabelList_id').addEventListener('click', function(){
    toggleLabelList()
  })
  gtLocal(expanded_tg_name, function(e){
    if (e){ toggleLabelList() }
  })
}

function make_inject_ast_page_alert(url){
  return `
无法在 chrome:// 页面使用该功能

当前页面: ${url}

请在 http/https/file 页面中使用该功能
  `.trim()
}

function run_local_id_avoid_chrome(func){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    if (tabs[0].url.startsWith('chrome')){
      alert(make_inject_ast_page_alert(tabs[0].url))
    }else{
      func(tabs[0].id)
    }
  });
}

function run_codes(tabId, input, world){
  if (typeof input == 'function'){
    return chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: input,
      args: [],
      injectImmediately: true,
      world: world,
    })
  }else{
    return chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: input,
      injectImmediately: true,
      world: world,
    })
  }
}
function inject_ast_page_in_local_page(){
  function inject_ast_page(tabId){
    run_codes(tabId, () => { 
      if (!window.has_listen){
        window.has_listen = true
        function send_info(message, index){
          window.dispatchEvent(new CustomEvent('vvv_FromIToM', {
            detail: { message, index }
          }))
        }
        window.addEventListener("vvv_FromMToI", (event) => {
          var { type, message, value, index } = event.detail
          if (type == 'get'){
            chrome.storage.local.get([message], function(e){
              send_info(e[message], index)
            })
          }
          if (type == 'set'){
            chrome.storage.local.set({[message]: value}, function(e){
              send_info('ok', index)
            })
          }
          if (type == 'url'){
            chrome.runtime.sendMessage({ action: "get_url", message }, function (response){ 
              send_info(response.message, index)
            });
          }
        });
      }
    }, 'ISOLATED')
    .then(function(){
      run_codes(tabId, [
        'tools/model_codes/jquery.min.js',
        'tools/model_codes/jquery-ui.min.js',
        'tools/model_codes/babel_pack.js',
        'tools/common/inject_ast_page.js',
      ], 'MAIN')
    })
  }
  run_local_id_avoid_chrome(inject_ast_page)
}

function inject_wasm_page_in_local_page(){
  function inject_wasm_page(tabId){
    run_codes(tabId, ['tools/common/inject_wasm_page.js'], 'MAIN')
  }
  run_local_id_avoid_chrome(inject_wasm_page)
}


function init_all(){
  add_tg_in_html(config_tg)
  add_two_in_html(config_list)
  add_two_in_html(config_list2)
  if (config_list2.length){
    add_inject_short_config()
  }
  add_two_in_html(config_list3)
  add_two_in_html(config_list4)
  add_one_in_html(config_one_list)
  add_ad_in_html()
  init_input_ele()
  var GCT = get_curr_tabId;
  var CU = function(u){ chrome.tabs.create({ url: chrome.runtime.getURL(u) }); }
  var SA = function(t, i, f){ chrome.runtime.sendMessage({ action: t.id, tabId: i }, r=>{ Lg("执行结果:", r); f && f(t) }); }
  $('create_env')             ?.addEventListener('click', function(e){ check_make_env_1_config() })
  $('create_high_env')        ?.addEventListener('click', function(e){ create_env({ file: "tools/common/make_env_2_v3.js" }) })
  $('inject_code')            ?.addEventListener('click', function(){ send_to_bg_events() })
  $('meta_debugger_v1')       ?.addEventListener('click', function(e){ var t=this; GCT(function(i){ SA(t, i) });})
  $('meta_debugger_v2')       ?.addEventListener('click', function(e){ var t=this; GCT(function(i){ SA(t, i) });})
  $('copy_curr_page_html')    ?.addEventListener('click', function(){ SA(this, null, t=>$(t.id).innerText = '等加载再点击') ;})
  $('copy_curr_page_resource')?.addEventListener('click', function(){ SA(this, null, t=>$(t.id).innerText = '等加载再点击') ;})
  $('hook_and_record_events') ?.addEventListener('click', function(){ SA(this, null, t=>$(t.id).innerText = 'ESC键停止') ;})
  $('hook_options')           ?.addEventListener('click', function(){ CU('tools/html_hook/hook_options.html') })
  $('pack_code_model')        ?.addEventListener('click', function(){ CU('tools/html_codes/code_model.html') })
  $('inject_code_cfg')        ?.addEventListener('click', function(){ CU('tools/html_inject/inject_config.html') })
  $('inject_vmp_code_cfg')    ?.addEventListener('click', function(){ CU('tools/html_inject_vmp/inject_vmp_page.html') })
  $('ast_page')               ?.addEventListener('click', function(){ CU('tools/html_ast/astexplorer_babel.html') })
  $('deobjs_page')            ?.addEventListener('click', function(){ CU('tools/html_deob/deobjs_page.html') })
  $('diff_page')              ?.addEventListener('click', function(){ CU('tools/html_diff/diff_text.html') })
  $('proxy_page')             ?.addEventListener('click', function(){ CU('tools/html_proxy/proxy_config.html') })
  $('base_config')            ?.addEventListener('click', function(){ CU('tools/html_base/base_config.html') })
  $('inject_deobjs_page')     ?.addEventListener('click', function(){ inject_ast_page_in_local_page() ;})
  $('inject_wasm_page')       ?.addEventListener('click', function(){ inject_wasm_page_in_local_page() ;})
}

var config_toggles = {
  // 'config-monkey-toggle': ['inject_vmp_code_cfg', 'config-hook-global-vmp'],
  'config-page-copyer_1': ['copy_curr_page_resource'],
  'config-page-copyer_2': ['copy_curr_page_html'],
  'config-events-lisener': ['hook_and_record_events'],
  'config-tools-package': ['ast_page','diff_page','deobjs_page','pack_code_model', 'inject_deobjs_page', 'inject_wasm_page'],
  'config-tools-create-env': ['create_env', 'create_high_env'],
  'config-tools-easy-proxy': ['config-pac_proxy', 'proxy_page'],
  'config-tools-cdp-inject': ['inject_code', 'inject_code_cfg'],
  'config-test-alpha': ['meta_debugger_v1', 'meta_debugger_v2', 'inject_vmp_code_cfg', 'config-hook-global-vmp'],
  'config-tools-hook-api': ['config-hook-global', 'config-hook-log-toggle', 'hook_options']
}
var cfg_tg_keys = Object.keys(config_toggles)
gtLocalList(cfg_tg_keys, function(e){
  function rm_id_func(idlst){
    var ls = [config_tg,config_list,config_list2,config_list3,config_list4]
    for (var i = 0; i < ls.length; i++) {
      for (var j = 0; j < ls[i].length; j++) {
        var [name, cid, style] = ls[i][j]
        if (idlst.indexOf(cid) != -1){
          ls[i].splice(j,1)
          return true
        }
      }
    }
  }
  for (var i = 0; i < cfg_tg_keys.length; i++) {
    if (!e[cfg_tg_keys[i]]){ while(rm_id_func(config_toggles[cfg_tg_keys[i]])){ /*do nothing*/ } }
  }
  init_all()
})