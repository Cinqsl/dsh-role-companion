const inputIds = snapshot => snapshot.inputIds ?? snapshot.inputs?.map(input => input.inputId) ?? [];
const intentIds = snapshot => snapshot.intentIds ?? snapshot.contact?.intents?.map(intent => intent.intentId) ?? [];
const deliveryIds = snapshot => snapshot.deliveries?.map(delivery => delivery.deliveryId) ?? [];

export function deliveryTextFromPages(pages) {
  return pages.map((page, index) => {
    if (typeof page?.delivery?.text !== 'string') {
      throw new Error('CONTACT_DELIVERY_TEXT_PAGE_REQUIRED:' + index);
    }
    return page.delivery.text;
  }).join('');
}

export function unsettledContactDeliveryIds(deliveries, qqSendCap) {
  if (!(Number(qqSendCap) > 0)) return [];
  return deliveries
    .filter(delivery => delivery.qualification === 'contact'
      && (delivery.status === 'pending' || delivery.status === 'sending'))
    .map(delivery => delivery.deliveryId);
}

export function contactNeedsSettlement(deliveries, qqSendCap) {
  return unsettledContactDeliveryIds(deliveries, qqSendCap).length > 0;
}

export function summarizeContactEvidence({before, after, qqReady, expectedPeerId, qqSendEvents}) {
  const beforeInputs = new Set(inputIds(before));
  const beforeIntents = new Set(intentIds(before));
  const beforeDeliveries = new Set(deliveryIds(before));
  const priorDeliveries = new Map(before.deliveries.map(delivery => [delivery.deliveryId, delivery]));
  const bodies = new Map(after.deliveryBodies.map(body => [body.deliveryId, body]));

  const newIntents = after.contact.intents.filter(intent => !beforeIntents.has(intent.intentId));
  const newContactDeliveries = after.deliveries.filter(delivery =>
    delivery.qualification === 'contact' && !beforeDeliveries.has(delivery.deliveryId));
  const observedContactDeliveries = after.deliveries.filter(delivery => {
    if (delivery.qualification !== 'contact') return false;
    const prior = priorDeliveries.get(delivery.deliveryId);
    return !prior || prior.status !== delivery.status || prior.sendAttemptId !== delivery.sendAttemptId;
  });

  for (const delivery of observedContactDeliveries) {
    const body = bodies.get(delivery.deliveryId);
    if (!body || String(body.target.peerId) !== String(expectedPeerId)) {
      throw new Error('CONTACT_DELIVERY_TARGET_NOT_VERIFIED');
    }
    if ((delivery.sendAttemptId || delivery.status !== 'pending')
      && (!body.attempt || body.attempt.sendAttemptId !== delivery.sendAttemptId)) {
      throw new Error('CONTACT_SEND_ATTEMPT_NOT_CAPTURED');
    }
  }

  const pending = after.deliveries.filter(delivery =>
    delivery.qualification === 'contact' && delivery.status === 'pending');
  const observedPending = observedContactDeliveries.filter(delivery => delivery.status === 'pending');
  const statuses = new Set(observedContactDeliveries.map(delivery => delivery.status));
  const contactOutcome = observedContactDeliveries.length === 0
    ? 'not-observed'
    : observedPending.length > 0
      ? 'pending'
      : statuses.size === 1
        ? [...statuses][0]
        : 'mixed';
  return {
    inputIdsUnchanged: inputIds(after).length === beforeInputs.size
      && inputIds(after).every(inputId => beforeInputs.has(inputId)),
    newIntentIds: newIntents.map(intent => intent.intentId),
    newContactDeliveryIds: newContactDeliveries.map(delivery => delivery.deliveryId),
    pendingContactDeliveryIds: pending.map(delivery => delivery.deliveryId),
    sendAttemptIds: observedContactDeliveries.flatMap(delivery => delivery.sendAttemptId ? [delivery.sendAttemptId] : []),
    qqSendEvents,
    contactOutcome,
    sendSuccessClaimed: qqReady && contactOutcome === 'confirmed' && qqSendEvents >= observedContactDeliveries.length,
  };
}
