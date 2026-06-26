<p align="center">
  <img src="https://github.com/heyppen/CleanTabs/blob/main/public/logo.png?raw=true" alt="Logo" width="128"/>
  <br />
  <h1 align="center">CleanTabs</h1>
</p>
<div align="center">
  <p>按规则自动休眠或关闭标签页的浏览器扩展。</p>
  <p>
    <a href="https://chromewebstore.google.com/detail/cleantabs/dhafadjcaeeklhlbbfeomgdgpkafdmig" target="_blank"><img alt="Chrome Web Store Version" src="https://img.shields.io/chrome-web-store/v/dhafadjcaeeklhlbbfeomgdgpkafdmig?style=flat-square&color=green"></a>
    <a href="https://discord.gg/NY8B8YcE" target="_blank"><img alt="Discord" src="https://img.shields.io/badge/chat-Discord-blue?style=flat-square&logo=discord" /></a>
    <a href="https://x.com/ppen_cc" target="_blank"><img alt="Twitter" src="https://img.shields.io/badge/follow-Twitter-blue?style=flat-square&logo=x" /></a>
  </p>
</div>

![shot-rules.png](https://github.com/heyppen/CleanTabs/blob/main/doc/shot-rules.png?raw=true)

# CleanTabs

CleanTabs 会在后台**按自定义规则**自动休眠（discard）或关闭标签页，帮你降低浏览器内存占用，治理标签页混乱。

# 安装

<a href="https://chromewebstore.google.com/detail/cleantabs/dhafadjcaeeklhlbbfeomgdgpkafdmig" target="_blank"><img src="https://github.com/heyppen/CleanTabs/blob/main/doc/chrome-web-store-badge.png?raw=true" alt="Chrome Web Store" height="60px"/></a>

# 工作原理

CleanTabs 每分钟执行一次定时任务，遍历所有窗口中的标签页：

如果
- 扩展未被禁用
- 标签页 URL 匹配了某条规则的 `URL 匹配模式`
- 标签页闲置时长超过规则中设定的 `闲置时长`

CleanTabs 会对该标签页执行规则中指定的 `动作`，然后继续处理下一个标签页。

> [!NOTE]
> 以下标签页不会被休眠或关闭：
> - 每个窗口中当前激活的标签页
> - 固定的标签页（除非在设置中开启）
> - 标签组内的标签页（除非在设置中开启）
> - 手动标记为"始终保留"的标签页

你也可以在弹出窗口的「标签页」视图中手动休眠某个标签页。

# 规则

每条规则包含以下字段：

| 字段 | 说明 |
|------|------|
| `URL 匹配模式` | 用于匹配标签页 URL 的通配符模式 |
| `闲置时长` | 超过该时长未访问才会触发动作 |
| `动作` | 匹配后执行的操作 |
| `→暂存` | 关闭时是否将标签页保存到暂存箱 |
| `禁用` | 暂时停用该规则 |

规则按顺序匹配，**第一条命中的规则生效**。

## URL 匹配模式

使用通配符 `*` 匹配任意字符：

| 模式 | 说明 |
|------|------|
| `*` | 匹配所有 URL |
| `https://www.google.com*` | 匹配以 `https://www.google.com` 开头的所有 URL |
| `*://*.google.com/*` | 匹配 `https://docs.google.com/`、`http://mail.google.com/mail/u/0` 等 |

## 闲置时长

`闲置时长 = 当前时间 - 上次切换到该标签页的时间`

支持三种单位写法（在代码模式中使用）：

| 写法 | 含义 | 示例 |
|------|------|------|
| 纯数字 或 `Nm` | 分钟 | `5`、`5m` |
| `Nh` | 小时 | `2h`（= 120 分钟） |
| `Nd` | 天 | `1d`（= 1440 分钟） |

有效范围：0 ～ 30 天。

## 动作

| 动作 | 说明 |
|------|------|
| `忽略`（nop） | 不做任何操作。可用于排除特定网站 |
| `休眠`（discard） | 释放标签页占用的内存，标签页仍保留在标签栏，点击时重新加载。参考 [Chrome 文档](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-discard) |
| `关闭`（close） | 直接关闭标签页。如果开启了 `→暂存`，关闭前会将标签页信息保存到暂存箱 |

# 暂存箱

当规则的动作为「关闭」且启用了「→暂存」时，被关闭的标签页会自动保存到暂存箱。暂存箱记录标签页的标题、URL、图标、关闭次数和最近关闭时间，方便你随时找回被关闭的页面。

# 设置

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| 允许关闭固定标签页 | 关闭 | 开启后，固定的标签页也会被规则匹配和处理 |
| 允许关闭标签组内的标签页 | 关闭 | 开启后，标签组内的标签页也会被规则匹配和处理 |

# 推荐规则配置

> [!TIP]
> 在「规则」→「代码模式」中粘贴以下内容。使用 `//` 开头的行作为注释。

## 温和模式

仅对规则中列出的网站执行休眠或关闭，其他网站不受影响。

```
*://www.google.com/*, 5m, discard
*://stackoverflow.com/*, 10m, close, true
chrome://newtab/, 1m, close
about:blank, 1m, close
```

## 激进模式

默认对所有网站执行休眠，通过 `nop` 规则排除需要保留的网站。

```
*://mail.google.com/*, 1m, nop
*://www.youtube.com/*, 1m, nop
*, 15m, discard, true
```

# 快捷键

| 快捷键 | 说明 |
|--------|------|
| `Alt+T`（Mac：`Ctrl+T`） | 打开弹出窗口 |

# 开发

基于 [WXT 扩展框架](https://wxt.dev/) 构建，使用 React 和 Tailwind CSS。

```bash
pnpm install       # 安装依赖
pnpm dev           # 开发模式（Chrome）
pnpm dev:firefox   # 开发模式（Firefox）
pnpm build         # 生产构建（Chrome）
pnpm build:firefox # 生产构建（Firefox）
pnpm compile       # 类型检查
pnpm test          # 运行测试
```

欢迎提交 PR 或 Issue！
