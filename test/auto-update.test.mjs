import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {chmod,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {
  autoUpdateSpec,
  autoUpdateWorkerSource,
  bundledPnpmCommand,
  cancelPendingDesktopInstall,
  prepareAutoUpdateProfile,
  requestDesktopRelaunch,
  RoleCompanionAutoUpdater,
  validateAutoUpdateProfile,
} from 'dsh-role-companion';

const current = '1111111111111111111111111111111111111111';
const next = '2222222222222222222222222222222222222222';
const profile = Object.freeze({
  enabled: true,
  intervalMinutes: 15,
  version: 3,
  lastOperationId: 'auto-update-save',
});

test('固定 main 的精确 commit 并安装仓库子目录', () => {
  assert.equal(
    autoUpdateSpec(next),
    `git+https://github.com/Cinqsl/dsh-role-companion.git#${next}&path:packages/companion`,
  );
  assert.throws(() => autoUpdateSpec('main'), { code: 'INVALID_AUTO_UPDATE_COMMIT' });
});

test('自动更新发现新 commit 后排队到 DSH 退出后安装', async () => {
  const scheduled = [];
  const updater = new RoleCompanionAutoUpdater({
    profile: () => profile,
    manager: () => ({
      listBundles: async () => [{
        name: 'dsh-role-companion',
        source: `git+https://github.com/Cinqsl/dsh-role-companion.git#${current}&path:packages/companion`,
      }],
    }),
    profileDir: () => '/tmp/dsh-profile',
    runtimeVersion: () => '0.2.1-rc.2',
    appExecutable: () => '/Applications/Test.app/Contents/MacOS/Test',
    pnpmCommand: () => '/Applications/DSH/runtime/primary-runtime/dependencies/pnpm/bin/pnpm.mjs',
    parentPid: 4321,
    run: async () => `${next}\trefs/heads/main\n`,
    schedule: async request => {
      scheduled.push(request);
    },
    now: () => new Date('2026-10-31T12:00:00.000Z'),
  });

  const view = await updater.check();

  assert.equal(view.phase, 'scheduled');
  assert.equal(view.reason, 'INSTALL_ON_EXIT');
  assert.equal(view.currentCommit, current.slice(0, 12));
  assert.equal(view.remoteCommit, next.slice(0, 12));
  assert.equal(view.scheduledCommit, next.slice(0, 12));
  assert.equal(view.lastCheckedAt, '2026-10-31T12:00:00.000Z');
  assert.equal(view.lastScheduledAt, '2026-10-31T12:00:00.000Z');
  assert.deepEqual(scheduled, [{
    profileDir: '/tmp/dsh-profile',
    parentPid: 4321,
    spec: `git+https://github.com/Cinqsl/dsh-role-companion.git#${next}&path:packages/companion`,
    commit: next,
    runtimeVersion: '0.2.1-rc.2',
    appExecutable: '/Applications/Test.app/Contents/MacOS/Test',
    pnpmCommand: '/Applications/DSH/runtime/primary-runtime/dependencies/pnpm/bin/pnpm.mjs',
  }]);
});

test('相同 commit 不重复排队安装', async () => {
  let scheduled = 0;
  const updater = new RoleCompanionAutoUpdater({
    profile: () => profile,
    manager: () => ({
      listBundles: async () => [{
        name: 'dsh-role-companion',
        source: `git+https://github.com/Cinqsl/dsh-role-companion.git#${next}&path:packages/companion`,
      }],
    }),
    profileDir: () => '/tmp/dsh-profile',
    runtimeVersion: () => '0.2.1-rc.2',
    run: async () => `${next}\trefs/heads/main\n`,
    schedule: async () => {
      scheduled++;
    },
  });

  const view = await updater.check();

  assert.equal(view.phase, 'up-to-date');
  assert.equal(scheduled, 0);
});

test('短 commit 来源仍可确认 main 已安装', async () => {
  const updater = new RoleCompanionAutoUpdater({
    profile: () => profile,
    manager: () => ({
      listBundles: async () => [{
        name: 'dsh-role-companion',
        source: `github:Cinqsl/dsh-role-companion#${next.slice(0, 8)}&path:packages/companion`,
      }],
    }),
    profileDir: () => '/tmp/dsh-profile',
    runtimeVersion: () => '0.2.1-rc.2',
    run: async () => `${next}\trefs/heads/main\n`,
  });

  const view = await updater.check();

  assert.equal(view.phase, 'up-to-date');
  assert.equal(view.currentCommit, next.slice(0, 12));
});

test('本地未合并分支不会被自动覆盖', async () => {
  let scheduled = 0;
  const commands = [];
  const updater = new RoleCompanionAutoUpdater({
    profile: () => profile,
    manager: () => ({
      listBundles: async () => [{ name: 'dsh-role-companion', source: 'link:/tmp/role-worktree/packages/companion' }],
    }),
    profileDir: () => '/tmp/dsh-profile',
    runtimeVersion: () => '0.2.1-rc.2',
    run: async (_file, args) => {
      commands.push(args);
      if (args[0] === 'ls-remote') return `${next}\trefs/heads/main\n`;
      if (args.includes('merge-base')) throw Object.assign(new Error('not ancestor'), { code: 1 });
      if (args.at(-1) === 'HEAD') return `${current}\n`;
      return '';
    },
    schedule: async () => {
      scheduled++;
    },
  });

  const view = await updater.check();

  assert.equal(view.phase, 'blocked');
  assert.equal(view.reason, 'LOCAL_CHECKOUT_NOT_FAST_FORWARD');
  assert.equal(scheduled, 0);
  assert.equal(commands.some(args => args.includes('merge-base')), true);
});

test('本地 commit 已包含于 main 时允许排队更新', async () => {
  let scheduled = 0;
  const updater = new RoleCompanionAutoUpdater({
    profile: () => profile,
    manager: () => ({
      listBundles: async () => [{ name: 'dsh-role-companion', source: 'link:/tmp/role-worktree/packages/companion' }],
    }),
    profileDir: () => '/tmp/dsh-profile',
    runtimeVersion: () => '0.2.1-rc.2',
    run: async (_file, args) => {
      if (args[0] === 'ls-remote') return `${next}\trefs/heads/main\n`;
      if (args.at(-1) === 'HEAD') return `${current}\n`;
      return '';
    },
    schedule: async () => {
      scheduled++;
    },
  });

  const view = await updater.check();

  assert.equal(view.phase, 'scheduled');
  assert.equal(scheduled, 1);
});

test('一键更新会在安装队列后请求 DSH 退出以便自动重开', async () => {
  let relaunch = 0;
  let restart = 0;
  const updater = new RoleCompanionAutoUpdater({
    profile: () => profile,
    manager: () => ({
      listBundles: async () => [{
        name: 'dsh-role-companion',
        source: `git+https://github.com/Cinqsl/dsh-role-companion.git#${current}&path:packages/companion`,
      }],
    }),
    profileDir: () => '/tmp/dsh-profile',
    runtimeVersion: () => '0.2.1-rc.2',
    restartSupported: () => true,
    requestRelaunch: async () => {
      relaunch++;
    },
    restartDesktop: async () => {
      restart++;
    },
    run: async () => `${next}\trefs/heads/main\n`,
    schedule: async () => {},
  });

  const view = await updater.applyAndRestart();

  assert.equal(view.phase, 'scheduled');
  assert.equal(view.reason, 'RESTARTING');
  assert.equal(relaunch, 1);
  assert.equal(restart, 1);
});

test('自动重开标记十分钟后失效', async t => {
  const root=await mkdtemp(join(tmpdir(),'dsh-role-relaunch-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  await requestDesktopRelaunch(root,1_000);
  const marker=JSON.parse(await readFile(join(root,'.role-companion-update','relaunch.json'),'utf8'));
  assert.equal(marker.requestedAt,'1970-01-01T00:00:01.000Z');
  assert.equal(marker.expiresAt,601_000);
});

test('桌面 Host 使用自带 pnpm，旧的退出任务会被替换', async t => {
  assert.equal(
    bundledPnpmCommand(['/Applications/DeepSeek Harness', '/Applications/DSH/runtime/primary-runtime/dependencies/pnpm/bin/pnpm.mjs']),
    '/Applications/DSH/runtime/primary-runtime/dependencies/pnpm/bin/pnpm.mjs',
  );
  assert.equal(bundledPnpmCommand(['/opt/homebrew/bin/pnpm']),undefined);
  const root=await mkdtemp(join(tmpdir(),'dsh-role-pending-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const directory=join(root,'.role-companion-update');
  await mkdir(directory,{recursive:true});
  await writeFile(join(directory,'pending.json'),JSON.stringify({
    pid:99999999,
    parentPid:42,
  }));
  await cancelPendingDesktopInstall(root,42);
  await assert.rejects(readFile(join(directory,'pending.json')),{code:'ENOENT'});
});

test('更新规则整笔校验并拒绝旧版本', () => {
  const saved = prepareAutoUpdateProfile({
    enabled: false,
    intervalMinutes: 15,
    version: 2,
    lastOperationId: 'previous-update',
  }, {
    operationId: 'next-update',
    expectedVersion: 2,
    value: { enabled: true, intervalMinutes: 30 },
  });

  assert.deepEqual(saved, {
    enabled: true,
    intervalMinutes: 30,
    version: 3,
    lastOperationId: 'next-update',
  });
  assert.equal(validateAutoUpdateProfile(saved), true);
  assert.throws(() => prepareAutoUpdateProfile(saved, {
    operationId: 'stale-update',
    expectedVersion: 2,
    value: { enabled: false, intervalMinutes: 15 },
  }), { code: 'AUTO_UPDATE_VERSION_CONFLICT' });
  assert.throws(() => prepareAutoUpdateProfile(saved, {
    operationId: 'invalid-update',
    expectedVersion: 3,
    value: { enabled: true, intervalMinutes: 4 },
  }), { code: 'INVALID_AUTO_UPDATE' });
});

test('退出后安装失败恢复原清单与锁文件', {timeout:10000}, async t => {
  const root=await mkdtemp(join(tmpdir(),'dsh-role-update-worker-'));
  const profile=join(root,'profile');
  const bin=join(root,'bin');
  t.after(()=>rm(root,{recursive:true,force:true}));
  await mkdir(profile,{recursive:true});
  await mkdir(bin,{recursive:true});
  const packageText='{"name":"profile","private":true}\n';
  const lockText='lockfileVersion: 9.0\n';
  await writeFile(join(profile,'package.json'),packageText);
  await writeFile(join(profile,'pnpm-lock.yaml'),lockText);
  const fakePnpm=join(bin,'pnpm');
  await writeFile(fakePnpm,'#!/bin/sh\nprintf "broken" > package.json\nprintf "broken" > pnpm-lock.yaml\nexit 1\n');
  await chmod(fakePnpm,0o755);
  const request=Buffer.from(JSON.stringify({
    profileDir:profile,
    parentPid:99999999,
    spec:autoUpdateSpec(next),
    commit:next,
    runtimeVersion:'0.2.1-rc.2',
  })).toString('base64');

  const child=spawnSync(process.execPath,['--input-type=module','-e',autoUpdateWorkerSource],{
    env:{...process.env,PATH:`${bin}:${process.env.PATH}`,DSH_ROLE_COMPANION_UPDATE_REQUEST:request},
    encoding:'utf8',
    timeout:9000,
  });

  assert.equal(child.status,1,child.stderr);
  assert.equal(await readFile(join(profile,'package.json'),'utf8'),packageText);
  assert.equal(await readFile(join(profile,'pnpm-lock.yaml'),'utf8'),lockText);
  const result=JSON.parse(await readFile(join(profile,'.role-companion-update','last-run.json'),'utf8'));
  assert.equal(result.status,'failed');
  assert.equal(result.restored,true);
  assert.equal(result.commit,next);
});
