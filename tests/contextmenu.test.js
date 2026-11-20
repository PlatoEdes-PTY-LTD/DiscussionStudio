// Tests the canvas context menu: right-click on items and on empty canvas, Copy / Paste here /
// Duplicate / Group / Ungroup / Select group / Delete, keyboard use, and a touch long press.
// Usage: node contextmenu.test.js <url or path of discussion-studio.html>
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
  const state = () => page.evaluate(() => DiagramAPI.getState());
  const item = (label) => page.locator('.ctx-menu button', { hasText: label });
  // screen point of a shape's centre
  const centre = (id) => page.evaluate(id => { const r = document.querySelector('.shape-group[data-id="' + id + '"] foreignObject, .group-frame[data-id="' + id + '"] rect').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 12) }; }, id);

  const ids = await page.evaluate(() => {
    const A = DiagramAPI; A.resetAll();
    const a = A.addShape('rectangle', { label: 'A', x: 100, y: 100, w: 180, h: 90, note: 'note a' });
    const b = A.addShape('rectangle', { label: 'B', x: 380, y: 100 });
    const ab = A.connect(a, b, { label: 'a-b' });
    A.clearSelection();
    return { a, b, ab };
  });

  // right-click an unselected shape: it gets selected, menu opens with Paste disabled
  let p = await centre(ids.a);
  await page.mouse.click(p.x, p.y, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  assert(await page.evaluate(() => document.querySelector('.panel h3').textContent) === 'Shape', 'right-click selects the shape');
  assert(await item('Paste here').isDisabled() && !(await item('Copy').isDisabled()), 'Paste disabled before Copy');
  assert(await page.evaluate(() => document.activeElement.textContent.startsWith('Copy')), 'first item has keyboard focus');
  let st = await state();
  assert(st.shapes.find(s => s.id === ids.a).x === 100, 'right-click does not drag the shape');
  await item('Copy').click();
  assert(await page.locator('.ctx-menu').count() === 0, 'menu closes after an action');

  // right-click empty canvas, Paste here at the pointer
  await page.mouse.click(700, 600, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  assert(!(await item('Paste here').isDisabled()), 'Paste enabled after Copy');
  const world = await page.evaluate(() => { const r = document.querySelector('svg.board').getBoundingClientRect(); return { x: r.x, y: r.y }; });
  await item('Paste here').click();
  st = await state();
  const pasted = st.shapes.find(s => s.label === 'A' && s.id !== ids.a);
  assert(pasted && Math.abs(pasted.x - (700 - world.x)) <= 1 && Math.abs(pasted.y - (600 - world.y)) <= 1, 'Paste here puts the copy at the pointer');
  assert(pasted.w === 180 && pasted.h === 90 && pasted.note === 'note a', 'pasted copy keeps size and note');

  // multi-select A and B, right-click B (selected): selection kept, Group
  await page.evaluate(i => DiagramAPI.selectMany({ shapes: [i.a, i.b] }), ids);
  p = await centre(ids.b);
  await page.mouse.click(p.x, p.y, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  assert(await item('Group 2 shapes').count() === 1, 'right-click on a selected item keeps the multi-selection');
  await item('Group 2 shapes').click();
  st = await state();
  const g = st.shapes.find(s => s.type === 'group');
  assert(g && g.members.length === 2 && g.conns.length === 1, 'Group from the menu');

  // right-click a member: Select group
  p = await centre(ids.a);
  await page.mouse.click(p.x, p.y, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  await item('Select group ' + g.gid).click();
  assert(await page.evaluate(() => document.querySelector('.panel h3').textContent) === 'Group', 'Select group from a member');

  // right-click the group frame: Duplicate, then Ungroup with the keyboard
  p = await centre(g.id);
  await page.mouse.click(p.x, p.y, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  await item('Duplicate').click();
  st = await state();
  assert(st.shapes.filter(s => s.type === 'group').length === 2, 'Duplicate a group from the menu');
  p = await centre(g.id);
  await page.mouse.click(p.x, p.y, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  // Copy, Paste, Duplicate, Group, Ungroup: four ArrowDowns from Copy
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
  assert(await page.evaluate(() => document.activeElement.textContent.startsWith('Ungroup')), 'arrow keys move through enabled items');
  await page.keyboard.press('Enter');
  st = await state();
  assert(!st.shapes.some(s => s.id === g.id) && st.shapes.some(s => s.id === ids.a), 'Ungroup from the keyboard');

  // Escape closes; right-click on the connection and Delete
  await page.mouse.click(700, 300, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  await page.keyboard.press('Escape');
  assert(await page.locator('.ctx-menu').count() === 0, 'Escape closes the menu');
  await page.evaluate(() => DiagramAPI.clearSelection());
  const cp = await page.evaluate(id => { const el = document.querySelector('.conn-group[data-id="' + id + '"] .conn-hit'); const L = el.getTotalLength(); const q = el.getPointAtLength(L / 2); const m = el.getScreenCTM(); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; }, ids.ab);
  await page.mouse.click(cp.x, cp.y, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  assert(await item('Copy').isDisabled(), 'Copy disabled for a connection alone');
  await item('Delete').click();
  st = await state();
  assert(!st.connections.some(c => c.id === ids.ab), 'Delete a connection from the menu');

  // clicking outside closes without acting
  await page.mouse.click(700, 300, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  await page.waitForTimeout(750);
  const before = (await state()).shapes.length;
  await page.mouse.click(900, 700);
  assert(await page.locator('.ctx-menu').count() === 0 && (await state()).shapes.length === before, 'a click outside closes the menu and adds nothing');
  await browser.close();

  // touch: long press opens the menu, no drag, no click
  const ctx = await (await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }))).newContext({ viewport: { width: 900, height: 700 }, hasTouch: true, isMobile: true });
  const tp = await ctx.newPage();
  tp.on('pageerror', e => errors.push(e.message));
  await tp.goto(/^https?:/.test(process.argv[2]) ? process.argv[2] : 'file://' + path.resolve(process.argv[2]));
  await tp.waitForFunction(() => window.DiagramAPI);
  const tid = await tp.evaluate(() => { DiagramAPI.resetAll(); const a = DiagramAPI.addShape('rectangle', { label: 'T', x: 60, y: 60 }); DiagramAPI.clearSelection(); return a; });
  const r = await tp.evaluate(id => { const b = document.querySelector('.shape-group[data-id="' + id + '"] foreignObject').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, tid);
  const cdp = await ctx.newCDPSession(tp);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] });
  await tp.waitForTimeout(800);
  const open = await tp.locator('.ctx-menu').count();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await tp.waitForTimeout(200);
  const tst = await tp.evaluate(() => DiagramAPI.getState());
  assert(open === 1 && await tp.locator('.ctx-menu').count() === 1, 'long press opens the menu and it stays open after lifting');
  assert(tst.shapes.length === 1 && tst.shapes[0].x === 60, 'long press does not move the shape or add one');
  await tp.locator('.ctx-menu button', { hasText: 'Duplicate' }).tap();
  assert((await tp.evaluate(() => DiagramAPI.getState())).shapes.length === 2, 'tap a menu item on touch');

  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await ctx.browser().close();
  console.log('ALL PASSED');
})().catch(e => { console.error(e); process.exit(1); });
