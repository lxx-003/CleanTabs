# CleanTabs 设计说明

本文档记录 CleanTabs popup 界面的视觉方向、信息架构、组件规范和维护建议。目标是让后续 UI 迭代保持一致，同时不影响扩展的核心规则逻辑。

## 设计目标

CleanTabs 是一个面向浏览器重度用户的标签页治理工具。界面需要让用户快速判断扩展是否正在运行、当前标签页状态如何、规则是否可靠，以及暂存内容是否可找回。

本次设计采用“亮色精密控制台”方向：

- 以亮色为默认主题，不跟随系统深色模式自动变黑。
- 保持高信息密度，适合在浏览器 popup 的有限空间里反复使用。
- 用低饱和绿色作为运行状态和主操作色，配合少量蓝色表达“保留/固定”等特殊状态。
- 使用细边框、半透明面板、网格纹理和轻微阴影建立层次，避免厚重卡片和营销式布局。
- 所有视觉改造只服务现有功能，不改变规则匹配、存储、清理、暂存等业务行为。

## 入口与尺寸

popup 入口位于：

- `entrypoints/popup/index.html`
- `entrypoints/popup/main.tsx`
- `entrypoints/popup/App.tsx`
- `entrypoints/popup/style.css`

真实浏览器扩展 popup 对初始尺寸比较敏感。如果入口内容没有及时撑开，可能只显示一个很小的白色方块。因此入口 HTML 和 CSS 都提供了尺寸兜底：

- `body` 固定宽度为 `800px`
- `#root` 固定宽度为 `800px`
- 最小高度为 `430px`

后续如果调整 popup 尺寸，应同时更新 `index.html`、`style.css` 和 `App.tsx` 中相关的宽高约束。

## 主题策略

当前设计固定使用亮色主题。

相关文件：

- `components/Providers.tsx`
- `components/theme-provider.tsx`
- `assets/tailwind.css`
- `entrypoints/popup/style.css`

`Provider` 中的 `ThemeProvider` 默认值为 `light`。`theme-provider.tsx` 只在显式使用 `system` 时监听系统深浅色变化，避免用户系统是深色时 popup 自动变成黑色。

`assets/tailwind.css` 仍保留 dark token，主要是为了不破坏现有组件的兼容性。但产品默认体验应以亮色为准。

## 色彩规范

主色调是偏绿色的清洁/运行色：

- 主色：`hsl(164 72% 34%)`
- 深色主色：`hsl(164 66% 42%)`
- 背景：浅灰绿渐变
- 文本：深墨绿色
- 边框：低对比灰绿色
- 危险操作：红色，仅用于删除等破坏性行为

状态表达：

- 运行中：绿色 pill
- 已暂停：灰色 pill
- 当前标签页：绿色边框/背景
- 始终保留：蓝色边框提示
- 已休眠：灰色状态点
- 正常：绿色状态点
- 规则脏数据：浅黄色提示条和表格行背景

避免事项：

- 不使用黑色主界面。
- 不使用大面积紫色、蓝紫渐变。
- 不使用过度装饰的背景球、光斑、营销式 hero。
- 不把工具型页面做成卡片堆叠的 landing page。

## 布局结构

popup 由三层构成：

1. 外层 Shell：固定尺寸、亮色渐变和细网格背景。
2. Header：品牌、全局开关、立即执行、主导航、设置入口。
3. Panel：标签页、规则、暂存箱、设置四个功能面板。

`App.tsx` 中主类名：

- `clean-tabs-shell`
- `clean-tabs-surface`
- `clean-header`
- `clean-panel`
- `clean-nav`
- `clean-nav-trigger`

Header 强调状态可见性。用户一眼能看到：

- 当前扩展是否运行
- 是否可以手动执行规则
- 当前在哪个功能页
- 设置入口

## 标签页视图

相关文件：

- `components/tabs.tsx`
- `entrypoints/popup/style.css`

标签页视图使用横向密集磁贴布局，适合展示大量标签页。

核心视觉元素：

- `window-card`：窗口容器
- `tab-board`：窗口列表滚动区
- `tab-tile`：单个标签页磁贴
- `group-label`：Chrome 标签组标签
- `tab-status-dot`：休眠/正常状态点
- `tab-popover`：悬浮详情

设计原则：

- 单个标签页只显示 favicon 和状态点，减少文本占用。
- 标签组用原生标签组颜色表达，保持和 Chrome 心智一致。
- hover 弹窗展示完整标题、短 URL、状态、上次访问、匹配规则和快捷操作。
- 当前标签页、始终保留、已休眠都用视觉状态区分。

维护注意：

- 不要让 `tab-tile` 根据 favicon 或 hover 状态改变尺寸。
- 标签组和标签页都要保持 inline 排布，避免大量标签页时布局跳动。
- 弹窗内容可以增加信息，但应避免超过 `384px` 宽度。

## 规则视图

相关文件：

- `components/Rules.tsx`
- `components/rules-table.tsx`
- `components/rules-editor.tsx`

规则视图分为表格模式和代码模式。

表格模式：

- 顶部工具栏包含搜索、新建、批量操作。
- 规则修改后显示 `dirty-banner`，提示用户保存。
- 表格容器使用 `rules-table-shell`，高度控制在 popup 内。
- URL、时间、动作、暂存、禁用等字段保持紧凑。

代码模式：

- 使用 CodeMirror。
- 编辑器外框使用 `rules-editor-frame`。
- 保存按钮和错误信息放在同一工具栏层级。

设计原则：

- 表格模式面向日常编辑。
- 代码模式面向批量粘贴和高级用户。
- 两种模式共享工具型视觉语言，不做完全不同的页面风格。

维护注意：

- 表格控件的行高、输入框高度、按钮高度应保持稳定。
- `dirty` 状态只作为 UI 提示，不应写入持久化规则。
- URL 匹配行为属于 `lib/match-pattern.ts`，不要在 UI 层重新定义。

## 暂存箱视图

相关文件：

- `components/stash.tsx`

暂存箱以可搜索表格为主。

核心元素：

- 搜索输入
- 多选删除
- URL/标题/favIcon 组合展示
- 关闭次数
- 最近关闭时间

设计原则：

- 暂存箱是恢复入口，不做复杂装饰。
- 搜索框需要明显但不抢主操作。
- 删除按钮只在有选中项时出现，降低误操作风险。

维护注意：

- 打开暂存 URL 的行为由 `browser.tabs.create` 完成。
- 删除暂存项必须通过 `setStash` 持久化，不要绕过 `lib/storage.ts`。

## 设置视图

相关文件：

- `components/settings.tsx`

设置页使用左右布局：

- 左侧：行为开关
- 右侧：插件信息、版本、GitHub 和 Chrome Web Store 链接

当前设置项：

- 允许关闭固定标签页
- 允许关闭标签组内的标签页

设计原则：

- 设置项用行级布局，标签在左，开关在右。
- 插件信息区独立成 about panel，避免和行为开关混在一起。
- 设置页不展示冗长说明，保持工具界面直接。

## 共享样式类

主要共享类定义在 `entrypoints/popup/style.css`。

Shell 与导航：

- `clean-tabs-shell`
- `clean-tabs-surface`
- `clean-header`
- `clean-brand`
- `clean-status-cluster`
- `clean-nav`
- `clean-nav-trigger`
- `clean-settings-trigger`

控件：

- `clean-switch`
- `clean-icon-button`
- `toolbar-icon-button`
- `help-icon-button`
- `primary-compact-button`
- `danger-compact-button`
- `clean-search`

表格与编辑器：

- `clean-table-shell`
- `rules-table-shell`
- `clean-table-row`
- `rule-row-dirty`
- `cell-input`
- `action-badge`
- `code-editor-frame`
- `rules-editor-frame`

标签页：

- `tab-board`
- `window-card`
- `tab-tile`
- `tab-tile-active`
- `tab-tile-keep`
- `tab-favicon`
- `group-label`
- `tab-popover`
- `tab-status-dot`

设置：

- `settings-grid`
- `settings-main`
- `setting-row`
- `about-panel`
- `about-link`

## 组件边界

遵循项目约定：

- `lib/` 放业务规则、存储、匹配、类型。
- `components/` 放 UI 和交互。
- `components/ui/` 放通用展示组件，不混入扩展业务逻辑。
- `entrypoints/background.ts` 负责 service worker、alarms、浏览器事件。
- `entrypoints/popup/App.tsx` 负责 popup shell 和页面切换。

后续 UI 迭代应优先复用现有样式类。只有当重复复杂度明显增加时，再抽出新的组件或样式抽象。

## 可访问性与交互

当前界面保留了大量 `title` 和 `aria-label`：

- 全局开关
- 立即执行规则
- 表格复选框
- 标签页操作按钮
- 设置入口
- 新建/批量操作按钮

维护建议：

- 图标按钮必须保留 `title`。
- 复选框必须保留 `aria-label`。
- 禁用状态应使用原生 `disabled`，不要只靠颜色。
- 文本不要压到按钮边缘，尤其是中文标签。

## 验证流程

普通 UI 改动建议运行：

```bash
./node_modules/.bin/tsc --noEmit
```

如果使用 `pnpm compile` 遇到本机 corepack/pnpm 启动问题，可以先用本地 tsc 做等价类型检查。

开发预览：

```bash
./node_modules/.bin/wxt --port 3000
```

注意：WXT 开发版扩展的 popup 会依赖本地 dev server。如果关闭 dev server，点击浏览器扩展图标可能显示空白或小白块。重新启动 WXT 或重新加载未打包扩展即可恢复。

生产构建：

```bash
./node_modules/.bin/wxt build
```

## 后续方向

可以继续优化的方向：

- 为规则表格增加更明确的空状态。
- 暂存箱增加按域名分组或快速恢复按钮。
- 标签页视图增加窗口折叠能力。
- 设置页增加主题选项，但默认仍应保持亮色。
- 为 popup 添加截图级视觉回归检查。

任何新增设计都应遵守：工具优先、亮色优先、信息密度适中、状态表达明确。
