# 功能区集成与迁移

本页说明如何把 `vscode-ribbon` 集成到 VS Code Webview 或普通网页，以及如何从
`ext-engineer` 的 `contributes.ribbon` / `WebRibbon.vue` 平滑迁移。组件本身的
属性、事件与响应式规则参见 [功能区 Ribbon](./components/ribbon)。

## 最小集成

```html
<vscode-ribbon id="ribbon" tablist-label="项目功能区"></vscode-ribbon>
```

```js
import 'nusys-ui/dist/vscode-ribbon/index.js';

const ribbon = document.querySelector('#ribbon');
ribbon.tabs = tabs; // 来自 package.json 或后端接口
ribbon.addEventListener('vsc-ribbon-command', (event) => {
  const {command, arguments: args} = event.detail;
  vscode.postMessage({type: 'command', command, arguments: args});
});
```

组件只负责界面与交互，不执行命令。`command`、`arguments`、`item` 与 `tabId`
通过 `vsc-ribbon-command` 事件交给宿主，由宿主调用 `vscode.commands.executeCommand`
或自己的命令表。这样组件库不依赖 VS Code API，也能在浏览器演示和测试环境运行。

## 从 contributes.ribbon 迁移

| ext-engineer / VSCodemo                       | vscode-ribbon                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `package.json` 的 `contributes.ribbon.tabs[]` | `tabs` JavaScript 属性，结构一致：`tabs → groups → items`                                |
| `title` 使用 `%nls.key%`                      | 先按当前语言解析文案，再传入 `title`；组件不读取 NLS 文件                                |
| `icon: './src/node-vscode/assets/x.svg'`      | 传入打包后的 URL（例如 `new URL('./x.svg', import.meta.url).href`），或改用 Codicon 名称 |
| `command` + `executeWebCommand`               | `vsc-ribbon-command` 事件，由宿主的命令表执行                                            |
| `type: 'dropdown' / 'splitButton'`            | 同名 `type`，行为一致                                                                    |
| `menu.items` 递归菜单、`menu.layout: 'panel'` | 同名字段；面板支持 `title` 与 `columns`（1–8）                                           |
| `menu.custom` 沙箱内容                        | 同名字段，无脚本 iframe 中渲染；CSP 禁止网络连接                                         |
| `size` / `style` / `responsive`               | 同名字段；`style` 取 `iconAndLabel` 或 `icon`                                            |
| `responsiveMenu`                              | 同名字段；同 id 按钮在压缩后合并为下拉入口                                               |
| `placeholder`                                 | 同名字段；渲染为禁用项并提示“功能尚未实现”                                               |
| `localStorage` 中的折叠与活动标签             | `persist-state` + `storage-key`，默认不写入存储                                          |
| `when` / 命令 `enablement`                    | 组件不读取 Context Key；在传入 `tabs` 前过滤或设置 `disabled`                            |
| `arguments`                                   | 同名字段，原样放入事件详情                                                               |
| 网站追加的「视图」「帮助」标签                | 在传入 `tabs` 前自行合并，组件不修改数据                                                 |

迁移要点：

1. 保留 `tabs → groups → items` 的层级与大部分字段名，直接传入一般即可工作；
2. 相对图标路径需要先解析为 URL，`$(codicon)` 仍可直接使用，也支持
   `{light, dark}` 浅/深主题对象与 `{codicon}` / `{url}` 显式对象；
3. 折叠状态与活动标签默认不持久化，需要时显式设置 `persist-state` 与
   `storage-key`；
4. 命令执行改为事件监听，便于集中处理取消、错误与加载状态；
5. `when` / `enablement` 需要宿主在传入 `tabs` 前完成求值和过滤。

## 命令与状态

推荐把命令处理集中在宿主，并用事件详情更新应用状态：

```js
ribbon.addEventListener('vsc-ribbon-command', async (event) => {
  const {command, arguments: args} = event.detail;
  try {
    await execute(command, args);
    ribbon.closeMenus();
  } catch (error) {
    showError(error);
  }
});
```

- `vsc-ribbon-select`：活动标签变化，详情为 `{tabId, tab}`；
- `vsc-ribbon-collapse`：折叠状态变化，详情为 `{collapsed}`；
- 组件在折叠覆盖层中执行命令后会关闭覆盖层，折叠按钮与标签双击也会派发折叠事件。

需要程序控制时使用 `selectTab(tabId)`、`collapse()`、`expand()`、
`toggleCollapsed()`、`closeMenus()` 与 `refreshLayout()`。

## 响应式与容器宽度

功能区以自身宽度为基准执行降级链，而不是浏览器窗口宽度。把它放在
`vscode-split-layout`、侧边栏或可变宽度的面板中时，直接设置容器宽度即可；
`ResizeObserver` 会在尺寸变化后重新测量。若数据就地修改，调用
`refreshLayout()` 重新评估。

文档站的响应式场景用嵌套 `vscode-split-layout` 同时提供宽度与高度拖动：拖动
右侧分隔条改变宽度，拖动下方分隔条改变高度，双击分隔条恢复初始值并实时显示
容器尺寸。高度只决定容器可视区域，不触发降级。

降级顺序固定为：逐批紧凑 → `responsiveMenu` 合并 → 从右向左折叠分组 →
两端悬浮滚动按钮。未声明 `responsive` / `responsiveMenu` 的按钮只参与整组折叠。

## 折叠与持久化

```html
<vscode-ribbon persist-state storage-key="my.ribbon"></vscode-ribbon>
```

恢复状态时，如果调用方显式设置了 `collapsed` 或 `active-tab` 特性，会优先使用
显式值。存储不可用（隐私模式、被禁用）时组件静默忽略，不影响交互。

## 主题与图标

组件使用 `--vscode-*` 主题变量并提供回退值；在 VS Code Webview 中由宿主提供。
字符串图标默认是 Codicon 名称，图片地址按单色遮罩渲染、颜色跟随
`--vscode-icon-foreground`。`{light, dark}` 对象会随 `vscode-dark` /
`vscode-high-contrast` 类名自动切换。

Codicon 字体需要页面加载 `@vscode/codicons/dist/codicon.css`，并用固定 id
`vscode-codicon-stylesheet` 引入，详见 [主题与图标](./guide/theming)。组件会把
该链接与 nonce 插入自身影子根，按钮、菜单与折叠控件的图标才会显示。

## 沙箱自定义内容与 CSP

`menu.custom` 的 HTML/CSS 在 `sandbox=""` 的 iframe 中渲染，并施加
`default-src 'none'; script-src 'none'` 等策略：脚本、表单、网络请求都会被阻止，
图片仅允许 `data:` URI。适合放置静态说明、公式示例或图例。需要动态交互时，
应在宿主中实现，不要尝试绕过沙箱。

## 可访问性与键盘

- 标签栏、菜单、分组弹层都支持方向键导航、Home/End、Escape 关闭并恢复焦点；
- 带有菜单的按钮支持 ArrowDown / ArrowUp 打开菜单，聚焦首项或末项；
- 分割按钮的主命令与菜单是两个独立点击区域；
- 图标按钮通过标题提供无障碍名称，占位与禁用项输出禁用状态；
- 菜单选项文字左对齐，快捷键与子菜单箭头靠右。

## 常见问题

- **图标不显示**：确认 Codicon 样式表已用固定 id 引入，或图片 URL 可访问且
  允许被 CSP 加载；相对路径需先解析为 URL。
- **命令没有执行**：组件不执行命令，必须监听 `vsc-ribbon-command`。
- **窄容器中很多按钮被折叠**：这是预期的降级链；可调整 `responsive`
  或 `responsiveMenu` 声明，或增大容器宽度。
- **状态没有记住**：确认设置了 `persist-state` 与 `storage-key`，且存储在
  当前上下文可用。
