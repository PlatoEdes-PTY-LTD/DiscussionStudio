// Drives Discussion Studio through the real WebMCP polyfill (@mcp-b/global), the way an agent
// does: document.modelContext.getTools() and executeTool().
// Usage: node webmcp.test.js <url of discussion-studio.html>   (http://localhost is needed)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok  ' + m); };
const URL_ = process.argv[2];
const polyfill = fs.readFileSync(path.join(__dirname, 'node_modules/@mcp-b/global/dist/index.iife.js'), 'utf8');

(async () => {
  let browser; try { browser = await chromium.launch(); } catch (e) { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('  [console.' + m.type() + '] ' + m.text().slice(0, 200)); });
  await page.addInitScript({ content: polyfill });
  await page.goto(URL_);
  await page.waitForFunction(() => window.DiagramAPI);
  await page.waitForTimeout(300);

  const info = await page.evaluate(async () => {
    const mc = document.modelContext;
    if (!mc) return { mc: false };
    const tools = await mc.getTools();
    return { mc: true, secure: isSecureContext, names: tools.map(t => t.name), annotations: tools.find(t => t.name === 'delete_items').annotations };
  });
  console.log('  polyfill:', JSON.stringify(info));
  assert(info.mc && info.names.length === 8, 'all 8 tools visible through document.modelContext.getTools()');

  // Helper in page: run a tool the way an agent would.
  await page.evaluate(() => {
    window.__run = async (name, args) => {
      const mc = document.modelContext;
      const t = (await mc.getTools()).find(x => x.name === name);
      const raw = await mc.executeTool(t, args);
      const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const text = res && res.content ? res.content[0].text : String(raw);
      let val; try { val = JSON.parse(text); } catch (e) { val = text; }
      return { isError: !!(res && res.isError), val, raw: typeof raw === 'string' ? raw.slice(0, 200) : undefined };
    };
  });

  const r = await page.evaluate(async () => {
    DiagramAPI.resetAll();
    const out = {};
    out.a = await __run('add_shape', { type: 'rectangle', label: 'Problem', x: 60, y: 120 });
    out.b = await __run('add_shape', { type: 'diamond', label: 'Fix now?', x: 300, y: 105 });
    out.c = await __run('add_shape', { type: 'circle', label: 'Ship', x: 560, y: 105, note: 'Friday' });
    out.c1 = await __run('connect_shapes', { from: out.a.val.id, to: out.b.val.id, label: 'triage' });
    out.c2 = await __run('connect_shapes', { from: out.b.val.id, to: out.c.val.id, kind: 'one-many' });
    out.bad = await __run('connect_shapes', { from: out.a.val.id, to: 'nope' });
    out.style = await __run('set_connection_style', { style: 'straight' });
    out.note = await __run('set_note', { id: out.c1.val.id, text: 'Agreed by the team', open: true });
    out.hw = await __run('add_handwritten_shape', { shape: 'circle', x: 270, y: 60, w: 200, h: 140, stroke: '#D93A2B' });
    out.ul = await __run('add_handwritten_shape', { shape: 'underline', x: 50, y: 200, w: 160 });
    out.get = await __run('get_diagram', {});
    return out;
  });
  if (r.a.raw) console.log('  raw result sample:', r.a.raw);
  assert(!r.a.isError && /^shape_/.test(r.a.val.id), 'add_shape -> ' + r.a.val.id);
  assert(!r.c1.isError && !r.c2.isError, 'connect_shapes x2');
  assert(r.bad.isError || /Error/.test(JSON.stringify(r.bad.val)), 'bad connect reports error: ' + JSON.stringify(r.bad.val).slice(0, 80));
  assert(r.style.val.connectionStyle === 'straight', 'set_connection_style');
  assert(r.note.val.open === true, 'set_note');
  assert(/^line_/.test(r.hw.val.id) && /^line_/.test(r.ul.val.id), 'add_handwritten_shape x2');
  assert(r.get.val.shapes.length === 3 && r.get.val.connections.length === 2 && r.get.val.drawings.length === 2, 'get_diagram reflects changes');
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'shot-webmcp.png') });

  // delete_items: decline then allow
  let p = page.evaluate(() => __run('delete_items', { ids: ['shape_1'], reason: 'merged into Fix now?' }));
  await page.waitForSelector('text=Allow delete?');
  await page.click("text=Don't allow");
  let d = await p;
  assert(d.val.cancelled === true, 'delete_items declined -> cancelled');
  p = page.evaluate(() => __run('delete_items', { ids: ['shape_1'] }));
  await page.waitForSelector('text=Allow delete?');
  await page.click('.modal-box .tbtn-danger');
  d = await p;
  const counts = await page.evaluate(() => { const s = DiagramAPI.getState(); return [s.shapes.length, s.connections.length]; });
  assert(d.val.deleted[0] === 'shape_1' && counts.join() === '2,1', 'delete_items allowed -> shape and its connection gone');

  // Re-registration does not duplicate tools
  const n = await page.evaluate(async () => { DiagramAPI.registerWebMCP(); return (await document.modelContext.getTools()).length; });
  assert(n === 8, 'registerWebMCP() again keeps 8 tools');

  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await browser.close();
  console.log('ALL PASSED');
})().catch(e => { console.error(e.message); process.exit(1); });
