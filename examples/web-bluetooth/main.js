import { FrameParser, UUIDS, buildFrame, commands, hex } from "../../sdk/javascript/qs668-protocol.js";

const logEl = document.getElementById("log");
const connectBtn = document.getElementById("connect");
const parser = new FrameParser();

connectBtn.addEventListener("click", async () => {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [UUIDS.service] }],
    optionalServices: [UUIDS.service],
  });
  log(`device: ${device.name || device.id}`);

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(UUIDS.service);
  const writeChar = await service.getCharacteristic(UUIDS.write);
  const notifyChar = await service.getCharacteristic(UUIDS.notify);

  await notifyChar.startNotifications();
  notifyChar.addEventListener("characteristicvaluechanged", (event) => {
    const bytes = new Uint8Array(event.target.value.buffer);
    for (const frame of parser.push(bytes)) {
      log(`RX seq=${frame.seq} type=${frame.type} cmd=${frame.cmd} params=${hex(frame.params)}`);
    }
  });

  const frame = buildFrame(commands.getBattery(), 0);
  log(`TX ${hex(frame)}`);
  await writeChar.writeValueWithoutResponse(frame);
});

function log(line) {
  logEl.textContent += `${line}\n`;
}

