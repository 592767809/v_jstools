var sub_log_list = [
  'config-hook-global',
  'config-hook-log-toggle',
  'config-pac_proxy',
  'config-hook-global-vmp',
]

function sub_logger(){
  chrome.storage.local.get(sub_log_list, function(e){
    var actionAPI = chrome.browserAction || chrome.action
    actionAPI.setBadgeBackgroundColor({color: '#BC1717'});
    var info = ''
    if (e['config-hook-global']){
      info += 'H'
      if (e['config-hook-log-toggle']){
        info += 'L'
      }
    }
    if (e['config-hook-global-vmp']){
      info += 'I'
    }
    if (e['config-pac_proxy']){
      info += 'P'
    }
    actionAPI.setBadgeText({text: info});
  })
}