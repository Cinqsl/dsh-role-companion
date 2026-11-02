import './network-guard.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import {contactFixture, proposalTurnExecution, waitFor} from './contact-runtime-fixture.mjs';
import {createNodeClock} from 'dsh-role-companion/runtime';

const contactProposal = text => () => ({
  kind: 'contact',
  topic: '分享推进时钟下的星图观察',
  expectedVersion: 0,
  text,
  statement: 'role-choice',
  sources: [{ref: {kind: 'core'}, quote: '探索星图'}],
  scope: '本次机会',
  reason: '想分享刚整理的观察',
});

test('advancing clock admits one contact delivery from one trusted reading', {timeout: 10000}, async t => {
  const utc = '2026-10-27T01:30:00.000Z';
  let reads = 0;
  const clock = createNodeClock(() => new Date(Date.parse(utc) + reads++));
  const text = '今晚的星图观察整理好了，想和你说说。';
  const f = await contactFixture(t, {
    clock,
    utc,
    execution: proposalTurnExecution({proposalText: contactProposal(text)}),
  });

  const receipt = await f.wake('advancing-clock-contact');
  assert.equal(receipt.kind, 'accepted');

  const outcome = await waitFor(async () => {
    const projection = await f.role.owner.readContactState();
    const attempt = projection.state.sendAttempts.find(candidate => candidate.source === 'contact');
    return projection.lastBlockedReason || attempt?.observation
      ? {projection, attempt}
      : null;
  }, 'contact delivery settled or blocked', 5000);

  assert.equal(
    outcome.projection.lastBlockedReason,
    null,
    `contact delivery was blocked by ${outcome.projection.lastBlockedReason}`,
  );
  assert.equal(f.sends().length, 1);
  assert.equal(outcome.attempt.observation.kind, 'confirmed');
  assert.equal(
    outcome.projection.state.deliveries.find(delivery => delivery.qualification === 'contact').status,
    'confirmed',
  );
  assert.equal(outcome.attempt.reservedAt, outcome.attempt.contact.clock.utc);
});
