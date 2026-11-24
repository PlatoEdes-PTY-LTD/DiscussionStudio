# Tests

Browser tests for the agent API (`window.DiagramAPI`) and the WebMCP tools. The app itself has no build step and no dependencies; these packages are only for testing.

## Run

```sh
cd tests
npm install
npx playwright install chromium   # once; skip if you have Chrome installed
npm test
```

`npm test` serves the project folder on a free `localhost` port and runs every test. Screenshots go to `tests/screenshots/` (not committed).

## Files

| File | What it checks |
|---|---|
| `api.test.js` | The `DiagramAPI` agent calls, input errors, and the WebMCP tools against a mock `navigator.modelContext`. All three answers to the **Allow delete?** dialog. Runs on `file://` and on `http://localhost`. |
| `webmcp.test.js` | The tools through the real WebMCP polyfill (`@mcp-b/global`), the way an agent calls them: `document.modelContext.getTools()` and `executeTool()`. Needs `http://localhost` (a secure context). |
| `agent-example.test.js` | The worked example in [`agent.md`](../agent.md), exactly as written. If you change the example, change this test. |
| `routing.test.js` | Elbow routing: straight when aligned, shortest length, around shapes, through gaps, no overlap between unrelated connections, a shared trunk at a shared port, all port combinations, and speed (60 connections, 40 shapes). |
| `reconnect.test.js` | Dragging the ends of a selected connection: to another port of the same shape, to another shape, refused drops, Escape, groups, zoom, and touch. |
| `arrange.test.js` | The Auto-arrange dialog, both directions, and reconnecting edges. |
| `run.js` | The local server and runner. |

To run one file: `node webmcp.test.js http://localhost:<port>/discussion-studio.html` while a server is running (for example `python3 -m http.server` in the project folder).
