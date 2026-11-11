# Changelog

## 2026-11-10

- Added: export the canvas as a PNG image. Use the new toolbar button and confirm the file name.
- Added: `DiagramAPI.exportPNG`.
- Added: the PNG export includes open notes, with their dotted lines.

## 2026-11-06

- Added: select many items. Shift-click items, or Shift-drag a box on empty canvas, then delete them together.
- Added: notes for lines and freehand drawings.
- Added: `DiagramAPI.selectMany` and `DiagramAPI.deleteSelected`. `addLine` and `addFreehand` accept a `note` option.
- Fixed: lines and freehand drawings could not be selected when the canvas was zoomed out.
