// #51 联系提议 → 意图：结构化 contact 提议采用后只产生意图（+至多一条 pending delivery），绝不直接发信。
// 真实 RED 基线：processProposal 采用后没有 contact 切片、没有 delivery；本用例断言两者。
import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome, prepareContactDelivery, previewDelivery, previewReply, longContactMarker} from 'dsh-role-companion/home';

const core = '合成主动联系角色，探索星图。';
function proposalText(intentSentence = '如果合适，想和用户说说今晚的星图。') { return {kind: 'contact', topic: '想交流星图', expectedVersion: 0, text: intentSentence, statement: 'role-choice', sources: [{ref: {kind: 'core'}, quote: '探索星图'}], scope: '本次机会', reason: '想分享刚整理的观察，不虚构已完成'}; }

/** Drive one autonomous turn that proposes `contact`, then adopt it through the real Home path. */
async function contactTurn(t, {home, stamp, proposal = proposalText(), adopt = true}) {
  await home.requestWake({operationId: 'contact-wake', reason: 'controlled-contact-opportunity', stamp});
  const turn = await home.beginAutonomous({operationId: 'contact-begin', runId: 'run-contact', expectedRevision: home.revision, now: stamp.clock.utc, stamp});
  const attempt = await home.reserveAttempt({operationId: 'contact-reserve', runId: turn.runId, attemptId: 'contact-tool', source: 'autonomous', kind: 'tool', autonomy: stamp, contextGeneration: turn.contextGeneration, settingsVersion: turn.settingsVersion, expectedRevision: home.revision, now: stamp.clock.utc, proposal: {contextGeneration: turn.contextGeneration, settingsVersion: turn.settingsVersion, proposalRulesVersion: 1, initialRevision: 1, sourceBasis: [{ref: {kind: 'core'}, contentDigest: 'a'.repeat(64)}], autonomyRulesVersion: 1, inputSequence: 0}});
  await home.enterAttempt({operationId: 'contact-enter', attemptId: attempt.attemptId, now: stamp.clock.utc});
  const saved = await home.saveProposal({operationId: 'contact-save', attemptId: attempt.attemptId, value: proposal, now: stamp.clock.utc});
  // Canonical tool result + independent native record: Home requires both before adopting.
  await home.recordNative({operationId: 'contact-native', record: {runId: turn.runId, nativeId: 'session-contact:final:1', provenance: 'tools-result', data: {association: 'issued-execution', name: 'role_propose', callSeq: 1, arguments: saved.value, result: {isError: false, value: {proposalId: saved.proposalId}}}}});
  await home.recordAttempt({operationId: 'contact-record', attemptId: attempt.attemptId, outcome: {kind: 'completed', data: {request: {name: 'role_propose', native: {sessionId: 'session-contact', callSeq: 1}}, result: {final: {isError: false, value: {proposalId: saved.proposalId}, content: []}}}}});
  // The assessment must carry the real source digest; Home recomputes and compares it on adoption.
  const reader = await home.openContextReader({purpose: 'daily', runId: turn.runId});
  const core = await reader.read({kind: 'core'});reader.revoke();
  const assessment = {status: 'adopt', reason: 'CONTACT_PROPOSAL_ONLY_NO_DELIVERY', sources: [{ref: {kind: 'core'}, contentDigest: core.contentDigest}]};
  const processed = await home.processProposal({operationId: 'contact-process', proposalId: saved.proposalId, assessment, now: stamp.clock.utc});
  return {turn, saved, processed};
}

test('contact提议采用后只归档意图与一条pending发件：无回复、无wire，目标等于绑定', async t => {
  const root = await mkdtemp(join(tmpdir(), 'role-contact51-intent-'));
  let success = false;
  t.after(async () => { if (success) await rm(root, {recursive: true, force: true}); else t.diagnostic('retained ' + root); });
  const home = await createRoleHome(join(root, 'role'), {operationId: 'contact-intent-create', core, settings: {inputLimitBytes: 32768}});
  try {
    await home.applyOwner({kind: 'bind-qq', operationId: 'contact-bind', connectionId: 'connection-contact', accountId: '10001', peerId: '20002', expectedBindingVersion: 0, expectedRevision: home.revision});
    const created = await createRoleHome(join(root, 'other'), {operationId: 'x', core, settings: {inputLimitBytes: 32768}});
    await created.close();
    await rm(join(root, 'other'), {recursive: true, force: true});
    const clock = (await import('dsh-role-companion/runtime')).createNodeClock(() => new Date('2026-10-27T02:10:00.000Z'));
    const reading = clock.read();
    const stamp = {snapshotVersion: 1, clock: reading, day: clock.day(reading.utc, 'Asia/Shanghai'), rulesVersion: 1};
    const {processed} = await contactTurn(t, {home, stamp});
    assert.equal(processed.processing.status, 'adopted');
    assert.equal(processed.processing.reason, 'CONTACT_PROPOSAL_ONLY_NO_DELIVERY');
    const state = await home.readConversation();
    assert.equal(state.replies.length, 0, 'a contact must never create a ReplyRecord');
    assert.equal(state.contact.intents.length, 1);
    const intent = state.contact.intents[0];
    assert.equal(intent.state, 'open');
    assert.equal(intent.runId, 'run-contact');
    assert.equal(intent.knowledgeVersion, 1);
    const delivery = state.deliveries.find(d => d.qualification === 'contact');
    assert(delivery, 'adoption archives exactly one pending contact candidate');
    assert.equal(delivery.status, 'pending');
    assert.equal(delivery.contactIntentId, intent.intentId);
    assert.equal(delivery.intentId, undefined, 'contact never reuses ReplyRecord.intentId');
    assert.equal(delivery.replyId, undefined);
    assert.equal(state.sendAttempts.length, 0, 'adoption reserves nothing: beginDelivery is the only reservation');
    const snapshot = await home.readSnapshot();
    assert.equal(delivery.target.bindingId, snapshot.qqBinding.bindingId);
    assert.equal(delivery.target.peerId, snapshot.qqBinding.peerId);
    // Acounted body is the adopted knowledge text, not any internal turn text.
    assert.equal(delivery.text, previewDelivery('contact', proposalText().text, state.deliveryRules.value.previewCodePoints));
  } finally { await home.close(); success = true; }
});

test('联系正文用主动联系标记而非“完整回复”，且仍受同一条previewCodePoints约束', () => {
  const rules = {version: 1, value: {previewCodePoints: Array.from(longContactMarker).length + 5, sendTimeoutMs: 20000}};
  const long = 'x'.repeat(100);
  const short = previewDelivery('contact', 'short', rules.value.previewCodePoints);
  assert.equal(short, 'short');
  const truncated = previewDelivery('contact', long, rules.value.previewCodePoints);
  assert(truncated.endsWith(longContactMarker));
  assert.equal(Array.from(truncated).length, rules.value.previewCodePoints);
  assert(!truncated.includes('完整回复'));
  // A main reply keeps its own marker.
  assert(previewReply(long, rules.value.previewCodePoints).endsWith('内容较长，完整回复已保存，可在 DSH 角色面板查看'));
});
