import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

const outputDirectory = await mkdtemp(join(tmpdir(), 'dsh-library-diagnostic-view-'));
const output = join(outputDirectory, 'library-diagnostic-view.mjs');
await build({
  entryPoints: [new URL('../packages/companion/src/host/library-diagnostic-view.ts', import.meta.url).pathname],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  outfile: output,
});
const {
  diagnosticSummary,
  projectionMaintenanceStatus,
  projectionProgressStatus,
} = await import(pathToFileURL(output).href);
await rm(outputDirectory, {recursive: true, force: true});

const preview = state => ({
  projectionId: 'settings',
  roleId: 'role-1',
  revision: 12,
  coreVersion: 3,
  settingsVersion: 2,
  state,
  expectedText: '{"core":{"text":"authority"}}',
  expectedDigest: 'a'.repeat(64),
  actualText: '{"core":{"text":"manual"}}',
  actualDigest: 'b'.repeat(64),
  importable: true,
  changes: ['core'],
});

test('projection maintenance states name processable, stale, unavailable and complete outcomes', () => {
  assert.deepEqual(
    ['diff', 'lag', 'unavailable', 'current'].map(state => projectionMaintenanceStatus(preview(state)).label),
    [
      '可处理：存在投影差异',
      '版本过期：需要重新预览',
      '不可处理：投影暂不可用',
      '已完成：投影与权威内容一致',
    ],
  );
});

test('projection physical progress distinguishes pending from completed work', () => {
  assert.equal(
    projectionProgressStatus({intent: 'committed', state: 'pending', preservedMaterialRef: 'material/1'}).label,
    '物理投影未完成',
  );
  assert.equal(
    projectionProgressStatus({intent: 'committed', state: 'complete', preservedMaterialRef: 'material/1'}).label,
    '物理投影已完成',
  );
});

test('diagnostic summary keeps verified healthy facts distinct from read-only faults', () => {
  assert.equal(diagnosticSummary({
    mode: 'healthy',
    reason: 'healthy',
    claimedRoleId: 'role-1',
    verifiedRoleId: 'role-1',
    verifiedRevision: 12,
    recovery: [],
    evidence: [],
  }).label, '资料完整性已通过');
  const fault = diagnosticSummary({
    mode: 'read-only',
    reason: 'MISSING_CONTENT',
    claimedRoleId: 'role-1',
    verifiedRoleId: null,
    verifiedRevision: null,
    recovery: ['retry-open'],
    evidence: [],
  });
  assert.equal(fault.label, '资料完整性故障');
  assert.match(fault.detail, /MISSING_CONTENT/);
});
