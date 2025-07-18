function svLocal(k,v){chrome.storage.local.set({[k]: v})}
function gtLocal(k,f){chrome.storage.local.get([k],function(e){f(e[k])})}

$(document).ready(function() {
  function simple_hook(id, toggle_name, on_close){
    $(id).change(function() {
      const isChecked = $(this).is(':checked');
      svLocal(toggle_name, isChecked)
      if ((!isChecked) && on_close){
        for (var i = 0; i < on_close.length; i++) {
          svLocal(on_close[i][0], on_close[i][1])
        }
      }
    });
    gtLocal(toggle_name, function(e){
      $(id).prop('checked', !!e)
    })
  }

  simple_hook('#toggle-b', 'config-page-copyer_1')
  simple_hook('#toggle-c', 'config-page-copyer_2')
  simple_hook('#toggle-d', 'config-events-lisener')
  simple_hook('#toggle-e', 'config-tools-package')
  simple_hook('#toggle-f', 'config-tools-create-env')
  simple_hook('#toggle-h', 'config-tools-cdp-inject')
  simple_hook('#toggle-g', 'config-tools-easy-proxy', [['config-pac_proxy', false]])
  simple_hook('#toggle-i', 'config-tools-hook-api', [['config-hook-global', false]])
  simple_hook('#toggle-x', 'config-test-alpha', [['config-hook-global-vmp', false]])
});