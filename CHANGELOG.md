# Changelog

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
