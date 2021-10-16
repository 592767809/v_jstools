// background.js










chrome.contextMenus.create({
  title: "打开 v_jstools 动态调试",
  contexts: ['all'],
  onclick: function(){
    AttachDebugger();
  }
});
function sendCommand(method, params, source, chainfun){
  chrome.debugger.sendCommand(source, method, params, function(result){
    if (chrome.runtime.lastError) {
      console.error('chrome.runtime.lastError', chrome.runtime.lastError)
    } else {
      if (chainfun){
        chainfun(result)
      }
    }
  });
}
chrome.debugger.onEvent.addListener(function (source, method, params){
  switch(method){
    case "Fetch.requestPaused":
      console.log("xmFetch","Fetch.requestPaused", params.request.url)
      var itheaders = params.responseHeaders;
      if (itheaders.find(function(v){return v.name == "Location"})) {
        sendCommand("Fetch.continueRequest", { requestId: params.requestId, url: itheaders.value }, source);
        break;
      }
      if ((params.responseStatusCode || params.responseErrorReason)) {
        if (params.responseErrorReason) {
          sendCommand("Fetch.failRequest", { requestId: params.requestId, errorReason: params.responseErrorReason }, source);
          break;
        }
        sendCommand("Fetch.getResponseBody", { requestId: params.requestId }, source, function(result){
          if (result.body !== undefined){
            // 收到的是 base64 的代码，base64 解一下就是原始代码，对这个代码处理一下后续再用 base64 包一层再传入 body
            // 注意，这里需要你指定一下 Disable cache 。否则可能收不到代码字符串。
            var rescode = atob(result.body)
            console.log(rescode)
          }
          sendCommand("Fetch.fulfillRequest", {
            requestId: params.requestId, responseCode: params.responseStatusCode, responseHeaders: params.responseHeaders,
            body: result.body, // 这里只能传 base64(指定代码) 
          }, source);
        }); 
        break;
      }
  }
})
chrome.debugger.onDetach.addListener(function(){
  attached = false
})
var attached = false
function AttachDebugger() {
  if (attached){ return }
  attached = true
  chrome.tabs.query(
    { active: true, currentWindow: true }, 
    function (tabs) {
      var tab = { tabId: tabs[0].id };
      chrome.debugger.attach(tab, "1.2", function () {
        sendCommand("Fetch.enable", { patterns: [
          {urlPattern:"*",resourceType:"Script",requestStage:"Response"} // 监听类型，目前主要监听 Script
        ] }, tab);
      });
    }
  );
}