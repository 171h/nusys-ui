import {expect, fixture, html} from '../includes/testing.js';
import {emulateMedia, sendKeys} from '../includes/browser-commands.js';
import './index.js';
import '../vscode-textfield/index.js';
import type {VscodeFieldset} from './index.js';
import type {VscodeCheckbox} from '../vscode-checkbox/index.js';

const checkboxOf = (el: VscodeFieldset) =>
  el.shadowRoot!.querySelector<VscodeCheckbox>('vscode-checkbox')!;

async function makeLegendFieldset() {
  return fixture<VscodeFieldset>(html`
    <vscode-fieldset legend-checkbox checked unchecked-mode="collapsed">
      <fieldset style="min-height: 0">
        <legend><span>高级设置</span><button>帮助</button></legend>
        <vscode-textfield name="value" value="保留参数" aria-label="参数">
        </vscode-textfield>
        <vscode-textfield disabled value="原本禁用" aria-label="固定参数">
        </vscode-textfield>
      </fieldset>
    </vscode-fieldset>
  `);
}

async function settle(el: VscodeFieldset) {
  await el.updateComplete;
  await checkboxOf(el)?.updateComplete;
  await Promise.all(
    el.getAnimations({subtree: true}).map((animation) => animation.finished)
  );
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
}

function toggle(el: VscodeFieldset) {
  checkboxOf(el).shadowRoot!.querySelector<HTMLElement>('label')!.click();
}

describe('legend 左侧可选复选框', () => {
  it('点击标题文字可取消和选中，复用显隐、参数保留与业务事件', async () => {
    const el = await makeLegendFieldset();
    await settle(el);
    const title = el.querySelector<HTMLElement>(
      'legend > span:not([aria-hidden])'
    )!;
    const changes: boolean[] = [];
    const callbacks: boolean[] = [];
    el.addEventListener('vsc-fieldset-checked-change', (event) => {
      changes.push(event.detail.checked);
    });
    el.checkedChange = (checked) => {
      callbacks.push(checked);
    };
    title.click();
    await settle(el);
    expect(el.checked).to.equal(false);
    expect(checkboxOf(el).checked).to.equal(false);
    expect(
      getComputedStyle(el.querySelector('vscode-textfield')!).display
    ).to.equal('none');
    title.click();
    await settle(el);
    expect(el.checked).to.equal(true);
    expect(checkboxOf(el).checked).to.equal(true);
    expect(el.querySelector('vscode-textfield')!.disabled).to.equal(false);
    expect(el.querySelector('vscode-textfield')!.value).to.equal('保留参数');
    expect(changes).to.deep.equal([false, true]);
    expect(callbacks).to.deep.equal(changes);
    expect(el.shadowRoot!.activeElement).to.equal(checkboxOf(el));
  });

  it('点击标题内的按钮、链接或编辑区时保留独立操作', async () => {
    const el = await makeLegendFieldset();
    const legend = el.querySelector('legend')!;
    const button = legend.querySelector('button')!;
    const link = document.createElement('a');
    link.href = '#help';
    link.textContent = '查看帮助';
    link.addEventListener('click', (event) => event.preventDefault());
    const editor = document.createElement('span');
    editor.contentEditable = 'true';
    editor.textContent = '可编辑标题';
    legend.append(link, editor);
    await settle(el);
    let changes = 0;
    let actions = 0;
    el.addEventListener('vsc-fieldset-checked-change', () => changes++);
    button.addEventListener('click', () => actions++);
    button.click();
    link.click();
    editor.click();
    expect(actions).to.equal(1);
    expect(changes).to.equal(0);
    expect(el.checked).to.equal(true);
  });

  it('组件或原生分区初始禁用时点击标题不改变状态', async () => {
    const el = await makeLegendFieldset();
    el.disabled = true;
    await settle(el);
    el.querySelector<HTMLElement>('legend')!.click();
    expect(el.checked).to.equal(true);
    const nativeDisabled = await fixture<VscodeFieldset>(html`
      <vscode-fieldset legend-checkbox checked>
        <fieldset disabled>
          <legend>禁用标题</legend>
          <input />
        </fieldset>
      </vscode-fieldset>
    `);
    await settle(nativeDisabled);
    nativeDisabled.querySelector('legend')!.click();
    expect(nativeDisabled.checked).to.equal(true);
  });

  it('标题有可切换复选框时显示手型光标，禁用或未开启时保持默认', async () => {
    const el = await makeLegendFieldset();
    await settle(el);
    const legend = el.querySelector('legend')!;
    expect(getComputedStyle(legend).cursor).to.equal('pointer');
    legend.setAttribute('draggable', 'true');
    expect(getComputedStyle(legend).cursor).to.equal('grab');
    legend.removeAttribute('draggable');
    el.disabled = true;
    await settle(el);
    expect(getComputedStyle(legend).cursor).to.not.equal('pointer');
    el.disabled = false;
    el.legendCheckbox = false;
    await settle(el);
    expect(getComputedStyle(legend).cursor).to.not.equal('pointer');
    const nativeDisabled = await fixture<VscodeFieldset>(html`
      <vscode-fieldset legend-checkbox checked>
        <fieldset disabled>
          <legend>禁用标题</legend>
          <input />
        </fieldset>
      </vscode-fieldset>
    `);
    await settle(nativeDisabled);
    expect(
      getComputedStyle(nativeDisabled.querySelector('legend')!).cursor
    ).to.not.equal('pointer');
  });

  for (const checkbox of [false, true]) {
    it(`未开启 legend-checkbox 时点击标题不切换（checkbox=${checkbox}）`, async () => {
      const el = await fixture<VscodeFieldset>(html`
        <vscode-fieldset ?checkbox=${checkbox} checked>
          <fieldset>
            <legend>普通标题</legend>
            <input />
          </fieldset>
        </vscode-fieldset>
      `);
      await settle(el);
      el.querySelector('legend')!.click();
      expect(el.checked).to.equal(true);
      expect(el.querySelector('fieldset')!.disabled).to.equal(false);
    });
  }

  for (const cancel of ['event', 'callback'] as const) {
    it(`标题点击支持通过 ${cancel} 取消默认显隐行为`, async () => {
      const el = await makeLegendFieldset();
      if (cancel === 'event') {
        el.addEventListener('vsc-fieldset-checked-change', (event) => {
          event.preventDefault();
        });
      } else {
        el.checkedChange = () => false;
      }
      el.querySelector('legend')!.click();
      await settle(el);
      expect(el.checked).to.equal(false);
      expect(el.querySelector('fieldset')!.disabled).to.equal(false);
      expect(
        getComputedStyle(el.querySelector('vscode-textfield')!).display
      ).to.not.equal('none');
    });
  }

  it('标题自身取消 click 后不切换，替换标题后仍可响应点击', async () => {
    const el = await makeLegendFieldset();
    const title = el.querySelector<HTMLElement>(
      'legend > span:not([aria-hidden])'
    )!;
    title.addEventListener('click', (event) => event.preventDefault());
    title.click();
    expect(el.checked).to.equal(true);
    const replacement = document.createElement('legend');
    replacement.textContent = '替换后的标题';
    el.querySelector('legend')!.replaceWith(replacement);
    await settle(el);
    replacement.click();
    await settle(el);
    expect(el.checked).to.equal(false);
  });

  it('默认不渲染复选框，也不改变原有标题节点和内容状态', async () => {
    const el = await fixture<VscodeFieldset>(html`
      <vscode-fieldset>
        <fieldset>
          <legend><span>普通分区</span></legend>
          <input name="value" value="原有内容" />
        </fieldset>
      </vscode-fieldset>
    `);
    const legend = el.querySelector('legend')!;
    expect(el.legendCheckbox).to.equal(false);
    expect(checkboxOf(el)).to.equal(null);
    expect(legend.children.length).to.equal(1);
    expect(el.querySelector('fieldset')!.disabled).to.equal(false);
    expect(el.querySelector('input')!.matches(':disabled')).to.equal(false);
    expect(getComputedStyle(el.querySelector('input')!).display).to.not.equal(
      'none'
    );
  });

  for (const size of ['small', 'medium', 'large'] as const) {
    it(`${size} 尺寸下复选框位于现有 legend 文字左侧且不遮挡标题和操作`, async () => {
      const el = await makeLegendFieldset();
      el.size = size;
      await settle(el);
      const checkbox = checkboxOf(el).getBoundingClientRect();
      const legend = el.querySelector('legend')!.getBoundingClientRect();
      const title = el.querySelector('legend > span:not([aria-hidden])')!;
      const titleRect = title.getBoundingClientRect();
      expect(checkbox.left).to.be.at.least(legend.left);
      expect(checkbox.right).to.be.at.most(titleRect.left);
      expect(checkbox.top + checkbox.height / 2).to.be.closeTo(
        legend.top + legend.height / 2,
        1
      );
      expect(
        el.shadowRoot!.querySelectorAll('vscode-checkbox').length
      ).to.equal(1);
      expect(el.querySelector('legend')!.textContent).to.equal('高级设置帮助');
    });
  }

  for (const scale of [0.5, 2]) {
    it(`自定义标题样式及 ${scale} 倍缩放时仍位于标题左侧`, async () => {
      const el = await makeLegendFieldset();
      el.style.transform = `scale(${scale})`;
      el.style.transformOrigin = 'top left';
      el.querySelector('fieldset')!.style.margin = '16px 20px';
      el.querySelector('legend')!.style.cssText =
        'font-size: 19px; line-height: 30px; padding: 6px 14px';
      await settle(el);
      const checkbox = checkboxOf(el).getBoundingClientRect();
      const title = el
        .querySelector('legend > span:not([aria-hidden])')!
        .getBoundingClientRect();
      expect(checkbox.right).to.be.at.most(title.left);
      expect(title.left - checkbox.right).to.be.closeTo(4 * scale, 1);
    });
  }

  it('鼠标和键盘切换控制显隐、保留值并触发业务事件', async () => {
    const el = await makeLegendFieldset();
    const values: boolean[] = [];
    let callbacks = 0;
    el.addEventListener('vsc-fieldset-checked-change', (event) => {
      values.push(event.detail.checked);
    });
    el.checkedChange = () => {
      callbacks++;
    };
    toggle(el);
    await settle(el);
    const [field, disabledField] = el.querySelectorAll('vscode-textfield');
    expect(getComputedStyle(field).display).to.equal('none');
    expect(field.disabled).to.equal(true);
    expect(field.inert).to.equal(true);
    checkboxOf(el).focus();
    await sendKeys({press: 'Space'});
    await settle(el);
    expect(getComputedStyle(field).display).to.not.equal('none');
    expect(field.disabled).to.equal(false);
    expect(field.value).to.equal('保留参数');
    expect(disabledField.disabled).to.equal(true);
    expect(values).to.deep.equal([false, true]);
    expect(callbacks).to.equal(2);
  });

  it('可取消默认显隐行为以单独处理业务事件', async () => {
    const el = await makeLegendFieldset();
    el.addEventListener('vsc-fieldset-checked-change', (event) => {
      event.preventDefault();
    });
    toggle(el);
    await settle(el);
    expect(el.checked).to.equal(false);
    expect(el.querySelector('fieldset')!.disabled).to.equal(false);
    expect(
      getComputedStyle(el.querySelector('vscode-textfield')!).display
    ).to.not.equal('none');
  });

  it('动态关闭可选功能后恢复原有标题、内容及事件处理器', async () => {
    const el = await makeLegendFieldset();
    const legend = el.querySelector('legend')!;
    const title = legend.querySelector('span:not([aria-hidden])')!;
    const help = legend.querySelector('button')!;
    let clicks = 0;
    help.addEventListener('click', () => clicks++);
    toggle(el);
    await settle(el);
    el.legendCheckbox = false;
    await settle(el);
    expect(checkboxOf(el)).to.equal(null);
    expect(legend.firstElementChild).to.equal(title);
    expect(legend.children.length).to.equal(2);
    expect(legend.querySelector('button')).to.equal(help);
    help.click();
    expect(clicks).to.equal(1);
    expect(el.querySelector('fieldset')!.disabled).to.equal(false);
    expect(
      getComputedStyle(el.querySelector('vscode-textfield')!).display
    ).to.not.equal('none');
  });

  it('显式禁用整个分区时禁用标题复选框且保留勾选状态', async () => {
    const el = await makeLegendFieldset();
    el.disabled = true;
    await settle(el);
    expect(checkboxOf(el).disabled).to.equal(true);
    toggle(el);
    expect(el.checked).to.equal(true);
    el.disabled = false;
    await settle(el);
    expect(checkboxOf(el).disabled).to.equal(false);
  });

  it('保留原生 legend 的文本节点，动态更新标题时同步无障碍名称', async () => {
    const el = await fixture<VscodeFieldset>(html`
      <vscode-fieldset legend-checkbox checked>
        <fieldset>
          <legend>普通文本标题</legend>
          <input />
        </fieldset>
      </vscode-fieldset>
    `);
    await settle(el);
    const legend = el.querySelector('legend')!;
    const text = Array.from(legend.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE
    )!;
    const range = document.createRange();
    range.selectNodeContents(text);
    expect(checkboxOf(el).getBoundingClientRect().right).to.be.at.most(
      range.getBoundingClientRect().left
    );
    text.textContent = '更新后的标题';
    await settle(el);
    expect(checkboxOf(el).ariaLabel).to.equal('更新后的标题');
    el.legendCheckbox = false;
    await settle(el);
    expect(legend.firstChild).to.equal(text);
  });

  it('与原有 checkbox 同时设置时只显示左侧框，关闭后恢复右上角功能', async () => {
    const el = await makeLegendFieldset();
    el.checkbox = true;
    el.checkboxLabel = '启用分区';
    await settle(el);
    expect(el.shadowRoot!.querySelectorAll('vscode-checkbox').length).to.equal(
      1
    );
    expect(checkboxOf(el).label).to.equal('');
    el.legendCheckbox = false;
    await settle(el);
    expect(checkboxOf(el).label).to.equal('启用分区');
    const fieldset = el.querySelector('fieldset')!.getBoundingClientRect();
    const checkbox = checkboxOf(el).getBoundingClientRect();
    expect(fieldset.right - checkbox.right).to.be.closeTo(10, 1);
    expect(el.querySelector('legend > [aria-hidden]')).to.equal(null);
  });

  it('分区移动后重新绑定标题占位并保留标题节点与控件值', async () => {
    const el = await makeLegendFieldset();
    await settle(el);
    const legend = el.querySelector('legend')!;
    const title = legend.querySelector('span:not([aria-hidden])')!;
    const parent = el.parentElement!;
    el.remove();
    expect(legend.firstElementChild).to.equal(title);
    parent.append(el);
    await settle(el);
    expect(legend.querySelector('span:not([aria-hidden])')).to.equal(title);
    expect(checkboxOf(el).getBoundingClientRect().right).to.be.at.most(
      title.getBoundingClientRect().left
    );
    expect(el.querySelector('vscode-textfield')!.value).to.equal('保留参数');
  });

  it('minimal 模式仍保留可操作的左侧复选框并可展开', async () => {
    const el = await makeLegendFieldset();
    el.uncheckedMode = 'minimal';
    await settle(el);
    toggle(el);
    await settle(el);
    expect(getComputedStyle(el.querySelector('fieldset')!).display).to.equal(
      'none'
    );
    const checkbox = checkboxOf(el).getBoundingClientRect();
    const host = el.getBoundingClientRect();
    expect(checkbox.left).to.be.closeTo(host.left + 12, 1);
    expect(checkbox.top).to.be.at.least(host.top);
    expect(checkbox.bottom).to.be.at.most(host.bottom);
    toggle(el);
    await settle(el);
    expect(
      getComputedStyle(el.querySelector('fieldset')!).display
    ).to.not.equal('none');
  });

  it('减少动态效果时直接显隐，标题复选框仍可访问', async () => {
    await emulateMedia({reducedMotion: 'reduce'});
    try {
      const el = await makeLegendFieldset();
      await settle(el);
      await expect(checkboxOf(el)).toBeAccessible();
      toggle(el);
      await settle(el);
      expect(el.getAnimations({subtree: true}).length).to.equal(0);
      expect(el.querySelector('fieldset')!.disabled).to.equal(true);
    } finally {
      await emulateMedia({reducedMotion: 'no-preference'});
    }
  });
});
