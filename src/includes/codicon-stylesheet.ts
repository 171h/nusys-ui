const STYLESHEET_ID = 'vscode-codicon-stylesheet';

/**
 * 宿主页面中 Codicon 样式表的链接配置。
 */
export interface CodiconStylesheetConfig {
  /**
   * 样式表地址；页面未提供固定 id 的链接时为空。
   */
  href?: string;
  /**
   * 用于通过 CSP 的 nonce，与页面中的链接保持一致。
   */
  nonce?: string;
}

/**
 * 读取宿主页面上以固定 id 引入的 Codicon 样式表。
 *
 * Codicon 使用网络字体，页面级样式表无法作用于 Shadow DOM；组件需要把
 * 同一个链接及其 nonce 插入影子根，字体与图标字符才会生效。
 */
export function getCodiconStylesheetConfig(): CodiconStylesheetConfig {
  if (typeof document === 'undefined') {
    return {};
  }

  const linkElement = document.getElementById(STYLESHEET_ID);
  const href = linkElement?.getAttribute('href') ?? undefined;
  const nonce = linkElement?.nonce ?? undefined;

  return {href: href || undefined, nonce: nonce || undefined};
}

/**
 * 缺少 Codicon 样式表时的提示文案，供组件通过 `warn()` 输出。
 */
export const CODICON_STYLESHEET_WARNING =
  'Codicon 图标需要宿主页面以固定 id "vscode-codicon-stylesheet" 引入 ' +
  'codicons.css；缺少样式表、字体文件或 CSP 授权会使图标无法显示。';
