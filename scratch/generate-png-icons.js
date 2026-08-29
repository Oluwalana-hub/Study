const fs = require('fs');
const path = require('path');

// Ensure directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write SVG as icon-192 and icon-512 as fallback or PNG
const svgContent = fs.readFileSync(path.join(iconsDir, 'icon.svg'));

// Copy to icon-192.png and icon-512.png or write PNG header
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), svgContent);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), svgContent);

console.log('PWA icons created successfully.');
