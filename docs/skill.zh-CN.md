# QS668 AI录音卡接入技能

[English](./skill.md)

这份文档说明 Codex 和 Cursor 使用的接入技能放在哪里、覆盖什么。协议字节以 [中文协议](./protocol.zh-CN.md) 和 [Protocol](./protocol.md) 为准。技能操作步骤只写在 [SKILL.md](../.agents/skills/qs668-bringup/SKILL.md)。

## 文件

| 文件 | 读者 |
| --- | --- |
| `.agents/skills/qs668-bringup/SKILL.md` | Cursor、Codex |
| `tools/qs668-bringup.py` | 对话里调用的 CLI 主机 |
| `tools/qs668_protocol.py` | CLI 使用的帧辅助 |
| `docs/skill.zh-CN.md` | 维护者（中文） |
| `docs/skill.md` | 维护者（英文） |

在本仓库中打开工程时，Cursor 和 Codex 会扫描 `.agents/skills/` 并加载 `qs668-bringup`。不要再复制一份到 `.cursor/skills/` 或 `.codex/skills/`。

## 在自己的 App 工程里使用

把目录 `.agents/skills/qs668-bringup/` 复制到目标工程的同名路径：

```text
your-app/.agents/skills/qs668-bringup/SKILL.md
```

目标工程需要能读到协议文档、JavaScript SDK，以及 `tools/qs668-bringup.py` 所用的协议辅助；或把这些材料一并放进该工程。

## 主路径：CLI

技能以 CLI 为准，音频直接写入 `archive/audio/`：

```bash
python -m pip install -r tools/requirements.txt
python tools/qs668-init-env.py
python tools/qs668-bringup.py --scan
python tools/qs668-bringup.py --address <ADDR> --import-first --out archive/audio
```

`qs668-init-env.py` 在缺少 `.env` 时从 `.env.example` 生成；已有 `.env` 不会覆盖。转写前再请用户填入豆包密钥。

导入后可直接转写：`--import-first --transcribe`。转写失败不回滚已导入音频。也可加 `--title`、`--customer` 写入 corpus 头信息。仅当语料正文非空且 `audio_sha256` 与音频一致时才跳过；与 `--transcribe` 一起加 `--force` 可强制重跑。

批量：`--import-all --transcribe`，或可重复 / 逗号分隔的 `--filename`。`--import-first`、`--import-all`、`--filename` 三者只用其一。

录音控制：`--record-state`、`--record start|pause|resume|save`。实时音频：`--realtime 5`。导入和实时不要同时跑。

第一次连接仍可能需要人开卡并允许系统蓝牙。成功后地址缓存在 `.qs668-device`。网页测试平台只作人工核对；浏览器下载目录不是 Done 路径。

## 技能覆盖的路径

1. 读状态：电量、容量、固件版本。
2. 控制录音，并在设备提供 AE23 时接收机身按键事件。
3. 读取文件列表，或接收实时音频。两条传输不要同时进行。

完成标准在 `SKILL.md` 的 Done 一节：CLI 读到电量、列出文件、整帧导入一个文件到 `archive/audio/`，`archive/corpus/` 留空，并且不删除卡内文件。

分段导入和授权码不属于这条技能的必达范围。实时音频只有在用户明确要求时才跑，原始 OPUS 用 `tools/qs668-raw-opus-to-ogg.py` 包成 Ogg。

导入完成后若要转写，默认用[豆包语音 / 录音文件识别大模型](https://docs.volcengine.com/docs/DoubaoVoice/ProductOverview-6?lang=zh)。先跑 `python tools/qs668-init-env.py`，再在 `.env` 填入 `QS668_ASR_DOUBAO_APP_ID` 与 `QS668_ASR_DOUBAO_ACCESS_KEY`。默认语言 `zh`；有句级时间戳时写入 `[mm:ss] 文本`：

```bash
python -m pip install -r tools/requirements.txt
python tools/qs668-transcribe.py archive/audio/note20261011-161858.wav
python tools/qs668-transcribe.py archive/audio/note20261011-161858.wav --force
```

结果写入 `archive/corpus/<stem>.md`，含 `audio_sha256`、`transcribed_on`。仅正文非空且指纹一致时跳过 ASR，否则重跑（或 `--force`）。默认开启说话人分离，时间线默认用真实时钟：从文件名 `noteYYYYMMDD-HHMMSS` 推算，正文形如 `[16:19:00] 说话人1：……`（跨天为 `MM-DD HH:MM:SS`）。可用 `--timeline relative` 改回相对时间。单人短录音也可能只有说话人1。特长音频仍可切片合并。若要改用 OpenAI 兼容接口，设 `QS668_ASR_PROVIDER=openai`。`.env` 不提交。

手机、电脑和录音卡之间的数据各放哪里，见 [数据关系](./data-relationship.zh-CN.md)。

## 维护

- 修改技能行为时，同时更新 `SKILL.md`、`docs/skill.md` 和 `docs/skill.zh-CN.md`。
- 修改命令或帧格式时，改协议文档，不在技能文档里另写一份命令表。
- Python 辅助改动后运行 `python tools/test_qs668_protocol.py`。
- JavaScript SDK 改动后在仓库根目录运行 `npm test`。
