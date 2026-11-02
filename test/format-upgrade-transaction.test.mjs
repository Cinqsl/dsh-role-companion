import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir,readFile,writeFile,access,mkdir,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';

const create={operationId:'create-upgrade56',core:'合成升级角色：身份、正文与保留状态必须逐字保留。',settings:{inputLimitBytes:32768}};
async function realRoot(...parts){return mkdtemp(join(await realpath(tmpdir()),...parts));}
async function waitFor(read,predicate,label){const end=Date.now()+15000;let value;while(Date.now()<end){value=await read();if(predicate(value))return value;await new Promise(r=>setTimeout(r,10));}assert.fail(label+': '+JSON.stringify(value));}
async function evidence(name,value){if(!process.env.DSH56_EVIDENCE_DIRECTORY)return;await mkdir(process.env.DSH56_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH56_EVIDENCE_DIRECTORY,name+'.json'),JSON.stringify(value,null,2)+'\n');}

/** A verified backup destination for the upgrade precondition. */
async function verifiedBackup(root,role,operationId){
  const destination=join(root,'backup-'+operationId);
  await role.owner.requestBackup({operationId,destination});
  const result=await waitFor(()=>role.owner.readBackup(operationId),value=>value.phase==='verified-restorable'||value.phase==='failed','backup');
  assert.equal(result.phase,'verified-restorable',JSON.stringify(result));
  return result;
}

test('升级须owner、停稳与一致备份：缺少可校验备份时拒绝且不改Home',{timeout:30000},async t=>{
  const root=await realRoot('format-upgrade-backup56-'),path=join(root,'home');let role;
  t.after(async()=>{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});
  const home=await createRoleHome(path,create);role=await startRole(home,{});
  const before=await home.readSnapshot(),head=await readFile(join(path,'head.json'),'utf8');
  const preview=await role.owner.previewFormatUpgrade();
  assert.deepEqual(preview.from,{major:1,minor:0});assert.deepEqual(preview.to,{major:2,minor:0});
  assert.equal(preview.backup.satisfied,false);assert.equal(preview.backup.operationId,undefined);
  assert(preview.retains.some(part=>part.part==='identity.json'));assert(preview.retains.some(part=>part.part==='commits'));for(const part of ['identity.json','head.json','commits','blobs'])assert(preview.retains.some(entry=>entry.part===part&&entry.bytes>0),'preview must list retained '+part);assert.equal(new Set(preview.retains.map(entry=>entry.part)).size,preview.retains.length);
  assert.deepEqual(preview.externalCopies,['QQ messages','DSH private storage','external files','independent backups']);
  const operationId='upgrade-without-backup56';
  await assert.rejects(role.owner.requestFormatUpgrade({operationId,expectedRevision:before.revision}),error=>error.code==='FORMAT_UPGRADE_BACKUP_REQUIRED'||error.details?.reason==='FORMAT_UPGRADE_BACKUP_REQUIRED');
  assert.equal(await readFile(join(path,'head.json'),'utf8'),head,'a refused upgrade must not touch head.json');
  assert.equal((await home.readSnapshot()).revision,before.revision);
  const progress=await role.owner.readFormatUpgrade(operationId);assert.equal(progress.phase,'failed');assert.equal(progress.error,'FORMAT_UPGRADE_BACKUP_REQUIRED');
  const after=await role.runtime.inspect();assert.equal(after.format?.status,'failed');assert.equal(after.format?.phase,'failed');assert.equal(after.format?.error,'FORMAT_UPGRADE_BACKUP_REQUIRED');
  await evidence('requires-backup',{case:'56-upgrade-requires-backup',status:'passed',roleId:home.roleId,operationId,preview,progress,headUnchanged:true,actualModels:0,actualTools:0,actualQQ:0});
});

test('备份就绪后升级写新代、校验并只切一次head，旧代字节保留且不双写',{timeout:60000},async t=>{
  const root=await realRoot('format-upgrade-atomic56-'),path=join(root,'home');let role;
  t.after(async()=>{if(role){role.lifetime.requestStop('unload');await role.lifetime.stopped;}await rm(root,{recursive:true,force:true});});
  const home=await createRoleHome(path,create);
  await home.applyOwner({kind:'edit-core',operationId:'upgrade-core56',text:'升级前核心正文',expectedCoreVersion:1,expectedRevision:1});
  const binding=(await home.readSnapshot()).panelBinding;
  await home.acceptInput({operationId:'upgrade-input56',bindingId:binding.bindingId,bindingVersion:binding.bindingVersion,externalKey:'upgrade-key56',text:'升级前输入正文：必须保留。',origin:'live',receivedAt:'2026-10-28T01:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
  role=await startRole(home,{});
  const backup=await verifiedBackup(root,role,'upgrade-backup56');
  // The backup stop consumed the running lifetime; a new process continues the original Home.
  role.lifetime.requestStop('unload');await role.lifetime.stopped;
  const next=await openRoleHome(path,{expectedRoleId:home.roleId});
  const before=await next.readSnapshot(),oldCommits=await readFile(join(path,'commits',String(before.revision).padStart(12,'0')+'.json'),'utf8'),oldHead=await readFile(join(path,'head.json'),'utf8');
  const operationId='upgrade-op56';
  const preview=await next.previewFormatUpgrade();
  assert.equal(preview.backup.satisfied,true);assert.equal(preview.backup.operationId,backup.operationId);
  await next.requestFormatUpgrade({operationId,expectedRevision:before.revision});
  const progress=await next.continueFormatUpgrade(operationId);
  assert.equal(progress.phase,'switched');
  assert.equal(progress.checkpoint,'switched');
  assert.equal(progress.from.major,1);assert.equal(progress.to.major,2);
  assert.ok(progress.generation&&progress.generation.id.startsWith('generation-'));
  assert.equal(progress.sourceRevision,before.revision);assert.equal(progress.identityDigest?.length,64);assert.equal(progress.recordDigest?.length,64);assert.equal(progress.manifestDigest?.length,64);
  // Only one switch: revision is unchanged and the old root chain is still byte-identical.
  const after=await next.readSnapshot();
  assert.equal(after.revision,before.revision);assert.equal(after.core.text,before.core.text);assert.equal(after.inputs.length,before.inputs.length);assert.equal(after.inputs[0].text,before.inputs[0].text);
  assert.equal(await readFile(join(path,'commits',String(before.revision).padStart(12,'0')+'.json'),'utf8'),oldCommits,'the previous generation must stay readable');
  assert.notEqual(await readFile(join(path,'head.json'),'utf8'),oldHead);
  const head=JSON.parse(await readFile(join(path,'head.json'),'utf8'));
  assert.deepEqual(head.format,{major:2,minor:0});assert.equal(head.storage.id,progress.generation.id);
  const status=await next.formatStatus();assert.deepEqual(status.format,{major:2,minor:0});assert.equal(status.layout,'storage-generation');assert.equal(status.upgrade.available,false);
  // Not double-written: later writes land in the successor generation, never the old root chain.
  const oldCommitsBefore=(await readdir(join(path,'commits'))).filter(name=>!name.startsWith('.')).length;
  const queued=await next.acceptInput({operationId:'upgrade-after56',bindingId:binding.bindingId,bindingVersion:binding.bindingVersion,externalKey:'upgrade-after-key56',text:'升级后新输入。',origin:'live',receivedAt:'2026-10-28T02:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
  assert.equal((await readdir(join(path,'commits'))).filter(name=>!name.startsWith('.')).length,oldCommitsBefore);
  // The successor replays the copied chain from its checkpoint and only appends the new tail commit.
  const generationCommits=(await readdir(join(path,'content-generations',progress.generation.id,'commits'))).filter(name=>!name.startsWith('.')).length;
  assert.equal(generationCommits,1,'only the post-switch tail is written into the successor generation');
  assert.equal(progress.copiedFiles>0,true);assert.equal(progress.verifiedFiles>before.revision,true);
  assert.equal((await next.readSnapshot()).revision,before.revision+1);
  await next.close();
  const reopened=await openRoleHome(path,{expectedRoleId:home.roleId});
  assert.deepEqual(await reopened.formatStatus(),status);
  assert.equal((await reopened.readSnapshot()).inputs.at(-1).inputId,queued.inputId);
  const task=await reopened.readFormatUpgrade(operationId);assert.equal(task.phase,'switched');
  await reopened.close();
  await evidence('atomic-switch',{case:'56-atomic-switch',status:'passed',roleId:home.roleId,operationId,preview,progress,before:{revision:before.revision,headDigest:await (async()=>{const {createHash}=await import('node:crypto');return createHash('sha256').update(oldHead).digest('hex');})()},after:{revision:after.revision},generation:progress.generation,oldChainRetained:true,singleHeadSwitch:true,oldChainWrites:0,actualModels:0,actualTools:0,actualQQ:0});
});
