# 独立功能面板 RibbonPanel

[API 参考](../api/generated/ribbon-panel)

`vscode-ribbon-panel` 是 Ribbon 的可选内容容器。通过 `ribbon.panel = panelElement`
关联，数据、命令、折叠和持久化仍由 `vscode-ribbon` 管理。导入 Ribbon 时会自动注册
面板，也可单独导入 `nusys-ui/dist/vscode-ribbon-panel/index.js`。

生命周期、主题、键盘和事件规则参见 [Ribbon 分离布局](./ribbon#标签栏与内容面板分离布局)。

## 交互示例

<ExamplePreview example="ribbon-separated" />

## 功能场景

<ComponentExamples component="ribbon-panel" />
