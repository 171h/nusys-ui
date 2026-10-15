import {fixture, html, expect} from '../testing.js';
import {sendMouse} from '../browser-commands.js';
import {moveMouseOnElement} from '../test-helpers.js';
import '../../vscode-single-select/index.js';
import '../../vscode-multi-select/index.js';

describe('下拉选择框共享样式', () => {
  for (const multiple of [false, true]) {
    for (const combobox of [false, true]) {
      it(`${multiple ? '多选' : '单选'}${combobox ? '组合框' : '选择框'}悬停时恢复图标不透明度`, async () => {
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
        expect(getComputedStyle(icon).opacity).to.eq('0.9');
        await moveMouseOnElement(el);
        expect(getComputedStyle(icon).opacity).to.eq('1');
        await sendMouse({type: 'move', position: [1000, 900]});
        expect(getComputedStyle(icon).opacity).to.eq('0.9');
      });
    }
  }
});
