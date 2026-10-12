# Data Relationship: Recorder Card, Phone, and PC

[中文](./data-relationship.zh-CN.md)

Read this before writing a mini program, app, or desktop archive. It fixes where data lives for an AI recorder card, recording card, Bluetooth recorder card, or voice recorder card. Frame layouts stay in the [protocol](./protocol.md) and the [中文协议](./protocol.zh-CN.md). Card bring-up stays in the [bring-up skill](./skill.md). Priorities are in the [roadmap](./roadmap.md).

A WeChat mini program and a standalone app use the same relationship. They differ in cache size and background transfer, not in ownership of the data.

## What each side is

| Side | Role |
| --- | --- |
| Recorder card | Capture source. Holds on-card recordings and the file list |
| Phone | Cache. Holds audio not yet accepted by the PC, list metadata, and optionally a first-pass cloud transcript |
| PC | Archive. Holds the full audio, corpus text, transcript, and searchable detail (authoritative copy) |

```text
recorder card --BLE protocol--> phone cache --app sync--> PC archive
      |                                                  ^
      +-------- BLE protocol (web tester / CLI) ---------+
```

The two links are independent:

- **Card ↔ phone and card ↔ PC** use the public BLE protocol. The PC can import directly today through the CLI or the Web Bluetooth tester.
- **Phone ↔ PC** uses the application's own sync session. Those messages are not recorder-card frames. Audio, corpus, title, and customer all travel on this link.

The phone may be connected only to the card, or only to the PC.

## What each side stores

| Data | Recorder card | Phone | PC |
| --- | --- | --- | --- |
| Audio file | Original on-card recording | Source file waiting to upload, or cache not yet cleared | Complete audio, authoritative copy |
| List | Filename, time, size | Title, time, customer, audio sync, corpus sync | Searchable full entry |
| Corpus / transcript | Not stored | May transcribe first and cache; need not stay resident after the PC acknowledges it | Authoritative copy; skip cloud ASR only when skip rules below hold |
| Customer, title, sync status | Not stored | List metadata | Stored with the audio and corpus |

Match a recording by the card filename **stem**, and by an **audio content fingerprint** so the same name cannot bind different files. A title edited by the user exists only on the phone and the PC. Do not look up the card with that title.

## Who transcribes

Transcription is **not** a BLE protocol feature. Either the phone or the PC may call cloud ASR (or another engine).

| Scenario | Behavior |
| --- | --- |
| Phone transcribes first | Phone builds corpus → app sync writes the PC → PC skips ASR when skip rules hold |
| PC transcribes first | PC writes the authoritative corpus → phone pulls a preview on demand; phone need not re-run ASR |
| Neither has corpus yet | Take a short transcription lease; the winner runs ASR once; the other side only syncs the result |
| Explicit re-run | User-triggered only (for example CLI `--force`) |

Corpus metadata should keep at least: `provider`, `transcribed_on` (`phone` / `pc`), and `audio_sha256` (or an agreed equivalent fingerprint). Skip rules, conflicts, and deletes are in the next section.

## Sync invariants

Implement phone ↔ PC sync against these invariants. The PC CLI (`qs668-transcribe.py`) already skips per rule 3: non-empty body and matching `audio_sha256`; missing fields or fingerprint mismatch re-runs ASR. Phone sync should use the same conditions.

### 1. Acknowledge audio and corpus separately

- Track `audio_sync` and `corpus_sync` (for example `none` / `pending` / `ok` / `failed`).
- **Audio synced** is not **corpus synced**. The list and detail UI must show both.
- A recording is fully archived on the PC when audio is `ok` and either corpus is `ok` or the user explicitly chose audio-only for now.

### 2. Bind corpus to an audio fingerprint

- Use the card filename **stem** as the human key; use an audio **content fingerprint** (SHA-256 preferred; at least size plus a reliable checksum) to prevent name collisions.
- Corpus must carry `audio_sha256` (or equivalent): “this text belongs to that audio”.
- If the PC local audio fingerprint disagrees with the corpus claim for the same stem: treat the corpus as **stale**, do not skip ASR by default, and ask the user to re-transcribe or keep the old text.

### 3. When ASR may be skipped

Skip by default only when all of these hold (either side):

1. The destination already has a corpus file for the stem;
2. The corpus body is non-empty (not only YAML / title);
3. The corpus `audio_sha256` matches the current audio fingerprint (corpus may arrive before audio and sit as “pending audio check”; if the audio later mismatches, mark the corpus stale).

Otherwise warn or allow transcription; never treat empty or broken corpus as authoritative. `--force` or an equivalent “user confirmed re-run” may override.

### 4. Transcription lease (cut double billing)

- Before either side starts cloud ASR, write a short **transcription lease** into the sync session (or a mutually visible job table): stem, fingerprint, owner, expiry.
- The other side waits for the synced result instead of starting a second ASR job.
- After expiry or failure, either side may claim again. Leases cannot remove every offline race, but they cover the common both-online window.

### 5. Conflicts: do not overwrite by default

- If the PC already has a **non-empty** authoritative corpus, phone sync must **not** overwrite it by default.
- Overwrite requires user confirmation (or CLI `--force`).
- Do not use “later wall-clock wins” as the only rule for background sync (clocks are unreliable).

### 6. Dual path (phone sync vs PC direct from card)

- Phone app sync and PC BLE / CLI import may run at the same time.
- Merge by **fingerprint**: one audio blob per fingerprint; corpus still follows rules 3 and 5.
- If the PC already imported audio from the card and the phone later pushes corpus for the same fingerprint: store corpus only, do not duplicate audio.
- If stems match but fingerprints differ: conflict — keep both or ask the user; never silently overwrite.

### 7. When local cache may be deleted

| Delete | Allowed only when |
| --- | --- |
| Phone source audio | PC confirmed complete audio (`audio_sync=ok`) |
| Phone corpus cache | PC confirmed non-empty corpus on disk (`corpus_sync=ok`), or the user opted out of corpus |
| On-card recording | Never part of default sync; requires a separate explicit action |

If either acknowledgement fails, keep the phone copy and show failed / retry. Do not present it as deleted.

### 8. Format and channel

- Corpus synced from the phone should land at `archive/corpus/<stem>.md` with front matter aligned to the PC CLI (at least `title`, `audio`, `provider`, `audio_sha256`, `transcribed_on`, `sync_status`).
- Auth and transport security for the sync channel are the application's responsibility, outside the recorder-card protocol. Do not put ASR secrets in sync payloads.

## PC archive directories

The PC's authoritative copies live in `archive/` inside this repository. Audio and corpus stay in separate directories and share the card filename's stem.

| Data | Directory | Example |
| --- | --- | --- |
| PC audio | `archive/audio/` | `archive/audio/note20260710-162938.wav` |
| PC corpus | `archive/corpus/` | `archive/corpus/note20260710-162938.md` |

These directories stay on the local machine. Recordings and corpus text are not committed. Each `.gitkeep` exists so the empty directory remains. Chat bring-up writes imports with `tools/qs668-bringup.py` straight into `archive/audio/`. Cloud transcription uses `tools/qs668-transcribe.py` with `.env.example` at the repo root and writes `archive/corpus/`. Corpus synced from the phone should use the same path and stem so it lines up with the skip-ASR rules.

## Where one recording lives

| Stage | Card file | Phone audio | audio_sync | Phone corpus | corpus_sync | PC audio | PC corpus |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Card only | Present | Absent | none | Absent | none | Absent | Absent |
| Waiting for PC | Present | Present | pending | Optional | none / pending | Absent | Absent |
| Phone transcribed, corpus pending sync | Present | Present or absent | any | Present | pending | Absent or present | Absent |
| Audio synced, corpus incomplete | Present | Present or absent | ok | Optional | none / pending / failed | Complete | Absent or incomplete |
| Syncing / failed | Present | Present | pending / failed | Optional | pending / failed | Incomplete | Absent or incomplete |
| Both synced, cache remains | Present | Present | ok | Optional | ok or user skipped corpus | Complete | Complete when present |
| Synced, phone source deleted | Present | Absent | ok | Need not stay resident | ok or user skipped | Complete | Complete when present |
| PC imported from the card | Present | Absent | n/a | Absent | n/a | Complete | Complete when present |

A realtime stream is not in this table until it is saved as a file on the card or the phone. After that, mark it waiting for the PC.

## Phone list states

Keep the primary states on the audio lifecycle. Track corpus with a **`corpus_sync` flag** so detail can show “audio OK, corpus not yet”.

| State | On the phone | Opened detail |
| --- | --- | --- |
| Waiting for PC | Source file; corpus optional | Local preview; show local transcript if any, and that the PC does not have it yet |
| Synced, cache remains | Source file; `audio_sync=ok`; corpus per `corpus_sync` | Play cache; if `corpus_sync≠ok`, show corpus pending or failed explicitly |
| Synced, metadata only | No source file; metadata + both sync flags | If neither side has corpus, ask to connect a computer; if the PC has corpus, pull on demand |
| Syncing / failed | Source file still present | Show audio / corpus progress or retry separately; never treat a finished phone transcript as discarded |

## Boundaries while building

- Build frames, import files, and control recording from the protocol docs.
- Customer, title, sync status, and corpus text belong to the phone and PC application data. Do not write them back to the recorder card.
- The phone may transcribe first; the PC skips ASR only when the skip rules hold.
- Default sync does not overwrite a non-empty PC corpus and never deletes on-card files.
- The mini program and the app share this lifecycle. Do not invent a second one.
