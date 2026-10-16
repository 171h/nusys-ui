import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'vitest';

import {
  getRemoteTagObjectId,
  renderChangelog,
  resolveVersion,
  resolveVersionTag,
  updateChangelog,
} from './release-lib.mjs';
import {
  buildReleasePushArgs,
  confirm,
  confirmTagOverwrite,
  promptVersionTag,
} from './release.mjs';
import {extractReleaseNotes} from './extract-release-notes.mjs';

function stubReadline(...answers) {
  const questions = [];
  return {
    questions,
    rl: {
      async question(question) {
        questions.push(question);
        return answers.shift() ?? '';
      },
    },
  };
}

test('resolveVersion accepts release types and explicit versions', () => {
  assert.equal(resolveVersion('2.5.1', 'patch'), '2.5.2');
  assert.equal(resolveVersion('2.5.1', 'minor'), '2.6.0');
  assert.equal(resolveVersion('2.5.1', 'v3.0.0'), '3.0.0');
  assert.throws(() => resolveVersion('2.5.1', '2.5.0'), /Invalid version/);
});

test('resolveVersionTag validates and normalizes release tags', () => {
  assert.deepEqual(resolveVersionTag('2.5.1', 'v2.6.0'), {
    tag: 'v2.6.0',
    version: '2.6.0',
  });
  assert.deepEqual(resolveVersionTag('2.5.1', 'v2.5.1'), {
    tag: 'v2.5.1',
    version: '2.5.1',
  });
  assert.throws(() => resolveVersionTag('2.5.1', '2.6.0'), /start with v/);
  assert.throws(() => resolveVersionTag('2.5.1', 'v2.5.0'), /not older/);
  assert.throws(() => resolveVersionTag('2.5.1', 'vnext'), /semantic version/);
});

test('promptVersionTag asks for and returns the final version tag', async () => {
  const {rl, questions} = stubReadline('v2.7.0');
  assert.deepEqual(await promptVersionTag(rl, '2.5.1', 'minor'), {
    tag: 'v2.7.0',
    version: '2.7.0',
  });
  assert.deepEqual(questions, ['Version tag [v2.6.0]: ']);
});

test('promptVersionTag uses the suggestion when Enter is pressed', async () => {
  const {rl} = stubReadline('');
  assert.deepEqual(await promptVersionTag(rl, '2.5.1'), {
    tag: 'v2.5.2',
    version: '2.5.2',
  });
});

test('confirm defaults to no and accepts an explicit yes', async () => {
  assert.equal(await confirm(stubReadline('').rl, 'Release?'), false);
  assert.equal(await confirm(stubReadline('yes').rl, 'Release?'), true);
});

test('覆盖已有标签必须输入 y，其他输入默认取消', async () => {
  for (const [local, remote] of [
    [true, false],
    [false, true],
    [true, true],
  ]) {
    for (const answer of ['', 'n', 'yes', 'overwrite']) {
      assert.equal(
        await confirmTagOverwrite(
          stubReadline(answer).rl,
          'v2.6.0',
          local,
          remote
        ),
        false
      );
    }
    const {rl, questions} = stubReadline(' y ');
    assert.equal(await confirmTagOverwrite(rl, 'v2.6.0', local, remote), true);
    assert.match(questions[0], /v2\.6\.0.*请输入 y 确认/);
    if (local) assert.match(questions[0], /本地/);
    if (remote) assert.match(questions[0], /origin 远程/);
  }
  const {rl, questions} = stubReadline();
  assert.equal(await confirmTagOverwrite(rl, 'v2.6.0', false, false), true);
  assert.deepEqual(questions, []);
});

test('远程查询失败保留 Git 错误，不将连接失败视为标签不存在', () => {
  const failure = Object.assign(new Error('Git failed'), {
    status: 128,
    stderr: Buffer.from('fatal: Could not connect to server'),
  });
  assert.throws(
    () =>
      getRemoteTagObjectId('v2.6.0', () => {
        throw failure;
      }),
    (error) => {
      assert.match(error.message, /无法查询 origin 上的标签 v2\.6\.0/);
      assert.match(error.message, /Could not connect to server/);
      assert.equal(error.cause, failure);
      return true;
    }
  );
  assert.equal(
    getRemoteTagObjectId('v2.6.0', () => {
      throw {status: 2};
    }),
    ''
  );
});

test('真实 Git 远程标签支持确认后覆盖，并拒绝覆盖并发修改', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-tags-'));
  t.onTestFinished(() => fs.rmSync(directory, {recursive: true, force: true}));
  const remote = path.join(directory, 'origin.git');
  const worktree = path.join(directory, 'worktree');
  const run = (cwd, args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  run(directory, ['init', '--bare', remote]);
  run(directory, ['init', '--initial-branch=main', worktree]);
  const runGit = (args) => run(worktree, args);
  runGit(['config', 'user.name', '发布测试']);
  runGit(['config', 'user.email', 'release@example.invalid']);
  runGit(['config', 'commit.gpgsign', 'false']);
  runGit(['config', 'tag.gpgsign', 'false']);
  runGit(['remote', 'add', 'origin', remote]);
  runGit(['commit', '--allow-empty', '-m', 'chore: 初始化测试']);
  assert.equal(getRemoteTagObjectId('v2.6.0', runGit), '');
  runGit(['tag', '-a', 'v2.6.0', '-m', '首次标签']);
  runGit(buildReleasePushArgs('main', 'v2.6.0'));
  const originalId = getRemoteTagObjectId('v2.6.0', runGit);
  assert.equal(originalId, runGit(['rev-parse', 'refs/tags/v2.6.0']));
  assert.notEqual(originalId, runGit(['rev-parse', 'refs/tags/v2.6.0^{}']));

  assert.equal(
    await confirmTagOverwrite(stubReadline('y').rl, 'v2.6.0', true, true),
    true
  );
  runGit(['commit', '--allow-empty', '-m', 'fix: 更新测试']);
  runGit(['tag', '--force', '-a', 'v2.6.0', '-m', '替换标签']);
  runGit(buildReleasePushArgs('main', 'v2.6.0', originalId));
  const updatedId = getRemoteTagObjectId('v2.6.0', runGit);
  assert.equal(updatedId, runGit(['rev-parse', 'refs/tags/v2.6.0']));
  assert.notEqual(updatedId, originalId);

  const remoteHead = run(remote, ['rev-parse', 'refs/heads/main']);
  run(remote, ['update-ref', 'refs/tags/v2.6.0', originalId]);
  runGit(['commit', '--allow-empty', '-m', 'fix: 后续测试']);
  runGit(['tag', '--force', '-a', 'v2.6.0', '-m', '再次替换标签']);
  assert.throws(() =>
    runGit(buildReleasePushArgs('main', 'v2.6.0', updatedId))
  );
  assert.equal(getRemoteTagObjectId('v2.6.0', runGit), originalId);
  assert.equal(run(remote, ['rev-parse', 'refs/heads/main']), remoteHead);
});

test('buildReleasePushArgs pushes branch and tag atomically', () => {
  assert.deepEqual(buildReleasePushArgs('main', 'v2.6.0'), [
    'push',
    '--atomic',
    'origin',
    'refs/heads/main:refs/heads/main',
    'refs/tags/v2.6.0:refs/tags/v2.6.0',
  ]);
  assert.deepEqual(buildReleasePushArgs('main', 'v2.6.0', 'abc123'), [
    'push',
    '--atomic',
    '--force-with-lease=refs/tags/v2.6.0:abc123',
    'origin',
    'refs/heads/main:refs/heads/main',
    'refs/tags/v2.6.0:refs/tags/v2.6.0',
  ]);
});

test('extractReleaseNotes returns only the requested release body', () => {
  const changelog = `# 变更日志

## [2.6.0] - 2026-09-01

### 新增

- 新增发布工作流。

## [2.5.1] - 2026-02-21

- 此前的发布。
`;
  assert.equal(
    extractReleaseNotes(changelog, '2.6.0'),
    '### 新增\n\n- 新增发布工作流。'
  );
});

test('renderChangelog groups conventional commits', () => {
  const result = renderChangelog(
    '2.6.0',
    [
      {
        hash: 'abc1234',
        type: 'feat',
        scope: 'button',
        subject: '添加忙碌状态',
      },
      {
        hash: 'def5678',
        type: 'fix',
        scope: '',
        subject: '修复焦点处理',
      },
    ],
    new Date('2026-09-01T00:00:00Z')
  );
  assert.match(result, /^## \[2\.6\.0\] - 2026-09-01/);
  assert.match(
    result,
    /### 新增\n\n- \*\*button\*\*: 添加忙碌状态 \(abc1234\)/
  );
  assert.match(result, /### 修复\n\n- 修复焦点处理 \(def5678\)/);
});

test('renderChangelog uses Chinese when there are no changes', () => {
  assert.equal(
    renderChangelog('3.3.1', [], new Date('2026-10-02T00:00:00Z')),
    '## [3.3.1] - 2026-10-02\n\n- 无面向用户的变更。\n'
  );
});

test('updateChangelog writes release notes and preserves previous releases', (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'release-changelog-')
  );
  t.onTestFinished(() => fs.rmSync(directory, {recursive: true, force: true}));
  const filePath = path.join(directory, 'CHANGELOG.md');
  const header = '# 变更日志\n\n记录所有重要变更。\n\n';
  const previous = '## [3.0.0] - 2026-09-02\n\n- 此前的发布。\n';
  fs.writeFileSync(filePath, header + previous);

  updateChangelog(
    '3.0.1',
    [
      {
        hash: 'abc1234',
        type: 'fix',
        scope: 'release',
        subject: '使用 NPM_TOKEN',
      },
    ],
    filePath
  );

  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(content.startsWith(`${header}## [3.0.1] - `));
  assert.ok(content.endsWith(previous));
  assert.equal(
    extractReleaseNotes(content, '3.0.1'),
    '### 修复\n\n- **release**: 使用 NPM_TOKEN (abc1234)'
  );
  assert.equal(extractReleaseNotes(content, '3.0.0'), '- 此前的发布。');
  assert.throws(() => extractReleaseNotes(content, '3.0.2'), /was not found/);
});
