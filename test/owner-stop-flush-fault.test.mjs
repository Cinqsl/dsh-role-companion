import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

test('必要Native flush一次拒绝后保持blocked，显式重试只完成原归档与关闭',{timeout:60000},async t=>{
  const run=await mkdtemp(join(tmpdir(),'dsh-owner-stop-flush37-'));
  let passed=false;
  t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic failure retained at '+run));
  const child=spawnSync(process.execPath,[new URL('./owner-stop-flush-fault-worker.mjs',import.meta.url).pathname],{
    cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000,
  });
  let result;
  try{result=JSON.parse(await readFile(join(run,'owner-stop-flush-fault-result.json'),'utf8'));}
  catch(error){if(error.code!=='ENOENT')throw error;}
  if(process.env.DSH_OWNER_STOP_FLUSH_EVIDENCE_DIR){
    await mkdir(process.env.DSH_OWNER_STOP_FLUSH_EVIDENCE_DIR,{recursive:true});
    await writeFile(join(process.env.DSH_OWNER_STOP_FLUSH_EVIDENCE_DIR,'process.json'),JSON.stringify({status:child.status,signal:child.signal,error:child.error?{code:child.error.code,message:child.error.message}:null,resultPresent:!!result},null,2)+'\n');
    if(result)await writeFile(join(process.env.DSH_OWNER_STOP_FLUSH_EVIDENCE_DIR,'result.json'),JSON.stringify(result,null,2)+'\n');
  }
  assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);
  assert.equal(child.signal,null,'timeout or signal termination is not successful stop');
  assert.equal(child.status,0,child.stdout+'\n'+child.stderr);
  assert.equal(result.status,'passed');
  assert.equal(result.requiredFlushEntries,2);assert.equal(result.requiredFlushRejections,1);assert.equal(result.requiredFlushListenerReturns,1);
  assert.equal(result.actualModels,1);assert.equal(result.actualReaders,1);assert.equal(result.actualSDKBodies,1);assert.equal(result.canonicalNotifications,1);
  assert.equal(result.realHomeCloses,1);assert.equal(result.nativeDisposeCalls,1);
  assert.equal(result.roleStopped,true);assert.equal(result.hostStopped,true);assert.equal(result.lockReleased,true);assert.equal(result.publicReopen,true);
  passed=true;
});
