import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,realpath,mkdir,writeFile,symlink,link,access,cp} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createRoleHome,verifyRoleBackup} from 'dsh-role-companion/home';import {startRole} from 'dsh-role-companion/runtime';
const create={operationId:'path-create54',core:'路径边界合成资料',settings:{inputLimitBytes:32768}};
async function wait(read,predicate){const end=Date.now()+10000;let value;while(Date.now()<end){value=await read();if(predicate(value))return value;await new Promise(r=>setTimeout(r,10));}assert.fail(JSON.stringify(value));}
async function save(name,value){if(!process.env.DSH54_EVIDENCE_DIRECTORY)return;await mkdir(process.env.DSH54_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH54_EVIDENCE_DIRECTORY,name+'.json'),JSON.stringify(value,null,2)+'\n');}
test('真实filesystem拒绝目标别名/遍历/源后代和源内容链接，未分类区域不会静默漏备',{timeout:30000},async t=>{
 const reports=[];
 for(const mode of ['destination-link','parent-link','traversal','inside-source','symbolic-content','hard-content','unknown-root']){
  const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup-path54-')),source=join(root,'home'),home=await createRoleHome(source,create);let destination=join(root,'copy'),role=await startRole(home,{});t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;await rm(root,{recursive:true,force:true});});
  if(mode==='destination-link'){await mkdir(join(root,'real-destination'));await symlink(join(root,'real-destination'),destination);}
  if(mode==='parent-link'){await symlink(root,join(root,'alias'));destination=join(root,'alias','copy');}
  if(mode==='traversal')destination=root+'/absent/../copy';
  if(mode==='inside-source')destination=join(source,'inside');
  if(mode==='symbolic-content'||mode==='hard-content'){await mkdir(join(source,'works'));await writeFile(join(root,'external.txt'),'只属于本夹具的外部正文');await(mode==='symbolic-content'?symlink(join(root,'external.txt'),join(source,'works','linked.txt')):link(join(root,'external.txt'),join(source,'works','linked.txt')));}
  if(mode==='unknown-root')await writeFile(join(source,'.env'),'SYNTHETIC_TOKEN=not-a-real-secret');
  const request={operationId:'path54-'+mode,destination};let result;
  if(['destination-link','parent-link','traversal','inside-source'].includes(mode)){await assert.rejects(role.owner.requestBackup(request),error=>error.code===(mode==='inside-source'?'BACKUP_PATH_OVERLAP':'UNSAFE_BACKUP_PATH'));result=await role.owner.readBackup(request.operationId);assert.equal(result.phase,'not-found');assert.notEqual((await role.runtime.inspect()).status,'stopping');}
  else{await role.owner.requestBackup(request);result=await wait(()=>role.owner.readBackup(request.operationId),x=>x.phase==='failed');assert.equal(result.error,mode==='unknown-root'?'UNCLASSIFIED_HOME_CONTENT':'UNSAFE_BACKUP_FILE');await assert.rejects(access(destination));await wait(async()=>{try{await access(join(source,'.maintenance.lock'));return false;}catch{return true;}},Boolean);}
  reports.push({mode,request,result,actualModels:0,actualTools:0});
 }
 await save('paths',{status:'passed',reports});
});

test('完整备份可移动后只读核验；附加未知内容不是完整可恢复副本',{timeout:30000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup-portable54-')),source=join(root,'home'),destination=join(root,'copy'),moved=join(root,'moved');const home=await createRoleHome(source,create),role=await startRole(home,{});t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;await rm(root,{recursive:true,force:true});});const request={operationId:'portable54',destination};await role.owner.requestBackup(request);const original=await wait(()=>role.owner.readBackup(request.operationId),x=>x.phase==='verified-restorable');await cp(destination,moved,{recursive:true});const verified=await verifyRoleBackup(moved,{expectedRoleId:home.roleId,operationId:request.operationId});assert.equal(verified.sourceHeadDigest,original.sourceHeadDigest);await writeFile(join(moved,'unclassified.txt'),'不是清单中的内容');await assert.rejects(verifyRoleBackup(moved,{expectedRoleId:home.roleId}),{code:'BACKUP_UNEXPECTED_CONTENT'});await save('portable-extra',{status:'passed',request,original,verified,extraRejected:'BACKUP_UNEXPECTED_CONTENT',runtimeOnCopy:false,actualModels:0,actualTools:0});
});

test('原操作的目标路径被换成另一目录时拒绝认领，不清理或覆盖新目录',{timeout:30000},async t=>{
 const root=await mkdtemp(join(await realpath(tmpdir()),'role-backup-target-identity54-')),source=join(root,'home'),destination=join(root,'copy'),retained=join(root,'original-copy');let once=true;
 const home=await createRoleHome(source,create,{barrier:async stage=>{if(stage==='before-backup-file'&&once){once=false;throw Object.assign(Error('controlled first copy failure'),{code:'FIXTURE_COPY_ONCE'});}}}),role=await startRole(home,{});t.after(async()=>{role.lifetime.requestStop('unload');await role.lifetime.stopped;await rm(root,{recursive:true,force:true});});const request={operationId:'target-identity54',destination};await role.owner.requestBackup(request);const before=await wait(()=>role.owner.readBackup(request.operationId),x=>x.phase==='failed');
 const {rename,readdir}=await import('node:fs/promises');await rename(destination,retained);await mkdir(destination);await writeFile(join(destination,'user-owned.txt'),'新目录必须保留');await role.owner.resumeBackup(request);const result=await wait(()=>role.owner.readBackup(request.operationId),x=>x.phase==='failed'&&x.error==='BACKUP_DESTINATION_CHANGED');assert.deepEqual(await readdir(destination),['user-owned.txt']);await access(join(retained,'backup-operation.json'));await save('destination-identity',{status:'passed',request,before,result,originalCopyRetained:true,newDirectoryUntouched:true,actualModels:0,actualTools:0});
});
