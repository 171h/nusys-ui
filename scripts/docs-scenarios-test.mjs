import assert from 'node:assert/strict';
import {componentScenarios} from '../docs/data/scenarios.mjs';
import {testRibbonResize} from './docs-ribbon-resize-test.mjs';
import {testSelectHover} from './docs-select-hover-test.mjs';

export async function testResponsiveTable(frame) {
  const width = frame.getByRole('slider', {name: '容器宽度'});
  await width.focus();
  await width.press('Home');
  await frame.waitForFunction(
    () => document.querySelector('vscode-table').compact
  );
  assert.equal(await width.inputValue(), '240');
  await width.press('End');
  await frame.waitForFunction(
    () => !document.querySelector('vscode-table').compact
  );
  assert.equal(await width.inputValue(), '800');
  await frame.waitForFunction(() => {
    const container = document.querySelector('#table-container');
    return (
      document.querySelector('#container-width-value').textContent ===
      Math.round(container.getBoundingClientRect().width) + ' px'
    );
  });
  const widths = await frame
    .locator('vscode-table')
    .evaluateAll((tables) =>
      tables.map((table) => table.getBoundingClientRect().width)
    );
  assert.ok(
    widths[0] > 350 && Math.abs(widths[0] - widths[1]) < 1,
    '两张表格应随同一容器变宽'
  );
  assert.equal(
    await frame
      .locator('vscode-table')
      .nth(1)
      .evaluate((table) => table.delayedResizing),
    true
  );
  await width.press('Home');
  await frame.waitForFunction(
    () => document.querySelector('vscode-table').compact
  );
}

export async function testScenarios(page, url) {
  const open = async (id) => {
    const component = Object.keys(componentScenarios).find((key) =>
      componentScenarios[key].includes(id)
    );
    await page.goto(url(`components/${component}`));
    const element = await page
      .locator(`[data-scenario="${id}"] iframe`)
      .elementHandle();
    const frame = await element.contentFrame();
    await frame.waitForFunction(
      () => document.documentElement.dataset.ready === 'true'
    );
    return frame;
  };
  const previousViewport = page.viewportSize();
  await page.setViewportSize({width: 1440, height: 1000});
  for (const component of ['single-select', 'multi-select']) {
    await page.goto(url(`components/${component}`));
    const element = await page
      .locator('[data-scenario="select-hover"] iframe')
      .elementHandle();
    const hoverFrame = await element.contentFrame();
    await hoverFrame.waitForFunction(
      () => document.documentElement.dataset.ready === 'true'
    );
    await testSelectHover(hoverFrame);
  }
  await page.setViewportSize(previousViewport);
  let frame = await open('tooltip-controls');
  const tip = frame.locator('#action-tip');
  await frame.getByRole('button', {name: '保存', exact: true}).hover();
  await frame.getByRole('tooltip', {name: '保存当前项目'}).waitFor();
  await frame.getByRole('button', {name: '提示导出操作', exact: true}).click();
  await frame.getByText('提示关联导出操作', {exact: true}).waitFor();
  await frame.getByRole('button', {name: '导出', exact: true}).focus();
  await frame.getByRole('tooltip', {name: '导出当前计算结果'}).waitFor();
  await page.keyboard.press('Escape');
  await tip.locator('.tooltip').waitFor({state: 'hidden'});
  await frame.getByText('禁用提示', {exact: true}).click();
  await frame.getByRole('button', {name: '导出', exact: true}).focus();
  assert.equal(await tip.evaluate((element) => element.disabled), true);
  assert.equal(
    await frame
      .locator('#tooltip-export')
      .evaluate((element) => element.disabled),
    false
  );
  await tip.locator('.tooltip').waitFor({state: 'hidden'});

  frame = await open('tooltip-markdown');
  const markdownTip = frame.locator('vscode-tooltip');
  const markdownPanel = markdownTip.locator('.tooltip');
  await frame.getByRole('button', {name: '查看参数说明', exact: true}).hover();
  await markdownPanel.waitFor();
  assert.equal(await markdownPanel.locator('th').count(), 3);
  assert.equal(await markdownPanel.locator('td').count(), 6);
  await markdownPanel.locator('strong').hover();
  await frame.getByRole('button', {name: '固定提示', exact: true}).click();
  await page.mouse.move(0, 0);
  await frame
    .getByRole('button', {name: '查看参数说明', exact: true})
    .evaluate((element) => element.blur());
  assert.equal(await markdownTip.evaluate((element) => element.pinned), true);
  assert.equal(await markdownPanel.isVisible(), true);
  await frame.getByRole('button', {name: '取消固定提示', exact: true}).focus();
  await page.keyboard.press('Escape');
  await markdownPanel.waitFor({state: 'hidden'});
  assert.equal(await markdownTip.evaluate((element) => element.pinned), false);

  frame = await open('button-form');
  await frame.locator('vscode-textfield input').fill('修改项目');
  await frame.getByRole('button', {name: '提交', exact: true}).click();
  assert.match(await frame.locator('output').textContent(), /修改项目/);
  await frame.getByRole('button', {name: '重置', exact: true}).click();
  assert.equal(
    await frame.locator('vscode-textfield input').inputValue(),
    '初始项目'
  );

  frame = await open('button-group-menu');
  await frame.getByRole('button', {name: '更多任务'}).click();
  await frame.locator('vscode-context-menu-item').first().click();
  assert.equal(await frame.locator('output').textContent(), 'all');

  frame = await open('progress-control');
  await frame.getByRole('button', {name: '推进 40'}).click();
  await frame.waitForFunction(
    () => document.querySelector('vscode-progress-bar').value === 40
  );
  await frame.getByRole('button', {name: '完成', exact: true}).click();
  await frame.waitForFunction(
    () => document.querySelector('vscode-progress-bar').value === 200
  );

  frame = await open('progress-ring-task');
  await frame.getByRole('button', {name: '开始加载'}).click();
  assert.equal(await frame.locator('#loading').isVisible(), true);
  await frame.getByRole('button', {name: '取消', exact: true}).click();
  assert.equal(await frame.locator('#loading').isVisible(), false);

  frame = await open('textfield-slots');
  await frame.locator('vscode-textfield input').fill('含 空格');
  await frame.getByRole('button', {name: '校验路径'}).click();
  assert.equal(await frame.locator('output').textContent(), '路径不能包含空格');
  await frame.getByRole('button', {name: '清除错误'}).click();
  assert.equal(
    await frame
      .locator('vscode-textfield')
      .evaluate((el) => el.checkValidity()),
    true
  );

  frame = await open('textfield-file');
  await frame.locator('input[type="file"]').setInputFiles({
    name: 'demo.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('演示内容'),
  });
  await frame.getByText('demo.txt', {exact: true}).waitFor();

  frame = await open('select-options');
  await frame.getByRole('button', {name: '替换数据'}).click();
  assert.equal(
    await frame.locator('vscode-single-select').evaluate((el) => el.value),
    'yaml'
  );
  await frame.getByRole('button', {name: '打开上方列表'}).click();
  await frame.getByRole('option', {name: 'JSON', exact: true}).click();
  assert.equal(await frame.locator('output').textContent(), 'json');

  frame = await open('multi-form');
  await page
    .locator('[data-scenario="multi-form"] iframe')
    .scrollIntoViewIfNeeded();
  await frame.locator('vscode-multi-select').evaluate((el) => {
    el.open = true;
  });
  await frame.locator('vscode-multi-select #select-all').click();
  await frame.locator('vscode-multi-select .button-accept').click();
  await frame.getByRole('button', {name: '提交全部值'}).click();
  assert.deepEqual(JSON.parse(await frame.locator('output').textContent()), [
    'html',
    'md',
    'json',
  ]);
  await frame.getByRole('button', {name: '选择前两项'}).click();
  await frame.getByRole('button', {name: '提交全部值'}).click();
  assert.deepEqual(JSON.parse(await frame.locator('output').textContent()), [
    'html',
    'md',
  ]);
  await frame.getByRole('button', {name: '恢复默认'}).click();
  await frame.waitForFunction(
    () =>
      JSON.stringify(document.querySelector('vscode-multi-select').value) ===
      '["html"]'
  );

  frame = await open('multi-combobox');
  await frame.getByRole('button', {name: '选择全部'}).click();
  assert.equal(
    JSON.parse(await frame.locator('output').textContent()).length,
    4
  );

  frame = await open('form-dirty-controls');
  await frame.locator('vscode-textfield input').fill('新名称');
  await frame.waitForFunction(
    () => document.querySelector('vscode-form-container').dirty
  );
  await frame.getByRole('button', {name: '清除修改标记'}).click();
  await frame.waitForFunction(
    () => !document.querySelector('vscode-form-container').dirty
  );

  frame = await open('fieldset-legend-checkbox');
  const legendToggle = frame.getByRole('checkbox', {name: '启用高级设置'});
  const positions = await frame.locator('vscode-fieldset').evaluate((host) => {
    const checkbox = host.shadowRoot.querySelector('vscode-checkbox');
    const legend = host.querySelector('legend');
    const title = legend.querySelector('span:not([aria-hidden])');
    return {
      checkboxRight: checkbox.getBoundingClientRect().right,
      titleLeft: title.getBoundingClientRect().left,
      legendLeft: legend.getBoundingClientRect().left,
      checkboxLeft: checkbox.getBoundingClientRect().left,
      legendCursor: getComputedStyle(legend).cursor,
    };
  });
  assert.ok(positions.checkboxLeft >= positions.legendLeft);
  assert.ok(positions.checkboxRight <= positions.titleLeft);
  assert.equal(positions.legendCursor, 'pointer');
  await frame.locator('vscode-fieldset vscode-checkbox').click();
  await frame.getByText('高级设置已关闭，参数已保留', {exact: true}).waitFor();
  await frame.locator('vscode-textfield').waitFor({state: 'hidden'});
  await legendToggle.focus();
  await page.keyboard.press('Space');
  await frame.getByText('高级设置已启用', {exact: true}).waitFor();
  await frame.locator('vscode-textfield').waitFor({state: 'visible'});
  const legendTitle = frame.locator('legend > span:not([aria-hidden])');
  await legendTitle.click();
  await frame.getByText('高级设置已关闭，参数已保留', {exact: true}).waitFor();
  await frame.locator('vscode-textfield').waitFor({state: 'hidden'});
  await legendTitle.click();
  await frame.getByText('高级设置已启用', {exact: true}).waitFor();
  await frame.locator('vscode-textfield').waitFor({state: 'visible'});
  assert.equal(
    await frame
      .locator('vscode-textfield')
      .evaluate((element) => element.value),
    '保留参数'
  );

  frame = await open('fieldset-modes');
  for (const mode of ['visible', 'collapsed', 'minimal']) {
    const fieldset = frame.locator(`vscode-fieldset[unchecked-mode="${mode}"]`);
    await fieldset.locator('vscode-checkbox').first().click();
    await frame.waitForFunction(
      (mode) =>
        document.querySelector(
          `vscode-fieldset[unchecked-mode="${mode}"] vscode-textfield`
        ).disabled,
      mode
    );
    if (mode !== 'visible') await fieldset.waitFor({state: 'visible'});
    await fieldset.locator('vscode-checkbox').first().click();
    await frame.waitForFunction(
      (mode) =>
        !document.querySelector(
          `vscode-fieldset[unchecked-mode="${mode}"] vscode-textfield`
        ).disabled,
      mode
    );
  }
  frame = await open('fieldset-callback');
  await frame.locator('vscode-fieldset vscode-checkbox').first().click();
  assert.match(await frame.locator('output').textContent(), /checked=false/);
  assert.equal(
    await frame.locator('vscode-textfield').evaluate((el) => el.disabled),
    false
  );

  frame = await open('scrollable-controls');
  await frame.getByRole('button', {name: '滚动到底部'}).click();
  await frame.waitForFunction(() => {
    const el = document.querySelector('vscode-scrollable');
    return el.scrollPos > 0 && el.scrollPos === el.scrollMax;
  });
  await frame.getByRole('button', {name: '回到顶部'}).click();
  await frame.waitForFunction(
    () => document.querySelector('vscode-scrollable').scrollPos === 0
  );

  frame = await open('split-controls');
  await frame.locator('#fixed').selectOption('end');
  assert.equal(
    await frame.locator('vscode-split-layout').evaluate((el) => el.fixedPane),
    'end'
  );
  await frame.getByRole('button', {name: '恢复初始分栏'}).click();

  frame = await open('tabs-panel');
  await frame.getByRole('button', {name: '显示设置'}).click();
  await frame.waitForFunction(
    () => document.querySelector('vscode-tabs').selectedIndex === 0
  );

  frame = await open('table-variants');
  await frame.locator('#look').selectOption('bordered-rows');
  assert.equal(
    await frame.locator('vscode-table').evaluate((el) => el.borderedRows),
    true
  );
  await frame.getByRole('button', {name: '打开 1', exact: true}).click();
  assert.equal(await frame.locator('output').textContent(), '打开 1');

  // 功能区示例使用可拖动父容器，需要足够宽的视口验证完整布局与降级链。
  await page.setViewportSize({width: 1440, height: 1000});
  frame = await open('ribbon-menus');
  const codiconHref = await frame
    .locator('#ribbon-menus')
    .evaluate((ribbon) =>
      ribbon.shadowRoot
        .querySelector('link[rel="stylesheet"]')
        ?.getAttribute('href')
    );
  assert.match(codiconHref, /codicon\.css/);
  await frame.waitForFunction(() => {
    const icon = document
      .querySelector('#ribbon-menus')
      ?.shadowRoot?.querySelector('.ribbon-item .ribbon-icon');
    return (
      icon !== null &&
      icon !== undefined &&
      getComputedStyle(icon, '::before').content !== 'none'
    );
  });
  await frame.getByRole('button', {name: '保存', exact: true}).click();
  assert.match(
    await frame.locator('#ribbon-menus-output').textContent(),
    /save/
  );
  await frame.getByRole('button', {name: '板模板', exact: true}).click();
  const menuItem = frame.getByRole('menuitem', {name: '盘扣式', exact: true});
  await menuItem.waitFor();
  assert.equal(
    await frame
      .locator('vscode-ribbon .ribbon-menu-item')
      .first()
      .evaluate((element) => getComputedStyle(element).textAlign),
    'left'
  );
  await frame.getByRole('menuitem', {name: '更多体系', exact: true}).click();
  await frame.getByRole('menuitem', {name: '返回', exact: true}).waitFor();
  await frame
    .getByRole('menuitem', {name: '门式脚手架', exact: true})
    .waitFor();
  await frame.getByRole('menuitem', {name: '返回', exact: true}).click();
  await frame.getByRole('menuitem', {name: '盘扣式', exact: true}).click();
  assert.match(
    await frame.locator('#ribbon-menus-output').textContent(),
    /slab-ringlock/
  );
  await frame.getByRole('button', {name: '板模板', exact: true}).click();
  await frame.getByRole('menuitem', {name: '盘扣式', exact: true}).waitFor();
  await page.keyboard.press('Escape');
  await menuItem.waitFor({state: 'hidden'});
  await frame.getByRole('button', {name: '脚手架规范', exact: true}).click();
  const panel = frame.getByRole('dialog');
  await panel.waitFor();
  const customFrame = await (
    await panel.locator('iframe.ribbon-custom-content').elementHandle()
  ).contentFrame();
  await customFrame
    .getByText('面板下方可放置规范说明', {exact: false})
    .waitFor();
  assert.equal(
    await frame.locator('vscode-ribbon .ribbon-panel-item').count(),
    4
  );
  await frame.getByRole('button', {name: '关闭面板', exact: true}).click();
  await panel.waitFor({state: 'hidden'});

  // 菜单分组标题不可聚焦、不参与菜单项语义。
  await frame.getByRole('button', {name: '插入图片', exact: true}).click();
  await frame.getByRole('menuitem', {name: '此设备…', exact: true}).waitFor();
  const menuHeading = frame
    .locator('vscode-ribbon .ribbon-menu-heading')
    .first();
  assert.equal((await menuHeading.textContent()).trim(), '插入图片来自');
  assert.equal(await menuHeading.getAttribute('role'), 'presentation');
  assert.equal(
    await frame
      .getByRole('menuitem', {name: '插入图片来自', exact: true})
      .count(),
    0
  );
  await frame.evaluate(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    );
  });

  // 面板中的分组标题与说明文字。
  await frame.getByRole('button', {name: '页边距', exact: true}).click();
  const marginPanel = frame.getByRole('dialog');
  await marginPanel.waitFor();
  const marginHeadings = (
    await frame.locator('vscode-ribbon .ribbon-panel-heading').allTextContents()
  ).map((text) => text.trim());
  assert.deepEqual(marginHeadings, ['上次的自定义设置', '预设页边距']);
  const marginDescriptions = (
    await frame
      .locator('vscode-ribbon .ribbon-panel-description')
      .allTextContents()
  ).map((text) => text.trim());
  assert.equal(marginDescriptions.length, 4);
  assert.match(marginDescriptions[0], /上：2\.5 厘米/);
  assert.match(marginDescriptions[0], /左：2\.5 厘米/);
  await frame.getByRole('button', {name: '窄', exact: true}).click();
  assert.match(
    await frame.locator('#ribbon-menus-output').textContent(),
    /margin-narrow/
  );

  await frame.getByRole('button', {name: '打开文件设置', exact: true}).click();
  assert.match(
    await frame.locator('#ribbon-menus-output').textContent(),
    /打开对话框：文件/
  );
  await frame.getByRole('button', {name: '打开“规范”对话框'}).click();
  assert.match(
    await frame.locator('#ribbon-menus-output').textContent(),
    /打开对话框：规范/
  );
  await testRibbonResize(frame, 'ribbon-menus');

  frame = await open('ribbon-responsive');
  const setSplitPosition = (selector, position) =>
    frame.locator(selector).evaluate((element, value) => {
      element.handlePosition = `${value}px`;
    }, position);
  await setSplitPosition('#ribbon-responsive-width-split', 120);
  await frame.waitForFunction(() => {
    const ribbon = document.querySelector('#ribbon-responsive');
    return (
      ribbon.shadowRoot.querySelector(
        '.ribbon-group[data-group="pit"].folded'
      ) !== null &&
      ribbon.shadowRoot.querySelector('.ribbon-menu-popover') === null
    );
  });
  // 折叠分组的溢出弹层恢复声明的原始布局，而不是合并成单个下拉菜单。
  await frame.locator('#ribbon-responsive').evaluate((ribbon) => {
    ribbon.shadowRoot
      .querySelector('.ribbon-group[data-group="pit"] .ribbon-group-dropdown')
      .click();
  });
  await frame.waitForFunction(() => {
    const ribbon = document.querySelector('#ribbon-responsive');
    return ribbon.shadowRoot.querySelector('.ribbon-group-popover') !== null;
  });
  const responsivePopover = await frame.evaluate(() => {
    const popover = document
      .querySelector('#ribbon-responsive')
      .shadowRoot.querySelector('.ribbon-group-popover');
    return {
      label: popover.getAttribute('aria-label'),
      labels: [...popover.querySelectorAll('.ribbon-item')].map((item) =>
        item.getAttribute('aria-label')
      ),
      classes: [...popover.querySelectorAll('.ribbon-item')].map(
        (item) => item.className
      ),
    };
  });
  assert.equal(responsivePopover.label, '基坑与边坡');
  assert.deepEqual(
    [...responsivePopover.labels].sort(),
    ['人工挖孔桩', '围护支撑', '加固锚固', '边坡稳定'].sort()
  );
  for (const className of responsivePopover.classes) {
    assert.match(className, /ribbon-item-full/);
    assert.doesNotMatch(className, /icon-only|ribbon-item-third/);
  }
  await frame.evaluate(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    );
  });
  await setSplitPosition('#ribbon-responsive-width-split', 1600);
  await frame.waitForFunction(() => {
    const ribbon = document.querySelector('#ribbon-responsive');
    return (
      ribbon.shadowRoot.querySelector('.ribbon-group.folded') === null &&
      ribbon.shadowRoot.querySelector('.ribbon-group-popover') === null
    );
  });
  await setSplitPosition('#ribbon-responsive-height-split', 180);
  await frame.waitForFunction(() => {
    const wrapper = document.querySelector('#ribbon-responsive-resize-wrapper');
    const height = Math.round(wrapper.getBoundingClientRect().height);
    const size = document.querySelector(
      '#ribbon-responsive-size-output'
    ).textContent;
    return height > 160 && height < 200 && size.includes(height + ' px');
  });
  await frame.getByRole('button', {name: '单位换算', exact: true}).click();
  assert.match(
    await frame.locator('#ribbon-responsive-output').textContent(),
    /unit/
  );

  frame = await open('ribbon-overflow');
  const ribbonOverflowState = () =>
    frame.evaluate(() => {
      const root = document.querySelector('#ribbon-overflow').shadowRoot;
      return {
        folded: [...root.querySelectorAll('.ribbon-group.folded')].map(
          (group) => group.getAttribute('data-group')
        ),
        visibleItems: [
          ...root.querySelectorAll('.ribbon-group:not(.folded) .ribbon-item'),
        ].filter((item) => item.getClientRects().length > 0).length,
      };
    });
  let overflowState = await ribbonOverflowState();
  assert.deepEqual(overflowState.folded, [], '宽容器下应完整显示全部功能组');
  assert.equal(overflowState.visibleItems, 7);
  assert.equal(
    await frame
      .locator('#ribbon-overflow')
      .evaluate(
        (ribbon) =>
          ribbon.shadowRoot.querySelectorAll('.ribbon-item.is-dropdown').length
      ),
    0,
    '普通按钮不应被合并为下拉入口'
  );
  await setSplitPosition('#ribbon-overflow-width-split', 120);
  await frame.waitForFunction(() => {
    const root = document.querySelector('#ribbon-overflow').shadowRoot;
    return root.querySelectorAll('.ribbon-group.folded').length === 3;
  });
  // 打开最右侧折叠分组，弹层按原始布局完整渲染该组按钮。
  await frame.locator('#ribbon-overflow').evaluate((ribbon) => {
    ribbon.shadowRoot
      .querySelector('.ribbon-group[data-group="view"] .ribbon-group-dropdown')
      .click();
  });
  await frame.waitForFunction(() => {
    const root = document.querySelector('#ribbon-overflow').shadowRoot;
    return root.querySelector('.ribbon-group-popover') !== null;
  });
  const overflowPopover = await frame.evaluate(() => {
    const root = document.querySelector('#ribbon-overflow').shadowRoot;
    const popover = root.querySelector('.ribbon-group-popover');
    return {
      label: popover.getAttribute('aria-label'),
      items: [...popover.querySelectorAll('.ribbon-item')].map((item) => ({
        label: item.getAttribute('aria-label'),
        className: item.className,
        icon: item.querySelector('.ribbon-icon')?.className ?? '',
      })),
    };
  });
  assert.equal(overflowPopover.label, '视图');
  assert.deepEqual(
    [...overflowPopover.items.map((item) => item.label)].sort(),
    ['侧边栏', '终端'].sort()
  );
  for (const item of overflowPopover.items) {
    assert.match(item.className, /ribbon-item-half/);
    assert.doesNotMatch(item.className, /icon-only|ribbon-item-third/);
  }
  const sidebarItem = overflowPopover.items.find(
    (item) => item.label === '侧边栏'
  );
  assert.match(sidebarItem.icon, /codicon-layout-sidebar-left/);
  await frame.locator('#ribbon-overflow').evaluate((ribbon) => {
    ribbon.shadowRoot
      .querySelector('.ribbon-group-popover .ribbon-item[aria-label="侧边栏"]')
      .click();
  });
  assert.match(
    await frame.locator('#ribbon-overflow-output').textContent(),
    /toggle-sidebar/
  );
  assert.equal(
    await frame.evaluate(
      () =>
        document
          .querySelector('#ribbon-overflow')
          .shadowRoot.querySelector('.ribbon-group-popover') === null
    ),
    true,
    '执行命令后溢出弹层应关闭'
  );
  await setSplitPosition('#ribbon-overflow-width-split', 1600);
  await frame.waitForFunction(() => {
    const root = document.querySelector('#ribbon-overflow').shadowRoot;
    return root.querySelectorAll('.ribbon-group.folded').length === 0;
  });
  overflowState = await ribbonOverflowState();
  assert.equal(overflowState.visibleItems, 7, '拉宽后应恢复完整布局');
  await testRibbonResize(frame, 'ribbon-overflow');

  frame = await open('ribbon-state');
  await frame.getByRole('button', {name: '侧边栏', exact: true}).click();
  assert.equal(
    await frame.locator('#ribbon-state-output').textContent(),
    '命令：toggle-sidebar'
  );
  await frame.getByRole('button', {name: '折叠功能区', exact: true}).click();
  assert.equal(
    await frame.locator('#ribbon-state-output').textContent(),
    '功能区已折叠'
  );
  await frame.getByRole('button', {name: '展开功能区', exact: true}).click();
  assert.equal(
    await frame.locator('#ribbon-state-output').textContent(),
    '功能区已展开'
  );
  await testRibbonResize(frame, 'ribbon-state');

  frame = await open('table-responsive');
  await testResponsiveTable(frame);

  frame = await open('tree-controls');
  await frame.getByRole('button', {name: '展开全部'}).click();
  await frame.getByRole('button', {name: '收起全部'}).click();
  await frame.getByRole('button', {name: '定位 README'}).click();
  assert.match(await frame.locator('output').textContent(), /\[0,1\]/);
  console.log(
    '已验证新增场景的表单重置、菜单、功能区、进度、文件读取、动态选项、多选提交、修改标记、分区回调、滚动、分栏、标签页、表格和树操作。'
  );
}
