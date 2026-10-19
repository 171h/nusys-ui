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

| 字段          | 类型                                             | 说明                                         |
| ------------- | ------------------------------------------------ | -------------------------------------------- |
| `type`        | `'button' \| 'splitButton' \| 'dropdown'`        | 按钮类型，默认为 `button`                    |
| `command`     | `string`                                         | 命令标识，原样放入 `vsc-ribbon-command` 事件 |
| `arguments`   | `unknown[]`                                      | 命令参数，原样放入事件详情                   |
| `title`       | `string`                                         | 按钮或菜单项标题                             |
| `icon`        | 字符串、`{light, dark}` 或 `{codicon}` / `{url}` | 图标声明                                     |
| `menu`        | `VscRibbonMenu`                                  | 下拉菜单，支持递归子菜单                     |
| `size`        | `'full' \| 'half' \| 'third'`                    | 主区域尺寸，默认为 `full`                    |
| `style`       | `'iconAndLabel' \| 'icon'`                       | 紧凑样式，默认为 `iconAndLabel`              |
| `responsive`  | `VscRibbonResponsiveStep[]`                      | 宽度不足时依次尝试的尺寸与样式               |
| `pressed`     | `boolean`                                        | 切换按钮的按下状态，输出 `aria-pressed`      |
| `disabled`    | `boolean`                                        | 禁用项                                       |
| `placeholder` | `boolean`                                        | 占位项，可见但不可执行                       |
| `keybinding`  | `string`                                         | 菜单项右侧的快捷键文字                       |
| `heading`     | `boolean`                                        | 在菜单或面板中渲染为不可交互的分组标题       |
| `description` | `string`                                         | 菜单项、面板项的补充说明，支持多行文本       |
| `preview`     | `string`                                         | 图库项预览图地址，推荐 `data:` URI           |
| `separator`   | `boolean`                                        | 在菜单中渲染为分隔线                         |
| `tooltip`     | `string`                                         | 鼠标悬停提示，默认使用标题                   |

| 菜单字段  | 类型                             | 说明                                |
| --------- | -------------------------------- | ----------------------------------- |
| `items`   | `VscRibbonItem[]`                | 菜单项，可继续嵌套 `menu`           |
| `layout`  | `'menu' \| 'panel' \| 'gallery'` | 竖排菜单、Word 风格面板或图库式面板 |
| `title`   | `string`                         | 面板标题                            |
| `columns` | `number`                         | 面板或图库列数，限制在 1–8          |
| `custom`  | `{html, css?, width?, height?}`  | 沙箱 iframe 中的静态内容            |
| `footer`  | `VscRibbonItem[]`                | 面板底部操作区条目                  |

## 响应式与折叠

1. 在各分组内，把初始尺寸、样式及完整 `responsive` 链相同的按钮归为一批；
   宽度不足时整批逐档降级，普通按钮、下拉与分割按钮不按类型拆批；
2. 仍溢出时从右向左折叠整个功能组；折叠入口是带分组图标与标题的溢出下拉按钮，
   点击后在弹层中按声明的原始布局完整呈现该组全部按钮，可直接执行命令；
3. 全部折叠后仍溢出时，内容区两端显示悬浮滚动按钮，原生横向滚动条始终隐藏。

未声明 `responsive` 的按钮保持原布局，只参与整组折叠；折叠后的弹层不复用降级
或紧凑布局，始终按原始尺寸与样式渲染。

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

- `dropdown` 整体点击展开菜单，`splitButton` 上方主按钮执行命令、下方或右侧
  触发区展开菜单，两者都支持键盘；
- 菜单支持递归子菜单、返回导航、快捷键文字、分隔线与禁用占位项；
- `menu.layout: 'panel'` 渲染带标题栏与关闭按钮的面板，`columns` 控制列数；
- `menu.layout: 'gallery'` 渲染图库式面板：每个条目由 `preview` 预览图（或图标）、
  标题与说明组成大尺寸格子，适合样式库、艺术字等可视化选项；
- `menu.footer` 在面板底部渲染整行操作区，支持图标、快捷键与命令，参与键盘导航；
- `menu.custom` 的 HTML 在无脚本、禁止网络的沙箱 iframe 中渲染，图片仅允许
  `data:` URI，适合放置静态说明或图例，不要依赖脚本或外部请求。

菜单选项文字默认左对齐，快捷键与子菜单箭头靠右，长标题单行截断。

菜单项支持 `heading: true` 渲染为不可交互的分组标题（不进入 `menuitem` 语义与
键盘导航），`description` 会在标题下方显示补充说明并支持换行，适用于设置预设、
规范说明等富信息条目。面板中的分组标题会横跨整行显示。

## 对话框启动器

设置 `group.dialogLauncher: true` 后，功能组右下角会显示对话框启动器；也可以
传入 `{title, icon}` 自定义无障碍名称与图标。启动器使用 `aria-haspopup="dialog"`，
点击时派发 `vsc-ribbon-dialog`，由宿主打开分组对应的设置对话框。分组折叠为
溢出下拉入口后，启动器会保留在弹层右下角，行为与行内启动器一致。

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

| 部件                                                                                                                      | 说明                                                                     |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `base` / `tabs` / `tab` / `content`                                                                                       | 功能区根容器、标签栏、标签与内容区                                       |
| `group` / `group-title` / `items` / `group-button` / `group-dialog`                                                       | 功能组、分组标题、六轨网格、折叠入口与对话框启动器                       |
| `item` / `item-primary` / `item-trigger`                                                                                  | 普通按钮与分割按钮的主命令、菜单触发区                                   |
| `menu` / `menu-items` / `menu-item` / `menu-separator` / `menu-split` / `menu-back` / `menu-heading` / `menu-description` | 下拉菜单容器、列表、菜单项、分隔线、分割行、返回入口、分组标题与说明文字 |
| `panel-header` / `panel-close` / `panel-body` / `panel-grid` / `panel-item` / `panel-heading` / `panel-description`       | 面板标题栏、关闭按钮、内容区、格子网格、格子、面板分组标题与说明文字     |
| `panel-footer` / `panel-footer-item`                                                                                      | 面板底部操作区与整行操作项                                               |
| `gallery` / `gallery-item` / `gallery-preview` / `gallery-heading` / `gallery-description`                                | 图库网格、图库格子、预览区、分组标题与说明文字                           |
| `gallery-strip` / `gallery-viewport` / `gallery-track` / `gallery-tile` / `gallery-scroll`                                | 组内图库预览条、滚动视口与轨道、图库格子与左右滚动按钮                   |
| `group-popover` / `scroll-button` / `custom-content`                                                                      | 折叠分组弹层、悬浮滚动按钮与沙箱内容 iframe                              |

## 功能场景

下列场景补充状态、组合约束、数据操作和交互边界。每项列出覆盖的公开功能，代码视图可直接查阅实际运行代码。

<ComponentExamples component="ribbon" />

## 相关指南

[功能区集成与迁移](../ribbon) · [主题与图标](../guide/theming) · [常见问题](../guide/faq)
