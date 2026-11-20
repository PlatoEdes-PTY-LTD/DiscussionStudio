// Tests copy / paste / duplicate of selected shapes via keyboard shortcuts.
// Usage: node copypaste.test.js <url or path of discussion-studio.html>
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
  await page.goto(/^https?:/.test(process.argv[2]) ? process.argv[2] : 'file://' + path.resolve(process.argv[2]));
  await page.waitForFunction(() => window.DiagramAPI);

  const ids = await page.evaluate(() => {
    const A = DiagramAPI; A.resetAll();
    const a = A.addShape('rectangle', { label: 'Idea', x: 40, y: 40, w: 220, h: 130, note: 'first', noteOpen: true, fill: '#FFEEAA' });
    const b = A.addShape('diamond', { label: 'Decide', x: 400, y: 40 });
    const c = A.connect(a, b, { label: 'leads to', note: 'why' });
    A.selectMany({ shapes: [a, b] });
    return { a, b, c };
  });
  const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.locator('body').click({ position: { x: 5, y: 5 }, force: true }).catch(() => {});
  await page.evaluate(ids => DiagramAPI.selectMany({ shapes: [ids.a, ids.b] }), ids);
  await page.keyboard.press(mod + '+c');
  await page.keyboard.press(mod + '+v');
  let st = await page.evaluate(() => DiagramAPI.getState());
  assert(st.shapes.length === 4, 'paste adds two shapes');
  assert(st.connections.length === 2, 'connection between copied shapes is pasted');
  const orig = st.shapes.find(s => s.id === ids.a);
  const copy = st.shapes.find(s => s.id !== ids.a && s.label === 'Idea');
  assert(copy && copy.w === 220 && copy.h === 130, 'size kept');
  assert(copy.note === 'first' && copy.noteOpen === true && copy.fill === orig.fill, 'note and colour kept');
  assert(copy.x === orig.x + 24 && copy.y === orig.y + 24, 'pasted with offset');
  const nc = st.connections.find(c => c.id !== ids.c);
  assert(nc.label === 'leads to' && nc.note === 'why' && nc.from === copy.id, 'connection label/note kept and rewired');
  await page.keyboard.press(mod + '+v');
  st = await page.evaluate(() => DiagramAPI.getState());
  const third = st.shapes.filter(s => s.label === 'Idea').map(s => s.x).sort((x, y) => x - y);
  assert(st.shapes.length === 6 && third[2] === orig.x + 48, 'second paste offsets further');
  await page.evaluate(ids => DiagramAPI.selectShape(ids.b), ids);
  await page.keyboard.press(mod + '+d');
  st = await page.evaluate(() => DiagramAPI.getState());
  assert(await page.evaluate(() => document.activeElement.tagName !== 'TEXTAREA'), 'pasted open note does not steal focus');
  assert(st.shapes.length === 7 && st.shapes.filter(s => s.label === 'Decide').length === 4, 'duplicate single shape');
  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
