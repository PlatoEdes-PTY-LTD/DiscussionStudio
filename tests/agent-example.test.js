// Runs the worked example in agent.md through the WebMCP polyfill, exactly as written,
// and checks that the ids and the result match what the guide says.
// Usage: node agent-example.test.js <url of discussion-studio.html>   (http://localhost is needed)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok  ' + m); };
const polyfill = fs.readFileSync(path.join(__dirname, 'node_modules/@mcp-b/global/dist/index.iife.js'), 'utf8');

(async () => {
  let browser; try { browser = await chromium.launch(); } catch (e) { browser = await chromium.launch({ channel: 'chrome' }); }
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript({ content: polyfill });
  await page.goto(process.argv[2]);
  await page.waitForFunction(() => window.DiagramAPI);

  const out = await page.evaluate(async () => {
    DiagramAPI.resetAll();
    const mc = document.modelContext, tools = await mc.getTools();
    const run = async (n, a) => {
      let x = await mc.executeTool(tools.find(t => t.name === n), a);
      if (typeof x === 'string') x = JSON.parse(x);
      return JSON.parse(x.content[0].text);
    };
    const ids = [];
    await run('get_diagram', {});
    ids.push((await run('add_shape', { type: 'rectangle', label: 'Login bug', x: 60, y: 120 })).id);
    ids.push((await run('add_shape', { type: 'diamond', label: 'Blocker?', x: 260, y: 105 })).id);
    ids.push((await run('add_shape', { type: 'circle', label: 'Fix', x: 480, y: 105, note: 'Owner: Sam. Due: Friday.' })).id);
    ids.push((await run('connect_shapes', { from: 'shape_1', to: 'shape_2' })).id);
    ids.push((await run('connect_shapes', { from: 'shape_2', to: 'shape_3', label: 'yes' })).id);
    ids.push((await run('add_handwritten_shape', { shape: 'circle', x: 240, y: 85, w: 180, h: 140, stroke: '#D93A2B', note: 'Agreed as a blocker' })).id);
    DiagramAPI.clearSelection();
    return { ids, summary: await run('get_diagram', {}) };
  });
  assert(out.ids.join() === 'shape_1,shape_2,shape_3,conn_1,conn_2,line_1', 'ids match agent.md: ' + out.ids.join(', '));
  assert(out.summary.shapes[2].note === 'Owner: Sam. Due: Friday.', 'note on shape_3');
  assert(out.summary.connections[1].label === 'yes', 'label on conn_2');
  assert(out.summary.drawings[0].note === 'Agreed as a blocker', 'note on the handwritten circle');
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'shot-example.png'), clip: { x: 0, y: 130, width: 700, height: 300 } });
  assert(errors.length === 0, 'no page errors ' + errors.join('; '));
  await browser.close();
  console.log('ALL PASSED');
})().catch(e => { console.error(e.message); process.exit(1); });
