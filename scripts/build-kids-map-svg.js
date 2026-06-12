/**
 * Rasmiy uz-map-official.svg konturlarini saqlab, bolalar uchun bezakli xarita SVG yaratadi.
 * node scripts/build-kids-map-svg.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OFFICIAL = path.join(ROOT, "assets", "uz-map-official.svg");
const OUT = path.join(ROOT, "assets", "uz-map-kids.svg");

const REGIONS = [
  { id: "qoraqalpogiston", mapX: 18.9, mapY: 36.6, c1: "#7ec8e3", c2: "#b8e6f4", art: "fish" },
  { id: "xorazm", mapX: 30.7, mapY: 56.1, c1: "#d4b896", c2: "#f2e8d4", art: "minaret" },
  { id: "navoiy", mapX: 48.8, mapY: 50.1, c1: "#9ecf8a", c2: "#dff0d4", art: "mountain" },
  { id: "buxoro", mapX: 45.3, mapY: 66.8, c1: "#b89fd4", c2: "#ebe0f5", art: "dome" },
  { id: "qashqadaryo", mapX: 58.3, mapY: 79.1, c1: "#e8b060", c2: "#fde8c8", art: "horse" },
  { id: "surxondaryo", mapX: 65.7, mapY: 86.7, c1: "#6ec87a", c2: "#d4ecd4", art: "leaf" },
  { id: "samarqand", mapX: 60, mapY: 70, c1: "#e8c860", c2: "#fff0c8", art: "registon" },
  { id: "jizzax", mapX: 66.9, mapY: 65.1, c1: "#7ec8d4", c2: "#d8eef0", art: "grape" },
  { id: "sirdaryo", mapX: 72.2, mapY: 63.9, c1: "#6ec8a0", c2: "#d0f0e4", art: "wheat" },
  { id: "toshkent", mapX: 78.2, mapY: 56.9, c1: "#7ec0e8", c2: "#cce8f4", art: "city" },
  { id: "namangan", mapX: 86.3, mapY: 58.8, c1: "#e8a0c0", c2: "#f0dce8", art: "flower" },
  { id: "andijon", mapX: 90.5, mapY: 61.5, c1: "#a898c8", c2: "#e0dce8", art: "book" },
  { id: "fargona", mapX: 86.4, mapY: 64.3, c1: "#e8a090", c2: "#fce4dc", art: "pomegranate" },
];

const ARTS = {
  fish: `<g opacity="0.38" fill="#1a7a9e"><ellipse cx="0" cy="4" rx="22" ry="10"/><path d="M18,-2 L28,4 L18,10 Z"/><circle cx="-6" cy="2" r="2" fill="#fff"/></g>`,
  minaret: `<g opacity="0.36" fill="#8b6914"><rect x="-4" y="-18" width="8" height="36" rx="2"/><rect x="-10" y="8" width="20" height="6" rx="1"/><path d="M-6,-22 L6,-22 L0,-30 Z"/></g>`,
  mountain: `<g opacity="0.38" fill="#5a8f4a"><path d="M-24,16 L-8,-20 L8,16 Z"/><path d="M-4,16 L12,-14 L28,16 Z" fill="#7aad6a"/></g>`,
  dome: `<g opacity="0.36" fill="#7a5a9e"><rect x="-14" y="0" width="28" height="16" rx="2"/><path d="M-16,0 Q0,-22 16,0" fill="#9a7abe"/><circle cx="0" cy="-8" r="3" fill="#e6821e"/></g>`,
  horse: `<g opacity="0.36" fill="#b87820"><ellipse cx="0" cy="6" rx="20" ry="10"/><path d="M14,-4 Q22,-14 18,-2"/><circle cx="-10" cy="0" r="4"/></g>`,
  leaf: `<g opacity="0.4" fill="#2e8a4f"><path d="M0,-20 C14,-10 14,10 0,20 C-14,10 -14,-10 0,-20 Z"/><path d="M0,-16 L0,16" stroke="#fff" stroke-width="1.5" fill="none"/></g>`,
  registon: `<g opacity="0.36" fill="#c4a030"><rect x="-18" y="4" width="10" height="18" rx="1"/><rect x="-4" y="-6" width="10" height="28" rx="1"/><rect x="10" y="2" width="10" height="20" rx="1"/></g>`,
  grape: `<g opacity="0.38" fill="#7a3a8a"><circle cx="-6" cy="0" r="5"/><circle cx="4" cy="-4" r="5"/><circle cx="4" cy="6" r="5"/><path d="M0,-12 L0,-22" stroke="#5a8f4a" stroke-width="2"/></g>`,
  wheat: `<g opacity="0.38" fill="#c4a030"><path d="M-8,16 L-8,-12"/><path d="M0,16 L0,-16"/><path d="M8,16 L8,-10"/><ellipse cx="-8" cy="-14" rx="4" ry="8" fill="#e8c860"/><ellipse cx="0" cy="-18" rx="4" ry="8" fill="#e8c860"/><ellipse cx="8" cy="-12" rx="4" ry="8" fill="#e8c860"/></g>`,
  city: `<g opacity="0.36" fill="#0099B5"><rect x="-16" y="-4" width="10" height="20" rx="1"/><rect x="-2" y="-14" width="12" height="30" rx="1"/><rect x="14" y="0" width="8" height="16" rx="1"/></g>`,
  flower: `<g opacity="0.4" fill="#c45a8a"><circle cx="0" cy="0" r="6" fill="#e8a0c0"/><circle cx="-10" cy="-4" r="5"/><circle cx="10" cy="-4" r="5"/><circle cx="-8" cy="8" r="5"/><circle cx="8" cy="8" r="5"/></g>`,
  book: `<g opacity="0.38" fill="#6a5a8a"><path d="M-16,-14 L0,-18 L16,-14 L16,14 L0,18 L-16,14 Z"/><path d="M0,-18 L0,18" stroke="#fff" stroke-width="1.2" fill="none"/></g>`,
  pomegranate: `<g opacity="0.4" fill="#c0354a"><circle cx="0" cy="2" r="14"/><path d="M-4,-12 Q0,-20 4,-12" fill="#5a8f4a"/><circle cx="-4" cy="4" r="2" fill="#fff" opacity="0.5"/><circle cx="5" cy="0" r="2" fill="#fff" opacity="0.5"/></g>`,
};

function extractRegionPaths(svg) {
  const re = /<path class="uz-map-region" data-region="([^"]+)"[^/]*\/>/g;
  const paths = [];
  let m;
  while ((m = re.exec(svg)) !== null) paths.push({ id: m[1], tag: m[0] });
  return paths;
}

function extractWater(svg) {
  const m = svg.match(/<g class="uz-map-waters">[\s\S]*?<\/g>/);
  return m ? m[0] : "";
}

function extractBorders(svg) {
  const m = svg.match(/<g class="uz-map-borders">[\s\S]*?<\/g>/);
  return m ? m[0] : "";
}

function pos(mapX, mapY) {
  return { x: (mapX / 100) * 820, y: (mapY / 100) * 520 };
}

function main() {
  const official = fs.readFileSync(OFFICIAL, "utf8");
  const regionPaths = extractRegionPaths(official);
  const waters = extractWater(official);
  const borders = extractBorders(official);

  const meta = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

  const defs = REGIONS.map(
    (r) => `
    <linearGradient id="grad-${r.id}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${r.c2}"/>
      <stop offset="100%" stop-color="${r.c1}"/>
    </linearGradient>
    <clipPath id="clip-${r.id}">${regionPaths.find((p) => p.id === r.id)?.tag.replace(/fill="[^"]*"/, 'fill="#000"') || ""}</clipPath>`
  ).join("");

  const regions = regionPaths
    .map((p) => {
      const r = meta[p.id];
      const fill = r ? `url(#grad-${r.id})` : "#e8e0d4";
      return p.tag
        .replace(/fill="[^"]*"/, `fill="${fill}"`)
        .replace(/stroke-width="1.2"/, 'stroke-width="1.6"')
        .replace(/class="uz-map-region"/, 'class="uz-map-region uz-map-region--kids"');
    })
    .join("\n    ");

  const artLayer = REGIONS.map((r) => {
    const { x, y } = pos(r.mapX, r.mapY);
    const art = ARTS[r.art] || "";
    return `<g clip-path="url(#clip-${r.id})" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${art}</g>`;
  }).join("\n    ");

  const decorIcons = REGIONS.map((r) => {
    const { x, y } = pos(r.mapX, r.mapY);
    return `<g class="uz-map-deco" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(0.55)" opacity="0.55">${ARTS[r.art] || ""}</g>`;
  }).join("\n    ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 520" role="img" aria-label="O'zbekiston viloyatlari xaritasi — bolalar uchun" class="uz-map-svg uz-map-svg--kids">
  <defs>
    <pattern id="uz-suzani" width="32" height="32" patternUnits="userSpaceOnUse">
      <rect width="32" height="32" fill="#fff9f0"/>
      <circle cx="8" cy="8" r="2" fill="#e6821e" opacity="0.15"/>
      <circle cx="24" cy="24" r="2" fill="#0099B5" opacity="0.12"/>
      <path d="M0 16h32M16 0v32" stroke="#e8dcc8" stroke-width="0.4" opacity="0.4"/>
    </pattern>
    <filter id="mapSoftShadow" x="-2%" y="-2%" width="104%" height="104%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#5b3a24" flood-opacity="0.12"/>
    </filter>
    ${defs}
  </defs>
  <rect width="820" height="520" rx="16" fill="url(#uz-suzani)"/>
  <rect width="820" height="520" rx="16" fill="#fff8ee" opacity="0.88"/>
  <rect x="10" y="10" width="800" height="500" rx="12" fill="none" stroke="#e6821e" stroke-width="3" opacity="0.25" stroke-dasharray="8 6"/>
  <g filter="url(#mapSoftShadow)">
    ${waters.replace('opacity="0.85"', 'opacity="0.92"').replace("#b8d8e8", "#a8d4ec")}
    <g class="uz-map-regions uz-map-regions--kids" fill-rule="evenodd">
    ${regions}
    </g>
    <g class="uz-map-art" pointer-events="none">
    ${artLayer}
    </g>
    ${borders.replace(/opacity="0.45"/, 'opacity="0.55"').replace(/stroke-width="0.6"/, 'stroke-width="0.8"')}
  </g>
  <g class="uz-map-frame-deco" pointer-events="none" opacity="0.35">
    <text x="24" y="36" font-family="Georgia,serif" font-size="14" fill="#7b3f00" font-weight="700">O'zbekiston</text>
    <text x="24" y="52" font-family="sans-serif" font-size="10" fill="#9a9080">Qadriyatlar xaritasi</text>
  </g>
</svg>`;

  fs.writeFileSync(OUT, svg, "utf8");
  console.log("Wrote", OUT);
}

main();
