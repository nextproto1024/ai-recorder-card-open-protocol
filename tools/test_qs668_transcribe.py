#!/usr/bin/env python3
import importlib.util
import sys
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "qs668_transcribe",
    Path(__file__).with_name("qs668-transcribe.py"),
)
MOD = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MOD
SPEC.loader.exec_module(MOD)


class TranscribeHelperTests(unittest.TestCase):
    def test_format_timestamp(self):
        self.assertEqual(MOD.format_timestamp(65), "01:05")
        self.assertEqual(MOD.format_timestamp(3661), "01:01:01")
        self.assertEqual(MOD.format_timestamp_ms(4300), "00:04")

    def test_plan_chunks_merges_tiny_tail(self):
        plans = MOD.plan_chunks(500, 480)
        self.assertEqual(len(plans), 1)
        self.assertEqual(plans[0].end_s, 500)

    def test_plan_chunks_splits_long_audio(self):
        plans = MOD.plan_chunks(1200, 480)
        self.assertEqual(len(plans), 3)
        self.assertEqual(plans[-1].end_s, 1200)

    def test_wav_duration_does_not_require_ffmpeg(self):
        import tempfile
        import wave

        with tempfile.TemporaryDirectory() as tmp:
            audio = Path(tmp) / "short.wav"
            with wave.open(str(audio), "wb") as handle:
                handle.setnchannels(1)
                handle.setsampwidth(2)
                handle.setframerate(16000)
                handle.writeframes(b"\0\0" * 16000)
            self.assertAlmostEqual(MOD.probe_duration_seconds(audio), 1.0)

    def test_utterances_and_merge(self):
        lines = MOD.utterances_to_lines(
            [{"text": "你好", "start_time": 0, "end_time": 1200, "additions": {"speaker": "2"}}],
            offset_s=60,
            timeline_mode="relative",
        )
        self.assertEqual(lines, ["[01:00] 说话人2：你好"])
        base = MOD.datetime(2026, 10, 11, 16, 18, 58)
        wall = MOD.utterances_to_lines(
            [{"text": "你好", "start_time": 2000, "end_time": 3000, "additions": {"speaker": "1"}}],
            offset_s=0,
            base_time=base,
            timeline_mode="absolute",
        )
        self.assertEqual(wall, ["[16:19:00] 说话人1：你好"])
        after_midnight = MOD.utterances_to_lines(
            [{"text": "跨天", "start_time": 0, "end_time": 1000, "additions": {"speaker": "2"}}],
            offset_s=8 * 3600,  # 16:18:58 + 8h -> 00:18:58 next day
            base_time=base,
            timeline_mode="absolute",
        )
        self.assertEqual(after_midnight, ["[10-12 00:18:58] 说话人2：跨天"])
        parsed = MOD.parse_recording_start(Path("archive/audio/note20261011-161858.wav"))
        self.assertEqual(parsed, base)
        self.assertEqual(MOD.doubao_language_value("zh", True), "zh-CN")

    def test_explain_doubao_error(self):
        text = MOD.explain_doubao_error("45000001", "unauthorized", 401)
        self.assertIn("鉴权失败", text)
        quota = MOD.explain_doubao_error("", "资源包时长不足", 400)
        self.assertIn("额度不足", quota)

    def test_write_corpus_front_matter(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            audio = Path(tmp) / "demo.wav"
            audio.write_bytes(b"RIFF")
            digest = MOD.sha256_file(audio)
            path = MOD.write_corpus(
                audio,
                "[00:00] 你好",
                Path(tmp),
                "zh",
                1,
                5.0,
                "doubao",
                True,
                title="拜访纪要",
                customer="客户A",
                sync_status="local",
            )
            body = path.read_text(encoding="utf-8")
            self.assertIn("title: \"拜访纪要\"", body)
            self.assertIn("customer: \"客户A\"", body)
            self.assertIn("sync_status: \"local\"", body)
            self.assertIn(f"audio_sha256: \"{digest}\"", body)
            self.assertIn("transcribed_on: \"pc\"", body)
            self.assertIn("# 拜访纪要", body)
            self.assertIn("[00:00] 你好", body)
            self.assertNotIn("## Transcript", body)
            self.assertEqual(body.count("customer:"), 1)

    def test_should_skip_transcribe_requires_hash_and_body(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            audio = Path(tmp) / "note.wav"
            audio.write_bytes(b"RIFFDATA")
            out_dir = Path(tmp) / "corpus"
            self.assertIsNone(MOD.should_skip_transcribe(audio, out_dir, force=False))

            digest = MOD.sha256_file(audio)
            good = MOD.write_corpus(
                audio,
                "[00:00] 你好",
                out_dir,
                "zh",
                1,
                1.0,
                "doubao",
                False,
                audio_sha256=digest,
            )
            self.assertEqual(MOD.should_skip_transcribe(audio, out_dir, force=False), good)
            self.assertIsNone(MOD.should_skip_transcribe(audio, out_dir, force=True))

            # Empty body (title only) must not skip.
            good.write_text(
                "---\n"
                f'audio_sha256: "{digest}"\n'
                "---\n\n"
                "# note\n\n",
                encoding="utf-8",
            )
            self.assertIsNone(MOD.should_skip_transcribe(audio, out_dir, force=False))

            # Missing hash must not skip.
            good.write_text(
                "---\n"
                'title: "note"\n'
                "---\n\n"
                "# note\n\n"
                "hello\n",
                encoding="utf-8",
            )
            self.assertIsNone(MOD.should_skip_transcribe(audio, out_dir, force=False))

            # Mismatch must not skip.
            good.write_text(
                "---\n"
                'audio_sha256: "' + ("0" * 64) + '"\n'
                "---\n\n"
                "# note\n\n"
                "hello\n",
                encoding="utf-8",
            )
            self.assertIsNone(MOD.should_skip_transcribe(audio, out_dir, force=False))


if __name__ == "__main__":
    unittest.main()
