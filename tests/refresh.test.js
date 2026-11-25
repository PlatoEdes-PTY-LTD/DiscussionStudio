// Tests that a page refresh keeps the open files and their drawings.
// Usage: node refresh.test.js <url or path of discussion-studio.html>
const { chromium } = require('playwright');
const path = require('path');
const assert = (c, m) => { if (!c) { throw new Error('FAIL: ' + m); } console.log('ok  ' + m); };

(async () => {
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { browser = await chromium.launch({ channel: 'chrome' }); }
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const url = /^https?:/.test(process.argv[2]) ? process.argv[2] : 'file://' + path.resolve(process.argv[2]);
  const ready = p => p.waitForFunction(() => window.DiagramAPI);
  const reload = async () => { await page.reload(); await ready(page); };
  const all = () => page.evaluate(() => {
    const A = DiagramAPI, docs = A.listDocuments(), active = docs.find(d => d.active).id;
    const states = docs.map(d => { A.switchDocument(d.id); return A.getState(); });
    A.switchDocument(active);
    return JSON.stringify({ docs, states });
  });
  await page.goto(url); await ready(page);
  await reload();
  assert((await page.evaluate(() => DiagramAPI.getState().shapes.length)) === 5, 'sample is kept once, not added again');

  await page.evaluate(() => {
    const A = DiagramAPI;
    A.addShape('circle', { label: 'Extra', note: 'hello', noteOpen: true });
    A.openDocument({ shapes: [], connections: [], lines: [], edgeStyle: 'point' }, 'plan.json');
    A.newDocument();
    const a = A.addShape('rectangle', { label: 'A', x: 50, y: 60 }), b = A.addShape('diamond', { label: 'B', x: 400, y: 60 });
    A.connect(a, b, { label: 'x' }); A.group([a, b], { label: 'G' });
    A.addLine(10, 400, 200, 420); A.addFreehand([{ x: 10, y: 500 }, { x: 50, y: 540 }, { x: 90, y: 500 }]);
    A.switchDocument(A.listDocuments()[0].id);
  });
  await page.mouse.move(600, 500); await page.mouse.wheel(0, -300);
  await page.waitForTimeout(100);
  const zoom = () => page.evaluate(() => [...document.querySelectorAll('svg g[transform*="scale"]')].map(g => g.getAttribute('transform')).find(t => t.startsWith('translate')));
  const z = await zoom(), before = await all();
  assert(z && !z.includes('scale(1)'), 'test zoomed the canvas');
  await reload();
  assert(await zoom() === z, 'zoom position kept');
  assert(await all() === before, 'all files, drawings, names, active file and changed marks kept');
  assert((await page.locator('.tab').count()) === 3, 'three tabs shown');
  await reload();
  assert(await all() === before, 'a second refresh keeps them too');
  const ids = await page.evaluate(() => { DiagramAPI.newDocument(); return DiagramAPI.listDocuments().map(d => d.id + d.name); });
  assert(new Set(ids).size === 4, 'a new file gets a new id and name');
  await page.evaluate(() => { const A = DiagramAPI; A.closeDocument(A.listDocuments()[3].id); });
  await reload();
  assert((await page.locator('.tab').count()) === 3, 'a closed file stays closed');

  const other = await context.newPage();
  await other.goto(url); await ready(other);
  assert((await other.locator('.tab').count()) === 1, 'another browser tab starts on its own');
  await other.close();

  for (const bad of ['{oops', '{"docs":[{"id":"x"}]}', '{"docs":[{"id":"doc_1","state":{"shapes":[null]}}]}']) {
    const p = await (await browser.newContext()).newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(b => sessionStorage.setItem('discussion-studio-session', b), bad);
    await p.goto(url); await ready(p);
    assert((await p.evaluate(() => DiagramAPI.getState().shapes.length)) === 5, 'damaged data falls back to the sample');
  }
  const p = await (await browser.newContext()).newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('full'); }; });
  await p.goto(url); await ready(p);
  await p.getByText('cannot keep your latest changes').waitFor({ timeout: 5000 });
  assert(true, 'full storage shows a warning');
  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
