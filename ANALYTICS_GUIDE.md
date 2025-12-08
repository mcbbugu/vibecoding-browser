# 📊 Analytics 集成指南

已集成 PostHog 匿名统计功能，用于追踪用户行为和产品改进。

## 🎯 功能概览

### 已实现功能
- ✅ 首次启动隐私同意弹窗
- ✅ 匿名设备 ID 生成
- ✅ 应用启动追踪
- ✅ 项目操作追踪（创建/打开）
- ✅ 功能使用追踪（截图/DevTools/端口扫描）
- ✅ 用户可在设置中开启/关闭

### 追踪的事件

| 事件名称 | 触发时机 | 数据字段 |
|---------|---------|---------|
| `app_launched` | 应用启动 | version, platform, user_agent |
| `project_created` | 创建项目 | project_type, has_path |
| `project_opened` | 打开项目 | project_type |
| `feature_used` | 使用功能 | feature (screenshot/devtools/port_scan等) |
| `port_scan` | 扫描端口 | scan_type, ports_found |
| `screenshot_captured` | 截图 | - |
| `devtools_opened` | 打开 DevTools | - |

### 不追踪的内容
- ❌ 个人信息（姓名、邮箱等）
- ❌ 浏览历史或 URL
- ❌ 项目内容或代码
- ❌ 任何可识别身份的数据

## 🚀 配置步骤

### 1. 注册 PostHog

1. 访问 [PostHog](https://posthog.com)
2. 注册账号（免费 1M 事件/月）
3. 创建项目
4. 获取 API Key（项目设置页面）

### 2. 配置环境变量

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件
POSTHOG_API_KEY=phc_your_actual_api_key_here
```

### 3. 重新编译运行

```bash
npm run build
npm start
```

## 📱 用户体验

### 首次启动
- 显示隐私同意弹窗
- 用户可选择"同意"或"拒绝"
- 选择会被保存到 localStorage

### 隐私弹窗内容
- ✅ 我们收集什么
- ❌ 我们不收集什么
- 💡 可在设置中修改

### 设置中管理
用户可以随时在"设置"中开启/关闭数据收集。

## 🔧 开发指南

### 添加新事件

```javascript
import { trackFeatureUsed } from '../utils/analytics';

// 追踪功能使用
trackFeatureUsed('feature_name', {
  metadata_key: 'value'
});
```

### 现有追踪函数

```javascript
// 应用启动
import { trackAppLaunched } from '../utils/analytics';
trackAppLaunched('1.0.0');

// 项目操作
import { trackProjectOpened } from '../utils/analytics';
trackProjectOpened('react');

// 功能使用
import { trackFeatureUsed } from '../utils/analytics';
trackFeatureUsed('screenshot', { format: 'png' });

// 错误追踪
import { trackError } from '../utils/analytics';
trackError(error, { context: 'screenshot' });
```

### 检查用户同意状态

```javascript
import analytics from '../utils/analytics';

if (analytics.hasConsent()) {
  // 用户已做出选择
}

// 手动设置同意状态
analytics.setConsent(true); // 或 false
```

## 📊 PostHog Dashboard

登录 PostHog 后可查看：

### 核心指标
- **总用户数**（唯一设备数）
- **日活/周活/月活** (DAU/WAU/MAU)
- **留存率** (7日/30日)
- **功能使用频率**

### 自定义分析
- 用户路径分析
- 功能漏斗分析
- 留存曲线
- 地理分布

### 示例查询

**最常用功能**
```sql
SELECT feature, COUNT(*) as count
FROM events
WHERE event = 'feature_used'
GROUP BY feature
ORDER BY count DESC
```

**7日留存率**
```sql
-- PostHog 内置留存分析工具
Insights > Retention
```

## 🔒 隐私合规

### GDPR 合规
- ✅ 用户明确同意
- ✅ 可随时撤回
- ✅ 匿名数据
- ✅ 数据最小化

### 数据存储
- 匿名设备 ID 存储在 localStorage
- 同意状态存储在 localStorage
- PostHog 数据存储在欧盟/美国（可选）

### 删除数据
用户可联系你删除其匿名数据（提供设备 ID）。

## 💰 成本

| 月活跃用户 | PostHog 费率 | 月成本 |
|-----------|-------------|--------|
| < 1M 事件 | 免费 | $0 |
| 1M - 10M | $0.00045/事件 | ~$5-50 |
| 10M+ | 联系商务 | 定制 |

**预估**：5000 MAU，每人触发 20 事件/月 = 100k 事件 = **免费**

## 🐛 调试

### 检查事件是否发送

打开浏览器控制台：
```javascript
// 查看 PostHog 是否初始化
window.posthog

// 手动发送测试事件
import analytics from './src/utils/analytics';
analytics.track('test_event', { foo: 'bar' });
```

### PostHog Live View
PostHog Dashboard > Live Events - 实时查看事件

### 常见问题

**事件没有显示？**
1. 检查 API Key 是否正确
2. 查看浏览器控制台是否有错误
3. 检查用户是否同意数据收集
4. PostHog 有 1-2 分钟延迟

**localhost 环境测试？**
PostHog 默认会追踪 localhost，生产环境可以过滤。

## 📝 后续优化

### 建议添加的事件
- [ ] 试用开始/结束
- [ ] License 激活
- [ ] 编辑器打开
- [ ] 崩溃报告
- [ ] 性能指标

### 建议功能
- [ ] Sentry 错误追踪集成
- [ ] 性能监控
- [ ] Session 录制（可选）
- [ ] A/B 测试

## 📚 相关资源

- [PostHog 文档](https://posthog.com/docs)
- [PostHog API 参考](https://posthog.com/docs/api)
- [隐私最佳实践](https://posthog.com/docs/privacy)
- [GDPR 合规指南](https://posthog.com/docs/privacy/gdpr-compliance)

---

**需要帮助？**
查看 PostHog 社区或创建 Issue。呃，现在我想让AI

