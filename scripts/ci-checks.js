const fs = require("fs");
const path = require("path");
const pages = [
  "index.html",
  "product.html",
  "cart.html",
  "auth.html",
  "checkout.html",
];
const results = {
  brokenLinks: [],
  missingAlts: [],
  missingLang: false,
  minifiedAssets: [],
};
// Broken links
for (const page of pages) {
  if (!fs.existsSync(page)) continue;
  const content = fs.readFileSync(page, "utf8");
  const regex = /(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = regex.exec(content))) {
    let val = m[1];
    if (/^(?:https?:|mailto:|tel:|data:)/.test(val)) continue;
    const [hrefPath] = val.split("#");
    if (!hrefPath) continue;
    if (hrefPath === "") continue;
    const filePath = path.resolve(path.dirname(page), hrefPath);
    if (!fs.existsSync(filePath)) results.brokenLinks.push({ page, val });
  }
}
// Alt attributes for images
for (const page of pages) {
  if (!fs.existsSync(page)) continue;
  const content = fs.readFileSync(page, "utf8");
  const imgRegex = /<img[^>]*>/g;
  let im;
  while ((im = imgRegex.exec(content))) {
    const tag = im[0];
    if (!/\salt=\s*"[^"]*"/.test(tag)) results.missingAlts.push({ page, tag });
  }
}
// lang attr on html
if (fs.existsSync("index.html")) {
  const c = fs.readFileSync("index.html", "utf8");
  if (!/\<html[^>]*\slang=/.test(c)) results.missingLang = true;
}
// Minified assets exist in scripts and styles
const assets = [
  "styles/main.min.css",
  "scripts/app.min.js",
  "scripts/product.min.js",
  "scripts/cart.min.js",
  "scripts/auth.min.js",
];
for (const a of assets) {
  results.minifiedAssets.push({ asset: a, exists: fs.existsSync(a) });
}
// write to public (create if needed)
if (!fs.existsSync("public")) fs.mkdirSync("public");
fs.writeFileSync("public/ci-checks.json", JSON.stringify(results, null, 2));
console.log("wrote public/ci-checks.json");
process.exit(0);
