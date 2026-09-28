const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.env.APPDATA, 'cs', 'data');
const destDir = path.join(__dirname, '..', 'seed_data');

fs.mkdirSync(destDir, { recursive: true });

const files = ['skins.json', 'prices.json', 'stickers_cache.json', 'agents_cache.json'];

for (const file of files) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    const sizeMB = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);
    console.log('Copied ' + file + ' (' + sizeMB + ' MB)');
  } else {
    console.warn('Warning: Source file not found: ' + src);
  }
}

console.log('Seed preparation completed successfully.');
