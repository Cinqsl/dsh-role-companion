import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contactNeedsSettlement,
  deliveryTextFromPages,
  summarizeContactEvidence,
  unsettledContactDeliveryIds,
} from '../scripts/g2-contact-evidence.mjs';

test('delivery text is joined from each delivery page body', () => {
  const pages = [
    {delivery: {deliveryId: 'delivery-contact-1', text: 'first chunk'}, text: 'undefined'},
    {delivery: {deliveryId: 'delivery-contact-1', text: 'second chunk'}},
  ];

  assert.equal(deliveryTextFromPages(pages), 'first chunksecond chunk');
});

test('contact settlement continues through sending and stops at confirmed', () => {
  const delivery = status => [{
    deliveryId: 'delivery-contact-1',
    qualification: 'contact',
    status,
  }];

  assert.equal(contactNeedsSettlement(delivery('pending'), 1), true);
  assert.equal(contactNeedsSettlement(delivery('sending'), 1), true);
  assert.equal(contactNeedsSettlement(delivery('confirmed'), 1), false);
  assert.equal(contactNeedsSettlement(delivery('rejected'), 1), false);
  assert.equal(contactNeedsSettlement(delivery('unknown'), 1), false);
  assert.equal(contactNeedsSettlement(delivery('pending'), 0), false);
});

test('a timeout while sending remains unsettled', () => {
  const deliveries = [{
    deliveryId: 'delivery-contact-1',
    qualification: 'contact',
    status: 'sending',
  }];

  assert.deepEqual(unsettledContactDeliveryIds(deliveries, 1), ['delivery-contact-1']);
});

test('a pre-existing pending contact remains a settlement candidate', () => {
  const before = {
    inputIds: [],
    intentIds: ['contact-intent-1'],
    deliveries: [{
      deliveryId: 'delivery-contact-1',
      qualification: 'contact',
      status: 'pending',
      sendAttemptId: null,
    }],
  };
  const after = {
    inputIds: [],
    contact: {intents: []},
    deliveries: before.deliveries,
    deliveryBodies: [{deliveryId: 'delivery-contact-1', target: {peerId: '20002'}, attempt: null}],
  };

  const result = summarizeContactEvidence({
    before,
    after,
    qqReady: true,
    expectedPeerId: '20002',
    qqSendEvents: 0,
  });

  assert.deepEqual(result.pendingContactDeliveryIds, ['delivery-contact-1']);
  assert.equal(result.contactOutcome, 'not-observed');
  assert.equal(contactNeedsSettlement(after.deliveries, 1), true);
});

test('an adopted pending contact is captured without claiming a QQ send', () => {
  const before = {
    inputIds: ['input-existing'],
    intentIds: [],
    deliveries: [],
  };
  const after = {
    inputIds: ['input-existing'],
    contact: {
      intents: [{
        intentId: 'contact-intent-1',
        state: 'adopted',
        deliveryId: 'delivery-contact-1',
        deliveryStatus: 'pending',
      }],
    },
    deliveries: [{
      deliveryId: 'delivery-contact-1',
      qualification: 'contact',
      status: 'pending',
      sendAttemptId: null,
    }],
    deliveryBodies: [{deliveryId: 'delivery-contact-1', target: {peerId: '20002'}, attempt: null}],
  };

  const result = summarizeContactEvidence({
    before,
    after,
    qqReady: true,
    expectedPeerId: '20002',
    qqSendEvents: 0,
  });

  assert.deepEqual(result, {
    inputIdsUnchanged: true,
    newIntentIds: ['contact-intent-1'],
    newContactDeliveryIds: ['delivery-contact-1'],
    pendingContactDeliveryIds: ['delivery-contact-1'],
    sendAttemptIds: [],
    qqSendEvents: 0,
    contactOutcome: 'pending',
    sendSuccessClaimed: false,
  });
});

test('a confirmed contact claims send success only with a ready binding and observed wire send', () => {
  const before = {inputIds: [], intentIds: [], deliveries: []};
  const after = {
    inputIds: [],
    contact: {
      intents: [{intentId: 'contact-intent-1', state: 'adopted', deliveryId: 'delivery-contact-1'}],
    },
    deliveries: [{
      deliveryId: 'delivery-contact-1',
      qualification: 'contact',
      status: 'confirmed',
      sendAttemptId: 'send-attempt-1',
    }],
    deliveryBodies: [{
      deliveryId: 'delivery-contact-1',
      target: {peerId: '20002'},
      attempt: {sendAttemptId: 'send-attempt-1', observation: {kind: 'confirmed', messageId: '-9001'}},
    }],
  };
  const input = {before, after, expectedPeerId: '20002', qqSendEvents: 1};

  assert.equal(summarizeContactEvidence({...input, qqReady: true}).sendSuccessClaimed, true);
  assert.equal(summarizeContactEvidence({...input, qqReady: false}).sendSuccessClaimed, false);
  assert.equal(summarizeContactEvidence({...input, qqReady: true, qqSendEvents: 0}).sendSuccessClaimed, false);
});

test('a non-pending contact without its persisted send attempt is rejected as incomplete evidence', () => {
  const before = {inputIds: [], intentIds: [], deliveries: []};
  const after = {
    inputIds: [],
    contact: {intents: []},
    deliveries: [{
      deliveryId: 'delivery-contact-1',
      qualification: 'contact',
      status: 'sending',
      sendAttemptId: 'send-attempt-1',
    }],
    deliveryBodies: [{deliveryId: 'delivery-contact-1', target: {peerId: '20002'}, attempt: null}],
  };

  assert.throws(
    () => summarizeContactEvidence({
      before,
      after,
      qqReady: true,
      expectedPeerId: '20002',
      qqSendEvents: 0,
    }),
    /CONTACT_SEND_ATTEMPT_NOT_CAPTURED/,
  );
});

test('a pre-existing pending contact that starts sending is still captured as a send attempt', () => {
  const before = {
    inputIds: [],
    intentIds: ['contact-intent-1'],
    deliveries: [{
      deliveryId: 'delivery-contact-1',
      qualification: 'contact',
      status: 'pending',
      sendAttemptId: null,
    }],
  };
  const after = {
    inputIds: [],
    contact: {
      intents: [{intentId: 'contact-intent-1', state: 'adopted', deliveryId: 'delivery-contact-1'}],
    },
    deliveries: [{
      deliveryId: 'delivery-contact-1',
      qualification: 'contact',
      status: 'confirmed',
      sendAttemptId: 'send-attempt-1',
    }],
    deliveryBodies: [{
      deliveryId: 'delivery-contact-1',
      target: {peerId: '20002'},
      attempt: {sendAttemptId: 'send-attempt-1', observation: {kind: 'confirmed', messageId: '-9001'}},
    }],
  };

  const result = summarizeContactEvidence({
    before,
    after,
    qqReady: true,
    expectedPeerId: '20002',
    qqSendEvents: 1,
  });
  assert.deepEqual(result.sendAttemptIds, ['send-attempt-1']);
  assert.equal(result.contactOutcome, 'confirmed');
  assert.equal(result.sendSuccessClaimed, true);
});
