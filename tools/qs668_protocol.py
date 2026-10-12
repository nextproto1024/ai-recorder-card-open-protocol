"""QS668 BLE frame helpers. Byte layouts live in docs/protocol.md."""

from __future__ import annotations

from dataclasses import dataclass

SERVICE_UUID = "0000ae20-0000-1000-8000-00805f9b34fb"
WRITE_UUID = "0000ae21-0000-1000-8000-00805f9b34fb"
NOTIFY_UUID = "0000ae22-0000-1000-8000-00805f9b34fb"
KEY_NOTIFY_UUID = "0000ae23-0000-1000-8000-00805f9b34fb"

MAX_FRAME_LEN = 8192


def crc16_xmodem(data: bytes) -> int:
    crc = 0x0000
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) if (crc & 0x8000) else (crc << 1)
            crc &= 0xFFFF
    return crc


def u16_le(value: int) -> bytes:
    return bytes([value & 0xFF, (value >> 8) & 0xFF])


def u32_le(value: int) -> bytes:
    return bytes([
        value & 0xFF,
        (value >> 8) & 0xFF,
        (value >> 16) & 0xFF,
        (value >> 24) & 0xFF,
    ])


def read_u32_be(data: bytes, offset: int = 0) -> int:
    return int.from_bytes(data[offset:offset + 4], "big")


def fixed_text(text: str, length: int) -> bytes:
    encoded = text.encode("utf-8")[:length]
    return encoded + bytes(length - len(encoded))


def decode_text(data: bytes) -> str:
    end = data.find(0)
    slice_ = data if end < 0 else data[:end]
    return slice_.decode("utf-8", errors="replace").strip()


def build_frame(payload: bytes, seq: int = 0) -> bytes:
    length = u16_le(len(payload))
    crc = crc16_xmodem(length + payload)
    return bytes([
        0x5A,
        seq & 0xFF,
        crc & 0xFF,
        (crc >> 8) & 0xFF,
        length[0],
        length[1],
    ]) + payload


def cmd_get_battery() -> bytes:
    return bytes([0, 3])


def cmd_get_capacity() -> bytes:
    return bytes([0, 1])


def cmd_get_firmware() -> bytes:
    return bytes([0, 10])


def cmd_list_files() -> bytes:
    return bytes([2, 0])


def cmd_import_file(filename: str, offset: int = 0) -> bytes:
    return bytes([2, 2]) + u32_le(offset) + fixed_text(filename, 24)


def cmd_abort_import() -> bytes:
    return bytes([2, 7])


def cmd_start_realtime() -> bytes:
    return bytes([1, 0])


def cmd_stop_realtime() -> bytes:
    return bytes([1, 2])


def cmd_pause_realtime() -> bytes:
    return bytes([1, 3, 1])


def cmd_resume_realtime() -> bytes:
    return bytes([1, 3, 0])


def cmd_start_recording() -> bytes:
    return bytes([3, 1])


def cmd_save_recording() -> bytes:
    return bytes([3, 3])


def cmd_pause_recording() -> bytes:
    return bytes([3, 5])


def cmd_resume_recording() -> bytes:
    return bytes([3, 7])


def cmd_get_record_state() -> bytes:
    return bytes([3, 19])


@dataclass(frozen=True)
class Frame:
    seq: int
    payload: bytes

    @property
    def type(self) -> int:
        return self.payload[0] if self.payload else -1

    @property
    def cmd(self) -> int:
        return self.payload[1] if len(self.payload) > 1 else -1

    @property
    def params(self) -> bytes:
        return self.payload[2:] if len(self.payload) > 2 else b""


class FrameParser:
    def __init__(self) -> None:
        self.buffer = bytearray()

    def push(self, chunk: bytes) -> list[Frame]:
        self.buffer.extend(chunk)
        frames: list[Frame] = []

        while len(self.buffer) >= 6:
            try:
                header_index = self.buffer.index(0x5A)
            except ValueError:
                self.buffer.clear()
                break
            if header_index > 0:
                del self.buffer[:header_index]
            if len(self.buffer) < 6:
                break

            length = self.buffer[4] | (self.buffer[5] << 8)
            if length > MAX_FRAME_LEN:
                del self.buffer[0]
                continue
            total = 6 + length
            if len(self.buffer) < total:
                break

            frame = bytes(self.buffer[:total])
            del self.buffer[:total]
            expected = frame[2] | (frame[3] << 8)
            actual = crc16_xmodem(frame[4:total])
            if expected != actual and expected != 0:
                # Resync one byte after a bad CRC that is not the watch-compat 0x0000.
                self.buffer[0:0] = frame[1:]
                continue
            frames.append(Frame(seq=frame[1], payload=frame[6:total]))

        return frames


@dataclass(frozen=True)
class FileEntry:
    duration_or_time: int
    size: int
    name: str
    raw_entry: bytes


def parse_file_list(payload: bytes) -> list[FileEntry]:
    if len(payload) < 4:
        return []
    count = read_u32_be(payload, 0)
    files: list[FileEntry] = []
    offset = 4
    for _ in range(count):
        if offset + 28 > len(payload):
            break
        entry = payload[offset:offset + 28]
        files.append(FileEntry(
            duration_or_time=read_u32_be(entry, 0),
            size=read_u32_be(entry, 4),
            name=decode_text(entry[8:28]),
            raw_entry=entry,
        ))
        offset += 28
    return files


def import_name_candidates(list_name: str) -> list[str]:
    """Restore .wav / .opus when the 20-byte list name truncated the extension."""
    name = list_name.strip()
    candidates: list[str] = []

    def add(value: str) -> None:
        if value and value not in candidates:
            candidates.append(value)

    if name.endswith("."):
        add(f"{name}wav")
        add(f"{name}opus")
        add(name)
        return candidates

    lower = name.lower()
    if lower.endswith(".wav"):
        add(name)
        add(name[:-4] + ".opus")
        return candidates
    if lower.endswith(".opus"):
        add(name[:-5] + ".wav")
        add(name)
        return candidates

    add(f"{name}.wav")
    add(f"{name}.opus")
    add(name)
    return candidates


def hex_bytes(data: bytes) -> str:
    return " ".join(f"{byte:02x}" for byte in data)
