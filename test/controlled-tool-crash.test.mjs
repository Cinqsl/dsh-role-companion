import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

for (const window of ['observation','capture','finish','repeat-callid']) test('真实工具 '+window+' 强退后新进程恢复保留记录且不自动重做工具',{timeout:90000},async t=>{
  const run=await mkdtemp(join(tmpdir(),'dsh-role-tool-crash35-'));
  let passed=false;
  t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic failure evidence retained at '+run));
  const options={cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:40000};
  const worker=new URL('./controlled-tool-crash-worker.mjs',import.meta.url).pathname;
  const first=spawnSync(process.execPath,[worker,window,'first'],options);
  assert.equal(first.error,undefined,first.stdout+'\n'+first.stderr);
  assert.equal(first.signal,null,'forced exit must be the requested window, not a timeout signal');
  assert.equal(first.status,77,first.stdout+'\n'+first.stderr);
  const next=spawnSync(process.execPath,[worker,window,'recover'],options);
  assert.equal(next.error,undefined,next.stdout+'\n'+next.stderr);
  assert.equal(next.signal,null,'recovery must stop normally');
  assert.equal(next.status,0,next.stdout+'\n'+next.stderr);
  const result=JSON.parse(await readFile(join(run,'tool-crash-result.json'),'utf8'));
  assert.equal(result.status,'passed');
  assert.notEqual(result.first.pid,result.recovery.pid);
  assert.equal(result.first.orderlyStop,false);
  assert.equal(result.first.actualReaders,window==='repeat-callid'?2:1);
  assert.equal(result.recovery.actualReaders,0);
  assert.equal(result.recovery.actualSDKBodies,0);
  assert.equal(result.recovery.actualModels,window==='finish'?0:1);
  assert.equal(result.recovery.hostStopped,true);
  assert.equal(result.recovery.writerLockAbsent,true);
  if(process.env.DSH_TOOL_CRASH_EVIDENCE_DIR){
    await mkdir(process.env.DSH_TOOL_CRASH_EVIDENCE_DIR,{recursive:true});
    await writeFile(join(process.env.DSH_TOOL_CRASH_EVIDENCE_DIR,window+'.json'),JSON.stringify(result,null,2)+'\n');
  }
  passed=true;
});
