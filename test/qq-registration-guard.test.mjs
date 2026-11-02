import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
test('未登记Home的QQ配置操作在停止/写profile前拒绝，不切离原角色',{timeout:40000},async t=>{
 const run=await mkdtemp(join(tmpdir(),'dsh-qq-registration38-'));let passed=false;t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic fixture retained at '+run));
 const child=spawnSync(process.execPath,[new URL('./qq-registration-guard-worker.mjs',import.meta.url).pathname],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:30000});let result;try{result=JSON.parse(await readFile(join(run,'qq-registration-guard-result.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 if(process.env.DSH_QQ_EVIDENCE_DIR){await mkdir(process.env.DSH_QQ_EVIDENCE_DIR,{recursive:true});await writeFile(join(process.env.DSH_QQ_EVIDENCE_DIR,'38-unregistered-home-guard.json'),JSON.stringify({process:{status:child.status,signal:child.signal,error:child.error?{code:child.error.code,message:child.error.message}:null},result:result??null},null,2)+'\n');}
 assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);assert.equal(child.signal,null);assert.equal(child.status,0,child.stdout+'\n'+child.stderr);assert.equal(result.status,'passed');assert.equal(result.hostStopped,true);assert.equal(result.actualModels,0);passed=true;
});
