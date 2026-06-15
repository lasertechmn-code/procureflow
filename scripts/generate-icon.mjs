// Generates the application icon (build/icon.png) used by electron-builder,
// plus a matching SVG (public/icon.svg) for the in-app favicon / splash.
// Pure Node — no external dependencies (manual PNG encoder via zlib).

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const W = 512;
const H = 512;

// Palette (matches app theme)
const BG = [11, 11, 15];        // near-black panel
const BRAND = [59, 130, 246];   // electric blue

const buf = Buffer.alloc(W * H * 4); // RGBA, transparent by default

function setPx(x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = r;
  buf[i + 1] = g;
  buf[i + 2] = b;
  buf[i + 3] = a;
}

// Rounded rectangle hit test
function inRoundedRect(x, y, w, h, r) {
  if (x < 0 || y < 0 || x >= w || y >= h) return false;
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// Pointy-top hexagon vertices centered at (cx, cy) with given radius
function hexVerts(cx, cy, radius) {
  const v = [];
  for (let i = 0; i < 6; i++) {
    const ang = (-90 + 60 * i) * (Math.PI / 180);
    v.push([cx + radius * Math.cos(ang), cy + radius * Math.sin(ang)]);
  }
  return v;
}

function inPolygon(px, py, verts) {
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const [xi, yi] = verts[i];
    const [xj, yj] = verts[j];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const cx = W / 2;
const cy = H / 2;
const outer = hexVerts(cx, cy, 168);
const inner = hexVerts(cx, cy, 112);
const dotR = 38;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (!inRoundedRect(x, y, W, H, 96)) continue; // transparent outside rounded square

    let color = BG;

    const inOuter = inPolygon(x + 0.5, y + 0.5, outer);
    const inInner = inPolygon(x + 0.5, y + 0.5, inner);
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    const inDot = dx * dx + dy * dy <= dotR * dotR;

    if ((inOuter && !inInner) || inDot) {
      color = BRAND;
    }

    setPx(x, y, color, 255);
  }
}

// ---- Minimal PNG encoder ----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const raw = Buffer.alloc((W * 4 + 1) * H);
let p = 0;
for (let y = 0; y < H; y++) {
  raw[p++] = 0; // filter: none
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    raw[p++] = buf[i];
    raw[p++] = buf[i + 1];
    raw[p++] = buf[i + 2];
    raw[p++] = buf[i + 3];
  }
}
const idat = deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(resolve(root, 'build'), { recursive: true });
mkdirSync(resolve(root, 'public'), { recursive: true });

writeFileSync(resolve(root, 'build', 'icon.png'), png);

// Matching SVG for favicon + splash
const ov = outer.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const iv = inner.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="96" fill="rgb(${BG.join(',')})"/>
  <polygon points="${ov}" fill="rgb(${BRAND.join(',')})"/>
  <polygon points="${iv}" fill="rgb(${BG.join(',')})"/>
  <circle cx="${cx}" cy="${cy}" r="${dotR}" fill="rgb(${BRAND.join(',')})"/>
</svg>
`;
writeFileSync(resolve(root, 'public', 'icon.svg'), svg);

console.log('Generated build/icon.png and public/icon.svg');
