import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('可信原生模型收到完整参数拒绝后，可在同一Run和原期限内付费纠正自然休息提议',{timeout:60000},async t=>{
 const run=await mkdtemp('/private/tmp/dsh-argument-feedback-');
 const child=spawnSync(process.execPath,[new URL('./native-tool-argument-feedback-worker.mjs',import.meta.url).pathname,'rest'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:50000});
 if(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'process.json'),JSON.stringify({pid:child.pid,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,retainedRun:run},null,2)+'\n');try{await writeFile(join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'result.json'),await readFile(join(run,'argument-feedback-result.json')));}catch{}}
 t.diagnostic('retained '+run);assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);
});

test('参数拒绝的最终规范记录未保存时，不预留或进入后继模型；保存后才允许原Run纠正',{timeout:60000},async t=>{
 const run=await mkdtemp('/private/tmp/dsh-argument-held-');
 const child=spawnSync(process.execPath,[new URL('./native-tool-argument-feedback-worker.mjs',import.meta.url).pathname,'held-denial'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:50000});
 if(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY){const out=join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'held-denial');await mkdir(out,{recursive:true});await writeFile(join(out,'process.json'),JSON.stringify({pid:child.pid,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,retainedRun:run},null,2)+'\n');try{await writeFile(join(out,'result.json'),await readFile(join(run,'argument-feedback-result.json')));}catch{}}
 t.diagnostic('retained '+run);assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);
});

test('参数拒绝归档失败仍封闭后继模型与stop，补存原结果不会重做模型或工具',{timeout:60000},async t=>{
 const run=await mkdtemp('/private/tmp/dsh-argument-failed-');
 const child=spawnSync(process.execPath,[new URL('./native-tool-argument-feedback-worker.mjs',import.meta.url).pathname,'failed-denial'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:50000});
 if(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY){const out=join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'failed-denial');await mkdir(out,{recursive:true});await writeFile(join(out,'process.json'),JSON.stringify({pid:child.pid,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,retainedRun:run},null,2)+'\n');try{await writeFile(join(out,'result.json'),await readFile(join(run,'argument-feedback-result.json')));}catch{}}
 t.diagnostic('retained '+run);assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);
});

test('模型伪造owner字段仍封闭当前Run，不会获得参数纠正通道或工具许可',{timeout:60000},async t=>{
 const run=await mkdtemp('/private/tmp/dsh-argument-owner-');
 const child=spawnSync(process.execPath,[new URL('./native-tool-argument-feedback-worker.mjs',import.meta.url).pathname,'fake-owner'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:50000});
 if(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY){const out=join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'fake-owner');await mkdir(out,{recursive:true});await writeFile(join(out,'process.json'),JSON.stringify({pid:child.pid,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,retainedRun:run},null,2)+'\n');try{await writeFile(join(out,'result.json'),await readFile(join(run,'argument-feedback-result.json')));}catch{}}
 t.diagnostic('retained '+run);assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);
});

test('模型伪造scope对象仍封闭当前Run，不会把能力形状错误当作普通参数反馈',{timeout:60000},async t=>{
 const run=await mkdtemp('/private/tmp/dsh-argument-scope-');
 const child=spawnSync(process.execPath,[new URL('./native-tool-argument-feedback-worker.mjs',import.meta.url).pathname,'fake-scope'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:50000});
 if(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY){const out=join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'fake-scope');await mkdir(out,{recursive:true});await writeFile(join(out,'process.json'),JSON.stringify({pid:child.pid,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,retainedRun:run},null,2)+'\n');try{await writeFile(join(out,'result.json'),await readFile(join(run,'argument-feedback-result.json')));}catch{}}
 t.diagnostic('retained '+run);assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);
});

test('可信参数反馈不返还模型额度，修正所需的新模型到限仍被拒绝',{timeout:60000},async t=>{
 const run=await mkdtemp('/private/tmp/dsh-argument-budget-');
 const child=spawnSync(process.execPath,[new URL('./native-tool-argument-feedback-worker.mjs',import.meta.url).pathname,'budget'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:50000});
 if(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY){const out=join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'budget');await mkdir(out,{recursive:true});await writeFile(join(out,'process.json'),JSON.stringify({pid:child.pid,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,retainedRun:run},null,2)+'\n');try{await writeFile(join(out,'result.json'),await readFile(join(run,'argument-feedback-result.json')));}catch{}}
 t.diagnostic('retained '+run);assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);
});

test('未知工具仍封闭当前原生Run，不借参数反馈路径扩展工具白名单',{timeout:60000},async t=>{
 const run=await mkdtemp('/private/tmp/dsh-argument-unknown-');
 const child=spawnSync(process.execPath,[new URL('./native-tool-argument-feedback-worker.mjs',import.meta.url).pathname,'unknown-tool'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:50000});
 if(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY){const out=join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'unknown-tool');await mkdir(out,{recursive:true});await writeFile(join(out,'process.json'),JSON.stringify({pid:child.pid,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,retainedRun:run},null,2)+'\n');try{await writeFile(join(out,'result.json'),await readFile(join(run,'argument-feedback-result.json')));}catch{}}
 t.diagnostic('retained '+run);assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);
});

test('语法合法但来源未获准的读取仍封闭Run，不作为普通参数纠正返回',{timeout:60000},async t=>{
 const run=await mkdtemp('/private/tmp/dsh-argument-source-');
 const child=spawnSync(process.execPath,[new URL('./native-tool-argument-feedback-worker.mjs',import.meta.url).pathname,'ungranted-source'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:50000});
 if(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY){const out=join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'ungranted-source');await mkdir(out,{recursive:true});await writeFile(join(out,'process.json'),JSON.stringify({pid:child.pid,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,retainedRun:run},null,2)+'\n');try{await writeFile(join(out,'result.json'),await readFile(join(run,'argument-feedback-result.json')));}catch{}}
 t.diagnostic('retained '+run);assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);
});

test('可信role_read缺少定位ID的语法错误可完整反馈并在同Run付费改为获准读取',{timeout:60000},async t=>{
 const run=await mkdtemp('/private/tmp/dsh-argument-read-');
 const child=spawnSync(process.execPath,[new URL('./native-tool-argument-feedback-worker.mjs',import.meta.url).pathname,'read-feedback'],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:50000});
 if(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY){const out=join(process.env.DSH59_ARGUMENT_EVIDENCE_DIRECTORY,'read-feedback');await mkdir(out,{recursive:true});await writeFile(join(out,'process.json'),JSON.stringify({pid:child.pid,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr,retainedRun:run},null,2)+'\n');try{await writeFile(join(out,'result.json'),await readFile(join(run,'argument-feedback-result.json')));}catch{}}
 t.diagnostic('retained '+run);assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);
});
