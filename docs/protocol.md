# QS668 AI Recorder Card BLE Protocol

This document summarizes the public protocol implemented by the Web Bluetooth tester in `website/app.js`.

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

Realtime data is received from notify frames. The tester stores the stream as OPUS-family raw data and can submit chunks to an ASR backend.

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

The `AE23` characteristic can also report hardware events such as start, save, pause, and resume.

## Example Frame

Download `note20260710-162938.wav` from offset `0` with sequence `0x03`:

```text
5a 03 9e 20 1e 00 02 02 00 00 00 00 6e 6f 74 65 32 30 32 36 30 37 31 30 2d 31 36 32 39 33 38 2e 77 61 76 00
```

