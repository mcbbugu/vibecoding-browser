# 自动更新配置指南

## 已完成配置

✅ 安装 `electron-updater`
✅ 主进程添加更新逻辑
✅ Settings 添加"检查更新"按钮
✅ 配置 GitHub Release 发布

## 发版流程

### 1. 修改版本号
编辑 `package.json`，更新版本号：
```json
{
  "version": "1.0.1"
}
```

### 2. 修改 GitHub 配置
编辑 `package.json`，填写你的 GitHub 信息：
```json
{
  "publish": [{
    "provider": "github",
    "owner": "你的GitHub用户名",  // 改这里
    "repo": "vibecoding-browser",
    "private": false  // 如果是私有仓库改成 true
  }]
}
```

### 3. 打包应用
```bash
npm run build       # 构建前端
npm run package     # 打包 Electron
```

打包完成后，在 `dist/` 目录找到：
- `VibeCoding DevDock-1.0.1-arm64.dmg`
- `VibeCoding DevDock-1.0.1-x64.dmg`
- `latest-mac.yml`

### 4. 创建 GitHub Release

1. 去你的仓库 → Releases → Create a new release
2. 标签填：`v1.0.1`（必须带 v 前缀）
3. 标题填：`v1.0.1`
4. 上传文件：
   - 拖入两个 `.dmg` 文件
   - 拖入 `latest-mac.yml` 文件
5. 点击 Publish release

### 5. 测试更新

用户打开应用 → Settings → 检查更新

## 自动更新流程

1. **启动时自动检查**（仅打包后的应用）
   - 后台静默检查
   - 有更新会自动下载

2. **手动检查**
   - Settings → 检查更新
   - 显示当前版本和最新版本

3. **下载完成**
   - 弹窗提示"新版本下载完成"
   - 点击"重启并安装"

## 私有仓库配置

如果是私有仓库，需要配置 GitHub Token：

1. 生成 Token：GitHub → Settings → Developer settings → Personal access tokens → Generate new token
2. 勾选 `repo` 权限
3. 在主进程添加：

```javascript
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'xxx',
  repo: 'xxx',
  private: true,
  token: process.env.GH_TOKEN  // 通过环境变量传入
});
```

4. 打包时设置环境变量：
```bash
export GH_TOKEN=ghp_xxx
npm run package
```

## 注意事项

- 版本号必须遵循语义化版本（1.0.0）
- Release 标签必须带 `v` 前缀（v1.0.0）
- 必须上传 `latest-mac.yml` 文件
- 首次下载用户需要手动下载 DMG
- 后续更新会自动通过应用内完成

