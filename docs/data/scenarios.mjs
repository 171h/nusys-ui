import {
  ribbonResizeCss,
  ribbonResizeHtml,
  ribbonResizeScript,
} from './ribbon-resizable.mjs';

// 生成图库示例使用的浅色文档预览图，避免依赖外部资源。
const galleryPreview = (label, accent) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="60"><rect width="96" height="60" fill="#ffffff"/><rect x="8" y="8" width="80" height="5" fill="${accent}"/><rect x="8" y="20" width="64" height="4" fill="#d0d0d0"/><rect x="8" y="30" width="72" height="4" fill="#dcdcdc"/><rect x="8" y="40" width="56" height="4" fill="#e4e4e4"/><text x="8" y="55" font-family="sans-serif" font-size="8" fill="#666666">${label}</text></svg>`
  );

// 每个场景明确列出覆盖的公开功能；组合组件共用可运行场景。
const demo = (title, features, html, js = '', height = 340, css = '') => ({
  title,
  features,
  html,
  js,
  height,
  css,
});
const formScript = `const form = document.querySelector('form'); form.addEventListener('submit', event => { event.preventDefault(); document.querySelector('output').textContent = JSON.stringify(Array.from(new FormData(form))); }); form.addEventListener('reset', () => { document.querySelector('output').textContent = '已恢复默认值'; });`;
const choices = `<vscode-option value="ts" description="类型安全" selected>TypeScript</vscode-option><vscode-option value="js" description="浏览器脚本">JavaScript</vscode-option><vscode-option value="css" disabled>CSS（禁用）</vscode-option><vscode-option value="">不指定</vscode-option>`;
const rows = Array.from(
  {length: 8},
  (_, i) =>
    `<vscode-table-row><vscode-table-cell column-label="名称">文件 ${i + 1}</vscode-table-cell><vscode-table-cell column-label="状态"><vscode-badge>${i % 2 ? '完成' : '待处理'}</vscode-badge></vscode-table-cell><vscode-table-cell column-label="操作" compact><vscode-button secondary>打开 ${i + 1}</vscode-button></vscode-table-cell></vscode-table-row>`
).join('');
const table = (attrs = '') =>
  `<vscode-table ${attrs}><vscode-table-header><vscode-table-header-cell min-width="100px">名称</vscode-table-header-cell><vscode-table-header-cell>状态</vscode-table-header-cell><vscode-table-header-cell>操作</vscode-table-header-cell></vscode-table-header><vscode-table-body>${rows}</vscode-table-body></vscode-table>`;
const tree = (attrs = '') =>
  `<vscode-tree ${attrs} aria-label="目录"><vscode-tree-item open>项目<vscode-tree-item>src<vscode-tree-item>main.ts</vscode-tree-item><vscode-tree-item>style.css</vscode-tree-item></vscode-tree-item><vscode-tree-item>README.md</vscode-tree-item></vscode-tree-item></vscode-tree>`;
const split = (attrs = '') =>
  `<vscode-split-layout ${attrs} style="height:180px"><div slot="start">起始面板</div><div slot="end">结束面板</div></vscode-split-layout>`;
export const componentScenarios = {
  tooltip: ['tooltip-field', 'tooltip-controls', 'tooltip-markdown'],
  badge: ['badge-variants'],
  button: ['button-variants', 'button-form'],
  'button-group': ['button-group-menu'],
  icon: ['icon-sizes'],
  divider: ['divider-semantics'],
  'progress-bar': ['progress-control'],
  'progress-ring': ['progress-ring-task'],
  textfield: [
    'textfield-types',
    'textfield-native-types',
    'textfield-slots',
    'textfield-file',
  ],
  textarea: ['textarea-variants'],
  checkbox: ['checkbox-form'],
  'checkbox-group': ['choice-layouts', 'checkbox-form'],
  radio: ['radio-form', 'choice-layouts'],
  'radio-group': ['choice-layouts', 'radio-form'],
  'single-select': [
    'select-states',
    'select-options',
    'select-filters',
    'select-hover',
  ],
  'multi-select': ['multi-form', 'multi-combobox', 'select-hover'],
  option: ['select-states', 'multi-form', 'multi-combobox'],
  label: ['form-layouts'],
  'form-helper': ['form-layouts'],
  'form-group': ['form-layouts'],
  'form-container': ['form-layouts', 'form-dirty-controls'],
  fieldset: [
    'fieldset-checkbox',
    'fieldset-legend-checkbox',
    'fieldset-modes',
    'fieldset-callback',
  ],
  collapsible: ['collapsible-variants'],
  'context-menu': ['menu-persistent', 'button-group-menu'],
  'context-menu-item': ['menu-persistent'],
  scrollable: ['scrollable-controls'],
  'split-layout': ['split-directions', 'split-controls'],
  tabs: ['tabs-panel', 'tabs-group-views'],
  'tab-header': ['tabs-panel', 'tabs-group-views'],
  'tab-panel': ['tabs-panel', 'tabs-group-views'],
  'tabs-group': ['tabs-group-views'],
  ribbon: [
    'ribbon-menus',
    'ribbon-responsive',
    'ribbon-overflow',
    'ribbon-gallery',
    'ribbon-state',
  ],
  'toolbar-button': ['toolbar-states'],
  'toolbar-container': ['toolbar-states'],
  table: ['table-variants', 'table-responsive'],
  'table-header': ['table-variants', 'table-responsive'],
  'table-header-cell': ['table-variants', 'table-responsive'],
  'table-body': ['table-variants', 'table-responsive'],
  'table-row': ['table-variants', 'table-responsive'],
  'table-cell': ['table-variants', 'table-responsive'],
  tree: ['tree-variants', 'tree-controls', 'tree-item-slots'],
  'tree-item': ['tree-variants', 'tree-controls', 'tree-item-slots'],
};
export const extraExamples = {
  'tooltip-markdown': demo(
    'Markdown 表格与固定提示',
    [
      'markdown 渲染强调、代码、列表和表格',
      '鼠标移入面板、选择文字与滚动时保持显示',
      '右上角 pinned 按钮固定或取消，Tab 操作与 Escape 关闭',
    ],
    '<div class="markdown-tooltip"><vscode-tooltip markdown delay="0" placement="bottom" text="**参数说明**&#10;&#10;使用 `kPa` 输入风压。&#10;&#10;| 参数 | 单位 | 示例 |&#10;| --- | --- | ---: |&#10;| 基本风压 | kPa | 0.5 |&#10;| 地面粗糙度 | 类别 | B |&#10;&#10;- 可选择文字&#10;- 点击右上角图标固定提示" style="--vsc-tooltip-max-width:420px"><vscode-button>查看参数说明</vscode-button></vscode-tooltip></div>',
    '',
    360,
    '.markdown-tooltip{display:flex;justify-content:center;padding:12px 0}'
  ),
  'tooltip-field': demo(
    '外部字段关联与持续提示',
    [
      'for 外部关联，保留输入框层级与 slot',
      'open 持续提示、多行文字与主题切换',
      'fallbacks 右 → 下 → 上，CSS 宽度约束',
    ],
    '<div class="tooltip-field"><vscode-textfield id="tooltip-input" label="基本风压" value="0"><span slot="content-after">kPa</span></vscode-textfield><vscode-tooltip id="field-tooltip" for="tooltip-input" placement="right" text="数值必须大于零&#10;说明：请输入基本风压" open style="--vsc-tooltip-min-width:160px;--vsc-tooltip-max-width:260px"></vscode-tooltip></div>',
    "document.querySelector('#field-tooltip').fallbacks = ['bottom', 'top'];",
    190,
    '.tooltip-field{padding:24px 0} #tooltip-input{width:180px}'
  ),
  'tooltip-controls': demo(
    '提示状态与关联目标切换',
    [
      'target 元素引用关联，保留 flex/grid 布局',
      'text 动态更新、disabled 禁用提示而保留操作',
      'delay=0 立即悬停、键盘聚焦与 Escape 关闭',
    ],
    '<div class="variants tooltip-actions"><vscode-button id="tooltip-save">保存</vscode-button><vscode-button id="tooltip-export" secondary>导出</vscode-button><vscode-tooltip id="action-tip" text="保存当前项目" delay="0"></vscode-tooltip></div><div class="variants"><vscode-button id="switch-tooltip-target" secondary>提示导出操作</vscode-button><vscode-checkbox id="disable-tooltip" label="禁用提示"></vscode-checkbox></div><output aria-live="polite">提示关联保存操作</output>',
    "const tip=document.querySelector('#action-tip');tip.target=document.querySelector('#tooltip-save');document.querySelector('#switch-tooltip-target').onclick=()=>{tip.target=document.querySelector('#tooltip-export');tip.text='导出当前计算结果';document.querySelector('output').textContent='提示关联导出操作';};document.querySelector('#disable-tooltip').addEventListener('change',event=>{tip.disabled=event.target.checked;});",
    240,
    '.tooltip-actions{padding:36px 0}'
  ),
  'textfield-native-types': demo(
    '其他原生输入类型',
    [
      'color/date/datetime-local/month/time/week',
      'search/tel/url、浏览器原生选择器',
      '不同浏览器的原生弹出界面由浏览器决定',
    ],
    `<div class="columns">${['color', 'date', 'datetime-local', 'month', 'time', 'week', 'search', 'tel', 'url'].map((type) => `<div><vscode-label for="type-${type}">${type}</vscode-label><vscode-textfield id="type-${type}" type="${type}" aria-label="${type}" placeholder="${type}"></vscode-textfield></div>`).join('')}</div>`,
    '',
    540
  ),
  'select-hover': demo(
    '悬停与焦点下的图标和文字宽度',
    [
      '下拉图标默认隐藏，悬停或获得焦点时显示',
      '文字默认使用完整内容区，悬停或获得焦点时为图标预留宽度',
      '进入与离开的双向过渡、长文字截断和多选标签折叠',
      '组合框、禁用状态及全站主题和尺寸切换',
    ],
    `<p id="select-hover-instructions">将鼠标移入、移出下方控件，或使用 Tab 键移入、移出焦点，观察图标与文字区域的变化。获得焦点后，鼠标离开仍显示图标。拖动宽度滑块可检查长文字截断和标签折叠；也可切换右上角的主题、尺寸和减少动画设置。</p><label for="select-hover-width">控件宽度 <output id="select-hover-width-value">220 px</output></label><input id="select-hover-width" type="range" min="160" max="420" value="220" step="10"><div id="select-hover-controls"><vscode-label for="hover-single">单选长文字</vscode-label><vscode-single-select id="hover-single"><vscode-option value="long" selected>这是一段较长的选项文字，用于观察悬停前后的可见范围</vscode-option><vscode-option value="short">简短选项</vscode-option></vscode-single-select><vscode-label for="hover-multi">多选标签折叠</vscode-label><vscode-multi-select id="hover-multi"><vscode-option value="ts" selected>TypeScript</vscode-option><vscode-option value="js" selected>JavaScript</vscode-option><vscode-option value="json" selected>JSON 数据</vscode-option><vscode-option value="md" selected>Markdown 文档</vscode-option></vscode-multi-select><vscode-label for="hover-combobox">可输入组合框</vscode-label><vscode-single-select id="hover-combobox" combobox label="可输入组合框"><vscode-option value="long" selected>在组合框中输入文字，观察图标旁的可用空间</vscode-option><vscode-option value="short">简短选项</vscode-option></vscode-single-select><vscode-label for="hover-disabled">禁用对照</vscode-label><vscode-single-select id="hover-disabled" disabled><vscode-option selected>禁用状态的长文字与下拉图标</vscode-option></vscode-single-select></div>`,
    `const width=document.querySelector('#select-hover-width');const update=()=>{document.querySelector('#select-hover-controls').style.width=width.value+'px';document.querySelector('#select-hover-width-value').textContent=width.value+' px';};width.addEventListener('input',update);update();`,
    600,
    '#select-hover-width-value{display:inline;margin:0} #select-hover-width{display:block;width:100%;max-width:420px;margin:8px 0 16px} #select-hover-controls{max-width:100%;display:grid;grid-template-columns:minmax(0,1fr);gap:6px} #select-hover-controls vscode-single-select,#select-hover-controls vscode-multi-select{width:100%}'
  ),
  'select-states': demo(
    '空值、禁用、必选与默认值',
    [
      'required、disabled、default-value',
      'value、selectedIndex、选项 selected/disabled/description',
      'FormData 与 reset',
    ],
    `<form><vscode-label for="select">必选语言</vscode-label><vscode-single-select id="select" name="language" required default-value="ts">${choices}</vscode-single-select><vscode-single-select disabled aria-label="禁用选择"><vscode-option selected>禁用</vscode-option></vscode-single-select><div class="variants"><vscode-button type="submit">提交</vscode-button><vscode-button type="reset" secondary>重置</vscode-button><vscode-button id="empty" secondary>清空</vscode-button><vscode-button id="index" secondary>选中第二项</vscode-button></div></form><output aria-live="polite"></output>`,
    formScript +
      `document.querySelector('#empty').onclick=()=>document.querySelector('#select').value='';document.querySelector('#index').onclick=()=>document.querySelector('#select').selectedIndex=1;`
  ),
  'select-options': demo(
    '动态选项、位置与打开控制',
    [
      'options 数组、value、open、position=above/below',
      '数据更新与选项描述、禁用状态',
    ],
    `<vscode-button id="replace">替换数据</vscode-button> <vscode-button id="open" secondary>打开上方列表</vscode-button><div style="margin-top:140px"><vscode-single-select aria-label="动态语言" position="above"></vscode-single-select></div><output aria-live="polite"></output>`,
    `const select=document.querySelector('vscode-single-select');select.options=[{label:'TypeScript',value:'ts',selected:true},{label:'JavaScript',value:'js',description:'脚本语言'},{label:'停用',value:'disabled',disabled:true}];select.value='ts';document.querySelector('#replace').onclick=()=>{select.options=[{label:'JSON',value:'json'},{label:'YAML',value:'yaml'}];select.value='yaml';document.querySelector('output').textContent='已更新为 YAML';};document.querySelector('#open').onclick=()=>select.open=true;select.addEventListener('change',()=>document.querySelector('output').textContent=select.value);`,
    420
  ),
  'select-filters': demo(
    '四种组合框过滤算法',
    [
      'combobox、filter、label',
      'fuzzy / contains / startsWith / startsWithPerTerm',
      'creatable 的新建选项',
    ],
    `<label>过滤算法 <select id="filter"><option>fuzzy</option><option>contains</option><option>startsWith</option><option>startsWithPerTerm</option></select></label><vscode-single-select combobox creatable label="输入过滤或创建语言" aria-label="过滤语言"><vscode-option value="ts">TypeScript Language</vscode-option><vscode-option value="js">JavaScript Language</vscode-option><vscode-option value="json">JSON Data</vscode-option></vscode-single-select><output aria-live="polite">试试 ts、Language 或输入新名称。</output>`,
    `const select=document.querySelector('vscode-single-select');document.querySelector('#filter').onchange=event=>select.filter=event.target.value;select.addEventListener('change',()=>document.querySelector('output').textContent='选中：'+select.value);`
  ),
  'multi-form': demo(
    '多值提交、选择索引和默认恢复',
    [
      'value 数组、selectedIndexes、defaultValue',
      'required、disabled、getAll(name)',
      'abbreviation、description、disabled 选项',
    ],
    `<form><vscode-multi-select name="formats" required aria-label="导出格式"><vscode-option value="html" abbreviation="HTML" description="网页" selected>超文本标记语言</vscode-option><vscode-option value="md" abbreviation="MD">Markdown 文档</vscode-option><vscode-option value="json" description="数据交换">JSON</vscode-option><vscode-option value="xml" disabled>XML</vscode-option></vscode-multi-select><div class="variants"><vscode-button type="submit">提交全部值</vscode-button><vscode-button type="reset" secondary>恢复默认</vscode-button><vscode-button id="index" secondary>选择前两项</vscode-button><vscode-button id="clear" secondary>清空</vscode-button></div></form><output aria-live="polite"></output>`,
    `const select=document.querySelector('vscode-multi-select');select.defaultValue=['html'];document.querySelector('form').onsubmit=event=>{event.preventDefault();document.querySelector('output').textContent=JSON.stringify(new FormData(event.target).getAll('formats'));};document.querySelector('#index').onclick=()=>{select.selectedIndexes=[0,1];};document.querySelector('#clear').onclick=()=>select.value=[];`
  ),
  'multi-combobox': demo(
    '多选过滤、创建与标签折叠',
    [
      'combobox、creatable、filter、options',
      '长标签/缩写/值的回退与溢出折叠',
      '程序 value 与 change',
    ],
    `<vscode-multi-select combobox creatable filter="contains" label="输入格式名称" aria-label="自定义多选" style="width:230px"></vscode-multi-select><vscode-button id="choose" secondary>选择全部</vscode-button><output aria-live="polite"></output>`,
    `const select=document.querySelector('vscode-multi-select');select.options=[{label:'超文本标记语言',value:'html',abbreviation:'HTML'},{label:'Markdown 文档格式',value:'md',abbreviation:'MD'},{label:'JavaScript 对象表示法',value:'json'},{label:'',value:'yaml'}];document.querySelector('#choose').onclick=()=>{select.value=['html','md','json','yaml'];document.querySelector('output').textContent=JSON.stringify(select.value);};select.addEventListener('change',()=>document.querySelector('output').textContent=JSON.stringify(select.value));`
  ),
  'form-layouts': demo(
    '布局、必填标记与辅助信息',
    [
      'FormGroup horizontal/vertical/settings-group、尺寸',
      'Label for/required 与 Helper 内容',
      'FormContainer responsive/breakpoint',
    ],
    `<vscode-form-container responsive breakpoint="560"><vscode-form-group variant="horizontal" size="small"><vscode-label for="small" required size="small">名称</vscode-label><vscode-textfield id="small" size="small" required placeholder="小尺寸横向布局"></vscode-textfield><vscode-form-helper>必填标记仅提示，required 在控件上设置。</vscode-form-helper></vscode-form-group><vscode-form-group variant="vertical" size="large"><vscode-label for="large" size="large">说明</vscode-label><vscode-textarea id="large" size="large" rows="2"></vscode-textarea><vscode-form-helper>大尺寸纵向布局，调整窗口观察响应式。</vscode-form-helper></vscode-form-group><vscode-form-group variant="settings-group"><vscode-label for="setting">设置分组</vscode-label><vscode-textfield id="setting" value="设置面板样式"></vscode-textfield><vscode-form-helper>标题、控件和说明纵向排列。</vscode-form-helper></vscode-form-group></vscode-form-container>`,
    '',
    560
  ),
  'form-dirty-controls': demo(
    '已修改状态与高亮开关',
    [
      'mark-duration=0/时间/forever、markable',
      'dirty、mark()/reset()、全局状态查询',
    ],
    `<vscode-form-container mark-duration="forever"><vscode-form-group><vscode-label for="dirty">名称</vscode-label><vscode-textfield id="dirty" value="初始名称"></vscode-textfield></vscode-form-group></vscode-form-container><div class="variants"><vscode-button id="reset">清除修改标记</vscode-button><vscode-button id="mark">手动标记</vscode-button><vscode-button id="disable" secondary>切换高亮</vscode-button></div><output aria-live="polite"></output>`,
    `const container=document.querySelector('vscode-form-container');document.querySelector('#reset').onclick=()=>{container.reset();document.querySelector('output').textContent='dirty='+container.dirty;};document.querySelector('#mark').onclick=()=>container.mark();document.querySelector('#disable').onclick=()=>{container.markable=!container.markable;document.querySelector('output').textContent='markable='+container.markable;};document.querySelector('vscode-textfield').addEventListener('input',()=>requestAnimationFrame(()=>document.querySelector('output').textContent=JSON.stringify(container.constructor.getFormStates().map(state=>({dirty:state.dirty})))));`
  ),
  'fieldset-checkbox': demo(
    '右上角复选框与事件',
    ['checkbox、checkbox-label', 'unchecked-mode、vsc-fieldset-checked-change'],
    '<vscode-fieldset checkbox checked checkbox-label="启用风荷载" unchecked-mode="collapsed"><fieldset><legend>风荷载</legend><vscode-label for="pressure">基本风压</vscode-label><vscode-textfield id="pressure" value="0.5" type="number"></vscode-textfield><vscode-checkbox label="考虑阵风" checked></vscode-checkbox></fieldset></vscode-fieldset><output aria-live="polite">风荷载已启用</output>',
    "document.querySelector('vscode-fieldset').addEventListener('vsc-fieldset-checked-change', (event) => { document.querySelector('output').textContent = event.detail.checked ? '风荷载已启用' : '风荷载已关闭，参数已保留'; });"
  ),
  'fieldset-legend-checkbox': demo(
    '可选的 legend 左侧复选框',
    [
      'legend-checkbox 默认关闭、现有标题左侧布局',
      'checked、unchecked-mode=collapsed、保留参数',
      '复选框或标题点击、空格键与自定义业务事件',
    ],
    '<vscode-fieldset legend-checkbox checked unchecked-mode="collapsed" checkbox-label="启用高级设置"><fieldset><legend><span>高级设置</span></legend><vscode-label for="advanced-value">参数</vscode-label><vscode-textfield id="advanced-value" value="保留参数"></vscode-textfield></fieldset></vscode-fieldset><output aria-live="polite">高级设置已启用</output>',
    "document.querySelector('vscode-fieldset').addEventListener('vsc-fieldset-checked-change', (event) => { document.querySelector('output').textContent = event.detail.checked ? '高级设置已启用' : '高级设置已关闭，参数已保留'; });"
  ),
  'fieldset-modes': demo(
    '三种取消勾选模式',
    ['visible/collapsed/minimal', 'checkbox-label、默认分区、尺寸与内容恢复'],
    `<div class="stack">${['visible', 'collapsed', 'minimal'].map((mode) => `<vscode-fieldset checkbox checked checkbox-label="启用 ${mode}" unchecked-mode="${mode}"><fieldset><legend>${mode}</legend><vscode-textfield value="重新勾选后保留输入" aria-label="${mode} 输入"></vscode-textfield></fieldset></vscode-fieldset>`).join('')}</div>`,
    '',
    470
  ),
  'fieldset-callback': demo(
    '取消默认行为与自定义状态',
    [
      '可取消的 vsc-fieldset-checked-change',
      'checkedChange 回调、返回 false',
      'fieldsetElement、checked 属性控制',
    ],
    `<vscode-fieldset checkbox checked checkbox-label="自定义控制"><fieldset><legend>高级设置</legend><vscode-textfield value="保留可编辑" aria-label="自定义输入"></vscode-textfield></fieldset></vscode-fieldset><output aria-live="polite">取消勾选时保留内容可编辑。</output>`,
    `const host=document.querySelector('vscode-fieldset');host.checkedChange=checked=>{document.querySelector('output').textContent='checked='+checked+'，已跳过默认禁用';return false;};`,
    270
  ),
  'collapsible-variants': demo(
    '标题、描述与独立操作',
    [
      'title/heading/description、open',
      'decorations/actions、always-show-header-actions',
      'toggle 事件、停止操作冒泡',
    ],
    `<vscode-collapsible title="项目" heading="扩展工作区" description="2 个文件" always-show-header-actions><vscode-badge slot="decorations" variant="counter">2</vscode-badge><vscode-toolbar-button id="add" slot="actions" icon="add" label="新增"></vscode-toolbar-button><p>main.ts</p></vscode-collapsible><output aria-live="polite"></output>`,
    `const panel=document.querySelector('vscode-collapsible');panel.addEventListener('vsc-collapsible-toggle',event=>document.querySelector('output').textContent='open='+event.detail.open);document.querySelector('#add').onclick=event=>{event.stopPropagation();document.querySelector('output').textContent='已新增，展开状态未改变';};`,
    240
  ),
  'menu-persistent': demo(
    '快捷键、分隔线与持续选择',
    [
      'data、label/keybinding/value/separator',
      'prevent-close、show、方向键/Enter/Escape',
      'vsc-context-menu-select',
    ],
    `<vscode-button id="show">打开持续菜单</vscode-button><vscode-context-menu prevent-close></vscode-context-menu><output aria-live="polite"></output>`,
    `const menu=document.querySelector('vscode-context-menu');menu.data=[{label:'复制',value:'copy',keybinding:'Ctrl+C'},{separator:true},{label:'格式化',value:'format',keybinding:'Shift+Alt+F'}];menu.show=true;document.querySelector('#show').onclick=event=>{event.stopPropagation();menu.show=true;};menu.addEventListener('vsc-context-menu-select',event=>document.querySelector('output').textContent=JSON.stringify(event.detail));`
  ),
  'scrollable-controls': demo(
    '滚动位置、阴影与滚轮',
    [
      'always-visible、shadow、scrollPos/scrollMax/scrolled',
      'fast-scroll-sensitivity、mouse-wheel-scroll-sensitivity、min-thumb-size',
      'vsc-scrollable-scroll 事件',
    ],
    `<div class="variants"><vscode-button id="bottom">滚动到底部</vscode-button><vscode-button id="top" secondary>回到顶部</vscode-button></div><vscode-scrollable always-visible fast-scroll-sensitivity="3" mouse-wheel-scroll-sensitivity="1.5" min-thumb-size="30" style="height:150px"><div style="padding:12px">${Array.from({length: 20}, (_, i) => `<p>文件 ${i + 1}</p>`).join('')}</div></vscode-scrollable><output aria-live="polite"></output>`,
    `const scroll=document.querySelector('vscode-scrollable');document.querySelector('#bottom').onclick=()=>scroll.scrollPos=scroll.scrollMax;document.querySelector('#top').onclick=()=>scroll.scrollPos=0;scroll.addEventListener('vsc-scrollable-scroll',()=>document.querySelector('output').textContent='位置：'+scroll.scrollPos+' / '+scroll.scrollMax);`,
    300
  ),
  'split-directions': demo(
    '横向、纵向与嵌套分栏',
    [
      'split=horizontal/vertical、start/end 插槽',
      'initial-handle-position、handle-size、最小尺寸',
    ],
    `<div class="columns">${split('split="horizontal" initial-handle-position="35%" handle-size="8" min-start="40px" min-end="40px"')}<vscode-split-layout split="vertical" style="height:180px"><div slot="start">目录</div><vscode-split-layout slot="end" split="horizontal"><div slot="start">编辑区</div><div slot="end">终端</div></vscode-split-layout></vscode-split-layout></div>`,
    '',
    250
  ),
  'split-controls': demo(
    '固定面板、复位与位置事件',
    [
      'fixed-pane=start/end/none、handlePosition',
      'reset-on-dbl-click、resetHandlePosition()',
      'vsc-split-layout-change、百分比位置',
    ],
    `<label>固定面板 <select id="fixed"><option>start</option><option>end</option><option>none</option></select></label>${split('fixed-pane="start" initial-handle-position="120px" reset-on-dbl-click min-start="80px" min-end="80px"')}<vscode-button id="reset" secondary>恢复初始分栏</vscode-button><output aria-live="polite"></output>`,
    `const split=document.querySelector('vscode-split-layout');document.querySelector('#fixed').onchange=event=>split.fixedPane=event.target.value;document.querySelector('#reset').onclick=()=>split.resetHandlePosition();split.addEventListener('vsc-split-layout-change',event=>document.querySelector('output').textContent=JSON.stringify(event.detail));`,
    300
  ),
  'tabs-panel': demo(
    '面板外观、选中索引与组合',
    [
      'panel 外观、selected-index、active/hidden 同步',
      'Header/Panel 成对顺序、装饰徽章与内容',
      'vsc-tabs-select、键盘导航与程序控制',
    ],
    `<vscode-tabs panel selected-index="1"><vscode-tab-header>设置 <vscode-badge variant="tab-header-counter">2</vscode-badge></vscode-tab-header><vscode-tab-panel><vscode-checkbox label="自动保存" checked></vscode-checkbox></vscode-tab-panel><vscode-tab-header>预览</vscode-tab-header><vscode-tab-panel><p>当前选中预览页。</p></vscode-tab-panel></vscode-tabs><vscode-button id="first" secondary>显示设置</vscode-button><output aria-live="polite"></output>`,
    `const tabs=document.querySelector('vscode-tabs');document.querySelector('#first').onclick=()=>{tabs.selectedIndex=0;document.querySelector('output').textContent='selectedIndex='+tabs.selectedIndex;};tabs.addEventListener('vsc-tabs-select',event=>document.querySelector('output').textContent='selectedIndex='+event.detail.selectedIndex);`,
    290
  ),
  'tabs-group-views': demo(
    '视图拖拽到空组与动态布局',
    [
      '移动单个 fieldset 视图形成新 Tabs',
      'empty-text、组间布局事件',
      '保留节点内容和表单输入',
    ],
    `<div class="columns"><vscode-tabs-group><vscode-tabs><vscode-tab-header>项目</vscode-tab-header><vscode-tab-panel><fieldset><legend>配置</legend><vscode-textfield value="保留这个值" aria-label="配置值"></vscode-textfield></fieldset><fieldset><legend>大纲</legend><p>符号列表</p></fieldset></vscode-tab-panel></vscode-tabs></vscode-tabs-group><vscode-tabs-group empty-text="将配置标题拖到这里"></vscode-tabs-group></div><output aria-live="polite"></output>`,
    `document.querySelectorAll('vscode-tabs-group').forEach(group=>group.addEventListener('vsc-tabs-group-layout-change',event=>document.querySelector('output').textContent='已移动：'+event.detail.tabs.localName));`,
    390
  ),
  'toolbar-states': demo(
    '切换状态、文字与键盘',
    [
      'icon/label、toggleable/checked、change',
      'ToolbarContainer 插槽组合',
      '点击反馈和可访问名称',
    ],
    `<vscode-toolbar-container><vscode-toolbar-button icon="refresh" label="刷新列表"></vscode-toolbar-button><vscode-toolbar-button toggleable checked icon="pin" label="固定面板"></vscode-toolbar-button><vscode-badge variant="counter">8</vscode-badge><span>项目工具栏</span></vscode-toolbar-container><output aria-live="polite"></output>`,
    `document.querySelectorAll('vscode-toolbar-button').forEach(button=>{button.addEventListener('click',()=>document.querySelector('output').textContent=button.label);button.addEventListener('change',()=>document.querySelector('output').textContent=button.label+'：'+button.checked);});`,
    160
  ),
  'table-variants': demo(
    '边框、斑马纹、宽度与滚动主体',
    [
      'bordered/bordered-rows/bordered-columns、zebra/zebra-odd',
      'columns、min-column-width、HeaderCell min-width',
      '滚动 Body、单元格 compact 和操作内容',
    ],
    `<label>外观 <select id="look"><option value="zebra">斑马纹</option><option value="zebra-odd">奇数行斑马纹</option><option value="bordered">全部边框</option><option value="bordered-rows">行边框</option><option value="bordered-columns">列边框</option></select></label>${table('zebra resizable min-column-width="60px"')}<output aria-live="polite"></output>`,
    `const table=document.querySelector('vscode-table');table.columns=['45%','25%','auto'];document.querySelector('#look').onchange=event=>{['zebra','zebra-odd','bordered','bordered-rows','bordered-columns'].forEach(attr=>table.toggleAttribute(attr,attr===event.target.value));};document.querySelectorAll('vscode-button').forEach(button=>button.onclick=()=>document.querySelector('output').textContent=button.textContent);`,
    450,
    'vscode-table-body {max-height:260px;overflow:auto}'
  ),
  'table-responsive': demo(
    '响应式、尺寸与延迟列宽调整',
    [
      'responsive/breakpoint、column-label',
      'small/medium/large、delayed-resizing',
      '动态调整容器宽度、窄容器中的标签式布局',
    ],
    `<div class="table-width-control"><label for="container-width">容器宽度</label><input id="container-width" type="range" min="240" max="800" step="10" value="280"><output id="container-width-value" for="container-width"></output></div><div id="table-container" style="width:280px;max-width:100%"><p>响应式表格</p>${table('responsive breakpoint="350" size="small" bordered-rows')}<p>延迟列宽调整</p>${table('resizable delayed-resizing size="large" bordered-columns')}</div>`,
    `document.querySelectorAll('vscode-table').forEach(table=>table.columns=['40%','30%','auto']);const container=document.querySelector('#table-container');const width=document.querySelector('#container-width');width.addEventListener('input',()=>container.style.width=width.value+'px');const reportWidth=()=>document.querySelector('#container-width-value').textContent=Math.round(container.getBoundingClientRect().width)+' px';new ResizeObserver(reportWidth).observe(container);reportWidth();`,
    690,
    'vscode-table-body {max-height:200px;overflow:auto} .table-width-control {display:flex;align-items:center;flex-wrap:wrap;gap:8px} .table-width-control input {width:180px;max-width:100%;accent-color:var(--vscode-focusBorder)} .table-width-control output {display:inline;margin:0}'
  ),
  'tree-variants': demo(
    '展开方式、箭头和缩进线',
    [
      'singleClick/doubleClick、hide-arrows',
      'indent、indent-guides=none/onHover/always',
      '单选/多选及鼠标键盘行为',
    ],
    `<label>缩进线 <select id="guides"><option>always</option><option>onHover</option><option>none</option></select></label><vscode-checkbox id="arrows" label="隐藏箭头"></vscode-checkbox>${tree('expand-mode="doubleClick" indent="16" indent-guides="always"')}<output aria-live="polite">双击分支展开，方向键也可展开。</output>`,
    `const tree=document.querySelector('vscode-tree');document.querySelector('#guides').onchange=event=>tree.indentGuides=event.target.value;document.querySelector('#arrows').addEventListener('change',event=>tree.hideArrows=event.target.checked);tree.addEventListener('vsc-tree-select',event=>document.querySelector('output').textContent='选择：'+event.detail.map(item=>item.textContent.trim()).join('、'));`,
    370
  ),
  'tree-controls': demo(
    '全展开、全收起与主动定位',
    [
      'expandAll()/collapseAll()、节点 active',
      '节点 selected/open、path/level',
      '鼠标选择与应用主动定位',
    ],
    `${tree('multi-select')}<div class="variants"><vscode-button id="expand">展开全部</vscode-button><vscode-button id="collapse" secondary>收起全部</vscode-button><vscode-button id="active" secondary>定位 README</vscode-button></div><output aria-live="polite"></output>`,
    `const tree=document.querySelector('vscode-tree');document.querySelector('#expand').onclick=()=>tree.expandAll();document.querySelector('#collapse').onclick=()=>tree.collapseAll();document.querySelector('#active').onclick=()=>{tree.expandAll();const item=tree.querySelectorAll('vscode-tree-item')[4];item.active=true;item.focus();document.querySelector('output').textContent='活动节点路径：'+JSON.stringify(item.path);};`,
    350
  ),
  'tree-item-slots': demo(
    '节点图标、说明与独立操作',
    [
      'icon-branch/icon-branch-opened/icon-leaf',
      'description/actions/decoration 插槽',
      '分支 open、叶节点操作与选中状态',
    ],
    `<vscode-tree><vscode-tree-item open><vscode-icon slot="icon-branch" name="folder"></vscode-icon><vscode-icon slot="icon-branch-opened" name="folder-opened"></vscode-icon>src<vscode-tree-item><vscode-icon slot="icon-leaf" name="file-code"></vscode-icon>main.ts<span slot="description">入口文件</span><vscode-toolbar-button id="delete" slot="actions" icon="trash" label="删除文件"></vscode-toolbar-button><vscode-badge slot="decoration" variant="counter">1</vscode-badge></vscode-tree-item></vscode-tree-item></vscode-tree><output aria-live="polite"></output>`,
    `document.querySelector('#delete').onclick=event=>{event.stopPropagation();document.querySelector('output').textContent='删除操作，未改变节点选择';};`,
    210
  ),
  'badge-variants': demo(
    '全部徽章变体与组合',
    [
      'default、counter、activity-bar-counter、tab-header-counter',
      '与折叠标题和标签页组合',
    ],
    `<div class="variants"><vscode-badge>默认状态</vscode-badge><vscode-badge variant="counter">128</vscode-badge><vscode-badge variant="activity-bar-counter">9</vscode-badge><vscode-badge variant="tab-header-counter">3</vscode-badge></div><vscode-collapsible title="问题" open><vscode-badge slot="decorations" variant="counter">2</vscode-badge><p>2 项待处理</p></vscode-collapsible>`,
    '',
    250
  ),
  'button-variants': demo(
    '宽度、尺寸、双侧图标与旋转',
    [
      'block、secondary、disabled',
      'small / medium / large',
      'icon、icon-after、旋转速度、icon-only 插槽',
    ],
    `<div class="variants"><vscode-button size="small">小按钮</vscode-button><vscode-button size="medium">中按钮</vscode-button><vscode-button size="large">大按钮</vscode-button><vscode-button icon="sync" icon-spin icon-spin-duration="2" icon-after="chevron-right">同步</vscode-button><vscode-button icon-only aria-label="文件"><vscode-icon name="file"></vscode-icon></vscode-button></div><p><vscode-button block secondary icon-after="arrow-right">全宽次要操作</vscode-button></p>`,
    '',
    220
  ),
  'button-form': demo(
    '提交、重置和普通操作',
    ['type=submit/reset/button', 'name/value、form 关联、点击反馈'],
    `<form><vscode-textfield name="project" default-value="初始项目" value="初始项目" aria-label="项目"></vscode-textfield><div class="variants"><vscode-button type="submit" name="action" value="save">提交</vscode-button><vscode-button type="reset" secondary>重置</vscode-button><vscode-button id="action" type="button">普通操作</vscode-button></div></form><output aria-live="polite"></output>`,
    formScript +
      `document.querySelector('#action').addEventListener('click', () => { document.querySelector('output').textContent = '普通操作不会提交表单'; });`
  ),
  'button-group-menu': demo(
    '分割按钮与更多操作',
    ['ButtonGroup 组合约束', '点击主操作、打开数据菜单、选择反馈'],
    `<vscode-button-group><vscode-button id="run" icon="play">运行任务</vscode-button><vscode-button id="more" icon="chevron-down" aria-label="更多任务"></vscode-button></vscode-button-group><vscode-context-menu></vscode-context-menu><output aria-live="polite"></output>`,
    `const menu=document.querySelector('vscode-context-menu');menu.data=[{label:'运行全部',value:'all'},{label:'调试任务',value:'debug'}];document.querySelector('#run').onclick=()=>document.querySelector('output').textContent='运行当前任务';document.querySelector('#more').onclick=event=>{event.stopPropagation();menu.show=true;};menu.addEventListener('vsc-context-menu-select',event=>document.querySelector('output').textContent=event.detail.value);`
  ),
  'icon-sizes': demo(
    '图标尺寸、速度与键盘操作',
    [
      '14 / 16 / 20 / 32 像素',
      'spin-duration、action-icon、label 与 vsc-click',
    ],
    `<div class="variants">${[14, 16, 20, 32].map((size) => `<vscode-icon name="file-code" size="${size}"></vscode-icon>`).join('')}<vscode-icon name="sync" spin spin-duration="3" size="24"></vscode-icon><vscode-icon name="add" action-icon label="新增文件"></vscode-icon></div><output aria-live="polite">聚焦新增图标，按 Enter 或空格。</output>`,
    `document.querySelector('[action-icon]').addEventListener('vsc-click',()=>document.querySelector('output').textContent='新增文件');`,
    160
  ),
  'divider-semantics': demo(
    '分隔语义与纯装饰',
    ['separator 的可访问语义', 'presentation 的装饰分隔'],
    `<p>操作组一</p><vscode-divider role="separator"></vscode-divider><p>操作组二</p><vscode-divider role="presentation"></vscode-divider><p>装饰分隔不进入可访问树。</p>`,
    '',
    230
  ),
  'progress-control': demo(
    '动态进度与长时间任务',
    [
      'value/max、边界限制、不确定进度',
      'long-running-threshold、ARIA 进度',
      '启动、完成与取消任务',
    ],
    `<vscode-progress-bar id="progress" value="0" max="200"></vscode-progress-bar><div class="variants"><vscode-button id="advance">推进 40</vscode-button><vscode-button id="busy" secondary>不确定进度</vscode-button><vscode-button id="done" secondary>完成</vscode-button></div><output aria-live="polite">0 / 200</output>`,
    `const progress=document.querySelector('#progress');document.querySelector('#advance').onclick=()=>{progress.indeterminate=false;progress.value=Math.min((progress.value||0)+40,200);document.querySelector('output').textContent=progress.value+' / 200';};document.querySelector('#busy').onclick=()=>{progress.longRunningThreshold=1000;progress.indeterminate=true;document.querySelector('output').textContent='处理中，1 秒后进入长时间模式';};document.querySelector('#done').onclick=()=>{progress.indeterminate=false;progress.value=200;document.querySelector('output').textContent='已完成';};`,
    200
  ),
  'progress-ring-task': demo(
    '可取消加载和可访问提示',
    ['aria-label、aria-live、role', '按任务状态显示/隐藏进度环'],
    `<vscode-button id="start">开始加载</vscode-button> <vscode-button id="cancel" secondary>取消</vscode-button><div id="loading" hidden><vscode-progress-ring aria-label="正在读取文件" aria-live="polite" role="status"></vscode-progress-ring>读取文件中</div><output aria-live="polite">等待操作</output>`,
    `document.querySelector('#start').onclick=()=>{document.querySelector('#loading').hidden=false;document.querySelector('output').textContent='加载中';};document.querySelector('#cancel').onclick=()=>{document.querySelector('#loading').hidden=true;document.querySelector('output').textContent='已取消';};`,
    200
  ),
  'textfield-types': demo(
    '文字、密码、邮件和数值约束',
    [
      'text/password/email/number',
      'autocomplete、placeholder、readonly、disabled',
      'required、pattern、min/max/step、minlength/maxlength',
    ],
    `<form class="stack"><vscode-textfield name="user" aria-label="用户名" placeholder="3 至 12 个字母" pattern="[A-Za-z]{3,12}" minlength="3" maxlength="12" required autocomplete="on"></vscode-textfield><vscode-textfield name="password" type="password" aria-label="密码" placeholder="密码" autocomplete="off"></vscode-textfield><vscode-textfield name="email" type="email" aria-label="邮箱" placeholder="mail@example.com"></vscode-textfield><vscode-textfield name="count" type="number" min="0" max="10" step="2" value="2" aria-label="数量"></vscode-textfield><vscode-textfield value="只读文字" readonly aria-label="只读"></vscode-textfield><vscode-textfield value="不可提交" disabled name="disabled" aria-label="禁用"></vscode-textfield><vscode-button type="submit">校验并提交</vscode-button></form><output aria-live="polite"></output>`,
    formScript,
    540
  ),
  'textfield-slots': demo(
    '前后插槽与自定义错误',
    [
      'content-before/content-after',
      'invalid、wrappedElement.setCustomValidity、reportValidity、validity',
      'input、change 与 wrappedElement',
    ],
    `<vscode-textfield id="path" aria-label="文件路径"><vscode-icon slot="content-before" name="folder"></vscode-icon><span slot="content-after">.ts</span></vscode-textfield><div class="variants"><vscode-button id="check">校验路径</vscode-button><vscode-button id="clear" secondary>清除错误</vscode-button></div><output aria-live="polite"></output>`,
    `const field=document.querySelector('#path');field.addEventListener('input',()=>{field.wrappedElement.setCustomValidity('');field.invalid=false;});document.querySelector('#check').onclick=()=>{field.wrappedElement.setCustomValidity(field.value.includes(' ')?'路径不能包含空格':'');field.invalid=!field.checkValidity();document.querySelector('output').textContent=field.validationMessage||'校验通过：'+field.wrappedElement.value;};document.querySelector('#clear').onclick=()=>{field.wrappedElement.setCustomValidity('');field.invalid=false;};`,
    220
  ),
  'textfield-file': demo(
    '文件与多文件选择',
    ['type=file、multiple', 'wrappedElement.files、安全限制'],
    `<vscode-label for="files">选择本地文件（仅显示名称）</vscode-label><vscode-textfield id="files" type="file" multiple></vscode-textfield><output aria-live="polite">不会上传文件。</output>`,
    `const field=document.querySelector('#files');field.addEventListener('change',()=>{document.querySelector('output').textContent=Array.from(field.wrappedElement.files||[]).map(file=>file.name).join('\\n');});`,
    200
  ),
  'textarea-variants': demo(
    '尺寸、只读、等宽与缩放',
    [
      'rows/cols、monospace、spellcheck',
      'resize=both/horizontal/vertical/none',
      'readonly、disabled、长度与必填校验',
    ],
    `<div class="columns"><div><vscode-label for="code">代码（可双向缩放）</vscode-label><vscode-textarea id="code" monospace resize="both" rows="4" cols="24"  value="const project = 'Nusys';"></vscode-textarea></div><div><vscode-label for="notes">说明（垂直缩放）</vscode-label><vscode-textarea id="notes" resize="vertical" required minlength="5" maxlength="80" rows="4" placeholder="5 至 80 个字符"></vscode-textarea></div><vscode-textarea aria-label="仅水平缩放" resize="horizontal" value="拖动右下角调整宽度"></vscode-textarea><vscode-textarea aria-label="只读" resize="none" readonly value="只读文档"></vscode-textarea><vscode-textarea aria-label="禁用" disabled value="禁用内容"></vscode-textarea></div><vscode-button id="check">检查说明</vscode-button><output aria-live="polite"></output>`,
    `document.querySelector('#check').onclick=()=>{const field=document.querySelector('#notes');document.querySelector('output').textContent=field.checkValidity()?'有效说明':field.validationMessage;};`,
    560
  ),
  'checkbox-form': demo(
    '开关、混合状态与表单',
    [
      'toggle、indeterminate、checked、default-checked',
      'required、disabled、input/change、FormData 和 reset',
    ],
    `<form><div class="stack"><vscode-checkbox name="agreement" value="yes" label="同意条款（必选）" required></vscode-checkbox><vscode-checkbox id="mixed" label="部分选中" indeterminate></vscode-checkbox><vscode-checkbox name="enabled" label="开关" toggle checked default-checked value="on"></vscode-checkbox><vscode-checkbox label="禁用开关" toggle disabled checked></vscode-checkbox></div><vscode-button type="submit">提交选择</vscode-button> <vscode-button type="reset" secondary>重置</vscode-button></form><output aria-live="polite"></output>`,
    formScript
  ),
  'choice-layouts': demo(
    '横纵布局与禁用选项',
    [
      'CheckboxGroup/RadioGroup 的 horizontal/vertical',
      '同名选项、禁用、初始状态与键盘导航',
    ],
    `<vscode-checkbox-group variant="horizontal" aria-label="横向复选"><vscode-checkbox label="HTML" checked></vscode-checkbox><vscode-checkbox label="Markdown"></vscode-checkbox><vscode-checkbox label="XML" disabled></vscode-checkbox></vscode-checkbox-group><vscode-checkbox-group variant="vertical" aria-label="纵向复选"><vscode-checkbox label="自动保存" toggle></vscode-checkbox><vscode-checkbox label="格式化" checked></vscode-checkbox></vscode-checkbox-group><vscode-radio-group variant="vertical" aria-label="语言"><vscode-radio name="language" label="中文" value="zh" checked default-checked></vscode-radio><vscode-radio name="language" label="英文" value="en"></vscode-radio><vscode-radio name="language" label="停用" disabled value="disabled"></vscode-radio></vscode-radio-group>`,
    '',
    380
  ),
  'radio-form': demo(
    '单选提交与默认恢复',
    [
      'name/value、checked/default-checked',
      'required、disabled、change 和表单重置',
    ],
    `<form><vscode-radio-group><vscode-radio name="mode" value="auto" label="自动" checked default-checked required></vscode-radio><vscode-radio name="mode" value="manual" label="手动"></vscode-radio><vscode-radio name="mode" value="locked" label="禁用" disabled></vscode-radio></vscode-radio-group><vscode-button type="submit">提交</vscode-button> <vscode-button type="reset" secondary>恢复默认</vscode-button></form><output aria-live="polite"></output>`,
    formScript,
    240
  ),
  'ribbon-menus': demo(
    '下拉、子菜单、面板与命令事件',
    [
      'button / splitButton / dropdown 三种按钮类型',
      '递归子菜单与返回导航、快捷键文字和分隔线',
      'Word 风格面板、列数、自定义沙箱内容',
      'vsc-ribbon-command 事件与 arguments 透传',
      '按钮、菜单项与弹层控件使用 Codicon 图标',
      '菜单分组标题与说明文字（箭头菜单与面板）',
      '图库式下拉面板：预览图、标题与说明组成的大尺寸格子',
      '仅含单个下拉按钮的分组在溢出时保留原有下拉菜单结构',
      '菜单项文字左对齐，方向键与 Escape 可操作',
      '分组右下角对话框启动器与 vsc-ribbon-dialog 事件',
      '可拖动 split-layout 父容器调整宽度与高度，并实时显示容器尺寸',
    ],
    `${ribbonResizeHtml('ribbon-menus', '<vscode-ribbon id="ribbon-menus" tablist-label="菜单示例"></vscode-ribbon>')}<output id="ribbon-menus-output" aria-live="polite">等待操作</output>`,
    `${ribbonResizeScript('ribbon-menus')}
const ribbon = document.querySelector('#ribbon-menus');
const galleryPreview = (label, accent) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="60"><rect width="96" height="60" fill="#ffffff"/><rect x="8" y="8" width="80" height="5" fill="' + accent + '"/><rect x="8" y="20" width="64" height="4" fill="#d0d0d0"/><rect x="8" y="30" width="72" height="4" fill="#dcdcdc"/><rect x="8" y="40" width="56" height="4" fill="#e4e4e4"/><text x="8" y="55" font-family="sans-serif" font-size="8" fill="#666666">' + label + '</text></svg>'
  );
ribbon.tabs = [
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
            arguments: ['current'],
            title: '保存',
            icon: 'save',
            menu: {items: [
              {command: 'save-as', title: '另存为', icon: 'save-as', keybinding: 'Ctrl+Shift+S'},
              {command: 'export-pdf', title: '导出 PDF', icon: 'file-pdf'}
            ]}
          },
          {
            type: 'dropdown',
            title: '板模板',
            icon: 'symbol-class',
            menu: {
              items: [
                {command: 'slab-ringlock', title: '盘扣式', icon: 'layers'},
                {command: 'slab-coupler', title: '扣件式', icon: 'layers', order: 20},
                {separator: true, title: '', order: 25},
                {command: 'slab-wall', title: '墙模板', icon: 'layout', order: 30},
                {
                  title: '更多体系',
                  icon: 'ellipsis',
                  order: 40,
                  menu: {items: [
                    {command: 'slab-portal', title: '门式脚手架', icon: 'layers'},
                    {title: '爬模（未实现）', icon: 'circle-slash', placeholder: true}
                  ]}
                }
              ]
            }
          },
          {
            type: 'dropdown',
            title: '插入图片',
            icon: 'file-media',
            menu: {
              items: [
                {heading: true, title: '插入图片来自', order: 5},
                {command: 'insert-local', title: '此设备…', icon: 'folder-opened', keybinding: 'D', order: 10},
                {command: 'insert-stock', title: '图像集…', icon: 'file-media', keybinding: 'S', order: 20},
                {command: 'insert-online', title: '联机图片…', icon: 'globe', keybinding: 'O', order: 30}
              ]
            }
          }
        ]
      },
      {
        id: 'norms',
        title: '规范',
        dialogLauncher: true,
        items: [
          {
            type: 'dropdown',
            title: '脚手架规范',
            icon: 'library',
            menu: {
              layout: 'panel',
              title: '选择脚手架体系',
              columns: 3,
              items: [
                {command: 'jgjt231', title: '盘扣式', icon: 'layers'},
                {command: 'jgj130', title: '扣件式', icon: 'library'},
                {command: 'jgj166', title: '碗扣式', icon: 'layers'},
                {command: 'jgj164', title: '木脚手架', icon: 'symbol-class'}
              ],
              custom: {
                html: '<p>面板下方可放置规范说明或图标图例，沙箱禁止脚本与网络请求。</p>',
                css: 'p{margin:0;color:var(--vscode-descriptionForeground,#999)}',
                width: 420,
                height: 56
              }
            }
          },
          {
            type: 'dropdown',
            title: '页边距',
            icon: 'layout',
            menu: {
              layout: 'panel',
              title: '页边距',
              columns: 1,
              items: [
                {heading: true, title: '上次的自定义设置', order: 1},
                {
                  command: 'margin-custom', title: '自定义', order: 2, icon: 'layout',
                  description: '上：2.5 厘米　下：2.5 厘米\\n左：2.5 厘米　右：2.5 厘米'
                },
                {heading: true, title: '预设页边距', order: 3},
                {
                  command: 'margin-normal', title: '常规', order: 4, icon: 'layout',
                  description: '上：2.54 厘米　下：2.54 厘米\\n左：3.18 厘米　右：3.18 厘米'
                },
                {
                  command: 'margin-narrow', title: '窄', order: 5, icon: 'layout',
                  description: '上：1.27 厘米　下：1.27 厘米\\n左：1.27 厘米　右：1.27 厘米'
                },
                {
                  command: 'margin-wide', title: '宽', order: 6, icon: 'layout',
                  description: '上：2.54 厘米　下：2.54 厘米\\n左：5.08 厘米　右：5.08 厘米'
                }
              ],
              footer: [
                {
                  command: 'custom-margins',
                  title: '自定义页边距(A)…',
                  icon: 'settings-gear',
                  keybinding: 'A'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'styles',
        title: '样式',
        dialogLauncher: true,
        items: [
          {
            type: 'dropdown',
            title: '样式库',
            icon: 'symbol-color',
            menu: {
              layout: 'gallery',
              title: '样式',
              columns: 4,
              items: [
                {heading: true, title: '内置样式', order: 1},
                {
                  command: 'style-normal', title: '正文', order: 2,
                  preview: galleryPreview('正文', '#2f6fb3')
                },
                {
                  command: 'style-heading-1', title: '标题 1', order: 3,
                  preview: galleryPreview('标题 1', '#1e7a4f')
                },
                {
                  command: 'style-heading-2', title: '标题 2', order: 4,
                  preview: galleryPreview('标题 2', '#8a5b00')
                },
                {
                  command: 'style-title', title: '标题', order: 5,
                  preview: galleryPreview('标题', '#7a2f8f')
                }
              ]
            }
          }
        ]
      }
    ]
  }
];
const output = document.querySelector('#ribbon-menus-output');
ribbon.addEventListener('vsc-ribbon-command', (event) => {
  output.textContent = '执行：' + event.detail.command + '，参数：' + JSON.stringify(event.detail.arguments);
});
ribbon.addEventListener('vsc-ribbon-select', (event) => {
  output.textContent = '标签：' + event.detail.tab.title;
});
ribbon.addEventListener('vsc-ribbon-dialog', (event) => {
  output.textContent = '打开对话框：' + event.detail.group.title;
});`,
    520,
    ribbonResizeCss
  ),
  'ribbon-responsive': demo(
    '响应式降级与分组折叠',
    [
      'responsive 尺寸链按批降档：full → half → third → 纯图标',
      '宽度不足时从右向左折叠功能组，分组入口保留原内容',
      '溢出弹层按原始布局完整呈现被折叠分组的按钮',
      '全部折叠后两端显示悬浮滚动按钮',
      '用嵌套 vscode-split-layout 作为可拖动父容器：右侧分隔条调宽度，下方分隔条调高度',
      '实时显示功能区容器尺寸，双击分隔条恢复初始值',
    ],
    `${ribbonResizeHtml('ribbon-responsive', '<vscode-ribbon id="ribbon-responsive" tablist-label="响应式功能区"></vscode-ribbon>')}<output id="ribbon-responsive-output" aria-live="polite">选择命令后在这里显示结果。</output>`,
    `${ribbonResizeScript('ribbon-responsive')}
const ribbon = document.querySelector('#ribbon-responsive');
ribbon.tabs = [
  {
    id: 'calc',
    title: '计算',
    default: true,
    groups: [
      {
        id: 'pit',
        title: '基坑与边坡',
        items: [
          {
            command: 'slope', title: '边坡稳定', icon: 'layers', size: 'full',
            responsive: [{size: 'half'}, {size: 'third'}, {size: 'third', style: 'icon'}]
          },
          {
            command: 'support', title: '围护支撑', icon: 'layers', size: 'full',
            responsive: [{size: 'half'}, {size: 'third'}, {size: 'third', style: 'icon'}]
          },
          {
            command: 'anchor', title: '加固锚固', icon: 'layers', size: 'full',
            responsive: [{size: 'half'}, {size: 'third'}, {size: 'third', style: 'icon'}]
          },
          {
            command: 'pile', title: '人工挖孔桩', icon: 'layers', size: 'full',
            responsive: [{size: 'half'}, {size: 'third'}, {size: 'third', style: 'icon'}]
          }
        ]
      },
      {
        id: 'tools',
        title: '工具',
        items: [
          {command: 'unit', title: '单位换算', icon: 'symbol-unit', size: 'half',
            responsive: [{size: 'third'}, {size: 'third', style: 'icon'}]},
          {command: 'density', title: '材料密度', icon: 'database', size: 'half',
            responsive: [{size: 'third'}, {size: 'third', style: 'icon'}]}
        ]
      }
    ]
  },
  {
    id: 'project',
    title: '项目',
    groups: [
      {
        id: 'files',
        title: '文件',
        items: [
          {command: 'open', title: '打开', icon: 'folder-opened', size: 'half',
            responsive: [{size: 'third'}, {size: 'third', style: 'icon'}]},
          {command: 'save', title: '保存', icon: 'save', size: 'half',
            responsive: [{size: 'third'}, {size: 'third', style: 'icon'}]}
        ]
      }
    ]
  }
];
ribbon.addEventListener('vsc-ribbon-command', (event) => {
  document.querySelector('#ribbon-responsive-output').textContent =
    '执行命令：' + event.detail.command + '（' + event.detail.item.title + '）';
});`,
    480,
    ribbonResizeCss
  ),
  'ribbon-overflow': demo(
    '完整布局切换为溢出下拉',
    [
      '仅使用普通按钮，不预置下拉、分割或响应式降级声明',
      '宽度不足时从右向左将整个功能组折叠为溢出下拉入口',
      '溢出入口使用分组图标与标题，弹层以 dialog 语义打开',
      '弹层按声明的原始布局完整重新呈现该组按钮',
      '弹层按钮保留图标、标题与尺寸，可直接执行命令',
      '重新拉宽父容器后分组自动展开并关闭溢出弹层',
    ],
    `${ribbonResizeHtml('ribbon-overflow', '<vscode-ribbon id="ribbon-overflow" tablist-label="溢出示例"></vscode-ribbon>')}<output id="ribbon-overflow-output" aria-live="polite">选择命令后在这里显示结果。</output>`,
    `${ribbonResizeScript('ribbon-overflow')}
const ribbon = document.querySelector('#ribbon-overflow');
ribbon.tabs = [
  {
    id: 'home',
    title: '开始',
    default: true,
    groups: [
      {
        id: 'file',
        title: '文件',
        items: [
          {command: 'open', title: '打开', icon: 'folder-opened'},
          {command: 'save', title: '保存', icon: 'save'},
          {command: 'save-as', title: '另存为', icon: 'save-as', size: 'half'}
        ]
      },
      {
        id: 'edit',
        title: '编辑',
        items: [
          {command: 'undo', title: '撤销', icon: 'discard'},
          {command: 'redo', title: '重做', icon: 'redo'}
        ]
      },
      {
        id: 'view',
        title: '视图',
        items: [
          {command: 'toggle-sidebar', title: '侧边栏', icon: 'layout-sidebar-left', size: 'half'},
          {command: 'toggle-terminal', title: '终端', icon: 'terminal', size: 'half'}
        ]
      }
    ]
  }
];
ribbon.addEventListener('vsc-ribbon-command', (event) => {
  document.querySelector('#ribbon-overflow-output').textContent =
    '执行命令：' + event.detail.command + '（' + event.detail.item.title + '）';
});`,
    520,
    ribbonResizeCss
  ),
  'ribbon-gallery': demo(
    '图库功能组与横向滚动',
    [
      'group.layout: gallery 将分组渲染为横向图库预览条',
      '图库项支持 preview 预览图、标题与命令，右侧滚动按钮可横向浏览',
      '图库分组随容器伸展，宽度不足时与其他分组一样折叠为溢出下拉入口',
      '折叠后的图库弹层保留全部预览格子，点击可继续执行命令',
      '对话框启动器与可拖动 split-layout 父容器同时可用',
    ],
    `${ribbonResizeHtml('ribbon-gallery', '<vscode-ribbon id="ribbon-gallery" tablist-label="图库示例"></vscode-ribbon>')}<output id="ribbon-gallery-output" aria-live="polite">选择命令后在这里显示结果。</output>`,
    `${ribbonResizeScript('ribbon-gallery')}
const ribbon = document.querySelector('#ribbon-gallery');
ribbon.tabs = [
  {
    id: 'design',
    title: '设计',
    default: true,
    groups: [
      {
        id: 'format',
        title: '文档格式',
        layout: 'gallery',
        dialogLauncher: {title: '打开文档格式设置', icon: 'settings-gear'},
        items: [
          {command: 'format-title', title: '标题', preview: ${JSON.stringify(galleryPreview('标题', '#1e7a4f'))}},
          {command: 'format-title-1', title: '标题 1', preview: ${JSON.stringify(galleryPreview('标题 1', '#2f6fb3'))}},
          {command: 'format-title-2', title: '标题 2', preview: ${JSON.stringify(galleryPreview('标题 2', '#8a5b00'))}},
          {command: 'format-subtitle', title: '副标题', preview: ${JSON.stringify(galleryPreview('副标题', '#7a2f8f'))}},
          {command: 'format-quote', title: '引用', preview: ${JSON.stringify(galleryPreview('引用', '#4a6f6f'))}},
          {command: 'format-list', title: '列表', preview: ${JSON.stringify(galleryPreview('列表', '#1e7a4f'))}},
          {command: 'format-normal', title: '正文', preview: ${JSON.stringify(galleryPreview('正文', '#555555'))}},
          {command: 'format-emphasis', title: '强调', preview: ${JSON.stringify(galleryPreview('强调', '#a33a2f'))}}
        ]
      },
      {
        id: 'theme',
        title: '主题',
        dialogLauncher: true,
        items: [
          {command: 'theme-light', title: '浅色', icon: 'color-mode', size: 'full'},
          {command: 'theme-dark', title: '深色', icon: 'color-mode', size: 'full'}
        ]
      }
    ]
  }
];
ribbon.addEventListener('vsc-ribbon-command', (event) => {
  document.querySelector('#ribbon-gallery-output').textContent =
    '执行命令：' + event.detail.command + '（' + event.detail.item.title + '）';
});
ribbon.addEventListener('vsc-ribbon-dialog', (event) => {
  document.querySelector('#ribbon-gallery-output').textContent =
    '打开对话框：' + event.detail.group.title;
});`,
    520,
    ribbonResizeCss
  ),
  'ribbon-state': demo(
    '折叠、选中与切换状态',
    [
      'collapsed / collapsible 与折叠按钮、双击标签折叠',
      'vsc-ribbon-collapse、vsc-ribbon-select 事件',
      'pressed 切换状态、disabled 与 placeholder 禁用项',
      'persist-state + storage-key 可跨刷新记忆折叠与活动标签',
      '可拖动 split-layout 父容器调整宽度与高度，并实时显示容器尺寸',
    ],
    `${ribbonResizeHtml('ribbon-state', '<vscode-ribbon id="ribbon-state" persist-state storage-key="docs-ribbon-state" tablist-label="状态示例"></vscode-ribbon>')}<output id="ribbon-state-output" aria-live="polite">等待操作</output>`,
    `${ribbonResizeScript('ribbon-state')}
const ribbon = document.querySelector('#ribbon-state');
const output = document.querySelector('#ribbon-state-output');
ribbon.tabs = [
  {
    id: 'home',
    title: '开始',
    default: true,
    groups: [
      {
        id: 'toggle', title: '切换', items: [
          {command: 'toggle-sidebar', title: '侧边栏', icon: 'layout-sidebar-left', size: 'half', pressed: true},
          {command: 'toggle-terminal', title: '终端', icon: 'terminal', size: 'half', pressed: false}
        ]
      },
      {
        id: 'states', title: '状态', items: [
          {command: 'locked', title: '不可用', icon: 'lock', size: 'half', disabled: true},
          {title: '未实现', icon: 'circle-slash', size: 'half', placeholder: true}
        ]
      }
    ]
  }
];
ribbon.addEventListener('vsc-ribbon-command', (event) => {
  output.textContent = '命令：' + event.detail.command;
});
ribbon.addEventListener('vsc-ribbon-select', (event) => {
  output.textContent = '选中标签：' + event.detail.tab.title;
});
ribbon.addEventListener('vsc-ribbon-collapse', (event) => {
  output.textContent = event.detail.collapsed ? '功能区已折叠' : '功能区已展开';
});`,
    520,
    ribbonResizeCss
  ),
};
