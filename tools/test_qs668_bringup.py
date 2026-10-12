#!/usr/bin/env python3
import argparse
import importlib.util
import sys
import unittest
from pathlib import Path

from qs668_protocol import FileEntry

SPEC = importlib.util.spec_from_file_location(
    "qs668_bringup",
    Path(__file__).with_name("qs668-bringup.py"),
)
MOD = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MOD
SPEC.loader.exec_module(MOD)


def entry(name: str) -> FileEntry:
    return FileEntry(duration_or_time=0, size=1, name=name, raw_entry=b"")


class BringupHelperTests(unittest.TestCase):
    def test_normalize_filename_args(self):
        self.assertEqual(MOD.normalize_filename_args(None), [])
        self.assertEqual(
            MOD.normalize_filename_args(["a.wav", "b.wav,c.wav", " b.wav "]),
            ["a.wav", "b.wav", "c.wav"],
        )

    def test_stem_from_name_discards_path_components(self):
        self.assertEqual(MOD.stem_from_name("../../note.wav"), "note")
        self.assertEqual(MOD.stem_from_name(r"C:\\temp\\note.opus"), "note")

    def test_resolve_import_targets(self):
        files = [entry("note1.wav"), entry("note2.")]
        all_args = argparse.Namespace(import_all=True, import_first=False, filename=None)
        self.assertEqual(
            MOD.resolve_import_targets(files, all_args),
            ["note1.wav", "note2."],
        )
        first = argparse.Namespace(import_all=False, import_first=True, filename=None)
        self.assertEqual(MOD.resolve_import_targets(files, first), ["note1.wav"])
        named = argparse.Namespace(
            import_all=False,
            import_first=False,
            filename=["note2", "note1.wav"],
        )
        self.assertEqual(
            MOD.resolve_import_targets(files, named),
            ["note2.", "note1.wav"],
        )
        with self.assertRaises(RuntimeError):
            MOD.resolve_import_targets(
                files,
                argparse.Namespace(
                    import_all=False,
                    import_first=False,
                    filename=["missing.wav"],
                ),
            )


if __name__ == "__main__":
    unittest.main()
