import {afterEach} from 'vitest';
import '../vscode-ribbon/index.js';
import {
  aTimeout,
  expect,
  fixture,
  html,
  waitUntil,
} from '../includes/testing.js';
import type {VscRibbonCommandEvent, VscRibbonTab} from './ribbon-types.js';
import {VscodeRibbon} from './index.js';

const basicTabs = (): VscRibbonTab[] => [
  {
    id: 'home',
    title: '开始',
    default: true,
    groups: [
      {
        id: 'file',
        title: '文件',
        items: [
          {command: 'open', title: '打开', icon: 'folder-opened', size: 'half'},
          {command: 'save', title: '保存', icon: 'save', size: 'half'},
        ],
      },
    ],
  },
  {
    id: 'insert',
    title: '插入',
    groups: [
      {
        id: 'formwork',
        title: '模板',
        items: [
          {
            type: 'dropdown',
            title: '模板菜单',
            icon: 'symbol-class',
            menu: {
              items: [
                {
                  command: 'slab',
                  title: '板模板',
                  keybinding: 'Ctrl+1',
                  order: 10,
                },
                {command: 'beam', title: '梁模板', order: 20},
                {
                  title: '更多',
                  order: 30,
                  menu: {
                    items: [{command: 'nested', title: '嵌套命令'}],
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  },
];

async function createRibbon(tabs: VscRibbonTab[] = basicTabs(), style = '') {
  const el = await fixture<VscodeRibbon>(html`
    <vscode-ribbon
      style=${style}
      .tabs=${tabs}
      @vsc-ribbon-command=${(event: VscRibbonCommandEvent) => {
        el.dataset.lastCommand = event.detail.command;
      }}
    ></vscode-ribbon>
  `);
  await el.updateComplete;
  await aTimeout(24);
  return el;
}

function waitFor(condition: () => boolean, timeout = 3000) {
  return waitUntil(condition, '等待功能区状态超时', {
    interval: 50,
    timeout,
  });
}

function shadowButton(el: VscodeRibbon, label: string) {
  return Array.from(
    el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button') ?? []
  ).find((button) => button.getAttribute('aria-label') === label);
}

async function openMenu(el: VscodeRibbon, label: string) {
  const trigger = shadowButton(el, label);
  expect(trigger).to.not.equal(undefined);
  trigger!.click();
  await waitFor(
    () => el.shadowRoot?.querySelector('.ribbon-menu-popover') !== null
  );
  await aTimeout(32);
  return el.shadowRoot!.querySelector<HTMLElement>('.ribbon-menu-popover')!;
}

afterEach(() => {
  document.body.classList.remove('vscode-dark', 'vscode-high-contrast');
});

describe('vscode-ribbon', () => {
  it('is defined', () => {
    const el = document.createElement('vscode-ribbon');
    expect(el).to.be.instanceOf(VscodeRibbon);
  });

  it('is accessible', async () => {
    const el = await createRibbon();
    await expect(el).toBeAccessible();
  });

  it('渲染标签、分组与按钮并默认选中 default 标签', async () => {
    const el = await createRibbon();
    const tabs = el.shadowRoot!.querySelectorAll('[role="tab"]');
    expect(tabs).to.have.length(2);
    expect(tabs[0].getAttribute('aria-selected')).to.equal('true');
    expect(el.shadowRoot!.querySelectorAll('.ribbon-group')).to.have.length(1);
    expect(el.shadowRoot!.textContent).to.contain('文件');
    expect(shadowButton(el, '打开')).to.not.equal(undefined);
    expect(
      el.shadowRoot!.querySelector('[role="tab"][aria-selected="true"]')
        ?.textContent
    ).to.contain('开始');
  });

  it('点击标签切换并派发选择事件', async () => {
    const el = await createRibbon();
    let selected = '';
    el.addEventListener('vsc-ribbon-select', (event) => {
      selected = event.detail.tabId;
    });
    const insert = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    ).find((tab) => tab.textContent?.trim() === '插入')!;
    insert.click();
    await el.updateComplete;
    expect(selected).to.equal('insert');
    expect(el.activeTabId).to.equal('insert');
    expect(
      el.shadowRoot!.querySelector('[role="tab"][aria-selected="true"]')
        ?.textContent
    ).to.contain('插入');
  });

  it('标签栏支持方向键、Home 与 End', async () => {
    const el = await createRibbon();
    const home =
      el.shadowRoot!.querySelector<HTMLButtonElement>('[role="tab"]')!;
    home.focus();
    home.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        composed: true,
      })
    );
    await el.updateComplete;
    await aTimeout(0);
    expect(el.activeTabId).to.equal('insert');
    expect(el.shadowRoot!.activeElement?.getAttribute('data-tab-id')).to.equal(
      'insert'
    );
    const insert = el.shadowRoot!.activeElement as HTMLButtonElement;
    insert.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
        composed: true,
      })
    );
    await el.updateComplete;
    expect(el.activeTabId).to.equal('home');
  });

  it('激活命令按钮时派发 vsc-ribbon-command', async () => {
    const el = await createRibbon();
    let detail: VscRibbonCommandEvent['detail'] | null = null;
    el.addEventListener('vsc-ribbon-command', (event) => {
      detail = event.detail;
    });
    shadowButton(el, '打开')!.click();
    await el.updateComplete;
    expect(detail).to.include({
      command: 'open',
      tabId: 'home',
    });
    expect(detail!.item.title).to.equal('打开');
  });

  it('下拉菜单默认左对齐，并支持方向键与 Escape', async () => {
    const el = await createRibbon();
    const selectTab = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    ).find((tab) => tab.textContent?.trim() === '插入')!;
    selectTab.click();
    await el.updateComplete;
    await aTimeout(24);

    const menu = await openMenu(el, '模板菜单');
    const first = menu.querySelector<HTMLElement>('.ribbon-menu-item')!;
    expect(getComputedStyle(first).textAlign).to.equal('left');
    expect(getComputedStyle(first).justifyContent).to.equal('flex-start');
    expect(
      getComputedStyle(first.querySelector('.ribbon-label')!).textAlign
    ).to.equal('left');
    expect(first.textContent).to.contain('板模板');
    expect(el.shadowRoot!.activeElement).to.equal(first);

    menu.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        composed: true,
      })
    );
    expect(el.shadowRoot!.activeElement?.textContent).to.contain('梁模板');

    menu.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        composed: true,
      })
    );
    await el.updateComplete;
    await aTimeout(16);
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.equal(null);
    expect(el.shadowRoot!.activeElement?.getAttribute('aria-label')).to.equal(
      '模板菜单'
    );
  });

  it('支持递归子菜单与返回导航', async () => {
    const el = await createRibbon();
    Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[role="tab"]'))
      .find((tab) => tab.textContent?.trim() === '插入')!
      .click();
    await el.updateComplete;
    const menu = await openMenu(el, '模板菜单');
    const more = Array.from(
      menu.querySelectorAll<HTMLButtonElement>('.ribbon-menu-item')
    ).find((item) => item.textContent?.includes('更多'))!;
    more.click();
    await el.updateComplete;
    await aTimeout(32);
    const back =
      el.shadowRoot!.querySelector<HTMLButtonElement>('.ribbon-menu-back')!;
    expect(back).to.not.equal(null);
    expect(menu.textContent).to.contain('嵌套命令');
    back.click();
    await el.updateComplete;
    await aTimeout(32);
    expect(
      el.shadowRoot!.querySelector('.ribbon-menu-popover')?.textContent
    ).to.contain('板模板');
    expect(el.shadowRoot!.querySelector('.ribbon-menu-back')).to.equal(null);
  });

  it('分割按钮分别触发主命令与菜单', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'file',
            title: '文件',
            items: [
              {
                type: 'splitButton',
                command: 'save',
                title: '保存',
                icon: 'save',
                menu: {items: [{command: 'save-as', title: '另存为'}]},
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    let command = '';
    el.addEventListener('vsc-ribbon-command', (event) => {
      command = event.detail.command;
    });
    const primary = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-item-primary'
    )!;
    primary.click();
    await el.updateComplete;
    expect(command).to.equal('save');
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.equal(null);

    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-split-trigger'
    )!;
    trigger.click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-menu-popover') !== null
    );
    await aTimeout(32);
    expect(
      el.shadowRoot!.querySelector('.ribbon-menu-item')?.textContent
    ).to.contain('另存为');
  });

  it('面板菜单使用列数网格并渲染沙箱内容', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'formwork',
            title: '模板',
            items: [
              {
                type: 'dropdown',
                title: '板模板',
                icon: 'symbol-class',
                menu: {
                  layout: 'panel',
                  title: '板模板选项',
                  columns: 2,
                  items: [
                    {command: 'ringlock', title: '盘扣式', icon: 'layers'},
                    {command: 'coupler', title: '扣件式', icon: 'layers'},
                  ],
                  custom: {
                    html: '<p>按规范选择模板体系。</p>',
                    css: 'p{color:red}',
                    width: 280,
                    height: 120,
                  },
                },
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    const menu = await openMenu(el, '板模板');
    expect(menu.getAttribute('role')).to.equal('dialog');
    expect(menu.querySelector('.ribbon-panel-title')?.textContent).to.contain(
      '板模板选项'
    );
    const grid = menu.querySelector<HTMLElement>('.ribbon-panel-grid')!;
    expect(grid.style.getPropertyValue('--vsc-ribbon-panel-columns')).to.equal(
      '2'
    );
    const iframe = menu.querySelector<HTMLIFrameElement>(
      '.ribbon-custom-content'
    )!;
    expect(iframe.getAttribute('sandbox')).to.equal('');
    expect(iframe.srcdoc).to.contain(`default-src 'none'`);
    expect(iframe.srcdoc).to.contain('按规范选择模板体系。');
    expect(grid.querySelectorAll('.ribbon-panel-item')).to.have.length(2);
  });

  it('占位按钮禁用并显示提示', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'group',
            title: '组',
            items: [{title: '未实现', icon: 'circle-slash'}],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    const button = shadowButton(el, '未实现')!;
    expect(button.disabled).to.equal(true);
    expect(button.title).to.contain('功能尚未实现');
  });

  it('折叠后点击标签打开覆盖层，Escape 关闭', async () => {
    const el = await createRibbon();
    const collapse =
      el.shadowRoot!.querySelector<HTMLButtonElement>('.ribbon-collapse')!;
    collapse.click();
    await el.updateComplete;
    expect(el.collapsed).to.equal(true);
    const content =
      el.shadowRoot!.querySelector<HTMLElement>('.ribbon-content')!;
    expect(content.hidden).to.equal(true);

    el.shadowRoot!.querySelector<HTMLButtonElement>('[role="tab"]')!.click();
    await el.updateComplete;
    await aTimeout(16);
    expect(content.hidden).to.equal(false);
    expect(content.classList.contains('is-overlay')).to.equal(true);

    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    );
    await el.updateComplete;
    expect(content.hidden).to.equal(true);
  });

  it('响应式降级可合并同 id 按钮', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'group',
            title: '基坑',
            items: [
              {
                command: 'slope',
                title: '边坡稳定',
                icon: 'layers',
                responsive: [
                  {size: 'half'},
                  {size: 'third'},
                  {size: 'third', style: 'icon'},
                ],
                responsiveMenu: {
                  id: 'pit',
                  title: '基坑计算',
                  icon: 'layers',
                },
              },
              {
                command: 'support',
                title: '围护支撑',
                icon: 'layers',
                responsive: [
                  {size: 'half'},
                  {size: 'third'},
                  {size: 'third', style: 'icon'},
                ],
                responsiveMenu: {
                  id: 'pit',
                  title: '基坑计算',
                  icon: 'layers',
                },
              },
              {
                command: 'anchor',
                title: '加固锚固',
                icon: 'layers',
                responsive: [
                  {size: 'half'},
                  {size: 'third'},
                  {size: 'third', style: 'icon'},
                ],
                responsiveMenu: {
                  id: 'pit',
                  title: '基坑计算',
                  icon: 'layers',
                },
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs, 'width: 40px');
    await waitFor(() => shadowButton(el, '基坑计算') !== undefined);
    expect(
      shadowButton(el, '基坑计算')?.getAttribute('aria-haspopup')
    ).to.equal('menu');
    expect(shadowButton(el, '边坡稳定')).to.equal(undefined);
  });

  it('宽度不足时折叠分组并保留分组入口', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'group',
            title: '分组',
            items: [
              {
                command: 'run',
                title: '很长的按钮',
                icon: 'play',
                responsive: [{size: 'half'}, {size: 'third'}],
              },
            ],
          },
          {
            id: 'second-group',
            title: '第二组',
            items: [{command: 'other', title: '另一个', icon: 'add'}],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs, 'width: 90px');
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group.folded') !== null
    );
    const folded = el.shadowRoot!.querySelector('.ribbon-group.folded')!;
    expect(folded.getAttribute('aria-label')).to.equal('分组');
    expect(folded.querySelector('.ribbon-group-dropdown')).to.not.equal(null);
  });

  it('可持久化折叠状态与活动标签', async () => {
    const key = `ribbon-test-${Date.now()}`;
    localStorage.removeItem(key);
    const tabs = basicTabs();
    const first = await fixture<VscodeRibbon>(html`
      <vscode-ribbon
        storage-key=${key}
        persist-state
        .tabs=${tabs}
      ></vscode-ribbon>
    `);
    await first.updateComplete;
    await aTimeout(24);
    first
      .shadowRoot!.querySelector<HTMLButtonElement>('.ribbon-collapse')!
      .click();
    await first.updateComplete;
    expect(JSON.parse(localStorage.getItem(key)!).collapsed).to.equal(true);

    const second = await fixture<VscodeRibbon>(html`
      <vscode-ribbon
        storage-key=${key}
        persist-state
        .tabs=${tabs}
      ></vscode-ribbon>
    `);
    await waitFor(() => second.collapsed === true, 2000);
    localStorage.removeItem(key);
  });

  it('主题变更时切换浅色与深色图标', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'group',
            title: '组',
            items: [
              {
                command: 'run',
                title: '运行',
                icon: {light: '$(sun)', dark: '$(moon)'},
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    const icon = () =>
      el.shadowRoot!.querySelector('.ribbon-item .ribbon-icon')!;
    expect(icon().className).to.contain('codicon-sun');
    document.body.classList.add('vscode-dark');
    await el.updateComplete;
    await aTimeout(0);
    expect(icon().className).to.contain('codicon-moon');
  });
});
