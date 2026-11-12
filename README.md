# Discussion Studio

**Map a conversation as it happens.** Discussion Studio is a free, single-file browser app for turning live discussions into visual maps. Add shapes, connect ideas, attach notes, and share the result as a PowerPoint presentation, PNG image, or JSON file.

- **[Open Discussion Studio](https://platoedes-pty-ltd.github.io/DiscussionStudio/)**
- **[Read the technical documentation](discussion-studio-technical-documentation.md)**
- **[View the changelog](CHANGELOG.md)**

No installation, account, or server is required. The app works offline after you download the HTML file.

## Why Discussion Studio?

A conversation can move faster than a document or a traditional diagramming workflow. Discussion Studio gives you a lightweight canvas to capture ideas and show how they relate while people are talking—useful for brainstorming, planning, retrospectives, decision-making, and concept mapping.

## Features

- **Build a visual map:** Add rectangles, circles, and diamonds; label them; resize and arrange them.
- **Show relationships:** Connect shapes with arrow, one-to-many, or many-to-many connections. Choose elbow or straight routing.
- **Draw freely:** Add straight lines and freehand marks with adjustable color and thickness.
- **Add context:** Attach draggable notes to shapes, connections, and lines.
- **Organize a busy canvas:** Select multiple items together, delete them as a group, or auto-arrange shapes into layers.
- **Work across diagrams:** Open multiple JSON files in tabs and switch between them.
- **Move around the canvas:** Pan and zoom, and use light or dark mode.
- **Export and continue later:** Save an editable PowerPoint, a PNG of the whole diagram, or JSON to reopen and edit later.
- **Automate tasks:** Use the browser-based `window.DiagramAPI` to create, inspect, and export diagrams.

## Get started

### Use the hosted app

Open **[Discussion Studio](https://platoedes-pty-ltd.github.io/DiscussionStudio/)** in a modern browser.

### Run it offline

1. Download [`discussion-studio.html`](discussion-studio.html) from this repository.
2. Open the downloaded file in a modern browser (Chrome, Edge, Firefox, or Safari).

The app and its required libraries are bundled in that HTML file, so no build step or local server is needed. The page can request Google Fonts for typography; when offline, it uses system fallback fonts instead.

## Create and export a diagram

1. Click a shape button in the toolbar, or click an empty part of the canvas to add a rectangle.
2. Drag shapes to position them; use the handles or properties panel to resize and style them.
3. Connect shapes by choosing a connection type and selecting the connection points on each shape.
4. Add labels, notes, lines, or freehand marks as needed.
5. Export from the toolbar:
   - **JSON** keeps diagram data so you can import and edit it later.
   - **PowerPoint (`.pptx`)** creates editable shapes and lines on a slide. Notes are not included.
   - **PNG (`.png`)** exports the whole diagram, including open notes. The current viewport and selection do not limit the image.

> **Keep your work:** Diagrams are held in memory while the page is open. They are not saved to browser storage. Export JSON before closing or reloading the page; otherwise, unsaved diagrams are lost.

## Useful controls

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
