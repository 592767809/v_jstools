function $(id){return document.getElementById(id)}
function svLocal(k,v){chrome.storage?chrome.storage.local.set({[k]: v}):(localStorage[k]=v)}
function gtLocal(k,f){chrome.storage?chrome.storage.local.get([k],function(e){f(e)}):f({[k]:localStorage[k]})}

function add_saver(name){
  var inject_ele = $(name)
  if (inject_ele){
    gtLocal(name, function(e){ inject_ele.value = e[name] || ''; })
    function inject_change(v){ svLocal(name, v.target.value) }
    inject_ele.addEventListener("input", inject_change)
    inject_ele.addEventListener("change", inject_change)
  }
}
add_saver('deobjs_input')
add_saver('deobjs_output')

function simple_run(name, func){
  $('deobjs_output').value = 'runing...'
  setTimeout(function(){
    try{
      var input = $('deobjs_input').value
      var output = func(input)
    }catch(e){
      var output = e.stack
    }
    if (output instanceof Promise){
      output
      .then(function(e){
        $('deobjs_output').value = e.code
        $('deobjs_output').dispatchEvent(new InputEvent('input'))
      })
      .catch(function(e){
        $('deobjs_output').value = e.stack
        $('deobjs_output').dispatchEvent(new InputEvent('input'))
      })
    }else{
      $('deobjs_output').value = output
      $('deobjs_output').dispatchEvent(new InputEvent('input'))
    }
  }, 100)
}


function loadScript(url, callback) {
  const script = document.createElement('script');
  script.src = url;
  script.async = false;
  script.onload = function() {
    if (callback) callback();
  };
  script.onerror = function() {
    console.error('Failed to load script: ' + url);
  };
  document.head.appendChild(script);
}
try{
  eval("123")
  loadScript("../model_codes/uglify_es.js")
}catch(e){ 
  console.log("no support eval.") 
  $('sojson').remove()
  $('jsfuck').remove()
  $('ob').remove()
  $('uglify').remove()
  $('uglify_mini').remove()
}

$('jsobfuscator_simple_run')?.addEventListener('click', function(){
  simple_run('jsobfuscator_simple_run', function(input){
    return JavaScriptObfuscator.obfuscate(input, {})._obfuscatedCode
  })
})

$('jsobfuscator_hard_run')?.addEventListener('click', function(){
  simple_run('jsobfuscator_simple_run', function(input){
    return JavaScriptObfuscator.obfuscate(input, {
      compact: false,                            // 输出是否为一行内容（若selfDefending开关开启，则这里强制为true）
      controlFlowFlattening: true,               // 控制流平坦化开关
      controlFlowFlatteningThreshold: 0.75,      // 控制流使用率
      deadCodeInjection: true,                   // 注入死代码
      deadCodeInjectionThreshold: 0.4,           // 死代码注入率
      debugProtection: true,                     // debugger 反调试开关
      debugProtectionInterval: 4000,             // debugger 定时反调试开关时间间隔
      disableConsoleOutput: true,                // console 清空，反输出
      domainLock: [],                            // 指定运行作用域
      domainLockRedirectUrl: 'about:blank',      // 在非作用域运行时自动重定向的url
      forceTransformStrings: [],
      identifierNamesCache: null,
      identifierNamesGenerator: 'mangled',       // 变量混淆风格 hexadecimal:(_0xabc123) mangled:(a,b,c)
      identifiersDictionary: [],
      identifiersPrefix: '',
      ignoreImports: false,
      inputFileName: '',
      log: false,
      numbersToExpressions: false,
      optionsPreset: 'default',
      renameGlobals: false,
      renameProperties: false,
      renamePropertiesMode: 'safe',
      reservedNames: [],
      reservedStrings: [],
      seed: 0,
      selfDefending: true,                       // 函数格式化保护
      simplify: true,
      sourceMap: false,
      sourceMapBaseUrl: '',
      sourceMapFileName: '',
      sourceMapMode: 'separate',
      sourceMapSourcesMode: 'sources-content',
      splitStrings: false,                       // 字符串碎片化 "asdfasdf" => "asd" + "fas" + "df"
      splitStringsChunkLength: 10,               // 切片长度
      stringArray: true,                         // 属性字符串列表化开关（也就是ob头部一长串字符串）
      stringArrayCallsTransform: true,           // 属性字符串函数化比例
      stringArrayCallsTransformThreshold: 0.5,   // 转化比例
      stringArrayEncoding: ['base64'],           // 解密属性字符串的方式 'none','base64','rc4'
      stringArrayIndexesType: [
          'hexadecimal-number'
      ],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 1,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 2,
      stringArrayWrappersType: 'variable',
      stringArrayThreshold: 0.75,
      target: 'browser',
      transformObjectKeys: false,
      unicodeEscapeSequence: false
    })._obfuscatedCode
  })
})

$('sojson')?.addEventListener('click', function(e){
  simple_run('sojson', function(input){
    var config = {
      clear_ob_extra: false,
      clear_not_use: false,
      ob_dec_name: '',
    }
    return muti_process_sojsondefusion(input, config)
  })
})
$('tr2es5')?.addEventListener('click', function(e){
  simple_run('tr2es5', function(input){
    return transform_jscode_to_es5(input)
  })
})
$('ob')?.addEventListener('click', function(e){
  simple_run('ob', function(input){
    var config = {
      clear_ob_extra: false,
      clear_not_use: false,
      ob_dec_name: '',
    }
    try{
      return muti_process_obdefusion(input, config)
    }catch(e){
      if (Object.getPrototypeOf(e).name == 'ReferenceError'){
        var mth = /^(.*) is not defined/.exec(e.message)
        if (mth){
          console.log(`出现 ReferenceError: '${mth[1]}' is not defined 的异常，尝试用 '${mth[1]}' 作为解密名字二次解密。`)
          config.ob_dec_name = mth[1]
          try{
            return muti_process_obdefusion(input, config)
          }catch(e){
            return e.stack
          }
        }
      }
      return e.stack
    }
  })
})
$('obnormal')?.addEventListener('click', function(e){
  simple_run('obnormal', function(input){
    return muti_process_defusion(input)
  })
})
$('jsfuck')?.addEventListener('click', function(e){
  simple_run('jsfuck', function(input){
    return muti_process_jsfuckdefusion(input)
  })
})
$('babel_aline')?.addEventListener('click', function(e){
  simple_run('babel_aline', function(input){
    return muti_process_aline(input)
  })
})
$('terser')?.addEventListener('click', function(e){
  simple_run('terser', function(input){
    terser.charlist = '0123456789'
    terser.prefix = 'v'
    terser.tail = '_'
    return terser.minify(input, {compress:false,output:{beautify:true}}).then(function(e){
      terser.charlist = undefined
      terser.prefix = undefined
      terser.tail = undefined
      return e;
    })
  })
})
$('terser_format')?.addEventListener('click', function(e){
  simple_run('terser_format', function(input){
    return terser.minify(input, {
      compress: {
        conditionals: false,
        loops: false,
      },
      format: {
        beautify: true,
        semicolons: true,
      },
    })
  })
})
$('terser_mini')?.addEventListener('click', function(e){
  simple_run('terser_mini', function(input){
    return terser.minify(input)
  })
})