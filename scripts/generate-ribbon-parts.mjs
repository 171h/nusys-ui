// 生成功能区部件图鉴：为每个 CSS part 截图并输出 docs/ribbon-parts.md。
// 运行前需要先执行 `pnpm docs:build` 或至少完成一次 `pnpm docs:prepare`。
import {createServer} from 'node:http';
import {readFile, stat, mkdir, writeFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'docs/.vitepress/dist');
await stat(resolve(dist, 'index.html')).catch(() => {
  throw new Error('缺少文档构建产物，请先执行 pnpm docs:build。');
});
const imageDirectory = resolve(root, 'docs/public/ribbon-parts');
await mkdir(imageDirectory, {recursive: true});

const preview = (label, accent) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="60"><rect width="96" height="60" fill="#ffffff"/><rect x="8" y="8" width="80" height="5" fill="${accent}"/><rect x="8" y="20" width="64" height="4" fill="#d0d0d0"/><rect x="8" y="30" width="72" height="4" fill="#dcdcdc"/><rect x="8" y="40" width="56" height="4" fill="#e4e4e4"/><text x="8" y="55" font-family="sans-serif" font-size="8" fill="#666666">${label}</text></svg>`
  );

const tabs = [
  {
    id: 'home',
    title: '开始',
    default: true,
    groups: [
      {
        id: 'file',
        title: '文件',
        dialogLauncher: {title: '打开文件设置', icon: 'settings-gear'},
        items: [
          {
            type: 'splitButton',
            command: 'save',
            title: '保存',
            icon: 'save',
            menu: {
              items: [{command: 'save-as', title: '另存为…', icon: 'save-as'}],
            },
          },
          {command: 'undo', title: '撤销', icon: 'discard'},
          {command: 'open', title: '打开', icon: 'folder-opened'},
        ],
      },
      {
        id: 'insert',
        title: '插入',
        dialogLauncher: true,
        items: [
          {
            type: 'dropdown',
            title: '插入图片',
            icon: 'file-media',
            menu: {
              items: [
                {heading: true, title: '插入图片来自', order: 1},
                {
                  command: 'local',
                  title: '此设备…',
                  icon: 'folder-opened',
                  keybinding: 'D',
                  description: '从当前设备选择图片',
                  order: 2,
                },
                {
                  command: 'online',
                  title: '联机图片…',
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
                {separator: true, order: 6},
                {
                  type: 'splitButton',
                  command: 'ringlock',
                  title: '盘扣式',
                  icon: 'layers',
                  order: 7,
                  menu: {
                    items: [
                      {command: 'coupler', title: '扣件式', icon: 'layers'},
                    ],
                  },
                },
                {
                  title: '更多体系',
                  icon: 'ellipsis',
                  order: 8,
                  submenuMode: 'flyout',
                  menu: {
                    items: [
                      {command: 'portal', title: '门式脚手架', icon: 'layers'},
                    ],
                  },
                },
                {
                  title: '更多来源',
                  icon: 'ellipsis',
                  order: 9,
                  menu: {
                    items: [
                      {
                        command: 'camera',
                        title: '相机…',
                        icon: 'device-camera',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            type: 'dropdown',
            title: '页边距',
            icon: 'layout',
            menu: {
              layout: 'panel',
              title: '页边距',
              items: [
                {
                  heading: true,
                  title: '页边距预设',
                  description: '选择预设或自定义数值',
                  order: 1,
                },
                {
                  command: 'normal',
                  title: '常规',
                  icon: 'layout',
                  description: '上下 2.54 厘米，左右 3.18 厘米',
                  order: 2,
                },
                {
                  command: 'narrow',
                  title: '窄',
                  icon: 'layout',
                  description: '上下左右均为 1.27 厘米',
                  order: 3,
                },
                {
                  heading: true,
                  title: '自定义',
                  description: '手动调整边距',
                  order: 4,
                },
              ],
              footer: [
                {
                  command: 'custom-margins',
                  title: '自定义页边距(A)…',
                  icon: 'settings-gear',
                  keybinding: 'A',
                },
              ],
            },
          },
          {
            type: 'dropdown',
            title: '样式库',
            icon: 'symbol-color',
            menu: {
              layout: 'gallery',
              columns: 3,
              items: [
                {heading: true, title: '内置样式', order: 1},
                {
                  command: 'style-normal',
                  title: '正文',
                  preview: preview('正文', '#1e7a4f'),
                  description: '默认正文样式',
                  order: 2,
                },
                {
                  command: 'style-title',
                  title: '标题',
                  preview: preview('标题', '#2f6fb3'),
                  description: '章节标题',
                  order: 3,
                },
                {
                  command: 'style-quote',
                  title: '引用',
                  preview: preview('引用', '#8a5b00'),
                  description: '引用段落',
                  order: 4,
                },
              ],
            },
          },
          {
            type: 'dropdown',
            title: '脚手架规范',
            icon: 'book',
            menu: {
              layout: 'panel',
              title: '脚手架规范',
              custom: {
                width: 360,
                height: 120,
                html: '<div style="padding:12px;font:12px sans-serif;color:#333">面板下方可放置规范说明、图例或静态内容。</div>',
              },
              items: [
                {heading: true, title: '常用规范', order: 1},
                {
                  command: 'jgj130',
                  title: 'JGJ 130',
                  icon: 'book',
                  description: '扣件式钢管脚手架安全技术规范',
                  order: 2,
                },
              ],
              footer: [
                {command: 'spec-more', title: '更多规范…', icon: 'library'},
              ],
            },
          },
        ],
      },
      {
        id: 'format',
        title: '文档格式',
        layout: 'gallery',
        dialogLauncher: true,
        items: Array.from({length: 6}, (_, index) => ({
          command: `format-${index + 1}`,
          title: `格式 ${index + 1}`,
          preview: preview(`格式 ${index + 1}`, '#2f6fb3'),
        })),
      },
      {
        id: 'view',
        title: '视图',
        items: [
          {
            command: 'toggle-sidebar',
            title: '侧边栏',
            icon: 'layout-sidebar-left',
            size: 'half',
          },
          {
            command: 'toggle-terminal',
            title: '终端',
            icon: 'terminal',
            size: 'half',
          },
        ],
      },
    ],
  },
  {
    id: 'design',
    title: '设计',
    groups: [
      {
        id: 'theme',
        title: '主题',
        items: [
          {command: 'theme-light', title: '浅色', icon: 'color-mode'},
          {command: 'theme-dark', title: '深色', icon: 'color-mode'},
        ],
      },
    ],
  },
];

const parts = [
  // 框架与标签
  {
    section: '框架与标签',
    part: 'base',
    name: '功能区根容器',
    state: 'default',
    selector: '[part~="base"]',
    pad: 14,
    description:
      '组件最外层 header，承载标签栏与内容区，是整块功能区的样式与尺寸基准。',
    lang: 'html',
    usage:
      '<vscode-ribbon id="ribbon" tablist-label="示例功能区"></vscode-ribbon>\n\n/* 通过 part 定制外观 */\nvscode-ribbon::part(base) {\n  border-bottom: 1px solid var(--vscode-panel-border);\n}',
  },
  {
    section: '框架与标签',
    part: 'tabs',
    name: '标签栏',
    state: 'default',
    selector: '[part~="tabs"]',
    description:
      '标签、折叠按钮与插槽所在的一行，背景与分区与 VS Code 标题栏一致。',
    lang: 'html',
    usage:
      '<!-- 通过插槽在标签栏两端插入自定义内容 -->\n<vscode-ribbon>\n  <button slot="tabs-end">帮助</button>\n</vscode-ribbon>',
  },
  {
    section: '框架与标签',
    part: 'tabs-list',
    name: '标签列表',
    state: 'default',
    selector: '[part~="tabs-list"]',
    description:
      '承载所有标签按钮的 tablist 容器，负责方向键、Home/End 键盘导航。',
    lang: 'js',
    usage:
      "const ribbon = document.querySelector('vscode-ribbon');\nribbon.tabs = [\n  {id: 'home', title: '开始'},\n  {id: 'insert', title: '插入'},\n];",
  },
  {
    section: '框架与标签',
    part: 'tab',
    name: '标签按钮',
    state: 'default',
    selector: '[part~="tab"]',
    pad: 18,
    description:
      '单个功能区标签，支持点击、方向键、Home/End 与双击折叠或展开。',
    lang: 'js',
    usage:
      "tabs: [\n  {id: 'home', title: '开始', default: true},\n  {id: 'insert', title: '插入'},\n  {id: 'design', title: '设计'},\n]",
  },
  {
    section: '框架与标签',
    part: 'collapse-button',
    name: '折叠按钮',
    state: 'default',
    selector: '[part~="collapse-button"]',
    pad: 18,
    description:
      '折叠/展开整个功能区的按钮；折叠后单击任意标签以浮层显示内容。',
    lang: 'js',
    usage:
      "const ribbon = document.querySelector('vscode-ribbon');\nribbon.collapsible = true; // 显示折叠按钮\nribbon.collapsed = false; // 当前是否折叠",
  },
  {
    section: '框架与标签',
    part: 'content',
    name: '内容区',
    state: 'default',
    selector: '[part~="content"]',
    description: '标签内容与下拉浮层的公共容器，负责整体高度、裁剪与浮层定位。',
    lang: 'css',
    usage:
      '/* 调整功能区内容区高度 */\nvscode-ribbon {\n  --vsc-ribbon-content-height: 112px;\n}\n\nvscode-ribbon::part(content) {\n  overflow: visible;\n}',
  },
  {
    section: '框架与标签',
    part: 'scroll-viewport',
    name: '横向滚动视口',
    state: 'default',
    selector: '[part~="scroll-viewport"]',
    description:
      '承载功能组的横向滚动视口；空间不足时先折叠分组，再显示两端滚动按钮。',
    lang: 'css',
    usage:
      'vscode-ribbon::part(scroll-viewport) {\n  overflow-x: auto;\n  scrollbar-width: thin;\n}',
  },
  {
    section: '框架与标签',
    part: 'groups',
    name: '功能组容器',
    state: 'default',
    selector: '[part~="groups"]',
    description: '横向排列所有功能组的容器，是整组折叠与宽度测量的依据。',
    lang: 'css',
    usage: 'vscode-ribbon::part(groups) {\n  gap: 2px;\n}',
  },
  {
    section: '框架与标签',
    part: 'scroll-button',
    name: '滚动按钮',
    state: 'narrow',
    selector: '[part~="scroll-button"]',
    pad: 16,
    description:
      '全部可折叠分组的折叠后仍溢出时出现的悬浮滚动按钮，点击或按住可横向滚动内容。',
    lang: 'css',
    usage:
      'vscode-ribbon::part(scroll-button) {\n  background: var(--vscode-editor-background);\n  color: var(--vscode-icon-foreground);\n}',
  },
  // 功能组与按钮
  {
    section: '功能组与按钮',
    part: 'group',
    name: '功能组',
    state: 'default',
    selector: '[part~="group"][data-group="file"]',
    pad: 12,
    description: '单个功能区分组，包含按钮网格、分组标题与可选的对话框启动器。',
    lang: 'js',
    usage:
      "groups: [\n  {\n    id: 'file',\n    title: '文件',\n    items: [{command: 'save', title: '保存', icon: 'save'}],\n  },\n]",
  },
  {
    section: '功能组与按钮',
    part: 'group-title',
    name: '分组标题',
    state: 'default',
    selector: '[part~="group-title"]',
    pad: 10,
    description: '功能组底部的分组名称，同时作为折叠后整组入口的名称来源。',
    lang: 'js',
    usage:
      "{\n  id: 'file',\n  title: '文件', // 显示在功能组底部\n  items: [],\n}",
  },
  {
    section: '功能组与按钮',
    part: 'group-button',
    name: '分组折叠入口',
    state: 'folded',
    selector: '.ribbon-group.folded [part~="group-button"]',
    pad: 16,
    description:
      '宽度不足时将整个分组折叠为带图标与标题的下拉入口；点击后在弹层中按原布局展示按钮。',
    lang: 'js',
    usage:
      "// 宽度不足时自动生成折叠入口；也可主动折叠：\nconst ribbon = document.querySelector('vscode-ribbon');\nribbon.foldGroup('file');",
  },
  {
    section: '功能组与按钮',
    part: 'group-dialog',
    name: '对话框启动器',
    state: 'default',
    selector: '[part~="group-dialog"]',
    pad: 16,
    description:
      '功能组右下角的扩展按钮，默认图标为旋转 90° 的 link-external，点击派发 vsc-ribbon-dialog。',
    lang: 'js',
    usage:
      "{\n  id: 'file',\n  title: '文件',\n  dialogLauncher: true, // 默认图标\n  // dialogLauncher: {title: '打开文件设置', icon: 'settings-gear'},\n  items: [],\n}",
  },
  {
    section: '功能组与按钮',
    part: 'items',
    name: '按钮网格',
    state: 'default',
    selector: '[part~="items"]',
    description:
      '功能组内部六轨按钮网格，full / half / third 三种高度可在同一分组中混排。',
    lang: 'js',
    usage:
      "items: [\n  {command: 'save', title: '保存', icon: 'save', size: 'full'},\n  {command: 'undo', title: '撤销', icon: 'discard', size: 'half'},\n  {command: 'redo', title: '重做', icon: 'redo', size: 'half'},\n]",
  },
  {
    section: '功能组与按钮',
    part: 'item',
    name: '命令按钮',
    state: 'default',
    selector: '[part~="item"]',
    pad: 12,
    description:
      '单个功能区命令按钮，支持普通按钮、下拉按钮与分割按钮三种类型。',
    lang: 'js',
    usage:
      "items: [\n  {command: 'undo', title: '撤销', icon: 'discard'},\n  {type: 'dropdown', title: '插入图片', icon: 'file-media', menu: {items: []}},\n]",
  },
  {
    section: '功能组与按钮',
    part: 'item-primary',
    name: '分割按钮主命令',
    state: 'default',
    selector: '[part~="item-primary"]',
    pad: 10,
    description:
      '分割按钮的上方主区域，直接点击执行主命令；悬停时只有该区域背景激活，同时组合按钮外边框与分格线一起高亮。',
    lang: 'js',
    usage:
      "{\n  type: 'splitButton',\n  command: 'save', // 主区域命令\n  title: '保存',\n  icon: 'save',\n  menu: {items: [{command: 'save-as', title: '另存为…', icon: 'save-as'}]},\n}",
  },
  {
    section: '功能组与按钮',
    part: 'item-trigger',
    name: '分割按钮触发区',
    state: 'default',
    selector: '[part~="item-trigger"]',
    pad: 10,
    description:
      '分割按钮的下方触发区，点击展开菜单而不执行主命令；悬停时只有该区域背景激活，并同步高亮组合边框与分格线。',
    lang: 'js',
    usage:
      "{\n  type: 'splitButton',\n  command: 'save',\n  title: '保存',\n  icon: 'save',\n  menu: {items: [{command: 'save-as', title: '另存为…'}]},\n}",
  },
  {
    section: '功能组与按钮',
    part: 'group-popover',
    name: '分组溢出弹层',
    state: 'folded',
    selector: '[part~="group-popover"]',
    pad: 10,
    description:
      '折叠分组后点击入口打开的 dialog，按分组声明的原始布局展示全部按钮，并保留启动器。',
    lang: 'js',
    usage:
      '// 折叠入口自动打开弹层；弹层内容无需额外配置，\n// 始终按该功能组的原始 items 布局渲染。',
  },
  // 菜单与子菜单
  {
    section: '菜单与子菜单',
    part: 'menu',
    name: '下拉菜单浮层',
    state: 'menu',
    selector: '[part~="menu"]',
    pad: 10,
    description:
      '下拉按钮、菜单项子菜单共用的浮层容器，支持 menu / panel / gallery 三种布局。',
    lang: 'js',
    usage:
      "{\n  type: 'dropdown',\n  title: '插入图片',\n  icon: 'file-media',\n  menu: {\n    layout: 'menu', // 默认竖排菜单\n    items: [{command: 'local', title: '此设备…', icon: 'folder-opened'}],\n  },\n}",
  },
  {
    section: '菜单与子菜单',
    part: 'menu-items',
    name: '菜单列表',
    state: 'menu',
    selector: '[part~="menu-items"]',
    pad: 8,
    description: '竖排菜单项的列表容器，负责分隔线与菜单项的排列。',
    lang: 'js',
    usage:
      "menu: {\n  items: [\n    {heading: true, title: '插入图片来自'},\n    {command: 'local', title: '此设备…', icon: 'folder-opened'},\n    {separator: true},\n  ],\n}",
  },
  {
    section: '菜单与子菜单',
    part: 'menu-item',
    name: '菜单项',
    state: 'menu',
    selector: '[part~="menu-item"]',
    pad: 8,
    description:
      '单个菜单项，显示图标、标题、快捷键与子菜单箭头，支持键盘导航。',
    lang: 'js',
    usage:
      "{\n  command: 'local',\n  title: '此设备…',\n  icon: 'folder-opened',\n  keybinding: 'D',\n  description: '从当前设备选择图片',\n}",
  },
  {
    section: '菜单与子菜单',
    part: 'menu-split',
    name: '菜单分割行',
    state: 'menu',
    selector: '[part~="menu-split"]',
    pad: 10,
    description: '菜单中的分割按钮行，把主命令与子菜单触发区分成上下两个按钮。',
    lang: 'js',
    usage:
      "menu: {\n  items: [\n    {\n      type: 'splitButton',\n      command: 'ringlock',\n      title: '盘扣式',\n      icon: 'layers',\n      menu: {items: [{command: 'coupler', title: '扣件式'}]},\n    },\n  ],\n}",
  },
  {
    section: '菜单与子菜单',
    part: 'menu-split-trigger',
    name: '菜单分割触发区',
    state: 'menu',
    selector: '[part~="menu-split-trigger"]',
    pad: 8,
    description: '菜单分割行的下方触发区，展开该菜单项的子菜单。',
    lang: 'js',
    usage:
      "menu: {\n  items: [\n    {\n      type: 'splitButton',\n      command: 'ringlock',\n      title: '盘扣式',\n      icon: 'layers',\n      menu: {items: [{command: 'coupler', title: '扣件式'}]},\n    },\n  ],\n}",
  },
  {
    section: '菜单与子菜单',
    part: 'menu-back',
    name: '菜单返回入口',
    state: 'submenu',
    selector: '[part~="menu-back"]',
    pad: 8,
    description:
      'replace 子菜单模式下的返回按钮，返回上一级菜单；flyout 模式不显示该入口。',
    lang: 'js',
    usage:
      "menu: {\n  items: [\n    {\n      title: '更多来源',\n      icon: 'ellipsis',\n      menu: {items: [{command: 'camera', title: '相机…'}]},\n    },\n  ],\n}\n// 默认 submenuMode: 'replace' 时出现返回入口",
  },
  {
    section: '菜单与子菜单',
    part: 'menu-separator',
    name: '菜单分隔线',
    state: 'menu',
    selector: '[part~="menu-separator"]',
    pad: 8,
    description: '菜单项之间的不可交互分隔线，用于把命令按语义分成多个组。',
    lang: 'js',
    usage:
      "menu: {\n  items: [\n    {command: 'local', title: '此设备…'},\n    {separator: true},\n    {command: 'online', title: '联机图片…'},\n  ],\n}",
  },
  {
    section: '菜单与子菜单',
    part: 'menu-heading',
    name: '菜单分组标题',
    state: 'menu',
    selector: '[part~="menu-heading"]',
    pad: 8,
    description:
      '不可聚焦、不可点击的菜单分组标题，一个菜单可声明多个标题分组。',
    lang: 'js',
    usage:
      "menu: {\n  items: [\n    {heading: true, title: '插入图片来自'},\n    {command: 'local', title: '此设备…'},\n    {heading: true, title: '最近使用'},\n    {command: 'recent', title: '最近插入的图片'},\n  ],\n}",
  },
  {
    section: '菜单与子菜单',
    part: 'menu-description',
    name: '菜单说明文字',
    state: 'menu',
    selector: '[part~="menu-description"]',
    pad: 8,
    description:
      '菜单项标题下方的补充说明，支持多行文本，适合设置预设与规范说明。',
    lang: 'js',
    usage:
      "{\n  command: 'normal',\n  title: '常规',\n  icon: 'layout',\n  description: '上下 2.54 厘米，左右 3.18 厘米',\n}",
  },
  {
    section: '菜单与子菜单',
    part: 'flyout',
    name: 'flyout 子菜单',
    state: 'flyout',
    selector: '[part~="flyout"]',
    pad: 10,
    description:
      '在父菜单旁展开的子菜单浮层，父菜单保持可见；右侧空间不足时自动翻到左侧。',
    lang: 'js',
    usage:
      "{\n  title: '更多体系',\n  icon: 'ellipsis',\n  submenuMode: 'flyout', // 旁侧展开而不是替换当前菜单\n  menu: {\n    items: [{command: 'portal', title: '门式脚手架', icon: 'layers'}],\n  },\n}",
  },
  // 面板与自定义内容
  {
    section: '面板与自定义内容',
    part: 'panel-header',
    name: '面板标题栏',
    state: 'panel',
    selector: '[part~="panel-header"]',
    pad: 8,
    description:
      'Word 风格面板顶部的标题与关闭按钮区域，标题由 menu.title 提供。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'panel',\n  title: '页边距',\n  items: [{command: 'normal', title: '常规', icon: 'layout'}],\n}",
  },
  {
    section: '面板与自定义内容',
    part: 'panel-close',
    name: '面板关闭按钮',
    state: 'panel',
    selector: '[part~="panel-close"]',
    pad: 14,
    description: '关闭整个面板的按钮，Escape 或点击外部同样关闭。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'panel',\n  title: '页边距',\n  items: [], // 关闭按钮由面板自动生成\n}",
  },
  {
    section: '面板与自定义内容',
    part: 'panel-body',
    name: '面板内容区',
    state: 'panel',
    selector: '[part~="panel-body"]',
    pad: 8,
    description: '面板主体容器，承载自定义内容、格子网格与底部操作区。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'panel',\n  title: '页边距',\n  items: [{command: 'normal', title: '常规'}],\n  footer: [{command: 'more', title: '更多…'}],\n}",
  },
  {
    section: '面板与自定义内容',
    part: 'panel-grid',
    name: '面板格子网格',
    state: 'panel',
    selector: '[part~="panel-grid"]',
    pad: 8,
    description: '面板项的网格布局，列数由 menu.columns 控制。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'panel',\n  title: '页边距',\n  columns: 3, // 面板列数\n  items: [{command: 'normal', title: '常规', icon: 'layout'}],\n}",
  },
  {
    section: '面板与自定义内容',
    part: 'panel-item',
    name: '面板操作项',
    state: 'panel',
    selector: '[part~="panel-item"]',
    pad: 8,
    description: '面板内的单个操作项，支持图标、标题与说明文字。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'panel',\n  items: [\n    {command: 'normal', title: '常规', icon: 'layout', description: '上下 2.54 厘米'},\n  ],\n}",
  },
  {
    section: '面板与自定义内容',
    part: 'panel-heading',
    name: '面板分组标题',
    state: 'panel',
    selector: '[part~="panel-heading"]',
    pad: 8,
    description: '面板中横跨整行的分组标题，可带说明文字并使用多个标题分组。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'panel',\n  items: [\n    {heading: true, title: '页边距预设', description: '选择预设或自定义数值'},\n    {command: 'normal', title: '常规'},\n  ],\n}",
  },
  {
    section: '面板与自定义内容',
    part: 'panel-description',
    name: '面板说明文字',
    state: 'panel',
    selector: '[part~="panel-description"]',
    pad: 8,
    description: '面板项下方的补充说明，支持多行文本。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'panel',\n  items: [\n    {command: 'normal', title: '常规', description: '上下 2.54 厘米，左右 3.18 厘米'},\n  ],\n}",
  },
  {
    section: '面板与自定义内容',
    part: 'panel-footer',
    name: '面板底部操作区',
    state: 'panel',
    selector: '[part~="panel-footer"]',
    pad: 8,
    description: '面板底部的整行操作区，用于放置“自定义…”“更多…”等低频操作。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'panel',\n  footer: [\n    {command: 'custom-margins', title: '自定义页边距(A)…', icon: 'settings-gear', keybinding: 'A'},\n  ],\n}",
  },
  {
    section: '面板与自定义内容',
    part: 'panel-footer-item',
    name: '面板底部操作项',
    state: 'panel',
    selector: '[part~="panel-footer-item"]',
    pad: 8,
    description: '底部操作区内的单个操作项，参与面板键盘导航并显示快捷键。',
    lang: 'js',
    usage:
      "menu: {\n  footer: [\n    {command: 'custom-margins', title: '自定义页边距(A)…', icon: 'settings-gear'},\n  ],\n}",
  },
  {
    section: '面板与自定义内容',
    part: 'custom-content',
    name: '自定义内容',
    state: 'custom',
    selector: '[part~="custom-content"]',
    pad: 10,
    description:
      '面板中的无脚本、禁网络沙箱 iframe，渲染 menu.custom 提供的静态 HTML，适合规范说明或图例。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'panel',\n  title: '脚手架规范',\n  custom: {\n    width: 360,\n    height: 120,\n    html: '<div style=\"padding:12px\">规范说明或图例</div>',\n  },\n  items: [],\n}",
  },
  // 图库
  {
    section: '图库',
    part: 'gallery',
    name: '图库网格',
    state: 'gallery-menu',
    selector: '[part~="gallery"]',
    pad: 10,
    description:
      '图库式菜单的格子网格，以较大预览图展示样式、艺术字等可视化选项。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'gallery',\n  columns: 3,\n  items: [\n    {command: 'style-normal', title: '正文', preview: 'data:image/svg+xml;utf8,...'},\n  ],\n}",
  },
  {
    section: '图库',
    part: 'gallery-item',
    name: '图库格子',
    state: 'gallery-menu',
    selector: '[part~="gallery-item"]',
    pad: 8,
    description: '图库菜单内的单个预览格子，点击执行命令或打开下一级菜单。',
    lang: 'js',
    usage:
      "{\n  command: 'style-title',\n  title: '标题',\n  preview: previewDataUri, // 可选，缺失时使用 icon\n  description: '章节标题',\n}",
  },
  {
    section: '图库',
    part: 'gallery-preview',
    name: '图库预览区',
    state: 'gallery-menu',
    selector: '[part~="gallery-preview"]',
    pad: 8,
    description:
      '图库格子上方的预览图区域，显示 item.preview 或回退为彩色图标。',
    lang: 'js',
    usage:
      "{\n  command: 'style-quote',\n  title: '引用',\n  preview: 'data:image/svg+xml;utf8,...',\n}",
  },
  {
    section: '图库',
    part: 'gallery-heading',
    name: '图库分组标题',
    state: 'gallery-menu',
    selector: '[part~="gallery-heading"]',
    pad: 8,
    description: '图库网格中的分组标题，用来分隔多组可视化选项。',
    lang: 'js',
    usage:
      "menu: {\n  layout: 'gallery',\n  items: [\n    {heading: true, title: '内置样式'},\n    {command: 'style-normal', title: '正文', preview},\n  ],\n}",
  },
  {
    section: '图库',
    part: 'gallery-description',
    name: '图库说明文字',
    state: 'gallery-menu',
    selector: '[part~="gallery-description"]',
    pad: 8,
    description: '图库格子标题下方的补充说明，适合描述样式用途。',
    lang: 'js',
    usage:
      "{\n  command: 'style-normal',\n  title: '正文',\n  description: '默认正文样式',\n  preview,\n}",
  },
  {
    section: '图库',
    part: 'gallery-strip',
    name: '组内图库预览条',
    state: 'default',
    selector: '[part~="gallery-strip"]',
    pad: 10,
    description:
      'group.layout: gallery 时功能组内的横向图库容器，包含滚动按钮与视口。',
    lang: 'js',
    usage:
      "{\n  id: 'format',\n  title: '文档格式',\n  layout: 'gallery', // 图库布局\n  items: [{command: 'format-1', title: '格式 1', preview}],\n}",
  },
  {
    section: '图库',
    part: 'gallery-viewport',
    name: '组内图库视口',
    state: 'default',
    selector: '[part~="gallery-viewport"]',
    pad: 8,
    description: '可横向滚动的图库视口，隐藏原生滚动条，由左右按钮滚动。',
    lang: 'js',
    usage:
      "{\n  id: 'format',\n  title: '文档格式',\n  layout: 'gallery',\n  items: [], // 视口与滚动由组件内部处理\n}",
  },
  {
    section: '图库',
    part: 'gallery-track',
    name: '组内图库轨道',
    state: 'default',
    selector: '[part~="gallery-track"]',
    pad: 8,
    description: '横向排列组内图库格子的轨道，宽度随格子数量增长。',
    lang: 'js',
    usage: '// 通过 items 数量控制轨道宽度；滚动由 gallery-scroll 按钮触发。',
  },
  {
    section: '图库',
    part: 'gallery-tile',
    name: '组内图库格子',
    state: 'default',
    selector: '[part~="gallery-tile"]',
    pad: 8,
    description: '图库功能组内的单个格子，显示预览图与标题，点击执行命令。',
    lang: 'js',
    usage:
      "{\n  id: 'format',\n  title: '文档格式',\n  layout: 'gallery',\n  items: [{command: 'format-1', title: '格式 1', preview}],\n}",
  },
  {
    section: '图库',
    part: 'gallery-scroll',
    name: '组内图库滚动按钮',
    state: 'default',
    selector: '[part~="gallery-scroll"]',
    pad: 14,
    description: '组内图库预览条左右两端的滚动按钮，点击按视口宽度横向滚动。',
    lang: 'js',
    usage: '// 滚动按钮由 group.layout: gallery 自动生成，无需额外配置。',
  },
];

const STATE_SETUP = {
  default: async (page) => {
    await setStageWidth(page, 1000);
  },
  menu: async (page) => {
    await setStageWidth(page, 1000);
    await clickByText(page, '插入图片');
    await waitForPart(page, 'menu');
  },
  submenu: async (page) => {
    await setStageWidth(page, 1000);
    await clickByText(page, '插入图片');
    await waitForPart(page, 'menu');
    await clickByText(page, '更多来源');
    await waitForPart(page, 'menu-back');
  },
  flyout: async (page) => {
    await setStageWidth(page, 1000);
    await clickByText(page, '插入图片');
    await waitForPart(page, 'menu');
    await clickByText(page, '更多体系');
    await waitForPart(page, 'flyout');
  },
  panel: async (page) => {
    await setStageWidth(page, 1000);
    await clickByText(page, '页边距');
    await waitForPart(page, 'panel-header');
  },
  custom: async (page) => {
    await setStageWidth(page, 1000);
    await clickByText(page, '脚手架规范');
    await waitForPart(page, 'custom-content');
  },
  'gallery-menu': async (page) => {
    await setStageWidth(page, 1000);
    await clickByText(page, '样式库');
    await waitForPart(page, 'gallery');
  },
  folded: async (page) => {
    await setStageWidth(page, 320);
    await page.waitForFunction(
      () =>
        document
          .querySelector('#parts-ribbon')
          ?.shadowRoot?.querySelector('.ribbon-group.folded') !== null
    );
    await page.evaluate(() => {
      document
        .querySelector('#parts-ribbon')
        .shadowRoot.querySelector('.ribbon-group.folded .ribbon-group-dropdown')
        .click();
    });
    await waitForPart(page, 'group-popover');
  },
  narrow: async (page) => {
    await setStageWidth(page, 120);
    await page.waitForFunction(
      () =>
        document
          .querySelector('#parts-ribbon')
          ?.shadowRoot?.querySelector('[part~="scroll-button"]') !== null
    );
  },
};

async function setStageWidth(page, width) {
  await page.evaluate((value) => {
    document.querySelector('#parts-stage').style.width = `${value}px`;
  }, width);
  await page.waitForTimeout(260);
}

async function clickByText(page, text) {
  await page.evaluate((label) => {
    const root = document.querySelector('#parts-ribbon').shadowRoot;
    const target = Array.from(
      root.querySelectorAll('button, [role="menuitem"]')
    ).find((element) => element.textContent.trim().includes(label));
    if (!target) {
      throw new Error(`未找到可点击元素：${label}`);
    }
    target.click();
  }, text);
  await page.waitForTimeout(220);
}

async function waitForPart(page, part) {
  await page.waitForFunction(
    (name) =>
      document
        .querySelector('#parts-ribbon')
        ?.shadowRoot?.querySelector(`[part~="${name}"]`) !== null,
    part
  );
  await page.waitForTimeout(220);
}

const fixture = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><link id="vscode-codicon-stylesheet" rel="stylesheet" href="/assets/codicon.css"><style>
:root{--vscode-editor-background:#ffffff;--vscode-foreground:#242424;--vscode-descriptionForeground:#616161;--vscode-icon-foreground:#424242;--vscode-focusBorder:#0078d4;--vscode-panel-border:#d4d4d4;--vscode-toolbar-hoverBackground:rgba(0,0,0,.08);--vscode-font-family:'Segoe UI',sans-serif}
*{box-sizing:border-box}body{margin:0;padding:28px;background:#f3f3f3;color:var(--vscode-foreground);font:13px var(--vscode-font-family)}
#parts-stage{width:1000px;max-width:calc(100vw - 56px);margin:0 auto;padding:10px;background:#fff;border:1px solid #d4d4d4;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
</style></head><body><div id="parts-stage"></div><script type="module">
import '/assets/nusys-ui.js';
document.documentElement.dataset.ready = 'true';
<\/script></body></html>`;

async function reset(page) {
  await page.evaluate(async (config) => {
    const stage = document.querySelector('#parts-stage');
    stage.style.width = '1000px';
    stage.innerHTML =
      '<vscode-ribbon id="parts-ribbon" tablist-label="功能区部件图鉴"></vscode-ribbon>';
    const ribbon = document.querySelector('#parts-ribbon');
    ribbon.collapsible = true;
    ribbon.tabs = config;
    await ribbon.updateComplete;
  }, tabs);
  await page.waitForTimeout(220);
}

async function capture(page, entry) {
  const geometry = await page.evaluate((selector) => {
    const root = document.querySelector('#parts-ribbon')?.shadowRoot;
    const element = root?.querySelector(selector);
    if (!element) {
      return null;
    }
    const rect = element.getBoundingClientRect();
    element.style.outline = '2px solid #d13438';
    element.style.outlineOffset = '3px';
    element.style.borderRadius = '2px';
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }, entry.selector);
  if (!geometry) {
    throw new Error(`未找到部件：${entry.part} (${entry.selector})`);
  }
  const viewport = page.viewportSize();
  const basePad = entry.pad ?? 10;
  const pad =
    geometry.width < 24 || geometry.height < 24
      ? Math.max(basePad, 24)
      : basePad;
  const x = Math.max(0, Math.floor(geometry.x - pad));
  const y = Math.max(0, Math.floor(geometry.y - pad));
  const width = Math.min(
    geometry.viewportWidth - x,
    Math.ceil(geometry.width + pad * 2)
  );
  const height = Math.min(
    geometry.viewportHeight - y,
    Math.ceil(geometry.height + pad * 2)
  );
  await page.screenshot({
    path: resolve(imageDirectory, `${entry.part}.png`),
    clip: {
      x: Math.max(0, Math.min(x, viewport.width - width)),
      y: Math.max(0, Math.min(y, viewport.height - height)),
      width: Math.max(1, width),
      height: Math.max(1, height),
    },
  });
}

async function writeDocs() {
  const sections = new Map();
  for (const entry of parts) {
    if (!sections.has(entry.section)) {
      sections.set(entry.section, []);
    }
    sections.get(entry.section).push(entry);
  }
  let body = `# 功能区部件图鉴

功能区由标签栏、功能组、按钮、菜单、面板与图库等部件组成。本页为
[功能区组件](./components/ribbon) 中的每个唯一 CSS part 提供局部截图、说明和
配置示例：截图中红色描边标出该部件的实际范围，代码块展示触发或定位该部件的公共
配置方式。

> 本页截图与代码由 \`pnpm docs:ribbon-parts\` 从 \`scripts/generate-ribbon-parts.mjs\`
> 中的部件清单生成；新增或调整部件时请同步更新脚本后重新生成。

可使用 \`vscode-ribbon::part(名称)\` 从外部定制样式，或在调试时用
\`ribbon.shadowRoot.querySelector('[part~="名称"]')\` 定位元素。完整名称列表见
[功能区 CSS 部件](./components/ribbon#css-部件)。
`;
  for (const [section, entries] of sections) {
    body += `\n## ${section}\n`;
    for (const entry of entries) {
      body += `\n### ${entry.name} \`${entry.part}\` {#part-${entry.part}}\n\n`;
      body += `<img src="/ribbon-parts/${entry.part}.png" alt="${entry.name}部件截图">\n\n`;
      body += `${entry.description}\n\n`;
      body += `\`\`\`${entry.lang}\n${entry.usage}\n\`\`\`\n`;
    }
  }
  await writeFile(resolve(root, 'docs/ribbon-parts.md'), body);
  console.log(`已生成 docs/ribbon-parts.md，共 ${parts.length} 个部件。`);
}

// 与 docs-browser.mjs 相同的静态文件服务器，仅用于本脚本截图。
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
};
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname
    );
    const local = path.replace(/^\//, '');
    const target = resolve(dist, local || 'index.html');
    if (!target.startsWith(dist + sep) && target !== dist)
      throw new Error('路径越界');
    const candidates = extname(target)
      ? [target]
      : [target + '.html', resolve(target, 'index.html')];
    let file;
    for (const candidate of candidates) {
      if (
        await stat(candidate).then(
          (info) => info.isFile(),
          () => false
        )
      ) {
        file = candidate;
        break;
      }
    }
    if (!file) throw new Error('页面不存在');
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end('页面不存在');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({
    viewport: {width: 1280, height: 1000},
  });
  await page.goto(`${origin}/components/ribbon`, {
    waitUntil: 'domcontentloaded',
  });
  await page.setContent(fixture, {waitUntil: 'load'});
  await page.waitForFunction(
    () => document.documentElement.dataset.ready === 'true'
  );
  await page.evaluate(async (config) => {
    const stage = document.querySelector('#parts-stage');
    stage.innerHTML =
      '<vscode-ribbon id="parts-ribbon" tablist-label="功能区部件图鉴"></vscode-ribbon>';
    const ribbon = document.querySelector('#parts-ribbon');
    ribbon.collapsible = true;
    ribbon.tabs = config;
    await ribbon.updateComplete;
  }, tabs);
  let currentState = null;
  for (const entry of parts) {
    if (entry.state !== currentState) {
      currentState = entry.state;
      await reset(page);
      await STATE_SETUP[entry.state](page);
    }
    await capture(page, entry);
    console.log(`已截图：${entry.part}`);
  }
  await writeDocs();
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
