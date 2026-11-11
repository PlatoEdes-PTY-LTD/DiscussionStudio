# Changelog

## 2026-11-12

- Added: connection types. Click Connect and pick Arrow (default), One to many (crow's foot at the target), or Many to many (crow's feet at both ends).
- Added: a Type switch in the connection panel to change the type of an existing connection.
- Added: crow's feet in the PNG and PowerPoint exports.
- Added: `DiagramAPI.addConnection` takes a `kind` argument. New: `DiagramAPI.setConnectionKind`.
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
