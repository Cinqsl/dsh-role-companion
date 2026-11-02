import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
test('真实官方profile owner拒绝Home overlay覆盖且失败后不自动重开，fresh保留原有效参数',{timeout:110000},async t=>{
 const run=await mkdtemp(join(tmpdir(),'dsh-qq-overlay38-'));let passed=false;t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic fixture retained at '+run));
 for(const phase of ['seed','first','fresh']){
  const child=spawnSync(process.execPath,[new URL('./qq-profile-fault-worker.mjs',import.meta.url).pathname,phase],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000});let result;try{result=JSON.parse(await readFile(join(run,'qq-profile-fault-result-'+phase+'.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(process.env.DSH_QQ_EVIDENCE_DIR){await mkdir(process.env.DSH_QQ_EVIDENCE_DIR,{recursive:true});await writeFile(join(process.env.DSH_QQ_EVIDENCE_DIR,'38-profile-overlay-'+phase+'.json'),JSON.stringify({process:{status:child.status,signal:child.signal,error:child.error?{code:child.error.code,message:child.error.message}:null},result:result??null},null,2)+'\n');}
  assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);assert.equal(child.signal,null);assert.equal(child.status,0,child.stdout+'\n'+child.stderr);assert.equal(result.status,'passed');assert.equal(result.hostStopped,true);assert.equal(result.roleStopped,true);assert.equal(result.lockReleased,true);assert.equal(result.actualModels,0);
 }passed=true;
});
