# QS668 路线图

[English](./roadmap.md)

本页描述 AI录音卡 / AI recorder card 开放协议仓库的优先事项。帧格式以 [中文协议](./protocol.zh-CN.md) 为准。接入步骤见 [接入技能](./skill.zh-CN.md)。三端数据归属见 [数据关系](./data-relationship.zh-CN.md)。

## 原则

- 协议是准绳：字节变更先改协议文档，再改 SDK / CLI / 网页。
- SDK 保持薄封装；CLI 与 skill 是电脑端 Done 路径。
- 中英文文档同步维护；`.env` 与密钥永不提交。
- 优先「多一条录音零摩擦进 `archive/`」，再扩展第二个客户端。
- 未写进协议的字段不要发明；分段导入与授权码仍属可选范围。

## 已完成（底座）

| 项 | 验收 |
| --- | --- |
| 公开 BLE 协议与网页测试平台 | 文档与 `website/` 可对照；线上保留 `https://nextproto.top/qs668/` |
| JavaScript 薄 SDK | `npm test` 通过 |
| Codex / Cursor bring-up skill + bleak CLI | 真机导入 WAV 到 `archive/audio/`，不删卡内文件 |
| 电脑档案与数据关系文档 | `archive/{audio,corpus}/` + `docs/data-relationship*.md` |
| 豆包云转写 | `--transcribe` / `qs668-transcribe.py`；说话人、墙钟时间线、精简 corpus |
| 批量与幂等 | `--import-all` / 多 `--filename`；已有 corpus 默认跳过，`--force` 重跑 |
| corpus `audio_sha256` | CLI 写入指纹与 `transcribed_on`；跳过 ASR 需非空正文 + 指纹一致 |

## Now（近程：仍围着 PC 档案）

| 项 | 用户价值 | 验收 |
| --- | --- | --- |
| 说话人命名 | 正文显示「客户 / 销售」而不是「说话人1」 | corpus 支持可选 `speakers` 映射；CLI 可传入或事后改 md |
| 档案索引 | 一眼看出哪些已导入、已转写 | `archive/` 下轻量 manifest（stem、时长、corpus 是否存在、`sync_status`） |
| 导入幂等 | 重复导入不白白重拉 BLE | 本地已有同 stem 音频时默认跳过，`--force` 才覆盖 |
| 错误码与排障表 | 少猜 BLE / 豆包失败原因 | docs 中列出常见错误与处理；skill 指向该表 |

## Next（中程：第二端出现后再做）

| 项 | 用户价值 | 验收 |
| --- | --- | --- |
| 手机缓存状态机 | 卡 → 手机 → PC 同步语义可实现 | 落实 [数据关系](./data-relationship.zh-CN.md) 的同步不变量：分项确认、指纹绑定、转写租约、默认不覆盖；先文档后最小实现 |
| Android 薄 SDK | App 只包协议帧 | 列表 / 导入 / 状态可读；不做完整 App UI |
| 网页 Tester 对齐 CLI | 一条 Done 路径 | 浏览器侧说明：下载需拷入 `archive/audio/`，或以等价流程对齐 CLI |

## Later（远程：产品化，不抢开源主线）

| 项 | 说明 |
| --- | --- |
| 热词 / 领域词 | 等有稳定多人会议场景再接 ASR 能力 |
| 会议摘要模板 | 基于 corpus 的二次生成，不进协议层 |
| 多卡地址簿 | 多台录音卡地址与备注，超出单卡 `.qs668-device` |
| 情绪等增值 ASR | 明确后置，避免过早绑定供应商特性 |
| 固件侧体验 | 列表名不截断、导入更稳等——以协议变更 PR 形式推进 |

## 明确不做（当前）

- 把网页测试平台当成唯一 Done 路径（CLI 才是）。
- 在 skill 或 SDK 里另写一套命令表，架空协议文档。
- 提交 `.env`、样例密钥或个人录音语料（除非另有授权发布约定）。
- 默认开启卡内删除命令（`2-8` / `2-9`）。

## 维护

路线图条目完成后，把行移入「已完成」，并同步更新英文 [roadmap.md](./roadmap.md)。协议变更仍走 `protocol.md` / `protocol.zh-CN.md`，不在本页复制帧表。
