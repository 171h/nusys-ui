import {chromium} from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1440, height: 1200}});
await page.goto('http://127.0.0.1:4177/components/ribbon', {
  waitUntil: 'networkidle',
});
await page.waitForTimeout(1200);
const iframes = page.locator('iframe');
const openFrame = async (id) => {
  const preview = page.locator(`[data-scenario="${id}"] iframe`);
  await preview.waitFor();
  const frame = await (await preview.elementHandle()).contentFrame();
  await frame.waitForFunction(
    () => document.documentElement.dataset.ready === 'true'
  );
  return {frame, preview};
};
const sizeOf = (frame, selector, ribbonId) =>
  frame.evaluate(
    ({selector, ribbonId}) => {
      const root = document.querySelector(`#${ribbonId}`).shadowRoot;
      return [...root.querySelectorAll(selector)].map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          cls: el.className,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          fontSize: getComputedStyle(el).fontSize,
        };
      });
    },
    {selector, ribbonId}
  );

let {frame, preview} = await openFrame('ribbon-overflow');
console.log('wide full icons', await sizeOf(frame, '.ribbon-item-full .ribbon-icon', 'ribbon-overflow'));
await preview.screenshot({path: 'shots/inspect-overflow-wide.png'});
await frame.locator('#ribbon-overflow-width-split').evaluate((el) => {
  el.handlePosition = '120px';
});
await page.waitForTimeout(1000);
console.log('folded entry icons', await sizeOf(frame, '.ribbon-group-dropdown .ribbon-group-icon', 'ribbon-overflow'));
// open folded popover
await frame.locator('#ribbon-overflow').evaluate((ribbon) => {
  ribbon.shadowRoot.querySelector('.ribbon-group.folded .ribbon-group-dropdown').click();
});
await page.waitForTimeout(500);
console.log('popover icons', await sizeOf(frame, '.ribbon-group-popover .ribbon-item .ribbon-icon', 'ribbon-overflow'));
await preview.screenshot({path: 'shots/inspect-overflow-folded.png'});

// menu item icons
({frame, preview} = await openFrame('ribbon-menus'));
await frame.getByRole('button', {name: '插入图片', exact: true}).click();
await page.waitForTimeout(400);
console.log('menu icons', await sizeOf(frame, '.ribbon-menu-item .ribbon-icon', 'ribbon-menus'));
console.log('menu headings', await sizeOf(frame, '.ribbon-menu-heading', 'ribbon-menus'));
await preview.screenshot({path: 'shots/inspect-menu.png'});

// gallery tiles
({frame, preview} = await openFrame('ribbon-gallery'));
console.log('gallery tile icons', await sizeOf(frame, '.ribbon-gallery-tile .ribbon-gallery-icon', 'ribbon-gallery'));
console.log('gallery tile previews', await sizeOf(frame, '.ribbon-gallery-tile .ribbon-gallery-preview', 'ribbon-gallery'));
await browser.close();
