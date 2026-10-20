// 标签栏和功能面板使用独立宽度，并展示菜单、折叠和事件状态。
export const ribbonSeparatedExample = {
  title: '标签栏与内容面板分离布局',
  features: [
    '标题栏左侧保留应用标识，标签栏向右偏移，面板从左侧开始',
    '独立调整标签栏和面板宽度，面板驱动响应式降级和滚动',
    '共享活动标签、折叠覆盖层、菜单状态与事件；可切换回一体布局',
    '方向键切换标签，向下进入面板，面板入口向上返回标签',
  ],
  height: 560,
  html: `<div class="separated-controls">
    <label>标签栏宽度 <input id="separated-tabs-width" type="range" min="130" max="680" value="420" /> <output id="separated-tabs-size">420px</output></label>
    <label>面板宽度 <input id="separated-panel-width" type="range" min="160" max="1000" value="760" /> <output id="separated-panel-size">760px</output></label>
    <vscode-button id="separated-toggle" secondary>切换为一体布局</vscode-button>
  </div>
  <div class="separated-workspace">
    <div class="separated-titlebar"><strong class="separated-brand" aria-label="应用标识">◆ NUSYS</strong><vscode-ribbon id="separated-ribbon" tablist-label="项目功能区"></vscode-ribbon></div>
    <vscode-ribbon-panel id="separated-panel"></vscode-ribbon-panel>
    <div class="separated-editor">工作区：折叠后选择标签，功能面板会在此区域上方展开。点击这里可关闭覆盖层。</div>
  </div>
  <output id="separated-events" aria-live="polite">等待操作</output>`,
  css: `.separated-controls { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
    .separated-controls label { display:flex; align-items:center; gap:6px; }
    .separated-workspace { overflow-x:auto; padding-bottom:8px; }
    .separated-titlebar { display:flex; align-items:start; width:max-content; min-width:100%; background:var(--vscode-titleBar-activeBackground, var(--vscode-editor-background)); }
    .separated-brand { display:flex; align-items:center; flex:none; width:110px; min-height:32px; padding-left:8px; box-sizing:border-box; }
    #separated-ribbon { width:420px; flex:none; }
    #separated-panel { width:760px; }
    .separated-editor { padding:20px 8px; min-height:120px; border:1px solid var(--vscode-panel-border); }
    #separated-events { display:block; margin-top:12px; }`,
  js: `const ribbon = document.querySelector('#separated-ribbon');
const panel = document.querySelector('#separated-panel');
ribbon.panel = panel;
ribbon.tabs = [
  {id:'home', title:'开始', groups:[
    {id:'files', title:'文件', dialogLauncher:{title:'文件设置'}, items:[
      {title:'保存', command:'save', icon:'save', type:'splitButton', menu:{items:[{title:'另存为', command:'save-as'}]}},
      {title:'打开', command:'open', icon:'folder-opened'},
      {title:'不可用', command:'disabled', icon:'lock', disabled:true}
    ]},
    {id:'menus', title:'菜单与面板', items:[
      {title:'多层菜单', type:'dropdown', icon:'list-tree', menu:{items:[
        {title:'父 flyout', submenuMode:'flyout', menu:{items:[
          {title:'替换子菜单', menu:{items:[{title:'嵌套命令', command:'nested'}]}}
        ]}}
      ]}},
      {title:'设置面板', type:'dropdown', icon:'settings-gear', menu:{layout:'panel', title:'项目设置', items:[{title:'配置项目', command:'configure'}], footer:[{title:'全部设置', command:'settings'}]}},
      {title:'选择样式', type:'dropdown', icon:'symbol-color', menu:{layout:'gallery', columns:2, items:[{title:'默认样式', command:'style-default', icon:'symbol-color'}, {title:'强调样式', command:'style-accent', icon:'paintcan'}]}}
    ]},
    {id:'edit', title:'编辑', items:[
      {title:'撤销', command:'undo', icon:'discard'},
      {title:'重做', command:'redo', icon:'redo'},
      {title:'复制', command:'copy', icon:'copy'}
    ]}
  ]},
  {id:'insert', title:'插入', groups:[{id:'insert', title:'插入内容', items:[{title:'新建文件', command:'new', icon:'new-file'}, {title:'图片', command:'image', icon:'file-media'}]}]},
  {id:'review', title:'审阅与项目管理', groups:[{id:'review', title:'审阅', items:[{title:'检查', command:'check', icon:'check'}]}]}
];
const counts = {select:0, collapse:0, command:0, dialog:0};
for (const type of Object.keys(counts)) {
  ribbon.addEventListener('vsc-ribbon-' + type, (event) => {
    counts[type]++;
    document.querySelector('#separated-events').textContent = '事件次数：' + JSON.stringify(counts) + '；最近：' + (event.detail.command || event.detail.tabId || (event.detail.collapsed === undefined ? '对话框' : event.detail.collapsed ? '折叠' : '展开'));
  });
}
for (const [key, target] of [['tabs', ribbon], ['panel', panel]]) {
  document.querySelector('#separated-' + key + '-width').addEventListener('input', (event) => {
    target.style.width = event.target.value + 'px';
    document.querySelector('#separated-' + key + '-size').textContent = event.target.value + 'px';
  });
}
document.querySelector('#separated-toggle').addEventListener('click', (event) => {
  ribbon.panel = ribbon.panel ? null : panel;
  event.currentTarget.textContent = ribbon.panel ? '切换为一体布局' : '切换为分离布局';
});`,
};
