import assert from 'node:assert/strict';
import test from 'node:test';

import {KNOWN_STAGES, getStagePlan, validateStageLimits} from '../scripts/g2-stage-plan.mjs';

const policy = stage => {
  const {wake, stimulus, requiresQQ} = getStagePlan(stage);
  return {wake, stimulus, requiresQQ};
};

test('corrected autonomous exploration stages declare one coherent execution policy', () => {
  const expected = {
    'a32-observe': {wake: true, stimulus: 'none', requiresQQ: true},
    'a32-observe2': {wake: true, stimulus: 'none', requiresQQ: true},
    'a32-share': {wake: true, stimulus: 'none', requiresQQ: true},
    'b-explore': {wake: true, stimulus: 'none', requiresQQ: false},
    'b-explore2': {wake: true, stimulus: 'none', requiresQQ: true},
    'b-explore3': {wake: true, stimulus: 'none', requiresQQ: true},
  };

  for (const [stage, want] of Object.entries(expected)) {
    assert.deepEqual(policy(stage), want, stage);
  }
});

test('every accepted stage has one explicit wake and stimulus classification', () => {
  const submits = new Set([
    's58-unknown',
    's58-organization',
    's58-organization2',
    's58-organization3',
    's58-goal',
    's58-recall',
    's59-userweb',
    's60-chain',
    'chain-talk',
    'chain-web3',
    'chain-contact3',
    'chain-contact4',
    'a32-talk',
    'a28-dual-entry',
    'a30-recall',
    'a31-base',
    'a31-seed',
    'a31-seed-save',
    'a31-correct',
    'a31-correct-save',
    'a31-correct2',
    'a31-organize',
    'a31-after-cleanup',
    'a31-confirm',
    'a31-recall',
    'a31-clean-seed',
    'a31-clean-correct',
    'a31-clean-correct-save',
    'a31-clean-organize',
    'a31-clean-after-cleanup',
    'a31-clean-confirm',
    'a31-clean-recall',
    'a31-clean-status',
    'a34-clean-seed',
    'a34-clean-restpermission',
    'b-talk',
    'b-talk2',
    'chain-correct',
    'chain-migrate',
  ]);
  const wakes = new Set([
    's59-web',
    's59-web2',
    's59-contact',
    's59-contact2',
    's60-chain',
    'chain-web',
    'chain-web2',
    'chain-web4',
    'chain-contact',
    'chain-contact2',
    'chain-contact5',
    'chain-contact6',
    'a32-contact',
    'a32-contact2',
    'a32-contact3',
    'a32-observe',
    'a32-observe2',
    'a32-share',
    'a34-observe1',
    'a34-observe2',
    'a34-observe3',
    'a34-clean-rest',
    'a34-clean-web1',
    'a34-clean-web2',
    'a34-clean-rest2',
    'a34-clean-rest3',
    'a34-clean-rest4',
    'b-explore',
    'b-explore2',
    'b-explore3',
  ]);

  assert.deepEqual(new Set(KNOWN_STAGES), new Set([...submits, ...wakes]));
  for (const stage of KNOWN_STAGES) {
    const plan = getStagePlan(stage);
    assert.equal(plan.stimulus === 'submit', submits.has(stage), stage);
    assert.equal(plan.wake, wakes.has(stage), stage);
  }
});

test('configuration side effects are declared by the same stage plan', () => {
  const contactRuleStages = new Set([
    'chain-contact4',
    'a32-contact',
    'a32-contact2',
    'a32-contact3',
    'a32-observe',
    'a32-observe2',
    'a32-share',
    'b-talk',
    'b-explore',
    'b-explore2',
    'b-explore3',
  ]);
  const coreEditStages = new Set([
    'chain-web4',
    'chain-contact2',
    'chain-contact3',
    'chain-contact4',
    'chain-contact5',
    'chain-contact6',
    'a32-talk',
    'a32-contact',
    'a32-contact2',
    'a32-contact3',
    'a32-observe2',
    'a32-share',
    's58-organization3',
    's58-goal',
    'b-talk',
    'b-talk2',
    'b-explore2',
    'b-explore3',
    'chain-correct',
  ]);

  for (const stage of KNOWN_STAGES) {
    const plan = getStagePlan(stage);
    assert.equal(plan.contactRules, contactRuleStages.has(stage), stage);
    assert.equal(plan.editCore, coreEditStages.has(stage), stage);
  }
});

test('authorized QQ sends cannot bypass the live-binding prerequisite', () => {
  assert.doesNotThrow(() => validateStageLimits('b-explore2', {qqSend: 2, qqMetadata: 3}));
  assert.throws(
    () => validateStageLimits('b-explore', {qqSend: 1, qqMetadata: 3}),
    /QQ_PREREQUISITE_NOT_DECLARED/,
  );
  assert.throws(
    () => validateStageLimits('b-explore2', {qqSend: 2, qqMetadata: 0}),
    /QQ_METADATA_CAP_REQUIRED/,
  );
  assert.throws(
    () => validateStageLimits('a32-observe', {qqSend: 0, qqMetadata: 0}),
    /QQ_METADATA_CAP_REQUIRED/,
  );
  assert.equal(getStagePlan('a32-talk').requiresQQ, true);
  assert.throws(
    () => validateStageLimits('a32-talk', {qqSend: 0, qqMetadata: 0}),
    /QQ_METADATA_CAP_REQUIRED/,
  );
});
