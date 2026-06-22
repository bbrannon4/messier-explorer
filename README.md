# Messier Explorer

An interactive web app for exploring all 110 Messier deep-sky objects — on an accurate sky chart, and as a night-by-night observation planner.

**Live:** https://bbrannon4.github.io/messier-explorer/

## Running Locally

The app loads its catalog with `fetch()`, which browsers block on `file://`, so it needs to be served over HTTP. From the project folder:

```bash
python -m http.server 8080
```

Then open http://localhost:8080. (Any static file server works.)

## Features

### Sky Chart
- **Projections**: Switch between equirectangular, Mollweide, and stereographic views
- **Filtering**: Filter by object type, constellation, season, apparent magnitude, and angular size
- **Tonight's Sky**: Shows only the objects currently above the horizon for your location
- **Constellation context**: 15+ major constellations with lines, labels, and bright stars
- **Scale by magnitude**: Optionally size markers by apparent brightness

### Night Planner
- **Timeline view**: A Gantt-style chart of each object's visibility windows across the night, colored by peak altitude, with twilight/night shading
- **Altitude view**: Altitude-over-time curves for the filtered objects
- Sky Chart filters carry over, so you can plan a focused list

### Object Details
- Click any object — on the sky chart, the Timeline, or the Altitude view — for a side panel with a description, image, and Wikipedia data
- **Visibility by month**: A chart showing, for each month, hours the object spends above 20° during astronomical dark plus its max transit altitude, with peak months highlighted

### Location
- Detected automatically on load (with a manual lat/lon fallback), and used consistently across all views

## Data

`Messier_data.csv` contains all 110 Messier objects with coordinates, magnitudes, distances, types, and best viewing seasons.

## Hosting

Served via GitHub Pages from the `main` branch. A `.nojekyll` file disables Jekyll processing since this is a plain static site. Pushes to `main` deploy automatically.

## License

MIT — see LICENSE file for details.
