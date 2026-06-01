const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const cssnano = require("cssnano");
const terser = require("terser");
const { minify: minifyHtml } = require("html-minifier-terser");

const rootDir = path.join(__dirname, "..");

const assets = [
  { source: "index.html", target: "index.html", type: "html" },
  { source: "product.html", target: "product.html", type: "html" },
  { source: "cart.html", target: "cart.html", type: "html" },
  { source: "auth.html", target: "auth.html", type: "html" },
  { source: "checkout.html", target: "checkout.html", type: "html" },
  { source: "styles/main.css", target: "styles/main.min.css", type: "css" },
  { source: "scripts/app.js", target: "scripts/app.min.js", type: "js" },
  { source: "scripts/auth.js", target: "scripts/auth.min.js", type: "js" },
  { source: "scripts/cart.js", target: "scripts/cart.min.js", type: "js" },
  {
    source: "scripts/checkout.js",
    target: "scripts/checkout.min.js",
    type: "js",
  },
  { source: "scripts/product.js", target: "scripts/product.min.js", type: "js" },
  {
    source: "scripts/userStatus.js",
    target: "scripts/userStatus.min.js",
    type: "js",
  },
];

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

let totalBefore = 0;
let totalAfter = 0;

(async () => {
  for (const { source, target, type } of assets) {
    const sourcePath = path.join(rootDir, source);
    const targetPath = path.join(rootDir, target);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Skipped missing asset: ${source}`);
      continue;
    }

    const input = fs.readFileSync(sourcePath, "utf8");
    let output = "";

    if (type === "css") {
      const result = await postcss([cssnano({ preset: "default" })]).process(
        input,
        { from: sourcePath, to: targetPath },
      );
      output = result.css;
    } else if (type === "html") {
      output = await minifyHtml(input, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        decodeEntities: false,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
        removeRedundantAttributes: true,
      });
    } else {
      const result = await terser.minify(input, {
        module: source.endsWith("auth.js"),
        compress: true,
        mangle: true,
        format: { comments: false },
      });

      if (result.error) {
        throw result.error;
      }
      output = result.code || "";
    }

    fs.writeFileSync(targetPath, `${output}\n`);

    const before = Buffer.byteLength(input);
    const after = Buffer.byteLength(output);
    totalBefore += before;
    totalAfter += after;

    console.log(
      `${source} -> ${target}: ${formatBytes(before)} to ${formatBytes(after)}`,
    );
  }

  const saved = totalBefore - totalAfter;
  const percent = totalBefore
    ? ((saved / totalBefore) * 100).toFixed(1)
    : "0.0";
  console.log(`Saved ${formatBytes(saved)} (${percent}%) across static assets.`);
})().catch((error) => {
  console.error("Minification failed:", error);
  process.exitCode = 1;
});
