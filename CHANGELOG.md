# Changelog

## 2026-11-20

- Added: groups. Select shapes and press `Ctrl`/`Cmd`+`G`, or click **Group** in the panel. A connection goes into the group when both of its shapes are selected. Each group has an editable Group ID (unique), a label, a fill, and a note. A group works like a shape: drag it to move its contents, resize it to scale them, connect it to other shapes, copy and paste it, and group it again. Ungroup with `Ctrl`/`Cmd`+`Shift`+`G`. Deleting a group deletes its contents. Groups appear in PNG and PowerPoint exports and in `describe()`. New `DiagramAPI` calls: `group`, `updateGroup`, `ungroup`, `groupSelected`, `ungroupSelected`, `setGroupId`, `findGroup`, `duplicate`.
- Added: WebMCP tools `create_group`, `update_group`, `ungroup`, and `duplicate_items` (now twelve tools). `get_diagram` shows groups (`groupId`, `members`, `connections`) and `inGroup` on shapes inside a group. `ungroup` asks first when it would delete connections drawn to the group. `delete_items` on a group also deletes its contents, and the **Allow delete?** dialog says how many shapes that is.
- Added: copy and paste. Select shapes (one or many, lines too) and press `Ctrl`/`Cmd`+`C`, then `Ctrl`/`Cmd`+`V` to paste a copy offset on the canvas; each further paste steps further. `Ctrl`/`Cmd`+`D` duplicates. Copies keep their size, label, colours, and notes, and connections between copied shapes are copied too. New `DiagramAPI` calls: `copySelected`, `paste`, `duplicateSelected`.

## 2026-11-17

- Changed: elbow connections take the shortest route for their ports. They go around shapes instead of through them, use the gap between two shapes instead of going around both, and no longer lie on top of other connections. Connections into the same port join into one line. PNG and PowerPoint exports use the same routes.
- Added: AI agent support through WebMCP. When the browser or an extension provides WebMCP (`document.modelContext` or `navigator.modelContext`), an AI assistant in the browser can read the diagram, add shapes, connect them, set the connection style (elbow or straight), add notes, draw handwritten shapes, and auto-arrange.
- Added: an **Allow delete?** dialog. When an AI assistant or a script asks to delete items, you see what will be deleted and why, and you choose to allow it or not.
- Added: new `DiagramAPI` calls: `connect`, `setConnectionStyle`, `getConnectionStyle`, `setNote`, `getNote`, `addHandwrittenShape` (sketched rectangle, circle, diamond, triangle, arrow, or underline), `deleteItems`, `describe`, and `registerWebMCP`.
- Changed: `DiagramAPI.addShape` and `DiagramAPI.addFreehand` now reject bad input with a clear error message.

## 2026-11-16

- Added: live sharing. Click Share, enter your name, and send the link. Each person who opens it enters a name and edits the same diagram in real time. The toolbar shows who is here, and the canvas shows each person's pointer. The session lasts while the host's tab is open.
- Changed: the home page presents live sharing: a new spotlight card, a trust-row item, two rows in the How it works table, and an updated privacy note. The Select many card now mentions dragging a selection.
- Added: drag a multi-selection. Drag any selected shape or line to move all selected items together. Connections and notes follow.
- Changed: the JSON, PowerPoint and PNG exports open the system "Save as" dialog, so you can choose the folder and file name. This works in browsers that support it (Chrome, Edge). Other browsers keep the name dialog and download the file.

## 2026-11-13

- Added: resizable notes. Drag the corner grip at the bottom right of a note card. The size is saved with the diagram and used in the PNG export.

## 2026-11-12

- Added: connection types. Click Connect and pick Arrow (default), One to many (crow's foot at the target), or Many to many (crow's feet at both ends).
- Added: a Type switch in the connection panel to change the type of an existing connection.
- Added: crow's feet in the PNG and PowerPoint exports.
- Added: `DiagramAPI.addConnection` takes a `kind` argument. New: `DiagramAPI.setConnectionKind`.
- Added: touch support. One finger drags shapes, lines and the canvas; two fingers pinch to zoom and pan; double-tap edits a label. Small handles get larger touch targets. On narrow screens the side panel opens over the canvas.
- Added: a Select many button on touch devices. Tap items to add or remove them, or drag a box on empty canvas.
- Changed: on narrow screens the toolbar shows icons only. Every button has a tooltip.
- Fixed: on phones the header could slide off the top of the screen (for example after adding a connection) and not come back. The app now fills the visible screen, the page cannot scroll or zoom, text fields no longer trigger the iPhone's automatic zoom.
- Changed: no hints are shown while creating a connection.
- Added: dark mode. Use the moon / sun button in the toolbar. It follows the system setting until you choose.

## 2026-11-10

- Added: export the canvas as a PNG image. Use the new toolbar button and confirm the file name.
- Added: `DiagramAPI.exportPNG`.
- Added: the PNG export includes open notes, with their dotted lines.

## 2026-11-06

- Added: select many items. Shift-click items, or Shift-drag a box on empty canvas, then delete them together.
- Added: notes for lines and freehand drawings.
- Added: `DiagramAPI.selectMany` and `DiagramAPI.deleteSelected`. `addLine` and `addFreehand` accept a `note` option.
- Fixed: lines and freehand drawings could not be selected when the canvas was zoomed out.
