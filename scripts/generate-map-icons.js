const fs = require("fs");
const path = require("path");

const REGIONS = [
  { id: "qoraqalpogiston", emoji: "🐟", color: "#0099B5" },
  { id: "xorazm", emoji: "🏰", color: "#c4a86a" },
  { id: "navoiy", emoji: "⛰️", color: "#8fbf7a" },
  { id: "buxoro", emoji: "🕌", color: "#a88fc4" },
  { id: "qashqadaryo", emoji: "🐎", color: "#d4a050" },
  { id: "surxondaryo", emoji: "🌿", color: "#1EB53A" },
  { id: "samarqand", emoji: "🕌", color: "#d4a830" },
  { id: "jizzax", emoji: "🌄", color: "#5aaeb8" },
  { id: "sirdaryo", emoji: "🌊", color: "#1EB53A" },
  { id: "toshkent", emoji: "🏙️", color: "#0099B5" },
  { id: "namangan", emoji: "🌷", color: "#c47a9a" },
  { id: "andijon", emoji: "📜", color: "#8878a8" },
  { id: "fargona", emoji: "🌸", color: "#d47868" },
];

const outDir = path.join(__dirname, "../assets/map-icons");
fs.mkdirSync(outDir, { recursive: true });

for (const r of REGIONS) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffef8"/>
      <stop offset="100%" stop-color="#f8f0e4"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="18" fill="url(#bg)"/>
  <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="${r.color}" stroke-width="2.5" opacity="0.85"/>
  <text x="32" y="38" text-anchor="middle" font-size="28">${r.emoji}</text>
</svg>`;
  fs.writeFileSync(path.join(outDir, `${r.id}.svg`), svg, "utf8");
}

console.log(`Generated ${REGIONS.length} map icons in assets/map-icons/`);
