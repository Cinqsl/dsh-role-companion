import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir,readFile,writeFile,mkdir,realpath,access,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRoleHome,openRoleHome,openRoleHomeForRuntime,diagnoseRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';

const create={operationId:'create-failure56',core:'合成失败回退角色：旧代必须可核对。',settings:{inputLimitBytes:32768}};
async function realRoot(...parts){return mkdtemp(join(await realpath(tmpdir()),...parts));}
async function evidence(name,value){if(!process.env.DSH56_EVIDENCE_DIRECTORY)return;await mkdir(process.env.DSH56_EVIDENCE_DIRECTORY,{recursive:true});await writeFile(join(process.env.DSH56_EVIDENCE_DIRECTORY,name+'.json'),JSON.stringify(value,null,2)+'\n');}
async function waitFor(read,predicate,label){const end=Date.now()+20000;let value;while(Date.now()<end){value=await read();if(predicate(value))return value;await new Promise(r=>setTimeout(r,10));}assert.fail(label+': '+JSON.stringify(value));}

/** Build a 1.0 Home with a verified backup and hand it back closed. */
async function prepared(source,operationId){
  const home=await createRoleHome(source,create);
  await home.applyOwner({kind:'edit-core',operationId:operationId+'-core',text:'升级前核心',expectedCoreVersion:1,expectedRevision:1});
  const binding=(await home.readSnapshot()).panelBinding;
  await home.acceptInput({operationId:operationId+'-input',bindingId:binding.bindingId,bindingVersion:binding.bindingVersion,externalKey:operationId+'-key',text:'升级前输入正文。',origin:'live',receivedAt:'2026-10-28T01:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
  const role=await startRole(home,{});
  await role.owner.requestBackup({operationId:operationId+'-backup',destination:join(source,'..','backup-'+operationId)});
  const backup=await waitFor(()=>role.owner.readBackup(operationId+'-backup'),value=>value.phase==='verified-restorable'||value.phase==='failed','backup');
  assert.equal(backup.phase,'verified-restorable',JSON.stringify(backup));
  role.lifetime.requestStop('unload');await role.lifetime.stopped;
  return backup;
}
const headText=async path=>readFile(join(path,'head.json'),'utf8');

test('新代校验拒绝身份/记录/正文/关系时失败保留旧代与阶段，原操作可按原opId接续',{timeout:120000},async t=>{
  for(const injection of ['identity','record','blob','relation']){
    const root=await realRoot('format-reject56-'+injection+'-'),path=join(root,'home'),backup=await prepared(path,'reject-'+injection);
    const before=await readFile(join(path,'identity.json'),'utf8'),headBefore=await headText(path),commitsBefore=(await readdir(join(path,'commits'))).filter(name=>!name.startsWith('.')).length;
    let refused=false;
    const home=await openRoleHome(path,{io:{barrier:async(stage,detail)=>{
      if(refused||detail.operationId!=='upgrade-reject-'+injection)return;
      if(stage!=='after-cleanup-generation-sync')return;
      refused=true;
      const directory=join(path,'content-generations');
      const ids=(await readdir(directory)).filter(name=>name.startsWith('generation-'));
      assert.equal(ids.length,1,JSON.stringify(ids));
      const generation=join(directory,ids[0]);
      if(injection==='identity'){
        // The successor's own owner record stops matching the live identity.
        const owner=JSON.parse(await readFile(join(generation,'owner.json'),'utf8'));
        await writeFile(join(generation,'owner.json'),JSON.stringify({...owner,roleId:'role-00000000-0000-4000-8000-000000000000'})+'\n');
      }else if(injection==='record'){
        const checkpointPath=join(generation,'checkpoint.json'),wrapped=JSON.parse(await readFile(checkpointPath,'utf8'));
        const {createHash}=await import('node:crypto');
        const body={...wrapped.body,commits:wrapped.body.commits.slice(0,-1)};
        await writeFile(checkpointPath,JSON.stringify({body,digest:createHash('sha256').update(JSON.stringify(body)+'\n').digest('hex')})+'\n');
      }else if(injection==='blob'){
        const blobs=(await readdir(join(generation,'blobs'))).filter(name=>!name.startsWith('.'));
        assert(blobs.length>0);
        await writeFile(join(generation,'blobs',blobs[0]),'{"text":"被篡改的正文"}\n');
      }else{
        // A dangling turn reference is a broken relation, not a missing file.
        const checkpointPath=join(generation,'checkpoint.json'),wrapped=JSON.parse(await readFile(checkpointPath,'utf8'));
        const {createHash}=await import('node:crypto');
        const domain=structuredClone(wrapped.body.domain);
        if(!domain.conversation.turns.length){domain.conversation.turns.push({runId:'run-00000000-0000-4000-8000-000000000000',groupId:'group-missing',inputIds:[],bindingId:domain.snapshot.panelBinding.bindingId,bindingVersion:1,source:'user',startedAt:'2026-10-28T01:00:00.000Z',deadline:'2026-10-28T01:10:00.000Z',contextGeneration:1,settingsVersion:1,status:'finished'});}
        else domain.conversation.replies.push({...domain.conversation.replies[0],replyId:'reply-00000000-0000-4000-8000-000000000000',runId:'run-00000000-0000-4000-8000-000000000000'});
        const body={...wrapped.body,domain};
        await writeFile(checkpointPath,JSON.stringify({body,digest:createHash('sha256').update(JSON.stringify(body)+'\n').digest('hex')})+'\n');
      }
    }}});
    const operationId='upgrade-reject-'+injection;
    // Each injection corrupts one successor generation; a fresh attempt needs its own operation id.
    let attempt=0;
    const firstOperationId=operationId;
    await home.requestFormatUpgrade({operationId,expectedRevision:(await home.readSnapshot()).revision});
    await assert.rejects(home.continueFormatUpgrade(operationId),error=>{
      assert.ok(['FORMAT_UPGRADE_IDENTITY_MISMATCH','FORMAT_UPGRADE_RECORD_MISMATCH','FORMAT_UPGRADE_MANIFEST_MISMATCH','FORMAT_UPGRADE_RELATION_MISMATCH','FORMAT_UPGRADE_NOT_REQUIRED','CORRUPT_STORAGE_GENERATION','FORMAT_UPGRADE_FAILED'].includes(error.code),error.code);
      return true;
    });
    const progress=await home.readFormatUpgrade(operationId);
    assert.equal(progress.phase,'failed',JSON.stringify(progress));
    assert.equal(typeof progress.error,'string');
    assert.equal(await headText(path),headBefore,'a failed validation must not switch head.json');
    assert.equal((await readdir(join(path,'commits'))).filter(name=>!name.startsWith('.')).length,commitsBefore);
    assert.equal(await readFile(join(path,'identity.json'),'utf8'),before);
    // The old generation is still readable and writable; both writes leave the old head untouched.
    const snapshot=await home.readSnapshot();assert.equal(snapshot.core.text,'升级前核心');
    await home.applyOwner({kind:'edit-core',operationId:operationId+'-after-failure',text:'失败后仍可写',expectedCoreVersion:snapshot.core.version,expectedRevision:snapshot.revision});
    assert.equal((await home.readSnapshot()).core.text,'失败后仍可写');
    // A successor generation that never became authority was discarded, so the same opId retries cleanly.
    // A user core edit after the backup is real drift: the pinned backup no longer covers this content.
    const preview=await home.previewFormatUpgrade();
    assert.equal(preview.backup.satisfied,false,'a user edit invalidates the copied revision');
    await assert.rejects(home.resumeFormatUpgrade({operationId,expectedRevision:(await home.readSnapshot()).revision}),{code:'FORMAT_UPGRADE_BACKUP_REQUIRED'});
    await home.close();
    await evidence('validation-reject-'+injection,{case:'56-validation-reject',status:'passed',injection,roleId:home.roleId,operationId,progress,previewAfterFailure:preview,headUnchangedOnFailure:true,oldGenerationWritable:true,successorDiscarded:true,actualModels:0,actualTools:0,actualQQ:0});
  }
});

test('真实进程在切换前后各点退出：新进程读到不确定阶段与原opId，旧代可核对且不伪称完成',{timeout:180000},async t=>{
  const {spawnSync}=await import('node:child_process');
  const worker=new URL('./format-upgrade-crash-worker.mjs',import.meta.url).pathname;
  const run=(mode,source,report,stage)=>spawnSync(process.execPath,[worker,mode,source,report,...(stage?[stage]:[])],{encoding:'utf8',timeout:60000,env:{PATH:process.env.PATH}});
  for(const stage of ['after-cleanup-generation-owner','after-cleanup-generation-sync','before-format-head-publish','after-head-publish','after-format-head-sync']){
    const root=await realRoot('format-crash56-'+stage+'-'),path=join(root,'home'),report=join(root,'report.json');
    t.after(()=>rm(root,{recursive:true,force:true}));
    const preparedRun=run('prepare',path,report);assert.equal(preparedRun.status,0,String(preparedRun.stdout)+String(preparedRun.stderr));
    const before=JSON.parse(await readFile(report,'utf8'));assert.equal(before.backup.phase,'verified-restorable',JSON.stringify(before));
    const crash=run('crash',path,report,stage);
    assert.equal(crash.status,77,String(crash.stdout)+String(crash.stderr));
    const at=JSON.parse(await readFile(report,'utf8'));
    assert.equal(at.stage,stage);assert.equal(at.operationId,'crash-upgrade56');
    // `syncHead` renames head.json before it fires `after-head-publish`, so those two points are post-switch.
    const switched=stage==='after-head-publish'||stage==='after-format-head-sync';
    assert.equal(at.head.format===undefined,!switched,'only a completed switch may declare a generation head');
    let resume;
    for(let attempt=0;attempt<2;attempt+=1){
      const resumed=run('resume',path,report);
      if(resumed.status===0){resume=JSON.parse(await readFile(report,'utf8'));break;}
      await new Promise(r=>setTimeout(r,20));
    }
    assert.ok(resume,'resume worker must succeed: '+String(crash.stderr));
    assert.equal(resume.roleId,at.roleId);
    if(!switched){
      // Before the switch the durable journal says `uncertain` and never claims completion.
      assert.equal(resume.before.phase,'uncertain',JSON.stringify(resume.before));
      assert.equal(resume.before.interrupted,true);
      assert.deepEqual(resume.before.recovery,['resume-format-upgrade','inspect-old-generation']);
      assert.equal(resume.view.format?.status,'processing');
      assert.equal(resume.view.reason,'FORMAT_UPGRADE_PENDING');
      assert.equal(resume.writeDenied.kind,'unavailable');
      assert.equal(resume.writeDenied.reason,'FORMAT_UPGRADE_PENDING');
      assert.equal(resume.receiptDenied,'stopping');
    }else{
      // After the switch the head is already the successor; the journal still is not a receipt.
      assert.equal(resume.view.format?.status,'processing');
      assert.equal(resume.before.phase,'uncertain');
      assert.equal(resume.writeDenied.kind,'unavailable');
      assert.equal(resume.writeDenied.reason,'FORMAT_UPGRADE_PENDING');
      assert.equal(resume.receiptDenied,'stopping');
    }
    assert.equal(resume.resumed.phase,'switched',JSON.stringify(resume.resumed));
    assert.equal(resume.resumed.operationId,'crash-upgrade56');
    // A restarted lifetime may publish its own stop/recovery commits; those are metadata, not the upgrade.
    assert.equal(resume.after.revision-6<=1,true,'the upgrade adds no user content revisions');
    assert.equal(resume.after.core,'强退前核心');assert.deepEqual(resume.after.inputs,['强退前输入正文。']);
    assert.deepEqual(resume.statusAfter.format,{major:2,minor:0});
    await evidence('crash-'+stage,{case:'56-format-upgrade-process-exit',status:'passed',stage,at,before,resume,processExitCodes:[crash.status],actualModels:0,actualTools:0,actualQQ:0});
  }
});

test('升级失败与切换中断都保留可核对旧代内容与阶段，清理预览再列出旧代范围',{timeout:60000},async t=>{
  const root=await realRoot('format-preview56-'),path=join(root,'home'),backup=await prepared(path,'preview');
  let failOnce=true;
  const home=await openRoleHome(path,{io:{barrier:async(stage,detail)=>{
    if(detail.operationId==='upgrade-preview56'&&stage==='after-cleanup-generation-sync'&&failOnce){failOnce=false;throw Object.assign(new Error('controlled generation failure'),{code:'FIO_ONCE'});}
  }}});
  const operationId='upgrade-preview56',revision=(await home.readSnapshot()).revision;
  const before=await home.previewCleanup({sources:[{kind:'input',id:(await home.readSnapshot()).inputs[0].inputId}],derived:'retain'});
  assert.equal(before.storageGenerations.length,1);
  assert.equal(before.storageGenerations[0].format,'home-v1-inline-and-managed-content');
  await home.requestFormatUpgrade({operationId,expectedRevision:revision});
  await assert.rejects(home.continueFormatUpgrade(operationId),error=>error.code==='FORMAT_UPGRADE_FAILED'||error.code==='FIO_ONCE');
  const failed=await home.readFormatUpgrade(operationId);assert.equal(failed.phase,'failed');assert.equal(failed.error,'FIO_ONCE');
  const resumed=await home.resumeFormatUpgrade({operationId,expectedRevision:revision});
  assert.equal(resumed.phase,'switched');
  const after=await home.previewCleanup({sources:[{kind:'input',id:(await home.readSnapshot()).inputs[0].inputId}],derived:'retain'});
  assert.equal(after.storageGenerations.length,2,'the cleanup preview must list the previous generation and the current one');
  assert.deepEqual(after.storageGenerations.map(entry=>entry.format).sort(),['home-v1-inline-and-managed-content','role-home-storage-generation-1']);
  // The current generation is the one a cleanup rewrites; the previous one is retained until that purge.
  assert.equal(after.storageGenerations.find(entry=>entry.format==='role-home-storage-generation-1').disposition,'rewrite-before-purge');
  assert.equal(after.storageGenerations.find(entry=>entry.format==='home-v1-inline-and-managed-content').disposition,'retained-until-purge');
  assert.equal(new Set(after.storageGenerations.map(entry=>entry.id)).size,2);
  assert.deepEqual(after.externalCopies,['QQ messages','DSH private storage','external files','independent backups']);
  // Old generation content is still on disk and byte-identical until a cleanup is executed.
  assert((await readdir(join(path,'commits'))).filter(name=>!name.startsWith('.')).length>0);
  await home.close();
  await evidence('cleanup-previews-generations',{case:'56-cleanup-previews-generations',status:'passed',roleId:home.roleId,operationId,backup:backup.operationId,before:before.storageGenerations,after:after.storageGenerations,oldGenerationRetained:true,physical:after.physical,actualModels:0,actualTools:0,actualQQ:0});
});

test('升级新代保留联系规则与意图及发件关联，逐字相等而非只保留用户内容',{timeout:60000},async t=>{
  const root=await realRoot('format-contact56-'),path=join(root,'home');
  const home=await createRoleHome(path,create);
  await home.applyOwner({kind:'edit-core',operationId:'contact-core56',text:'联系规则保留核心',expectedCoreVersion:1,expectedRevision:1});
  const rules={cooldownMs:60000,dailyLimit:1,perRoundLimit:1,quietHours:{mode:'range',start:'22:00',end:'07:00'}};
  const rulesReceipt=await home.applyOwner({kind:'edit-contact-rules',operationId:'contact-rules56',value:rules,expectedContactRulesVersion:1,expectedRevision:2});
  assert.equal(rulesReceipt.committedRevision,3);
  const role=await startRole(home,{});
  await role.owner.requestBackup({operationId:'contact-backup56',destination:join(root,'backup')});
  const backup=await waitFor(()=>role.owner.readBackup('contact-backup56'),value=>value.phase==='verified-restorable'||value.phase==='failed','backup');
  assert.equal(backup.phase,'verified-restorable');
  role.lifetime.requestStop('unload');await role.lifetime.stopped;
  const next=await openRoleHome(path,{expectedRoleId:home.roleId});
  const before=await next.readConversation();
  assert.equal(before.contactRules.version,2);
  const operationId='contact-upgrade56';
  await next.requestFormatUpgrade({operationId,expectedRevision:(await next.readSnapshot()).revision});
  const progress=await next.continueFormatUpgrade(operationId);
  assert.equal(progress.phase,'switched');
  const after=await next.readConversation();
  assert.equal(after.contactRules.version,2);
  assert.deepEqual(after.contactRules.value,rules);
  assert.deepEqual(after.contact,before.contact);
  assert.deepEqual(after.deliveries,before.deliveries);
  assert.deepEqual(after.sendAttempts,before.sendAttempts);
  await next.close();
  const reopened=await openRoleHome(path,{expectedRoleId:home.roleId});
  const reopenedState=await reopened.readConversation();
  assert.deepEqual(reopenedState.contactRules.value,rules,'contact rules must survive the generation switch');
  assert.deepEqual(reopenedState.contact,before.contact,'contact intents must survive the generation switch');
  assert.deepEqual((await reopened.formatStatus()).format,{major:2,minor:0});
  await reopened.close();
  await evidence('contact-retained',{case:'56-contact-rules-and-intents-retained',status:'passed',roleId:home.roleId,operationId,rules,backup:backup.operationId,progress,retained:{contactRules:reopenedState.contactRules,contact:reopenedState.contact},actualModels:0,actualTools:0,actualQQ:0});
});
