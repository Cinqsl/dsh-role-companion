import assert from 'node:assert/strict';
import {access, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {bootNativeFixture, response, waitFor} from './native-fixture.mjs';

const run = process.env.DSH_TEST_RUN;
let role;
const {ctx, module, entries, metadataEntries, shutdown} = await bootNativeFixture(
  run,
  () => response('hi lqs，我整理好星图线索了。'),
  {globalCompaction: false}
);
const report = {
  case: '59-autonomous-contact-guidance',
  status: 'running',
  realBusinessCalls: {model: 0, web: 0, qq: 0}
};

try {
  const {createRoleHome, openRoleHome} = await module('dsh-role-companion/home');
  const {startRole} = await module('dsh-role-companion/runtime');
  const {createNativeExecution} = await module('dsh-role-companion');
  const home = await createRoleHome(join(run, 'role'), {
    operationId: 'create59',
    core: '合成角色探索星图，并自行判断是否分享当前发现。',
    settings: {inputLimitBytes: 32768}
  });
  role = await startRole(home, {execution: await createNativeExecution(ctx)});
  const receipt = await role.runtime.wake({reason: 'autonomous-contact-guidance'});
  await waitFor(async () => {
    const view = await role.runtime.inspect();
    const state = await role.owner.readConversation();
    return state.turns[0]?.status === 'finished' || view.reason !== 'ready';
  });

  const state = await role.owner.readConversation();
  Object.assign(report, {
    roleId: home.roleId,
    revision: home.revision,
    receipt,
    state,
    actualModels: entries.length,
    metadata: metadataEntries.length,
    requests: entries.map(entry => entry.body)
  });
  await writeFile(join(run, 'autonomous-contact-guidance.json'), JSON.stringify(report, null, 2) + '\n');

  assert.equal(receipt.kind, 'accepted');
  assert.equal(entries.length, 1);
  assert.equal(metadataEntries.length, 0);
  assert.equal(state.turns[0]?.source, 'autonomous');
  assert.equal(state.turns[0]?.outcome.kind, 'internal');
  assert.equal(state.replies.length, 0);
  assert.equal(state.contact.intents.length, 0);
  assert.equal(state.sendAttempts.length, 0);
  assert.equal(state.deliveries.length, 0);

  role.lifetime.requestStop('unload');
  await role.lifetime.stopped;
  const reopened = await openRoleHome(join(run, 'role'));
  report.fresh = await reopened.readConversation();
  assert.deepEqual(report.fresh.turns, state.turns);
  await reopened.close();
  report.status = 'passed';
} finally {
  role?.lifetime.requestStop('unload');
  if (role) await role.lifetime.stopped;
  await shutdown.shutdown(0);
  for (const name of ['writer.lock', '.maintenance.lock']) {
    await assert.rejects(access(join(run, 'role', name)), {code: 'ENOENT'});
  }
  Object.assign(report, {roleStopped: true, hostStopped: true, locksReleased: true});
  await writeFile(join(run, 'autonomous-contact-guidance.json'), JSON.stringify(report, null, 2) + '\n');
}
