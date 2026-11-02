import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import test from 'node:test';

import {instrumentWebSocket, summarizeNetworkLedger} from '../scripts/g2-final-network-policy.mjs';

const endpoint = 'ws://127.0.0.1:3001/';
const plan = {
  qqSendCap: 1,
  qqMetadataCap: 3,
  oneBot: {endpoint, accountId: '10001', peerId: '20002'},
};

class FakeWebSocket extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    this.sent = [];
  }

  send(data) {
    this.sent.push(data);
  }
}

test('OneBot metadata and sends are counted before dispatch and denied above their caps', () => {
  const ledger = {events: [], rejected: []};
  instrumentWebSocket(FakeWebSocket, {
    ledger,
    persist() {},
    plan,
  });
  const socket = new FakeWebSocket(endpoint);

  socket.send(JSON.stringify({action: 'get_version_info', echo: 'metadata-1'}));
  socket.send(JSON.stringify({action: 'send_private_msg', params: {user_id: '20002'}, echo: 'send-1'}));
  assert.deepEqual(ledger.events.map(event => event.kind), ['qqMetadata', 'qqSend']);
  assert.equal(socket.sent.length, 2);
  const response = {status: 'ok', retcode: 0, data: {message_id: '-9001'}, echo: 'send-1'};
  socket.emit('message', Buffer.from(JSON.stringify(response)));
  assert.deepEqual(ledger.events[1].response, response);

  assert.throws(
    () => socket.send(JSON.stringify({action: 'send_private_msg', params: {user_id: '20002'}, echo: 'send-2'})),
    /DSH_G2_STAGE_CAP_REACHED/,
  );
  assert.equal(socket.sent.length, 2);
  assert.equal(ledger.rejected.at(-1).kind, 'qqSend');
});

test('OneBot sends cannot escape a zero cap through a different socket or peer', () => {
  const ledger = {events: [], rejected: []};
  class ZeroCapWebSocket extends EventEmitter {
    constructor(url) {
      super();
      this.url = url;
      this.sent = [];
    }

    send(data) {
      this.sent.push(data);
    }
  }
  instrumentWebSocket(ZeroCapWebSocket, {
    ledger,
    persist() {},
    plan: {...plan, qqSendCap: 0},
  });

  const wrongSocket = new ZeroCapWebSocket('ws://127.0.0.1:3999/');
  assert.throws(
    () => wrongSocket.send(JSON.stringify({action: 'send_private_msg', params: {user_id: '20002'}})),
    /DSH_G2_UNAPPROVED_ONEBOT_ACTION/,
  );

  const wrongPeer = new ZeroCapWebSocket(endpoint);
  assert.throws(
    () => wrongPeer.send(JSON.stringify({action: 'send_private_msg', params: {user_id: '20003'}})),
    /DSH_G2_UNAPPROVED_ONEBOT_ACTION/,
  );

  assert.throws(
    () => wrongPeer.send(JSON.stringify({action: 'send_private_msg', params: {user_id: '20002'}})),
    /DSH_G2_STAGE_CAP_REACHED/,
  );
  assert.equal(ledger.events.length, 0);
  assert.equal(wrongSocket.sent.length + wrongPeer.sent.length, 0);
});

test('report network totals derive QQ sends from observed wire events', () => {
  const ledger = {
    events: [
      {kind: 'search'},
      {kind: 'qqMetadata'},
      {kind: 'qqSend'},
      {kind: 'qqSend'},
    ],
    rejected: [{kind: 'qqSend'}],
  };

  assert.deepEqual(summarizeNetworkLedger(ledger), {
    events: 4,
    rejected: 1,
    kinds: {
      model: 0,
      modelMetadata: 0,
      search: 1,
      fetch: 0,
      qqSend: 2,
      qqMetadata: 1,
    },
    realBusinessCalls: {model: 0, web: 1, qq: 2, qqMetadata: 1},
  });
});
