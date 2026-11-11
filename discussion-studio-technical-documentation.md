# Discussion Studio — Technical Documentation

Document type: Technical documentation for maintenance and development
Writing standard: ASD-STE100 (Simplified Technical English)
Audience: A future Claude session that must change or repair the application
Document date: 2026-11-10
Application file: `discussion-studio.html`

---

## 1. Purpose and scope

Discussion Studio is a tool that aids discussions. It shows a visual flow of thoughts and information.

The user draws shapes on a canvas. The user connects the shapes with lines. The user attaches notes to shapes, connections, and lines.

This document gives the facts that a future session needs. It tells you how the application is built. It tells you how to change it and how to test it.

This document does not teach Vue or SVG.

---

## 2. Terms

Use these terms in the same way in all code, comments, and messages to the user.

| Term | Meaning |
|---|---|
| Canvas | The SVG area where the user draws. |
| Shape | A rectangle, a circle, or a diamond on the canvas. |
| Line | A free straight line with two end points. It is not tied to a shape. It can have an arrow. |
| Freehand drawing | A free line that the user draws with the mouse. It has many points. |
| Tool | A mode of the canvas: `select`, `connect`, `line`, or `draw`. |
| Connection | A line between two shapes. Its type sets the ends: an arrow at the target, a crow's foot at the target (one to many), or crow's feet at both ends (many to many). |
| Port | A connection point on the side of a shape. `start` is the left side. `end` is the right side. |
| Note | A text card attached to one shape, one connection, or one line. A dotted line ties it to its owner. |
| Label | The short text that shows inside a shape or on a connection. |
| Edge style | The drawing mode for all connections. `elbow` or `point`. |
| Viewport | The pan and zoom state of the canvas. |
| Reset | The action that removes all data and returns the application to its start state. |
| File | One open diagram. It has its own tab, its own data, and its own pan and zoom. |
| Tab | The control in the tab bar that shows one file. |
| Changed | A file is changed when its data differs from its data at the time it was opened or last exported. A dot on the tab shows this. |
| Imported file name | The file name of the active file. Empty for an untitled file. |
| Multi-selection | A selection of more than one item. It can hold shapes, connections, and lines together. |
| Selection box | The dashed rectangle that the user drags with `Shift` to make a multi-selection. |

---

## 3. Files and delivery

### 3.1 Deliverables

All deliverables are in `/mnt/user-data/outputs/`.

| File | Description |
|---|---|
| `discussion-studio.html` | The complete application. One file. About 700 KB. |
| `discussion-studio-icon.svg` | The icon in vector format. |
| `discussion-studio-icon-512.png` | The icon as a 512 pixel PNG image with a transparent background. |
| `discussion-studio-icon.ico` | The icon as a multi-size ICO file (16, 24, 32, 48, 64, 128, 256 pixels). |
| `discussion-studio-technical-documentation.md` | This document. |

### 3.2 Persistence of files

**WARNING:** The directory `/home/claude` does not keep files between sessions. Only `/mnt/user-data/outputs/` and the Project keep files.

At the start of each session, put the application file in the working directory. Use one of these methods:

```
cp /mnt/user-data/outputs/discussion-studio.html /home/claude/discussion-studio.html
```

If that directory does not exist, read `discussion-studio.html` from the Project with `project_read`. Then copy the local file that it gives to `/home/claude/discussion-studio.html`.

At the end of your work, copy the file to `/mnt/user-data/outputs/`. Write it to the Project with `project_write`. Then send it to the user with `SendUserFile`.

### 3.3 Name history

The application had these names in this order: Diagram Studio, Brain Dump Studio, Discussion Studio. The old file name `diagram-studio.html` no longer exists. The name "Discussion Studio" is final.

---

## 4. Architecture

### 4.1 General

The application is one HTML file. It has no external script dependencies. It makes no network request for code.

**CAUTION:** Do not add a CDN script tag. Earlier versions used a CDN. The CDN did not load in the user's sandboxed viewer. The application then showed a blank page.

### 4.2 Content of the file

The file has these parts in this order:

1. `<head>`: title, description, viewport, favicon, Google Fonts link, and one `<style>` block with all CSS.
2. Script block 1: Vue 3.5.42 (global build, embedded).
3. Script block 2: PptxGenJS 4.0.1 (`pptxgen.bundle.js`, embedded). This block includes JSZip.
4. Script block 3: the application code (about 97 KB).
5. `<div id="app">` is the mount point.

### 4.3 Application code

The application code uses the Vue Composition API. It has these main parts:

| Part | Description |
|---|---|
| `SHAPE_DEFAULTS` | Default width and height for each shape type. |
| `PALETTE` | Six fill colors for shapes. |
| `ICONS` | Inline SVG strings for toolbar icons. |
| `TEMPLATE` | The full HTML template as a template literal. |
| `createApp({ template, setup() { ... } })` | The component. All state and functions are inside `setup()`. |
| `app.mount('#app')` | Mounts the application. |

`setup()` returns an object. The template can use only the names in that object. If you add a function or a state value to the template, you must also add it to the returned object.

**CAUTION:** Do not use backticks inside the `TEMPLATE` string.

### 4.4 Rendering

The canvas is one `<svg>` element. It has one `<g>` element with a `transform` for pan and zoom. Layers inside the group, from back to front: connections, shapes, lines, notes, selection box.

Notes use `<foreignObject>` with HTML content.

Zoom limits are 0.3 and 2.5. The mouse wheel zooms at the pointer. The zoom buttons zoom at the center of the canvas.

---

## 5. Data model

All data is in three reactive arrays: `shapes`, `connections`, and `lines`. Notes are not a separate array. Each note is a set of fields on its shape, connection, or line.

### 5.1 Shape

| Field | Type | Description |
|---|---|---|
| `id` | string | `shape_1`, `shape_2`, and so on. |
| `type` | string | `rectangle`, `circle`, or `diamond`. |
| `x`, `y` | number | Top-left position in canvas units. |
| `w`, `h` | number | Width and height. |
| `label` | string | Text in the shape. |
| `fill` | string | Fill color. |
| `stroke` | string | Outline color. |
| `note` | string | Note text. |
| `noteOpen` | boolean | `true` when the note card is visible. |
| `noteOffsetX`, `noteOffsetY` | number or null | Offset of the note card from its anchor. |

### 5.2 Connection

| Field | Type | Description |
|---|---|---|
| `id` | string | `conn_1`, `conn_2`, and so on. |
| `from`, `to` | string | The ids of the two shapes. |
| `fromPort`, `toPort` | string | `start` or `end`. Default: `fromPort` is `end`, `toPort` is `start`. |
| `kind` | string | `arrow`, `one-many`, or `many-many`. Default: `arrow`. A connection without `kind` (an older file) is an arrow. |
| `label` | string | Text on the line. |
| `note`, `noteOpen`, `noteOffsetX`, `noteOffsetY` | | Same meaning as for a shape. |

The code tells a shape from a connection by the `type` field. Only a shape has `type`. The code tells a line from a connection by the `points` field. Only a line has `points`.

### 5.2A Line

A line object is used for both straight lines and freehand drawings.

| Field | Type | Description |
|---|---|---|
| `id` | string | `line_1`, `line_2`, and so on. |
| `kind` | string | `line` (two points) or `free` (many points). |
| `points` | array | `[{ x, y }, ...]` in canvas units. |
| `stroke` | string | Color. |
| `width` | number | Thickness in canvas units. The buttons set 1.5, 3, or 6. |
| `arrow` | boolean | `true` for an arrow at the second point. Only for `kind: 'line'`. |
| `note`, `noteOpen`, `noteOffsetX`, `noteOffsetY` | | Same meaning as for a shape. |

### 5.3 Rules for the data

- A connection from a shape to itself is not allowed.
- Two identical connections are not allowed. Identical means the same `from`, `to`, `fromPort`, and `toPort`.
- When the user deletes a shape, the application also deletes all connections of that shape.
- A line is free. It does not have connections or labels. A line can have a note. When the user deletes a shape, no line is deleted.
- `loadState` and `normalizeState` call `cleanLines`. This function removes lines that have fewer than two points or a point that is not a number. It keeps the note fields. A file without `lines` is valid. A file with lines from an earlier version, without note fields, is valid.
- The note position is an offset from the anchor of the owner. The note moves with its owner.

### 5.4 Other state

| Name | Description |
|---|---|
| `mode` | `select`, `connect`, `line`, or `draw`. |
| `selectedLineId` | The selected line. Only one of the three single-selection values is set at a time. |
| `multi` | `{ shapes, conns, lines }`. Three arrays of ids. They hold the multi-selection. When they are not empty, the three single-selection values are `null`. |
| `multiCount` | The number of items in `multi`. |
| `marquee` | `{ active, x0, y0, x1, y1 }`. The selection box in canvas units. |
| `lineStyle` | `{ stroke, width, arrow }`. The style of the next line. It follows the last style that the user chose. |
| `drawing` | `{ active, kind, points }`. The stroke that the user is drawing now. It is shown as a preview. |
| `lineDrag`, `lineHandleDrag` | State while the user moves a line or an end handle. |
| `resizing` | State while the user drags a shape resize handle. |
| `edgeStyle` | `elbow` or `point`. Applies to all connections. |
| `connectFrom`, `connectFromPort` | The start of a connection that the user is drawing. |
| `selectedShapeId`, `selectedConnId` | The current single selection. |
| `viewport` | `{ x, y, scale }`. |
| `panelVisible` | `true` when the properties panel is visible. |
| `showApiDoc` | `true` when the API help panel is visible. |
| `showClearConfirm` | `true` when the reset dialog is open. |
| `textDialogTarget`, `textDialogValue` | State of the label edit dialog. |
| `exportDialog` | `null`, or `{ kind, name }` when the export dialog is open. |
| `docs` | The list of open files. See Section 9A. |
| `activeDocId` | The id of the file that the user sees. |
| `closeConfirmDoc` | The id of the file that waits for close confirmation, or `null`. |
| `importedFileName` | The file name of the active file. Empty string for an untitled file. |

The application does not save data to browser storage. See Section 13.

---

## 6. User interface

### 6.1 Toolbar actions

The toolbar is in the top bar. It has these actions: add rectangle, add circle, add diamond, Connect (opens a menu of connection types: Arrow, One to many, Many to many; choosing one starts connect mode, and clicking Connect while connecting stops it), Auto-arrange, the connection style toggle (elbow or point), panel visibility, Developer API help, export JSON, export PowerPoint, export PNG, import JSON, and reset all data.

The toolbar has two icon buttons for the drawing tools: Line and Draw. See Section 7A.

A control group on the canvas has zoom out, zoom in, and Reset view buttons. Reset view sets the viewport to its start state. It does not delete data.

The reset button has a trash icon and the title "Reset all data". It has the class `danger`.

A tab bar is below the top bar. It shows all open files. See Section 9A.

### 6.2 Canvas actions

| Action | Result |
|---|---|
| Click on empty canvas | Adds a rectangle at that position. |
| Drag a shape | Moves the shape. |
| Drag on empty canvas | Pans the canvas. |
| Mouse wheel | Zooms. |
| Click a shape, a connection, or a line | Selects it. |
| `Shift`-click, `Ctrl`-click, or `Cmd`-click a shape, a connection, or a line | Adds it to the multi-selection, or removes it. See Section 6B. |
| `Shift`-drag on empty canvas | Draws a selection box. See Section 6B. |
| Double-click a shape or a connection | Opens the label edit dialog. |
| Click a port icon on a shape | Starts a connection from that port. |
| Click a second port icon | Completes the connection. |
| `Delete` or `Backspace` | Deletes the selected item or the whole multi-selection. This is not active when the cursor is in a text field. |
| `Escape` | Cancels connect mode and clears the selection. It also closes dialogs. |

A click on empty canvas must not add a shape in these cases: the user dragged, the click cancelled connect mode, the click ended a selection box, or the drag started on a shape, icon, or note. The function `onSvgMouseDownCapture` records where the gesture started. It runs in the capture phase. Do not move this logic to the bubble phase.

### 6.3 Dialogs

The application has four modal dialogs. They use the CSS classes `modal-overlay` and `modal-box`.

| Dialog | Open state | Purpose |
|---|---|---|
| Reset | `showClearConfirm` | Confirms the reset of the active file. |
| Close file | `closeConfirmDoc` | Confirms the close of a changed file. |
| Label edit | `textDialogTarget` | Edits one label. `Enter` saves. `Escape` cancels. |
| Export | `exportDialog` | Sets the export file name. The kind is `json`, `pptx`, or `png`. `Enter` exports. `Escape` cancels. |

**CAUTION:** Do not use `confirm()`, `alert()` for decisions, or `prompt()` for new features. The user's viewer can block native dialogs without an error. The reset button did not work for this reason in an earlier version. The existing `alert()` calls (empty export, bad import) are known weak points. Replace them with modal dialogs if you change that code.

The function `onKeydown` handles the global keys. It must check each open dialog first and return early.

### 6.4 Properties panel

The panel is on the right. It shows the fields of the selected shape, connection, or line. The user can change the label, fill color, note text, and ports. A line has color, thickness, arrow, and note. The panel also has a delete button. When the user makes a multi-selection, the panel shows the number of items and one delete button.

---

## 6B. Multi-selection and delete

### 6B.1 Use

| Action | Result |
|---|---|
| `Shift`-click an item | Adds the item to the multi-selection. The item that was selected before becomes part of it. |
| `Shift`-click an item that is in the multi-selection | Removes that item. |
| `Shift`-drag on empty canvas | Draws a selection box. When the user releases the button, the box adds the items that it touches. |
| Click the Delete button in the panel, or press `Delete` or `Backspace` | Deletes all selected items. |
| `Escape`, or a plain click on an item or on empty canvas | Clears the multi-selection. |

`Ctrl` and `Cmd` do the same as `Shift`. A selected item has a dashed outline (shape), an orange line (connection), or a halo (line).

The selection box touches a shape when the box and the shape rectangle overlap. It touches a line when the box contains a point of the line. It touches a connection when the box contains the middle of the connection, or when both of its shapes are selected.

Multi-selection works only in `select` mode. In a tool mode, `Shift` has no effect on selection.

### 6B.2 How it works

1. `onShapeMouseDown`, `onConnMouseDown`, and `onLineMouseDown` call `toggleMulti` when the user holds `Shift`, `Ctrl`, or `Cmd`. They do not start a drag.
2. `seedMulti` moves the single selection into `multi`. This is how the first click and the second click make one set.
3. `onSvgMouseDown` starts the selection box when the user holds `Shift` on empty canvas. It sets `clickState.wasConnectCancel` so that the click that follows does not add a rectangle.
4. `onMouseMove` updates `marquee`. `onMouseUp` calls `finishMarquee`. The function ignores a box that is smaller than 3 units.
5. `selectShape`, `selectConnection`, `selectLine`, and `clearSelection` call `clearMulti`. A single selection and a multi-selection cannot exist together.
6. `deleteMulti` removes the connections first, then the shapes, then the lines. `removeShape` also removes the connections of the shape. The other remove functions ignore an id that does not exist.

A multi-selection does not move together. The user cannot drag it. Only delete is available.

---

## 7. Connections and routing

### 7.1 Edge style

The global value `edgeStyle` sets the drawing mode for all connections.

- `elbow`: The line uses horizontal and vertical segments. It starts and ends at the ports.
- `point`: The line is straight. It goes from the center of one shape to the center of the other shape. The line stops at the boundary of each shape. The application ignores the ports.

### 7.2 Elbow routing

The function `connRoute` calculates the route. It handles all four port combinations:
`end→start`, `end→end`, `start→start`, and `start→end`.

When two ports are on the same side, the line goes around that side.

The function `portPoint` returns the point of a port. The function `boundaryPoint` returns the point where a line meets the edge of a shape. The function `connPath` returns the SVG path. The function `connMid` returns the middle of the connection. The label and the note anchor use that middle point.

---

## 6A. Resizing shapes

### 6A.1 Use

When the user selects a shape in `select` mode, seven square handles show on it. Handles are hidden in the `connect`, `line`, and `draw` modes.

| Handle | Position | Effect |
|---|---|---|
| `nw`, `sw`, `se` | Corners | Change width and height. |
| `n`, `s` | Middle of top and bottom edge | Change height. |
| `w`, `e` | Left and right edge, 80% down | Change width. |

There is no handle at the top-right corner or at the middle of the left and right edges. The note icon and the two connection ports are in those places.

The edge or corner that is opposite to the handle does not move. Hold `Shift` on a corner handle to keep the width-to-height ratio. The minimum size is 40 × 30. The user can also type a width and a height in the properties panel. The panel clamps the values to the minimum.

### 6A.2 How it works

`resizeHandles` lists the handles. Each has `ax` and `ay` (-1, 0, or 1) that show which sides it moves. `onResizeHandleDown` stores the start state in the `resizing` object. `applyResize` calculates the new `x`, `y`, `w`, and `h` from the start state and the pointer. It does not add to the previous value, so there is no drift.

All geometry reads `w` and `h` from the shape: ports, connection routing, note anchor, auto-arrange spacing, and PowerPoint export. No other code changes when a shape changes size. A circle is drawn as an ellipse.

**CAUTION:** A drag ends when the pointer leaves the canvas. This is the same for all drags (`mouseleave` calls `onMouseUp`).

---

## 7A. Lines and freehand drawing

### 7A.1 Use

| Action | Result |
|---|---|
| Click the Line button | Sets `mode` to `line`. Click the button again to go back to `select`. |
| Click the Draw button | Sets `mode` to `draw`. |
| Drag on the canvas in a tool mode | Draws a stroke. The tool stays on after the stroke. |
| Hold `Shift` while the user draws or drags an end | Snaps the angle to a multiple of 45 degrees. |
| `Escape` | Cancels a stroke that is in progress. Sets `mode` to `select`. |
| Click a line in `select` mode | Selects the line. The panel shows color, thickness, arrow, and note. |
| Drag a selected line | Moves the line. |
| Drag a round handle of a selected straight line | Moves one end of the line. |
| Click the note icon of a line | Opens or closes the note card of the line. |
| `Delete` | Deletes the selected line. |

A click without a drag in a tool mode does not make a line. It also does not add a rectangle.

**NOTE:** In a tool mode, a press on an existing line starts a new stroke. It does not select the line. The user must press `Escape` first.

### 7A.2 How it works

1. `onSvgMouseDownCapture` starts a stroke when `mode` is `line` or `draw`. It calls `stopPropagation`. Shapes, connections, and the pan handler do not receive the event. A drag that starts on a shape draws a line and does not move the shape.
2. `onMouseMove` adds to `drawing.points`. For `line`, the second point follows the pointer. For `draw`, a point is added when the pointer moves at least 2 screen pixels.
3. `onMouseUp` calls `commitDrawing`. The function rounds the points to 0.1. For a freehand stroke, it removes points with the Ramer–Douglas–Peucker method (tolerance 1.2 canvas units). It does not make a line when the stroke is shorter than 3 units. It selects the new line.
4. `linePath` makes the SVG path. A freehand path uses quadratic curves through the midpoints of the points, so it looks smooth. The curve does not pass through the inner points.
5. For a straight line with an arrow, `arrowGeom` calculates the arrow head. The arrow head is a polygon. `linePath` ends the line at the base of the head. Do not use SVG markers for this arrow. A marker cannot take the color of the line in all browsers.
6. `lineMid` finds the middle of a line along its points. The note icon and the note tether use it. See Section 8.

The lines layer is drawn after the shapes and before the notes. Each line has a wide transparent path (`line-hit`) so the user can click it easily.

**CAUTION:** `line-hit` must keep `vector-effect:non-scaling-stroke`. With this property the click area is 14 screen pixels at all zoom levels. Without it, the click area shrinks with the zoom. At zoom 0.31 it was only about 4 pixels wide, and thin lines could not be selected (change step 19).

### 7A.3 Export

- JSON: lines are in the `lines` array. The note fields are included.
- PowerPoint: each line becomes PowerPoint line shapes with the same color. The thickness is `width × scale × 72` points (minimum 0.75). A freehand drawing is a chain of short lines. An arrow is on the last segment of a straight line. The lines are in the bounding box that sets the slide scale. A diagram with lines and no shapes can be exported. Notes are not included.

---

## 8. Notes

Each shape and each connection has a note icon. A line has a note icon when the line is selected, has note text, or has its note open. When the user clicks the icon, the function `toggleNote` opens or closes the note card.

When a note opens for the first time, the offset is set to `(26, -40)`.

The anchor of a shape note is the top-right corner of the shape. The anchor of a connection note is the middle of the connection, 17 units lower. The anchor of a line note is the middle of the line along its points (`lineMid`), 17 units lower. `noteAnchor` tells the three types apart: a shape has `type`, a line has `points`, a connection has neither.

The user can drag a note card. The function `onNoteBoxMouseDown` starts the drag. The note text area stops key events from reaching the global key handler. `Escape` removes the focus from the text area.

The panel of a line also has a Note field. It edits the same `note` text as the card.

PowerPoint export does not include notes. JSON export includes them.

---

## 9. Import and export

### 9.1 JSON format

```
{
  "shapes": [ ... ],
  "connections": [ ... ],
  "lines": [ ... ],
  "edgeStyle": "elbow"
}
```

`getState()` returns this object. `loadState(data)` reads it. `loadState` also sets the id counters. It sets each counter to the highest used number plus one. `loadState` accepts a partial object.

### 9.2 Import

The user clicks the upload button. A hidden file input (`accept="application/json"`, `multiple`) opens. The user can choose one or more files.

The function `importJSON` reads each file. Each valid file becomes a file (tab) in the application. The first valid file becomes the active file. The other files open in the background.

The application shows one alert that lists the files that it could not read. It still opens the valid files.

A file is not valid when it is not JSON, or when its top level is not an object.

### 9.3 Export

The export buttons do not download at once. They open the export dialog.

1. The dialog shows an input with a proposed name.
2. When a file was imported, the proposed name is the imported name without its extension. Example: `My Plan v2.json` gives `My Plan v2`.
3. When no file was imported, the proposed name is `diagram`.
4. The extension (`.json`, `.pptx`, or `.png`) shows next to the input. The application adds it. If the user types the extension, the application removes the duplicate.
5. The function `cleanExportName` removes these characters: `\ / : * ? " < > |` and control characters. An empty name becomes `diagram`.

After a JSON export, the active file gets the exported name. The tab shows the new name. The file is no longer changed. A PowerPoint export does not change the file.

A PNG export does not change the file.

PowerPoint export and PNG export need at least one shape or line. If the canvas is empty, the application shows an alert and does not open the dialog.

### 9.4 PowerPoint export

The function `exportPPTX(name)` uses PptxGenJS.

- Each shape becomes a native PowerPoint shape (rectangle, ellipse, or diamond) with a centered label.
- Each connection becomes one or more PowerPoint lines with an arrowhead on the last line. The style (elbow or point) follows the current `edgeStyle`.
- Each line becomes PowerPoint lines. See Section 7A.3.
- The diagram is scaled to fit one slide.
- Notes are not included.

**CAUTION:** Observe these two rules. Each rule comes from a real fault.

1. Embed `pptxgen.bundle.js`. Do not embed `pptxgen.min.js`. The minified file does not include JSZip. It causes `ReferenceError: JSZip is not defined`.
2. Use `pptx.ShapeType` (the instance). Do not use `PptxGenJS.ShapeType` (the constructor). The constructor does not have this property. This causes `Cannot read properties of undefined (reading 'rect')`.

### 9.5 PNG export

The function `exportPNG(name)` makes one PNG image of the whole diagram.

- It draws on a `<canvas>` from the data model. It does not use the SVG.
- It uses `connRoute`, `connRoutePointToPoint`, `connMid`, and `arrowGeom`. The image matches the canvas.
- It draws connections with arrowheads and labels, then shapes with centered wrapped labels, then lines and freehand drawings.
- It draws each open note (`noteOpen`) last, with its dotted tether line. It uses `noteAnchor`, `notePos`, `NOTE_W`, and `NOTE_H`. The card shows the title and the note text. The text wraps and is clipped to the card. The bounding box includes the open notes.
- It does not draw closed notes, ports, handles, or selection marks.
- The constants are `PNG_PAD` (40 units of padding), `PNG_SCALE` (2), and `PNG_MAX_SIDE` (8000 pixels). The scale goes down when a side would be larger than the maximum.
- The background is `#EAEFEC`. The font is IBM Plex Sans, then Arial.
- The function downloads the file with `canvas.toBlob`.

**CAUTION:** Do not make the image from the live SVG. The SVG has `foreignObject` labels, CSS variables, and web fonts. The browser can taint or blank the canvas.

---

## 9A. Multiple files (tabs)

### 9A.1 General

The application can hold many files. Each file has its own shapes, connections, lines, line style, and pan and zoom. The user switches between files with the tabs. Changes stay in a file when the user switches away.

### 9A.2 How it works

The live arrays `shapes`, `connections`, and `lines` and the object `viewport` always belong to the active file. They are not copied per file while the user works.

Each entry in `docs` has these fields:

| Field | Description |
|---|---|
| `id` | `doc_1`, `doc_2`, and so on. |
| `name` | The text on the tab. |
| `fileName` | The imported or exported file name. Empty for an untitled file. |
| `baseline` | A JSON text of the data when the file was opened or last exported. |
| `saved` | `{ state, viewport }`. A copy of the data. It is valid for files that are not active. |

When the user switches files, `switchDoc` does these steps:

1. Copies the live data of the active file into its `saved` field.
2. Sets `activeDocId` to the new file.
3. Calls `applySnapshot`. This cancels all transient interaction state. It loads a deep copy of the saved data. It sets the viewport.

**CAUTION:** `applySnapshot` loads a deep copy. Do not load the objects in `saved` directly. The live arrays would then change the saved data.

### 9A.3 Changed state

The function `docDirty` compares `stateKey` of the current data with `baseline`. For the active file, the current data is `getState()`. For other files, it is `saved.state`. A change to a note (open, close, move) also counts as a change. This is correct because notes are in the JSON file.

### 9A.4 Rules

- The first valid import reuses the active file when it is the only file, it is untitled, and it is not changed. This stops an empty tab from staying behind.
- The user closes a file with the cross on the tab. When the file is changed, the close dialog opens first.
- When the user closes the last file, the application opens a new empty file.
- Names `Untitled`, `Untitled 2`, `Untitled 3`, and so on come from the counter `untitledCount`. The counter never goes down.
- The `+` button opens a new empty file.

---

## 10. Reset

The function `clearAll()` does a full reset. The function `resetAll()` is an alias. The toolbar button asks for confirmation first. `DiagramAPI.resetAll()` and `DiagramAPI.clearAll()` do not ask.

The reset applies to the active file only. Other open files are not changed.

The reset does these actions:

1. Removes all shapes and connections. This also removes all notes.
2. Clears the selection, including the multi-selection.
3. Sets `mode` to `select`. Clears the connection start.
4. Stops a drag, a pan, and a note drag.
5. Closes the label dialog and the export dialog.
6. Clears `importedFileName`. If the file had a name, the tab becomes `Untitled`. The file is then not changed.
7. Sets the viewport to `x=0, y=0, scale=1`.
8. Sets the id counters to 1.

The reset does not change `edgeStyle`. The edge style is a display setting and not data.

The application does not have rows or columns. If the user asks to empty "rows and columns", use the reset.

When the canvas is already empty, the toolbar button does nothing.

---

## 11. Public API

`window.DiagramAPI` is set when the component mounts. It does the same actions as the user interface. Use it in tests.

| Call | Result |
|---|---|
| `addShape(type, opts?)` | Adds a shape. Returns the id. `opts`: `x, y, w, h, label, fill, stroke, note`. |
| `removeShape(id)` | Removes a shape and its connections. |
| `addConnection(fromId, toId, label?, note?, fromPort?, toPort?)` | Adds a connection. Returns the id, or `null` if not allowed. |
| `removeConnection(id)` | Removes a connection. |
| `addLine(x1, y1, x2, y2, opts?)` | Adds a straight line. `opts`: `stroke`, `width`, `arrow`, `note`. Returns the id. |
| `addFreehand(points, opts?)` | Adds a freehand line from `[{ x, y }, ...]`. `opts` is the same as for `addLine`. Returns the id. |
| `removeLine(id)`, `selectLine(id)` | Removes or selects a line. |
| `resizeShape(id, w?, h?)` | Sets the size of a shape. Minimum 40 × 30. |
| `autoArrange()` | Arranges shapes in layers from left to right, by link dependency. |
| `getState()` | Returns a copy of `{ shapes, connections, lines, edgeStyle }`. |
| `loadState(data)` | Replaces the data of the active file. Does not change the file name. |
| `exportJSON(name?)` | Downloads JSON at once. No dialog. |
| `exportPPTX(name?)` | Downloads PowerPoint at once. Returns a promise. No dialog. |
| `exportPNG(name?)` | Downloads PNG at once. No dialog. |
| `resetAll()` / `clearAll()` | Full reset of the active file. No confirmation. |
| `listDocuments()` | Returns `[{ id, name, active, changed }]`. |
| `openDocument(data, name?)` | Opens data as a file and makes it active. Returns the id. |
| `newDocument()` | Opens an empty file and makes it active. Returns the id. |
| `switchDocument(id)` | Makes a file active. |
| `closeDocument(id)` | Closes a file. No confirmation. |
| `selectShape(id)`, `selectConnection(id)`, `clearSelection()` | Selection control. |
| `selectMany({ shapes, connections, lines })` | Makes a multi-selection from lists of ids. An id that does not exist is ignored. |
| `deleteSelected()` | Deletes the selected item, or the whole multi-selection. |
| `setEdgeStyle('elbow' \| 'point')` | Sets the edge style. |

The API help panel in the application lists the same calls. When you change the API, change that text also. It is in the template, in the `aside` element that shows when `showApiDoc` is `true`.

On first load, the application creates a sample diagram of five shapes and four connections. It then clears the selection.

---

## 12. Procedures for a future session

### 12.1 Start

1. Put the application file in `/home/claude/`. See Section 3.2.
2. Use `grep -n` to find the code that you must change. Do not read the whole file. The embedded libraries are very long lines.
3. Read only the lines that you need.

**CAUTION:** Do not run an unrestricted `grep` for common words such as `note`. The embedded libraries match and the output is very large. Search for specific names.

### 12.2 Change the code

1. Make the change with the `Edit` tool.
2. If the template uses a new name, add it to the object that `setup()` returns.
3. If the change is a user action, think about adding it to `DiagramAPI` also.
4. If the change affects the data model, update `getState`, `loadState`, and `cleanLines`.
5. If the change affects a dialog, update `onKeydown`.
6. Update the API help text and this document.

### 12.3 Test

Do all of these tests. Do not trust the code by inspection alone.

**Test 1. Syntax.** Extract each inline `<script>` block. Run `node --check` on each one. All must pass.

**Test 2. Tag balance.** Use the Python `HTMLParser` class. Make sure that all start tags and end tags match. Ignore void elements.

**Test 3. Browser.** Use Playwright with the pre-installed Chromium.

- Do not run `playwright install`.
- Open the file with `file://`.
- Record `pageerror` events. There must be none.
- Do the real action: click, drag, type. Then read `DiagramAPI.getState()` and check the result.
- Expected harmless message: a failed request for `fonts.googleapis.com`. The sandbox blocks it. The application uses a fallback font.

**Test 3A. Line selection at low zoom.** Add a thin line and a freehand drawing. Zoom out to 0.3 with the mouse wheel. Click 4 px and 6 px from each line. The line must be selected.

**Test 3B. Multi-selection.** `Shift`-click two shapes and one line. The panel must show "3 selected". `Shift`-click one shape again. The panel must show "2 selected". Press `Delete`. Check the counts in `getState()`. Then `Shift`-drag a box over the other items. Check that the box shows and that no rectangle is added.

**Test 4. Downloads.** Use `page.waitForEvent('download')`. Check `suggestedFilename()`.

**Test 5. PowerPoint.** Download the file. Unzip it. Check the XML for shape labels and arrowheads. For a visual check, render it with LibreOffice Impress.

**Test 5A. PNG.** Clear the canvas and click the PNG button. An alert must show. Add shapes, connections, a line, and a freehand drawing. Open one note on a shape and one on a connection. Click the PNG button, type a name, and download. Check `suggestedFilename()`, the image size, and the corner pixel (`#EAEFEC`). Open the image and look at it. The open notes must show. Closed notes must not show. Do this for both edge styles.

**Test 6. Icon.** Open the ICO file with Pillow. Make sure that all sizes are present.

### 12.4 Deliver

1. Copy the file to `/mnt/user-data/outputs/`.
2. Write the file to the Project with `project_write`.
3. Send the file with `SendUserFile`.
4. Tell the user what changed in one or two sentences.

---

## 13. Known limits and rules

| Item | Fact |
|---|---|
| Browser storage | `localStorage` is not used. Data exists only while the page is open. This includes all open files. The user must export JSON to keep data. |
| Native dialogs | They can fail in sandboxed viewers. Use modal dialogs. See Section 6.3. |
| Fonts | The page links Google Fonts. Without network, the browser uses fallback fonts. |
| Notes in PowerPoint | Not exported. |
| Notes in PNG | Only open notes are exported. Long note text is clipped to the card. |
| PNG fonts | IBM Plex Sans when the font is available. Otherwise Arial. |
| Parallel connections | Identical connections are refused. A second connection with other ports is allowed. |
| Shape types | Only `rectangle`, `circle`, and `diamond`. |
| Shape size | Minimum 40 × 30. There is no maximum. Labels wrap inside the shape, and a long label can overflow a small shape. |
| Lines | Lines have no labels. Lines have notes. Auto-arrange does not move them. A freehand drawing in PowerPoint is a chain of straight lines and not one curve. |
| Line tools and selection | While the Line or Draw tool is on, a press on a line starts a stroke. The user must press `Escape` to select a line. |
| Note card over a line | An open note card can cover part of a line. The user can drag the card away. |
| Multi-selection | The user can delete a multi-selection. The user cannot move it or change its style as a group. |
| Top bar width | The top bar fits at 1280 pixels. On a narrower window it wraps to a second row. The Line and Draw buttons have icons only. |
| Undo | Not available. The reset warns that it cannot be undone. A delete of a multi-selection cannot be undone. |
| Library size | Vue and PptxGenJS are about 630 KB of the 735 KB. |

---

## 14. Change history

| Step | Change |
|---|---|
| 1 | First version: shapes, connections, API, auto-arrange. |
| 2 | Fixed CDN failure. Libraries are now embedded. |
| 3 | Added connection labels. |
| 4 | Changed notes to draggable canvas cards with a dotted tether line. |
| 5 | Added click-on-empty-canvas to add a rectangle. |
| 6 | Added the panel visibility button. |
| 7 | Fixed the reset button. Replaced `confirm()` with a modal dialog. |
| 8 | Added start and end port icons and four-way elbow routing. |
| 9 | Added the global edge style toggle. |
| 10 | Replaced the inline label editor with a double-click dialog. |
| 11 | Added PowerPoint export. |
| 12 | Renamed the application to Discussion Studio. Made the icon (SVG, PNG, ICO). |
| 13 | Made the reset a full reset. Added `resetAll`. |
| 14 | Added imported file name display. Added the export dialog with an editable name. |
| 15 | Renamed the file to `discussion-studio.html`. Added the page description. |
| 16 | Added multiple files with tabs. Added multi-file import, change tracking, and close confirmation. Replaced the header file name chip with the tabs. |
| 17 | Added Line and Draw tools: straight lines with an optional arrow, freehand drawing, color and thickness, move, end handles, JSON and PowerPoint export. Made the top bar wrap on narrow windows. |
| 18 | Added shape resize handles and width and height fields in the panel. |
| 19 | Fixed lines and drawings that could not be selected at low zoom. The click area of `line-hit` is now constant in screen pixels (`vector-effect:non-scaling-stroke`). |
| 20 | Added notes for lines and freehand drawings: note icon, note card, panel field, `note` option in the API. |
| 21 | Added multi-selection and delete: `Shift`-click, `Shift`-drag selection box, delete button in the panel, `DiagramAPI.selectMany` and `deleteSelected`. |
| 22 | Added PNG export: toolbar button, export dialog kind `png`, `exportPNG`, `DiagramAPI.exportPNG`. |
| 23 | The PNG export includes open notes with their tether lines. |
