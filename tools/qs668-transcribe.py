#!/usr/bin/env python3
"""Transcribe archive audio. Default provider is Doubao / Volcengine Seed ASR.

Doubao docs:
https://docs.volcengine.com/docs/DoubaoVoice/ProductOverview-6?lang=zh

Also supports OpenAI-compatible /audio/transcriptions when
QS668_ASR_PROVIDER=openai.

Writes markdown under archive/corpus/. Prefer utterance timestamps from Doubao
when available. Long files may be split with ffmpeg.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

import requests

NOTE_TIME_RE = re.compile(
    r"(?P<prefix>note)?(?P<date>\d{8})[-_](?P<clock>\d{6})",
    re.IGNORECASE,
)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_AUDIO_DIR = ROOT / "archive" / "audio"
DEFAULT_CORPUS_DIR = ROOT / "archive" / "corpus"
ENV_FILE = ROOT / ".env"

DOUBAO_SUBMIT_URL = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit"
DOUBAO_QUERY_URL = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/query"
DOUBAO_RESOURCE_ID = "volc.seedasr.auc"

DEFAULT_MAX_BYTES = 100 * 1024 * 1024
DEFAULT_MAX_SECONDS = 4 * 60 * 60
DEFAULT_CHUNK_SECONDS = 30 * 60

DOUBAO_STATUS_HINTS = {
    "20000000": "OK",
    "20000001": "任务处理中，继续等待",
    "20000002": "任务排队中，继续等待",
    "45000001": "鉴权失败：检查 APP ID / Access Token，或是否开通录音文件识别大模型",
    "45000002": "鉴权失败：Access Token 无效或已过期",
    "55000001": "服务侧错误：稍后重试，或到火山控制台查看服务状态",
}


def explain_doubao_error(status: str = "", message: str = "", http_code: int | None = None) -> str:
    parts: list[str] = []
    if http_code is not None:
        parts.append(f"HTTP {http_code}")
    if status:
        parts.append(f"status {status}")
    hint = DOUBAO_STATUS_HINTS.get(status or "")
    text = " ".join(str(part) for part in (message or "").split())
    lowered = text.lower()
    if not hint:
        if http_code in {401, 403} or "auth" in lowered or "token" in lowered or "鉴权" in text:
            hint = "鉴权失败：检查 QS668_ASR_DOUBAO_APP_ID / QS668_ASR_DOUBAO_ACCESS_KEY"
        elif any(token in text for token in ("余额", "资源包", "时长", "quota", "package")) or "quota" in lowered:
            hint = "额度不足：在火山控制台为录音文件识别大模型购买/续费时长包"
        elif any(token in text for token in ("未开通", "not open", "not activated", "resource")):
            hint = "服务未开通：控制台开通「录音文件识别大模型」，Resource Id 使用 volc.seedasr.auc"
        elif http_code == 429:
            hint = "请求过于频繁：降低并发后重试"
        elif http_code and http_code >= 500:
            hint = "服务端异常：稍后重试"
    if hint and hint != "OK":
        parts.append(hint)
    if text:
        parts.append(text[:240])
    return "；".join(parts) if parts else "未知豆包 ASR 错误"


@dataclass(frozen=True)
class ChunkPlan:
    index: int
    start_s: float
    end_s: float

    @property
    def duration_s(self) -> float:
        return max(0.0, self.end_s - self.start_s)


@dataclass(frozen=True)
class ChunkResult:
    plan: ChunkPlan
    text: str
    timed_lines: list[str]


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        # Prefer non-empty .env values over empty inherited environment vars.
        if key and (key not in os.environ or not os.environ.get(key, "").strip()):
            os.environ[key] = value


def env_first(*names: str, default: str = "") -> str:
    for name in names:
        value = os.environ.get(name)
        if value is not None and value.strip() != "":
            return value.strip()
    return default


def env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return int(raw)


def env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return float(raw)


def resolve_config(args: argparse.Namespace) -> dict:
    load_env_file(ENV_FILE)
    provider = (args.provider or env_first("QS668_ASR_PROVIDER", default="doubao")).lower()
    if args.language is not None:
        language = args.language.strip() or None
    elif "QS668_ASR_LANGUAGE" in os.environ:
        language = os.environ["QS668_ASR_LANGUAGE"].strip() or None
    else:
        language = "zh"

    config = {
        "provider": provider,
        "language": language,
        "max_bytes": args.max_bytes if args.max_bytes is not None else env_int("QS668_ASR_MAX_BYTES", DEFAULT_MAX_BYTES),
        "max_seconds": args.max_seconds if args.max_seconds is not None else env_float("QS668_ASR_MAX_SECONDS", DEFAULT_MAX_SECONDS),
        "chunk_seconds": args.chunk_seconds if args.chunk_seconds is not None else env_float("QS668_ASR_CHUNK_SECONDS", DEFAULT_CHUNK_SECONDS),
        "doubao_app_id": env_first("QS668_ASR_DOUBAO_APP_ID", "DOUBAO_STT_APP_ID"),
        "doubao_access_key": env_first("QS668_ASR_DOUBAO_ACCESS_KEY", "DOUBAO_STT_ACCESS_KEY"),
        "doubao_api_key": env_first("QS668_ASR_DOUBAO_API_KEY"),
        "doubao_resource_id": env_first("QS668_ASR_DOUBAO_RESOURCE_ID", default=DOUBAO_RESOURCE_ID),
        "doubao_speaker": env_first("QS668_ASR_DOUBAO_SPEAKER", default="true").lower() not in {"0", "false", "no", "off"},
        "doubao_ssd_version": env_first("QS668_ASR_DOUBAO_SSD_VERSION", default="300"),
        "timeline_mode": (
            args.timeline
            or env_first("QS668_ASR_TIMELINE", default="absolute")
        ).lower(),
        "start_time": getattr(args, "start_time", None) or env_first("QS668_ASR_START_TIME"),
        "openai_api_key": env_first("QS668_ASR_API_KEY", "OPENAI_API_KEY"),
        "openai_base_url": env_first("QS668_ASR_BASE_URL", "OPENAI_BASE_URL", default="https://api.openai.com/v1").rstrip("/"),
        "openai_model": env_first("QS668_ASR_MODEL", default="whisper-1"),
    }

    if provider == "doubao":
        if not config["doubao_api_key"] and not (config["doubao_app_id"] and config["doubao_access_key"]):
            raise SystemExit(
                "Missing Doubao credentials. Set QS668_ASR_DOUBAO_APP_ID + "
                "QS668_ASR_DOUBAO_ACCESS_KEY, or QS668_ASR_DOUBAO_API_KEY. "
                "See .env.example."
            )
    elif provider == "openai":
        if not config["openai_api_key"]:
            raise SystemExit(
                "Missing QS668_ASR_API_KEY (or OPENAI_API_KEY). "
                "Copy .env.example to .env and fill the key."
            )
    else:
        raise SystemExit(f"Unsupported QS668_ASR_PROVIDER: {provider}")
    return config


def require_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise SystemExit("ffmpeg and ffprobe are required for long-audio splitting.")


def probe_duration_seconds(audio_path: Path) -> float:
    require_ffmpeg()
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    value = result.stdout.strip()
    if not value:
        raise RuntimeError(f"ffprobe returned no duration for {audio_path}")
    return float(value)


def format_timestamp(seconds: float) -> str:
    total = max(0, int(round(seconds)))
    hours, rem = divmod(total, 3600)
    minutes, secs = divmod(rem, 60)
    if hours:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def format_timestamp_ms(ms: float | int) -> str:
    return format_timestamp(float(ms) / 1000.0)


def format_wall_time(moment: datetime) -> str:
    return moment.strftime("%Y-%m-%d %H:%M:%S")


def format_body_timestamp(moment: datetime, recording_start: datetime | None) -> str:
    """Compact stamp for transcript body.

    Same calendar day as recording start -> HH:MM:SS
    After midnight crossover -> MM-DD HH:MM:SS
    No start anchor -> full YYYY-MM-DD HH:MM:SS
    """
    if recording_start is None:
        return format_wall_time(moment)
    if moment.date() == recording_start.date():
        return moment.strftime("%H:%M:%S")
    return moment.strftime("%m-%d %H:%M:%S")


def parse_recording_start(audio_path: Path, explicit: str | None = None) -> datetime | None:
    """Resolve wall-clock start from --start-time or noteYYYYMMDD-HHMMSS filename."""
    if explicit:
        text = explicit.strip()
        for fmt in (
            "%Y-%m-%d %H:%M:%S",
            "%Y/%m/%d %H:%M:%S",
            "%Y%m%d-%H%M%S",
            "%Y%m%d_%H%M%S",
            "%Y-%m-%dT%H:%M:%S",
        ):
            try:
                return datetime.strptime(text, fmt)
            except ValueError:
                continue
        raise SystemExit(
            f"Invalid --start-time / QS668_ASR_START_TIME: {explicit!r}. "
            "Use YYYY-MM-DD HH:MM:SS or YYYYMMDD-HHMMSS."
        )

    match = NOTE_TIME_RE.search(audio_path.stem)
    if not match:
        return None
    try:
        return datetime.strptime(match.group("date") + match.group("clock"), "%Y%m%d%H%M%S")
    except ValueError:
        return None


def format_line_timestamp(offset_ms: float, base: datetime | None, mode: str) -> str:
    if mode == "absolute" and base is not None:
        moment = base + timedelta(milliseconds=offset_ms)
        return format_body_timestamp(moment, base)
    if mode == "absolute" and base is None:
        # No anchor date available; keep relative mm:ss rather than inventing a day.
        return format_timestamp_ms(offset_ms)
    return format_timestamp_ms(offset_ms)


def plan_chunks(duration_s: float, chunk_seconds: float) -> list[ChunkPlan]:
    if duration_s <= 0:
        return [ChunkPlan(index=0, start_s=0.0, end_s=0.0)]
    chunk_seconds = max(30.0, float(chunk_seconds))
    plans: list[ChunkPlan] = []
    start = 0.0
    index = 0
    while start < duration_s:
        end = min(duration_s, start + chunk_seconds)
        if plans and duration_s - start < max(15.0, chunk_seconds * 0.2) and end >= duration_s:
            prev = plans[-1]
            plans[-1] = ChunkPlan(index=prev.index, start_s=prev.start_s, end_s=duration_s)
            break
        plans.append(ChunkPlan(index=index, start_s=start, end_s=end))
        index += 1
        start = end
    return plans


def needs_split(audio_path: Path, duration_s: float, max_bytes: int, max_seconds: float) -> bool:
    return audio_path.stat().st_size > max_bytes or duration_s > max_seconds


def extract_chunk(audio_path: Path, plan: ChunkPlan, out_path: Path) -> Path:
    require_ffmpeg()
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-ss", str(plan.start_s),
            "-t", str(plan.duration_s),
            "-i", str(audio_path),
            "-ac", "1",
            "-ar", "16000",
            str(out_path.with_suffix(".wav")),
        ],
        check=True,
        capture_output=True,
    )
    wav_path = out_path.with_suffix(".wav")
    if out_path != wav_path:
        out_path.unlink(missing_ok=True)
    return wav_path


def audio_format(path: Path) -> str:
    suffix = path.suffix.lower().lstrip(".")
    if suffix in {"wav", "mp3", "ogg", "m4a", "aac", "amr", "flac", "mp4", "webm"}:
        return "m4a" if suffix == "mp4" else suffix
    return "wav"


def doubao_headers(config: dict, request_id: str) -> dict[str, str]:
    headers = {
        "Content-Type": "application/json",
        "X-Api-Resource-Id": config["doubao_resource_id"],
        "X-Api-Request-Id": request_id,
        "X-Api-Sequence": "-1",
    }
    if config["doubao_api_key"]:
        headers["X-Api-Key"] = config["doubao_api_key"]
    else:
        headers["X-Api-App-Key"] = config["doubao_app_id"]
        headers["X-Api-Access-Key"] = config["doubao_access_key"]
    return headers


def utterances_to_lines(
    utterances: list,
    offset_s: float = 0.0,
    base_time: datetime | None = None,
    timeline_mode: str = "absolute",
) -> list[str]:
    lines: list[str] = []
    for item in utterances:
        text = str(item.get("text") or "").strip()
        if not text:
            continue
        start_ms = float(item.get("start_time") or 0) + offset_s * 1000
        stamp = format_line_timestamp(start_ms, base_time, timeline_mode)
        additions = item.get("additions") or {}
        speaker = str(additions.get("speaker") or item.get("speaker") or "").strip()
        if speaker:
            lines.append(f"[{stamp}] 说话人{speaker}：{text}")
        else:
            lines.append(f"[{stamp}] {text}")
    return lines


def doubao_language_value(language: str | None, enable_speaker: bool) -> str | None:
    """Speaker diarization only works when language is unset or zh-CN."""
    if not language:
        return None
    normalized = language.strip()
    if enable_speaker and normalized.lower() in {"zh", "zh-cn", "chinese"}:
        return "zh-CN"
    return normalized


def transcribe_doubao(audio_path: Path, config: dict, offset_s: float = 0.0) -> ChunkResult:
    request_id = str(uuid.uuid4())
    headers = doubao_headers(config, request_id)
    audio_b64 = base64.b64encode(audio_path.read_bytes()).decode("ascii")
    enable_speaker = bool(config.get("doubao_speaker"))
    request_body = {
        "model_name": "bigmodel",
        "enable_itn": True,
        "enable_punc": True,
        "show_utterances": True,
        "enable_speaker_info": enable_speaker,
    }
    if enable_speaker:
        request_body["ssd_version"] = str(config.get("doubao_ssd_version") or "300")
    language = doubao_language_value(config.get("language"), enable_speaker)
    if language:
        request_body["language"] = language
    payload = {
        "user": {"uid": "qs668-open-protocol"},
        "audio": {
            "data": audio_b64,
            "format": audio_format(audio_path),
        },
        "request": request_body,
    }

    submit = requests.post(DOUBAO_SUBMIT_URL, headers=headers, json=payload, timeout=120)
    status = submit.headers.get("X-Api-Status-Code", "")
    message = submit.headers.get("X-Api-Message", submit.text[:300])
    if submit.status_code >= 400:
        raise RuntimeError("Doubao submit failed: " + explain_doubao_error(status, message, submit.status_code))
    if status and status not in {"20000000", "0", ""}:
        raise RuntimeError("Doubao submit failed: " + explain_doubao_error(status, message, submit.status_code))

    query_headers = doubao_headers(config, request_id)
    deadline = time.monotonic() + 30 * 60
    while time.monotonic() < deadline:
        query = requests.post(DOUBAO_QUERY_URL, headers=query_headers, json={}, timeout=60)
        q_status = query.headers.get("X-Api-Status-Code", "")
        q_message = query.headers.get("X-Api-Message", "")
        body_text = query.text.strip()
        if query.status_code >= 400:
            raise RuntimeError(
                "Doubao query failed: " + explain_doubao_error(q_status, q_message or body_text[:300], query.status_code)
            )
        if not body_text or body_text == "{}":
            time.sleep(2)
            continue
        body = query.json()
        result = body.get("result") or {}
        text = str(result.get("text") or "").strip()
        utterances = result.get("utterances") or []
        if text or utterances:
            timed = utterances_to_lines(
                utterances,
                offset_s=offset_s,
                base_time=config.get("recording_start"),
                timeline_mode=config.get("timeline_mode") or "absolute",
            )
            if not text and timed:
                text = "\n".join(line.split("] ", 1)[-1] for line in timed)
            return ChunkResult(
                plan=ChunkPlan(0, offset_s, offset_s),
                text=text,
                timed_lines=timed,
            )
        if q_status in {"20000001", "20000002"}:
            time.sleep(2)
            continue
        if q_status and q_status not in {"20000000", "0"}:
            raise RuntimeError(
                "Doubao query failed: " + explain_doubao_error(q_status, q_message or body_text[:300], query.status_code)
            )
        time.sleep(2)
    raise RuntimeError("Doubao transcription timed out while polling；可稍后重试同一文件")


def transcribe_openai(audio_path: Path, config: dict) -> ChunkResult:
    url = f"{config['openai_base_url']}/audio/transcriptions"
    headers = {"Authorization": f"Bearer {config['openai_api_key']}"}
    data = {"model": config["openai_model"], "response_format": "verbose_json"}
    if config["language"]:
        data["language"] = config["language"]

    with audio_path.open("rb") as handle:
        files = {"file": (audio_path.name, handle, "application/octet-stream")}
        response = requests.post(url, headers=headers, data=data, files=files, timeout=300)

    if response.status_code >= 400:
        # Some gateways only support json.
        data["response_format"] = "json"
        with audio_path.open("rb") as handle:
            files = {"file": (audio_path.name, handle, "application/octet-stream")}
            response = requests.post(url, headers=headers, data=data, files=files, timeout=300)
        if response.status_code >= 400:
            raise RuntimeError(
                "OpenAI-compatible ASR failed: "
                + explain_doubao_error("", response.text[:300], response.status_code)
            )

    payload = response.json()
    text = str(payload.get("text") or "").strip()
    timed: list[str] = []
    base = config.get("recording_start")
    mode = config.get("timeline_mode") or "absolute"
    for item in payload.get("segments") or []:
        seg_text = str(item.get("text") or "").strip()
        if not seg_text:
            continue
        start_ms = float(item.get("start") or 0) * 1000
        stamp = format_line_timestamp(start_ms, base, mode)
        timed.append(f"[{stamp}] {seg_text}")
    if not text:
        raise RuntimeError(f"ASR returned empty text: {json.dumps(payload, ensure_ascii=False)[:500]}")
    return ChunkResult(plan=ChunkPlan(0, 0, 0), text=text, timed_lines=timed)


def transcribe_file(audio_path: Path, config: dict, offset_s: float = 0.0) -> ChunkResult:
    if config["provider"] == "doubao":
        return transcribe_doubao(audio_path, config, offset_s=offset_s)

    result = transcribe_openai(audio_path, config)
    if not result.timed_lines:
        return result
    base = config.get("recording_start")
    mode = config.get("timeline_mode") or "absolute"
    shifted = []
    for line in result.timed_lines:
        if line.startswith("[") and "] " in line:
            stamp, body = line[1:].split("] ", 1)
            # Relative mm:ss / hh:mm:ss from OpenAI path before shift.
            if mode == "absolute" and base is not None and re.fullmatch(r"\d{1,2}:\d{2}(:\d{2})?", stamp):
                parts = [int(part) for part in stamp.split(":")]
                seconds = 0
                for part in parts:
                    seconds = seconds * 60 + part
                seconds += offset_s
                moment = base + timedelta(seconds=seconds)
                shifted.append(f"[{format_body_timestamp(moment, base)}] {body}")
            elif " " not in stamp:
                parts = [int(part) for part in stamp.split(":")]
                seconds = 0
                for part in parts:
                    seconds = seconds * 60 + part
                shifted.append(f"[{format_timestamp(seconds + offset_s)}] {body}")
            else:
                shifted.append(line)
        else:
            shifted.append(line)
    return ChunkResult(plan=result.plan, text=result.text, timed_lines=shifted)


def merge_transcript(results: list[ChunkResult]) -> tuple[str, bool]:
    timed = [line for item in results for line in item.timed_lines]
    if timed:
        return "\n".join(timed), True
    if len(results) == 1:
        return results[0].text, False
    parts: list[str] = []
    for item in results:
        start = format_timestamp(item.plan.start_s)
        end = format_timestamp(item.plan.end_s)
        parts.append(f"## {start}–{end}\n\n{item.text}")
    return "\n\n".join(parts), False


def yaml_escape(value: str) -> str:
    text = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{text}"'


def corpus_path_for(audio_path: Path, out_dir: Path) -> Path:
    return Path(out_dir) / f"{Path(audio_path).stem}.md"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_corpus_front_matter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end < 0:
        return {}, text
    front = text[3:end].strip()
    body = text[end + 4:].lstrip("\n")
    meta: dict[str, str] = {}
    for line in front.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip().strip('"').strip("'")
    return meta, body


def corpus_body_nonempty(body: str) -> bool:
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        return True
    return False


def corpus_matches_audio(corpus_path: Path, audio_path: Path) -> tuple[bool, str]:
    """Whether existing corpus may skip ASR for this audio (data-relationship skip rules)."""
    text = Path(corpus_path).read_text(encoding="utf-8")
    meta, body = parse_corpus_front_matter(text)
    if not corpus_body_nonempty(body):
        return False, "empty transcript body"
    claimed = (meta.get("audio_sha256") or "").strip().lower()
    if not claimed:
        return False, "missing audio_sha256"
    actual = sha256_file(audio_path)
    if claimed != actual:
        return False, f"audio_sha256 mismatch (corpus={claimed[:12]}… audio={actual[:12]}…)"
    return True, "ok"


def should_skip_transcribe(audio_path: Path, out_dir: Path, force: bool) -> Path | None:
    """Return existing corpus path when ASR should be skipped; else None."""
    if force:
        return None
    out_path = corpus_path_for(audio_path, out_dir)
    if not out_path.is_file():
        return None
    ok, detail = corpus_matches_audio(out_path, audio_path)
    if ok:
        return out_path
    print(f"WARN corpus present but not reusable ({detail}); will re-run ASR")
    print(f"WARN pass --force after fixing, or let this run rewrite {out_path}")
    return None


def write_corpus(
    audio_path: Path,
    text: str,
    out_dir: Path,
    language: str | None,
    chunk_count: int,
    duration_s: float,
    provider: str,
    has_timeline: bool,
    title: str = "",
    customer: str = "",
    sync_status: str = "local",
    recording_start: datetime | None = None,
    timeline_mode: str = "absolute",
    transcribed_on: str = "pc",
    audio_sha256: str | None = None,
) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = corpus_path_for(audio_path, out_dir)
    lang = language or "auto"
    relative_audio = audio_path
    try:
        relative_audio = audio_path.resolve().relative_to(ROOT.resolve())
    except ValueError:
        pass
    title_value = title.strip() or audio_path.stem
    if has_timeline and timeline_mode == "absolute" and recording_start is not None:
        timeline = "wall-clock"
    elif has_timeline:
        timeline = "relative"
    else:
        timeline = "none"
    recorded_at = format_wall_time(recording_start) if recording_start else ""
    digest = audio_sha256 or sha256_file(audio_path)
    side = (transcribed_on or "pc").strip() or "pc"

    # Keep metadata only in YAML front matter. Body is title + transcript.
    lines = [
        "---",
        f"title: {yaml_escape(title_value)}",
        f"audio: {yaml_escape(relative_audio.as_posix())}",
        f"audio_sha256: {yaml_escape(digest)}",
    ]
    if recorded_at:
        lines.append(f"recorded_at: {yaml_escape(recorded_at)}")
    lines.append(f"duration: {yaml_escape(format_timestamp(duration_s))}")
    lines.append(f"language: {yaml_escape(lang)}")
    if customer.strip():
        lines.append(f"customer: {yaml_escape(customer.strip())}")
    lines.append(f"sync_status: {yaml_escape(sync_status.strip() or 'local')}")
    lines.append(f"provider: {yaml_escape(provider)}")
    lines.append(f"transcribed_on: {yaml_escape(side)}")
    lines.append(f"timeline: {yaml_escape(timeline)}")
    if chunk_count > 1:
        lines.append(f"chunks: {chunk_count}")
    lines.extend([
        "---",
        "",
        f"# {title_value}",
        "",
        text,
        "",
    ])
    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path


def transcribe_maybe_split(audio_path: Path, config: dict) -> tuple[str, int, float, bool]:
    duration_s = probe_duration_seconds(audio_path)
    recording_start = parse_recording_start(audio_path, config.get("start_time"))
    config = dict(config)
    config["recording_start"] = recording_start
    mode = (config.get("timeline_mode") or "absolute").lower()
    if mode == "absolute" and recording_start is None:
        print("WARN cannot parse recording start from filename; using relative timeline")
        config["timeline_mode"] = "relative"
    elif mode == "absolute" and recording_start is not None:
        print(f"ASR wall-clock start {format_wall_time(recording_start)}")

    if not needs_split(audio_path, duration_s, config["max_bytes"], config["max_seconds"]):
        print(f"ASR single file ({audio_path.stat().st_size} B, {duration_s:.1f}s)")
        result = transcribe_file(audio_path, config, offset_s=0.0)
        text, has_timeline = merge_transcript([result])
        return text, 1, duration_s, has_timeline

    plans = plan_chunks(duration_s, config["chunk_seconds"])
    print(
        f"ASR split into {len(plans)} chunks "
        f"(size={audio_path.stat().st_size} B, duration={duration_s:.1f}s, "
        f"chunk={config['chunk_seconds']}s)"
    )
    results: list[ChunkResult] = []
    with tempfile.TemporaryDirectory(prefix="qs668-asr-") as tmp:
        tmp_dir = Path(tmp)
        for plan in plans:
            print(
                f"ASR chunk {plan.index + 1}/{len(plans)} "
                f"{format_timestamp(plan.start_s)}-{format_timestamp(plan.end_s)}"
            )
            chunk_path = extract_chunk(audio_path, plan, tmp_dir / f"chunk-{plan.index:03d}.wav")
            result = transcribe_file(chunk_path, config, offset_s=plan.start_s)
            results.append(
                ChunkResult(plan=plan, text=result.text, timed_lines=result.timed_lines)
            )
    text, has_timeline = merge_transcript(results)
    return text, len(results), duration_s, has_timeline


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Transcribe QS668 archive audio via cloud ASR")
    parser.add_argument(
        "audio",
        nargs="?",
        help="Audio file path. Default: newest file under archive/audio/",
    )
    parser.add_argument("--out-dir", default=str(DEFAULT_CORPUS_DIR), help="Corpus output directory")
    parser.add_argument("--provider", choices=["doubao", "openai"], help="ASR provider override")
    parser.add_argument(
        "--language",
        help="Language hint (default from env, usually zh). Pass empty string for auto-detect.",
    )
    parser.add_argument("--max-bytes", type=int, help="Split when file larger than this many bytes")
    parser.add_argument("--max-seconds", type=float, help="Split when duration longer than this")
    parser.add_argument("--chunk-seconds", type=float, help="Target chunk length when splitting")
    parser.add_argument("--title", default="", help="Corpus title stored in markdown front matter")
    parser.add_argument("--customer", default="", help="Customer label stored in markdown front matter")
    parser.add_argument(
        "--sync-status",
        default="local",
        help="Sync status for phone/PC list metadata (default: local)",
    )
    parser.add_argument(
        "--timeline",
        choices=["absolute", "relative"],
        help="absolute=wall clock from filename/start-time (default), relative=mm:ss from audio start",
    )
    parser.add_argument(
        "--start-time",
        help="Recording start time, e.g. '2026-10-11 16:18:58' or 20261011-161858",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help=(
            "Re-run ASR even when corpus/<stem>.md is reusable "
            "(non-empty body and matching audio_sha256)"
        ),
    )
    return parser


def newest_audio(audio_dir: Path) -> Path:
    files = [
        path for path in audio_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {".wav", ".mp3", ".m4a", ".ogg", ".webm", ".mp4"}
    ]
    if not files:
        raise SystemExit(f"No audio files in {audio_dir}")
    return max(files, key=lambda path: path.stat().st_mtime)


def main() -> int:
    args = build_parser().parse_args()
    config = resolve_config(args)
    audio_path = Path(args.audio) if args.audio else newest_audio(DEFAULT_AUDIO_DIR)
    if not audio_path.is_file():
        raise SystemExit(f"Audio not found: {audio_path}")

    out_dir = Path(args.out_dir)
    audio_digest = sha256_file(audio_path)
    print(f"ASR audio_sha256 {audio_digest}")
    existing = should_skip_transcribe(audio_path, out_dir, force=args.force)
    if existing is not None:
        print(f"SKIP corpus reusable: {existing} (pass --force to re-run)")
        print(f"DONE {existing} skipped=1")
        return 0

    print(
        f"ASR {audio_path} provider={config['provider']} "
        f"language={config['language'] or 'auto'}"
    )
    text, chunk_count, duration_s, has_timeline = transcribe_maybe_split(audio_path, config)
    recording_start = parse_recording_start(audio_path, config.get("start_time"))
    timeline_mode = config.get("timeline_mode") or "absolute"
    if timeline_mode == "absolute" and recording_start is None:
        timeline_mode = "relative"
    try:
        out_path = write_corpus(
            audio_path,
            text,
            out_dir,
            config["language"],
            chunk_count,
            duration_s,
            config["provider"],
            has_timeline,
            title=args.title,
            customer=args.customer,
            sync_status=args.sync_status,
            recording_start=recording_start,
            timeline_mode=timeline_mode,
            transcribed_on="pc",
            audio_sha256=audio_digest,
        )
    except RuntimeError:
        raise
    print(f"DONE {out_path} chunks={chunk_count} timeline={'yes' if has_timeline else 'no'}")
    print(text)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"ERR {error}", file=sys.stderr)
        raise SystemExit(1) from error
