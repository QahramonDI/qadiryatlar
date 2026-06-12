/**
 * Generate geographically accurate Uzbekistan viloyat map SVG from GeoJSON.
 * Run: node scripts/generate-uz-map-svg.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GEOJSON_PATH = path.join(ROOT, "assets", "uz-regions.geojson");
const SVG_PATH = path.join(ROOT, "assets", "uz-map-official.svg");
const CENTROIDS_PATH = path.join(ROOT, "scripts", "uz-map-centroids.json");

const NAME_TO_ID = {
  "Republic of Karakalpakstan": "qoraqalpogiston",
  "Khorezm region": "xorazm",
  "Navoi region": "navoiy",
  "Bukhara region": "buxoro",
  "Kashkadarya province": "qashqadaryo",
  "Surkhandarya region": "surxondaryo",
  "Samarkand region": "samarqand",
  "Jizzakh region": "jizzax",
  "Syrdarya region": "sirdaryo",
  "Tashkent city": "toshkent",
  "Tashkent region": "toshkent",
  "Namangan region": "namangan",
  "Andijan region": "andijon",
  "Fergana region": "fargona",
};

/** Milliy palette — soft flag blues, greens, golds, cream */
const REGION_STYLE = {
  qoraqalpogiston: { fill: "#c8e6f0", stroke: "#7eb8cc" },
  xorazm: { fill: "#f2e8d4", stroke: "#c4a86a" },
  navoiy: { fill: "#e4f0dc", stroke: "#8fbf7a" },
  buxoro: { fill: "#e8ddf0", stroke: "#a88fc4" },
  qashqadaryo: { fill: "#fde8c8", stroke: "#d4a050" },
  surxondaryo: { fill: "#d4ecd4", stroke: "#5a9e5c" },
  samarqand: { fill: "#fff0c8", stroke: "#d4a830" },
  jizzax: { fill: "#d8eef0", stroke: "#5aaeb8" },
  sirdaryo: { fill: "#d0f0e4", stroke: "#1EB53A" },
  toshkent: { fill: "#cce8f4", stroke: "#0099B5" },
  namangan: { fill: "#f0dce8", stroke: "#c47a9a" },
  andijon: { fill: "#e0dce8", stroke: "#8878a8" },
  fargona: { fill: "#fce4dc", stroke: "#d47868" },
};

/** Simplified Aral Sea remnant (lon/lat) for visual water body */
const ARAL_SEA_RINGS = [
  [
    [58.2, 46.6],
    [59.8, 46.8],
    [61.2, 46.2],
    [61.8, 45.4],
    [61.0, 44.6],
    [59.5, 44.2],
    [58.0, 44.8],
    [57.5, 45.8],
    [58.2, 46.6],
  ],
  [
    [59.0, 43.8],
    [60.5, 44.0],
    [61.5, 43.2],
    [61.0, 42.4],
    [59.8, 42.2],
    [58.8, 42.8],
    [59.0, 43.8],
  ],
];

const VB_W = 820;
const VB_H = 520;
const PAD = 28;

function extractPolygons(geometry) {
  const polys = [];
  function walk(geom) {
    if (!geom) return;
    if (geom.type === "Polygon") polys.push(geom.coordinates);
    else if (geom.type === "MultiPolygon") geom.coordinates.forEach((p) => polys.push(p));
    else if (geom.type === "GeometryCollection") (geom.geometries || []).forEach(walk);
  }
  walk(geometry);
  return polys;
}

function collectLonLat(polys, extra = []) {
  const pts = [];
  for (const poly of polys) {
    for (const ring of poly) {
      for (const [lon, lat] of ring) pts.push([lon, lat]);
    }
  }
  for (const ring of extra) {
    for (const [lon, lat] of ring) pts.push([lon, lat]);
  }
  return pts;
}

function ringCentroid(ring) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-12) {
    const sx = ring.reduce((s, p) => s + p[0], 0);
    const sy = ring.reduce((s, p) => s + p[1], 0);
    return [sx / ring.length, sy / ring.length];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function polygonArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) * 0.5;
}

function perpendicularDistance(pt, lineStart, lineEnd) {
  const [x, y] = pt;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return Math.hypot(x - px, y - py);
}

function simplifyRing(ring, tolerance) {
  if (ring.length <= 4) return ring;
  let maxDist = 0;
  let idx = 0;
  const end = ring.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(ring[i], ring[0], ring[end]);
    if (d > maxDist) {
      maxDist = d;
      idx = i;
    }
  }
  if (maxDist > tolerance) {
    const left = simplifyRing(ring.slice(0, idx + 1), tolerance);
    const right = simplifyRing(ring.slice(idx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [ring[0], ring[end]];
}

function simplifyPolygon(coords, tolerance) {
  return coords.map((ring) => simplifyRing(ring, tolerance));
}

function ringToPath(ring, project) {
  return (
    ring
      .map((pt, i) => {
        const [x, y] = project(pt[0], pt[1]);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

function polygonToPath(coords, project) {
  return coords.map((ring) => ringToPath(ring, project)).join(" ");
}

function main() {
  const geo = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));

  const regionPolys = {};
  for (const feature of geo.features) {
    const id = NAME_TO_ID[feature.properties.ADM1_EN];
    if (!id) {
      console.warn("Unmapped feature:", feature.properties.ADM1_EN);
      continue;
    }
    const polys = extractPolygons(feature.geometry);
    if (!regionPolys[id]) regionPolys[id] = [];
    regionPolys[id].push(...polys);
  }

  const allPolys = Object.values(regionPolys).flat();
  const allPts = collectLonLat(allPolys, ARAL_SEA_RINGS);
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of allPts) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  const innerW = VB_W - PAD * 2;
  const innerH = VB_H - PAD * 2;
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;

  function project(lon, lat) {
    const x = PAD + ((lon - minLon) / lonSpan) * innerW;
    const y = PAD + ((maxLat - lat) / latSpan) * innerH;
    return [x, y];
  }

  const centroids = {};
  const regionAcc = {};

  for (const [id, polys] of Object.entries(regionPolys)) {
    let totalArea = 0;
    let sumX = 0;
    let sumY = 0;
    for (const poly of polys) {
      const ring = poly[0];
      const area = polygonArea(ring);
      const [lon, lat] = ringCentroid(ring);
      const [x, y] = project(lon, lat);
      totalArea += area;
      sumX += x * area;
      sumY += y * area;
    }
    if (totalArea > 0) {
      const cx = sumX / totalArea;
      const cy = sumY / totalArea;
      regionAcc[id] = { cx, cy, area: totalArea };
    }
  }

  const REQUIRED = [
    "qoraqalpogiston", "xorazm", "navoiy", "buxoro", "qashqadaryo",
    "surxondaryo", "samarqand", "jizzax", "sirdaryo", "toshkent",
    "namangan", "andijon", "fargona",
  ];
  for (const id of REQUIRED) {
    if (!regionAcc[id]) throw new Error(`Missing region: ${id}`);
    centroids[id] = {
      mapX: Math.round((regionAcc[id].cx / VB_W) * 1000) / 10,
      mapY: Math.round((regionAcc[id].cy / VB_H) * 1000) / 10,
    };
  }

  const SIMPLIFY_TOL = 0.012;
  const pathEls = [];
  for (const id of REQUIRED) {
    const style = REGION_STYLE[id];
    const d = regionPolys[id]
      .map((poly) => polygonToPath(simplifyPolygon(poly, SIMPLIFY_TOL), project))
      .join(" ");
    pathEls.push(
      `<path class="uz-map-region" data-region="${id}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="1.2" stroke-linejoin="round" d="${d}"/>`
    );
  }

  const aralD = ARAL_SEA_RINGS.map((ring) => ringToPath(ring, project)).join(" ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="O'zbekiston viloyatlari xaritasi" class="uz-map-svg">
  <defs>
    <pattern id="uz-ikat-pattern" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
      <rect width="24" height="24" fill="#fff9f0"/>
      <path d="M0 12h24M12 0v24" stroke="#e8dcc8" stroke-width="0.5" opacity="0.35"/>
      <circle cx="6" cy="6" r="1.2" fill="#d4a050" opacity="0.12"/>
      <circle cx="18" cy="18" r="1.2" fill="#0099B5" opacity="0.1"/>
    </pattern>
    <linearGradient id="uz-map-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffef8"/>
      <stop offset="55%" stop-color="#fff8ee"/>
      <stop offset="100%" stop-color="#f8f4ec"/>
    </linearGradient>
  </defs>
  <rect class="uz-map-bg-rect" width="${VB_W}" height="${VB_H}" rx="16" fill="url(#uz-ikat-pattern)"/>
  <rect class="uz-map-bg-rect" width="${VB_W}" height="${VB_H}" rx="16" fill="url(#uz-map-bg)" opacity="0.92"/>
  <g class="uz-map-waters">
    <path class="uz-map-water" d="${aralD}" fill="#b8d8e8" stroke="#8ab8cc" stroke-width="0.8" opacity="0.85"/>
  </g>
  <g class="uz-map-regions" fill-rule="evenodd">
    ${pathEls.join("\n    ")}
  </g>
  <g class="uz-map-borders" fill="none" stroke="#9a9080" stroke-width="0.6" opacity="0.45" pointer-events="none">
    ${pathEls.map((p) => p.replace('class="uz-map-region"', 'class="uz-map-border"')).join("\n    ")}
  </g>
</svg>
`;

  fs.writeFileSync(SVG_PATH, svg, "utf8");
  fs.writeFileSync(CENTROIDS_PATH, JSON.stringify({ viewBox: [VB_W, VB_H], centroids }, null, 2), "utf8");

  console.log("Wrote", SVG_PATH);
  console.log("Wrote", CENTROIDS_PATH);
  console.log("Centroids (mapX, mapY %):");
  for (const id of REQUIRED) {
    const c = centroids[id];
    console.log(`  ${id}: mapX=${c.mapX}, mapY=${c.mapY}`);
  }
}

main();
