# <a href="https://platoedes-pty-ltd.github.io/DiscussionStudio/index.html"><img src="discussion-studio-icon.ico" alt="Discussion Studio icon" width="32" height="32" align="absmiddle"></a> Discussion Studio

A tool for aiding discussions with a visual flow of thoughts and information.

Draw shapes, connect them, attach notes, and let the layout follow the logic of the conversation. Everything runs in one HTML file. There is nothing to install, no server, and no account.

**[Visit the Discussion Studio website →](https://platoedes-pty-ltd.github.io/DiscussionStudio/index.html)**

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
| Add a shape | Use the toolbar buttons, or click empty canvas for a rectangle. |
| Move a shape | Drag it. |
| Resize a shape | Select it, then drag a square handle. Hold `Shift` on a corner to keep the proportions. Or type a width and height in the side panel. |
| Connect two shapes | Click a port icon on one shape, then a port icon on another. |
| Draw a line | Click the **Line** tool, then drag. Hold `Shift` for 0°, 45° and 90° angles. |
| Draw freehand | Click the **Draw** tool, then drag. |
| Finish drawing | Press `Escape`, or click the tool again. The tool stays on until then. Press `Escape` before you select a line. |
| Edit a label | Double-click a shape or connection. |
| Add a note | Click the note icon on a shape or connection. For a line, select it first, then click its note icon. Drag the card where you want it. |
| Select many | `Shift`-click (or `Ctrl`/`Cmd`-click) items to add or remove them. Or `Shift`-drag a box on empty canvas to add everything it touches. |
| Delete | Select an item and press `Delete`, or use the panel button. With many items selected, `Delete` removes all of them. |
| Cancel | Press `Escape`. This also clears the selection. |
| Pan / zoom | Drag empty canvas / mouse wheel, or use the zoom controls. |
| Export | Use the download (JSON), PowerPoint, or picture (PNG) button, then confirm the file name. |
| Export as a picture | Click the picture button in the toolbar, then confirm the file name. The whole diagram is saved, not only the visible part. |
| Import | Use the upload button and choose one or more JSON files. |
| Switch files | Click a tab. Your changes and your view stay with each file. |
| New / close a file | Use the `+` tab button / the `×` on a tab. Closing a changed file asks first. |
| Reset the current file | Use the trash button and confirm. Other open files are not affected. This cannot be undone. |

Your diagrams are not stored in the browser. Export JSON to keep your work. Closing or reloading the page discards all open files. A delete cannot be undone.

## JSON format

```json
{
  "shapes": [
    {
      "id": "shape_1", "type": "rectangle",
      "x": 80, "y": 80, "w": 140, "h": 70,
      "label": "Start", "fill": "#FFFFFF", "stroke": "#1C2127",
      "note": "", "noteOpen": false, "noteOffsetX": null, "noteOffsetY": null
    }
  ],
  "connections": [
    {
      "id": "conn_1", "from": "shape_1", "to": "shape_2",
      "fromPort": "end", "toPort": "start", "label": "",
      "note": "", "noteOpen": false, "noteOffsetX": null, "noteOffsetY": null
    }
  ],
  "lines": [
    {
      "id": "line_1", "kind": "line",
      "points": [{ "x": 100, "y": 300 }, { "x": 300, "y": 360 }],
      "stroke": "#1C2127", "width": 3, "arrow": true,
      "note": "", "noteOpen": false, "noteOffsetX": null, "noteOffsetY": null
    }
  ],
  "edgeStyle": "elbow"
}
```

The note fields on lines are optional. A file from an earlier version still opens.

## Selecting many items

- `Shift`-click, `Ctrl`-click, or `Cmd`-click a shape, connection, or line to add it to the selection. Do it again to remove it.
- `Shift`-drag a box on empty canvas. The box adds every item it touches to the current selection:
  - a shape, if the box overlaps it;
  - a line or freehand drawing, if the box touches any part of it;
  - a connection, if the box covers its middle, or if both of its shapes are selected.
- The side panel shows how many items are selected, with a **Delete N selected** button. `Delete` or `Backspace` does the same.
- Click empty canvas or press `Escape` to clear the selection.
- A plain click on an item selects that item only.

## PowerPoint export

Shapes become native PowerPoint shapes. Connections become PowerPoint lines in the current line style, with an arrowhead or crow's feet to match their type. Straight lines and freehand drawings become PowerPoint lines (a freehand drawing is a chain of short straight lines) in the same color and a scaled thickness. The diagram is scaled to fit one slide. Notes are not included.

## PNG export (picture)

Click the picture button in the toolbar and confirm the file name. The browser downloads one `.png` file.

- The picture shows the whole diagram, not only the part on screen. Pan and zoom do not change it.
- It shows shapes, labels, connections, lines, and freehand drawings. It uses the current line style.
- Open notes are included, with their dotted lines. Closed notes are not. Open a note before you export if you want it in the picture.
- The picture is cropped to the diagram, with a small margin, on the canvas background color.
- It has twice the canvas resolution, so it stays sharp on slides and high-resolution screens. The longest side is at most 8000 pixels. A very large diagram is scaled down to fit.
- The whole diagram is exported. A selection does not limit it.
- An empty canvas cannot be exported. Add at least one shape or line first.

## Developer API

Open the browser console and use `window.DiagramAPI`:

```js
const a = DiagramAPI.addShape('rectangle', { x: 80, y: 80, label: 'Idea' });
const b = DiagramAPI.addShape('diamond',   { x: 320, y: 80, label: 'Decision?' });
DiagramAPI.addConnection(a, b, 'leads to');
DiagramAPI.autoArrange();
DiagramAPI.exportJSON('my-discussion');   // downloads my-discussion.json
```

| Call | Description |
|---|---|
| `addShape(type, opts?)` | Add a shape (`'rectangle'`, `'circle'`, `'diamond'`). Returns its id. |
| `removeShape(id)` | Remove a shape and its connections. |
| `resizeShape(id, w?, h?)` | Set a shape's size. Minimum 40 × 30. |
| `addConnection(from, to, label?, note?, fromPort?, toPort?, kind?)` | Add a connection. Ports: `'start'` or `'end'`. Kind: `'arrow'` (default), `'one-many'`, or `'many-many'`. |
| `setConnectionKind(id, kind)` | Change the type of a connection. |
| `removeConnection(id)` | Remove a connection. |
| `addLine(x1, y1, x2, y2, opts?)` | Add a straight line. `opts`: `stroke`, `width`, `arrow`, `note`. Returns its id. |
| `addFreehand(points, opts?)` | Add a freehand line from `[{x, y}, ...]`. |
| `removeLine(id)` / `selectLine(id)` | Remove or select a line. |
| `autoArrange()` | Layered left-to-right layout. |
| `getState()` / `loadState(data)` | Read or replace the whole diagram. |
| `exportJSON(name?)` / `exportPPTX(name?)` / `exportPNG(name?)` | Download a file. No dialog is shown. |
| `resetAll()` | Empty the active file and reset the view. No confirmation. |
| `listDocuments()` | List open files: `[{ id, name, active, changed }]`. |
| `openDocument(data, name?)` / `newDocument()` | Open data, or an empty file, in a new tab. |
| `switchDocument(id)` / `closeDocument(id)` | Switch to, or close, a file. |
| `setEdgeStyle('elbow' \| 'point')` | Set the line style. |
| `selectShape(id)` / `selectConnection(id)` / `clearSelection()` | Control the selection. |
| `selectMany({ shapes, connections, lines })` | Select many items by id. |
| `deleteSelected()` | Delete the selected item, or all selected items. |

## Development

The whole app is one file. It contains the CSS, [Vue](https://vuejs.org/) 3, [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) 4, and the application code. There is no build step: edit the file and reload the page.

Notes for contributors:

- Embed `pptxgen.bundle.js`, not `pptxgen.min.js`. The minified build does not include JSZip.
- Do not use native `confirm()` or `prompt()`. Sandboxed viewers can block them silently. Use the modal dialogs.
- Keep the file free of CDN script tags so it works offline.

See [`discussion-studio-technical-documentation.md`](discussion-studio-technical-documentation.md) for the full technical documentation.

## License

[MIT](LICENSE)

Vue is MIT licensed. PptxGenJS is MIT licensed. Both are embedded in `discussion-studio.html`.
