# 功能区部件图鉴

功能区由标签栏、功能组、按钮、菜单、面板与图库等部件组成。本页为
[功能区组件](./components/ribbon) 中的每个唯一 CSS part 提供局部截图、说明和
配置示例：截图中红色描边标出该部件的实际范围，代码块展示触发或定位该部件的公共
配置方式。

> 本页截图与代码由 `pnpm docs:ribbon-parts` 从 `scripts/generate-ribbon-parts.mjs`
> 中的部件清单生成；新增或调整部件时请同步更新脚本后重新生成。

可使用 `vscode-ribbon::part(名称)` 从外部定制样式，或在调试时用
`ribbon.shadowRoot.querySelector('[part~="名称"]')` 定位元素。完整名称列表见
[功能区 CSS 部件](./components/ribbon#css-部件)。

## 框架与标签

### 功能区根容器 `base` {#part-base}

<img src="/ribbon-parts/base.png" alt="功能区根容器部件截图">

组件最外层 header，承载标签栏与内容区，是整块功能区的样式与尺寸基准。

```html
<vscode-ribbon id="ribbon" tablist-label="示例功能区"></vscode-ribbon>

/* 通过 part 定制外观 */ vscode-ribbon::part(base) { border-bottom: 1px solid
var(--vscode-panel-border); }
```

### 标签栏 `tabs` {#part-tabs}

<img src="/ribbon-parts/tabs.png" alt="标签栏部件截图">

标签、折叠按钮与插槽所在的一行，背景与分区与 VS Code 标题栏一致。

```html
<!-- 通过插槽在标签栏两端插入自定义内容 -->
<vscode-ribbon>
  <button slot="tabs-end">帮助</button>
</vscode-ribbon>
```

### 标签列表 `tabs-list` {#part-tabs-list}

<img src="/ribbon-parts/tabs-list.png" alt="标签列表部件截图">

承载所有标签按钮的 tablist 容器，负责方向键、Home/End 键盘导航。

```js
const ribbon = document.querySelector('vscode-ribbon');
ribbon.tabs = [
  {id: 'home', title: '开始'},
  {id: 'insert', title: '插入'},
];
```

### 标签按钮 `tab` {#part-tab}

<img src="/ribbon-parts/tab.png" alt="标签按钮部件截图">

单个功能区标签，支持点击、方向键、Home/End 与双击折叠或展开。

```js
tabs: [
  {id: 'home', title: '开始', default: true},
  {id: 'insert', title: '插入'},
  {id: 'design', title: '设计'},
];
```

### 折叠按钮 `collapse-button` {#part-collapse-button}

<img src="/ribbon-parts/collapse-button.png" alt="折叠按钮部件截图">

折叠/展开整个功能区的按钮；折叠后单击任意标签以浮层显示内容。

```js
const ribbon = document.querySelector('vscode-ribbon');
ribbon.collapsible = true; // 显示折叠按钮
ribbon.collapsed = false; // 当前是否折叠
```

### 内容区 `content` {#part-content}

<img src="/ribbon-parts/content.png" alt="内容区部件截图">

标签内容与下拉浮层的公共容器，负责整体高度、裁剪与浮层定位。

```css
/* 调整功能区内容区高度 */
vscode-ribbon {
  --vsc-ribbon-content-height: 112px;
}

vscode-ribbon::part(content) {
  overflow: visible;
}
```

### 横向滚动视口 `scroll-viewport` {#part-scroll-viewport}

<img src="/ribbon-parts/scroll-viewport.png" alt="横向滚动视口部件截图">

承载功能组的横向滚动视口；空间不足时先折叠分组，再显示两端滚动按钮。

```css
vscode-ribbon::part(scroll-viewport) {
  overflow-x: auto;
  scrollbar-width: thin;
}
```

### 功能组容器 `groups` {#part-groups}

<img src="/ribbon-parts/groups.png" alt="功能组容器部件截图">

横向排列所有功能组的容器，是整组折叠与宽度测量的依据。

```css
vscode-ribbon::part(groups) {
  gap: 2px;
}
```

### 滚动按钮 `scroll-button` {#part-scroll-button}

<img src="/ribbon-parts/scroll-button.png" alt="滚动按钮部件截图">

全部可折叠分组的折叠后仍溢出时出现的悬浮滚动按钮，点击或按住可横向滚动内容。

```css
vscode-ribbon::part(scroll-button) {
  background: var(--vscode-editor-background);
  color: var(--vscode-icon-foreground);
}
```

## 功能组与按钮

### 功能组 `group` {#part-group}

<img src="/ribbon-parts/group.png" alt="功能组部件截图">

单个功能区分组，包含按钮网格、分组标题与可选的对话框启动器。

```js
groups: [
  {
    id: 'file',
    title: '文件',
    items: [{command: 'save', title: '保存', icon: 'save'}],
  },
];
```

### 分组标题 `group-title` {#part-group-title}

<img src="/ribbon-parts/group-title.png" alt="分组标题部件截图">

功能组底部的分组名称，同时作为折叠后整组入口的名称来源。

```js
{
  id: 'file',
  title: '文件', // 显示在功能组底部
  items: [],
}
```

### 分组折叠入口 `group-button` {#part-group-button}

<img src="/ribbon-parts/group-button.png" alt="分组折叠入口部件截图">

宽度不足时将整个分组折叠为带图标与标题的下拉入口；点击后在弹层中按原布局展示按钮。

```js
// 宽度不足时自动生成折叠入口；也可主动折叠：
const ribbon = document.querySelector('vscode-ribbon');
ribbon.foldGroup('file');
```

### 对话框启动器 `group-dialog` {#part-group-dialog}

<img src="/ribbon-parts/group-dialog.png" alt="对话框启动器部件截图">

功能组右下角的扩展按钮，默认图标为旋转 90° 的 link-external，点击派发 vsc-ribbon-dialog。

```js
{
  id: 'file',
  title: '文件',
  dialogLauncher: true, // 默认图标
  // dialogLauncher: {title: '打开文件设置', icon: 'settings-gear'},
  items: [],
}
```

### 按钮网格 `items` {#part-items}

<img src="/ribbon-parts/items.png" alt="按钮网格部件截图">

功能组内部六轨按钮网格，full / half / third 三种高度可在同一分组中混排。

```js
items: [
  {command: 'save', title: '保存', icon: 'save', size: 'full'},
  {command: 'undo', title: '撤销', icon: 'discard', size: 'half'},
  {command: 'redo', title: '重做', icon: 'redo', size: 'half'},
];
```

### 命令按钮 `item` {#part-item}

<img src="/ribbon-parts/item.png" alt="命令按钮部件截图">

单个功能区命令按钮，支持普通按钮、下拉按钮与分割按钮三种类型。

```js
items: [
  {command: 'undo', title: '撤销', icon: 'discard'},
  {type: 'dropdown', title: '插入图片', icon: 'file-media', menu: {items: []}},
];
```

### 分割按钮主命令 `item-primary` {#part-item-primary}

<img src="/ribbon-parts/item-primary.png" alt="分割按钮主命令部件截图">

分割按钮的上方主区域，直接点击执行主命令。

```js
{
  type: 'splitButton',
  command: 'save', // 主区域命令
  title: '保存',
  icon: 'save',
  menu: {items: [{command: 'save-as', title: '另存为…', icon: 'save-as'}]},
}
```

### 分割按钮触发区 `item-trigger` {#part-item-trigger}

<img src="/ribbon-parts/item-trigger.png" alt="分割按钮触发区部件截图">

分割按钮的下方触发区，点击展开菜单而不执行主命令。

```js
{
  type: 'splitButton',
  command: 'save',
  title: '保存',
  icon: 'save',
  menu: {items: [{command: 'save-as', title: '另存为…'}]},
}
```

### 分组溢出弹层 `group-popover` {#part-group-popover}

<img src="/ribbon-parts/group-popover.png" alt="分组溢出弹层部件截图">

折叠分组后点击入口打开的 dialog，按分组声明的原始布局展示全部按钮，并保留启动器。

```js
// 折叠入口自动打开弹层；弹层内容无需额外配置，
// 始终按该功能组的原始 items 布局渲染。
```

## 菜单与子菜单

### 下拉菜单浮层 `menu` {#part-menu}

<img src="/ribbon-parts/menu.png" alt="下拉菜单浮层部件截图">

下拉按钮、菜单项子菜单共用的浮层容器，支持 menu / panel / gallery 三种布局。

```js
{
  type: 'dropdown',
  title: '插入图片',
  icon: 'file-media',
  menu: {
    layout: 'menu', // 默认竖排菜单
    items: [{command: 'local', title: '此设备…', icon: 'folder-opened'}],
  },
}
```

### 菜单列表 `menu-items` {#part-menu-items}

<img src="/ribbon-parts/menu-items.png" alt="菜单列表部件截图">

竖排菜单项的列表容器，负责分隔线与菜单项的排列。

```js
menu: {
  items: [
    {heading: true, title: '插入图片来自'},
    {command: 'local', title: '此设备…', icon: 'folder-opened'},
    {separator: true},
  ],
}
```

### 菜单项 `menu-item` {#part-menu-item}

<img src="/ribbon-parts/menu-item.png" alt="菜单项部件截图">

单个菜单项，显示图标、标题、快捷键与子菜单箭头，支持键盘导航。

```js
{
  command: 'local',
  title: '此设备…',
  icon: 'folder-opened',
  keybinding: 'D',
  description: '从当前设备选择图片',
}
```

### 菜单分割行 `menu-split` {#part-menu-split}

<img src="/ribbon-parts/menu-split.png" alt="菜单分割行部件截图">

菜单中的分割按钮行，把主命令与子菜单触发区分成上下两个按钮。

```js
menu: {
  items: [
    {
      type: 'splitButton',
      command: 'ringlock',
      title: '盘扣式',
      icon: 'layers',
      menu: {items: [{command: 'coupler', title: '扣件式'}]},
    },
  ],
}
```

### 菜单分割触发区 `menu-split-trigger` {#part-menu-split-trigger}

<img src="/ribbon-parts/menu-split-trigger.png" alt="菜单分割触发区部件截图">

菜单分割行的下方触发区，展开该菜单项的子菜单。

```js
menu: {
  items: [
    {
      type: 'splitButton',
      command: 'ringlock',
      title: '盘扣式',
      icon: 'layers',
      menu: {items: [{command: 'coupler', title: '扣件式'}]},
    },
  ],
}
```

### 菜单返回入口 `menu-back` {#part-menu-back}

<img src="/ribbon-parts/menu-back.png" alt="菜单返回入口部件截图">

replace 子菜单模式下的返回按钮，返回上一级菜单；flyout 模式不显示该入口。

```js
menu: {
  items: [
    {
      title: '更多来源',
      icon: 'ellipsis',
      menu: {items: [{command: 'camera', title: '相机…'}]},
    },
  ],
}
// 默认 submenuMode: 'replace' 时出现返回入口
```

### 菜单分隔线 `menu-separator` {#part-menu-separator}

<img src="/ribbon-parts/menu-separator.png" alt="菜单分隔线部件截图">

菜单项之间的不可交互分隔线，用于把命令按语义分成多个组。

```js
menu: {
  items: [
    {command: 'local', title: '此设备…'},
    {separator: true},
    {command: 'online', title: '联机图片…'},
  ],
}
```

### 菜单分组标题 `menu-heading` {#part-menu-heading}

<img src="/ribbon-parts/menu-heading.png" alt="菜单分组标题部件截图">

不可聚焦、不可点击的菜单分组标题，一个菜单可声明多个标题分组。

```js
menu: {
  items: [
    {heading: true, title: '插入图片来自'},
    {command: 'local', title: '此设备…'},
    {heading: true, title: '最近使用'},
    {command: 'recent', title: '最近插入的图片'},
  ],
}
```

### 菜单说明文字 `menu-description` {#part-menu-description}

<img src="/ribbon-parts/menu-description.png" alt="菜单说明文字部件截图">

菜单项标题下方的补充说明，支持多行文本，适合设置预设与规范说明。

```js
{
  command: 'normal',
  title: '常规',
  icon: 'layout',
  description: '上下 2.54 厘米，左右 3.18 厘米',
}
```

### flyout 子菜单 `flyout` {#part-flyout}

<img src="/ribbon-parts/flyout.png" alt="flyout 子菜单部件截图">

在父菜单旁展开的子菜单浮层，父菜单保持可见；右侧空间不足时自动翻到左侧。

```js
{
  title: '更多体系',
  icon: 'ellipsis',
  submenuMode: 'flyout', // 旁侧展开而不是替换当前菜单
  menu: {
    items: [{command: 'portal', title: '门式脚手架', icon: 'layers'}],
  },
}
```

## 面板与自定义内容

### 面板标题栏 `panel-header` {#part-panel-header}

<img src="/ribbon-parts/panel-header.png" alt="面板标题栏部件截图">

Word 风格面板顶部的标题与关闭按钮区域，标题由 menu.title 提供。

```js
menu: {
  layout: 'panel',
  title: '页边距',
  items: [{command: 'normal', title: '常规', icon: 'layout'}],
}
```

### 面板关闭按钮 `panel-close` {#part-panel-close}

<img src="/ribbon-parts/panel-close.png" alt="面板关闭按钮部件截图">

关闭整个面板的按钮，Escape 或点击外部同样关闭。

```js
menu: {
  layout: 'panel',
  title: '页边距',
  items: [], // 关闭按钮由面板自动生成
}
```

### 面板内容区 `panel-body` {#part-panel-body}

<img src="/ribbon-parts/panel-body.png" alt="面板内容区部件截图">

面板主体容器，承载自定义内容、格子网格与底部操作区。

```js
menu: {
  layout: 'panel',
  title: '页边距',
  items: [{command: 'normal', title: '常规'}],
  footer: [{command: 'more', title: '更多…'}],
}
```

### 面板格子网格 `panel-grid` {#part-panel-grid}

<img src="/ribbon-parts/panel-grid.png" alt="面板格子网格部件截图">

面板项的网格布局，列数由 menu.columns 控制。

```js
menu: {
  layout: 'panel',
  title: '页边距',
  columns: 3, // 面板列数
  items: [{command: 'normal', title: '常规', icon: 'layout'}],
}
```

### 面板操作项 `panel-item` {#part-panel-item}

<img src="/ribbon-parts/panel-item.png" alt="面板操作项部件截图">

面板内的单个操作项，支持图标、标题与说明文字。

```js
menu: {
  layout: 'panel',
  items: [
    {command: 'normal', title: '常规', icon: 'layout', description: '上下 2.54 厘米'},
  ],
}
```

### 面板分组标题 `panel-heading` {#part-panel-heading}

<img src="/ribbon-parts/panel-heading.png" alt="面板分组标题部件截图">

面板中横跨整行的分组标题，可带说明文字并使用多个标题分组。

```js
menu: {
  layout: 'panel',
  items: [
    {heading: true, title: '页边距预设', description: '选择预设或自定义数值'},
    {command: 'normal', title: '常规'},
  ],
}
```

### 面板说明文字 `panel-description` {#part-panel-description}

<img src="/ribbon-parts/panel-description.png" alt="面板说明文字部件截图">

面板项下方的补充说明，支持多行文本。

```js
menu: {
  layout: 'panel',
  items: [
    {command: 'normal', title: '常规', description: '上下 2.54 厘米，左右 3.18 厘米'},
  ],
}
```

### 面板底部操作区 `panel-footer` {#part-panel-footer}

<img src="/ribbon-parts/panel-footer.png" alt="面板底部操作区部件截图">

面板底部的整行操作区，用于放置“自定义…”“更多…”等低频操作。

```js
menu: {
  layout: 'panel',
  footer: [
    {command: 'custom-margins', title: '自定义页边距(A)…', icon: 'settings-gear', keybinding: 'A'},
  ],
}
```

### 面板底部操作项 `panel-footer-item` {#part-panel-footer-item}

<img src="/ribbon-parts/panel-footer-item.png" alt="面板底部操作项部件截图">

底部操作区内的单个操作项，参与面板键盘导航并显示快捷键。

```js
menu: {
  footer: [
    {command: 'custom-margins', title: '自定义页边距(A)…', icon: 'settings-gear'},
  ],
}
```

### 自定义内容 `custom-content` {#part-custom-content}

<img src="/ribbon-parts/custom-content.png" alt="自定义内容部件截图">

面板中的无脚本、禁网络沙箱 iframe，渲染 menu.custom 提供的静态 HTML，适合规范说明或图例。

```js
menu: {
  layout: 'panel',
  title: '脚手架规范',
  custom: {
    width: 360,
    height: 120,
    html: '<div style="padding:12px">规范说明或图例</div>',
  },
  items: [],
}
```

## 图库

### 图库网格 `gallery` {#part-gallery}

<img src="/ribbon-parts/gallery.png" alt="图库网格部件截图">

图库式菜单的格子网格，以较大预览图展示样式、艺术字等可视化选项。

```js
menu: {
  layout: 'gallery',
  columns: 3,
  items: [
    {command: 'style-normal', title: '正文', preview: 'data:image/svg+xml;utf8,...'},
  ],
}
```

### 图库格子 `gallery-item` {#part-gallery-item}

<img src="/ribbon-parts/gallery-item.png" alt="图库格子部件截图">

图库菜单内的单个预览格子，点击执行命令或打开下一级菜单。

```js
{
  command: 'style-title',
  title: '标题',
  preview: previewDataUri, // 可选，缺失时使用 icon
  description: '章节标题',
}
```

### 图库预览区 `gallery-preview` {#part-gallery-preview}

<img src="/ribbon-parts/gallery-preview.png" alt="图库预览区部件截图">

图库格子上方的预览图区域，显示 item.preview 或回退为彩色图标。

```js
{
  command: 'style-quote',
  title: '引用',
  preview: 'data:image/svg+xml;utf8,...',
}
```

### 图库分组标题 `gallery-heading` {#part-gallery-heading}

<img src="/ribbon-parts/gallery-heading.png" alt="图库分组标题部件截图">

图库网格中的分组标题，用来分隔多组可视化选项。

```js
menu: {
  layout: 'gallery',
  items: [
    {heading: true, title: '内置样式'},
    {command: 'style-normal', title: '正文', preview},
  ],
}
```

### 图库说明文字 `gallery-description` {#part-gallery-description}

<img src="/ribbon-parts/gallery-description.png" alt="图库说明文字部件截图">

图库格子标题下方的补充说明，适合描述样式用途。

```js
{
  command: 'style-normal',
  title: '正文',
  description: '默认正文样式',
  preview,
}
```

### 组内图库预览条 `gallery-strip` {#part-gallery-strip}

<img src="/ribbon-parts/gallery-strip.png" alt="组内图库预览条部件截图">

group.layout: gallery 时功能组内的横向图库容器，包含滚动按钮与视口。

```js
{
  id: 'format',
  title: '文档格式',
  layout: 'gallery', // 图库布局
  items: [{command: 'format-1', title: '格式 1', preview}],
}
```

### 组内图库视口 `gallery-viewport` {#part-gallery-viewport}

<img src="/ribbon-parts/gallery-viewport.png" alt="组内图库视口部件截图">

可横向滚动的图库视口，隐藏原生滚动条，由左右按钮滚动。

```js
{
  id: 'format',
  title: '文档格式',
  layout: 'gallery',
  items: [], // 视口与滚动由组件内部处理
}
```

### 组内图库轨道 `gallery-track` {#part-gallery-track}

<img src="/ribbon-parts/gallery-track.png" alt="组内图库轨道部件截图">

横向排列组内图库格子的轨道，宽度随格子数量增长。

```js
// 通过 items 数量控制轨道宽度；滚动由 gallery-scroll 按钮触发。
```

### 组内图库格子 `gallery-tile` {#part-gallery-tile}

<img src="/ribbon-parts/gallery-tile.png" alt="组内图库格子部件截图">

图库功能组内的单个格子，显示预览图与标题，点击执行命令。

```js
{
  id: 'format',
  title: '文档格式',
  layout: 'gallery',
  items: [{command: 'format-1', title: '格式 1', preview}],
}
```

### 组内图库滚动按钮 `gallery-scroll` {#part-gallery-scroll}

<img src="/ribbon-parts/gallery-scroll.png" alt="组内图库滚动按钮部件截图">

组内图库预览条左右两端的滚动按钮，点击按视口宽度横向滚动。

```js
// 滚动按钮由 group.layout: gallery 自动生成，无需额外配置。
```
