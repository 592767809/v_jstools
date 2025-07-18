(function () {
    if (typeof window == 'undefined' || window != window.top){ return }
    var overlay_bg = document.getElementById('vvv-fullscreen-overlay')
    if (overlay_bg) { overlay_bg.vvv_clear(); overlay_bg.remove(); return; }
    function make_saver(){
        var index = 0
        var receiver = {}
        var receiver_func = function(event){ receiver[event.detail.index] = event.detail.message }
        window.addEventListener('vvv_FromIToM', receiver_func)
        function send_info(type, message, value, index, callback){
            Object.defineProperty(receiver, index, {configurable: true, set: function(v){
                callback && callback(v); delete receiver[index]
            }})
            window.dispatchEvent(new CustomEvent("vvv_FromMToI", {
                detail: { type, message, value, index }
            }));
        }
        function get_info(msg, cb){      send_info('get', msg, null, index++, cb) }
        function set_info(msg, val, cb){ send_info('set', msg, val,  index++, cb) }
        function get_url(msg, cb){       send_info('url', msg, null, index++, cb) }
        function clear(){ window.removeEventListener('vvv_FromIToM', receiver_func) }
        return [get_info, set_info, clear, get_url]
    }
    var [get_info, set_info, clear, get_url] = make_saver()
    const overlay = document.createElement('div');
    overlay.vvv_clear = clear
    overlay.id = 'vvv-fullscreen-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(255,255,255,1)';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'block';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.color = '#000';
    overlay.style.fontSize = '14px';
    document.body.appendChild(overlay);

    var generator = vvv_Babel.packages.generator.default
    var parser = vvv_Babel.packages.parser
    var template = vvv_Babel.packages.template.default
    var traverse = vvv_Babel.packages.traverse.default
    var t = vvv_Babel.packages.types

    // 想办法构造一个方便好用的操作 ast 的页面，与当前页面合为一体
    // 这样可以比较方便的利用导出到页面中的解密函数

    var sv_keys = "config-inject_ast_config"
    var tbid = "inject_ast_config_table"
    var init_config = {init_data: []}
    var table = document.createElement('table')
    table.id = tbid
    overlay.appendChild(table)
    function create_txt(name, height, show){
        var hr = document.createElement('hr')
        hr.style.margin = '0px'
        overlay.appendChild(hr)
        var div = document.createElement('div')
        div.style.display = 'flex'
        var tt = document.createElement('h4')
        tt.innerText = name
        tt.style.margin = '2px'
        tt.style.width = '222px'
        tt.style.height = '18px'
        tt.style.padding = '3px'
        div.appendChild(tt)
        if (typeof show == 'string'){
            var btn = document.createElement('button')
            btn.class = 'single-run'
            btn.innerText = '点击:展示或隐藏输入窗口'
            btn.style.margin = '2px'
            btn.style.height = '24px'
            btn.style.padding = '0px 10px'
            btn.onclick = function(){
                if (!txt.style.display){ txt.style.display = 'none' }
                else{ txt.style.display = '' }
            }
            div.appendChild(btn)
        }
        overlay.appendChild(div)
        var txt = document.createElement('textarea')
        txt.spellcheck = false;
        txt.style.width = '675px';
        txt.style.height = height;
        txt.style.margin = '0px 4px';
        txt.style.display = show
        overlay.appendChild(txt)
        txt.vvv_show = function(){ txt.style.display = '' }
        txt.vvv_to_end = function(){ txt.scrollTop = txt.scrollHeight }
        return txt
    }
    var ast_code = create_txt('选中的ast脚本', '222px', 'none')
    var log = create_txt('日志', '100px', 'none')
    var source_code = create_txt('原始代码', '222px', false)
    var target_code = create_txt('解密代码', '400px', false)
    var magic_ele = undefined;
    var magic_cache = undefined;
    $(ast_code).on('change', function(e){
        e.stopPropagation();
        if (magic_ele){
            $(magic_ele).find('textarea').val($(this).val())
            magic_cache()
        }
    })
    $(source_code).on('change', function(e){
        e.stopPropagation();
        if (magic_cache){
            init_config.source_code = source_code.value
            magic_cache()
        }
    })
    function svLocal(k,v,f){set_info(k,v,f)}
    function gtLocal(k,f){get_info(k,f)}
    function do_ast(rowData, ast){
        var [name, desc, code, toggle] = rowData
        log.value += `【${name}】 正在运行...\n`
        var func = eval(`1, function _(ast){ 
            ${code} 
        }`)
        func(ast)
        log.value += `【${name}】 运行结束\n`
    }
    function run_single(rowData){
        // log.vvv_show()
        log.vvv_to_end()
        target_code.value = 'running...'
        setTimeout(function(){
            var jscode = source_code.value
            var ast = parser.parse(jscode, {allowReturnOutsideFunction:true, sourceType: 'unambiguous'})
            do_ast(rowData, ast)
            var code = generator(ast).code
            target_code.value = code
        }, 300)
    }
    function run_multi(rowDatas){
        log.vvv_show()
        log.vvv_to_end()
        target_code.value = 'running...'
        setTimeout(function(){
            var jscode = source_code.value
            var ast = parser.parse(jscode, {allowReturnOutsideFunction:true, sourceType: 'unambiguous'})
            for (var i = 0; i < rowDatas.length; i++) {
                var [name, desc, code, toggle] = rowDatas[i]
                if (toggle){
                    do_ast(rowDatas[i], ast)
                }
            }
            var code = generator(ast).code
            target_code.value = code
        }, 300)
    }
    var demo_list = [
        ["解密jsfuck", "用于 解密jsfuck 一类的代码混淆", String.raw`
            function v_packtype(value){
                if (typeof value == 'number'){ return t.NumericLiteral(value) }
                if (typeof value == 'string'){ return t.StringLiteral(value) }
                if (typeof value == 'boolean'){ return t.BooleanLiteral(value) }
                if (value === undefined){ return t.Identifier('undefined') }
                throw TypeError('not find value type ' + typeof value)
            }
            var jsfuck_toggle = 0
            function v_Unary1(path){ try{ path.replaceWith(v_packtype(eval(path+''))); jsfuck_toggle += 1 }catch(e){} }
            function v_Binary1(path){ try{ path.replaceWith(v_packtype(eval(path+''))); jsfuck_toggle += 1 }catch(e){} }
            function v_Member1(path){ try{ path.replaceWith(v_packtype(eval(path+''))); jsfuck_toggle += 1 }catch(e){} }
            function v_Call1(path){
                var location = 'http://www.test.com'
                var v = /^\[\]\[(?:"|')[^"]+(?:"|')\]\[(?:"|')constructor(?:"|')\]\((?:"|')return (location|escape|unescape)(?:"|')\)/.exec(path+'')
                if (v){ path.replaceWith(t.StringLiteral(eval(v[1])+'')) }
                if (typeof window == 'undefined'){
                    var v = /^\[\]\[(?:"|')[^"]+(?:"|')\]\[(?:"|')constructor(?:"|')\]\((?:"|')return (statusbar|personalbar|scrollbars|toolbar)(?:"|')\)/.exec(path+'')
                    if (v){ path.replaceWith(t.StringLiteral('[object BarProp]')) }
                }
            }
            while (1){
                if (typeof location !== 'undefined' && location.href.indexOf('http') != 0){ // 处理你的脚本运行在插件时的问题
                    var _Function = Function
                    Object.defineProperty(Function.prototype, 'constructor', {
                      value: function() {
                        if (arguments[0] == 'return location'){ return function(){ return {toString: function(){return 'http://'}} } }
                        return _Function.apply(this, arguments)
                      }
                    })
                }
                traverse(ast, {UnaryExpression: v_Unary1,})
                traverse(ast, {BinaryExpression: v_Binary1,})
                traverse(ast, {MemberExpression: v_Member1,})
                traverse(ast, {CallExpression: v_Call1,})
                if (typeof location !== 'undefined' && location.href.indexOf('http') != 0){
                    Object.defineProperty(Function.prototype, 'constructor', { value: _Function })
                }
                if (jsfuck_toggle == 0){ break }else{ jsfuck_toggle = 0 }
            }
        `, false],
        ["合并对象", "专用于 ob 混淆的一种对象合并", `
            function MergeObj(path) {
                // var _0xb28de8 = {};
                // _0xb28de8["abcd"] = function(_0x22293f, _0x5a165e) {
                //     return _0x22293f == _0x5a165e;
                // };
                // _0xb28de8.dbca = function(_0xfbac1e, _0x23462f, _0x556555) {
                //     return _0xfbac1e(_0x23462f, _0x556555);
                // };
                // _0xb28de8.aaa = function(_0x57e640) {
                //     return _0x57e640();
                // };
                // _0xb28de8["bbb"] = "eee";
                // var _0x15e145 = _0xb28de8;
                //  |
                //  |
                //  |
                //  v
                // var _0xb28de8 = {
                //   "abcd": function (_0x22293f, _0x5a165e) {
                //     return _0x22293f == _0x5a165e;
                //   },
                //   "dbca": function (_0xfbac1e, _0x23462f, _0x556555) {
                //     return _0xfbac1e(_0x23462f, _0x556555);
                //   },
                //   "aaa": function (_0x57e640) {
                //     return _0x57e640();
                //   },
                //   "bbb": "eee"
                // };
                const {id, init} = path.node;
                if (!t.isObjectExpression(init)) // 判断是否是定义对象
                    return;
                let name = id.name;
                let properties = init.properties;
                let scope = path.scope;
                let binding = scope.getBinding(name);
                if (!binding || binding.constantViolations.length > 0) { // 确认该对象没有被多次定义
                    return;
                }
                let paths = binding.referencePaths;
                scope.traverse(scope.block, {
                    AssignmentExpression: function(_path) {
                        const left = _path.get("left");
                        const right = _path.get("right");
                        if (!left.isMemberExpression())
                            return;
                        const object = left.get("object");
                        const property = left.get("property");
                        function _pas_path(_path, left){
                            if (_path.parentPath.node.type == 'VariableDeclarator' || _path.parentPath.node.type == 'AssignmentExpression'){
                                _path.replaceWith(left)
                            }else{
                                _path.remove();
                            }
                        }
                        if (object.isIdentifier({name: name}) && property.isStringLiteral() && _path.scope == scope) {
                            properties.push(t.ObjectProperty(t.valueToNode(property.node.value), right.node));
                            _pas_path(_path, left)
                        }
                        if (object.isIdentifier({name: name}) && property.isIdentifier() && _path.scope == scope) {
                            properties.push(t.ObjectProperty(t.valueToNode(property.node.name), right.node));
                            _pas_path(_path, left)
                        }
                    }
                })
                paths.map(function(refer_path) {
                    try{
                        let bindpath = refer_path.parentPath; 
                        if (!t.isVariableDeclarator(bindpath.node)) return;
                        let bindname = bindpath.node.id.name;
                        bindpath.scope.rename(bindname, name, bindpath.scope.block);
                        bindpath.remove();
                    }catch(e){}
                });
            }
            traverse(ast, {VariableDeclarator: {exit: MergeObj},});
        `, false],
        ["合并调用", "专用于 ob 混淆的对象调用", `
            function CallToStr(path) {
                // var _0xb28de8 = {
                //     "abcd": function(_0x22293f, _0x5a165e) {
                //         return _0x22293f == _0x5a165e;
                //     },
                //     "dbca": function(_0xfbac1e, _0x23462f, _0x556555) {
                //         return _0xfbac1e(_0x23462f, _0x556555);
                //     },
                //     "aaa": function(_0x57e640) {
                //         return _0x57e640();
                //     },
                //     "bbb": "eee"
                // };
                // var aa = _0xb28de8["abcd"](123, 456);
                // var bb = _0xb28de8["dbca"](bcd, 11, 22);
                // var cc = _0xb28de8["aaa"](dcb);
                // var dd = _0xb28de8["bbb"];
                //   |
                //   |
                //   |
                //   v
                // var aa = 123 == 456;
                // var bb = bcd(11, 22);
                // var cc = dcb();
                // var dd = "eee";
                var node = path.node;
                if (!t.isObjectExpression(node.init)) // 判断是否使用对象
                    return;
                var objPropertiesList = node.init.properties;
                if (objPropertiesList.length == 0)
                    return;
                var objName = node.id.name;
                // 是否可删除该对象：发生替换时可删除，否则不删除
                var del_flag = false
                var objkeys = {}
                var objlist = objPropertiesList.map(function(prop){
                    var key = prop.key.value
                    if(t.isFunctionExpression(prop.value)) {
                        var retStmt = prop.value.body.body[0];
                        if (typeof retStmt == 'undefined') return;
                        if (t.isBinaryExpression(retStmt.argument)) {
                            var repfunc = function(_path, args){
                                if (args.length == 2){
                                    _path.replaceWith(t.binaryExpression(retStmt.argument.operator, args[0], args[1]));
                                }
                            }
                        }
                        else if(t.isLogicalExpression(retStmt.argument)) {
                            var repfunc = function(_path, args){
                                if (args.length == 2){
                                    _path.replaceWith(t.logicalExpression(retStmt.argument.operator, args[0], args[1]));
                                }
                            }
                        }
                        else if(t.isCallExpression(retStmt.argument) && t.isIdentifier(retStmt.argument.callee)) {
                            var repfunc = function(_path, args){
                                _path.replaceWith(t.callExpression(args[0], args.slice(1)))
                            }
                        }
                        objkeys[key] = repfunc
                    }
                    else if (t.isStringLiteral(prop.value)){
                        var retStmt = prop.value.value;
                        objkeys[key] = function(_path){
                            _path.replaceWith(t.stringLiteral(retStmt))
                        }
                    }
                })
                var fnPath = path.getFunctionParent() || path.scope.path;
                fnPath.traverse({
                    CallExpression: function (_path) {
                        var _node = _path.node.callee;
                        if (!t.isMemberExpression(_path.node.callee))
                            return;
                        if (!t.isIdentifier(_node.object) || _node.object.name !== objName)
                            return;
                        if (!(t.isStringLiteral(_node.property) || t.isIdentifier(_node.property)))
                            return;
                        if (!(objkeys[_node.property.value] || objkeys[_node.property.name]))
                            return;
                        var args = _path.node.arguments;
                        var func = objkeys[_node.property.value] || objkeys[_node.property.name]
                        func(_path, args)
                        del_flag = true;
                    },
                    MemberExpression:function (_path) {
                        var _node = _path.node;
                        if (!t.isIdentifier(_node.object) || _node.object.name !== objName)
                            return;
                        if (!(t.isStringLiteral(_node.property) || t.isIdentifier(_node.property)))
                            return;
                        if (!(objkeys[_node.property.value] || objkeys[_node.property.name]))
                            return;
                        var func = objkeys[_node.property.value] || objkeys[_node.property.name]
                        func(_path)
                        del_flag = true;
                    }
                })

                if (del_flag) {
                    // 如果发生替换，则删除该对象, 该处可能出问题，因为字典的内容未必会饱和使用
                    path.remove();
                } 
            }
            traverse(ast, {VariableDeclarator: {exit: CallToStr},});
        `, false],
        ["移除ob控制流", "利用ast移除脚本中老版本的ob混淆控制流", `
            function ReplaceWhile(path) {
                var node = path.node;
                if (!(t.isBooleanLiteral(node.test) || t.isUnaryExpression(node.test)))
                    return;
                if (!(node.test.prefix || node.test.value))
                    return;
                if (!t.isBlockStatement(node.body))
                    return;
                var body = node.body.body;
                if (!t.isSwitchStatement(body[0]) || !t.isMemberExpression(body[0].discriminant) || !t.isBreakStatement(body[1]))
                    return;
                var swithStm = body[0];
                var arrName = swithStm.discriminant.object.name;
                var argName = swithStm.discriminant.property.argument.name
                let arr = [];
                let all_presibling = path.getAllPrevSiblings();
                all_presibling.forEach(pre_path => {
                    const {declarations} = pre_path.node;
                    let {id, init} = declarations[0]
                    if (arrName == id.name) {
                        arr = init.callee.object.value.split('|');
                        pre_path.remove()
                    }
                    if (argName == id.name) {
                        pre_path.remove()
                    }
                })
                var caseList = swithStm.cases;
                var resultBody = [];
                arr.map(targetIdx => {
                    var targetBody = caseList[targetIdx].consequent;
                    if (t.isContinueStatement(targetBody[targetBody.length - 1]))
                        targetBody.pop();
                    resultBody = resultBody.concat(targetBody)
                });
                path.replaceInline(resultBody);
            }
            traverse(ast, {WhileStatement: {exit: [ReplaceWhile]},});
        `, false],
        ["移除debugger", "利用ast移除脚本中的debugger", `traverse(ast, {DebuggerStatement: function(path){path.remove()}})`, true],
        ["解密ob变量", "利用导出函数解密全局函数的变量", `
            function funToStr(path) {
                var node = path.node;
                var decryptStr = '_0x3925'
                if (t.isIdentifier(node.callee, {name: decryptStr})) {
                    node.callee = t.Identifier('vvv')
                    var code = generator(node).code
                    var value = eval(code)
                    console.log('解密参数:', path+'', '===>', value)
                    path.replaceWith(t.valueToNode(value));
                }
            }
            function delExtra(path) { delete path.node.extra; }
            traverse(ast, {
                CallExpression: funToStr,
                StringLiteral: delExtra,
                NumericLiteral: delExtra,
            })
        `, true],
        ["二元运算合并", "数字、布尔值、字符串、null", `
            function calcBinary(path){
                var tps = ['StringLiteral', 'BooleanLiteral', 'NumericLiteral', 'NullLiteral']
                var nod = path.node
                function judge(e){
                    return (tps.indexOf(e.type) != -1) || (e.type == 'UnaryExpression' && tps.indexOf(e.argument.type) != -1)
                }
                function make_rep(e){
                    if (typeof e == 'number'){ return t.NumericLiteral(e) }
                    if (typeof e == 'string'){ return t.StringLiteral(e) }
                    if (typeof e == 'boolean'){ return t.BooleanLiteral(e) }
                    throw Error('unknown type' + typeof e)
                }
                if (judge(nod.left) && judge(nod.right)){
                    path.replaceWith(make_rep(eval(path+'')))
                }
            }
            traverse(ast, {BinaryExpression: {exit: calcBinary}})
        `, true],
    ]
    var demo_list2 = ["功能", "功能描述", "", false]
    var v_console_log = console.log
    function config_table_func(idname, titlenames, init_config, callback) {
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
            ${cid} .add-from-web, ${cid} .add-example, ${cid} .add-empty, ${cid} .run-all-script {
                background-color: #28a745;
                color: white;
            }
            ${cid} .add-from-web:hover, ${cid} .add-example:hover, ${cid} .add-empty:hover, ${cid} .run-all-script:hover {
                background-color: #218838;
            }
            ${cid} .remove-row, ${cid} .close-page {
                background-color: #dc3545;
                color: white;
            }
            ${cid} .remove-row:hover, ${cid} .close-page:hover {
                background-color: #c82333;
            }
            ${cid} .single-run {
                background-color: #28a745;
                color: white;
            }
            ${cid} .single-run:hover {
                background-color: #218838;
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
                box-shadow: 0 0 0 3px rgba(0,123,255,0.25);
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
            ${cid} .selected-row {
                background-color: #e2f0d9 !important;
                outline: 2px solid #28a745;
                outline-offset: -2px;
            }
            ${cid} .label-switch {
                position: relative;
                display: inline-block;
                width: 28px;
                height: 16px;
                left: 2px;
            }
            ${cid} .label-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            ${cid} .label-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .05s;
                border-radius: 16px;
            }
            ${cid} .label-slider:before {
                position: absolute;
                content: "";
                height: 12px;
                width: 12px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                transition: .05s;
                border-radius: 50%;
            }
            ${cid} input:checked + .label-slider {
                background-color: #4285f4;
            }
            ${cid} input:checked + .label-slider:before {
                transform: translateX(12px);
            }
        `;
        document.head.appendChild(style);
        var title = '';
        var fwkey = 'from_web_' + (Math.random()+'').split('.').pop()
        title += '<tr><td colspan="' + (titlenames.length + 2) + '">';
        title += '<button class="close-page">关闭页面</button>';
        title += '<hr>';
        title += '<button class="add-from-web">从网上下载示例</button>';
        title += '<input id="'+fwkey+'" type="text" style="width: 400px" spellcheck="false"></input>';
        title += '<hr>';
        title += '<button class="add-example">添加默认示例</button>';
        title += '<button class="add-empty">添加空白行</button>';
        title += '<button class="run-all-script">按顺序运行启用插件</button>';
        title += '</td></tr>';
        title += '<tr>';
        title += '<td style="width: 40px">排序</td>';
        for (var i = 0; i < titlenames.length; i++) {
            title += '<td style="'+(titlenames[i].split('|')[1]||'')+'">' + titlenames[i].split('|')[0] + '</td>';
        }
        title += '<td>操作</td>';
        title += '</tr>';
        $(cid).html(title);

        function check_in_table(demo){
            var data_list = get_snapshot()
            for (var i = 0; i < data_list.length; i++) {
                var [a,b,c] = data_list[i]
                if (demo[0] == a && demo[1] == b && demo[2] == c){
                    return true
                }
            }
        }
        $(cid).on('click', '.add-example', function() {
            for (var i = 0; i < demo_list.length; i++) {
                if (!check_in_table(demo_list[i])){
                    addRow(demo_list[i]);
                }
            }
        });
        var from_web_key = 'config-add-from-web'
        gtLocal(from_web_key, function(e){
            if (e){
                $('#'+fwkey).val(e)
            }
            if (!$('#'+fwkey).val()){
                $('#'+fwkey).val('http://8.130.117.18:8012/config_ast')
            }
            $('#'+fwkey).on('change', function(e){
                svLocal(from_web_key, $('#'+fwkey).val())
            })
        })
        $(cid).on('click', '.close-page', function() { 
            var overlay_bg = document.getElementById('vvv-fullscreen-overlay')
            if (overlay_bg){ overlay_bg.vvv_clear(); overlay_bg.remove(); }
        });
        $(cid).on('click', '.add-empty', function() { addRow(demo_list2); });
        $(cid).on('click', '.add-from-web', function() { 
            var url = $('#'+fwkey).val()
            get_url({ url }, function(e){
                v_console_log('[*] request url:', url)
                v_console_log('[*] request res:', e)
                if (!Array.isArray(e)){ alert(e); return }
                for (var i = 0; i < e.length; i++) {
                    if (!check_in_table(e[i])){
                        addRow(e[i]);
                    }
                }
            })
        });
        $(cid).on('click', '.run-all-script', function() { run_multi(__cache_data()) });
        $(cid).on('click', '.remove-row', function() {
            $(this).closest('tr').remove();
            __cache_data();
        });
        function getRowData(row) {
            var rowData = [];
            row.find('td').each(function(index) {
                if (index > 0 && index < row.find('td').length - 1) { // 跳过排序和操作列
                    var ipt = $(this).find('input,textarea');
                    if (ipt.length) {
                        if (ipt.get(0).type == 'text'){
                            rowData.push(ipt.val());
                        }else if (ipt.get(0).type == 'textarea'){
                            rowData.push(ipt.val());
                        }else if (ipt.get(0).type == 'checkbox'){
                            rowData.push(ipt.get(0).checked);
                        }
                    }
                }
            });
            return rowData;
        }
        $(cid).on('click', 'tr:not(:first-child,:eq(1))', function(e) {
            if ($(e.target).is('button') || $(e.target).closest('button').length) {
                return;
            }
            $(cid).find('tr').removeClass('selected-row');
            $(this).addClass('selected-row');
            var rowData = getRowData($(this));
            magic_ele = this
            $(ast_code).val($(magic_ele).find('textarea').val())
        });
        $(cid).on('click', '.single-run', function(e) {
            e.stopPropagation();
            var row = $(this).closest('tr');
            if (!row.hasClass('selected-row')) {
                $(cid).find('tr').removeClass('selected-row');
                row.addClass('selected-row');
            }
            run_single(getRowData(row))
        });
        $(cid).on('click', '.use-checkbox', function(e) {
            e.stopPropagation();
            var row = $(this).closest('tr');
            if (!row.hasClass('selected-row')) {
                $(cid).find('tr').removeClass('selected-row');
                row.addClass('selected-row');
            }
            var rowData = getRowData(row);
            __cache_data();
        });
        init_config.init_data = init_config.init_data || [];
        for (var i = 0; i < init_config.init_data.length; i++) {
            addRow(init_config.init_data[i], true);
        }
        __cache_data();
        $(cid).sortable({
            items: "tr:not(:first,:eq(1))",
            handle: ".sort-handle",
            axis: "y",
            stop: function() {
                __cache_data();
            }
        });
        function get_snapshot(){
            var data_list = [];
            var trs = $(cid).find("tr:not(:first,:eq(1))");
            trs.each(function() {
                var tds = $(this).find("td");
                var data_line = [];
                for (var j = 1; j < tds.length - 1; j++) {
                    var ipt = $(tds[j]).find("input,textarea");
                    if (ipt.get(0).type == 'text') {
                        data_line.push(ipt.val());
                    }else if (ipt.get(0).type == 'textarea'){
                        data_line.push(ipt.val());
                    }else if (ipt.get(0).type == 'checkbox'){
                        data_line.push(ipt.get(0).checked);
                    }
                }
                if (data_line.length) {
                    data_list.push(data_line);
                }
            });
            return data_list
        }
        function __cache_data() {
            var data_list = get_snapshot()
            init_config.init_data.length = 0;
            Array.prototype.push.apply(init_config.init_data, data_list);
            callback(init_config);
            return init_config.init_data
        }
        magic_cache = __cache_data
        function __add_changer(index) {
            var row = $(cid).find("tr").eq(index);
            row.find("input").on("input", function() {
                __cache_data();
            });
        }
        function addRow(data, not_cache) {
            var addRowHtmlStr = '<tr>';
            addRowHtmlStr += '<td class="sort-handle" style="cursor: move">↕</td>';
            for (var i = 0; i < titlenames.length; i++) {
                var [name, style, type] = titlenames[i].split('|');
                style = style || 'width: 150px';
                type = type || 'text'
                if (type == 'checkbox'){
                    addRowHtmlStr += `
                        <td style='${style}'>
                            <label class="label-switch">
                                <input spellcheck="false" type='${type}' style='${style}' class="use-checkbox">
                                <span class="label-slider"></span>
                            </label>
                        </td>
                    `;
                }else if(type == 'textarea'){
                    addRowHtmlStr += `<td style='${style}'><textarea spellcheck="false" type='${type}' style='${style}'></textarea></td>`;
                }
                else{
                    addRowHtmlStr += `<td style='${style}'><input spellcheck="false" type='${type}' style='${style}'></td>`;
                }
            }
            addRowHtmlStr += '<td><button class="remove-row">删除行</button><button class="single-run">单独运行</button></td>';
            addRowHtmlStr += '</tr>';
            $(trlast).after(addRowHtmlStr);
            var newRowIndex = $(cid).find("tr").length - 1;
            __add_changer(newRowIndex);
            if (data) { 
                var ctds = $(cid).find("tr").eq(newRowIndex).find("td");
                var leng = Math.min(data.length, titlenames.length);
                for (var i = 0; i < leng; i++) {
                    var ipt = $(ctds[i + 1]).find('input,textarea')
                    if (ipt.get(0).type == 'text'){
                        ipt.val(data[i]); 
                    }else if (ipt.get(0).type == 'textarea'){
                        ipt.val(data[i])
                    }else if (ipt.get(0).type == 'checkbox'){
                        ipt.prop('checked', data[i]); 
                    }
                }
            }
            if (!not_cache){ __cache_data(); }
        }
    }
    gtLocal(sv_keys, function(e){
        try{
            init_config = JSON.parse(e)
            if (!init_config.init_data){
                init_config = {init_data: []}
            }
        }catch(e){}
        source_code.value = init_config.source_code || ''
        config_table_func(tbid, ["名称|width:150px", "功能描述|width:250px", '|display:none|textarea', '启用|width:50px|checkbox'], init_config, function(init_config){
            svLocal(sv_keys, JSON.stringify(init_config))
        })
    })
})()