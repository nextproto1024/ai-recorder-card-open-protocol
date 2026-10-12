# QS668 AI Recorder Card Bring-up Skill

[中文](./skill.zh-CN.md)

This document tells maintainers where the Codex and Cursor bring-up skill lives and what it covers. Frame bytes stay in the [protocol](./protocol.md) and the [中文协议](./protocol.zh-CN.md). Agent steps stay in [SKILL.md](../.agents/skills/qs668-bringup/SKILL.md).

## Files

| File | Audience |
| --- | --- |
| `.agents/skills/qs668-bringup/SKILL.md` | Cursor and Codex |
| `tools/qs668-bringup.py` | CLI host invoked from chat |
| `tools/qs668_protocol.py` | Frame helpers used by the CLI |
| `docs/skill.md` | Maintainers (English) |
| `docs/skill.zh-CN.md` | Maintainers (Chinese) |

Cursor and Codex scan `.agents/skills/` when this repository is open and load `qs668-bringup`. Do not keep another copy under `.cursor/skills/` or `.codex/skills/`.

## Use it in an application repository

Copy `.agents/skills/qs668-bringup/` into the application repository:

```text
your-app/.agents/skills/qs668-bringup/SKILL.md
```

That repository needs the protocol docs, the JavaScript SDK, and the helpers used by `tools/qs668-bringup.py`, or copies of them.

## Primary path: CLI

The skill treats the CLI as the Done path. Audio is written straight to `archive/audio/`:

```bash
python -m pip install -r tools/requirements.txt
python tools/qs668-init-env.py
python tools/qs668-bringup.py --scan
python tools/qs668-bringup.py --address <ADDR> --import-first --out archive/audio
```

`qs668-init-env.py` creates `.env` from `.env.example` only when `.env` is missing. Ask the user to fill Doubao keys before transcription.

After import, `--import-first --transcribe` runs cloud ASR. A failed transcription does not undo the imported audio. Optional `--title` / `--customer` go into corpus front matter. Corpus is skipped only when the body is non-empty and `audio_sha256` matches; use `--force` with `--transcribe` to re-run.

Batch: `--import-all --transcribe`, or repeatable / comma-separated `--filename`. Use only one of `--import-first`, `--import-all`, or `--filename`.

Recording control: `--record-state`, `--record start|pause|resume|save`. Realtime audio: `--realtime 5`. Do not run import and realtime together.

The first connection may still need a person to power the card and allow system Bluetooth. After success, the address is cached in `.qs668-device`. The web tester is only a manual check; the browser download folder is not the Done path.

## Paths the skill covers

1. Read status: battery, capacity, and firmware version.
2. Control recording, and receive hardware key events when AE23 is present.
3. Read the file list, or receive realtime audio. Do not run both transfers at the same time.

The done criteria are in the Done section of `SKILL.md`: the CLI reads battery, lists files, imports one file with a single full write into `archive/audio/`, leaves `archive/corpus/` empty, and never deletes on-card files.

Segment import and the authorization code are outside this skill's required scope. Run realtime audio only when the user asks for it, and wrap raw OPUS with `tools/qs668-raw-opus-to-ogg.py`.

After import, optional cloud ASR defaults to [Doubao / Volcengine file ASR](https://docs.volcengine.com/docs/DoubaoVoice/ProductOverview-6?lang=zh). Run `python tools/qs668-init-env.py`, then set `QS668_ASR_DOUBAO_APP_ID` and `QS668_ASR_DOUBAO_ACCESS_KEY` in `.env`. Default language is `zh`. Utterance timestamps are written as `[mm:ss] text` when the API returns them:

```bash
python -m pip install -r tools/requirements.txt
python tools/qs668-transcribe.py archive/audio/note20261011-161858.wav
python tools/qs668-transcribe.py archive/audio/note20261011-161858.wav --force
```

Output goes to `archive/corpus/<stem>.md` with `audio_sha256` and `transcribed_on`. Skip ASR only when that corpus is reusable (non-empty body + matching hash), unless `--force`. Speaker diarization is on by default and renders as `[00:02] 说话人1：...`. A short single-speaker clip may only show speaker 1. Very long files can still be split and merged. Set `QS668_ASR_PROVIDER=openai` for an OpenAI-compatible fallback. Do not commit `.env`.

Where the phone, PC, and recorder card each keep data is described in [Data relationship](./data-relationship.md).

## Maintenance

- When skill behavior changes, update `SKILL.md`, `docs/skill.md`, and `docs/skill.zh-CN.md` together.
- When commands or frame layouts change, update the protocol docs. Do not add a second command table here.
- After Python helper changes, run `python tools/test_qs668_protocol.py`.
- After JavaScript SDK changes, run `npm test` from the repository root.
