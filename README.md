# AI录音卡开放协议

中文 | [English](./README.en.md)

面向 **AI录音卡、录音卡、蓝牙录音卡、智能录音卡、AI recording card、AI recorder card、Bluetooth recorder card、voice recorder card** 的开放协议、Web Bluetooth 测试平台和 SDK 示例。

项目主页和在线测试平台：<https://nextproto.top/qs668/>

海外客户购买链接：[Open Protocol AI Smart Recorder Card on Tindie](https://www.tindie.com/products/adz1122/open-protocol-ai-smart-recorder-card/)

## 项目定位

这个项目主打 **开放底层蓝牙协议**，不只是开放 SDK。

很多硬件项目只给应用层 SDK，开发者必须依赖厂商封装。本项目会把 QS668 AI录音卡的 BLE 服务、特征值、帧格式、命令类型、CRC、文件传输和实时音频流程整理成公开文档。SDK 只是协议之上的薄封装，开发者可以直接用协议接入浏览器、App、桌面软件、网关或行业系统。

## 为什么要开放底层协议

- 开发者可以直接理解设备如何通信，而不是被 SDK 黑盒限制。
- 软件公司可以把录音卡接入自己的 App、SaaS、桌面软件或行业系统。
- 协议文档、SDK、网页测试工具可以互相校验，降低联调成本。
- 硬件能力可以被更多开发者重新组合，做出会议记录、执法记录、工牌、采访、课堂、语音笔记、AI Agent 输入设备等新产品。

## 适合谁

- 想做 AI录音卡 App 的开发者
- 想把录音卡接入自己系统的软件公司
- 想研究 BLE 录音硬件协议的人
- 需要实时音频、文件导入、语音转写、录音控制的行业项目
- 搜索 “录音卡”、“AI录音卡”、“AI recording card”、“AI recorder card”、“recording card SDK” 的开发者
- 需要购买开放协议 AI录音卡样机进行海外开发测试的客户

## 已开放内容

- QS668 Web Bluetooth 测试平台源码
- BLE UUID、写入特征、通知特征说明
- 底层协议帧格式
- CRC-16/XMODEM 校验
- 控制命令、实时音频命令、文件命令、录音命令
- JavaScript 协议 SDK 雏形
- 最小 Web Bluetooth 示例
- 中英双语 README 和协议文档

## 目录结构

```text
.
├── README.md
├── README.en.md
├── README.zh-CN.md
├── docs/
│   ├── protocol.md
│   └── protocol.zh-CN.md
├── examples/
│   └── web-bluetooth/
├── sdk/
│   └── javascript/
└── website/
    ├── index.html
    ├── styles.css
    └── app.js
```

## 本地运行网页测试平台

Web Bluetooth 需要 Chrome 或 Edge，并且页面必须运行在 HTTPS 或 localhost。

```bash
cd website
python3 -m http.server 8080
```

然后打开：

```text
http://localhost:8080
```

线上版本保留在：

```text
https://nextproto.top/qs668/
```

## 协议快速说明

BLE UUID：

| 用途 | UUID |
| --- | --- |
| 服务 | `0000ae20-0000-1000-8000-00805f9b34fb` |
| 写入 | `0000ae21-0000-1000-8000-00805f9b34fb` |
| 通知 | `0000ae22-0000-1000-8000-00805f9b34fb` |
| 按键/机身事件通知 | `0000ae23-0000-1000-8000-00805f9b34fb` |

协议帧：

```text
5A SEQ CRC_LO CRC_HI LEN_LO LEN_HI TYPE CMD PARAMS...
```

CRC 使用 CRC-16/XMODEM，计算范围是 `LEN_LO LEN_HI TYPE CMD PARAMS...`。

更多内容：

- [中文协议文档](./docs/protocol.zh-CN.md)
- [Protocol documentation](./docs/protocol.md)
- [JavaScript SDK](./sdk/javascript/)
- [Web Bluetooth 示例](./examples/web-bluetooth/)

## 授权

MIT License，见 [LICENSE](./LICENSE)。
