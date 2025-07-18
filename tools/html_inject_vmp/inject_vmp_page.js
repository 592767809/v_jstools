function try_some(f,d){
  return function(...a){
    try{var r=f(...a)}catch(e){var r=f(d)}
    return r;
  }
}
function svLocalDict(k,v){chrome.storage.local.set({[k]: try_some(JSON.stringify,'{}')(v)} )}
function gtLocalDict(k,f){chrome.storage.local.get([k],  try_some(function(e){f(JSON.parse(e[k]))}, {[k]:'{}'}) )}
function svLocal(k,v){chrome.storage.local.set({[k]: v})}
function gtLocal(k,f){chrome.storage.local.get([k],function(e){f(e[k])})}
$(document).ready(function() {
  let config = null;
  let selectedRowId = null;
  let save_key_name = 'config-hook-config-vmp'
  let save_line_name = 'config-hook-line-vmp'
  function onConfigUpdate(newConfig, changedRowId, operationType) {
    var J = JSON.stringify
    console.log('配置已更新:', `operation ${J(operationType,1,2)} changedRow ${J(changedRowId,1,2)} newConfig ${J(newConfig,1,2)}`);
    svLocalDict(save_key_name, newConfig)
    updateConfigDisplay();
  }
  function onRowSelected(rowId, rowConfig) {
    console.log('行被选中:', {
      rowId: rowId,
      rowConfig: rowConfig
    });
    selectedRowId = rowId;
    svLocal(save_line_name, rowId)
    renderTable();
    updateConfigDisplay();
    $('#configTextarea').val(rowConfig.textarea || '').prop('disabled', false);
  }
  function renderTable() {
    const $tbody = $('#configTable tbody');
    $tbody.empty();
    for(const rowId in config) {
      if(config.hasOwnProperty(rowId)) {
        const rowData = config[rowId];
        const $row = $('<tr>')
          .attr('data-row-id', rowId)
          .toggleClass('selected', rowId === selectedRowId);
        $row.append(
          $('<td>').addClass('column-field1').append(
            $('<input>').attr({
              type: 'text',
              value: rowData.field1,
              class: 'editable-field'
            }).data('field', 'field1')
          )
        );
        $row.append(
          $('<td>').addClass('column-field2').append(
            $('<input>').attr({
              type: 'text',
              value: rowData.field2,
              class: 'editable-field'
            }).data('field', 'field2')
          )
        );
        const $actionsCell = $('<td>').addClass('column-actions actions');
        $actionsCell.append(
          $('<button>').text('删除').addClass('action-btn delete-btn')
        );
        $actionsCell.append(
          $('<button>').text('编译字节码').addClass('action-btn build-btn')
        );
        $actionsCell.append(
          $('<span>').text('启用:').append(
            $('<label>').addClass('switch').append(
              $('<input>').attr({
                type: 'checkbox',
                class: 'status-toggle'
              }).prop('checked', rowData.enabled).data('field', 'enabled'),
              $('<span>').addClass('slider')
            )
          )
        );
        $actionsCell.append(
          $('<span>').text('MAIN:').attr({style: "padding-left:10px"}).append(
            $('<label>').addClass('switch').append(
              $('<input>').attr({
                type: 'checkbox',
                class: 'main-toggle'
              }).prop('checked', rowData.is_main).data('field', 'is_main'),
              $('<span>').addClass('slider')
            )
          )
        );
        $row.append($actionsCell);
        $tbody.append($row);
      }
    }
    updateConfigDisplay();
  }
  function updateConfigDisplay() {
    if(selectedRowId && config[selectedRowId]) {
      const selectedConfig = JSON.parse(JSON.stringify(config[selectedRowId]));
      $('#selectedRowData')?.text(JSON.stringify(selectedConfig, null, 2));
    } else {
      $('#selectedRowData')?.text('请输入代码');
    }
  }
  var code_model = `
(function(){

  // 请输入你的代码
  alert('vvv')

})()
  `.trim()
  $('#addRowBtn').on('click', function() {
    var max = (Object.keys(config).length + 1)
    var newRowName = null;
    for (var i = 1; i < max + 1; i++) {
      var newRowName = 'row' + i
      if (!config.hasOwnProperty(newRowName)){
        break
      }
    }
    const newRowId = newRowName;
    config[newRowId] = {
      field1: '功能名',
      field2: '(字节码)',
      enabled: false,
      is_main: true,
      textarea: code_model
    };
    renderTable();
    onConfigUpdate(config, newRowId, 'add');
    var rowId = newRowId
    onRowSelected(rowId, config[rowId]);
  });
  $('#configTable').on('click', '.delete-btn', function(e) {
    e.stopPropagation();
    const $row = $(this).closest('tr');
    const rowId = $row.data('row-id');
    const wasSelected = (selectedRowId === rowId);
    delete config[rowId];
    if(wasSelected) {
      selectedRowId = null;
      $('#configTextarea').val('').prop('disabled', true);
    }
    renderTable();
    onConfigUpdate(config, rowId, 'delete');
  });
  $('#configTable').on('click', '.build-btn', function(e) {
    e.stopPropagation();
    const $input = $(this);
    const rowId = $input.closest('tr').data('row-id');
    $.ajax({
      url: "http://8.130.117.18:8012/getinfo",
      type: "POST",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify({
        code: config[rowId].textarea,
      }),
      success: function(response) {
        var code = response.code
        if (/^!function\(/.test(code)){
          config[rowId].magic = /"([^"]+)"[^"]*$/.exec(response.code)[1]
          console.log("成功:", response);
          config[rowId].field2 = config[rowId].magic
          onRowSelected(rowId, config[rowId]);
          onConfigUpdate(config, rowId, 'update');
        }else{
          alert(code)
        }
      },
      error: function(xhr, status, error) {
        console.error("失败:", error);
        onRowSelected(rowId, config[rowId]);
        onConfigUpdate(config, rowId, 'update');
      }
    });
  });
  $('#configTable').on('input', '.editable-field', function(e) {
    e.stopPropagation();
    const $input = $(this);
    const rowId = $input.closest('tr').data('row-id');
    const field = $input.data('field');
    const newValue = $input.val();
    config[rowId][field] = newValue;
    onConfigUpdate(config, rowId, 'edit');
  });
  $('#configTable').on('focus', '.editable-field', function(e) {
    const $input = $(this);
    const rowId = $input.closest('tr').data('row-id');
    if(rowId && config[rowId] && rowId !== selectedRowId) {
      onRowSelected(rowId, config[rowId]);
    }
  });
  $('#configTable').on('change', '.status-toggle', function(e) {
    e.stopPropagation();
    const $checkbox = $(this);
    const rowId = $checkbox.closest('tr').data('row-id');
    const field = $checkbox.data('field');
    const isChecked = $checkbox.is(':checked');
    config[rowId][field] = isChecked;
    onConfigUpdate(config, rowId, 'toggle');
  });
  $('#configTable').on('change', '.main-toggle', function(e) {
    e.stopPropagation();
    const $checkbox = $(this);
    const rowId = $checkbox.closest('tr').data('row-id');
    const field = $checkbox.data('field');
    const isChecked = $checkbox.is(':checked');
    config[rowId][field] = isChecked;
    onConfigUpdate(config, rowId, 'toggle');
  });
  $('#configTable').on('click', 'tbody tr', function(e) {
    if($(e.target).is('input, button, label, .slider')) return;
    const rowId = $(this).data('row-id');
    if(rowId && config[rowId]) {
      onRowSelected(rowId, config[rowId]);
    }
  });
  $('#configTextarea').on('input', function() {
    if(selectedRowId) {
      config[selectedRowId].textarea = $(this).val();
      onConfigUpdate(config, selectedRowId, 'edit');
    }
  });
  gtLocalDict(save_key_name, function(e){
    config = e
    gtLocal(save_line_name, function(e){
      selectedRowId = e
      var rowId = e
      renderTable();
      onRowSelected(rowId, config[rowId]);
    })
  })
  var toggle_key = 'config-hook-global-vmp'
  $('#toggle_vmp').on('change', '.status-toggle', function(e) {
    e.stopPropagation();
    const $checkbox = $(this);
    const isChecked = $checkbox.is(':checked');
    console.log(isChecked)
    svLocal(toggle_key, isChecked)
  });
  gtLocal(toggle_key, function(e){
    $('#toggle_vmp .status-toggle').prop("checked", !!e)
  })
});