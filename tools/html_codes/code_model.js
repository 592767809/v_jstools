function $(id){return document.getElementById(id)}
function svLocal(k,v){chrome.storage.local.set({[k]: v})}
function gtLocal(k,f){chrome.storage.local.get([k],function(e){f(e)})}

function errorHandler(e){
  console.log(e)
}
function simple_load_file(filename, callback, errcallback){
  chrome.runtime.getPackageDirectoryEntry(function(root) {
    root.getFile(filename, {}, function(fileEntry) {
      fileEntry.file(function(file) {
        var reader = new FileReader();
        reader.onloadend = function(e) {
          callback(this.result)
        }
        reader.readAsText(file);
      }, (errcallback||errorHandler));
    }, (errcallback||errorHandler));
  });
}
function get_file(filename, callback, errcallback){
  set_output('runing...')
  if (typeof filename == 'string'){
    setTimeout(function(){simple_load_file(filename, callback, errcallback)}, 100)
  }else if (Array.isArray(filename)){
    var plist = []
    function pack_params(filename, callback, errcallback){
      return function(resolve){
        simple_load_file(filename, resolve)
      }
    }
    for (var i = 0; i < filename.length; i++) {
      plist.push(new Promise(pack_params(filename[i], callback, errcallback)))
    }
    Promise.all(plist).then(function(res){
      callback(res.join('\n'))
    })
  }
}

function formatStrByteLen(str) {
  function byteLength(str) {
    return new TextEncoder().encode(str).length;
  }
  var bytes = byteLength(str)
  if (bytes === 0) return '0 Byte';
  const k = 1024;
  const sizes = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return value.toFixed(2).replace(/\.00$/, '') + ' ' + sizes[i];
}

function inject_change(v){
  if ('runing...' == v.target.value){ return }
  var fbyte = formatStrByteLen(v.target.value)
  $('bytelen').innerHTML = fbyte
  if (v.target.value.startsWith('data:image/')){
    $('show_img').src = v.target.value
    $('show_img').style.display = 'block'
    $('show_hr').style.display = 'block'
    setTimeout(function(){
      window.scrollTo(0, 0);
    }, 0)
  }else{
    $('show_img').style.display = 'none'
    $('show_hr').style.display = 'none'
  }
}

$('code_model').addEventListener("input", inject_change)
$('code_model').addEventListener("change", inject_change)

function set_output(code){
  $('code_model').value = code
  $('code_model').dispatchEvent(new InputEvent('input'))
}

$('get_code_babel_ast') ?.addEventListener('click', function(e){ get_file(['tools/model_codes/babel_pack.js', 'tools/model_codes/babel_asttool.js'], set_output) })
$('get_code_cryptojs')  ?.addEventListener('click', function(e){ get_file('tools/model_codes/cryptojs.js', set_output) })
$('get_code_uglifyjs')  ?.addEventListener('click', function(e){ get_file('tools/model_codes/uglify_es.js', set_output) })
$('get_code_request')   ?.addEventListener('click', function(e){ get_file('tools/model_codes/request.js', set_output) })
$('get_code_jsencrypt') ?.addEventListener('click', function(e){ get_file('tools/model_codes/jsencrypt.js', set_output) })
$('get_code_cheerio')   ?.addEventListener('click', function(e){ get_file('tools/model_codes/cheerio.js', set_output) })
$('get_code_terser')    ?.addEventListener('click', function(e){ get_file('tools/model_codes/terser.js', set_output) })
$('get_code_parse5')    ?.addEventListener('click', function(e){ get_file('tools/model_codes/parse5.js', set_output) })
$('get_jquery_min_js')  ?.addEventListener('click', function(e){ get_file('tools/model_codes/jquery.min.js', set_output) })
$('get_express_pack')   ?.addEventListener('click', function(e){ get_file('tools/model_codes/express_pack.js', set_output) })
$('get_rpc_inject_js')  ?.addEventListener('click', function(e){ get_file('tools/model_codes/rpc_inject_js.js', set_output) })
$('get_wat2wasm_js')    ?.addEventListener('click', function(e){ get_file('tools/model_codes/wat2wasm.js', set_output) })
$('get_wasm2js_demo_js')?.addEventListener('click', function(e){ get_file('tools/model_codes/wasm2js_demo.js', set_output) })

$('code_model').ondragover = function(e) {
  e.preventDefault();
}
$('code_model').ondrop = function(e) {
  e.preventDefault();
  var f = e.dataTransfer.files[0];
  var fr = new FileReader();
  fr.readAsDataURL(f);
  fr.onload = function(e) {
    set_output(this.result)
  }
}