import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

for(const [shape,derived] of [['exact','retain'],['quote-trimmed','retain'],['quote-trimmed','remove'],['text-trimmed','retain'],['inner-difference','retain']])test('仅尾随空白不同的逐字用户报告在来源图中仍独立，清理采用回合见过的无关来源不撤销；非尾随差异不采用：'+shape+'/'+derived,{timeout:90000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'dsh-lineage-trailing-user-report-'));
 const child=spawnSync(process.execPath,[new URL('./lineage-trailing-user-report-worker.mjs',import.meta.url).pathname,shape,derived],{cwd:root,env:{PATH:process.env.PATH,HOME:join(root,'home'),DSH_HOME:join(root,'home'),TMPDIR:root,DSH_TEST_RUN:root,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:75000});
 let pidAbsent=false;try{process.kill(child.pid,0);}catch(error){if(error.code!=='ESRCH')throw error;pidAbsent=true;}
 await writeFile(join(root,'process.json'),JSON.stringify({pid:child.pid,pidAbsent,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr},null,2)+'\n');t.diagnostic('Synthetic Native fixture retained at '+root);
 assert.equal(child.error,undefined,child.stderr);assert.equal(child.status,0,child.stderr);assert.equal(child.signal,null);assert(pidAbsent);
 const report=JSON.parse(await readFile(join(root,'lineage-trailing-user-report.json')));
 assert.equal(report.status,'passed');assert.deepEqual(report.realBusinessCalls,{model:0,web:0,qq:0});assert.equal(report.reportFrameSawUnrelated,true);assert(report.locksReleased);assert(report.roleStopped);assert(report.hostStopped);
 if(shape==='inner-difference')assert.equal(report.processing.status,'pending-review');
 else{assert.equal(report.processing.status,'adopted');assert.equal(report.afterUnrelatedCleanup.availableForDaily,true);}
});
