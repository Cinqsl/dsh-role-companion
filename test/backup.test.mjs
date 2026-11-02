import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,access,readFile,mkdir,writeFile,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
const create={operationId:'create-backup-54',core:'合成备份角色',settings:{inputLimitBytes:32768}};
async function waitFor(read,predicate){const end=Date.now()+10000;let value;while(Date.now()<end){value=await read();if(predicate(value))return value;await new Promise(r=>setTimeout(r,10));}assert.fail('public backup progress timed out: '+JSON.stringify(value));}
test('同一owner停稳后复制固定revision完整Home，原操作可查询且可公开核验',{timeout:30000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup54-'));let role; t.after(async()=>{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});
 const source=join(root,'home'),destination=join(root,'backup'),home=await createRoleHome(source,create);
 await home.applyOwner({kind:'edit-core',operationId:'new-core54',text:'保留新旧核心',expectedCoreVersion:1,expectedRevision:1});
 await mkdir(join(source,'works'));await writeFile(join(source,'works','作品.txt'),'独立作品正文\n');
 role=await startRole(home,{});const request={operationId:'backup-54',destination};
 const receipt=await role.owner.requestBackup(request);assert.equal(receipt.operationId,request.operationId);
 const result=await waitFor(()=>role.owner.readBackup(request.operationId),v=>v.phase==='verified-restorable');
 assert.equal((await role.runtime.inspect()).status,'stopped');await assert.rejects(access(join(source,'writer.lock')));
 assert.equal(result.sourceRevision,4);assert.ok(result.files.some(x=>x.path==='works/作品.txt'));
 assert.equal(await readFile(join(destination,'home/works/作品.txt'),'utf8'),'独立作品正文\n');
 const {verifyRoleBackup}=await import('dsh-role-companion/home');const verified=await verifyRoleBackup(destination,{expectedRoleId:home.roleId});assert.equal(verified.phase,'verified-restorable');assert.equal(verified.sourceRevision,result.sourceRevision);
 assert.deepEqual(await role.owner.resumeBackup(request),result);await assert.rejects(role.owner.resumeBackup({...request,destination:join(root,'changed')}),{code:'OPERATION_CONFLICT'});
 const reopened=await openRoleHome(source);assert.equal((await reopened.readSnapshot()).core.text,'保留新旧核心');await reopened.close();
});

import {spawnSync} from 'node:child_process';
function child(mode,path,roleId,operationId,destination){const run=spawnSync(process.execPath,[new URL('./backup-process-worker.mjs',import.meta.url).pathname,mode,path,roleId,operationId??'',destination??''],{encoding:'utf8',timeout:15000,env:{PATH:process.env.PATH}});assert.equal(run.error,undefined,run.stdout+run.stderr);return {exitCode:run.status,signal:run.signal,result:JSON.parse(run.stdout.trim())};}
async function evidence(name,value){if(!process.env.DSH54_EVIDENCE_DIRECTORY)return;await mkdir(process.env.DSH54_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH54_EVIDENCE_DIRECTORY,name+'.json'),JSON.stringify(value,null,2)+'\n');}
test('writer.lock释放后真实第二进程仍不能与复制并行，副本可在新进程完整校验',{timeout:30000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-copy-race54-')),source=join(root,'home'),destination=join(root,'copy');let release,enteredResolve;const held=new Promise(r=>release=r),entered=new Promise(r=>enteredResolve=r);let once=true,role;
 t.after(async()=>{release();if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});
 const home=await createRoleHome(source,create,{barrier:async stage=>{if(stage==='before-backup-file'&&once){once=false;enteredResolve();await held;}}});role=await startRole(home,{});const request={operationId:'copy-race54',destination};await role.owner.requestBackup(request);await entered;
 assert.equal((await role.runtime.inspect()).status,'stopped');await assert.rejects(access(join(source,'writer.lock')));await access(join(source,'.maintenance.lock'));
 const during=await role.owner.readBackup(request.operationId),competing=child('open',source,home.roleId);assert.equal(competing.exitCode,2);assert.equal(competing.result.code,'HOME_BUSY');await assert.rejects(createRoleHome(source,create),{code:'HOME_BUSY'});
 release();const result=await waitFor(()=>role.owner.readBackup(request.operationId),v=>v.phase==='verified-restorable');await waitFor(async()=>{try{await access(join(source,'.maintenance.lock'));return false;}catch{return true;}},Boolean);const verified=child('verify',destination,home.roleId,request.operationId),after=child('open',source,home.roleId);await evidence('copy-race-before-assert',{during,result,competing,verified,after});assert.equal(verified.exitCode,0,JSON.stringify(verified));assert.equal(after.exitCode,0,JSON.stringify(after));assert.equal(verified.result.sourceRevision,result.sourceRevision);assert.equal(after.result.snapshot.roleId,home.roleId);
 await evidence('copy-race',{case:'backup54-copy-race',status:'passed',roleId:home.roleId,request,during,result,competing,verified,after,writerLockReleasedBeforeCopy:true,actualModels:0,actualTools:0});
});

test('OS编辑作品和投影不受module lease伪保护，固定清单变化时拒绝成功并保留原操作',{timeout:30000},async t=>{
 for(const [kind,relative]of [['works','works/note.txt'],['projection','views/settings.json']]){
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-copy-edit54-')),source=join(root,'home'),destination=join(root,'copy');let release,enteredResolve;const held=new Promise(r=>release=r),entered=new Promise(r=>enteredResolve=r);let once=true,role;
 t.after(async()=>{release();if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});
 const home=await createRoleHome(source,create,{barrier:async stage=>{if(stage==='before-backup-file'&&once){once=false;enteredResolve();await held;}}});await mkdir(join(source,'works'));await writeFile(join(source,relative),'原作品');role=await startRole(home,{});const request={operationId:'external-edit54-'+kind,destination};await role.owner.requestBackup(request);await entered;await writeFile(join(source,relative),'外部编辑');release();const failed=await waitFor(()=>role.owner.readBackup(request.operationId),v=>v.phase==='failed');assert.equal(failed.error,'BACKUP_SOURCE_CHANGED');await assert.rejects(openRoleHome(source),{code:'MAINTENANCE_PENDING'});
 await writeFile(join(source,relative),'原作品');await role.owner.resumeBackup(request);const repaired=await waitFor(()=>role.owner.readBackup(request.operationId),v=>v.phase==='verified-restorable');assert.equal(repaired.sourceRevision,failed.sourceRevision);assert.equal(repaired.sourceHeadDigest,failed.sourceHeadDigest);await evidence('external-edit-'+kind,{case:'backup54-external-edit',status:'passed',request,failed,repaired,actualModels:0,actualTools:0});
 }
});

test('已校验副本后续缺损可从原owner操作重新核验，不能继续显示可恢复',{timeout:30000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-copy-missing54-')),source=join(root,'home'),destination=join(root,'copy');let role;t.after(async()=>{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});
 const home=await createRoleHome(source,create);await mkdir(join(source,'works'));await writeFile(join(source,'works','retained.txt'),'完整作品');role=await startRole(home,{});const request={operationId:'missing-content54',destination};await role.owner.requestBackup(request);const original=await waitFor(()=>role.owner.readBackup(request.operationId),v=>v.phase==='verified-restorable');
 const {unlink}=await import('node:fs/promises');await unlink(join(destination,'home/works/retained.txt'));const result=await role.owner.verifyBackup(request.operationId);assert.equal(result.phase,'failed');assert.equal(result.error,'BACKUP_CONTENT_MISMATCH');assert.equal((await role.owner.readBackup(request.operationId)).phase,'failed');const fresh=child('verify',destination,home.roleId,request.operationId);assert.equal(fresh.exitCode,2);assert.equal(fresh.result.code,'BACKUP_CONTENT_MISMATCH');await evidence('missing-content',{status:'passed',request,original,result,fresh,actualModels:0,actualTools:0});
});

test('真实进程在请求、部分复制或最终回执前退出，原操作/目标可在新进程接续',{timeout:60000},async t=>{
 for(const stage of ['after-backup-request','after-backup-file','after-backup-file-sync','after-backup-marker-sync','after-backup-verified']){
  const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup-kill54-')),source=join(root,'home'),destination=join(root,'copy'),report=join(root,'crash.json');t.after(()=>rm(root,{recursive:true,force:true}));
  const crash=spawnSync(process.execPath,[new URL('./backup-crash-worker.mjs',import.meta.url).pathname,stage,source,destination,report],{encoding:'utf8',timeout:15000,env:{PATH:process.env.PATH}});assert.equal(crash.error,undefined,crash.stdout+crash.stderr);assert.equal(crash.status,77,crash.stdout+crash.stderr);const before=JSON.parse(await readFile(report,'utf8'));assert.equal(before.maintenanceLock,true);
  if(stage!=='after-backup-request')assert.equal(before.writerLock,false);
  if(stage==='after-backup-file'||stage==='after-backup-file-sync'||stage==='after-backup-marker-sync'){const incomplete=child('verify',destination,before.roleId,before.operationId);assert.equal(incomplete.exitCode,2);assert.equal(incomplete.result.code,'ENOENT');const blocked=child('open',source,before.roleId);assert.equal(blocked.exitCode,2);assert.equal(blocked.result.code,'MAINTENANCE_PENDING');}
  const resume=child('resume',source,before.roleId,before.operationId,destination);if(resume.exitCode!==0)await evidence('crash-'+stage+'-failed',{status:'failed',before,resume,process:{exitCode:crash.status,signal:crash.signal}});assert.equal(resume.exitCode,0,JSON.stringify(resume));if(stage!=='after-backup-verified')assert.equal(resume.result.before.phase,'uncertain','new process must not call a dead copying/stopping task active');if(stage==='after-backup-request')assert.equal(resume.result.blockedEdit.kind,'unavailable','maintenance recovery must reject new owner writes: '+JSON.stringify(resume.result.blockedEdit));assert.equal(resume.result.actualModels,0);assert.equal(resume.result.actualTools,0);assert.equal(resume.result.result.operationId,before.operationId);assert.equal(resume.result.result.roleId,before.roleId);
  const verified=child('verify',destination,before.roleId,before.operationId);assert.equal(verified.exitCode,0,JSON.stringify(verified));if(before.progress.sourceRevision!==undefined)assert.equal(verified.result.sourceRevision,before.progress.sourceRevision);assert.equal(await readFile(join(destination,'home/works/work.txt'),'utf8'),'全部作品与旧正文必须保留');assert.equal(await readFile(join(destination,'home/views/settings.json'),'utf8'),'外部编辑投影必须完整保留\n');
  await evidence('crash-'+stage,{status:'passed',before,process:{exitCode:crash.status,signal:crash.signal},resume,verified,oldPidExited:true});
 }
});

test('复制与清单确认故障保留原检查点，恢复仅复制/校验同一资料而不另建身份',{timeout:30000},async t=>{
 for(const stage of ['after-backup-request','before-backup-file','after-backup-manifest']){
  const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup-fault54-')),source=join(root,'home'),destination=join(root,'copy');let once=true,role;t.after(async()=>{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});
  const home=await createRoleHome(source,create,{barrier:async current=>{if(current===stage&&once){once=false;throw Object.assign(Error('controlled disk boundary'),{code:'FIXTURE_BACKUP_IO_ONCE'});}}});role=await startRole(home,{});const request={operationId:'fault54-'+stage,destination};
  if(stage==='after-backup-request')await assert.rejects(role.owner.requestBackup(request),{code:'FIXTURE_BACKUP_IO_ONCE'});else await role.owner.requestBackup(request);
  const failed=stage==='after-backup-request'?await role.owner.readBackup(request.operationId):await waitFor(()=>role.owner.readBackup(request.operationId),v=>v.phase==='failed');assert.notEqual(failed.phase,'verified-restorable');assert.equal(failed.roleId,home.roleId);
  await role.lifetime.stopped;await role.owner.resumeBackup(request);const repaired=await waitFor(()=>role.owner.readBackup(request.operationId),v=>v.phase==='verified-restorable');assert.equal(repaired.roleId,home.roleId);assert.equal(repaired.operationId,request.operationId);if(failed.sourceRevision!==undefined)assert.equal(repaired.sourceRevision,failed.sourceRevision);
  await evidence('fault-'+stage,{status:'passed',request,failed,repaired,actualModels:0,actualTools:0});
 }
});

test('已停稳lifetime可制作下一份备份，不能因新维护请求回到永远stopping',{timeout:30000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup-twice54-')),source=join(root,'home');let role;t.after(async()=>{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});const home=await createRoleHome(source,create);role=await startRole(home,{});
 const first={operationId:'backup-first54',destination:join(root,'first')};await role.owner.requestBackup(first);const one=await waitFor(()=>role.owner.readBackup(first.operationId),v=>v.phase==='verified-restorable');await waitFor(async()=>{try{await access(join(source,'.maintenance.lock'));return false;}catch{return true;}},Boolean);
 const second={operationId:'backup-second54',destination:join(root,'second')};await role.owner.requestBackup(second);const two=await waitFor(()=>role.owner.readBackup(second.operationId),v=>v.phase==='verified-restorable');assert.equal((await role.runtime.inspect()).status,'stopped');assert.equal(two.sourceRevision,one.sourceRevision);assert.equal(two.roleId,one.roleId);await evidence('already-stopped',{status:'passed',one,two,actualModels:0,actualTools:0});
});

test('同时重试同一备份请求只停一次，原操作同目标返回同一可恢复副本',{timeout:30000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup-duplicate54-')),source=join(root,'home');let role;t.after(async()=>{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});const home=await createRoleHome(source,create);role=await startRole(home,{});const request={operationId:'same-backup54',destination:join(root,'copy')};
 const receipts=await Promise.all([role.owner.requestBackup(request),role.owner.requestBackup({...request})]);const result=await waitFor(()=>role.owner.readBackup(request.operationId),v=>v.phase==='verified-restorable');assert.equal(receipts[0].stopOperationId,receipts[1].stopOperationId);assert.equal((await role.runtime.inspect()).revision,3);await evidence('concurrent-duplicate',{status:'passed',request,receipts,result,actualModels:0,actualTools:0});
});

test('备份清单保留历史维护事实，当前操作冻结在source-stopped且新进程可只读追溯',{timeout:30000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup-history54-')),source=join(root,'home');let role;t.after(async()=>{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});const home=await createRoleHome(source,create);role=await startRole(home,{});
 const first={operationId:'history-first54',destination:join(root,'first')};await role.owner.requestBackup(first);const one=await waitFor(()=>role.owner.readBackup(first.operationId),x=>x.phase==='verified-restorable');await waitFor(async()=>{try{await access(join(source,'.maintenance.lock'));return false;}catch{return true;}},Boolean);
 const second={operationId:'history-second54',destination:join(root,'second')};await role.owner.requestBackup(second);const two=await waitFor(()=>role.owner.readBackup(second.operationId),x=>x.phase==='verified-restorable');const {readBackupMaintenance}=await import('dsh-role-companion/home');const facts=await readBackupMaintenance(second.destination,{expectedRoleId:home.roleId});const old=facts.snapshot.records.find(x=>x.operationId===first.operationId),current=facts.snapshot.records.find(x=>x.operationId===second.operationId);
 assert.equal(old.phase,'verified-restorable');assert.equal(old.manifestDigest,one.manifestDigest);assert.equal(old.destination,first.destination);assert.equal(current.phase,'stopped');assert.equal(current.checkpoint,'stopped');assert.equal(facts.currentReceipt.phase,'verified-restorable');assert.equal(facts.currentReceipt.manifestDigest,two.manifestDigest);assert.equal(facts.retainedSnapshots.length,2);assert.equal(facts.retainedSnapshots.every(snapshot=>snapshot.records.every(record=>!Object.hasOwn(record,'destinationIdentity')&&!Object.hasOwn(record,'pid')&&!Object.hasOwn(record,'frozenMaintenance'))),true);const fresh=child('maintenance',second.destination,home.roleId,second.operationId);assert.equal(fresh.exitCode,0,JSON.stringify(fresh));assert.deepEqual(fresh.result,facts);
 const {unlink}=await import('node:fs/promises');await unlink(join(second.destination,'maintenance',one.maintenanceDigest+'.json'));await assert.rejects(readBackupMaintenance(second.destination,{expectedRoleId:home.roleId}),{code:'BACKUP_MAINTENANCE_MISSING'});await evidence('maintenance-history',{status:'passed',one,two,facts,fresh,missingHistoryRejected:true,historicalDestinationsAreReadOnlyFacts:true,actualModels:0,actualTools:0});
});

test('已有迁移lifetime正在停稳时备份复用原屏障，不另启角色或抢先复制',{timeout:30000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup-existing-stop54-')),source=join(root,'home');let release,enteredResolve;const held=new Promise(r=>release=r),entered=new Promise(r=>enteredResolve=r);let once=true,role;
 t.after(async()=>{release();if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});const home=await createRoleHome(source,create,{barrier:async(stage,detail)=>{if(once&&stage==='after-head-publish'&&detail.operationId.startsWith('stop-checkpoint-')){once=false;enteredResolve();await held;}}});role=await startRole(home,{});role.lifetime.requestStop('migration');await entered;const before=await role.runtime.inspect(),request={operationId:'backup-during-migration54',destination:join(root,'copy')};
 const receipt=await role.owner.requestBackup(request);assert.equal(receipt.phase,'stopping');await assert.rejects(access(request.destination));await access(join(source,'writer.lock'));release();const result=await waitFor(()=>role.owner.readBackup(request.operationId),x=>x.phase==='verified-restorable');assert.equal(result.stopOperationId,before.stop.operationId);assert.equal((await role.runtime.inspect()).revision,3);await evidence('existing-stop',{status:'passed',request,before,receipt,result,actualModels:0,actualTools:0});
});
