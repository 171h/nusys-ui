import type {
  ResolvedRibbonIcon,
  RibbonDialogLauncherModel,
  RibbonGroupModel,
  RibbonItemModel,
  RibbonMenuModel,
  RibbonTabModel,
  VscRibbonCustomContent,
  VscRibbonGroup,
  VscRibbonIcon,
  VscRibbonItem,
  VscRibbonItemSize,
  VscRibbonItemStyle,
  VscRibbonMenu,
  VscRibbonTab,
} from './ribbon-types.js';

const CUSTOM_WIDTH_RANGE = [160, 1200] as const;
const CUSTOM_HEIGHT_RANGE = [80, 800] as const;
const PANEL_COLUMNS_RANGE = [1, 8] as const;

const IMAGE_SOURCE = /^(?:data:|https?:|blob:|\.{0,2}\/)/i;
const IMAGE_EXTENSION = /\.(?:svg|png|jpe?g|gif|webp|avif)(?:[?#].*)?$/i;

function clamp(value: number, [minimum, maximum]: readonly [number, number]) {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 把调用方提供的图标归一化为组件内部模型。
 *
 * 支持以下写法：
 * - `'$(add)'` 或 `'add'`：Codicon 名称；
 * - `'./assets/icon.svg'`、`data:`、`http(s):`：图片地址；
 * - `{codicon: 'add'}`、`{url: './icon.svg'}`：显式声明；
 * - `{light, dark}`：按主题选择；
 * - 已归一化的 `{type: 'codicon' | 'image' | 'themed'}` 对象。
 */
export function resolveRibbonIcon(
  icon: VscRibbonIcon | undefined
): ResolvedRibbonIcon {
  if (icon === undefined || icon === null) {
    return {type: 'codicon', id: 'symbol-misc'};
  }

  if (typeof icon === 'string') {
    const text = icon.trim();
    if (!text) {
      return {type: 'codicon', id: 'symbol-misc'};
    }
    if (text.startsWith('$(') && text.endsWith(')')) {
      return {type: 'codicon', id: text.slice(2, -1)};
    }
    if (IMAGE_SOURCE.test(text) || IMAGE_EXTENSION.test(text)) {
      return {type: 'image', url: text};
    }
    return {type: 'codicon', id: text};
  }

  if (isRecord(icon)) {
    const record = icon as Record<string, unknown>;
    if ('type' in record) {
      if (record.type === 'codicon' && typeof record.id === 'string') {
        return {type: 'codicon', id: record.id};
      }
      if (record.type === 'image' && typeof record.url === 'string') {
        return {type: 'image', url: record.url};
      }
      if (
        record.type === 'themed' &&
        isRecord(record.light) &&
        isRecord(record.dark)
      ) {
        return {
          type: 'themed',
          light: resolveRibbonIcon(record.light as VscRibbonIcon),
          dark: resolveRibbonIcon(record.dark as VscRibbonIcon),
        };
      }
    }
    if (typeof record.codicon === 'string') {
      return {type: 'codicon', id: record.codicon};
    }
    if (typeof record.url === 'string') {
      return {type: 'image', url: record.url};
    }
    if ('light' in record && 'dark' in record) {
      return {
        type: 'themed',
        light: resolveRibbonIcon(record.light as VscRibbonIcon),
        dark: resolveRibbonIcon(record.dark as VscRibbonIcon),
      };
    }
  }

  return {type: 'codicon', id: 'symbol-misc'};
}

/** 按当前主题解析浅色或深色图标；普通图标原样返回。 */
export function resolveThemedIcon(
  icon: ResolvedRibbonIcon,
  dark: boolean
): Exclude<ResolvedRibbonIcon, {type: 'themed'}> {
  if (icon.type !== 'themed') {
    return icon;
  }
  return resolveThemedIcon(dark ? icon.dark : icon.light, dark);
}

function buildCustomContent(
  custom: VscRibbonCustomContent | undefined
): RibbonMenuModel['custom'] {
  if (!custom) {
    return null;
  }
  return {
    html: custom.html ?? '',
    css: custom.css ?? '',
    width: clamp(custom.width ?? 360, CUSTOM_WIDTH_RANGE),
    height: clamp(custom.height ?? 280, CUSTOM_HEIGHT_RANGE),
  };
}

function buildMenu(menu: VscRibbonMenu, path: string): RibbonMenuModel {
  const items = (menu.items ?? [])
    .map((item, index) => buildItem(item, `${path}/menu/${index}`))
    .sort(
      byOrderThen(
        (item) => item.order,
        (item) => item.title
      )
    );
  const footer = (menu.footer ?? [])
    .map((item, index) => buildItem(item, `${path}/footer/${index}`))
    .sort(
      byOrderThen(
        (item) => item.order,
        (item) => item.title
      )
    );
  return {
    items,
    footer,
    layout: menu.layout === 'panel' ? 'panel' : 'menu',
    title: menu.title?.trim() ? menu.title : null,
    columns: clamp(menu.columns ?? 3, PANEL_COLUMNS_RANGE),
    custom: buildCustomContent(menu.custom),
  };
}

function buildItem(item: VscRibbonItem, path: string): RibbonItemModel {
  const command = item.command ?? null;
  const menu = item.menu ? buildMenu(item.menu, path) : null;
  const separator = item.separator === true;
  const placeholder =
    item.placeholder === true || (!command && !menu && !separator);
  const title = item.title ?? '';
  const description = item.description?.trim() ?? '';

  return {
    key: path,
    source: item,
    type: item.type ?? 'button',
    command,
    arguments: item.arguments ?? [],
    title,
    icon: resolveRibbonIcon(item.icon),
    menu,
    size: item.size ?? 'full',
    style: item.style ?? 'iconAndLabel',
    responsive: item.responsive ?? [],
    placeholder,
    disabled: item.disabled === true || placeholder,
    pressed: typeof item.pressed === 'boolean' ? item.pressed : undefined,
    tooltip: item.tooltip?.trim() ? item.tooltip : title,
    keybinding: item.keybinding ?? '',
    separator,
    heading: item.heading === true,
    description,
    order: item.order ?? 0,
  };
}

function byOrderThen<T>(
  readOrder: (value: T) => number,
  readTitle: (value: T) => string
) {
  return (left: T, right: T) =>
    readOrder(left) - readOrder(right) ||
    readTitle(left).localeCompare(readTitle(right), 'zh-CN');
}

/** 归一化分组右下角的对话框启动器。 */
function buildDialogLauncher(
  group: VscRibbonGroup
): RibbonDialogLauncherModel | null {
  const value = group.dialogLauncher;
  if (!value) {
    return null;
  }
  const config = value === true ? {} : value;
  const title = config.title?.trim()
    ? config.title
    : `打开“${group.title}”对话框`;

  return {
    title,
    icon: resolveRibbonIcon(config.icon ?? 'link-external'),
  };
}

function buildGroup(
  group: VscRibbonGroup,
  index: number,
  tabId: string
): RibbonGroupModel {
  const id = group.id?.trim() ? group.id : `group-${index + 1}`;
  const path = `${tabId}/${id}`;
  const items = (group.items ?? [])
    .map((item, itemIndex) => buildItem(item, `${path}/${itemIndex}`))
    .sort(
      byOrderThen(
        (item) => item.order,
        (item) => item.title
      )
    );

  return {
    key: path,
    id,
    title: group.title,
    order: group.order ?? 0,
    items,
    dialogLauncher: buildDialogLauncher(group),
    source: group,
  };
}

/**
 * 归一化标签、分组与按钮：补默认值、解析图标、排序并生成稳定的渲染键。
 * 输入数组不会被修改。
 */
export function buildRibbonTabs(
  tabs: readonly VscRibbonTab[]
): RibbonTabModel[] {
  return tabs
    .map((tab) => ({
      id: tab.id,
      title: tab.title,
      order: tab.order ?? 0,
      isDefault: tab.default === true,
      groups: (tab.groups ?? [])
        .map((group, index) => buildGroup(group, index, tab.id))
        .sort(
          byOrderThen(
            (group) => group.order,
            (group) => group.id
          )
        ),
      source: tab,
    }))
    .sort(
      byOrderThen(
        (tab) => tab.order,
        (tab) => tab.id
      )
    );
}

/** 解析按钮在指定降级层级下的档位。 */
export function resolveRibbonItemLevel(
  item: RibbonItemModel,
  level: number
): {size: VscRibbonItemSize; style: VscRibbonItemStyle} {
  let current: {size: VscRibbonItemSize; style: VscRibbonItemStyle} = {
    size: item.size,
    style: item.style,
  };
  for (let index = 0; index < level; index++) {
    const step = item.responsive[Math.min(index, item.responsive.length - 1)];
    if (!step) {
      break;
    }
    current = {
      size: step.size ?? current.size,
      style: step.style ?? current.style,
    };
  }
  return current;
}

/** 按钮在 Ribbon 主区域的行高形态。 */
export type RibbonItemLayout = 'vertical' | 'horizontal' | 'icon-only';

/**
 * `full` 忽略 `style`，固定为“上图标、下标题”；`half` / `third` 按 `style`
 * 显示横向图文或纯图标。
 */
export function resolveRibbonItemLayout(
  size: VscRibbonItemSize,
  style: VscRibbonItemStyle
): RibbonItemLayout {
  if (size === 'full') {
    return 'vertical';
  }
  return style === 'icon' ? 'icon-only' : 'horizontal';
}

/** 标题允许显示的行数：`third` 只显示一行，其余最多两行。 */
export function resolveRibbonLabelLines(size: VscRibbonItemSize): 1 | 2 {
  return size === 'third' ? 1 : 2;
}

/**
 * 将尺寸策略完全相同的按钮归为一批，保证同组按钮整批降档而不是大小混排。
 * 没有声明 `responsive` 的固定按钮不参与。
 */
export function collectResponsiveBatches(
  items: readonly RibbonItemModel[]
): RibbonItemModel[][] {
  const batches = new Map<string, RibbonItemModel[]>();
  for (const item of items) {
    if (item.responsive.length === 0) {
      continue;
    }
    const levels = Array.from(
      {length: item.responsive.length + 1},
      (_, index) => resolveRibbonItemLevel(item, index)
    );
    const key = JSON.stringify(levels);
    const batch = batches.get(key) ?? [];
    batch.push(item);
    batches.set(key, batch);
  }
  return [...batches.values()];
}

/** 一次推进整批按钮的下一档；全部用尽时返回 `null`。 */
export function nextResponsiveBatch(
  items: readonly RibbonItemModel[],
  steps: ReadonlyMap<RibbonItemModel, number>
): Map<RibbonItemModel, number> | null {
  const nextSteps = new Map(steps);
  let changed = false;
  for (const item of items) {
    const step = steps.get(item) ?? -1;
    if (step + 1 < item.responsive.length) {
      nextSteps.set(item, step + 1);
      changed = true;
    }
  }
  return changed ? nextSteps : null;
}

/** 两端悬浮滚动按钮的显隐状态。 */
export function resolveRibbonScrollState(
  contentWidth: number,
  viewportWidth: number,
  scrollLeft: number
) {
  const maximum = Math.max(0, contentWidth - viewportWidth);
  return {
    left: maximum > 1 && scrollLeft > 1,
    right: maximum > 1 && scrollLeft < maximum - 1,
  };
}
