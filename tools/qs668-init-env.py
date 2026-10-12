#!/usr/bin/env python3
"""Create .env from .env.example when missing. Never overwrite an existing .env."""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / ".env.example"
ENV_PATH = ROOT / ".env"


def main() -> int:
    parser = argparse.ArgumentParser(description="Initialize local .env for QS668 tools")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing .env from .env.example (destructive)",
    )
    args = parser.parse_args()

    if not EXAMPLE.exists():
        raise SystemExit(f"Missing template: {EXAMPLE}")

    if ENV_PATH.exists() and not args.force:
        print(f"OK .env already exists -> {ENV_PATH}")
        print("Fill Doubao keys before transcription if still empty:")
        print("  QS668_ASR_DOUBAO_APP_ID")
        print("  QS668_ASR_DOUBAO_ACCESS_KEY")
        return 0

    ENV_PATH.write_text(EXAMPLE.read_text(encoding="utf-8"), encoding="utf-8")
    action = "overwrote" if args.force else "created"
    print(f"OK {action} {ENV_PATH} from .env.example")
    print("Next: edit .env and set:")
    print("  QS668_ASR_DOUBAO_APP_ID=")
    print("  QS668_ASR_DOUBAO_ACCESS_KEY=")
    print("Do not commit .env.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
