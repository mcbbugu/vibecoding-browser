# VibeCoding DevDock

> AI 写代码，DevDock 管项目

## 解决什么问题

AI 让你同时开 5-10 个项目，浏览器标签乱成一团。

- 想看项目得翻标签页
- 测响应式开一堆窗口
- 跳代码还得找路径
- 不知道哪个项目跑在哪个端口

## 核心功能

### 项目管理
- 卡片展示所有项目，一眼看清运行状态
- 自动扫描端口，发现运行中的服务
- 固定常用项目，拖拽排序
- 刷新按钮独立控制预览更新

### 内置浏览器
- Chromium 内核，完整 DevTools
- 18+ 设备预设（iPhone/iPad/Desktop）
- 截图到剪贴板（Cmd+Shift+S）
- 地址栏快速跳转

### 快速跳转
- 右键项目 → 在编辑器打开（Cursor/VSCode/WebStorm...）
- 右键项目 → 在访达中打开
- Cmd+E 快捷打开编辑器

### 快捷键
- `Cmd+T` 搜项目
- `Cmd+L` 地址栏
- `Cmd+E` 跳编辑器
- `Cmd+[/]` 前进后退
- `Cmd+R` 刷新页面
- `Cmd+Shift+S` 截图
- `F12` DevTools

## 技术栈

- Electron 33 + React 19
- Vite 6 + Tailwind CSS
- @dnd-kit（拖拽）
- electron-store（数据持久化）

## 安装

1. 下载 DMG 文件并安装

2. **如果提示"文件已损坏"或无法打开**：

   这是 macOS 的安全机制，应用未签名时会触发。
   
   **macOS Ventura/Sonoma 及更新版本**（看不到"仍要打开"按钮）：
   ```bash
   xattr -cr "/Applications/VibeCoding DevDock.app"
   ```
   然后重新打开应用即可。
   
   **旧版本 macOS**（能看到"仍要打开"按钮）：
   - 系统设置 → 隐私与安全性 → 点击"仍要打开"

## 开发

```bash
npm install
npm run dev       # 开发环境
npm run build     # 打包
```

## 适合谁

- 用 AI 写代码的独立开发者
- 同时维护多个项目
- 快捷键重度用户

## 开源协议

闭源商业软件

---

**DevDock = Dev + Dock**

AI 时代，项目多了，得有个停靠的地方。
