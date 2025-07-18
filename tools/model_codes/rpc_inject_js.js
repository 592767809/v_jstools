!function(){
  if (
    location.host == '127.0.0.1:25000' || 
    !location.protocol.startsWith('http') 
  ) { return }
  var websocket = new WebSocket("ws://127.0.0.1:25000/browser");
  websocket.onopen = function(){
    var info = 'browser:start:' + location.href
    console.log(info);
    websocket.send(info)
  }
  websocket.onmessage = function(e){
    var info = JSON.parse(e.data)
    var query = info.query
    var d = { idx: info.idx }
    try{
      console.log('websocket.onmessage', query)
      // 这里处理请求参数以及对应rpc函数调用，返回参数用可序列化的数据类型传入即可
      var ret = '你好'
      d.message = ret
      d.status = 'success'
    }catch(e){
      d.message = e.message
      d.status = 'fail'
    }
    console.log(d)
    websocket.send(JSON.stringify(d))
  }
}()