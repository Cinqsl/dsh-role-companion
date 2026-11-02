import test from 'node:test';
import assert from 'node:assert/strict';
import { startRole } from 'dsh-role-companion/runtime';

test('未接入角色之家时保持未就绪，读取和关闭视图不执行工作', async () => {
  const role = await startRole(undefined, {});
  assert.deepEqual(await role.runtime.inspect(), { status: 'not-ready', reason: 'home-not-open', roleId: null, revision: null });
  assert.equal((await role.runtime.receive({ text: '你好' })).reason, 'not-ready');
  assert.equal((await role.runtime.wake({})).kind, 'skipped');
  assert.deepEqual(Object.keys(role.runtime).sort(), ['inspect', 'receive', 'wake']);
  assert.deepEqual(Object.keys(role.owner).sort(), [
    'apply','completeRestoreRegistration','confirmRestore','previewCleanup','previewFormatUpgrade','previewProjection',
    'queryQQHistory','readAutonomy','readAutonomyAttribution','readBackup','readCleanup','readCleanupCatalog',
    'readContactRules','readContactState','readContextSource','readContextSources','readConversation',
    'readDeliveryRules','readDiagnostic','readExecutionRecord','readFileAccess','readFileRules','readFormatUpgrade',
    'readHandover','readKnowledge','readLibraryOverviewFacts','readLibrarySources','readOperation',
    'readPreservedProjection','readProposalRules','readQQHistory','readReadRules','readReply','readRestore',
    'readRetryRules','readWebRules','requestBackup','requestCleanup','requestFormatUpgrade','requestHandover',
    'requestRestore','resumeBackup','resumeFormatUpgrade','retryArchives','selectQQHistory','stop','verifyBackup',
  ]);
  await assert.rejects(role.owner.readContextSources({offset:0,limit:10}),{code:'HOME_UNAVAILABLE'});
  role.lifetime.requestStop('unload');
  assert.equal((await role.lifetime.stopped).status, 'stopped');
});
