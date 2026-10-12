#!/usr/bin/env python3
import unittest

from qs668_protocol import (
    FrameParser,
    build_frame,
    cmd_import_file,
    crc16_xmodem,
    hex_bytes,
    import_name_candidates,
    parse_file_list,
)


class ProtocolTests(unittest.TestCase):
    def test_crc_vector(self):
        self.assertEqual(crc16_xmodem(b"123456789"), 0x31C3)

    def test_import_frame(self):
        frame = build_frame(cmd_import_file("note20260710-162938.wav", 0), 3)
        self.assertEqual(len(frame), 36)
        self.assertEqual(
            hex_bytes(frame),
            "5a 03 9e 20 1e 00 02 02 00 00 00 00 6e 6f 74 65 32 30 32 36 30 37 31 30 2d 31 36 32 39 33 38 2e 77 61 76 00",
        )

    def test_parser_split(self):
        frame = build_frame(bytes([0, 3]), 7)
        parser = FrameParser()
        self.assertEqual(parser.push(frame[:3]), [])
        frames = parser.push(frame[3:])
        self.assertEqual(len(frames), 1)
        self.assertEqual(frames[0].seq, 7)
        self.assertEqual(frames[0].type, 0)
        self.assertEqual(frames[0].cmd, 3)

    def test_parser_accepts_zero_crc(self):
        payload = bytes([2, 1, 0, 0, 0, 0])
        length = bytes([len(payload) & 0xFF, (len(payload) >> 8) & 0xFF])
        frame = bytes([0x5A, 1, 0, 0]) + length + payload
        frames = FrameParser().push(frame)
        self.assertEqual(len(frames), 1)
        self.assertEqual(frames[0].type, 2)
        self.assertEqual(frames[0].cmd, 1)

    def test_file_list_and_candidates(self):
        name = b"note20260710-162938."
        self.assertEqual(len(name), 20)
        body = bytes([0, 0, 0, 1, 0, 0, 0, 12, 0, 0, 0x0D, 0x80]) + name
        files = parse_file_list(body)
        self.assertEqual(len(files), 1)
        self.assertEqual(files[0].name, "note20260710-162938.")
        self.assertEqual(
            import_name_candidates(files[0].name),
            ["note20260710-162938.wav", "note20260710-162938.opus", "note20260710-162938."],
        )


if __name__ == "__main__":
    unittest.main()
