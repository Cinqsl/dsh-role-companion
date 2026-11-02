import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
for(const mode of ['double-503','auth','context','rate-429','limit-0','limit-1','wait-rules','wait-stop','wait-core'])test(mode+'：真实primary retry边界',{timeout:60000},async t=>{
  const run=await mkdtemp(join(tmpdir(),'dsh-model-retry-boundaries36-'));let passed=false;
  t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic failure retained at '+run));
  const child=spawnSync(process.execPath,[new URL('./model-retry-boundaries-worker.mjs',import.meta.url).pathname,mode],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000});
  let result;try{result=JSON.parse(await readFile(join(run,'model-retry-boundaries-result.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(process.env.DSH_MODEL_RETRY_BOUNDARIES_EVIDENCE_DIR){const dir=join(process.env.DSH_MODEL_RETRY_BOUNDARIES_EVIDENCE_DIR,mode);await mkdir(dir,{recursive:true});await writeFile(join(dir,'process.json'),JSON.stringify({status:child.status,signal:child.signal,error:child.error?{code:child.error.code,message:child.error.message}:null,resultPresent:!!result},null,2)+'\n');if(result)await writeFile(join(dir,'result.json'),JSON.stringify(result,null,2)+'\n');}
  assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);assert.equal(child.signal,null);assert.equal(child.status,0,child.stdout+'\n'+child.stderr);assert.equal(result.status,'passed');assert.equal(result.roleStopped,true);assert.equal(result.hostStopped,true);assert.equal(result.lockReleased,true);assert.equal(result.publicReopen,true);passed=true;
});
