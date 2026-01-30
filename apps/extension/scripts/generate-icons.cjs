// Script to generate Zeroe Pulse AI icons with gradient
// Run: node scripts/generate-icons.cjs

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Zeroe gradient colors
const COLORS = {
  blue: { r: 38, g: 115, b: 234 },      // #2673EA
  purple: { r: 139, g: 123, b: 158 },   // #8B7B9E
  coral: { r: 224, g: 112, b: 101 },    // #E07065
};

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Interpolate between two colors
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function getGradientColor(x, width) {
  const t = x / width;

  if (t < 0.5) {
    // Blue to Purple
    const localT = t * 2;
    return {
      r: lerp(COLORS.blue.r, COLORS.purple.r, localT),
      g: lerp(COLORS.blue.g, COLORS.purple.g, localT),
      b: lerp(COLORS.blue.b, COLORS.purple.b, localT),
    };
  } else {
    // Purple to Coral
    const localT = (t - 0.5) * 2;
    return {
      r: lerp(COLORS.purple.r, COLORS.coral.r, localT),
      g: lerp(COLORS.purple.g, COLORS.coral.g, localT),
      b: lerp(COLORS.purple.b, COLORS.coral.b, localT),
    };
  }
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

function createGradientIcon(size) {
  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // Length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(size, 8); // Width
  ihdr.writeUInt32BE(size, 12); // Height
  ihdr.writeUInt8(8, 16); // Bit depth
  ihdr.writeUInt8(6, 17); // Color type (RGBA)
  ihdr.writeUInt8(0, 18); // Compression
  ihdr.writeUInt8(0, 19); // Filter
  ihdr.writeUInt8(0, 20); // Interlace

  const crcIhdr = crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(crcIhdr, 21);

  // Create image data - gradient bar icon
  const rawData = [];
  const barHeight = Math.max(2, Math.floor(size * 0.15)); // 15% of size
  const barTop = Math.floor((size - barHeight) / 2);
  const barBottom = barTop + barHeight;
  const padding = Math.floor(size * 0.1); // 10% padding
  const barLeft = padding;
  const barRight = size - padding;
  const cornerRadius = Math.max(1, Math.floor(barHeight / 2));

  for (let y = 0; y < size; y++) {
    rawData.push(0); // Filter byte
    for (let x = 0; x < size; x++) {
      // Check if within bar bounds (with rounded corners)
      const inBarY = y >= barTop && y < barBottom;
      const inBarX = x >= barLeft && x < barRight;

      let inBar = false;
      if (inBarY && inBarX) {
        // Check rounded corners
        const localY = y - barTop;
        const localX = x - barLeft;
        const barWidth = barRight - barLeft;
        const barH = barBottom - barTop;

        // Distance from corners
        const leftDist = localX;
        const rightDist = barWidth - localX - 1;
        const topDist = localY;
        const bottomDist = barH - localY - 1;

        // Check if in corner regions
        if (leftDist < cornerRadius && topDist < cornerRadius) {
          // Top-left corner
          const dx = cornerRadius - leftDist - 1;
          const dy = cornerRadius - topDist - 1;
          inBar = (dx * dx + dy * dy) <= cornerRadius * cornerRadius;
        } else if (rightDist < cornerRadius && topDist < cornerRadius) {
          // Top-right corner
          const dx = cornerRadius - rightDist - 1;
          const dy = cornerRadius - topDist - 1;
          inBar = (dx * dx + dy * dy) <= cornerRadius * cornerRadius;
        } else if (leftDist < cornerRadius && bottomDist < cornerRadius) {
          // Bottom-left corner
          const dx = cornerRadius - leftDist - 1;
          const dy = cornerRadius - bottomDist - 1;
          inBar = (dx * dx + dy * dy) <= cornerRadius * cornerRadius;
        } else if (rightDist < cornerRadius && bottomDist < cornerRadius) {
          // Bottom-right corner
          const dx = cornerRadius - rightDist - 1;
          const dy = cornerRadius - bottomDist - 1;
          inBar = (dx * dx + dy * dy) <= cornerRadius * cornerRadius;
        } else {
          inBar = true;
        }
      }

      if (inBar) {
        const color = getGradientColor(x - barLeft, barRight - barLeft);
        rawData.push(color.r, color.g, color.b, 255);
      } else {
        // Transparent
        rawData.push(0, 0, 0, 0);
      }
    }
  }

  // Compress with zlib
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

// Generate icons
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const png = createGradientIcon(size);
  const filename = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename} (${png.length} bytes)`);
});

console.log('Gradient icons generated!');
