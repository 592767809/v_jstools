function get_proxy_by_config(proxy){
  try{
    return JSON.parse(proxy)[0].join(' ')
  }catch(e){
    return ''
  }
}

function set_my_proxy(proxy){
  var pacScriptConfig = {
    mode: 'pac_script',
    pacScript: {
      data: `
      function FindProxyForURL(url, host) {
        return "${get_proxy_by_config(proxy)};";
      }
      `
    }
  };
  chrome.proxy.settings.set({ value: pacScriptConfig, scope: 'regular' }, function(){});
}