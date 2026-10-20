import {css, CSSResultGroup} from 'lit';
import defaultStyles from '../includes/default.styles.js';

const styles: CSSResultGroup = [
  defaultStyles,
  css`
    :host {
      --vsc-ribbon-tabs-height: 32px;
      --vsc-ribbon-items-height: 74px;
      /* 占满按钮高度的图标统一为按钮高度的一半，并保持正方形。 */
      --vsc-ribbon-icon-size: calc(var(--vsc-ribbon-items-height) / 2);
      --vsc-ribbon-compact-icon-size: 22px;
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      color: var(--vscode-foreground, #cccccc);
      background: var(--vscode-editor-background, #1f1f1f);
      box-sizing: border-box;
      min-width: 0;
    }

    :host([hidden]) {
      display: none;
    }

    .ribbon {
      position: relative;
      display: flex;
      flex-direction: column;
      background: var(--vscode-editor-background, #1f1f1f);
      border-bottom: 1px solid var(--vscode-panel-border, #454545);
      box-sizing: border-box;
      min-width: 0;
      width: 100%;
    }

    .ribbon.is-collapsed {
      border-bottom-color: transparent;
    }

    /* =============================== 标签栏 =============================== */

    .ribbon-tabs {
      display: flex;
      align-items: stretch;
      flex: none;
      height: var(--vsc-ribbon-tabs-height);
      min-height: var(--vsc-ribbon-tabs-height);
      border-bottom: 1px solid var(--vscode-panel-border, #454545);
      box-sizing: border-box;
    }

    .ribbon.is-collapsed .ribbon-tabs {
      border-bottom-color: transparent;
    }

    .ribbon-tabs-list {
      display: flex;
      flex: 1 1 auto;
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .ribbon-tabs-list::-webkit-scrollbar {
      display: none;
    }

    ::slotted(*) {
      flex: none;
    }

    .ribbon-tab {
      position: relative;
      flex: none;
      padding: 0 12px;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }

    .ribbon-tab:hover,
    .ribbon-collapse:hover,
    .ribbon-scroll-button:hover {
      background: var(
        --vscode-toolbar-hoverBackground,
        rgba(127, 127, 127, 0.16)
      );
    }

    .ribbon-tab.is-active::after {
      position: absolute;
      right: 8px;
      bottom: 0;
      left: 8px;
      height: 2px;
      content: '';
      background: var(--vscode-focusBorder, #0078d4);
    }

    .ribbon-tab:focus-visible,
    .ribbon-collapse:focus-visible,
    .ribbon-scroll-button:focus-visible,
    .ribbon-group-dropdown:focus-visible,
    .ribbon-item:focus-visible,
    .ribbon-item-primary:focus-visible,
    .ribbon-split-trigger:focus-visible,
    .ribbon-menu-item:focus-visible,
    .ribbon-menu-back:focus-visible,
    .ribbon-gallery-item:focus-visible,
    .ribbon-gallery-tile:focus-visible,
    .ribbon-gallery-scroll:focus-visible,
    .ribbon-panel-close:focus-visible,
    .ribbon-panel-item:focus-visible,
    .ribbon-panel-footer-item:focus-visible,
    .ribbon-group-dialog:focus-visible {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }

    .ribbon-collapse {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 32px;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 14px;
      cursor: pointer;
    }

    /* =============================== 内容区 =============================== */

    .ribbon-content {
      position: relative;
      display: flex;
      flex: none;
      height: calc(var(--vsc-ribbon-items-height) + 24px);
      box-sizing: border-box;
      overflow: hidden;
      background: var(--vscode-editor-background, #1f1f1f);
      box-shadow: 0 4px 8px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.18));
    }

    .ribbon-content[hidden] {
      display: none;
    }

    /* 折叠后内容区覆盖在工作区上，点击外部或选择命令后关闭。 */
    .ribbon-content.is-overlay {
      position: absolute;
      top: var(--vsc-ribbon-tabs-height);
      right: 0;
      left: 0;
      z-index: 40;
    }

    .ribbon-scroll-viewport {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .ribbon-groups {
      display: flex;
      align-items: stretch;
      box-sizing: border-box;
      width: 100%;
      min-width: 100%;
      height: 100%;
      padding: 3px 6px 2px;
    }

    .ribbon-group {
      position: relative;
      display: flex;
      flex: none;
      flex-direction: column;
      padding: 0 6px;
      border-right: 1px solid var(--vscode-panel-border, #454545);
      box-sizing: border-box;
    }

    /* 分组右下角的对话框启动器，对应 Office 功能组的扩展按钮。 */
    .ribbon-group-dialog {
      position: absolute;
      right: 1px;
      bottom: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: 0;
      border-radius: 2px;
      background: transparent;
      color: var(--vscode-descriptionForeground, #9d9d9d);
      cursor: pointer;
    }

    .ribbon-group-dialog:hover {
      background: var(
        --vscode-toolbar-hoverBackground,
        rgba(127, 127, 127, 0.16)
      );
      color: var(--vscode-foreground, #cccccc);
    }

    .ribbon-group-dialog:focus-visible {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }

    .ribbon-group-dialog .ribbon-group-dialog-icon {
      width: 12px;
      height: 12px;
      font-size: 12px;
      line-height: 1;
    }

    .ribbon-group-dialog .ribbon-group-dialog-icon.is-rotated {
      transform: rotate(90deg);
    }

    /* 折叠后的组入口使用弹出面板中的启动器。 */
    .ribbon-group.folded
      .ribbon-group-dialog:not(.ribbon-group-popover-dialog) {
      display: none;
    }

    /* 六轨网格：full / half / third 三种行高可在同一分组内混排。 */
    .ribbon-items {
      display: grid;
      grid-template-rows: repeat(6, minmax(0, 1fr));
      grid-auto-flow: column;
      grid-auto-columns: max-content;
      gap: 2px;
      height: var(--vsc-ribbon-items-height);
    }

    .ribbon-group-title {
      height: 18px;
      font-size: 10px;
      line-height: 18px;
      text-align: center;
      color: var(--vscode-descriptionForeground, #9d9d9d);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 整组折叠入口：折叠后取代按钮区与分组标题。 */
    .ribbon-group-dropdown {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 2px;
      height: 100%;
      min-width: 68px;
      max-width: var(--vsc-ribbon-items-height);
      padding: 2px 8px;
      box-sizing: border-box;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: center;
      cursor: pointer;
    }

    .ribbon-group.folded .ribbon-items,
    .ribbon-group.folded .ribbon-group-title,
    .ribbon-group.folded .ribbon-gallery-strip {
      display: none;
    }

    .ribbon-group.folded .ribbon-group-dropdown {
      display: flex;
    }

    /* 图库布局的功能组：可伸缩的横向预览条，表头与组标题保持一致。 */
    .ribbon-group-gallery {
      flex: 1 1 0;
      min-width: 180px;
      overflow: hidden;
      padding: 0 2px;
    }

    .ribbon-group.folded.ribbon-group-gallery {
      flex: none;
    }

    .ribbon-gallery-strip {
      display: flex;
      align-items: stretch;
      gap: 2px;
      width: 100%;
      min-width: 0;
      height: var(--vsc-ribbon-items-height);
    }

    .ribbon-gallery-viewport {
      flex: 1 1 auto;
      min-width: 0;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
    }

    .ribbon-gallery-viewport::-webkit-scrollbar {
      display: none;
    }

    .ribbon-gallery-track {
      display: flex;
      gap: 2px;
      width: max-content;
      height: 100%;
    }

    .ribbon-gallery-tile {
      display: flex;
      flex: none;
      flex-direction: column;
      gap: 2px;
      width: 96px;
      padding: 2px;
      border: 1px solid transparent;
      border-radius: 3px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 10px;
      text-align: center;
      cursor: pointer;
    }

    .ribbon-gallery-tile .ribbon-gallery-preview {
      height: 48px;
    }

    .ribbon-gallery-tile .ribbon-gallery-label {
      font-size: 10px;
      line-height: 13px;
    }

    .ribbon-gallery-tile:hover:not(:disabled),
    .ribbon-gallery-tile:focus-visible {
      border-color: var(--vscode-focusBorder, #0078d4);
      background: var(
        --vscode-toolbar-hoverBackground,
        rgba(127, 127, 127, 0.16)
      );
      outline: none;
    }

    .ribbon-gallery-tile:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .ribbon-gallery-scroll {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 18px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--vscode-descriptionForeground, #9d9d9d);
      font-size: 14px;
      cursor: pointer;
    }

    .ribbon-gallery-scroll:hover {
      background: var(
        --vscode-toolbar-hoverBackground,
        rgba(127, 127, 127, 0.16)
      );
      color: var(--vscode-foreground, #cccccc);
    }

    .ribbon-group .ribbon-group-icon {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: var(--vsc-ribbon-icon-size);
      height: var(--vsc-ribbon-icon-size);
      font-size: var(--vsc-ribbon-icon-size);
      line-height: 1;
      color: var(--vscode-icon-foreground, var(--vscode-foreground, #cccccc));
    }

    /* =============================== 按钮 =============================== */

    .ribbon-item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 30px;
      max-width: var(--vsc-ribbon-items-height);
      padding: 2px 6px;
      border: 0;
      border-radius: 2px;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: center;
      cursor: pointer;
      box-sizing: border-box;
    }

    .ribbon-item-full {
      grid-row: span 6;
    }

    .ribbon-item-half {
      grid-row: span 3;
    }

    .ribbon-item-third {
      grid-row: span 2;
    }

    .ribbon-item-vertical {
      flex-direction: column;
      justify-content: flex-start;
      min-width: 64px;
      max-width: var(--vsc-ribbon-items-height);
      padding-right: 2px;
      padding-left: 2px;
    }

    .ribbon-item-horizontal {
      flex-direction: row;
      justify-content: flex-start;
      gap: 5px;
      text-align: left;
    }

    .ribbon-item-icon-only {
      padding-right: 4px;
      padding-left: 4px;
    }

    .ribbon-item:hover:not(:disabled):not(.ribbon-split) {
      background: var(
        --vscode-toolbar-hoverBackground,
        rgba(127, 127, 127, 0.16)
      );
    }

    .ribbon-item[aria-pressed='true'],
    .ribbon-item.is-expanded {
      background: var(
        --vscode-toolbar-activeBackground,
        var(--vscode-toolbar-hoverBackground, rgba(127, 127, 127, 0.16))
      );
      box-shadow: inset 0 0 0 1px
        var(--vscode-contrastActiveBorder, transparent);
    }

    .ribbon-item:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .ribbon-item.is-placeholder {
      font-style: italic;
    }

    .ribbon-item.is-placeholder .ribbon-label-text::after {
      content: '';
    }

    /* 分割按钮：主命令与展开菜单是两个独立点击区域。 */
    .ribbon-split {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      min-width: 0;
      max-width: var(--vsc-ribbon-items-height);
      border-radius: 2px;
      overflow: hidden;
      box-sizing: border-box;
    }

    .ribbon-item-primary,
    .ribbon-split-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    .ribbon-item-primary {
      flex: 1 1 auto;
      flex-direction: column;
      justify-content: flex-start;
      min-height: 0;
      padding: 2px 2px 0;
    }

    .ribbon-split-trigger {
      flex: none;
      min-height: 18px;
      gap: 3px;
      border-top: 1px solid transparent;
      font-size: 11px;
    }

    .ribbon-item-primary:hover:not(:disabled),
    .ribbon-split-trigger:hover:not(:disabled) {
      background: var(
        --vscode-toolbar-hoverBackground,
        rgba(127, 127, 127, 0.16)
      );
    }

    .ribbon-item-primary:disabled,
    .ribbon-split-trigger:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .ribbon-split.ribbon-item-half,
    .ribbon-split.ribbon-item-third {
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 4px;
      min-width: 30px;
    }

    .ribbon-split.ribbon-item-half .ribbon-item-primary,
    .ribbon-split.ribbon-item-third .ribbon-item-primary {
      flex: 1 1 auto;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
      padding: 2px 4px;
    }

    .ribbon-split.ribbon-item-half .ribbon-split-trigger,
    .ribbon-split.ribbon-item-third .ribbon-split-trigger {
      width: auto;
      height: 100%;
      min-height: 0;
      padding: 0 2px;
      border-top: 0;
      border-left: 1px solid transparent;
    }

    /*
     * Office 风格垂直分割按钮：图标、标题与下拉箭头分别与相邻整高
     * 下拉按钮的对应行水平对齐；上半部分只放图标，下半部分是
     * “标题 + 下拉箭头”按钮。
     */
    .ribbon-split.ribbon-item-vertical {
      width: max-content;
      min-width: 0;
      padding: 0;
    }

    .ribbon-split.ribbon-item-vertical .ribbon-item-primary {
      flex: 0 0 calc(var(--vsc-ribbon-items-height) / 2 + 2px);
      box-sizing: border-box;
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
      min-height: 0;
      padding: 2px 2px 0;
    }

    .ribbon-split.ribbon-item-vertical .ribbon-split-trigger {
      flex: 1 1 auto;
      box-sizing: border-box;
      align-items: flex-start;
      justify-content: center;
      min-height: 0;
      padding: 0 3px;
      border-top: 0;
      box-shadow: inset 0 1px 0 transparent;
    }

    .ribbon-split.ribbon-item-vertical
      .ribbon-split-trigger
      .ribbon-label.has-chevron {
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      gap: 1px;
    }

    .ribbon-split.ribbon-item-vertical
      .ribbon-split-trigger
      .ribbon-label-text {
      -webkit-line-clamp: 1;
      overflow-wrap: normal;
      white-space: nowrap;
    }

    /* 悬停任一区域时，组合按钮外边框与分格线一起高亮。 */
    .ribbon-split:has(.ribbon-item-primary:hover:not(:disabled)),
    .ribbon-split:has(.ribbon-split-trigger:hover:not(:disabled)) {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }

    .ribbon-split:has(.ribbon-item-primary:hover:not(:disabled))
      .ribbon-split-trigger,
    .ribbon-split:has(.ribbon-split-trigger:hover:not(:disabled))
      .ribbon-split-trigger {
      border-top-color: var(--vscode-focusBorder, #0078d4);
    }

    .ribbon-split.ribbon-item-half:has(
        .ribbon-item-primary:hover:not(:disabled)
      )
      .ribbon-split-trigger,
    .ribbon-split.ribbon-item-third:has(
        .ribbon-item-primary:hover:not(:disabled)
      )
      .ribbon-split-trigger,
    .ribbon-split.ribbon-item-half:has(
        .ribbon-split-trigger:hover:not(:disabled)
      )
      .ribbon-split-trigger,
    .ribbon-split.ribbon-item-third:has(
        .ribbon-split-trigger:hover:not(:disabled)
      )
      .ribbon-split-trigger {
      border-top-color: transparent;
      border-left-color: var(--vscode-focusBorder, #0078d4);
    }

    .ribbon-split.ribbon-item-icon-only .ribbon-item-primary .ribbon-label {
      display: none;
    }

    /* 垂直分割按钮使用内阴影绘制分格线，避免边框占用标题与箭头的对齐高度。 */
    .ribbon-split.ribbon-item-vertical:has(
        .ribbon-item-primary:hover:not(:disabled)
      )
      .ribbon-split-trigger,
    .ribbon-split.ribbon-item-vertical:has(
        .ribbon-split-trigger:hover:not(:disabled)
      )
      .ribbon-split-trigger {
      box-shadow: inset 0 1px 0 var(--vscode-focusBorder, #0078d4);
    }

    /* 展开菜单时只有触发区保持激活背景，主命令区域不受影响。 */
    .ribbon-split.is-expanded {
      background: transparent;
      box-shadow: none;
    }

    .ribbon-split.is-expanded .ribbon-split-trigger {
      background: var(
        --vscode-toolbar-activeBackground,
        var(--vscode-toolbar-hoverBackground, rgba(127, 127, 127, 0.16))
      );
    }

    /* 下拉入口：图标在上、标题与箭头在下。 */
    .ribbon-item.is-dropdown.ribbon-item-vertical .ribbon-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
    }

    /* =============================== 图标与标题 =============================== */

    .ribbon-icon {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      font-size: 18px;
      line-height: 1;
      color: var(--vscode-icon-foreground, var(--vscode-foreground, #cccccc));
    }

    .ribbon-icon.is-image {
      background-color: currentColor;
      -webkit-mask-image: var(--vsc-ribbon-icon-url);
      mask-image: var(--vsc-ribbon-icon-url);
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-size: contain;
      mask-size: contain;
      mask-mode: alpha;
    }

    .ribbon-item-vertical .ribbon-icon {
      width: var(--vsc-ribbon-icon-size);
      height: var(--vsc-ribbon-icon-size);
      font-size: var(--vsc-ribbon-icon-size);
    }

    .ribbon-item-half .ribbon-icon {
      width: var(--vsc-ribbon-compact-icon-size);
      height: var(--vsc-ribbon-compact-icon-size);
      font-size: var(--vsc-ribbon-compact-icon-size);
    }

    .ribbon-item-third .ribbon-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }

    .ribbon-label {
      display: block;
      min-width: 0;
      max-width: 100%;
      font-size: 11px;
      line-height: 15px;
      text-align: inherit;
    }

    .ribbon-label-text {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .ribbon-label.one-line .ribbon-label-text {
      -webkit-line-clamp: 1;
    }

    .ribbon-label.has-chevron {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      width: 100%;
    }

    .ribbon-label.is-centered {
      text-align: center;
    }

    .ribbon-chevron {
      display: inline-block;
      flex: none;
      width: 16px;
      height: 16px;
      font-size: 12px;
      line-height: 12px;
    }

    .ribbon-label.has-chevron .ribbon-chevron {
      opacity: 0.85;
    }

    .ribbon-item-horizontal .ribbon-label.has-chevron,
    .ribbon-item-icon-only .ribbon-label.has-chevron {
      flex-direction: row;
      justify-content: space-between;
      gap: 2px;
    }

    .ribbon-item-icon-only .ribbon-label {
      width: auto;
    }

    .ribbon-item-icon-only .ribbon-label-text {
      display: none;
    }

    /* 纯图标按钮用标题提供无障碍名称，视觉上隐藏。 */
    .ribbon-item-icon-only .ribbon-label-text,
    .ribbon-item-icon-only .ribbon-label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .ribbon-item-icon-only .ribbon-label.has-chevron {
      position: static;
      width: auto;
      height: auto;
      overflow: visible;
      clip: auto;
    }

    /* =============================== 悬浮滚动按钮 =============================== */

    .ribbon-scroll-button {
      position: absolute;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 100%;
      padding: 0;
      border: 0;
      font-size: 18px;
      color: inherit;
      cursor: pointer;
      background: var(--vscode-editor-background, #1f1f1f);
      box-shadow: 0 0 8px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.24));
    }

    .ribbon-scroll-button.left {
      left: 0;
    }

    .ribbon-scroll-button.right {
      right: 0;
    }

    /* =============================== 弹层 =============================== */

    .ribbon-popover {
      position: fixed;
      z-index: 60;
      box-sizing: border-box;
      overflow: auto;
      border: 1px solid
        var(--vscode-menu-border, var(--vscode-panel-border, #454545));
      border-radius: 6px;
      background: var(--vscode-menu-background, #1f1f1f);
      color: var(--vscode-menu-foreground, var(--vscode-foreground, #cccccc));
      box-shadow: 0 6px 16px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.24));
    }

    .ribbon-menu-popover {
      min-width: 180px;
      max-width: min(1200px, calc(100vw - 16px));
    }

    .ribbon-menu-popover.is-gallery {
      min-width: 240px;
    }

    /* 图库式下拉面板：大尺寸预览格子。 */
    .ribbon-gallery {
      display: grid;
      grid-template-columns: repeat(
        var(--vsc-ribbon-gallery-columns, 4),
        minmax(84px, 1fr)
      );
      gap: 4px;
      padding: 6px;
    }

    .ribbon-gallery-heading {
      grid-column: 1 / -1;
      overflow: hidden;
      padding: 2px 4px 0;
      color: var(--vscode-descriptionForeground, #9d9d9d);
      font-size: 11px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ribbon-gallery-item {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 3px;
      min-width: 0;
      padding: 3px;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 11px;
      text-align: center;
      cursor: pointer;
    }

    .ribbon-gallery-item:hover:not(:disabled),
    .ribbon-gallery-item:focus-visible {
      border-color: var(--vscode-focusBorder, #0078d4);
      background: var(--vscode-list-hoverBackground, rgba(127, 127, 127, 0.16));
      outline: none;
    }

    .ribbon-gallery-item:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .ribbon-gallery-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 54px;
      overflow: hidden;
      border: 1px solid var(--vscode-panel-border, #454545);
      border-radius: 2px;
      background: var(--vscode-editor-background, #1f1f1f);
    }

    .ribbon-gallery-image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .ribbon-gallery .ribbon-gallery-icon,
    .ribbon-gallery-tile .ribbon-gallery-icon {
      width: 32px;
      height: 32px;
      color: var(--vscode-icon-foreground, #cccccc);
      font-size: 32px;
      line-height: 1;
    }

    .ribbon-gallery-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ribbon-gallery-description {
      overflow: hidden;
      color: var(--vscode-descriptionForeground, #9d9d9d);
      font-size: 10px;
      line-height: 13px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ribbon-gallery-item .ribbon-chevron {
      align-self: center;
      font-size: 12px;
    }

    .ribbon-menu-items {
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: 4px;
    }

    /* 菜单项文字左对齐；快捷键与子菜单箭头靠右。 */
    .ribbon-menu-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
      width: 100%;
      min-height: 30px;
      padding: 3px 8px;
      border: 0;
      border-radius: 3px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 12px;
      text-align: left;
      cursor: pointer;
      box-sizing: border-box;
    }

    .ribbon-menu-item .ribbon-icon {
      width: 22px;
      height: 22px;
      font-size: 22px;
    }

    .ribbon-menu-item .ribbon-label {
      flex: none;
      text-align: left;
    }

    .ribbon-menu-item .ribbon-label-text {
      -webkit-line-clamp: 1;
    }

    /* 菜单项主文案与补充说明纵向排列，快捷键与箭头保持靠右。 */
    .ribbon-menu-text {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-width: 0;
      gap: 1px;
    }

    .ribbon-menu-description {
      overflow: hidden;
      color: var(--vscode-descriptionForeground, #9d9d9d);
      font-size: 11px;
      line-height: 14px;
      text-overflow: ellipsis;
      white-space: pre-line;
    }

    .ribbon-menu-item:hover:not(:disabled) .ribbon-menu-description,
    .ribbon-menu-item:focus-visible .ribbon-menu-description {
      color: inherit;
    }

    /* 菜单内的分组标题，不可聚焦，仅用于分组菜单项。 */
    .ribbon-menu-heading {
      overflow: hidden;
      padding: 5px 8px 3px;
      color: var(--vscode-descriptionForeground, #9d9d9d);
      font-size: 11px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ribbon-menu-item:hover:not(:disabled),
    .ribbon-menu-item:focus-visible {
      background: var(
        --vscode-menu-selectionBackground,
        var(--vscode-list-activeSelectionBackground, #0078d4)
      );
      color: var(
        --vscode-menu-selectionForeground,
        var(--vscode-list-activeSelectionForeground, #ffffff)
      );
      outline: none;
    }

    .ribbon-menu-item:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .ribbon-menu-keybinding {
      flex: none;
      margin-left: auto;
      padding-left: 16px;
      font-size: 11px;
      opacity: 0.75;
      white-space: nowrap;
    }

    .ribbon-menu-item .ribbon-chevron {
      margin-left: auto;
      font-size: 14px;
    }

    .ribbon-menu-split {
      display: flex;
      align-items: stretch;
      gap: 1px;
    }

    .ribbon-menu-split .ribbon-menu-item:first-child {
      flex: 1 1 auto;
    }

    .ribbon-menu-split-trigger {
      width: 30px;
      min-width: 30px;
      justify-content: center;
      padding: 0;
    }

    .ribbon-menu-separator {
      height: 0;
      margin: 4px 4px;
      border-top: 1px solid
        var(
          --vscode-menu-separatorBackground,
          var(--vscode-panel-border, #454545)
        );
    }

    .ribbon-menu-back {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      min-height: 30px;
      padding: 4px 10px;
      border: 0;
      border-bottom: 1px solid
        var(
          --vscode-menu-separatorBackground,
          var(--vscode-panel-border, #454545)
        );
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 12px;
      text-align: left;
      cursor: pointer;
    }

    .ribbon-menu-back:hover {
      background: var(
        --vscode-menu-selectionBackground,
        var(--vscode-list-activeSelectionBackground, #0078d4)
      );
      color: var(
        --vscode-menu-selectionForeground,
        var(--vscode-list-activeSelectionForeground, #ffffff)
      );
    }

    /* =============================== 面板 =============================== */

    .ribbon-popover.is-panel {
      min-width: 220px;
      max-width: min(720px, calc(100vw - 16px));
      background: var(
        --vscode-editorHoverWidget-background,
        var(--vscode-editor-background, #1f1f1f)
      );
      color: var(
        --vscode-editorHoverWidget-foreground,
        var(--vscode-foreground, #cccccc)
      );
      border-color: var(
        --vscode-editorHoverWidget-border,
        var(--vscode-panel-border, #454545)
      );
    }

    .ribbon-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 30px;
      padding: 6px 10px;
      border-bottom: 1px solid
        var(
          --vscode-editorHoverWidget-border,
          var(--vscode-panel-border, #454545)
        );
    }

    .ribbon-panel-title {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      opacity: 0.9;
    }

    .ribbon-panel-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      border: 0;
      border-radius: 3px;
      background: transparent;
      color: inherit;
      font-size: 14px;
      cursor: pointer;
    }

    .ribbon-panel-close:hover {
      background: var(
        --vscode-toolbar-hoverBackground,
        rgba(127, 127, 127, 0.16)
      );
    }

    .ribbon-panel-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
    }

    .ribbon-panel-grid {
      display: grid;
      grid-template-columns: repeat(
        var(--vsc-ribbon-panel-columns, 3),
        minmax(0, 1fr)
      );
      gap: 2px;
    }

    /* 面板中的分组标题横跨整行。 */
    .ribbon-panel-heading {
      grid-column: 1 / -1;
      margin-top: 2px;
      padding: 4px 4px 2px;
      border-bottom: 1px solid var(--vscode-panel-border, #454545);
      color: var(--vscode-descriptionForeground, #9d9d9d);
      font-size: 11px;
      font-weight: 600;
    }

    .ribbon-panel-description {
      max-width: 100%;
      overflow-wrap: anywhere;
      color: var(--vscode-descriptionForeground, #9d9d9d);
      font-size: 10px;
      line-height: 13px;
      white-space: pre-line;
    }

    .ribbon-panel-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 4px;
      min-width: 0;
      min-height: 64px;
      padding: 6px 4px;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: center;
      cursor: pointer;
    }

    .ribbon-panel-item .ribbon-icon {
      width: 28px;
      height: 28px;
      font-size: 28px;
    }

    .ribbon-panel-item:hover:not(:disabled),
    .ribbon-panel-item:focus-visible {
      background: var(--vscode-list-hoverBackground, rgba(127, 127, 127, 0.16));
      border-color: var(--vscode-panel-border, #454545);
    }

    .ribbon-panel-item:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .ribbon-panel-item .ribbon-label {
      font-size: 11px;
      line-height: 14px;
    }

    /* 面板底部操作区：整行列表项，与面板内容以分隔线区分。 */
    .ribbon-panel-footer {
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: 4px;
      border-top: 1px solid var(--vscode-panel-border, #454545);
    }

    .ribbon-panel-footer-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-height: 30px;
      padding: 4px 8px;
      border: 0;
      border-radius: 3px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 12px;
      text-align: left;
      cursor: pointer;
    }

    .ribbon-panel-footer-item .ribbon-icon {
      width: 22px;
      height: 22px;
      font-size: 22px;
    }

    .ribbon-panel-footer-item:hover:not(:disabled),
    .ribbon-panel-footer-item:focus-visible {
      background: var(
        --vscode-menu-selectionBackground,
        var(--vscode-list-activeSelectionBackground, #0078d4)
      );
      color: var(
        --vscode-menu-selectionForeground,
        var(--vscode-list-activeSelectionForeground, #ffffff)
      );
      outline: none;
    }

    .ribbon-panel-footer-item:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .ribbon-panel-footer .ribbon-menu-heading {
      padding: 4px 8px 2px;
    }

    .ribbon-panel-footer .ribbon-menu-separator {
      margin: 2px 4px;
    }

    .ribbon-custom-content {
      display: block;
      max-width: 100%;
      border: 0;
      background: transparent;
    }

    /* =============================== 折叠分组弹层 =============================== */

    .ribbon-group-popover {
      max-width: calc(100vw - 16px);
      padding: 6px;
    }

    .ribbon-gallery-popover {
      padding: 4px;
    }

    /* 启动器与功能区中的原始位置一致，不额外引入分隔线。 */
    .ribbon-group-popover-dialog {
      right: 1px;
      bottom: 1px;
    }

    .ribbon-group-popover .ribbon-items {
      height: var(--vsc-ribbon-items-height);
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        scroll-behavior: auto;
      }
    }
  `,
];

export default styles;
