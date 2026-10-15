# 悬浮提示 Tooltip

鼠标悬停或键盘聚焦时显示 VS Code Activity Bar 风格的文字提示，支持四向箭头和主题切换。

[API 参考](../api/generated/tooltip)

## 导入

```js
import 'nusys-ui/dist/vscode-tooltip/index.js';
```

也可以使用 `import 'nusys-ui'` 注册全部组件。

## 使用说明

将一个触发元素放入默认插槽，通过 `text` 提供纯文本提示，换行符会保留。`placement` 支持 `top`、`bottom`、`left`、`right`，默认 `bottom`，活动栏图标可使用 `right`。鼠标默认悬停 500 毫秒后显示，可通过 `delay` 调整，设置 `0` 即立即显示；聚焦立即显示，Escape 关闭并保持焦点。鼠标可移入提示面板，离开触发元素和面板、且触发元素失焦后关闭。`disabled` 仅禁用提示。

触发元素应能通过键盘聚焦，并提供自身的无障碍名称。组件会追加 `aria-describedby`，保留已有描述；替换触发元素或移除组件时清理关联。默认插槽仅支持一个触发元素，请勿将多个操作合并在同一个提示中。对于禁用按钮，可用具有 `tabindex="0"` 的外层元素作为触发元素。

提示使用 Popover API 显示在浏览器顶层，避免被滚动容器裁剪，需要支持该 API 的现代浏览器或 VS Code Webview。滚动、窗口大小和内容尺寸变化时更新位置；空间不足时默认尝试相反方向，随后限制面板和箭头在视口内。当所有候选方向均放不下面板时可能与触发元素重叠。目标被裁剪、隐藏、滚出视口或处于 `inert` 分组时隐藏提示。提示适用于简短说明，复杂表单和多步操作应使用对话框。

## 悬停保持与固定

鼠标可以缓慢经过箭头间隙进入面板，在面板内停留、选择文字或滚动时保持显示。面板中的固定按钮或链接获得键盘焦点时也保持显示。

点击右上角的 pinned 图标可固定提示，此时鼠标移开、触发元素失焦都不会关闭；再次点击取消固定后恢复普通悬停行为。通过 Tab 从触发元素进入固定按钮，按 Enter 或空格可切换固定状态。Escape 关闭提示并清除固定状态；如果焦点位于提示内部，会返回触发元素。

`pinned` 是可读写、反射到同名属性的布尔状态，可通过 `<vscode-tooltip pinned>` 或 `tip.pinned = true` 固定。禁用提示、清空内容、替换目标或移除组件会清除固定状态。固定仅控制关闭行为，仍跟随目标定位并遵守目标可见性规则；`open` 持续提示不受取消固定影响。固定按钮可通过 `::part(pin)` 调整样式。

## Markdown 与表格

设置 `markdown` 后，`text` 支持标题、强调、行内代码、代码块、列表、引用、链接和 Markdown 表格。未设置时仍按纯文本显示。长表格和代码在面板内滚动，可通过 `--vsc-tooltip-max-width` 调整可用宽度。

```html
<vscode-tooltip
  markdown
  text="**参数说明**&#10;&#10;| 名称 | 单位 |&#10;| --- | --- |&#10;| 基本风压 | kPa |"
  style="--vsc-tooltip-max-width: 420px"
>
  <vscode-button>查看参数</vscode-button>
</vscode-tooltip>
```

也可通过 JavaScript 设置多行内容：`tip.text = '**参数**\n\n说明内容'`。渲染使用 [markdown-it](https://markdown-it.github.io/markdown-it/)，禁用原始 HTML 并校验链接协议，HTML 标签按文字显示，`javascript:` 等危险链接不会生成可点击链接。无需注入脚本或额外样式，适用于 VS Code Webview CSP。无障碍描述使用解析后的文字，不向屏幕阅读器朗读 Markdown 标记。

## 不增加包装层的关联

通过 `for` 指向同一个 Document 或 ShadowRoot 内的元素 id，或通过 JavaScript 的 `target` 属性传入元素引用。优先级为 `target`、`for`、默认插槽。外部关联不改变原控件的父子关系，可用于 radio-group 的直接子节点、flex/grid 布局和带有 `slot` 的控件。目标经 `v-if` 重建后会重新关联；移除组件时释放观察器、监听器与无障碍描述。

```html
<vscode-textfield id="pressure" label="基本风压"></vscode-textfield>
<vscode-tooltip for="pressure" text="请输入基本风压" delay="0"></vscode-tooltip>
```

`vscode-textfield` 内部输入框获得焦点时，在支持 `ariaDescribedByElements` 的浏览器中追加跨 Shadow DOM 的描述引用，失焦或移除提示时恢复原描述。

## ext-engineer 迁移

本组件参考该项目的 `SCTooltip.vue`、`SCHoverSurface.vue` 和字段提示定位需求。替换 `SCTooltip` 时可以使用默认插槽；如果原封装依赖克隆节点保留布局，应使用外部 `for` 关联，保留现有 class、style、事件与 slot 在原触发元素上。`delay="0"` 可保留原封装的立即显示行为，无需再通过 Vue 作用域插槽分发 `tooltipId`。

字段说明与校验使用 `open` 持续显示，将错误和说明合并成换行文本。`fallbacks` 是仅通过 JavaScript 设置的数组，可保留字段提示“右 → 下 → 上”的回退顺序；宽度通过主题无关的 CSS 变量调整。持续提示被 Escape 关闭后不会因内容变化重新打开；将 `open` 先关闭再打开，或再次悬停、聚焦目标可恢复。错误播报仍应由应用中的 `aria-live` 区域承担。

```html
<vscode-tooltip
  id="pressure-tip"
  for="pressure"
  placement="right"
  open
  text="数值必须大于零&#10;说明：单位为 kPa"
  style="--vsc-tooltip-min-width: 160px; --vsc-tooltip-max-width: 260px"
></vscode-tooltip>
```

```js
document.querySelector('#pressure-tip').fallbacks = ['bottom', 'top'];
```

Vue 模板中用 `:text="tipText"`、`:open="hasTip"`、`:disabled="disabled"` 和 `:fallbacks.prop="['bottom', 'top']"` 绑定属性。继续保留项目现有的自定义元素配置。此替换需要在消费项目中进行，组件库不会自动修改其 Vue 封装。

## 交互示例

使用右上角导航栏的全站主题和尺寸选择查看浅色、深色和高对比度效果。悬停按钮或使用 Tab 聚焦，按 Escape 关闭提示；切换主题和尺寸时保留当前交互状态。

<ExamplePreview example="tooltip" />

```html
<vscode-tooltip text="搜索 (Ctrl+Shift+F)" placement="right">
  <vscode-button icon="search" aria-label="搜索" icon-only></vscode-button>
</vscode-tooltip>
```

## 功能场景

下列场景展示外部字段关联、持续提示、元素引用切换、禁用状态，以及 Markdown 表格和固定交互，并接入综合体验页。

<ComponentExamples component="tooltip" />

## 主题

面板与箭头使用 `--vscode-editorHoverWidget-background`、`--vscode-editorHoverWidget-foreground`、`--vscode-editorHoverWidget-border`，阴影使用 `--vscode-widget-shadow`，高对比度描边使用 `--vscode-contrastBorder`。在 VS Code Webview 中随主题变量自动变化；独立网页需由应用注入主题变量，优先回退到编辑器背景和前景色，全部未设置时使用深色回退值。默认最大宽度为 320px，可通过 `--vsc-tooltip-min-width`、`--vsc-tooltip-max-width` 和 `::part(tooltip)` 调整。

[主题与图标](../guide/theming)
