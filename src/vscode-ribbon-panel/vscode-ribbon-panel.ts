import {html, nothing, TemplateResult} from 'lit';
import {customElement, VscElement} from '../includes/VscElement.js';
import styles from '../vscode-ribbon/vscode-ribbon.styles.js';
import {css} from 'lit';

/**
 * Ribbon 的可选独立内容容器。通过 `ribbon.panel = panel` 关联；
 * 配置与事件均由 Ribbon 管理。面板断开后 Ribbon 暂时恢复一体布局，重连自动恢复。
 * 面板内沿用 Ribbon 内容区的 CSS parts，主题变量从面板所在容器继承。
 *
 * @csspart content - 功能面板的 content 部件。
 * @csspart custom-content - 功能面板的 custom-content 部件。
 * @csspart flyout - 功能面板的 flyout 部件。
 * @csspart gallery - 功能面板的 gallery 部件。
 * @csspart gallery-description - 功能面板的 gallery-description 部件。
 * @csspart gallery-heading - 功能面板的 gallery-heading 部件。
 * @csspart gallery-item - 功能面板的 gallery-item 部件。
 * @csspart gallery-preview - 功能面板的 gallery-preview 部件。
 * @csspart gallery-scroll - 功能面板的 gallery-scroll 部件。
 * @csspart gallery-strip - 功能面板的 gallery-strip 部件。
 * @csspart gallery-tile - 功能面板的 gallery-tile 部件。
 * @csspart gallery-track - 功能面板的 gallery-track 部件。
 * @csspart gallery-viewport - 功能面板的 gallery-viewport 部件。
 * @csspart group - 功能面板的 group 部件。
 * @csspart group-button - 功能面板的 group-button 部件。
 * @csspart group-dialog - 功能面板的 group-dialog 部件。
 * @csspart group-popover - 功能面板的 group-popover 部件。
 * @csspart group-title - 功能面板的 group-title 部件。
 * @csspart groups - 功能面板的 groups 部件。
 * @csspart item - 功能面板的 item 部件。
 * @csspart item-primary - 功能面板的 item-primary 部件。
 * @csspart item-trigger - 功能面板的 item-trigger 部件。
 * @csspart items - 功能面板的 items 部件。
 * @csspart menu - 功能面板的 menu 部件。
 * @csspart menu-back - 功能面板的 menu-back 部件。
 * @csspart menu-description - 功能面板的 menu-description 部件。
 * @csspart menu-heading - 功能面板的 menu-heading 部件。
 * @csspart menu-item - 功能面板的 menu-item 部件。
 * @csspart menu-items - 功能面板的 menu-items 部件。
 * @csspart menu-separator - 功能面板的 menu-separator 部件。
 * @csspart menu-split - 功能面板的 menu-split 部件。
 * @csspart panel-body - 功能面板的 panel-body 部件。
 * @csspart panel-close - 功能面板的 panel-close 部件。
 * @csspart panel-description - 功能面板的 panel-description 部件。
 * @csspart panel-footer - 功能面板的 panel-footer 部件。
 * @csspart panel-footer-item - 功能面板的 panel-footer-item 部件。
 * @csspart panel-grid - 功能面板的 panel-grid 部件。
 * @csspart panel-header - 功能面板的 panel-header 部件。
 * @csspart panel-heading - 功能面板的 panel-heading 部件。
 * @csspart panel-item - 功能面板的 panel-item 部件。
 * @csspart scroll-button - 功能面板的 scroll-button 部件。
 * @csspart scroll-viewport - 功能面板的 scroll-viewport 部件。
 *
 * @tag vscode-ribbon-panel
 */
@customElement('vscode-ribbon-panel')
export class VscodeRibbonPanel extends VscElement {
  static override styles = [
    styles,
    css`
      :host {
        position: relative;
      }
      .ribbon-content.is-overlay {
        top: 0;
      }
    `,
  ];

  private _owner: object | null = null;
  private _connectionChanged?: () => void;
  private _content: TemplateResult | typeof nothing = nothing;

  /** @internal 由关联 Ribbon 独占此面板。 */
  claim(owner: object, changed: () => void): void {
    if (this._owner && this._owner !== owner) {
      throw new Error('此面板已经关联另一个 Ribbon，请先解除关联。');
    }
    this._owner = owner;
    this._connectionChanged = changed;
  }

  /** @internal 释放关联并清空内容。 */
  release(owner: object): void {
    if (this._owner !== owner) {
      return;
    }
    this.present(nothing, owner);
    this._owner = null;
    this._connectionChanged = undefined;
  }

  /** @internal 使用原 Ribbon 的事件上下文渲染唯一的面板内容。 */
  present(content: TemplateResult | typeof nothing, owner: object): void {
    if (this._owner !== owner) {
      return;
    }
    this.renderOptions.host = owner;
    this._content = content;
    this.requestUpdate();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._connectionChanged?.();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._connectionChanged?.();
  }

  override render(): TemplateResult {
    return html`${this._content}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vscode-ribbon-panel': VscodeRibbonPanel;
  }
}
