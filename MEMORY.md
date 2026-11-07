# Discussion Studio — Project Memory

Last reviewed: 2026-10-24. Based on the local README files, technical documentation, file inventory, and targeted inspection of the current application code.

## Purpose and working files

Discussion Studio helps people map a discussion with shapes, connections, labels, notes, and drawings. The final product name is Discussion Studio; earlier names were Diagram Studio and Brain Dump Studio.

- `discussion-studio.html`: current application and primary implementation file. Edit this by default.
- `README.md`: current usage guide, JSON examples, and public API reference.
- `discussion-studio-technical-documentation.md`: detailed architecture, implementation guidance, known limits, and historical testing procedures.
- `v1/`: older application variants (`discussion-studio.html` and `discussion-studio_1.html`), older documentation, icons, and `LICENSE_discussion`. These files differ from the root versions; do not assume they are synchronized or overwrite them without a task requiring it.

There is no package manifest, build configuration, or automated test suite in the inspected files. Run the app by opening the root HTML file in a modern browser. No installation, server, or account is needed.

## Architecture

- One self-contained HTML file holds CSS, embedded Vue 3, embedded PptxGenJS 4 with JSZip, and application code.
- The technical documentation identifies embedded versions as Vue 3.5.42 and PptxGenJS 4.0.1; verify the embedded headers before changing dependencies.
- The application script begins near line 426 in the reviewed version. Search for specific application symbols with bounded output: embedded vendor scripts contain very long lines.
- Vue Composition API: `createApp`, a template literal named `TEMPLATE`, and component `setup()`. Template references must be included in the object returned by `setup()`.
- The drawing surface is SVG with a transformed group for pan and zoom. Notes use HTML inside SVG `foreignObject`. Drawing layers place connections behind shapes, free lines above shapes, and notes above those.
- Google Fonts is an optional network dependency; fallback fonts allow offline use. Keep script dependencies embedded.

## Features and data

- Shapes: rectangle, circle/ellipse, diamond; draggable and resizable, minimum 40 × 30 canvas units. Shift preserves proportions during corner resizing.
- Connections: shape-to-shape links with `start` (left) and `end` (right) ports. Global `edgeStyle` is `elbow` or `point`. Elbow routing supports all four port combinations; point routing uses shape boundaries.
- Notes: draggable cards attached to shapes or connections, stored on their owner with `note`, `noteOpen`, and note-offset fields.
- Free lines: straight lines with optional arrows and freehand drawings; color, width, movement, and straight-line endpoint editing. Shift snaps straight lines to 45-degree increments.
- Auto-arrange lays shapes out from left to right by dependency and does not move free lines.
- Multiple documents use tabs, separate viewports, JSON import/export, dirty-state indicators, and close confirmation in the UI.
- JSON state is `{ shapes, connections, lines, edgeStyle }`. Shape IDs use `shape_`, connection IDs `conn_`, and line IDs `line_` prefixes.
- Lines use `{ id, kind, points, stroke, width, arrow }`, where `kind` is `line` or `free`. `cleanLines` normalizes input; older JSON without `lines` is supported.
- Self-connections and duplicate connections with the same endpoints and ports are rejected. Deleting a shape removes attached connections but leaves free lines.
- `getState()` returns copied diagram data. `loadState()` replaces the active data and recalculates ID counters.

## Documents and persistence

- The live reactive arrays belong to the active document. `docs` records hold document identity, names, baseline JSON, and saved data plus viewport.
- Switching documents saves the current snapshot, clears transient interactions, and loads a deep copy of the target snapshot. Preserve this deep copy to avoid mutations leaking into saved snapshots.
- Dirty checks compare serialized diagram data with the baseline; opening, closing, or moving notes also counts as a change.
- JSON export updates the document name and baseline. PowerPoint export does not mark JSON data as saved.
- No browser persistence or undo exists. Closing or reloading the page discards open diagrams; users must export JSON.
- Reset clears the active document and transient state, resets its viewport and counters, and leaves other tabs intact. It preserves the connection edge style.
- Initial load creates a sample diagram with five shapes and four connections.

## Export and API

- PowerPoint export creates editable native shapes and arrowed line segments on one fitted slide. Freehand drawings become chains of line segments. Notes are excluded.
- Current code allows PowerPoint export when there is at least one shape **or free line**. Some older documentation incorrectly says a shape is required.
- Use the bundled PptxGenJS distribution containing JSZip and the instance property `pptx.ShapeType`.
- `window.DiagramAPI` is initialized on mount. It supports shape, connection, and line creation/removal; resizing; selection; arrangement; state loading/reading; JSON/PPTX export; edge style; reset; and document listing/opening/switching/closing.
- Key calls: `addShape`, `addConnection`, `addLine`, `addFreehand`, `resizeShape`, `getState`, `loadState`, `listDocuments`, `openDocument`, `newDocument`, `switchDocument`, `closeDocument`, `exportJSON`, `exportPPTX`, `resetAll`/`clearAll`.
- API export, reset, and close operations bypass the UI confirmation dialogs. `exportPPTX` is asynchronous.

## Maintenance guidance

- Prefer current implementation over conflicting historical documentation.
- Avoid native `confirm()` and `prompt()` because sandboxed viewers can block them. Use the existing Vue dialogs. Existing `alert()` paths remain a known limitation.
- Update the global `onKeydown` dialog guards when adding or changing dialogs; text entry must not trigger canvas deletion shortcuts.
- When extending state, update serialization, normalization, snapshots, and dirty-state handling as needed. Keep the README, technical documentation, and in-app API help aligned with public API changes.
- Preserve embedded dependencies and the single-file delivery model.
- For code changes, check inline script syntax and browser errors, then exercise relevant UI actions and inspect `DiagramAPI.getState()`. For exports, verify downloaded names and content; inspect PPTX XML/visual output when relevant. Use available local tooling; do not assume the historical environment's browser or render tools are installed.

## Documentation and workspace caveats

- Historical instructions mentioning `/home/claude`, `/mnt/user-data/outputs/`, and `SendUserFile` describe a previous environment. Work directly in this local workspace instead.
- The root README references `docs/screenshot.png` and `LICENSE`, neither present in the reviewed inventory. Icon assets and a license file are present under `v1/`.
- At review time, Git already reported a modified root HTML file, deleted root icon assets, and untracked README, technical documentation, and `v1/` files. Preserve existing user changes; this memory file does not establish why those changes occurred.
- This file records project context, not independently established user preferences. Refresh it when architecture, behavior, or file organization changes.
