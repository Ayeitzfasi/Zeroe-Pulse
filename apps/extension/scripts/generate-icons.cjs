// Simple script to generate placeholder icons
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Zeroe Blue color
const BLUE = '#2673EA';

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create a simple colored square PNG (base64 encoded)
// This creates minimal valid PNG files
function createPlaceholderPng(size) {
  // Minimal PNG structure - creates a solid colored square
  // For a real project, use actual branded icons

  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // Length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(size, 8); // Width
  ihdr.writeUInt32BE(size, 12); // Height
  ihdr.writeUInt8(8, 16); // Bit depth
  ihdr.writeUInt8(2, 17); // Color type (RGB)
  ihdr.writeUInt8(0, 18); // Compression
  ihdr.writeUInt8(0, 19); // Filter
  ihdr.writeUInt8(0, 20); // Interlace

  // Calculate CRC for IHDR
  const crcIhdr = crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(crcIhdr, 21);

  // Create image data - solid Zeroe Blue
  const r = parseInt(BLUE.slice(1, 3), 16);
  const g = parseInt(BLUE.slice(3, 5), 16);
  const b = parseInt(BLUE.slice(5, 7), 16);

  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // Filter byte
    for (let x = 0; x < size; x++) {
      rawData.push(r, g, b);
    }
  }

  // Compress with zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));

  // IDAT chunk
  const idatLength = compressed.length;
  const idat = Buffer.alloc(idatLength + 12);
  idat.writeUInt32BE(idatLength, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  const crcIdat = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  idat.writeUInt32BE(crcIdat, idatLength + 8);

  // IEND chunk
  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 implementation for PNG
function crc32(buf) {
  let crc = 0xffffffff;
  const table = [];

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }

  for (let i = 0; i < buf.length; i++) {
    crc = (table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }

  return (crc ^ 0xffffffff) >>> 0;
}

// Generate icons
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const png = createPlaceholderPng(size);
  const filename = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename}`);
});

console.log('Placeholder icons generated!');
console.log('Note: Replace with actual branded icons before production.');
