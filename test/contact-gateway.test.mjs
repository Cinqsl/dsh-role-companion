// #51 新 Remote 全部走真实 Gateway owner 鉴权：guest、缺身份、跨 Role、旧绑定、伪造 actor 全拒且无写入。
import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
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

test('真实Gateway：联系规则读取/保存、状态与意图全文按 owner/Role/绑定鉴权，原操作幂等重放', {timeout: 40000}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'role-contact-gateway51-')); let success = false;
  const ctx = new Context();
  t.after(async () => { await ctx.fiber.dispose(); if (success) await rm(root, {recursive: true, force: true}); else t.diagnostic('retained ' + root); });
  for (const p of [Loader, Registry, Access, Gateway, Inventory, Commands]) await ctx.plugin(p);
  ctx.typert.register(TYPERT); await ctx.plugin(plugin);
  const owner = new Peer(ctx, {principal: {kind: 'owner'}}), guest = new Peer(ctx, {principal: {kind: 'contact-guest'}});
  const invoke = (method, args, peer = owner) => ctx.typertGateway.invoke({peer, namespace: 'roleCompanion', method, args});
  const created = await invoke('createHome', {path: join(root, 'role'), request: {operationId: 'contact-create-gw', core: '合成联系面板角色', settings: {inputLimitBytes: 32768}}, expectedProfileVersion: 0});
  const guard = {expectedRoleId: created.roleId, expectedBindingVersion: 1};
  // The default rules are the confirmed runtime defaults, read through the authenticated owner path.
  const rules = await invoke('readContactRules', guard);
  assert.equal(rules.version, 1);
  assert.deepEqual(rules.value, {cooldownMs: 7200000, dailyLimit: 3, perRoundLimit: 1, quietHours: {mode: 'range', start: '23:00', end: '08:00'}});
  assert.equal(rules.effectiveFrom, 'next-contact-attempt');
  assert.equal(rules.roleId, created.roleId);
  const state = await invoke('readContactState', guard);
  assert.equal(state.usage.dailyLimit, 3);
  assert.equal(state.usage.dayUsed, 0);
  assert.equal(state.totalIntents, 0);
  assert.equal(state.deliveryPath, 'mechanism-verified-real-choice-not-run');
  // A legal edit lands in the single Home owner and is idempotent for the same operation id.
  const value = {cooldownMs: 600000, dailyLimit: 2, perRoundLimit: 1, quietHours: {mode: 'off'}};
  const request = {operationId: 'contact-rules-gw', value, expectedContactRulesVersion: rules.version, expectedRevision: rules.revision};
  const receipt = await invoke('editContactRules', {...guard, request});
  assert.equal(receipt.kind, 'committed');
  const after = await invoke('readContactRules', guard);
  assert.deepEqual(after.value, value);
  assert.equal(after.version, rules.version + 1);
  assert.equal((await invoke('editContactRules', {...guard, request})).committedRevision, receipt.committedRevision);
  // Stale version conflict rejects the whole edit.
  await assert.rejects(invoke('editContactRules', {...guard, request: {...request, operationId: 'contact-rules-stale-gw', value: {...value, dailyLimit: 1}, expectedContactRulesVersion: rules.version}}), e => e.details.reason === 'CONTACT_RULES_VERSION_CONFLICT');
  // Invalid values are rejected before any write.
  const invalid = [['same-start-end', {mode: 'range', start: '08:00', end: '08:00'}], ['bad-hhmm', {mode: 'range', start: '8:00', end: '09:00'}], ['negative', {mode: 'off'}]];
  for (const [label, quietHours] of invalid) {
    const operationId = 'contact-invalid-' + label;
    const candidate = label === 'negative' ? {...value, dailyLimit: -1, quietHours} : {...value, quietHours};
    await assert.rejects(invoke('editContactRules', {...guard, request: {operationId, value: candidate, expectedContactRulesVersion: after.version, expectedRevision: after.revision}}), e => e.details.reason === 'INVALID_CONTACT_RULES');
    assert.equal((await invoke('readOperation', {operationId, expectedRoleId: created.roleId})).kind, 'not-found');
  }
  // Owner authentication covers every new method: guest, missing identity, forged actor, cross-role, stale binding.
  const methods = [
    ['readContactRules', {}],
    ['readContactState', {}],
    ['editContactRules', {request: {operationId: 'contact-guest-edit', value, expectedContactRulesVersion: after.version, expectedRevision: after.revision}}],
    ['readContactIntent', {request: {intentId: 'contact-intent-missing-1', revision: after.revision, contentDigest: 'a'.repeat(64), offset: 0, limit: 100}}]
  ];
  ctx.remoteAccess.registerPolicy('contact-guest', {bindings: () => [{role: {name: 'contact-guest', resource: 'global', actions: methods.map(([method]) => 'roleCompanion/' + method)}, resource: {kind: 'global'}}]});
  let guardRejections = 0;
  for (const [method, extra] of methods) {
    const args = {...guard, ...extra};
    await assert.rejects(invoke(method, args, guest), e => e.code === 'role/owner-required'); guardRejections++;
    await assert.rejects(ctx.roleCompanion[method](...Object.values(args)), e => e.code === 'role/owner-required'); guardRejections++;
    await assert.rejects(ctx.typertGateway.invoke({namespace: 'roleCompanion', method, args: {...args, actor: 'owner'}})); guardRejections++;
    await assert.rejects(invoke(method, {...args, expectedRoleId: 'role-00000000-0000-4000-8000-000000000000'}), e => e.details.reason === 'ROLE_CHANGED'); guardRejections++;
    await assert.rejects(invoke(method, {...args, expectedBindingVersion: 2}), e => e.details.reason === 'BINDING_CHANGED'); guardRejections++;
  }
  // No negative case wrote anything.
  assert.deepEqual(await invoke('readContactRules', guard), after);
  const final = await invoke('readContactState', guard);
  assert.equal(final.totalIntents, 0);
  if (process.env.DSH51_EVIDENCE_DIRECTORY) {
    const {mkdir, writeFile} = await import('node:fs/promises');
    await mkdir(process.env.DSH51_EVIDENCE_DIRECTORY, {recursive: true});
    await writeFile(join(process.env.DSH51_EVIDENCE_DIRECTORY, 'gateway-contact.json'), JSON.stringify({roleId: created.roleId, rules, after, state, final, receipt, guardRejections, realBusinessCalls: {model: 0, web: 0, qq: 0}}, null, 2) + '\n');
  }
  success = true;
});
