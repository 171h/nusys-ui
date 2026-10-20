import './index.js';
import {afterEach, describe, it, expect} from 'vitest';
import {fixture, html, aTimeout, waitUntil} from '../includes/testing.js';
import {VscodeRibbon} from './index.js';
import type {VscRibbonTab} from './ribbon-types.js';

const tabs = (): VscRibbonTab[] => [
  {
    id: 'home',
    title: '开始',
    groups: [
      {
        id: 'file',
        title: '文件',
        dialogLauncher: {title: '文件设置'},
        items: [
          {title: '保存', command: 'save'},
          {
            title: '选项',
            type: 'splitButton',
            command: 'primary',
            menu: {
              items: [
                {
                  title: '父菜单',
                  submenuMode: 'flyout',
                  menu: {
                    items: [
                      {
                        title: '替换层',
                        menu: {items: [{title: '执行', command: 'run'}]},
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'insert',
    title: '插入',
    groups: [
      {
        id: 'insert',
        title: '插入工具',
        items: [{title: '新建', command: 'new'}],
      },
    ],
  },
];
const wait = (fn: () => boolean) =>
  waitUntil(fn, '等待分离面板更新', {timeout: 3000});
const key = (node: EventTarget, value: string) =>
  node.dispatchEvent(
    new KeyboardEvent('keydown', {key: value, bubbles: true, composed: true})
  );
const button = (root: ShadowRoot, label: string) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
    (el) => el.getAttribute('aria-label') === label
  )!;
const owners: VscodeRibbon[] = [];
afterEach(() => {
  for (const ribbon of owners.splice(0)) {
    ribbon.panel = null;
  }
});

async function setup(mode: ShadowRootMode = 'open') {
  const host = await fixture<HTMLDivElement>(
    html`<div>
      <div id="title" style="display:flex;width:460px;margin-left:70px">
        <span>应用标识</span><vscode-ribbon style="width:300px"></vscode-ribbon>
      </div>
      <div id="outlet" style="width:800px"></div>
    </div>`
  );
  // 面板位于另一个影子根，验证不能跨根解析的 ID 不会作为 ARIA 关联输出。
  const root = host.querySelector('#outlet')!.attachShadow({mode});
  const panel = document.createElement('vscode-ribbon-panel');
  root.append(panel);
  const ribbon = host.querySelector('vscode-ribbon')!;
  owners.push(ribbon);
  ribbon.tabs = tabs();
  ribbon.panel = panel;
  await ribbon.updateComplete;
  await aTimeout(80);
  return {host, ribbon, panel, root: panel.shadowRoot!};
}

describe('Ribbon 分离布局', () => {
  it('标签切换、命令与对话框仅由状态所有者派发一次', async () => {
    const {ribbon, panel, root} = await setup();
    const counts = {select: 0, command: 0, dialog: 0};
    for (const type of ['select', 'command', 'dialog'] as const) {
      ribbon.addEventListener(`vsc-ribbon-${type}`, () => counts[type]++);
    }
    let panelEvents = 0;
    panel.addEventListener('vsc-ribbon-command', () => panelEvents++);
    button(root, '保存').click();
    button(root, '文件设置').click();
    ribbon
      .shadowRoot!.querySelectorAll<HTMLButtonElement>('.ribbon-tab')[1]
      .click();
    await ribbon.updateComplete;
    expect(root.textContent).toContain('新建');
    button(root, '新建').click();
    ribbon.selectTab('insert');
    expect(counts).toEqual({select: 1, command: 2, dialog: 1});
    expect(panelEvents).toBe(0);
    expect(ribbon.shadowRoot!.querySelector('.ribbon-content')).toBeNull();
  });

  it('独立命名、标签键盘导航及跨影子根往返焦点有效', async () => {
    const {ribbon, root} = await setup();
    const tab =
      ribbon.shadowRoot!.querySelector<HTMLButtonElement>('.ribbon-tab')!;
    expect(tab.hasAttribute('aria-controls')).toBe(false);
    const content = root.querySelector<HTMLElement>('[role="tabpanel"]')!;
    expect(content.getAttribute('aria-label')).toBe('开始');
    expect(content.hasAttribute('aria-labelledby')).toBe(false);
    tab.focus();
    key(tab, 'End');
    await ribbon.updateComplete;
    expect(ribbon.activeTabId).toBe('insert');
    const selected = ribbon.shadowRoot!.activeElement!;
    key(selected, 'ArrowDown');
    await aTimeout(20);
    expect(root.activeElement).toBe(content);
    key(content, 'ArrowUp');
    expect(ribbon.shadowRoot!.activeElement).toBe(selected);
  });

  it('折叠覆盖层定位在面板容器，内部点击保留，外部点击和 Escape 关闭并恢复焦点', async () => {
    const {host, ribbon, panel, root} = await setup();
    let changes = 0;
    ribbon.addEventListener('vsc-ribbon-collapse', () => changes++);
    ribbon.collapse();
    await ribbon.updateComplete;
    expect(root.querySelector<HTMLElement>('.ribbon-content')!.hidden).toBe(
      true
    );
    ribbon.selectTab('home');
    await ribbon.updateComplete;
    const content = root.querySelector<HTMLElement>('.ribbon-content')!;
    expect(content.hidden).toBe(false);
    expect(
      Math.abs(
        content.getBoundingClientRect().left -
          panel.getBoundingClientRect().left
      )
    ).toBeLessThan(1);
    expect(
      Math.abs(
        content.getBoundingClientRect().top - panel.getBoundingClientRect().top
      )
    ).toBeLessThan(1);
    content.dispatchEvent(
      new PointerEvent('pointerdown', {bubbles: true, composed: true})
    );
    await ribbon.updateComplete;
    expect(content.hidden).toBe(false);
    content.focus();
    key(content, 'Escape');
    await ribbon.updateComplete;
    expect(content.hidden).toBe(true);
    expect(ribbon.shadowRoot!.activeElement?.getAttribute('role')).toBe('tab');
    ribbon.selectTab('home');
    await ribbon.updateComplete;
    host.dispatchEvent(
      new PointerEvent('pointerdown', {bubbles: true, composed: true})
    );
    await aTimeout(0);
    await ribbon.updateComplete;
    expect(content.hidden).toBe(true);
    ribbon.expand();
    await ribbon.updateComplete;
    expect(changes).toBe(2);
  });

  it('动态数据与国际化更新仍使用原模型和公开状态', async () => {
    const {ribbon, root} = await setup();
    ribbon.selectTab('insert');
    ribbon.tabs = [
      {
        id: 'next',
        title: 'Updated',
        groups: [
          {
            id: 'g',
            title: 'Group',
            items: [{title: 'New command', command: 'next'}],
          },
        ],
      },
    ];
    ribbon.tablistLabel = 'Project ribbon';
    ribbon.collapseLabel = 'Collapse';
    await ribbon.updateComplete;
    expect(ribbon.activeTabId).toBe('next');
    expect(
      root.querySelector('[role="tabpanel"]')!.getAttribute('aria-label')
    ).toBe('Updated');
    expect(button(root, 'New command')).toBeDefined();
    expect(button(ribbon.shadowRoot!, 'Collapse')).toBeDefined();
  });

  it('响应式降级及滚动只采用面板宽度，标签栏可独立溢出', async () => {
    const {host, ribbon, panel, root} = await setup();
    ribbon.tabs = [
      {
        id: 'wide',
        title: '宽面板',
        groups: Array.from({length: 8}, (_, i) => ({
          id: `g${i}`,
          title: `功能组 ${i}`,
          items: [
            {title: `功能 ${i}`, command: `cmd${i}`},
            {title: `其他 ${i}`, command: `other${i}`},
          ],
        })),
      },
    ];
    await ribbon.updateComplete;
    const folded = () => root.querySelectorAll('.ribbon-group.folded').length;
    await aTimeout(150);
    const initial = folded();
    ribbon.style.width = '110px';
    await aTimeout(100);
    expect(folded()).toBe(initial);
    (host.querySelector('#outlet') as HTMLElement).style.width = '160px';
    await wait(() => folded() > initial);
    await wait(
      () => root.querySelector('.ribbon-scroll-button.right') !== null
    );
    root
      .querySelector<HTMLButtonElement>('.ribbon-scroll-button.right')!
      .click();
    expect(
      root.querySelector('.ribbon-scroll-viewport')!.scrollLeft
    ).toBeGreaterThan(0);
    expect(panel.clientWidth).toBe(160);
    (host.querySelector('#outlet') as HTMLElement).style.width = '1500px';
    await wait(() => folded() === 0);
    expect(ribbon.clientWidth).toBe(110);
  });

  it('混合 flyout 与 replace 菜单逐层返回，定位及触发焦点保留', async () => {
    const {ribbon, root} = await setup();
    const trigger = root.querySelector<HTMLButtonElement>(
      '.ribbon-split-trigger'
    )!;
    trigger.click();
    await aTimeout(60);
    const menu = root.querySelector<HTMLElement>('.ribbon-menu-popover')!;
    expect(menu.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      trigger.getBoundingClientRect().bottom
    );
    button(root, '父菜单').click();
    await aTimeout(60);
    const parent = button(root, '替换层');
    parent.click();
    await aTimeout(60);
    expect(root.querySelector('.ribbon-flyout-popover')!.textContent).toContain(
      '执行'
    );
    key(root.activeElement!, 'Escape');
    await aTimeout(60);
    expect(root.activeElement).toBe(button(root, '替换层'));
    key(root.activeElement!, 'Escape');
    await aTimeout(60);
    expect(root.activeElement).toBe(button(root, '父菜单'));
    key(root.activeElement!, 'Escape');
    await aTimeout(60);
    expect(root.activeElement).toBe(trigger);
    expect(root.querySelector('.ribbon-menu-popover')).toBeNull();
    expect(ribbon.activeTabId).toBe('home');
  });

  it('断开、重连、重新关联与独占检查保持状态并清理菜单', async () => {
    const {host, ribbon, panel, root} = await setup();
    ribbon.selectTab('insert');
    await ribbon.updateComplete;
    const parent = panel.parentNode!;
    panel.remove();
    await ribbon.updateComplete;
    expect(
      ribbon.shadowRoot!.querySelector('.ribbon-content')!.textContent
    ).toContain('新建');
    parent.appendChild(panel);
    await ribbon.updateComplete;
    expect(ribbon.shadowRoot!.querySelector('.ribbon-content')).toBeNull();
    expect(root.textContent).toContain('新建');
    const other = document.createElement('vscode-ribbon-panel');
    host.appendChild(other);
    ribbon.panel = other;
    await ribbon.updateComplete;
    await panel.updateComplete;
    expect(root.querySelector('.ribbon-content')).toBeNull();
    expect(other.shadowRoot!.textContent).toContain('新建');
    const second = document.createElement('vscode-ribbon');
    host.appendChild(second);
    expect(() => {
      second.panel = other;
    }).toThrow();
    expect(second.panel).toBeNull();
    const title = ribbon.parentNode!;
    ribbon.remove();
    await other.updateComplete;
    expect(other.shadowRoot!.querySelector('.ribbon-content')).toBeNull();
    title.appendChild(ribbon);
    await ribbon.updateComplete;
    expect(other.shadowRoot!.textContent).toContain('新建');
    ribbon.panel = null;
    await ribbon.updateComplete;
    second.panel = other;
    await second.updateComplete;
    second.panel = null;
    expect(ribbon.shadowRoot!.querySelector('.ribbon-content')).not.toBeNull();
  });
  for (const layout of ['menu', 'panel', 'gallery'] as const) {
    it(`分离面板中的 ${layout} 保留自定义内容、底部命令及关闭焦点`, async () => {
      const {ribbon, root} = await setup();
      ribbon.tabs = [
        {
          id: 'home',
          title: '开始',
          groups: [
            {
              id: 'g',
              title: '工具',
              items: [
                {
                  title: '布局入口',
                  type: 'dropdown',
                  menu: {
                    layout,
                    title: '内容标题',
                    custom: {html: '<p>自定义内容</p>', width: 160, height: 60},
                    items: [{title: '子命令', command: 'child'}],
                    footer: [{title: '底部命令', command: 'footer'}],
                  },
                },
              ],
            },
          ],
        },
      ];
      await ribbon.updateComplete;
      const trigger = button(root, '布局入口');
      trigger.click();
      await aTimeout(60);
      const menu = root.querySelector<HTMLElement>('.ribbon-menu-popover')!;
      expect(menu.getAttribute('role')).toBe(
        layout === 'panel' ? 'dialog' : 'menu'
      );
      expect(menu.querySelector('iframe')!.getAttribute('sandbox')).toBe('');
      if (layout === 'gallery') {
        expect(menu.querySelector('.ribbon-gallery')).not.toBeNull();
      }
      if (layout === 'panel') {
        expect(menu.getAttribute('aria-label')).toBe('内容标题');
      }
      key(root.activeElement!, 'Escape');
      await ribbon.updateComplete;
      expect(root.activeElement).toBe(trigger);
      trigger.click();
      await aTimeout(60);
      const commands: string[] = [];
      ribbon.addEventListener('vsc-ribbon-command', (event) =>
        commands.push(event.detail.command)
      );
      button(root, '底部命令').click();
      await ribbon.updateComplete;
      expect(commands).toEqual(['footer']);
      expect(root.querySelector('.ribbon-menu-popover')).toBeNull();
    });
  }

  it('折叠分组内菜单沿用弹层定位和焦点恢复，并响应面板主题变量', async () => {
    const {host, ribbon, panel, root} = await setup();
    (host.querySelector('#outlet') as HTMLElement).style.width = '120px';
    panel.style.setProperty('--vscode-editor-background', 'rgb(240, 240, 240)');
    panel.style.setProperty('--vscode-foreground', 'rgb(20, 20, 20)');
    await wait(() => root.querySelector('.ribbon-group.folded') !== null);
    expect(
      getComputedStyle(root.querySelector('.ribbon-content')!).backgroundColor
    ).toBe('rgb(240, 240, 240)');
    const trigger = root.querySelector<HTMLButtonElement>(
      '.ribbon-group-dropdown'
    )!;
    trigger.click();
    await aTimeout(60);
    const group = root.querySelector<HTMLElement>('.ribbon-group-popover')!;
    expect(group.getBoundingClientRect().width).toBeLessThanOrEqual(
      window.innerWidth - 16
    );
    group.querySelector<HTMLButtonElement>('.ribbon-split-trigger')!.click();
    await aTimeout(60);
    key(root.activeElement!, 'Escape');
    await aTimeout(40);
    expect(root.activeElement).toBe(trigger);
    ribbon.closeMenus();
    await ribbon.updateComplete;
    expect(root.querySelector('.ribbon-group-popover')).toBeNull();
  });

  it('可选持久化由 Ribbon 管理，重建模型与重新关联不会重复派发事件', async () => {
    const {ribbon, panel} = await setup();
    const storageKey = 'ribbon-separated-test';
    localStorage.setItem(
      storageKey,
      JSON.stringify({activeTabId: 'insert', collapsed: true})
    );
    let selections = 0;
    ribbon.addEventListener('vsc-ribbon-select', () => selections++);
    try {
      ribbon.storageKey = storageKey;
      ribbon.persistState = true;
      await ribbon.updateComplete;
      await ribbon.updateComplete;
      expect(ribbon.activeTabId).toBe('insert');
      expect(ribbon.collapsed).toBe(true);
      ribbon.panel = null;
      await ribbon.updateComplete;
      ribbon.panel = panel;
      ribbon.refreshLayout();
      await ribbon.updateComplete;
      expect(ribbon.activeTabId).toBe('insert');
      expect(selections).toBe(0);
      ribbon.expand();
      ribbon.selectTab('home');
      await ribbon.updateComplete;
      expect(selections).toBe(1);
      expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
        activeTabId: 'home',
        collapsed: false,
      });
    } finally {
      localStorage.removeItem(storageKey);
    }
  });
  it('封闭影子根内的菜单点击不误判为外部，根内其他区域仍可关闭菜单', async () => {
    const {ribbon, panel, root} = await setup('closed');
    root.querySelector<HTMLButtonElement>('.ribbon-split-trigger')!.click();
    await aTimeout(60);
    const menu = root.querySelector<HTMLElement>('.ribbon-menu-popover')!;
    menu.dispatchEvent(
      new PointerEvent('pointerdown', {bubbles: true, composed: true})
    );
    await aTimeout(0);
    expect(root.querySelector('.ribbon-menu-popover')).toBe(menu);
    const sibling = document.createElement('div');
    panel.parentNode!.appendChild(sibling);
    sibling.dispatchEvent(
      new PointerEvent('pointerdown', {bubbles: true, composed: true})
    );
    await aTimeout(0);
    await ribbon.updateComplete;
    expect(root.querySelector('.ribbon-menu-popover')).toBeNull();
  });
});
