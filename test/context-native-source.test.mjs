import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,rm,mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

for(const[mode,title]of [['context-refresh','真实核心撤销等待旧body和canonical收尾，在同Run预算和期限内销毁旧Session重建'],['cancel','真实执行观察成功但用户取消使canonical错误，来源配对不能重造成功value'],['normal','真实Native工具调用、执行观察与最终规范结果由Home reader配对为过去经历'],['held-final','真实canonical发布使资料版本变化，旧reader拒读并由新reader取得完整配对']])test(title,{timeout:60000},async t=>{
 const run=await mkdtemp(join(await realpath(tmpdir()),'role-context-native45-'));let success=false;t.after(()=>success?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic Native source fixture retained at '+run));
 const child=spawnSync(process.execPath,[new URL('./context-native-source-worker.mjs',import.meta.url).pathname,mode],{cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),TMPDIR:run,DSH_TEST_RUN:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000});
 let absent=false;try{process.kill(child.pid,0);}catch(error){if(error.code!=='ESRCH')throw error;absent=true;}
 if(process.env.DSH45_EVIDENCE_DIRECTORY){await mkdir(process.env.DSH45_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH45_EVIDENCE_DIRECTORY,mode+'-source-process.json'),JSON.stringify({pid:child.pid,actualPidAbsent:absent,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr},null,2)+'\n');try{await writeFile(join(process.env.DSH45_EVIDENCE_DIRECTORY,mode+'-source.json'),await readFile(join(run,'context-native-source.json')));}catch{}}
 assert.equal(child.error,undefined,child.stdout+child.stderr);assert.equal(child.status,0,child.stdout+child.stderr);assert.equal(child.signal,null);assert.equal(absent,true);success=true;
});
