# macOS 代码签名说明

## 当前状态

应用**未进行代码签名**，用户下载后可能看到"文件已损坏"提示。

**为什么看不到"仍要打开"按钮？**

- **macOS Ventura/Sonoma 及更新版本**：Apple 加强了 Gatekeeper 安全机制，移除了"仍要打开"按钮
- **旧版本 macOS**：可能会显示"仍要打开"按钮，可以直接点击
- **当前版本**：必须使用终端命令移除隔离属性

## 临时解决方案（用户端）

**重要**：如果提示"文件已损坏"且系统设置的"隐私与安全性"里**看不到"仍要打开"按钮**，说明是 quarantine（隔离）属性问题，**必须使用终端命令解决**：

```bash
xattr -cr "/Applications/VibeCoding DevDock.app"
```

然后重新打开应用即可。

**为什么看不到"仍要打开"按钮？**
- 常规 Gatekeeper 拦截：会在系统设置显示"仍要打开"
- Quarantine 属性问题：不会显示按钮，必须用终端命令移除隔离属性

## 彻底解决方案（开发者端）

### 1. 申请 Apple Developer 账号
- 费用：$99/年
- 地址：https://developer.apple.com/programs/

### 2. 配置代码签名

在 `package.json` 的 `build.mac` 中添加：

```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)",
      "hardenedRuntime": true,
      "gatekeeperAssess": true,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    }
  }
}
```

### 3. 创建 entitlements 文件

创建 `build/entitlements.mac.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

### 4. 打包时自动签名

```bash
npm run package
```

electron-builder 会自动使用你的证书签名。

## 独立开发者建议

**早期阶段**：
- 使用 README 中的临时方案
- 在下载页面说明如何解决
- 用户通常理解这是正常情况

**有收入后**：
- 申请 Apple Developer 账号
- 配置代码签名
- 提升用户体验

## 注意事项

- 代码签名需要每次打包时联网验证
- 证书过期需要续费
- 未签名应用在 macOS 上也能正常运行，只是首次打开需要额外步骤
