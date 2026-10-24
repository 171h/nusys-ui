# 功能区 Ribbon

标签、分组、命令按钮、下拉菜单、面板与响应式折叠。

[API 参考](../api/generated/ribbon)

## 导入

```js
import 'nusys-ui/dist/vscode-ribbon/index.js';
```

也可以使用 `import 'nusys-ui'` 注册全部组件。

## 使用说明

`vscode-ribbon` 是数据驱动的功能区组件：通过 JavaScript 属性 `tabs` 传入
`VscRibbonTab[]`，组件负责渲染标签栏、功能组、六轨按钮网格、下拉菜单与
响应式降级。组件不执行命令，激活按钮或菜单项时派发 `vsc-ribbon-command`，
由宿主根据 `command` 与 `arguments` 调用实际业务。

```html
<vscode-ribbon id="ribbon" tablist-label="项目功能区"></vscode-ribbon>
```

```js
const ribbon = document.querySelector('#ribbon');
ribbon.tabs = [
  {
    id: 'home',
    title: '开始',
    default: true,
    groups: [
      {
        id: 'file',
        title: '文件',
        items: [
          {command: 'open', title: '打开', icon: 'folder-opened', size: 'half'},
          {
            command: 'save',
            title: '保存',
            icon: 'save',
            size: 'half',
            keybinding: 'Ctrl+S',
          },
        ],
      },
    ],
  },
];

ribbon.addEventListener('vsc-ribbon-command', (event) => {
  const {command, arguments: args, item} = event.detail;
  console.log(command, args, item.title);
});
```

命令按钮获得焦点后按 Enter 或空格即可触发；带有菜单的按钮还可以按
ArrowDown / ArrowUp 打开菜单并聚焦首项或末项。

按钮、菜单项以及折叠、滚动、关闭等控件都使用 Codicon 图标。宿主页面需要按
[主题与图标](../guide/theming) 的说明，以固定 id `vscode-codicon-stylesheet`
引入 `codicons.css`；组件会把该样式表链接与 nonce 复制到影子根。缺少样式表、
字体文件或 CSP 授权时图标不会显示。

## 交互示例

使用右上角导航栏的全站主题和尺寸选择，使用鼠标或键盘操作。代码视图包含此预览实际执行的 HTML、CSS 与 JavaScript。

<ExamplePreview example="ribbon" />

## 配置结构

层级固定为 `tabs[] → groups[] → items[]`，子项均支持 `order` 排序，缺省排序
按标题或 id。字符串图标默认按 Codicon 名称解析，`./icon.svg`、`data:` 与
`http(s):` 地址按图片渲染。

| 字段      | 类型               | 说明                                       |
| --------- | ------------------ | ------------------------------------------ |
| `id`      | `string`           | 标签标识，必须唯一                         |
| `title`   | `string`           | 标签标题                                   |
| `default` | `boolean`          | 是否作为初始标签，没有声明时使用第一个标签 |
| `groups`  | `VscRibbonGroup[]` | 标签内的功能组                             |

| 字段             | 类型                         | 说明                                       |
| ---------------- | ---------------------------- | ------------------------------------------ |
| `id`             | `string`                     | 分组标识，只需在标签内唯一；缺省时自动生成 |
| `title`          | `string`                     | 分组标题，同时作为分组折叠入口的名称       |
| `items`          | `VscRibbonItem[]`            | 分组内的按钮                               |
| `layout`         | `'default' \| 'gallery'`     | 六轨按钮网格或横向图库布局，默认为默认布局 |
| `dialogLauncher` | `boolean \| {title?, icon?}` | 右下角对话框启动器；点击派发对话框事件     |

设置 `group.layout: 'gallery'` 时，分组按横向图库渲染：每个按钮使用 `preview`
预览图（缺失时回退为图标）、标题与命令，右侧箭头按钮可横向滚动浏览；图库分组
会随容器伸展，宽度不足时与其他分组相同，折叠为溢出下拉入口，弹层中以网格完整
保留全部预览格子。

| 字段          | 类型                                             | 说明                                                                                                         |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `type`        | `'button' \| 'splitButton' \| 'dropdown'`        | 按钮类型，默认为 `button`                                                                                    |
| `command`     | `string`                                         | 命令标识，原样放入 `vsc-ribbon-command` 事件                                                                 |
| `arguments`   | `unknown[]`                                      | 命令参数，原样放入事件详情                                                                                   |
| `title`       | `string`                                         | 按钮或菜单项标题                                                                                             |
| `icon`        | 字符串、`{light, dark}` 或 `{codicon}` / `{url}` | 图标声明                                                                                                     |
| `menu`        | `VscRibbonMenu`                                  | 下拉菜单，支持递归子菜单                                                                                     |
| `submenuMode` | `'replace' \| 'flyout'`                          | 子菜单展开方式，默认为 `replace`                                                                             |
| `size`        | `'full' \| 'half' \| 'third'`                    | 主区域尺寸，默认为 `full`                                                                                    |
| `style`       | `'iconAndLabel' \| 'icon'`                       | 紧凑样式，默认为 `iconAndLabel`                                                                              |
| `responsive`  | `VscRibbonResponsiveStep[]`                      | 宽度不足时依次尝试的尺寸与样式                                                                               |
| `pressed`     | `boolean`                                        | 切换按钮的按下状态，输出 `aria-pressed`                                                                      |
| `disabled`    | `boolean`                                        | 禁用项                                                                                                       |
| `placeholder` | `boolean`                                        | 占位项，可见但不可执行                                                                                       |
| `keybinding`  | `string`                                         | 菜单项右侧的快捷键文字                                                                                       |
| `heading`     | `boolean`                                        | 在菜单或面板中渲染为不可交互的分组标题                                                                       |
| `description` | `string`                                         | 菜单项、面板项的补充说明，支持多行文本                                                                       |
| `preview`     | `string`                                         | 图库项预览图地址，推荐 `data:` URI                                                                           |
| `separator`   | `boolean`                                        | 在菜单中渲染为分隔线                                                                                         |
| `tooltip`     | `string`                                         | 主区域按钮的悬停提示，默认使用标题；菜单、面板与图库弹层中的选项不渲染悬停提示，补充信息请改用 `description` |

| 菜单字段  | 类型                             | 说明                                |
| --------- | -------------------------------- | ----------------------------------- |
| `items`   | `VscRibbonItem[]`                | 菜单项，可继续嵌套 `menu`           |
| `layout`  | `'menu' \| 'panel' \| 'gallery'` | 竖排菜单、Word 风格面板或图库式面板 |
| `title`   | `string`                         | 面板标题                            |
| `columns` | `number`                         | 面板或图库列数，限制在 1–8          |
| `custom`  | `{html, css?, width?, height?}`  | 沙箱 iframe 中的静态内容            |
| `footer`  | `VscRibbonItem[]`                | 面板底部操作区条目                  |

占满按钮高度的整高按钮，其图标统一取按钮高度的一半并保持正方形：默认按钮高度
`74px` 对应 `37px` 图标，可通过 `--vsc-ribbon-icon-size` 单独覆盖图标尺寸，或
调整 `--vsc-ribbon-items-height` 同时改变按钮与图标高度。

## 响应式与折叠

1. 在各分组内，把初始尺寸、样式及完整 `responsive` 链相同的按钮归为一批；
   宽度不足时整批逐档降级，普通按钮、下拉与分割按钮不按类型拆批；
2. 仍溢出时从右向左折叠整个功能组；折叠入口是带分组图标与标题的溢出下拉按钮，
   点击后在弹层中按声明的原始布局完整呈现该组全部按钮，可直接执行命令；弹层底部
   保留与功能区一致的分组标题和对话框启动器（如有），便于识别分组并打开设置；
3. 全部折叠后仍溢出时，内容区两端显示悬浮滚动按钮，原生横向滚动条始终隐藏。

未声明 `responsive` 的按钮保持原布局，只参与整组折叠；折叠后的弹层不复用降级
或紧凑布局，始终按原始尺寸与样式渲染。

分组只包含一个下拉按钮时，整组折叠会再套一层溢出下拉，因此这类分组跳过折叠、
保留原有下拉菜单结构；宽度仍不足时由两端滚动按钮兜底。

组件页的每个功能区示例都用两个嵌套的 `vscode-split-layout` 作为可拖动父容器：
右侧分隔条调整宽度，下方分隔条调整高度，双击分隔条恢复初始尺寸，并实时显示
容器尺寸。宽度变化会触发上述降级链，高度只决定容器可视区域。

`full` 按钮固定为“上图标、下标题”，忽略 `style`；`half` 与 `third` 可按
`style` 显示横向图文或纯图标。`third` 标题最多一行，`full` 与 `half` 最多两行。

## 折叠与持久化

设置 `collapsed` 可折叠按钮区；折叠后点击标签会打开覆盖层，点击外部或按
Escape 关闭，执行命令后也会关闭。折叠按钮、标签双击与覆盖层行为均会派发
`vsc-ribbon-collapse` 事件。

设置 `persist-state` 与 `storage-key` 后，组件会把折叠状态与最后标签写入
`localStorage`，页面刷新后恢复：

```html
<vscode-ribbon
  persist-state
  storage-key="project.ribbon"
  tablist-label="项目功能区"
></vscode-ribbon>
```

## 菜单、面板与自定义内容

- `dropdown` 整体点击展开菜单，`splitButton` 上方图标按钮执行命令、下方“标题 +
  下拉箭头”按钮展开菜单。垂直分割按钮的图标行、标题行与箭头行分别与相邻整高
  下拉按钮的对应行水平对齐，宽度按图标与标题内容自适应；主命令与触发区是两个
  独立按钮，悬停任一侧只激活该侧背景，同时组合按钮外边框与中间分格线一起高亮，
  未悬停时分格线不可见；
- 菜单支持递归子菜单、返回导航、快捷键文字、分隔线与禁用占位项；
- 子菜单默认以 `replace` 模式替换当前菜单，提供返回入口；设置
  `submenuMode: 'flyout'` 时会在父菜单右侧展开子菜单（空间不足时改为左侧），
  父菜单保持可见，ArrowLeft 或 Escape 先关闭子菜单再关闭父菜单；
- `menu.layout: 'panel'` 渲染带标题栏与关闭按钮的面板，`columns` 控制列数；
- `menu.layout: 'gallery'` 渲染图库式面板：每个条目由 `preview` 预览图（或图标）、
  标题与说明组成大尺寸格子，适合样式库、艺术字等可视化选项；
- `menu.footer` 在面板底部渲染整行操作区，支持图标、快捷键与命令，参与键盘导航；
- `menu.custom` 的 HTML 在无脚本、禁止网络的沙箱 iframe 中渲染，图片仅允许
  `data:` URI，适合放置静态说明或图例，不要依赖脚本或外部请求。

菜单选项文字默认左对齐，快捷键与子菜单箭头靠右，长标题单行截断。

菜单项支持 `heading: true` 渲染为不可交互的分组标题（不进入 `menuitem` 语义与
键盘导航），同一个菜单或面板可以出现多个分组标题，用于对菜单项分组；
`description` 会在标题下方显示补充说明并支持换行，适用于设置预设、规范说明等
富信息条目。面板中的分组标题会横跨整行显示。

## 对话框启动器

设置 `group.dialogLauncher: true` 后，功能组右下角会显示对话框启动器；传
`false` 或不设置则不显示。默认图标为 Codicon `link-external` 顺时针旋转 90°，
也可以传入 `{title, icon}` 自定义无障碍名称与图标（自定义图标不旋转）。启动器
使用 `aria-haspopup="dialog"`，点击时派发 `vsc-ribbon-dialog`，由宿主打开分组
对应的设置对话框。分组折叠为溢出下拉入口后，启动器会保留在弹层右下角，行为与
行内启动器一致。

```js
{
  id: 'layout',
  title: '布局',
  dialogLauncher: {title: '打开页面设置', icon: 'settings-gear'},
  items: [{command: 'margins', title: '页边距', icon: 'layout'}],
}
```

## 事件与方法

| 事件                  | 说明                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| `vsc-ribbon-command`  | 激活带命令的按钮或菜单项；详情包含 `command`、`arguments`、`item`、`tabId` |
| `vsc-ribbon-select`   | 活动标签变化；详情包含 `tabId`、`tab`                                      |
| `vsc-ribbon-collapse` | 功能区折叠或展开；详情包含 `collapsed`                                     |
| `vsc-ribbon-dialog`   | 点击分组对话框启动器；详情包含 `tabId`、`tab`、`groupId`、`group`          |

| 方法 / 属性                                     | 说明                                                           |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `tabs`                                          | 标签、分组与按钮声明                                           |
| `activeTabId`                                   | 当前标签 id，无匹配时使用 `default` 标签或第一个标签           |
| `collapsed`                                     | 折叠状态                                                       |
| `collapsible`                                   | 是否显示折叠按钮，默认为 `true`；设为 `false` 后功能区始终展开 |
| `selectTab(tabId)`                              | 程序切换到指定标签                                             |
| `collapse()` / `expand()` / `toggleCollapsed()` | 程序控制折叠状态                                               |
| `closeMenus()`                                  | 关闭下拉菜单、分组弹层与折叠覆盖层                             |
| `refreshLayout()`                               | 重新测量并执行一次响应式降级                                   |

## 键盘与无障碍

- 标签栏支持 ArrowLeft / ArrowRight / Home / End，活动标签使用 roving tabindex；
- 带有菜单的按钮支持 ArrowDown / ArrowUp 打开菜单并聚焦首项或末项；
- 菜单支持 ArrowDown / ArrowUp / Home / End 导航，ArrowRight 进入子菜单，
  ArrowLeft 返回上一层，Escape 关闭并恢复触发按钮焦点；
- 折叠分组入口支持 ArrowDown 打开分组弹层，Escape 关闭并恢复焦点；
- 对话框启动器通过标题提供无障碍名称，并声明 `aria-haspopup="dialog"`；
- 图标按钮通过 `label` 或标题提供无障碍名称，占位项输出禁用的可访问状态。

## CSS 部件

| 部件                                                                                                                                                        | 说明                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `base` / `tabs` / `tabs-list` / `tab` / `collapse-button` / `content`                                                                                       | 功能区根容器、标签栏、标签列表、标签、折叠按钮与内容区                                               |
| `scroll-viewport` / `groups`                                                                                                                                | 内容区横向滚动视口与功能组容器                                                                       |
| `group` / `group-title` / `items` / `group-button` / `group-dialog`                                                                                         | 功能组、分组标题、六轨网格、折叠入口与对话框启动器                                                   |
| `item` / `item-primary` / `item-trigger`                                                                                                                    | 普通按钮与分割按钮的主命令、菜单触发区                                                               |
| `menu` / `menu-items` / `menu-item` / `menu-split-trigger` / `menu-separator` / `menu-split` / `menu-back` / `menu-heading` / `menu-description` / `flyout` | 下拉菜单容器、列表、菜单项、分割触发区、分隔线、分割行、返回入口、分组标题、说明文字与 flyout 子菜单 |
| `panel-header` / `panel-close` / `panel-body` / `panel-grid` / `panel-item` / `panel-heading` / `panel-description`                                         | 面板标题栏、关闭按钮、内容区、格子网格、格子、面板分组标题与说明文字                                 |
| `panel-footer` / `panel-footer-item`                                                                                                                        | 面板底部操作区与整行操作项                                                                           |
| `gallery` / `gallery-item` / `gallery-preview` / `gallery-heading` / `gallery-description`                                                                  | 图库网格、图库格子、预览区、分组标题与说明文字                                                       |
| `gallery-strip` / `gallery-viewport` / `gallery-track` / `gallery-tile` / `gallery-scroll`                                                                  | 组内图库预览条、滚动视口与轨道、图库格子与左右滚动按钮                                               |
| `group-popover` / `scroll-button` / `custom-content`                                                                                                        | 折叠分组弹层（含分组标题与启动器）、悬浮滚动按钮与沙箱内容 iframe                                    |

## 组件名称与调试定位

下方每个名称对应一个稳定、唯一的 CSS part。名称既可用于 `::part()` 主题定制，
也可在开发调试时通过 Shadow DOM 的 `[part~="名称"]` 快速定位元素。每种部件的
实际外观、说明与配置示例见 [功能区部件图鉴](../ribbon-parts)：

```js
const ribbon = document.querySelector('vscode-ribbon');
const menuItem = ribbon.shadowRoot.querySelector('[part~="menu-item"]');
const flyout = ribbon.shadowRoot.querySelector('[part~="flyout"]');
```

```css
vscode-ribbon::part(tab) {
  font-weight: 600;
}
```

| 名称             | CSS part              | 说明                            |
| ---------------- | --------------------- | ------------------------------- |
| 功能区根容器     | `base`                | 组件外层 header                 |
| 标签栏           | `tabs`                | 标签与折叠按钮所在行            |
| 标签列表         | `tabs-list`           | 承载标签按钮的 tablist          |
| 标签按钮         | `tab`                 | 单个功能区标签                  |
| 折叠按钮         | `collapse-button`     | 折叠/展开功能区的按钮           |
| 内容区           | `content`             | 标签内容与浮层容器              |
| 横向滚动视口     | `scroll-viewport`     | 承载功能组的可横向滚动视口      |
| 功能组容器       | `groups`              | 横向排列所有功能组              |
| 滚动按钮         | `scroll-button`       | 内容区两端的悬浮滚动按钮        |
| 功能组           | `group`               | 单个功能区分组                  |
| 分组标题         | `group-title`         | 分组底部标题                    |
| 分组折叠入口     | `group-button`        | 折叠后的整组下拉入口            |
| 对话框启动器     | `group-dialog`        | 分组右下角扩展按钮              |
| 分组按钮网格     | `items`               | 六轨按钮网格                    |
| 按钮             | `item`                | 普通按钮、分割按钮或下拉按钮    |
| 分割按钮主命令   | `item-primary`        | 分割按钮上半部分                |
| 分割按钮触发区   | `item-trigger`        | 分割按钮下半部分                |
| 分组溢出弹层     | `group-popover`       | 折叠分组展开的 dialog           |
| 下拉菜单容器     | `menu`                | 菜单、面板或图库浮层            |
| 菜单列表         | `menu-items`          | 菜单项列表                      |
| 菜单项           | `menu-item`           | 单个菜单项（含分割行上/下按钮） |
| 菜单分割触发区   | `menu-split-trigger`  | 分割菜单项的下方触发区          |
| 菜单分隔线       | `menu-separator`      | 不可交互分隔线                  |
| 菜单分割行       | `menu-split`          | 分割菜单项容器                  |
| 菜单返回入口     | `menu-back`           | 进入子菜单后的返回按钮          |
| 菜单分组标题     | `menu-heading`        | 不可聚焦的菜单分组标题          |
| 菜单说明文字     | `menu-description`    | 菜单项标题下方的补充说明        |
| flyout 子菜单    | `flyout`              | 在父菜单旁展开的子菜单浮层      |
| 面板标题栏       | `panel-header`        | 面板顶部标题与关闭按钮区域      |
| 面板关闭按钮     | `panel-close`         | 关闭面板的按钮                  |
| 面板内容区       | `panel-body`          | 面板主体                        |
| 面板格子网格     | `panel-grid`          | 面板项网格                      |
| 面板项           | `panel-item`          | 面板内的单个操作项              |
| 面板分组标题     | `panel-heading`       | 面板内横跨整行的分组标题        |
| 面板说明文字     | `panel-description`   | 面板项补充说明                  |
| 面板底部操作区   | `panel-footer`        | 面板底部整行操作区              |
| 面板底部操作项   | `panel-footer-item`   | 底部操作区内的单个操作项        |
| 图库网格         | `gallery`             | 图库式菜单的格子网格            |
| 图库格子         | `gallery-item`        | 图库菜单内的单个预览格子        |
| 图库预览区       | `gallery-preview`     | 预览图或图标容器                |
| 图库分组标题     | `gallery-heading`     | 图库网格中的分组标题            |
| 图库说明文字     | `gallery-description` | 图库格子下的补充说明            |
| 组内图库预览条   | `gallery-strip`       | 功能组内的横向图库容器          |
| 组内图库视口     | `gallery-viewport`    | 可横向滚动的图库视口            |
| 组内图库轨道     | `gallery-track`       | 横向排列图库格子的轨道          |
| 组内图库格子     | `gallery-tile`        | 图库功能组内的单个格子          |
| 组内图库滚动按钮 | `gallery-scroll`      | 图库预览条左右滚动按钮          |
| 自定义内容       | `custom-content`      | 面板中的沙箱 iframe             |

## 国际化与支持边界

宿主负责解析 NLS 并提供标签、分组、命令、菜单、面板的 `title`、`description`、
`tooltip`、`keybinding` 与自定义内容。切换语言时重新赋值 `tabs`，并同步更新以下
公开属性（同名短横线特性也可用）：

| 属性                                   | 翻译范围                     |
| -------------------------------------- | ---------------------------- |
| `tablistLabel`                         | 标签栏名称                   |
| `collapseLabel` / `expandLabel`        | 折叠与展开按钮               |
| `openMenuLabel` / `openGroupLabel`     | 菜单与折叠分组入口的名称前缀 |
| `backLabel` / `closePanelLabel`        | 返回与关闭面板               |
| `scrollLeftLabel` / `scrollRightLabel` | 两端滚动按钮                 |
| `placeholderLabel`                     | 占位命令提示                 |
| `customContentLabel`                   | 沙箱 iframe 名称             |

这些属性默认使用中文，设置 `lang` 不会自动翻译。`dialogLauncher: true` 的默认名称
仍为 `打开“分组标题”对话框`；非中文宿主必须逐组设置
`dialogLauncher: {title: 'Open File dialog'}`，并在切换语言时更新，才能同时翻译
`title` 与 `aria-label`。业务命令标识与参数保持不变。

`sort-locale` / `sortLocale` 控制标题排序，缺省继承最近的 `lang`，最终回退到浏览器
语言，详见 [标题排序语言](../ribbon#标题排序语言)。中英文切换和长译文示例见下方功能场景。

目前只验证从左到右（LTR）的布局与键盘导航。RTL 的箭头方向、flyout 展开方向和
滚动语义尚未适配，暂不承诺 RTL 支持。

## 功能场景

下列场景补充状态、组合约束、数据操作和交互边界。每项列出覆盖的公开功能，代码视图可直接查阅实际运行代码。

<ComponentExamples component="ribbon" />

## 标签栏与内容面板分离布局

保留一个 `vscode-ribbon` 作为状态和事件的所有者，将可选的
`vscode-ribbon-panel` 放入另一容器，通过 JavaScript 元素引用关联：

```html
<div class="titlebar">
  <strong>◆ 应用标识</strong>
  <vscode-ribbon id="app-ribbon"></vscode-ribbon>
</div>
<vscode-ribbon-panel id="app-panel"></vscode-ribbon-panel>
```

```js
import 'nusys-ui/dist/vscode-ribbon/index.js';
const ribbon = document.querySelector('#app-ribbon');
const panel = document.querySelector('#app-panel');
ribbon.tabs = tabs;
ribbon.panel = panel;
// 恢复一体布局：ribbon.panel = null;
```

标题栏使用 flex 布局，应用标识占据左侧空间，面板直接放在下方容器的左侧。
两个组件可分别设置宽度；标签溢出独立横向滚动，功能降级、分组折叠和滚动始终
测量面板实际宽度。折叠覆盖层从面板容器顶部展开，不使用标题栏的起点或宽度。
`await ribbon.updateComplete` 同时等待关联面板完成渲染。

| 项目           | 行为                                                                                                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 状态归属       | `tabs`、`activeTabId`、`collapsed`、`theme`、翻译与持久化均配置在 Ribbon 上，面板不保存第二份状态。                                                                                                                          |
| 事件           | 四类 `vsc-ribbon-*` 事件仍仅由 Ribbon 派发，监听 Ribbon 或它的祖先；面板的 DOM 祖先不接收这些业务事件。                                                                                                                      |
| 关联范围       | 使用同一文档内的元素引用，可位于不同 Shadow DOM；不通过字符串 id 搜索。一个面板同时只能属于一个 Ribbon，重复占用或跨文档关联抛出错误且保留原关联。                                                                           |
| 连接与断开     | 面板尚未连接或暂时移除时回退到一体布局，重新插入后自动恢复；关闭临时菜单和覆盖层，保留活动标签及折叠状态。Ribbon 断开时清空面板并暂停监听，重连后恢复。                                                                      |
| 解除与重新关联 | 设置 `null` 或换成其他面板会清空旧容器、关闭弹层并重新测量；解除后面板可以交给其他 Ribbon。                                                                                                                                  |
| 样式           | 标签栏的 slots 和 parts 保留在 Ribbon；内容、分组、菜单等同名 parts 位于面板上，例如 `vscode-ribbon-panel::part(group)`。VS Code CSS 变量从面板所在容器继承，应在共同祖先配置主题；显式图标主题仍由 Ribbon 的 `theme` 决定。 |

面板与 Ribbon 的可见性按各自容器独立生效：给 `vscode-ribbon` 设置 `hidden`
或让它的祖先 `display: none` 只隐藏标签栏，`vscode-ribbon-panel` 仍会显示并保持
交互。需要整体隐藏时，应同时设置两个元素，或把它们放入同一个可隐藏的容器：

```js
function setAppRibbonVisible(visible) {
  ribbon.hidden = !visible;
  panel.hidden = !visible;
}
```

面板复用了 Ribbon 的 `--vsc-ribbon-items-height`、`--vsc-ribbon-icon-size` 和
`--vsc-ribbon-compact-icon-size` 尺寸变量，但这些变量在面板的 `:host` 中声明了
默认值，因此不能只设置在 Ribbon 或共同祖先上，需要直接覆盖面板元素：

```css
vscode-ribbon-panel {
  --vsc-ribbon-items-height: 60px;
  --vsc-ribbon-icon-size: 24px;
  --vsc-ribbon-compact-icon-size: 18px;
}
```

标签保留 `tablist` / `tab` 和单个选中项，面板保留 `tabpanel` 并以当前标签标题
独立命名。普通一体布局保留原有 `aria-controls` / `aria-labelledby`；分离布局
不输出跨影子根无法解析的 ID 引用，使用独立可访问名称和实际键盘路径。
辅助技术不会获得跨根的直接 ARIA 控制关系。左右方向键、Home、End 切换标签；
在标签上按 ↓ 进入面板入口，在入口上按 ↑ 返回活动标签；随后 Tab 可访问命令。
Escape 逐层返回混合子菜单、恢复触发焦点；折叠覆盖层关闭时回到活动标签。

示例中的两个滑块独立调整标签栏和功能面板宽度，并实时显示事件次数；可以切换
布局、折叠后点标签、逐层返回菜单，或点击工作区关闭覆盖层。可交互示例位于上方
[功能场景](#功能场景) 的“标签栏与内容面板分离布局”中。

## 相关指南

[功能区集成与迁移](../ribbon) · [主题与图标](../guide/theming) · [常见问题](../guide/faq)
