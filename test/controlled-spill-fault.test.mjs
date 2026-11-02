import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

for(const mode of ['stable','cleanup','sdk-cleanup','symlink','hardlink','concurrent-producer','producer-during-save'])test('SDK 外置资料 '+mode+'：关联、后继准入与停开一致',{timeout:60000},async t=>{
 const run=await mkdtemp(join(tmpdir(),'dsh-spill-fault35-'));t.after(()=>rm(run,{recursive:true,force:true}));
 const child=spawnSync(process.execPath,[new URL('./controlled-spill-fault-worker.mjs',import.meta.url).pathname,mode],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:30000});
 if(process.env.DSH_SPILL_FAULT_EVIDENCE_DIRECTORY){const directory=process.env.DSH_SPILL_FAULT_EVIDENCE_DIRECTORY;await mkdir(directory,{recursive:true});for(const name of ['spill-fault-result.json','spill-fault-failure.json']){try{await writeFile(join(directory,mode+(name==='spill-fault-result.json'?'':'-failure')+'.json'),await readFile(join(run,name)));}catch(error){if(error.code!=='ENOENT')throw error;}}await writeFile(join(directory,mode+'-process.json'),JSON.stringify({mode,exitCode:child.status,signal:child.signal,errorCode:child.error?.code??null,stdout:child.stdout?.replaceAll(run,'<isolated-spill-fault>'),stderr:child.stderr?.replaceAll(run,'<isolated-spill-fault>')},null,2)+'\n');}
 assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);assert.equal(child.status,0,child.stdout+'\n'+child.stderr);
 const result=JSON.parse(await readFile(join(run,'spill-fault-result.json'),'utf8'));assert.equal(result.hostStopped,true);assert.equal(result.writerLockReleased,true);
});
