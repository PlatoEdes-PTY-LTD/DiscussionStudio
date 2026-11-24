// Auto-arrange: the dialog, both directions, and reconnecting edges.
// Usage: node arrange.test.js <url or path of discussion-studio.html>
const { chromium } = require('playwright');
const path = require('path');
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok  ' + m); };

(async () => {
  let browser; try { browser = await chromium.launch(); } catch (e) { browser = await chromium.launch({ channel: 'chrome' }); }
  const target = process.argv[2];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(/^https?:/.test(target) ? target : 'file://' + path.resolve(target));
  await page.waitForFunction(() => window.DiagramAPI);

  // a: start, b and c: middle, d: end, plus a way back from d to a, and a second a-b edge
  const setup = () => page.evaluate(() => {
    const A = DiagramAPI; A.resetAll(); A.setConnectionStyle('elbow');
    const ids = [['rectangle', 'A'], ['diamond', 'B'], ['circle', 'C'], ['rectangle', 'D']].map(([t, label], i) => A.addShape(t, { label, x: 600 - i * 150, y: 60 + (i % 2) * 300 }));
    const [a, b, c, d] = ids;
    A.connect(a, b, { fromPort: 'start', toPort: 'end' }); A.connect(a, c, { fromPort: 'top', toPort: 'bottom' });
    A.connect(b, d, { fromPort: 'start', toPort: 'start' }); A.connect(c, d, { label: 'keep', kind: 'one-many' });
    A.connect(a, b, { fromPort: 'end', toPort: 'end' });
    A.clearSelection();
    return ids;
  });
  const settle = () => page.waitForTimeout(600);
  const get = () => page.evaluate(() => {
    const s = DiagramAPI.getState();
    const len = p => p.slice(1).reduce((t, q, i) => t + Math.abs(q.x - p[i].x) + Math.abs(q.y - p[i].y), 0);
    return { shapes: s.shapes, conns: s.connections, total: s.connections.reduce((t, c) => t + len(DiagramAPI.getConnectionRoute(c.id)), 0) };
  });
  const ports = st => st.conns.map(c => c.fromPort + '>' + c.toPort).join(' ');
  const ends = st => st.conns.map(c => c.id + c.from + c.to + c.label + c.kind).join(' ');
  const flows = (st, ids, axis, size) => { const [a, b, c, d] = ids.map(i => st.shapes.find(s => s.id === i)); return a[axis] + a[size] < Math.min(b[axis], c[axis]) && Math.max(b[axis] + b[size], c[axis] + c[size]) < d[axis]; };
  const open = () => page.click('button[title^="Auto-arrange"]');

  let ids = await setup(), before = await get();
  await open();
  assert(await page.locator('.arrange-direction .active').innerText() === 'Left to right' && await page.locator('.arrange-reconnect .active').innerText() === 'No, keep them', 'the dialog asks for direction and reconnecting; safe defaults');
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'shot-arrange-dialog.png') });
  await page.keyboard.press('Escape'); await settle();
  assert(JSON.stringify((await get()).shapes) === JSON.stringify(before.shapes), 'Escape changes nothing');
  await open(); await page.click('.arrange-box .tbtn-secondary'); await settle();
  assert(JSON.stringify((await get()).shapes) === JSON.stringify(before.shapes), 'Cancel changes nothing');

  for (const [label, axis, size, dir] of [['Left to right', 'x', 'w', 'horizontal'], ['Top to bottom', 'y', 'h', 'vertical']]) {
    ids = await setup(); before = await get();
    await open();
    await page.click(`.arrange-direction >> text=${label}`); await page.click('.arrange-reconnect >> text=No, keep them');
    await page.click('.arrange-go'); await settle();
    const kept = await get();
    assert(flows(kept, ids, axis, size), label + ': layers follow each other');
    assert(ports(kept) === ports(before) && ends(kept) === ends(before), label + ' without reconnecting: every port kept');
    await open();
    assert(await page.locator('.arrange-direction .active').innerText() === label, label + ': the dialog remembers the direction');
    await page.click('.arrange-reconnect >> text=Yes, reconnect');
    await page.click('.arrange-go'); await settle();
    const opt = await get();
    assert(flows(opt, ids, axis, size) && ends(opt) === ends(before), label + ' with reconnecting: same shapes linked, labels and kinds kept');
    assert(opt.total < kept.total * 0.8, label + ': reconnecting shortens the edges (' + Math.round(kept.total) + ' -> ' + Math.round(opt.total) + ')');
    assert(new Set(opt.conns.map(c => c.from + c.to + c.fromPort + c.toPort)).size === opt.conns.length, label + ': no duplicate connections');
    await page.screenshot({ path: path.join(__dirname, 'screenshots', `shot-arrange-${dir}.png`) });
  }

  // a chain uses the flow ports and straight lines, also with different sizes; a pair of opposite edges stays apart
  const chain = await page.evaluate(async () => {
    const A = DiagramAPI, out = {};
    for (const direction of ['horizontal', 'vertical']) {
      A.resetAll();
      const s = ['rectangle', 'diamond', 'circle'].map((t, i) => A.addShape(t, { x: 50 * i, y: 80 * i }));
      const e = [A.connect(s[0], s[1], { fromPort: 'top', toPort: 'bottom' }), A.connect(s[1], s[2], { fromPort: 'start', toPort: 'top' })];
      A.autoArrange({ direction, reconnect: true });
      await new Promise(r => setTimeout(r, 600));
      out[direction] = A.describe().connections.map(c => c.link).join() + ' ' + e.map(id => A.getConnectionRoute(id).length).join();
    }
    A.resetAll();
    const x = A.addShape('rectangle', { x: 0, y: 0 }), y = A.addShape('rectangle', { x: 300, y: 0 }), z = A.addShape('rectangle', { x: 300, y: 200 });
    A.connect(z, x); const f = A.connect(x, y), b = A.connect(y, x);
    A.autoArrange({ reconnect: true });
    await new Promise(r => setTimeout(r, 600));
    const cs = A.getState().connections, F = cs.find(c => c.id === f), B = cs.find(c => c.id === b);
    out.apart = F.fromPort !== B.toPort && F.toPort !== B.fromPort;
    try { A.autoArrange({ direction: 'sideways' }); } catch (err) { out.err = err.message; }
    return out;
  });
  assert(chain.horizontal === 'ES,ES 2,2' && chain.vertical === 'BT,BT 2,2', 'a chain becomes straight along the flow ' + JSON.stringify(chain));
  assert(chain.apart, 'two opposite edges do not share ports');
  assert(/direction must be/.test(chain.err), 'a bad direction is refused');

  // groups move as one block, inner edges are reconnected too
  const grp = await page.evaluate(async () => {
    const A = DiagramAPI; A.resetAll();
    const p = A.addShape('rectangle', { x: 0, y: 0 }), q = A.addShape('rectangle', { x: 300, y: 0 }), r = A.addShape('rectangle', { x: -300, y: 300 });
    const e = A.connect(p, q, { fromPort: 'start', toPort: 'end' }); A.connect(q, r);
    A.group([p, q]);
    A.autoArrange({ direction: 'vertical', reconnect: true });
    await new Promise(res => setTimeout(res, 600));
    const s = A.getState(), P = s.shapes.find(x => x.id === p), Q = s.shapes.find(x => x.id === q);
    return { gap: Q.x - P.x, dy: Q.y - P.y, link: A.describe().connections[0].link, n: A.getConnectionRoute(e).length };
  });
  assert(Math.round(grp.gap) === 300 && Math.round(grp.dy) === 0 && grp.link === 'ES' && grp.n === 2, 'a group keeps its inside layout; its edges are reconnected ' + JSON.stringify(grp));

  // speed
  const ms = await page.evaluate(() => {
    const A = DiagramAPI; A.resetAll(); A.setConnectionStyle('elbow');
    const ids = []; for (let i = 0; i < 40; i++) ids.push(A.addShape('rectangle', { x: 60 + (i % 8) * 200, y: 60 + Math.floor(i / 8) * 140 }));
    let seed = 7, n = 0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    while (n < 60) { try { A.connect(ids[Math.floor(rnd() * 40)], ids[Math.floor(rnd() * 40)]); n++; } catch (e) { /* self or duplicate */ } }
    const t = performance.now(); A.autoArrange({ reconnect: true }); return performance.now() - t;
  });
  assert(ms < 3000, '40 shapes and 60 edges: ' + Math.round(ms) + ' ms');

  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await browser.close();
  console.log('ALL PASSED');
})().catch(e => { console.error(e.message); process.exit(1); });
