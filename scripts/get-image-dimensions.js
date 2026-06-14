// scripts/get-image-dimensions.js
// Simple Node script to read PNG header and output width/height for given files
const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  // PNG signature is 8 bytes, then IHDR chunk starts at offset 8, length 4, type 4, then width/height 4 each
  if (buffer.toString('utf8',0,8) !== '\x89PNG\r\n\x1a\n') {
    throw new Error('Not a PNG file');
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return {width, height};
}

const files = [
  'closed-1440.png',
  'open-1440.png',
  'open-1280.png',
  'open-1024.png'
];

const baseDir = path.resolve(__dirname, '../artifacts/mega-menu-screenshots');
files.forEach(f => {
  const fp = path.join(baseDir, f);
  try {
    const dim = getPngDimensions(fp);
    console.log(`${f}: ${dim.width}x${dim.height}`);
  } catch (e) {
    console.error(`${f}: error ${e.message}`);
  }
});
