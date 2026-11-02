import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
test('默认Web当前QQ回复贯通profile配置，凭据轮换/离线DSH/新进程去重不重发',{timeout:120000},async t=>{
  const run=await mkdtemp(join(tmpdir(),'dsh-qq-profile38-'));let passed=false;
  t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic profile retained at '+run));
  for(const phase of ['first','fresh']){
    const child=spawnSync(process.execPath,[new URL('./qq-profile-worker.mjs',import.meta.url).pathname,phase],{cwd:run,env:{PATH:process.env.PATH,TMPDIR:run,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000});
    let result;try{result=JSON.parse(await readFile(join(run,'qq-profile-'+phase+'-result.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
    if(process.env.DSH_QQ_EVIDENCE_DIR){const dir=process.env.DSH_QQ_EVIDENCE_DIR;await mkdir(dir,{recursive:true});await writeFile(join(dir,'38-profile-'+phase+'-process.json'),JSON.stringify({status:child.status,signal:child.signal,error:child.error?{code:child.error.code,message:child.error.message}:null,resultPresent:!!result},null,2)+'\n');if(result)await writeFile(join(dir,'38-profile-'+phase+'.json'),JSON.stringify(result,null,2)+'\n');try{await writeFile(join(dir,'38-profile-'+phase+'-progress.json'),await readFile(join(run,'qq-profile-progress-'+phase+'.json')));}catch(error){if(error.code!=='ENOENT')throw error;}}
    assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);assert.equal(child.signal,null);assert.equal(child.status,0,child.stdout+'\n'+child.stderr);assert.equal(result.status,'passed');assert.equal(result.roleStopped,true);assert.equal(result.hostStopped,true);assert.equal(result.lockReleased,true);
  }
  passed=true;
});
