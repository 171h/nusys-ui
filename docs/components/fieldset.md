# 分区 Fieldset

包装原生 fieldset，支持复选框与折叠。

[API 参考](../api/generated/fieldset)

## 导入

```js
import 'nusys-ui/dist/vscode-fieldset/index.js';
import 'nusys-ui/dist/vscode-label/index.js';
import 'nusys-ui/dist/vscode-textfield/index.js';
import 'nusys-ui/dist/vscode-checkbox/index.js';
```

也可以使用 `import 'nusys-ui'` 注册全部组件。

## 使用说明

默认插槽包裹一个原生 `<fieldset>`，使用 `<legend>` 提供分区标题，保留表单与分区语义。普通分区默认不显示复选框，内容和标题保持原有行为。

`legend-checkbox` 是默认关闭的可选功能：开启后，复选框位于现有 `legend` 文字左侧，保留标题中已有的文字、图标和操作。`checked` 启用内容，`unchecked-mode` 控制保持可见、折叠或最小显示。原有 `checkbox` 右上角复选框接口仍保持兼容；同时设置时仅显示左侧复选框。

嵌套分区会保留控件原本的 disabled 状态；取消默认处理后的状态在拖拽后保留。通过 `vsc-fieldset-checked-change` 或 `checkedChange` 可接管行为，见 [fieldset 复选框](../fieldset-checkbox)。分区可用作标签页面板直属视图，见 [拖拽布局](../tabs-drag-drop)。

需要通过标题左侧复选框控制内容显隐时，设置 `legend-checkbox` 和 `unchecked-mode="collapsed"`；添加 `checked` 可默认展开。取消勾选会隐藏并禁用内容，重新勾选恢复内容且保留输入值。`checkbox-label` 在左侧模式下仅用于无障碍名称，不会重复显示标题；省略时使用分区标题文字。

监听事件可同时执行保存开关状态、重新计算等业务逻辑，不调用 `preventDefault()` 即可保留默认显隐行为：

```js
const section = document.querySelector('vscode-fieldset');
section.addEventListener('vsc-fieldset-checked-change', (event) => {
  const enabled = event.detail.checked;
  updateSettings({enabled});
});
```

`updateSettings` 由应用实现。事件会冒泡并穿过 shadow DOM 边界；代码直接修改 `checked` 会同步内容状态，但不会派发此用户交互事件。

## 交互示例

使用右上角导航栏的全站主题和尺寸选择，使用鼠标或键盘操作。代码视图包含此预览实际执行的 HTML、CSS 与 JavaScript。

<ExamplePreview example="fieldset" />

上方为无复选框的普通分区。下方为单独启用标题左侧复选框的用法，交互演示见功能场景中的“可选的 legend 左侧复选框”。

```html
<vscode-fieldset
  legend-checkbox
  checked
  checkbox-label="启用风荷载"
  unchecked-mode="collapsed"
>
  <fieldset>
    <legend>风荷载</legend>
    <vscode-label for="pressure">基本风压</vscode-label>
    <vscode-textfield id="pressure" value="0.5" type="number">
    </vscode-textfield>
    <vscode-checkbox label="考虑阵风" checked> </vscode-checkbox>
  </fieldset>
</vscode-fieldset>
```

## 功能场景

下列场景补充状态、组合约束、数据操作和交互边界。每项列出覆盖的公开功能，代码视图可直接查阅实际运行代码。

<ComponentExamples component="fieldset" />

## 相关指南

[主题与图标](../guide/theming) · [表单与校验](../guide/forms) · [常见问题](../guide/faq)
