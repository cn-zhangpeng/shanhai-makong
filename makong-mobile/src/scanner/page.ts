import jsqr from "../../assets/jsqr.json";

/** 扫码页的宿主 HTML：摄像头预览 + jsQR 识别 + 相册图片解码。 */
function buildPage(): string {
  const source = String((jsqr as { source?: string }).source ?? "");
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<style>
  html, body { margin: 0; height: 100%; background: #14100c; overflow: hidden;
    font-family: -apple-system, "Noto Sans SC", "PingFang SC", system-ui, sans-serif;
    -webkit-user-select: none; user-select: none; }
  #cam { position: absolute; inset: 0; background: #0b0907; }
  video { width: 100%; height: 100%; object-fit: cover; display: block; }
  #shade { position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 0 130px, rgba(10,8,6,0.55) 300px); }
  #frame { position: absolute; left: 50%; top: 42%; width: min(64vw, 260px); height: min(64vw, 260px);
    transform: translate(-50%, -50%); border-radius: 20px; border: 1px solid rgba(200,158,96,0.85);
    box-shadow: 0 0 0 1px rgba(200,158,96,0.25), 0 0 40px rgba(200,158,96,0.18) inset; }
  #frame .c { position: absolute; width: 26px; height: 26px; border: 3px solid #C89E60; border-radius: 6px; }
  #frame .tl { left: -2px; top: -2px; border-right: 0; border-bottom: 0; }
  #frame .tr { right: -2px; top: -2px; border-left: 0; border-bottom: 0; }
  #frame .bl { left: -2px; bottom: -2px; border-right: 0; border-top: 0; }
  #frame .br { right: -2px; bottom: -2px; border-left: 0; border-top: 0; }
  #laser { position: absolute; left: 50%; top: 42%; width: min(56vw, 228px); height: 2px;
    transform: translate(-50%, -50%); border-radius: 2px;
    background: linear-gradient(90deg, rgba(200,158,96,0), #E8C58C, rgba(200,158,96,0));
    box-shadow: 0 0 16px rgba(232,197,140,0.7); animation: sweep 2.4s ease-in-out infinite; }
  @keyframes sweep {
    0%, 100% { margin-top: -112px; opacity: 0.15; }
    12% { opacity: 1; } 88% { opacity: 1; }
    50% { margin-top: 112px; }
  }
  #tip { position: absolute; left: 0; right: 0; top: calc(42% + min(32vw, 130px) + 26px);
    text-align: center; color: rgba(245,238,226,0.72); font-size: 13px; letter-spacing: 1px; }
  #panel { position: absolute; left: 22px; right: 22px; top: 24%; box-sizing: border-box;
    padding: 26px 22px; border-radius: 22px; background: rgba(30,25,20,0.92);
    border: 1px solid rgba(200,158,96,0.22); text-align: center; }
  #panel .dot { width: 46px; height: 46px; margin: 0 auto 14px; border-radius: 23px;
    background: rgba(200,158,96,0.14); color: #E8C58C; font-size: 22px; font-weight: 700;
    line-height: 46px; }
  #panel .t { color: #F5EEE2; font-size: 16px; font-weight: 600; letter-spacing: 1px; }
  #panel .s { color: rgba(245,238,226,0.6); font-size: 12px; line-height: 19px; margin-top: 8px; }
  #toast { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%);
    max-width: 84%; padding: 10px 16px; border-radius: 18px; background: rgba(245,238,226,0.94);
    color: #2a2119; font-size: 12.5px; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
  <div id="cam">
    <video id="v" playsinline autoplay muted></video>
    <div id="shade"></div>
    <div id="frame"><span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span></div>
    <div id="laser"></div>
    <div id="tip">将二维码放入框内，即可自动识别</div>
    <div id="panel" hidden>
      <div class="dot">!</div>
      <div class="t" id="ptitle">摄像头不可用</div>
      <div class="s" id="pmsg">可以改用相册里的二维码截图。</div>
    </div>
    <div id="toast" hidden></div>
  </div>
  <canvas id="c" hidden></canvas>
  <script>/*__JSQR__*/</script>
  <script>
    (function () {
      var video = document.getElementById('v');
      var canvas = document.getElementById('c');
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      var panel = document.getElementById('panel');
      var ptitle = document.getElementById('ptitle');
      var pmsg = document.getElementById('pmsg');
      var tip = document.getElementById('tip');
      var toastEl = document.getElementById('toast');
      var stream = null;
      var stopped = false;
      var busy = false;
      var lastText = '';
      var toastTimer = null;

      function send(obj) {
        try { if (window.nsh && window.nsh.postMessage) window.nsh.postMessage(JSON.stringify(obj)); } catch (e) {}
      }
      function showPanel(title, message) {
        ptitle.textContent = title;
        pmsg.textContent = message;
        panel.hidden = false;
        tip.hidden = true;
      }
      function hidePanel() { panel.hidden = true; tip.hidden = false; }
      function showToast(text) {
        toastEl.textContent = text;
        toastEl.hidden = false;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2200);
      }
      function report(text) {
        if (!text || text === lastText) return;
        lastText = text;
        send({ type: 'result', text: String(text) });
      }
      function decode(source, width, height) {
        var image = ctx.getImageData(0, 0, width, height);
        if (!window.jsQR) return null;
        return window.jsQR(image.data, width, height, { inversionAttempts: 'attemptBoth' });
      }
      function tick() {
        if (stopped) return;
        if (!busy && video.readyState === 4 && video.videoWidth > 0) {
          busy = true;
          try {
            var vw = video.videoWidth, vh = video.videoHeight;
            var scale = Math.min(900 / Math.max(vw, vh), 1);
            canvas.width = Math.max(1, Math.round(vw * scale));
            canvas.height = Math.max(1, Math.round(vh * scale));
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            var code = decode(video, canvas.width, canvas.height);
            if (code && code.data) report(code.data);
          } catch (e) {}
          busy = false;
        }
        setTimeout(function () { requestAnimationFrame(tick); }, 140);
      }
      function startCamera() {
        try { console.log('NSHSCAN md=' + typeof navigator.mediaDevices + ' secure=' + window.isSecureContext + ' origin=' + location.origin); } catch (e) {}
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showPanel('无法启用摄像头', '当前系统不支持网页调用摄像头。');
          send({ type: 'camera-error', message: 'unsupported' });
          return;
        }        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } }
        }).then(function (s) {
          stream = s;
          video.srcObject = s;
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
          hidePanel();
          send({ type: 'camera-ready' });
          requestAnimationFrame(tick);
        }).catch(function (e) {
          var name = (e && e.name) || '';
          var message = (e && e.message) || String(e);
          try { console.log('NSHSCAN error ' + name + ' ' + message); } catch (err) {}
          showPanel('摄像头不可用', '可以改用相册里的二维码截图。');
          send({ type: 'camera-error', message: name + ' ' + message });
        });
      }
      window.addEventListener('message', function (event) {
        var data = event.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (e) { return; }
        }
        if (data && data.type === 'stop') {
          stopped = true;
          if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
          return;
        }
        if (!data || data.type !== 'image' || !data.dataUrl) return;
        showToast('正在识别图片…');
        var img = new Image();
        img.onload = function () {
          try {
            var scale = Math.min(1600 / Math.max(img.width, img.height), 1);
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            var code = decode(img, canvas.width, canvas.height);
            if (code && code.data) {
              showToast('识别成功');
              report(code.data);
            } else {
              showToast('没有识别到二维码，换一张试试');
              send({ type: 'image-none' });
            }
          } catch (e) {
            showToast('图片解析失败');
            send({ type: 'image-none' });
          }
        };
        img.onerror = function () {
          showToast('图片读取失败');
          send({ type: 'image-none' });
        };
        img.src = data.dataUrl;
      });
      startCamera();
      window.addEventListener('pagehide', function () { stopped = true; if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); });
    })();
  </script>
</body>
</html>`;
  return html.replace("/*__JSQR__*/", source);
}

export const SCANNER_HTML = buildPage();
