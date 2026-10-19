import type {RibbonCustomContentModel} from './ribbon-types.js';

/**
 * 构造下拉自定义内容的 `srcdoc`：在无脚本 `sandbox=""` 的 iframe 中渲染，
 * CSP 禁止脚本、表单与网络连接，图片仅允许 `data:` URI；样式中的 `</style`
 * 做转义，避免提前结束样式块。
 */
export function buildRibbonCustomContentSource(
  content: RibbonCustomContentModel
): string {
  const css = content.css.replace(/<\/style/gi, '<\\/style');
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'none'; font-src data:"><style>html,body{box-sizing:border-box;margin:0;min-height:100%;font:12px var(--vscode-font-family,sans-serif);color:var(--vscode-foreground,#cccccc);background:transparent}${css}</style></head><body>${content.html}</body></html>`;
}
