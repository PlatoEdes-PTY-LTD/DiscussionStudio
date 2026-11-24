// Dragging the end of a selected connection to another port.
// Usage: node reconnect.test.js <url or path of discussion-studio.html>
const { chromium } = require('playwright');
const path = require('path');
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok  ' + m); };

(async () => {
  let browser; try { browser = await chromium.launch(); } catch (e) { browser = await chromium.launch({ channel: 'chrome' }); }
  const target = process.argv[2], url = /^https?:/.test(target) ? target : 'file://' + path.resolve(target);
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.DiagramAPI);

  const setup = (style) => page.evaluate((style) => {
    const A = DiagramAPI; A.resetAll(); A.setConnectionStyle(style || 'elbow');
    const a = A.addShape('rectangle', { label: 'A', x: 80, y: 120 }), b = A.addShape('rectangle', { label: 'B', x: 420, y: 120 }), c = A.addShape('diamond', { label: 'C', x: 420, y: 380 });
    const id = A.connect(a, b, { label: 'x', kind: 'double-arrow', note: 'keep' });
    A.selectConnection(id);
    return { a, b, c, id };
  }, style);
  const conn = (id) => page.evaluate(id => { const c = DiagramAPI.getState().connections.find(x => x.id === id); return c && [c.from, c.fromPort, c.to, c.toPort].join(' '); }, id);
  const mid = async (sel) => { const b = await page.locator(sel).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const port = (s, p) => mid(`.shape-group[data-id="${s}"] .port-${p} .port-dot`);
  const drag = async (end, to, release = true) => {
    const h = await mid('.conn-end-' + end);
    await page.mouse.move(h.x, h.y); await page.mouse.down();
    await page.mouse.move((h.x + to.x) / 2, (h.y + to.y) / 2, { steps: 4 }); await page.mouse.move(to.x, to.y, { steps: 4 });
    if (release) await page.mouse.up();
  };
  const count = () => page.evaluate(() => { const s = DiagramAPI.getState(); return s.shapes.length + ',' + s.connections.length; });

  for (const style of ['elbow', 'straight']) {
    const s = await setup(style);
    await drag('to', await port(s.b, 'bottom'));
    assert(await conn(s.id) === `${s.a} end ${s.b} bottom`, style + ': target end to another port of the same shape');
    await drag('from', await port(s.a, 'top'));
    assert(await conn(s.id) === `${s.a} top ${s.b} bottom`, style + ': source end to another port of the same shape');
    await drag('to', await port(s.c, 'start'));
    assert(await conn(s.id) === `${s.a} top ${s.c} start`, style + ': target end to a different shape');
    await drag('from', await port(s.b, 'end'));
    assert(await conn(s.id) === `${s.b} end ${s.c} start`, style + ': source end to a different shape');
    const c = await page.evaluate(() => DiagramAPI.getState().connections[0]);
    assert(c.label === 'x' && c.kind === 'double-arrow' && c.note === 'keep' && await count() === '3,1', style + ': label, kind and note kept; nothing added');
  }

  let s = await setup();
  const before = `${s.a} end ${s.b} start`;
  await drag('to', { x: 900, y: 700 });
  assert(await conn(s.id) === before && await count() === '3,1', 'dropping on empty canvas changes nothing');
  await drag('to', await port(s.a, 'top'));
  assert(await conn(s.id) === before, 'a connection from a shape to itself is refused');
  await drag('to', await port(s.c, 'top'), false);
  assert(await page.locator('.connect-icon.drop').count() === 1, 'the port under the pointer is highlighted');
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'shot-reconnect.png') });
  await page.keyboard.press('Escape'); await page.mouse.up();
  assert(await conn(s.id) === before && await page.locator('.connect-icon.drop').count() === 0 && await page.locator('.conn-end').count() === 2, 'Escape puts the end back and keeps the selection');

  // the body of a shape: nearest port
  const c = await page.locator(`.shape-group[data-id="${s.c}"] foreignObject`).boundingBox();
  await drag('to', { x: c.x + c.width / 2 + 18, y: c.y + c.height / 2 });
  assert(await conn(s.id) === `${s.a} end ${s.c} end`, 'dropping inside a shape uses its nearest port');

  // duplicate
  s = await setup();
  await page.evaluate(s => { DiagramAPI.connect(s.a, s.c, { fromPort: 'end', toPort: 'top' }); DiagramAPI.selectConnection(s.id); }, s);
  const okDup = await page.evaluate(s => DiagramAPI.reconnect(s.id, 'to', s.c, 'top'), s);
  assert(okDup === false && await conn(s.id) === before, 'a duplicate connection is refused');

  // a click on a handle still works as a click on the port below it
  await page.evaluate(s => DiagramAPI.selectConnection(s.id), s);
  await page.locator('.conn-end-from').click();
  await page.hover(`.shape-group[data-id="${s.c}"] foreignObject`);
  await page.locator(`.shape-group[data-id="${s.c}"] .port-start`).click();
  assert((await count()) === '3,3', 'clicking an end handle starts a new connection from that port');

  // zoomed
  s = await setup();
  await page.mouse.move(300, 300); for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 200);
  await drag('to', await port(s.c, 'top'));
  assert(await conn(s.id) === `${s.a} end ${s.c} top`, 'works when zoomed out');
  await page.evaluate(() => DiagramAPI.resetAll());

  // groups
  s = await setup();
  const g = await page.evaluate(s => { DiagramAPI.group([s.a, s.b]); DiagramAPI.selectConnection(s.id); return DiagramAPI.getState().shapes.find(x => x.type === 'group').conns.length; }, s);
  assert(g === 1, 'the connection is in the group ' + g);
  await drag('to', await port(s.b, 'bottom'));
  const inG = () => page.evaluate(() => DiagramAPI.getState().shapes.find(x => x.type === 'group').conns.length);
  assert(await inG() === 1, 'moving an end inside the group keeps the connection in it');
  await drag('to', await port(s.c, 'start'));
  assert(await conn(s.id) === `${s.a} end ${s.c} start` && await inG() === 0, 'moving an end out of the group takes the connection out of it');

  // touch
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, hasTouch: true, isMobile: true });
  const tp = await ctx.newPage();
  tp.on('pageerror', e => errors.push(e.message));
  await tp.goto(url); await tp.waitForFunction(() => window.DiagramAPI);
  const t = await tp.evaluate(() => { const A = DiagramAPI; A.resetAll(); const a = A.addShape('rectangle', { x: 40, y: 60 }), b = A.addShape('rectangle', { x: 320, y: 60 }); const id = A.connect(a, b); A.selectConnection(id); return { a, b, id }; });
  await tp.waitForSelector('.conn-end-to');
  const tm = async (sel) => { const b = await tp.locator(sel).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const h = await tm('.conn-end-to'), q = await tm(`.shape-group[data-id="${t.b}"] .port-bottom .port-dot`);
  const cdp = await ctx.newCDPSession(tp);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [h] });
  for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: h.x + (q.x - h.x) * i / 5, y: h.y + (q.y - h.y) * i / 5 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const tc = await tp.evaluate(() => { const c = DiagramAPI.getState().connections[0]; return c.fromPort + ' ' + c.toPort; });
  assert(tc === 'end bottom', 'works with a finger');

  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await browser.close();
  console.log('ALL PASSED');
})().catch(e => { console.error(e.message); process.exit(1); });
