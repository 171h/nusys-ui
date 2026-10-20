// 功能区示例共用的可拖动父容器：
// 外层水平 split 调整高度，内层垂直 split 调整宽度，双击分隔条恢复初始尺寸。
const RESIZE_HEIGHT = 300;

export const ribbonResizeCss =
  '.ribbon-resize-tip{margin:0 0 8px;color:var(--vscode-descriptionForeground,#8b8b8b)} ' +
  '.ribbon-resize-hint{display:flex;align-items:center;justify-content:center;height:100%;padding:8px;color:var(--vscode-descriptionForeground,#8b8b8b);font-size:12px;text-align:center} ' +
  '.ribbon-resize-split{margin-bottom:12px} ' +
  '.ribbon-resize-wrapper{outline:1px dashed var(--vscode-panel-border,#454545);outline-offset:-1px} ' +
  '.ribbon-size-readout{margin:0 0 4px} ' +
  '.ribbon-size-readout output{display:inline;margin:0}';

/**
 * 生成功能区示例的可拖动父容器结构。
 *
 * @param {string} id 示例 id，用于生成不冲突的元素 id。
 * @param {string} ribbonHtml 功能区元素本身的 HTML。
 */
export function ribbonResizeHtml(id, ribbonHtml) {
  return (
    '<p class="ribbon-resize-tip">拖动分隔条调整功能区父容器：右侧分隔条改变宽度，下方分隔条改变高度，双击恢复初始尺寸。</p>' +
    `<vscode-split-layout id="${id}-height-split" class="ribbon-resize-split" split="horizontal" handle-size="8" initial-handle-position="44%" min-start="132px" min-end="48px" reset-on-dbl-click style="height:${RESIZE_HEIGHT}px">` +
    `<vscode-split-layout slot="start" id="${id}-width-split" split="vertical" handle-size="8" initial-handle-position="82%" min-start="120px" min-end="88px" reset-on-dbl-click>` +
    `<div slot="start" id="${id}-resize-wrapper" class="ribbon-resize-wrapper">${ribbonHtml}</div>` +
    '<div slot="end" class="ribbon-resize-hint">左右拖动改变宽度</div>' +
    '</vscode-split-layout>' +
    '<div slot="end" class="ribbon-resize-hint">上下拖动改变高度</div>' +
    '</vscode-split-layout>' +
    `<p class="ribbon-size-readout">功能区容器：<output id="${id}-size-output">—</output></p>`
  );
}

/**
 * 生成实时显示功能区容器尺寸的脚本。
 *
 * @param {string} id 示例 id，与 `ribbonResizeHtml` 保持一致。
 */
export function ribbonResizeScript(id) {
  return `{
  const resizeWrapper = document.querySelector('#${id}-resize-wrapper');
  const sizeOutput = document.querySelector('#${id}-size-output');
  const reportSize = () => {
    const rect = resizeWrapper.getBoundingClientRect();
    sizeOutput.textContent = Math.round(rect.width) + ' × ' + Math.round(rect.height) + ' px';
  };
  new ResizeObserver(reportSize).observe(resizeWrapper);
  reportSize();
}`;
}
