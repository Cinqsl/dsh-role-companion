import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {Context} from '@deepseek-ai/cordis';
import Loader from '@deepseek-ai/cordis-plugin-loader';
import Registry from '@deepseek-ai/dsh-typert-registry';
import Access from '@deepseek-ai/dsh-api-remote-access';
import Gateway from '@deepseek-ai/dsh-api-gateway';
import Inventory from '@deepseek-ai/dsh-host-plugin-inventory';
import Commands from '@deepseek-ai/dsh-commands';
import {Peer} from '@deepseek-ai/dsh-client-connection';
import * as plugin from 'dsh-role-companion';
import {TYPERT} from 'dsh-role-companion/typert';

async function roleFixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-library-cleanup-'));
  const ctx = new Context();
  t.after(async () => ctx.fiber.dispose());
  for (const candidate of [Loader, Registry, Access, Gateway, Inventory, Commands]) {
    await ctx.plugin(candidate);
  }
  ctx.typert.register(TYPERT);
  await ctx.plugin(plugin);
  const owner = new Peer(ctx, {principal: {kind: 'owner'}});
  const invoke = (method, args, peer = owner) =>
    ctx.typertGateway.invoke({peer, namespace: 'roleCompanion', method, args});
  const created = await invoke('createHome', {
    path: join(root, 'home'),
    request: {
      operationId: 'library-cleanup-create',
      core: '合成角色，用于清理维护测试。',
      settings: {inputLimitBytes: 32768},
    },
    expectedProfileVersion: 0,
  });
  return {
    ctx,
    invoke,
    owner,
    guard: {expectedRoleId: created.roleId, expectedBindingVersion: 1},
  };
}

test('维护读取跨页列出可清理来源与中文可读摘要', {timeout: 30000}, async t => {
  const {invoke, guard} = await roleFixture(t);
  const texts = [
    '第一段经历：雨停后去河边散步。',
    '第二段经历：整理了书架最上层的旧票根。',
    '第三段经历：在夜里重新读了一遍来信。',
  ];
  for (const [index, text] of texts.entries()) {
    await invoke('submitInput', {
      request: {
        ...guard,
        operationId: `library-cleanup-source-${index}`,
        clientRequestId: `library-cleanup-key-${index}`,
        text,
      },
    });
  }

  const first = await invoke('readMaintenance', {...guard, page: {offset: 0, limit: 2}});
  assert.equal(first.health.label, '运行状态待核对');
  assert.equal(first.cleanup.total, 3);
  assert.equal(first.cleanup.items.length, 2);
  assert.equal(first.cleanup.more, true);
  assert.ok(first.cleanup.items.every(item => item.kindLabel === '用户来信'));
  assert.ok(first.cleanup.items.every(item => item.preview.length <= 160));
  assert.ok(first.cleanup.items.every(item => item.state === 'available'));

  const second = await invoke('readMaintenance', {...guard, page: {offset: 2, limit: 2}});
  assert.equal(second.cleanup.total, 3);
  assert.equal(second.cleanup.items.length, 1);
  assert.equal(second.cleanup.more, false);
  assert.deepEqual(
    new Set([...first.cleanup.items, ...second.cleanup.items].map(item => item.preview)),
    new Set(texts),
  );
});
