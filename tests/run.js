// Serves the project folder on a free localhost port and runs every test in this folder.
// Usage: npm test   (from the tests folder)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = 'discussion-studio.html';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ico': 'image/x-icon', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

// Each test runs as a child process. spawn (not spawnSync) keeps this process free to serve pages.
function runChild(args) {
  return new Promise(resolve => spawn(process.execPath, args, { stdio: 'inherit' }).on('close', resolve));
}

server.listen(0, '127.0.0.1', async () => {
  const url = 'http://localhost:' + server.address().port + '/' + APP;
  fs.mkdirSync(path.join(__dirname, 'screenshots'), { recursive: true });
  const runs = [
    ['api.test.js', path.join(ROOT, APP)],   // file://, as a person opens the downloaded file
    ['api.test.js', url],
    ['webmcp.test.js', url],
    ['agent-example.test.js', url],
    ['routing.test.js', url],
    ['copypaste.test.js', url],
    ['groups.test.js', url],
  ];
  const failed = [];
  for (const [file, target] of runs) {
    console.log('\n== ' + file + '  ' + (target.startsWith('http') ? target : 'file://' + target));
    const status = await runChild([path.join(__dirname, file), target]);
    if (status !== 0) failed.push(file + ' (' + (target.startsWith('http') ? 'http' : 'file') + ')');
  }
  server.close();
  console.log(failed.length ? '\nFAILED: ' + failed.join(', ') : '\nAll test files passed. Screenshots: tests/screenshots/');
  process.exit(failed.length ? 1 : 0);
});
