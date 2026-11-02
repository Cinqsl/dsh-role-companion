// #51 恢复语义：unknown 不返还也不重发；重启保留规则/意图/发件；同一意图永不产生第二条 delivery。
import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {contactFixture, proposalTurnExecution, waitFor} from './contact-runtime-fixture.mjs';
import {openRoleHome, previewDelivery, contactRulesDefaults} from 'dsh-role-companion/home';
import {createNodeClock} from 'dsh-role-companion/runtime';

const proposal = (text, topic = '分享今晚的星图') => (plan, n) => ({kind: 'contact', topic: topic + ' ' + n, expectedVersion: 0, text, statement: 'role-choice', sources: [{ref: {kind: 'core'}, quote: '探索星图'}], scope: '本次机会', reason: '想和用户交流刚整理的观察'});
async function opportunity(f) {
  const before = (await f.state()).turns.filter(t => t.source === 'autonomous').length;
  const receipt = await f.role.runtime.wake({reason: 'controlled-contact-opportunity'});
  if (receipt.kind === 'skipped') return {skipped: receipt.reason};
  await waitFor(async () => (await f.state()).turns.filter(t => t.source === 'autonomous' && t.status === 'finished').length > before, 'autonomous turn finished');
  return {receipt};
}

test('发送结果不明不自动重发、计数不返还：unknown 后意图为 unknown，wire 恒为1，重开不重发', {timeout: 90000}, async t => {
  const utc = '2026-10-27T01:30:00.000Z';
  const clock = createNodeClock(() => new Date(utc));
  // The OneBot adapter marks a missing/unsafe message_id as unknown: the local effect is not proven.
  const f = await contactFixture(t, {clock, utc, preserveHome: true, respond: (socket, request) => socket.send(JSON.stringify({status: 'failed', retcode: 1200, echo: request.echo, data: null})), execution: proposalTurnExecution({proposalText: proposal('结果不明的主动联系')})});
  await opportunity(f);
  const state = await waitFor(async () => { const s = await f.state(); const a = s.sendAttempts.find(x => x.source === 'contact'); return a?.observation ? s : null; }, 'unknown contact settled');
  const attempt = state.sendAttempts.find(a => a.source === 'contact');
  assert.equal(attempt.observation.kind, 'unknown', 'a failed provider response is an unknown outcome');
  assert.equal(state.contact.intents[0].state, 'unknown', 'the intent mirrors the send result; it is not reopened');
  assert.equal(state.deliveries.find(d => d.qualification === 'contact').status, 'unknown');
  assert.equal(f.sends().length, 1, 'exactly one wire send');
  // Wait a while: no automatic resend for an unknown result.
  await new Promise(r => setTimeout(r, 800));
  assert.equal(f.sends().length, 1, 'unknown is never retried automatically');
  // Reopen the same Home in a new runtime: the unknown attempt stays charged and is not resent.
  const path = f.homePath;
  f.role.lifetime.requestStop('unload'); await f.role.lifetime.stopped;
  const reopened = await openRoleHome(path);
  try {
    const fresh = await reopened.readConversation();
    assert.equal(fresh.sendAttempts.filter(a => a.source === 'contact').length, 1);
    assert.equal(fresh.contact.intents[0].state, 'unknown');
    assert.equal(fresh.deliveries.find(d => d.qualification === 'contact').status, 'unknown');
    assert.deepEqual(fresh.contactRules.value, contactRulesDefaults);
  } finally { await reopened.close(); }
});

test('规则合法新值→实际效果→重启逐字段保留；过期版本冲突整笔拒绝且revision不变', {timeout: 60000}, async t => {
  const f = await contactFixture(t, {utc: '2026-10-27T01:30:00.000Z', execution: proposalTurnExecution({proposalText: proposal('规则持久化测试')})});
  const before = await f.role.owner.readContactRules();
  const value = {cooldownMs: 900000, dailyLimit: 2, perRoundLimit: 1, quietHours: {mode: 'off'}};
  const receipt = await f.role.owner.apply({kind: 'edit-contact-rules', operationId: 'contact-rules-apply', value, expectedContactRulesVersion: before.version, expectedRevision: (await f.home.readSnapshot()).revision});
  assert.equal(receipt.kind, 'committed');
  const after = await f.role.owner.readContactRules();
  assert.deepEqual(after.value, value);
  assert.equal(after.version, before.version + 1);
  // Stale version is rejected as a whole; no partial write.
  const stale = await f.role.owner.apply({kind: 'edit-contact-rules', operationId: 'contact-rules-stale', value: {...value, dailyLimit: 1}, expectedContactRulesVersion: before.version, expectedRevision: (await f.home.readSnapshot()).revision}).catch(e => e);
  assert.equal(stale.code, 'CONTACT_RULES_VERSION_CONFLICT');
  assert.deepEqual((await f.role.owner.readContactRules()).value, value);
  assert.deepEqual((await f.role.owner.readContactRules()).version, after.version);
  // A rejected invalid value leaves everything unchanged.
  const invalid = await f.role.owner.apply({kind: 'edit-contact-rules', operationId: 'contact-rules-invalid', value: {...value, quietHours: {mode: 'range', start: '08:00', end: '08:00'}}, expectedContactRulesVersion: after.version, expectedRevision: (await f.home.readSnapshot()).revision}).catch(e => e);
  assert.equal(invalid.code, 'INVALID_CONTACT_RULES');
  assert.deepEqual((await f.role.owner.readContactRules()).value, value);
  // Restart keeps the exact rule value.
  const path = f.homePath;
  f.role.lifetime.requestStop('unload'); await f.role.lifetime.stopped;
  const reopened = await openRoleHome(path);
  try { assert.deepEqual((await reopened.readContactRules()).value, value); }
  finally { await reopened.close(); }
});
