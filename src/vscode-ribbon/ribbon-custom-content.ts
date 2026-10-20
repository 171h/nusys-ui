import type {RibbonCustomContentModel} from './ribbon-types.js';

export interface RibbonCustomContentTheme {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  foreground?: string;
}

/**
 * 构造下拉自定义内容的 `srcdoc`：在无脚本 `sandbox=""` 的 iframe 中渲染，
 * CSP 禁止脚本、表单与网络连接，图片仅允许 `data:` URI；样式中的 `</style`
 * 做转义，避免提前结束样式块。传入主题值后，iframe 内的字体与前景色会与宿主一致。
 */
export function buildRibbonCustomContentSource(
  content: RibbonCustomContentModel,
  theme: RibbonCustomContentTheme = {}
): string {
  const escapeStyle = (value: string) =>
    value.replace(/<\/style/gi, '<\\/style');
  const themeCss = (
    [
      ['--vscode-font-family', theme.fontFamily],
      ['--vscode-font-size', theme.fontSize],
      ['--vscode-font-weight', theme.fontWeight],
      ['--vscode-foreground', theme.foreground],
    ] as const
  )
    .map(([name, value]) => (value ? `${name}:${escapeStyle(value)};` : ''))
    .join('');
  const rootCss = themeCss ? `:root{${themeCss}}` : '';
  const css = escapeStyle(content.css);
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'none'; font-src data:"><style>${rootCss}html,body{box-sizing:border-box;margin:0;min-height:100%;font:var(--vscode-font-size,12px) var(--vscode-font-family,sans-serif);font-weight:var(--vscode-font-weight,normal);color:var(--vscode-foreground,#cccccc);background:transparent}${css}</style></head><body>${content.html}</body></html>`;
}
