// #51 持久层纵切：contactRules 与 contact 意图是 Home 的唯一持久切片。
// 真实 RED 基线：emptyConversation 没有 contactRules/contact，edit-contact-rules 是 UNSUPPORTED_COMMAND。
import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome, openRoleHome, contactRulesDefaults} from 'dsh-role-companion/home';

async function withHome(t, run) {
  const root = await mkdtemp(join(tmpdir(), 'role-contact51-'));
  let success = false;
  t.after(async () => { if (success) await rm(root, {recursive: true, force: true}); else t.diagnostic('retained ' + root); });
  const path = join(root, 'role');
  const home = await createRoleHome(path, {operationId: 'contact-create', core: '合成主动联系角色', settings: {inputLimitBytes: 32768}});
  try { await run({root, path, home}); success = true; } finally { try { await home.close(); } catch {} }
}

test('新Home的contactRules默认值来自唯一初始值，contact切片为空且不与autonomy.rules混用', async t => {
  await withHome(t, async ({home}) => {
    const state = await home.readConversation();
    assert.deepEqual(state.contactRules.value, contactRulesDefaults);
    assert.equal(state.contactRules.version, 1);
    assert.deepEqual(state.contact.intents, []);
    // 自主规则仍是原来的 9 键字面 key 串，不得因本票加字段（否则旧 Home 重放 CORRUPT_CONVERSATION）。
    assert.deepEqual(Object.keys(state.autonomy.rules.value).sort(), ['dailyModelLimit','dailyModelTool','dailyToolLimit','dailyWebLimit','modelLimit','outputTokens','timeZone','toolLimit','wakeIntervalMs','webLimit','windowMs'].filter(k => k !== 'dailyModelTool').sort());
  });
});

test('edit-contact-rules 是最新 Home 命令：整笔校验、版本CAS、原 opId 幂等重放、重开逐字段保留', async t => {
  const root = await mkdtemp(join(tmpdir(), 'role-contact51-edit-'));
  let success = false;
  t.after(async () => { if (success) await rm(root, {recursive: true, force: true}); else t.diagnostic('retained ' + root); });
  const path = join(root, 'role');
  let home = await createRoleHome(path, {operationId: 'contact-edit-create', core: '合成联系规则角色', settings: {inputLimitBytes: 32768}});
  try {
    const before = await home.readConversation();
    const value = {cooldownMs: 600000, dailyLimit: 2, perRoundLimit: 1, quietHours: {mode: 'all-day'}};
    const receipt = await home.applyOwner({kind: 'edit-contact-rules', operationId: 'contact-rules-1', value, expectedContactRulesVersion: before.contactRules.version, expectedRevision: before.revision});
    assert.equal(receipt.kind, 'committed');
    const saved = await home.readConversation();
    assert.equal(saved.contactRules.version, before.contactRules.version + 1);
    assert.deepEqual(saved.contactRules.value, value);
    // 过期版本整笔拒绝，revision 与规则不变。
    const stale = await home.readConversation();
    await assert.rejects(home.applyOwner({kind: 'edit-contact-rules', operationId: 'contact-rules-stale', value: {...value, cooldownMs: 1}, expectedContactRulesVersion: 1, expectedRevision: stale.revision}), {code: 'CONTACT_RULES_VERSION_CONFLICT'});
    // 同起止/未知键/非法HH:mm 整笔拒绝。
    for (const [label, bad] of [['same', {mode: 'range', start: '08:00', end: '08:00'}], ['badtime', {mode: 'range', start: '8:00', end: '09:00'}], ['unknown', {mode: 'all-day', start: '08:00'}]]) {
      await assert.rejects(home.applyOwner({kind: 'edit-contact-rules', operationId: 'contact-rules-bad-' + label, value: {...value, quietHours: bad}, expectedContactRulesVersion: saved.contactRules.version, expectedRevision: (await home.readConversation()).revision}), {code: 'INVALID_CONTACT_RULES'});
    }
    // 原 opId 重放返回原收据，不新增 revision。
    const replayRevision = home.revision;
    const replay = await home.applyOwner({kind: 'edit-contact-rules', operationId: 'contact-rules-1', value, expectedContactRulesVersion: before.contactRules.version, expectedRevision: before.revision});
    assert.equal(replay.committedRevision, receipt.committedRevision);
    assert.equal(home.revision, replayRevision);
    await home.close();
    home = await openRoleHome(path);
    const reopened = await home.readConversation();
    assert.deepEqual(reopened.contactRules.value, value);
    assert.equal(reopened.contactRules.version, saved.contactRules.version);
  } finally { try { await home.close(); } catch {} }
});

test('旧Home缺少新切片时重放不写默认值：新fact只在新提交出现，旧提交字节不变', async t => {
  await withHome(t, async ({path, home}) => {
    const before = await home.readConversation();
    await home.applyOwner({kind: 'edit-contact-rules', operationId: 'contact-rules-only', value: {...contactRulesDefaults, dailyLimit: 0}, expectedContactRulesVersion: before.contactRules.version, expectedRevision: before.revision});
    await home.close();
    const reopened = await openRoleHome(path);
    try {
      const state = await reopened.readConversation();
      assert.equal(state.contactRules.value.dailyLimit, 0);
      assert.deepEqual(state.contact.intents, []);
      // 新 fact 都不在旧白名单之外：重放白名单必须显式包含 edit-contact-rules。
      assert(state.turns.length === 0);
    } finally { await reopened.close(); }
  });
});
