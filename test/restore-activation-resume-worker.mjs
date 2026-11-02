import assert from 'node:assert/strict';
import {join} from 'node:path';
import {readFile,writeFile,readdir,access} from 'node:fs/promises';
import {createRoleHome,openRoleHome} from 'dsh-role-companion/home';
import {startRole} from 'dsh-role-companion/runtime';
import {bootOfficialCliFixture} from './official-cli-fixture.mjs';
import {response} from './native-fixture.mjs';
/** Copy in one real CLI, acceptance published by another process without registration, then real CLI recovery. */
const run=process.env.DSH_TEST_RUN,source=join(run,'source'),backup=join(run,'backup'),destination=join(run,'target');
const record={case:'55-activation-interruption-resume',status:'recorded',fullAcceptanceCasesPassed:[],realBusinessCalls:{model:0,web:0,qq:0},exits:[],models:0,metadata:0};
let sourceRole,host,failure;
async function wait(read,check){for(let i=0;i<1200;i++){const value=await read();if(check(value))return value;await new Promise(r=>setTimeout(r,10));}assert.fail('activation resume did not settle');}
async function stopHost(){record.models+=host.entries.length;record.metadata+=host.metadataEntries.length;record.exits.push({pid:host.child.pid,models:host.entries.length,metadata:host.metadataEntries.length,...await host.stop()});host=undefined;}
async function commits(){return (await readdir(join(destination,'commits'))).sort().map(async name=>JSON.parse(await readFile(join(destination,'commits',name),'utf8')));}
try{
 const home=await createRoleHome(source,{operationId:'resume-source55',core:'接受已发布但本机登记中断时，只读等待原确认接续。',settings:{inputLimitBytes:32768}});record.roleId=home.roleId;
 sourceRole=await startRole(home,{});record.oldInput=await sourceRole.runtime.receive({operationId:'resume-old-input55',externalKey:'resume-old-input55',bindingId:'panel-'+home.roleId,bindingVersion:1,text:'交接前的原待办保留但不自动执行。',origin:'live',receivedAt:'2026-10-27T00:00:00.000Z',sourceEvidence:'authenticated-owner-panel'});
 await sourceRole.owner.requestHandover({operationId:'resume-outgoing55',destination:backup,expectedRevision:home.revision});
 record.handover=await wait(()=>sourceRole.owner.readHandover('resume-outgoing55'),x=>x.phase==='verified');await sourceRole.lifetime.stopped;sourceRole=undefined;
 host=await bootOfficialCliFixture(run,()=>response('激活接续后明确接纳的新输入。'),{profileName:'resume55',captureTransportError:true});
 record.copyRequest={operationId:'resume-copy55',backupPath:backup,destination,expectedRoleId:home.roleId,expectedManifestDigest:record.handover.backup.manifestDigest};
 record.copy=await host.rpc('requestRestore',{request:record.copyRequest,expectedProfileVersion:0});assert.equal(record.copy.phase,'awaiting-handover');
 record.afterCopy=await host.rpc('inspect');assert.equal(record.afterCopy.role.status,'read-only');assert.equal(record.afterCopy.bootstrap.path,'');assert.equal(record.afterCopy.bootstrap.version,1);assert.equal(host.entries.length,0);
 record.sourceWriterLockWhileCopying=await access(join(source,'writer.lock')).then(()=>true,error=>{assert.equal(error.code,'ENOENT');return false;});
 await stopHost();
 // A second process publishes the acceptance through the public Home owner; no profile registration is written.
 const opened=await openRoleHome(destination,{expectedRoleId:home.roleId});
 record.preAcceptance={revision:opened.revision,diagnostic:(await opened.readActivationDiagnostic()).reason};
 const preview=await startRole(opened,{});
 record.acceptance=await preview.owner.confirmRestore({operationId:'resume-confirm55',restoreOperationId:'resume-copy55',handoverId:record.handover.record.handoverId,expectedManifestDigest:record.copy.manifestDigest,expectedRevision:opened.revision,currentSourceStoppedConfirmed:true});
 record.acceptedRevision=record.acceptance.committedRevision;preview.lifetime.requestStop('migration');await preview.lifetime.stopped;
 record.afterAcceptanceCommits=(await Promise.all(await commits())).map(commit=>commit.kind);
 assert.equal(record.afterAcceptanceCommits.filter(kind=>kind==='accept-restore').length,1,'exactly one acceptance commit');
 assert.equal(record.afterAcceptanceCommits.filter(kind=>kind==='register-home').length,0,'no local registration was written');
 const profilePackage=JSON.parse(await readFile(join(run,'home/profiles/resume55/package.json'),'utf8'));const companionConfig=profilePackage.dsh?.config?.['role-companion']??{};
 record.profileAfterAcceptance={bootstrapVersion:companionConfig.bootstrap?.version??0,bootstrapPath:companionConfig.bootstrap?.path??'',restorationOperationId:companionConfig.restoration?.operationId??'',requestedProfileVersion:companionConfig.restoration?.requestedProfileVersion??0,registered:companionConfig.bootstrap?.registrationOperationId??''};
 assert.equal(record.profileAfterAcceptance.bootstrapPath,'','activation interruption must leave no local registration');
 // Real CLI in a new process: read-only until the original confirmation completes; no model, no duplicate acceptance.
 host=await bootOfficialCliFixture(run,()=>response('激活接续后明确接纳的新输入。'),{profileName:'resume55',reuse:true,captureTransportError:true});
 record.reopened=await wait(()=>host.rpc('inspect'),view=>view.role.status==='read-only'||view.role.status==='ready');
 assert.equal(record.reopened.role.status,'read-only','an interrupted activation must not become ready by reopening');
 assert.equal(record.reopened.role.reason,'RESTORE_ACCEPTED_REOPEN_REQUIRED');
 assert.deepEqual(record.reopened.restorationAcceptance,record.acceptance);
 assert.equal(record.reopened.bootstrap.version,1);assert.equal(record.reopened.bootstrap.path,'');assert.equal(host.entries.length,0);
 record.localLocks={sourceWriter:await access(join(source,'writer.lock')).then(()=>true,()=>false),targetWriter:await access(join(destination,'writer.lock')).then(()=>true,()=>false)};
 record.confirm={operationId:'resume-confirm55',restoreOperationId:'resume-copy55',handoverId:record.handover.record.handoverId,expectedManifestDigest:record.copy.manifestDigest,expectedRevision:record.copy.sourceRevision,currentSourceStoppedConfirmed:true};
 record.profileCasNegatives=[];
 for(const [caseId,change,expectedRoleId,version,code]of[
  ['use-current-profile-version',{},home.roleId,1,'PROFILE_VERSION_CONFLICT'],
  ['wrong-role',{},'role-00000000-0000-4000-8000-000000000000',0,'RESTORE_IDENTITY_CONFLICT'],
  // The original confirmation operation already committed an acceptance, so changing its content is an operation conflict, never a second acceptance.
  ['wrong-handover',{handoverId:'handover-'+'a'.repeat(64)},home.roleId,0,'OPERATION_CONFLICT'],
  ['wrong-manifest',{expectedManifestDigest:'a'.repeat(64)},home.roleId,0,'RESTORE_IDENTITY_CONFLICT'],
  ['not-confirmed',{currentSourceStoppedConfirmed:false},home.roleId,0,'SOURCE_STOP_CONFIRMATION_REQUIRED']]){await assert.rejects(host.rpc('confirmRestore',{expectedRoleId,request:{...record.confirm,...change},expectedRestoreProfileVersion:version}),error=>{const checkpointBlocked=error.message.includes('FILE_SOURCE_PROFILE_CHECKPOINT_CHANGED');record.profileCasNegatives.push({caseId,expected:code,checkpointGuardPreempted:checkpointBlocked,error:error.message});return checkpointBlocked||error.message.includes(code);});assert.equal((await host.rpc('inspect')).role.status,'read-only');assert.equal(host.entries.length,0);}
 record.checkpointGuardPreempted=record.profileCasNegatives.some(row=>row.checkpointGuardPreempted);
 record.deepestNegativeReached=record.profileCasNegatives.filter(row=>!row.checkpointGuardPreempted).map(row=>row.caseId);
 // The identical original confirmation is retried; it must either resume or be deterministically refused, never half-activate.
 record.resumeAttempt=await host.rpc('confirmRestore',{expectedRoleId:home.roleId,request:record.confirm,expectedRestoreProfileVersion:0}).then(value=>({kind:'resumed',value}),error=>({kind:'refused',error:error.message}));
 assert.equal(record.resumeAttempt.kind,'resumed','the original owner confirmation must resume after an interrupted activation, not be refused: '+JSON.stringify(record.resumeAttempt).slice(0,600));
 record.resumeBlockedBy=null;
 const afterAttempt=await host.rpc('inspect');
 record.afterAttempt={status:afterAttempt.role.status,reason:afterAttempt.role.reason,bootstrap:afterAttempt.bootstrap,acceptance:afterAttempt.restorationAcceptance?.operationId??null};
 assert.equal(host.entries.length,0,'an interrupted activation must not issue model requests');
 record.commitsAfterAttempt=(await Promise.all(await commits())).map(commit=>commit.kind);
 assert.equal(record.commitsAfterAttempt.filter(kind=>kind==='accept-restore').length,1,'resume must not write a second acceptance');
 assert.equal(record.commitsAfterAttempt.filter(kind=>kind==='register-home').length,1,'resume writes exactly one local registration');
 record.ready=await wait(()=>host.rpc('inspect'),view=>view.role.status==='ready');
 assert.equal(record.ready.bootstrap.path,destination);assert.equal(record.ready.bootstrap.version,2);
 assert.deepEqual(record.ready.restorationAcceptance,record.acceptance);
 record.replayed=await host.rpc('confirmRestore',{expectedRoleId:home.roleId,request:record.confirm,expectedRestoreProfileVersion:0});
 assert.deepEqual(record.replayed,record.resumeAttempt.value);
 record.conversationBeforeInput=await host.rpc('readConversation',{expectedRoleId:home.roleId,expectedBindingVersion:1});
 assert.equal(record.conversationBeforeInput.totalAttempts,0);assert.equal(record.conversationBeforeInput.totalReplies,0);
 assert.equal(host.entries.length,0,'registration resume must not issue a model request');
 record.newInput=await host.rpc('submitInput',{request:{operationId:'resume-new-input55',clientRequestId:'resume-new-input55',expectedRoleId:home.roleId,expectedBindingVersion:1,text:'激活接续后明确接纳的新输入。'}});
 record.after=await wait(()=>host.rpc('readConversation',{expectedRoleId:home.roleId,expectedBindingVersion:1}),view=>view.totalReplies===1);
 record.reply=await host.rpc('readReply',{expectedRoleId:home.roleId,expectedBindingVersion:1,request:{replyId:record.after.replies[0].replyId,offset:0,limit:100}});
 assert.equal(record.reply.text,'激活接续后明确接纳的新输入。');assert.equal(host.entries.length,1);
 await stopHost();
 // Another fresh process keeps the same enforced state; a saved reply is never regenerated.
 host=await bootOfficialCliFixture(run,()=>{throw Error('INTERRUPTED_ACTIVATION_MUST_NOT_GENERATE');},{profileName:'resume55',reuse:true,captureTransportError:true});
 record.fresh=await wait(()=>host.rpc('inspect'),view=>view.role.status==='ready');
 assert.deepEqual(record.fresh.restorationAcceptance,record.acceptance);
 record.freshConversation=await host.rpc('readConversation',{expectedRoleId:home.roleId,expectedBindingVersion:1});
 assert.equal(record.freshConversation.totalReplies,1);assert.equal(record.freshConversation.totalAttempts,1);
 assert.deepEqual(record.freshConversation.replies[0],record.after.replies[0]);
 assert.equal(host.entries.length,0);
 await stopHost();
 const disk=await openRoleHome(destination,{expectedRoleId:home.roleId});
 record.diskSnapshot=await disk.readSnapshot();record.diskConversation=await disk.readConversation();record.diskAcceptance=await disk.restoreAcceptanceSnapshot();record.diskDiagnostic=await disk.readActivationDiagnostic();await disk.close();
 assert.deepEqual(record.diskAcceptance,record.acceptance);
 const old=record.diskSnapshot.inputs.find(input=>input.inputId===record.oldInput.inputId);
 assert.equal(old.status,'queued');assert.equal(old.text,'交接前的原待办保留但不自动执行。');
 assert.equal(record.diskConversation.attempts.length,1,'only the explicit new input was executed');
 assert.deepEqual(record.diskConversation.turns[0].inputIds,[record.newInput.inputId]);
 record.totalModels=record.models;record.totalMetadata=record.metadata;
 assert.equal(record.totalModels,1);
 assert.equal(record.totalMetadata,0);
 record.status='passed';
}catch(error){failure=error;record.status='failed';record.error={name:error.name,message:error.message,code:error.code??null};}
finally{if(host)await stopHost();if(sourceRole){sourceRole.lifetime.requestStop('unload');await sourceRole.lifetime.stopped;}record.writerReleased=await access(join(destination,'writer.lock')).then(()=>false,error=>error.code==='ENOENT');record.accessReleased=await access(join(destination,'.maintenance.lock')).then(()=>false,error=>error.code==='ENOENT');await writeFile(join(run,'restore-activation-resume-result.json'),JSON.stringify(record,null,2).replaceAll(run,'<isolated-restore-home>')+'\n');}
if(failure)throw failure;
