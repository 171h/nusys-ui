import assert from 'node:assert/strict';

// 验证功能区部件图鉴页覆盖全部部件，并且每个部件都有可用截图与配置示例。
export async function testRibbonParts(page, url) {
  await page.goto(url('ribbon-parts'), {waitUntil: 'networkidle'});
  await page.locator('h1').filter({hasText: '功能区部件图鉴'}).waitFor();
  assert.equal(
    await page.locator('.vp-doc h3').count(),
    48,
    '部件图鉴应为全部 48 个部件提供示例'
  );
  const images = page.locator('.vp-doc img');
  assert.equal(await images.count(), 48, '每个部件都应有一张局部截图');
  const brokenImages = await images.evaluateAll((nodes) =>
    nodes
      .filter((node) => !node.complete || node.naturalWidth === 0)
      .map((node) => node.getAttribute('src'))
  );
  assert.deepEqual(brokenImages, [], '部件截图不应加载失败');
  assert.ok(
    (await page.locator('.vp-doc pre').count()) >= 48,
    '每个部件都应附带配置示例代码块'
  );
  console.log(
    '已验证功能区部件图鉴的 48 个部件截图、说明与配置示例均可正常加载。'
  );
}
