import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const runWorker = async (t, {mode, count, timeout}) => {
  const run = await mkdtemp(join(tmpdir(), 'role-context-growth-'));
  const evidence = join(run, 'evidence');
  const child = spawnSync(
    process.execPath,
    [new URL('./context-lineage-growth-worker.mjs', import.meta.url).pathname],
    {
      cwd: run,
      env: {
        PATH:process.env.PATH,
        HOME:join(run, 'home'),
        DSH_HOME:join(run, 'home'),
        TMPDIR:run,
        DSH_TEST_RUN:run,
        DSH_CONTEXT_EVIDENCE_DIRECTORY:evidence,
        DSH_CONTEXT_LINEAGE_TOOLS:String(count),
        DSH_CONTEXT_LINEAGE_MODE:mode,
        DSH_TELEMETRY_DISABLED:'1',
      },
      encoding:'utf8',
      timeout,
    },
  );
  let report;
  try {
    report = JSON.parse(await readFile(join(evidence, 'context-lineage-growth.json'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (child.status === 0) await rm(run, {recursive:true, force:true});
  else t.diagnostic('Retained context lineage failure at ' + run);
  assert.equal(child.error, undefined, child.stdout + child.stderr);
  assert.equal(child.status, 0, child.stdout + child.stderr);
  assert.equal(child.signal, null);
  assert.equal(report.status, 'passed');
  return report;
};

test('共享来源图不按经历路径指数展开或耗尽数组', {timeout:120000}, async t => {
  const report = await runWorker(t, {mode:'undispatched', count:28, timeout:110000});
  assert(report.goal, 'corrected goal remains available');
});

test('已派发但缺观察或最终证据的工具仍使依赖知识退出日常使用', {timeout:45000}, async t => {
  const report = await runWorker(t, {mode:'dispatched-gap', count:0, timeout:40000});
  assert.equal(report.goal, undefined);
});
