#!/usr/bin/env python3
"""Wrap QS668 raw OPUS notify payloads as an Ogg/Opus file.

Input is the concatenation of TYPE 1 CMD 1 payloads: 40-byte packets, 20 ms each.
See docs/protocol.md.
"""

import argparse
import struct
from pathlib import Path


CRC_POLY = 0x04C11DB7


def build_crc_table():
    table = []
    for value in range(256):
        reg = value << 24
        for _ in range(8):
            if reg & 0x80000000:
                reg = ((reg << 1) ^ CRC_POLY) & 0xFFFFFFFF
            else:
                reg = (reg << 1) & 0xFFFFFFFF
        table.append(reg)
    return table


CRC_TABLE = build_crc_table()


def ogg_crc(data):
    crc = 0
    for byte in data:
        crc = ((crc << 8) & 0xFFFFFFFF) ^ CRC_TABLE[((crc >> 24) & 0xFF) ^ byte]
    return crc


def make_page(payloads, granule, serial, seq, flags):
    body = b"".join(payloads)
    laces = []
    for payload in payloads:
        remaining = len(payload)
        while remaining >= 255:
            laces.append(255)
            remaining -= 255
        laces.append(remaining)

    header = bytearray()
    header += b"OggS"
    header += bytes([0])
    header += bytes([flags])
    header += struct.pack("<Q", granule)
    header += struct.pack("<I", serial)
    header += struct.pack("<I", seq)
    header += struct.pack("<I", 0)
    header += bytes([len(laces)])
    header += bytes(laces)

    page = header + body
    page[22:26] = struct.pack("<I", ogg_crc(page))
    return bytes(page)


def wrap_qs668_raw_opus(raw, sample_rate=16000):
    if len(raw) % 40 != 0:
        raise ValueError(f"QS668 raw OPUS length must be a multiple of 40 bytes, got {len(raw)}")

    packets = [raw[index:index + 40] for index in range(0, len(raw), 40)]
    serial = 0x51533638
    seq = 0
    pages = []

    # Ogg Opus decoders use a 48 kHz granule timeline. The device packets are
    # Opus config 9, one 20 ms frame per 40-byte packet, so each packet advances
    # 960 samples on the Ogg granule clock.
    head = (
        b"OpusHead"
        + bytes([1, 1])
        + struct.pack("<H", 312)
        + struct.pack("<I", sample_rate)
        + struct.pack("<h", 0)
        + bytes([0])
    )
    tags = b"OpusTags" + struct.pack("<I", len(b"QS668")) + b"QS668" + struct.pack("<I", 0)

    pages.append(make_page([head], 0, serial, seq, 0x02))
    seq += 1
    pages.append(make_page([tags], 0, serial, seq, 0x00))
    seq += 1

    granule = 0
    for start in range(0, len(packets), 50):
        group = packets[start:start + 50]
        granule += 960 * len(group)
        flags = 0x04 if start + 50 >= len(packets) else 0x00
        pages.append(make_page(group, granule, serial, seq, flags))
        seq += 1

    return b"".join(pages)


def main():
    parser = argparse.ArgumentParser(description="Wrap QS668 fixed 40-byte raw OPUS packets as Ogg/Opus.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    raw = args.input.read_bytes()
    ogg = wrap_qs668_raw_opus(raw)
    args.output.write_bytes(ogg)
    print(f"wrapped {len(raw) // 40} packets, {len(raw) * 20 / 40000:.2f}s -> {args.output}")


if __name__ == "__main__":
    main()
