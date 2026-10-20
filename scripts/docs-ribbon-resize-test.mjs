import assert from 'node:assert/strict';

/**
 * 验证功能区示例的 split-layout 父容器可调整宽度与高度。
 *
 * @param {import('playwright').Frame} frame 示例 iframe。
 * @param {string} prefix 示例 id，与文档数据中的元素 id 前缀一致。
 */
export async function testRibbonResize(frame, prefix) {
  const setSplit = (kind, position) =>
    frame.locator(`#${prefix}-${kind}-split`).evaluate((element, value) => {
      element.handlePosition = `${value}px`;
    }, position);
  const wrapper = frame.locator(`#${prefix}-resize-wrapper`);

  await setSplit('width', 480);
  await frame.waitForFunction((id) => {
    const element = document.querySelector(`#${id}-resize-wrapper`);
    return element && Math.round(element.getBoundingClientRect().width) < 560;
  }, prefix);
  await setSplit('height', 180);
  await frame.waitForFunction((id) => {
    const element = document.querySelector(`#${id}-resize-wrapper`);
    const height = Math.round(element.getBoundingClientRect().height);
    const size = document.querySelector(`#${id}-size-output`).textContent;
    return height > 160 && height < 200 && size.includes(height + ' px');
  }, prefix);
  assert.equal(
    await frame.locator('.ribbon-resize-hint').count(),
    2,
    '功能区容器需要提供宽度与高度拖动提示'
  );

  await frame
    .locator(`#${prefix}-width-split`)
    .evaluate((element) => element.resetHandlePosition());
  await frame
    .locator(`#${prefix}-height-split`)
    .evaluate((element) => element.resetHandlePosition());
  await frame.waitForFunction((id) => {
    const element = document.querySelector(`#${id}-resize-wrapper`);
    return element && Math.round(element.getBoundingClientRect().width) > 500;
  }, prefix);
  assert.ok(await wrapper.count(), '功能区容器在重置后仍然存在');
}
