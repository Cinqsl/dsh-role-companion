import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
test('38/54真实Gateway共用原migration停止：pending备份取消QQ重开，fresh旧verified备份不取消新权限',{timeout:110000},async t=>{
 const run=await mkdtemp(join(tmpdir(),'dsh-qq-backup-interlock-'));let passed=false;t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic joint fixture retained at '+run));
 for(const phase of ['first','fresh']){
  const child=spawnSync(process.execPath,[new URL('./qq-backup-interlock-worker.mjs',import.meta.url).pathname,phase],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000});let result;try{result=JSON.parse(await readFile(join(run,'qq-backup-interlock-'+phase+'.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(process.env.DSH_QQ_EVIDENCE_DIR){await mkdir(process.env.DSH_QQ_EVIDENCE_DIR,{recursive:true});await writeFile(join(process.env.DSH_QQ_EVIDENCE_DIR,'38-54-interlock-'+phase+'.json'),JSON.stringify({process:{status:child.status,signal:child.signal,error:child.error?{code:child.error.code,message:child.error.message}:null},result:result??null},null,2)+'\n');}
  assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);assert.equal(child.signal,null);assert.equal(child.status,0,child.stdout+'\n'+child.stderr);assert.equal(result.status,'passed');assert.equal(result.roleStopped,true);assert.equal(result.hostStopped,true);assert.equal(result.lockReleased,true);assert.equal(result.actualModels,1);
 }passed=true;
});
