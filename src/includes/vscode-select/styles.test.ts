import {fixture, html, expect} from '../testing.js';
import {emulateMedia, sendMouse} from '../browser-commands.js';
import {moveMouseOnElement} from '../test-helpers.js';
import '../../vscode-single-select/index.js';
import '../../vscode-multi-select/index.js';

describe('下拉选择框共享样式', () => {
  for (const multiple of [false, true]) {
    for (const combobox of [false, true]) {
      it(`${multiple ? '多选' : '单选'}${combobox ? '组合框' : '选择框'}仅悬停或获得焦点时显示图标`, async () => {
        const el = await fixture(
          multiple
            ? html`<vscode-multi-select .combobox=${combobox}>
                <vscode-option selected>选项</vscode-option>
              </vscode-multi-select>`
            : html`<vscode-single-select .combobox=${combobox}>
                <vscode-option selected>选项</vscode-option>
              </vscode-single-select>`
        );
        const icon = el.shadowRoot!.querySelector<HTMLElement>('.face .icon')!;

        await sendMouse({type: 'move', position: [1000, 900]});
        expect(getComputedStyle(icon).opacity).to.eq('0');
        await moveMouseOnElement(el);
        expect(getComputedStyle(icon).opacity).to.eq('1');
        await sendMouse({type: 'move', position: [1000, 900]});
        expect(getComputedStyle(icon).opacity).to.eq('0');

        const focusTarget = el.shadowRoot!.querySelector<HTMLElement>(
          combobox ? '.combobox-input' : '.select-face'
        )!;
        focusTarget.focus();
        expect(getComputedStyle(icon).opacity).to.eq('1');
        const content = el.shadowRoot!.querySelector<HTMLElement>(
          combobox ? '.combobox-input' : multiple ? '.face-values' : '.text'
        )!;
        // 等待实际过渡终点，避免 CI 调度延迟时读取动画中间值。
        await expect
          .poll(() =>
            combobox
              ? getComputedStyle(content).paddingRight
              : getComputedStyle(content).marginRight
          )
          .toBe(combobox ? '18px' : '14px');
        await moveMouseOnElement(el);
        await sendMouse({type: 'move', position: [1000, 900]});
        expect(getComputedStyle(icon).opacity).to.eq('1');

        if (combobox) {
          const button =
            el.shadowRoot!.querySelector<HTMLButtonElement>(
              '.combobox-button'
            )!;
          button.focus();
          expect(getComputedStyle(icon).opacity).to.eq('1');
          button.blur();
        } else {
          focusTarget.blur();
        }
        expect(getComputedStyle(icon).opacity).to.eq('0');
        await expect
          .poll(() =>
            combobox
              ? getComputedStyle(content).paddingRight
              : getComputedStyle(content).marginRight
          )
          .toBe(combobox ? '4px' : '0px');
      });
    }
  }

  for (const multiple of [false, true]) {
    for (const size of ['small', 'medium', 'large']) {
      it(`${multiple ? '多选' : '单选'} ${size} 尺寸的文字区域随悬停平滑收缩并恢复`, async () => {
        const el = await fixture(
          multiple
            ? html`<vscode-multi-select size=${size} style="width: 180px">
                <vscode-option selected
                  >很长的选项文字用于验证截断和可用空间</vscode-option
                >
              </vscode-multi-select>`
            : html`<vscode-single-select size=${size} style="width: 180px">
                <vscode-option selected
                  >很长的选项文字用于验证截断和可用空间</vscode-option
                >
              </vscode-single-select>`
        );
        const face = el.shadowRoot!.querySelector<HTMLElement>('.select-face')!;
        const text = el.shadowRoot!.querySelector<HTMLElement>(
          multiple ? '.face-values' : '.text'
        )!;
        const icon = el.shadowRoot!.querySelector<HTMLElement>('.face .icon')!;
        await sendMouse({type: 'move', position: [1000, 900]});
        await expect.poll(() => getComputedStyle(text).marginRight).toBe('0px');
        const fullWidth = text.getBoundingClientRect().width;
        const faceStyle = getComputedStyle(face);
        expect(fullWidth).to.be.closeTo(
          face.clientWidth -
            parseFloat(faceStyle.paddingLeft) -
            parseFloat(faceStyle.paddingRight),
          1
        );
        await moveMouseOnElement(el);
        const animation = text.getAnimations()[0];
        expect(animation).not.to.eq(undefined);
        animation.pause();
        animation.currentTime = 80;
        expect(text.getBoundingClientRect().width).to.be.lessThan(fullWidth);
        expect(text.getBoundingClientRect().width).to.be.greaterThan(
          fullWidth - 14
        );
        animation.finish();
        expect(text.getBoundingClientRect().width).to.be.closeTo(
          fullWidth - icon.getBoundingClientRect().width,
          1
        );
        await sendMouse({type: 'move', position: [1000, 900]});
        const leaving = text.getAnimations()[0];
        expect(leaving).not.to.eq(undefined);
        leaving.finish();
        expect(text.getBoundingClientRect().width).to.be.closeTo(fullWidth, 1);
      });
    }
  }

  for (const multiple of [false, true]) {
    it(`${multiple ? '多选' : '单选'}组合框悬停时为图标预留输入文字空间`, async () => {
      const el = await fixture(
        multiple
          ? html`<vscode-multi-select combobox></vscode-multi-select>`
          : html`<vscode-single-select combobox></vscode-single-select>`
      );
      const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
      await sendMouse({type: 'move', position: [1000, 900]});
      await expect.poll(() => getComputedStyle(input).paddingRight).toBe('4px');
      const padding = parseFloat(getComputedStyle(input).paddingRight);
      await moveMouseOnElement(el);
      await expect
        .poll(() => parseFloat(getComputedStyle(input).paddingRight))
        .toBe(padding + 14);
      await sendMouse({type: 'move', position: [1000, 900]});
      await expect
        .poll(() => parseFloat(getComputedStyle(input).paddingRight))
        .toBe(padding);
    });
  }

  it('减少动画模式下立即调整文字区域', async () => {
    await emulateMedia({reducedMotion: 'reduce'});
    try {
      const el = await fixture(
        html`<vscode-single-select></vscode-single-select>`
      );
      const text = el.shadowRoot!.querySelector<HTMLElement>('.text')!;
      await moveMouseOnElement(el);
      expect(text.getAnimations()).to.have.length(0);
      expect(getComputedStyle(text).marginRight).to.eq('14px');
    } finally {
      await emulateMedia({reducedMotion: 'no-preference'});
    }
  });
});
