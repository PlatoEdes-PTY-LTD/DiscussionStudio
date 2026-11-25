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
- **Connections** — every shape has four connection points: `start` (left), `end` (right), `top`, and `bottom`. All 16 combinations work, and the panel shows the link type by its first letters: ES, EE, SS, SE, ST, TS, SB, BS, ET, TE, EB, BE, TT, TB, BT, BB.
- **Connection types** — click Connect and pick one: an arrow at the target (the default), arrows at both ends (double arrow), a crow's foot at the target (one to many), or crow's feet at both ends (many to many). Change the type of a connection later in the side panel.
- **Two line styles** — orthogonal elbow lines or straight point-to-point lines, switchable for the whole diagram.
- **Lines and freehand** — draw straight lines (with an optional arrow) or sketch freehand. Pick a color and thickness. Select a line to move it, drag its end handles, add a note, or delete it. Thin lines stay easy to click at any zoom level.
- **Select many** — Shift-click (or `Ctrl`/`Cmd`-click) items, or Shift-drag a box on empty canvas, to select shapes, connections, and lines together. The side panel shows how many are selected. Delete them in one step.
- **Copy and paste** — Select one or more shapes (and lines) and press `Ctrl`/`Cmd`+`C`, then `Ctrl`/`Cmd`+`V` to paste a copy offset on the canvas (`Ctrl`/`Cmd`+`D` duplicates in one step). Copies keep their size, label, colours and notes; connections between copied shapes come along. Pasting also works into another open tab.
- **Context menu** — Right-click the canvas (or long-press on a touch screen) for Copy, Paste here, Duplicate, Group, Ungroup, Select group, and Delete. Right-clicking an item that is not selected selects it first; Paste here puts the copy at the pointer.
- **Groups** — Select shapes and press `Ctrl`/`Cmd`+`G` (or click **Group** in the panel) to put them in a group. Connections whose two shapes are both selected go into the group. Each group has a Group ID you can edit, plus a label and a note. A group works like a shape: drag it to move everything inside, resize it to scale its contents, connect it to other shapes, and copy and paste it. `Ctrl`/`Cmd`+`Shift`+`G` ungroups.
- **Labels** — double-click a shape or connection to rename it.
- **Notes** — pin draggable note cards to any shape, connection, or line. A dotted line ties each note to its owner.
- **Auto-arrange** — lays shapes out in layers by dependency. It asks for the direction (left to right or top to bottom) and whether edges may be reconnected to other connection points for a cleaner layout.
- **Pan and zoom** — drag the canvas, scroll to zoom.
- **Import / export** — save and load diagrams as JSON. Export to editable PowerPoint (`.pptx`). Export the whole diagram as a PNG picture, ready to paste into slides, chat, or documents.
- **Multiple files** — import several JSON files at once. Each opens in its own tab. Switch between them and your changes stay in each one. A dot on a tab shows unexported changes.
- **File names** — the tab shows the file name, and exports propose the same name. You can change it before saving, and in Chrome or Edge choose the folder too.
- **Touch screens** — works on phones and tablets: drag with one finger, pinch with two to zoom, double-tap to rename. The **Select many** button (on touch devices) lets you tap items or drag a box to select several at once. On a narrow screen the toolbar shows icons only and the side panel opens over the canvas from the panel button.
- **Live sharing** — click **Share**, enter your name, and send the link. Each person who opens it enters a name and edits the same diagram with you in real time. Everyone sees who is in the session and each other's pointers. The session lasts while your tab stays open. See [Live sharing](#live-sharing).
- **Dark mode** — the moon / sun button in the toolbar switches between light and dark. The app follows your system setting until you choose, then remembers your choice. Exports keep light colors.
- **Reset** — one button empties the canvas and returns the app to its starting state.
- **Developer API** — every action is available from `window.DiagramAPI`.
- **AI agents (WebMCP)** — an AI assistant in your browser can build the map with you: add shapes, connect them, choose elbow or straight connections, add notes, and draw handwritten circles, arrows and underlines. It must ask you before it deletes anything.

## Quick start

1. Download `discussion-studio.html`.
2. Open it in a modern browser (Chrome, Edge, Firefox, or Safari).

That is all. The libraries are embedded, so the app works offline. (The page links Google Fonts for typography. Without a network, the browser uses a fallback font.)

## Using the app

| Action | How |
|---|---|
| Add a rectangle | Click empty canvas or use the toolbar. |
| Move a shape | Drag it on the canvas. |
| Move a connection end | Select the connection, then drag the round handle at either end to another connection point. |
| Connect shapes | Choose a connection type, then hover each shape and click one of the dots on its edges. |
| Edit a shape or connection label | Double-click it. |
| Draw a line or freehand mark | Choose **Line** or **Draw**, then drag. Press `Escape` to finish or cancel. |
| Select multiple items | `Shift`-click / `Ctrl`-click / `Cmd`-click, or `Shift`-drag a selection box on empty canvas. |
| Delete selection | Select an item and press `Delete` or `Backspace`. |
| Pan / zoom | Drag empty canvas to pan; use the mouse wheel or zoom controls to zoom. |
| Import diagrams | Use the upload control to select one or more JSON files. |
| Share live | Click **Share**, enter your name, click **Start sharing**, and copy the link. |

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

Calls for AI agents and scripts:

```js
const link = DiagramAPI.connect(idea, decision, { label: 'leads to', kind: 'arrow' });
DiagramAPI.setConnectionStyle('straight');          // or 'elbow'
DiagramAPI.setNote(link, 'Agreed in the meeting', { open: true });
DiagramAPI.addHandwrittenShape('circle', { x: 20, y: 20, w: 200, h: 120, stroke: '#D93A2B' });
await DiagramAPI.deleteItems([idea], { reason: 'duplicate' });   // asks you first
```

When the browser provides WebMCP (`document.modelContext`, or `navigator.modelContext` in older drafts), the same actions are registered as tools for an AI assistant: `get_diagram`, `add_shape`, `connect_shapes`, `set_connection_style`, `set_note`, `add_handwritten_shape`, `create_group`, `update_group`, `ungroup`, `duplicate_items`, `auto_arrange`, and `delete_items`.

The API also supports reading and loading diagram state, managing shapes and connections, selecting and deleting items, opening documents, and exporting to PowerPoint or PNG. For the complete API reference and JSON format, see the [technical documentation](discussion-studio-technical-documentation.md) and the in-app API panel.

## Live sharing

1. Click **Share** in the toolbar, enter your name, and click **Start sharing**. You are the host.
2. Click **Copy** and send the link to the people you want to invite.
3. Each person who opens the link enters a name and clicks **Join**. The diagram opens in a new tab named **Shared · …**.
4. Everyone can add, move, edit, and delete items. Changes appear for everyone within a fraction of a second. The toolbar shows who is in the session, and the canvas shows each person's pointer with their name.
5. To end the session, click **Live** and then **Stop sharing**. A guest clicks **Leave**. Everyone keeps their copy in the tab and can export it.

Things to know:

- Only the tab that was active when you clicked Share is shared. Your other tabs stay private.
- The session lasts while the host's tab is open. If the host closes it, guests keep a copy but stop receiving changes.
- Anyone with the link can join. The name is a label, not a verified account.
- Share from the website. A link made from a downloaded file (`file://`) only works on your own computer.
- Browsers connect to each other directly (WebRTC). Some office or school networks block direct connections; joining then fails with a message.

## Privacy and offline use

Your diagram data is processed in the browser and is not uploaded to a storage service. Refreshing the page keeps your open tabs and their drawings: they are held in the browser tab's session storage until you close that tab, so export JSON to keep a copy. The app also remembers your theme choice and live-sharing name. A refresh ends your part in a live session; your copy of the diagram stays. During live sharing, the diagram travels directly between the browsers in the session. The free PeerJS server only introduces the browsers to each other and does not receive the diagram. The app itself runs offline, with system fonts used when the optional online fonts are unavailable.

## Development

Discussion Studio is a single HTML file. There is no package installation or build process. To make a change, edit `discussion-studio.html` and open it in a browser to test it.

See the [technical documentation](discussion-studio-technical-documentation.md) for architecture, data format, API details, and testing guidance. Check the [changelog](CHANGELOG.md) for recent updates.

## License

This project is available under the [MIT License](LICENSE). Vue and PptxGenJS are also MIT licensed and are embedded in `discussion-studio.html`.
