export interface ParsedImageHeader {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
  width: number;
  height: number;
}

export function parseImageHeader(bytes: Uint8Array): ParsedImageHeader | null {
  if (isPng(bytes)) return parsePng(bytes);
  if (isJpeg(bytes)) return parseJpeg(bytes);
  if (isWebp(bytes)) return parseWebp(bytes);
  if (isAvif(bytes)) return parseAvif(bytes);
  return null;
}

function parsePng(bytes: Uint8Array): ParsedImageHeader | null {
  let offset = 8;
  let dimensions: { width: number; height: number } | undefined;
  let hasData = false;
  while (offset + 12 <= bytes.length) {
    const length = readU32(bytes, offset);
    const end = offset + 12 + length;
    if (end > bytes.length) return null;
    const type = ascii(bytes, offset + 4, 4);
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== readU32(bytes, end - 4)) return null;
    if (!dimensions) {
      if (type !== 'IHDR' || length !== 13) return null;
      dimensions = { width: readU32(bytes, offset + 8), height: readU32(bytes, offset + 12) };
      const bitDepth = bytes[offset + 16];
      const colorType = bytes[offset + 17];
      const depths: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
      if (!depths[colorType!]?.includes(bitDepth!) || bytes[offset + 18] !== 0 || bytes[offset + 19] !== 0 || bytes[offset + 20]! > 1) return null;
    } else if (type === 'IHDR') return null;
    else if (/^[A-Z]/.test(type) && !['PLTE', 'IDAT', 'IEND'].includes(type)) return null;
    if (type === 'IDAT') hasData = hasData || length > 0;
    if (type === 'IEND') {
      return length === 0 && hasData && end === bytes.length
        ? { mimeType: 'image/png', ...dimensions }
        : null;
    }
    offset = end;
  }
  return null;
}

function parseJpeg(bytes: Uint8Array): ParsedImageHeader | null {
  let offset = 2;
  let dimensions: { width: number; height: number } | undefined;
  while (offset < bytes.length - 4) {
    if (bytes[offset] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (offset + 2 > bytes.length) return null;
    if (marker === 0xda) {
      const scanLength = readU16(bytes, offset);
      if (scanLength < 2 || offset + scanLength > bytes.length) return null;
      const scanStart = offset + scanLength;
      const hasScan = scanStart < bytes.length - 2 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
      return dimensions && hasScan ? { mimeType: 'image/jpeg', ...dimensions } : null;
    }
    if (marker === 0xd9 || marker === 0x00 || marker === 0x01 || marker! >= 0xd0 && marker! <= 0xd7) continue;
    const length = readU16(bytes, offset);
    if (length < 2 || offset + length > bytes.length) return null;
    if (isStartOfFrame(marker!)) {
      if (length < 8 || bytes[offset + 2] === 0) return null;
      dimensions = { height: readU16(bytes, offset + 3), width: readU16(bytes, offset + 5) };
    }
    offset += length;
  }
  return null;
}

function parseWebp(bytes: Uint8Array): ParsedImageHeader | null {
  if (readLE32(bytes, 4) + 8 !== bytes.length) return null;
  let offset = 12;
  let dimensions: { width: number; height: number } | undefined;
  while (offset + 8 <= bytes.length) {
    const kind = ascii(bytes, offset, 4);
    const length = readLE32(bytes, offset + 4);
    const data = offset + 8;
    const chunkEnd = data + length + (length & 1);
    if (chunkEnd > bytes.length) return null;
    if (!dimensions && kind === 'VP8X' && length >= 10) {
      dimensions = { width: readU24(bytes, data + 4) + 1, height: readU24(bytes, data + 7) + 1 };
    }
    if (!dimensions && kind === 'VP8 ' && length >= 10 && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) {
      dimensions = { width: readLE16(bytes, data + 6) & 0x3fff, height: readLE16(bytes, data + 8) & 0x3fff };
    }
    if (!dimensions && kind === 'VP8L' && length >= 5 && bytes[data] === 0x2f) {
      dimensions = { width: 1 + bytes[data + 1]! + ((bytes[data + 2]! & 0x3f) << 8), height: 1 + (bytes[data + 2]! >> 6) + (bytes[data + 3]! << 2) + ((bytes[data + 4]! & 0x0f) << 10) };
    }
    offset = chunkEnd;
  }
  return dimensions && offset === bytes.length ? { mimeType: 'image/webp', ...dimensions } : null;
}

function parseAvif(bytes: Uint8Array): ParsedImageHeader | null {
  const fileTypeSize = readU32(bytes, 0);
  if (fileTypeSize < 16 || fileTypeSize > bytes.length || ascii(bytes, 4, 4) !== 'ftyp') return null;
  const majorBrand = ascii(bytes, 8, 4);
  if (majorBrand !== 'avif' && majorBrand !== 'avis') return null;
  for (let offset = 4; offset + 16 <= bytes.length; offset++) {
    if (ascii(bytes, offset, 4) === 'ispe') {
      const boxStart = offset - 4;
      const boxSize = readU32(bytes, boxStart);
      if (boxSize < 20 || boxStart + boxSize > bytes.length) return null;
      return { mimeType: 'image/avif', width: readU32(bytes, offset + 8), height: readU32(bytes, offset + 12) };
    }
  }
  return null;
}

function isPng(b: Uint8Array): boolean { return b.length >= 8 && ascii(b, 1, 3) === 'PNG' && b[0] === 0x89 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a; }
function isJpeg(b: Uint8Array): boolean { return b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff; }
function isWebp(b: Uint8Array): boolean { return b.length >= 20 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP'; }
function isAvif(b: Uint8Array): boolean { return b.length >= 16 && ascii(b, 4, 4) === 'ftyp'; }
function isStartOfFrame(m: number): boolean { return [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(m); }
function readU16(b: Uint8Array, i: number): number { return b[i]! * 256 + b[i + 1]!; }
function readLE16(b: Uint8Array, i: number): number { return b[i]! + b[i + 1]! * 256; }
function readU24(b: Uint8Array, i: number): number { return b[i]! + b[i + 1]! * 256 + b[i + 2]! * 65536; }
function readU32(b: Uint8Array, i: number): number { return b[i]! * 0x1000000 + b[i + 1]! * 65536 + b[i + 2]! * 256 + b[i + 3]!; }
function readLE32(b: Uint8Array, i: number): number { return b[i]! + b[i + 1]! * 256 + b[i + 2]! * 65536 + b[i + 3]! * 0x1000000; }
function ascii(b: Uint8Array, i: number, n: number): string { return String.fromCharCode(...b.subarray(i, i + n)); }

const PNG_CRC_TABLE = createCrcTable();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = PNG_CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    table[index] = value >>> 0;
  }
  return table;
}
