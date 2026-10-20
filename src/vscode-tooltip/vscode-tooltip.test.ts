import {
  expect,
  fixture,
  html,
  aTimeout,
  waitUntil,
} from '../includes/testing.js';
import {VscodeTooltip, TooltipPlacement} from './index.js';
import '../vscode-textfield/index.js';
import '../vscode-radio-group/index.js';
import '../vscode-radio/index.js';
import {resetMouse, sendKeys, sendMouse} from '../includes/browser-commands.js';

const panel = (el: VscodeTooltip) =>
  el.shadowRoot!.querySelector<HTMLElement>('.tooltip')!;
const setup = (showOnFocus = true) =>
  fixture<VscodeTooltip>(html`
    <vscode-tooltip
      ?show-on-focus=${showOnFocus}
      text="搜索 (Ctrl+Shift+F)"
      delay="0"
      style="position:fixed;left:250px;top:150px"
    >
      <button aria-describedby="existing">搜索</button>
    </vscode-tooltip>
  `);

describe('vscode-tooltip', () => {
  afterEach(async () => resetMouse());

  for (const association of ['slot', 'for', 'target'] as const) {
    it(`${association} 默认 Tab 聚焦不显示，开启 show-on-focus 后聚焦立即显示并在失焦时关闭`, async () => {
      await sendMouse({type: 'move', position: [1200, 900]});
      const root = await fixture<HTMLDivElement>(html`
        <div>
          <button>前一个</button>
          <vscode-tooltip text="说明" delay="10000">
            <button id="focus-trigger">触发</button>
          </vscode-tooltip>
          <button>后一个</button>
        </div>
      `);
      const el = root.querySelector('vscode-tooltip')!;
      const target = root.querySelector<HTMLButtonElement>('#focus-trigger')!;
      const previous = root.querySelector('button')!;
      if (association !== 'slot') {
        root.insertBefore(target, el);
        if (association === 'for') {
          el.for = target.id;
        } else {
          el.target = target;
        }
        await el.updateComplete;
      }
      previous.focus();
      await sendKeys({press: 'Tab'});
      expect(document.activeElement).to.equal(target);
      expect(el.showOnFocus).to.equal(false);
      expect(panel(el).matches(':popover-open')).to.equal(false);
      expect(target.getAttribute('aria-describedby')).to.include(
        'vscode-tooltip-'
      );
      target.blur();
      el.setAttribute('show-on-focus', '');
      await el.updateComplete;
      previous.focus();
      await sendKeys({press: 'Tab'});
      await el.updateComplete;
      expect(panel(el).matches(':popover-open')).to.equal(true);
      target.blur();
      await el.updateComplete;
      expect(panel(el).matches(':popover-open')).to.equal(false);
    });
  }

  it('默认聚焦内部输入框仍保留跨 Shadow DOM 的无障碍描述', async () => {
    const el = await fixture<VscodeTooltip>(html`
      <vscode-tooltip text="字段说明">
        <vscode-textfield label="字段"></vscode-textfield>
      </vscode-tooltip>
    `);
    const field = el.querySelector('vscode-textfield')!;
    await field.updateComplete;
    const input = field.shadowRoot!.querySelector('input')!;
    input.focus();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    expect(input.ariaDescribedByElements).to.include(
      el.querySelector('[role="tooltip"]')
    );
    input.blur();
    expect(input.ariaDescribedByElements).not.to.include(
      el.querySelector('[role="tooltip"]')
    );
  });

  it('默认聚焦不取消悬停延迟，鼠标离开后即使仍聚焦也关闭', async () => {
    const el = await setup(false);
    el.delay = 80;
    await el.updateComplete;
    const target = el.querySelector('button')!;
    target.dispatchEvent(new MouseEvent('mouseenter'));
    target.focus();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    await waitUntil(() => panel(el).matches(':popover-open'));
    target.dispatchEvent(new MouseEvent('mouseleave'));
    await waitUntil(() => !panel(el).matches(':popover-open'));
    expect(document.activeElement).to.equal(target);
  });

  it('聚焦期间可动态开关，关闭不影响悬停、持续显示和固定提示', async () => {
    const el = await setup(false);
    const target = el.querySelector('button')!;
    target.focus();
    el.showOnFocus = true;
    await el.updateComplete;
    expect(el.hasAttribute('show-on-focus')).to.equal(true);
    expect(panel(el).matches(':popover-open')).to.equal(true);
    el.showOnFocus = false;
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    for (const mode of ['hover', 'open', 'pinned'] as const) {
      el.showOnFocus = true;
      await el.updateComplete;
      if (mode === 'hover') {
        target.dispatchEvent(new MouseEvent('mouseenter'));
      } else {
        el[mode] = true;
      }
      el.showOnFocus = false;
      await el.updateComplete;
      expect(panel(el).matches(':popover-open')).to.equal(true);
      if (mode === 'hover') {
        target.dispatchEvent(new MouseEvent('mouseleave'));
        await aTimeout(120);
      } else {
        el[mode] = false;
      }
      await el.updateComplete;
      expect(panel(el).matches(':popover-open')).to.equal(false);
    }
  });

  it('默认保留中文面板名称和固定按钮文案', async () => {
    const el = await setup();
    const pin = panel(el).querySelector('button')!;
    expect(panel(el).getAttribute('aria-label')).to.equal('提示');
    expect(pin.getAttribute('aria-label')).to.equal('固定提示');
    expect(pin.title).to.equal('固定提示');
    el.querySelector('button')!.focus();
    await el.updateComplete;
    pin.click();
    await el.updateComplete;
    expect(el.pinned).to.equal(true);
    expect(pin.getAttribute('aria-label')).to.equal('取消固定提示');
    expect(pin.title).to.equal('取消固定提示');
  });

  it('支持通过属性翻译文案，并在显示和固定期间动态切换语言', async () => {
    const el = await fixture<VscodeTooltip>(html`
      <vscode-tooltip
        show-on-focus
        text="说明内容"
        tooltip-label="Tooltip"
        pin-label="Pin tooltip"
        unpin-label="Unpin tooltip"
      >
        <button>查看说明</button>
      </vscode-tooltip>
    `);
    el.querySelector('button')!.focus();
    await el.updateComplete;
    const pin = panel(el).querySelector('button')!;
    expect(panel(el).getAttribute('aria-label')).to.equal('Tooltip');
    expect(pin.getAttribute('aria-label')).to.equal('Pin tooltip');
    expect(pin.title).to.equal('Pin tooltip');
    pin.click();
    await el.updateComplete;
    expect(pin.getAttribute('aria-label')).to.equal('Unpin tooltip');
    expect(pin.title).to.equal('Unpin tooltip');

    el.tooltipLabel = '提示';
    el.pinLabel = '固定提示';
    el.unpinLabel = '取消固定提示';
    await el.updateComplete;
    expect(panel(el).getAttribute('aria-label')).to.equal('提示');
    expect(pin.getAttribute('aria-label')).to.equal('取消固定提示');
    expect(pin.title).to.equal('取消固定提示');
    expect(pin.getAttribute('aria-pressed')).to.equal('true');
    expect(panel(el).matches(':popover-open')).to.equal(true);
    pin.click();
    await el.updateComplete;
    expect(pin.getAttribute('aria-label')).to.equal('固定提示');
    expect(pin.title).to.equal('固定提示');
    expect(pin.getAttribute('aria-pressed')).to.equal('false');
    expect(el.querySelector('[role="tooltip"]')!.textContent).to.equal(
      '说明内容'
    );
  });

  for (const association of ['for', 'target'] as const) {
    it(`${association} 外部目标可跨过中间控件进入面板、固定和访问链接，Escape 恢复焦点`, async () => {
      await sendMouse({type: 'move', position: [1200, 900]});
      const root = await fixture<HTMLDivElement>(html`
        <div>
          <button id="keyboard-tooltip-target">说明</button>
          <button>下一个字段</button>
          <vscode-tooltip
            show-on-focus
            for=${association === 'for' ? 'keyboard-tooltip-target' : ''}
            markdown
            text="[文档](https://example.com)"
          ></vscode-tooltip>
        </div>
      `);
      const [target, next] = root.querySelectorAll('button');
      const el = root.querySelector('vscode-tooltip')!;
      if (association === 'target') {
        el.target = target;
      }
      await el.updateComplete;
      target.focus();
      await el.updateComplete;
      await sendKeys({press: 'Tab'});
      await el.updateComplete;
      expect(document.activeElement).to.equal(next);
      expect(panel(el).matches(':popover-open')).to.equal(false);

      target.focus();
      await el.updateComplete;
      await sendKeys({press: 'Alt+ArrowDown'});
      const pin = panel(el).querySelector('button')!;
      expect(el.shadowRoot!.activeElement).to.equal(pin);
      expect(panel(el).matches(':popover-open')).to.equal(true);
      await sendKeys({press: 'Enter'});
      expect(el.pinned).to.equal(true);
      await sendKeys({press: 'Space'});
      expect(el.pinned).to.equal(false);
      await sendKeys({press: 'Tab'});
      expect(el.shadowRoot!.activeElement).to.equal(
        panel(el).querySelector('a')
      );
      expect(panel(el).matches(':popover-open')).to.equal(true);
      await sendKeys({press: 'Shift+Tab'});
      expect(el.shadowRoot!.activeElement).to.equal(pin);
      await sendKeys({press: 'Space'});
      expect(el.pinned).to.equal(true);
      await sendKeys({press: 'Escape'});
      await el.updateComplete;
      expect(el.pinned).to.equal(false);
      expect(panel(el).matches(':popover-open')).to.equal(false);
      expect(document.activeElement).to.equal(target);
      await sendKeys({press: 'Tab'});
      expect(document.activeElement).to.equal(next);
    });
  }

  it('真实鼠标缓慢经过箭头间隙、停留和选择文字时保持显示，离开后关闭', async () => {
    const el = await setup();
    const target = el.querySelector('button')!;
    const anchor = target.getBoundingClientRect();
    await sendMouse({
      type: 'move',
      position: [anchor.x + anchor.width / 2, anchor.y + anchor.height / 2],
    });
    await waitUntil(() => panel(el).matches(':popover-open'));
    const rect = panel(el).getBoundingClientRect();
    await sendMouse({
      type: 'move',
      position: [anchor.x + anchor.width / 2, anchor.bottom + 4],
    });
    await aTimeout(180);
    expect(panel(el).matches(':popover-open')).to.equal(true);
    await sendMouse({type: 'down', position: [rect.x + 8, rect.y + 8]});
    await sendMouse({type: 'move', position: [rect.x + 60, rect.y + 8]});
    await sendMouse({type: 'up'});
    await aTimeout(150);
    expect(panel(el).matches(':popover-open')).to.equal(true);
    await sendMouse({type: 'move', position: [10, 10]});
    await waitUntil(() => !panel(el).matches(':popover-open'));
  });

  it('面板进入后收到目标离开和失焦事件仍保持显示', async () => {
    const el = await setup();
    const target = el.querySelector('button')!;
    target.focus();
    await el.updateComplete;
    panel(el).dispatchEvent(new MouseEvent('mouseenter'));
    target.dispatchEvent(new MouseEvent('mouseleave'));
    target.blur();
    await aTimeout(150);
    expect(panel(el).matches(':popover-open')).to.equal(true);
    panel(el).dispatchEvent(new MouseEvent('mouseleave'));
    await waitUntil(() => !panel(el).matches(':popover-open'));
  });

  it('Markdown 渲染标题、强调、代码、列表与表格，动态更新并可恢复纯文本', async () => {
    const el = await setup();
    el.markdown = true;
    el.open = true;
    el.text =
      '# 参数\n\n**风压**与 `kPa`\n\n- 说明\n\n| 名称 | 值 |\n| --- | ---: |\n| 风压 | 0.5 |';
    await el.updateComplete;
    await el.updateComplete;
    expect(panel(el).querySelector('h1')!.textContent).to.equal('参数');
    expect(panel(el).querySelector('strong')!.textContent).to.equal('风压');
    expect(panel(el).querySelector('code')!.textContent).to.equal('kPa');
    expect(panel(el).querySelector('li')!.textContent).to.equal('说明');
    expect(panel(el).querySelectorAll('th').length).to.equal(2);
    expect(panel(el).querySelectorAll('td')[1].textContent).to.equal('0.5');
    expect(
      getComputedStyle(panel(el).querySelectorAll('td')[1]).textAlign
    ).to.equal('right');
    expect(panel(el).querySelector('[style]')).to.equal(null);
    expect(el.querySelector('[role="tooltip"]')!.textContent).to.include(
      '风压'
    );
    expect(el.querySelector('[role="tooltip"]')!.textContent).not.to.include(
      '**'
    );
    el.text = '**更新**';
    await el.updateComplete;
    await el.updateComplete;
    expect(panel(el).querySelector('strong')!.textContent).to.equal('更新');
    el.markdown = false;
    await el.updateComplete;
    expect(panel(el).querySelector('.markdown')).to.equal(null);
    expect(el.querySelector('[role="tooltip"]')!.textContent).to.equal(
      '**更新**'
    );
  });

  it('Markdown 不执行原始 HTML 和危险链接，普通链接保留', async () => {
    const el = await setup();
    el.markdown = true;
    el.text =
      '<img src=x onerror="alert(1)">\n\n<script>alert(1)</script>\n\n[危险](javascript:alert(1)) [编码](jav&#x61;script:alert(1)) [正常](https://example.com)';
    await el.updateComplete;
    await el.updateComplete;
    expect(panel(el).querySelector('script, img, [onerror]')).to.equal(null);
    expect(panel(el).querySelectorAll('a').length).to.equal(1);
    expect(panel(el).querySelector('a')!.getAttribute('href')).to.equal(
      'https://example.com'
    );
    expect(panel(el).querySelector('.markdown')!.textContent).to.include(
      '<script>'
    );
  });

  it('Tab 可进入固定按钮，键盘固定后移开和失焦保持显示，Escape 取消固定并恢复焦点', async () => {
    const el = await setup();
    const target = el.querySelector('button')!;
    target.focus();
    await el.updateComplete;
    const pin = panel(el).querySelector('button')!;
    await sendKeys({press: 'Tab'});
    expect(el.shadowRoot!.activeElement).to.equal(pin);
    await sendKeys({press: 'Enter'});
    await el.updateComplete;
    expect(el.pinned).to.equal(true);
    expect(pin.getAttribute('aria-pressed')).to.equal('true');
    pin.blur();
    await sendMouse({type: 'move', position: [10, 10]});
    await aTimeout(150);
    expect(panel(el).matches(':popover-open')).to.equal(true);
    pin.focus();
    await sendKeys({press: 'Escape'});
    await el.updateComplete;
    expect(el.pinned).to.equal(false);
    expect(panel(el).matches(':popover-open')).to.equal(false);
    expect(document.activeElement).to.equal(target);
  });

  it('鼠标可切换固定，取消后离开关闭；禁用、目标替换和移除清除固定状态', async () => {
    const el = await setup();
    el.querySelector('button')!.focus();
    await el.updateComplete;
    const pin = panel(el).querySelector('button')!;
    const rect = pin.getBoundingClientRect();
    await sendMouse({type: 'click', position: [rect.x + 10, rect.y + 10]});
    expect(el.pinned).to.equal(true);
    await sendMouse({type: 'click'});
    expect(el.pinned).to.equal(false);
    pin.blur();
    await sendMouse({type: 'move', position: [10, 10]});
    await waitUntil(() => !panel(el).matches(':popover-open'));
    el.pinned = true;
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    el.disabled = true;
    await el.updateComplete;
    expect(el.pinned).to.equal(false);
    expect(panel(el).matches(':popover-open')).to.equal(false);
    el.disabled = false;
    el.pinned = true;
    await el.updateComplete;
    el.querySelector('button')!.replaceWith(document.createElement('button'));
    await waitUntil(() => !el.pinned);
    el.pinned = true;
    await el.updateComplete;
    el.remove();
    expect(el.pinned).to.equal(false);
    expect(panel(el).matches(':popover-open')).to.equal(false);
  });

  it('初始 pinned 属性直接显示，Markdown 链接获得焦点时保持显示', async () => {
    const el = await fixture<VscodeTooltip>(
      html`<vscode-tooltip
        show-on-focus
        pinned
        markdown
        text="[文档](https://example.com)"
        ><button>说明</button></vscode-tooltip
      >`
    );
    expect(el.pinned).to.equal(true);
    expect(panel(el).matches(':popover-open')).to.equal(true);
    const link = panel(el).querySelector('a')!;
    link.focus();
    el.pinned = false;
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    link.blur();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
  });
  for (const initiallyHidden of [true, false]) {
    it(`外部关联提示${initiallyHidden ? '初始隐藏' : '显示后隐藏'}时遵守 hidden，并可恢复显示`, async () => {
      const root = await fixture<HTMLDivElement>(html`
        <div>
          <button id="hidden-tooltip-target">目标</button>
          <vscode-tooltip
            show-on-focus
            for="hidden-tooltip-target"
            text="提示"
            open
            ?hidden=${initiallyHidden}
          ></vscode-tooltip>
        </div>
      `);
      const el = root.querySelector('vscode-tooltip')!;
      await el.updateComplete;
      if (!initiallyHidden) {
        expect(panel(el).getBoundingClientRect().width).to.be.greaterThan(0);
        el.hidden = true;
      }
      await aTimeout(40);
      expect(getComputedStyle(el).display).to.equal('none');
      expect(panel(el).getBoundingClientRect().width).to.equal(0);
      el.hidden = false;
      await aTimeout(40);
      expect(getComputedStyle(el).display).to.equal('contents');
      expect(panel(el).getBoundingClientRect().width).to.be.greaterThan(0);
    });
  }

  it('关联、切换目标和移除时保留元素引用描述及关联期间新增的说明', async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div>
        <button>原目标</button><button>新目标</button> <span>原有说明</span
        ><span>新增说明</span>
      </div>
    `);
    const [original, replacement] = root.querySelectorAll('button');
    const [existing, additional] = root.querySelectorAll('span');
    original.ariaDescribedByElements = [existing];
    replacement.ariaDescribedByElements = [existing];
    const el = document.createElement('vscode-tooltip');
    el.target = original;
    el.text = '提示';
    root.append(el);
    await el.updateComplete;
    const description = el.querySelector('[role="tooltip"]')!;
    expect(original.ariaDescribedByElements).to.deep.equal([
      existing,
      description,
    ]);
    original.ariaDescribedByElements = [existing, description, additional];
    el.target = replacement;
    await el.updateComplete;
    expect(original.ariaDescribedByElements).to.deep.equal([
      existing,
      additional,
    ]);
    expect(replacement.ariaDescribedByElements).to.deep.equal([
      existing,
      description,
    ]);
    el.remove();
    expect(replacement.ariaDescribedByElements).to.deep.equal([existing]);
  });

  it('通过外部 id 关联，替换和延迟创建目标时重新关联，不改变控件层级', async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div>
        <vscode-radio-group
          ><vscode-radio id="tooltip-choice"
            >选择</vscode-radio
          ></vscode-radio-group
        >
        <vscode-tooltip
          show-on-focus
          for="tooltip-choice"
          text="选择说明"
          delay="0"
        ></vscode-tooltip>
      </div>
    `);
    const el = root.querySelector('vscode-tooltip')!;
    const radio = root.querySelector('vscode-radio')!;
    await el.updateComplete;
    expect(radio.parentElement!.localName).to.equal('vscode-radio-group');
    radio.focus();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    expect(panel(el).getBoundingClientRect().height).to.be.at.most(26);
    const replacement = document.createElement('button');
    replacement.id = radio.id;
    radio.remove();
    await aTimeout(20);
    expect(radio.hasAttribute('aria-describedby')).to.equal(false);
    root.append(replacement);
    await aTimeout(20);
    replacement.focus();
    await el.updateComplete;
    expect(replacement.getAttribute('aria-describedby')).to.include(
      'vscode-tooltip-'
    );
    expect(panel(el).matches(':popover-open')).to.equal(true);
  });

  it('元素引用优先于 id，并保持数字输入框的 slot 与内部无障碍描述', async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div>
        <button id="other-tooltip-target">其他</button>
        <vscode-textfield id="tooltip-field" label="数值"
          ><span slot="content-after">单位</span></vscode-textfield
        >
        <vscode-tooltip
          show-on-focus
          for="other-tooltip-target"
          text="请输入有效数值"
        ></vscode-tooltip>
      </div>
    `);
    const el = root.querySelector('vscode-tooltip')!;
    const field = root.querySelector('vscode-textfield')!;
    await field.updateComplete;
    el.target = field;
    await el.updateComplete;
    expect(
      root.querySelector('button')!.hasAttribute('aria-describedby')
    ).to.equal(false);
    expect(
      field.querySelector('[slot="content-after"]')!.parentElement
    ).to.equal(field);
    const input = field.shadowRoot!.querySelector('input')!;
    input.setAttribute('aria-describedby', 'field-error');
    input.focus();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    expect(input.ariaDescribedByElements).to.include(
      el.querySelector('[role="tooltip"]')
    );
    input.blur();
    await el.updateComplete;
    expect(input.ariaDescribedByElements).not.to.include(
      el.querySelector('[role="tooltip"]')
    );
    expect(input.getAttribute('aria-describedby')).to.equal('field-error');
  });

  it('受控持续显示多行字段提示，关闭、禁用、Escape 和重新打开生效', async () => {
    const el = await setup();
    el.text = '错误：数值无效\n说明：请输入正数';
    el.open = true;
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    expect(el.querySelector('[role="tooltip"]')!.textContent).to.include(
      '\n说明'
    );
    el.querySelector('button')!.dispatchEvent(new MouseEvent('mouseleave'));
    await aTimeout(120);
    expect(panel(el).matches(':popover-open')).to.equal(true);
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    el.text += '。';
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    el.open = false;
    await el.updateComplete;
    el.open = true;
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    el.disabled = true;
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    el.disabled = false;
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    el.open = false;
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
  });

  it('视口边缘回退并重新定向箭头，允许字段提示按右、下、上的顺序回退', async () => {
    const el = await setup();
    el.style.left = `${innerWidth - 65}px`;
    el.style.top = `${innerHeight - 30}px`;
    el.placement = 'right';
    el.fallbacks = ['bottom', 'top'];
    el.open = true;
    await el.updateComplete;
    expect(panel(el).dataset.placement).to.equal('top');
    const rect = panel(el).getBoundingClientRect();
    expect(rect.left).to.be.at.least(8);
    expect(rect.right).to.be.at.most(innerWidth - 7);
    expect(rect.bottom).to.be.lessThan(
      el.querySelector('button')!.getBoundingClientRect().top
    );
    expect(getComputedStyle(panel(el), '::before').bottom).to.equal('-5px');
    el.fallbacks = null;
    await el.updateComplete;
    expect(panel(el).dataset.placement).to.equal('left');
  });

  it('滚动容器裁剪、hidden 与 inert 时隐藏持续提示，恢复后重新显示', async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div style="position:fixed;left:100px;top:50px">
        <div id="tooltip-scroll" style="height:60px;overflow:auto">
          <button id="tooltip-scroll-target">字段</button>
          <div style="height:300px"></div>
        </div>
        <vscode-tooltip
          show-on-focus
          for="tooltip-scroll-target"
          text="字段说明"
          open
        ></vscode-tooltip>
      </div>
    `);
    const el = root.querySelector('vscode-tooltip')!;
    const scroll = root.querySelector<HTMLDivElement>('#tooltip-scroll')!;
    // IntersectionObserver 回调后还需等待定位帧，CI 的调度不保证在固定毫秒内完成。
    const waitForVisibility = (visibility: 'visible' | 'hidden') =>
      waitUntil(
        () =>
          panel(el).matches(':popover-open') &&
          getComputedStyle(panel(el)).visibility === visibility,
        `持续提示未切换到 ${visibility} 状态`,
        {timeout: 3000}
      );
    await waitForVisibility('visible');
    scroll.scrollTop = 150;
    await waitForVisibility('hidden');
    scroll.scrollTop = 0;
    await waitForVisibility('visible');
    scroll.inert = true;
    await waitForVisibility('hidden');
    scroll.inert = false;
    await waitForVisibility('visible');
    scroll.hidden = true;
    await waitForVisibility('hidden');
    scroll.hidden = false;
    await waitForVisibility('visible');
  });

  it('鼠标可移入提示，Escape 后内容更新不重新打开', async () => {
    const el = await setup();
    const button = el.querySelector('button')!;
    button.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    button.dispatchEvent(new MouseEvent('mouseleave'));
    panel(el).dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(120);
    expect(panel(el).matches(':popover-open')).to.equal(true);
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    el.text = '更新后的提示';
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    button.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    expect(panel(el).matches(':popover-open')).to.equal(true);
    button.dispatchEvent(new MouseEvent('mouseleave'));
    panel(el).dispatchEvent(new MouseEvent('mouseenter'));
    panel(el).dispatchEvent(new MouseEvent('mouseleave'));
    await aTimeout(120);
    expect(panel(el).matches(':popover-open')).to.equal(false);
  });

  it('同一 ShadowRoot 中可按 id 关联目标', async () => {
    const root = await fixture<HTMLDivElement>(html`<div></div>`);
    const shadow = root.attachShadow({mode: 'open'});
    shadow.innerHTML =
      '<button id="shadow-target">操作</button><vscode-tooltip show-on-focus for="shadow-target" text="说明"></vscode-tooltip>';
    const el = shadow.querySelector('vscode-tooltip')!;
    await el.updateComplete;
    shadow.querySelector('button')!.focus();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    const id = shadow
      .querySelector('button')!
      .getAttribute('aria-describedby')!;
    expect(shadow.getElementById(id)?.textContent).to.equal('说明');
  });
  it('注册自定义元素', () => {
    expect(document.createElement('vscode-tooltip')).to.be.instanceOf(
      VscodeTooltip
    );
  });
  it('悬停显示，离开后关闭，空内容和禁用时不显示', async () => {
    const el = await setup();
    expect(panel(el).matches(':popover-open')).to.equal(false);
    el.querySelector('button')!.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    el.querySelector('button')!.dispatchEvent(new MouseEvent('mouseleave'));
    await aTimeout(120);
    expect(panel(el).matches(':popover-open')).to.equal(false);
    el.disabled = true;
    await el.updateComplete;
    el.querySelector('button')!.focus();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    el.disabled = false;
    el.text = '';
    await el.updateComplete;
    el.querySelector('button')!.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    expect(panel(el).matches(':popover-open')).to.equal(false);
  });

  it('等待悬停延迟，离开时取消待显示的提示', async () => {
    const el = await setup();
    el.delay = 80;
    el.querySelector('button')!.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    expect(panel(el).matches(':popover-open')).to.equal(false);
    el.querySelector('button')!.dispatchEvent(new MouseEvent('mouseleave'));
    await aTimeout(100);
    expect(panel(el).matches(':popover-open')).to.equal(false);
    el.querySelector('button')!.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(100);
    expect(panel(el).matches(':popover-open')).to.equal(true);
  });

  it('聚焦立即显示，Escape 关闭并保持焦点，失焦关闭', async () => {
    const el = await setup();
    const button = el.querySelector('button')!;
    button.focus();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
    button.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    );
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    expect(document.activeElement).to.equal(button);
    button.blur();
    button.focus();
    await el.updateComplete;
    button.blur();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
  });

  for (const placement of [
    'top',
    'bottom',
    'left',
    'right',
  ] as TooltipPlacement[]) {
    it(`${placement} 方向定位并显示箭头`, async () => {
      const el = await setup();
      el.placement = placement;
      const button = el.querySelector('button')!;
      button.focus();
      await el.updateComplete;
      const anchor = button.getBoundingClientRect();
      const rect = panel(el).getBoundingClientRect();
      if (placement === 'top') {
        expect(rect.bottom).to.be.lessThan(anchor.top);
      } else if (placement === 'bottom') {
        expect(rect.top).to.be.greaterThan(anchor.bottom);
      } else if (placement === 'left') {
        expect(rect.right).to.be.lessThan(anchor.left);
      } else {
        expect(rect.left).to.be.greaterThan(anchor.right);
      }
      expect(getComputedStyle(panel(el), '::before').content).to.equal('""');
    });
  }

  it('保留原有无障碍描述，更新纯文本，替换目标和移除时清理关联', async () => {
    const el = await setup();
    const button = el.querySelector('button')!;
    const id = button.getAttribute('aria-describedby')!.split(' ')[1];
    expect(el.querySelector(`#${id}`)?.getAttribute('role')).to.equal(
      'tooltip'
    );
    button.focus();
    el.text = '<b>提示</b>';
    await el.updateComplete;
    expect(el.querySelector(`#${id}`)!.textContent).to.equal('<b>提示</b>');
    expect(el.querySelector(`#${id}`)!.children.length).to.equal(0);
    const replacement = document.createElement('button');
    button.replaceWith(replacement);
    await aTimeout(20);
    expect(button.getAttribute('aria-describedby')).to.equal('existing');
    expect(replacement.getAttribute('aria-describedby')).to.equal(id);
    replacement.focus();
    await el.updateComplete;
    el.remove();
    expect(replacement.hasAttribute('aria-describedby')).to.equal(false);
    expect(panel(el).matches(':popover-open')).to.equal(false);
    document.body.append(el);
    await aTimeout(20);
    replacement.focus();
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(true);
  });

  it('显示期间响应主题变量和禁用状态', async () => {
    const el = await setup();
    el.querySelector('button')!.focus();
    await el.updateComplete;
    el.style.setProperty('--vscode-editorHoverWidget-background', '#ffffff');
    el.style.setProperty('--vscode-editorHoverWidget-foreground', '#222222');
    el.style.setProperty('--vscode-editorHoverWidget-border', '#123456');
    const style = getComputedStyle(panel(el));
    expect(style.backgroundColor).to.equal('rgb(255, 255, 255)');
    expect(style.color).to.equal('rgb(34, 34, 34)');
    expect(style.borderTopColor).to.equal('rgb(18, 52, 86)');
    expect(getComputedStyle(panel(el), '::before').backgroundColor).to.equal(
      style.backgroundColor
    );
    el.disabled = true;
    await el.updateComplete;
    expect(panel(el).matches(':popover-open')).to.equal(false);
    expect(el.querySelector('button')!.disabled).to.equal(false);
  });
});
