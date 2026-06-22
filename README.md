# Messier Explorer

An interactive web app for exploring all 110 Messier deep-sky objects — on an accurate sky chart, and as a night-by-night observation planner.

**Live:** https://bbrannon4.github.io/messier-explorer/

![Sky chart overview](screenshots/01-sky-chart.png)

## Running Locally

The app loads its catalog with `fetch()`, which browsers block on `file://`, so it needs to be served over HTTP. From the project folder:

```bash
python -m http.server 8080
```

Then open http://localhost:8080. (Any static file server works.)

## Features

### Sky Chart

All 110 Messier objects plotted by right ascension and declination, with 15+ major constellations (lines, labels, and bright stars) for context. Filter by object type, constellation, season, apparent magnitude, and angular size; optionally scale markers by brightness.

**Multiple projections** — switch between equirectangular, Mollweide, and a north-polar stereographic planisphere:

![Stereographic projection](screenshots/02-projection-stereographic.png)

**Tonight's Sky** — enter your location (or let the browser detect it) to show only the objects currently above your horizon:

![Tonight's Sky](screenshots/03-tonights-sky.png)

### Night Planner

Plan a whole night of observing. The Sky Chart filters carry over, so you can narrow to a focused target list.

**Timeline view** — a Gantt-style chart of each object's visibility windows across the night, colored by peak altitude, with twilight and night shading:

![Night Planner timeline](screenshots/04-night-planner-timeline.png)

**Altitude view** — altitude-over-time curves for the filtered objects, so you can see exactly when each one rides highest:

![Night Planner altitude curves](screenshots/05-night-planner-altitude.png)

### Object Details

Click any object — on the sky chart, the Timeline, or the Altitude view — for a side panel with a description, image, and Wikipedia data. It includes a **monthly visibility chart**: for your location, the hours each month the object spends above 20° during astronomical dark (bars) and its max transit altitude (line), with the best months highlighted.

![Object detail panel with monthly visibility chart](screenshots/06-object-detail.png)

## Data

`Messier_data.csv` contains all 110 Messier objects with coordinates, magnitudes, distances, types, and best viewing seasons.

## Hosting

Served via GitHub Pages from the `main` branch. A `.nojekyll` file disables Jekyll processing since this is a plain static site. Pushes to `main` deploy automatically.

## License

MIT — see LICENSE file for details.
