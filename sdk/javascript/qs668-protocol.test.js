import assert from "node:assert/strict";
import test from "node:test";
import { FrameParser, buildFrame, commands, crc16Xmodem, hex, parseFileList } from "./qs668-protocol.js";

test("crc16 xmodem standard vector", () => {
  assert.equal(crc16Xmodem(new TextEncoder().encode("123456789")), 0x31c3);
});

test("builds the documented import frame", () => {
  const frame = buildFrame(commands.importFile("note20260710-162938.wav", 0), 3);
  assert.equal(
    hex(frame),
    "5a 03 9e 20 1e 00 02 02 00 00 00 00 6e 6f 74 65 32 30 32 36 30 37 31 30 2d 31 36 32 39 33 38 2e 77 61 76 00",
  );
});

test("parses streaming frames", () => {
  const frame = buildFrame(commands.getBattery(), 7);
  const parser = new FrameParser();
  assert.deepEqual(parser.push(frame.slice(0, 3)), []);
  const frames = parser.push(frame.slice(3));
  assert.equal(frames.length, 1);
  assert.equal(frames[0].seq, 7);
  assert.equal(frames[0].type, 0);
  assert.equal(frames[0].cmd, 3);
});

test("parses file list entries", () => {
  const filename = new Uint8Array(20);
  filename.set(new TextEncoder().encode("note.wav"));
  const body = new Uint8Array([
    0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x0c,
    0x00, 0x00, 0x0d, 0x80,
    ...filename,
  ]);
  const files = parseFileList(body);
  assert.equal(files.length, 1);
  assert.equal(files[0].durationOrTime, 12);
  assert.equal(files[0].size, 3456);
  assert.equal(files[0].name, "note.wav");
});

