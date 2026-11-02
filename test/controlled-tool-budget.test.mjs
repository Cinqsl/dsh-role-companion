import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

async function worker(run,phase){
 const child=spawnSync(process.execPath,[new URL('./controlled-tool-budget-worker.mjs',import.meta.url).pathname,phase],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:30000});
 const file=join(run,phase+'.json');let evidence;
 try{evidence=JSON.parse(await readFile(file,'utf8'));}catch{}
 if(process.env.DSH_TOOL_BUDGET_EVIDENCE_DIRECTORY&&evidence){await mkdir(process.env.DSH_TOOL_BUDGET_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH_TOOL_BUDGET_EVIDENCE_DIRECTORY,phase+'.json'),JSON.stringify({...evidence,processExitCode:child.status,processError:child.error?.message??null},null,2)+'\n');}
 assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);
 assert.equal(child.status,0,child.stdout+'\n'+child.stderr+'\n'+JSON.stringify(evidence));
 assert.equal(evidence.status,'passed');return evidence;
}

test('工具额度为零时真实 reader 不进入，新进程重开仍实际拒绝',{timeout:70000},async t=>{
 const run=await mkdtemp(join(tmpdir(),'dsh-tool-budget-zero-'));t.after(()=>rm(run,{recursive:true,force:true}));
 const first=await worker(run,'zero-create'),reopened=await worker(run,'zero-reopen');
 assert.equal(reopened.roleId,first.roleId);assert.deepEqual(reopened.rules,first.rules);assert.notEqual(reopened.turn.runId,first.turn.runId);
});

test('失败工具保留一次已收费尝试，后续原生调用不能借失败返还额度',{timeout:40000},async t=>{
 const run=await mkdtemp(join(tmpdir(),'dsh-tool-budget-failed-'));t.after(()=>rm(run,{recursive:true,force:true}));
 await worker(run,'failed');
});

for(const [phase,title]of [['cancelled','用户取消后保留已开始工具的收费与原始观察'],['not-dispatched','预留后实际派发前合作期限到期仍收费且阻止下一工具']])test(title,{timeout:40000},async t=>{
 const run=await mkdtemp(join(tmpdir(),'dsh-tool-budget-'+phase+'-'));t.after(()=>rm(run,{recursive:true,force:true}));
 await worker(run,phase);
});

test('同run调高再调低工具额度保留用量和原deadline，旧请求收尾且新进程消费保存值',{timeout:70000},async t=>{
 const run=await mkdtemp(join(tmpdir(),'dsh-tool-budget-limits-'));t.after(()=>rm(run,{recursive:true,force:true}));
 const first=await worker(run,'limits-create'),reopened=await worker(run,'limits-reopen');
 assert.equal(reopened.roleId,first.roleId);assert.deepEqual(reopened.rules,first.rules);assert.notEqual(reopened.turn.runId,first.turn.runId);
 assert.equal(reopened.toolAttempts.filter(attempt=>attempt.runId===first.turn.runId).length,2);
});
