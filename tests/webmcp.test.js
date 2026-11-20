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
  assert(info.mc && info.names.length === 12, 'all 12 tools visible through document.modelContext.getTools()');

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

  // groups
  const g = await page.evaluate(async () => {
    const out = {};
    out.make = await __run('create_group', { shapeIds: ['shape_2', 'shape_3'], groupId: 'Core', label: 'Core flow', note: 'main path' });
    out.badId = await __run('create_group', { shapeIds: ['nope'] });
    out.dupGid = await __run('create_group', { shapeIds: ['shape_2'], groupId: 'Core' });
    out.upd = await __run('update_group', { id: 'Core', groupId: 'Core-2', label: 'Renamed', fill: '#E8F7EF' });
    out.ext = await __run('add_shape', { label: 'Outside', x: 800, y: 300 });
    out.conn = await __run('connect_shapes', { from: out.make.val.id, to: out.ext.val.id, label: 'feeds' });
    out.get = await __run('get_diagram', {});
    out.dup = await __run('duplicate_items', { ids: [out.make.val.id], dx: 0, dy: 300 });
    out.get2 = await __run('get_diagram', {});
    return out;
  });
  assert(!g.make.isError && g.make.val.groupId === 'Core' && g.make.val.members.length === 2 && g.make.val.connections.length === 1, 'create_group -> ' + JSON.stringify(g.make.val));
  assert(g.badId.isError && /nope/.test(JSON.stringify(g.badId.val)), 'create_group rejects unknown shape id');
  assert(g.dupGid.isError && /already/.test(JSON.stringify(g.dupGid.val)), 'create_group rejects duplicate Group ID');
  assert(!g.upd.isError && g.upd.val.groupId === 'Core-2' && g.upd.val.label === 'Renamed', 'update_group by Group ID');
  assert(!g.conn.isError, 'connect_shapes from a group');
  const gs = g.get.val.shapes.find(x => x.type === 'group');
  assert(gs && gs.groupId === 'Core-2' && g.get.val.shapes.find(x => x.id === 'shape_2').inGroup === gs.id, 'get_diagram shows groups and inGroup');
  assert(!g.dup.isError && g.dup.val.shapes.length === 1 && Object.keys(g.dup.val.idMap).length === 4, 'duplicate_items copies group, members and inner connection');
  const groups2 = g.get2.val.shapes.filter(x => x.type === 'group');
  assert(groups2.length === 2 && groups2[1].groupId !== 'Core-2' && groups2[1].label === 'Renamed', 'duplicated group gets a new Group ID');

  // delete_items on a group lists its contents and deletes them
  p = page.evaluate(id => __run('delete_items', { ids: [id] }), g.dup.val.shapes[0]);
  await page.waitForSelector('text=inside these groups');
  await page.click('.modal-box .tbtn-danger');
  d = await p;
  assert(d.val.alsoDeleted.length === 3, 'delete_items on a group also deletes its 2 members and inner connection');

  // ungroup with a connection to the group: asks first
  p = page.evaluate(() => __run('ungroup', { id: 'Core-2' }));
  await page.waitForSelector('text=Allow delete?');
  await page.click("text=Don't allow");
  d = await p;
  assert(d.val.cancelled === true && (await page.evaluate(() => !!DiagramAPI.findGroup('Core-2'))), 'ungroup declined -> group kept');
  p = page.evaluate(() => __run('ungroup', { id: 'Core-2' }));
  await page.waitForSelector('text=Allow delete?');
  await page.click('.modal-box .tbtn-danger');
  d = await p;
  const after = await page.evaluate(() => DiagramAPI.getState());
  assert(!d.val.cancelled && d.val.members.length === 2 && !after.shapes.some(x => x.type === 'group') && after.shapes.length === 3, 'ungroup allowed -> members kept, group gone');
  assert(!after.connections.some(c => c.label === 'feeds') && after.connections.length === 1, 'ungroup removed only the connection to the group');

  // Re-registration does not duplicate tools
  const n = await page.evaluate(async () => { DiagramAPI.registerWebMCP(); return (await document.modelContext.getTools()).length; });
  assert(n === 12, 'registerWebMCP() again keeps 12 tools');

  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await browser.close();
  console.log('ALL PASSED');
})().catch(e => { console.error(e.message); process.exit(1); });
