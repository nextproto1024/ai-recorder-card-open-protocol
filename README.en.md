# AI Recorder Card Open Protocol

English | [中文](./README.md)

Open BLE protocol, Web Bluetooth tester, and SDK examples for the QS668 AI recorder card.

This repository is for developers building products around an AI recorder card, recording card, Bluetooth recorder card, voice recorder card, smart audio recorder, or BLE audio recording hardware. Unlike projects that only publish an application SDK, this project documents the lower-level Bluetooth protocol so developers can integrate the hardware directly from a browser, mobile app, desktop app, or embedded gateway.

Product and online tester: <https://nextproto.top/qs668/>

International purchase link: [Open Protocol AI Smart Recorder Card on Tindie](https://www.tindie.com/products/adz1122/open-protocol-ai-smart-recorder-card/)

## Why This Project

- Open protocol first: the BLE service, characteristics, frame format, command types, and CRC are documented.
- SDK second: the SDK is a thin wrapper over the protocol, not a closed black box.
- Web Bluetooth ready: the `website/` directory contains the open-source code of the QS668 online protocol tester.
- Bilingual docs: Chinese and English keywords are included so developers can find this project by searching "录音卡", "AI录音卡", "AI recording card", "AI recorder card", "recording card", or "Bluetooth recorder card".
- Hardware integration friendly: supports device status, battery, capacity, recording control, realtime OPUS stream, file list, file import, delete, and raw protocol frame testing.
- Tindie-ready for overseas customers who want to buy sample hardware for development and protocol testing.

## Repository Layout

```text
.
├── README.md
├── README.en.md
├── README.zh-CN.md
├── docs/
│   ├── protocol.md
│   └── protocol.zh-CN.md
├── examples/
│   └── web-bluetooth/
├── sdk/
│   └── javascript/
└── website/
    ├── index.html
    ├── styles.css
    └── app.js
```

## Quick Start

Open the local tester with HTTPS or localhost. Web Bluetooth requires Chrome or Edge.

```bash
cd website
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

The public version remains available at:

```text
https://nextproto.top/qs668/
```

## Protocol Snapshot

BLE UUIDs:

| Purpose | UUID |
| --- | --- |
| Service | `0000ae20-0000-1000-8000-00805f9b34fb` |
| Write | `0000ae21-0000-1000-8000-00805f9b34fb` |
| Notify | `0000ae22-0000-1000-8000-00805f9b34fb` |
| Key notify | `0000ae23-0000-1000-8000-00805f9b34fb` |

Frame format:

```text
5A SEQ CRC_LO CRC_HI LEN_LO LEN_HI TYPE CMD PARAMS...
```

CRC is CRC-16/XMODEM over `LEN_LO LEN_HI TYPE CMD PARAMS...`.

Read more:

- [Protocol documentation](./docs/protocol.md)
- [中文协议文档](./docs/protocol.zh-CN.md)
- [JavaScript SDK](./sdk/javascript/)
- [Web Bluetooth example](./examples/web-bluetooth/)

## License

MIT License. See [LICENSE](./LICENSE).
