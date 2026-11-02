import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

test('Home.close首次拒绝保持blocked及持有权，修复只关闭原Home不重做业务',{timeout:60000},async t=>{
  const run=await mkdtemp(join(tmpdir(),'dsh-owner-stop-close37-'));let passed=false;
  t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic failure retained at '+run));
  const child=spawnSync(process.execPath,[new URL('./owner-stop-close-fault-worker.mjs',import.meta.url).pathname],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000});
  assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);assert.equal(child.signal,null);assert.equal(child.status,0,child.stdout+'\n'+child.stderr);
  const result=JSON.parse(await readFile(join(run,'owner-stop-close-fault-result.json'),'utf8'));
  assert.equal(result.status,'passed');assert.equal(result.closeAttempts,2);assert.equal(result.realCloseCalls,1);assert.equal(result.actualModels,2);assert.equal(result.actualReaders,1);assert.equal(result.canonicalNotifications,1);
  assert.equal(result.roleStopped,true);assert.equal(result.hostStopped,true);assert.equal(result.lockReleased,true);assert.equal(result.publicReopen,true);
  if(process.env.DSH_OWNER_STOP_CLOSE_EVIDENCE_DIR){await mkdir(process.env.DSH_OWNER_STOP_CLOSE_EVIDENCE_DIR,{recursive:true});await writeFile(join(process.env.DSH_OWNER_STOP_CLOSE_EVIDENCE_DIR,'once-rejected.json'),JSON.stringify(result,null,2)+'\n');}
  passed=true;
});
