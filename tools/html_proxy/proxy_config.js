document.querySelectorAll("input").forEach(function(v){
  chrome.storage.local.get([v.dataset.key], function (result) {
    if (v.type == 'checkbox'){
      v.checked = result[v.dataset.key];
    }
  })
  v.addEventListener("change", function (e) {
    if (v.type == 'checkbox'){
      chrome.storage.local.set({
        [e.target.dataset.key]: e.target.checked
      })
    }
  })
})

function svLocal(k,v){chrome.storage.local.set({[k]: v})}
function gtLocal(k,f){chrome.storage.local.get([k],function(e){f(e)})}

function proxy_config_table_func(idname, titlenames, init_data, callback) {
  var cid = "#" + idname;
  var trfirst = cid + " tr:first";
  var trlast = cid + " tr:last";
  var opindex = titlenames.length;
  var style = document.createElement('style');
  style.textContent = `
    ${cid} {
      width: 100%;
      border-collapse: collapse;
      margin: 5px 0;
      font-family: Arial, sans-serif;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    ${cid} th, ${cid} td {
      padding: 2px 5px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    ${cid} tr:first-child td {
      background-color: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
      font-weight: bold;
    }
    ${cid} tr:not(:first-child):hover {
      background-color: #f5f5f5;
    }
    ${cid} button {
      padding: 0px 10px;
      margin: 0 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
    }
    ${cid} .add-example1, ${cid} .add-example2 {
      background-color: #28a745;
      color: white;
    }
    ${cid} .add-example1:hover, ${cid} .add-example2:hover {
      background-color: #218838;
    }
    ${cid} .remove-row {
      background-color: #dc3545;
      color: white;
    }
    ${cid} .remove-row:hover {
      background-color: #c82333;
    }
    ${cid} .sort-handle {
      cursor: move;
      text-align: center;
      color: #6c757d;
    }
    ${cid} input[type="text"] {
      width: 100%;
      padding: 3px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      box-sizing: border-box;
    }
    ${cid} input[type="text"]:focus {
      border-color: #80bdff;
      outline: 0;
      box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
    }
    /* 拖拽时的样式 */
    ${cid} .ui-sortable-helper {
      background-color: #e9ecef;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    ${cid} .ui-sortable-placeholder {
      background-color: #f8f9fa;
      visibility: visible !important;
    }
  `;
  document.head.appendChild(style);
  var title = '';
  title += '<tr><td colspan="' + (titlenames.length + 2) + '">';
  title += '<button class="add-example1">添加示例1</button>';
  title += '<button class="add-example2">添加示例2</button>';
  title += '</td></tr>';
  title += '<tr>';
  title += '<td style="width: 40px">排序</td>';
  for (var i = 0; i < titlenames.length; i++) {
    title += '<td>' + titlenames[i].split('|')[0] + '</td>';
  }
  title += '<td>操作</td>';
  title += '</tr>';
  $(cid).html(title);
  $(cid).on('click', '.add-example1', function() {
    addRow(["PROXY", "127.0.0.1:7890"]);
  });
  $(cid).on('click', '.add-example2', function() {
    addRow(["HTTPS", "hk2.link.ac.cn:152;HTTPS fmt1.link.ac.cn:995"]);
  });
  $(cid).on('click', '.remove-row', function() {
    $(this).closest('tr').remove();
    __cache_data();
  });
  init_data = init_data || [];
  for (var i = 0; i < init_data.length; i++) {
    addRow(init_data[i], true);
  }
  __cache_data();
  $(cid).sortable({
    items: "tr:not(:first,:last)",
    handle: ".sort-handle",
    axis: "y",
    stop: function() {
      __cache_data();
    }
  });
  function __cache_data() {
    var data_list = [];
    var trs = $(cid).find("tr:not(:first)");
    trs.each(function() {
      var tds = $(this).find("td");
      var data_line = [];
      for (var j = 1; j < tds.length - 1; j++) {
        var ipt = $(tds[j]).find("input")[0];
        if (ipt) {
          data_line.push(ipt.value);
        }
      }
      if (data_line.length) {
        data_list.push(data_line);
      }
    });
    init_data.length = 0;
    Array.prototype.push.apply(init_data, data_list);
    callback(init_data);
  }
  function __add_changer(index) {
    var row = $(cid).find("tr").eq(index);
    row.find("input").on("input", function() {
      __cache_data();
    });
  }
  function addRow(data, not_cache) {
    var addRowHtmlStr = '<tr>';
    addRowHtmlStr += '<td class="sort-handle" style="cursor: move; width: 40px">↕</td>';
    for (var i = 0; i < titlenames.length; i++) {
      var [name, style, disabled] = titlenames[i].split('|');
      style = style || 'width: 150px';
      if (disabled == 'true') {
        disabled = 'disabled="disabled" readonly="readonly"';
      } else if (disabled == 'false' || disabled == '' || disabled === undefined) {
        disabled = '';
      } else { 
        throw Error('not in "true" or "false" string.'); 
      }
      addRowHtmlStr += `<td style='width: 150px'><input type='text' style='${style}' ${disabled}></td>`;
    }
    addRowHtmlStr += '<td><button class="remove-row">删除行</button></td>';
    addRowHtmlStr += '</tr>';
    $(trlast).before(addRowHtmlStr);
    var newRowIndex = $(cid).find("tr").length - 2;
    __add_changer(newRowIndex);
    if (data) { 
      var ctds = $(cid).find("tr").eq(newRowIndex).find("td");
      var leng = Math.min(data.length, titlenames.length);
      for (var i = 0; i < leng; i++) {
        $(ctds[i + 1]).find('input').val(data[i]);
      }
    }
    if (!not_cache){ __cache_data(); }
  }
}
gtLocal("config-proxy_config", function(e){
  var init_data = []
  try{
    var init_data = JSON.parse(e["config-proxy_config"])
  }catch(e){}
  console.log(init_data)
  proxy_config_table_func("proxy_config_table", ["代理类型", "代理地址"], init_data, function(data){
    chrome.storage.local.set({
      "config-proxy_config": JSON.stringify(data)
    })
  })
})