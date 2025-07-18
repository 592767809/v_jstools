var currtab = undefined
var attached = false
var html_copy = false
var tg_meta_debugger_v1 = false
var tg_meta_debugger_v2 = false
function close_debugger(){
  currtab = undefined
  attached = false
  html_copy = false
  tg_meta_debugger_v1 = false
  tg_meta_debugger_v2 = false
}
function sendCommand(method, params, source, chainfun){
  chrome.debugger.sendCommand(source, method, params, function(result){
    if (chrome.runtime.lastError) {
      console.error('chrome.runtime.lastError', chrome.runtime.lastError)
      if (chrome.runtime.lastError.message.indexOf('Cannot access a chrome://') != -1){ close_debugger() }
    } else { if (chainfun){ chainfun(result) } }
  });
}
function fillresponse(params, source, body){
  sendCommand("Fetch.fulfillRequest", {
    requestId: params.requestId, responseCode: params.responseStatusCode, responseHeaders: params.responseHeaders,
    body: body, // body 只能传 base64(指定代码) 
  }, source);
}
var save_cache = {}
function base64ToUtf8(base64) {
  return decodeURIComponent(Array.prototype.map.call(atob(base64), function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
function deal_collect_save(source, method, params){
  switch(method){
    case "Fetch.requestPaused":
      var itheaders = params.responseHeaders;
      if (itheaders && itheaders.find(function(v){return v.name == "Location"})) {
        sendCommand("Fetch.continueRequest", { requestId: params.requestId, url: itheaders.value }, source);
        break; }
      if ((params.responseStatusCode || params.responseErrorReason)) {
        if (params.responseErrorReason) {
          sendCommand("Fetch.failRequest", { requestId: params.requestId, errorReason: params.responseErrorReason }, source);
          break; }
        sendCommand("Fetch.getResponseBody", { requestId: params.requestId }, source, function(result){
          var fillfunc = fillresponse.bind(null, params, source)
          chrome.storage.local.get(["config-fetch_hook"], function (res) {
            if (!result.body){ fillfunc(result.body); return }
            // save html
            if (html_copy){
              if ( params.resourceType == 'Script'
                || params.resourceType == 'Document'
                || params.resourceType == 'Stylesheet'
                || params.resourceType == 'Image'
                || params.resourceType == 'Font'
                || params.resourceType == 'Other'
              ){
                try{
                  if (params.resourceType == 'Script'){     var save_info = base64ToUtf8(result.body) }
                  if (params.resourceType == 'Document'){   var save_info = base64ToUtf8(result.body) }
                  if (params.resourceType == 'Stylesheet'){ var save_info = base64ToUtf8(result.body) }
                  if (params.resourceType == 'Image'){      var save_info = result.body }
                  if (params.resourceType == 'Font'){       var save_info = result.body }
                  if (params.resourceType == 'Other'){      var save_info = result.body }
                  save_cache[params.request.url] = {
                    data: save_info, 
                    type: params.resourceType, 
                    responseHeaders: params.responseHeaders, 
                    responseStatusCode: params.responseStatusCode
                  }
                }catch(e){
                  console.log(e)
                }
                console.log(params.resourceType, params.request.url)
              }
            }
            fillfunc(result.body)
          })
          return
        }); 
        break; 
      }else{
        sendCommand("Fetch.continueRequest", { requestId: params.requestId }, source);
        break;
      }
  }
}
async function deal_add_meta_debugger(source, method, params){
  function getConBrkLocations(code) {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties']
    });
    const brk_lst = [];
    traverse(ast, {
      CallExpression(path) {
        const loc = path.node.loc;
        if (loc) {
          brk_lst.push({
            line: loc.start.line,
            column: loc.start.column
          });
        }
      }
    });
    return brk_lst;
  }
  function check_message(error){
    try{
      return JSON.parse(error.message).code == -32000
    }catch(e){}
  }
  async function setBreakpointsAtFunctionEntries(source, scriptId, scriptSource) {
    const breakpoints = getConBrkLocations(scriptSource);
    for (const brk of breakpoints) {
      try {
        await chrome.debugger.sendCommand(source, "Debugger.setBreakpoint", {
          location: {
            scriptId,
            lineNumber: brk.line - 1,
            columnNumber: brk.column,
          },
          condition: "!window.__chromium_devtools_metrics_reporter && true"
        });
      } catch (error) {
        if (!check_message(error)){
          console.error(`Failed to set breakpoint at ${brk.line}:${brk.column}`, error);
        }
      }
    }
  }
  if (tg_meta_debugger_v1){
    if (method === "Debugger.paused" && params.reason === "instrumentation") {
      const scriptId = params.data.scriptId;
      const durl = params.data.url;
      const url = params.callFrames[0]?.url;
      console.log(url, durl, params)
      if (!url && !durl){
        const { scriptSource } = await chrome.debugger.sendCommand(source, "Debugger.getScriptSource", { scriptId });
        await setBreakpointsAtFunctionEntries(source, scriptId, scriptSource);
      }
      await chrome.debugger.sendCommand(source, "Debugger.resume");
    }
  }
  function getDebuggerConBrkLocations(code) {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties']
    });
    const brk_lst = [];
    traverse(ast, {
      DebuggerStatement(path) {
        const loc = path.node.loc;
        if (loc) {
          brk_lst.push({
            line: loc.start.line,
            column: loc.start.column
          });
        }
      }
    });
    return brk_lst;
  }
  async function setBreakpointsAtDebuggerEntries(source, hash, scriptSource) {
    const breakpoints = getDebuggerConBrkLocations(scriptSource);
    for (const brk of breakpoints) {
      try {
        await chrome.debugger.sendCommand(source, "Debugger.setBreakpointByUrl", {
          scriptHash: hash,
          lineNumber: brk.line - 1,
          columnNumber: brk.column,
          condition: "false\n\n//# sourceURL=debugger://breakpoint"
        });
      } catch (error) {
        if (!check_message(error)){
          console.error(`Failed to set breakpoint at ${brk.line}:${brk.column}`, error);
        }
      }
    }
  }
  if (tg_meta_debugger_v2){
    if (method === "Debugger.scriptParsed") {
      const { scriptId, url, hash } = params;
      console.log(params, hash)
      const { scriptSource } = await chrome.debugger.sendCommand(source, "Debugger.getScriptSource", { scriptId });
      await setBreakpointsAtDebuggerEntries(source, hash, scriptSource)
    }
  }
}
chrome.debugger.onEvent.addListener(async function (source, method, params){
  await deal_collect_save(source, method, params)
  await deal_add_meta_debugger(source, method, params)
})
chrome.debugger.onDetach.addListener(function(){ close_debugger() })
function AttachDebugger() {
  if (attached){ return }
  save_cache = {}; 
  attached = true
  chrome.tabs.query(
    { active: true, currentWindow: true }, 
    function (tabs) {
      if (!tabs[0]){ 
        console.log('no tabs.')
        return 
      }
      currtab = { tabId: tabs[0].id };
      chrome.debugger.attach(currtab, "1.3", function () {
        sendCommand("Network.enable", {}, currtab, function(){ sendCommand("Network.setCacheDisabled", {cacheDisabled: true}, currtab)} ) // 确保 Fetch.getResponseBody 一定能收到东西
        sendCommand("Fetch.enable", { patterns: [
          // Document, Stylesheet, Image, Media, Font, Script, TextTrack, XHR, Fetch, EventSource, WebSocket, Manifest, SignedExchange, Ping, CSPViolationReport, Preflight, Other
          {urlPattern:"*",resourceType:"Script",requestStage:"Response"}, // 暂时先只 hook 少量携带 js 数据类型的请求
          {urlPattern:"*",resourceType:"Document",requestStage:"Response"}, 
          {urlPattern:"*",resourceType:"Stylesheet",requestStage:"Response"}, 
          {urlPattern:"*",resourceType:"Image",requestStage:"Response"}, 
          {urlPattern:"*",resourceType:"Font",requestStage:"Response"}, 
          {urlPattern:"*",resourceType:"Other",requestStage:"Response"}, 
          // 
          // {urlPattern:"*",resourceType:"XHR",requestStage:"Response"}, 
          // {urlPattern:"*",resourceType:"Fetch",requestStage:"Response"}, 
          // {urlPattern:"*",resourceType:"WebSocket",requestStage:"Response"}, 
          {urlPattern:"*",resourceType:"Media",requestStage:"Response"}, 
          {urlPattern:"*",resourceType:"Ping",requestStage:"Response"}, 
          {urlPattern:"*",resourceType:"CSPViolationReport",requestStage:"Response"}, 

          // {urlPattern:"*",resourceType:"TextTrack",requestStage:"Response"}, 
          // {urlPattern:"*",resourceType:"EventSource",requestStage:"Response"}, 
          // {urlPattern:"*",resourceType:"Manifest",requestStage:"Response"}, 
          // {urlPattern:"*",resourceType:"SignedExchange",requestStage:"Response"}, 
          // {urlPattern:"*",resourceType:"Preflight",requestStage:"Response"}, 

          // {urlPattern:"*",requestStage:"request"}, 
        ] }, currtab);
      });
    }
  );
}




function flash_page(tabs){
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => { setTimeout(function(){ location = location }, 100); },
    args: [],
    injectImmediately: true,
  });
}
function hook_and_record_events(){
  function add_hook_event_code(tabs, callback){
    var run_code_before = `
    !function(){
      var toggle = true
      var elelist = []
      var v_stringify = JSON.stringify
      var v_parse = JSON.parse
      function log_ele(name, e){
        if (toggle){
          if (!e.target.tagName){
            var css = ''
          }else{
            var css = e.target.tagName.toLowerCase()
                      + (e.target.id ? '#' + e.target.id : '') 
                      + (e.target.classList.length ? '.' + e.target.classList[0] : '')
          }
          function tofixnum(dict, num){
            num = num || 1
            var keys = Object.keys(v_parse(v_stringify(dict)))
            for (var i = 0; i < keys.length; i++) {
              if (typeof dict[keys[i]] == 'number'){
                dict[keys[i]] = +dict[keys[i]].toFixed(num)
              }
            }
            return dict
          }
          elelist.push([name, e, 
          v_stringify({
            type:name, 
            x: e.clientX, 
            y: e.clientY, 
            screenX: e.screenX, 
            screenY: e.screenY, 
            timeStamp: e.timeStamp, 
            css: {
              selector: css,
              rect: tofixnum(e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : {}),
              tagName: e.target.tagName || undefined,
              id: e.target.id || undefined,
            }, 
          })])
        }
      }
      function save_txt_in_win(txt){
        var OpenWindow = (function openwin() {
          var OpenWindow = window.open("about:blank", "1", "height=600, width=800,toolbar=no,scrollbars=" + scroll + ",menubar=no");
          OpenWindow.document.write(\`<!DOCTYPE html><html><head><title></title></head><body><h3>从下面的窗口直接复制生成的代码使用</h3><textarea style="width: 100%; height: 85vh" id="txt" spellcheck="false"></textarea></body></html>\`)
          var left = 100
          var top = 100
          OpenWindow.moveTo(left, top);
          OpenWindow.document.close()
          OpenWindow.txt.value = '请稍等...'
          return OpenWindow
        })()
        setTimeout(function(){
          OpenWindow.txt.value = txt
        }, 100)
      }
      function make_log_str(elelist){
        var ret = []
        for (var i = 0; i < elelist.length; i++) {
          ret.push('    ' + elelist[i][2] + ',')
        }
        var enter = String.fromCharCode(10)
        return '[' + enter + ret.join(enter) + enter + ']'
      }
      document.addEventListener('keyup',(e)=>{
        if (e.keyCode===27){
          if (toggle){
            console.log(elelist)
            save_txt_in_win(make_log_str(elelist))
            elelist = []
          }
          toggle = !toggle
        }
      })
      document.addEventListener('mousemove', function(e){
        var nDiv = document.createElement('div')
        var e = event || window.event
        nDiv.style.cssText = "position:absolute; width:5px; height:5px; background-color:red; border-radius:50%"   
        nDiv.style.left = e.pageX + 5 + "px"
        nDiv.style.top = e.pageY + 5 + "px"
        document.body.appendChild(nDiv)
        setTimeout(function(){ nDiv.remove(); },1000)
        log_ele.bind(null, 'mousemove')(e)
      })
      function log2_ele(name, e){
        if (toggle){
          elelist.push([name, e, v_stringify({type:name, key: e.key, keyCode: e.keyCode, code: e.code, timeStamp: e.timeStamp})])
        }
      }
      document.addEventListener('mousedown', log_ele.bind(null, 'mousedown'), true)
      document.addEventListener('mouseup', log_ele.bind(null, 'mouseup'), true)
      document.addEventListener('click', log_ele.bind(null, 'click'), true)
      document.addEventListener('keydown', log2_ele.bind(null, 'keydown'), true)
      document.addEventListener('keyup', log2_ele.bind(null, 'keyup'), true)
    }()
    `
    var currtab = { tabId: tabs[0].id };
    chrome.debugger.attach(currtab, "1.3", function () {
      chrome.debugger.sendCommand(currtab, "Page.enable", function(){
        chrome.debugger.sendCommand(currtab, "Page.addScriptToEvaluateOnNewDocument", {
          source: run_code_before
        }, function(){
          callback()
        });
      });
    });
  }
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    add_hook_event_code(tabs, function(){
      flash_page(tabs)
    })
  });
}
function copy_curr_page_resource(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    function format_cache(){
      function base64(str){
        return CryptoJS.enc.Utf8.parse(str).toString(CryptoJS.enc.Base64)
      }
      var keys = Object.keys(save_cache).sort()
      var rets = []
      for (var i = 0; i < keys.length; i++) {
        var url = new URL(keys[i]).href
        var odata = save_cache[keys[i]]
        if (odata.type == 'Script'||
          odata.type == 'Document'||
          odata.type == 'Stylesheet'){
          rets.push('    ' + JSON.stringify([url, base64(odata.data), 'base64', odata.responseHeaders, odata.responseStatusCode])+',')
        }else{
          rets.push('    ' + JSON.stringify([url, odata.data, 'null', odata.responseHeaders, odata.responseStatusCode])+',')
        }
      }
      return rets.join('\n').trim() 
    }
    var html = format_cache()
    if (html && html_copy){
      var url = `data:text/javascript;base64,${btoa(unescape(encodeURIComponent(html)))}`;
      chrome.downloads.download({
        url: url,
        filename: 'clone_cache.js'
      });
    }else{
      html_copy = true
      AttachDebugger();
      flash_page(tabs)
    }
  });
}
function copy_curr_page_html(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    var url = tabs[0].url
    var html = get_html(url)
    if (html && html_copy){
      var url = `data:text/html;base64,${btoa(unescape(encodeURIComponent(html)))}`;
      chrome.downloads.download({
        url: url,
        filename: 'clone_html.html'
      });
    }else{
      html_copy = true
      AttachDebugger();
      flash_page(tabs)
    }
  });
}



















importScripts(
  "./tools/model_codes/babel_pack.js", 
  "./tools/model_codes/babel_asttool.js", 
  "./tools/model_codes/cheerio.js", 
  "./tools/model_codes/cryptojs.js", 
  "./tools/common/sub_logger.js",
  "./tools/common/proxy.js",
  "./tools/common/get_html.js",
  "./tools/common/v_getsetfunc_list.js", 
)
var config_list = [
  "config-hook-global",
  // "config-hook-test",
  "config-hook-cookie",
  "config-hook-cookie-add-debugger",
  "config-hook-cookie-get",
  "config-hook-cookie-set",
  "config-hook-cookie-match",
  "config-hook-encrypt-normal",
  "config-hook-JSON.parse",
  "config-hook-JSON.stringify",
  "config-hook-decodeURI",
  "config-hook-decodeURIComponent",
  "config-hook-encodeURI",
  "config-hook-encodeURIComponent",
  "config-hook-escape",
  "config-hook-unescape",
  "config-hook-atob",
  "config-hook-btoa",
  "config-hook-setTimeout",
  "config-hook-setInterval",
  "config-hook-domobj",
  "config-hook-domobj-get",
  "config-hook-domobj-set",
  "config-hook-domobj-func",
  "config-hook-log-at",
  "config-hook-log-toggle",
  "config-hook-log-limit-num",
]
function add_config_hook(input){
  for (var i = 0; i < input.length; i++) {
    var kv = input[i]
    config_list.push(`config-hook-${kv[0]}-${kv[1]}`)
  }
}
add_config_hook(v_getsets)
add_config_hook(v_funcs)
var rd_key = Math.random()
function simple_hash(){
  var digits = 10
  var str = navigator.userAgent + rd_key + "simple_hash ver 1.0" + new Date().getMonth()
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  var max = Math.pow(10, digits);
  var num = Math.abs(hash) % max;
  return num.toString().padStart(digits, '0');
}
function update_config(tabId, config){
  for (var i = 0; i < config_tabid_dict[tabId].length; i++) {
    var tid_config = config_tabid_dict[tabId]
    if (!tid_config){ continue }
    var frm = tid_config[i]
    try{
      chrome.scripting.executeScript({
        target: { tabId: +tabId, frameIds: [frm] },
        func: (a) => {
          window.dispatchEvent(new CustomEvent('v_jstools_events', {
            detail: { action: "config", data: a }
          }))
        },
        args: [config],
        injectImmediately: true,
      })
      .catch(function(){  });
    }catch(e){
      if (frm == 0){
        delete config_tabid_dict[tabId]
      }
    }
  }
}
function init_proxy(){
  chrome.storage.local.get(['config-pac_proxy', 'config-proxy_config'], function(res){
    if (res['config-pac_proxy']){
      if (res['config-proxy_config']){
        set_my_proxy(res['config-proxy_config'])
      }
    }else{
      set_my_proxy()
    }
  })
}

var config_dict = {}
chrome.storage.local.get(config_list, function(e){
  config_dict = e
})
var config_vmp_list = ['config-hook-config-vmp', 'config-hook-global-vmp']
var config_vmp_dict = {}
chrome.storage.local.get(config_vmp_list, function(e){
  config_vmp_dict = e
})
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName == 'local') {
    var config_temp = {}
    for (var [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key == "config-hook-global"){
        if (newValue){ registerDynamicScript() }else{ unregisterDynamicScripts() }
      }
      if (config_list.indexOf(key) != -1){
        config_dict[key] = newValue
        config_temp[key] = newValue
      }
      if (key == "config-hook-global-vmp"){
        if (newValue){ registerDynamicScript_vmp() }else{ unregisterDynamicScripts_vmp() }
      }
      if (config_vmp_list.indexOf(key) != -1){
        config_vmp_dict[key] = newValue
      }
      if (key == "config-proxy_config"){
        init_proxy()
      }
      if (sub_log_list.indexOf(key) != -1){
        sub_logger()
      }
    }
    var tbids = Object.keys(config_tabid_dict)
    for (var i = 0; i < tbids.length; i++) {
      var tabId = tbids[i]
      update_config(tabId, config_temp)
    }
  }
});
var config_tabid_dict = {}
// var config_lastUrlMap = new Map();
// var config_lastUrlToggle = new Map();
// function auto_reload_for_inject(details){
//   if (config_lastUrlToggle.get(details.tabId)){
//     config_lastUrlToggle.set(details.tabId, false)
//     setTimeout(function(){
//       chrome.tabs.reload(details.tabId);
//     }, 300)
//   }
// }
// function auto_reload_change_toggle(details){
//   var lastUrl = config_lastUrlMap.get(details.tabId);
//   if (lastUrl && lastUrl.startsWith('chrome') && (!details.url.startsWith('chrome'))) {
//     console.log(`Tab ${details.tabId} lastUrl startsWith chrome, do reload.`);
//     config_lastUrlToggle.set(details.tabId, true)
//   }
//   config_lastUrlMap.set(details.tabId, details.url);
// }
chrome.webNavigation.onCommitted.addListener( async (details) => {
  if (details.documentLifecycle === "prerender") {
    console.warn("[*] skip prerender page:", details.url);
    return;
  }
  console.log("[*] details:", details)
  // auto_reload_change_toggle(details)
  if (details.url.startsWith("chrome")
    ||details.url.startsWith("devtools")){ return }
  config_tabid_dict[details.tabId] = config_tabid_dict[details.tabId] || []
  if (config_tabid_dict[details.tabId].indexOf(details.frameId) == -1){
    config_tabid_dict[details.tabId].push(details.frameId)
  }
  re_attach_all()
  if (config_dict['config-hook-global']){
    try{
      config_dict['key_hash'] = simple_hash()
      chrome.scripting.executeScript({
        target: { tabId: details.tabId, frameIds: [details.frameId] },
        func: (a) => { window.v_jstools_config = a },
        args: [config_dict],
        world: 'MAIN',
        injectImmediately: true,
      })
      .catch(function(e){  });
    }catch(e){}
  }
  if (config_vmp_dict['config-hook-global-vmp']){
    try{
      var config = JSON.parse(config_vmp_dict['config-hook-config-vmp'])
      var config_args = Object.keys(config).map(function(e){return config[e].enabled?config[e]:{}}).filter(function(e){return !!e.magic})
      var config_args_main = config_args.filter(function(e){return e.is_main}).map(function(e){return e.magic})
      var config_args_isol = config_args.filter(function(e){return !e.is_main}).map(function(e){return e.magic})
      if (config_args_main.length){
        chrome.scripting.executeScript({
          target: { tabId: details.tabId, frameIds: [details.frameId] },
          func: (a) => { window.v_jstools_config_vmp = a },
          args: [config_args_main],
          world: 'MAIN',
          injectImmediately: true,
        })
        .catch(function(e){  });
      }
      if (config_args_isol.length){
        chrome.scripting.executeScript({
          target: { tabId: details.tabId, frameIds: [details.frameId] },
          func: (a) => { window.v_jstools_config_vmp = a },
          args: [config_args_isol],
          world: 'ISOLATED',
          injectImmediately: true,
        })
        .catch(function(e){  });
      }
    }catch(e){}
  }
});

async function unregisterDynamicScripts(){
  return await chrome.scripting.unregisterContentScripts({
    ids: ['dynamic-script-v3']
  }).catch(e => {})
}
async function registerDynamicScript() {
  try {
    await unregisterDynamicScripts()
    await chrome.scripting.registerContentScripts([{
      allFrames: true,
      id: 'dynamic-script-v3',
      matches: ["http://*/*", "https://*/*"],
      js: ['tools/common/dyn_script_v3.js'],
      runAt: 'document_start',
      world: 'MAIN',
      matchOriginAsFallback: true,
    }])
  } catch (error) {
    console.error('注册脚本失败:', error);
    throw error;
  }
}
chrome.storage.local.get(["config-hook-global"],function(e){
  if (e["config-hook-global"]){
    registerDynamicScript()
  }
})

async function unregisterDynamicScripts_vmp(){
  return await chrome.scripting.unregisterContentScripts({
    ids: ['dynamic-script-vmp-v3-main', 'dynamic-script-vmp-v3-isol']
  }).catch(e => {})
}
async function registerDynamicScript_vmp() {
  try {
    await unregisterDynamicScripts_vmp()
    await chrome.scripting.registerContentScripts([{
      allFrames: true,
      id: 'dynamic-script-vmp-v3-main',
      matches: ["http://*/*", "https://*/*"],
      js: ['tools/common/dyn_script_vmp_v3.main.js'],
      runAt: 'document_start',
      world: 'MAIN',
      matchOriginAsFallback: true,
    }])
    await chrome.scripting.registerContentScripts([{
      allFrames: true,
      id: 'dynamic-script-vmp-v3-isol',
      matches: ["http://*/*", "https://*/*"],
      js: ['tools/common/dyn_script_vmp_v3.isol.js'],
      runAt: 'document_start',
      world: 'ISOLATED',
      matchOriginAsFallback: true,
    }])
  } catch (error) {
    console.error('注册脚本失败:', error);
    throw error;
  }
}
chrome.storage.local.get(["config-hook-global-vmp"],function(e){
  if (e["config-hook-global-vmp"]){
    registerDynamicScript_vmp()
  }
})

function make_re_x_attach_all(){
  var cache_tabid_new = {}
  var cache_tabid_att = {}
  var debug_tab = false
  var add_code;
  var act_code;
  var first_config = false
  function detach_config_1(){
    cache_tabid_new = {}
    cache_tabid_att = {} 
  }
  function detach_config_2(source, reason){
    console.log('[*] detach:', source, reason)
    detach_config_1()
    if (reason != "target_closed"){
      debug_tab = false 
    }
  }
  function attach_all_tab(){
    chrome.tabs.query({}, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url.indexOf("chrome") == 0){
          continue
        }
        attach_tab_debug({
          url: tabs[i].url,
          tabId: tabs[i].id,
          active: tabs[i].active,
        })
      }
    });
  }
  function re_x_attach_all(config){
    if (config){
      debug_tab = true
      act_code = config.action
      add_code = config.code
      first_config = true
    }else{
      first_config = false
    }
    if (!debug_tab){ return }
    chrome.debugger.getTargets(async (targets) => {
      var detachPromises = targets
        .filter(target => target.attached)
        .map(target => {
          return new Promise((resolve) => {
            if (!target.tabId){ return resolve(false) }
            chrome.debugger.detach({tabId: target.tabId}, () => {
              resolve(false)
            });
          });
        });
      await Promise.all(detachPromises);
      detach_config_1()
      attach_all_tab()
    });
  }
  function parse_inject_code(config){
    try{config = JSON.parse(config)}catch(e){config = {}}
    var keys = Object.keys(config)
    var code = '(function(){\n'
    for (var i = 0; i < keys.length; i++) {
      var cfg = config[keys[i]]
      if (cfg.enabled){
        code += cfg.textarea + '\n;\n'
      }
    }
    code += '\n})()'
    return code
  }
  function attach_1(currtab, config){
    chrome.debugger.attach(currtab, "1.3", function () {
      if (act_code == 'inject_code'){
        chrome.debugger.sendCommand(currtab, "Page.enable", function(){
          if (chrome.runtime.lastError) { console.log('error...1') }
          chrome.debugger.sendCommand(currtab, "Page.addScriptToEvaluateOnNewDocument", { source: parse_inject_code(add_code) }, function(){
            if (chrome.runtime.lastError) { console.log('error...2') }
            if (!first_config && config.active){
              // auto_reload_for_inject(config)
            }
          });
        });
      }
    });
  }
  function attach_tab_debug(config){
    var tabId = config.tabId
    if (!tabId){ return }
    cache_tabid_new[tabId] = 1
    var tabids = Object.keys(cache_tabid_new)
    for (var i = 0; i < tabids.length; i++) {
      if (cache_tabid_new[tabids[i]] == 1 && !cache_tabid_att[tabids[i]]){
        cache_tabid_att[tabids[i]] = 1
        attach_1({ tabId: +tabids[i] }, config)
      }
    }
  }
  chrome.debugger.onDetach.addListener(detach_config_2)
  return re_x_attach_all
}
var re_attach_all = make_re_x_attach_all()
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'get_url'){
    fetch(msg.message.url)
      .then(response => response.json())
      .then(data => sendResponse({status:'success', message:data}))
      .catch(error => sendResponse({status:'error', message:`fail load url ${msg.message.url}:\n\n\n ${error}`}));
    return true
  }
  if (msg.action === "executeScript") {
    if (msg.config.need == 'v1'){
      chrome.scripting.executeScript({
        target: { tabId: msg.tabId },
        func: (a) => {
          window.dispatchEvent(new CustomEvent('v_jstools_events', {
            detail: { action: "get_collect", key_hash: a }
          }))
        },
        args: [simple_hash()],
        injectImmediately: true,
      }).then(() => sendResponse("success"))
        .catch(e => sendResponse(e.message));
    }
    chrome.scripting.executeScript({
      target: { tabId: msg.tabId },
      files: [msg.config.file],
      world: 'MAIN',
      injectImmediately: true
    }).then(() => sendResponse("success"))
      .catch(e => sendResponse(e.message));
    return true;
  }
  if (msg.action == "meta_debugger_v1"){
    chrome.debugger.attach({ tabId: msg.tabId }, "1.3", function () {
      chrome.debugger.sendCommand({ tabId: msg.tabId }, "Debugger.enable", {}, () => {
        chrome.debugger.sendCommand({ tabId: msg.tabId }, "Debugger.setInstrumentationBreakpoint", {
          instrumentation: "beforeScriptExecution"
        }, () => {
          tg_meta_debugger_v1 = true
        });
      });
    });
    sendResponse("success")
  }
  if (msg.action == "meta_debugger_v2"){
    chrome.debugger.attach({ tabId: msg.tabId }, "1.3", function () {
      chrome.debugger.sendCommand({ tabId: msg.tabId }, "Debugger.enable", {}, () => {
        tg_meta_debugger_v2 = true
      });
    });
    sendResponse("success")
  }
  if (msg.action == "inject_code"){
    re_attach_all({action: 'inject_code', code: msg.config})
    sendResponse("success")
  }
  if (msg.action == "copy_curr_page_resource"){
    copy_curr_page_resource()
    sendResponse("success")
  }
  if (msg.action == "copy_curr_page_html"){
    copy_curr_page_html()
    sendResponse("success")
  }
  if (msg.action == "hook_and_record_events"){
    hook_and_record_events()
    sendResponse("success")
  }
});









function set_default(f){
  var kdict = {
    'config-monkey-toggle': false,
    'config-page-copyer_1': false,
    'config-page-copyer_2': false,
    'config-events-lisener': false,
    'config-tools-package': true,
    'config-tools-create-env': true,
    'config-tools-easy-proxy': false,
    'config-test-beta': false,
    'config-tools-cdp-inject': true,
    'config-tools-hook-api': true,
    'config-popup_expanded': true,
  }
  var klist = Object.keys(kdict)
  chrome.storage.local.get(klist,function(e){
    for (var i = 0; i < klist.length; i++) {
      var k = klist[i]
      if (typeof e[k] != 'boolean'){
        e[k] = kdict[k]
      }
    }
    chrome.storage.local.set(e, f)
  })
}
set_default(function(){
  chrome.storage.local.get(['config-tools-easy-proxy'], function(e){
    if (e['config-tools-easy-proxy']){
      init_proxy()
    }
  })
  sub_logger()
})


