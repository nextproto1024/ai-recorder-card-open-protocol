#!/usr/bin/env python3
"""Connect to a QS668 AI recorder card over BLE and write imports to archive/audio/.

First connection may need a person to power the card and allow Windows Bluetooth access.
Later runs can reuse --address or .qs668-device. Does not delete on-card files.
"""

from __future__ import annotations

import argparse
import asyncio
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from qs668_protocol import (  # noqa: E402
    KEY_NOTIFY_UUID,
    NOTIFY_UUID,
    SERVICE_UUID,
    WRITE_UUID,
    FrameParser,
    build_frame,
    cmd_get_battery,
    cmd_get_capacity,
    cmd_get_firmware,
    cmd_get_record_state,
    cmd_import_file,
    cmd_list_files,
    cmd_pause_recording,
    cmd_resume_recording,
    cmd_save_recording,
    cmd_start_realtime,
    cmd_start_recording,
    cmd_stop_realtime,
    decode_text,
    hex_bytes,
    import_name_candidates,
    parse_file_list,
)

ROOT = TOOLS_DIR.parent
DEFAULT_OUT = ROOT / "archive" / "audio"
DEVICE_CACHE = ROOT / ".qs668-device"
LIST_IDLE_S = 1.2
IMPORT_IDLE_S = 12.0
SCAN_S = 8.0


def import_bleak():
    try:
        from bleak import BleakClient, BleakScanner
    except ImportError as error:  # pragma: no cover
        raise SystemExit(
            "Install BLE deps first: python -m pip install -r tools/requirements.txt"
        ) from error
    return BleakClient, BleakScanner


class Session:
    def __init__(self) -> None:
        self.seq = 0
        self.ae22 = FrameParser()
        self.ae23 = FrameParser()
        self.events: asyncio.Queue = asyncio.Queue()
        self.client = None
        self.BleakClient, _BleakScanner = import_bleak()

    def _on_ae22(self, _handle: int, data: bytearray) -> None:
        for frame in self.ae22.push(bytes(data)):
            self.events.put_nowait(("ae22", frame))

    def _on_ae23(self, _handle: int, data: bytearray) -> None:
        for frame in self.ae23.push(bytes(data)):
            self.events.put_nowait(("ae23", frame))

    async def connect(self, address: str) -> None:
        self.client = self.BleakClient(address)
        await self.client.connect()
        await self.client.start_notify(NOTIFY_UUID, self._on_ae22)
        try:
            await self.client.start_notify(KEY_NOTIFY_UUID, self._on_ae23)
            print("OK AE23 notify")
        except Exception as error:  # noqa: BLE001 - optional characteristic
            print(f"WARN AE23 unavailable: {error}")
        print(f"OK connected {address}")

    async def disconnect(self) -> None:
        if not self.client:
            return
        try:
            if self.client.is_connected:
                await self.client.disconnect()
        finally:
            self.client = None

    async def write_payload(self, payload: bytes) -> bytes:
        if not self.client or not self.client.is_connected:
            raise RuntimeError("not connected")
        frame = build_frame(payload, self.seq)
        self.seq = (self.seq + 1) & 0xFF
        # 2-2 import is 36 bytes and must be one GATT write.
        await self.client.write_gatt_char(WRITE_UUID, frame, response=False)
        print(f"TX {hex_bytes(frame)}")
        return frame

    async def wait_frames(self, timeout_s: float):
        deadline = time.monotonic() + timeout_s
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                return
            try:
                source, frame = await asyncio.wait_for(self.events.get(), remaining)
            except asyncio.TimeoutError:
                return
            yield source, frame


async def scan_devices() -> list[tuple[str, str]]:
    _BleakClient, BleakScanner = import_bleak()
    print(f"Scanning {SCAN_S:.0f}s for AE20…")
    devices = await BleakScanner.discover(timeout=SCAN_S, return_adv=True)
    found: list[tuple[str, str]] = []
    for device, adv in devices.values():
        uuids = [value.lower() for value in (adv.service_uuids or [])]
        name = device.name or ""
        haystack = " ".join(uuids)
        if (
            SERVICE_UUID in uuids
            or "ae20" in haystack
            or "qs668" in name.lower()
            or "cb08" in name.lower()
        ):
            found.append((device.address, name or "(no name)"))
            print(f"  {device.address}  {name or '(no name)'}")
    if not found:
        print("No AE20 device seen. Power the card and retry, or pass --address after pairing.")
    return found


def read_cached_address() -> str | None:
    if not DEVICE_CACHE.exists():
        return None
    value = DEVICE_CACHE.read_text(encoding="utf-8").strip()
    return value or None


def write_cached_address(address: str) -> None:
    DEVICE_CACHE.write_text(address.strip() + "\n", encoding="utf-8")
    print(f"OK cached address -> {DEVICE_CACHE.name}")


async def resolve_address(explicit: str | None) -> str:
    if explicit:
        return explicit
    cached = read_cached_address()
    if cached:
        print(f"Using cached address {cached}")
        return cached
    found = await scan_devices()
    if len(found) == 1:
        address = found[0][0]
        write_cached_address(address)
        return address
    if not found:
        raise SystemExit("No device found. Pass --address after the first successful scan.")
    raise SystemExit("Multiple devices found. Pass --address explicitly.")


async def read_status(session: Session) -> dict[str, str]:
    result = {"battery": "", "capacity": "", "firmware": ""}
    await session.write_payload(cmd_get_battery())
    await session.write_payload(cmd_get_capacity())
    await session.write_payload(cmd_get_firmware())
    async for _source, frame in session.wait_frames(4.0):
        if frame.type == 0 and frame.cmd == 4 and frame.params:
            value = frame.params[0]
            result["battery"] = "charging" if value == 110 else f"{value}%"
            print(f"OK battery {result['battery']}")
        elif frame.type == 0 and frame.cmd == 2 and len(frame.params) >= 8:
            remain = int.from_bytes(frame.params[0:4], "little")
            total = int.from_bytes(frame.params[4:8], "little")
            result["capacity"] = f"{remain}KB / {total}KB"
            print(f"OK capacity {result['capacity']}")
        elif frame.type == 0 and frame.cmd == 11:
            result["firmware"] = decode_text(frame.params)
            print(f"OK firmware {result['firmware']}")
        if all(result.values()):
            break
    if not result["battery"]:
        raise RuntimeError("no battery response (0-4)")
    return result


async def list_files(session: Session):
    files = []
    await session.write_payload(cmd_list_files())
    last_data = time.monotonic()
    while True:
        timeout = LIST_IDLE_S if files else 4.0
        got = False
        async for _source, frame in session.wait_frames(timeout):
            got = True
            if frame.type == 2 and frame.cmd == 1:
                chunk = parse_file_list(frame.params)
                files.extend(chunk)
                last_data = time.monotonic()
                print(f"OK list frame +{len(chunk)} total={len(files)}")
            elif frame.type == 2 and frame.cmd == 18:
                print(f"OK list finished count={len(files)}")
                return files
        if files and time.monotonic() - last_data >= LIST_IDLE_S:
            print(f"OK list idle finish count={len(files)}")
            return files
        if not got and not files:
            raise RuntimeError("no file list response (2-1)")


def stem_from_name(name: str) -> str:
    path = Path(name)
    if path.suffix.lower() in {".wav", ".opus", ".raw", ".ogg"}:
        return path.stem
    if name.endswith("."):
        return name[:-1]
    return name


def normalize_filename_args(values: list[str] | None) -> list[str]:
    """Expand repeated --filename and comma-separated lists; preserve order, drop empties."""
    if not values:
        return []
    names: list[str] = []
    seen: set[str] = set()
    for raw in values:
        for part in raw.split(","):
            name = part.strip()
            if not name or name in seen:
                continue
            seen.add(name)
            names.append(name)
    return names


def match_list_entry(files: list, wanted: str):
    """Match a user filename against on-card list names (stem-tolerant)."""
    wanted_stem = stem_from_name(wanted).lower()
    for entry in files:
        if entry.name == wanted:
            return entry
    for entry in files:
        if stem_from_name(entry.name).lower() == wanted_stem:
            return entry
    for entry in files:
        if entry.name.lower() == wanted.lower():
            return entry
    return None


def resolve_import_targets(files: list, args: argparse.Namespace) -> list[str]:
    """Return on-card list names to import."""
    filenames = normalize_filename_args(getattr(args, "filename", None))
    if args.import_all:
        return [entry.name for entry in files]
    if filenames:
        targets: list[str] = []
        missing: list[str] = []
        for wanted in filenames:
            entry = match_list_entry(files, wanted)
            if entry is None:
                missing.append(wanted)
            else:
                targets.append(entry.name)
        if missing:
            available = ", ".join(entry.name for entry in files) or "(empty)"
            raise RuntimeError(
                f"filename not on card: {', '.join(missing)}; available: {available}"
            )
        return targets
    if args.import_first:
        return [files[0].name]
    return []


async def import_file(session: Session, list_name: str, out_dir: Path) -> Path:
    candidates = import_name_candidates(list_name)
    out_dir.mkdir(parents=True, exist_ok=True)
    last_error = "import failed"

    for name in candidates:
        payload = cmd_import_file(name, 0)
        preview = build_frame(payload, session.seq)
        if len(preview) != 36:
            raise RuntimeError(f"2-2 frame must be 36 bytes, got {len(preview)}")
        await session.write_payload(payload)

        chunks: list[bytes] = []
        started = False
        idle_deadline = time.monotonic() + IMPORT_IDLE_S
        while time.monotonic() < idle_deadline:
            remaining = idle_deadline - time.monotonic()
            try:
                _source, rx = await asyncio.wait_for(session.events.get(), remaining)
            except asyncio.TimeoutError:
                break
            if rx.type != 2:
                continue
            if rx.cmd == 3:
                started = True
                actual = decode_text(rx.params) or name
                print(f"OK import started {actual}")
                idle_deadline = time.monotonic() + IMPORT_IDLE_S
            elif rx.cmd == 4:
                chunks.append(rx.params)
                idle_deadline = time.monotonic() + IMPORT_IDLE_S
                if len(chunks) == 1 or len(chunks) % 20 == 0:
                    print(f"OK import data {sum(len(part) for part in chunks)} B")
            elif rx.cmd == 5:
                code = rx.params[0] if rx.params else 3
                if code == 0:
                    data = b"".join(chunks)
                    stem = stem_from_name(name)
                    suffix = ".wav" if data[:4] == b"RIFF" else (Path(name).suffix or ".bin")
                    if suffix == ".":
                        suffix = ".bin"
                    path = out_dir / f"{stem}{suffix}"
                    path.write_bytes(data)
                    print(f"OK import saved {path} ({len(data)} B)")
                    return path
                if code == 1 and not chunks:
                    last_error = f"{name}: file missing"
                    print(f"WARN {last_error}; try next candidate")
                    break
                last_error = f"{name}: end code {code}, bytes={sum(len(part) for part in chunks)}"
                raise RuntimeError(last_error)
        if chunks:
            raise RuntimeError(
                f"{name}: import idle timeout after {sum(len(part) for part in chunks)} B"
            )
        if started:
            last_error = f"{name}: started but no end"
    raise RuntimeError(last_error)


RECORD_STATE = {1: "recording", 2: "idle", 3: "paused"}


async def read_record_state(session: Session) -> str:
    await session.write_payload(cmd_get_record_state())
    async for _source, frame in session.wait_frames(3.0):
        if frame.type == 3 and frame.cmd == 20 and frame.params:
            text = RECORD_STATE.get(frame.params[0], f"unknown({frame.params[0]})")
            print(f"OK record state {text}")
            return text
        if frame.type == 3 and frame.cmd in {1, 3, 5, 7}:
            print(f"OK AE23 event cmd={frame.cmd}")
    raise RuntimeError("no recording state response (3-20)")


async def send_record_command(session: Session, action: str) -> None:
    mapping = {
        "start": (cmd_start_recording(), 2, "start"),
        "save": (cmd_save_recording(), 4, "save"),
        "pause": (cmd_pause_recording(), 6, "pause"),
        "resume": (cmd_resume_recording(), 8, "resume"),
    }
    payload, expect_cmd, label = mapping[action]
    await session.write_payload(payload)
    async for source, frame in session.wait_frames(3.0):
        if frame.type == 3 and frame.cmd == expect_cmd and frame.params:
            ok = frame.params[0] == 1
            print(("OK" if ok else "ERR") + f" record {label} code={frame.params[0]} via {source}")
            if not ok:
                raise RuntimeError(f"record {label} failed")
            return
        if frame.type == 3 and frame.cmd in {1, 3, 5, 7}:
            print(f"OK hardware event cmd={frame.cmd} via {source}")
    print(f"WARN no record {label} response; command was sent")


async def capture_realtime(session: Session, seconds: float, out_dir: Path) -> Path:
    if seconds <= 0:
        raise RuntimeError("--realtime seconds must be > 0")
    out_dir.mkdir(parents=True, exist_ok=True)
    chunks: list[bytes] = []
    name = ""
    await session.write_payload(cmd_start_realtime())
    deadline = time.monotonic() + seconds
    stopped = False
    while time.monotonic() < deadline and not stopped:
        remaining = deadline - time.monotonic()
        try:
            _source, frame = await asyncio.wait_for(session.events.get(), remaining)
        except asyncio.TimeoutError:
            break
        if frame.type != 1:
            continue
        if frame.cmd == 0:
            name = decode_text(frame.params)
            print(f"OK realtime name {name or '(none)'}")
        elif frame.cmd == 1:
            chunks.append(frame.params)
            if len(chunks) == 1 or len(chunks) % 50 == 0:
                print(f"OK realtime data {sum(len(part) for part in chunks)} B")
        elif frame.cmd == 4 and frame.params:
            status = frame.params[0]
            print(f"OK realtime status {status}")
            if status == 2:
                stopped = True
    await session.write_payload(cmd_stop_realtime())
    # Drain a short moment for late packets / stop status.
    async for _source, frame in session.wait_frames(1.0):
        if frame.type == 1 and frame.cmd == 1:
            chunks.append(frame.params)

    raw = b"".join(chunks)
    if not raw:
        raise RuntimeError("no realtime audio received")
    stem = stem_from_name(name) if name else f"qs668-realtime-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    raw_path = out_dir / f"{stem}.raw"
    ogg_path = out_dir / f"{stem}.ogg"
    raw_path.write_bytes(raw)
    print(f"OK realtime raw {raw_path} ({len(raw)} B)")
    if len(raw) % 40 != 0:
        print("WARN raw length is not a multiple of 40; skip Ogg wrap")
        return raw_path
    subprocess.run(
        [sys.executable, str(TOOLS_DIR / "qs668-raw-opus-to-ogg.py"), str(raw_path), str(ogg_path)],
        check=True,
    )
    print(f"OK realtime ogg {ogg_path}")
    return ogg_path


async def run(args: argparse.Namespace) -> int:
    if args.scan:
        await scan_devices()
        return 0

    filenames = normalize_filename_args(args.filename)
    importing = args.import_first or args.import_all or bool(filenames)
    if importing and args.realtime is not None:
        raise SystemExit("Do not run file import and realtime audio at the same time.")

    address = await resolve_address(args.address)
    session = Session()
    await session.connect(address)
    write_cached_address(address)
    try:
        record_action = args.record
        if args.status or importing or args.realtime is not None:
            await read_status(session)

        if args.record_state:
            await read_record_state(session)
        if record_action:
            await send_record_command(session, record_action)
            await read_record_state(session)

        if args.realtime is not None:
            path = await capture_realtime(session, args.realtime, Path(args.out))
            print(f"DONE {path}")
            print("DONE corpus left empty under archive/corpus/")
            return 0

        if args.list or importing:
            files = await list_files(session)
            for index, entry in enumerate(files, start=1):
                print(f"  {index}. {entry.name}  size={entry.size}  time={entry.duration_or_time}")
            if args.list and not importing:
                print("DONE list")
                return 0
            if not files:
                raise RuntimeError("file list empty")
            targets = resolve_import_targets(files, args)
            if not targets:
                raise RuntimeError("no import targets")
            out_dir = Path(args.out)
            saved: list[Path] = []
            failed: list[str] = []
            batch = len(targets) > 1
            for index, target in enumerate(targets, start=1):
                print(f"INFO import {index}/{len(targets)} {target}")
                try:
                    path = await import_file(session, target, out_dir)
                except Exception as error:  # noqa: BLE001 - continue batch
                    failed.append(f"{target}: {error}")
                    print(f"WARN import failed {target}: {error}")
                    if not batch:
                        raise
                    continue
                saved.append(path)
                print(f"DONE {path}")
                if args.transcribe:
                    await asyncio.to_thread(run_transcribe_after_import, path, args)

            if not args.transcribe:
                print("DONE corpus left empty under archive/corpus/")
            print(
                f"DONE import summary ok={len(saved)} failed={len(failed)} "
                f"total={len(targets)}"
            )
            if failed and not saved:
                raise RuntimeError("; ".join(failed))
            if failed:
                print("WARN some imports failed:")
                for item in failed:
                    print(f"  - {item}")
                return 1
            return 0

        if args.status or args.record_state or record_action:
            print("DONE")
            return 0
        print("DONE")
        return 0
    finally:
        await session.disconnect()


def run_transcribe_after_import(audio_path: Path, args: argparse.Namespace) -> None:
    """Best-effort cloud ASR. Import already succeeded; never undo the audio file."""
    init_env = TOOLS_DIR / "qs668-init-env.py"
    if init_env.exists():
        subprocess.run([sys.executable, str(init_env)], check=False)
    cmd = [
        sys.executable,
        str(TOOLS_DIR / "qs668-transcribe.py"),
        str(audio_path),
        "--out-dir",
        str(ROOT / "archive" / "corpus"),
    ]
    if getattr(args, "title", ""):
        cmd.extend(["--title", args.title])
    if getattr(args, "customer", ""):
        cmd.extend(["--customer", args.customer])
    if getattr(args, "force", False):
        cmd.append("--force")
    print("INFO running cloud transcription after import")
    completed = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if completed.stdout:
        print(completed.stdout.rstrip())
    if completed.returncode == 0:
        print("DONE transcription")
        return
    detail = (completed.stderr or completed.stdout or "transcription failed").strip()
    print(f"WARN transcription failed after successful import: {detail}")
    print("WARN fix .env credentials/quota, then retry:")
    print(f"  python tools/qs668-transcribe.py {audio_path}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="QS668 BLE bring-up into archive/audio/")
    parser.add_argument("--scan", action="store_true", help="Scan for AE20 devices and exit")
    parser.add_argument("--address", help="Bluetooth address; cached in .qs668-device when omitted")
    parser.add_argument("--status", action="store_true", help="Read battery, capacity, firmware")
    parser.add_argument("--list", action="store_true", help="Read the on-card file list")
    parser.add_argument("--import-first", action="store_true", help="Import the first list entry")
    parser.add_argument(
        "--import-all",
        action="store_true",
        help="Import every on-card list entry (order as listed)",
    )
    parser.add_argument(
        "--filename",
        action="append",
        metavar="NAME",
        help="Import this list name (repeatable or comma-separated; extension may be restored)",
    )
    parser.add_argument(
        "--transcribe",
        action="store_true",
        help="After import, run cloud ASR into archive/corpus/ (requires Doubao/.env)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="With --transcribe, re-run ASR even when corpus/<stem>.md already exists",
    )
    parser.add_argument("--title", default="", help="Corpus title when used with --transcribe")
    parser.add_argument("--customer", default="", help="Customer label when used with --transcribe")
    parser.add_argument("--record-state", action="store_true", help="Read recording state")
    parser.add_argument(
        "--record",
        choices=["start", "pause", "resume", "save"],
        help="Send a recording control command",
    )
    parser.add_argument(
        "--realtime",
        type=float,
        metavar="SECONDS",
        help="Capture realtime OPUS for SECONDS, save .raw/.ogg under --out",
    )
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output directory for audio")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    filenames = normalize_filename_args(args.filename)
    import_modes = sum(bool(x) for x in (args.import_first, args.import_all, filenames))
    if import_modes > 1:
        parser.error("use only one of --import-first, --import-all, or --filename")
    if args.transcribe and import_modes == 0:
        parser.error("--transcribe requires --import-first, --import-all, or --filename")
    if args.force and not args.transcribe:
        parser.error("--force requires --transcribe")
    if not any([
        args.scan,
        args.status,
        args.list,
        args.import_first,
        args.import_all,
        filenames,
        args.record_state,
        args.record,
        args.realtime is not None,
    ]):
        parser.error(
            "pass --scan, --status, --list, --import-first, --import-all, --filename, "
            "--record-state, --record, or --realtime"
        )
    return asyncio.run(run(args))



if __name__ == "__main__":
    raise SystemExit(main())
