const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

test('offline build preserves literal replacement tokens, escapes script ends and hashes files', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'delta-eq-build-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'dist'));
  fs.copyFileSync(path.join(__dirname, '../build.js'), path.join(root, 'build.js'));
  fs.writeFileSync(path.join(root, 'dist/index.html'), '<link rel="stylesheet" href="styles.css"><script src="core.js"></script><script src="app.js"></script>');
  fs.writeFileSync(path.join(root, 'dist/styles.css'), '/* $& $` $\' */');
  fs.writeFileSync(path.join(root, 'dist/core.js'), 'const text = "$& $` </script>";');
  fs.writeFileSync(path.join(root, 'dist/app.js'), 'console.log("offline");');
  execFileSync(process.execPath, [path.join(root, 'build.js')]);
  const html = fs.readFileSync(path.join(root, 'Delta-EQ-Offline.html'), 'utf8');
  assert.ok(html.includes('/* $& $` $\' */'));
  assert.ok(html.includes('const text = "$& $` <\\/script>";'));
  assert.ok(!html.includes('src="core.js"'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'MANIFEST.json'), 'utf8'));
  assert.equal(manifest['Delta-EQ-Offline.html'].bytes, Buffer.byteLength(html));
  assert.equal(manifest['Delta-EQ-Offline.html'].sha256, crypto.createHash('sha256').update(html).digest('hex'));
  assert.ok(!manifest['MANIFEST.json']);
});
