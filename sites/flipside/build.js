/* Build: inline engine + app into a single self-contained index.html */
'use strict';
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src');

const page = fs.readFileSync(path.join(src, 'page.html'), 'utf8');
const engine = fs.readFileSync(path.join(src, 'ambigram.js'), 'utf8');
const app = fs.readFileSync(path.join(src, 'app.js'), 'utf8');

if (!page.includes('/*__ENGINE__*/') || !page.includes('/*__APP__*/')) {
  throw new Error('placeholders missing in page.html');
}
// strip the UMD wrapper export for inline use: keep as-is; it sets window.Ambigram.
const out = page
  .replace('/*__ENGINE__*/', '\n' + engine + '\n')
  .replace('/*__APP__*/', '\n' + app + '\n');

const dist = path.join(src, '..', 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), out);
console.log('built', path.join(dist, 'index.html'), out.length + ' bytes');
