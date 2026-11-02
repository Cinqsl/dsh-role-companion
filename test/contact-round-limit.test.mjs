// #51 每轮上限：同一自主回合第 2 条联系被 CONTACT_ROUND_LIMIT 拒绝（默认 perRoundLimit=1），wire 恒为 1。
import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {proposalTurnExecution, contactFixture, waitFor} from './contact-runtime-fixture.mjs';
import {createNodeClock} from 'dsh-role-companion/runtime';

test('同一自主回合第二次联系被轮额拒绝：只发一条，第二次在 beginDelivery 前被挡', {timeout: 90000}, async t => {
  let utc = '2026-10-27T01:30:00.000Z';
  const clock = createNodeClock(() => new Date(utc));
  // The controlled execution submits two contact proposals from the SAME autonomous turn.
  const proposal = (n) => ({kind: 'contact', topic: '同轮联系 ' + n, expectedVersion: 0, text: '同轮里的第 ' + n + ' 条联系', statement: 'role-choice', sources: [{ref: {kind: 'core'}, quote: '探索星图'}], scope: '本次机会', reason: '同一机会内的第二个交流意图'});
  const execution = {inspect: async () => ({available: true, reason: 'controlled'}), prepare: async outputLimit => ({provider: 'deepseek-official', model: 'deepseek-flash', contextWindow: 131072, outputLimit}), run: async (plan, scope) => {
    const model = await scope.reserveModel({}); await model.enter(); for await (const _ of model.iterate(async function* () { yield ''; })) {} await model.settle({kind: 'completed', data: {text: '内部记录'}});
    for (let n = 1; n <= 2; n++) {
      const value = proposal(n), permit = await scope.reserveTool({name: 'role_propose', arguments: value, native: {sessionId: 'session-round', callId: 'call-round-' + n, callSeq: n}}, {kind: 'proposal'});
      await permit.enter();
      const saved = await permit.invoke(undefined, () => permit.proposal.save(value));
      await permit.observe({kind: 'returned', value: saved});
      scope.registerNative({nativeId: 'session-round:final:' + n, provenance: 'tools-result', data: {association: 'issued-execution', name: 'role_propose', callSeq: n, arguments: value, result: {isError: false, value: saved}}});
      permit.finalize({kind: 'completed', data: {final: {isError: false, content: [], value: saved}}});
      await scope.drain();
      if (n === 1) await new Promise(r => setTimeout(r, 50)); // let the first contact be admitted and sent
    }
    return {kind: 'internal', reason: 'INTERNAL_ACTIVITY', text: '内部记录'};
  }, quiesce: async () => ({idle: true, flushed: true}), close: async () => {}};
  const f = await contactFixture(t, {clock, utc, execution});
  await f.role.runtime.wake({reason: 'round-limit'});
  await waitFor(async () => (await f.state()).turns.some(t => t.source === 'autonomous' && t.status === 'finished'), 'turn finished', 20000);
  await new Promise(r => setTimeout(r, 1500));
  const state = await f.state();
  const sent = state.sendAttempts.filter(a => a.source === 'contact');
  assert.equal(sent.length, 1, 'perRoundLimit=1 admits exactly one contact in this autonomous run');
  assert.equal(f.sends().length, 1);
  assert.equal(sent[0].contact.runId, state.turns.find(t => t.source === 'autonomous').runId);
  // The second intent (if adopted) is either closed or open, but never delivered.
  const second = state.contact.intents.filter(intent => intent.intentId !== sent[0].contact.intentId);
  assert(second.every(intent => intent.state !== 'sent' && intent.state !== 'unknown'));
});
