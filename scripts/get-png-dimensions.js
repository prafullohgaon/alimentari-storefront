// scripts/get-png-dimensions.js
// Simple Node script that reads PNG header to extract width & height.
// Works without external dependencies.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../artifacts/mega-menu-screenshots');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
files.forEach(file => {
  const filePath = path.join(dir, file);
  const buffer = Buffer.alloc(24);
  const fd = fs.openSync(filePath, 'r');
  // Read first 24 bytes (PNG signature + IHDR chunk header)
  fs.readSync(fd, buffer, 0, 24, 0);
  fs.closeSync(fd);
  // Verify PNG signature
  const signature = buffer.slice(0, 8);
  const pngSig = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if (!signature.equals(pngSig)) {
    console.log(`${file}: not a PNG`);
    return;
  }
  // Width and height are big‑endian 4‑byte integers at offset 16 and 20
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  console.log(`${file}: ${width}x${height}`);
});
