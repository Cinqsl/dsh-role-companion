import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {spawnSync} from 'node:child_process';
test('历史补查参数经原QQ配置owner/CAS保存，旧客户端不清新值且新进程完整保留',{timeout:100000},async t=>{
 const run=await mkdtemp(join(tmpdir(),'dsh-history-config42-'));let passed=false;t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Retained synthetic history config '+run));
 for(const phase of ['first','fresh']){
  const child=spawnSync(process.execPath,[new URL('./qq-history-config-worker.mjs',import.meta.url).pathname,phase],{cwd:run,env:{PATH:process.env.PATH,TMPDIR:run,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:40000});
  let result=null;try{result=JSON.parse(await readFile(join(run,'history42-config-'+phase+'.json'),'utf8'));}catch{}
  let absent=false;try{process.kill(child.pid,0);}catch(e){if(e.code!=='ESRCH')throw e;absent=true;}
  if(process.env.DSH42_EVIDENCE_DIR){await mkdir(process.env.DSH42_EVIDENCE_DIR,{recursive:true});await writeFile(join(process.env.DSH42_EVIDENCE_DIR,'42-config-'+phase+'.json'),JSON.stringify({child:{pid:child.pid,status:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,absent},result},null,2)+'\n');}
  assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);assert.equal(child.signal,null);assert.equal(absent,true);assert.equal(result.status,'passed',JSON.stringify(result.error));assert.equal(result.roleStopped,true);assert.equal(result.hostStopped,true);assert.equal(result.locksReleased,true);
 }passed=true;
});
