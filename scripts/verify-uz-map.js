const fs = require("fs");
const path = require("path");

const svg = fs.readFileSync(path.join(__dirname, "../assets/uz-map-official.svg"), "utf8");
const ids = [...svg.matchAll(/class="uz-map-region"[^>]*data-region="([^"]+)"/g)].map((m) => m[1]);
const unique = [...new Set(ids)].sort();
const required = [
  "qoraqalpogiston", "xorazm", "navoiy", "buxoro", "qashqadaryo",
  "surxondaryo", "samarqand", "jizzax", "sirdaryo", "toshkent",
  "namangan", "andijon", "fargona",
];
const missing = required.filter((id) => !unique.includes(id));
console.log("Region paths:", ids.length, "| unique:", unique.length);
console.log("IDs:", unique.join(", "));
if (missing.length) {
  console.error("MISSING:", missing.join(", "));
  process.exit(1);
}
console.log("OK — all 13 regions present");
