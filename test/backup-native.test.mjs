import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,rm,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

test('真实Native的工具final和必要flush未完成时不复制；停稳后副本在新进程保留完整记录',{timeout:60000},async t=>{
 const run=await mkdtemp(join(await realpath(tmpdir()),'dsh-backup-native54-'));t.after(()=>rm(run,{recursive:true,force:true}));
 const child=spawnSync(process.execPath,[new URL('./backup-native-worker.mjs',import.meta.url).pathname],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1',...(process.env.DSH54_PRODUCT_REVISION?{DSH54_PRODUCT_REVISION:process.env.DSH54_PRODUCT_REVISION}:{})},encoding:'utf8',timeout:45000});
 let actualChildPidAbsent=false;try{process.kill(child.pid,0);}catch(error){if(error.code==='ESRCH')actualChildPidAbsent=true;else throw error;}
 if(process.env.DSH54_NATIVE_EVIDENCE_DIRECTORY){
  await mkdir(process.env.DSH54_NATIVE_EVIDENCE_DIRECTORY,{recursive:true});
  await writeFile(join(process.env.DSH54_NATIVE_EVIDENCE_DIRECTORY,'process.json'),JSON.stringify({pid:child.pid,actualChildPidAbsent,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr},null,2)+'\n');
  try{await writeFile(join(process.env.DSH54_NATIVE_EVIDENCE_DIRECTORY,'result.json'),await readFile(join(run,'backup-native-result.json')));}catch{}
 }
 assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);assert.equal(child.status,0,child.stdout+'\n'+child.stderr);assert.equal(actualChildPidAbsent,true,'The actual Native Host child must have exited');
});
