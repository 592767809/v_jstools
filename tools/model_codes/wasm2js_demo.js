// 两种将 wasm 转换成 asmjs 办法，对于一些简短的算法来说，这种小工具会比较有用。




// npm install binaryen -S
(async () => {
  const { default: binaryen } = await import('binaryen');
  const wasmBuffer = fs.readFileSync('lib.wasm');
  const mod = binaryen.readBinary(new Uint8Array(wasmBuffer));
  const jsText = mod.emitAsmjs();
  console.log(jsText)
  mod.dispose();
})().catch(err => {
  console.error('发生错误:', err);
});





// html
<!DOCTYPE html>
<html>
<head>
  <title>WASM to JS 转换示例</title>
</head>
<body>
  <h1>WASM 到 JS 转换工具</h1>
  <input type="file" id="wasmFile" accept=".wasm">
  <pre id="output" style="background: #eee; padding: 10px; max-width: 800px; overflow: auto;"></pre>
  <script type="module">
    import binaryen from 'https://cdn.jsdelivr.net/npm/binaryen';
    const fileInput = document.getElementById('wasmFile');
    const output = document.getElementById('output');
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const wasmBuffer = await file.arrayBuffer();
        const wasmModule = binaryen.readBinary(new Uint8Array(wasmBuffer));
        const watText = wasmModule.emitAsmjs();
        output.textContent = watText;
        wasmModule.dispose();
      } catch (err) {
        output.textContent = '错误: ' + err.message;
      }
    });
  </script>
</body>
</html>