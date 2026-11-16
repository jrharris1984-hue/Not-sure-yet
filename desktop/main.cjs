// Phase 1 development prototype. Does not package Python, ComfyUI, or models.
const { app, BrowserWindow, dialog, shell } = require('electron');
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'frontend', 'build');
const HOST = '127.0.0.1';
const WEB_PORT = 18760;
const API_PORT = 18761;
let backend;
let webServer;
let closing = false;

function contentType(file) {
  return ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon', '.webp':'image/webp', '.woff2':'font/woff2', '.map':'application/json' })[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function startWebServer() {
  return new Promise((resolve, reject) => {
    webServer = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${HOST}:${WEB_PORT}`);
      if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
        const upstream = http.request({ hostname: HOST, port: API_PORT, path: url.pathname + url.search, method: req.method, headers: { ...req.headers, host: `${HOST}:${API_PORT}` } }, response => {
          res.writeHead(response.statusCode || 502, response.headers);
          response.pipe(res);
        });
        upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Backend unavailable'); });
        req.pipe(upstream);
        return;
      }
      let decoded;
      try { decoded = decodeURIComponent(url.pathname); } catch { res.writeHead(400); res.end(); return; }
      const requested = path.resolve(BUILD, '.' + decoded);
      if (requested !== BUILD && !requested.startsWith(BUILD + path.sep)) { res.writeHead(403); res.end(); return; }
      fs.stat(requested, (error, stats) => {
        const file = !error && stats.isFile() ? requested : path.join(BUILD, 'index.html');
        fs.readFile(file, (readError, bytes) => {
          if (readError) { res.writeHead(404); res.end('Frontend build missing'); return; }
          res.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store', 'X-Content-Type-Options':'nosniff' });
          res.end(bytes);
        });
      });
    });
    webServer.once('error', reject);
    webServer.listen(WEB_PORT, HOST, resolve);
  });
}

function launchBackend() {
  const python = process.env.ULTRA_STUDIO_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  backend = spawn(python, ['-m','uvicorn','server:app','--host',HOST,'--port',String(API_PORT)], {
    cwd: path.join(ROOT, 'backend'),
    env: { ...process.env, ULTRA_STUDIO_DESKTOP:'1', ULTRA_STUDIO_STORAGE:'sqlite', ULTRA_STUDIO_DATA_DIR: app.getPath('userData'), CORS_ORIGINS:`http://${HOST}:${WEB_PORT}` },
    windowsHide:true,
    stdio:['ignore','pipe','pipe'],
  });
  backend.stdout.on('data', chunk => process.stdout.write(chunk));
  backend.stderr.on('data', chunk => process.stderr.write(chunk));
  backend.on('error', error => { if (!closing) dialog.showErrorBox('Backend could not start', error.message); });
}

async function waitForBackend() {
  for (let attempt=0; attempt<60; attempt++) {
    if (backend?.exitCode !== null || backend?.killed) throw Error('Backend process exited before becoming ready.');
    try {
      const response = await fetch(`http://${HOST}:${API_PORT}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw Error('Backend did not become ready within 30 seconds.');
}

app.whenReady().then(async () => {
  try {
    if (!fs.existsSync(path.join(BUILD, 'index.html'))) throw Error('Frontend build missing. Run yarn build in frontend first.');
    await startWebServer();
    launchBackend();
    await waitForBackend();
    const window = new BrowserWindow({ width: 1440, height: 900, minWidth: 800, minHeight: 600, webPreferences: { nodeIntegration:false, contextIsolation:true, sandbox:true } });
    window.webContents.setWindowOpenHandler(({url}) => {
      if (/^https:\/\//.test(url)) shell.openExternal(url);
      return { action:'deny' };
    });
    window.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(`http://${HOST}:${WEB_PORT}/`)) event.preventDefault();
    });
    await window.loadURL(`http://${HOST}:${WEB_PORT}/`);
  } catch(error) {
    dialog.showErrorBox('Ultra Studio Desktop prototype', error.message);
    app.quit();
  }
});
app.on('before-quit', () => {
  closing = true;
  if (webServer) webServer.close();
  if (backend && !backend.killed) backend.kill();
});
app.on('window-all-closed', () => app.quit());
