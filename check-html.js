const fs = require('fs');
const path = require('path');
const pages = ['index.html','product.html','cart.html','auth.html','checkout.html'];
const missing = [];
for (const page of pages) {
  const content = fs.readFileSync(page, 'utf8');
  const regex = /(?:src|href)=\"([^\"]+)\"/g;
  let m;
  while ((m = regex.exec(content))) {
    let val = m[1];
    if (/^(?:https?:|mailto:|tel:|data:)/.test(val)) continue;
    const [hrefPath] = val.split('#');
    if (!hrefPath) continue;
    if (hrefPath === '') continue;
    const filePath = path.resolve(path.dirname(page), hrefPath);
    if (!fs.existsSync(filePath)) missing.push({ page, val });
  }
}
if (missing.length) {
  console.log('MISSING');
  missing.forEach(x => console.log(x.page + ' -> ' + x.val));
  process.exit(1);
}
console.log('OK');
