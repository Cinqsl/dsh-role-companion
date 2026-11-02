// #51 受控 OneBot 线协议 + 受控自主执行：只在本机 loopback 上证明联系/不联系与规则边界。
import './network-guard.mjs';
import {once} from 'node:events';
import {WebSocketServer} from 'ws';
import {mkdtemp, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome} from 'dsh-role-companion/home';
import {startRole, createNodeClock} from 'dsh-role-companion/runtime';
import {createQQReceiveAdapter} from 'dsh-role-companion';
import {validQQMessage} from './qq-wire-fixture.mjs';

export const waitFor = async (predicate, label = 'contact runtime') => { for (let n = 0; n < 1500; n++) { const value = await predicate(); if (value) return value; await new Promise(r => setTimeout(r, 10)); } throw Error(label + ' did not settle in 15 seconds'); };

/**
 * A controlled autonomous turn that goes through the *real* proposal path: reserveTool(proposal) →
 * permit.proposal.save → observe → canonical finalize. The Runtime then assesses/adopts it in
 * processReadyProposals; nothing is poked into Home directly.
 */
export function proposalTurnExecution({proposalText, internalText = '内部活动记录', onRun, userReply = '用户回复'}) {
  let calls = 0;
  return {inspect: async () => ({available: true, reason: 'controlled'}), prepare: async outputLimit => ({provider: 'deepseek-official', model: 'deepseek-flash', contextWindow: 131072, outputLimit}), run: async (plan, scope) => {
    if (onRun) await onRun(scope);
    const model = await scope.reserveModel({});
    await model.enter(); for await (const _ of model.iterate(async function* () { yield ''; })) {} await model.settle({kind: 'completed', data: {text: scope.source === 'user' ? userReply : internalText}});
    if (scope.source === 'user') return {kind: 'reply', text: userReply};
    // Each opportunity proposes its own topic: re-adopting the same topic is a knowledge version conflict.
    const value = proposalText(plan, ++calls);
    // Claim with a native association, exactly like the real adapter (sessionId:callSeq identifies the canonical record).
    const permit = await scope.reserveTool({name: 'role_propose', arguments: value, native: {sessionId: 'session-contact', callId: 'call-contact', callSeq: 1}}, {kind: 'proposal'});
    await permit.enter();
    const saved = await permit.invoke(undefined, () => permit.proposal.save(value));
    await permit.observe({kind: 'returned', value: saved});
    // The controlled port publishes the same canonical evidence the real Native adapter publishes:
    // a ToolsResult native record with issued-execution association, plus the final attempt outcome.
    scope.registerNative({nativeId: 'session-contact:final:1', provenance: 'tools-result', data: {association: 'issued-execution', name: 'role_propose', callSeq: 1, arguments: value, result: {isError: false, value: saved}}});
    permit.finalize({kind: 'completed', data: {final: {isError: false, content: [], value: saved}}});
    await scope.drain();
    return {kind: 'internal', reason: 'INTERNAL_ACTIVITY', text: internalText};
  }, quiesce: async () => ({idle: true, flushed: true}), close: async () => {}};
}

/** One controlled autonomous turn whose model "decides" to submit a contact proposal. */
export function contactTurnExecution({text, onRun, proposals}) {
  return {inspect: async () => ({available: true, reason: 'controlled'}), prepare: async outputLimit => ({provider: 'deepseek-official', model: 'deepseek-flash', contextWindow: 131072, outputLimit}), run: async (plan, scope) => {
    if (onRun) await onRun(scope);
    const attempt = await scope.reserveModel({test: 'synthetic'});
    await attempt.enter(); for await (const _ of attempt.iterate(async function* () { yield ''; })) {} await attempt.settle({kind: 'completed', data: {text}});
    if (scope.source === 'user') return {kind: 'reply', text};
    return {kind: 'internal', reason: 'INTERNAL_ACTIVITY', text};
  }, quiesce: async () => ({idle: true, flushed: true}), close: async () => {}};
}

export async function contactFixture(t, options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-contact51-')), homePath = join(root, 'role');
  const requests = [], events = [], sockets = [];
  const server = new WebSocketServer({host: '127.0.0.1', port: 0}); await once(server, 'listening');
  server.on('connection', socket => {
    sockets.push(socket);
    socket.on('message', bytes => {
      const request = JSON.parse(bytes.toString()); requests.push(request); events.push({kind: 'wire', action: request.action});
      if (request.action === 'send_private_msg') { (options.respond ?? ((s, r) => s.send(JSON.stringify({status: 'ok', retcode: 0, echo: r.echo, data: {message_id: 7001}}))))(socket, request); return; }
      const data = request.action === 'get_version_info' ? {app_name: 'SnowLuma', app_version: '2.0.3-node', protocol_version: 'v11'} : request.action === 'get_login_info' ? {user_id: 10001} : [{user_id: 20002}];
      socket.send(JSON.stringify({status: 'ok', retcode: 0, echo: request.echo, data}));
    });
  });
  const home = await createRoleHome(homePath, {operationId: 'contact-create', core: '合成主动联系角色，探索星图。', settings: {inputLimitBytes: 32768}}, options.io);
  await home.applyOwner({kind: 'bind-qq', operationId: 'contact-bind', connectionId: 'connection-contact', accountId: '10001', peerId: '20002', expectedBindingVersion: 0, expectedRevision: home.revision});
  if (options.contactRules) await home.applyOwner({kind: 'edit-contact-rules', operationId: 'contact-rules-initial', value: options.contactRules, expectedContactRulesVersion: 1, expectedRevision: home.revision});
  // The OneBot adapter compares the attempt deadline against the *real* wall clock, while these tests
  // run on an injected clock. A long configurable sendTimeoutMs keeps both in agreement; it is a real
  // user-editable rule, not a test-only hook.
  await home.applyOwner({kind: 'edit-delivery-rules', operationId: 'contact-delivery-initial', value: options.deliveryRules ?? {previewCodePoints: 1500, sendTimeoutMs: 2147483647}, expectedDeliveryRulesVersion: 1, expectedRevision: home.revision});
  const clock = options.clock ?? createNodeClock(() => new Date(options.utc ?? '2026-10-27T02:10:00.000Z'));
  const text = options.text ?? '今晚的星图整理好了，想和你说说。';
  const execution = options.execution ?? contactTurnExecution({text});
  let role;
  const adapter = createQQReceiveAdapter({configuration: () => ({enabled: true, connectionId: 'connection-contact', endpoint: `ws://127.0.0.1:${server.address().port}`, credentialRef: 'SYNTHETIC_CONTACT', maxFrameBytes: 1048576, readTimeoutMs: 100, reconnectInitialMs: 50, reconnectMaxMs: 100, jitterRatio: 0}), binding: async () => (await home.readSnapshot()).qqBinding, resolveCredential: async () => 'synthetic-contact', receive: input => role.runtime.receive(input)});
  role = await startRole(home, {clock, execution, inbound: adapter, delivery: adapter, ...(options.timers ? {timers: options.timers} : {})});
  adapter.start(); await waitFor(() => adapter.inspect().phase === 'ready', 'contact adapter ready');
  t.after(async () => {
    let timer, stopped = false;
    try { role.lifetime.requestStop('unload'); await Promise.race([role.lifetime.stopped, new Promise((_, reject) => timer = setTimeout(() => reject(Error('contact cleanup not stopped')), 4000))]); stopped = true; }
    finally { clearTimeout(timer); for (const socket of sockets) socket.terminate(); await new Promise(r => server.close(r)); if (stopped && !options.preserveHome) await rm(root, {recursive: true, force: true}); else t.diagnostic('Synthetic contact Home retained ' + root); }
  });
  const sends = () => requests.filter(r => r.action === 'send_private_msg');
  const wake = (reason = 'controlled-contact') => role.runtime.wake({reason});
  const state = () => role.owner.readConversation();
  return {root, homePath, home, role, adapter, requests, events, sockets, clock, sends, wake, state, text, sendInput: (id = -70) => sockets.at(-1).send(JSON.stringify(validQQMessage(id)))};
}
