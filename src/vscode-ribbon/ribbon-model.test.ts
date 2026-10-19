import {describe, expect, it} from 'vitest';
import {
  buildRibbonTabs,
  collectResponsiveBatches,
  nextResponsiveBatch,
  resolveRibbonIcon,
  resolveRibbonItemLayout,
  resolveRibbonItemLevel,
  resolveRibbonLabelLines,
  resolveRibbonScrollState,
  resolveThemedIcon,
} from './ribbon-model.js';
import {buildRibbonCustomContentSource} from './ribbon-custom-content.js';
import type {VscRibbonTab} from './ribbon-types.js';

const tabs: VscRibbonTab[] = [
  {
    id: 'second',
    title: '第二',
    order: 20,
    groups: [
      {
        id: 'group',
        title: '分组',
        order: 10,
        items: [
          {command: 'b', title: 'B', order: 20},
          {command: 'a', title: 'A', order: 10},
          {title: '占位', icon: '$(circle-slash)', order: 30},
        ],
      },
    ],
  },
  {
    id: 'first',
    title: '第一',
    order: 10,
    default: true,
    groups: [
      {
        id: 'group',
        title: '分组',
        items: [
          {
            command: 'run',
            title: '运行',
            icon: '$(play)',
            size: 'half',
            responsive: [{size: 'third'}, {size: 'third', style: 'icon'}],
          },
        ],
      },
    ],
  },
];

describe('ribbon-model', () => {
  it('按 order 排序标签、分组和按钮并补齐默认值', () => {
    const built = buildRibbonTabs(tabs);
    expect(built.map((tab) => tab.id)).toEqual(['first', 'second']);
    expect(built[0].isDefault).toBe(true);
    expect(built[1].groups[0].items.map((item) => item.title)).toEqual([
      'A',
      'B',
      '占位',
    ]);
    expect(built[0].groups[0].items[0]).toMatchObject({
      type: 'button',
      command: 'run',
      size: 'half',
      style: 'iconAndLabel',
      placeholder: false,
      disabled: false,
    });
    expect(built[1].groups[0].items[2].placeholder).toBe(true);
    expect(built[1].groups[0].items[2].disabled).toBe(true);
  });

  it('解析 Codicon、图片、显式对象与浅深主题图标', () => {
    expect(resolveRibbonIcon('$(add)')).toEqual({
      type: 'codicon',
      id: 'add',
    });
    expect(resolveRibbonIcon('save')).toEqual({type: 'codicon', id: 'save'});
    expect(resolveRibbonIcon('./icon.svg')).toEqual({
      type: 'image',
      url: './icon.svg',
    });
    expect(resolveRibbonIcon('data:image/svg+xml;utf8,<svg/>')).toEqual({
      type: 'image',
      url: 'data:image/svg+xml;utf8,<svg/>',
    });
    expect(resolveRibbonIcon({codicon: 'gear'})).toEqual({
      type: 'codicon',
      id: 'gear',
    });
    const themed = resolveRibbonIcon({light: '$(sun)', dark: '$(moon)'});
    expect(themed).toEqual({
      type: 'themed',
      light: {type: 'codicon', id: 'sun'},
      dark: {type: 'codicon', id: 'moon'},
    });
    expect(resolveThemedIcon(themed, false)).toEqual({
      type: 'codicon',
      id: 'sun',
    });
    expect(resolveThemedIcon(themed, true)).toEqual({
      type: 'codicon',
      id: 'moon',
    });
  });

  it('归一化递归菜单、面板列数与自定义内容尺寸', () => {
    const [tab] = buildRibbonTabs([
      {
        id: 'tab',
        title: 'Tab',
        groups: [
          {
            id: 'group',
            title: '组',
            items: [
              {
                type: 'dropdown',
                title: '面板',
                menu: {
                  layout: 'panel',
                  title: '选项',
                  columns: 12,
                  items: [
                    {
                      title: '子菜单',
                      menu: {items: [{command: 'nested', title: '嵌套'}]},
                    },
                  ],
                  custom: {
                    html: '<p>内容</p>',
                    css: 'body{color:red}',
                    width: 10,
                    height: 2000,
                  },
                  footer: [
                    {command: 'custom', title: '自定义选项', keybinding: 'C'},
                  ],
                },
              },
            ],
          },
        ],
      },
    ]);
    const item = tab.groups[0].items[0];
    expect(item.menu?.layout).toBe('panel');
    expect(item.menu?.columns).toBe(8);
    expect(item.menu?.title).toBe('选项');
    expect(item.menu?.custom).toEqual({
      html: '<p>内容</p>',
      css: 'body{color:red}',
      width: 160,
      height: 800,
    });
    expect(item.menu?.items[0].menu?.items[0].command).toBe('nested');
    expect(item.menu?.footer).toHaveLength(1);
    expect(item.menu?.footer[0]).toMatchObject({
      command: 'custom',
      title: '自定义选项',
      keybinding: 'C',
    });
  });

  it('保留分组内按钮的声明顺序与响应式配置', () => {
    const [tab] = buildRibbonTabs([
      {
        id: 'tab',
        title: 'Tab',
        groups: [
          {
            id: 'group',
            title: '基坑',
            items: [
              {
                command: 'slope',
                title: '边坡',
                responsive: [{size: 'third'}],
              },
              {
                command: 'support',
                title: '围护',
                size: 'half',
              },
            ],
          },
        ],
      },
    ]);
    const group = tab.groups[0];
    expect(group.items).toHaveLength(2);
    expect(group.items.map((item) => item.command)).toEqual([
      'slope',
      'support',
    ]);
    expect(group.items[0].responsive).toEqual([{size: 'third'}]);
    expect(group.items[1].size).toBe('half');
  });

  it('归一化功能组对话框启动器的名称与图标', () => {
    const [tab] = buildRibbonTabs([
      {
        id: 'tab',
        title: 'Tab',
        groups: [
          {
            id: 'plain',
            title: '布局',
            order: 10,
            dialogLauncher: true,
            items: [{command: 'run', title: '运行'}],
          },
          {
            id: 'custom',
            title: '版式',
            order: 20,
            dialogLauncher: {
              title: '打开版式设置',
              icon: '$(settings-gear)',
            },
            items: [{command: 'run', title: '运行'}],
          },
          {
            id: 'none',
            title: '无启动器',
            order: 30,
            items: [{command: 'run', title: '运行'}],
          },
        ],
      },
    ]);
    expect(tab.groups[0].dialogLauncher).toEqual({
      title: '打开“布局”对话框',
      icon: {type: 'codicon', id: 'link-external'},
      rotated: true,
    });
    expect(tab.groups[1].dialogLauncher).toEqual({
      title: '打开版式设置',
      icon: {type: 'codicon', id: 'settings-gear'},
      rotated: false,
    });
    expect(tab.groups[2].dialogLauncher).toBe(null);
  });

  it('归一化菜单分组标题与说明文字', () => {
    const [tab] = buildRibbonTabs([
      {
        id: 'tab',
        title: 'Tab',
        groups: [
          {
            id: 'group',
            title: '分组',
            items: [
              {heading: true, title: '插入图片来自'},
              {
                command: 'local',
                title: '此设备',
                description: ' 第一行\n第二行 ',
              },
            ],
          },
        ],
      },
    ]);
    const [heading, item] = tab.groups[0].items;
    expect(heading.heading).toBe(true);
    expect(heading.description).toBe('');
    expect(item.heading).toBe(false);
    expect(item.description).toBe('第一行\n第二行');
  });

  it('归一化功能组图库布局', () => {
    const [tab] = buildRibbonTabs([
      {
        id: 'tab',
        title: 'Tab',
        groups: [
          {
            id: 'gallery',
            title: '文档格式',
            layout: 'gallery',
            items: [{command: 'format', title: '正文'}],
          },
          {
            id: 'default',
            title: '默认',
            items: [{command: 'run', title: '运行'}],
          },
        ],
      },
    ]);
    expect(tab.groups[0].layout).toBe('default');
    expect(tab.groups[1].layout).toBe('gallery');
  });

  it('计算按钮档位、布局与标题行数', () => {
    const item = buildRibbonTabs([
      {
        id: 'tab',
        title: 'Tab',
        groups: [
          {
            id: 'group',
            title: '组',
            items: [
              {
                command: 'run',
                title: '运行',
                size: 'full',
                responsive: [{size: 'half'}, {size: 'third', style: 'icon'}],
              },
            ],
          },
        ],
      },
    ])[0].groups[0].items[0];

    expect(resolveRibbonItemLevel(item, 0)).toEqual({
      size: 'full',
      style: 'iconAndLabel',
    });
    expect(resolveRibbonItemLevel(item, 1)).toEqual({
      size: 'half',
      style: 'iconAndLabel',
    });
    expect(resolveRibbonItemLevel(item, 2)).toEqual({
      size: 'third',
      style: 'icon',
    });
    expect(resolveRibbonItemLayout('full', 'icon')).toBe('vertical');
    expect(resolveRibbonItemLayout('half', 'iconAndLabel')).toBe('horizontal');
    expect(resolveRibbonItemLayout('third', 'icon')).toBe('icon-only');
    expect(resolveRibbonLabelLines('full')).toBe(2);
    expect(resolveRibbonLabelLines('third')).toBe(1);
  });

  it('整批推进相同尺寸策略，并在用尽后返回 null', () => {
    const [tab] = buildRibbonTabs([
      {
        id: 'tab',
        title: 'Tab',
        groups: [
          {
            id: 'group',
            title: '组',
            items: [
              {
                command: 'a',
                title: 'A',
                responsive: [{size: 'half'}],
              },
              {
                command: 'b',
                title: 'B',
                responsive: [{size: 'half'}],
              },
              {command: 'c', title: 'C'},
            ],
          },
        ],
      },
    ]);
    const items = tab.groups[0].items;
    const batches = collectResponsiveBatches(items);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(2);
    const first = nextResponsiveBatch(batches[0], new Map())!;
    expect(first.get(batches[0][0])).toBe(0);
    expect(first.get(batches[0][1])).toBe(0);
    expect(nextResponsiveBatch(batches[0], first)).toBeNull();
  });

  it('两端滚动按钮按边界显隐', () => {
    expect(resolveRibbonScrollState(300, 400, 0)).toEqual({
      left: false,
      right: false,
    });
    expect(resolveRibbonScrollState(900, 400, 0)).toEqual({
      left: false,
      right: true,
    });
    expect(resolveRibbonScrollState(900, 400, 250)).toEqual({
      left: true,
      right: true,
    });
    expect(resolveRibbonScrollState(900, 400, 500)).toEqual({
      left: true,
      right: false,
    });
  });
});

describe('ribbon-custom-content', () => {
  it('使用禁止脚本与网络的 CSP，并转义样式结束标记', () => {
    const source = buildRibbonCustomContentSource({
      html: '<p>提示</p>',
      css: 'body::after { content: "</style><script>" }',
      width: 320,
      height: 180,
    });
    expect(source).toContain('<p>提示</p>');
    expect(source).toContain(`default-src 'none'`);
    expect(source).toContain(`script-src 'none'`);
    expect(source).toContain('img-src data:');
    expect(source).not.toContain('</style><script>');
    expect(source).toContain('<\\/style>');
  });
});
