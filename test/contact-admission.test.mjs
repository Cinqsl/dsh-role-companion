// 联系准入纵切：真实 startRole + 受控 ExecutionPort 的 role_propose 路径 + 本机 loopback OneBot 线协议。
import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {contactFixture, proposalTurnExecution, waitFor} from './contact-runtime-fixture.mjs';
import {createNodeClock} from 'dsh-role-companion/runtime';

const contactProposal = text => (plan, n) => ({kind: 'contact', topic: '分享今晚的星图 ' + n, expectedVersion: 0, text, statement: 'role-choice', sources: [{ref: {kind: 'core'}, quote: '探索星图'}], scope: '本次机会', reason: '想和用户交流刚整理的观察，不虚构已完成'});
const local = stamp => stamp;

/** Run exactly one autonomous opportunity through the real proposal path and wait for its delivery to settle. */
async function opportunity(f) {
  const before = (await f.state()).turns.filter(t => t.source === 'autonomous').length;
  const receipt = await f.role.runtime.wake({reason: 'controlled-contact-opportunity'});
  if (receipt.kind === 'skipped') return {skipped: receipt.reason};
  await waitFor(async () => (await f.state()).turns.filter(t => t.source === 'autonomous' && t.status === 'finished').length > before, 'autonomous turn finished');
  return {receipt};
}
const contactSends = f => f.sends();
const settled = async f => waitFor(async () => { const s = await f.state(); const attempt = s.sendAttempts.find(a => a.source === 'contact'); return attempt?.observation ? s : null; }, 'contact send settled');

test('合法联系：结构化提议→意图→beginDelivery原子预留→恰一条send_private_msg，正文是提议文本且回复仍为0', {timeout: 60000}, async t => {
  const utc = '2026-10-27T01:30:00.000Z'; // 09:30 Asia/Shanghai, outside quiet hours
  const f = await contactFixture(t, {utc, execution: proposalTurnExecution({proposalText: contactProposal('今晚的星图我整理好了，想和你说说。')})});
  const result = await opportunity(f);
  assert.equal(result.receipt.kind, 'accepted');
  const state = await settled(f);
  const attempt = state.sendAttempts.find(a => a.source === 'contact');
  assert(attempt, 'a contact send attempt is reserved');
  assert.equal(attempt.contact.intentId.startsWith('contact-intent-'), true);
  assert.equal(attempt.contact.localMinutes, 9 * 60 + 30);
  // The fixture widens the user-editable send timeout so the injected clock and the adapter's real
  // wall-clock deadline agree; the reservation still carries the current delivery rules.
  assert.equal(attempt.rules.value.sendTimeoutMs, 2147483647);
  assert.equal(attempt.observation.kind, 'confirmed');
  const sends = contactSends(f);
  assert.equal(sends.length, 1, 'exactly one wire send');
  assert.equal(sends[0].action, 'send_private_msg');
  assert.equal(String(sends[0].params.user_id), '20002', 'target comes from the binding, never the model');
  assert.equal(sends[0].params.message[0].data.text, '今晚的星图我整理好了，想和你说说。');
  // No reply / no ReplyRecord / no main-reply delivery exists.
  assert.equal(state.replies.length, 0);
  assert.equal(state.deliveries.filter(d => d.qualification === 'main-reply').length, 0);
  const delivery = state.deliveries.find(d => d.qualification === 'contact');
  assert.equal(delivery.status, 'confirmed');
  assert.equal(delivery.intentId, undefined);
  assert.equal(delivery.replyId, undefined);
  const intent = state.contact.intents[0];
  assert.equal(intent.state, 'sent');
  // The autonomy budget ledger is untouched by contact: the window holds only this turn's model+tool.
  assert.deepEqual(state.autonomy.windows.at(-1).used, {model: 1, tool: 1, web: 0}, 'contact is not charged to model/tool/web windows');
  assert.equal(state.attempts.filter(a => a.kind === 'model' || a.kind === 'tool').length, 2, 'contact adds no model or tool attempt');
});

test('免打扰边界按本地HH:mm含起点不含终点：22:59通、23:00阻、07:59阻、08:00通', {timeout: 120000}, async t => {
  const cases = [['2026-10-27T14:59:00.000Z', true, '22:59'], ['2026-10-27T15:00:00.000Z', false, '23:00'], ['2026-10-27T23:59:00.000Z', false, '07:59'], ['2026-10-28T00:00:00.000Z', true, '08:00']];
  for (const [utc, expected, label] of cases) {
    const f = await contactFixture(t, {utc, execution: proposalTurnExecution({proposalText: contactProposal('边界测试：' + label)})});
    await opportunity(f);
    const state = await f.state();
    if (expected) {
      const attempt = await waitFor(async () => { const s = await f.state(); const a = s.sendAttempts.find(x => x.source === 'contact'); return a?.observation ? a : null; }, 'contact attempt ' + label);
      assert.equal(attempt.observation.kind, 'confirmed', label + ' must be allowed');
      assert.equal(f.sends().length, 1, label);
      assert.equal(attempt.contact.localMinutes, Number(label.slice(0, 2)) * 60 + Number(label.slice(3)));
    } else {
      assert.equal(f.sends().length, 0, label + ' must be blocked by quiet hours');
      assert.equal(state.sendAttempts.filter(a => a.source === 'contact').length, 0, label + ' reserves nothing');
      const delivery = state.deliveries.find(d => d.qualification === 'contact');
      assert.equal(delivery.status, 'pending', label + ' keeps the candidate pending');
      assert.equal(state.contact.intents[0].state, 'open', label + ' keeps the intent open');
    }
  }
});

test('冷却与日额按实际发送尝试计数：默认120分钟冷却内第二次被拒，失败与不明不返还', {timeout: 120000}, async t => {
  let utc = '2026-10-27T01:30:00.000Z';
  const clock = createNodeClock(() => new Date(utc));
  const f = await contactFixture(t, {clock, utc, execution: proposalTurnExecution({proposalText: contactProposal('冷却测试')})});
  await opportunity(f);
  await settled(f);
  assert.equal(f.sends().length, 1);
  const projection = async () => { const {ContactView} = {}; const result = await f.role.owner.readContactState(); return result; };
  // Immediately again: quiet hours are over but the cooldown still blocks it.
  await opportunity(f);
  let state = await f.state();
  assert.equal(f.sends().length, 1, 'cooldown blocks the second proactive contact');
  assert.equal(state.sendAttempts.filter(a => a.source === 'contact').length, 1, 'a blocked contact reserves nothing');
  assert.equal(state.contact.intents.filter(i => i.state === 'sent').length, 1);
  // The new intent stays open: it is neither sent, nor silently retried.
  assert.equal(state.contact.intents.filter(i => i.state === 'open').length, 1);
  // A read projection reports the separate blocked reason; the panel never claims a send happened.
  utc = new Date(Date.parse(utc) + 7200000 - 1000).toISOString();
  await opportunity(f);
  assert.equal(f.sends().length, 1, 'cooldownMs-1 still blocks');
  utc = new Date(Date.parse(utc) + 2000).toISOString();
  await opportunity(f);
  await waitFor(async () => f.sends().length === 2, 'second contact after cooldown');
  state = await f.state();
  const attempts = state.sendAttempts.filter(a => a.source === 'contact');
  assert.equal(attempts.length, 2);
  assert.equal(state.contact.intents.filter(i => i.state === 'sent').length >= 1, true);
});
