---
name: qs668-bringup
description: >-
  Brings up the QS668 AI recorder card (AI录音卡, recording card, Bluetooth
  recorder card, voice recorder card) over BLE. Use when connecting the
  device, sending protocol frames, reading battery or capacity, controlling
  recording, listing or importing files, or receiving realtime audio in
  Cursor or Codex.
---

# QS668 bring-up

Byte layouts live in the protocol docs. Build and parse frames with
`sdk/javascript/qs668-protocol.js` or `tools/qs668_protocol.py`. Do not invent
UUIDs, CRC parameters, endianness, or command bytes.

## Read first

- Chinese protocol: `docs/protocol.zh-CN.md`
- English protocol: `docs/protocol.md`
- CLI host: `tools/qs668-bringup.py`
- Frame helpers: `tools/qs668_protocol.py`, `sdk/javascript/qs668-protocol.js`
- Human install notes: `docs/skill.zh-CN.md` and `docs/skill.md`
- Data relationship: `docs/data-relationship.zh-CN.md` and `docs/data-relationship.md`

If a field is absent from the protocol docs, stop and ask. Do not treat
`website/app.js` as a second specification.

## CLI path (primary)

Codex and Cursor drive bring-up through the CLI. Audio is written straight to
`archive/audio/`. A person may still need to power the card and allow the first
Windows Bluetooth access.

At the start of bring-up or before transcription, ensure local env exists:

```bash
python tools/qs668-init-env.py
```

This copies `.env.example` to `.env` only when `.env` is missing. Never overwrite
an existing `.env` unless the user explicitly asks for `--force`. Ask the user
to fill Doubao keys in `.env`; do not invent or commit secrets.

```bash
python -m pip install -r tools/requirements.txt
python tools/qs668-init-env.py
python tools/qs668-bringup.py --scan
python tools/qs668-bringup.py --address <ADDR> --import-first --out archive/audio
python tools/qs668-bringup.py --import-first --transcribe --out archive/audio
```

After the first success, the address is cached in `.qs668-device` (gitignored).
Later runs can omit `--address`. `--transcribe` runs cloud ASR after a
successful import; if ASR fails, keep the audio and warn. When
`archive/corpus/<stem>.md` is reusable (non-empty body and matching
`audio_sha256`), transcription skips by default; pass `--force` with
`--transcribe` to re-run and spend ASR quota again.

Batch import (one BLE session):

```bash
python tools/qs668-bringup.py --import-all --transcribe --out archive/audio
python tools/qs668-bringup.py --filename noteA.wav --filename noteB. --transcribe
python tools/qs668-bringup.py --filename noteA.wav,noteB. --transcribe --force
```

Use only one of `--import-first`, `--import-all`, or `--filename`. Batch continues
after a single import failure and prints a summary; exit code is non-zero if any
failed.

Useful variants:

```bash
python tools/qs668-bringup.py --status
python tools/qs668-bringup.py --list
python tools/qs668-bringup.py --filename note20260710-162938. --out archive/audio
python tools/qs668-bringup.py --record-state
python tools/qs668-bringup.py --record start
python tools/qs668-bringup.py --record pause
python tools/qs668-bringup.py --record resume
python tools/qs668-bringup.py --record save
python tools/qs668-bringup.py --realtime 5 --out archive/audio
```

Rules:

- Send `2-2` as one 36-byte GATT write. Never split it into 20 + 16.
- Keep separate frame buffers for AE22 and AE23.
- Do not send delete commands (`2-8`, `2-9`).
- Leave `archive/corpus/` empty. Transcription is a later step.
- Do not run file import and realtime audio at the same time.

## Done

Bring-up is complete when the CLI prints `DONE` with a path under
`archive/audio/`, after:

1. A battery response (`0-4`).
2. A file list accumulated from `2-1` frames.
3. One import finished with end code `0`, saved under `archive/audio/`.
4. No on-card delete.

## Web Bluetooth (manual check)

Use `website/` only when a person is validating in Chrome or Edge. Start
`python -m http.server 8080` from `website/`, open `http://localhost:8080`, and
click “连接设备” or “兼容扫描”. Browser downloads are not the Done path; copy
them into `archive/audio/` only if the CLI cannot run.

## Cloud transcription (optional)

After an import, when the user asks to transcribe:

```bash
python tools/qs668-transcribe.py archive/audio/<stem>.wav
python tools/qs668-transcribe.py archive/audio/<stem>.wav --force
```

Default provider is Doubao / Volcengine Seed ASR. First run
`python tools/qs668-init-env.py`, then ask the user to fill
`QS668_ASR_DOUBAO_APP_ID` and `QS668_ASR_DOUBAO_ACCESS_KEY` in `.env`.
Default language is `zh`. Prefer utterance timestamps in the corpus markdown.
Skip ASR only when corpus body is non-empty and `audio_sha256` matches the
audio file; otherwise re-run (or pass `--force`).
Set `QS668_ASR_PROVIDER=openai` only for the OpenAI-compatible fallback.
Write corpus under `archive/corpus/`. Never commit `.env`.

## Realtime audio (optional)

Only when the user asks for realtime audio:

```bash
python tools/qs668-bringup.py --realtime 5 --out archive/audio
```

That writes `.raw` and wraps `.ogg` under `archive/audio/`. Do not combine with `--import-first` or `--filename`.

## After code changes

- Python helpers: `python tools/test_qs668_protocol.py`, `python tools/test_qs668_transcribe.py`, `python tools/test_qs668_bringup.py`
- JavaScript SDK: `npm test` from the repository root
- Protocol changes: update `docs/protocol.md` and `docs/protocol.zh-CN.md` together
- Skill behavior changes: update this file, `docs/skill.md`, and `docs/skill.zh-CN.md` together
