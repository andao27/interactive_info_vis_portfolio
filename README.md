# INFO 474: Interactive Info Visualization

An Dao

This repository has been updated to develop and deliver Homework #4 for INTO 474 @ UW, Autumn 2025. See more details in Canvas.

This repo provides a tabbed gallery that lazy-loads p5 sketches (instance-mode) so you can organize multiple sketches in one page without them interfering.

Files & layout
- `index.html` — main page with tabs and per-tab containers.
- `script.js` — tab/sketch loader (lazy-loads scripts, attaches canvases, resizes on tab switches).
- `sketches/sketch1.js`..`sketches/sketch11.js` — sketches in p5 instance mode, registered with the loader.
- `sketches/sketch2.js`, `sketches/sketch3.js`, and `sketches/sketch4.js` are for each student to submit their homework.
- `style.css` — visual styles for the tabs and containers.
- `images/` — place evolution/iteration images here (see `images/README.md`).

Notes for instructors / contributors
- Prefer instance-mode sketches (factory function receiving `p`) and register them with `registerSketch('skN', factory)` so the loader can manage them cleanly.
- If you add sketches, update `SKETCH_SCRIPT_BY_ID` in `script.js` and add a corresponding tab/container in `index.html`.

If you want, I can add a small development task runner or a one-command script to start a local server and automatically open the browser.
