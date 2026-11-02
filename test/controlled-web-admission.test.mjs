import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,rm,mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
for(const[mode,title]of [['owner','原official owner变更在真实entry保存后仍封口'],['stop','owner停止在真实entry保存后仍封口']])test('实际Native预留后未dispatch：'+title,{timeout:60000},async t=>{
 const run=await mkdtemp(join(await realpath(tmpdir()),'role-web-admission44-'));let success=false;
 t.after(()=>success?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic web admission fixture retained at '+run));
 const child=spawnSync(process.execPath,[new URL('./controlled-web-admission-worker.mjs',import.meta.url).pathname,mode],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000});
 let absent=false;try{process.kill(child.pid,0);}catch(error){if(error.code!=='ESRCH')throw error;absent=true;}
 if(process.env.DSH44_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH44_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH44_EVIDENCE_DIRECTORY,mode+'-process.json'),JSON.stringify({pid:child.pid,actualChildPidAbsent:absent,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr},null,2)+'\n');try{await writeFile(join(process.env.DSH44_EVIDENCE_DIRECTORY,mode+'-result.json'),await readFile(join(run,'web-admission-result.json')));}catch{}}
 assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);assert.equal(child.signal,null);assert.equal(absent,true);success=true;
});
