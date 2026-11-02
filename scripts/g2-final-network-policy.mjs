const metadataActions = new Set(['get_version_info', 'get_login_info', 'get_friend_list']);
const instrumented = Symbol('dsh-g2-instrumented');
const instrumentedEmit = Symbol('dsh-g2-instrumented-emit');
const networkKinds = ['model', 'modelMetadata', 'search', 'fetch', 'qqSend', 'qqMetadata'];

export function summarizeNetworkLedger(ledger) {
  const kinds = Object.fromEntries(networkKinds.map(kind => [
    kind,
    ledger.events.filter(event => event.kind === kind).length,
  ]));
  return {
    events: ledger.events.length,
    rejected: ledger.rejected.length,
    kinds,
    realBusinessCalls: {
      model: kinds.model,
      web: kinds.search + kinds.fetch,
      qq: kinds.qqSend,
      qqMetadata: kinds.qqMetadata,
    },
  };
}

function classifyOneBot(plan, socket, payload) {
  const expected = plan.oneBot;
  if (!expected || new URL(socket.url).href !== new URL(expected.endpoint).href) return null;
  if (metadataActions.has(payload.action)) return 'qqMetadata';
  if (payload.action === 'send_private_msg'
    && String(payload.params?.user_id) === String(expected.peerId)) return 'qqSend';
  return null;
}

export function instrumentWebSocket(WebSocket, {ledger, persist, plan}) {
  if (WebSocket.prototype[instrumented]) return;
  Object.defineProperty(WebSocket.prototype, instrumented, {value: true});
  const originalSend = WebSocket.prototype.send;

  WebSocket.prototype.send = function observedSend(data, ...args) {
    let payload;
    try {
      payload = JSON.parse(String(data));
    } catch {
      throw new Error('DSH_G2_UNKNOWN_WS_PAYLOAD');
    }
    const kind = classifyOneBot(plan, this, payload);
    const cap = kind === 'qqSend' ? plan.qqSendCap : plan.qqMetadataCap;
    const count = kind ? ledger.events.filter(event => event.kind === kind).length : 0;
    if (!kind || count >= (cap ?? 0)) {
      ledger.rejected.push({
        at: new Date().toISOString(),
        kind: kind ?? 'unknownOneBot',
        action: payload.action ?? null,
        reason: kind ? 'STAGE_CAP_REACHED' : 'UNAPPROVED_ONEBOT_ACTION',
      });
      persist();
      throw new Error(kind ? 'DSH_G2_STAGE_CAP_REACHED' : 'DSH_G2_UNAPPROVED_ONEBOT_ACTION');
    }

    const event = {
      ordinal: ledger.events.length + 1,
      kind,
      at: new Date().toISOString(),
      method: 'WS',
      endpoint: new URL(this.url).href,
      body: payload,
    };
    ledger.events.push(event);
    persist();
    try {
      return originalSend.call(this, data, ...args);
    } catch (error) {
      event.failedAt = new Date().toISOString();
      event.errorKind = error instanceof Error ? error.name : 'unknown';
      persist();
      throw error;
    }
  };

  if (WebSocket.prototype.emit) {
    const originalEmit = WebSocket.prototype.emit;
    Object.defineProperty(WebSocket.prototype, instrumentedEmit, {value: true});
    WebSocket.prototype.emit = function observedEmit(name, ...args) {
      if (name === 'message' && plan.oneBot && new URL(this.url).href === new URL(plan.oneBot.endpoint).href) {
        try {
          const response = JSON.parse(String(args[0]));
          const event = ledger.events.find(candidate =>
            candidate.body?.echo === response.echo && ['qqMetadata', 'qqSend'].includes(candidate.kind));
          if (event) {
            event.responseAt = new Date().toISOString();
            event.response = response;
            if (event.kind === 'qqMetadata' && event.body.action === 'get_friend_list' && Array.isArray(response.data)) {
              event.response = {
                ...response,
                data: response.data.filter(friend => String(friend.user_id) === String(plan.oneBot.peerId)),
              };
            }
            persist();
          }
        } catch {}
      }
      return originalEmit.call(this, name, ...args);
    };
  }
}
