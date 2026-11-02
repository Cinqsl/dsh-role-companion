import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,rm,mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

test('真实Web读体、未来canonical与必要flush阻止备份，停稳后新进程核对完整原JSON与结果',{timeout:60000},async t=>{
 const run=await mkdtemp(join(await realpath(tmpdir()),'role-web-backup44-'));let success=false;
 t.after(()=>success?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic web lifecycle fixture retained at '+run));
 const child=spawnSync(process.execPath,[new URL('./controlled-web-backup-worker.mjs',import.meta.url).pathname],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000});
 let absent=false;try{process.kill(child.pid,0);}catch(error){if(error.code!=='ESRCH')throw error;absent=true;}
 if(process.env.DSH44_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH44_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH44_EVIDENCE_DIRECTORY,'process.json'),JSON.stringify({pid:child.pid,actualChildPidAbsent:absent,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr},null,2)+'\n');try{await writeFile(join(process.env.DSH44_EVIDENCE_DIRECTORY,'result.json'),await readFile(join(run,'web-backup-result.json')));}catch{}}
 assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);assert.equal(child.signal,null);assert.equal(absent,true);success=true;
});
