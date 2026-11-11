const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = __dirname;
const dist = path.join(root, 'dist');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
// Use replacement callbacks so source containing $& or $` remains literal.
html = html.replace('<link rel="stylesheet" href="styles.css">',
  () => '<style>' + fs.readFileSync(path.join(dist, 'styles.css'), 'utf8') + '</style>');
for (const file of ['core.js', 'app.js']) {
  html = html.replace('<script src="' + file + '"></script>',
    () => '<script>' + fs.readFileSync(path.join(dist, file), 'utf8').replace(/<\/script/gi, '<\\/script') + '</script>');
}
fs.writeFileSync(path.join(root, 'Delta-EQ-Offline.html'), html);
const manifest = {};
function record(relative = '') {
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.posix.join(relative, entry.name);
    if (['.git', 'node_modules', '_site', '.artifacts', 'qa'].includes(entry.name) || ['MANIFEST.json', '.DS_Store'].includes(entry.name)) continue;
    if (entry.isDirectory()) record(file);
    else if (entry.isFile()) {
      const bytes = fs.readFileSync(path.join(root, file));
      manifest[file] = { bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
    }
  }
}
record();
fs.writeFileSync(path.join(root, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Built standalone offline HTML, ' + Buffer.byteLength(html) + ' bytes; refreshed file manifest.');
