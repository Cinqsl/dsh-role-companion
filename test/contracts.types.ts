import type { OpenedRoleHome, HomeSnapshot, InputRecord, ExecutionRecordRead, ReserveAttempt } from '../packages/companion/src/home/index.ts';
import type { RoleOwner } from '../packages/companion/src/runtime/index.ts';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { RoleCompanionController } from '../packages/companion/src/index.ts';
declare const home: OpenedRoleHome, owner: RoleOwner, snapshot: HomeSnapshot, input: InputRecord, attempt: ReserveAttempt, nativeSession: SessionId, controller: RoleCompanionController;
owner.readOperation(input.operationId);
home.readOperation(input.operationId);
home.acceptInput({...input, origin:'live'});
home.reserveAttempt(attempt);
// @ts-expect-error Role identity is not an operation identity.
owner.readOperation(home.roleId);
// @ts-expect-error Input identity is not a panel binding identity.
home.acceptInput({...input, bindingId:input.inputId, origin:'live'});
// @ts-expect-error An SDK Session is not a verified Role identity.
controller.readOperation(input.operationId,nativeSession);
// @ts-expect-error Home revision does not name a conversation rules version.
home.applyOwner({kind:'edit-conversation',operationId:input.operationId,value:{modelLimit:1,toolLimit:1,webLimit:1,windowMs:1000,outputTokens:1},expectedRevision:snapshot.revision,expectedConversationVersion:snapshot.revision});
// @ts-expect-error Input settings and conversation rules have separate owners.
home.reserveAttempt({...attempt, settingsVersion:snapshot.settings.version});
// @ts-expect-error A run is not an actual attempt.
home.enterAttempt({operationId:input.operationId,attemptId:attempt.runId,now:'2026-01-01T00:00:00.000Z'});
// @ts-expect-error The record discriminator fixes the identity family.
const invalidRecord: ExecutionRecordRead = {kind:'native',recordId:attempt.attemptId,offset:0,limit:1};
// @ts-expect-error Profile selection and Home revision are independent versions.
controller.attachHome('/tmp/home',home.roleId,input.operationId,snapshot.revision);
import type {} from '@deepseek-ai/dsh-api-gateway/client';
import type { Context } from '@deepseek-ai/cordis';
import '../packages/companion/lib/typert.remote-client.js';
import {OperationId,RunId,AttemptId,RoleId,HomeRevision,CoreVersion,InputSettingsVersion,ConversationVersion,ContextGeneration,BindingVersion} from '../packages/companion/src/home/ids.ts';
import {ProfileSelectionVersion} from '../packages/companion/src/host-contracts.ts';
import type { NativeRecordRef } from 'dsh-role-companion/types';
declare const client:Context, nativeRecordRef:NativeRecordRef;
client.remote.roleCompanion.readOperation(input.operationId,home.roleId);
client.remote.roleCompanion.attachHome('/tmp/home',RoleId('role-00000000-0000-0000-0000-000000000000'),OperationId('attach'),ProfileSelectionVersion(0));
home.beginTurn({operationId:OperationId('begin'),runId:RunId('run'),inputIds:[input.inputId],expectedRevision:HomeRevision(1),now:'2026-01-01T00:00:00.000Z'});
home.reserveAttempt({...attempt,attemptId:AttemptId('attempt'),contextGeneration:ContextGeneration(1),settingsVersion:ConversationVersion(1)});
home.applyOwner({kind:'edit-core',operationId:input.operationId,text:'core',expectedCoreVersion:CoreVersion(1),expectedRevision:HomeRevision(1)});
home.applyOwner({kind:'edit-settings',operationId:input.operationId,settings:{inputLimitBytes:1},expectedSettingsVersion:InputSettingsVersion(1),expectedRevision:HomeRevision(1)});
home.readExecutionRecord({kind:'native',recordId:nativeRecordRef,offset:0,limit:1});
// @ts-expect-error Generated client declarations preserve the same identity separation.
client.remote.roleCompanion.readOperation(home.roleId,home.roleId);
// @ts-expect-error Raw JSON strings are not already admitted operations.
home.readOperation('read');
// @ts-expect-error Core and input-settings versions are independent.
home.applyOwner({kind:'edit-settings',operationId:input.operationId,settings:{inputLimitBytes:1},expectedSettingsVersion:snapshot.core.version,expectedRevision:snapshot.revision});
// @ts-expect-error A settings version cannot advance context generation.
home.refreshTurnContext({operationId:input.operationId,runId:attempt.runId,previousGeneration:snapshot.settings.version,nextGeneration:snapshot.contextGeneration});
async function preservedProjectionContract() {
 const result=await client.remote.roleCompanion.readPreservedProjection(input.operationId,home.roleId);
 if(result.ok){
  owner.readOperation(result.value.operationId);
  // @ts-expect-error The generated public result must not collapse to any through a private import path.
  owner.readOperation(result.value.materialRef);
 }
}

import type {RoleReadRequest} from 'dsh-role-companion/types';
const currentInputRead:RoleReadRequest={source:'input',id:input.inputId,offset:0,limit:32};
const priorExperienceRead:RoleReadRequest={source:'experience',id:input.experienceId,offset:0,limit:32};
// @ts-expect-error Current input and original experience selectors use distinct identity families.
const wrongInputRead:RoleReadRequest={source:'input',id:input.experienceId,offset:0,limit:32};
// @ts-expect-error SDK technical Sessions cannot select a role's original experience.
const wrongExperienceRead:RoleReadRequest={source:'experience',id:nativeSession,offset:0,limit:32};

import type {ReadRulesSnapshot} from 'dsh-role-companion/types';
import {ReadRulesVersion} from '../packages/companion/src/home/ids.ts';
declare const readRules:ReadRulesSnapshot;
owner.apply({kind:'edit-read-rules',operationId:input.operationId,value:readRules.value,expectedReadRulesVersion:readRules.version,expectedRevision:snapshot.revision});
client.remote.roleCompanion.editReadRules(home.roleId,input.bindingVersion,{operationId:input.operationId,value:{...readRules.value},expectedReadRulesVersion:ReadRulesVersion(1),expectedRevision:snapshot.revision});
// @ts-expect-error Read-tool rules and conversation rules have separate version owners.
owner.apply({kind:'edit-read-rules',operationId:input.operationId,value:readRules.value,expectedReadRulesVersion:attempt.settingsVersion,expectedRevision:snapshot.revision});
// @ts-expect-error Generated clients preserve the distinct read-rules version contract.
client.remote.roleCompanion.editReadRules(home.roleId,input.bindingVersion,{operationId:input.operationId,value:{...readRules.value},expectedReadRulesVersion:snapshot.core.version,expectedRevision:snapshot.revision});

async function toolRecordReadContract(){
 const result=await client.remote.roleCompanion.readExecutionRecord(home.roleId,input.bindingVersion,{kind:'native',recordId:nativeRecordRef,offset:0,limit:4096});
 if(result.ok){const digest:string=result.value.contentDigest;
  // @ts-expect-error A technical content digest never becomes an operation capability.
  owner.readOperation(digest);
  if(result.value.kind==='native'){
   // @ts-expect-error The owner read DTO retains the native-ref versus attempt-ID discriminator.
   home.enterAttempt({operationId:input.operationId,attemptId:result.value.recordId,now:'2026-10-26T00:00:00.000Z'});
  }
 }
}

owner.stop({operationId:input.operationId});
client.remote.roleCompanion.stopRole(home.roleId,input.bindingVersion,{operationId:input.operationId});
client.remote.roleCompanion.readStopOperation(home.roleId,input.bindingVersion,input.operationId);
client.remote.roleCompanion.reopenRole(home.roleId,input.bindingVersion,input.operationId);
// @ts-expect-error A Role identity cannot name a stop operation.
owner.stop({operationId:home.roleId});
// @ts-expect-error Generated lifecycle clients retain the distinct binding version.
client.remote.roleCompanion.stopRole(home.roleId,snapshot.revision,{operationId:input.operationId});
import {LogicalOpId,RetryRulesVersion} from '../packages/companion/src/home/ids.ts';
declare const logicalModel:LogicalOpId,retryRuleVersion:RetryRulesVersion;
// @ts-expect-error A logical model operation is not an individual charged attempt.
const logicalAttemptError:AttemptId=logicalModel;
// @ts-expect-error Native Session identity cannot establish a Home logical budget operation.
const nativeLogicalError:LogicalOpId=nativeSession;
// @ts-expect-error Logical inference and Home business operations are separate identities.
const logicalOperationError:OperationId=logicalModel;
// @ts-expect-error A run cannot replace a logical retry identity.
const logicalRunError:RunId=logicalModel;
// @ts-expect-error Retry rule versions cannot replace conversation settings versions.
const retryConversationError:ConversationVersion=retryRuleVersion;
// @ts-expect-error Read rules and retry rules have independent owners.
const retryReadError:ReadRulesVersion=retryRuleVersion;
owner.apply({kind:'edit-retry-rules',operationId:input.operationId,value:{maxAutomaticRetries:1,retryDelayMs:1000},expectedRetryRulesVersion:RetryRulesVersion(1),expectedRevision:snapshot.revision});
// @ts-expect-error Expected retry version is not a Home revision.
owner.apply({kind:'edit-retry-rules',operationId:input.operationId,value:{maxAutomaticRetries:1,retryDelayMs:1000},expectedRetryRulesVersion:snapshot.revision,expectedRevision:snapshot.revision});

import type {FileRulesSnapshot} from 'dsh-role-companion/types';
import {FileRulesVersion,FileTag} from '../packages/companion/src/home/ids.ts';
declare const fileRules:FileRulesSnapshot;
owner.apply({kind:'edit-file-rules',operationId:input.operationId,value:fileRules.value,expectedFileRulesVersion:fileRules.version,expectedRevision:snapshot.revision});
client.remote.roleCompanion.editFileRules(home.roleId,input.bindingVersion,{operationId:input.operationId,value:{...fileRules.value},expectedFileRulesVersion:FileRulesVersion(1),expectedRevision:snapshot.revision});
// @ts-expect-error File limits have their own Home version owner.
client.remote.roleCompanion.editFileRules(home.roleId,input.bindingVersion,{operationId:input.operationId,value:{...fileRules.value},expectedFileRulesVersion:readRules.version,expectedRevision:snapshot.revision});
// @ts-expect-error A FileTag is a content precondition, never an operation capability.
owner.readOperation(FileTag('file-v1-'+ '0'.repeat(64)));

import {FileAccessVersion,FileGrantId} from '../packages/companion/src/home/ids.ts';
import type {FileAccessSnapshot} from 'dsh-role-companion/types';
declare const fileAccess:FileAccessSnapshot;
owner.apply({kind:'edit-file-access',operationId:input.operationId,value:fileAccess.value,expectedFileAccessVersion:FileAccessVersion(1),expectedRevision:snapshot.revision});
// @ts-expect-error A content-limit version does not identify a permission-book version.
owner.apply({kind:'edit-file-access',operationId:input.operationId,value:fileAccess.value,expectedFileAccessVersion:fileRules.version,expectedRevision:snapshot.revision});
// @ts-expect-error A grant identity does not identify a role or an owner operation.
owner.readOperation(FileGrantId('file-grant-00000000-0000-4000-8000-000000000001'));
import {WebRulesVersion} from '../packages/companion/src/home/ids.ts';
const webRulesValue={transportTimeoutMs:30000,toolTimeoutMs:45000,maxResults:8,responseLimitBytes:4194304};
owner.apply({kind:'edit-web-rules',operationId:input.operationId,value:webRulesValue,expectedWebRulesVersion:WebRulesVersion(1),expectedRevision:snapshot.revision});
client.remote.roleCompanion.editWebRules(home.roleId,snapshot.panelBinding.bindingVersion,{operationId:input.operationId,value:webRulesValue,expectedWebRulesVersion:WebRulesVersion(1),expectedRevision:snapshot.revision});
// @ts-expect-error Home revision cannot replace the Web rules owner's version.
owner.apply({kind:'edit-web-rules',operationId:input.operationId,value:webRulesValue,expectedWebRulesVersion:snapshot.revision,expectedRevision:snapshot.revision});
// @ts-expect-error Retry and Web rules have independent version owners.
client.remote.roleCompanion.editWebRules(home.roleId,snapshot.panelBinding.bindingVersion,{operationId:input.operationId,value:webRulesValue,expectedWebRulesVersion:retryRuleVersion,expectedRevision:snapshot.revision});

import type {ContextSourceRead,ContextSourceRef} from 'dsh-role-companion/types';
const contextSourceRead:ContextSourceRead={ref:{kind:'input',id:input.inputId},revision:snapshot.revision,contentDigest:'0'.repeat(64),offset:0,limit:32};
owner.readContextSource(contextSourceRead);
owner.readContextSources({offset:0,limit:20});
client.remote.roleCompanion.readContextSource(home.roleId,input.bindingVersion,contextSourceRead);
home.openContextReader({purpose:'daily',runId:attempt.runId});
// @ts-expect-error SDK Sessions cannot establish a business run's source scope.
home.openContextReader({purpose:'daily',runId:nativeSession});
// @ts-expect-error A reply source cannot be selected with an input identity.
const wrongReplySource:ContextSourceRef={kind:'reply',id:input.inputId};
// @ts-expect-error A content snapshot revision is not a core version.
owner.readContextSource({...contextSourceRead,revision:snapshot.core.version});
// @ts-expect-error Source management still requires the binding version owner.
client.remote.roleCompanion.readContextSources(home.roleId,snapshot.revision,{offset:0,limit:20});
// @ts-expect-error A model query cannot request the trusted management purpose.
const forgedContextPurpose:RoleReadRequest={source:'query',query:'earlier source',offset:0,limit:32,purpose:'management'};

import {BackupManifestDigest,type RestoreRequest} from '../packages/companion/src/home/index.ts';
const restoreManifestDigest=BackupManifestDigest('a'.repeat(64));
// @ts-expect-error Manifest CAS values cannot be used as operation identities.
const restoreWrongOperation:OperationId=restoreManifestDigest;
// @ts-expect-error Raw strings have not passed the manifest-digest contract.
const restoreWrongManifest:RestoreRequest['expectedManifestDigest']='a'.repeat(64);
import {ProposalId,KnowledgeId,KnowledgeVersion,ProposalRulesVersion} from '../packages/companion/src/home/ids.ts';
import type {KnowledgeProposal} from 'dsh-role-companion/home';
const proposalId=ProposalId('proposal-typed46'),knowledgeId=KnowledgeId('knowledge-typed46');
declare const proposedKnowledge:KnowledgeProposal;
home.saveProposal({operationId:input.operationId,attemptId:attempt.attemptId,now:'2026-10-27T00:00:00.000Z',value:proposedKnowledge});
home.processProposal({operationId:input.operationId,proposalId,assessment:{status:'pending-review',reason:'SEMANTIC_REVIEW_REQUIRED',sources:[]}});
client.remote.roleCompanion.readKnowledgeRecord(home.roleId,input.bindingVersion,{ref:{kind:'version',knowledgeId,version:KnowledgeVersion(1)},revision:snapshot.revision,contentDigest:'0'.repeat(64),offset:0,limit:100});
client.remote.roleCompanion.editProposalRules(home.roleId,input.bindingVersion,{operationId:input.operationId,value:{maxRestSuggestionMs:1000},expectedProposalRulesVersion:ProposalRulesVersion(1),expectedRevision:snapshot.revision});
// @ts-expect-error A tool attempt identity is not an independently processed proposal identity.
home.processProposal({operationId:input.operationId,proposalId:attempt.attemptId,assessment:{status:'reject',reason:'PROPOSAL_RUN_CLOSED',sources:[]}});
// @ts-expect-error A Home revision cannot select a knowledge topic's version.
const wrongKnowledgeRef:ContextSourceRef={kind:'knowledge',id:knowledgeId,version:snapshot.revision};
// @ts-expect-error A proposal identifier is not a knowledge identifier.
client.remote.roleCompanion.readKnowledgeRecord(home.roleId,input.bindingVersion,{ref:{kind:'version',knowledgeId:proposalId,version:KnowledgeVersion(1)},revision:snapshot.revision,contentDigest:'0'.repeat(64),offset:0,limit:100});
// @ts-expect-error Proposal rule versions and knowledge topic versions have distinct owners.
client.remote.roleCompanion.editProposalRules(home.roleId,input.bindingVersion,{operationId:input.operationId,value:{maxRestSuggestionMs:1000},expectedProposalRulesVersion:KnowledgeVersion(1),expectedRevision:snapshot.revision});

import type {CurrentToolSource} from '../packages/companion/src/home/context-snapshot.ts';
declare const currentToolSource:CurrentToolSource;
const currentToolAnchor:AttemptId=currentToolSource.source.ref.id;
home.readCurrentToolSource({roleId:home.roleId,runId:attempt.runId,contextGeneration:attempt.contextGeneration,initialRevision:snapshot.revision,attemptId:attempt.attemptId,purpose:'daily'});
// @ts-expect-error A current tool source never carries a KnowledgeId discriminator.
const currentToolIsNotKnowledge:KnowledgeId=currentToolSource.source.ref.id;
// @ts-expect-error A supplementary source's initial head is a Home revision, not a context generation.
home.readCurrentToolSource({roleId:home.roleId,runId:attempt.runId,contextGeneration:attempt.contextGeneration,initialRevision:attempt.contextGeneration,attemptId:attempt.attemptId,purpose:'daily'});

import {HandoverId} from '../packages/companion/src/home/ids.ts';
const handoverId55=HandoverId('handover-'+'a'.repeat(64));
// @ts-expect-error A handover identity is not a retryable owner operation identity.
const handoverIsNotOperation55:OperationId=handoverId55;
// @ts-expect-error Raw strings cannot stand in for a verified handover identity.
const handoverNeedsValidation55:typeof handoverId55='handover-'+'a'.repeat(64);

declare const restoreRequest55:RestoreRequest;
client.remote.roleCompanion.requestRestore(restoreRequest55,ProfileSelectionVersion(0));
client.remote.roleCompanion.readRestore('/tmp/restored55',{operationId:restoreRequest55.operationId,expectedRoleId:restoreRequest55.expectedRoleId});
// @ts-expect-error Home revision does not guard a machine profile selection.
client.remote.roleCompanion.requestRestore(restoreRequest55,snapshot.revision);
// @ts-expect-error A RoleId cannot be queried as an original restore operation.
client.remote.roleCompanion.readRestore('/tmp/restored55',{operationId:home.roleId,expectedRoleId:home.roleId});

import type {RestoreConfirmation} from 'dsh-role-companion/home';
declare const restoreConfirmation55:RestoreConfirmation;
home.confirmRestore(restoreConfirmation55);
// @ts-expect-error Confirmation is bound to a HandoverId, not its owner operation id.
home.confirmRestore({...restoreConfirmation55,handoverId:restoreConfirmation55.operationId});
import type {RollbackKnowledge,OwnerKnowledgeRecord,KnowledgeRecord} from 'dsh-role-companion/home';
declare const knowledgeRollback:RollbackKnowledge,ownerKnowledgeVersion:OwnerKnowledgeRecord;
home.applyOwner(knowledgeRollback);
owner.apply(knowledgeRollback);
// @ts-expect-error A Home head cannot select the version of a knowledge body.
owner.apply({...knowledgeRollback,targetVersion:snapshot.revision});
// @ts-expect-error An independent proposal ID cannot identify the knowledge being rolled back.
owner.apply({...knowledgeRollback,knowledgeId:proposalId});
// @ts-expect-error Real owner decisions cannot claim a fabricated model proposal source.
const forgedRollbackProposal:KnowledgeRecord={...ownerKnowledgeVersion,proposalId};
client.remote.roleCompanion.rollbackKnowledge(home.roleId,input.bindingVersion,{operationId:input.operationId,knowledgeId,targetVersion:KnowledgeVersion(1),expectedKnowledgeVersion:KnowledgeVersion(2),expectedRevision:snapshot.revision,reason:'public owner rollback'});
client.remote.roleCompanion.readKnowledgeDifference(home.roleId,input.bindingVersion,{knowledgeId,targetVersion:KnowledgeVersion(1),revision:snapshot.revision});
client.remote.roleCompanion.readKnowledgeOperation(home.roleId,input.bindingVersion,input.operationId);
// @ts-expect-error A context generation is not a Home CAS head for an owner rollback.
client.remote.roleCompanion.rollbackKnowledge(home.roleId,input.bindingVersion,{...knowledgeRollback,expectedRevision:attempt.contextGeneration});
// @ts-expect-error An operation ID is not a knowledge-version selector.
client.remote.roleCompanion.readKnowledgeDifference(home.roleId,input.bindingVersion,{knowledgeId,targetVersion:input.operationId,revision:snapshot.revision});

import type {AutonomyWindow,AutonomyWindowTransition,AutonomyAttributionRun} from 'dsh-role-companion/home';
declare const autonomyWindow:AutonomyWindow,windowTransition:AutonomyWindowTransition,attributionRun:AutonomyAttributionRun;
// A window keeps one IANA window ID and one UTC span; the transition is recorded beside them.
const transitionedWindow:AutonomyWindow={...autonomyWindow,transition:windowTransition};
import {AutonomyRulesVersion} from '../packages/companion/src/home/ids.ts';
owner.apply({kind:'edit-autonomy-rules',operationId:input.operationId,value:{...autonomyWindow.used,dailyModelLimit:1,dailyToolLimit:1,dailyWebLimit:1,modelLimit:1,toolLimit:1,webLimit:1,outputTokens:1,timeZone:'UTC',wakeIntervalMs:60000,windowMs:1},expectedAutonomyRulesVersion:AutonomyRulesVersion(1),expectedRevision:snapshot.revision});
// @ts-expect-error A transitioned window must keep its original DayWindowId, never a run identity.
const forgedWindow:AutonomyWindow={...transitionedWindow,windowId:attempt.runId};
// @ts-expect-error A transition record carries UTC strings, not Home revisions.
const forgedTransition:AutonomyWindowTransition={...windowTransition,previousEndUtc:snapshot.revision};
owner.readAutonomyAttribution({runId:attributionRun.runId});
// @ts-expect-error Cross-window attribution selects runs, not attempts.
owner.readAutonomyAttribution({runId:attempt.attemptId});
client.remote.roleCompanion.readAutonomyAttribution(home.roleId,input.bindingVersion,{runId:attributionRun.runId});
client.remote.roleCompanion.reviewAutonomyClock(home.roleId,input.bindingVersion,{operationId:input.operationId,expectedRevision:snapshot.revision});
// @ts-expect-error A clock review is a Home CAS write, not an operation lookup.
client.remote.roleCompanion.reviewAutonomyClock(home.roleId,input.bindingVersion,{operationId:input.operationId,expectedRevision:input.operationId});

import type {ContactRulesVersion,ContactIntentId} from '../packages/companion/src/home/ids.ts';
// @ts-expect-error Contact rules have their own version family; they never reuse another rules version.
home.applyOwner({kind:'edit-contact-rules',operationId:input.operationId,value:{cooldownMs:0,dailyLimit:1,perRoundLimit:1,quietHours:{mode:'off'}},expectedContactRulesVersion:snapshot.revision,expectedRevision:snapshot.revision});
// @ts-expect-error A contact intent has its own identity family; an input id is not a contact intent id.
controller.readContactIntent(home.roleId,input.bindingVersion,{intentId:input.inputId,revision:snapshot.revision,contentDigest:'a'.repeat(64),offset:0,limit:10});
// @ts-expect-error Contact rules version and Home revision are independent version families.
const contactRulesVersion:ContactRulesVersion=snapshot.revision;
// @ts-expect-error A contact intent id cannot stand in for a ReplyId/intent-derived string.
const intentAsContact:ContactIntentId=OperationId('intent-run-x');
