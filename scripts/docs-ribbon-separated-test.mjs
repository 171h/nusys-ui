import assert from 'node:assert/strict';

/** 验证真实分离布局示例的宽度、键盘、折叠与布局切换。 */
export async function testRibbonSeparated(frame) {
  const ribbon = frame.locator('#separated-ribbon');
  const panel = frame.locator('#separated-panel');
  const bounds = await frame.evaluate(() => {
    const tabs = document
      .querySelector('#separated-ribbon')
      .getBoundingClientRect();
    const panel = document
      .querySelector('#separated-panel')
      .getBoundingClientRect();
    return {
      offset: tabs.left - panel.left,
      tabs: tabs.width,
      panel: panel.width,
    };
  });
  assert.ok(bounds.offset >= 100, '标题栏应为应用标识保留左侧空间');
  assert.equal(bounds.tabs, 420);
  assert.equal(bounds.panel, 760);
  const tabWidth = frame.getByRole('slider', {name: '标签栏宽度'});
  const panelWidth = frame.getByRole('slider', {name: '面板宽度'});
  await tabWidth.focus();
  await tabWidth.press('Home');
  assert.equal(await ribbon.evaluate((el) => el.clientWidth), 130);
  assert.equal(await panel.evaluate((el) => el.clientWidth), 760);
  await panelWidth.focus();
  await panelWidth.press('Home');
  await frame.waitForFunction(() =>
    document
      .querySelector('#separated-panel')
      .shadowRoot.querySelector('.ribbon-group.folded')
  );
  assert.equal(await ribbon.evaluate((el) => el.clientWidth), 130);
  assert.equal(await panel.evaluate((el) => el.clientWidth), 160);
  await panelWidth.press('End');
  await frame.waitForFunction(
    () =>
      document
        .querySelector('#separated-panel')
        .shadowRoot.querySelectorAll('.ribbon-group.folded').length === 0
  );
  await tabWidth.focus();
  await tabWidth.press('End');
  const insert = ribbon.getByRole('tab', {name: '插入', exact: true});
  await insert.click();
  await panel.getByRole('button', {name: '新建文件', exact: true}).click();
  assert.match(
    await frame.locator('#separated-events').textContent(),
    /"select":1.*"command":1/
  );
  await insert.focus();
  await insert.press('ArrowDown');
  assert.equal(
    await panel
      .getByRole('tabpanel')
      .evaluate((el) => el.getRootNode().activeElement === el),
    true
  );
  await panel.getByRole('tabpanel').press('ArrowUp');
  assert.equal(
    await insert.evaluate((el) => el.getRootNode().activeElement === el),
    true
  );
  await ribbon.getByRole('button', {name: '折叠功能区', exact: true}).click();
  await insert.click();
  await panel.getByRole('tabpanel').waitFor({state: 'visible'});
  await panel.getByRole('tabpanel').press('Escape');
  await panel.getByRole('tabpanel').waitFor({state: 'hidden'});
  await ribbon.getByRole('button', {name: '展开功能区', exact: true}).click();
  await frame
    .getByRole('button', {name: '切换为一体布局', exact: true})
    .click();
  await ribbon.getByRole('button', {name: '新建文件', exact: true}).waitFor();
  assert.equal(await panel.getByRole('tabpanel').count(), 0);
  await frame
    .getByRole('button', {name: '切换为分离布局', exact: true})
    .click();
  await panel.getByRole('button', {name: '新建文件', exact: true}).waitFor();
  assert.equal(await ribbon.getByRole('tabpanel').count(), 0);
}
