// app.js — Interactive Messier Sky Chart (static version)

// ─── Object styling ───────────────────────────────────────────────────────────

// Object types use OpenNGC's short codes (G, OCl, PN, …). TYPE_INFO maps each
// code to a human label, a broad category (for the grouped Type filter and the
// category master toggles), and a Plotly marker style.
const MARKER_SIZE = 7;
const TYPE_INFO = {
  // Galaxies
  'G':      { label: 'Galaxy',              category: 'Galaxy',  symbol: 'circle',       color: '#FF6B6B' },
  'GPair':  { label: 'Galaxy Pair',         category: 'Galaxy',  symbol: 'circle-open',  color: '#FF8E8E' },
  'GTrpl':  { label: 'Galaxy Triplet',      category: 'Galaxy',  symbol: 'circle-open',  color: '#FFA0A0' },
  'GGroup': { label: 'Galaxy Group',        category: 'Galaxy',  symbol: 'circle-open',  color: '#FFB1B1' },
  // Clusters
  'GCl':    { label: 'Globular Cluster',    category: 'Cluster', symbol: 'star',         color: '#96CEB4' },
  'OCl':    { label: 'Open Cluster',        category: 'Cluster', symbol: 'star-open',    color: '#A8D4C1' },
  'Cl+N':   { label: 'Cluster + Nebula',    category: 'Cluster', symbol: 'star-dot',     color: '#BCDACF' },
  '*Ass':   { label: 'Stellar Association', category: 'Cluster', symbol: 'star-triangle-up-open', color: '#BCDACF' },
  // Nebulae
  'PN':     { label: 'Planetary Nebula',    category: 'Nebula',  symbol: 'square',       color: '#DDA0DD' },
  'HII':    { label: 'H II Region',         category: 'Nebula',  symbol: 'square-open',  color: '#E6B3E6' },
  'EmN':    { label: 'Emission Nebula',     category: 'Nebula',  symbol: 'square',       color: '#E6A8E6' },
  'RfN':    { label: 'Reflection Nebula',   category: 'Nebula',  symbol: 'square-dot',   color: '#C9B3E6' },
  'Neb':    { label: 'Nebula',              category: 'Nebula',  symbol: 'square-dot',   color: '#F0C6F0' },
  'SNR':    { label: 'Supernova Remnant',   category: 'Nebula',  symbol: 'triangle-up',  color: '#C66EC6' },
  'DrkN':   { label: 'Dark Nebula',         category: 'Nebula',  symbol: 'square-open',  color: '#9AA0AA' },
  // Other
  'Ast':    { label: 'Asterism',            category: 'Other',   symbol: 'diamond-open', color: '#FFE074' },
  '*':      { label: 'Star',                category: 'Other',   symbol: 'diamond',      color: '#FFEAA7' },
  '**':     { label: 'Double Star',         category: 'Other',   symbol: 'diamond',      color: '#FFEAA7' },
  '***':    { label: 'Triple Star',         category: 'Other',   symbol: 'diamond',      color: '#FFEAA7' },
  'Nova':   { label: 'Nova',                category: 'Other',   symbol: 'diamond',      color: '#FFD166' },
  'Dup':    { label: 'Duplicate',           category: 'Other',   symbol: 'diamond',      color: '#CCCCCC' },
  'Other':  { label: 'Other',               category: 'Other',   symbol: 'diamond',      color: '#FFEAA7' },
};
const TYPE_FALLBACK = { label: 'Other', category: 'Other', symbol: 'diamond', color: '#FFEAA7' };

function typeInfo(code)      { return TYPE_INFO[code] || TYPE_FALLBACK; }
function typeLabel(code)     { return typeInfo(code).label; }
function getObjectStyle(code) {
  const t = typeInfo(code);
  return { symbol: t.symbol, color: t.color, size: MARKER_SIZE };
}
function classifyObjectType(code) { return typeInfo(code).category; }

// Broad category for a human-readable Type label (used when grouping the Type
// filter, whose values are labels rather than codes).
const LABEL_TO_CATEGORY = Object.fromEntries(
  Object.values(TYPE_INFO).map(t => [t.label, t.category])
);
function categoryOfLabel(label) { return LABEL_TO_CATEGORY[label] || 'Other'; }

// ─── Star data ────────────────────────────────────────────────────────────────
// [name, ra_deg, dec_deg, magnitude, constellation]

const BRIGHT_STARS = [
  ['Sirius',      101.287, -16.716, -1.46, 'Canis Major'],
  ['Canopus',      95.988, -52.696, -0.74, 'Carina'],
  ['Arcturus',    213.915,  19.182, -0.05, 'Boötes'],
  ['Vega',        279.23,   38.78,   0.03, 'Lyra'],
  ['Capella',      79.172,  45.998,  0.08, 'Auriga'],
  ['Rigel',        78.63,   -8.2,    0.13, 'Orion'],
  ['Procyon',     114.826,   5.225,  0.38, 'Canis Minor'],
  ['Betelgeuse',   88.79,    7.4,    0.50, 'Orion'],
  ['Altair',      297.70,    8.87,   0.77, 'Aquila'],
  ['Aldebaran',    68.980,  16.509,  0.85, 'Taurus'],
  ['Antares',     247.352, -26.296,  1.09, 'Scorpius'],
  ['Spica',       201.30,  -11.16,   1.04, 'Virgo'],
  ['Pollux',      116.329,  28.026,  1.14, 'Gemini'],
  ['Fomalhaut',   344.413, -29.622,  1.16, 'Piscis Austrinus'],
  ['Deneb',       310.36,   45.28,   1.25, 'Cygnus'],
  ['Regulus',     152.09,   11.97,   1.35, 'Leo'],
  ['Polaris',     217.96,   82.04,   2.02, 'Ursa Minor'],
  ['Alnitak',      84.05,    1.2,    1.77, 'Orion'],
  ['Alnilam',      83.82,   -0.3,    1.69, 'Orion'],
  ['Mintaka',      82.06,   -1.2,    2.23, 'Orion'],
  ['Bellatrix',    85.19,    6.3,    1.64, 'Orion'],
  ['Saiph',        81.28,   -9.7,    2.06, 'Orion'],
  ['Dubhe',       165.93,   61.75,   1.79, 'Ursa Major'],
  ['Merak',       183.86,   57.03,   2.37, 'Ursa Major'],
  ['Phecda',      178.46,   53.69,   2.44, 'Ursa Major'],
  ['Megrez',      179.68,   57.06,   3.31, 'Ursa Major'],
  ['Alioth',      193.51,   53.69,   1.77, 'Ursa Major'],
  ['Mizar',       210.96,   49.31,   2.04, 'Ursa Major'],
  ['Alkaid',      230.18,   44.49,   1.86, 'Ursa Major'],
  ['Muscida',     168.53,   69.83,   3.35, 'Ursa Major'],
  ['Tania Australis', 169.62, 47.78, 3.06, 'Ursa Major'],
  ['Tania Borealis',  178.46, 47.16, 3.45, 'Ursa Major'],
  ['Kochab',      230.18,   77.79,   2.08, 'Ursa Minor'],
  ['Pherkad',     236.07,   74.16,   3.05, 'Ursa Minor'],
  ['Gamma UMi',   241.36,   75.76,   3.05, 'Ursa Minor'],
  ['Caph',         14.18,   60.72,   2.27, 'Cassiopeia'],
  ['Schedar',      21.45,   59.15,   2.23, 'Cassiopeia'],
  ['Gamma Cas',    28.60,   63.67,   2.47, 'Cassiopeia'],
  ['Ruchbah',      35.84,   56.54,   2.68, 'Cassiopeia'],
  ['Segin',        51.23,   57.81,   3.38, 'Cassiopeia'],
  ['Kaus Australis', 276.04, -25.42, 1.85, 'Sagittarius'],
  ['Kaus Media',     279.23, -21.02, 2.70, 'Sagittarius'],
  ['Kaus Borealis',  284.74, -18.95, 2.81, 'Sagittarius'],
  ['Alnasl',         290.97, -26.30, 2.98, 'Sagittarius'],
  ['Ascella',        295.42, -29.83, 2.60, 'Sagittarius'],
  ['Nunki',          298.96, -21.06, 2.05, 'Sagittarius'],
  ['Phi Sgr',        289.13, -30.42, 3.17, 'Sagittarius'],
  ['Tau Sgr',        310.36, -15.25, 3.32, 'Sagittarius'],
  ['Arkab Prior',    270.60, -34.38, 3.97, 'Sagittarius'],
  ['Arkab Posterior',271.45, -36.76, 4.27, 'Sagittarius'],
  ['Eltanin',     279.23,   51.49,   2.23, 'Draco'],
  ['Rastaban',    268.38,   52.30,   2.79, 'Draco'],
  ['Grumium',     263.05,   56.87,   3.65, 'Draco'],
  ['Albireo',     296.24,   27.96,   3.18, 'Cygnus'],
  ['Sadr',        305.56,   50.22,   2.20, 'Cygnus'],
  ['Gienah Cyg',  327.96,   45.13,   2.46, 'Cygnus'],
  ['Delta Cyg',   292.68,   40.26,   2.87, 'Cygnus'],
  ['Eta Leo',     154.99,   20.52,   3.49, 'Leo'],
  ['Algieba',     165.42,   23.77,   2.28, 'Leo'],
  ['Zeta Leo',    168.67,   26.01,   3.44, 'Leo'],
  ['Mu Leo',      170.28,   23.42,   3.88, 'Leo'],
  ['Adhafera',    177.26,   20.52,   3.43, 'Leo'],
  ['Zosma',       168.53,   14.57,   2.56, 'Leo'],
  ['Chertan',     165.11,    2.30,   3.33, 'Leo'],
  ['Zavijava',    190.42,    1.45,   3.38, 'Virgo'],
  ['Vindemiatrix',177.68,   14.57,   2.85, 'Virgo'],
  ['Porrima',     169.62,    8.56,   2.74, 'Virgo'],
  ['Heze',        195.54,   10.96,   3.38, 'Virgo'],
  ['Tau Vir',     176.51,    5.66,   4.28, 'Virgo'],
  ['Alpheratz',    10.90,   46.00,   2.06, 'Andromeda'],
  ['Mirach',       17.43,   35.62,   2.05, 'Andromeda'],
  ['Almach',       28.27,   42.33,   2.26, 'Andromeda'],
  ['Delta And',    23.06,   30.29,   3.27, 'Andromeda'],
  ['51 And',       32.31,   39.24,   3.57, 'Andromeda'],
  ['Castor',      113.65,   31.89,   1.59, 'Gemini'],
];

BRIGHT_STARS.sort((a, b) => a[3] - b[3]);

// ─── Constellation lines ──────────────────────────────────────────────────────
// Each polyline is an array of [ra_deg, dec_deg] points.

const CONSTELLATION_LINES = {
  'Orion': {
    lines: [
      [[84.05,1.2],[83.82,-0.3],[82.06,-1.2]],
      [[88.79,7.4],[84.05,1.2]],
      [[88.79,7.4],[83.82,-0.3]],
      [[78.63,-8.2],[82.06,-1.2]],
      [[78.63,-8.2],[83.82,-0.3]],
      [[85.19,6.3],[88.79,7.4]],
      [[85.19,6.3],[84.05,1.2]],
      [[78.63,-8.2],[81.28,-9.7]],
      [[83.82,-0.3],[83.86,-5.9]],
      [[83.86,-5.9],[84.01,-6.0]],
    ],
    labelPos: [83.5, -1.0],
    messierObjects: ['M42','M43','M78'],
  },
  'Ursa Major': {
    lines: [
      [[165.93,61.75],[183.86,57.03]],
      [[183.86,57.03],[178.46,53.69]],
      [[178.46,53.69],[179.68,57.06]],
      [[179.68,57.06],[165.93,61.75]],
      [[179.68,57.06],[193.51,53.69]],
      [[193.51,53.69],[210.96,49.31]],
      [[210.96,49.31],[230.18,44.49]],
      [[165.93,61.75],[168.53,69.83]],
      [[178.46,53.69],[169.62,47.78]],
      [[169.62,47.78],[178.46,47.16]],
    ],
    labelPos: [190.0, 55.0],
    messierObjects: ['M81','M82','M97','M101','M108','M109'],
  },
  'Ursa Minor': {
    lines: [
      [[217.96,82.04],[230.18,77.79]],
      [[230.18,77.79],[236.07,74.16]],
      [[236.07,74.16],[241.36,75.76]],
      [[241.36,75.76],[217.96,82.04]],
      [[241.36,75.76],[275.95,71.83]],
      [[275.95,71.83],[315.40,74.09]],
      [[315.40,74.09],[335.95,70.26]],
    ],
    labelPos: [250.0, 76.0],
    messierObjects: [],
  },
  'Draco': {
    lines: [
      [[279.23,51.49],[268.38,52.30]],
      [[268.38,52.30],[263.05,56.87]],
      [[263.05,56.87],[279.23,51.49]],
      [[268.38,52.30],[258.24,61.84]],
      [[258.24,61.84],[238.02,70.27]],
      [[238.02,70.27],[211.06,64.38]],
      [[211.06,64.38],[206.89,59.01]],
      [[206.89,59.01],[186.32,51.49]],
      [[186.32,51.49],[159.18,58.97]],
      [[211.06,64.38],[209.95,64.38]],
      [[279.23,51.49],[285.21,67.66]],
    ],
    labelPos: [220.0, 60.0],
    messierObjects: [],
  },
  'Sagittarius': {
    lines: [
      [[276.04,-25.42],[279.23,-21.02]],
      [[279.23,-21.02],[284.74,-18.95]],
      [[284.74,-18.95],[290.97,-26.30]],
      [[290.97,-26.30],[295.42,-29.83]],
      [[295.42,-29.83],[289.13,-30.42]],
      [[289.13,-30.42],[276.04,-25.42]],
      [[284.74,-18.95],[298.96,-21.06]],
      [[298.96,-21.06],[310.36,-15.25]],
      [[276.04,-25.42],[270.60,-34.38]],
      [[270.60,-34.38],[271.45,-36.76]],
    ],
    labelPos: [285.0, -25.0],
    messierObjects: ['M8','M17','M18','M20','M21','M22','M23','M24','M25','M28'],
  },
  'Andromeda': {
    lines: [
      [[10.90,46.00],[17.43,35.62]],
      [[17.43,35.62],[28.27,42.33]],
      [[10.90,46.00],[23.06,30.29]],
      [[23.06,30.29],[17.43,35.62]],
      [[28.27,42.33],[32.31,39.24]],
    ],
    labelPos: [20.0, 38.0],
    messierObjects: ['M31','M32','M110'],
  },
  'Virgo': {
    lines: [
      [[201.30,-11.16],[190.42,1.45]],
      [[190.42,1.45],[177.68,14.57]],
      [[177.68,14.57],[169.62,8.56]],
      [[169.62,8.56],[176.51,5.66]],
      [[190.42,1.45],[195.54,10.96]],
      [[195.54,10.96],[213.92,19.18]],
    ],
    labelPos: [185.0, 5.0],
    messierObjects: ['M49','M58','M59','M60','M61','M84','M86','M87','M89','M90','M104'],
  },
  'Cassiopeia': {
    lines: [
      [[14.18,60.72],[21.45,59.15]],
      [[21.45,59.15],[28.60,63.67]],
      [[28.60,63.67],[35.84,56.54]],
      [[35.84,56.54],[51.23,57.81]],
    ],
    labelPos: [30.0, 59.0],
    messierObjects: ['M52','M103'],
  },
  'Leo': {
    lines: [
      [[152.09,11.97],[154.99,20.52]],
      [[154.99,20.52],[165.42,23.77]],
      [[165.42,23.77],[168.67,26.01]],
      [[168.67,26.01],[170.28,23.42]],
      [[170.28,23.42],[165.42,23.77]],
      [[177.26,20.52],[168.53,14.57]],
      [[168.53,14.57],[165.11,2.30]],
      [[165.11,2.30],[177.26,20.52]],
      [[165.42,23.77],[168.53,14.57]],
      [[152.09,11.97],[165.11,2.30]],
    ],
    labelPos: [165.0, 15.0],
    messierObjects: ['M65','M66','M95','M96','M105'],
  },
  'Cygnus': {
    lines: [
      [[327.96,45.13],[310.36,45.28]],
      [[310.36,45.28],[292.68,40.26]],
      [[296.24,27.96],[310.36,45.28]],
      [[310.36,45.28],[305.56,50.22]],
    ],
    labelPos: [310.0, 40.0],
    messierObjects: ['M29','M39'],
  },
  'Summer Triangle': {
    lines: [
      [[279.23,38.78],[297.70,8.87]],
      [[297.70,8.87],[310.36,45.28]],
      [[310.36,45.28],[279.23,38.78]],
    ],
    labelPos: [295.0, 30.0],
    messierObjects: ['M27','M56','M57','M71'],
  },
};

// ─── Projection math ──────────────────────────────────────────────────────────

let currentProjection = 'equirectangular';

// Mollweide: whole-sky equal-area ellipse, centered at RA=180° (12h)
function solveMollweideTheta(decRad) {
  // Newton's method for: 2θ + sin(2θ) = π·sin(φ)
  const target = Math.PI * Math.sin(decRad);
  let theta = decRad;
  for (let i = 0; i < 10; i++) {
    const denom = 2 + 2 * Math.cos(2 * theta);
    if (Math.abs(denom) < 1e-9) break;
    theta -= (2 * theta + Math.sin(2 * theta) - target) / denom;
  }
  return theta;
}

function projectMollweide(ra, dec) {
  const decR = dec * Math.PI / 180;
  const theta = solveMollweideTheta(decR);
  // Offset from central meridian (RA=180°), wrapped to [-180, 180]
  let dra = ra - 180;
  if (dra > 180)  dra -= 360;
  if (dra < -180) dra += 360;
  const lambda = dra * Math.PI / 180;
  // Negate x so east (increasing RA) goes left — standard sky-chart convention
  return {
    x: -(2 * Math.SQRT2 / Math.PI) * lambda * Math.cos(theta),
    y:   Math.SQRT2 * Math.sin(theta),
  };
}

// Stereographic: north-polar planisphere view
// North pole at center; RA=0h at top; east (increasing RA) goes left
function projectStereographic(ra, dec) {
  const raR  = ra  * Math.PI / 180;
  const decR = dec * Math.PI / 180;
  const r = 2 * Math.cos(decR) / (1 + Math.sin(decR));
  return {
    x: -r * Math.sin(raR),
    y:  r * Math.cos(raR),
  };
}

function projectPoint(ra, dec) {
  if (currentProjection === 'mollweide')     return projectMollweide(ra, dec);
  if (currentProjection === 'stereographic') return projectStereographic(ra, dec);
  return { x: ra, y: dec };
}

// Project a polyline, subdividing segments so curves render smoothly
function projectPolyline(polyline) {
  if (currentProjection === 'equirectangular') {
    return { x: polyline.map(p => p[0]), y: polyline.map(p => p[1]) };
  }
  const x = [], y = [];
  for (let i = 0; i < polyline.length; i++) {
    const [ra1, dec1] = polyline[i];
    if (i === 0) {
      const p = projectPoint(ra1, dec1);
      x.push(p.x); y.push(p.y);
      continue;
    }
    const [ra0, dec0] = polyline[i - 1];
    const span = Math.max(Math.abs(ra1 - ra0), Math.abs(dec1 - dec0));
    const n = Math.max(5, Math.ceil(span / 4));
    for (let j = 1; j <= n; j++) {
      const t = j / n;
      const p = projectPoint(ra0 + t * (ra1 - ra0), dec0 + t * (dec1 - dec0));
      x.push(p.x); y.push(p.y);
    }
  }
  return { x, y };
}

// ─── Reference grid traces ────────────────────────────────────────────────────

function buildGridTraces() {
  if (currentProjection === 'equirectangular') return [];

  const traces = [];
  const faint  = { color: 'rgba(128,128,128,0.28)', width: 1 };
  const medium = { color: 'rgba(160,160,160,0.45)', width: 1.5 };

  if (currentProjection === 'mollweide') {
    // Outer ellipse boundary
    const bt = Array.from({ length: 201 }, (_, i) => 2 * Math.PI * i / 200);
    traces.push({
      type: 'scatter',
      x: bt.map(t => 2 * Math.SQRT2 * Math.cos(t)),
      y: bt.map(t =>     Math.SQRT2 * Math.sin(t)),
      mode: 'lines', line: { color: 'rgba(200,200,200,0.5)', width: 1.5 },
      showlegend: false, hoverinfo: 'skip',
    });

    // Dec parallels
    const raArr = Array.from({ length: 361 }, (_, i) => i);
    for (const dec of [-60, -30, 0, 30, 60]) {
      const pts = raArr.map(ra => projectMollweide(ra, dec));
      traces.push({
        type: 'scatter', x: pts.map(p => p.x), y: pts.map(p => p.y),
        mode: 'lines', line: dec === 0 ? medium : faint,
        showlegend: false, hoverinfo: 'skip',
      });
    }

    // RA meridians
    const decArr = Array.from({ length: 181 }, (_, i) => -90 + i);
    for (let ra = 0; ra < 360; ra += 30) {
      const pts = decArr.map(dec => projectMollweide(ra, dec));
      traces.push({
        type: 'scatter', x: pts.map(p => p.x), y: pts.map(p => p.y),
        mode: 'lines', line: { color: 'rgba(128,128,128,0.18)', width: 1 },
        showlegend: false, hoverinfo: 'skip',
      });
    }

    // RA labels along the equator (slightly below so they don't overlap stars)
    const raLabels = Array.from({ length: 12 }, (_, i) => i * 30);
    const raPts = raLabels.map(ra => projectMollweide(ra, -8));
    traces.push({
      type: 'scatter', x: raPts.map(p => p.x), y: raPts.map(p => p.y),
      mode: 'text', text: raLabels.map(ra => `${ra}°`),
      textfont: { size: 9, color: 'rgba(170,170,170,0.75)', family: 'Arial, Helvetica, sans-serif' },
      showlegend: false, hoverinfo: 'skip',
    });

    // Dec labels on the central meridian
    const decLabels = [-60, -30, 30, 60];
    const decPts = decLabels.map(dec => projectMollweide(183, dec));
    traces.push({
      type: 'scatter', x: decPts.map(p => p.x), y: decPts.map(p => p.y),
      mode: 'text', text: decLabels.map(d => `${d > 0 ? '+' : ''}${d}°`),
      textfont: { size: 9, color: 'rgba(170,170,170,0.75)', family: 'Arial, Helvetica, sans-serif' },
      showlegend: false, hoverinfo: 'skip',
    });

  } else { // stereographic
    // Dec circles at 60°, 30°, 0°, -30°
    const ct = Array.from({ length: 361 }, (_, i) => i * Math.PI / 180);
    for (const dec of [60, 30, 0, -30]) {
      const decR = dec * Math.PI / 180;
      const r = 2 * Math.cos(decR) / (1 + Math.sin(decR));
      traces.push({
        type: 'scatter',
        x: ct.map(t => r * Math.cos(t)),
        y: ct.map(t => r * Math.sin(t)),
        mode: 'lines', line: dec === 0 ? medium : faint,
        showlegend: false, hoverinfo: 'skip',
      });
    }

    // RA spokes to ~Dec -65°
    const decR65  = -65 * Math.PI / 180;
    const rOuter  = 2 * Math.cos(decR65) / (1 + Math.sin(decR65));
    for (let ra = 0; ra < 360; ra += 30) {
      const raR = ra * Math.PI / 180;
      traces.push({
        type: 'scatter',
        x: [0, -rOuter * Math.sin(raR)],
        y: [0,  rOuter * Math.cos(raR)],
        mode: 'lines', line: { color: 'rgba(128,128,128,0.2)', width: 1 },
        showlegend: false, hoverinfo: 'skip',
      });
    }

    // Dec circle labels at RA=270° (right side: x=r, y=0)
    for (const dec of [60, 30, 0, -30]) {
      const decR = dec * Math.PI / 180;
      const r = 2 * Math.cos(decR) / (1 + Math.sin(decR));
      traces.push({
        type: 'scatter', x: [r + 0.22], y: [0.1],
        mode: 'text', text: [`${dec > 0 ? '+' : ''}${dec}°`],
        textfont: { size: 9, color: 'rgba(170,170,170,0.75)', family: 'Arial, Helvetica, sans-serif' },
        showlegend: false, hoverinfo: 'skip',
      });
    }

    // RA hour labels around outer ring
    const rLabel = rOuter + 0.7;
    const raHours = [0, 3, 6, 9, 12, 15, 18, 21];
    traces.push({
      type: 'scatter',
      x: raHours.map(h => -rLabel * Math.sin(h * 15 * Math.PI / 180)),
      y: raHours.map(h =>  rLabel * Math.cos(h * 15 * Math.PI / 180)),
      mode: 'text', text: raHours.map(h => `${h}h`),
      textfont: { size: 10, color: 'rgba(180,180,180,0.85)', family: 'Arial, Helvetica, sans-serif' },
      showlegend: false, hoverinfo: 'skip',
    });
  }

  return traces;
}

// ─── Layout per projection ────────────────────────────────────────────────────

function getLayout() {
  const base = {
    paper_bgcolor: '#0B1426',
    plot_bgcolor:  '#0B1426',
    font: { color: 'white', family: 'Arial, Helvetica, sans-serif' },
    legend: {
      yanchor: 'top', y: 0.99,
      xanchor: 'left', x: 1.01,
      font: { family: 'Arial, Helvetica, sans-serif', color: 'white' },
      bgcolor: 'rgba(26,37,64,0.8)',
    },
  };

  if (currentProjection === 'equirectangular') {
    return {
      ...base,
      xaxis: {
        title: { text: 'Right Ascension (degrees)', font: { family: 'Arial, Helvetica, sans-serif' } },
        range: [360, 0], dtick: 30, showgrid: true,
        gridcolor: 'rgba(128,128,128,0.3)',
        tickfont: { family: 'Arial, Helvetica, sans-serif' }, color: 'white',
      },
      yaxis: {
        title: { text: 'Declination (degrees)', font: { family: 'Arial, Helvetica, sans-serif' } },
        range: [-90, 90], dtick: 30, showgrid: true,
        gridcolor: 'rgba(128,128,128,0.3)',
        tickfont: { family: 'Arial, Helvetica, sans-serif' }, color: 'white',
      },
      margin: { l: 65, r: 20, t: 30, b: 60 },
    };
  }

  const noAxis = {
    showgrid: false, showticklabels: false,
    zeroline: false, showline: false,
  };

  if (currentProjection === 'mollweide') {
    return {
      ...base,
      xaxis: { ...noAxis, range: [-3.1, 3.1] },
      yaxis: { ...noAxis, range: [-1.65, 1.65], scaleanchor: 'x', scaleratio: 1 },
      margin: { l: 20, r: 20, t: 30, b: 20 },
    };
  }

  // stereographic
  return {
    ...base,
    xaxis: { ...noAxis, range: [-7.5, 7.5] },
    yaxis: { ...noAxis, range: [-7.5, 7.5], scaleanchor: 'x', scaleratio: 1 },
    margin: { l: 20, r: 20, t: 30, b: 20 },
  };
}

// ─── Chart building ───────────────────────────────────────────────────────────

const PLOTLY_CONFIG = {
  responsive: true,
  displayModeBar: true,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
};

function buildTraces(data, options) {
  const traces = [];

  // 0. Reference grid (Mollweide / Stereographic only)
  traces.push(...buildGridTraces());

  // 1. Constellation lines
  if (options.showConstellationLines) {
    for (const [name, cdata] of Object.entries(CONSTELLATION_LINES)) {
      for (const polyline of cdata.lines) {
        const coords = projectPolyline(polyline);
        traces.push({
          type: 'scatter', x: coords.x, y: coords.y,
          mode: 'lines',
          line: { color: 'rgba(128,128,128,0.4)', width: 1 },
          showlegend: false, hoverinfo: 'skip',
          name: `${name} lines`,
        });
      }
    }
  }

  // 2. Bright stars — store original RA/Dec in customdata so hover shows real coords
  const starPts = BRIGHT_STARS.map(s => projectPoint(s[1], s[2]));
  traces.push({
    type: 'scatter',
    x: starPts.map(p => p.x),
    y: starPts.map(p => p.y),
    mode: options.showStarLabels ? 'markers+text' : 'markers',
    marker: { size: 4, color: 'lightgray', symbol: 'star' },
    text: BRIGHT_STARS.map(s => s[0]),
    textposition: 'top center',
    textfont: { size: 6, color: 'lightgray', family: 'Arial, Helvetica, sans-serif' },
    name: 'Bright Stars',
    showlegend: false,
    hovertemplate:
      '<b>%{customdata[0]}</b><br>' +
      'Constellation: %{customdata[1]}<br>' +
      'RA: %{customdata[3]:.1f}°  Dec: %{customdata[4]:.1f}°<br>' +
      'Mag: %{customdata[2]:.2f}<extra></extra>',
    customdata: BRIGHT_STARS.map(s => [s[0], s[4], s[3], s[1], s[2]]),
  });

  // 3. Constellation name labels
  if (options.showConstellationLabels) {
    const names   = Object.keys(CONSTELLATION_LINES);
    const labelPts = names.map(n => projectPoint(...CONSTELLATION_LINES[n].labelPos));
    traces.push({
      type: 'scatter',
      x: labelPts.map(p => p.x),
      y: labelPts.map(p => p.y),
      mode: 'text', text: names,
      textposition: 'middle center',
      textfont: { size: 12, color: 'rgba(200,200,200,0.8)', family: 'Arial, Helvetica, sans-serif' },
      name: 'Constellation Labels',
      showlegend: false,
      hovertemplate: '%{customdata}<extra></extra>',
      customdata: names.map(n =>
        `<b>${n}</b><br>${CONSTELLATION_LINES[n].messierObjects.length} Messier objects`
      ),
    });
  }

  // 4. Messier objects grouped by category then type
  const byCategory = {};
  for (const obj of data) {
    const cat = obj.category;
    if (!byCategory[cat]) byCategory[cat] = {};
    if (!byCategory[cat][obj.objectType]) byCategory[cat][obj.objectType] = [];
    byCategory[cat][obj.objectType].push(obj);
  }

  // With the full NGC+IC catalog a trace can hold thousands of points, so use
  // WebGL (scattergl) for the object markers; grid/lines/stars stay on SVG.
  for (const category of ['Galaxy', 'Nebula', 'Cluster', 'Other']) {
    if (!byCategory[category]) continue;
    for (const objType of Object.keys(byCategory[category]).sort()) {
      // Tonight's Sky: only show objects currently above the horizon
      const objects = options.lst !== null
        ? byCategory[category][objType].filter(o =>
            getAltitudeDeg(o.raDeg, o.decDeg, options.lst, options.lat) > -0.5)
        : byCategory[category][objType];
      if (!objects.length) continue;

      const style   = getObjectStyle(objects[0].typeCode);
      const objPts  = objects.map(o => projectPoint(o.raDeg, o.decDeg));
      const markerSize = options.scaleSizeByMag
        ? objects.map(o => magToSize(o.magnitudeVal))
        : style.size;
      // Labels: only for label-worthy objects, and only when not suppressed by
      // the overcrowding guard.
      const labels = options.showObjectLabels
        ? objects.map(o => o.labelWorthy ? o.label : '')
        : objects.map(() => '');

      traces.push({
        type: 'scattergl',
        x: objPts.map(p => p.x),
        y: objPts.map(p => p.y),
        mode: 'markers+text',
        marker: {
          size: markerSize, color: style.color, symbol: style.symbol,
          line: { width: 0.6, color: 'rgba(255,255,255,0.7)' },
        },
        name: objType,
        text: labels,
        textposition: 'top center',
        textfont: { size: 8, color: 'white', family: 'Arial, Helvetica, sans-serif' },
        hovertemplate:
          '<b>%{customdata[0]}</b><br>' +
          'Type: %{customdata[2]}<br>' +
          'Constellation: %{customdata[3]}<br>' +
          'Magnitude: %{customdata[4]}<br>' +
          'Best Viewing: %{customdata[5]}<br>' +
          'RA: %{customdata[6]:.1f}°  Dec: %{customdata[7]:.1f}°<extra></extra>',
        customdata: objects.map(o => [
          o.label, o.name, o.objectType, o.constellation,
          o.magnitude, o.season, o.raDeg, o.decDeg,
          o.dimensions, o.id, o.allIds.join(' · '), o.catalog,
        ]),
        legendgroup: category,
        legendgrouptitle: { text: category },
      });
    }
  }

  return traces;
}

// ─── Astronomical calculations (Tonight's Sky) ───────────────────────────────

function getGMSTDeg(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T  = (jd - 2451545.0) / 36525.0;
  const gmst = 280.46061837
    + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T
    - T * T * T / 38710000;
  return ((gmst % 360) + 360) % 360;
}

function getLSTDeg(date, lonDeg) {
  return (getGMSTDeg(date) + lonDeg + 360) % 360;
}

// Returns altitude in degrees (-90 to +90). Positive = above horizon.
function getAltitudeDeg(raDeg, decDeg, lstDeg, latDeg) {
  const haR  = ((lstDeg - raDeg + 360) % 360) * Math.PI / 180;
  const decR = decDeg  * Math.PI / 180;
  const latR = latDeg  * Math.PI / 180;
  return Math.asin(
    Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(haR)
  ) * 180 / Math.PI;
}

// Returns azimuth in degrees measured clockwise from North (0=N, 90=E, 180=S,
// 270=W). Shares the hour-angle / Dec / latitude inputs with getAltitudeDeg.
function getAzimuthDeg(raDeg, decDeg, lstDeg, latDeg) {
  const haR  = ((lstDeg - raDeg + 360) % 360) * Math.PI / 180;
  const decR = decDeg * Math.PI / 180;
  const latR = latDeg * Math.PI / 180;
  const az = Math.atan2(
    Math.sin(haR),
    Math.cos(haR) * Math.sin(latR) - Math.tan(decR) * Math.cos(latR)
  ) * 180 / Math.PI + 180;   // atan2 form gives az from South; +180 -> from North
  return (az % 360 + 360) % 360;
}

// ─── Monthly visibility chart ─────────────────────────────────────────────────

function computeMonthlyVisibility(raDeg, decDeg) {
  const results = [];
  for (let month = 0; month < 12; month++) {
    let darkHours = 0;
    let maxAlt = -90;
    // Step every 15 min for 24 h starting at noon on the 15th
    const lat = observerLat();
    const lon = observerLon();
    for (let step = 0; step < 96; step++) {
      const d = new Date(2025, month, 15, 12, step * 15, 0);
      const lst    = getLSTDeg(d, lon);
      const sun    = getSunRaDec(d);
      const sunAlt = getAltitudeDeg(sun.raDeg, sun.decDeg, lst, lat);
      if (sunAlt < -18) {
        const objAlt = getAltitudeDeg(raDeg, decDeg, lst, lat);
        if (objAlt > 20) darkHours += 0.25;
        if (objAlt > maxAlt) maxAlt = objAlt;
      }
    }
    results.push({
      hours:  Math.round(darkHours * 10) / 10,
      maxAlt: maxAlt > 0 ? Math.round(maxAlt) : 0,
    });
  }
  return results;
}

function buildVisibilityChart(raDeg, decDeg) {
  const canvas = document.getElementById('panel-visibility-chart');
  if (!canvas) return;
  panelObjRaDec = { raDeg, decDeg };
  if (panelChart) { panelChart.destroy(); panelChart = null; }

  // The panel slides in from off-screen; Chart.js renders blank if it measures
  // the canvas before layout settles. Poll on animation frames until the
  // container has a real width, then render.
  const container = canvas.parentElement;
  let attempts = 0;
  (function waitForLayout() {
    if (container.offsetWidth > 0)  renderVisibilityChart(canvas, raDeg, decDeg);
    else if (attempts++ < 90)       requestAnimationFrame(waitForLayout);
  })();
}

function renderVisibilityChart(canvas, raDeg, decDeg) {
  if (panelChart) { panelChart.destroy(); panelChart = null; }

  // Surface a clear message if the Chart.js library never loaded (blocked CDN,
  // offline, ad-blocker) instead of silently leaving a blank canvas.
  if (typeof Chart === 'undefined') {
    const c = canvas.parentElement;
    c.innerHTML = '<div style="color:#e06c75; font-size:0.8rem; text-align:center; padding-top:60px;">Chart library failed to load.<br>Check your network/ad-blocker and reload.</div>';
    console.error('[visibility chart] Chart.js (window.Chart) is undefined — the CDN script did not load.');
    return;
  }

  const lat = observerLat();
  const titleEl = document.getElementById('panel-visibility-title');
  if (titleEl) {
    const latLabel = `${Math.abs(lat).toFixed(0)}°${lat >= 0 ? 'N' : 'S'}`;
    titleEl.textContent = userLatitude !== null
      ? `Visibility from your location (${latLabel})`
      : `Visibility from ${latLabel} (default — set location for yours)`;
  }

  const monthly = computeMonthlyVisibility(raDeg, decDeg);
  const labels  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const hours   = monthly.map(d => d.hours);
  const maxAlts = monthly.map(d => d.maxAlt);

  const maxHours      = Math.max(...hours, 0.1);
  const peakThreshold = maxHours * 0.70;
  const peakIndices   = hours.map((h, i) => h >= peakThreshold && h > 0 ? i : -1).filter(i => i >= 0);

  const barColors = hours.map(h =>
    h >= peakThreshold && h > 0 ? 'rgba(220,140,40,0.85)' : 'rgba(60,100,175,0.70)'
  );

  const bandPlugin = {
    id: 'bandHighlight',
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;
      const slotW = chartArea.width / labels.length;
      ctx.save();
      ctx.fillStyle = 'rgba(200,110,20,0.10)';
      peakIndices.forEach(i => {
        const cx = scales.x.getPixelForValue(i);
        ctx.fillRect(cx - slotW / 2, chartArea.top, slotW, chartArea.bottom - chartArea.top);
      });
      ctx.restore();
    },
  };

  try {
  panelChart = new Chart(canvas, {
    plugins: [bandPlugin],
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Dark hrs above 20°',
          data: hours,
          backgroundColor: barColors,
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Max altitude',
          data: maxAlts,
          borderColor: '#87ceeb',
          backgroundColor: 'transparent',
          pointBackgroundColor: '#87ceeb',
          pointRadius: 2.5,
          pointHoverRadius: 4,
          borderWidth: 1.8,
          tension: 0.35,
          yAxisID: 'y2',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,29,53,0.95)',
          titleColor: '#87ceeb',
          bodyColor: '#cccccc',
          borderColor: '#2a3a60',
          borderWidth: 1,
          callbacks: {
            title: ctx => ctx[0].label,
            label: ctx => ctx.datasetIndex === 0
              ? `${ctx.parsed.y.toFixed(1)} hrs above 20°`
              : `Max altitude: ${ctx.parsed.y}°`,
          },
        },
      },
      scales: {
        x: {
          ticks:  { color: '#aabbcc', font: { size: 9 } },
          grid:   { color: 'rgba(128,128,128,0.15)' },
          border: { color: 'rgba(128,128,128,0.3)' },
        },
        y: {
          position: 'left',
          min: 0,
          ticks:  { color: '#aabbcc', font: { size: 9 } },
          grid:   { color: 'rgba(128,128,128,0.15)' },
          border: { color: 'rgba(128,128,128,0.3)' },
          title:  { display: true, text: 'hrs > 20°', color: '#aabbcc', font: { size: 9 } },
        },
        y2: {
          position: 'right',
          min: 0,
          max: 90,
          ticks: {
            color: '#87ceeb', font: { size: 9 }, stepSize: 30,
            callback: v => v + '°',
          },
          grid:   { drawOnChartArea: false },
          border: { color: 'rgba(128,128,128,0.3)' },
          title:  { display: true, text: 'max alt', color: '#87ceeb', font: { size: 9 } },
        },
      },
    },
  });
  } catch (err) {
    console.error('[visibility chart] failed to render:', err);
    canvas.parentElement.innerHTML =
      `<div style="color:#e06c75; font-size:0.8rem; text-align:center; padding-top:60px;">Chart failed to render.<br>${err.message}</div>`;
  }
}

// ─── Detail panel ────────────────────────────────────────────────────────────

// Wikipedia summaries live under different titles for different objects, so try
// the most specific designation first and fall back gracefully: Messier name →
// common name → NGC/IC designation.
function wikipediaTitles(obj) {
  const titles = [];
  if (obj.messier)  titles.push(`Messier_${obj.messier.replace(/^M/i, '')}`);
  if (obj.name)     titles.push(obj.name.replace(/\s+/g, '_'));
  if (obj.ngcIc)    titles.push(obj.ngcIc.replace(/\s+/g, '_'));
  return [...new Set(titles)];
}

async function fetchWikipediaData(obj) {
  for (const title of wikipediaTitles(obj)) {
    try {
      const resp = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      if (!resp.ok) continue;
      const data = await resp.json();
      // Disambiguation pages carry no useful summary/image — keep looking.
      if (data.type === 'disambiguation') continue;
      return data;
    } catch {
      // network error — try the next title
    }
  }
  return null;
}

function closeDetailPanel() {
  if (panelChart) { panelChart.destroy(); panelChart = null; }
  panelObjRaDec = null;
  document.getElementById('detail-panel').classList.remove('open');
  document.getElementById('panel-backdrop').classList.remove('open');
}

// Accepts either an object id (string) or the object itself.
function openDetailPanel(objOrId) {
  const obj = (typeof objOrId === 'string')
    ? allData.find(o => o.id === objOrId)
    : objOrId;
  if (!obj) return;

  // Short designation shown as the badge; title prefers the common name.
  const badge = obj.messier || obj.caldwell || obj.ngcIc || obj.id;
  document.getElementById('panel-messier-num').textContent = badge;
  document.getElementById('panel-title').textContent = obj.name || obj.label;

  const otherIds = obj.allIds.filter(x => x !== obj.name);
  document.getElementById('panel-stats').innerHTML = [
    ['Type',         obj.objectType],
    ['Constellation', obj.constellation],
    ['Magnitude',    obj.magnitude],
    ['Size',         obj.dimensions ? `${obj.dimensions}′` : '—'],
    ['Best Viewing', obj.season || '—'],
    ['Catalog IDs',  otherIds.length ? otherIds.join(' · ') : '—'],
  ].map(([label, val]) =>
    `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${val || '—'}</div></div>`
  ).join('');

  // Reset image + description to loading state
  const imgEl   = document.getElementById('panel-image');
  const phEl    = document.getElementById('panel-image-placeholder');
  imgEl.style.display = 'none';
  imgEl.src = '';
  phEl.style.display  = 'flex';
  phEl.textContent    = 'Loading image…';
  document.getElementById('panel-description').textContent = '';
  document.getElementById('panel-wiki-link').style.display = 'none';

  // Open panel
  document.getElementById('detail-panel').classList.add('open');
  document.getElementById('panel-backdrop').classList.add('open');

  // Build visibility chart (waits for panel layout internally)
  buildVisibilityChart(obj.raDeg, obj.decDeg);

  // Fetch Wikipedia data asynchronously
  fetchWikipediaData(obj).then(data => {
    if (!data) {
      phEl.textContent = 'No image available';
      document.getElementById('panel-description').textContent = 'Description unavailable.';
      return;
    }

    // Image — request 400px wide thumbnail
    const rawSrc = data.thumbnail?.source;
    if (rawSrc) {
      const src = rawSrc.replace(/\/\d+px-/, '/400px-');
      imgEl.onload  = () => { phEl.style.display = 'none'; imgEl.style.display = ''; };
      imgEl.onerror = () => { imgEl.src = rawSrc; }; // fall back to original size
      imgEl.src = src;
    } else {
      phEl.textContent = 'No image available';
    }

    document.getElementById('panel-description').textContent = data.extract || '';

    const wikiUrl = data.content_urls?.desktop?.page;
    if (wikiUrl) {
      const link = document.getElementById('panel-wiki-link');
      link.href = wikiUrl;
      link.style.display = '';
    }
  });
}

// ─── Magnitude scaling ────────────────────────────────────────────────────────

// Map apparent magnitude to marker size. Lower mag = brighter = larger dot.
// Messier range is roughly 1.6 (Pleiades) to 10.1 (M76).
function magToSize(mag) {
  const t = Math.max(0, Math.min(1, (mag - 1.5) / 9.0)); // 0=brightest, 1=faintest
  return Math.round(20 - t * 15); // 20 (bright) down to 5 (faint)
}

// ─── State & filter management ────────────────────────────────────────────────

// Default magnitude cap on load so the ~13k-object catalog isn't flooded; the
// user can widen it up to MAG_SLIDER_MAX.
const DEFAULT_MAG_MAX = 9;
const MAG_SLIDER_MAX  = 16;
// Angular-size filter: hide objects smaller than sizeMin arcminutes. Default 1′
// strips sub-arcminute clutter while keeping all 110 Messier (smallest is the
// Ring, ~1.3′). Slider tops out at 30′ (only ~50 objects are larger).
const SIZE_SLIDER_MAX = 30;
const DEFAULT_SIZE_MIN = 1;
// Above this many objects on screen the field is too dense to label legibly, so
// suppress the on-chart labels and show the "zoom in / tighten filters" hint.
// (Only Messier/Caldwell/named/bright objects are ever labelled to begin with.)
const OVERCROWD_LIMIT = 1500;
// Cap how many objects the Night Planner charts draw. With the full catalog a
// wide filter can leave hundreds of targets up at once — far too many rows/lines
// to read, and slow to render — so keep the best (highest-transiting) N.
const MAX_PLANNER_OBJECTS = 60;
const CATALOG_ORDER = ['Messier', 'Caldwell', 'NGC', 'IC', 'Other'];

let allData          = [];
let allTypes         = [];
let allConstellations = [];
let allSeasons       = [];
let allCatalogs      = [];
let selectedTypes         = new Set();
let selectedConstellations = new Set();
let selectedSeasons       = new Set();
let selectedCatalogs      = new Set();
let magMin = 0;
let magMax = DEFAULT_MAG_MAX;
let sizeMin = DEFAULT_SIZE_MIN;   // minimum apparent size in arcminutes
let scaleSizeByMag  = false;
let currentTab    = 'skychart';
let plannerDate   = '';
let plannerMinAlt = 20;
let plannerView   = 'gantt';
let tonightsMode    = false;
let userLatitude    = null;
let userLongitude   = null;
let panelChart      = null;
let panelObjRaDec   = null;   // {raDeg, decDeg} of the object shown in the open panel

// Fallback observer location (Lafayette, CO) used until a real one is detected.
const DEFAULT_LAT = 40.0;
const DEFAULT_LON = -105.1;

function observerLat() { return userLatitude  !== null ? userLatitude  : DEFAULT_LAT; }
function observerLon() { return userLongitude !== null ? userLongitude : DEFAULT_LON; }

function getFilteredData() {
  return allData.filter(obj => {
    if (!selectedCatalogs.has(obj.catalog)) return false;
    if (!selectedTypes.has(obj.objectType)) return false;
    if (!selectedConstellations.has(obj.constellation)) return false;
    if (!selectedSeasons.has(obj.season)) return false;
    // Angular-size filter: hide objects known to be smaller than sizeMin. Objects
    // with no measured size (point sources, unmeasured) pass through so we never
    // drop a real object for lack of a measurement.
    if (Number.isFinite(obj.sizeArcminVal) && obj.sizeArcminVal < sizeMin) return false;
    // Messier & Caldwell objects always pass the magnitude filter so the
    // familiar catalog is never hidden (many have no magnitude at all).
    if (obj.catalog === 'Messier' || obj.catalog === 'Caldwell') return true;
    // Objects without a magnitude are treated as faint (hidden by default).
    return obj.magnitudeVal >= magMin && obj.magnitudeVal <= magMax;
  });
}

function updateLocationTimeDisplay() {
  if (!tonightsMode || userLatitude === null) return;
  const now = new Date();
  const lst = getLSTDeg(now, userLongitude);
  const lstH  = lst / 15;
  const lstHH = Math.floor(lstH).toString().padStart(2, '0');
  const lstMM = Math.floor((lstH % 1) * 60).toString().padStart(2, '0');
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('location-time').textContent =
    `${timeStr} · LST ${lstHH}h${lstMM}m`;
}

function updateChart() {
  const filtered = getFilteredData();
  const now = new Date();
  const lst = (tonightsMode && userLatitude !== null)
    ? getLSTDeg(now, userLongitude) : null;

  // Overcrowding guard: when the field is too dense, drop the on-chart labels
  // (markers still render) and nudge the user to zoom in / tighten filters.
  const showObjectLabels = filtered.length <= OVERCROWD_LIMIT;

  const options = {
    showStarLabels:          document.getElementById('show-star-labels').checked,
    showConstellationLines:  document.getElementById('show-constellation-lines').checked,
    showConstellationLabels: document.getElementById('show-constellation-names').checked,
    showObjectLabels,
    scaleSizeByMag,
    lst,
    lat: userLatitude,
  };
  updateLocationTimeDisplay();
  Plotly.react('sky-chart', buildTraces(filtered, options), getLayout(), PLOTLY_CONFIG);
  document.getElementById('object-count').textContent = showObjectLabels
    ? `Showing ${filtered.length} of ${allData.length} objects · click any object for details`
    : `Showing ${filtered.length} of ${allData.length} objects · labels hidden — zoom in or tighten filters to see them`;
  document.getElementById('catalog-badge').textContent = `${selectedCatalogs.size} selected`;
  document.getElementById('type-badge').textContent   = `${selectedTypes.size} selected`;
  document.getElementById('const-badge').textContent  = `${selectedConstellations.size} selected`;
  document.getElementById('season-badge').textContent = `${selectedSeasons.size} selected`;
  syncCheckboxes('catalog-checkboxes', selectedCatalogs);
  syncCheckboxes('type-checkboxes',   selectedTypes);
  syncCheckboxes('const-checkboxes',  selectedConstellations);
  syncCheckboxes('season-checkboxes', selectedSeasons);
  updatePlanner();
}

function syncCheckboxes(containerId, selectedSet) {
  document.querySelectorAll(`#${containerId} input[type=checkbox]`).forEach(cb => {
    if (cb.dataset.master) return;  // category master toggles handled below
    cb.checked = selectedSet.has(cb.value);
  });
  // Refresh category master toggles (checked / indeterminate) from their members.
  document.querySelectorAll(`#${containerId} input[data-master]`).forEach(master => {
    const cat = master.dataset.master;
    const types = [...container_type_values(containerId)].filter(t => categoryOfLabel(t) === cat);
    const selCount = types.filter(t => selectedSet.has(t)).length;
    master.checked       = types.length > 0 && selCount === types.length;
    master.indeterminate = selCount > 0 && selCount < types.length;
  });
}

// All per-type checkbox values currently rendered in a container.
function container_type_values(containerId) {
  return [...document.querySelectorAll(`#${containerId} input[type=checkbox]:not([data-master])`)]
    .map(cb => cb.value);
}

function buildCheckboxes(containerId, options, selectedSet) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const isTypeList = containerId === 'type-checkboxes';
  let grouped = null;
  if (isTypeList) {
    grouped = { Galaxy: [], Nebula: [], Cluster: [], Other: [] };
    for (const opt of options) grouped[categoryOfLabel(opt)].push(opt);
  }

  function addCheckbox(opt) {
    const div   = document.createElement('div');
    div.className = 'form-check';
    const input = document.createElement('input');
    input.type      = 'checkbox';
    input.className = 'form-check-input';
    input.id    = `cb-${containerId}-${opt.replace(/\s+/g, '-')}`;
    input.value = opt;
    input.checked   = selectedSet.has(opt);
    input.addEventListener('change', () => {
      if (input.checked) selectedSet.add(opt);
      else               selectedSet.delete(opt);
      updateChart();
    });
    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.htmlFor   = input.id;
    label.textContent = opt;
    div.appendChild(input);
    div.appendChild(label);
    container.appendChild(div);
  }

  // Category master toggle: one checkbox in the header that turns every type in
  // that category on/off at once (issue #7 — functional Type filter).
  function addCategoryHeader(cat, types) {
    const header = document.createElement('div');
    header.className = 'form-check';
    header.style.cssText = 'margin-top:8px;margin-bottom:2px;';
    const input = document.createElement('input');
    input.type      = 'checkbox';
    input.className = 'form-check-input';
    input.id        = `cb-cat-${cat}`;
    input.dataset.master = cat;
    const selCount  = types.filter(t => selectedSet.has(t)).length;
    input.checked       = selCount === types.length;
    input.indeterminate = selCount > 0 && selCount < types.length;
    input.addEventListener('change', () => {
      if (input.checked) types.forEach(t => selectedSet.add(t));
      else               types.forEach(t => selectedSet.delete(t));
      buildCheckboxes(containerId, options, selectedSet);
      updateChart();
    });
    const label = document.createElement('label');
    label.className   = 'form-check-label';
    label.htmlFor     = input.id;
    label.style.cssText = 'color:#87ceeb;font-size:0.78rem;font-weight:bold;';
    label.textContent = cat;
    header.appendChild(input);
    header.appendChild(label);
    container.appendChild(header);
  }

  if (isTypeList && grouped) {
    for (const cat of ['Galaxy', 'Nebula', 'Cluster', 'Other']) {
      if (!grouped[cat].length) continue;
      addCategoryHeader(cat, grouped[cat]);
      grouped[cat].sort().forEach(addCheckbox);
    }
  } else {
    options.forEach(addCheckbox);
  }
}

function setupSelectAll(btnId, deselBtnId, allValues, selectedSet, containerId) {
  document.getElementById(btnId).addEventListener('click', () => {
    allValues.forEach(v => selectedSet.add(v));
    buildCheckboxes(containerId, allValues, selectedSet);
    updateChart();
  });
  document.getElementById(deselBtnId).addEventListener('click', () => {
    selectedSet.clear();
    buildCheckboxes(containerId, allValues, selectedSet);
    updateChart();
  });
}

// ─── Collapse icon sync ───────────────────────────────────────────────────────

function setupCollapseIcons() {
  for (const [collapseId, iconId] of [
    ['catalog-collapse', 'catalog-icon'],
    ['type-collapse',   'type-icon'],
    ['const-collapse',  'const-icon'],
    ['season-collapse', 'season-icon'],
    ['mag-collapse',    'mag-icon'],
  ]) {
    const el = document.getElementById(collapseId);
    el.addEventListener('show.bs.collapse', () => { document.getElementById(iconId).textContent = '▼ '; });
    el.addEventListener('hide.bs.collapse', () => { document.getElementById(iconId).textContent = '▶ '; });
  }

  document.getElementById('expand-all').addEventListener('click', () => {
    ['catalog-collapse', 'type-collapse', 'const-collapse', 'season-collapse', 'mag-collapse'].forEach(id =>
      bootstrap.Collapse.getOrCreateInstance(document.getElementById(id)).show()
    );
  });
  document.getElementById('collapse-all').addEventListener('click', () => {
    ['catalog-collapse', 'type-collapse', 'const-collapse', 'season-collapse', 'mag-collapse'].forEach(id =>
      bootstrap.Collapse.getOrCreateInstance(document.getElementById(id)).hide()
    );
  });
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────

// Objects at or brighter than this magnitude get an on-chart text label even
// without a Messier/Caldwell/common name.
const LABEL_MAG_BRIGHT = 7;

function parseCSV(csvText) {
  const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return results.data.filter(row => row['id']).map(row => {
    const messier  = (row['messier']  || '').trim();
    const caldwell = (row['caldwell'] || '').trim();
    const name     = (row['name']     || '').trim();
    const ngcIc    = (row['ngc_ic']   || '').trim();
    const code     = (row['type']     || 'Other').trim();
    const magStr   = (row['mag']      || '').trim();
    const magVal   = magStr === '' ? Infinity : parseFloat(magStr);
    const season   = (row['season']   || 'Unknown').trim();
    // Name precedence: Messier > Caldwell > common name > NGC/IC designation
    const label = messier || caldwell || name || ngcIc;
    const labelWorthy = !!(messier || caldwell || name ||
      (Number.isFinite(magVal) && magVal <= LABEL_MAG_BRIGHT));
    return {
      id:            (row['id'] || '').trim(),
      catalog:       (row['catalog'] || 'Other').trim(),
      messier, caldwell, name, ngcIc, label, labelWorthy,
      allIds:        (row['all_ids'] || ngcIc).split(',').map(s => s.trim()).filter(Boolean),
      typeCode:      code,
      objectType:    typeLabel(code),
      category:      classifyObjectType(code),
      magnitude:     magStr === '' ? '—' : magStr,
      magnitudeVal:  magVal,
      hasMag:        Number.isFinite(magVal),
      distance:      '',
      constellation: (row['constellation'] || 'Unknown').trim(),
      dimensions:    (row['size_arcmin'] || '').trim(),
      sizeArcminVal: parseFloat(row['size_arcmin']),   // NaN when size is unknown
      bestViewing:   season,
      season,
      raDeg:  parseFloat(row['ra_deg'])  || 0,
      decDeg: parseFloat(row['dec_deg']) || 0,
    };
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  // Display toggles
  ['show-star-labels', 'show-constellation-lines', 'show-constellation-names'].forEach(id =>
    document.getElementById(id).addEventListener('change', updateChart)
  );

  // Magnitude range slider
  // Minimum apparent-size slider: hides objects smaller than sizeMin arcminutes.
  // Here "minimum" is the natural sense — larger arcminutes = physically bigger —
  // so it isn't inverted like magnitude. Default 0 shows every size.
  const sizeMinEl    = document.getElementById('size-min');
  const sizeMinLabel = document.getElementById('size-min-label');

  sizeMinEl.max   = SIZE_SLIDER_MAX;
  sizeMinEl.value = sizeMin;
  sizeMinLabel.textContent = sizeMin.toFixed(1) + '′';

  sizeMinEl.addEventListener('input', () => {
    sizeMin = parseFloat(sizeMinEl.value);
    sizeMinLabel.textContent = sizeMin.toFixed(1) + '′';
    updateChart();
  });

  // Single limiting-magnitude slider: caps the faint end at magMax. magMin stays
  // 0 so the bright end is always fully open — the default (magMax = 9) shows the
  // brightest objects, and dragging toward MAG_SLIDER_MAX reveals fainter ones.
  const magMaxEl    = document.getElementById('mag-max');
  const magMaxLabel = document.getElementById('mag-max-label');

  magMaxEl.max   = MAG_SLIDER_MAX;
  magMaxEl.value = magMax;
  magMaxLabel.textContent = magMax.toFixed(1);

  magMaxEl.addEventListener('input', () => {
    magMax = parseFloat(magMaxEl.value);
    magMaxLabel.textContent = magMax.toFixed(1);
    updateChart();
  });

  // Scale-by-magnitude toggle
  document.getElementById('scale-by-magnitude').addEventListener('change', e => {
    scaleSizeByMag = e.target.checked;
    updateChart();
  });

  // Tonight's Sky
  const locationBarEl = document.getElementById('location-bar');
  const statusEl      = document.getElementById('location-status');

  function applyLocation(lat, lon) {
    userLatitude  = lat;
    userLongitude = lon;
    document.getElementById('manual-lat').value = lat.toFixed(4);
    document.getElementById('manual-lon').value = lon.toFixed(4);
    const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
    statusEl.textContent = `📍 ${latStr}, ${lonStr}`;
    updateChart();
    // Refresh the open detail-panel chart so it reflects the new location
    if (panelObjRaDec) buildVisibilityChart(panelObjRaDec.raDeg, panelObjRaDec.decDeg);
  }

  function tryGeolocation() {
    if (!navigator.geolocation) {
      statusEl.textContent = 'Geolocation not supported — enter coordinates →';
      return;
    }
    statusEl.textContent = 'Requesting location…';
    navigator.geolocation.getCurrentPosition(
      pos  => applyLocation(pos.coords.latitude, pos.coords.longitude),
      ()   => { statusEl.textContent = 'Location denied — enter coordinates →'; },
      { timeout: 10000 }
    );
  }

  document.getElementById('apply-location').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('manual-lat').value);
    const lon = parseFloat(document.getElementById('manual-lon').value);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      applyLocation(lat, lon);
    }
  });

  document.getElementById('detect-location').addEventListener('click', tryGeolocation);

  document.getElementById('tonights-sky-mode').addEventListener('change', e => {
    tonightsMode = e.target.checked;
    if (!tonightsMode) {
      // Keep the detected location (the detail-panel chart uses it); just stop
      // the horizon filtering. updateChart() gates that on tonightsMode.
      document.getElementById('location-time').textContent = '';
      updateLocationBarVisibility();
      updateChart();
      return;
    }
    updateLocationBarVisibility();
    if (userLatitude === null) tryGeolocation();
    else                       updateChart();
  });

  // Projection selector
  document.querySelectorAll('input[name="projection"]').forEach(radio =>
    radio.addEventListener('change', () => {
      currentProjection = radio.value;
      updateChart();
    })
  );

  setupCollapseIcons();

  // Tab switching
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      document.getElementById('ctrl-skychart').style.display    = currentTab === 'skychart' ? '' : 'none';
      document.getElementById('ctrl-planner').style.display     = currentTab === 'planner'  ? '' : 'none';
      document.getElementById('content-skychart').style.display = currentTab === 'skychart' ? '' : 'none';
      document.getElementById('content-planner').style.display  = currentTab === 'planner'  ? '' : 'none';
      document.querySelectorAll('[data-tab]').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === currentTab)
      );
      updateLocationBarVisibility();
      if (currentTab === 'planner') updatePlanner();
    });
  });

  // Load CSV
  let csvText;
  try {
    const resp = await fetch('catalog.csv');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    csvText = await resp.text();
  } catch (err) {
    document.getElementById('object-count').textContent = `Error loading catalog: ${err.message}`;
    document.getElementById('loading-msg').textContent  = `Failed to load catalog.csv`;
    return;
  }

  allData = parseCSV(csvText);

  allCatalogs       = CATALOG_ORDER.filter(c => allData.some(o => o.catalog === c));
  allTypes          = [...new Set(allData.map(o => o.objectType))].sort();
  allConstellations = [...new Set(allData.map(o => o.constellation))].sort();
  const SEASON_ORDER = ['Winter', 'Spring', 'Summer', 'Autumn', 'Unknown'];
  allSeasons        = SEASON_ORDER.filter(s => allData.some(o => o.season === s));

  allCatalogs.forEach(c => selectedCatalogs.add(c));
  allTypes.forEach(t => selectedTypes.add(t));
  allConstellations.forEach(c => selectedConstellations.add(c));
  allSeasons.forEach(s => selectedSeasons.add(s));

  buildCheckboxes('catalog-checkboxes', allCatalogs,       selectedCatalogs);
  buildCheckboxes('type-checkboxes',   allTypes,          selectedTypes);
  buildCheckboxes('const-checkboxes',  allConstellations, selectedConstellations);
  buildCheckboxes('season-checkboxes', allSeasons,        selectedSeasons);

  setupSelectAll('select-all-catalog', 'deselect-all-catalog', allCatalogs,       selectedCatalogs,      'catalog-checkboxes');
  setupSelectAll('select-all-types',   'deselect-all-types',   allTypes,          selectedTypes,         'type-checkboxes');
  setupSelectAll('select-all-const',   'deselect-all-const',   allConstellations, selectedConstellations, 'const-checkboxes');
  setupSelectAll('select-all-seasons', 'deselect-all-seasons', allSeasons,        selectedSeasons,        'season-checkboxes');

  document.getElementById('loading-msg').remove();
  initPlanner();
  updateChart();

  // Detail panel — close controls
  document.getElementById('close-panel').addEventListener('click', closeDetailPanel);
  document.getElementById('panel-backdrop').addEventListener('click', closeDetailPanel);

  // Plotly click → open detail panel. Object traces carry the object id at
  // customdata[9]; bright stars (length 5) and label/line traces don't.
  document.getElementById('sky-chart').on('plotly_click', data => {
    const pt = data.points[0];
    if (!pt.customdata || pt.customdata.length < 10) return;
    openDetailPanel(pt.customdata[9]);
  });

  // Detect the observer's location on load so the visibility chart reflects
  // their real sky. If already granted this resolves silently; otherwise the
  // browser prompts once. Denial just keeps the default location.
  tryGeolocation();
}

// ─── Night Planner ────────────────────────────────────────────────────────────

function getSunRaDec(date) {
  const jd  = date.getTime() / 86400000 + 2440587.5;
  const n   = jd - 2451545.0;
  const L   = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
  const g   = ((357.528 + 0.9856003 * n) % 360 + 360) % 360 * Math.PI / 180;
  const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  const eps = 23.439 * Math.PI / 180;
  const ra  = ((Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * 180 / Math.PI) + 360) % 360;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam)) * 180 / Math.PI;
  return { raDeg: ra, decDeg: dec };
}

function altToColor(alt) {
  const t = Math.min(1, Math.max(0, (alt - 20) / 65));
  return `rgb(${Math.round(50 + 20 * (1 - t))}, ${Math.round(120 + 110 * t)}, ${Math.round(60 + 140 * t)})`;
}

function formatHour(h) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h % 1) * 60);
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

// Display name for planner rows/legend: primary designation, plus the common
// name when it isn't already the primary label.
function plannerLabel(obj) {
  return (obj.name && obj.name !== obj.label)
    ? `${obj.label} · ${obj.name}`
    : obj.label;
}

function buildPlannerChart(filteredData) {
  const noLocEl = document.getElementById('planner-no-location');
  const chartEl = document.getElementById('planner-chart');

  if (userLatitude === null) {
    noLocEl.style.display = '';
    chartEl.style.display = 'none';
    return;
  }
  noLocEl.style.display = 'none';
  chartEl.style.display = '';

  const [yr, mo, dy] = plannerDate.split('-').map(Number);

  // 65 steps: 16:00 → 32:00 (8 am next day), every 15 min
  const steps = Array.from({ length: 65 }, (_, i) => {
    const h = 16 + i * 0.25;
    return { x: h, date: new Date(yr, mo - 1, dy, Math.floor(h), Math.round((h % 1) * 60), 0) };
  });

  const sunAlts = steps.map(s => {
    const sun = getSunRaDec(s.date);
    return getAltitudeDeg(sun.raDeg, sun.decDeg, getLSTDeg(s.date, userLongitude), userLatitude);
  });

  const profiles = filteredData.map(obj => {
    const alts = steps.map(s =>
      getAltitudeDeg(obj.raDeg, obj.decDeg, getLSTDeg(s.date, userLongitude), userLatitude)
    );

    let peakAlt = -90, peakX = 24;
    for (let i = 0; i < steps.length; i++) {
      if (sunAlts[i] < 0 && alts[i] > peakAlt) { peakAlt = alts[i]; peakX = steps[i].x; }
    }

    const windows = [];
    let wStart = null;
    for (let i = 0; i < steps.length; i++) {
      if (alts[i] >= plannerMinAlt && wStart === null) wStart = i;
      if (alts[i] < plannerMinAlt && wStart !== null) {
        windows.push({ x0: steps[wStart].x, x1: steps[i - 1].x });
        wStart = null;
      }
    }
    if (wStart !== null) windows.push({ x0: steps[wStart].x, x1: steps[steps.length - 1].x });

    return { obj, peakAlt, peakX, windows };
  });

  const allVisible = profiles
    .filter(p => p.windows.length > 0 && p.peakAlt >= plannerMinAlt)
    .sort((a, b) => b.peakAlt - a.peakAlt);
  const visible = allVisible.slice(0, MAX_PLANNER_OBJECTS);

  // Night boundaries: sun < 0° (horizon) and sun < -6° (civil twilight)
  let nightX0 = 20, nightX1 = 28, civX0 = 19.5, civX1 = 28.5;
  for (let i = 0;                i < steps.length; i++) { if (sunAlts[i] < 0)  { nightX0 = steps[i].x; break; } }
  for (let i = steps.length - 1; i >= 0;           i--) { if (sunAlts[i] < 0)  { nightX1 = steps[i].x; break; } }
  for (let i = 0;                i < steps.length; i++) { if (sunAlts[i] < -6) { civX0   = steps[i].x; break; } }
  for (let i = steps.length - 1; i >= 0;           i--) { if (sunAlts[i] < -6) { civX1   = steps[i].x; break; } }

  document.getElementById('object-count').textContent = allVisible.length
    ? (allVisible.length > visible.length
        ? `${allVisible.length} objects visible tonight · showing the ${visible.length} highest-transiting · tighten filters to narrow`
        : `${allVisible.length} objects visible tonight · ${filteredData.length - allVisible.length} below ${plannerMinAlt}° threshold`)
    : `No objects above ${plannerMinAlt}° for the selected night`;

  if (!visible.length) {
    Plotly.react('planner-chart', [], {
      paper_bgcolor: '#0B1426', plot_bgcolor: '#0B1426', height: 200,
      annotations: [{ text: `No objects above ${plannerMinAlt}° for the selected night`, x: 0.5, y: 0.5, xref: 'paper', yref: 'paper', showarrow: false, font: { color: '#87ceeb', size: 14 } }],
      margin: { l: 20, r: 20, t: 30, b: 50 },
    }, PLOTLY_CONFIG);
    return;
  }

  const yLabels = visible.map(p => plannerLabel(p.obj));

  const traces = [];
  for (let i = 0; i < visible.length; i++) {
    const { obj, windows, peakAlt } = visible[i];
    for (const win of windows) {
      traces.push({
        type: 'bar',
        orientation: 'h',
        x: [win.x1 - win.x0],
        base: [win.x0],
        y: [yLabels[i]],
        marker: { color: altToColor(peakAlt) },
        showlegend: false,
        customdata: [obj.id],
        hovertemplate:
          `<b>${plannerLabel(obj)}</b><br>` +
          `${formatHour(win.x0)} – ${formatHour(win.x1)}<br>` +
          `Peak: ${peakAlt.toFixed(0)}°  ·  ${obj.objectType}<br>` +
          `<i>click for details</i><extra></extra>`,
      });
    }
  }

  // Color legend entries (invisible bars, show in legend only)
  const legendItems = [['High overhead (>60°)', 75], ['Good (30–60°)', 45], ['Low (<30°)', 25]];
  for (const [label, alt] of legendItems) {
    traces.push({
      type: 'bar', orientation: 'h',
      x: [0], base: [32], y: [yLabels[0]],
      name: label, marker: { color: altToColor(alt) },
      showlegend: true, hovertemplate: '<extra></extra>',
    });
  }

  const tickVals = [], tickText = [];
  for (let h = Math.ceil(civX0); h <= Math.floor(civX1); h++) {
    tickVals.push(h); tickText.push(formatHour(h));
  }

  const ROW_PX = 30;
  const chartHeight = visible.length * ROW_PX + 80;

  Plotly.react('planner-chart', traces, {
    height: chartHeight,
    paper_bgcolor: '#0B1426',
    plot_bgcolor:  '#0d1830',
    font: { color: 'white', family: 'Arial, Helvetica, sans-serif' },
    dragmode: 'pan',
    barmode: 'overlay',
    bargap: 0.25,
    showlegend: true,
    legend: { x: 1.01, y: 1, xanchor: 'left', yanchor: 'top', bgcolor: 'rgba(26,37,64,0.85)', font: { size: 11, color: 'white' }, title: { text: 'Peak altitude', font: { size: 11, color: '#aabbcc' } } },
    margin: { l: 170, r: 160, t: 20, b: 50 },
    xaxis: {
      range: [civX0 - 0.25, civX1 + 0.25], tickvals: tickVals, ticktext: tickText,
      tickfont: { color: '#aabbcc', size: 11 }, gridcolor: 'rgba(128,128,128,0.2)',
      showgrid: true, zeroline: false,
    },
    yaxis: {
      tickfont: { color: '#ccddee', size: 11 }, showgrid: false,
      zeroline: false, autorange: 'reversed',
    },
    shapes: [
      { type: 'rect', xref: 'x', yref: 'paper', x0: civX0,   x1: nightX0, y0: 0, y1: 1, fillcolor: 'rgba(80,60,20,0.25)',  line: { width: 0 }, layer: 'below' },
      { type: 'rect', xref: 'x', yref: 'paper', x0: nightX0, x1: nightX1, y0: 0, y1: 1, fillcolor: 'rgba(0,5,25,0.5)',    line: { width: 0 }, layer: 'below' },
      { type: 'rect', xref: 'x', yref: 'paper', x0: nightX1, x1: civX1,   y0: 0, y1: 1, fillcolor: 'rgba(80,60,20,0.25)', line: { width: 0 }, layer: 'below' },
      { type: 'line', xref: 'x', yref: 'paper', x0: 24, x1: 24, y0: 0, y1: 1, line: { color: 'rgba(150,150,220,0.35)', width: 1, dash: 'dot' } },
    ],
    annotations: [
      { x: 24,      y: 1.02, xref: 'x', yref: 'paper', text: 'midnight', showarrow: false, font: { color: 'rgba(150,150,220,0.55)', size: 9 }, xanchor: 'center' },
      { x: nightX0, y: 1.02, xref: 'x', yref: 'paper', text: 'sunset',   showarrow: false, font: { color: 'rgba(200,160,80,0.6)',  size: 9 }, xanchor: 'center' },
      { x: nightX1, y: 1.02, xref: 'x', yref: 'paper', text: 'sunrise',  showarrow: false, font: { color: 'rgba(200,160,80,0.6)',  size: 9 }, xanchor: 'center' },
    ],
  }, { displayModeBar: true, modeBarButtonsToRemove: ['lasso2d', 'select2d'], responsive: false });

  // Click a bar → open detail panel (same as main sky chart / altitude view)
  chartEl.removeAllListeners?.('plotly_click');
  chartEl.on('plotly_click', data => {
    const pt = data.points[0];
    if (!pt.customdata) return;
    openDetailPanel(Array.isArray(pt.customdata) ? pt.customdata[0] : pt.customdata);
  });
}

const ALT_PALETTE = [
  '#4ec9b0','#f5c842','#e06c75','#98c379','#61afef',
  '#c678dd','#e5c07b','#56b6c2','#d19a66','#abb2bf',
  '#be5046','#3fc6f1',
];
const ALT_DASHES = ['solid','dash','dot','dashdot'];

function buildAltitudeChart(filteredData) {
  if (userLatitude === null) return;

  const [yr, mo, dy] = plannerDate.split('-').map(Number);
  const steps = Array.from({ length: 65 }, (_, i) => {
    const h = 16 + i * 0.25;
    return { x: h, date: new Date(yr, mo - 1, dy, Math.floor(h), Math.round((h % 1) * 60), 0) };
  });
  const sunAlts = steps.map(s => {
    const sun = getSunRaDec(s.date);
    return getAltitudeDeg(sun.raDeg, sun.decDeg, getLSTDeg(s.date, userLongitude), userLatitude);
  });

  let nightX0 = 20, nightX1 = 28, civX0 = 19.5, civX1 = 28.5;
  for (let i = 0;                i < steps.length; i++) { if (sunAlts[i] < 0)  { nightX0 = steps[i].x; break; } }
  for (let i = steps.length - 1; i >= 0;           i--) { if (sunAlts[i] < 0)  { nightX1 = steps[i].x; break; } }
  for (let i = 0;                i < steps.length; i++) { if (sunAlts[i] < -6) { civX0   = steps[i].x; break; } }
  for (let i = steps.length - 1; i >= 0;           i--) { if (sunAlts[i] < -6) { civX1   = steps[i].x; break; } }

  const xRange = [civX0 - 0.25, civX1 + 0.25];
  const tickVals = [], tickText = [];
  for (let h = Math.ceil(civX0); h <= Math.floor(civX1); h++) {
    tickVals.push(h); tickText.push(formatHour(h));
  }

  // One trace per object, only those that reach plannerMinAlt during the night.
  // Rank by peak night-time altitude and keep the best N (too many lines are
  // unreadable and slow to render with the full catalog).
  const visible = filteredData
    .map(obj => {
      let peakAlt = -90;
      for (let i = 0; i < steps.length; i++) {
        if (sunAlts[i] < 0) {
          const alt = getAltitudeDeg(obj.raDeg, obj.decDeg, getLSTDeg(steps[i].date, userLongitude), userLatitude);
          if (alt > peakAlt) peakAlt = alt;
        }
      }
      return { obj, peakAlt };
    })
    .filter(p => p.peakAlt >= plannerMinAlt)
    .sort((a, b) => b.peakAlt - a.peakAlt)
    .slice(0, MAX_PLANNER_OBJECTS)
    .map(p => p.obj);

  const traces = [];
  for (let i = 0; i < visible.length; i++) {
    const obj = visible[i];
    const alts = steps.map(s =>
      getAltitudeDeg(obj.raDeg, obj.decDeg, getLSTDeg(s.date, userLongitude), userLatitude)
    );
    traces.push({
      type: 'scatter', mode: 'lines',
      x: steps.map(s => s.x), y: alts,
      name: plannerLabel(obj),
      line: {
        color: ALT_PALETTE[i % ALT_PALETTE.length],
        width: 2,
        dash: ALT_DASHES[Math.floor(i / ALT_PALETTE.length) % ALT_DASHES.length],
      },
      hovertemplate:
        `<b>${plannerLabel(obj)}</b><br>` +
        `%{customdata[0]} · %{y:.0f}°<br>` +
        `Type: %{customdata[1]}<br>` +
        `Constellation: %{customdata[2]}<br>` +
        `Magnitude: %{customdata[3]}<br>` +
        `Best Viewing: %{customdata[4]}<extra></extra>`,
      customdata: steps.map(s => [
        formatHour(s.x),
        obj.objectType,
        obj.constellation,
        obj.magnitude,
        obj.season,
        obj.id,
      ]),
    });
  }

  // Horizon and threshold reference lines
  traces.push({ type: 'scatter', x: xRange, y: [0, 0], mode: 'lines', line: { color: 'rgba(255,255,255,0.25)', width: 1 }, showlegend: false, hoverinfo: 'skip' });
  if (plannerMinAlt > 0) {
    traces.push({ type: 'scatter', x: xRange, y: [plannerMinAlt, plannerMinAlt], mode: 'lines', line: { color: 'rgba(255,255,100,0.3)', width: 1, dash: 'dot' }, name: `${plannerMinAlt}° min`, showlegend: false, hoverinfo: 'skip' });
  }

  Plotly.react('planner-altitude', traces, {
    paper_bgcolor: '#0B1426', plot_bgcolor: '#0d1830',
    height: 520,
    font: { color: 'white', family: 'Arial, Helvetica, sans-serif' },
    margin: { l: 55, r: 20, t: 30, b: 50 },
    dragmode: 'pan',
    hovermode: 'closest',
    legend: { bgcolor: 'rgba(26,37,64,0.85)', font: { size: 11, color: 'white' } },
    xaxis: {
      range: xRange, tickvals: tickVals, ticktext: tickText,
      tickfont: { color: '#aabbcc', size: 11 }, gridcolor: 'rgba(128,128,128,0.2)', showgrid: true, zeroline: false,
    },
    yaxis: {
      range: [-5, 90], title: { text: 'Altitude (°)', font: { size: 11 } },
      tickfont: { color: '#aabbcc', size: 11 }, gridcolor: 'rgba(128,128,128,0.15)', showgrid: true, zeroline: false,
    },
    shapes: [
      { type: 'rect', xref: 'x', yref: 'paper', x0: civX0,   x1: nightX0, y0: 0, y1: 1, fillcolor: 'rgba(80,60,20,0.25)',  line: { width: 0 }, layer: 'below' },
      { type: 'rect', xref: 'x', yref: 'paper', x0: nightX0, x1: nightX1, y0: 0, y1: 1, fillcolor: 'rgba(0,5,25,0.5)',    line: { width: 0 }, layer: 'below' },
      { type: 'rect', xref: 'x', yref: 'paper', x0: nightX1, x1: civX1,   y0: 0, y1: 1, fillcolor: 'rgba(80,60,20,0.25)', line: { width: 0 }, layer: 'below' },
      { type: 'line', xref: 'x', yref: 'paper', x0: 24, x1: 24, y0: 0, y1: 1, line: { color: 'rgba(150,150,220,0.35)', width: 1, dash: 'dot' } },
    ],
    annotations: [
      { x: 24,      y: 1.02, xref: 'x', yref: 'paper', text: 'midnight', showarrow: false, font: { color: 'rgba(150,150,220,0.55)', size: 9 }, xanchor: 'center' },
      { x: nightX0, y: 1.02, xref: 'x', yref: 'paper', text: 'sunset',   showarrow: false, font: { color: 'rgba(200,160,80,0.6)',  size: 9 }, xanchor: 'center' },
      { x: nightX1, y: 1.02, xref: 'x', yref: 'paper', text: 'sunrise',  showarrow: false, font: { color: 'rgba(200,160,80,0.6)',  size: 9 }, xanchor: 'center' },
    ],
  }, { displayModeBar: true, modeBarButtonsToRemove: ['lasso2d', 'select2d'], responsive: false });

  // Click a line → open detail panel (same as main sky chart)
  const altEl = document.getElementById('planner-altitude');
  altEl.removeAllListeners?.('plotly_click');
  altEl.on('plotly_click', data => {
    const pt = data.points[0];
    if (!pt.customdata || !pt.customdata[5]) return;
    openDetailPanel(pt.customdata[5]);
  });
}

// ─── Sky Path (alt-azimuth compass) view ─────────────────────────────────────

const COMPASS_POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
function compassDir(az) { return COMPASS_POINTS[Math.round(az / 22.5) % 16]; }

function buildSkyPathChart(filteredData) {
  const chartEl = document.getElementById('planner-skypath');
  if (userLatitude === null) { chartEl.style.display = 'none'; return; }

  const [yr, mo, dy] = plannerDate.split('-').map(Number);
  const steps = Array.from({ length: 65 }, (_, i) => {
    const h = 16 + i * 0.25;
    return { x: h, date: new Date(yr, mo - 1, dy, Math.floor(h), Math.round((h % 1) * 60), 0) };
  });
  // Sun altitude at each step → twilight (−18°..0°) vs full dark (< −18°).
  const sunAlts = steps.map(s => {
    const sun = getSunRaDec(s.date);
    return getAltitudeDeg(sun.raDeg, sun.decDeg, getLSTDeg(s.date, userLongitude), userLatitude);
  });

  // Per-object alt/az path, keeping only objects that clear the min altitude
  // during darkness; rank by peak altitude and cap like the other views.
  const paths = filteredData.map(obj => {
    let peakAlt = -90, peakIdx = -1;
    const rows = steps.map((s, i) => {
      const lst = getLSTDeg(s.date, userLongitude);
      const alt = getAltitudeDeg(obj.raDeg, obj.decDeg, lst, userLatitude);
      const az  = getAzimuthDeg(obj.raDeg, obj.decDeg, lst, userLatitude);
      if (sunAlts[i] < 0 && alt > peakAlt) { peakAlt = alt; peakIdx = i; }
      return { alt, az, i };
    });
    return { obj, rows, peakAlt, peakIdx };
  }).filter(p => p.peakAlt >= plannerMinAlt)
    .sort((a, b) => b.peakAlt - a.peakAlt);

  const allCount = paths.length;
  const visible  = paths.slice(0, MAX_PLANNER_OBJECTS);

  document.getElementById('object-count').textContent = allCount
    ? (allCount > visible.length
        ? `${allCount} objects visible tonight · showing the ${visible.length} highest-transiting · tighten filters to narrow`
        : `${allCount} objects visible tonight · showing their path across the sky`)
    : `No objects above ${plannerMinAlt}° for the selected night`;

  const traces = [];
  visible.forEach((p, idx) => {
    const color = ALT_PALETTE[idx % ALT_PALETTE.length];
    const dash  = ALT_DASHES[Math.floor(idx / ALT_PALETTE.length) % ALT_DASHES.length];
    // Clip below-horizon points (break the line at the horizon with null).
    const r = [], theta = [], mSize = [], mSymbol = [], mLine = [], cust = [], hov = [];
    for (const row of p.rows) {
      const above = row.alt >= 0;
      r.push(above ? 90 - row.alt : null);
      theta.push(above ? row.az : null);
      const hourly = row.i % 4 === 0;               // whole-hour marker
      const isTransit = row.i === p.peakIdx;
      mSize.push(isTransit ? 13 : (hourly ? 7 : 0));
      // Full dark = filled marker; twilight = hollow marker; transit = star.
      const dark = sunAlts[row.i] < -18;
      mSymbol.push(isTransit ? 'star' : (dark ? 'circle' : 'circle-open'));
      mLine.push(dark ? 0 : 1.5);
      cust.push(p.obj.id);
      hov.push(`${formatHour(steps[row.i].x)} · Alt ${row.alt.toFixed(0)}° · ${compassDir(row.az)} ${row.az.toFixed(0)}°`);
    }
    traces.push({
      type: 'scatterpolar',
      r, theta,
      mode: 'lines+markers',
      name: plannerLabel(p.obj),
      line: { color, width: 2, dash },
      marker: { size: mSize, symbol: mSymbol, color,
        line: { color, width: mLine } },
      connectgaps: false,
      customdata: cust,
      text: hov,
      hovertemplate: `<b>${plannerLabel(p.obj)}</b><br>%{text}<extra></extra>`,
    });
  });

  if (!visible.length) {
    Plotly.react('planner-skypath', [], {
      paper_bgcolor: '#0B1426', plot_bgcolor: '#0B1426', height: 300,
      annotations: [{ text: `No objects above ${plannerMinAlt}° for the selected night`, x: 0.5, y: 0.5, xref: 'paper', yref: 'paper', showarrow: false, font: { color: '#87ceeb', size: 14 } }],
      margin: { l: 20, r: 20, t: 20, b: 20 },
    }, PLOTLY_CONFIG);
    return;
  }

  Plotly.react('planner-skypath', traces, {
    paper_bgcolor: '#0B1426',
    height: 640,
    font: { color: 'white', family: 'Arial, Helvetica, sans-serif' },
    margin: { l: 40, r: 40, t: 30, b: 30 },
    showlegend: true,
    legend: { bgcolor: 'rgba(26,37,64,0.85)', font: { size: 11, color: 'white' }, x: 1.02, y: 1 },
    polar: {
      bgcolor: '#0d1830',
      // Horizon at the outer rim, zenith at the center (r = 90 − altitude).
      radialaxis: {
        range: [0, 90], angle: 90,
        tickvals: [0, 30, 60, 90], ticktext: ['90°', '60°', '30°', '0°'],
        tickfont: { color: '#aabbcc', size: 10 }, gridcolor: 'rgba(128,128,128,0.25)',
        linecolor: 'rgba(128,128,128,0.25)',
      },
      // Compass rose: N at top, clockwise through E / S / W.
      angularaxis: {
        direction: 'clockwise', rotation: 90,
        tickmode: 'array', tickvals: [0, 45, 90, 135, 180, 225, 270, 315],
        ticktext: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
        tickfont: { color: '#ccddee', size: 12 }, gridcolor: 'rgba(128,128,128,0.2)',
        linecolor: 'rgba(128,128,128,0.25)',
      },
    },
    annotations: [{
      x: 0, y: 1.04, xref: 'paper', yref: 'paper', showarrow: false, xanchor: 'left',
      text: '● full dark   ○ twilight   ★ transit   ·   hourly markers',
      font: { color: '#8fa4c4', size: 11 },
    }],
  }, { displayModeBar: true, modeBarButtonsToRemove: ['lasso2d', 'select2d'], responsive: false });

  const el = document.getElementById('planner-skypath');
  el.removeAllListeners?.('plotly_click');
  el.on('plotly_click', data => {
    const pt = data.points[0];
    if (!pt.customdata) return;
    openDetailPanel(Array.isArray(pt.customdata) ? pt.customdata[0] : pt.customdata);
  });
}

function updatePlanner() {
  if (currentTab !== 'planner') return;
  const data = getFilteredData();
  document.getElementById('planner-chart').style.display    = plannerView === 'gantt'    ? '' : 'none';
  document.getElementById('planner-altitude').style.display = plannerView === 'altitude' ? '' : 'none';
  document.getElementById('planner-skypath').style.display  = plannerView === 'skypath'  ? '' : 'none';
  if      (plannerView === 'gantt')    buildPlannerChart(data);
  else if (plannerView === 'altitude') buildAltitudeChart(data);
  else                                 buildSkyPathChart(data);
}

function updateLocationBarVisibility() {
  // Location controls live in the tab row and stay visible on every tab.
  document.getElementById('location-bar').style.display = '';
}

function initPlanner() {
  const today = new Date();
  plannerDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  document.getElementById('planner-date').value = plannerDate;

  document.getElementById('planner-date').addEventListener('change', e => {
    plannerDate = e.target.value;
    updatePlanner();
  });

  const minAltEl    = document.getElementById('planner-min-alt');
  const minAltLabel = document.getElementById('planner-min-alt-label');
  minAltEl.addEventListener('input', () => {
    plannerMinAlt = parseInt(minAltEl.value, 10);
    minAltLabel.textContent = plannerMinAlt + '°';
    updatePlanner();
  });

  document.querySelectorAll('input[name="planner-view"]').forEach(radio =>
    radio.addEventListener('change', () => {
      plannerView = radio.value;
      updatePlanner();
    })
  );
}

document.addEventListener('DOMContentLoaded', init);
