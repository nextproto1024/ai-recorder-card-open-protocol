(() => {
  "use strict";

  const UUIDS = {
    service: "0000ae20-0000-1000-8000-00805f9b34fb",
    write: "0000ae21-0000-1000-8000-00805f9b34fb",
    notify: "0000ae22-0000-1000-8000-00805f9b34fb",
    keyNotify: "0000ae23-0000-1000-8000-00805f9b34fb",
  };

  const LOCALE_KEY = "qs668Locale";
  const THEME_KEY = "qs668Theme";
  const ASR_SEGMENT_MS = 800;
  const ASR_MIN_SEGMENT_BYTES = 600;
  const ASR_MAX_SEGMENT_BYTES = 3200;
  const DOWNLOAD_STATUS_INTERVAL_MS = 300;
  const DOWNLOAD_TIMEOUT_ARM_INTERVAL_MS = 1000;
  const LOG_RENDER_INTERVAL_MS = 160;

  const I18N = {
    zh: {
      appTitle: "AI录音卡测试平台",
      themeDay: "白天",
      themeNight: "夜间",
      dictationLink: "API协议资料获取",
      apiMaterialsLink: "API协议资料获取",
      manualLink: "参数说明",
      adminLink: "管理员入口",
      secureChecking: "检测环境",
      bleDisconnected: "未连接",
      connect: "连接设备",
      connecting: "连接中...",
      compatScan: "兼容扫描",
      disconnect: "断开",
      deviceStatus: "设备状态",
      deviceStatusDesc: "AE20 服务，AE21 写入，AE22/AE23 通知。",
      safeSmoke: "读取项巡检",
      supportTitle: "购买与技术支持",
      supportDesc: "扫码购买团购产品，或添加微信技术支持咨询联调、转写和资料问题。",
      supportWechat: "微信",
      supportNote: "添加时请备注设备型号 QS668 和问题现象，方便快速排查。",
      purchaseQrTitle: "微信扫码购买",
      purchaseQrDesc: "团购二维码",
      techQrTitle: "微信技术支持",
      techQrDesc: "扫码咨询资料 / 电话：17512020988",
      battery: "电量",
      capacity: "容量",
      firmware: "固件",
      recordState: "录音状态",
      recordDuration: "录音时长",
      gain: "增益",
      syncTime: "同步时间",
      getCapacity: "获取容量",
      getBattery: "获取电量",
      firmwareVersion: "固件版本",
      authCode: "授权码",
      filesTitle: "文件列表与导入",
      filesDesc: "文件列表整数按 BE 解析；下载请求 2-2 始终整帧单写。",
      readList: "读取列表",
      abortImport: "终止导入",
      fileName: "文件名",
      importFile: "导入文件",
      segmentImport: "分段导入",
      notStarted: "未开始",
      durationTime: "时长/时间",
      size: "大小",
      actions: "操作",
      readFilesAfterConnect: "连接后读取文件列表",
      deleteAll: "删除全部文件",
      allowDelete: "允许发送删除命令",
      realtimeTitle: "实时音频 / 转写",
      realtimeDesc: "直接接收设备推送的 OPUS 系码流，可分段提交后端 ASR 转成文字。",
      rtStart: "开始实时",
      pause: "暂停",
      resume: "继续",
      rtStop: "结束实时",
      rtFile: "实时文件",
      receivedBytes: "接收字节",
      saveRealtime: "保存实时音频原始数据",
      rtTranscribeToggle: "设备 OPUS 转写",
      asrLanguage: "识别语言",
      transcribeStatus: "转写状态",
      asrIdle: "待机",
      asrCollecting: "正在接收 OPUS：{bytes}",
      asrUploading: "提交 ASR 片段 {index}：{bytes}",
      asrText: "转写返回：{text}",
      asrNoText: "ASR 暂无文字",
      asrNotConfigured: "后端 ASR 未配置：{message}",
      asrError: "转写失败：{message}",
      clearTranscript: "清空转写",
      transcriptPlaceholder: "实时转写文字会显示在这里",
      recordTitle: "录音控制与增益",
      recordDesc: "TYPE=3 命令，可同时接收 AE23 机身事件。",
      recStart: "开始录音",
      recSave: "保存录音",
      recPause: "暂停录音",
      recResume: "继续录音",
      recordTime: "录音时间",
      currentFile: "当前文件名",
      readGain: "读取增益",
      setGain: "设置增益",
      gainLow: "低",
      gainMid: "中",
      gainHigh: "高",
      send: "发送",
      rawTitle: "原始命令",
      rawDesc: "用于补充验证厂商新增命令或抓包复现。",
      sendProtocolFrame: "按协议封包发送",
      fullFrameHex: "完整帧 HEX",
      sendRawFrame: "直接发送完整帧",
      selfTestTitle: "协议自检",
      selfTestDesc: "本地校验 CRC、示例帧和解析器，不需要连接设备。",
      runSelfTest: "运行自检",
      waiting: "等待运行",
      logTitle: "通信日志",
      logDesc: "TX/RX 原始帧、解析结果、CRC 错误和超时。",
      clear: "清空",
      exportLog: "导出日志",
      secureReady: "环境可用",
      secureNeeded: "需 Chrome/HTTPS",
      connectedDevice: "已连接 {name}",
      charged: "充电中",
      recordStateRecording: "录音中",
      recordStateIdle: "未录音",
      recordStatePaused: "暂停",
      realtimeContinue: "继续",
      realtimePause: "暂停",
      realtimeStop: "停止",
      unknown: "未知({value})",
      deleteOk: "成功",
      failSimple: "失败",
      deleteFail: "失败 code={code}",
      importDone: "完成",
      importMissing: "文件不存在",
      importOffsetTooLarge: "offset 过大",
      importOtherStop: "其他停止",
      saveFile: "保存 {filename}",
      fileListEmpty: "暂无文件列表数据",
      rawName: "原名",
      deleteOne: "删除",
      pageLoaded: "页面已加载。Web Bluetooth 需要 Chrome/Edge 与 localhost 或 HTTPS 环境。",
      noFrameHeader: "{source} 丢弃无帧头数据 {raw}",
      noiseBeforeHeader: "{source} 丢弃帧头前噪声 {raw}",
      invalidLength: "{source} LEN 异常 {len}，跳过当前帧头",
      crcError: "{source} CRC 错误 seq={seq} expect=0x{expected} actual=0x{actual} raw={raw}",
      notifyReady: "{name} Notify 已订阅。",
      notifyUnavailable: "{name} Notify 未启用：{error}",
      bluetoothUnsupported: "当前浏览器不支持 Web Bluetooth，请使用 Chrome/Edge。",
      scanCompat: "开始兼容扫描，手动选择 QS668 后再发现 AE20 服务。",
      scanNormal: "开始扫描广播包含 AE20 服务的设备。",
      bleConnectTimeout: "蓝牙连接超时",
      deviceConnected: "设备连接成功，所有设备均可测试。",
      autoCheckIncomplete: "自动巡检未完成：{error}",
      connectFailed: "连接失败：{error}",
      deviceDisconnected: "设备已断开。",
      smokeBattery: "电量",
      smokeCapacity: "容量",
      smokeFirmware: "固件",
      smokeAuth: "授权码",
      smokeRecordState: "录音状态",
      smokeRecordTime: "录音时间",
      smokeCurrentFile: "当前文件名",
      smokeGain: "增益",
      smokeFileList: "文件列表",
      smokeStep: "巡检：{label}",
      enterFilename: "请先输入文件名。",
      requestImport: "请求导入 {name}，offset={offset}",
      tryNextImport: "{reason}，尝试 {name}",
      importRequestTx: "2-2 导入请求整帧单写 {bytes}B filename={filename} raw={raw}",
      requestSegment: "请求分段导入 {name} {start}-{end}",
      deleteBlocked: "删除命令已拦截：请先勾选“允许发送删除命令”。",
      confirmDeleteOne: "确认删除设备文件：{name} ?",
      deleteAllBlocked: "删除全部命令已拦截：请先勾选“允许发送删除命令”。",
      confirmDeleteAll: "确认删除设备内全部文件？此操作不可撤销。",
      rawCommandError: "原始命令错误：{error}",
      emptyFrame: "完整帧不能为空",
      rawFrameError: "完整帧错误：{error}",
      notConnected: "尚未连接设备。",
      writeNotReady: "写入特征未就绪",
      unknownType: "未知 TYPE={type} CMD={cmd} body={body}",
      capacityLog: "容量 remain={remain}KB total={total}KB",
      batteryLog: "电量 {value}",
      firmwareLog: "固件版本 {version}",
      authLog: "授权码 ASCII=\"{ascii}\" HEX={hex}",
      controlResponse: "控制应答 CMD={cmd} body={body}",
      realtimeFileName: "实时音频文件名 {name}",
      realtimeStatus: "实时状态 {text}",
      realtimeResponse: "实时应答 CMD={cmd} body={body}",
      importStarted: "开始导入 {name}",
      orphanFileData: "收到文件数据但没有下载会话，{bytes}B 已忽略。",
      receiving: "接收中 {bytes}",
      receivingSpeed: "接收中 {bytes} · {speed}/s",
      importDataSummary: "文件数据 {packets} 包，共 {bytes}，平均 {speed}/s",
      deleteAllResponse: "删除全部应答 {result}",
      abortResponse: "终止导入应答。",
      importAborted: "已终止导入",
      deleteOneResponse: "删除单个应答 {result}",
      listFinished: "文件列表发送完毕，共 {count} 条。",
      fileResponse: "文件应答 CMD={cmd} body={body}",
      recordStart: "开始录音",
      recordSave: "保存录音",
      recordPause: "暂停录音",
      recordResume: "继续录音",
      setGainAction: "设置增益",
      commandResult: "{source} {action}结果 {result} code={code}",
      recordStateLog: "录音状态 {state}",
      recordTimeLog: "录音时间 {duration}s currentSize={size}",
      currentFileLog: "当前文件名 {name}",
      gainLog: "增益 {gain}",
      hardwareEvent: "{source} 机身事件 CMD={cmd} {event}",
      recordResponse: "录音应答 CMD={cmd} body={body}",
      listFrameTooShort: "文件列表帧太短：{raw}",
      fileListFrame: "收到文件列表帧 count={count} parsed={parsed} total={total}",
      importEndNoSession: "导入结束 {text}",
      wavSuffix: "，WAV {sampleRate}Hz {bits}bit {channels}ch",
      importCompleted: "导入完成 {name} {bytes}{suffix}",
      importDoneStatus: "完成 {bytes}{suffix}",
      importEndReceived: "导入结束 {text}，已接收 {bytes}",
      importStatusReceived: "{text}，已接收 {bytes}",
      idleListFinish: "列表空闲收尾，共 {count} 条。",
      importIdleTimeout: "导入空闲超时",
      importTimeout: "导入超时，已接收 {bytes}。",
      timeoutReceived: "超时，已接收 {bytes}",
      crcVector: "CRC-16/XMODEM 标准向量",
      downloadExampleFrame: "2-2 成功下载示例帧",
      parserReassembly: "流式解析半帧重组",
      fileListBeParse: "文件列表 BE 解析",
      selfTestDone: "协议自检完成：{passed}/{total} 通过。",
      hexEvenLength: "HEX 长度必须为偶数",
      },
    en: {
      appTitle: "AI Recording Card Test Platform",
      themeDay: "Day",
      themeNight: "Night",
      dictationLink: "API Materials",
      apiMaterialsLink: "API Materials",
      manualLink: "Specs",
      adminLink: "Admin",
      secureChecking: "Checking",
      bleDisconnected: "Disconnected",
      connect: "Connect",
      connecting: "Connecting...",
      compatScan: "Compatibility Scan",
      disconnect: "Disconnect",
      deviceStatus: "Device Status",
      deviceStatusDesc: "AE20 service, AE21 write, AE22/AE23 notifications.",
      safeSmoke: "Read Check",
      supportTitle: "Purchase & Support",
      supportDesc: "Scan to purchase via group buy, or add WeChat support for integration, transcription, and material questions.",
      supportWechat: "WeChat",
      supportNote: "Please include the QS668 model and issue details when adding support.",
      purchaseQrTitle: "WeChat Purchase",
      purchaseQrDesc: "Group Buy QR",
      techQrTitle: "WeChat Support",
      techQrDesc: "Scan for help / Tel: 17512020988",
      battery: "Battery",
      capacity: "Capacity",
      firmware: "Firmware",
      recordState: "Record State",
      recordDuration: "Record Duration",
      gain: "Gain",
      syncTime: "Sync Time",
      getCapacity: "Get Capacity",
      getBattery: "Get Battery",
      firmwareVersion: "Firmware",
      authCode: "Auth Code",
      filesTitle: "File List and Import",
      filesDesc: "File-list integers are parsed as BE; download request 2-2 is always written as one full frame.",
      readList: "Read List",
      abortImport: "Abort Import",
      fileName: "File Name",
      importFile: "Import File",
      segmentImport: "Segment Import",
      notStarted: "Not started",
      durationTime: "Duration / Time",
      size: "Size",
      actions: "Actions",
      readFilesAfterConnect: "Connect first, then read the file list",
      deleteAll: "Delete All Files",
      allowDelete: "Allow delete commands",
      realtimeTitle: "Realtime Audio / Transcription",
      realtimeDesc: "Receive the OPUS-family stream from the device and submit segments to backend ASR.",
      rtStart: "Start Realtime",
      pause: "Pause",
      resume: "Resume",
      rtStop: "Stop Realtime",
      rtFile: "Realtime File",
      receivedBytes: "Received Bytes",
      saveRealtime: "Save Raw Realtime Audio",
      rtTranscribeToggle: "Device OPUS Transcription",
      asrLanguage: "ASR Language",
      transcribeStatus: "Transcription Status",
      asrIdle: "Idle",
      asrCollecting: "Receiving OPUS: {bytes}",
      asrUploading: "Submitting ASR segment {index}: {bytes}",
      asrText: "ASR text: {text}",
      asrNoText: "No text yet",
      asrNotConfigured: "Backend ASR is not configured: {message}",
      asrError: "Transcription failed: {message}",
      clearTranscript: "Clear Transcript",
      transcriptPlaceholder: "Realtime transcript will appear here",
      recordTitle: "Recording Control and Gain",
      recordDesc: "TYPE=3 commands; AE23 hardware events can be received at the same time.",
      recStart: "Start Recording",
      recSave: "Save Recording",
      recPause: "Pause Recording",
      recResume: "Resume Recording",
      recordTime: "Record Time",
      currentFile: "Current File",
      readGain: "Read Gain",
      setGain: "Set Gain",
      gainLow: "Low",
      gainMid: "Medium",
      gainHigh: "High",
      send: "Send",
      rawTitle: "Raw Command",
      rawDesc: "Use this for vendor extensions, packet replay, and protocol verification.",
      sendProtocolFrame: "Send Protocol Frame",
      fullFrameHex: "Full Frame HEX",
      sendRawFrame: "Send Raw Frame",
      selfTestTitle: "Protocol Self-Test",
      selfTestDesc: "Local CRC, sample-frame, and parser checks. No device connection required.",
      runSelfTest: "Run Self-Test",
      waiting: "Waiting",
      logTitle: "Communication Log",
      logDesc: "TX/RX raw frames, parsed results, CRC errors, and timeouts.",
      clear: "Clear",
      exportLog: "Export Log",
      secureReady: "Ready",
      secureNeeded: "Chrome/HTTPS Required",
      connectedDevice: "Connected {name}",
      charged: "Charging",
      recordStateRecording: "Recording",
      recordStateIdle: "Idle",
      recordStatePaused: "Paused",
      realtimeContinue: "Continue",
      realtimePause: "Paused",
      realtimeStop: "Stopped",
      unknown: "Unknown({value})",
      deleteOk: "Success",
      failSimple: "Failed",
      deleteFail: "Failed code={code}",
      importDone: "Completed",
      importMissing: "File not found",
      importOffsetTooLarge: "Offset too large",
      importOtherStop: "Other stop",
      saveFile: "Save {filename}",
      fileListEmpty: "No file-list data",
      rawName: "Original",
      deleteOne: "Delete",
      pageLoaded: "Page loaded. Web Bluetooth requires Chrome/Edge and localhost or HTTPS.",
      noFrameHeader: "{source} dropped data without frame header {raw}",
      noiseBeforeHeader: "{source} dropped noise before frame header {raw}",
      invalidLength: "{source} invalid LEN {len}; skipping this frame header",
      crcError: "{source} CRC error seq={seq} expect=0x{expected} actual=0x{actual} raw={raw}",
      notifyReady: "{name} notifications enabled.",
      notifyUnavailable: "{name} notifications unavailable: {error}",
      bluetoothUnsupported: "This browser does not support Web Bluetooth. Use Chrome or Edge.",
      scanCompat: "Starting compatibility scan. Select QS668 manually, then discover AE20.",
      scanNormal: "Scanning for devices advertising the AE20 service.",
      bleConnectTimeout: "Bluetooth connection timed out",
      deviceConnected: "Device connected. All devices are allowed for testing.",
      autoCheckIncomplete: "Auto check did not finish: {error}",
      connectFailed: "Connection failed: {error}",
      deviceDisconnected: "Device disconnected.",
      smokeBattery: "Battery",
      smokeCapacity: "Capacity",
      smokeFirmware: "Firmware",
      smokeAuth: "Auth code",
      smokeRecordState: "Record state",
      smokeRecordTime: "Record time",
      smokeCurrentFile: "Current file",
      smokeGain: "Gain",
      smokeFileList: "File list",
      smokeStep: "Check: {label}",
      enterFilename: "Enter a file name first.",
      requestImport: "Requesting import {name}, offset={offset}",
      tryNextImport: "{reason}; trying {name}",
      importRequestTx: "2-2 import request single full-frame write {bytes}B filename={filename} raw={raw}",
      requestSegment: "Requesting segment import {name} {start}-{end}",
      deleteBlocked: "Delete command blocked. Enable \"Allow delete commands\" first.",
      confirmDeleteOne: "Delete device file: {name} ?",
      deleteAllBlocked: "Delete-all command blocked. Enable \"Allow delete commands\" first.",
      confirmDeleteAll: "Delete all files on the device? This cannot be undone.",
      rawCommandError: "Raw command error: {error}",
      emptyFrame: "Full frame cannot be empty",
      rawFrameError: "Full-frame error: {error}",
      notConnected: "Device is not connected.",
      writeNotReady: "Write characteristic is not ready",
      unknownType: "Unknown TYPE={type} CMD={cmd} body={body}",
      capacityLog: "Capacity remain={remain}KB total={total}KB",
      batteryLog: "Battery {value}",
      firmwareLog: "Firmware version {version}",
      authLog: "Auth code ASCII=\"{ascii}\" HEX={hex}",
      controlResponse: "Control response CMD={cmd} body={body}",
      realtimeFileName: "Realtime audio file {name}",
      realtimeStatus: "Realtime status {text}",
      realtimeResponse: "Realtime response CMD={cmd} body={body}",
      importStarted: "Import started {name}",
      orphanFileData: "Received file data without an active download session; ignored {bytes}B.",
      receiving: "Receiving {bytes}",
      receivingSpeed: "Receiving {bytes} · {speed}/s",
      importDataSummary: "File data {packets} packets, {bytes} total, avg {speed}/s",
      deleteAllResponse: "Delete-all response {result}",
      abortResponse: "Abort-import response.",
      importAborted: "Import aborted",
      deleteOneResponse: "Delete-one response {result}",
      listFinished: "File list finished, {count} entries.",
      fileResponse: "File response CMD={cmd} body={body}",
      recordStart: "Start recording",
      recordSave: "Save recording",
      recordPause: "Pause recording",
      recordResume: "Resume recording",
      setGainAction: "Set gain",
      commandResult: "{source} {action} result {result} code={code}",
      recordStateLog: "Record state {state}",
      recordTimeLog: "Record time {duration}s currentSize={size}",
      currentFileLog: "Current file {name}",
      gainLog: "Gain {gain}",
      hardwareEvent: "{source} hardware event CMD={cmd} {event}",
      recordResponse: "Record response CMD={cmd} body={body}",
      listFrameTooShort: "File-list frame too short: {raw}",
      fileListFrame: "Received file-list frame count={count} parsed={parsed} total={total}",
      importEndNoSession: "Import ended {text}",
      wavSuffix: ", WAV {sampleRate}Hz {bits}bit {channels}ch",
      importCompleted: "Import completed {name} {bytes}{suffix}",
      importDoneStatus: "Completed {bytes}{suffix}",
      importEndReceived: "Import ended {text}, received {bytes}",
      importStatusReceived: "{text}, received {bytes}",
      idleListFinish: "File-list idle finish, {count} entries.",
      importIdleTimeout: "Import idle timeout",
      importTimeout: "Import timed out, received {bytes}.",
      timeoutReceived: "Timed out, received {bytes}",
      crcVector: "CRC-16/XMODEM standard vector",
      downloadExampleFrame: "2-2 successful download sample frame",
      parserReassembly: "Streaming parser half-frame reassembly",
      fileListBeParse: "File-list BE parsing",
      selfTestDone: "Protocol self-test complete: {passed}/{total} passed.",
      hexEvenLength: "HEX length must be even",
    },
  };

  const els = {};
  const state = {
    device: null,
    server: null,
    writeChar: null,
    notifyChar: null,
    keyNotifyChar: null,
    seq: 0,
    connected: false,
    locale: "zh",
    theme: "light",
    files: [],
    listIdleTimer: null,
    logs: [],
    logRenderTimer: null,
    download: null,
    realtime: {
      name: "",
      chunks: [],
      bytes: 0,
      active: false,
    },
    asr: {
      chunks: [],
      bytes: 0,
      timer: null,
      pending: false,
      segmentIndex: 0,
      unavailable: false,
      startedAt: 0,
    },
  };

  class FrameParser {
    constructor(source, onFrame) {
      this.source = source;
      this.onFrame = onFrame;
      this.buf = new Uint8Array(0);
    }

    push(bytes) {
      this.buf = concatBytes([this.buf, bytes]);
      const frames = [];

      while (this.buf.length >= 6) {
        const magicIndex = this.buf.indexOf(0x5a);
        if (magicIndex < 0) {
          log("WARN", t("noFrameHeader", { source: this.source, raw: hex(this.buf) }));
          this.buf = new Uint8Array(0);
          break;
        }
        if (magicIndex > 0) {
          log("WARN", t("noiseBeforeHeader", { source: this.source, raw: hex(this.buf.slice(0, magicIndex)) }));
          this.buf = this.buf.slice(magicIndex);
        }
        if (this.buf.length < 6) break;

        const len = readU16LE(this.buf, 4);
        const total = 6 + len;
        if (len > 8192) {
          log("ERR", t("invalidLength", { source: this.source, len }));
          this.buf = this.buf.slice(1);
          continue;
        }
        if (this.buf.length < total) break;

        const frame = this.buf.slice(0, total);
        this.buf = this.buf.slice(total);
        const seq = frame[1];
        const expected = readU16LE(frame, 2);
        const actual = crc16Xmodem(frame.slice(4));
        if (expected !== actual && expected !== 0x0000) {
          log("ERR", t("crcError", {
            source: this.source,
            seq,
            expected: toHex16(expected),
            actual: toHex16(actual),
            raw: hex(frame),
          }));
          continue;
        }
        const data = frame.slice(6);
        if (expected === 0x0000 && actual !== 0x0000) {
          log("WARN", `${this.source} CRC=0000，按录音手表兼容模式解析 seq=${seq} actual=0x${toHex16(actual)}`);
        }
        frames.push({ source: this.source, seq, data, raw: frame });
      }

      for (const frame of frames) this.onFrame(frame);
    }
  }

  const parsers = {
    ae22: new FrameParser("AE22", handleFrame),
    ae23: new FrameParser("AE23", handleFrame),
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindElements();
    initPreferences();
    bindEvents();
    applyI18n();
    updateSecureState();
    setConnected(false);
    log("INFO", msg("pageLoaded"));
  });

  function bindElements() {
    for (const id of [
      "secureState", "bleState", "connectBtn", "compatConnectBtn", "disconnectBtn", "safeSmokeBtn",
      "langZhBtn", "langEnBtn", "themeLightBtn", "themeDarkBtn",
      "batteryText", "capacityText", "firmwareText", "recordStateText", "recordTimeText", "gainText",
      "downloadName", "downloadOffset", "downloadBtn", "segDownloadBtn", "segStart", "segEnd",
      "downloadStatus", "fileRows", "abortImportBtn", "deleteAllBtn", "allowDelete",
      "rtName", "rtBytes", "saveRealtimeBtn", "rtTranscribeToggle", "rtAsrLang",
      "rtTranscribeStatus", "rtTranscript", "clearTranscriptBtn", "gainSelect", "setGainBtn",
      "rawType", "rawCmd", "rawParams", "sendRawCmdBtn", "rawFrame", "sendRawFrameBtn",
      "selfTestBtn", "selfTestOutput", "clearLogBtn", "exportLogBtn", "log",
    ]) {
      els[id] = document.getElementById(id);
    }
  }

  function bindEvents() {
    els.langZhBtn.addEventListener("click", () => setLocale("zh", true));
    els.langEnBtn.addEventListener("click", () => setLocale("en", true));
    els.themeLightBtn.addEventListener("click", () => setTheme("light", true));
    els.themeDarkBtn.addEventListener("click", () => setTheme("dark", true));
    els.connectBtn.addEventListener("click", () => connect(false));
    els.compatConnectBtn.addEventListener("click", () => connect(true));
    els.disconnectBtn.addEventListener("click", disconnect);
    els.safeSmokeBtn.addEventListener("click", runSafeSmoke);
    els.downloadBtn.addEventListener("click", () => requestDownloadFromInput());
    els.segDownloadBtn.addEventListener("click", requestSegmentDownload);
    els.abortImportBtn.addEventListener("click", () => sendCommand(2, 7));
    els.deleteAllBtn.addEventListener("click", deleteAllFiles);
    if (els.setGainBtn && els.gainSelect) {
      els.setGainBtn.addEventListener("click", () => sendCommand(3, 27, [Number(els.gainSelect.value)]));
    }
    els.saveRealtimeBtn.addEventListener("click", saveRealtimeAudio);
    els.clearTranscriptBtn.addEventListener("click", clearTranscript);
    els.rtTranscribeToggle.addEventListener("change", () => {
      if (!els.rtTranscribeToggle.checked) resetAsrBuffer();
      state.asr.unavailable = false;
      setTranscribeStatus(els.rtTranscribeToggle.checked ? t("asrCollecting", { bytes: formatBytes(state.asr.bytes) }) : t("asrIdle"));
    });
    els.sendRawCmdBtn.addEventListener("click", sendRawCommand);
    els.sendRawFrameBtn.addEventListener("click", sendRawFrame);
    els.selfTestBtn.addEventListener("click", runSelfTest);
    els.clearLogBtn.addEventListener("click", clearLog);
    els.exportLogBtn.addEventListener("click", exportLog);

    document.querySelectorAll("[data-cmd]").forEach((btn) => {
      btn.addEventListener("click", () => runNamedCommand(btn.dataset.cmd));
    });

    els.fileRows.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const index = Number(button.dataset.index);
      const file = state.files[index];
      if (!file) return;
      const action = button.dataset.action;
      if (action === "wav") requestDownload(fileDownloadName(file, "wav"), 0, fallbackNames(file, "wav"));
      if (action === "opus") requestDownload(fileDownloadName(file, "opus"), 0, fallbackNames(file, "opus"));
      if (action === "raw") requestDownload(file.name, 0, [file.name]);
      if (action === "delete") deleteOneFile(file);
    });

  }

  function initPreferences() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    setTheme(storedTheme === "dark" ? "dark" : "light", false);

    const storedLocale = localStorage.getItem(LOCALE_KEY);
    if (storedLocale === "zh" || storedLocale === "en") {
      setLocale(storedLocale, false);
      return;
    }

    setLocale(detectLocaleFallback(), false);
    detectLocaleByIp().then((locale) => {
      if (!localStorage.getItem(LOCALE_KEY) && locale) setLocale(locale, false);
    });
  }

  async function detectLocaleByIp() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1400);
    try {
      const response = await fetch("https://ipwho.is/?fields=success,country_code", {
        signal: controller.signal,
        cache: "no-store",
      });
      const data = await response.json();
      if (!data.success || !data.country_code) return "";
      return ["CN", "HK", "MO", "TW"].includes(String(data.country_code).toUpperCase()) ? "zh" : "en";
    } catch {
      return "";
    } finally {
      clearTimeout(timer);
    }
  }

  function detectLocaleFallback() {
    const language = (navigator.languages?.[0] || navigator.language || "").toLowerCase();
    if (language.startsWith("zh")) return "zh";
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return /Asia\/(Shanghai|Hong_Kong|Macau|Taipei)/i.test(timeZone) ? "zh" : "en";
  }

  function setLocale(locale, persist) {
    state.locale = locale === "en" ? "en" : "zh";
    document.documentElement.lang = state.locale === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.locale = state.locale;
    if (persist) localStorage.setItem(LOCALE_KEY, state.locale);
    applyI18n();
    updateSecureState();
    setConnected(state.connected);
  }

  function setTheme(theme, persist) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.body.classList.toggle("theme-dark", state.theme === "dark");
    document.body.classList.toggle("theme-light", state.theme !== "dark");
    document.documentElement.style.colorScheme = state.theme === "dark" ? "dark" : "light";
    if (persist) localStorage.setItem(THEME_KEY, state.theme);
    updatePreferenceButtons();
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    document.title = t("appTitle");
    updatePreferenceButtons();
  }

  function updatePreferenceButtons() {
    if (!els.langZhBtn) return;
    els.langZhBtn.classList.toggle("active", state.locale === "zh");
    els.langEnBtn.classList.toggle("active", state.locale === "en");
    els.themeLightBtn.classList.toggle("active", state.theme === "light");
    els.themeDarkBtn.classList.toggle("active", state.theme === "dark");
  }

  function t(key, vars = {}) {
    const text = I18N[state.locale]?.[key] || I18N.zh[key] || key;
    return Object.entries(vars).reduce((value, [name, replacement]) => {
      return value.replaceAll(`{${name}}`, String(replacement));
    }, text);
  }

  function msg(key, vars = {}) {
    return t(key, vars);
  }

  async function openBleSession(device) {
    state.device = device;
    device.addEventListener("gattserverdisconnected", onDisconnected);
    state.server = await device.gatt.connect();
    const service = await state.server.getPrimaryService(UUIDS.service);
    state.writeChar = await service.getCharacteristic(UUIDS.write);
    state.notifyChar = await service.getCharacteristic(UUIDS.notify);
    state.notifyChar.addEventListener("characteristicvaluechanged", (event) => {
      parsers.ae22.push(new Uint8Array(event.target.value.buffer));
    });
    await state.notifyChar.startNotifications();
    log("OK", t("notifyReady", { name: "AE22" }));

    try {
      state.keyNotifyChar = await service.getCharacteristic(UUIDS.keyNotify);
      state.keyNotifyChar.addEventListener("characteristicvaluechanged", (event) => {
        parsers.ae23.push(new Uint8Array(event.target.value.buffer));
      });
      await state.keyNotifyChar.startNotifications();
      log("OK", t("notifyReady", { name: "AE23" }));
    } catch (error) {
      log("WARN", t("notifyUnavailable", { name: "AE23", error: error.message }));
    }
  }

  async function connect(compatScan) {
    if (!navigator.bluetooth) {
      log("ERR", t("bluetoothUnsupported"));
      return;
    }
    try {
      setBusy(true);
      log("INFO", compatScan ? t("scanCompat") : t("scanNormal"));
      const options = compatScan
        ? { acceptAllDevices: true, optionalServices: [UUIDS.service] }
        : { filters: [{ services: [UUIDS.service] }], optionalServices: [UUIDS.service] };
      const device = await navigator.bluetooth.requestDevice(options);
      await withTimeout(openBleSession(device), 9000, t("bleConnectTimeout"));
      log("OK", t("deviceConnected"));
      setConnected(true);
      setBusy(false);
      runSafeSmoke().catch((error) => {
        log("WARN", t("autoCheckIncomplete", { error: error.message }));
      });
    } catch (error) {
      log("ERR", t("connectFailed", { error: error.message }));
      if (state.device?.gatt?.connected) state.device.gatt.disconnect();
      onDisconnected();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    try {
      if (state.device?.gatt?.connected) state.device.gatt.disconnect();
    } finally {
      onDisconnected();
    }
  }

  function onDisconnected() {
    clearTimeout(state.listIdleTimer);
    if (state.download?.idleTimer) clearTimeout(state.download.idleTimer);
    state.connected = false;
    state.server = null;
    state.writeChar = null;
    state.notifyChar = null;
    state.keyNotifyChar = null;
    setConnected(false);
    log("INFO", t("deviceDisconnected"));
  }

  async function runNamedCommand(name) {
    const now = new Date();
    const year = now.getFullYear();
    const actions = {
      syncTime: () => sendCommand(0, 0, [year & 0xff, year >> 8, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]),
      capacity: () => sendCommand(0, 1),
      battery: () => sendCommand(0, 3),
      firmware: () => sendCommand(0, 10),
      auth: () => sendCommand(0, 12),
      list: () => requestFileList(),
      rtStart: () => startRealtime(),
      rtPause: () => sendCommand(1, 3, [1]),
      rtResume: () => sendCommand(1, 3, [0]),
      rtStop: () => sendCommand(1, 2),
      recStart: () => sendCommand(3, 1),
      recSave: () => sendCommand(3, 3),
      recPause: () => sendCommand(3, 5),
      recResume: () => sendCommand(3, 7),
      recState: () => sendCommand(3, 19),
      recTime: () => sendCommand(3, 21),
      recName: () => sendCommand(3, 23),
      getGain: () => sendCommand(3, 25),
    };
    await actions[name]?.();
  }

  async function runSafeSmoke() {
    const steps = [
      [t("smokeBattery"), () => sendCommand(0, 3)],
      [t("smokeCapacity"), () => sendCommand(0, 1)],
      [t("smokeFirmware"), () => sendCommand(0, 10)],
      [t("smokeAuth"), () => sendCommand(0, 12)],
      [t("smokeRecordState"), () => sendCommand(3, 19)],
      [t("smokeRecordTime"), () => sendCommand(3, 21)],
      [t("smokeCurrentFile"), () => sendCommand(3, 23)],
      [t("smokeGain"), () => sendCommand(3, 25)],
      [t("smokeFileList"), () => requestFileList()],
    ];
    for (const [label, action] of steps) {
      log("INFO", t("smokeStep", { label }));
      await action();
      await sleep(260);
    }
  }

  async function requestFileList() {
    state.files = [];
    renderFiles();
    clearTimeout(state.listIdleTimer);
    await sendCommand(2, 0);
    armListIdleFinish();
  }

  async function requestDownloadFromInput() {
    const name = els.downloadName.value.trim();
    const offset = Math.max(0, Number(els.downloadOffset.value || 0));
    if (!name) {
      log("WARN", t("enterFilename"));
      return;
    }
    await requestDownload(name, offset, [name]);
  }

  async function requestDownload(name, offset, candidates) {
    const queue = unique([name, ...(candidates || [])]).filter(Boolean);
    state.download = {
      requestedName: name,
      currentName: queue.shift(),
      offset,
      candidates: queue,
      chunks: [],
      bytes: 0,
      started: false,
      idleTimer: null,
      startedAt: Date.now(),
      lastStatusAt: 0,
      lastTimeoutArmAt: 0,
      packets: 0,
    };
    updateDownloadStatus(t("requestImport", { name: state.download.currentName, offset }));
    await sendImportRequest(state.download.currentName, offset);
    armDownloadTimeout();
  }

  async function requestNextDownloadCandidate(reason) {
    const session = state.download;
    if (!session || session.candidates.length === 0 || session.bytes > 0) return false;
    const nextName = session.candidates.shift();
    session.currentName = nextName;
    session.chunks = [];
    session.bytes = 0;
    session.started = false;
    session.startedAt = Date.now();
    session.lastStatusAt = 0;
    session.lastTimeoutArmAt = 0;
    session.packets = 0;
    updateDownloadStatus(t("tryNextImport", { reason, name: nextName }));
    await sendImportRequest(nextName, session.offset);
    armDownloadTimeout();
    return true;
  }

  async function sendImportRequest(filename, offset) {
    const params = concatBytes([u32LE(offset), fixedTextBytes(filename, 24)]);
    const frame = buildFrame(new Uint8Array([2, 2, ...params]), true);
    log("TX", t("importRequestTx", { bytes: frame.length, filename, raw: hex(frame) }));
    await writeBytes(frame);
  }

  async function requestSegmentDownload() {
    const name = els.downloadName.value.trim();
    if (!name) {
      log("WARN", t("enterFilename"));
      return;
    }
    const start = Math.max(0, Number(els.segStart.value || 0));
    const end = Math.max(0, Number(els.segEnd.value || 0));
    const params = concatBytes([u32LE(start), u32LE(end), textBytes(name)]);
    state.download = {
      requestedName: name,
      currentName: name,
      offset: start,
      candidates: [],
      chunks: [],
      bytes: 0,
      started: false,
      idleTimer: null,
      startedAt: Date.now(),
      lastStatusAt: 0,
      lastTimeoutArmAt: 0,
      packets: 0,
    };
    updateDownloadStatus(t("requestSegment", { name, start, end }));
    await sendCommand(2, 12, params);
    armDownloadTimeout();
  }

  async function deleteOneFile(file) {
    if (!els.allowDelete.checked) {
      log("WARN", t("deleteBlocked"));
      return;
    }
    const ok = window.confirm(t("confirmDeleteOne", { name: file.name }));
    if (!ok) return;
    await sendCommand(2, 8, file.rawEntry);
  }

  async function deleteAllFiles() {
    if (!els.allowDelete.checked) {
      log("WARN", t("deleteAllBlocked"));
      return;
    }
    const ok = window.confirm(t("confirmDeleteAll"));
    if (!ok) return;
    await sendCommand(2, 9);
  }

  async function startRealtime() {
    state.realtime = { name: "", chunks: [], bytes: 0, active: true };
    resetAsrBuffer();
    els.rtName.textContent = "--";
    els.rtBytes.textContent = "0 B";
    els.saveRealtimeBtn.disabled = true;
    setTranscribeStatus(els.rtTranscribeToggle.checked ? t("asrCollecting", { bytes: "0 B" }) : t("asrIdle"));
    await sendCommand(1, 0);
  }

  function saveRealtimeAudio() {
    if (!state.realtime.bytes) return;
    const blob = new Blob(state.realtime.chunks, { type: "application/octet-stream" });
    const name = state.realtime.name || `qs668-realtime-${timestampName()}.opus`;
    downloadBlob(blob, name);
  }

  async function sendRawCommand() {
    try {
      const type = Number(els.rawType.value);
      const cmd = Number(els.rawCmd.value);
      const params = parseHex(els.rawParams.value);
      await sendCommand(type, cmd, params);
    } catch (error) {
      log("ERR", t("rawCommandError", { error: error.message }));
    }
  }

  async function sendRawFrame() {
    try {
      const frame = parseHex(els.rawFrame.value);
      if (!frame.length) throw new Error(t("emptyFrame"));
      log("TX", `RAW ${frame.length}B ${hex(frame)}`);
      await writeBytes(frame);
    } catch (error) {
      log("ERR", t("rawFrameError", { error: error.message }));
    }
  }

  async function sendCommand(type, cmd, params = []) {
    if (!state.connected || !state.writeChar) {
      log("WARN", t("notConnected"));
      return;
    }
    const paramBytes = params instanceof Uint8Array ? params : new Uint8Array(params);
    const data = new Uint8Array(2 + paramBytes.length);
    data[0] = type & 0xff;
    data[1] = cmd & 0xff;
    data.set(paramBytes, 2);
    const frame = buildFrame(data);
    log("TX", `${type}-${cmd} ${frame.length}B ${hex(frame)}`);
    await writeBytes(frame);
  }

  async function writeBytes(bytes) {
    if (!state.writeChar) throw new Error(t("writeNotReady"));
    if (state.writeChar.writeValueWithoutResponse) {
      await state.writeChar.writeValueWithoutResponse(bytes);
    } else {
      await state.writeChar.writeValue(bytes);
    }
  }

  function handleFrame(frame) {
    const data = frame.data;
    const isDownloadData = data.length >= 2 && data[0] === 2 && data[1] === 4 && state.download;
    if (!isDownloadData) {
      log("RX", `${frame.source} seq=${frame.seq} len=${data.length} data=${hex(data)}`);
    }
    if (data.length === 0) return;
    if (data.length === 1) {
      log("ACK", `${frame.source} TYPE=${data[0]}`);
      return;
    }
    const type = data[0];
    const cmd = data[1];
    const body = data.slice(2);
    if (type === 0) handleControl(cmd, body);
    else if (type === 1) handleRealtime(cmd, body);
    else if (type === 2) handleFile(cmd, body);
    else if (type === 3) handleRecord(cmd, body, frame.source);
    else log("INFO", t("unknownType", { type, cmd, body: hex(body) }));
  }

  function handleControl(cmd, body) {
    if (cmd === 2 && body.length >= 8) {
      const remain = readU32LE(body, 0);
      const total = readU32LE(body, 4);
      els.capacityText.textContent = `${formatBytes(remain * 1024)} / ${formatBytes(total * 1024)}`;
      log("OK", t("capacityLog", { remain, total }));
    } else if (cmd === 4 && body.length >= 1) {
      els.batteryText.textContent = body[0] === 110 ? t("charged") : `${body[0]}%`;
      log("OK", t("batteryLog", { value: els.batteryText.textContent }));
    } else if (cmd === 11) {
      const version = decodeText(body);
      els.firmwareText.textContent = version || "--";
      log("OK", t("firmwareLog", { version }));
    } else if (cmd === 13) {
      const authCode = formatAuthCode(body);
      log("OK", t("authLog", { ascii: decodeText(body), hex: hex(body), authCode }));
    } else {
      log("INFO", t("controlResponse", { cmd, body: hex(body) }));
    }
  }

  function handleRealtime(cmd, body) {
    if (cmd === 0) {
      const name = decodeText(body);
      state.realtime.name = name || `qs668-realtime-${timestampName()}.opus`;
      els.rtName.textContent = state.realtime.name;
      log("OK", t("realtimeFileName", { name: state.realtime.name }));
    } else if (cmd === 1) {
      state.realtime.chunks.push(body);
      state.realtime.bytes += body.length;
      els.rtBytes.textContent = formatBytes(state.realtime.bytes);
      els.saveRealtimeBtn.disabled = state.realtime.bytes === 0;
      queueAsrChunk(body);
    } else if (cmd === 4 && body.length >= 1) {
      const text = [t("realtimeContinue"), t("realtimePause"), t("realtimeStop")][body[0]] || t("unknown", { value: body[0] });
      log("OK", t("realtimeStatus", { text }));
      if (body[0] === 2) {
        state.realtime.active = false;
        flushAsrSegment(true).catch((error) => {
          setTranscribeStatus(t("asrError", { message: error.message }));
        });
      }
    } else {
      log("INFO", t("realtimeResponse", { cmd, body: hex(body) }));
    }
  }

  function queueAsrChunk(chunk) {
    if (!els.rtTranscribeToggle.checked || state.asr.unavailable) return;
    if (!state.asr.startedAt) state.asr.startedAt = Date.now();
    state.asr.chunks.push(new Uint8Array(chunk));
    state.asr.bytes += chunk.length;
    setTranscribeStatus(t("asrCollecting", { bytes: formatBytes(state.asr.bytes) }));
    const elapsed = Date.now() - state.asr.startedAt;
    if (
      state.asr.bytes >= ASR_MAX_SEGMENT_BYTES
      || (state.asr.bytes >= ASR_MIN_SEGMENT_BYTES && elapsed >= ASR_SEGMENT_MS)
    ) {
      flushAsrSegment(false).catch((error) => {
        setTranscribeStatus(t("asrError", { message: error.message }));
      });
      return;
    }
    if (!state.asr.timer) {
      state.asr.timer = setTimeout(() => {
        state.asr.timer = null;
        flushAsrSegment(false).catch((error) => {
          setTranscribeStatus(t("asrError", { message: error.message }));
        });
      }, ASR_SEGMENT_MS);
    }
  }

  async function flushAsrSegment(finalSegment) {
    if (state.asr.pending || !state.asr.bytes || state.asr.unavailable) return;
    clearTimeout(state.asr.timer);
    const chunks = state.asr.chunks;
    const bytes = state.asr.bytes;
    const sequence = state.asr.segmentIndex + 1;
    state.asr.chunks = [];
    state.asr.bytes = 0;
    state.asr.startedAt = 0;
    state.asr.timer = null;
    state.asr.pending = true;
    state.asr.segmentIndex = sequence;
    setTranscribeStatus(t("asrUploading", { index: sequence, bytes: formatBytes(bytes) }));

    try {
      const blob = new Blob(chunks, { type: "application/octet-stream" });
      const audioBase64 = await blobToBase64(blob);
      const response = await fetch("/api/qs668/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          language: els.rtAsrLang.value,
          codec: "opus",
          mimeType: "application/octet-stream",
          filename: state.realtime.name || `qs668-realtime-${timestampName()}.opus`,
          sequence,
          final: Boolean(finalSegment),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.message || `${response.status} ${response.statusText}`;
        if (response.status === 404 || response.status === 501) {
          state.asr.unavailable = true;
          els.rtTranscribeToggle.checked = false;
          setTranscribeStatus(t("asrNotConfigured", { message }));
          return;
        }
        throw new Error(message);
      }
      const text = String(data.text || "").trim();
      if (text) {
        appendTranscript(text);
        setTranscribeStatus(t("asrText", { text }));
      } else {
        setTranscribeStatus(t("asrNoText"));
      }
    } finally {
      state.asr.pending = false;
    }
  }

  function resetAsrBuffer() {
    clearTimeout(state.asr.timer);
    state.asr.chunks = [];
    state.asr.bytes = 0;
    state.asr.startedAt = 0;
    state.asr.timer = null;
    state.asr.pending = false;
    state.asr.segmentIndex = 0;
  }

  function setTranscribeStatus(text) {
    if (els.rtTranscribeStatus) els.rtTranscribeStatus.textContent = text;
  }

  function clearTranscript() {
    els.rtTranscript.value = "";
    setTranscribeStatus(t("asrIdle"));
  }

  function appendTranscript(text) {
    const current = els.rtTranscript.value.trim();
    const separator = current && !/[。！？.!?\n]$/.test(current) ? " " : "";
    els.rtTranscript.value = current ? `${current}${separator}${text}` : text;
    els.rtTranscript.scrollTop = els.rtTranscript.scrollHeight;
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(reader.error || new Error("Blob read failed"));
      reader.readAsDataURL(blob);
    });
  }

  function handleFile(cmd, body) {
    if (cmd === 1) {
      parseFileList(body);
      armListIdleFinish();
    } else if (cmd === 3) {
      const name = decodeText(body);
      if (state.download) {
        state.download.started = true;
        if (name) state.download.currentName = name;
        updateDownloadStatus(t("importStarted", { name: state.download.currentName }));
      }
      log("OK", t("importStarted", { name: name || "" }));
      armDownloadTimeout();
    } else if (cmd === 4) {
      if (!state.download) {
        log("WARN", t("orphanFileData", { bytes: body.length }));
        return;
      }
      state.download.chunks.push(body);
      state.download.bytes += body.length;
      state.download.packets = (state.download.packets || 0) + 1;
      updateDownloadProgress(false);
      armDownloadTimeoutThrottled();
    } else if (cmd === 5) {
      const code = body[0] ?? 3;
      handleImportEnd(code);
    } else if (cmd === 10) {
      log(body[0] === 0 ? "OK" : "ERR", t("deleteAllResponse", { result: deleteResultText(body[0]) }));
    } else if (cmd === 11) {
      log("OK", t("abortResponse"));
      updateDownloadStatus(t("importAborted"));
      state.download = null;
    } else if (cmd === 13) {
      log(body[0] === 0 ? "OK" : "ERR", t("deleteOneResponse", { result: deleteResultText(body[0]) }));
    } else if (cmd === 18) {
      clearTimeout(state.listIdleTimer);
      log("OK", t("listFinished", { count: state.files.length }));
      renderFiles();
    } else {
      log("INFO", t("fileResponse", { cmd, body: hex(body) }));
    }
  }

  function handleRecord(cmd, body, source) {
    const resultCommands = { 2: t("recordStart"), 4: t("recordSave"), 6: t("recordPause"), 8: t("recordResume"), 28: t("setGainAction") };
    if (resultCommands[cmd]) {
      const ok = cmd === 28 ? body[0] === 0 : body[0] === 1;
      log(ok ? "OK" : "ERR", t("commandResult", {
        source,
        action: resultCommands[cmd],
        result: ok ? t("deleteOk") : t("failSimple"),
        code: body[0],
      }));
      return;
    }
    if (cmd === 20 && body.length >= 1) {
      els.recordStateText.textContent = recordStateText(body[0]);
      log("OK", t("recordStateLog", { state: els.recordStateText.textContent }));
    } else if (cmd === 22 && body.length >= 6) {
      const duration = readU16LE(body, 0);
      const size = readU32LE(body, 2);
      els.recordTimeText.textContent = `${formatDuration(duration)} / ${formatBytes(size)}`;
      log("OK", t("recordTimeLog", { duration, size }));
    } else if (cmd === 24) {
      const name = decodeText(body);
      els.downloadName.value = name || els.downloadName.value;
      log("OK", t("currentFileLog", { name }));
    } else if (cmd === 26 && body.length >= 1) {
      els.gainText.textContent = gainText(body[0]);
      if (els.gainSelect) els.gainSelect.value = String(body[0]);
      log("OK", t("gainLog", { gain: els.gainText.textContent }));
    } else if ([1, 3, 5, 7].includes(cmd)) {
      log("INFO", t("hardwareEvent", { source, cmd, event: recordEventText(cmd) }));
    } else {
      log("INFO", t("recordResponse", { cmd, body: hex(body) }));
    }
  }

  function parseFileList(body) {
    if (body.length < 4) {
      log("WARN", t("listFrameTooShort", { raw: hex(body) }));
      return;
    }
    const count = readU32BE(body, 0);
    let offset = 4;
    let parsed = 0;
    for (let i = 0; i < count && offset + 28 <= body.length; i += 1) {
      const entry = body.slice(offset, offset + 28);
      const durationOrTime = readU32BE(entry, 0);
      const size = readU32BE(entry, 4);
      const nameBytes = entry.slice(8, 28);
      const name = decodeText(nameBytes);
      state.files.push({ durationOrTime, size, name, rawEntry: entry });
      parsed += 1;
      offset += 28;
    }
    log("OK", t("fileListFrame", { count, parsed, total: state.files.length }));
    renderFiles();
  }

  function handleImportEnd(code) {
    const session = state.download;
    const text = importEndText(code);
    if (!session) {
      log("INFO", t("importEndNoSession", { text }));
      return;
    }
    clearTimeout(session.idleTimer);
    if (code === 0) {
      const bytes = concatBytes(session.chunks);
      const name = session.currentName || session.requestedName || `qs668-${timestampName()}.bin`;
      const wav = inspectWav(bytes);
      const suffix = wav.ok ? t("wavSuffix", { sampleRate: wav.sampleRate, bits: wav.bitsPerSample, channels: wav.channels }) : "";
      logDownloadSummary(session);
      log("OK", t("importCompleted", { name, bytes: formatBytes(bytes.length), suffix }));
      updateDownloadStatus(t("importDoneStatus", { bytes: formatBytes(bytes.length), suffix }));
      const mime = wav.ok ? "audio/wav" : "application/octet-stream";
      const blob = new Blob([bytes], { type: mime });
      showDownloadResult(blob, name, wav.ok);
      state.download = null;
      return;
    }
    log("ERR", t("importEndReceived", { text, bytes: formatBytes(session.bytes) }));
    requestNextDownloadCandidate(text).then((used) => {
      if (!used) {
        updateDownloadStatus(t("importStatusReceived", { text, bytes: formatBytes(session.bytes) }));
        state.download = null;
      }
    });
  }

  function renderFiles() {
    if (!state.files.length) {
      els.fileRows.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(t("fileListEmpty"))}</td></tr>`;
      return;
    }
    els.fileRows.innerHTML = state.files.map((file, index) => {
      const time = fileTimeText(file.durationOrTime);
      return `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(file.name)}</td>
        <td>${escapeHtml(time)}</td>
        <td>${formatBytes(file.size)}</td>
        <td>
          <div class="row-actions">
            <button data-action="wav" data-index="${index}">WAV</button>
            <button data-action="opus" data-index="${index}">OPUS</button>
            <button data-action="raw" data-index="${index}">${escapeHtml(t("rawName"))}</button>
            <button data-action="delete" data-index="${index}">${escapeHtml(t("deleteOne"))}</button>
          </div>
        </td>
      </tr>`;
    }).join("");
  }

  function armListIdleFinish() {
    clearTimeout(state.listIdleTimer);
    state.listIdleTimer = setTimeout(() => {
      if (state.files.length) {
        log("OK", t("idleListFinish", { count: state.files.length }));
        renderFiles();
      }
    }, 1200);
  }

  function armDownloadTimeoutThrottled() {
    const session = state.download;
    if (!session) return;
    const now = Date.now();
    if (session.lastTimeoutArmAt && now - session.lastTimeoutArmAt < DOWNLOAD_TIMEOUT_ARM_INTERVAL_MS) return;
    armDownloadTimeout();
  }

  function armDownloadTimeout() {
    if (!state.download) return;
    state.download.lastTimeoutArmAt = Date.now();
    clearTimeout(state.download.idleTimer);
    state.download.idleTimer = setTimeout(async () => {
      const session = state.download;
      if (!session) return;
      const used = await requestNextDownloadCandidate(t("importIdleTimeout"));
      if (!used) {
        log("ERR", t("importTimeout", { bytes: formatBytes(session.bytes) }));
        updateDownloadStatus(t("timeoutReceived", { bytes: formatBytes(session.bytes) }));
        state.download = null;
      }
    }, 12000);
  }

  function buildFrame(data, preserveSeq = false) {
    const seq = preserveSeq ? state.seq : state.seq;
    state.seq = (state.seq + 1) & 0xff;
    const lenBytes = u16LE(data.length);
    const crc = crc16Xmodem(concatBytes([lenBytes, data]));
    const frame = new Uint8Array(6 + data.length);
    frame[0] = 0x5a;
    frame[1] = seq;
    frame[2] = crc & 0xff;
    frame[3] = (crc >> 8) & 0xff;
    frame.set(lenBytes, 4);
    frame.set(data, 6);
    return frame;
  }

  function buildFrameWithSeq(seq, data) {
    const lenBytes = u16LE(data.length);
    const crc = crc16Xmodem(concatBytes([lenBytes, data]));
    const frame = new Uint8Array(6 + data.length);
    frame[0] = 0x5a;
    frame[1] = seq & 0xff;
    frame[2] = crc & 0xff;
    frame[3] = crc >> 8;
    frame.set(lenBytes, 4);
    frame.set(data, 6);
    return frame;
  }

  function runSelfTest() {
    const lines = [];
    const check = (label, ok, detail) => lines.push(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);

    const vector = textBytes("123456789");
    check(t("crcVector"), crc16Xmodem(vector) === 0x31c3, `actual=0x${toHex16(crc16Xmodem(vector))}`);

    const data = concatBytes([new Uint8Array([2, 2]), u32LE(0), fixedTextBytes("note20260710-162938.wav", 24)]);
    const example = buildFrameWithSeq(3, data);
    const expected = parseHex("5a 03 9e 20 1e 00 02 02 00 00 00 00 6e 6f 74 65 32 30 32 36 30 37 31 30 2d 31 36 32 39 33 38 2e 77 61 76 00");
    check(t("downloadExampleFrame"), hex(example) === hex(expected), hex(example));

    const parserHits = [];
    const parser = new FrameParser("TEST", (frame) => parserHits.push(frame));
    parser.push(example.slice(0, 11));
    parser.push(example.slice(11));
    check(t("parserReassembly"), parserHits.length === 1 && parserHits[0].data.length === 30);

    const listBody = concatBytes([
      u32BE(1),
      u32BE(12),
      u32BE(3456),
      fixedTextBytes("note20260710-162938.", 20),
    ]);
    const before = state.files.length;
    const parsed = [];
    const oldFiles = state.files;
    state.files = parsed;
    parseFileList(listBody);
    check(t("fileListBeParse"), parsed.length === 1 && parsed[0].durationOrTime === 12 && parsed[0].size === 3456);
    state.files = oldFiles.slice(0, before);
    renderFiles();

    els.selfTestOutput.textContent = lines.join("\n");
    log("INFO", t("selfTestDone", { passed: lines.filter((line) => line.startsWith("PASS")).length, total: lines.length }));
  }

  function crc16Xmodem(bytes) {
    let crc = 0x0000;
    for (const b of bytes) {
      crc ^= b << 8;
      for (let i = 0; i < 8; i += 1) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xffff;
      }
    }
    return crc & 0xffff;
  }

  function setConnected(connected) {
    state.connected = connected;
    els.bleState.textContent = connected ? t("connectedDevice", { name: state.device?.name || "" }).trim() : t("bleDisconnected");
    els.bleState.className = connected ? "pill ok" : "pill";
    els.connectBtn.disabled = connected;
    els.compatConnectBtn.disabled = connected;
    els.disconnectBtn.disabled = !connected;
    document.querySelectorAll("button").forEach((button) => {
      if ([
        "connectBtn", "compatConnectBtn", "disconnectBtn", "selfTestBtn", "clearLogBtn", "exportLogBtn",
        "langZhBtn", "langEnBtn", "themeLightBtn", "themeDarkBtn", "clearTranscriptBtn",
      ].includes(button.id)) return;
      if (button.id === "deleteAllBtn") button.disabled = !connected;
      else button.disabled = !connected;
    });
    els.sendRawCmdBtn.disabled = !connected;
    els.sendRawFrameBtn.disabled = !connected;
  }

  function setBusy(busy) {
    els.connectBtn.disabled = busy || state.connected;
    els.compatConnectBtn.disabled = busy || state.connected;
    els.connectBtn.textContent = busy ? t("connecting") : t("connect");
  }

  function updateSecureState() {
    const supported = Boolean(navigator.bluetooth);
    const secure = window.isSecureContext;
    els.secureState.textContent = supported && secure ? t("secureReady") : t("secureNeeded");
    els.secureState.className = supported && secure ? "pill ok" : "pill warn";
  }

  function updateDownloadStatus(text) {
    els.downloadStatus.textContent = text;
  }

  function updateDownloadProgress(force) {
    const session = state.download;
    if (!session) return;
    const now = Date.now();
    if (!force && session.lastStatusAt && now - session.lastStatusAt < DOWNLOAD_STATUS_INTERVAL_MS) return;
    session.lastStatusAt = now;
    const elapsedSeconds = Math.max(0.25, (now - session.startedAt) / 1000);
    const speed = session.bytes / elapsedSeconds;
    updateDownloadStatus(t("receivingSpeed", { bytes: formatBytes(session.bytes), speed: formatBytes(speed) }));
  }

  function logDownloadSummary(session) {
    if (!session || !session.packets) return;
    const elapsedSeconds = Math.max(0.25, (Date.now() - session.startedAt) / 1000);
    const speed = session.bytes / elapsedSeconds;
    log("INFO", t("importDataSummary", {
      packets: session.packets,
      bytes: formatBytes(session.bytes),
      speed: formatBytes(speed),
    }));
  }

  function showDownloadResult(blob, filename, playable) {
    const previous = document.querySelector(".download-result");
    if (previous) previous.remove();
    const node = document.getElementById("downloadTemplate").content.cloneNode(true);
    const url = URL.createObjectURL(blob);
    const link = node.getElementById("downloadLink");
    link.href = url;
    link.download = filename;
    link.textContent = t("saveFile", { filename });
    const audio = node.getElementById("audioPreview");
    if (playable) {
      audio.src = url;
      audio.hidden = false;
    }
    els.downloadStatus.after(node);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function inspectWav(bytes) {
    if (bytes.length < 44) return { ok: false };
    const riff = ascii(bytes.slice(0, 4));
    const wave = ascii(bytes.slice(8, 12));
    if (riff !== "RIFF" || wave !== "WAVE") return { ok: false };
    const declared = readU32LE(bytes, 4) + 8;
    const channels = readU16LE(bytes, 22);
    const sampleRate = readU32LE(bytes, 24);
    const bitsPerSample = readU16LE(bytes, 34);
    return { ok: declared === bytes.length, declared, channels, sampleRate, bitsPerSample };
  }

  function fileDownloadName(file, ext) {
    const name = file.name;
    if (name.endsWith(".")) return `${name}${ext}`;
    if (/\.(wav|opus)$/i.test(name)) return name.replace(/\.(wav|opus)$/i, `.${ext}`);
    return `${name}.${ext}`;
  }

  function fallbackNames(file, firstExt) {
    const otherExt = firstExt === "wav" ? "opus" : "wav";
    return [fileDownloadName(file, firstExt), fileDownloadName(file, otherExt), file.name];
  }

  function log(level, message) {
    const line = `[${new Date().toLocaleTimeString()}] ${level.padEnd(4)} ${message}`;
    state.logs.push(line);
    if (state.logs.length > 1200) state.logs.shift();
    scheduleLogRender();
  }

  function scheduleLogRender() {
    if (!els.log || state.logRenderTimer) return;
    state.logRenderTimer = setTimeout(() => {
      state.logRenderTimer = null;
      renderLogNow();
    }, LOG_RENDER_INTERVAL_MS);
  }

  function renderLogNow() {
    if (!els.log) return;
    els.log.textContent = state.logs.join("\n");
    els.log.scrollTop = els.log.scrollHeight;
  }

  function clearLog() {
    state.logs = [];
    if (state.logRenderTimer) {
      clearTimeout(state.logRenderTimer);
      state.logRenderTimer = null;
    }
    els.log.textContent = "";
  }

  function exportLog() {
    renderLogNow();
    const blob = new Blob([state.logs.join("\n")], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `qs668-ble-log-${timestampName()}.txt`);
  }

  function parseHex(input) {
    const cleaned = input.replace(/0x/gi, "").replace(/[^0-9a-fA-F]/g, "");
    if (!cleaned) return new Uint8Array(0);
    if (cleaned.length % 2) throw new Error(t("hexEvenLength"));
    const out = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < out.length; i += 1) out[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
    return out;
  }

  function fixedTextBytes(text, length) {
    const bytes = textBytes(text);
    const out = new Uint8Array(length);
    out.set(bytes.slice(0, length));
    return out;
  }

  function textBytes(text) {
    return new TextEncoder().encode(text);
  }

  function decodeText(bytes) {
    const end = bytes.indexOf(0);
    const data = end >= 0 ? bytes.slice(0, end) : bytes;
    return new TextDecoder("utf-8", { fatal: false }).decode(data).trim();
  }

  function formatAuthCode(bytes) {
    const text = decodeText(bytes);
    if (text && /^[\x20-\x7E]+$/.test(text)) return text;
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  function ascii(bytes) {
    return Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  }

  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }

  function u16LE(value) {
    return new Uint8Array([value & 0xff, (value >> 8) & 0xff]);
  }

  function u32LE(value) {
    return new Uint8Array([value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff]);
  }

  function u32BE(value) {
    return new Uint8Array([(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]);
  }

  function readU16LE(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  }

  function readU32LE(bytes, offset) {
    return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
  }

  function readU32BE(bytes, offset) {
    return (((bytes[offset] << 24) >>> 0) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
  }

  function hex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(" ");
  }

  function toHex16(value) {
    return value.toString(16).padStart(4, "0");
  }

  function formatBytes(value) {
    if (!Number.isFinite(value)) return "--";
    const units = ["B", "KB", "MB", "GB"];
    let n = value;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i += 1;
    }
    return `${n >= 10 || i === 0 ? n.toFixed(0) : n.toFixed(1)} ${units[i]}`;
  }

  function formatDuration(seconds) {
    const s = Math.max(0, seconds | 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rest = s % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : `${m}:${String(rest).padStart(2, "0")}`;
  }

  function fileTimeText(value) {
    if (value > 946684800 && value < 4102444800) {
      return new Date(value * 1000).toLocaleString();
    }
    return formatDuration(value);
  }

  function recordStateText(value) {
    return ({ 1: t("recordStateRecording"), 2: t("recordStateIdle"), 3: t("recordStatePaused") })[value] || t("unknown", { value });
  }

  function recordEventText(cmd) {
    return ({ 1: t("recordStart"), 3: t("recordSave"), 5: t("recordPause"), 7: t("recordResume") })[cmd] || t("unknown", { value: cmd });
  }

  function gainText(value) {
    return ({ 1: t("gainLow"), 2: t("gainMid"), 3: t("gainHigh") })[value] || t("unknown", { value });
  }

  function importEndText(code) {
    return ({ 0: t("importDone"), 1: t("importMissing"), 2: t("importOffsetTooLarge"), 3: t("importOtherStop") })[code] || t("unknown", { value: code });
  }

  function deleteResultText(code) {
    return code === 0 ? t("deleteOk") : t("deleteFail", { code });
  }

  function unique(items) {
    return [...new Set(items)];
  }

  function compactId(value) {
    const text = String(value || "");
    if (!text) return "--";
    return text.length > 28 ? `${text.slice(0, 12)}...${text.slice(-8)}` : text;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function withTimeout(promise, ms, message) {
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  function timestampName() {
    return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[ch]);
  }
})();
