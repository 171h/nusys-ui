import {css} from 'lit';

export default css`
  :host {
    display: inline-block;
  }
  :host([hidden]) {
    display: none;
  }
  :host([for]:not([for='']):not([hidden])) {
    display: contents;
  }
  .tooltip {
    position: fixed;
    inset: auto;
    margin: 0;
    padding: 3px 29px 3px 7px;
    box-sizing: border-box;
    min-width: min(var(--vsc-tooltip-min-width, 0px), calc(100vw - 16px));
    max-width: min(var(--vsc-tooltip-max-width, 320px), calc(100vw - 16px));
    max-height: calc(100vh - 16px);
    overflow: visible;
    overflow-wrap: anywhere;
    background: var(
      --vscode-editorHoverWidget-background,
      var(--vscode-editor-background, #252526)
    );
    color: var(
      --vscode-editorHoverWidget-foreground,
      var(--vscode-foreground, #cccccc)
    );
    border: 1px solid
      var(
        --vscode-editorHoverWidget-border,
        var(--vscode-contrastBorder, #454545)
      );
    outline: 1px solid var(--vscode-contrastBorder, transparent);
    border-radius: 3px;
    box-shadow: 0 2px 8px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.36));
    font-family: var(--vscode-font-family, sans-serif);
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    white-space: normal;
    cursor: default;
  }
  .content {
    max-height: calc(100vh - 26px);
    overflow: auto;
  }
  slot[name='_description']:not([hidden]) {
    display: block;
    white-space: pre-wrap;
  }
  slot[hidden] {
    display: none;
  }
  .pin {
    position: absolute;
    top: 1px;
    right: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 2px;
    border: 0;
    border-radius: 3px;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }
  .pin:hover,
  .pin[aria-pressed='true'] {
    background: var(--vscode-toolbar-hoverBackground, rgba(90, 93, 94, 0.31));
  }
  .pin:focus-visible {
    outline: 1px solid var(--vscode-focusBorder, #0078d4);
    outline-offset: -1px;
  }
  .pin[aria-pressed='true'] {
    color: var(--vscode-textLink-foreground, #3794ff);
  }
  .markdown > :first-child {
    margin-top: 0;
  }
  .markdown > :last-child {
    margin-bottom: 0;
  }
  .markdown p,
  .markdown ul,
  .markdown ol,
  .markdown pre,
  .markdown blockquote,
  .markdown table {
    margin: 8px 0;
  }
  .markdown ul,
  .markdown ol {
    padding-left: 20px;
  }
  .markdown a {
    color: var(--vscode-textLink-foreground, #3794ff);
  }
  .markdown a:focus-visible {
    outline: 1px solid var(--vscode-focusBorder, #0078d4);
  }
  .markdown code,
  .markdown pre {
    font-family: var(--vscode-editor-font-family, monospace);
    background: var(
      --vscode-textCodeBlock-background,
      rgba(128, 128, 128, 0.15)
    );
  }
  .markdown pre {
    overflow: auto;
    padding: 6px;
  }
  .markdown blockquote {
    padding-left: 8px;
    border-left: 3px solid var(--vscode-textBlockQuote-border, #454545);
  }
  .markdown table {
    border-collapse: collapse;
  }
  .markdown th,
  .markdown td {
    padding: 4px 8px;
    border: 1px solid var(--vscode-editorHoverWidget-border, #454545);
  }
  .markdown [data-align='left'] {
    text-align: left;
  }
  .markdown [data-align='center'] {
    text-align: center;
  }
  .markdown [data-align='right'] {
    text-align: right;
  }
  .tooltip::after {
    content: '';
    position: absolute;
  }
  .tooltip[data-placement='bottom']::after {
    inset: -9px 0 auto;
    height: 9px;
  }
  .tooltip[data-placement='top']::after {
    inset: auto 0 -9px;
    height: 9px;
  }
  .tooltip[data-placement='right']::after {
    inset: 0 auto 0 -9px;
    width: 9px;
  }
  .tooltip[data-placement='left']::after {
    inset: 0 -9px 0 auto;
    width: 9px;
  }
  .tooltip::before {
    content: '';
    position: absolute;
    width: 7px;
    height: 7px;
    background: inherit;
    border: inherit;
    transform: rotate(45deg);
  }
  .tooltip[data-placement='right']::before {
    left: -5px;
    top: calc(var(--arrow-offset) - 4px);
    border-top: 0;
    border-right: 0;
  }
  .tooltip[data-placement='left']::before {
    right: -5px;
    top: calc(var(--arrow-offset) - 4px);
    border-bottom: 0;
    border-left: 0;
  }
  .tooltip[data-placement='top']::before {
    bottom: -5px;
    left: calc(var(--arrow-offset) - 4px);
    border-top: 0;
    border-left: 0;
  }
  .tooltip[data-placement='bottom']::before {
    top: -5px;
    left: calc(var(--arrow-offset) - 4px);
    border-bottom: 0;
    border-right: 0;
  }
`;
