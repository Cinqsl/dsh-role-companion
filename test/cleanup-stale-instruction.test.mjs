import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

test('清理引用已撤销来源的旧指令后，受控 Native 请求不重放旧指令且新确认可采纳',{timeout:90000},async()=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'dsh-cleanup-stale-instruction-'));
 const child=spawnSync(process.execPath,[new URL('./cleanup-stale-instruction-worker.mjs',import.meta.url).pathname],{cwd:root,env:{PATH:process.env.PATH,HOME:join(root,'home'),DSH_HOME:join(root,'home'),TMPDIR:root,DSH_TEST_RUN:root,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:75000});
 let pidAbsent=false;try{process.kill(child.pid,0);}catch(error){if(error.code!=='ESRCH')throw error;pidAbsent=true;}
 await writeFile(join(root,'process.json'),JSON.stringify({pid:child.pid,pidAbsent,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr},null,2)+'\n');
 assert.equal(child.error,undefined,child.stderr);assert.equal(child.status,0,child.stderr);assert.equal(child.signal,null);assert(pidAbsent);
 const report=JSON.parse(await readFile(join(root,'stale-instruction-cleanup.json')));
 assert.equal(report.status,'passed');assert.deepEqual(report.realBusinessCalls,{model:0,web:0,qq:0});
 assert.equal(report.postCleanupRequest.staleInstructionAbsent,true);assert.equal(report.postCleanupRequest.oldSourceAbsent,true);assert.equal(report.postCleanupRequest.currentConfirmationPresent,true);
 assert.equal(report.newVersion.version,2);assert(report.cleanup.effects.some(effect=>effect.kind==='input'&&effect.action==='revoke'),'cleanup must revoke the stale inputs');
 assert(report.locksReleased);assert(report.roleStopped);assert(report.hostStopped);
});
