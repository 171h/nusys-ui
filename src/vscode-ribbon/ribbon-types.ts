/** Ribbon 按钮的尺寸档位。 */
export type VscRibbonItemSize = 'full' | 'half' | 'third';

/** Ribbon 紧凑按钮的样式；`full` 按钮始终显示图标与标题。 */
export type VscRibbonItemStyle = 'iconAndLabel' | 'icon';

/** Ribbon 按钮类型。 */
export type VscRibbonItemType = 'button' | 'splitButton' | 'dropdown';

/** 下拉浮层的布局。 */
export type VscRibbonMenuLayout = 'menu' | 'panel';

/** Ribbon 图标主题；`auto` 跟随宿主页面的明暗主题。 */
export type VscRibbonTheme = 'auto' | 'light' | 'dark';

/** 宽度不足时依次尝试的紧凑布局。 */
export interface VscRibbonResponsiveStep {
  size?: VscRibbonItemSize;
  style?: VscRibbonItemStyle;
}

/** 浅色与深色主题分别使用的图标。 */
export interface VscRibbonThemedIcon {
  light: VscRibbonIconSource;
  dark: VscRibbonIconSource;
}

/** 图标来源：Codicon 名称、`$(name)`、图片地址或浅/深主题对象。 */
export type VscRibbonIconSource =
  string | VscRibbonThemedIcon | {codicon: string} | {url: string};

/** 公开图标声明，同时兼容已解析的图标对象。 */
export type VscRibbonIcon =
  | VscRibbonIconSource
  | {type: 'codicon'; id: string}
  | {type: 'image'; url: string}
  | {type: 'themed'; light: VscRibbonIcon; dark: VscRibbonIcon};

/** 归一化后的图标。 */
export type ResolvedRibbonIcon =
  | {type: 'codicon'; id: string}
  | {type: 'image'; url: string}
  | {type: 'themed'; light: ResolvedRibbonIcon; dark: ResolvedRibbonIcon};

/** 下拉浮层中的沙箱静态内容。 */
export interface VscRibbonCustomContent {
  /** 静态 HTML；不执行脚本，也不能发起网络请求。 */
  html: string;
  /** 与静态 HTML 一起注入的 CSS。 */
  css?: string;
  /** 内容宽度，单位为像素，限制在 160–1200。 */
  width?: number;
  /** 内容高度，单位为像素，限制在 80–800。 */
  height?: number;
}

/** 下拉菜单声明。 */
export interface VscRibbonMenu {
  /** 菜单项；支持递归子菜单。 */
  items?: readonly VscRibbonItem[];
  /** 竖排菜单或 Word 风格面板，默认为 `menu`。 */
  layout?: VscRibbonMenuLayout;
  /** 面板标题。 */
  title?: string;
  /** 面板列数，限制在 1–8。 */
  columns?: number;
  /** 面板或菜单中的沙箱静态内容。 */
  custom?: VscRibbonCustomContent;
}

/** 响应式合并菜单声明。 */
export interface VscRibbonResponsiveMenu {
  /** 同一分组内相同 id 的按钮会合并为同一个下拉入口。 */
  id: string;
  title: string;
  icon?: VscRibbonIcon;
}

/** Ribbon 按钮、菜单项或面板格子。 */
export interface VscRibbonItem {
  /** 按钮类型，默认为 `button`；有菜单时通常使用 `dropdown` 或 `splitButton`。 */
  type?: VscRibbonItemType;
  /** 命令标识；组件只派发事件，不执行命令。 */
  command?: string;
  /** 命令参数，原样放入 `vsc-ribbon-command` 事件详情。 */
  arguments?: readonly unknown[];
  /** 按钮或菜单项标题。 */
  title: string;
  /** 图标；字符串默认按 Codicon 名称解析。 */
  icon?: VscRibbonIcon;
  /** 下拉菜单；存在时按按钮类型展开。 */
  menu?: VscRibbonMenu;
  /** 主区域尺寸，默认为 `full`。 */
  size?: VscRibbonItemSize;
  /** 主区域紧凑样式，默认为 `iconAndLabel`。 */
  style?: VscRibbonItemStyle;
  /** 宽度不足时依次尝试的尺寸与样式。 */
  responsive?: readonly VscRibbonResponsiveStep[];
  /** 宽度不足时与同 id 按钮合并为下拉入口。 */
  responsiveMenu?: VscRibbonResponsiveMenu;
  /** 排序值，较小者在前。 */
  order?: number;
  /** 占位项：可见但不可执行，默认提示“功能尚未实现”。 */
  placeholder?: boolean;
  /** 禁用项：可见但不可操作。 */
  disabled?: boolean;
  /** 切换按钮的按下状态；设置后输出 `aria-pressed`。 */
  pressed?: boolean;
  /** 鼠标悬停提示；默认使用标题。 */
  tooltip?: string;
  /** 菜单项右侧的快捷键文字。 */
  keybinding?: string;
  /** 在菜单中渲染为分隔线。 */
  separator?: boolean;
}

/** Ribbon 功能组。 */
export interface VscRibbonGroup {
  /** 分组标识；缺省时自动生成，只需在标签内唯一。 */
  id?: string;
  /** 分组标题。 */
  title: string;
  /** 排序值，较小者在前。 */
  order?: number;
  /** 分组内的按钮。 */
  items: readonly VscRibbonItem[];
}

/** Ribbon 标签。 */
export interface VscRibbonTab {
  /** 标签标识，必须唯一。 */
  id: string;
  /** 标签标题。 */
  title: string;
  /** 排序值，较小者在前。 */
  order?: number;
  /** 是否作为初始标签；没有声明时使用第一个标签。 */
  default?: boolean;
  /** 标签内的功能组。 */
  groups: readonly VscRibbonGroup[];
}

/** 归一化后的沙箱内容。 */
export interface RibbonCustomContentModel {
  html: string;
  css: string;
  width: number;
  height: number;
}

/** 归一化后的下拉菜单。 */
export interface RibbonMenuModel {
  items: RibbonItemModel[];
  layout: VscRibbonMenuLayout;
  title: string | null;
  columns: number;
  custom: RibbonCustomContentModel | null;
}

/** 归一化后的按钮模型。 */
export interface RibbonItemModel {
  /** 在整份 Ribbon 配置中的稳定路径。 */
  key: string;
  /** 调用方传入的原始条目，用于事件详情。 */
  source: VscRibbonItem;
  type: VscRibbonItemType;
  command: string | null;
  arguments: readonly unknown[];
  title: string;
  icon: ResolvedRibbonIcon;
  menu: RibbonMenuModel | null;
  size: VscRibbonItemSize;
  style: VscRibbonItemStyle;
  responsive: readonly VscRibbonResponsiveStep[];
  responsiveMenu: {
    id: string;
    title: string;
    icon: ResolvedRibbonIcon;
  } | null;
  /** 由响应式合并生成的下拉入口所对应的声明 id；普通条目为 `null`。 */
  mergedMenuId: string | null;
  placeholder: boolean;
  disabled: boolean;
  pressed?: boolean;
  tooltip: string;
  keybinding: string;
  separator: boolean;
  order: number;
}

/** 归一化后的功能组。 */
export interface RibbonGroupModel {
  key: string;
  id: string;
  title: string;
  order: number;
  items: RibbonItemModel[];
  /** 由 `responsiveMenu` 合成的下拉入口。 */
  mergedMenus: RibbonItemModel[];
  source: VscRibbonGroup;
}

/** 归一化后的标签。 */
export interface RibbonTabModel {
  id: string;
  title: string;
  order: number;
  isDefault: boolean;
  groups: RibbonGroupModel[];
  source: VscRibbonTab;
}

/** 标签切换事件。 */
export type VscRibbonSelectEvent = CustomEvent<{
  tabId: string;
  tab: VscRibbonTab;
}>;

/** 命令请求事件；由宿主执行实际命令。 */
export type VscRibbonCommandEvent = CustomEvent<{
  command: string;
  arguments: readonly unknown[];
  item: VscRibbonItem;
  tabId: string;
}>;

/** 折叠状态变化事件。 */
export type VscRibbonCollapseEvent = CustomEvent<{
  collapsed: boolean;
}>;
