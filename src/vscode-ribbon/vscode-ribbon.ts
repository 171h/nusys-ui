import {html, nothing, PropertyValues, TemplateResult} from 'lit';
import {property, query, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {customElement, VscElement} from '../includes/VscElement.js';
import {
  CODICON_STYLESHEET_WARNING,
  getCodiconStylesheetConfig,
  type CodiconStylesheetConfig,
} from '../includes/codicon-stylesheet.js';
import {stylePropertyMap} from '../includes/style-property-map.js';
import uniqueId from '../includes/uniqueId.js';
import {buildRibbonCustomContentSource} from './ribbon-custom-content.js';
import {
  buildRibbonTabs,
  collectResponsiveBatches,
  nextResponsiveBatch,
  resolveRibbonItemLayout,
  resolveRibbonItemLevel,
  resolveRibbonScrollState,
  resolveThemedIcon,
} from './ribbon-model.js';
import type {
  ResolvedRibbonIcon,
  RibbonGroupModel,
  RibbonItemModel,
  RibbonMenuModel,
  RibbonTabModel,
  VscRibbonCollapseEvent,
  VscRibbonCommandEvent,
  VscRibbonDialogEvent,
  VscRibbonItem,
  VscRibbonSelectEvent,
  VscRibbonTab,
  VscRibbonTheme,
} from './ribbon-types.js';
import styles from './vscode-ribbon.styles.js';

interface PopoverPosition {
  left: number;
  top: number;
  maxHeight: number;
}

interface OpenMenuState {
  item: RibbonItemModel;
  anchor: HTMLElement;
}

interface FlyoutMenuState {
  item: RibbonItemModel;
  menu: RibbonMenuModel;
  anchor: HTMLElement;
  position: PopoverPosition | null;
}

interface OpenGroupState {
  group: RibbonGroupModel;
  anchor: HTMLElement;
}

interface StoredRibbonState {
  collapsed?: boolean;
  activeTabId?: string;
}

const POPOVER_MARGIN = 8;
const POPOVER_GAP = 2;
const POPOVER_MIN_SPACE = 160;

/**
 * 声明式功能区（Ribbon）菜单，提供标签、功能组、按钮、下拉菜单、面板、
 * 响应式降级与折叠。
 *
 * 组件不执行命令，只派发 `vsc-ribbon-command` 事件；宿主根据 `command`
 * 与 `arguments` 调用实际业务。布局参考 VS Code 与 Microsoft Ribbon：
 * 按钮区按六轨网格排列，`full` 占满、`half` 占三轨、`third` 占两轨。
 *
 * @tag vscode-ribbon
 *
 * @slot tabs-start - 标签栏左侧的附加内容，例如应用菜单或文件操作。
 * @slot tabs-end - 标签栏右侧的附加内容，位于折叠按钮之前。
 *
 * @fires {VscRibbonCommandEvent} vsc-ribbon-command - 激活带命令的按钮或菜单项时派发。
 * @fires {VscRibbonSelectEvent} vsc-ribbon-select - 活动标签变化时派发。
 * @fires {VscRibbonCollapseEvent} vsc-ribbon-collapse - 功能区展开或折叠时派发。
 * @fires {VscRibbonDialogEvent} vsc-ribbon-dialog - 点击功能组右下角的对话框启动器时派发。
 *
 * @cssprop [--vsc-ribbon-tabs-height=32px] - 标签栏高度。
 * @cssprop [--vsc-ribbon-items-height=74px] - 按钮区高度。
 * @cssprop [--vsc-ribbon-icon-size=40px] - 全高按钮图标尺寸。
 * @cssprop [--vsc-ribbon-compact-icon-size=22px] - 半高按钮图标尺寸。
 * @cssprop [--vscode-editor-background=#1f1f1f] - 功能区背景。
 * @cssprop [--vscode-foreground=#cccccc] - 功能区文字颜色。
 * @cssprop [--vscode-panel-border=#454545] - 分组与标签分隔线颜色。
 * @cssprop [--vscode-toolbar-hoverBackground=rgba(90, 93, 94, 0.31)] - 悬停背景。
 * @cssprop [--vscode-toolbar-activeBackground=rgba(99, 102, 103, 0.31)] - 按下与展开背景。
 * @cssprop [--vscode-focusBorder=#0078d4] - 焦点边框颜色。
 * @cssprop [--vscode-descriptionForeground=#9d9d9d] - 分组标题颜色。
 * @cssprop [--vscode-menu-background=#1f1f1f] - 菜单背景。
 * @cssprop [--vscode-menu-foreground=#cccccc] - 菜单文字颜色。
 * @cssprop [--vscode-menu-border=#454545] - 菜单边框颜色。
 * @cssprop [--vscode-menu-selectionBackground=#0078d4] - 菜单选中背景。
 * @cssprop [--vscode-menu-selectionForeground=#ffffff] - 菜单选中文字颜色。
 * @cssprop [--vscode-menu-separatorBackground=#454545] - 菜单分隔线颜色。
 * @cssprop [--vscode-editorHoverWidget-background=#252526] - 面板背景。
 * @cssprop [--vscode-editorHoverWidget-border=#454545] - 面板边框。
 * @cssprop [--vscode-widget-shadow=rgba(0, 0, 0, 0.36)] - 弹层阴影。
 */
@customElement('vscode-ribbon')
export class VscodeRibbon extends VscElement {
  static override styles = styles;

  /**
   * 标签、功能组与按钮声明。数组、对象和嵌套菜单通过 JavaScript 属性设置。
   */
  @property({attribute: false})
  tabs: readonly VscRibbonTab[] = [];

  /** 标题排序语言；未设置时继承最近的 lang，最终使用浏览器默认语言。 */
  @property({attribute: 'sort-locale'})
  sortLocale = '';

  private _activeTabId = '';
  private _collapsed = false;
  private _activeTabConfigured = false;
  private _collapsedConfigured = false;
  private _restoringState = false;

  /** 当前标签 id；无匹配项时使用 `default` 标签或第一个标签。 */
  @property({reflect: true, attribute: 'active-tab'})
  get activeTabId(): string {
    return this._activeTabId;
  }

  set activeTabId(value: string) {
    if (!this._restoringState) {
      this._activeTabConfigured = true;
    }
    this._activeTabId = value;
  }

  /** 折叠按钮区，只保留标签栏。 */
  @property({type: Boolean, reflect: true})
  get collapsed(): boolean {
    return this._collapsed;
  }

  set collapsed(value: boolean) {
    if (!this._restoringState) {
      this._collapsedConfigured = true;
    }
    this._collapsed = value;
  }

  /** 是否显示折叠按钮并允许折叠；设为 `false` 后功能区始终展开。 */
  @property({type: Boolean, reflect: true})
  collapsible = true;

  /** 将折叠状态与最后标签写入 `localStorage`。 */
  @property({type: Boolean, reflect: true, attribute: 'persist-state'})
  persistState = false;

  /** 持久化使用的键；多个功能区可分别设置。 */
  @property({attribute: 'storage-key'})
  storageKey = 'vscode-ribbon';

  /** 图标主题；`auto` 跟随页面明暗主题。 */
  @property({reflect: true})
  theme: VscRibbonTheme = 'auto';

  /** 标签栏的无障碍名称。 */
  @property({attribute: 'tablist-label'})
  tablistLabel = '功能区标签';

  /** 折叠按钮的无障碍名称。 */
  @property({attribute: 'collapse-label'})
  collapseLabel = '折叠功能区';

  /** 展开按钮的无障碍名称。 */
  @property({attribute: 'expand-label'})
  expandLabel = '展开功能区';

  /** 打开下拉菜单的无障碍名称前缀。 */
  @property({attribute: 'open-menu-label'})
  openMenuLabel = '打开菜单';

  /** 打开折叠分组菜单的无障碍名称前缀。 */
  @property({attribute: 'open-group-label'})
  openGroupLabel = '打开分组菜单';

  /** 菜单返回按钮的文字。 */
  @property({attribute: 'back-label'})
  backLabel = '返回';

  /** 关闭面板按钮的无障碍名称。 */
  @property({attribute: 'close-panel-label'})
  closePanelLabel = '关闭面板';

  /** 向左、向右滚动按钮的无障碍名称。 */
  @property({attribute: 'scroll-left-label'})
  scrollLeftLabel = '向左滚动';

  /** 向右滚动按钮的无障碍名称。 */
  @property({attribute: 'scroll-right-label'})
  scrollRightLabel = '向右滚动';

  /** 占位项提示文字。 */
  @property({attribute: 'placeholder-label'})
  placeholderLabel = '功能尚未实现';

  /** 自定义内容 iframe 的无障碍名称。 */
  @property({attribute: 'custom-content-label'})
  customContentLabel = '自定义内容';

  @state()
  private _models: RibbonTabModel[] = [];

  @state()
  private _overlayOpen = false;

  @state()
  private _dark = false;

  @state()
  private _responsiveSteps = new Map<RibbonItemModel, number>();

  @state()
  private _foldedGroups = new Set<string>();

  @state()
  private _openMenu: OpenMenuState | null = null;

  @state()
  private _menuStack: RibbonMenuModel[] = [];

  @state()
  private _menuPosition: PopoverPosition | null = null;

  @state()
  private _flyouts: FlyoutMenuState[] = [];

  @state()
  private _openGroup: OpenGroupState | null = null;

  @state()
  private _groupPosition: PopoverPosition | null = null;

  @state()
  private _showScrollLeft = false;

  @state()
  private _showScrollRight = false;

  @query('.ribbon-scroll-viewport') private _viewportEl!: HTMLElement;
  @query('.ribbon-groups') private _groupsEl!: HTMLElement;
  @query('.ribbon-menu-popover') private _menuEl?: HTMLElement;
  @query('.ribbon-group-popover') private _groupEl?: HTMLElement;

  private _layoutTimer?: ReturnType<typeof setTimeout>;
  private _layoutToken = 0;
  private _resizeObserver?: ResizeObserver;
  private _themeObserver?: MutationObserver;
  private _localeObserver?: MutationObserver;
  private _storedState: StoredRibbonState | null = null;
  private _restored = false;
  private _menuFocusFrame?: number;
  private _instanceId = uniqueId('ribbon-');
  private _panelId = `${this._instanceId}-panel`;
  private _codiconStylesheet: CodiconStylesheetConfig = {};

  constructor() {
    super();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._codiconStylesheet = getCodiconStylesheetConfig();
    if (!this._codiconStylesheet.href && typeof document !== 'undefined') {
      this.warn(CODICON_STYLESHEET_WARNING);
    }
    this._storedState = this._readStoredState();
    this._syncTheme();
    this._observeTheme();
    this._localeObserver = new MutationObserver((records) => {
      if (
        records.some(
          ({target}) => target instanceof Element && target.contains(this)
        )
      ) {
        this.requestUpdate('sortLocale', undefined);
      }
    });
    this._localeObserver.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ['lang'],
    });
    document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
    document.addEventListener('keydown', this._onDocumentKeyDown);
    window.addEventListener('resize', this._onWindowResize);
    window.addEventListener('scroll', this._onWindowScroll, true);
    this._resizeObserver = new ResizeObserver(() => this._scheduleLayout());
    this._resizeObserver.observe(this);
    this._scheduleLayout();
  }

  override disconnectedCallback(): void {
    document.removeEventListener(
      'pointerdown',
      this._onDocumentPointerDown,
      true
    );
    document.removeEventListener('keydown', this._onDocumentKeyDown);
    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('scroll', this._onWindowScroll, true);
    this._resizeObserver?.disconnect();
    this._themeObserver?.disconnect();
    this._localeObserver?.disconnect();
    clearTimeout(this._layoutTimer);
    cancelAnimationFrame(this._menuFocusFrame ?? 0);
    this._layoutToken++;
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (!this.collapsible && this.collapsed) {
      this.collapsed = false;
    }
    if (changed.has('tabs') || changed.has('sortLocale')) {
      this._models = buildRibbonTabs(
        this.tabs,
        this.sortLocale ||
          this.closest('[lang]')?.getAttribute('lang') ||
          undefined
      );
      this._resetResponsiveState();
      this._restored = this._storedState === null;
      this._scheduleLayout();
    }
    if (changed.has('theme')) {
      this._syncTheme();
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('persistState') || changed.has('storageKey')) {
      this._storedState = this._readStoredState();
      this._restored = this._storedState === null;
    }
    if (!this._restored) {
      this._restoreState();
    }
    if (
      changed.has('tabs') ||
      changed.has('sortLocale') ||
      changed.has('activeTabId') ||
      changed.has('collapsed')
    ) {
      this._closeMenu(false);
      this._closeGroup(false);
      this._scheduleLayout();
    }
  }

  private get _activeTab(): RibbonTabModel | undefined {
    return (
      this._models.find((tab) => tab.id === this.activeTabId) ??
      this._models.find((tab) => tab.isDefault) ??
      this._models[0]
    );
  }

  private _readStoredState(): StoredRibbonState | null {
    if (!this.persistState || typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as StoredRibbonState;
      return {
        collapsed: parsed.collapsed === true,
        activeTabId:
          typeof parsed.activeTabId === 'string'
            ? parsed.activeTabId
            : undefined,
      };
    } catch {
      return null;
    }
  }

  private _restoreState(): void {
    const stored = this._storedState;
    if (!stored) {
      this._restored = true;
      return;
    }
    if (this._models.length === 0) {
      // 等待调用方通过 JavaScript 设置 tabs 后再恢复。
      return;
    }
    this._restored = true;
    this._storedState = null;
    this._restoringState = true;
    if (
      !this._collapsedConfigured &&
      this.collapsible &&
      typeof stored.collapsed === 'boolean'
    ) {
      this.collapsed = stored.collapsed;
    }
    if (
      !this._activeTabConfigured &&
      stored.activeTabId &&
      this._models.some((tab) => tab.id === stored.activeTabId)
    ) {
      this.activeTabId = stored.activeTabId;
    }
    this._restoringState = false;
  }

  private _persistState(): void {
    if (!this.persistState || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          collapsed: this.collapsed,
          activeTabId: this._activeTab?.id ?? this.activeTabId,
        })
      );
    } catch {
      // 存储不可用时仅丢失功能区记忆，不影响交互。
    }
  }

  private _observeTheme(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    this._themeObserver = new MutationObserver(() => this._syncTheme());
    this._themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-vscode-theme-kind', 'data-theme-id'],
    });
  }

  private _syncTheme(): void {
    const dark =
      this.theme === 'dark' ||
      (this.theme === 'auto' &&
        (document.body.classList.contains('vscode-dark') ||
          document.body.classList.contains('vscode-high-contrast') ||
          document.body.dataset.vscodeThemeKind === 'vscode-dark' ||
          document.body.dataset.vscodeThemeKind === 'vscode-high-contrast' ||
          document.documentElement.dataset.vscodeThemeKind === 'vscode-dark' ||
          document.documentElement.dataset.vscodeThemeKind ===
            'vscode-high-contrast'));
    if (dark !== this._dark) {
      this._dark = dark;
    }
  }

  private _resetResponsiveState(): void {
    this._layoutToken++;
    clearTimeout(this._layoutTimer);
    this._layoutTimer = undefined;
    this._responsiveSteps = new Map();
    this._foldedGroups = new Set();
    this._showScrollLeft = false;
    this._showScrollRight = false;
  }

  private _scheduleLayout(): void {
    if (this._layoutTimer !== undefined) {
      return;
    }
    this._layoutTimer = setTimeout(() => {
      this._layoutTimer = undefined;
      void this._evaluateLayout();
    }, 16);
  }

  private _fits(): boolean {
    const viewport = this._viewportEl;
    const groups = this._groupsEl;
    if (!viewport || !groups) {
      return true;
    }
    // 逐组累加可收缩宽度：图库分组按最小宽度参与测量，避免把其填充宽度当成溢出。
    const style = getComputedStyle(groups);
    const padding =
      (parseFloat(style.paddingLeft) || 0) +
      (parseFloat(style.paddingRight) || 0);
    const contentWidth =
      Array.from(groups.children).reduce((width, child) => {
        const element = child as HTMLElement;
        const rectWidth = element.getBoundingClientRect().width;
        if (!element.classList.contains('ribbon-group-gallery')) {
          return width + rectWidth;
        }
        const minWidth = parseFloat(getComputedStyle(element).minWidth);
        return (
          width +
          (Number.isFinite(minWidth)
            ? Math.min(rectWidth, minWidth)
            : rectWidth)
        );
      }, 0) + padding;
    return contentWidth <= viewport.clientWidth + 1;
  }

  /**
   * 分组只包含一个下拉按钮时，它本身就是一层菜单；
   * 整组折叠会再套一层溢出下拉，因此跳过折叠并保留原有菜单结构。
   */
  private _isSingleMenuGroup(group: RibbonGroupModel): boolean {
    return (
      group.layout === 'default' &&
      group.items.length === 1 &&
      group.items[0].menu !== null
    );
  }

  /**
   * 响应式降级链：
   * ① 同组相同策略整批降档 → ② 从右向左整组折叠到溢出下拉入口 →
   * ③ 仍溢出时显示两端悬浮滚动按钮。
   * 折叠分组在弹层中始终按声明的原始布局完整渲染。
   */
  private async _evaluateLayout(): Promise<void> {
    if (this.collapsed && !this._overlayOpen) {
      return;
    }
    const token = ++this._layoutToken;
    const viewport = this._viewportEl;
    if (!viewport) {
      return;
    }

    this._responsiveSteps = new Map();
    this._foldedGroups = new Set();
    viewport.scrollLeft = 0;
    await this.updateComplete;
    if (token !== this._layoutToken) {
      return;
    }

    const tab = this._activeTab;
    if (!tab) {
      this._updateScrollButtons();
      return;
    }

    const batches = tab.groups.flatMap((group) =>
      collectResponsiveBatches(group.items)
    );
    let changed = true;
    while (!this._fits() && changed) {
      changed = false;
      for (const batch of batches) {
        if (token !== this._layoutToken) {
          return;
        }
        const next = nextResponsiveBatch(batch, this._responsiveSteps);
        if (!next) {
          continue;
        }
        this._responsiveSteps = next;
        changed = true;
        await this.updateComplete;
        if (token !== this._layoutToken) {
          return;
        }
        if (this._fits()) {
          break;
        }
      }
    }

    for (let index = tab.groups.length - 1; index >= 0; index--) {
      if (this._fits()) {
        break;
      }
      if (token !== this._layoutToken) {
        return;
      }
      const group = tab.groups[index];
      // 只有一个下拉按钮的分组不再套一层溢出下拉，保留原有菜单结构。
      if (this._isSingleMenuGroup(group)) {
        continue;
      }
      this._foldedGroups = new Set(this._foldedGroups).add(group.key);
      await this.updateComplete;
      if (token !== this._layoutToken) {
        return;
      }
    }

    // 分组重新展开后，对应的溢出弹层不再有可用的入口。
    if (this._openGroup && !this._foldedGroups.has(this._openGroup.group.key)) {
      this._closeGroup(false);
    }

    this._updateScrollButtons();
  }

  private _updateScrollButtons(): void {
    const viewport = this._viewportEl;
    const groups = this._groupsEl;
    if (!viewport || !groups) {
      this._showScrollLeft = false;
      this._showScrollRight = false;
      return;
    }
    const state = resolveRibbonScrollState(
      groups.scrollWidth,
      viewport.clientWidth,
      viewport.scrollLeft
    );
    this._showScrollLeft = state.left;
    this._showScrollRight = state.right;
  }

  private _scrollRibbon(direction: -1 | 1): void {
    const viewport = this._viewportEl;
    if (!viewport) {
      return;
    }
    const maximum = Math.max(
      0,
      (this._groupsEl?.scrollWidth ?? 0) - viewport.clientWidth
    );
    viewport.scrollLeft = Math.max(
      0,
      Math.min(
        maximum,
        viewport.scrollLeft +
          direction * Math.max(80, Math.floor(viewport.clientWidth * 0.8))
      )
    );
    this._updateScrollButtons();
  }

  private _onViewportScroll(): void {
    this._closeMenu(false);
    this._closeGroup(false);
    this._updateScrollButtons();
  }

  private _itemLevel(item: RibbonItemModel, original = false) {
    return resolveRibbonItemLevel(
      item,
      original ? 0 : (this._responsiveSteps.get(item) ?? -1) + 1
    );
  }

  private _isMenuOpen(item: RibbonItemModel): boolean {
    return this._openMenu?.item.key === item.key;
  }

  private _isGroupOpen(group: RibbonGroupModel): boolean {
    return this._openGroup?.group.key === group.key;
  }

  private _groupIcon(group: RibbonGroupModel): ResolvedRibbonIcon {
    const representative =
      group.items.find((item) => !item.placeholder && !item.disabled) ??
      group.items[0];
    return representative?.icon ?? {type: 'codicon', id: 'symbol-misc'};
  }

  private _selectTab(tab: RibbonTabModel): void {
    this._closeMenu(false);
    this._closeGroup(false);
    if (this.activeTabId !== tab.id) {
      this.activeTabId = tab.id;
      this.dispatchEvent(
        new CustomEvent('vsc-ribbon-select', {
          detail: {tabId: tab.id, tab: tab.source},
          bubbles: true,
          composed: true,
        }) as VscRibbonSelectEvent
      );
      this._persistState();
    }
    if (this.collapsed) {
      this._overlayOpen = true;
      this._scheduleLayout();
    }
  }

  private _setCollapsed(collapsed: boolean): void {
    if (!this.collapsible || this.collapsed === collapsed) {
      return;
    }
    this.collapsed = collapsed;
    this._overlayOpen = false;
    this._closeMenu(false);
    this._closeGroup(false);
    this._persistState();
    this.dispatchEvent(
      new CustomEvent('vsc-ribbon-collapse', {
        detail: {collapsed: this.collapsed},
        bubbles: true,
        composed: true,
      }) as VscRibbonCollapseEvent
    );
    this._scheduleLayout();
  }

  /** 折叠按钮区。 */
  collapse(): void {
    this._setCollapsed(true);
  }

  /** 展开按钮区。 */
  expand(): void {
    this._setCollapsed(false);
  }

  /** 切换折叠状态。 */
  toggleCollapsed(): void {
    this._setCollapsed(!this.collapsed);
  }

  /** 切换到指定标签；标签不存在时忽略。 */
  selectTab(tabId: string): void {
    const tab = this._models.find((model) => model.id === tabId);
    if (tab) {
      this._selectTab(tab);
    }
  }

  /** 关闭所有下拉菜单、分组弹层与折叠覆盖层。 */
  closeMenus(): void {
    this._closeMenu(false);
    this._closeGroup(false);
    this._overlayOpen = false;
  }

  /** 重新测量并执行一次响应式降级。 */
  refreshLayout(): void {
    this._resetResponsiveState();
    this._scheduleLayout();
  }

  private _toggleCollapse(): void {
    this._setCollapsed(!this.collapsed);
  }

  private _onTabsKeyDown = (event: KeyboardEvent): void => {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest('.ribbon-tab')
    ) {
      return;
    }
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) {
      return;
    }
    const index = this._models.findIndex(
      (tab) => tab.id === this._activeTab?.id
    );
    if (index < 0) {
      return;
    }
    let targetIndex = index;
    if (event.key === 'ArrowLeft') {
      targetIndex = (index - 1 + this._models.length) % this._models.length;
    } else if (event.key === 'ArrowRight') {
      targetIndex = (index + 1) % this._models.length;
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else {
      targetIndex = this._models.length - 1;
    }
    event.preventDefault();
    const target = this._models[targetIndex];
    this._selectTab(target);
    this.updateComplete.then(() => {
      const targetButton = Array.from(
        this.shadowRoot?.querySelectorAll<HTMLElement>('.ribbon-tab') ?? []
      ).find((element) => element.dataset.tabId === target.id);
      targetButton?.focus();
    });
  };

  private _onTabDoubleClick(): void {
    this._toggleCollapse();
  }

  private _emitCommand(item: RibbonItemModel): void {
    if (item.disabled || item.placeholder || !item.command) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent('vsc-ribbon-command', {
        detail: {
          command: item.command,
          arguments: item.arguments,
          item: item.source,
          tabId: this._activeTab?.id ?? '',
        },
        bubbles: true,
        composed: true,
      }) as VscRibbonCommandEvent
    );
    if (this.collapsed) {
      this._overlayOpen = false;
    }
  }

  private _activateItem(
    item: RibbonItemModel,
    anchor: HTMLElement,
    context: 'ribbon' | 'group' | 'menu' | 'panel'
  ): void {
    if (item.disabled || item.placeholder) {
      return;
    }
    if (item.menu) {
      if (context === 'group') {
        const groupAnchor = this._openGroup?.anchor ?? anchor;
        this._closeGroup(false);
        this._openItemMenu(item, groupAnchor);
      } else {
        this._openItemMenu(item, anchor);
      }
      return;
    }
    if (item.command) {
      if (context === 'group') {
        this._closeGroup(false);
      } else if (context === 'menu' || context === 'panel') {
        this._closeMenu(false);
      }
      this._emitCommand(item);
    }
  }

  private _runPrimary(
    item: RibbonItemModel,
    context: 'ribbon' | 'group'
  ): void {
    if (item.disabled || item.placeholder) {
      return;
    }
    if (context === 'group') {
      this._closeGroup(false);
    }
    if (item.command) {
      this._emitCommand(item);
    }
  }

  private _emitDialog(group: RibbonGroupModel): void {
    const tab = this._activeTab;
    if (!group.dialogLauncher || !tab) {
      return;
    }
    this._closeMenu(false);
    this._closeGroup(false);
    this.dispatchEvent(
      new CustomEvent('vsc-ribbon-dialog', {
        detail: {
          tabId: tab.id,
          tab: tab.source,
          groupId: group.id,
          group: group.source,
        },
        bubbles: true,
        composed: true,
      }) as VscRibbonDialogEvent
    );
    if (this.collapsed) {
      this._overlayOpen = false;
    }
  }

  private _renderDialogLauncher(
    group: RibbonGroupModel,
    popover = false
  ): TemplateResult | typeof nothing {
    const launcher = group.dialogLauncher;
    if (!launcher) {
      return nothing;
    }
    return html`<button
      type="button"
      class=${classMap({
        'ribbon-group-dialog': true,
        'ribbon-group-popover-dialog': popover,
      })}
      part="group-dialog"
      title=${launcher.title}
      aria-label=${launcher.title}
      aria-haspopup="dialog"
      @click=${() => this._emitDialog(group)}
    >
      ${this._renderIcon(
        launcher.icon,
        'ribbon-group-dialog-icon',
        launcher.rotated
      )}
    </button>`;
  }

  private _toggleMenu(
    item: RibbonItemModel,
    anchor: HTMLElement,
    focus: 'first' | 'last' = 'first'
  ): void {
    if (this._isMenuOpen(item)) {
      this._closeMenu(true);
      return;
    }
    this._openItemMenu(item, anchor, focus);
  }

  private _onTriggerKeyDown(
    event: KeyboardEvent,
    item: RibbonItemModel,
    anchor: HTMLElement
  ): void {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !item.menu ||
      (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
    ) {
      return;
    }
    event.preventDefault();
    const focus = event.key === 'ArrowUp' ? 'last' : 'first';
    if (this._isMenuOpen(item)) {
      this._focusMenu(focus);
      return;
    }
    this._openItemMenu(item, anchor, focus);
  }

  private _openItemMenu(
    item: RibbonItemModel,
    anchor: HTMLElement,
    focus: 'first' | 'last' = 'first'
  ): void {
    if (!item.menu) {
      return;
    }
    if (this._groupEl?.contains(anchor) && this._openGroup) {
      anchor = this._openGroup.anchor;
    }
    this._closeGroup(false);
    this._menuStack = [item.menu];
    this._openMenu = {item, anchor};
    this._menuPosition = null;
    this.updateComplete.then(() => {
      if (!this._openMenu) {
        return;
      }
      this._positionMenu();
      this._focusMenu(focus);
    });
  }

  private _closeMenu(restoreFocus: boolean): void {
    const state = this._openMenu;
    if (!state) {
      return;
    }
    this._openMenu = null;
    this._menuStack = [];
    this._menuPosition = null;
    this._flyouts = [];
    cancelAnimationFrame(this._menuFocusFrame ?? 0);
    this._menuFocusFrame = undefined;
    if (restoreFocus) {
      state.anchor.focus();
    }
  }

  private _positionMenu(): void {
    const anchor = this._openMenu?.anchor;
    const popover = this._menuEl;
    if (!anchor || !popover) {
      return;
    }
    this._menuPosition = this._resolvePopoverPosition(
      anchor.getBoundingClientRect(),
      popover.getBoundingClientRect()
    );
    this.updateComplete.then(() => {
      if (!this._openMenu || !this._menuEl) {
        return;
      }
      const measured = this._menuEl.getBoundingClientRect();
      const next = this._resolvePopoverPosition(
        anchor.getBoundingClientRect(),
        measured
      );
      if (
        !this._menuPosition ||
        next.left !== this._menuPosition.left ||
        next.top !== this._menuPosition.top ||
        next.maxHeight !== this._menuPosition.maxHeight
      ) {
        this._menuPosition = next;
      }
    });
  }

  private _resolvePopoverPosition(
    anchor: DOMRect,
    popover: DOMRect
  ): PopoverPosition {
    const width = Math.min(popover.width, innerWidth - POPOVER_MARGIN * 2);
    const left = Math.max(
      POPOVER_MARGIN,
      Math.min(anchor.left, innerWidth - width - POPOVER_MARGIN)
    );
    const below = innerHeight - anchor.bottom - POPOVER_MARGIN;
    const above = anchor.top - POPOVER_MARGIN;
    const placeAbove =
      below < POPOVER_MIN_SPACE && above > below && above >= POPOVER_MIN_SPACE;
    const maxHeight = Math.max(
      0,
      placeAbove ? above - POPOVER_GAP : below - POPOVER_GAP
    );
    const top = placeAbove
      ? Math.max(
          POPOVER_MARGIN,
          anchor.top - Math.min(popover.height, maxHeight) - POPOVER_GAP
        )
      : anchor.bottom + POPOVER_GAP;
    return {left, top, maxHeight};
  }

  private _flyoutElements(): HTMLElement[] {
    return Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>(
        '.ribbon-flyout-popover'
      ) ?? []
    );
  }

  private _focusableIn(container: HTMLElement | undefined): HTMLElement[] {
    return Array.from(
      container?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), iframe'
      ) ?? []
    ).filter((element) => element.getClientRects().length > 0);
  }

  private _menuFocusable(): HTMLElement[] {
    return this._focusableIn(this._menuEl);
  }

  private _focusMenu(position: 'first' | 'last' | 'index', index = 0): void {
    cancelAnimationFrame(this._menuFocusFrame ?? 0);
    this._menuFocusFrame = requestAnimationFrame(() => {
      this._menuFocusFrame = undefined;
      const options = this._menuFocusable();
      const target =
        position === 'first'
          ? options[0]
          : position === 'last'
            ? options[options.length - 1]
            : options[index];
      target?.focus();
    });
  }

  private _focusFlyout(position: 'first' | 'last' = 'first'): void {
    cancelAnimationFrame(this._menuFocusFrame ?? 0);
    this._menuFocusFrame = requestAnimationFrame(() => {
      this._menuFocusFrame = undefined;
      const elements = this._flyoutElements();
      const options = this._focusableIn(elements[elements.length - 1]);
      const target =
        position === 'last' ? options[options.length - 1] : options[0];
      target?.focus();
    });
  }

  private _modelByKey(key: string): RibbonItemModel | undefined {
    const menus = [...this._menuStack, ...this._flyouts.map(({menu}) => menu)];
    for (const menu of menus) {
      const item = [...menu.items, ...menu.footer].find(
        (entry) => entry.key === key
      );
      if (item) {
        return item;
      }
    }
    return undefined;
  }

  private _activeMenuContainer(
    active: HTMLElement | null
  ): HTMLElement | undefined {
    const container = active?.closest<HTMLElement>(
      '.ribbon-menu-popover, .ribbon-flyout-popover'
    );
    return container ?? this._menuEl;
  }

  private _isInsideMenu(target: Node | null): boolean {
    if (!target) {
      return false;
    }
    if (
      this._menuEl?.contains(target) ||
      this._openMenu?.anchor.contains(target)
    ) {
      return true;
    }
    if (this._flyouts.some(({anchor}) => anchor.contains(target))) {
      return true;
    }
    return this._flyoutElements().some((element) => element.contains(target));
  }

  private _resolveFlyoutPosition(
    anchor: DOMRect,
    popover: DOMRect
  ): PopoverPosition {
    const width = popover.width;
    const height = popover.height;
    const rightLeft = anchor.right + POPOVER_GAP;
    const leftLeft = anchor.left - width - POPOVER_GAP;
    const fitsRight = rightLeft + width + POPOVER_MARGIN <= innerWidth;
    const fitsLeft = leftLeft >= POPOVER_MARGIN;
    const left = Math.max(
      POPOVER_MARGIN,
      Math.min(
        fitsRight || !fitsLeft ? rightLeft : leftLeft,
        innerWidth - width - POPOVER_MARGIN
      )
    );
    const top = Math.max(
      POPOVER_MARGIN,
      Math.min(
        anchor.top,
        innerHeight -
          Math.min(height, innerHeight - POPOVER_MARGIN * 2) -
          POPOVER_MARGIN
      )
    );
    const maxHeight = Math.max(0, innerHeight - top - POPOVER_MARGIN);
    return {left, top, maxHeight};
  }

  private _positionFlyouts(): void {
    const elements = this._flyoutElements();
    if (elements.length !== this._flyouts.length) {
      return;
    }
    this._flyouts = this._flyouts.map((flyout, index) => ({
      ...flyout,
      position: this._resolveFlyoutPosition(
        flyout.anchor.getBoundingClientRect(),
        elements[index].getBoundingClientRect()
      ),
    }));
    this.updateComplete.then(() => {
      const measured = this._flyoutElements();
      this._flyouts = this._flyouts.map((flyout, index) => {
        const element = measured[index];
        if (!element) {
          return flyout;
        }
        const position = this._resolveFlyoutPosition(
          flyout.anchor.getBoundingClientRect(),
          element.getBoundingClientRect()
        );
        const current = flyout.position;
        if (
          current &&
          current.left === position.left &&
          current.top === position.top &&
          current.maxHeight === position.maxHeight
        ) {
          return flyout;
        }
        return {...flyout, position};
      });
    });
  }

  private _closeFlyoutsFrom(index: number, restoreFocus = false): void {
    const removed = this._flyouts.slice(index);
    this._flyouts = this._flyouts.slice(0, index);
    if (restoreFocus && removed[0]) {
      removed[0].anchor.focus();
    }
  }

  private _closeFlyout(restoreFocus = false): void {
    this._closeFlyoutsFrom(this._flyouts.length - 1, restoreFocus);
  }

  private _pushMenu(item: RibbonItemModel): void {
    if (!item.menu) {
      return;
    }
    this._flyouts = [];
    this._menuStack = [...this._menuStack, item.menu];
    this.updateComplete.then(() => {
      this._positionMenu();
      this._focusMenu('first');
    });
  }

  private _openItemSubmenu(
    item: RibbonItemModel,
    anchor: HTMLElement,
    focus: 'first' | 'last' = 'first'
  ): void {
    if (!item.menu) {
      return;
    }
    if (item.submenuMode === 'flyout') {
      this._openFlyout(item, anchor, focus);
    } else {
      this._pushMenu(item);
    }
  }

  private _openFlyout(
    item: RibbonItemModel,
    anchor: HTMLElement,
    focus: 'first' | 'last' = 'first'
  ): void {
    if (!item.menu) {
      return;
    }
    const existing = this._flyouts.findIndex(
      (flyout) => flyout.item.key === item.key && flyout.anchor === anchor
    );
    if (existing >= 0) {
      this._closeFlyoutsFrom(existing);
      return;
    }
    const parentIndex = this._flyoutElements().findIndex((element) =>
      element.contains(anchor)
    );
    this._flyouts = [
      ...this._flyouts.slice(0, parentIndex + 1),
      {item, menu: item.menu, anchor, position: null},
    ];
    this.updateComplete.then(() => {
      this._positionFlyouts();
      this._focusFlyout(focus);
    });
  }

  private _popMenu(): void {
    if (this._menuStack.length <= 1) {
      return;
    }
    this._menuStack = this._menuStack.slice(0, -1);
    this.updateComplete.then(() => {
      this._positionMenu();
      this._focusMenu('first');
    });
  }

  private _onMenuKeyDown(event: KeyboardEvent): void {
    const active = this.shadowRoot?.activeElement as HTMLElement | null;
    const container = this._activeMenuContainer(active);
    const options = this._focusableIn(container);
    const inFlyout =
      active !== null &&
      this._flyoutElements().some((element) => element.contains(active));
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (this._flyouts.length > 0) {
        this._closeFlyout(true);
      } else if (this._menuStack.length > 1) {
        this._popMenu();
      } else {
        this._closeMenu(true);
      }
      return;
    }
    if (event.key === 'ArrowLeft') {
      if (inFlyout) {
        event.preventDefault();
        this._closeFlyout(true);
      } else if (this._menuStack.length > 1) {
        event.preventDefault();
        this._popMenu();
      }
      return;
    }
    if (event.key === 'ArrowRight') {
      const key = active?.getAttribute('data-item-key') ?? '';
      const item = this._modelByKey(key);
      if (item?.menu && active) {
        event.preventDefault();
        this._openItemSubmenu(item, active, 'first');
      }
      return;
    }
    if (options.length === 0) {
      return;
    }
    const currentIndex = options.indexOf(active as HTMLElement);
    let target = currentIndex;
    if (event.key === 'ArrowDown') {
      target = (currentIndex + 1) % options.length;
    } else if (event.key === 'ArrowUp') {
      target = (currentIndex - 1 + options.length) % options.length;
    } else if (event.key === 'Home') {
      target = 0;
    } else if (event.key === 'End') {
      target = options.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    options[target]?.focus();
  }

  private _onMenuFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget;
    if (!(related instanceof Node)) {
      return;
    }
    if (this._isInsideMenu(related)) {
      return;
    }
    this._closeMenu(false);
  }

  private _toggleGroup(
    group: RibbonGroupModel,
    anchor: HTMLElement,
    focus: 'first' | 'last' = 'first'
  ): void {
    if (this._isGroupOpen(group)) {
      this._closeGroup(true);
      return;
    }
    this._openGroupMenu(group, anchor, focus);
  }

  private _onGroupTriggerKeyDown(
    event: KeyboardEvent,
    group: RibbonGroupModel,
    anchor: HTMLElement
  ): void {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
    ) {
      return;
    }
    event.preventDefault();
    const focus = event.key === 'ArrowUp' ? 'last' : 'first';
    if (this._isGroupOpen(group)) {
      this._focusGroup(focus);
      return;
    }
    this._openGroupMenu(group, anchor, focus);
  }

  private _openGroupMenu(
    group: RibbonGroupModel,
    anchor: HTMLElement,
    focus: 'first' | 'last' = 'first'
  ): void {
    this._closeMenu(false);
    this._openGroup = {group, anchor};
    this._groupPosition = null;
    this.updateComplete.then(() => {
      if (!this._openGroup) {
        return;
      }
      this._positionGroup();
      this._focusGroup(focus);
    });
  }

  private _closeGroup(restoreFocus: boolean): void {
    const state = this._openGroup;
    if (!state) {
      return;
    }
    this._openGroup = null;
    this._groupPosition = null;
    if (restoreFocus) {
      state.anchor.focus();
    }
  }

  private _positionGroup(): void {
    const anchor = this._openGroup?.anchor;
    const popover = this._groupEl;
    if (!anchor || !popover) {
      return;
    }
    this._groupPosition = this._resolvePopoverPosition(
      anchor.getBoundingClientRect(),
      popover.getBoundingClientRect()
    );
    this.updateComplete.then(() => {
      if (!this._openGroup || !this._groupEl) {
        return;
      }
      const measured = this._groupEl.getBoundingClientRect();
      const next = this._resolvePopoverPosition(
        anchor.getBoundingClientRect(),
        measured
      );
      if (
        !this._groupPosition ||
        next.left !== this._groupPosition.left ||
        next.top !== this._groupPosition.top ||
        next.maxHeight !== this._groupPosition.maxHeight
      ) {
        this._groupPosition = next;
      }
    });
  }

  private _focusGroup(position: 'first' | 'last' = 'first'): void {
    requestAnimationFrame(() => {
      const options = Array.from(
        this._groupEl?.querySelectorAll<HTMLElement>('button:not(:disabled)') ??
          []
      ).filter((element) => element.getClientRects().length > 0);
      const target =
        position === 'last' ? options[options.length - 1] : options[0];
      target?.focus();
    });
  }

  private _onGroupFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget;
    if (!(related instanceof Node)) {
      return;
    }
    if (
      this._groupEl?.contains(related) ||
      this._openGroup?.anchor.contains(related)
    ) {
      return;
    }
    this._closeGroup(false);
  }

  private _onDocumentPointerDown = (event: Event): void => {
    const path = event.composedPath();
    if (this._openMenu) {
      if (!this._isInsideMenu((path[0] as Node | undefined) ?? null)) {
        this._closeMenu(false);
      }
    }
    if (this._openGroup) {
      if (
        !path.includes(this._groupEl ?? this) &&
        !path.includes(this._openGroup.anchor)
      ) {
        this._closeGroup(false);
      }
    }
    if (this._overlayOpen && !path.includes(this)) {
      this._overlayOpen = false;
    }
  };

  private _onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }
    if (this._openMenu) {
      event.preventDefault();
      event.stopPropagation();
      if (this._flyouts.length > 0) {
        this._closeFlyout(true);
      } else if (this._menuStack.length > 1) {
        this._popMenu();
      } else {
        this._closeMenu(true);
      }
      return;
    }
    if (this._openGroup) {
      event.preventDefault();
      event.stopPropagation();
      this._closeGroup(true);
      return;
    }
    if (this._overlayOpen) {
      this._overlayOpen = false;
    }
  };

  private _onWindowResize = (): void => {
    this._closeMenu(false);
    this._closeGroup(false);
    this._scheduleLayout();
  };

  private _onWindowScroll = (event: Event): void => {
    const target = event.composedPath()[0];
    if (target instanceof Node && this._isInsideMenu(target)) {
      return;
    }
    this._closeMenu(false);
    this._closeGroup(false);
  };

  private _renderIcon(
    icon: ResolvedRibbonIcon,
    className = 'ribbon-icon',
    rotated = false
  ): TemplateResult {
    const resolved = resolveThemedIcon(icon, this._dark);
    if (resolved.type === 'image') {
      return html`<span
        class=${classMap({[className]: true, 'is-image': true, 'is-rotated': rotated})}
        .style=${stylePropertyMap({
          '--vsc-ribbon-icon-url': `url(${JSON.stringify(resolved.url)})`,
        })}
        aria-hidden="true"
      ></span>`;
    }
    return html`<span
      class=${classMap({[className]: true, codicon: true, [`codicon-${resolved.id}`]: true, 'is-rotated': rotated})}
      aria-hidden="true"
    ></span>`;
  }

  private _renderLabel(
    item: {title: string},
    options: {
      iconOnly?: boolean;
      chevron?: boolean;
      lines?: 1 | 2;
      centered?: boolean;
    } = {}
  ): TemplateResult {
    return html`<span
      class=${classMap({
        'ribbon-label': true,
        'has-chevron': options.chevron === true,
        'is-icon-only': options.iconOnly === true,
        'is-centered': options.centered === true,
        'one-line': options.lines === 1,
      })}
    >
      ${
        options.iconOnly
          ? nothing
          : html`<span class="ribbon-label-text">${item.title}</span>`
      }
      ${
        options.chevron
          ? html`<span
              class="codicon codicon-chevron-down ribbon-chevron"
              aria-hidden="true"
            ></span>`
          : nothing
      }
    </span>`;
  }

  private _buttonTitle(item: RibbonItemModel): string {
    return item.placeholder
      ? `${item.title}（${this.placeholderLabel}）`
      : item.tooltip;
  }

  private _renderMainItem(
    item: RibbonItemModel,
    context: 'ribbon' | 'group',
    original = false
  ): TemplateResult {
    const level = this._itemLevel(item, original);
    const layout = resolveRibbonItemLayout(level.size, level.style);
    const iconOnly = layout === 'icon-only';
    const verticalSplit = layout === 'vertical';
    const hasMenu = item.menu !== null;
    const isSplit = item.type === 'splitButton' && hasMenu;
    const isDropdown = hasMenu && !isSplit;
    const open = this._isMenuOpen(item);
    const hasPopup = item.menu?.layout === 'panel' ? 'dialog' : 'menu';
    const classes = {
      'ribbon-item': true,
      [`ribbon-item-${level.size}`]: true,
      [`ribbon-item-${layout}`]: true,
      'is-dropdown': isDropdown,
      'is-expanded': open,
      'is-placeholder': item.placeholder,
    };
    const title = this._buttonTitle(item);
    const anchorEvent = (event: Event) => event.currentTarget as HTMLElement;

    if (isSplit) {
      return html`<div
        class=${classMap({
          ...classes,
          'ribbon-split': true,
          [`ribbon-item-${level.size}`]: true,
          [`ribbon-item-${layout}`]: true,
        })}
        part="item"
        role="group"
        aria-label=${item.title}
      >
        <button
          type="button"
          class="ribbon-item-primary"
          part="item-primary"
          title=${title}
          aria-label=${item.title}
          aria-pressed=${ifDefined(item.pressed)}
          ?disabled=${item.disabled}
          @click=${() => this._runPrimary(item, context)}
          @keydown=${(event: KeyboardEvent) =>
            this._onTriggerKeyDown(
              event,
              item,
              event.currentTarget as HTMLElement
            )}
        >
          ${this._renderIcon(item.icon)}
          ${
            verticalSplit
              ? nothing
              : this._renderLabel(item, {
                  iconOnly,
                  lines: level.size === 'third' ? 1 : 2,
                })
          }
        </button>
        <button
          type="button"
          class="ribbon-split-trigger"
          part="item-trigger"
          title=${`${this.openMenuLabel}：${item.title}`}
          aria-label=${`${this.openMenuLabel}：${item.title}`}
          aria-haspopup=${hasPopup}
          aria-expanded=${open ? 'true' : 'false'}
          ?disabled=${item.disabled}
          @click=${(event: Event) => this._toggleMenu(item, anchorEvent(event))}
          @keydown=${(event: KeyboardEvent) =>
            this._onTriggerKeyDown(
              event,
              item,
              event.currentTarget as HTMLElement
            )}
        >
          ${
            verticalSplit
              ? this._renderLabel(item, {lines: 1, chevron: true})
              : html`<span
                  class="codicon codicon-chevron-down ribbon-chevron"
                  aria-hidden="true"
                ></span>`
          }
        </button>
      </div>`;
    }

    return html`<button
      type="button"
      class=${classMap(classes)}
      part="item"
      title=${title}
      aria-label=${item.title}
      aria-haspopup=${ifDefined(isDropdown ? hasPopup : undefined)}
      aria-expanded=${ifDefined(isDropdown ? (open ? 'true' : 'false') : undefined)}
      aria-pressed=${ifDefined(item.pressed)}
      ?disabled=${item.disabled}
      @click=${(event: Event) => {
        if (isDropdown) {
          this._toggleMenu(item, anchorEvent(event));
        } else {
          this._activateItem(item, anchorEvent(event), context);
        }
      }}
      @keydown=${(event: KeyboardEvent) => {
        if (isDropdown) {
          this._onTriggerKeyDown(
            event,
            item,
            event.currentTarget as HTMLElement
          );
        }
      }}
    >
      ${this._renderIcon(item.icon)}
      ${this._renderLabel(item, {
        iconOnly,
        chevron: isDropdown,
        lines: level.size === 'third' ? 1 : 2,
      })}
    </button>`;
  }

  private _renderMenuEntry(item: RibbonItemModel): TemplateResult {
    if (item.separator) {
      return html`<div
        class="ribbon-menu-separator"
        part="menu-separator"
        role="separator"
      ></div>`;
    }
    if (item.heading) {
      return html`<div
        class="ribbon-menu-heading"
        part="menu-heading"
        role="presentation"
      >
        ${item.title}
      </div>`;
    }
    const hasMenu = item.menu !== null;
    const isSplit = item.type === 'splitButton' && hasMenu && !!item.command;
    const title = this._buttonTitle(item);
    const anchorEvent = (event: Event) => event.currentTarget as HTMLElement;

    if (isSplit) {
      return html`<div class="ribbon-menu-split" part="menu-split" role="none">
        <button
          type="button"
          class="ribbon-menu-item"
          part="menu-item"
          role="menuitem"
          title=${title}
          aria-label=${item.title}
          data-item-key=${item.key}
          ?disabled=${item.disabled}
          @click=${() => {
            this._closeMenu(false);
            this._runPrimary(item, 'ribbon');
          }}
        >
          ${this._renderIcon(item.icon)} ${this._renderMenuText(item)}
        </button>
        <button
          type="button"
          class="ribbon-menu-item ribbon-menu-split-trigger"
          part="menu-item menu-split-trigger"
          role="menuitem"
          title=${`${this.openMenuLabel}：${item.title}`}
          aria-label=${`${this.openMenuLabel}：${item.title}`}
          aria-haspopup=${item.menu?.layout === 'panel' ? 'dialog' : 'menu'}
          data-item-key=${item.key}
          ?disabled=${item.disabled}
          @click=${(event: Event) =>
            this._openItemSubmenu(item, event.currentTarget as HTMLElement)}
        >
          <span
            class="codicon codicon-chevron-right ribbon-chevron"
            aria-hidden="true"
          ></span>
        </button>
      </div>`;
    }

    return html`<button
      type="button"
      class="ribbon-menu-item"
      part="menu-item"
      role="menuitem"
      title=${title}
      aria-label=${item.title}
      aria-haspopup=${ifDefined(hasMenu ? (item.menu?.layout === 'panel' ? 'dialog' : 'menu') : undefined)}
      data-item-key=${item.key}
      ?disabled=${item.disabled}
      @click=${(event: Event) => {
        if (hasMenu) {
          this._openItemSubmenu(item, event.currentTarget as HTMLElement);
        } else {
          this._activateItem(item, anchorEvent(event), 'menu');
        }
      }}
    >
      ${this._renderIcon(item.icon)} ${this._renderMenuText(item)}
      ${
        item.keybinding
          ? html`<span class="ribbon-menu-keybinding">${item.keybinding}</span>`
          : nothing
      }
      ${
        hasMenu
          ? html`<span
              class="codicon codicon-chevron-right ribbon-chevron"
              aria-hidden="true"
            ></span>`
          : nothing
      }
    </button>`;
  }

  private _renderMenuText(item: RibbonItemModel): TemplateResult {
    return html`<span class="ribbon-menu-text">
      ${this._renderLabel(item, {lines: 1})}
      ${
        item.description
          ? html`<span class="ribbon-menu-description" part="menu-description"
              >${item.description}</span
            >`
          : nothing
      }
    </span>`;
  }

  private _renderPanelEntry(item: RibbonItemModel): TemplateResult {
    if (item.heading) {
      return html`<div class="ribbon-panel-heading" part="panel-heading">
        ${item.title}
      </div>`;
    }
    const hasMenu = item.menu !== null;
    return html`<button
      type="button"
      class="ribbon-panel-item"
      part="panel-item"
      title=${this._buttonTitle(item)}
      aria-label=${item.title}
      aria-haspopup=${ifDefined(hasMenu ? (item.menu?.layout === 'panel' ? 'dialog' : 'menu') : undefined)}
      data-item-key=${item.key}
      ?disabled=${item.disabled}
      @click=${(event: Event) => {
        if (hasMenu) {
          this._openItemSubmenu(item, event.currentTarget as HTMLElement);
        } else {
          this._activateItem(item, event.currentTarget as HTMLElement, 'panel');
        }
      }}
    >
      ${this._renderIcon(item.icon)}
      ${this._renderLabel(item, {centered: true, lines: 2})}
      ${
        item.description
          ? html`<span class="ribbon-panel-description" part="panel-description"
              >${item.description}</span
            >`
          : nothing
      }
      ${
        hasMenu
          ? html`<span
              class="codicon codicon-chevron-down ribbon-chevron"
              aria-hidden="true"
            ></span>`
          : nothing
      }
    </button>`;
  }

  private _renderMenuFooter(
    menu: RibbonMenuModel
  ): TemplateResult | typeof nothing {
    if (menu.footer.length === 0) {
      return nothing;
    }
    return html`<div class="ribbon-panel-footer" part="panel-footer">
      ${menu.footer.map((item) => this._renderPanelFooterEntry(item))}
    </div>`;
  }

  private _renderPanelFooterEntry(item: RibbonItemModel): TemplateResult {
    if (item.separator) {
      return html`<div
        class="ribbon-menu-separator"
        part="menu-separator"
        role="separator"
      ></div>`;
    }
    if (item.heading) {
      return html`<div class="ribbon-menu-heading" part="menu-heading">
        ${item.title}
      </div>`;
    }
    const hasMenu = item.menu !== null;
    return html`<button
      type="button"
      class="ribbon-panel-footer-item"
      part="panel-footer-item"
      title=${this._buttonTitle(item)}
      aria-label=${item.title}
      aria-haspopup=${ifDefined(
        hasMenu
          ? item.menu?.layout === 'panel'
            ? 'dialog'
            : 'menu'
          : undefined
      )}
      data-item-key=${item.key}
      ?disabled=${item.disabled}
      @click=${(event: Event) => {
        if (hasMenu) {
          this._openItemSubmenu(item, event.currentTarget as HTMLElement);
        } else {
          this._activateItem(item, event.currentTarget as HTMLElement, 'panel');
        }
      }}
    >
      ${this._renderIcon(item.icon)} ${this._renderMenuText(item)}
      ${
        item.keybinding
          ? html`<span class="ribbon-menu-keybinding">${item.keybinding}</span>`
          : nothing
      }
      ${
        hasMenu
          ? html`<span
              class="codicon codicon-chevron-right ribbon-chevron"
              aria-hidden="true"
            ></span>`
          : nothing
      }
    </button>`;
  }

  private _renderFlyouts(): TemplateResult | typeof nothing {
    if (this._flyouts.length === 0) {
      return nothing;
    }
    return html`${this._flyouts.map(
      (flyout) =>
        html`<div
          class=${classMap({
            'ribbon-popover': true,
            'ribbon-menu-popover': true,
            'ribbon-flyout-popover': true,
            'is-panel': flyout.menu.layout === 'panel',
            'is-gallery': flyout.menu.layout === 'gallery',
          })}
          part="flyout"
          role=${flyout.menu.layout === 'panel' ? 'dialog' : 'menu'}
          aria-label=${flyout.menu.title ?? flyout.item.title}
          .style=${stylePropertyMap({
            left: `${flyout.position?.left ?? 0}px`,
            top: `${flyout.position?.top ?? 0}px`,
            maxHeight: `${flyout.position?.maxHeight ?? 0}px`,
            visibility: flyout.position ? 'visible' : 'hidden',
          })}
          @keydown=${this._onMenuKeyDown}
          @focusout=${this._onMenuFocusOut}
        >
          ${this._renderMenuContent(flyout.menu, flyout.item.title, () =>
            this._closeFlyoutsFrom(this._flyouts.indexOf(flyout), true)
          )}
        </div>`
    )}`;
  }

  private _renderMenu(): TemplateResult | typeof nothing {
    const menu = this._menuStack[this._menuStack.length - 1];
    const state = this._openMenu;
    if (!menu || !state) {
      return nothing;
    }
    const isPanel = menu.layout === 'panel';
    const isGallery = menu.layout === 'gallery';
    return html`<div
      class=${classMap({
        'ribbon-popover': true,
        'ribbon-menu-popover': true,
        'is-panel': isPanel,
        'is-gallery': isGallery,
      })}
      part="menu"
      role=${isPanel ? 'dialog' : 'menu'}
      aria-label=${isPanel ? (menu.title ?? state.item.title) : state.item.title}
      .style=${stylePropertyMap({
        left: `${this._menuPosition?.left ?? 0}px`,
        top: `${this._menuPosition?.top ?? 0}px`,
        maxHeight: `${this._menuPosition?.maxHeight ?? 0}px`,
        visibility: this._menuPosition ? 'visible' : 'hidden',
      })}
      @keydown=${this._onMenuKeyDown}
      @focusout=${this._onMenuFocusOut}
    >
      ${
        this._menuStack.length > 1
          ? html`<button
              type="button"
              class="ribbon-menu-back"
              part="menu-back"
              role=${ifDefined(isPanel ? undefined : 'menuitem')}
              aria-label=${this.backLabel}
              @click=${this._popMenu}
            >
              <span
                class="codicon codicon-arrow-left"
                aria-hidden="true"
              ></span>
              <span>${this.backLabel}</span>
            </button>`
          : nothing
      }
      ${this._renderMenuContent(menu, state.item.title, () => this._closeMenu(true))}
    </div>`;
  }

  private _renderMenuContent(
    menu: RibbonMenuModel,
    title: string,
    close: () => void
  ): TemplateResult {
    const isPanel = menu.layout === 'panel';
    const isGallery = menu.layout === 'gallery';
    return html` ${
      isPanel
        ? html`<div class="ribbon-panel-header" part="panel-header">
              <span class="ribbon-panel-title">${menu.title ?? title}</span>
              <button
                type="button"
                class="ribbon-panel-close"
                part="panel-close"
                title=${this.closePanelLabel}
                aria-label=${this.closePanelLabel}
                @click=${close}
              >
                <span class="codicon codicon-close" aria-hidden="true"></span>
              </button>
            </div>
            <div class="ribbon-panel-body" part="panel-body">
              ${
                menu.items.length > 0
                  ? html`<div
                      class="ribbon-panel-grid"
                      part="panel-grid"
                      .style=${stylePropertyMap({
                        '--vsc-ribbon-panel-columns': String(menu.columns),
                      })}
                    >
                      ${menu.items
                        .filter((item) => !item.separator)
                        .map((item) => this._renderPanelEntry(item))}
                    </div>`
                  : nothing
              }
              ${this._renderCustomContent(menu)}
            </div>`
        : isGallery
          ? html`<div
                class="ribbon-gallery"
                part="gallery"
                role="none"
                .style=${stylePropertyMap({
                  '--vsc-ribbon-gallery-columns': String(menu.columns),
                })}
              >
                ${menu.items
                  .filter((item) => !item.separator)
                  .map((item) => this._renderGalleryEntry(item))}
              </div>
              ${this._renderCustomContent(menu)}`
          : html`<div class="ribbon-menu-items" part="menu-items" role="none">
                ${menu.items.map((item) => this._renderMenuEntry(item))}
              </div>
              ${this._renderCustomContent(menu)}`
    }
    ${this._renderMenuFooter(menu)}`;
  }

  private _renderGalleryContent(item: RibbonItemModel): TemplateResult {
    const hasMenu = item.menu !== null;
    return html`<span class="ribbon-gallery-preview" part="gallery-preview">
        ${
          item.preview
            ? html`<img
                class="ribbon-gallery-image"
                src=${item.preview}
                alt=""
                loading="lazy"
              />`
            : this._renderIcon(item.icon, 'ribbon-gallery-icon')
        }
      </span>
      <span class="ribbon-gallery-label">${item.title}</span>
      ${
        item.description
          ? html`<span
              class="ribbon-gallery-description"
              part="gallery-description"
              >${item.description}</span
            >`
          : nothing
      }
      ${
        hasMenu
          ? html`<span
              class="codicon codicon-chevron-down ribbon-chevron"
              aria-hidden="true"
            ></span>`
          : nothing
      }`;
  }

  private _renderGalleryEntry(item: RibbonItemModel): TemplateResult {
    if (item.heading) {
      return html`<div class="ribbon-gallery-heading" part="gallery-heading">
        ${item.title}
      </div>`;
    }
    const hasMenu = item.menu !== null;
    return html`<button
      type="button"
      class="ribbon-gallery-item"
      part="gallery-item"
      role="menuitem"
      title=${this._buttonTitle(item)}
      aria-label=${item.title}
      aria-haspopup=${ifDefined(hasMenu ? (item.menu?.layout === 'panel' ? 'dialog' : 'menu') : undefined)}
      data-item-key=${item.key}
      ?disabled=${item.disabled}
      @click=${(event: Event) => {
        if (hasMenu) {
          this._openItemSubmenu(item, event.currentTarget as HTMLElement);
        } else {
          this._activateItem(item, event.currentTarget as HTMLElement, 'menu');
        }
      }}
    >
      ${this._renderGalleryContent(item)}
    </button>`;
  }

  private _renderGalleryTile(item: RibbonItemModel): TemplateResult {
    const hasMenu = item.menu !== null;
    return html`<button
      type="button"
      class="ribbon-gallery-tile"
      part="gallery-tile"
      title=${this._buttonTitle(item)}
      aria-label=${item.title}
      aria-haspopup=${ifDefined(hasMenu ? (item.menu?.layout === 'panel' ? 'dialog' : 'menu') : undefined)}
      ?disabled=${item.disabled}
      @click=${(event: Event) => {
        this._activateItem(item, event.currentTarget as HTMLElement, 'ribbon');
      }}
    >
      ${this._renderGalleryContent(item)}
    </button>`;
  }

  private _renderGroupGalleryStrip(group: RibbonGroupModel): TemplateResult {
    return html`<div class="ribbon-gallery-strip" part="gallery-strip">
      <button
        type="button"
        class="ribbon-gallery-scroll"
        part="gallery-scroll"
        title=${this.scrollLeftLabel}
        aria-label=${this.scrollLeftLabel}
        @click=${() => this._scrollGroupGallery(group, -1)}
      >
        <span class="codicon codicon-chevron-left" aria-hidden="true"></span>
      </button>
      <div class="ribbon-gallery-viewport" part="gallery-viewport">
        <div class="ribbon-gallery-track" part="gallery-track">
          ${group.items.map((item) => this._renderGalleryTile(item))}
        </div>
      </div>
      <button
        type="button"
        class="ribbon-gallery-scroll"
        part="gallery-scroll"
        title=${this.scrollRightLabel}
        aria-label=${this.scrollRightLabel}
        @click=${() => this._scrollGroupGallery(group, 1)}
      >
        <span class="codicon codicon-chevron-right" aria-hidden="true"></span>
      </button>
    </div>`;
  }

  private _scrollGroupGallery(
    group: RibbonGroupModel,
    direction: -1 | 1
  ): void {
    const viewport = this.shadowRoot?.querySelector<HTMLElement>(
      `.ribbon-group[data-group="${group.id}"] .ribbon-gallery-viewport`
    );
    if (!viewport) {
      return;
    }
    viewport.scrollLeft +=
      direction * Math.max(120, viewport.clientWidth * 0.8);
  }

  private _renderCustomContent(
    menu: RibbonMenuModel
  ): TemplateResult | typeof nothing {
    if (!menu.custom) {
      return nothing;
    }
    return html`<iframe
      class="ribbon-custom-content"
      part="custom-content"
      sandbox=""
      title=${this.customContentLabel}
      .srcdoc=${buildRibbonCustomContentSource(menu.custom)}
      .style=${stylePropertyMap({
        width: `${menu.custom.width}px`,
        height: `${menu.custom.height}px`,
      })}
    ></iframe>`;
  }

  private _renderGroupPopover(): TemplateResult | typeof nothing {
    const state = this._openGroup;
    if (!state) {
      return nothing;
    }
    const {group} = state;
    return html`<div
      class=${classMap({
        'ribbon-popover': true,
        'ribbon-group-popover': true,
        'has-dialog': group.dialogLauncher !== null,
      })}
      part="group-popover"
      role="dialog"
      aria-label=${group.title}
      .style=${stylePropertyMap({
        left: `${this._groupPosition?.left ?? 0}px`,
        top: `${this._groupPosition?.top ?? 0}px`,
        maxHeight: `${this._groupPosition?.maxHeight ?? 0}px`,
        visibility: this._groupPosition ? 'visible' : 'hidden',
      })}
      @focusout=${this._onGroupFocusOut}
    >
      ${
        group.layout === 'gallery'
          ? html`<div
              class="ribbon-gallery ribbon-gallery-popover"
              part="gallery"
              .style=${stylePropertyMap({
                '--vsc-ribbon-gallery-columns': '4',
              })}
            >
              ${group.items.map((item) =>
                item.heading
                  ? html`<div
                      class="ribbon-gallery-heading"
                      part="gallery-heading"
                    >
                      ${item.title}
                    </div>`
                  : this._renderGalleryTile(item)
              )}
            </div>`
          : html`<div class="ribbon-items" part="items">
              ${group.items.map((item) =>
                this._renderMainItem(item, 'group', true)
              )}
            </div>`
      }
      ${this._renderDialogLauncher(group, true)}
    </div>`;
  }

  private _renderGroupTrigger(
    group: RibbonGroupModel,
    open: boolean,
    icon: ResolvedRibbonIcon
  ): TemplateResult {
    return html`<button
      type="button"
      class="ribbon-group-dropdown"
      part="group-button"
      title=${`${this.openGroupLabel}：${group.title}`}
      aria-label=${`${this.openGroupLabel}：${group.title}`}
      aria-haspopup="dialog"
      aria-expanded=${open ? 'true' : 'false'}
      @click=${(event: Event) =>
        this._toggleGroup(group, event.currentTarget as HTMLElement)}
      @keydown=${(event: KeyboardEvent) =>
        this._onGroupTriggerKeyDown(
          event,
          group,
          event.currentTarget as HTMLElement
        )}
    >
      ${this._renderIcon(icon, 'ribbon-group-icon')}
      ${this._renderLabel(
        {title: group.title},
        {chevron: true, centered: true}
      )}
    </button>`;
  }

  private _renderGroup(group: RibbonGroupModel): TemplateResult {
    const folded = this._foldedGroups.has(group.key);
    const open = this._isGroupOpen(group);
    const icon = this._groupIcon(group);
    if (group.layout === 'gallery') {
      return html`<div
        class=${classMap({
          'ribbon-group': true,
          folded,
          'ribbon-group-gallery': true,
        })}
        part="group"
        role="group"
        aria-label=${group.title}
        data-group=${group.id}
      >
        ${this._renderGroupTrigger(group, open, icon)}
        ${this._renderGroupGalleryStrip(group)}
        <div class="ribbon-group-title" part="group-title">${group.title}</div>
        ${this._renderDialogLauncher(group)}
      </div>`;
    }
    return html`<div
      class=${classMap({'ribbon-group': true, folded})}
      part="group"
      role="group"
      aria-label=${group.title}
      data-group=${group.id}
    >
      ${this._renderGroupTrigger(group, open, icon)}
      <div class="ribbon-items" part="items">
        ${group.items.map((item) => this._renderMainItem(item, 'ribbon'))}
      </div>
      <div class="ribbon-group-title" part="group-title">${group.title}</div>
      ${this._renderDialogLauncher(group)}
    </div>`;
  }

  override render(): TemplateResult {
    const tab = this._activeTab;
    const activeIndex = this._models.findIndex((model) => model.id === tab?.id);
    const contentVisible = !this.collapsed || this._overlayOpen;
    return html`<header
      class=${classMap({
        ribbon: true,
        'is-collapsed': this.collapsed,
        'is-overlay-open': this._overlayOpen,
      })}
      part="base"
      aria-label=${this.tablistLabel}
    >
      <link
        rel="stylesheet"
        href=${ifDefined(this._codiconStylesheet.href)}
        nonce=${ifDefined(this._codiconStylesheet.nonce)}
      />
      <div class="ribbon-tabs" part="tabs">
        <slot name="tabs-start"></slot>
        <div
          class="ribbon-tabs-list"
          part="tabs-list"
          role="tablist"
          aria-label=${this.tablistLabel}
          @keydown=${this._onTabsKeyDown}
        >
          ${this._models.map(
            (model, index) =>
              html`<button
                type="button"
                role="tab"
                id=${`${this._instanceId}-tab-${index}`}
                class=${classMap({
                  'ribbon-tab': true,
                  'is-active': model.id === tab?.id,
                })}
                part="tab"
                data-tab-id=${model.id}
                aria-controls=${this._panelId}
                aria-selected=${model.id === tab?.id ? 'true' : 'false'}
                tabindex=${model.id === tab?.id ? 0 : -1}
                @click=${() => this._selectTab(model)}
                @dblclick=${this._onTabDoubleClick}
              >
                ${model.title}
              </button>`
          )}
        </div>
        <slot name="tabs-end"></slot>
        ${
          this.collapsible
            ? html`<button
                type="button"
                class="ribbon-collapse"
                part="collapse-button"
                title=${this.collapsed ? this.expandLabel : this.collapseLabel}
                aria-label=${this.collapsed ? this.expandLabel : this.collapseLabel}
                aria-expanded=${this.collapsed ? 'false' : 'true'}
                @click=${this._toggleCollapse}
              >
                <span
                  class=${classMap({
                    codicon: true,
                    'codicon-chevron-up': !this.collapsed,
                    'codicon-chevron-down': this.collapsed,
                  })}
                  aria-hidden="true"
                ></span>
              </button>`
            : nothing
        }
      </div>
      <div
        class=${classMap({
          'ribbon-content': true,
          'is-overlay': this.collapsed,
        })}
        part="content"
        id=${this._panelId}
        role="tabpanel"
        aria-label=${tab?.title ?? ''}
        aria-labelledby=${ifDefined(
          activeIndex >= 0
            ? `${this._instanceId}-tab-${activeIndex}`
            : undefined
        )}
        ?hidden=${!contentVisible}
      >
        <div
          class="ribbon-scroll-viewport"
          part="scroll-viewport"
          @scroll=${this._onViewportScroll}
        >
          <div class="ribbon-groups" part="groups">
            ${tab ? tab.groups.map((group) => this._renderGroup(group)) : nothing}
          </div>
        </div>
        ${
          this._showScrollLeft
            ? html`<button
                type="button"
                class="ribbon-scroll-button left"
                part="scroll-button"
                title=${this.scrollLeftLabel}
                aria-label=${this.scrollLeftLabel}
                @click=${() => this._scrollRibbon(-1)}
              >
                <span
                  class="codicon codicon-chevron-left"
                  aria-hidden="true"
                ></span>
              </button>`
            : nothing
        }
        ${
          this._showScrollRight
            ? html`<button
                type="button"
                class="ribbon-scroll-button right"
                part="scroll-button"
                title=${this.scrollRightLabel}
                aria-label=${this.scrollRightLabel}
                @click=${() => this._scrollRibbon(1)}
              >
                <span
                  class="codicon codicon-chevron-right"
                  aria-hidden="true"
                ></span>
              </button>`
            : nothing
        }
        ${this._renderMenu()} ${this._renderFlyouts()}
        ${this._renderGroupPopover()}
      </div>
    </header>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vscode-ribbon': VscodeRibbon;
  }

  interface GlobalEventHandlersEventMap {
    'vsc-ribbon-command': VscRibbonCommandEvent;
    'vsc-ribbon-select': VscRibbonSelectEvent;
    'vsc-ribbon-collapse': VscRibbonCollapseEvent;
    'vsc-ribbon-dialog': VscRibbonDialogEvent;
  }
}

export type {VscRibbonItem};
