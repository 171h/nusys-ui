import {afterEach} from 'vitest';
import '../vscode-ribbon/index.js';
import {
  aTimeout,
  expect,
  fixture,
  html,
  waitUntil,
} from '../includes/testing.js';
import type {
  VscRibbonCommandEvent,
  VscRibbonDialogEvent,
  VscRibbonTab,
} from './ribbon-types.js';
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

const overflowTabs = (): VscRibbonTab[] => [
  {
    id: 'home',
    title: '开始',
    default: true,
    groups: [
      {
        id: 'file',
        title: '文件',
        items: [
          {command: 'open', title: '打开', icon: 'folder-opened'},
          {command: 'save', title: '保存', icon: 'save'},
          {
            command: 'save-all',
            title: '全部保存',
            icon: 'save-all',
            size: 'half',
          },
        ],
      },
      {
        id: 'edit',
        title: '编辑',
        items: [
          {command: 'undo', title: '撤销', icon: 'discard'},
          {command: 'redo', title: '重做', icon: 'redo', size: 'half'},
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
  for (const type of ['dropdown', 'splitButton'] as const) {
    for (const keyboard of [false, true]) {
      it(`折叠分组中的 ${type} 通过${keyboard ? 'ArrowDown' : '点击'}打开菜单后保留锚点与 Escape 焦点`, async () => {
        const tabs = basicTabs();
        tabs[0].groups![0].items = [
          {
            type,
            command: 'primary',
            title: '菜单',
            menu: {items: [{command: 'child', title: '子命令'}]},
          },
          {command: 'other', title: '其他'},
        ];
        const el = await createRibbon(tabs, 'width: 90px; margin: 40px');
        await waitFor(
          () => el.shadowRoot!.querySelector('.ribbon-group.folded') !== null
        );
        const groupTrigger = el.shadowRoot!.querySelector<HTMLButtonElement>(
          '.ribbon-group.folded .ribbon-group-dropdown'
        )!;
        groupTrigger.click();
        await el.updateComplete;
        const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(
          `.ribbon-group-popover ${type === 'splitButton' ? '.ribbon-split-trigger' : '.ribbon-item'}`
        )!;
        expect(trigger).to.not.equal(null);
        if (keyboard) {
          trigger.focus();
          trigger.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'ArrowDown',
              bubbles: true,
              composed: true,
            })
          );
        } else trigger.click();
        await el.updateComplete;
        await aTimeout(48);
        const menu = el.shadowRoot!.querySelector<HTMLElement>(
          '.ribbon-menu-popover'
        )!;
        expect(el.shadowRoot!.querySelector('.ribbon-group-popover')).to.equal(
          null
        );
        expect(menu.getBoundingClientRect().top).to.be.closeTo(
          groupTrigger.getBoundingClientRect().bottom + 2,
          1
        );
        document.dispatchEvent(
          new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
        );
        await el.updateComplete;
        expect(el.shadowRoot!.activeElement).to.equal(groupTrigger);
      });
    }
  }

  it('对话框启动器支持默认、Codicon 与图片图标双向切换', async () => {
    const tabs = basicTabs();
    const group = tabs[0].groups![0];
    group.dialogLauncher = {icon: 'settings-gear'};
    const el = await createRibbon(tabs);
    for (const icon of [
      undefined,
      'settings-gear',
      './icon.svg',
      undefined,
      './icon.svg',
    ]) {
      group.dialogLauncher = icon ? {icon} : true;
      el.tabs = [...tabs];
      await el.updateComplete;
      const element = el.shadowRoot!.querySelector(
        '.ribbon-group-dialog-icon'
      )!;
      expect(element.classList.contains('is-rotated')).to.equal(!icon);
      expect(element.classList.contains('is-image')).to.equal(
        icon === './icon.svg'
      );
      if (!icon)
        expect(element.classList.contains('codicon-link-external')).to.equal(
          true
        );
    }
  });

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

  it('菜单分组标题不可聚焦，说明文字显示在标题下方', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'insert',
            title: '插入',
            items: [
              {
                command: 'insert-image',
                title: '插入图片',
                icon: 'file-media',
                menu: {
                  items: [
                    {heading: true, title: '插入图片来自', order: 1},
                    {
                      command: 'local',
                      title: '此设备',
                      icon: 'folder-opened',
                      keybinding: 'D',
                      description: '从当前设备选择图片',
                      order: 2,
                    },
                    {
                      command: 'online',
                      title: '联机图片',
                      icon: 'globe',
                      description: '第一行\n第二行',
                      order: 3,
                    },
                    {heading: true, title: '最近使用', order: 4},
                    {
                      command: 'recent',
                      title: '最近插入的图片',
                      icon: 'history',
                      order: 5,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    const menu = await openMenu(el, '插入图片');
    const headings = Array.from(
      menu.querySelectorAll<HTMLElement>('.ribbon-menu-heading')
    );
    expect(headings.map((item) => item.textContent?.trim())).to.deep.equal([
      '插入图片来自',
      '最近使用',
    ]);
    expect(headings[0].getAttribute('role')).to.equal('presentation');
    expect(menu.querySelectorAll('[role="menuitem"]')).to.have.length(3);
    expect(el.shadowRoot!.activeElement?.textContent).to.contain('此设备');
    const description = menu.querySelector<HTMLElement>(
      '.ribbon-menu-description'
    )!;
    expect(description.textContent).to.contain('从当前设备选择图片');
    const multiLine = Array.from(
      menu.querySelectorAll<HTMLElement>('.ribbon-menu-description')
    )[1];
    expect(multiLine.textContent).to.contain('第一行');
    expect(getComputedStyle(multiLine).whiteSpace).to.equal('pre-line');
  });

  it('面板中的分组标题与说明文字', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'layout',
            title: '布局',
            items: [
              {
                command: 'margins',
                title: '页边距',
                icon: 'layout',
                menu: {
                  layout: 'panel',
                  title: '页边距',
                  columns: 1,
                  items: [
                    {heading: true, title: '上次的自定义设置', order: 1},
                    {
                      command: 'custom',
                      title: '自定义',
                      icon: 'layout',
                      description:
                        '上：2.5 厘米　下：2.5 厘米\n左：2.5 厘米　右：2.5 厘米',
                      order: 2,
                    },
                    {heading: true, title: '预设页边距', order: 3},
                    {
                      command: 'narrow',
                      title: '窄',
                      icon: 'layout',
                      description: '上：1.27 厘米　下：1.27 厘米',
                      order: 4,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    await openMenu(el, '页边距');
    const headings = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLElement>('.ribbon-panel-heading')
    );
    expect(
      headings.map((heading) => heading.textContent?.trim())
    ).to.deep.equal(['上次的自定义设置', '预设页边距']);
    const descriptions = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLElement>('.ribbon-panel-description')
    );
    expect(descriptions).to.have.length(2);
    expect(descriptions[0].textContent).to.contain('上：2.5 厘米');
    expect(getComputedStyle(descriptions[0]).whiteSpace).to.equal('pre-line');
  });

  it('面板底部操作区支持键盘导航与命令执行', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'layout',
            title: '布局',
            items: [
              {
                command: 'margins',
                title: '页边距',
                icon: 'layout',
                menu: {
                  layout: 'panel',
                  title: '页边距',
                  columns: 1,
                  items: [
                    {heading: true, title: '预设页边距', order: 1},
                    {
                      command: 'normal',
                      title: '常规',
                      icon: 'layout',
                      order: 2,
                    },
                  ],
                  footer: [
                    {
                      command: 'custom-margin',
                      title: '自定义页边距',
                      icon: 'settings-gear',
                      keybinding: 'A',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    const menu = await openMenu(el, '页边距');
    const footer = menu.querySelector<HTMLElement>('.ribbon-panel-footer')!;
    expect(footer).to.not.equal(null);
    expect(footer.getAttribute('part')).to.equal('panel-footer');
    const footerItem = footer.querySelector<HTMLButtonElement>(
      '.ribbon-panel-footer-item'
    )!;
    expect(footerItem.getAttribute('aria-label')).to.equal('自定义页边距');
    expect(
      footerItem.querySelector('.ribbon-menu-keybinding')?.textContent
    ).to.equal('A');

    menu.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
        composed: true,
      })
    );
    expect(el.shadowRoot!.activeElement).to.equal(footerItem);

    footerItem.click();
    await el.updateComplete;
    expect(el.dataset.lastCommand).to.equal('custom-margin');
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.equal(null);
  });

  it('图库式面板按列渲染预览格子并执行命令', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'styles',
            title: '样式',
            items: [
              {
                type: 'dropdown',
                title: '样式库',
                icon: 'symbol-color',
                menu: {
                  layout: 'gallery',
                  title: '样式库',
                  columns: 4,
                  items: [
                    {heading: true, title: '内置样式', order: 1},
                    {
                      command: 'normal',
                      title: '正文',
                      preview: 'data:image/svg+xml;utf8,<svg/>',
                      order: 2,
                    },
                    {
                      command: 'heading-1',
                      title: '标题 1',
                      description: '标题样式',
                      order: 3,
                    },
                    {
                      command: 'heading-2',
                      title: '标题 2',
                      icon: 'symbol-color',
                      order: 4,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    const menu = await openMenu(el, '样式库');
    const gallery = menu.querySelector<HTMLElement>('.ribbon-gallery')!;
    expect(gallery).to.not.equal(null);
    expect(gallery.getAttribute('part')).to.equal('gallery');
    expect(
      gallery.style.getPropertyValue('--vsc-ribbon-gallery-columns')
    ).to.equal('4');
    expect(
      gallery.querySelector('.ribbon-gallery-heading')?.textContent
    ).to.contain('内置样式');
    const items = Array.from(
      gallery.querySelectorAll<HTMLButtonElement>('.ribbon-gallery-item')
    );
    expect(items).to.have.length(3);
    expect(items[0].querySelector('.ribbon-gallery-image')).to.not.equal(null);
    expect(
      items[1].querySelector('.ribbon-gallery-description')?.textContent
    ).to.contain('标题样式');
    expect(
      items[2].querySelector('.ribbon-gallery-icon')?.className
    ).to.contain('codicon-symbol-color');
    expect(items[0].getAttribute('role')).to.equal('menuitem');

    items[1].click();
    await el.updateComplete;
    expect(el.dataset.lastCommand).to.equal('heading-1');
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.equal(null);
  });

  it('图库布局的功能组支持横向滚动与折叠弹层', async () => {
    const preview = 'data:image/svg+xml;utf8,<svg/>';
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'format',
            title: '文档格式',
            layout: 'gallery',
            dialogLauncher: true,
            items: Array.from({length: 8}, (_, index) => ({
              command: `format-${index}`,
              title: `格式 ${index + 1}`,
              preview,
            })),
          },
        ],
      },
    ];
    const el = await createRibbon(tabs, 'width: 360px');
    await waitFor(
      () => el.shadowRoot?.querySelectorAll('.ribbon-gallery-tile').length === 8
    );
    const viewport = el.shadowRoot!.querySelector<HTMLElement>(
      '.ribbon-gallery-viewport'
    )!;
    expect(viewport.scrollWidth).to.be.greaterThan(viewport.clientWidth);
    const scrollButtons = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLButtonElement>(
        '.ribbon-gallery-scroll'
      )
    );
    scrollButtons[1].click();
    await aTimeout(32);
    expect(viewport.scrollLeft).to.be.greaterThan(0);

    let command = '';
    el.addEventListener('vsc-ribbon-command', (event) => {
      command = (event as VscRibbonCommandEvent).detail.command ?? '';
    });
    el.shadowRoot!.querySelector<HTMLElement>('.ribbon-gallery-tile')!.click();
    await el.updateComplete;
    expect(command).to.equal('format-0');

    el.style.width = '120px';
    el.refreshLayout();
    await waitFor(
      () =>
        el.shadowRoot?.querySelector('.ribbon-group-gallery.folded') !== null
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-group.folded .ribbon-group-dropdown'
    )!.click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-gallery-popover') !== null
    );
    await aTimeout(32);
    expect(
      el.shadowRoot!.querySelectorAll(
        '.ribbon-gallery-popover .ribbon-gallery-tile'
      )
    ).to.have.length(8);
  });

  it('flyout 子菜单在父菜单旁展开并保留父菜单', async () => {
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
                  items: [
                    {command: 'ringlock', title: '盘扣式', icon: 'layers'},
                    {command: 'coupler', title: '扣件式', icon: 'layers'},
                    {
                      title: '更多体系',
                      icon: 'ellipsis',
                      submenuMode: 'flyout',
                      menu: {
                        items: [
                          {
                            command: 'portal',
                            title: '门式脚手架',
                            icon: 'layers',
                          },
                          {command: 'climb', title: '爬模', icon: 'layers'},
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
    ];
    const el = await createRibbon(tabs);
    const menu = await openMenu(el, '板模板');
    const more = Array.from(
      menu.querySelectorAll<HTMLButtonElement>('.ribbon-menu-item')
    ).find((item) => item.textContent?.includes('更多体系'))!;
    more.click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-flyout-popover') !== null
    );
    await aTimeout(32);
    // 父菜单保持打开且不显示返回按钮。
    expect(menu.textContent).to.contain('盘扣式');
    expect(menu.querySelector('.ribbon-menu-back')).to.equal(null);
    const flyout = el.shadowRoot!.querySelector<HTMLElement>(
      '.ribbon-flyout-popover'
    )!;
    expect(flyout.getAttribute('role')).to.equal('menu');
    expect(flyout.textContent).to.contain('门式脚手架');
    expect(el.shadowRoot!.activeElement?.textContent).to.contain('门式脚手架');

    // Escape 先关闭 flyout，再关闭父菜单。
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.ribbon-flyout-popover')).to.equal(
      null
    );
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.not.equal(
      null
    );
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.equal(null);
  });

  it('flyout 子菜单执行命令后关闭全部菜单', async () => {
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
                  items: [
                    {
                      title: '更多体系',
                      icon: 'ellipsis',
                      submenuMode: 'flyout',
                      menu: {
                        items: [
                          {
                            command: 'portal',
                            title: '门式脚手架',
                            icon: 'layers',
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
    ];
    const el = await createRibbon(tabs);
    await openMenu(el, '板模板');
    const more =
      el.shadowRoot!.querySelector<HTMLButtonElement>('.ribbon-menu-item')!;
    more.click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-flyout-popover') !== null
    );
    await aTimeout(32);
    const flyoutItem = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-flyout-popover .ribbon-menu-item'
    )!;
    flyoutItem.click();
    await el.updateComplete;
    expect(el.dataset.lastCommand).to.equal('portal');
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.equal(null);
    expect(el.shadowRoot!.querySelector('.ribbon-flyout-popover')).to.equal(
      null
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
              {
                type: 'dropdown',
                title: '板模板',
                icon: 'symbol-class',
                menu: {items: [{command: 'slab', title: '盘扣式'}]},
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
    const split = el.shadowRoot!.querySelector<HTMLElement>('.ribbon-split')!;
    expect(split.getAttribute('role')).to.equal('group');
    expect(split.getAttribute('aria-label')).to.equal('保存');
    const primary = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-item-primary'
    )!;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-split-trigger'
    )!;
    expect(primary).to.not.equal(trigger);
    expect(primary.getAttribute('title')).to.equal('保存');
    expect(trigger.getAttribute('aria-haspopup')).to.equal('menu');
    const transparent = (color: string) =>
      color === 'transparent' || /rgba\(0, 0, 0, 0\)/.test(color);
    // 未悬停时分格线与组合外边框均不显示。
    expect(transparent(getComputedStyle(trigger).boxShadow)).to.equal(true);
    expect(getComputedStyle(split).outlineStyle).to.equal('none');
    expect(transparent(getComputedStyle(primary).backgroundColor)).to.equal(
      true
    );
    expect(transparent(getComputedStyle(trigger).backgroundColor)).to.equal(
      true
    );
    // Office 风格：上半部分只显示图标，下半部分合并标题与下拉箭头。
    expect(primary.querySelector('.ribbon-icon')).to.not.equal(null);
    expect(primary.querySelector('.ribbon-label')).to.equal(null);
    expect(trigger.querySelector('.ribbon-label-text')?.textContent).to.equal(
      '保存'
    );
    expect(trigger.querySelector('.ribbon-chevron')).to.not.equal(null);
    const splitRect = split.getBoundingClientRect();
    expect(splitRect.width).to.be.lessThan(64);
    expect(splitRect.width).to.be.greaterThan(30);
    // 全高按钮图标统一为按钮高度一半的正方形。
    const splitIconRect = primary
      .querySelector('.ribbon-icon')!
      .getBoundingClientRect();
    expect(Math.round(splitIconRect.width)).to.equal(
      Math.round(splitIconRect.height)
    );
    expect(Math.abs(splitIconRect.height * 2 - splitRect.height)).to.be.at.most(
      1
    );
    // 图标、标题与箭头分别与相邻整高下拉按钮的对应行水平对齐。
    const dropdown = el.shadowRoot!.querySelector<HTMLElement>(
      '.ribbon-item.is-dropdown.ribbon-item-vertical'
    )!;
    const dropdownIconRect = dropdown
      .querySelector('.ribbon-icon')!
      .getBoundingClientRect();
    expect(Math.round(dropdownIconRect.width)).to.equal(
      Math.round(splitIconRect.width)
    );
    expect(Math.round(dropdownIconRect.height)).to.equal(
      Math.round(splitIconRect.height)
    );
    const rowDelta = (left: Element | null, right: Element | null) =>
      Math.abs(
        left!.getBoundingClientRect().top - right!.getBoundingClientRect().top
      );
    expect(
      rowDelta(
        primary.querySelector('.ribbon-icon'),
        dropdown.querySelector('.ribbon-icon')
      )
    ).to.be.at.most(1);
    expect(
      rowDelta(
        trigger.querySelector('.ribbon-label-text'),
        dropdown.querySelector('.ribbon-label-text')
      )
    ).to.be.at.most(1);
    expect(
      rowDelta(
        trigger.querySelector('.ribbon-chevron'),
        dropdown.querySelector('.ribbon-chevron')
      )
    ).to.be.at.most(1);
    primary.click();
    await el.updateComplete;
    expect(command).to.equal('save');
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.equal(null);

    trigger.click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-menu-popover') !== null
    );
    await aTimeout(32);
    expect(
      el.shadowRoot!.querySelector('.ribbon-menu-item')?.textContent
    ).to.contain('另存为');
    // 展开菜单时只有触发区保持激活背景，主命令区域不显示激活背景。
    expect(transparent(getComputedStyle(split).backgroundColor)).to.equal(true);
    expect(transparent(getComputedStyle(primary).backgroundColor)).to.equal(
      true
    );
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
    expect(shadowButton(el, '板模板')?.getAttribute('aria-haspopup')).to.equal(
      'dialog'
    );
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

  it('宽度不足时将整组折叠为溢出下拉入口', async () => {
    const el = await createRibbon(overflowTabs(), 'width: 140px');
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group.folded') !== null
    );
    const foldedGroups = Array.from(
      el.shadowRoot!.querySelectorAll('.ribbon-group.folded')
    );
    expect(foldedGroups.length).to.be.greaterThan(0);
    const trigger = foldedGroups[foldedGroups.length - 1].querySelector(
      '.ribbon-group-dropdown'
    );
    expect(trigger).to.not.equal(null);
    expect(trigger!.getAttribute('aria-haspopup')).to.equal('dialog');
    expect((trigger as HTMLElement).getClientRects().length).to.be.greaterThan(
      0
    );
    // 普通按钮不会合并成单个下拉入口。
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.equal(null);
    expect(shadowButton(el, '基坑计算')).to.equal(undefined);
  });

  it('溢出下拉弹层按原始布局完整呈现分组按钮', async () => {
    const el = await createRibbon(overflowTabs(), 'width: 140px');
    await waitFor(
      () =>
        el.shadowRoot?.querySelector(
          '.ribbon-group[data-group="edit"].folded'
        ) !== null
    );
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-group[data-group="edit"] .ribbon-group-dropdown'
    )!;
    trigger.click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group-popover') !== null
    );
    await aTimeout(32);
    const popover = el.shadowRoot!.querySelector('.ribbon-group-popover')!;
    expect(popover.getAttribute('aria-label')).to.equal('编辑');
    const items = Array.from(popover.querySelectorAll('.ribbon-item'));
    expect(items.map((item) => item.getAttribute('aria-label'))).to.deep.equal([
      '撤销',
      '重做',
    ]);
    // 弹层使用声明的原始尺寸与样式，而不是折叠时的降级布局。
    expect(items[0].className).to.contain('ribbon-item-full');
    expect(items[0].className).to.contain('ribbon-item-vertical');
    expect(items[1].className).to.contain('ribbon-item-half');
    expect(items[0].querySelector('.ribbon-icon')?.className).to.contain(
      'codicon-discard'
    );
    (items[0] as HTMLElement).click();
    await el.updateComplete;
    expect(el.dataset.lastCommand).to.equal('undo');
    expect(el.shadowRoot!.querySelector('.ribbon-group-popover')).to.equal(
      null
    );
  });

  it('容器变宽后分组展开并关闭溢出弹层', async () => {
    const el = await createRibbon(overflowTabs(), 'width: 140px');
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group.folded') !== null
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-group.folded .ribbon-group-dropdown'
    )!.click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group-popover') !== null
    );
    el.style.width = '1000px';
    el.refreshLayout();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group.folded') === null
    );
    expect(el.shadowRoot!.querySelector('.ribbon-group-popover')).to.equal(
      null
    );
    const visibleItems = Array.from(
      el.shadowRoot!.querySelectorAll(
        '.ribbon-group[data-group="file"] .ribbon-item'
      )
    ).filter((item) => item.getClientRects().length > 0);
    expect(visibleItems.length).to.equal(3);
    expect(visibleItems[0].className).to.contain('ribbon-item-full');
  });

  it('仅包含单个下拉按钮的分组宽度不足时保持原有菜单结构', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'plain',
            title: '文字',
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
            id: 'styles',
            title: '样式',
            items: [
              {
                type: 'dropdown',
                title: '样式库',
                icon: 'symbol-color',
                menu: {
                  layout: 'gallery',
                  columns: 2,
                  items: [
                    {
                      command: 'style-a',
                      title: '样式 A',
                      preview: 'data:image/svg+xml;utf8,<svg/>',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs, 'width: 120px');
    await waitFor(
      () =>
        el.shadowRoot?.querySelector(
          '.ribbon-group[data-group="plain"].folded'
        ) !== null
    );
    expect(
      el.shadowRoot!.querySelector('.ribbon-group[data-group="styles"].folded')
    ).to.equal(null);
    const galleryTrigger = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-group[data-group="styles"] .ribbon-item'
    )!;
    expect(galleryTrigger.getClientRects().length).to.be.greaterThan(0);
    galleryTrigger.click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-gallery') !== null
    );
    expect(el.shadowRoot!.querySelector('.ribbon-group-popover')).to.equal(
      null
    );
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
    (folded.querySelector('.ribbon-group-dropdown') as HTMLElement).click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group-popover') !== null
    );
    await aTimeout(32);
    const popoverItem = el.shadowRoot!.querySelector(
      '.ribbon-group-popover .ribbon-item'
    )!;
    // 弹层恢复声明时的完整布局，而不是折叠前的 half/third 降级布局。
    expect(popoverItem.className).to.contain('ribbon-item-full');
    expect(popoverItem.className).to.contain('ribbon-item-vertical');
  });

  it('功能组对话框启动器派发 vsc-ribbon-dialog', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'layout',
            title: '布局',
            dialogLauncher: true,
            items: [{command: 'run', title: '运行', icon: 'play'}],
          },
          {
            id: 'hidden',
            title: '隐藏启动器',
            dialogLauncher: false,
            items: [{command: 'run', title: '运行', icon: 'play'}],
          },
          {
            id: 'absent',
            title: '未配置启动器',
            items: [{command: 'run', title: '运行', icon: 'play'}],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    expect(
      el.shadowRoot!.querySelectorAll('.ribbon-group-dialog')
    ).to.have.length(1);
    const launcher = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-group-dialog'
    )!;
    expect(launcher).to.not.equal(null);
    expect(launcher.getAttribute('aria-label')).to.equal('打开“布局”对话框');
    expect(launcher.getAttribute('aria-haspopup')).to.equal('dialog');
    const launcherIcon = launcher.querySelector<HTMLElement>(
      '.ribbon-group-dialog-icon'
    )!;
    expect(launcherIcon.className).to.contain('codicon-link-external');
    expect(launcherIcon.className).to.contain('is-rotated');
    expect(getComputedStyle(launcherIcon).transform).to.contain('matrix');
    let detail: VscRibbonDialogEvent['detail'] | undefined;
    el.addEventListener('vsc-ribbon-dialog', (event) => {
      detail = (event as VscRibbonDialogEvent).detail;
    });
    launcher.click();
    await el.updateComplete;
    expect(detail?.tabId).to.equal('home');
    expect(detail?.groupId).to.equal('layout');
    expect(detail?.group.title).to.equal('布局');
  });

  it('折叠分组入口图标与整高按钮图标尺寸一致', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'file',
            title: '文件',
            items: [{command: 'open', title: '打开', icon: 'folder-opened'}],
          },
          {
            id: 'edit',
            title: '编辑',
            items: [{command: 'undo', title: '撤销', icon: 'discard'}],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs);
    const fullIcon = el.shadowRoot!.querySelector<HTMLElement>(
      '.ribbon-item-full .ribbon-icon'
    )!;
    const itemsHeight = parseFloat(
      getComputedStyle(el).getPropertyValue('--vsc-ribbon-items-height')
    );
    const halfSize = `${itemsHeight / 2}px`;
    const fullIconSize = getComputedStyle(fullIcon).fontSize;
    expect(fullIconSize).to.equal(halfSize);
    expect(getComputedStyle(fullIcon).width).to.equal(halfSize);
    expect(getComputedStyle(fullIcon).height).to.equal(halfSize);

    el.style.width = '120px';
    el.refreshLayout();
    await waitFor(
      () =>
        el.shadowRoot?.querySelector(
          '.ribbon-group.folded .ribbon-group-dropdown .ribbon-group-icon'
        ) !== null
    );
    const groupIcon = el.shadowRoot!.querySelector<HTMLElement>(
      '.ribbon-group.folded .ribbon-group-dropdown .ribbon-group-icon'
    )!;
    expect(getComputedStyle(groupIcon).fontSize).to.equal(fullIconSize);
    expect(getComputedStyle(groupIcon).width).to.equal(halfSize);
  });

  it('折叠分组在弹层中保留自定义对话框启动器', async () => {
    const tabs: VscRibbonTab[] = [
      {
        id: 'home',
        title: '开始',
        default: true,
        groups: [
          {
            id: 'group',
            title: '分组',
            dialogLauncher: {title: '打开分组设置', icon: 'settings-gear'},
            items: [
              {
                command: 'run',
                title: '很长的按钮',
                icon: 'play',
                responsive: [{size: 'half'}, {size: 'third'}],
              },
            ],
          },
        ],
      },
    ];
    const el = await createRibbon(tabs, 'width: 40px');
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group.folded') !== null
    );
    const inlineLauncher = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-group-dialog:not(.ribbon-group-popover-dialog)'
    )!;
    expect(inlineLauncher.getClientRects().length).to.equal(0);

    el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-group.folded .ribbon-group-dropdown'
    )!.click();
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group-popover') !== null
    );
    await aTimeout(32);
    const popoverLauncher = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-group-popover-dialog'
    )!;
    expect(popoverLauncher).to.not.equal(null);
    expect(popoverLauncher.getAttribute('aria-label')).to.equal('打开分组设置');
    expect(
      popoverLauncher.querySelector('.ribbon-group-dialog-icon')?.className
    ).to.contain('codicon-settings-gear');
    expect(
      popoverLauncher.querySelector('.ribbon-group-dialog-icon')?.className
    ).to.not.contain('is-rotated');

    let called = 0;
    el.addEventListener('vsc-ribbon-dialog', () => called++);
    popoverLauncher.click();
    await el.updateComplete;
    expect(called).to.equal(1);
    expect(el.shadowRoot!.querySelector('.ribbon-group-popover')).to.equal(
      null
    );
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

  it('ArrowDown 可打开下拉菜单并聚焦首项', async () => {
    const el = await createRibbon();
    Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[role="tab"]'))
      .find((tab) => tab.textContent?.trim() === '插入')!
      .click();
    await el.updateComplete;
    await aTimeout(24);
    const trigger = shadowButton(el, '模板菜单')!;
    trigger.focus();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        composed: true,
      })
    );
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-menu-popover') !== null
    );
    await aTimeout(32);
    expect(el.shadowRoot!.activeElement?.textContent).to.contain('板模板');
  });

  it('ArrowDown 可从折叠分组入口打开分组弹层', async () => {
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
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(
      '.ribbon-group.folded .ribbon-group-dropdown'
    )!;
    trigger.focus();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        composed: true,
      })
    );
    await waitFor(
      () => el.shadowRoot?.querySelector('.ribbon-group-popover') !== null
    );
    await aTimeout(32);
    expect(el.shadowRoot!.activeElement).to.not.equal(null);
    document.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.ribbon-group-popover')).to.equal(
      null
    );
    expect(el.shadowRoot!.activeElement).to.equal(trigger);
  });

  it('公开方法可切换标签、折叠状态并关闭弹层', async () => {
    const el = await createRibbon();
    el.selectTab('insert');
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector('[role="tab"][aria-selected="true"]')
        ?.textContent
    ).to.contain('插入');

    el.collapse();
    await el.updateComplete;
    expect(el.collapsed).to.equal(true);
    el.expand();
    await el.updateComplete;
    expect(el.collapsed).to.equal(false);
    el.toggleCollapsed();
    await el.updateComplete;
    expect(el.collapsed).to.equal(true);
    el.expand();
    await el.updateComplete;

    await openMenu(el, '模板菜单');
    el.closeMenus();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.ribbon-menu-popover')).to.equal(null);

    el.collapsible = false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.ribbon-collapse')).to.equal(null);
    el.collapse();
    await el.updateComplete;
    expect(el.collapsed).to.equal(false);
    el.collapsible = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.ribbon-collapse')).to.not.equal(null);
    el.refreshLayout();
  });

  it('把宿主页面的 Codicon 样式表链接引入影子根', async () => {
    const link = document.createElement('link');
    link.id = 'vscode-codicon-stylesheet';
    link.rel = 'stylesheet';
    link.href = '/assets/codicon.css';
    document.head.append(link);
    try {
      const el = await createRibbon();
      const shadowLink = el.shadowRoot!.querySelector('link[rel="stylesheet"]');
      expect(shadowLink).to.not.equal(null);
      expect(shadowLink!.getAttribute('href')).to.equal('/assets/codicon.css');
    } finally {
      link.remove();
    }
  });

  it('缺少 Codicon 样式表时不输出图标字体链接', async () => {
    document.getElementById('vscode-codicon-stylesheet')?.remove();
    const el = await createRibbon();
    const shadowLink = el.shadowRoot!.querySelector('link[rel="stylesheet"]');
    expect(shadowLink?.hasAttribute('href')).to.equal(false);
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
