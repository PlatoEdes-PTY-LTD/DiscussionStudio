// Tests the agent API on window.DiagramAPI and the WebMCP tools against a mock
// navigator.modelContext (older-draft shape: registerTool only), including all three
// answers to the "Allow delete?" dialog.
// Usage: node api.test.js <url or path of discussion-studio.html>   (file:// works)
const { chromium } = require('playwright');
const path = require('path');
const assert = (c, m) => { if (!c) { throw new Error('FAIL: ' + m); } console.log('ok  ' + m); };

(async () => {
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Mock WebMCP before the page script runs.
  await page.addInitScript(() => {
    window.__tools = {};
    navigator.modelContext = { registerTool: (t) => { window.__tools[t.name] = t; }, unregisterTool: (n) => { delete window.__tools[n]; } };
  });
  await page.goto(/^https?:/.test(process.argv[2]) ? process.argv[2] : 'file://' + path.resolve(process.argv[2]));
  await page.waitForFunction(() => window.DiagramAPI);

  const names = await page.evaluate(() => Object.keys(window.__tools));
  assert(names.length === 12 && names.includes('delete_items') && names.includes('create_group'), 'WebMCP tools registered: ' + names.join(', '));

  // Console API
  const r = await page.evaluate(() => {
    const A = DiagramAPI; A.resetAll();
    const a = A.addShape('rectangle', { label: 'Idea', x: 40, y: 40, note: 'first', noteOpen: true });
    const b = A.addShape('diamond', { label: 'Decide', x: 300, y: 40 });
    const c = A.connect(a, b, { label: 'leads to', kind: 'one-many' });
    const errs = [];
    for (const f of [() => A.addShape('hexagon'), () => A.connect(a, a), () => A.connect(a, 'nope'), () => A.connect(a, b, { label: 'x', kind: 'one-many' }), () => A.setConnectionStyle('curvy'), () => A.addShape('rectangle', { fill: 'red' })]) {
      try { f(); errs.push(null); } catch (e) { errs.push(e.message); }
    }
    const st = A.setConnectionStyle('straight');
    const n = A.setNote(c, 'why', { open: true });
    const hs = ['rectangle', 'circle', 'diamond', 'triangle', 'arrow', 'underline'].map((k, i) => A.addHandwrittenShape(k, { x: 40 + i * 180, y: 250, seed: 7, note: k === 'circle' ? 'look' : '' }));
    const up = A.addHandwrittenShape('arrow', { x: 40, y: 400, w: 30, h: 120, direction: 'up' });
    const fh = A.addFreehand([{ x: 0, y: 500 }, { x: 50, y: 520 }, { x: 100, y: 500 }]);
    const s = A.getState();
    return { a, b, c, errs, st, n, hs, up, fh, edge: s.edgeStyle, conn: s.connections[0], shapeNote: s.shapes[0], lines: s.lines.map(l => ({ id: l.id, kind: l.kind, n: l.points.length, note: l.note })), desc: A.describe() };
  });
  assert(r.errs.every(Boolean), 'bad inputs throw: ' + r.errs.join(' | '));
  assert(r.conn.kind === 'one-many' && r.conn.label === 'leads to', 'connect sets kind and label');
  assert(r.st === 'straight' && r.edge === 'point', 'setConnectionStyle straight -> point');
  assert(r.n.open && r.conn.note === 'why' && r.conn.noteOpen, 'setNote on connection opens note');
  assert(r.shapeNote.note === 'first' && r.shapeNote.noteOpen, 'shape note via addShape opts');
  assert(r.lines.length === 8 && r.lines.every(l => l.kind === 'free' && l.n > 10 || l.id === r.fh), 'handwritten shapes are freehand lines with many points');
  assert(r.lines.find(l => l.id === r.hs[1]).note === 'look', 'handwritten note');
  assert(r.desc.connectionStyle === 'straight' && r.desc.drawings.length === 8, 'describe() summary');
  await page.evaluate(() => DiagramAPI.setConnectionStyle('elbow'));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'shot-elbow.png') });
  await page.evaluate(() => DiagramAPI.setConnectionStyle('straight'));

  // Double arrow: arrows at both ends on screen, and every other kind keeps its ends
  const ends = await page.evaluate(async () => {
    const A = DiagramAPI, before = A.getState(), out = {};
    const id = before.connections[0].id;
    for (const k of ['double-arrow', 'arrow', 'one-many', 'many-many', 'bogus']) {
      A.setConnectionKind(id, k); A.selectShape(before.shapes[0].id);
      await new Promise(r => requestAnimationFrame(r));
      const p = document.querySelector('.conn-path');
      out[k] = [A.getState().connections[0].kind, p.getAttribute('marker-start'), p.getAttribute('marker-end')].join(' ');
    }
    A.setConnectionKind(id, 'double-arrow');
    A.loadState(A.getState());
    out.reloaded = A.getState().connections[0].kind;
    A.loadState(before);
    return out;
  });
  assert(ends['double-arrow'] === 'double-arrow url(#arrow) url(#arrow)' && ends.reloaded === 'double-arrow', 'double arrow has arrows at both ends and survives a reload');
  assert(ends.arrow === 'arrow  url(#arrow)' && ends['one-many'] === 'one-many  url(#crow)' && ends['many-many'] === 'many-many url(#crow) url(#crow)' && ends.bogus === ends.arrow, 'other connection kinds unchanged');

  // WebMCP tools via mocked agent
  const t = await page.evaluate(async () => {
    const T = window.__tools;
    const call = async (n, a, client) => { const res = await T[n].execute(a, client); return { err: !!res.isError, val: res.isError ? res.content[0].text : JSON.parse(res.content[0].text) }; };
    const s1 = await call('add_shape', { type: 'circle', label: 'Agent', x: 600, y: 60 });
    const bad = await call('connect_shapes', { from: s1.val.id, to: 'missing' });
    const c1 = await call('connect_shapes', { from: s1.val.id, to: 'shape_1', kind: 'arrow', fromPort: 'start', toPort: 'end' });
    const st = await call('set_connection_style', { style: 'elbow' });
    const note = await call('set_note', { id: s1.val.id, text: 'agent note', open: true });
    const hw = await call('add_handwritten_shape', { shape: 'circle', x: 580, y: 40, w: 180, h: 120, stroke: '#D93A2B' });
    const g = await call('get_diagram', {});
    return { s1, bad, c1, st, note, hw, g: { shapes: g.val.shapes.length, conns: g.val.connections.length, style: g.val.connectionStyle } };
  });
  assert(!t.s1.err && t.bad.err && /No shape/.test(t.bad.val), 'tool errors returned as isError');
  assert(!t.c1.err && t.st.val.connectionStyle === 'elbow' && t.note.val.open && !t.hw.err, 'tools add, connect, style, note, sketch');
  assert(t.g.shapes === 3 && t.g.conns === 2, 'get_diagram counts');

  // Delete: decline
  let p = page.evaluate(() => window.__tools.delete_items.execute({ ids: ['shape_1', 'line_1'], reason: 'tidy up' }));
  await page.waitForSelector('text=Allow delete?');
  const dialogText = await page.locator('.modal-box').innerText();
  assert(/An AI assistant/.test(dialogText) && /tidy up/.test(dialogText) && /Also deleted: 2 connections/.test(dialogText), 'dialog shows source, reason, cascade');
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'shot-delete.png') });
  await page.click("text=Don't allow");
  let res = JSON.parse((await p).content[0].text);
  let cnt = await page.evaluate(() => { const s = DiagramAPI.getState(); return [s.shapes.length, s.connections.length, s.lines.length]; });
  assert(res.cancelled && cnt.join() === '3,2,9', 'declined delete changes nothing');

  // Delete: Escape declines
  p = page.evaluate(() => DiagramAPI.deleteItems('shape_2'));
  await page.waitForSelector('text=Allow delete?');
  await page.keyboard.press('Escape');
  res = await p;
  assert(res.cancelled, 'Escape declines');

  // Delete: allow, with requestUserInteraction client
  p = page.evaluate(() => window.__tools.delete_items.execute({ ids: ['shape_1', 'line_1', 'bogus'] }, { requestUserInteraction: async (cb) => { window.__rui = true; return cb(); } }));
  await page.waitForSelector('text=Allow delete?');
  await page.click('.modal-box .tbtn-danger');
  res = JSON.parse((await p).content[0].text);
  cnt = await page.evaluate(() => { const s = DiagramAPI.getState(); return [s.shapes.length, s.connections.length, s.lines.length, window.__rui]; });
  assert(!res.cancelled && res.deleted.length === 2 && res.alsoDeleted.length === 2 && res.missing[0] === 'bogus', 'allowed delete result ' + JSON.stringify(res));
  assert(cnt.join() === '2,0,8,true', 'allowed delete applied via requestUserInteraction');

  // Delete key in UI still works without dialog (unchanged behaviour)
  await page.evaluate(() => DiagramAPI.selectShape('shape_2'));
  await page.keyboard.press('Delete');
  cnt = await page.evaluate(() => DiagramAPI.getState().shapes.length);
  assert(cnt === 1, 'UI delete key unchanged');

  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await browser.close();
  console.log('ALL PASSED');
})().catch(async e => { console.error(e.message); process.exit(1); });
