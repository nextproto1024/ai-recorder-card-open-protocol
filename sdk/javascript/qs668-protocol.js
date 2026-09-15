export const UUIDS = Object.freeze({
  service: "0000ae20-0000-1000-8000-00805f9b34fb",
  write: "0000ae21-0000-1000-8000-00805f9b34fb",
  notify: "0000ae22-0000-1000-8000-00805f9b34fb",
  keyNotify: "0000ae23-0000-1000-8000-00805f9b34fb",
});

export function crc16Xmodem(bytes) {
  let crc = 0x0000;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc & 0xffff;
}

export function buildFrame(payload, seq = 0) {
  const data = toBytes(payload);
  const len = u16LE(data.length);
  const crc = crc16Xmodem(concatBytes([len, data]));
  const frame = new Uint8Array(6 + data.length);
  frame[0] = 0x5a;
  frame[1] = seq & 0xff;
  frame[2] = crc & 0xff;
  frame[3] = (crc >> 8) & 0xff;
  frame.set(len, 4);
  frame.set(data, 6);
  return frame;
}

export class FrameParser {
  constructor() {
    this.buffer = new Uint8Array(0);
  }

  push(chunk) {
    this.buffer = concatBytes([this.buffer, toBytes(chunk)]);
    const frames = [];

    while (this.buffer.length >= 6) {
      const headerIndex = this.buffer.indexOf(0x5a);
      if (headerIndex < 0) {
        this.buffer = new Uint8Array(0);
        break;
      }
      if (headerIndex > 0) this.buffer = this.buffer.slice(headerIndex);
      if (this.buffer.length < 6) break;

      const seq = this.buffer[1];
      const expectedCrc = this.buffer[2] | (this.buffer[3] << 8);
      const len = this.buffer[4] | (this.buffer[5] << 8);
      const total = 6 + len;
      if (this.buffer.length < total) break;

      const payload = this.buffer.slice(6, total);
      const actualCrc = crc16Xmodem(this.buffer.slice(4, total));
      if (actualCrc === expectedCrc) {
        frames.push({ seq, payload, type: payload[0], cmd: payload[1], params: payload.slice(2) });
        this.buffer = this.buffer.slice(total);
      } else {
        this.buffer = this.buffer.slice(1);
      }
    }

    return frames;
  }
}

export const commands = Object.freeze({
  syncTime(date = new Date()) {
    const year = date.getFullYear();
    return bytes([0, 0, year & 0xff, year >> 8, date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()]);
  },
  getCapacity: () => bytes([0, 1]),
  getBattery: () => bytes([0, 3]),
  getFirmware: () => bytes([0, 10]),
  getAuthCode: () => bytes([0, 12]),
  startRealtime: () => bytes([1, 0]),
  stopRealtime: () => bytes([1, 2]),
  pauseRealtime: () => bytes([1, 3, 1]),
  resumeRealtime: () => bytes([1, 3, 0]),
  listFiles: () => bytes([2, 0]),
  importFile(filename, offset = 0) {
    return concatBytes([bytes([2, 2]), u32LE(offset), fixedTextBytes(filename, 24)]);
  },
  abortImport: () => bytes([2, 7]),
  deleteAllFiles: () => bytes([2, 9]),
  startRecording: () => bytes([3, 1]),
  saveRecording: () => bytes([3, 3]),
  pauseRecording: () => bytes([3, 5]),
  resumeRecording: () => bytes([3, 7]),
  getRecordState: () => bytes([3, 19]),
  getRecordTime: () => bytes([3, 21]),
  getCurrentFilename: () => bytes([3, 23]),
  getGain: () => bytes([3, 25]),
  setGain(gain) {
    return bytes([3, 27, gain & 0xff]);
  },
});

export function parseFileList(payload) {
  const body = toBytes(payload);
  if (body.length < 4) return [];
  const count = readU32BE(body, 0);
  const files = [];
  let offset = 4;
  for (let i = 0; i < count && offset + 28 <= body.length; i += 1) {
    const entry = body.slice(offset, offset + 28);
    files.push({
      durationOrTime: readU32BE(entry, 0),
      size: readU32BE(entry, 4),
      name: decodeText(entry.slice(8, 28)),
      rawEntry: entry,
    });
    offset += 28;
  }
  return files;
}

export function hex(bytesLike) {
  return Array.from(toBytes(bytesLike), (b) => b.toString(16).padStart(2, "0")).join(" ");
}

export function parseHex(input) {
  const clean = input.replace(/0x/gi, "").replace(/[^a-fA-F0-9]/g, "");
  if (clean.length % 2) throw new Error("Invalid hex length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytes(values) {
  return new Uint8Array(values);
}

function toBytes(value) {
  if (value instanceof Uint8Array) return value;
  return new Uint8Array(value);
}

function concatBytes(parts) {
  const arrays = parts.map(toBytes);
  const total = arrays.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of arrays) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function u16LE(value) {
  return bytes([value & 0xff, (value >> 8) & 0xff]);
}

function u32LE(value) {
  return bytes([value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff]);
}

function readU32BE(bytes, offset) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function fixedTextBytes(text, length) {
  const out = new Uint8Array(length);
  out.set(new TextEncoder().encode(text).slice(0, length));
  return out;
}

function decodeText(bytes) {
  const end = bytes.indexOf(0);
  const slice = end >= 0 ? bytes.slice(0, end) : bytes;
  return new TextDecoder().decode(slice).trim();
}

