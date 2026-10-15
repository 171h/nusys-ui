import assert from 'node:assert/strict';

// 专有页与综合体验页使用相同断言，检查实际发布预览中的样式与交互。
export async function testSelectHover(frame) {
  const leave = () => frame.locator('#select-hover-instructions').hover();
  for (const [id, selector] of [
    ['hover-single', '.text'],
    ['hover-multi', '.face-values'],
  ]) {
    const control = frame.locator(`#${id}`);
    const text = control.locator(selector);
    const icon = control.locator('.face .icon');
    const value = await control.evaluate((el) => el.value);
    await leave();
    await frame.waitForFunction(
      ({id, selector}) =>
        getComputedStyle(
          document.querySelector(`#${id}`).shadowRoot.querySelector(selector)
        ).marginRight === '0px',
      {id, selector}
    );
    assert.equal(
      await icon.evaluate((el) => getComputedStyle(el).opacity),
      '0.9'
    );
    const fullWidth = await text.evaluate(
      (el) => el.getBoundingClientRect().width
    );
    // 暂停真实 CSS 过渡，确定性地检查动画中间帧与两个端点。
    await text.evaluate((el) => {
      el.addEventListener('transitionrun', (event) => {
        if (event.propertyName !== 'margin-right') return;
        const animation = el.getAnimations()[0];
        animation.pause();
        animation.currentTime = 80;
      });
    });
    await control.hover();
    await frame.waitForFunction(
      ({id, selector}) =>
        document
          .querySelector(`#${id}`)
          .shadowRoot.querySelector(selector)
          .getAnimations()
          .some((animation) => animation.playState === 'paused'),
      {id, selector}
    );
    const intermediate = await text.evaluate(
      (el) => el.getBoundingClientRect().width
    );
    assert.ok(
      intermediate < fullWidth && intermediate > fullWidth - 14,
      `${id} 的动画中间宽度 ${intermediate} 应位于 ${fullWidth - 14} 与 ${fullWidth} 之间`
    );
    await text.evaluate((el) => el.getAnimations()[0].finish());
    const hoverWidth = await text.evaluate(
      (el) => el.getBoundingClientRect().width
    );
    const iconWidth = await icon.evaluate(
      (el) => el.getBoundingClientRect().width
    );
    assert.ok(Math.abs(fullWidth - hoverWidth - iconWidth) < 1);
    assert.equal(
      await icon.evaluate((el) => getComputedStyle(el).opacity),
      '1'
    );
    await leave();
    await frame.waitForFunction(
      ({id, selector}) =>
        document
          .querySelector(`#${id}`)
          .shadowRoot.querySelector(selector)
          .getAnimations()
          .some((animation) => animation.playState === 'paused'),
      {id, selector}
    );
    const restoring = await text.evaluate(
      (el) => el.getBoundingClientRect().width
    );
    assert.ok(restoring > hoverWidth && restoring < fullWidth);
    await text.evaluate((el) => el.getAnimations()[0].finish());
    assert.ok(
      Math.abs(
        (await text.evaluate((el) => el.getBoundingClientRect().width)) -
          fullWidth
      ) < 1
    );
    assert.equal(
      await icon.evaluate((el) => getComputedStyle(el).opacity),
      '0.9'
    );
    assert.deepEqual(await control.evaluate((el) => el.value), value);
  }

  const combo = frame.locator('#hover-combobox');
  await combo.hover();
  await frame.waitForFunction(
    () =>
      getComputedStyle(
        document
          .querySelector('#hover-combobox')
          .shadowRoot.querySelector('input')
      ).paddingRight === '18px'
  );
  assert.equal(
    await combo.locator('.icon').evaluate((el) => getComputedStyle(el).opacity),
    '1'
  );
  await leave();
  await frame.waitForFunction(
    () =>
      getComputedStyle(
        document
          .querySelector('#hover-combobox')
          .shadowRoot.querySelector('input')
      ).paddingRight === '4px'
  );
  const width = frame.getByRole('slider', {name: /控件宽度/});
  await width.focus();
  await width.press('Home');
  await frame.waitForFunction(
    () =>
      document.querySelector('#hover-single').getBoundingClientRect().width ===
      160
  );
  await width.press('End');
  await frame.waitForFunction(
    () =>
      document.querySelector('#select-hover-width-value').textContent ===
      '420 px'
  );
  const availableWidth = await frame
    .locator('#select-hover-controls')
    .evaluate((el) => el.getBoundingClientRect().width);
  assert.ok(availableWidth > 160 && availableWidth <= 420);
  assert.equal(
    await frame
      .locator('#hover-multi')
      .evaluate((el) => el.getBoundingClientRect().width),
    availableWidth
  );
  const single = frame.locator('#hover-single');
  await single.focus();
  await single.press('ArrowDown');
  await frame.waitForFunction(
    () => document.querySelector('#hover-single').open
  );
  await single.press('Escape');
  await frame.waitForFunction(
    () => !document.querySelector('#hover-single').open
  );
  assert.equal(
    await frame
      .locator('#hover-disabled')
      .evaluate((el) => el.disabled && !el.open),
    true
  );
}
