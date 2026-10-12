# QS668 Roadmap

[中文](./roadmap.zh-CN.md)

Priorities for the QS668 AI recorder card / AI recording card open-protocol repository. Byte layouts stay in the [protocol](./protocol.md). Bring-up steps stay in the [skill](./skill.md). Where the phone, PC, and card keep data is in [Data relationship](./data-relationship.md).

## Principles

- The protocol is the source of truth: change the protocol docs before SDKs, CLI, or the web tester.
- Keep SDKs thin. The CLI and skill are the PC Done path.
- Keep Chinese and English docs aligned. Never commit `.env` or secrets.
- Prefer “one more recording into `archive/` with zero friction” over a second client.
- Do not invent fields absent from the protocol. Segment import and authorization codes remain optional.

## Done (foundation)

| Item | Acceptance |
| --- | --- |
| Public BLE protocol and web tester | Docs match `website/`; public site stays at `https://nextproto.top/qs668/` |
| Thin JavaScript SDK | `npm test` passes |
| Codex / Cursor bring-up skill + bleak CLI | Real-device import of WAV into `archive/audio/`; no on-card delete |
| PC archive + data-relationship docs | `archive/{audio,corpus}/` and `docs/data-relationship*.md` |
| Doubao cloud ASR | `--transcribe` / `qs668-transcribe.py`; speakers, wall-clock timeline, lean corpus |
| Batch + idempotent ASR | `--import-all` / multi `--filename`; skip existing corpus unless `--force` |
| Corpus `audio_sha256` | CLI writes fingerprint + `transcribed_on`; skip ASR only with non-empty body and matching hash |

## Now (near term: still PC archive)

| Item | Why | Acceptance |
| --- | --- | --- |
| Speaker naming | Show “Customer / Sales” instead of “Speaker 1” | Optional `speakers` map in corpus; CLI arg or post-edit of the md |
| Archive manifest | See what is imported / transcribed at a glance | Lightweight index under `archive/` (stem, duration, corpus present, `sync_status`) |
| Import idempotency | Avoid re-pulling BLE for the same file | Skip when local audio with the same stem exists; `--force` overwrites |
| Error / troubleshooting table | Fewer guessed BLE / Doubao failures | Docs list common codes and fixes; skill links to that table |

## Next (when a second client appears)

| Item | Why | Acceptance |
| --- | --- | --- |
| Phone-cache state machine | Implementable card → phone → PC sync | Implement sync invariants in [Data relationship](./data-relationship.md): separate acks, fingerprint bind, transcription lease, no silent overwrite; docs first, then a minimal implementation |
| Thin Android SDK | Apps wrap frames only | List / import / status readable; no full App UI |
| Web tester aligned with CLI | One Done path | Browser docs: copy downloads into `archive/audio/`, or match CLI equivalently |

## Later (productization; do not block the open core)

| Item | Notes |
| --- | --- |
| Hotwords / domain terms | Wait for a stable multi-speaker meeting workflow |
| Meeting-summary templates | Post-process corpus; not a protocol layer |
| Multi-card address book | Beyond a single `.qs668-device` cache |
| Emotion and other ASR add-ons | Explicitly deferred; avoid early vendor lock-in |
| Firmware UX | Longer list names, steadier import — via protocol-change PRs |

## Explicitly out of scope (for now)

- Treating the web tester as the only Done path (CLI is).
- A second command table inside the skill or SDK that overrides the protocol docs.
- Committing `.env`, sample secrets, or personal recordings (unless separately licensed for release).
- Enabling on-card delete commands (`2-8` / `2-9`) by default.

## Maintenance

When an item ships, move it into Done and update [roadmap.zh-CN.md](./roadmap.zh-CN.md) together. Protocol byte changes still go through `protocol.md` / `protocol.zh-CN.md`; do not duplicate frame tables here.
