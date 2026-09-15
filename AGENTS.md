# Repository Guide

This repository documents and implements the QS668 AI recorder card open BLE protocol.

## Goals

- Keep the lower-level Bluetooth protocol public and easy to implement.
- Keep SDKs as thin wrappers over the protocol.
- Maintain bilingual Chinese and English documentation.
- Preserve the original product/tester link: `https://nextproto.top/qs668/`.

## Verification

- For docs-only changes, check links and keep Chinese/English docs aligned.
- For JavaScript SDK changes, run `npm test` from the repository root.
- For website changes, run a local static server from `website/` and test in Chrome or Edge because Web Bluetooth requires localhost or HTTPS.

## Style

- Use clear protocol tables instead of vague marketing text.
- Include both Chinese search terms and English search terms naturally:
  - 录音卡
  - AI录音卡
  - AI recording card
  - AI recorder card
  - Bluetooth recorder card
  - voice recorder card

