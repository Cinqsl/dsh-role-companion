import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {spawn} from 'node:child_process';import {once} from 'node:events';
function worker(t,action,path){const child=spawn(process.execPath,[new URL('./home-worker.mjs',import.meta.url).pathname,action,path],{stdio:['pipe','pipe','pipe']});t.after(()=>child.kill('SIGKILL'));let data='';const result=new Promise((resolve,reject)=>{child.stdout.on('data',chunk=>{data+=chunk;const end=data.indexOf('\n');if(end>=0)resolve(JSON.parse(data.slice(0,end)));});child.on('error',reject);child.on('exit',()=>{if(!data)reject(Error('worker exited without result'));});});return {child,result,close:async()=>{const done=once(child,'exit');child.stdin.end('close');await done;}};}
test('两个新进程并发创建只有一个持有者，停旧后重新打开同一身份',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-process-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const contenders=[worker(t,'create',path),worker(t,'create',path)];const result=await Promise.all(contenders.map(c=>c.result));assert.equal(result.filter(v=>v.stage==='opened').length,1);assert.equal(result.filter(v=>v.stage==='rejected').length,1);const winner=result.findIndex(v=>v.stage==='opened');const roleId=result[winner].view.roleId;await contenders[winner].close();const next=worker(t,'open',path);assert.equal((await next.result).view.roleId,roleId);await next.close();
});
test('提交发布后杀进程，多个 stale takeover 竞争者只允许一个写者并查询原结果',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-crash-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const initial=worker(t,'create',path);const first=await initial.result;await initial.close();const crashing=worker(t,'crash-edit',path);const published=await crashing.result;assert.equal(published.stage,'published');const exited=once(crashing.child,'exit');crashing.child.kill('SIGKILL');await exited;
 const contenders=[worker(t,'open',path),worker(t,'open',path),worker(t,'open',path)];const results=await Promise.all(contenders.map(c=>c.result));assert.equal(results.filter(v=>v.stage==='opened').length,1);const winner=results.findIndex(v=>v.stage==='opened');const restored=results[winner];assert.equal(restored.view.roleId,first.view.roleId);assert.equal(restored.view.home.core.text,'中断后的已发布核心');assert.equal(restored.operation.committedRevision,published.revision);await contenders[winner].close();
});

test('真实锁与 identity 发布窗口中断后恢复原创建，活写者别名不被竞争者删除',async t=>{
 const {link,lstat}=await import('node:fs/promises');
 for(const action of ['crash-identity','crash-lock']){
  const root=await mkdtemp(join(tmpdir(),'role-publication-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');
  let roleId;if(action==='crash-lock'){const first=worker(t,'create',path);roleId=(await first.result).view.roleId;await first.close();}
  const interrupted=worker(t,action,path);assert.equal((await interrupted.result).stage,'published');
  if(action==='crash-lock'){const contender=worker(t,'open',path);assert.equal((await contender.result).stage,'rejected');const aliases=(await (await import('node:fs/promises')).readdir(path)).filter(name=>name.startsWith('.writer.lock.')&&name.endsWith('.pending'));assert.equal(aliases.length,1);}
  const exited=once(interrupted.child,'exit');interrupted.child.kill('SIGKILL');await exited;
  const recovered=worker(t,action==='crash-identity'?'create':'open',path);const snapshot=await recovered.result;assert.equal(snapshot.stage,'opened');if(roleId)assert.equal(snapshot.view.roleId,roleId);assert.equal(snapshot.view.home.core.text,'跨进程核心');await recovered.close();
 }
});

test('初始提交前中断仅由匹配原创建操作接续，提交完成后重试保持同一身份',async t=>{
 const root=await mkdtemp(join(tmpdir(),'role-initial-crash-'));t.after(()=>rm(root,{recursive:true,force:true}));const path=join(root,'home');const interrupted=worker(t,'crash-initial',path);assert.equal((await interrupted.result).revision,1);const exited=once(interrupted.child,'exit');interrupted.child.kill('SIGKILL');await exited;
 const recovered=worker(t,'create',path);const first=await recovered.result;assert.equal(first.stage,'opened');assert.equal(first.view.revision,1);await recovered.close();const retry=worker(t,'create',path);assert.equal((await retry.result).view.roleId,first.view.roleId);await retry.close();
});
