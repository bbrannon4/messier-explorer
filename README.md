# Messier Explorer

An interactive web app for exploring the full **NGC + IC** catalog (~13,000 deep-sky objects) — with Messier and Caldwell objects flagged and named — on an accurate sky chart, and as a night-by-night observation planner.

**Try it live:** https://bbrannon4.github.io/messier-explorer/

![Sky chart overview](screenshots/01-sky-chart.png)

---

## How to Use

### 1. Explore the sky chart

The home view plots deep-sky objects by right ascension and declination, over 15+ major constellations with their bright stars labeled. Marker shape and color show the object type (galaxy, nebula, cluster…) — see the legend on the right. To keep things legible, the chart loads capped at a bright magnitude and only labels the Messier, Caldwell, named, and brightest objects; the rest are markers you can hover. If a view gets too crowded, a hint invites you to zoom in or tighten filters.

- **Hover** any object for its name, type, magnitude, and coordinates.
- **Click** an object to open its full detail panel, including all its catalog IDs (see step 5).
- Use the **toggles** along the top bar to show or hide star labels, constellation lines, and constellation names, or to **scale markers by magnitude** so brighter objects appear larger.

### 2. Narrow down what you see

Open the filter cards — **Catalog** (Messier / Caldwell / NGC / IC), **Object Types**, **Constellations**, **Best Viewing** (season), and **Magnitude** — to focus the chart on what you care about. In the Object Types card you can toggle an entire category (Galaxy, Nebula, Cluster, Other) on or off with one click, or pick individual types. Raise the Magnitude cap to reveal fainter objects. Every filter you set here also carries over into the Night Planner, so you can build a target list once and use it everywhere. The count below the toolbar tells you how many objects are currently shown.

### 3. Switch projections

Use the **Projection** buttons to change how the sky is mapped:

- **Equirect** — a simple RA/Dec grid (the default).
- **Mollweide** — an equal-area ellipse showing the whole sky.
- **Stereo** — a north-polar planisphere, the way a star wheel looks.

![Stereographic projection](screenshots/02-projection-stereographic.png)

### 4. See what's up tonight

Flip on **Tonight's Sky** and set your location (the app will try to detect it, or you can type a latitude/longitude into the bar at the top). The chart then shows **only the objects currently above your horizon**, so you can tell at a glance what's actually observable right now.

![Tonight's Sky](screenshots/03-tonights-sky.png)

### 5. Plan a whole night

Switch to the **Night Planner** tab to plan a full evening of observing. It uses your location and the date you pick, and respects the filters from the sky chart.

**Timeline view** lays out each object's visibility window across the night as a horizontal bar — when it clears your minimum altitude and when it drops back below. Bars are colored by peak altitude (how high it gets), and the background is shaded for twilight and full dark. Great for sequencing a session top to bottom.

![Night Planner timeline](screenshots/04-night-planner-timeline.png)

**Altitude view** plots altitude over time for your filtered objects, so you can see exactly when each one rides highest. Best with a handful of targets. Click any line to open that object's details.

![Night Planner altitude curves](screenshots/05-night-planner-altitude.png)

> **Tip:** drag the **Min altitude** slider to set your horizon cutoff (trees, buildings, atmospheric murk). Objects that never clear it for the night drop out of both planner views.

### 6. Dig into a single object

Click any object — on the sky chart, the Timeline, or an Altitude curve — to open its detail panel: a photo, description, and key stats pulled from Wikipedia, plus a **monthly visibility chart** for your location. The bars show how many hours per month the object sits above 20° during astronomical dark, the line tracks its highest altitude, and the **best months are highlighted** — so you know not just *if* you can see it, but *when it's worth waiting for*.

![Object detail panel with monthly visibility chart](screenshots/06-object-detail.png)

---

## Running Locally

The app loads its catalog with `fetch()`, which browsers block on `file://`, so it needs to be served over HTTP. From the project folder:

```bash
python -m http.server 8080
```

Then open http://localhost:8080. (Any static file server works.)

## Data

`catalog.csv` is the shipped catalog: the full NGC + IC (~13,000 objects, Abell excluded) with coordinates, type, magnitude, size, constellation, Messier/Caldwell cross-IDs, common names, and a computed **Best Viewing** season.

It's generated from [OpenNGC](https://github.com/mattiaverga/OpenNGC) (Mattia Verga, CC-BY-SA-4.0) by `data-prep/build_catalog.py`, which trims OpenNGC to the columns the app needs and computes each object's best season from its geometry at 40°N (the same metric as the in-app monthly-visibility chart). To rebuild:

```bash
python3 data-prep/build_catalog.py   # downloads OpenNGC source CSVs if absent
```

## Hosting

Served via GitHub Pages from the `main` branch. A `.nojekyll` file disables Jekyll processing since this is a plain static site. Pushes to `main` deploy automatically.

## License

Application code is MIT — see LICENSE file for details.

The shipped catalog (`catalog.csv`) is derived from [OpenNGC](https://github.com/mattiaverga/OpenNGC) by Mattia Verga and is distributed under [CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/), the same license as the source.
