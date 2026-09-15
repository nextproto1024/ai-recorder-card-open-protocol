# JavaScript SDK

This SDK exposes the lower-level QS668 AI recorder card BLE protocol primitives:

- CRC-16/XMODEM
- frame building
- streaming frame parsing
- common command payload builders

It is intentionally small. Applications can use it directly in Web Bluetooth, React Native BLE, Node BLE bridges, Electron, or other JavaScript runtimes.

## Example

```js
import { buildFrame, commands, hex } from "./qs668-protocol.js";

const frame = buildFrame(commands.getBattery(), 0);
console.log(hex(frame));
```

