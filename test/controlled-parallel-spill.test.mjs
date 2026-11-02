import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

test('同一角色两份并行读取逆序完成，完整 spill 按模型顺序归档后才进入下一模型', {timeout:60000}, async t => {
  const run = await mkdtemp(join(tmpdir(), 'dsh-role-parallel-spill35-'));
  t.after(() => rm(run, {recursive:true, force:true}));
  const child = spawnSync(process.execPath, [new URL('./controlled-parallel-spill-worker.mjs', import.meta.url).pathname], {
    cwd:run,
    env:{PATH:process.env.PATH, HOME:join(run,'home'), DSH_HOME:join(run,'home'), DSH_TEST_RUN:run,TMPDIR:run, DSH_TELEMETRY_DISABLED:'1'},
    encoding:'utf8', timeout:45000,
  });
  assert.equal(child.error, undefined, child.stdout+'\n'+child.stderr);
  assert.equal(child.status, 0, child.stdout+'\n'+child.stderr);
  const result = JSON.parse(await readFile(join(run,'parallel-spill-result.json'),'utf8'));
  assert.equal(result.status,'passed');
  assert.deepEqual(result.readerCompletionOrder,['B','A']);
  assert.deepEqual(result.postOrder,['A','B']);
  assert.deepEqual(result.finalOrder,['A','B']);
  assert.equal(result.actualModelEntries,2);
  assert.equal(result.actualReaderEntries,2);
  assert.equal(result.canonicalNotifications,2);
  assert.equal(result.reopened,true);
  assert.equal(result.writerLockAbsent,true);
  assert.equal(result.hostStopped,true);
  if (process.env.DSH_PARALLEL_SPILL_EVIDENCE) {
    await writeFile(process.env.DSH_PARALLEL_SPILL_EVIDENCE,JSON.stringify(result,null,2)+'\n');
  }
});
