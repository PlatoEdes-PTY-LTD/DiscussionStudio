# Discussion Studio

**Map a conversation as it happens.** Discussion Studio is a free, single-file browser app for turning live discussions into visual maps. Add shapes, connect ideas, attach notes, and share the result as a PowerPoint presentation, PNG image, or JSON file.

- **[Open Discussion Studio](https://platoedes-pty-ltd.github.io/DiscussionStudio/)**
- **[Read the technical documentation](discussion-studio-technical-documentation.md)**
- **[View the changelog](CHANGELOG.md)**

No installation, account, or server is required. The app works offline after you download the HTML file.

## Why Discussion Studio?

A conversation can move faster than a document or a traditional diagramming workflow. Discussion Studio gives you a lightweight canvas to capture ideas and show how they relate while people are talking—useful for brainstorming, planning, retrospectives, decision-making, and concept mapping.

## Features

- **Shapes** — rectangles, circles, and diamonds. Click empty canvas to drop a rectangle.
- **Resizable shapes** — select a shape and drag a handle, or type an exact width and height. Circles become ellipses.
- **Connections** — link shapes from any side (`start` / `end` ports). All four port combinations route cleanly.
- **Connection types** — click Connect and pick one: an arrow at the target (the default), a crow's foot at the target (one to many), or crow's feet at both ends (many to many). Change the type of a connection later in the side panel.
- **Two line styles** — orthogonal elbow lines or straight point-to-point lines, switchable for the whole diagram.
- **Lines and freehand** — draw straight lines (with an optional arrow) or sketch freehand. Pick a color and thickness. Select a line to move it, drag its end handles, add a note, or delete it. Thin lines stay easy to click at any zoom level.
- **Select many** — Shift-click (or `Ctrl`/`Cmd`-click) items, or Shift-drag a box on empty canvas, to select shapes, connections, and lines together. The side panel shows how many are selected. Delete them in one step.
- **Labels** — double-click a shape or connection to rename it.
- **Notes** — pin draggable note cards to any shape, connection, or line. A dotted line ties each note to its owner.
- **Auto-arrange** — lays shapes out in layers from left to right by dependency.
- **Pan and zoom** — drag the canvas, scroll to zoom.
- **Import / export** — save and load diagrams as JSON. Export to editable PowerPoint (`.pptx`). Export the whole diagram as a PNG picture, ready to paste into slides, chat, or documents.
- **Multiple files** — import several JSON files at once. Each opens in its own tab. Switch between them and your changes stay in each one. A dot on a tab shows unexported changes.
- **File names** — the tab shows the file name, and exports propose the same name. You can change it before saving.
- **Touch screens** — works on phones and tablets: drag with one finger, pinch with two to zoom, double-tap to rename. The **Select many** button (on touch devices) lets you tap items or drag a box to select several at once. On a narrow screen the toolbar shows icons only and the side panel opens over the canvas from the panel button.
- **Dark mode** — the moon / sun button in the toolbar switches between light and dark. The app follows your system setting until you choose, then remembers your choice. Exports keep light colors.
- **Reset** — one button empties the canvas and returns the app to its starting state.
- **Developer API** — every action is available from `window.DiagramAPI`.

## Quick start

1. Download `discussion-studio.html`.
2. Open it in a modern browser (Chrome, Edge, Firefox, or Safari).

That is all. The libraries are embedded, so the app works offline. (The page links Google Fonts for typography. Without a network, the browser uses a fallback font.)

## Using the app

| Action | How |
|---|---|
| Add a rectangle | Click empty canvas or use the toolbar. |
| Move a shape | Drag it on the canvas. |
| Connect shapes | Choose a connection type, then click a port on each shape. |
| Edit a shape or connection label | Double-click it. |
| Draw a line or freehand mark | Choose **Line** or **Draw**, then drag. Press `Escape` to finish or cancel. |
| Select multiple items | `Shift`-click / `Ctrl`-click / `Cmd`-click, or `Shift`-drag a selection box on empty canvas. |
| Delete selection | Select an item and press `Delete` or `Backspace`. |
| Pan / zoom | Drag empty canvas to pan; use the mouse wheel or zoom controls to zoom. |
| Import diagrams | Use the upload control to select one or more JSON files. |

## Developer API

Open the browser console while the app is running and use `window.DiagramAPI`:

```js
const idea = DiagramAPI.addShape('rectangle', {
  x: 80,
  y: 80,
  label: 'New idea'
});

const decision = DiagramAPI.addShape('diamond', {
  x: 320,
  y: 80,
  label: 'Try it?'
});

DiagramAPI.addConnection(idea, decision, 'leads to');
DiagramAPI.autoArrange();
DiagramAPI.exportJSON('discussion-map');
```

The API also supports reading and loading diagram state, managing shapes and connections, selecting and deleting items, opening documents, and exporting to PowerPoint or PNG. For the complete API reference and JSON format, see the [technical documentation](discussion-studio-technical-documentation.md) and the in-app API panel.

## Privacy and offline use

Your diagram data is processed in the browser and is not uploaded to a service. The app does not save diagrams in browser storage; export JSON to keep a copy. The app itself runs offline, with system fonts used when the optional online fonts are unavailable.

## Development

Discussion Studio is a single HTML file. There is no package installation or build process. To make a change, edit `discussion-studio.html` and open it in a browser to test it.

See the [technical documentation](discussion-studio-technical-documentation.md) for architecture, data format, API details, and testing guidance. Check the [changelog](CHANGELOG.md) for recent updates.

## License

This project is available under the [MIT License](LICENSE). Vue and PptxGenJS are also MIT licensed and are embedded in `discussion-studio.html`.
