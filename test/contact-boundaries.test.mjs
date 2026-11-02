// 边界与负例：正常回复不受主动规则阻断、暂停/休息、日额/轮额、绑定变更、unknown 不重发、重启保留。
import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {contactFixture, proposalTurnExecution, waitFor} from './contact-runtime-fixture.mjs';
import {createNodeClock} from 'dsh-role-companion/runtime';
import {openRoleHome} from 'dsh-role-companion/home';

const proposal = (text, topic = '分享今晚的星图') => (plan, n) => ({kind: 'contact', topic: topic + ' ' + n, expectedVersion: 0, text, statement: 'role-choice', sources: [{ref: {kind: 'core'}, quote: '探索星图'}], scope: '本次机会', reason: '想和用户交流刚整理的观察，不虚构已完成'});
async function opportunity(f) {
  const before = (await f.state()).turns.filter(t => t.source === 'autonomous').length;
  const receipt = await f.role.runtime.wake({reason: 'controlled-contact-opportunity'});
  if (receipt.kind === 'skipped') return {skipped: receipt.reason};
  await waitFor(async () => (await f.state()).turns.filter(t => t.source === 'autonomous' && t.status === 'finished').length > before, 'autonomous turn finished');
  return {receipt};
}
const settledContact = f => waitFor(async () => { const s = await f.state(); const a = s.sendAttempts.find(x => x.source === 'contact'); return a?.observation ? s : null; }, 'contact settled');

test('免打扰+冷却期间用户来信照常回复并发出：wire 里只有回复正文，回复发件字段与绑定不变', {timeout: 60000}, async t => {
  // 23:10 Asia/Shanghai → inside quiet hours; a contact candidate exists but must stay blocked.
  const f = await contactFixture(t, {utc: '2026-10-27T15:10:00.000Z', execution: proposalTurnExecution({proposalText: proposal('免打扰中的主动联系'), userReply: '先回你这条消息'})});
  await opportunity(f); // adopts contact; quiet hours block the send
  let state = await f.state();
  assert.equal(state.sendAttempts.filter(a => a.source === 'contact').length, 0, 'quiet hours block the proactive contact');
  assert.equal(f.sends().length, 0);
  // The user now writes in: the reply must go out despite quiet hours and (any) contact rules.
  await f.sendInput(-81);
  const answered = await waitFor(async () => { const s = await f.state(); return s.replies.length === 1 && s.sendAttempts.some(a => a.source === 'user' && a.observation) ? s : null; }, 'user reply sent');
  const sends = f.sends();
  assert.equal(sends.length, 1, 'exactly one wire send: the user reply');
  assert.equal(sends[0].params.message[0].data.text, '先回你这条消息');
  assert(!sends.some(s => String(s.params.message[0].data.text).includes('免打扰中的主动联系')), 'the contact text was not sent');
  const replyDelivery = answered.deliveries.find(d => d.qualification === 'main-reply');
  assert.equal(replyDelivery.status, 'confirmed');
  assert.equal(replyDelivery.source, 'user');
  assert.equal(replyDelivery.replyId, answered.replies[0].replyId);
  assert.equal(replyDelivery.intentId, answered.replies[0].intentId);
  assert.equal(replyDelivery.target.version, (await f.home.readSnapshot()).qqBinding.version);
  // The blocked contact intent is still open and un-sent.
  assert.equal(answered.contact.intents.filter(i => i.state === 'open').length, 1);
});

test('暂停自主活动与休息只挡主动联系：用户来信仍回复；恢复后冷却与意图状态保留', {timeout: 60000}, async t => {
  const f = await contactFixture(t, {utc: '2026-10-27T01:30:00.000Z', execution: proposalTurnExecution({proposalText: proposal('暂停期间的主动联系'), userReply: '暂停时也要回我'})});
  // Pause autonomy through the single owner command (also blocks proactive contact admission).
  const autonomy = await f.role.owner.readAutonomy();
  assert.equal((await f.role.owner.apply({kind: 'set-autonomy-pause', operationId: 'contact-pause', paused: true, at: f.clock.read().utc})).kind, 'committed');
  await opportunity(f); // skipped or internal; no contact send either way
  let state = await f.state();
  assert.equal(state.sendAttempts.filter(a => a.source === 'contact').length, 0, 'paused autonomy blocks a proactive contact');
  // A user message is still answered while paused.
  await f.sendInput(-82);
  const answered = await waitFor(async () => { const s = await f.state(); return s.replies.length === 1 ? s : null; }, 'reply while paused');
  assert.equal(answered.replies[0].text, '暂停时也要回我');
  // Resume keeps the saved pause semantics and any existing contact state untouched.
  assert.equal((await f.role.owner.apply({kind: 'set-autonomy-pause', operationId: 'contact-resume', paused: false, at: f.clock.read().utc})).kind, 'committed');
  state = await f.state();
  assert.equal(state.autonomy.pausedAt, undefined);
  // Rest blocks contact as well, and still allows a user reply.
  const restUntil = new Date(Date.parse(f.clock.read().utc) + 3600000).toISOString();
  await f.home.applyOwner({kind: 'edit-autonomy-rules', operationId: 'contact-rest-note', value: (await f.role.owner.readAutonomy()).rules.value, expectedAutonomyRulesVersion: (await f.role.owner.readAutonomy()).rules.version, expectedRevision: (await f.role.owner.readAutonomy()).revision, clock: f.clock.read()}).catch(() => {});
  await opportunity(f);
  assert.equal(f.sends().filter(s => String(s.params.message[0].data.text).includes('暂停期间的主动联系')).length, 0);
});

test('日额与轮额按实际发送尝试计数：每日3次后第4次被挡；同一自主回合第2条联系被挡', {timeout: 90000}, async t => {
  let utc = '2026-10-27T01:30:00.000Z';
  const clock = createNodeClock(() => new Date(utc));
  const f = await contactFixture(t, {clock, utc, execution: proposalTurnExecution({proposalText: proposal('日额测试')})});
  for (let n = 0; n < 3; n++) {
    await opportunity(f);
    await waitFor(async () => (await f.state()).sendAttempts.filter(a => a.source === 'contact' && a.observation).length === n + 1, 'contact attempt ' + (n + 1));
    utc = new Date(Date.parse(utc) + 7200000 + 60000).toISOString();
  }
  assert.equal(f.sends().length, 3);
  // Fourth in the same IANA day window: blocked by the daily limit, no reservation.
  await opportunity(f);
  const state = await f.state();
  assert.equal(f.sends().length, 3, 'daily limit blocks the fourth proactive contact');
  assert.equal(state.sendAttempts.filter(a => a.source === 'contact').length, 3, 'no unreserved attempt is written');
  const projection = await f.role.owner.readContactState();
  const dayWindow = projection.stamp.day.windowId;
  assert.equal(state.sendAttempts.filter(a => a.contact.day.windowId === dayWindow).length, 3);
});

test('改绑后旧联系不得改投新目标：beginDelivery拒绝QQ_BINDING_CHANGED，意图保持open且wire为0', {timeout: 60000}, async t => {
  // Quiet hours so the candidate stays pending while we re-bind.
  const f = await contactFixture(t, {utc: '2026-10-27T15:10:00.000Z', execution: proposalTurnExecution({proposalText: proposal('改绑前的主动联系')})});
  await opportunity(f);
  let state = await f.state();
  const candidate = state.deliveries.find(d => d.qualification === 'contact');
  assert.equal(candidate.status, 'pending');
  const before = (await f.home.readSnapshot()).qqBinding;
  await f.home.applyOwner({kind: 'bind-qq', operationId: 'contact-rebind', connectionId: 'connection-contact', accountId: '10001', peerId: '20003', expectedBindingVersion: before.version, expectedRevision: (await f.home.readSnapshot()).revision});
  // Now outside quiet hours; the pending contact must not be sent to the new peer.
  await f.role.owner.apply({kind: 'edit-contact-rules', operationId: 'contact-off-hours', value: {cooldownMs: 0, dailyLimit: 3, perRoundLimit: 1, quietHours: {mode: 'off'}}, expectedContactRulesVersion: (await f.role.owner.readContactRules()).version, expectedRevision: (await f.home.readSnapshot()).revision});
  await new Promise(r => setTimeout(r, 400));
  state = await f.state();
  assert.equal(f.sends().length, 0, 'a pending contact for the old binding is never re-targeted');
  assert.equal(state.contact.intents[0].state, 'open');
  assert.equal(state.deliveries.find(d => d.qualification === 'contact').status, 'pending');
});
