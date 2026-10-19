import {readdirSync, existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// 开发服务器启动优化：复用上一次构建产物跳过 pnpm docs:prepare 的完整构建。
// 组件源码变化由 scripts/docs-source-watch.mjs 在服务器启动后监听并自动重构建，
// 因此日常开发不需要每次启动都重新执行 tsc、cem analyze 与 API 生成。
const root = fileURLToPath(new URL('../', import.meta.url));
const assets = [
  'docs/public/assets/nusys-ui.js',
  'docs/public/assets/codicon.css',
  'docs/public/assets/codicon.ttf',
];
const apiDirectory = resolve(root, 'docs/api/generated');
const hasAssets = assets.every((asset) => existsSync(resolve(root, asset)));
const hasApi = existsSync(apiDirectory) && readdirSync(apiDirectory).length > 0;
const force = process.env.DOCS_FORCE_PREPARE === '1';

if (force || !hasAssets || !hasApi) {
  console.log(
    force
      ? 'DOCS_FORCE_PREPARE=1，执行完整的文档准备（docs:prepare）。'
      : '缺少文档构建产物，执行完整的文档准备（docs:prepare）。'
  );
  const prepared = spawnSync('pnpm', ['docs:prepare'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (prepared.status !== 0) {
    process.exit(prepared.status ?? 1);
  }
} else {
  console.log(
    '复用已有文档构建产物，跳过 docs:prepare；组件源码变化会自动重构建，需要刷新 API 页时请设置 DOCS_FORCE_PREPARE=1。'
  );
}

const dev = spawnSync(
  'pnpm',
  ['exec', 'vitepress', 'dev', 'docs', ...process.argv.slice(2)],
  {cwd: root, stdio: 'inherit', shell: true}
);
process.exit(dev.status ?? 1);
