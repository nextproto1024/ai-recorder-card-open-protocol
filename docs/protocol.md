# QS668 AI Recorder Card BLE Protocol

This is the public BLE protocol for the QS668 AI recorder card and recording card. The tester in `website/app.js` follows this document. Do not invent a field that is absent here.

## BLE UUIDs

| Purpose | UUID | Direction |
| --- | --- | --- |
| Primary service | `0000ae20-0000-1000-8000-00805f9b34fb` | Discover |
| Write characteristic | `0000ae21-0000-1000-8000-00805f9b34fb` | Host to device |
| Notify characteristic | `0000ae22-0000-1000-8000-00805f9b34fb` | Device to host |
| Key/event notify characteristic | `0000ae23-0000-1000-8000-00805f9b34fb` | Device to host |

## Frame Format

```text
Offset  Size  Name       Description
0       1     HEADER     Always 0x5A
1       1     SEQ        Sequence number, wraps at 0xFF
2       2     CRC        CRC-16/XMODEM, little-endian
4       2     LEN        Payload length, little-endian
6       LEN   PAYLOAD    TYPE CMD PARAMS...
```

Payload:

```text
TYPE CMD PARAMS...
```

CRC input:

```text
LEN_LO LEN_HI TYPE CMD PARAMS...
```

CRC algorithm: CRC-16/XMODEM, polynomial `0x1021`, initial value `0x0000`.

Standard vector:

```text
crc16Xmodem("123456789") = 0x31C3
```

## Command Groups

| TYPE | Group |
| --- | --- |
| `0` | Device control and status |
| `1` | Realtime audio |
| `2` | File list, import, delete |
| `3` | Recording control and recording status |

## Common Commands

### TYPE 0: Device Control

| Request | Meaning | Notes |
| --- | --- | --- |
| `0-0` | Sync time | Params: year low, year high, month, day, hour, minute, second |
| `0-1` | Get capacity | Response `0-2`, remaining KB and total KB, little-endian u32 |
| `0-3` | Get battery | Response `0-4`, percent; `110` means charging |
| `0-10` | Get firmware version | Response `0-11`, text |
| `0-12` | Get authorization code | Response `0-13`, ASCII/HEX |

### TYPE 1: Realtime Audio

| Request | Meaning |
| --- | --- |
| `1-0` | Start realtime audio |
| `1-2` | Stop realtime audio |
| `1-3 01` | Pause realtime audio |
| `1-3 00` | Resume realtime audio |

Device responses:

| Response | Meaning |
| --- | --- |
| `1-0` | Filename for this stream, sent before audio |
| `1-1` | Raw OPUS payload. Each packet is 40 bytes and 20 ms |
| `1-4` | Status: `0` continue, `1` pause, `2` stop |

Concatenate `1-1` payloads in order, then wrap them with `tools/qs668-raw-opus-to-ogg.py` before playback. Transcription is not part of this protocol.

### TYPE 2: Files

| Request | Meaning |
| --- | --- |
| `2-0` | Read file list |
| `2-2` | Import/download file from device |
| `2-7` | Abort import |
| `2-8` | Delete one file |
| `2-9` | Delete all files |
| `2-12` | Segment import |

File list entries use big-endian integers:

```text
COUNT_BE32
ENTRY...

ENTRY:
duration_or_time_BE32
size_BE32
filename_fixed_20_bytes
```

The `2-2` import request uses:

```text
offset_LE32 + filename_fixed_24_bytes
```

Device responses:

| Response | Meaning |
| --- | --- |
| `2-1` | List data. `count` is the number of entries in this frame, not the total |
| `2-3` | Import started. Body is the actual filename |
| `2-4` | File bytes. Append payloads in arrival order |
| `2-5` | End. `0` done, `1` missing, `2` offset too large, `3` other stop |
| `2-10` | Delete-all result. `0` success, `1` failure. Older firmware may omit it |
| `2-11` | Abort-import acknowledgement |
| `2-13` | Delete-one result. `0` success, `1` failure. Older firmware may omit it |
| `2-18` | List finished. Body `0` means complete |

`2-8` takes the raw 28-byte list entry. `2-12` takes `start_LE32 + end_LE32 + filename`.

The list may arrive in several frames. Wait for `2-18` before treating it as complete. When older firmware never sends `2-18`, the entries already received can be kept after about 1.2 seconds of idle time following the last frame.

List filenames are fixed at 20 bytes, so a long name loses its extension. `note20260710-162938.opus` appears as `note20260710-162938.`. Restore an extension before import: try `.wav` first, then `.opus`, and only then the truncated list name. The request filename is fixed at 24 bytes, padded with `0`.

A `2-2` frame is 36 bytes and must be one GATT write to AE21. Splitting it into 20 bytes plus 16 bytes makes the device misread the filename and return `2-5` / `1` (file missing).

After `2-3`, append each `2-4` payload. Any received data may reset the idle timer. About 12 seconds without data is a timeout. If bytes have already arrived, do not retry under another filename. Switch candidates only when end code `1` arrives before any file data. End code `0` means save the file. A requested `.wav` with a `RIFF` / `WAVE` header passes when the declared length equals the actual length. The list `size` is the on-card size, not the transcoded WAV size.

### TYPE 3: Recording

| Request | Meaning |
| --- | --- |
| `3-1` | Start recording |
| `3-3` | Save recording |
| `3-5` | Pause recording |
| `3-7` | Resume recording |
| `3-19` | Get recording state |
| `3-21` | Get recording time and current size |
| `3-23` | Get current filename |
| `3-25` | Get gain |
| `3-27` | Set gain |

Device responses use the request command plus 1. Result byte for start, save, pause, and resume: `1` success, `2` failure. Result byte for set gain: `0` success, `1` failure.

| Response | Meaning |
| --- | --- |
| `3-20` | Recording state: `1` recording, `2` idle, `3` paused |
| `3-22` | Duration as little-endian u16 seconds, current size as little-endian u32 bytes |
| `3-24` | Current filename |
| `3-26` | Gain: `1` low, `2` medium, `3` high |

`AE23` reports hardware start, save, pause, and resume with command numbers `1` / `3` / `5` / `7`. AE22 and AE23 need separate frame buffers. Do not share one byte stream between them.

## Receive compatibility

Every transmitted frame uses a calculated CRC-16/XMODEM. On receive, accept a frame when the CRC matches. Some recorder-watch firmware sends list frames whose CRC field is fixed at `0x0000` while LEN and the payload are still valid. Those frames may be parsed, with a warning. Drop a frame whose CRC is neither the calculated value nor `0x0000`. A frame longer than 8192 bytes is invalid.

## Example Frame

Download `note20260710-162938.wav` from offset `0` with sequence `0x03`:

```text
5a 03 9e 20 1e 00 02 02 00 00 00 00 6e 6f 74 65 32 30 32 36 30 37 31 30 2d 31 36 32 39 33 38 2e 77 61 76 00
```

