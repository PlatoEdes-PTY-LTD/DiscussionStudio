// Checks elbow routing: shortest routes, no routes through shapes, no connections drawn on
// top of each other, valid port stubs, and speed while dragging.
// Usage: node routing.test.js <url or path of discussion-studio.html>
const { chromium } = require('playwright');
const path = require('path');
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok  ' + m); };

(async () => {
  let browser; try { browser = await chromium.launch(); } catch (e) { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const target = process.argv[2];
  await page.goto(/^https?:/.test(target) ? target : 'file://' + path.resolve(target));
  await page.waitForFunction(() => window.DiagramAPI);

  // Helpers inside the page.
  await page.evaluate(() => {
    const segs = (pts) => pts.slice(1).map((q, i) => ({ p: pts[i], q }));
    window.__R = {
      route: (id) => DiagramAPI.getConnectionRoute(id),
      len: (pts) => segs(pts).reduce((t, s) => t + Math.abs(s.q.x - s.p.x) + Math.abs(s.q.y - s.p.y), 0),
      // segments that pass through the inside of a shape (other than touching its border)
      hits: (pts, shape) => segs(pts).some(({ p, q }) => {
        const l = shape.x, r = shape.x + shape.w, t = shape.y, b = shape.y + shape.h;
        if (Math.abs(p.y - q.y) < 0.01) return p.y > t && p.y < b && Math.max(p.x, q.x) > l && Math.min(p.x, q.x) < r;
        return p.x > l && p.x < r && Math.max(p.y, q.y) > t && Math.min(p.y, q.y) < b;
      }),
      // total length where two routes run on top of each other
      overlap: (A, B) => {
        let total = 0;
        segs(A).forEach(a => segs(B).forEach(b => {
          const ah = Math.abs(a.p.y - a.q.y) < 0.01, bh = Math.abs(b.p.y - b.q.y) < 0.01;
          if (ah !== bh) return;
          if (ah && Math.abs(a.p.y - b.p.y) < 3) total += Math.max(0, Math.min(Math.max(a.p.x, a.q.x), Math.max(b.p.x, b.q.x)) - Math.max(Math.min(a.p.x, a.q.x), Math.min(b.p.x, b.q.x)));
          if (!ah && Math.abs(a.p.x - b.p.x) < 3) total += Math.max(0, Math.min(Math.max(a.p.y, a.q.y), Math.max(b.p.y, b.q.y)) - Math.max(Math.min(a.p.y, a.q.y), Math.min(b.p.y, b.q.y)));
        }));
        return total;
      },
      orthogonal: (pts) => segs(pts).every(({ p, q }) => Math.abs(p.x - q.x) < 0.01 || Math.abs(p.y - q.y) < 0.01),
      stubsOk: (pts, fromPort, toPort) => {
        const a = pts[0], b = pts[1], y = pts[pts.length - 2], z = pts[pts.length - 1];
        // the run from the port must point straight out of the shape's side, at least 24 long
        const out = { start: [-1, 0], end: [1, 0], top: [0, -1], bottom: [0, 1] };
        const ok = (p, q, [dx, dy]) => (q.x - p.x) * dx + (q.y - p.y) * dy >= 23.9 && Math.abs((q.x - p.x) * dy) + Math.abs((q.y - p.y) * dx) < 0.01;
        return ok(a, b, out[fromPort]) && ok(z, y, out[toPort]);
      },
    };
    window.__setup = (shapes, conns) => {
      DiagramAPI.resetAll();
      DiagramAPI.setConnectionStyle('elbow');
      const ids = shapes.map(s => DiagramAPI.addShape(s.type || 'rectangle', s));
      const cids = conns.map(c => DiagramAPI.connect(ids[c[0]], ids[c[1]], { fromPort: c[2], toPort: c[3] }));
      DiagramAPI.clearSelection();
      return { ids, cids };
    };
  });

  // 1. Aligned shapes: one straight segment.
  let r = await page.evaluate(() => {
    const { cids } = __setup([{ x: 60, y: 100, label: 'A' }, { x: 360, y: 100, label: 'B' }], [[0, 1]]);
    return __R.route(cids[0]);
  });
  assert(r.length === 2, 'aligned shapes -> straight line (' + r.length + ' points)');

  // 2. Target lower right: three segments, shortest possible length.
  r = await page.evaluate(() => {
    const { cids } = __setup([{ x: 60, y: 100 }, { x: 360, y: 260 }], [[0, 1]]);
    const pts = __R.route(cids[0]);
    return { n: pts.length, len: __R.len(pts), manhattan: Math.abs(360 - 200) + Math.abs(295 - 135) };
  });
  assert(r.n === 4 && Math.abs(r.len - r.manhattan) < 0.5, 'lower-right target -> 3 segments at shortest length ' + r.len);

  // 3. A shape in the way of a straight route: go around it, not through it.
  r = await page.evaluate(() => {
    const { cids } = __setup([{ x: 60, y: 100 }, { x: 300, y: 90, label: 'In the way' }, { x: 560, y: 100 }], [[0, 2]]);
    const s = DiagramAPI.getState().shapes;
    const pts = __R.route(cids[0]);
    return { hit: __R.hits(pts, s[1]), pts };
  });
  assert(!r.hit, 'route avoids a shape in the way');

  // 4. Target behind and below the source (end -> start): use the gap between the shapes,
  //    which is much shorter than going around above or below both.
  r = await page.evaluate(() => {
    const { cids } = __setup([{ x: 400, y: 60, label: 'Source' }, { x: 60, y: 300, label: 'Target' }], [[0, 1]]);
    const pts = __R.route(cids[0]);
    const s = DiagramAPI.getState().shapes;
    const ys = pts.map(p => p.y);
    // the horizontal channel lies between the bottom of Source (130) and the top of Target (300)
    const channel = pts.slice(1, -1).some((p, i, a) => i > 0 && Math.abs(p.y - a[i - 1].y) < 0.01 && p.y > 130 && p.y < 300);
    return { len: __R.len(pts), channel, hits: s.some(sh => __R.hits(pts, sh)), ok: __R.stubsOk(pts, 'end', 'start') };
  });
  assert(r.channel && !r.hits && r.ok, 'target behind and below -> routes through the gap between shapes (length ' + r.len + ')');
  // Shortest legal route: stubs 24 + 24, horizontal 540 - 60 + 48 = 528, vertical 335 - 95 = 240.
  // The old router went above both shapes: 24 + 65 + 528 + 305 + 24 = 946.
  assert(Math.abs(r.len - 816) < 0.5, 'gap route has the shortest possible length (816; the old detour was 946)');

  // 5. Two connections between different pairs whose old middle channel was the same x:
  //    they must not be drawn on top of each other.
  r = await page.evaluate(() => {
    const { cids } = __setup([
      { x: 60, y: 60, label: 'A' }, { x: 460, y: 260, label: 'B' },
      { x: 60, y: 260, label: 'C' }, { x: 460, y: 60, label: 'D' },
      { x: 60, y: 460, label: 'E' }, { x: 460, y: 160, label: 'F' },
    ], [[0, 1], [2, 3], [4, 5]]);
    const R = cids.map(__R.route);
    return { ab: __R.overlap(R[0], R[1]), ac: __R.overlap(R[0], R[2]), bc: __R.overlap(R[1], R[2]) };
  });
  assert(r.ab === 0 && r.ac === 0 && r.bc === 0, 'crossing connections do not overlap ' + JSON.stringify(r));

  // 6. Fan-out from one port: the routes run together as one trunk (a bus) and branch off,
  //    at the shortest length, without crossing a shape.
  r = await page.evaluate(() => {
    const { cids } = __setup([
      { x: 60, y: 200, label: 'Hub' }, { x: 400, y: 40 }, { x: 400, y: 160 }, { x: 400, y: 280 }, { x: 400, y: 400 },
    ], [[0, 1], [0, 2], [0, 3], [0, 4]]);
    const s = DiagramAPI.getState().shapes;
    const R = cids.map(__R.route);
    const trunkXs = new Set(R.filter(p => p.length === 4).map(p => p[1].x));
    const shortest = R.every((p, i) => Math.abs(__R.len(p) - (200 + Math.abs((s[i + 1].y + 35) - 235))) < 0.5);
    return { trunks: trunkXs.size, shortest, hits: R.some(p => s.some(sh => __R.hits(p, sh))) };
  });
  assert(r.trunks === 1 && r.shortest && !r.hits, 'fan-out from one port: one shared trunk, shortest routes, no shape crossed');

  // 6b. Two connections into the same port: the direct one stays straight, the other joins it.
  r = await page.evaluate(() => {
    const { cids } = __setup([{ x: 60, y: 60, label: 'Idea' }, { x: 340, y: 245, type: 'diamond', label: 'Go?' }, { x: 620, y: 60, label: 'Plan' }], [[1, 2], [0, 2]]);
    return __R.route(cids[1]).length;
  });
  assert(r === 2, 'a second connection into a used port is not pushed off its straight line');

  // 7. Every port combination, in every direction: orthogonal, valid stubs, never through
  //    either end shape.
  r = await page.evaluate(() => {
    const bad = [];
    const all = ['start', 'end', 'top', 'bottom'];
    const ports = all.flatMap(f => all.map(t => [f, t]));
    const spots = [[400, 300], [700, 300], [100, 300], [400, 40], [400, 560], [700, 40], [100, 560], [430, 330]];
    spots.forEach(([x, y]) => ports.forEach(([fp, tp]) => {
      const { cids } = __setup([{ x: 400, y: 300, label: 'S' }, { x, y, label: 'T' }].slice(0, x === 400 && y === 300 ? 1 : 2).concat(x === 400 && y === 300 ? [{ x: 700, y: 300 }] : []), [[0, 1, fp, tp]]);
      if (!cids[0]) return;
      const pts = __R.route(cids[0]);
      const s = DiagramAPI.getState().shapes;
      if (!__R.orthogonal(pts) || !__R.stubsOk(pts, fp, tp) || s.some(sh => __R.hits(pts, sh))) bad.push(fp + '->' + tp + ' @' + x + ',' + y);
    }));
    return bad;
  });
  // [430, 330] overlaps the source; a route through the overlap is unavoidable there.
  const realBad = r.filter(b => !b.includes('@430,330'));
  assert(realBad.length === 0, 'all port combinations: orthogonal, valid stubs, no shape crossed' + (realBad.length ? ' ' + realBad.join(', ') : ''));

  // 7b. Top and bottom: straight when aligned, one corner when mixed, and the link type.
  r = await page.evaluate(() => {
    const { cids } = __setup([{ x: 60, y: 60 }, { x: 60, y: 260 }, { x: 400, y: 260 }], [[0, 1, 'bottom', 'top'], [0, 2, 'end', 'top'], [1, 2, 'start', 'bottom']]);
    return { n: cids.slice(0, 2).map(c => __R.route(c).length), links: DiagramAPI.describe().connections.map(c => c.link).join() };
  });
  assert(r.n.join() === '2,3' && r.links === 'BT,ET,SB', 'bottom to top is straight, end to top has one corner, link types ' + r.links);

  // 7c. Clicking ports on the canvas makes every one of the 16 link types.
  const made = [];
  for (const f of ['start', 'end', 'top', 'bottom']) for (const t of ['start', 'end', 'top', 'bottom']) {
    const ids = await page.evaluate(() => __setup([{ x: 100, y: 100 }, { x: 450, y: 350 }], []).ids);
    await page.click(`.shape-group[data-id="${ids[0]}"] .port-${f}`);
    await page.click(`.shape-group[data-id="${ids[1]}"] .port-${t}`);
    const c = await page.evaluate(() => DiagramAPI.describe().connections);
    const panel = await page.locator('.link-type strong').innerText();
    if (c.length === 1 && c[0].fromPort === f && c[0].toPort === t && panel === c[0].link) made.push(panel);
  }
  assert(new Set(made).size === 16, 'clicking ports makes all 16 link types: ' + made.join(' '));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'shot-ports.png') });

  // 7d. Ports are hidden until the shape is hovered or selected.
  const pIds = await page.evaluate(() => __setup([{ x: 100, y: 100 }, { x: 450, y: 350 }], []).ids);
  const opacity = async (id) => { await page.waitForTimeout(250); return page.evaluate(id => getComputedStyle(document.querySelector(`.shape-group[data-id="${id}"] .port-top`)).opacity, id); };
  await page.mouse.move(900, 700);
  const hidden = await opacity(pIds[0]);
  await page.hover(`.shape-group[data-id="${pIds[0]}"] foreignObject`);
  const hovered = await opacity(pIds[0]), other = await opacity(pIds[1]);
  await page.mouse.move(900, 700);
  await page.evaluate(id => DiagramAPI.selectShape(id), pIds[1]);
  const selected = await opacity(pIds[1]);
  assert([hidden, hovered, other, selected].join() === '0,1,0,1', 'ports show only on a hovered or selected shape');

  // 7e. The same for a group: hovering its frame shows its ports.
  const gid = await page.evaluate(ids => { const g = DiagramAPI.group(ids).id; DiagramAPI.clearSelection(); return g; }, pIds);
  const gOp = async () => { await page.waitForTimeout(250); return page.evaluate(() => getComputedStyle(document.querySelector('.shape-group[data-group] .port-top')).opacity); };
  const g0 = await gOp();
  const frame = await page.locator('.group-frame').boundingBox();
  await page.mouse.move(frame.x + frame.width / 4, frame.y + 12);
  const g1 = await gOp();
  assert(g0 === '0' && g1 === '1', 'group ports show when its frame is hovered');

  // 8. Speed: 40 shapes, 60 connections; move a shape and time the re-route.
  r = await page.evaluate(() => {
    DiagramAPI.resetAll(); DiagramAPI.setConnectionStyle('elbow');
    const ids = [];
    for (let i = 0; i < 40; i++) ids.push(DiagramAPI.addShape('rectangle', { x: 60 + (i % 8) * 200, y: 60 + Math.floor(i / 8) * 140, label: 'S' + i }));
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let n = 0;
    while (n < 60) { try { DiagramAPI.connect(ids[Math.floor(rnd() * 40)], ids[Math.floor(rnd() * 40)]); n++; } catch (e) { /* self or duplicate */ } }
    DiagramAPI.clearSelection();
    const st = DiagramAPI.getState();
    const times = [];
    for (let k = 0; k < 10; k++) {
      const s = st.shapes[k];
      const t0 = performance.now();
      // change a shape's geometry, then read every route (this is what one drag frame does)
      DiagramAPI.resizeShape(s.id, 140 + (k % 2), 70);
      st.connections.forEach(c => DiagramAPI.getConnectionRoute(c.id));
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    return { median: times[5], max: times[9] };
  });
  assert(r.median < 40, 'reroute of 60 connections around 40 shapes: median ' + r.median.toFixed(1) + ' ms, max ' + r.max.toFixed(1) + ' ms');

  // Screenshot of a busy layout for a visual check.
  await page.evaluate(() => {
    __setup([
      { x: 60, y: 60, label: 'Idea' }, { x: 60, y: 260, label: 'Research' }, { x: 60, y: 460, label: 'Budget' },
      { type: 'diamond', x: 340, y: 245, label: 'Go?' }, { x: 620, y: 60, label: 'Plan' }, { x: 620, y: 260, label: 'Build' },
      { x: 620, y: 460, label: 'Stop' }, { type: 'circle', x: 900, y: 245, label: 'Ship' },
    ], [[0, 3], [1, 3], [2, 3], [3, 4], [3, 5], [3, 6], [4, 7], [5, 7], [0, 4], [2, 6], [6, 1, 'end', 'end'], [7, 0, 'end', 'start']]);
  });
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'shot-routing.png') });

  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await browser.close();
  console.log('ALL PASSED');
})().catch(e => { console.error(e.message); process.exit(1); });
