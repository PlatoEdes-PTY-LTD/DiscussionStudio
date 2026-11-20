// Tests groups: create, edit Group ID, move, resize, connect, copy/paste, ungroup, delete, export.
// Usage: node groups.test.js <url or path of discussion-studio.html>
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
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(/^https?:/.test(process.argv[2]) ? process.argv[2] : 'file://' + path.resolve(process.argv[2]));
  await page.waitForFunction(() => window.DiagramAPI);
  const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
  const state = () => page.evaluate(() => DiagramAPI.getState());
  const tick = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 30))));

  const ids = await page.evaluate(() => {
    const A = DiagramAPI; A.resetAll();
    const a = A.addShape('rectangle', { label: 'A', x: 100, y: 100, note: 'note a' });
    const b = A.addShape('rectangle', { label: 'B', x: 350, y: 100 });
    const c = A.addShape('rectangle', { label: 'C', x: 100, y: 400 });
    const ab = A.connect(a, b, { label: 'a-b' });
    const bc = A.connect(b, c);
    A.selectMany({ shapes: [a, b] });
    return { a, b, c, ab, bc };
  });
  await page.keyboard.press(mod + '+g');
  await tick();
  let st = await state();
  const g = st.shapes.find(s => s.type === 'group');
  assert(g && g.gid === 'G1' && g.members.length === 2, 'Ctrl+G creates group G1 with 2 members');
  assert(g.conns.length === 1 && g.conns[0] === ids.ab, 'only the connection with both ends selected is in the group');
  const A0 = st.shapes.find(s => s.id === ids.a), B0 = st.shapes.find(s => s.id === ids.b);
  assert(g.x < A0.x && g.y < A0.y && g.x + g.w > B0.x + B0.w, 'group frame surrounds its members');
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'group.png') });

  // edit Group ID in the panel
  const gidInput = page.locator('.panel .field', { hasText: 'Group ID' }).locator('input');
  await gidInput.fill('Team-1'); await gidInput.press('Enter'); await tick();
  st = await state();
  assert(st.shapes.find(s => s.id === g.id).gid === 'Team-1', 'Group ID edited from the panel');
  // label + note
  await page.locator('.panel .field', { hasText: 'Label' }).locator('input').fill('Backend');
  await page.locator('.panel textarea.panel-note').fill('group note');
  st = await state();
  const g1 = st.shapes.find(s => s.id === g.id);
  assert(g1.label === 'Backend' && g1.note === 'group note', 'group label and note edited');

  // drag the group frame by its title row
  const box = await page.locator('.group-frame').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + 50, { steps: 5 });
  await page.mouse.up();
  await tick();
  st = await state();
  const A1 = st.shapes.find(s => s.id === ids.a), g2 = st.shapes.find(s => s.id === g.id);
  assert(Math.round(A1.x - A0.x) === 60 && Math.round(A1.y - A0.y) === 40, 'dragging the group moves members');
  assert(Math.round(g2.x - g1.x) === 60, 'group frame moved with members');

  // move a member: the frame refits
  await page.evaluate(id => { DiagramAPI.resizeShape(id, 300, 150); }, ids.b);
  await tick();
  st = await state();
  const B2 = st.shapes.find(s => s.id === ids.b), g3 = st.shapes.find(s => s.id === g.id);
  assert(Math.round(g3.x + g3.w) === Math.round(B2.x + B2.w + 18), 'frame refits when a member grows');

  // resize the group: members scale
  await page.evaluate(id => DiagramAPI.resizeShape(id, 800, null), g.id);
  await tick();
  st = await state();
  const g4 = st.shapes.find(s => s.id === g.id), B3 = st.shapes.find(s => s.id === ids.b);
  assert(Math.abs(g4.w - 800) <= 2 && B3.w > B2.w, 'resizing the group scales its members');

  // connect the group to an outside shape
  const gc = await page.evaluate(([gid, c]) => DiagramAPI.connect(gid, c, { label: 'to C' }), [g.id, ids.c]);
  await tick();
  assert(await page.evaluate(id => !!document.querySelector('.conn-group path.conn-path') && DiagramAPI.getState().connections.some(c => c.id === id), gc), 'connection from group to shape');
  const d = await page.evaluate(() => [...document.querySelectorAll('.conn-path')].map(p => p.getAttribute('d')).filter(Boolean).length);
  assert(d === 3, 'all connections render a path');

  // copy / paste the group
  await page.evaluate(id => DiagramAPI.selectShape(id), g.id);
  await page.keyboard.press(mod + '+c');
  await page.keyboard.press(mod + '+v');
  await tick();
  st = await state();
  const groups = st.shapes.filter(s => s.type === 'group');
  const pg = groups.find(x => x.id !== g.id);
  assert(groups.length === 2 && pg.gid !== 'Team-1' && pg.label === 'Backend' && pg.note === 'group note', 'pasted group gets a new Group ID, keeps label and note');
  assert(st.shapes.length === 3 + 2 + 2 && pg.members.every(m => m !== ids.a && m !== ids.b) && pg.members.length === 2, 'pasted group has its own copied members');
  assert(pg.conns.length === 1 && st.connections.find(c => c.id === pg.conns[0]).label === 'a-b', 'pasted group has its own copied connection');
  const pa = st.shapes.find(s => s.id === pg.members.find(m => st.shapes.find(x => x.id === m).label === 'A'));
  assert(pa.note === 'note a', 'member note kept');

  // duplicate Group ID rejected
  const dupErr = await page.evaluate(id => { try { DiagramAPI.setGroupId(id, 'Team-1'); return null; } catch (e) { return e.message; } }, pg.id);
  assert(dupErr && /already/.test(dupErr), 'duplicate Group ID rejected');

  // nested group: group the two groups
  const outer = await page.evaluate(([x, y]) => DiagramAPI.group([x, y]), [g.id, pg.id]);
  await tick();
  st = await state();
  const og = st.shapes.find(s => s.id === outer);
  assert(og.members.length === 2 && og.gid === 'G2', 'groups can be grouped (outer gets next free id G2)');
  // ungroup outer
  await page.evaluate(id => DiagramAPI.ungroup(id), outer);
  await tick();
  st = await state();
  assert(st.shapes.filter(s => s.type === 'group').length === 2, 'ungroup removes only the outer group');

  // ungroup first group: members stay, connections stay
  await page.evaluate(id => { DiagramAPI.selectShape(id); }, g.id);
  await page.keyboard.press(mod + '+Shift+g');
  await tick();
  st = await state();
  assert(!st.shapes.some(s => s.id === g.id) && st.shapes.some(s => s.id === ids.a) && st.connections.some(c => c.id === ids.ab), 'Ctrl+Shift+G ungroups, members and inner connection remain');
  assert(!st.connections.some(c => c.id === gc), 'connection to the dissolved group is removed');

  // delete pasted group: contents go too
  await page.evaluate(id => { DiagramAPI.selectShape(id); DiagramAPI.deleteSelected(); }, pg.id);
  st = await state();
  assert(!st.shapes.some(s => s.id === pg.id || pg.members.includes(s.id)) && !st.connections.some(c => c.id === pg.conns[0]), 'deleting a group deletes its contents');

  // save / load round trip
  await page.evaluate(([a, b]) => DiagramAPI.group([a, b], { gid: 'X9', label: 'Saved' }), [ids.a, ids.b]);
  const saved = await state();
  await page.evaluate(s => { DiagramAPI.resetAll(); DiagramAPI.loadState(s); }, saved);
  await tick();
  st = await state();
  assert(JSON.stringify(st.shapes) === JSON.stringify(saved.shapes), 'groups survive save/load unchanged');

  // auto-arrange keeps members inside their group
  await page.evaluate(() => DiagramAPI.autoArrange());
  await page.waitForTimeout(700);
  st = await state();
  const sg = st.shapes.find(s => s.type === 'group');
  const inside = sg.members.every(m => { const s = st.shapes.find(x => x.id === m); return s.x >= sg.x && s.y >= sg.y && s.x + s.w <= sg.x + sg.w && s.y + s.h <= sg.y + sg.h; });
  assert(inside, 'auto-arrange keeps members inside the group');

  // group ports sit at the bottom of the title row
  const portY = await page.evaluate(() => { const t = document.querySelector('.shape-group[data-group] .port-end').getAttribute('transform'); return t; });
  assert(/ 30\)$/.test(portY), 'group port sits on the title row');

  // exports include the group and do not fail
  page.on('dialog', d => { errors.push('dialog: ' + d.message()); d.dismiss(); });
  for (const fn of ['exportPNG', 'exportPPTX', 'exportJSON']) {
    const dl = page.waitForEvent('download', { timeout: 15000 });
    await page.evaluate(f => DiagramAPI[f]('groups-test'), fn);
    const file = await dl;
    assert(/groups-test/.test(file.suggestedFilename()), fn + ' downloads ' + file.suggestedFilename());
  }
  const desc = await page.evaluate(() => DiagramAPI.describe());
  assert(JSON.stringify(desc).includes('"groupId":"X9"'), 'describe() lists the group with its Group ID');
  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'group-final.png') });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
