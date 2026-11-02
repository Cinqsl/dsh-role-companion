import type {ClockReading} from '../runtime/clock.ts';
import {restoreConfirmation,restoreInputEligible,restoreRunEligible,restoreDeliveryEligible,type RestoreConfirmation,type RestoreAcceptance} from './restore-acceptance.ts';
export type * from './restore-acceptance.ts';
import {currentOutgoingHandover,handoverReservation,type HandoverReservation,type HandoverRecord} from './handovers.ts';
export type * from './handovers.ts';
import {portableRestoreRequired} from './restore-admission.ts';
import {parseKnowledgeRollback,createKnowledgeRollback,rollbackKnowledgeBusiness,type RollbackKnowledge} from './knowledge-owner.ts';
export * from './knowledge-owner.ts';
import {confirmedToolCanonical,contextField} from './context-tools.ts';
import type {CurrentToolSourceRequest,CurrentToolSource} from './context-snapshot.ts';
import {validateProposalRules,type ProposalRulesValue,type ProposalRulesSnapshot} from './proposal-rules.ts';
export {validateProposalRules,proposalRulesDefaults,type ProposalRulesValue,type ProposalRules,type ProposalRulesSnapshot} from './proposal-rules.ts';
import {createContextLineage,contextBindingAllowed} from './context-lineage.ts';
import {parseKnowledgeProposal,admitProposedKnowledge,proposalClaim,directUserReport,assessKnowledgeProposal,correctedSourceReused,ownerActionSourceReused,unchangedKnowledge,canonicalProposalSucceeded,canonicalProposalRecorded,type KnowledgeProposal,type KnowledgeSnapshot,type ProposalAssessment,type ProposalRecord,type KnowledgeRecord,type ProposalProcessing} from './knowledge.ts';
export * from './knowledge.ts';
import {ProposalId,KnowledgeId,KnowledgeVersion,ContactRulesVersion,ContactIntentId} from './ids.ts';
import {validateFileAccess,admitFileAccess,validateEditFileAccess,type EditFileAccess,type FileAccessSnapshot} from './file-access.ts';
export * from './file-access.ts';
import {validateFileRules,type FileRulesValue,type FileRulesSnapshot} from './file-rules.ts';
export {validateFileRules,fileRulesDefaults,type FileRulesValue,type FileRules,type FileRulesSnapshot} from './file-rules.ts';
import {createContextSnapshotReader,contextSourceDigest,type ContextSourceBasis,type ContextReaderRequest,type ContextSnapshotReader} from './context-snapshot.ts';
export type * from './context-snapshot.ts';
import {validateResolveDelivery,validResolutionDecision,type ResolveDelivery,type DeliveryResolution} from './delivery-resolutions.ts';
export * from './delivery-resolutions.ts';
import {prepareRedelivery,prepareDelivery,prepareContactDelivery} from './delivery-prepare.ts';
export {prepareRedelivery,prepareDelivery,prepareContactDelivery,previewDelivery,longContactMarker} from './delivery-prepare.ts';
import {emptyContact,contactBlocked,contactRoundUsed,contactIntentOpen,validContactStamp,type ContactIntentRecord,type ContactStamp,type ContactState,type ContactIntentState} from './contact.ts';
export {emptyContact,contactBlocked,contactRoundUsed,contactIntentOpen,validContactStamp,type ContactIntentRecord,type ContactStamp,type ContactState} from './contact.ts';
import {initialDeliveries,validateDeliveryRules,previewReply,previewDelivery,admitDelivery,sameQQTarget,DeliveryId,SendAttemptId,DeliveryRulesVersion,type DeliveryRulesSnapshot,type BeginDelivery,type SendAttemptRecord,type DeliveryObservation,type EditDeliveryRules} from './deliveries.ts';
export * from './deliveries.ts';
import {initialWebRules,validateWebRules,validWebAttempt,type WebRulesSnapshot,type WebRulesValue,type ReserveWebTool} from './web.ts';
export type * from './web.ts';
export {validateWebRules} from './web.ts';
import {WebRulesVersion} from './ids.ts';
import {initialAutonomy,validAutonomyRules,clockProblem,appendWindow,wakeBlocked,transitionIanaWindow,effectiveAutonomyDay,scheduleBase,nextSlotAfter,nextGridSlot,validSchedule,type AutonomySnapshot,type AutonomousStamp,type AutonomyRulesValue,type WakeOpportunity,type AutonomyWindowTransition,type AutonomySchedule} from './autonomy.ts';
export * from './autonomy.ts';
import {ordinaryHomeRoots,protectedHomeEntries,temporaryHomeRootPrefixes,type HomeFileLayout} from './layout.ts';
export {ordinaryHomeRoots,protectedHomeEntries,retainedHomeEntries,temporaryHomeRootPrefixes,type HomeFileLayout} from './layout.ts';
import {acceptedRestoreSource,restoredMaintenanceSnapshots,BackupStore,verifyBackup,readMaintenance,restoreBackup,readRestore,prepareRestoreAcceptance,markRestoreAccepted,locallyAcceptedRestore} from './backup-storage.ts';
import type {RestoreRequest,RestoreRead,RestoreProgress} from './restores.ts';
export type * from './restores.ts';
import type {HomeBackupMaintenance,BackupProgress,BackupMaintenanceRead,BackupMaintenanceSnapshot} from './backups.ts';
export type {BackupRequest,BackupProgress,BackupPhase,BackupFile,HomeBackupMaintenance,BackupMaintenanceSnapshot,BackupMaintenanceRead} from './backups.ts';
import {HomeError} from './errors.ts';
export {HomeError} from './errors.ts';
import {qqInputIdentity} from './qq-key.ts';
import {validateHistoryInput,type SelectQQHistory,type QQHistorySelection,type QQHistoryCandidateId,emptyQQHistory,applyQQHistoryFact,qqHistoryBusiness,validQQHistoryPolicy,historyDigest,QQHistoryQueryId,type QQHistoryQuery,type QQHistoryState,type QQHistorySnapshot,type QQHistoryFact,type BeginQQHistory,type QQHistoryPageRequest,type QQHistoryRequestId,type QQHistoryObservation} from './qq-history.ts';
export * from './qq-history.ts';
export {qqInputIdentity} from './qq-key.ts';
import {validateBindQQ,admitQQBinding,admitQQInputSource,QQMessageId,type QQBinding,type BindQQCommand} from './qq.ts';
export * from './qq.ts';
import {isStopReason,type StopReason,type StopRecord,type StopProgress} from './stops.ts';
export type {StopReason,StopRecord,StopProgress,StopRequest} from './stops.ts';
import {validateRetryRules,type RetryRulesValue,type RetryRulesSnapshot} from './retry-rules.ts';
export {validateRetryRules,retryRulesDefaults,type RetryRulesValue,type RetryRules,type RetryRulesSnapshot} from './retry-rules.ts';
import {validModelOperation,validateModelFailure} from './model-operations.ts';
export type {ModelOperationClaim,ModelPurpose,ModelFailure} from './model-operations.ts';
import {validateContactRules,quietHoursActive,localMinutes,initialContactRules,contactRulesDefaults,type ContactRulesValue,type ContactRules,type ContactRulesSnapshot,type QuietHours} from './contact-rules.ts';
export {validateContactRules,quietHoursActive,localMinutes,initialContactRules,contactRulesDefaults,type ContactRulesValue,type ContactRules,type ContactRulesSnapshot,type QuietHours} from './contact-rules.ts';
import {validateReadRules,type ReadRulesValue,type ReadRulesSnapshot} from './read-rules.ts';
export {validateReadRules,readRulesDefaults,minimumReadDisplayCodePoints,type ReadRulesValue,type ReadRules,type ReadRulesSnapshot} from './read-rules.ts';
import {validateInputSettings,type InitialSettings} from './settings.ts';
export {validateInputSettings,type InitialSettings} from './settings.ts';
import {BindingId,BindingVersion,InputKey,InputId,ExperienceId,IntentId,InputGroupId,ReplyId} from './ids.ts';
import { AutonomyRulesVersion,RoleId, OperationId, RunId, AttemptId, HandoverId, BackupManifestDigest, HomeRevision, CoreVersion, InputSettingsVersion, ConversationVersion,ReadRulesVersion,RetryRulesVersion,ProposalRulesVersion,FileRulesVersion,FileAccessVersion, ContextGeneration } from './ids.ts';
import { admitConversationFact, conversationDefaults, emptyConversation, validateConversationSettings, type ConversationState, type ConversationSnapshot, type ExecutionRecordRead,type ExecutionRecordPage, type ConversationFact, type BeginTurn, type TurnRecord, type ReserveAttempt, type AttemptRecord, type AttemptOutcome, type FinishTurn, type TurnReceipt, type ReplyRead, type ReplyPage, type NativeRecord, type ConversationSettings,type ToolObservation,type ToolMaterial } from './turns.ts';
import {previewSourceCleanup,admitCleanupCommand,cleanupQQHistory,applyLogicalCleanup,type CleanupCommand,type CleanupSelection,type CleanupPreview,type CleanupProgress,type CleanupAdmission} from './cleanup.ts';
import {admitStoragePointer,readStorageGeneration,prepareStorageGeneration,purgeStorageGeneration,discardStorageGeneration,storageGenerationId,type StorageGenerationPointer,type StorageGenerationCheckpoint} from './storage-generation.ts';
import {HOME_CURRENT_FORMAT,HOME_UPGRADE_TARGET,HOME_FORMATS,formatLayout,sameFormat,formatText,knownFormat,admitRootFormat,admitHeadFormat,type HomeFormat,type FormatStatus,type HomeLayout} from './format.ts';
import {admitFormatUpgradeRequest,admitFormatUpgradeProgress,saveFormatUpgradeTask,loadFormatUpgradeTask,interruptedFormatUpgrade,isFormatUpgradeTerminal,formatUpgradePhaseRank,FORMAT_UPGRADE_JOURNAL_DIRECTORY,type FormatUpgradeProgress,type FormatUpgradePreview,type FormatUpgradeJournalIO,type FormatUpgradePhase} from './format-upgrade.ts';
export {HOME_CURRENT_FORMAT,HOME_UPGRADE_TARGET,HOME_FORMATS,type HomeFormat,type FormatStatus,type HomeLayout} from './format.ts';
export type {FormatUpgradeProgress,FormatUpgradePreview,FormatUpgradePhase,FormatUpgradeView} from './format-upgrade.ts';
export type {CleanupCommand,CleanupSelection,CleanupPreview,CleanupEffect,CleanupProgress,CleanupAdmission,CleanupWaiting,SourceCleanupMarker} from './cleanup.ts';
export type * from './turns.ts';
export * from './ids.ts';
export {validateConversationSettings} from './turns.ts';
import { parseProjectionJSON } from './projections.ts';
import type { ProjectionId, ProjectionPreview, ProjectionCommand, ProjectionProgress, HomeDiagnostic, DiagnosticRoleHome, PreservedProjection } from './projections.ts';
export type { ProjectionId, ProjectionPreview, ProjectionCommand, ProjectionProgress, HomeDiagnostic, DiagnosticRoleHome, PreservedProjection } from './projections.ts';
import { constants } from 'node:fs';
import { open, mkdir, lstat, realpath, readdir, readFile, link, unlink, rename } from 'node:fs/promises';
import { join, resolve, dirname, basename } from 'node:path';
import { hostname } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { panelBindingFor,runnableInput, type BoundInput, type InputRecord, type InputAcceptedReceipt, type PanelBinding } from './inputs.ts';
export type { BoundInput, InputReceipt, InputAcceptedReceipt, InputRecord, PanelBinding } from './inputs.ts';
export interface CreateHomeRequest {
    readonly operationId: OperationId;
    readonly core: string;
    readonly settings: InitialSettings;
}
export type OwnerEditCommand = {
    readonly kind: 'edit-core';
    readonly operationId: OperationId;
    readonly text: string;
    readonly expectedCoreVersion: CoreVersion;
    readonly expectedRevision: HomeRevision;
} | {
    readonly kind: 'edit-settings';
    readonly operationId: OperationId;
    readonly settings: InitialSettings;
    readonly expectedSettingsVersion: InputSettingsVersion;
    readonly expectedRevision: HomeRevision;
};
export type HomeCommand = CleanupCommand | RollbackKnowledge | {readonly kind:'edit-autonomy-rules';readonly operationId:OperationId;readonly value:AutonomyRulesValue;readonly expectedAutonomyRulesVersion:AutonomyRulesVersion;readonly expectedRevision:HomeRevision;readonly clock?:ClockReading;readonly schedule?:AutonomySchedule;} | {readonly kind:'review-autonomy-clock';readonly operationId:OperationId;readonly clock?:ClockReading;readonly expectedRevision:HomeRevision;} | {readonly kind:'set-autonomy-pause';readonly operationId:OperationId;readonly paused:boolean;readonly at:string;readonly expectedRevision?:HomeRevision;} | {readonly kind:'edit-proposal-rules';readonly operationId:OperationId;readonly value:ProposalRulesValue;readonly expectedProposalRulesVersion:ProposalRulesVersion;readonly expectedRevision:HomeRevision;} | EditFileAccess | {readonly kind:'edit-file-rules';readonly operationId:OperationId;readonly value:FileRulesValue;readonly expectedFileRulesVersion:FileRulesVersion;readonly expectedRevision:HomeRevision;} | ResolveDelivery | EditDeliveryRules | {readonly kind:'edit-web-rules';readonly operationId:OperationId;readonly value:WebRulesValue;readonly expectedWebRulesVersion:WebRulesVersion;readonly expectedRevision:HomeRevision;} | OwnerEditCommand | ProjectionCommand | BindQQCommand | {readonly kind:'edit-retry-rules';readonly operationId:OperationId;readonly value:RetryRulesValue;readonly expectedRetryRulesVersion:RetryRulesVersion;readonly expectedRevision:HomeRevision;} | {readonly kind:'edit-read-rules';readonly operationId:OperationId;readonly value:ReadRulesValue;readonly expectedReadRulesVersion:ReadRulesVersion;readonly expectedRevision:HomeRevision;} | {readonly kind:'edit-contact-rules';readonly operationId:OperationId;readonly value:ContactRulesValue;readonly expectedContactRulesVersion:ContactRulesVersion;readonly expectedRevision:HomeRevision;} | { readonly kind: 'edit-conversation'; readonly operationId: OperationId; readonly value: ConversationSettings; readonly expectedConversationVersion: ConversationVersion; readonly expectedRevision: HomeRevision; } | {
    readonly kind: 'create';
    readonly operationId: OperationId;
    readonly core: string;
    readonly settings: InitialSettings;
} | {
    readonly kind: 'attach-home';
    readonly operationId: OperationId;
    readonly roleId: RoleId;
} | {
    readonly kind: 'register-home';
    readonly operationId: OperationId;
    readonly targetOperationId: OperationId;
};
export interface HomeReceipt {
    readonly operationId: OperationId;
    readonly kind: 'committed';
    readonly roleId: RoleId;
    readonly committedRevision: HomeRevision;
    readonly stage: 'created-unregistered' | 'applied';
    readonly projection: 'current' | 'diff' | 'lag';
    readonly projectionOperation?: ProjectionProgress;
}
export interface HomeOperation {
    readonly stop?:StopProgress;
    readonly operationId: OperationId;
    readonly kind: 'not-found' | 'committed' | 'uncertain' | 'unavailable';
    readonly reason?: string;
    readonly roleId?: RoleId;
    readonly committedRevision?: HomeRevision;
    readonly stage?: 'created-unregistered' | 'applied' | 'commit-uncertain';
    readonly projectionOperation?: ProjectionProgress;
    readonly inputReceipt?: InputAcceptedReceipt;
}
export interface HomeSnapshot {
    readonly roleId: RoleId;
    readonly revision: HomeRevision;
    readonly core: {
        readonly text: string;
        readonly version: CoreVersion;
    };
    readonly settings: {
        readonly value: InitialSettings;
        readonly version: InputSettingsVersion;
    };
    readonly contextGeneration: ContextGeneration;
    readonly creationOperationId: OperationId;
    readonly projection: 'current' | 'diff' | 'lag';
    readonly panelBinding: PanelBinding;
    readonly qqBinding?:QQBinding;
    readonly inputs: readonly InputRecord[];
    readonly uncertainOperationId?: OperationId;
}
/** Fault seam at the Host filesystem boundary. Production omits it. */
export interface HomeIO {
    barrier?(stage: string, detail: {
        readonly operationId: OperationId;
        readonly revision: HomeRevision;
    }): Promise<void>;
}
export interface OpenedRoleHome {
    /** Read-only activation denial; this never grants an execution scope. */
    readActivationDiagnostic?():Promise<HomeDiagnostic|undefined>;
    readonly fileLayout?:HomeFileLayout;
    initializeFileAreas(areas:readonly ('works'|'journal')[]):Promise<void>;
    /** Effective layout/format facts for the owner panel; never a path or execution grant. */
    formatStatus():FormatStatus;
    previewFormatUpgrade():Promise<FormatUpgradePreview>;
    requestFormatUpgrade(request:unknown):Promise<FormatUpgradeProgress>;
    readFormatUpgrade(operationId:OperationId):Promise<FormatUpgradeProgress|{readonly operationId:OperationId;readonly phase:'not-found'}>;
    /** The single non-terminal task, if one exists; used to carry a durable seal into a new process. */
    pendingFormatUpgrade():Promise<FormatUpgradeProgress|undefined>;
    continueFormatUpgrade(operationId:OperationId):Promise<FormatUpgradeProgress>;
    resumeFormatUpgrade(request:unknown):Promise<FormatUpgradeProgress>;
    readonly backups?:HomeBackupMaintenance;
    readonly roleId: RoleId;
    readonly revision: HomeRevision;
    readonly admission: {readonly autonomyClock:{readonly clock?:ClockReading;readonly clockBlocked?:string};readonly autonomyRulesVersion:AutonomyRulesVersion;readonly contextGeneration:ContextGeneration;readonly settingsVersion:ConversationVersion;readonly readRulesVersion:ReadRulesVersion;readonly retryRulesVersion:RetryRulesVersion;readonly fileRulesVersion:FileRulesVersion;readonly fileAccessVersion:FileAccessVersion;readonly webRulesVersion:WebRulesVersion;readonly contactRulesVersion:ContactRulesVersion;readonly pendingOwnerChange:boolean};
    readSnapshot(): Promise<Readonly<HomeSnapshot>>;
    previewCleanup(selection:CleanupSelection):Promise<CleanupPreview>;
    readCleanup(operationId:OperationId):Promise<CleanupProgress|{readonly operationId:OperationId;readonly phase:'not-found'}>;
    continueCleanup(operationId:OperationId):Promise<CleanupProgress>;
    prepareCleanup(command:CleanupCommand):Promise<CleanupAdmission>;
    cleanupSnapshots():readonly CleanupProgress[];
    openContextReader(request:ContextReaderRequest):Promise<ContextSnapshotReader>;
    readCurrentToolSource(request:CurrentToolSourceRequest):Promise<CurrentToolSource>;
    operationSnapshot(operationId:OperationId):HomeOperation;
    restoreAcceptanceSnapshot():RestoreAcceptance|undefined;
    /** Local provenance metadata can only tighten Host protection, never grant a path. */
    readRestoreSource():Promise<RestoreRequest|undefined>;
    confirmRestore(request:RestoreConfirmation):Promise<RestoreAcceptance>;
    reconcileOperation(operationId:OperationId):Promise<HomeOperation>;
    reconcileHandover(request:{operationId:OperationId;handoverOperationId:OperationId;priorNativeFlush:'unknown'|'source-checkpoint'}):Promise<HomeReceipt>;
    handoverSnapshots():readonly HandoverRecord[];
    requestHandover(request:HandoverReservation,seal?:()=>void):Promise<HomeReceipt>;
    readyHandover(request:{operationId:OperationId;handoverOperationId:OperationId}):Promise<HomeReceipt>;
    stopSnapshots():readonly StopRecord[];
    reconcileStop(request:{operationId:OperationId;stopOperationId:OperationId}):Promise<HomeReceipt>;
    requestStop(request:{operationId:OperationId;reason:StopReason}):Promise<HomeReceipt>;
    checkpointStop(request:{operationId:OperationId;stopOperationId:OperationId}):Promise<HomeReceipt>;
    previewProjection(projectionId: ProjectionId): Promise<ProjectionPreview>;
    applyProjection(command: ProjectionCommand): Promise<HomeReceipt>;
    readDiagnostic(): Promise<HomeDiagnostic>;
    readPreservedProjection(operationId: OperationId): Promise<PreservedProjection>;
    applyOwner(command: HomeCommand): Promise<HomeReceipt>;
    acceptInput(input: BoundInput): Promise<InputAcceptedReceipt>;
    readOperation(operationId: OperationId): Promise<HomeOperation>;
    readConversation(): Promise<ConversationSnapshot>;
    readAutonomy():Promise<AutonomySnapshot>;
    readAutonomyAttribution(request:{readonly runId?:RunId}):Promise<readonly import('./autonomy.ts').AutonomyAttributionRun[]>;
    checkAutonomyClock(request:{operationId:OperationId;clock:ClockReading}):Promise<void>;
    requestWake(request:{operationId:OperationId;reason:string;stamp:AutonomousStamp}):Promise<{kind:'accepted';opportunity:WakeOpportunity;dispatchOpportunity:boolean}|{kind:'skipped';reason:string}>;
    suspendAutonomous(request:{operationId:OperationId;runId:RunId;reason:string}):Promise<void>;
    readAutonomySchedule():Promise<AutonomySchedule|null>;
    rescheduleAutonomyFuture(request:{operationId:OperationId;nextOpportunityAt:string}):Promise<AutonomySchedule>;
    armAutonomySchedule(request:{operationId:OperationId;schedule:AutonomySchedule}):Promise<AutonomySchedule>;
    advanceAutonomySchedule(request:{operationId:OperationId;slotAt:string;dispatchedSlot:boolean;nextOpportunityAt:string;missedSlots:number}):Promise<AutonomySchedule>;
    setAutonomyPause(request:{operationId:OperationId;paused:boolean;at:string;expectedRevision?:HomeRevision}):Promise<void>;
    beginAutonomous(request:{operationId:OperationId;runId:RunId;expectedRevision:HomeRevision;now:string;stamp?:AutonomousStamp}):Promise<TurnRecord>;
    readKnowledge():Promise<KnowledgeSnapshot>;
    readProposalRules():Promise<ProposalRulesSnapshot>;
    saveProposal(request:{operationId:OperationId;attemptId:AttemptId;value:KnowledgeProposal;now:string}):Promise<ProposalRecord>;
    processProposal(request:{operationId:OperationId;proposalId:ProposalId;assessment:ProposalAssessment;now?:string}):Promise<ProposalRecord>;
    readFileAccess():Promise<FileAccessSnapshot>;
    readFileRules():Promise<FileRulesSnapshot>;
    readQQHistory():Promise<QQHistorySnapshot>;
    beginQQHistory(request:BeginQQHistory):Promise<QQHistoryQuery>;
    beginQQHistorySelection(request:SelectQQHistory&{readonly now:string}):Promise<QQHistorySelection>;
    recordQQHistorySelection(request:{operationId:OperationId;selectionOperationId:OperationId;candidateId:QQHistoryCandidateId;receipt:Exclude<import('./inputs.ts').InputReceipt,{kind:'uncertain'}>}):Promise<void>;
    finishQQHistorySelection(request:{operationId:OperationId;selectionOperationId:OperationId}):Promise<void>;
    reserveQQHistoryPage(request:{operationId:OperationId;queryId:QQHistoryQueryId;page:QQHistoryPageRequest}):Promise<void>;
    enterQQHistoryPage(request:{operationId:OperationId;queryId:QQHistoryQueryId;requestId:QQHistoryRequestId;now:string}):Promise<void>;
    observeQQHistoryPage(request:{operationId:OperationId;queryId:QQHistoryQueryId;requestId:QQHistoryRequestId;outcome:QQHistoryObservation}):Promise<void>;
    finishQQHistory(request:{operationId:OperationId;queryId:QQHistoryQueryId;reason:string}):Promise<void>;
    readDeliveryRules():Promise<DeliveryRulesSnapshot>;
    beginDelivery(request:BeginDelivery):Promise<SendAttemptRecord>;
    settleDelivery(request:{operationId:OperationId;sendAttemptId:SendAttemptId;observation:DeliveryObservation}):Promise<void>;
    readReadRules():Promise<ReadRulesSnapshot>;
    readContactRules():Promise<ContactRulesSnapshot>;
    readRetryRules():Promise<RetryRulesSnapshot>;
    readWebRules():Promise<WebRulesSnapshot>;
    reserveWebTool(request:ReserveWebTool):Promise<{readonly tool:AttemptRecord;readonly web:AttemptRecord}>;
    beginTurn(request: BeginTurn): Promise<TurnRecord>;
    refreshTurnContext(request:{operationId:OperationId;runId:RunId;previousGeneration:ContextGeneration;nextGeneration:ContextGeneration}):Promise<void>;
    reserveAttempt(request: ReserveAttempt): Promise<AttemptRecord>;
    enterAttempt(request: {operationId:OperationId;attemptId:AttemptId;now:string}): Promise<void>;
    recordAttempt(request: {operationId:OperationId;attemptId:AttemptId;outcome:AttemptOutcome}): Promise<void>;
    observeAttempt(request:{operationId:OperationId;attemptId:AttemptId;observation:ToolObservation}):Promise<void>;
    captureMaterial(request:{operationId:OperationId;material:ToolMaterial}):Promise<void>;
    recordNative(request: {operationId:OperationId;record:NativeRecord}): Promise<void>;
    finishTurn(request: FinishTurn): Promise<TurnReceipt>;
    readExecutionRecord(request:ExecutionRecordRead):Promise<ExecutionRecordPage>;
    readReply(request: ReplyRead): Promise<ReplyPage>;
    close(): Promise<void>;
}
type Json = null | boolean | string | number | Json[] | {
    [key: string]: Json;
};
export function canonicalBytes(value: unknown): Buffer {
    const seen = new Set<object>();
    const visit = (item: unknown): string => {
        if (item === null)
            return 'null';
        if (typeof item === 'string') {
            if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(item))
                throw new HomeError('INVALID_VALUE');
            return JSON.stringify(item);
        }
        if (typeof item === 'boolean')
            return String(item);
        if (typeof item === 'number') {
            if (!Number.isSafeInteger(item))
                throw new HomeError('INVALID_VALUE');
            return String(Object.is(item, -0) ? 0 : item);
        }
        if (typeof item !== 'object' || !item || seen.has(item))
            throw new HomeError('INVALID_VALUE');
        seen.add(item);
        let result: string;
        if (Array.isArray(item)) {
            if (Reflect.ownKeys(item).length !== item.length + 1 || Object.keys(item).length !== item.length)
                throw new HomeError('INVALID_VALUE');
            result = '[' + item.map(visit).join(',') + ']';
        }
        else {
            if (Object.getPrototypeOf(item) !== Object.prototype || Reflect.ownKeys(item).length !== Object.keys(item).length)
                throw new HomeError('INVALID_VALUE');
            result = '{' + Object.keys(item).sort().map(key => { const d = Object.getOwnPropertyDescriptor(item, key)!; if (!('value' in d))
                throw new HomeError('INVALID_VALUE'); return visit(key) + ':' + visit(d.value); }).join(',') + '}';
        }
        seen.delete(item);
        return result;
    };
    return Buffer.from(visit(value) + '\n', 'utf8');
}
function managedJSON(value:unknown):string {
    const seen=new Set<object>();const visit=(v:unknown):void=>{if(v===null||typeof v==='string'||typeof v==='boolean')return;if(typeof v==='number'){if(!Number.isFinite(v))fail('INVALID_MANAGED_JSON');return;}if(typeof v!=='object'||!v||seen.has(v))throw new HomeError('INVALID_MANAGED_JSON');seen.add(v);if(Array.isArray(v)){if(Object.keys(v).length!==v.length)fail('INVALID_MANAGED_JSON');for(const item of v)visit(item);}else{if(Object.getPrototypeOf(v)!==Object.prototype)fail('INVALID_MANAGED_JSON');for(const key of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,key)!;if(!('value' in d))fail('INVALID_MANAGED_JSON');if(d.value!==undefined)visit(d.value);}}seen.delete(v);};visit(value);return JSON.stringify(value);
}
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const fingerprint = (value: unknown) => digest(canonicalBytes(value));
const fail: (code: string) => never = (code) => { throw new HomeError(code); };
function exact(value: unknown, keys: string[]): asserts value is Record<string, Json> { if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join('|') !== keys.sort().join('|'))
    fail('CORRUPT_HOME'); }
function op(value: unknown): OperationId { try { return OperationId(value); } catch { return fail('INVALID_OPERATION_ID'); } }
function settings(value: unknown): asserts value is InitialSettings { if (!validateInputSettings(value)) fail('INVALID_SETTINGS'); }
function text(value: string) { if (typeof value !== 'string' || !value.length || Buffer.byteLength(value) > 1048576)
    fail('INVALID_CORE'); canonicalBytes(value); }
function inputBusiness(input: BoundInput, roleId: RoleId,qqBinding?:QQBinding,history:QQHistoryState=emptyQQHistory()) {
    const binding = input.channel==='qq' ? qqBinding&&{bindingId:qqBinding.bindingId,bindingVersion:qqBinding.version} : panelBindingFor(roleId);
    if (!binding||input.bindingId !== binding.bindingId || input.bindingVersion !== binding.bindingVersion)
        fail('INPUT_NOT_BOUND');
    op(input.operationId);InputKey(input.externalKey);
    if(input.channel==='qq'){
        let source;try{source=admitQQInputSource(input.qqSource);}catch{return fail('INVALID_INPUT');}
        if(!qqBinding)return fail('INPUT_NOT_BOUND');
        if(source.connectionId!==qqBinding.connectionId||source.accountId!==qqBinding.accountId||source.peerId!==qqBinding.peerId)fail('INPUT_NOT_BOUND');
        if(input.externalKey!==qqInputIdentity(qqBinding,source).externalKey)fail('INVALID_INPUT');
    }else if(input.qqSource!==undefined)fail('INVALID_INPUT');
    if (typeof input.text !== 'string' || !input.text.length || Buffer.byteLength(input.text, 'utf8') > 1048576 || !['live','history'].includes(input.origin) || (input.channel==='qq'?input.sourceEvidence!==(input.origin==='history'?'explicitly-selected-onebot-history':'verified-onebot-friend-text'):input.channel!==undefined||input.sourceEvidence!=='authenticated-owner-panel') || typeof input.receivedAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.receivedAt) || !Number.isFinite(Date.parse(input.receivedAt)))
        fail('INVALID_INPUT');
    if(input.origin==='history')validateHistoryInput(input,history);else if(input.historySource!==undefined)fail('INVALID_INPUT');
    if(Object.hasOwn(input,'contextPurpose')&&(input.contextPurpose!=='history'||input.channel==='qq'))fail('INVALID_INPUT');
    const business = { kind: 'accept-input', bindingId: input.bindingId, bindingVersion: input.bindingVersion, externalKey: input.externalKey, text: input.text, origin: input.origin, sourceEvidence: input.sourceEvidence,...(input.contextPurpose?{contextPurpose:input.contextPurpose}:{}),...(input.origin==='history'?{historySource:input.historySource}:{}),...(input.channel==='qq'?{channel:'qq',qqSource:input.qqSource}:{}) };
    canonicalBytes(business);
    return business;
}
const inputKey = (input: BoundInput) => fingerprint({ bindingId: input.bindingId, bindingVersion: input.bindingVersion, externalKey: input.externalKey });
async function syncDir(path: string) { const fd = await open(path, 'r'); try {
    await fd.sync();
}
finally {
    await fd.close();
} }
async function directory(path: string) { const s = await lstat(path); if (!s.isDirectory() || s.isSymbolicLink())
    fail('UNSAFE_PATH'); }
async function safeBytes(path: string, recover = false, validateAliases = false): Promise<Buffer> {
    let s = await lstat(path);
    if (!s.isFile() || s.isSymbolicLink() || s.size > 8388608)
        fail('UNSAFE_FILE');
    if (s.nlink > 1) {
        if (!recover && !validateAliases)
            fail('UNSAFE_FILE');
        const aliases: string[] = [];
        for (const name of await readdir(dirname(path))) {
            if (!new RegExp('^\\.' + basename(path).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.[0-9a-f-]{36}\\.pending$').test(name))
                continue;
            const alias = join(dirname(path), name);
            const a = await lstat(alias);
            if (a.isFile() && a.ino === s.ino && a.dev === s.dev)
                aliases.push(alias);
        }
        if (aliases.length !== s.nlink - 1)
            fail('UNSAFE_FILE');
        if (recover) {
            for (const alias of aliases)
                await unlink(alias);
            s = await lstat(path);
            if (s.nlink !== 1)
                fail('UNSAFE_FILE');
            await syncDir(dirname(path));
        }
    }
    const fd = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        const current = await fd.stat();
        if (!current.isFile() || current.ino !== s.ino || current.dev !== s.dev || current.size > 8388608)
            fail('UNSAFE_FILE');
        return await fd.readFile();
    }
    finally {
        await fd.close();
    }
}
async function jsonFile(path: string, recover = false, validateAliases = false): Promise<Record<string, Json>> { const bytes = await safeBytes(path, recover, validateAliases); let value: unknown; try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
catch {
    fail('CORRUPT_HOME');
} if (!canonicalBytes(value).equals(bytes))
    fail('CORRUPT_HOME'); return value as Record<string, Json>; }
async function publish(path: string, bytes: Buffer, afterLink?: () => Promise<void>) {
    const temp = join(dirname(path), '.' + basename(path) + '.' + randomUUID() + '.pending');
    const fd = await open(temp, 'wx', 0o600);
    try {
        await fd.writeFile(bytes);
        await fd.sync();
    }
    finally {
        await fd.close();
    }
    try {
        await link(temp, path);
        await afterLink?.();
    }
    finally {
        await unlink(temp).catch(() => { });
    }
    await syncDir(dirname(path));
}
async function canonicalPath(path: string) { if (!path || !path.startsWith('/'))
    fail('ABSOLUTE_PATH_REQUIRED'); const p = resolve(path); if (p === resolve('/'))
    fail('UNSAFE_PATH'); return join(await realpath(dirname(p)), basename(p)); }
type Identity = {
    format: HomeFormat;
    roleId: RoleId;
    creationOperationId: OperationId;
    creationFingerprint: string;
};
type Commit = {
    digest: string;
    roleId: RoleId;
    revision: HomeRevision;
    prev: string | null;
    kind: string;
    operationId: OperationId;
    fingerprint: string;
    data: Record<string, Json>;
};
type HeadFloor = { roleId:RoleId;revision:HomeRevision;commitDigest:string|null;digest:string;storage?:StorageGenerationPointer;format?:HomeFormat };
/**
 * A root-inline head keeps the frozen 1.0 bytes. A generation head declares the content format it
 * holds beside its pointer: a physical cleanup rewrites at the same format, an upgrade raises it.
 */
function headBytes(roleId:RoleId,revision:HomeRevision,commitDigest:string|null,storage?:StorageGenerationPointer,format:HomeFormat=HOME_CURRENT_FORMAT) {
    const body={roleId,revision,commitDigest,...(storage?{storage,format:{major:format.major,minor:format.minor}}:{})};return canonicalBytes({...body,digest:fingerprint(body)});
}
async function readHead(path:string,roleId:RoleId):Promise<HeadFloor> {
    let value:Record<string,Json>;
    try { value=await jsonFile(join(path,'head.json')); } catch { return fail('CORRUPT_HEAD'); }
    const optional=['storage','format'].filter(key=>Object.hasOwn(value,key));
    exact(value,['roleId','revision','commitDigest','digest',...optional]);const {digest:claimed,...body}=value;
    if(value.roleId!==roleId||!Number.isSafeInteger(value.revision)||Number(value.revision)<0||claimed!==fingerprint(body)||(value.revision===0?value.commitDigest!==null:typeof value.commitDigest!=='string'||! /^[a-f0-9]{64}$/.test(value.commitDigest)))return fail('CORRUPT_HEAD');
    // A declaration without a pointer (or a pointer without one) cannot name one authority layout.
    if(Object.hasOwn(value,'format')!==Object.hasOwn(value,'storage'))return fail('CORRUPT_HEAD');
    return {roleId:RoleId(value.roleId),revision:HomeRevision(value.revision),commitDigest:value.commitDigest === null ? null : String(value.commitDigest),digest:String(value.digest),...(Object.hasOwn(value,'storage')?{storage:admitStoragePointer(value.storage),format:admitHeadFormat(value.format)}:{})};
}
async function initializeHead(path:string,roleId:RoleId) {
    try { await lstat(join(path,'head.json')); return; } catch(error) { if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error; }
    if((await readdir(join(path,'commits'))).some(name=>!name.startsWith('.')))return fail('CORRUPT_HEAD');
    await publish(join(path,'head.json'),headBytes(roleId,HomeRevision(0),null));
}
type Lock = {
    host: string;
    pid: number;
    token: string;
    path: string;
};
const alive = (pid: number) => { try {
    process.kill(pid, 0);
    return true;
}
catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH')
        return false;
    return true;
} };
async function acquire(path: string, io: HomeIO = {},fileName='writer.lock') {
    const file = join(path, fileName);
    const own: Lock = { host: hostname(), pid: process.pid, token: randomUUID(), path };
    const bytes = canonicalBytes(own);
    for (let retry = 0; retry < 3; retry++) {
        try {
            await publish(file, bytes, async () => io.barrier?.(fileName==='writer.lock'?'after-lock-publish':'after-maintenance-lock-publish', { operationId: OperationId('writer-lock'), revision: HomeRevision(0) }));
            return async () => { const current = await safeBytes(file); if (!current.equals(bytes))
                fail('LOCK_LOST'); await unlink(file); await syncDir(path); };
        }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
                throw error;
        }
        let before!: Buffer;
        let previous!: Record<string, Json>;
        try {
            before = await safeBytes(file, false, true);
            previous = await jsonFile(file, false, true);
            exact(previous, ['host', 'pid', 'token', 'path']);
        }
        catch {
            fail('WRITER_UNCERTAIN');
        }
        if (previous.host !== hostname() || previous.path !== path || !Number.isSafeInteger(previous.pid) || Number(previous.pid) < 1 || typeof previous.token !== 'string' || alive(Number(previous.pid)))
            fail('HOME_BUSY');
        const claim = join(path, '.takeover-' + digest(before!));
        let fd!: Awaited<ReturnType<typeof open>>;
        try {
            fd = await open(claim, 'wx', 0o600);
        }
        catch {
            fail('HOME_BUSY');
        }
        try {
            await fd.writeFile(bytes);
            await fd.sync();
            if (!(await safeBytes(file, false, true)).equals(before!) || alive(Number(previous.pid)))
                fail('HOME_BUSY');
            await safeBytes(file, true);
            await unlink(file);
            await syncDir(path);
        }
        finally {
            await fd.close();
            await unlink(claim);
            await syncDir(path);
        }
    }
    return fail('HOME_BUSY');
}
class DiskHome implements OpenedRoleHome {
    get fileLayout():HomeFileLayout{return Object.freeze({root:this.path,protectedRelativePaths:protectedHomeEntries,ordinaryRelativeRoots:ordinaryHomeRoots,temporaryRootNamePrefixes:temporaryHomeRootPrefixes});}
    /** The effective layout is declared by head.json; the root identity stays frozen at creation. */
    private format:HomeFormat=HOME_CURRENT_FORMAT;
    formatStatus():FormatStatus{return {roleId:this.identity.roleId,identity:this.identity.format,format:this.format,layout:formatLayout(this.format),...(this.storage?{generation:this.storage}:{}),upgrade:{to:HOME_UPGRADE_TARGET,available:sameFormat(this.format,HOME_CURRENT_FORMAT),reason:sameFormat(this.format,HOME_CURRENT_FORMAT)?'UPGRADE_AVAILABLE':'CURRENT_FORMAT'}};}
    private pendingOwnerChanges=0;
    get admission(){return {autonomyClock:{clock:this.conversation.autonomy.clock,clockBlocked:this.conversation.autonomy.clockBlocked},autonomyRulesVersion:this.conversation.autonomy.rules.version,contextGeneration:this.snapshot.contextGeneration,settingsVersion:this.conversation.rules.version,readRulesVersion:this.conversation.readRules.version,retryRulesVersion:this.conversation.retryRules.version,fileRulesVersion:this.conversation.fileRules.version,fileAccessVersion:this.conversation.fileAccess.version,webRulesVersion:this.conversation.webRules.version,contactRulesVersion:this.conversation.contactRules.version,pendingOwnerChange:this.pendingOwnerChanges>0||this.cleanupTasks.some(task=>task.phase!=='complete')};}
    previewCleanup(selection:CleanupSelection){return this.run(async()=>previewSourceCleanup(this.snapshot,this.conversation,selection,this.qqHistory,this.storage,await this.retainedGenerationIds()));}
    /** Authority generations on disk that are not the current pointer; the upgrade leaves the old one. */
    private async retainedGenerationIds():Promise<readonly string[]>{
        try{await directory(join(this.path,'content-generations'));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return [];throw error;}
        return (await readdir(join(this.path,'content-generations'))).filter(name=>/^generation-[a-f0-9]{64}$/.test(name)).sort();
    }
    async readCleanup(operationId:OperationId){if(this.closed)fail('HOME_CLOSED');op(operationId);return structuredClone(this.cleanupTasks.find(task=>task.operationId===operationId)??{operationId,phase:'not-found' as const});}
    private cleanupTasks:CleanupProgress[]=[];
    private storage:StorageGenerationPointer|undefined;
    private replayRequests=new Map<OperationId,string>();
    private get storagePath(){return this.storage?join(this.path,'content-generations',this.storage.id):this.path;}
    syncStorage(){return syncDir(join(this.storagePath,'commits'));}
    cleanupSnapshots(){if(this.closed)fail('HOME_CLOSED');return structuredClone(this.cleanupTasks);}
    prepareCleanup(command:CleanupCommand):Promise<CleanupAdmission>{return this.run(async()=>{
        await this.assertWritable();const request=admitCleanupCommand(command),preview=previewSourceCleanup(this.snapshot,this.conversation,request.selection,this.qqHistory,this.storage,await this.retainedGenerationIds());
        if(this.cleanupTasks.some(task=>task.phase!=='complete'))fail('CLEANUP_MAINTENANCE_PENDING');if(request.expectedRevision!==this.revision)fail('REVISION_CONFLICT');if(request.previewDigest!==preview.digest)fail('CLEANUP_PREVIEW_CHANGED');
        const snapshot=structuredClone(this.snapshot),closingHistory=new Set(this.qqHistory.queries.filter(query=>query.phase==='running').map(query=>query.queryId));let active=true;this.pendingOwnerChanges++;
        const release=()=>{if(active){active=false;this.pendingOwnerChanges--;}};
        return Object.freeze({request:structuredClone(request),preview:structuredClone(preview),release,commit:()=>this.run(async()=>{
            if(!active)fail('CLEANUP_ADMISSION_REVOKED');if(this.snapshot.contextGeneration!==snapshot.contextGeneration||this.snapshot.inputs.length!==snapshot.inputs.length||this.snapshot.inputs.some((input,index)=>input.inputId!==snapshot.inputs[index]!.inputId||input.text!==snapshot.inputs[index]!.text))fail('CLEANUP_PREVIEW_CHANGED');
            const allowed=new Set(preview.quiescingRuns),closingSends=new Set(preview.effects.filter(effect=>effect.kind==='send-attempt').map(effect=>effect.id)),kinds=new Set(['reserve-attempt','reserve-web-tool','enter-attempt','record-attempt','observe-tool','capture-material','native-record','save-proposal','process-proposal','finish-turn','refresh-turn-context','settle-delivery','qq-history']);
            for(const commit of this.commits.filter(commit=>commit.revision>preview.revision)){
                if(!kinds.has(commit.kind))fail('CLEANUP_PREVIEW_CHANGED');const fact=JSON.parse(await this.managedText(commit.data.payload));
                if(commit.kind==='settle-delivery'&&closingSends.has(fact.sendAttemptId))continue;
                if(commit.kind==='qq-history'&&closingHistory.has(fact.queryId)&&['observe','finish'].includes(fact.action))continue;
                const run=fact.runId??fact.attempt?.runId??fact.tool?.runId??fact.record?.runId??fact.proposal?.runId??this.conversation.attempts.find(attempt=>attempt.attemptId===(fact.attemptId??fact.material?.attemptId))?.runId??this.conversation.knowledge.proposals.find(proposal=>proposal.proposalId===fact.proposalId)?.runId;
                if(!allowed.has(run))fail('CLEANUP_PREVIEW_CHANGED');
            }
            return this.commitCleanupRequest(request,preview);
        }).finally(release)});
    });}
    private async commitCleanupRequest(request:CleanupCommand,approved?:CleanupPreview):Promise<HomeReceipt>{
        const business={kind:request.kind,selection:request.selection},fp=fingerprint(business);
        if(this.uncertain){if(this.uncertain!==request.operationId)fail('IO_UNCERTAIN');await this.load();await this.syncStorage();await this.syncHead(request.operationId);this.uncertain=null;}
        const old=this.commits.find(commit=>commit.operationId===request.operationId);if(old){if(old.kind!==request.kind||![fp,fingerprint({...business,previewDigest:request.previewDigest})].includes(old.fingerprint))fail('OPERATION_CONFLICT');return this.receipt(old);}
        if(this.cleanupTasks.some(task=>task.phase!=='complete'))fail('CLEANUP_MAINTENANCE_PENDING');if(!approved&&request.expectedRevision!==this.revision)fail('REVISION_CONFLICT');const preview=previewSourceCleanup(this.snapshot,this.conversation,request.selection,this.qqHistory,this.storage,await this.retainedGenerationIds());if(!approved&&preview.digest!==request.previewDigest)fail('CLEANUP_PREVIEW_CHANGED');
        applyLogicalCleanup(this.snapshot.inputs,this.conversation,preview,request.operationId,HomeRevision(this.revision+1));
        const task:CleanupProgress={operationId:request.operationId,phase:'logical-complete',logicalRevision:HomeRevision(this.revision+1),request,...(approved&&approved.digest!==preview.digest?{requestedPreview:approved}:{}),preview,physical:{complete:false}};
        return this.append(request.kind,request.operationId,fp,{payload:await this.putManaged(task)});
    }
    private async retainedGenerationFiles(){
        const refs=new Set<string>(),include=async(ref:Json|undefined):Promise<void>=>{if(typeof ref!=='string'||! /^[a-f0-9]{64}$/.test(ref)||refs.has(ref))return;const value=await this.blob(ref);refs.add(ref);if(Array.isArray(value.chunks))for(const child of value.chunks)await include(child);};
        const controls=new Set(['create','edit-core','edit-settings','bind-qq','import-projection','rebuild-projection','edit-conversation','edit-read-rules','edit-retry-rules','edit-file-rules','edit-file-access','edit-web-rules','edit-delivery-rules','edit-proposal-rules','edit-autonomy-rules']);
        for(const commit of this.commits){if(controls.has(commit.kind))for(const ref of Object.values(commit.data))if(typeof ref==='string'&&/^[a-f0-9]{64}$/.test(ref))await include(ref);if(commit.kind==='accept-input'&&!this.snapshot.inputs.find(input=>input.inputId===commit.data.inputId)?.cleanup)await include(commit.data.content);}
        const files:{path:string;bytes:Buffer}[]=[];for(const ref of refs)files.push({path:'blobs/'+ref+'.json',bytes:await safeBytes(join(this.storagePath,'blobs',ref+'.json'))});
        for(const area of ['views','projection-progress'])try{await directory(join(this.storagePath,area));for(const name of await readdir(join(this.storagePath,area)))if(!name.startsWith('.'))files.push({path:area+'/'+name,bytes:await safeBytes(join(this.storagePath,area,name))});}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
        return files;
    }
    // ---------------------------------------------------------------- format upgrade
    /** The journal is Home-owned maintenance state; it is not a business commit and it never rewrites content. */
    private formatUpgradeJournal():FormatUpgradeJournalIO{
        const directoryPath=join(this.path,FORMAT_UPGRADE_JOURNAL_DIRECTORY);
        return {
            read:async(name:string)=>{try{return await jsonFile(join(directoryPath,name));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return undefined;throw error;}},
            write:async(name:string,record:unknown)=>{
                try{await mkdir(directoryPath,{mode:0o700});await syncDir(this.path);}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
                await directory(directoryPath);
                // A journal is rewritten as it advances: replace it atomically instead of publishing once.
                const target=join(directoryPath,name),temp=join(directoryPath,'.'+name+'.'+randomUUID()+'.pending'),bytes=canonicalBytes(record);
                const fd=await open(temp,'wx',0o600);try{await fd.writeFile(bytes);await fd.sync();}finally{await fd.close();}
                try{await rename(temp,target);}finally{await unlink(temp).catch(()=>{});}
                await syncDir(directoryPath);
            },
        };
    }
    private formatUpgradeTask(operationId:OperationId):Promise<FormatUpgradeProgress|undefined>{return loadFormatUpgradeTask(this.formatUpgradeJournal(),this.roleId,operationId);}
    /** Operations this exact Home instance is driving; a journal from anyone else is `interrupted`. */
    private readonly runningFormatUpgrades=new Set<OperationId>();
    private saveFormatUpgrade(progress:FormatUpgradeProgress):Promise<FormatUpgradeProgress>{return saveFormatUpgradeTask(this.formatUpgradeJournal(),this.roleId,progress);}
    /**
     * Quiescence records published by a restarted lifetime do not change user content. They may sit
     * between the backup revision and the current revision without making the backup stale.
     */
    private static readonly quiescenceKinds=new Set(['request-stop','checkpoint-stop','reconcile-stop','request-handover','reconcile-handover','ready-handover']);
    /**
     * A backup is the upgrade precondition: it must be verified and its revision must still describe
     * this Home's user content. Later quiescence commits are metadata; any other commit is drift.
     */
    private async formatUpgradeBackup():Promise<{satisfied:boolean;operationId?:OperationId;sourceRevision?:HomeRevision}>{
        if(!this.backups)return {satisfied:false};
        const current=this.revision,headDigest=digest(await safeBytes(join(this.path,'head.json'))),records=await this.backups.list();
        const chosen=records.filter(record=>record.phase==='verified-restorable'&&record.sourceRevision!==undefined&&record.sourceHeadDigest&&record.sourceRevision<=current)
            // Everything after the copied revision must be quiescence metadata; no user content moved.
            .filter(record=>this.commits.filter(commit=>commit.revision>record.sourceRevision!).every(commit=>DiskHome.quiescenceKinds.has(commit.kind)))
            // The recorded head digest may only be re-checked while the head file is still that revision.
            .filter(record=>record.sourceRevision!==current||record.sourceHeadDigest===headDigest)
            .sort((a,b)=>b.sourceRevision!-a.sourceRevision!)[0];
        return chosen?{satisfied:true,operationId:chosen.operationId,sourceRevision:chosen.sourceRevision!}:{satisfied:false};
    }
    private async formatUpgradeRefusal():Promise<string|undefined>{
        if(!sameFormat(this.format,HOME_CURRENT_FORMAT))return knownFormat(this.format)?'FORMAT_UPGRADE_NOT_REQUIRED':'FORMAT_UPGRADE_UNSUPPORTED';
        if(this.cleanupTasks.some(task=>task.phase!=='complete'))return 'CLEANUP_MAINTENANCE_PENDING';
        if(this.handovers.some(record=>record.readyRevision!==undefined&&record.readyRevision>=this.revision))return 'FORMAT_UPGRADE_HANDOVER_PENDING';
        if(this.conversation.turns.some(turn=>turn.status==='running')||this.conversation.attempts.some(attempt=>!attempt.outcome))return 'FORMAT_UPGRADE_WORK_NOT_QUIESCENT';
        return undefined;
    }
    previewFormatUpgrade():Promise<FormatUpgradePreview>{return this.run(async()=>{
        await this.assertWritable();
        const refusal=await this.formatUpgradeRefusal();if(refusal)fail(refusal);
        const backup=await this.formatUpgradeBackup(),retains:FormatUpgradePreview['retains'][number][]=[];
        for(const part of ['identity.json','head.json'] as const)retains.push({part,bytes:(await safeBytes(join(this.path,part))).length});
        for(const part of ['commits','blobs','views','projection-progress'] as const){
            let bytes=0;try{await directory(join(this.storagePath,part));for(const name of await readdir(join(this.storagePath,part)))if(!name.startsWith('.'))bytes+=(await lstat(join(this.storagePath,part,name))).size;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
            retains.push({part,bytes});
        }
        for(const part of ['works','journal'] as const){
            let bytes=0;try{await directory(join(this.path,part));for(const name of await readdir(join(this.path,part)))bytes+=(await lstat(join(this.path,part,name))).size;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
            retains.push({part,bytes});
        }
        try{retains.push({part:'.autonomy-schedule.json',bytes:(await lstat(this.schedulePath())).size});}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
        const pending=await this.pendingFormatUpgrade();
        return {roleId:this.roleId,revision:this.revision,from:this.format,to:HOME_UPGRADE_TARGET,backupOperationId:pending?.backupOperationId??OperationId('format-upgrade-backup-pending'),backup,retains,externalCopies:['QQ messages','DSH private storage','external files','independent backups']};
    });}
    /** A single non-terminal upgrade task may exist; anything else is a durable inconsistency. */
    async pendingFormatUpgrade():Promise<FormatUpgradeProgress|undefined>{
        const names=await this.formatUpgradeJournalNames(),tasks=(await Promise.all(names.map(name=>this.formatUpgradeJournal().read(name)))).filter((value):value is Record<string,unknown>=>!!value).map(value=>admitFormatUpgradeProgress(value,this.roleId));
        const running=tasks.filter(task=>!isFormatUpgradeTerminal(task.phase)).sort((a,b)=>formatUpgradePhaseRank(a.phase)-formatUpgradePhaseRank(b.phase));
        if(running.length>1)fail('FORMAT_UPGRADE_TASK_CONFLICT');
        return running.length?interruptedFormatUpgrade(running[0]!):undefined;
    }
    private async pendingFormatUpgradeOperation():Promise<OperationId>{
        const names=await this.formatUpgradeJournalNames(),tasks=(await Promise.all(names.map(name=>this.formatUpgradeJournal().read(name)))).filter((value):value is Record<string,unknown>=>!!value);
        const running=tasks.filter(value=>!isFormatUpgradeTerminal(String(value.phase) as FormatUpgradePhase));
        if(running.length>1)fail('FORMAT_UPGRADE_TASK_CONFLICT');
        return running.length?OperationId(running[0]!.operationId):OperationId('format-upgrade-none');
    }
    private async formatUpgradeJournalNames():Promise<string[]>{
        try{await directory(join(this.path,FORMAT_UPGRADE_JOURNAL_DIRECTORY));return (await readdir(join(this.path,FORMAT_UPGRADE_JOURNAL_DIRECTORY))).filter(name=>!name.startsWith('.')).sort();}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return [];throw error;}
    }
    readFormatUpgrade(operationId:OperationId):Promise<FormatUpgradeProgress|{readonly operationId:OperationId;readonly phase:'not-found'}>{
        return this.run(async()=>{op(operationId);if(this.closed)fail('HOME_CLOSED');
            const task=await this.formatUpgradeTask(operationId);
            // A process that is not running the task may only report the durable phase as interrupted.
            if(!task)return {operationId,phase:'not-found' as const};
            return structuredClone(this.runningFormatUpgrades.has(operationId)||isFormatUpgradeTerminal(task.phase)?task:interruptedFormatUpgrade(task));
        });
    }
    /** Owner-triggered upgrade: journal the request, then let the caller continue it as a task. */
    requestFormatUpgrade(raw:unknown):Promise<FormatUpgradeProgress>{return this.run(async()=>{
        const request=admitFormatUpgradeRequest(raw);await this.assertWritable();
        const prior=await this.formatUpgradeTask(request.operationId);
        if(prior){if(prior.expectedRevision!==request.expectedRevision)fail('OPERATION_CONFLICT');return structuredClone(prior);}
        const refusal=await this.formatUpgradeRefusal();if(refusal&&refusal!=='FORMAT_UPGRADE_BACKUP_REQUIRED')fail(refusal);
        if(request.expectedRevision!==this.revision)fail('REVISION_CONFLICT');
        const backup=await this.formatUpgradeBackup();
        const base:FormatUpgradeProgress={operationId:request.operationId,roleId:this.roleId,phase:'requested',checkpoint:'requested',from:this.format,to:HOME_UPGRADE_TARGET,backupOperationId:backup.operationId??OperationId('format-upgrade-backup-missing'),expectedRevision:request.expectedRevision,sourceRevision:this.revision,...(this.head?{sourceHeadDigest:this.head}:{}),copiedFiles:0,verifiedFiles:0};
        if(!backup.satisfied){await this.saveFormatUpgrade({...base,phase:'failed',error:'FORMAT_UPGRADE_BACKUP_REQUIRED'});fail('FORMAT_UPGRADE_BACKUP_REQUIRED');}
        return structuredClone(await this.saveFormatUpgrade(base));
    });}
    /** Continue the original operation: write the successor generation, validate, then switch once. */
    continueFormatUpgrade(operationId:OperationId):Promise<FormatUpgradeProgress>{return this.run(()=>this.executeFormatUpgrade(operationId));}
    resumeFormatUpgrade(raw:unknown):Promise<FormatUpgradeProgress>{return this.run(async()=>{
        const request=admitFormatUpgradeRequest(raw);await this.assertWritable();
        const prior=await this.formatUpgradeTask(request.operationId);
        if(!prior)fail('FORMAT_UPGRADE_NOT_FOUND');
        if(prior.phase==='switched')return structuredClone(prior);
        // Resuming keeps the original operation and its pinned target; only a different target is a new decision.
        if(prior.to.major!==HOME_UPGRADE_TARGET.major||prior.to.minor!==HOME_UPGRADE_TARGET.minor)fail('OPERATION_CONFLICT');
        return this.executeFormatUpgrade(request.operationId);
    });}
    private async executeFormatUpgrade(operationId:OperationId):Promise<FormatUpgradeProgress>{
        const loaded:FormatUpgradeProgress|undefined=await this.formatUpgradeTask(operationId);
        if(!loaded)fail('FORMAT_UPGRADE_NOT_FOUND');
        if(loaded.phase==='switched')return structuredClone(loaded);
        let current:FormatUpgradeProgress=loaded;
        // The durable head decides: a switch that already completed is finalized forward, never redone.
        if(!sameFormat(this.format,HOME_CURRENT_FORMAT)){
            if(current.generation&&this.storage?.id===current.generation.id)return structuredClone(await this.saveFormatUpgrade({...current,phase:'switched',checkpoint:'switched',interrupted:undefined,recovery:undefined,error:undefined}));
            fail('FORMAT_UPGRADE_GENERATION_CONFLICT');
        }
        let stage='preparing';
        this.runningFormatUpgrades.add(operationId);
        try{
            const backup=await this.formatUpgradeBackup();
            // The supervisor writes nothing to Home; a new process may legitimately publish its own
            // stop/start recovery commits. The pinned backup still covers identity and retained content.
            if(!backup.satisfied||backup.operationId!==current.backupOperationId)fail('FORMAT_UPGRADE_BACKUP_REQUIRED');
            const pinned=current.sourceRevision;
            if(pinned!==undefined&&this.revision!==pinned){
                const latest=(await this.backups?.list())?.find(record=>record.operationId===current.backupOperationId);
                if(!latest||latest.phase!=='verified-restorable'||latest.sourceRevision!==pinned)fail('FORMAT_UPGRADE_SOURCE_CHANGED');
            }
            current=await this.saveFormatUpgrade({...current,phase:'writing',checkpoint:'requested',sourceRevision:this.revision,...(this.head?{sourceHeadDigest:this.head}:{}),error:undefined});
            stage='writing';
            // The successor generation copies the complete authority; the previous generation stays intact.
            const replayRequests=new Map(this.replayRequests);
            const domain=JSON.parse(JSON.stringify({snapshot:this.snapshot,conversation:this.conversation,qqHistory:this.qqHistory,stops:this.stops,handovers:this.handovers,restoreAcceptances:this.restoreAcceptances,cleanupTasks:this.cleanupTasks,generatedHistory:this.generatedHistory.map(bytes=>bytes.toString('utf8'))}));
            const retained=await this.retainedGenerationFiles(),pointer=await prepareStorageGeneration(this.path,{roleId:this.roleId,baseRevision:this.revision,baseCommitDigest:this.head!,domain,commits:this.commits,replayRequests:[...replayRequests].map(([id,fp])=>({operationId:id,fingerprint:fp})),cleanupOperationId:operationId,purpose:'format-upgrade'},retained,this.io);
            current=await this.saveFormatUpgrade({...current,phase:'validating',checkpoint:'generation-written',generation:pointer,copiedFiles:retained.length+this.commits.length,verifiedFiles:0});
            stage='validating';
            const {identityDigest,recordDigest,manifestDigest,verifiedFiles}=await this.validateFormatUpgrade(pointer,retained);
            current=await this.saveFormatUpgrade({...current,phase:'validating',checkpoint:'validated',identityDigest,recordDigest,manifestDigest,verifiedFiles});
            // One atomic switch: head.json now names the successor generation. Nothing is double-written.
            await this.io.barrier?.('before-format-head-publish',{operationId,revision:this.revision});
            this.storage=pointer;this.format=HOME_UPGRADE_TARGET;
            try{await this.syncHead(operationId);await this.io.barrier?.('after-format-head-sync',{operationId,revision:this.revision});await this.load();}
            catch{this.uncertain=operationId;await this.saveFormatUpgrade({...current,phase:'uncertain',error:'IO_UNCERTAIN'});throw new HomeError('IO_UNCERTAIN','IO_UNCERTAIN',operationId);}
            return structuredClone(await this.saveFormatUpgrade({...current,phase:'switched',checkpoint:'switched',generation:pointer}));
        }catch(error){
            const rawCode=error instanceof HomeError?error.code:error instanceof Error&&'code'in error&&typeof (error as NodeJS.ErrnoException).code==='string'?(error as NodeJS.ErrnoException).code!:undefined;
            const code=rawCode&&/^[A-Z][A-Z0-9_]{1,63}$/.test(rawCode)?rawCode:'FORMAT_UPGRADE_FAILED';
            if(code==='FORMAT_UPGRADE_BACKUP_REQUIRED'||code==='IO_UNCERTAIN')throw error;
            // A successor that never became authority is discarded so the same operation can be retried.
            if(this.storage?.id!==current.generation?.id&&current.generation){try{await discardStorageGeneration(this.path,current.generation,operationId,this.io);}catch{/* A foreign or unowned file keeps the directory for inspection. */}}
            try{await this.saveFormatUpgrade({...current,phase:'failed',error:code,checkpoint:current.checkpoint,generation:undefined});}catch(failure){throw new HomeError(code,`FORMAT_UPGRADE_UNCERTAIN:${failure instanceof HomeError?failure.code:'UNKNOWN'}`,operationId);}
            throw new HomeError(code,code,operationId);
        }finally{this.runningFormatUpgrades.delete(operationId);}
    }
    /**
     * The successor is replayed as an independent authority: identity, commit graph and blob bodies
     * are recomputed, then every retained state is compared with the live Home before any switch.
     */
    private async validateFormatUpgrade(pointer:StorageGenerationPointer,retainedInput?:readonly {path:string;bytes:Buffer}[]):Promise<{identityDigest:string;recordDigest:string;manifestDigest:string;verifiedFiles:number}>{
        const identity=await identityAt(this.path,false,true);
        if(!sameFormat(identity.format,HOME_CURRENT_FORMAT))fail('FORMAT_UPGRADE_IDENTITY_MISMATCH');
        const checkpoint=await readStorageGeneration(this.path,pointer);
        if(checkpoint.roleId!==this.roleId||checkpoint.purpose!=='format-upgrade'||checkpoint.baseRevision!==this.revision||checkpoint.baseCommitDigest!==this.head)fail('FORMAT_UPGRADE_RECORD_MISMATCH');
        // The owner record names the role and the operation that produced the generation; check it too.
        // It is written by the generator (encoded JSON, not canonical bytes), so it is parsed directly.
        let owner:Record<string,Json>;try{owner=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await safeBytes(join(this.path,'content-generations',pointer.id,'owner.json'))));}catch{return fail('FORMAT_UPGRADE_IDENTITY_MISMATCH');}
        exact(owner,['format','operationId','roleId','id','baseRevision','sourceHeadDigest']);
        if(owner.format!=='role-cleanup-generation-owner-1'||owner.roleId!==this.roleId||owner.operationId!==checkpoint.cleanupOperationId||owner.id!==pointer.id||owner.baseRevision!==pointer.baseRevision||owner.sourceHeadDigest!==pointer.baseCommitDigest)fail('FORMAT_UPGRADE_IDENTITY_MISMATCH');
        // A whole independent replay re-checks the chain, each commit fingerprint and every blob body.
        const probe=new DiskHome(this.path,identity,async()=>{},{},false);
        await probe.load({roleId:this.roleId,revision:HomeRevision(checkpoint.baseRevision),commitDigest:checkpoint.baseCommitDigest,digest:'',storage:pointer,format:HOME_UPGRADE_TARGET});
        const domain=checkpoint.domain as {snapshot?:HomeSnapshot;conversation?:ConversationState;stops?:StopRecord[];handovers?:HandoverRecord[];restoreAcceptances?:RestoreAcceptance[];cleanupTasks?:CleanupProgress[];qqHistory?:QQHistoryState}|undefined;
        const live=JSON.stringify({snapshot:this.snapshot,conversation:this.conversation,qqHistory:this.qqHistory,stops:this.stops,handovers:this.handovers,restoreAcceptances:this.restoreAcceptances,cleanupTasks:this.cleanupTasks});
        const copied=JSON.stringify({snapshot:probe.snapshot,conversation:probe.conversation,qqHistory:probe.qqHistory,stops:probe.stops,handovers:probe.handovers,restoreAcceptances:probe.restoreAcceptances,cleanupTasks:probe.cleanupTasks});
        if(live!==copied||!domain?.snapshot)fail('FORMAT_UPGRADE_MANIFEST_MISMATCH');
        // Name the retained state families a cross-generation copy must never drop.
        const retainedStates:{readonly name:string;readonly same:boolean}[]=[
            {name:'contact-rules',same:JSON.stringify(probe.conversation.contactRules)===JSON.stringify(this.conversation.contactRules)},
            {name:'contact-intents',same:JSON.stringify(probe.conversation.contact)===JSON.stringify(this.conversation.contact)},
            {name:'inputs',same:JSON.stringify(probe.snapshot.inputs)===JSON.stringify(this.snapshot.inputs)},
            {name:'stops',same:JSON.stringify(probe.stops)===JSON.stringify(this.stops)},
            {name:'handovers',same:JSON.stringify(probe.handovers)===JSON.stringify(this.handovers)},
            {name:'restore-acceptances',same:JSON.stringify(probe.restoreAcceptances)===JSON.stringify(this.restoreAcceptances)},
            {name:'cleanup-tasks',same:JSON.stringify(probe.cleanupTasks)===JSON.stringify(this.cleanupTasks)},
            {name:'knowledge',same:JSON.stringify(probe.conversation.knowledge)===JSON.stringify(this.conversation.knowledge)},
            {name:'autonomy',same:JSON.stringify(probe.conversation.autonomy)===JSON.stringify(this.conversation.autonomy)},
            {name:'rules',same:JSON.stringify({read:probe.conversation.readRules,retry:probe.conversation.retryRules,file:probe.conversation.fileRules,fileAccess:probe.conversation.fileAccess,web:probe.conversation.webRules,proposal:probe.conversation.proposalRules,delivery:probe.conversation.deliveryRules,rules:probe.conversation.rules})===JSON.stringify({read:this.conversation.readRules,retry:this.conversation.retryRules,file:this.conversation.fileRules,fileAccess:this.conversation.fileAccess,web:this.conversation.webRules,proposal:this.conversation.proposalRules,delivery:this.conversation.deliveryRules,rules:this.conversation.rules})},
        ];
        if(retainedStates.some(state=>!state.same))fail('FORMAT_UPGRADE_MANIFEST_MISMATCH');
        if(fingerprint(probe.commits)!==fingerprint(this.commits)||probe.commits.length!==this.commits.length||probe.head!==this.head)fail('FORMAT_UPGRADE_RECORD_MISMATCH');
        // Every retained relation must resolve inside the successor generation.
        const turns=new Set(probe.conversation.turns.map(turn=>turn.runId));
        if(probe.conversation.replies.some(reply=>!turns.has(reply.runId))||probe.conversation.attempts.some(attempt=>!turns.has(attempt.runId))||probe.conversation.nativeRecords.some(record=>!turns.has(record.runId)))fail('FORMAT_UPGRADE_RELATION_MISMATCH');
        const replyIds=new Set(probe.conversation.replies.map(reply=>reply.replyId));
        // A contact delivery is bound to its intent; a user reply delivery is bound to its reply.
        if(probe.conversation.deliveries.some(delivery=>delivery.source==='contact'?delivery.contactIntentId===undefined:delivery.replyId===undefined||!replyIds.has(delivery.replyId)))fail('FORMAT_UPGRADE_RELATION_MISMATCH');
        const deliveryIds=new Set(probe.conversation.deliveries.map(delivery=>delivery.deliveryId));
        if(probe.conversation.sendAttempts.some(attempt=>!deliveryIds.has(attempt.deliveryId)))fail('FORMAT_UPGRADE_RELATION_MISMATCH');
        const intentIds=new Set(probe.conversation.contact.intents.map(intent=>intent.intentId));
        if(probe.conversation.deliveries.some(delivery=>delivery.source==='contact'&&(delivery.contactIntentId===undefined||!intentIds.has(delivery.contactIntentId))))fail('FORMAT_UPGRADE_RELATION_MISMATCH');
        if(probe.conversation.sendAttempts.some(attempt=>attempt.source==='contact'&&(!attempt.contact||!intentIds.has(attempt.contact.intentId))))fail('FORMAT_UPGRADE_RELATION_MISMATCH');
        const inputIds=new Set(probe.snapshot.inputs.map(input=>input.inputId));
        if(probe.conversation.turns.some(turn=>turn.inputIds.some(id=>!inputIds.has(id))))fail('FORMAT_UPGRADE_RELATION_MISMATCH');
        // Retained side content (views, projection progress, schedule) is byte-identical in the successor.
        const retained=retainedInput??await this.retainedGenerationFiles(),manifest: {path:string;digest:string;bytes:number}[]=[];
        for(const file of retained){
            const copy=await safeBytes(join(this.path,'content-generations',pointer.id,file.path));
            if(!copy.equals(file.bytes))fail('FORMAT_UPGRADE_MANIFEST_MISMATCH');
            manifest.push({path:file.path,digest:digest(copy),bytes:copy.length});
        }
        // Counts are durable, checkable totals: every replayed commit plus every copied side file.
        return {identityDigest:fingerprint({format:identity.format,roleId:identity.roleId,creationOperationId:identity.creationOperationId,creationFingerprint:identity.creationFingerprint}),recordDigest:fingerprint(probe.commits),manifestDigest:fingerprint(manifest),verifiedFiles:probe.commits.length+manifest.length};
    }
    continueCleanup(operationId:OperationId):Promise<CleanupProgress>{return this.run(async()=>{
        op(operationId);await this.assertWritable();
        if(this.uncertain){const completionOperationId=OperationId('cleanup-complete-'+fingerprint(operationId));if(this.uncertain!==operationId&&this.uncertain!==completionOperationId)fail('IO_UNCERTAIN');await this.load();await this.syncStorage();await this.syncHead(this.uncertain);this.uncertain=null;}
        let task=this.cleanupTasks.find(task=>task.operationId===operationId);if(!task)fail('CLEANUP_NOT_FOUND');if(task!.phase==='complete')return structuredClone(task!);
        if(this.conversation.turns.some(turn=>turn.status==='running')||this.conversation.attempts.some(attempt=>!attempt.outcome)||this.conversation.deliveries.some(delivery=>delivery.status==='sending'))fail('CLEANUP_WORK_NOT_QUIESCENT');
        let checkpoint=this.storage?await readStorageGeneration(this.path,this.storage):undefined;
        if(!checkpoint||checkpoint.cleanupOperationId!==operationId){
            const id=storageGenerationId(operationId,this.head!),cleanupTasks=this.cleanupTasks.map(previous=>previous.operationId===operationId?{...previous,phase:'purging' as const,storageGeneration:id,physical:{complete:false,purgedFiles:0}}:previous);
            const replayRequests=new Map(this.replayRequests);
            for(const commit of this.commits)if(commit.kind==='finish-turn'&&commit.revision>(this.storage?.baseRevision??0)){const fact=JSON.parse(await this.managedText(commit.data.payload));replayRequests.set(commit.operationId,fingerprint({kind:'finish-turn',runId:fact.runId,outcome:JSON.stringify(fact.outcome)}));}
            const domain=JSON.parse(JSON.stringify({snapshot:this.snapshot,conversation:this.conversation,qqHistory:this.qqHistory,stops:this.stops,handovers:this.handovers,restoreAcceptances:this.restoreAcceptances,cleanupTasks,generatedHistory:this.generatedHistory.map(bytes=>bytes.toString('utf8'))}));
            const pointer=await prepareStorageGeneration(this.path,{roleId:this.roleId,baseRevision:this.revision,baseCommitDigest:this.head!,domain,commits:this.commits,replayRequests:[...replayRequests].map(([operationId,fingerprint])=>({operationId,fingerprint})),cleanupOperationId:operationId},await this.retainedGenerationFiles(),this.io);
            await this.io.barrier?.('before-cleanup-head-publish',{operationId,revision:this.revision});this.storage=pointer;
            try{await this.syncHead(operationId);await this.io.barrier?.('after-cleanup-head-sync',{operationId,revision:this.revision});await this.load();}catch{this.uncertain=operationId;throw new HomeError('IO_UNCERTAIN','IO_UNCERTAIN',operationId);}
            checkpoint=await readStorageGeneration(this.path,pointer);task=this.cleanupTasks.find(task=>task.operationId===operationId)!;
        }
        const purgedFiles=await purgeStorageGeneration(this.path,checkpoint,this.io,(purgedFiles,totalFiles)=>{this.cleanupTasks=this.cleanupTasks.map(task=>task.operationId===operationId?{...task,phase:'purging',physical:{complete:false,purgedFiles,totalFiles}}:task);});
        const business={kind:'complete-cleanup',cleanupOperationId:operationId,storageGeneration:this.storage!.id,purgedFiles};await this.append(business.kind,OperationId('cleanup-complete-'+fingerprint(operationId)),fingerprint(business),{cleanupOperationId:operationId,storageGeneration:this.storage!.id,purgedFiles});
        return structuredClone(this.cleanupTasks.find(task=>task.operationId===operationId)!);
    });}
    private stops:StopRecord[]=[];
    private handovers:HandoverRecord[]=[];
    private restoreAcceptances:RestoreAcceptance[]=[];
    private restoredMaintenance:readonly BackupMaintenanceSnapshot[]=[];
    private conversation: ConversationState = emptyConversation();
    private scheduleAnchor:AutonomySchedule|undefined;
    private qqHistory:QQHistoryState=emptyQQHistory();
    private generatedHistory: Buffer[] = [];
    private commits: Commit[] = [];
    private head: string | null = null;
    private snapshot!: HomeSnapshot;
    private serial: Promise<unknown> = Promise.resolve();
    private closed = false;
    private fault: HomeDiagnostic | undefined;
    private uncertain: OperationId | null = null;
    constructor(private path: string, private identity: Identity, private release: () => Promise<void>, private io: HomeIO, private recoverAliases = true,readonly backups?:HomeBackupMaintenance) { }
    get roleId() { return this.identity.roleId; }
    get revision() { return this.snapshot?.revision ?? HomeRevision(0); }
    private run<T>(fn: () => Promise<T>): Promise<T> { const task = this.serial.then(() => { if (this.closed)
        fail('HOME_CLOSED'); return fn(); }); this.serial = task.catch(() => { }); return task; }
    /** A probe may supply the floor it is validating instead of reading the live head. */
    async load(probe?:HeadFloor) {
        const floor=probe??await readHead(this.path,this.roleId);this.storage=floor.storage;this.format=floor.format??HOME_CURRENT_FORMAT;
        if(!this.storage&&floor.format)fail('CORRUPT_HEAD');
        let base:StorageGenerationCheckpoint|undefined;
        if(this.storage){try{base=await readStorageGeneration(this.path,this.storage);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')fail('FORMAT_AUTHORITY_MISSING');throw error;}if(base.roleId!==this.roleId)fail('IDENTITY_CONFLICT');}
        for (const dir of ['commits', 'blobs', 'views'])
            await directory(join(this.storagePath, dir));
        const chainDigests:string[]=[];
        const names = (await readdir(join(this.storagePath, 'commits'))).filter(n => !n.startsWith('.')).sort();
        this.commits = [];
        this.generatedHistory = [];
        this.head = null;
        let core = { text: '', version: 0 };
        let rules = { value: { inputLimitBytes: 32768 }, version: 0 };
        let generation = 0;
        let qqBinding:QQBinding|undefined;
        const inputs: InputRecord[] = [];
        this.conversation = emptyConversation();
        this.qqHistory=emptyQQHistory();
        this.stops=[];this.handovers=[];this.restoreAcceptances=[];this.restoredMaintenance=[];
        this.cleanupTasks=[];
        this.replayRequests=new Map();
        let baseRevision=0;
        if(base){
            const domain=base.domain as {snapshot:HomeSnapshot;conversation:ConversationState;qqHistory:QQHistoryState;stops:StopRecord[];handovers?:HandoverRecord[];restoreAcceptances?:RestoreAcceptance[];cleanupTasks:CleanupProgress[];generatedHistory:string[]};
            if(!domain||!domain.snapshot||domain.snapshot.roleId!==this.roleId||domain.snapshot.creationOperationId!==this.identity.creationOperationId||domain.snapshot.revision!==base.baseRevision||!Array.isArray(base.commits)||base.commits.length!==base.baseRevision||!Array.isArray(domain.snapshot.inputs)||!Array.isArray(domain.conversation.turns)||!Array.isArray(domain.conversation.attempts)||!Array.isArray(domain.cleanupTasks)||!Array.isArray(domain.generatedHistory)||domain.generatedHistory.length!==base.baseRevision)fail('CORRUPT_STORAGE_GENERATION');
            for(const [index,raw]of base.commits.entries()){const c=raw as Commit;exact(c,['digest','roleId','revision','prev','kind','operationId','fingerprint','data']);const {digest:claimed,...body}=c;if(c.roleId!==this.roleId||c.revision!==index+1||c.prev!==this.head||claimed!==fingerprint(body)||! /^[a-f0-9]{64}$/.test(c.fingerprint)||this.commits.some(previous=>previous.operationId===c.operationId))fail('CORRUPT_STORAGE_GENERATION');this.commits.push(c);this.head=digest(canonicalBytes(c));chainDigests.push(this.head);}
            if(this.head!==base.baseCommitDigest||this.commits[0]?.operationId!==this.identity.creationOperationId||this.commits[0]?.fingerprint!==this.identity.creationFingerprint)fail('CORRUPT_STORAGE_GENERATION');
            baseRevision=base.baseRevision;core={...domain.snapshot.core};rules=structuredClone(domain.snapshot.settings);generation=domain.snapshot.contextGeneration;qqBinding=structuredClone(domain.snapshot.qqBinding);inputs.push(...structuredClone(domain.snapshot.inputs));this.conversation=structuredClone(domain.conversation);this.qqHistory=structuredClone(domain.qqHistory);this.stops=structuredClone(domain.stops);this.handovers=structuredClone(domain.handovers??[]);this.restoreAcceptances=structuredClone(domain.restoreAcceptances??[]);this.cleanupTasks=structuredClone(domain.cleanupTasks);this.generatedHistory=domain.generatedHistory.map(text=>Buffer.from(text,'utf8'));this.replayRequests=new Map(base.replayRequests.map(record=>[OperationId(record.operationId),record.fingerprint]));
        }
        for (const [tailIndex, name] of names.entries()) {
            const index=baseRevision+tailIndex;
            if (name !== String(index + 1).padStart(12, '0') + '.json')
                fail('CORRUPT_CHAIN');
            const c = await jsonFile(join(this.storagePath, 'commits', name), this.recoverAliases, !this.recoverAliases);
            exact(c, ['digest', 'roleId', 'revision', 'prev', 'kind', 'operationId', 'fingerprint', 'data']);
            const { digest: claimed, ...body } = c;
            if (claimed !== fingerprint(body))
                fail('CORRUPT_COMMIT');
            if (index === 0 && c.kind !== 'create')
                fail('CORRUPT_CHAIN');
            if (c.roleId !== this.roleId || c.revision !== index + 1 || c.prev !== this.head || typeof c.operationId !== 'string' || typeof c.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(c.fingerprint))
                fail('CORRUPT_CHAIN');
            op(String(c.operationId));
            if (this.commits.some(x => x.operationId === c.operationId))
                fail('CORRUPT_CHAIN');
            const data = c.data as Record<string, Json>;
            if (c.kind === 'create') {
                if (index !== 0 || c.operationId !== this.identity.creationOperationId || c.fingerprint !== this.identity.creationFingerprint)
                    fail('CORRUPT_CHAIN');
                exact(data, ['core', 'settings']);
                core = { text: await this.blobText(data.core), version: 1 };
                rules = { value: await this.blobSettings(data.settings), version: 1 };
                generation = 1;
                if (c.fingerprint !== fingerprint({ kind: 'create', core: core.text, settings: rules.value }))
                    fail('CORRUPT_COMMIT');
            }
            else if (c.kind === 'edit-core') {
                exact(data, ['core', 'coreVersion']);
                if (data.coreVersion !== core.version + 1)
                    fail('CORRUPT_CHAIN');
                core = { text: await this.blobText(data.core), version: Number(data.coreVersion) };
                generation++;
                if (c.fingerprint !== fingerprint({ kind: 'edit-core', text: core.text }))
                    fail('CORRUPT_COMMIT');
            }
            else if (c.kind === 'edit-settings') {
                exact(data, ['settings', 'settingsVersion']);
                if (data.settingsVersion !== rules.version + 1)
                    fail('CORRUPT_CHAIN');
                rules = { value: await this.blobSettings(data.settings), version: Number(data.settingsVersion) };
                generation++;
                if (c.fingerprint !== fingerprint({ kind: 'edit-settings', settings: rules.value }))
                    fail('CORRUPT_COMMIT');
            }
            else if (c.kind === 'import-projection' || c.kind === 'rebuild-projection') {
                const imported = c.kind === 'import-projection';
                exact(data, imported ? ['projectionId', 'observedDigest', 'preserved', 'core', 'coreVersion', 'settings', 'settingsVersion', 'sourceRevision', 'sourceCoreVersion', 'sourceSettingsVersion', 'provenance'] : ['projectionId', 'observedDigest', 'preserved']);
                if (data.projectionId !== 'settings' || (data.observedDigest !== null && (typeof data.observedDigest !== 'string' || !/^[a-f0-9]{64}$/.test(data.observedDigest)))) fail('CORRUPT_COMMIT');
                const material = await this.material(data.preserved);
                if ((material === null ? null : digest(material)) !== data.observedDigest) fail('CORRUPT_CONTENT');
                if (c.fingerprint !== fingerprint({ kind: c.kind, projectionId: data.projectionId, observedDigest: data.observedDigest })) fail('CORRUPT_COMMIT');
                if (imported) {
                    if (!material) fail('CORRUPT_COMMIT');
                    const value = this.projectionValue(material!);
                    if (data.sourceRevision !== value.revision || data.sourceCoreVersion !== value.core.version || data.sourceSettingsVersion !== value.settings.version || data.provenance !== 'owner-import') fail('CORRUPT_COMMIT');
                    const coreChanged = value.core.text !== core.text;
                    const settingsChanged = value.settings.value.inputLimitBytes !== rules.value.inputLimitBytes;
                    if ((!coreChanged && !settingsChanged) || data.coreVersion !== core.version + Number(coreChanged) || data.settingsVersion !== rules.version + Number(settingsChanged)) fail('CORRUPT_CHAIN');
                    if (coreChanged) { const importedText = await this.blobText(data.core); if (importedText !== value.core.text) fail('CORRUPT_COMMIT'); core = { text: importedText, version: Number(data.coreVersion) }; }
                    else if (data.core !== null) fail('CORRUPT_COMMIT');
                    if (settingsChanged) { const importedSettings = await this.blobSettings(data.settings); if (importedSettings.inputLimitBytes !== value.settings.value.inputLimitBytes) fail('CORRUPT_COMMIT'); rules = { value: importedSettings, version: Number(data.settingsVersion) }; }
                    else if (data.settings !== null) fail('CORRUPT_COMMIT');
                    generation++;
                }
            }
            else if (c.kind === 'attach-home') {
                exact(data, ['roleId']);
                if (data.roleId !== this.roleId || c.fingerprint !== fingerprint({ kind: 'attach-home', roleId: this.roleId }))
                    fail('CORRUPT_COMMIT');
            }
            else if (c.kind === 'register-home') {
                exact(data, ['targetOperationId']);
                if (!this.commits.some(x => x.operationId === data.targetOperationId && (x.kind === 'create' || x.kind === 'attach-home')))
                    fail('CORRUPT_CHAIN');
                if (c.fingerprint !== fingerprint({ kind: 'register-home', targetOperationId: data.targetOperationId }))
                    fail('CORRUPT_COMMIT');
            }
            else if(c.kind==='bind-qq'){
                exact(data,['binding']);
                const candidate=await this.blob(data.binding);
                try{const next=admitQQBinding(candidate,this.roleId);if(next.version!==(qqBinding?.version??0)+1||next.activatedRevision!==c.revision)fail('CORRUPT_COMMIT');qqBinding=next;}catch{return fail('CORRUPT_COMMIT');}
                if(c.fingerprint!==fingerprint({kind:'bind-qq',connectionId:qqBinding.connectionId,accountId:qqBinding.accountId,peerId:qqBinding.peerId}))fail('CORRUPT_COMMIT');
                for(let i=0;i<inputs.length;i++)if(inputs[i]!.channel==='qq'&&inputs[i]!.status==='queued')inputs[i]={...inputs[i]!,status:'blocked',blockedReason:'binding-changed'};
                generation++;
            }
            else if(c.kind==='qq-history'){
                exact(data,['payload']);const fact:QQHistoryFact=JSON.parse(await this.managedText(data.payload));
                if(c.fingerprint!==fingerprint(qqHistoryBusiness(fact))||fact.action==='begin'&&fact.query.operationId!==c.operationId)fail('CORRUPT_COMMIT');
                this.qqHistory=applyQQHistoryFact(this.qqHistory,fact,{roleId:this.roleId,binding:qqBinding,inputs});
            }
            else if (c.kind === 'accept-input') {
                exact(data, ['bindingId', 'bindingVersion', 'inputId', 'experienceId', 'receiveSequence', 'keyHash', 'content', 'status']);
                const content = await this.blob(data.content);
                exact(content, ['externalKey', 'text', 'origin', 'receivedAt', 'sourceEvidence',...(Object.hasOwn(content,'contextPurpose')?['contextPurpose']:[]),...(content.origin==='history'?['historySource']:[]),...(Object.hasOwn(content,'channel')?['channel','qqSource']:[])]);if(Object.hasOwn(content,'channel')&&content.channel!=='qq'||Object.hasOwn(content,'contextPurpose')&&content.contextPurpose!=='history')fail('CORRUPT_COMMIT');
                const input:BoundInput = { operationId:op(c.operationId), bindingId:BindingId(data.bindingId), bindingVersion:BindingVersion(data.bindingVersion), externalKey:InputKey(content.externalKey), text:String(content.text), origin:content.origin as 'live'|'history',...(content.origin==='history'?{historySource:content.historySource as unknown as import('./qq-history.ts').QQHistorySource}:{}), receivedAt:String(content.receivedAt),sourceEvidence:String(content.sourceEvidence),...(content.contextPurpose==='history'?{contextPurpose:content.contextPurpose}:{}),...(content.channel==='qq'?{channel:'qq' as const,qqSource:admitQQInputSource(content.qqSource)}:{}) };
                if(!['live','history'].includes(String(content.origin)) || typeof content.text !== 'string' || typeof content.receivedAt !== 'string' || typeof content.sourceEvidence !== 'string') fail('CORRUPT_COMMIT');
                if (c.fingerprint !== fingerprint(inputBusiness(input, this.roleId,qqBinding,this.qqHistory)) || data.keyHash !== inputKey(input))
                    fail('CORRUPT_COMMIT');
                if (data.status !== 'queued' || data.receiveSequence !== inputs.length + 1 || typeof data.inputId !== 'string' || !/^input-[0-9a-f-]{36}$/.test(data.inputId) || typeof data.experienceId !== 'string' || !/^experience-[0-9a-f-]{36}$/.test(data.experienceId) || inputs.some(x => x.inputId === data.inputId || x.experienceId === data.experienceId || inputKey(x as BoundInput) === data.keyHash))
                    fail('CORRUPT_CHAIN');
                // Validate against the settings effective at this commit, never a later projection.
                if (Buffer.byteLength(input.text, 'utf8') > rules.value.inputLimitBytes)
                    fail('CORRUPT_COMMIT');
                inputs.push({ ...input, inputId: InputId(data.inputId), experienceId: ExperienceId(data.experienceId), committedRevision: HomeRevision(c.revision), receiveSequence: Number(data.receiveSequence), utf8Bytes: Buffer.byteLength(input.text, 'utf8'), status: 'queued', processingUnavailableReason:input.channel==='qq'?'qq-replies-unavailable':'execution-unavailable' });
            }
            else if(c.kind==='cleanup-sources'){
                exact(data,['payload']);const task=JSON.parse(await this.managedText(data.payload)) as CleanupProgress;
                if(task.operationId!==c.operationId||task.phase!=='logical-complete'||task.logicalRevision!==c.revision||task.preview.revision!==index||task.physical.complete!==false)fail('CORRUPT_CLEANUP');
                const previous={roleId:this.roleId,revision:HomeRevision(index),core:{...core,version:CoreVersion(core.version)},settings:{...rules,version:InputSettingsVersion(rules.version)},contextGeneration:ContextGeneration(generation),creationOperationId:this.identity.creationOperationId,projection:'current' as const,inputs,panelBinding:panelBindingFor(this.roleId),...(qqBinding?{qqBinding}:{})};
                const expected=previewSourceCleanup(previous,this.conversation,task.preview.selection,this.qqHistory,this.storage,await this.retainedGenerationIds());
                if(JSON.stringify(expected)!==JSON.stringify(task.preview)||![fingerprint({kind:'cleanup-sources',selection:task.preview.selection}),fingerprint({kind:'cleanup-sources',selection:task.preview.selection,previewDigest:task.preview.digest})].includes(String(c.fingerprint)))fail('CORRUPT_CLEANUP');
                this.qqHistory=cleanupQQHistory(this.qqHistory,inputs,task.preview,op(c.operationId),HomeRevision(c.revision));const changed=applyLogicalCleanup(inputs,this.conversation,task.preview,op(c.operationId),HomeRevision(c.revision));inputs.splice(0,inputs.length,...changed.inputs);this.conversation=changed.state;this.cleanupTasks.push(task);generation++;
            }
            else if(c.kind==='complete-cleanup'){
                exact(data,['cleanupOperationId','storageGeneration','purgedFiles']);const index=this.cleanupTasks.findIndex(task=>task.operationId===data.cleanupOperationId);if(index<0||typeof data.storageGeneration!=='string'||!Number.isSafeInteger(data.purgedFiles)||Number(data.purgedFiles)<0||c.fingerprint!==fingerprint({kind:'complete-cleanup',cleanupOperationId:data.cleanupOperationId,storageGeneration:data.storageGeneration,purgedFiles:data.purgedFiles}))fail('CORRUPT_CLEANUP');
                const task=this.cleanupTasks[index]!;this.cleanupTasks[index]={...task,phase:'complete',storageGeneration:String(data.storageGeneration),physical:{complete:true,purgedFiles:Number(data.purgedFiles),totalFiles:Number(data.purgedFiles)}};
            }
            else if(c.kind==='accept-restore'){
                exact(data,['restoreOperationId','handoverId','manifestDigest','sourceRevision','sourceStopOperationId','inputSequence','inheritedRunIds',...(Object.hasOwn(data,'maintenance')?['maintenance']:[])]);
                if(Object.hasOwn(data,'maintenance')){const incoming=restoredMaintenanceSnapshots(JSON.parse(await this.managedText(data.maintenance)),this.roleId),all=new Map(this.restoredMaintenance.map(snapshot=>[fingerprint(snapshot),snapshot]));for(const snapshot of incoming)all.set(fingerprint(snapshot),snapshot);this.restoredMaintenance=[...all.values()];}
                const inheritedRunIds=data.inheritedRunIds;if(!Array.isArray(inheritedRunIds)||!Number.isSafeInteger(data.inputSequence)||Number(data.inputSequence)<0)return fail('CORRUPT_COMMIT');
                const record:RestoreAcceptance={operationId:op(c.operationId),restoreOperationId:OperationId(data.restoreOperationId),handoverId:HandoverId(data.handoverId),manifestDigest:BackupManifestDigest(data.manifestDigest),sourceRevision:HomeRevision(data.sourceRevision),sourceStopOperationId:OperationId(data.sourceStopOperationId),inputSequence:Number(data.inputSequence),inheritedRunIds:inheritedRunIds.map(id=>RunId(id)),committedRevision:HomeRevision(c.revision)};
                const handover=this.handovers.find(item=>item.handoverId===record.handoverId);
                if(record.sourceRevision!==HomeRevision(HomeRevision(c.revision)-1)||record.inputSequence!==(inputs.at(-1)?.receiveSequence??0)||!handover?.readyRevision||handover.readyRevision>record.sourceRevision||handover.stopOperationId!==record.sourceStopOperationId||fingerprint(record.inheritedRunIds)!==fingerprint(this.conversation.turns.filter(turn=>turn.status==='running'||turn.status==='suspended').map(turn=>turn.runId))||c.fingerprint!==fingerprint({kind:'accept-restore',restoreOperationId:record.restoreOperationId,handoverId:record.handoverId,expectedManifestDigest:record.manifestDigest,currentSourceStoppedConfirmed:true}))fail('CORRUPT_COMMIT');
                this.restoreAcceptances.push(record);
            }
            else if(c.kind==='request-handover'){
                exact(data,['handoverId','backupOperationId','stopOperationId','destinationDigest']);
                const request=handoverReservation({operationId:c.operationId,...data,expectedRevision:HomeRevision(HomeRevision(c.revision)-1)});
                const {operationId,expectedRevision,...business}=request;
                if(this.handovers.some(record=>currentOutgoingHandover(record,this.restoreAcceptances.at(-1)?.committedRevision))||c.fingerprint!==fingerprint({kind:'request-handover',...business}))fail('CORRUPT_COMMIT');
                this.handovers.push({operationId,...business,requestedRevision:HomeRevision(c.revision)});
            }
            else if(c.kind==='reconcile-handover'){
                exact(data,['handoverOperationId','priorNativeFlush']);const index=this.handovers.findIndex(record=>record.operationId===data.handoverOperationId),record=this.handovers[index];
                if(!record||record.recovery||record.readyRevision!==undefined||!['unknown','source-checkpoint'].includes(String(data.priorNativeFlush))||data.priorNativeFlush==='source-checkpoint'&&!this.stops.some(stop=>stop.operationId===record.stopOperationId&&stop.checkpoint==='ready-to-close'&&stop.requestedRevision>record.requestedRevision)||c.fingerprint!==fingerprint({kind:'reconcile-handover',handoverOperationId:data.handoverOperationId,priorNativeFlush:data.priorNativeFlush}))fail('CORRUPT_COMMIT');
                this.handovers[index]={...record!,recovery:{revision:HomeRevision(c.revision),priorNativeFlush:data.priorNativeFlush==='source-checkpoint'?'source-checkpoint':'unknown'}};
            }
            else if(c.kind==='ready-handover'){
                exact(data,['handoverOperationId']);const index=this.handovers.findIndex(record=>record.operationId===data.handoverOperationId),record=this.handovers[index];
                if(!record||record.readyRevision!==undefined||!this.stops.some(stop=>stop.operationId===record.stopOperationId&&stop.checkpoint==='ready-to-close')||c.fingerprint!==fingerprint({kind:'ready-handover',handoverOperationId:data.handoverOperationId}))fail('CORRUPT_COMMIT');
                this.handovers[index]={...record!,readyRevision:HomeRevision(c.revision)};
            }
            else if(c.kind==='request-stop'){
                exact(data,['reason']);const reason=data.reason;if(!isStopReason(reason))return fail('CORRUPT_COMMIT');if(c.fingerprint!==fingerprint({kind:'request-stop',reason}))fail('CORRUPT_COMMIT');
                this.stops.push({operationId:op(c.operationId),reason,requestedRevision:HomeRevision(c.revision),checkpoint:'requested',checkpointRevision:HomeRevision(c.revision)});
            }
            else if(c.kind==='checkpoint-stop'){
                exact(data,['stopOperationId']);const index=this.stops.findIndex(stop=>stop.operationId===data.stopOperationId);if(index<0||this.stops[index]!.checkpoint!=='requested'||c.fingerprint!==fingerprint({kind:'checkpoint-stop',stopOperationId:data.stopOperationId}))fail('CORRUPT_COMMIT');
                this.stops[index]={...this.stops[index]!,checkpoint:'ready-to-close',checkpointRevision:HomeRevision(c.revision)};
            }
            else if(c.kind==='reconcile-stop'){
                exact(data,['stopOperationId']);const index=this.stops.findIndex(stop=>stop.operationId===data.stopOperationId);if(index<0||this.stops[index]!.reconciledRevision!==undefined||c.fingerprint!==fingerprint({kind:'reconcile-stop',stopOperationId:data.stopOperationId}))fail('CORRUPT_COMMIT');
                this.stops[index]={...this.stops[index]!,reconciledRevision:HomeRevision(c.revision)};
            }
            else if (['rollback-knowledge','coalesce-wake','suspend-autonomous','resume-autonomous','request-wake','begin-autonomous','edit-autonomy-rules','set-autonomy-pause','clock-blocked','clock-reviewed','edit-file-rules','edit-file-access','edit-proposal-rules','save-proposal','process-proposal','resolve-delivery','edit-web-rules','reserve-web-tool','begin-delivery','settle-delivery','edit-delivery-rules','begin-turn','reserve-attempt','enter-attempt','record-attempt','observe-tool','capture-material','finish-turn','refresh-turn-context','native-record','edit-conversation','edit-read-rules','edit-retry-rules','edit-contact-rules','contact-intent','settle-contact-intent','close-contact-intent'].includes(String(c.kind))) {
                exact(data, ['payload']);
                const encoded=await this.managedText(data.payload);
                let fact: ConversationFact; try { fact = JSON.parse(encoded); } catch { return fail('CORRUPT_COMMIT'); }
                if (fact.kind !== c.kind) fail('CORRUPT_COMMIT');
                if(fact.kind==='rollback-knowledge'&&(fact.version.ownerAction.operationId!==c.operationId||c.fingerprint!==fingerprint(rollbackKnowledgeBusiness({knowledgeId:fact.version.knowledgeId,targetVersion:fact.version.rollbackOf.version,reason:fact.version.ownerAction.reason}))))fail('CORRUPT_COMMIT');
                this.applyConversationFact(fact, inputs, ContextGeneration(generation), HomeRevision(c.revision),qqBinding);
                if(fact.kind==='rollback-knowledge'||fact.kind==='edit-file-access'||fact.kind==='edit-proposal-rules'||fact.kind==='process-proposal'&&fact.version&&fact.version.version>1)generation++;
            }
            else
                fail('UNKNOWN_FORMAT');
            this.generatedHistory.push(this.generated({ roleId: this.roleId, revision: HomeRevision(index + 1), core: {...core,version:CoreVersion(core.version)}, settings: {...rules,version:InputSettingsVersion(rules.version)}, contextGeneration: ContextGeneration(generation), creationOperationId: this.identity.creationOperationId, projection: 'current', inputs, panelBinding: panelBindingFor(this.roleId),...(qqBinding?{qqBinding}:{}) }));
            this.commits.push({digest:String(c.digest),roleId:RoleId(c.roleId),revision:HomeRevision(c.revision),prev:c.prev===null?null:String(c.prev),kind:String(c.kind),operationId:op(c.operationId),fingerprint:String(c.fingerprint),data});
            this.head = digest(await safeBytes(join(this.storagePath, 'commits', name), false, !this.recoverAliases));
            chainDigests.push(this.head);
        }
        if(floor.revision>this.commits.length||(floor.revision>0&&chainDigests[floor.revision-1]!==floor.commitDigest))fail('CORRUPT_HEAD');
        if (!this.commits.length)
            fail('INCOMPLETE_HOME');
        this.snapshot = { roleId: this.roleId, revision: HomeRevision(this.commits.length), core: {...core,version:CoreVersion(core.version)}, settings: {...rules,version:InputSettingsVersion(rules.version)}, contextGeneration: ContextGeneration(generation), creationOperationId: this.identity.creationOperationId, projection: 'lag', inputs, panelBinding: panelBindingFor(this.roleId),...(qqBinding?{qqBinding}:{}) };
        this.snapshot = { ...this.snapshot, projection: await this.projection(false) };
    }
    async syncHead(operationId=OperationId('reopen')) {
        const path=join(this.path,'head.json');const bytes=headBytes(this.roleId,HomeRevision(this.commits.length),this.head,this.storage,this.format);
        if(!(await safeBytes(path)).equals(bytes)) {
            const temp=join(this.path,'.head.'+randomUUID()+'.pending');const fd=await open(temp,'wx',0o600);
            try { await fd.writeFile(bytes);await fd.sync(); } finally { await fd.close(); }
            await rename(temp,path);await this.io.barrier?.('after-head-publish',{operationId,revision:HomeRevision(this.commits.length)});
        }
        await syncDir(this.path);await this.io.barrier?.('after-head-sync',{operationId,revision:HomeRevision(this.commits.length)});
    }
    private async blob(ref: Json | undefined) { if (typeof ref !== 'string' || !/^[a-f0-9]{64}$/.test(ref))
        fail('CORRUPT_HOME'); const path = join(this.storagePath, 'blobs', String(ref) + '.json'); let bytes: Buffer; try { bytes = await safeBytes(path, this.recoverAliases, !this.recoverAliases); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') fail('MISSING_CONTENT'); throw error; } if (digest(bytes!) !== ref)
        fail('CORRUPT_CONTENT'); return jsonFile(path, false, !this.recoverAliases); }
    private async blobText(ref: Json | undefined) { const b = await this.blob(ref); exact(b, ['text']); text(b.text as string); return String(b.text); }
    private async blobSettings(ref: Json | undefined) { const b = await this.blob(ref); settings(b as unknown as InitialSettings); return b as unknown as InitialSettings; }
    private async put(value: unknown) { const bytes = canonicalBytes(value);if(bytes.length>8388608)fail('CONTENT_RECORD_TOO_LARGE'); const hash = digest(bytes); const path = join(this.storagePath, 'blobs', hash + '.json'); try {
        await publish(path, bytes);
    }
    catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EEXIST')
            throw e;
        if (!(await safeBytes(path, true)).equals(bytes))
            fail('CORRUPT_CONTENT');
    } await syncDir(dirname(path)); return hash; }
    private async putMaterial(bytes: Buffer | null): Promise<string> {
        const chunks: string[] = [];
        if (bytes && bytes.length > 8388608) fail('PROJECTION_TOO_LARGE');
        if (bytes) for (let start = 0; start < bytes.length; start += 1048576) chunks.push(await this.put({ bytesBase64: bytes.subarray(start, start + 1048576).toString('base64') }));
        return this.put({ chunks, byteLength: bytes?.length ?? 0, absent: bytes === null, contentDigest: bytes === null ? null : digest(bytes) });
    }
    private async material(ref: Json | undefined): Promise<Buffer | null> {
        const body = await this.blob(ref); exact(body, ['chunks', 'byteLength', 'absent', 'contentDigest']);
        if (!Array.isArray(body.chunks) || body.chunks.length > 8 || !Number.isSafeInteger(body.byteLength) || Number(body.byteLength) < 0 || Number(body.byteLength) > 8388608 || typeof body.absent !== 'boolean') fail('CORRUPT_CONTENT');
        const chunks: Buffer[] = [];
        for (const ref of body.chunks as Json[]) {
            const chunk = await this.blob(ref); exact(chunk, ['bytesBase64']);
            if (typeof chunk.bytesBase64 !== 'string') fail('CORRUPT_CONTENT');
            const bytes = Buffer.from(chunk.bytesBase64 as string, 'base64');
            if (bytes.toString('base64') !== chunk.bytesBase64 || bytes.length > 1048576 || bytes.length === 0) fail('CORRUPT_CONTENT');
            chunks.push(bytes);
        }
        const bytes = Buffer.concat(chunks);
        if (bytes.length !== body.byteLength || (body.absent ? bytes.length !== 0 || body.contentDigest !== null : digest(bytes) !== body.contentDigest)) fail('CORRUPT_CONTENT');
        return body.absent ? null : bytes;
    }
    private projectionValue(bytes: Buffer): { revision: HomeRevision; core: { text: string; version: CoreVersion }; settings: { value: InitialSettings; version: InputSettingsVersion } } {
        if (bytes.length > 8388608) fail('PROJECTION_TOO_LARGE');
        let parsed: unknown;
        try { parsed = parseProjectionJSON(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { fail('INVALID_PROJECTION'); }
        exact(parsed, ['revision', 'core', 'settings']); exact(parsed.core, ['text', 'version']); exact(parsed.settings, ['value', 'version']);
        if (!Number.isSafeInteger(parsed.revision) || Number(parsed.revision) < 1 || Number(parsed.revision) > this.generatedHistory.length) fail('PROJECTION_METADATA_CHANGED');
        const original = JSON.parse(this.generatedHistory[Number(parsed.revision) - 1]!.toString('utf8'));
        if (parsed.core.version !== original.core.version || parsed.settings.version !== original.settings.version) fail('PROJECTION_METADATA_CHANGED');
        text(parsed.core.text as string); settings(parsed.settings.value);
        return {revision:HomeRevision(parsed.revision),core:{text:String(parsed.core.text),version:CoreVersion(parsed.core.version)},settings:{value:parsed.settings.value,version:InputSettingsVersion(parsed.settings.version)}};
    }
    private async putManaged(value:unknown,refs?:Set<string>){
        const put=async(content:unknown)=>{const ref=await this.put(content);refs?.add(ref);return ref;};
        const text=managedJSON(value),bytes=Buffer.from(text,'utf8');if(bytes.length>268435456)fail('CONTENT_RECORD_TOO_LARGE');if(bytes.length<=1048576)return put({encoding:'json',text});
        const chunks:string[]=[];for(let offset=0;offset<bytes.length;offset+=1048576)chunks.push(await put({base64:bytes.subarray(offset,offset+1048576).toString('base64')}));
        return put({encoding:'json-chunks',byteLength:bytes.length,contentDigest:digest(bytes),chunks});
    }
    private async managedText(ref:Json|undefined):Promise<string>{
        const root=await this.blob(ref);if(root.encoding==='json'){exact(root,['encoding','text']);if(typeof root.text!=='string')return fail('CORRUPT_CONTENT');return root.text;}
        exact(root,['encoding','byteLength','contentDigest','chunks']);if(root.encoding!=='json-chunks'||!Number.isSafeInteger(root.byteLength)||Number(root.byteLength)<1||Number(root.byteLength)>268435456||!Array.isArray(root.chunks)||root.chunks.length!==Math.ceil(Number(root.byteLength)/1048576)||typeof root.contentDigest!=='string')return fail('CORRUPT_CONTENT');
        const chunks:Buffer[]=[];for(const hash of root.chunks){const chunk=await this.blob(hash);exact(chunk,['base64']);if(typeof chunk.base64!=='string')return fail('CORRUPT_CONTENT');const bytes=Buffer.from(chunk.base64,'base64');if(bytes.length>1048576||bytes.toString('base64')!==chunk.base64)return fail('CORRUPT_CONTENT');chunks.push(bytes);}
        if(chunks.reduce((n,b)=>n+b.length,0)!==root.byteLength)return fail('CORRUPT_CONTENT');const bytes=Buffer.concat(chunks);if(digest(bytes)!==root.contentDigest)return fail('CORRUPT_CONTENT');try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return fail('CORRUPT_CONTENT');}
    }
    private generated(s: HomeSnapshot) { return canonicalBytes({ revision: s.revision, core: s.core, settings: s.settings }); }
    private async preview(projectionId: ProjectionId): Promise<ProjectionPreview> {
        if (projectionId !== 'settings') fail('UNSUPPORTED_PROJECTION');
        const expected = this.generated(this.snapshot);
        const base = { projectionId, roleId: this.roleId, revision: this.revision, coreVersion: this.snapshot.core.version, settingsVersion: this.snapshot.settings.version, expectedText: expected.toString('utf8'), expectedDigest: digest(expected) };
        let actual: Buffer;
        try { actual = await safeBytes(join(this.storagePath, 'views', 'settings.json')); }
        catch (error) { return { ...base, state: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'lag' : 'unavailable', actualText: null, actualDigest: null, importable: false, reason: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'PROJECTION_MISSING' : 'UNSAFE_PROJECTION', changes: [] }; }
        let actualText: string;
        try { actualText = new TextDecoder('utf-8', { fatal: true }).decode(actual); }
        catch { return { ...base, state: 'diff', actualText: null, actualDigest: digest(actual), importable: false, reason: 'INVALID_UTF8', changes: [] }; }
        const state = actual.equals(expected) ? 'current' : this.generatedHistory.some(bytes => actual.equals(bytes)) ? 'lag' : 'diff';
        let importable = false;
        let reason: string | undefined;
        const changes: string[] = [];
        let sourceTemplate: ProjectionPreview['sourceTemplate'];
        try {
            const value = this.projectionValue(actual);
            sourceTemplate = { revision: value.revision, coreVersion: CoreVersion(value.core.version), settingsVersion: InputSettingsVersion(value.settings.version) };
            if (value.core.text !== this.snapshot.core.text) changes.push('core');
            if (value.settings.value.inputLimitBytes !== this.snapshot.settings.value.inputLimitBytes) changes.push('settings');
            importable = changes.length > 0;
            if (!importable) reason = 'NO_SUPPORTED_CHANGES';
        } catch (error) { reason = error instanceof HomeError && error.code === 'PROJECTION_METADATA_CHANGED' ? error.code : 'INVALID_PROJECTION'; }
        return { ...base, state, actualText, actualDigest: digest(actual), importable, ...(sourceTemplate ? { sourceTemplate } : {}), ...(reason ? { reason } : {}), changes };
    }
    previewProjection(projectionId: ProjectionId) { return this.run(async () => { await this.assertWritable(); return this.preview(projectionId); }); }
    readDiagnostic() { return this.run(async () => { const result = await diagnoseRoleHome(this.path, { expectedRoleId: this.roleId }); if (result.mode === 'read-only') this.fault = result; return this.fault ?? result; }); }
    private async assertWritable() {
        if (this.fault) fail('READ_ONLY_HOME');
        const diagnostic = await diagnoseRoleHome(this.path, { expectedRoleId: this.roleId });
        if (diagnostic.mode === 'read-only') { this.fault = diagnostic; fail('READ_ONLY_HOME'); }
    }
    readPreservedProjection(operationId: OperationId) { return this.run(async () => {
        await this.assertWritable(); op(operationId); const commit = this.commits.find(c => c.operationId === operationId);
        if (!commit || (commit.kind !== 'import-projection' && commit.kind !== 'rebuild-projection')) fail('PROJECTION_OPERATION_NOT_FOUND');
        const material = await this.material(commit!.data.preserved);
        return { operationId, materialRef: String(commit!.data.preserved), bytesBase64: material?.toString('base64') ?? '', absent: material === null };
    }); }
    private async projection(write: boolean, previous?: HomeSnapshot): Promise<'current' | 'diff' | 'lag'> {
        const file = join(this.storagePath, 'views', 'settings.json');
        const desired = this.generated(this.snapshot);
        let existing: Buffer | undefined;
        try {
            existing = await safeBytes(file);
        }
        catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'ENOENT')
                return 'diff';
        }
        if (existing?.equals(desired))
            return 'current';
        if (existing && !this.generatedHistory.some(bytes => existing!.equals(bytes)) && (!previous || !existing.equals(this.generated(previous))))
            return 'diff';
        if (!write)
            return 'lag';
        try {
            const temp = join(this.storagePath, 'views', '.' + randomUUID() + '.projection');
            const fd = await open(temp, 'wx', 0o600);
            try {
                await fd.writeFile(desired);
                await fd.sync();
            }
            finally {
                await fd.close();
            }
            await rename(temp, file);
            await syncDir(dirname(file));
            return 'current';
        }
        catch {
            return 'lag';
        }
    }
    private async append(kind: string, operationId: OperationId, fp: string, data: Record<string, Json>): Promise<HomeReceipt> {
        if(this.backups&&(await this.backups.read(operationId)).phase!=='not-found')fail('OPERATION_CONFLICT');
        const body = { roleId: this.roleId, revision: HomeRevision(this.commits.length + 1), prev: this.head, kind, operationId, fingerprint: fp, data };
        const c: Commit = { ...body, digest: fingerprint(body) };
        let published = false;
        const previous = this.snapshot;
        try {
            await this.io.barrier?.('before-commit-publish', { operationId, revision: c.revision });
            await publish(join(this.storagePath, 'commits', String(c.revision).padStart(12, '0') + '.json'), canonicalBytes(c), async () => { published = true; await this.io.barrier?.('after-commit-publish', { operationId, revision: c.revision }); });
            await this.io.barrier?.('after-commit-sync', { operationId, revision: c.revision });
        }
        catch (e) {
            if (published) {
                this.uncertain = operationId;
                throw new HomeError('IO_UNCERTAIN');
            }
            throw e;
        }
        try { await this.load();await this.syncHead(operationId); } catch { this.uncertain = operationId; throw new HomeError('IO_UNCERTAIN'); }
        this.snapshot = { ...this.snapshot, projection: await this.projection(kind !== 'import-projection' && kind !== 'rebuild-projection', previous) };
        return this.receipt(c);
    }
    private receipt(c: Commit): HomeReceipt { return { operationId: c.operationId, kind: 'committed', roleId: this.roleId, committedRevision: c.revision, stage: (c.kind === 'create' || c.kind === 'attach-home') && !this.commits.some(x => x.kind === 'register-home' && x.data.targetOperationId === c.operationId) ? 'created-unregistered' : 'applied', projection: this.snapshot.projection }; }

    private applyConversationFact(fact: ConversationFact, inputs: InputRecord[], generation: ContextGeneration, revision: HomeRevision,qqBinding?:QQBinding) {
        fact = admitConversationFact(fact);
        const state = this.conversation;
        const invalid = ():never => fail('CORRUPT_CONVERSATION');
        const active = (id:string) => state.turns.find(t=>t.runId===id&&t.status==='running') ?? invalid();
        if(fact.kind==='suspend-autonomous'){const t=active(fact.runId);if(t.source!=='autonomous'||state.attempts.some(a=>a.runId===t.runId&&!a.outcome))invalid();this.conversation={...state,turns:state.turns.map(x=>x===t?{...t,status:'suspended'}:x)};return;}
        if(fact.kind==='resume-autonomous'){const t=state.turns.find(t=>t.runId===fact.runId&&t.status==='suspended'&&restoreRunEligible(this.restoreAcceptances.at(-1),t.runId)),p=state.autonomy.pending;if(!t||t.source!=='autonomous'||!p||p.opportunityId!==fact.opportunityId||fact.contextGeneration!==generation||fact.admittedInputSequence!==Math.max(0,...inputs.map(i=>i.receiveSequence)))invalid();this.conversation={...state,autonomy:{...state.autonomy,pending:null},turns:state.turns.map(x=>x===t?{...t!,status:'running',admittedInputSequence:fact.admittedInputSequence,contextGeneration:fact.contextGeneration}:x)};return;}
        if(fact.kind==='coalesce-wake'){if(!state.autonomy.pending||JSON.stringify(state.autonomy.pending)!==JSON.stringify(fact.opportunity)||clockProblem(state.autonomy,fact.clock))invalid();this.conversation={...state,autonomy:{...state.autonomy,clock:fact.clock}};return;}
        if(fact.kind==='request-wake'){
            if(state.autonomy.pending||clockProblem(state.autonomy,fact.clock)||fact.opportunity.requestedAt!==fact.clock.utc)invalid();
            this.conversation={...state,autonomy:{...state.autonomy,pending:fact.opportunity,clock:fact.clock}};return;
        }
        if(fact.kind==='clock-blocked'){if(!clockProblem(state.autonomy,fact.clock)||fact.reason!==clockProblem(state.autonomy,fact.clock))invalid();this.conversation={...state,autonomy:{...state.autonomy,clockBlocked:fact.reason}};return;}
        if(fact.kind==='clock-reviewed'){
            // A trusted owner review clears the seal but never rewinds stored usage, windows or cooldown.
            if(fact.review!=='trusted-owner'||!state.autonomy.clockBlocked||fact.previousBlock!==state.autonomy.clockBlocked||clockProblem({...state.autonomy,clockBlocked:undefined},fact.clock))invalid();
            const {clockBlocked,...rest}=state.autonomy;
            this.conversation={...state,autonomy:{...rest,clock:fact.clock}};return;
        }
        if(fact.kind==='edit-autonomy-rules'){
            if(!validAutonomyRules(fact.value)||fact.version!==state.autonomy.rules.version+1)invalid();
            const last=state.autonomy.windows.at(-1),transition=fact.transition;
            if(!transition){if(fact.clock)invalid();this.conversation={...state,autonomy:{...state.autonomy,rules:{version:fact.version,value:fact.value}}};return;}
            const clock=fact.clock,before=last;
            if(!before||!clock||fact.value.timeZone===state.autonomy.rules.value.timeZone)invalid();
            else if(transition.kind!=='time-zone-change'||transition.nextTimeZone!==fact.value.timeZone||transition.previousTimeZone!==before.timeZone||transition.previousEndUtc!==before.endUtc||transition.at!==clock.utc||transition.dataVersion!==clock.dataVersion)invalid();
            else if(clockProblem(state.autonomy,clock))invalid();
            else {
                const recomputed=transitionIanaWindow(before,fact.value,transition.at,transition.dataVersion);
                if(JSON.stringify(recomputed.transition)!==JSON.stringify(transition))invalid();
                this.conversation={...state,autonomy:{...state.autonomy,clock:clock,rules:{version:fact.version,value:fact.value},windows:state.autonomy.windows.map(window=>window===last?recomputed.window:window)}};
            }
            return;
        }
        if(fact.kind==='set-autonomy-pause'){if(typeof fact.paused!=='boolean'||!Number.isFinite(Date.parse(fact.at)))invalid();if(fact.paused?state.autonomy.pausedAt!==undefined:state.autonomy.pausedAt===undefined)invalid();const {pausedAt:ignored, ...rest}=state.autonomy;this.conversation={...state,autonomy:fact.paused?{...rest,pausedAt:fact.at}:rest};return;}
        if(fact.kind==='begin-autonomous'){
            const t=fact.turn,p=state.autonomy.pending;if(!p||p.opportunityId!==fact.opportunityId||t.opportunityId!==p.opportunityId||t.source!=='autonomous'||t.inputIds.length||t.status!=='running'||t.admittedInputSequence!==Math.max(0,...inputs.map(i=>i.receiveSequence))||t.bindingId!==panelBindingFor(this.roleId).bindingId||t.bindingVersion!==1||t.contextGeneration!==generation||t.settingsVersion!==state.rules.version||state.turns.some(x=>x.runId===t.runId)||Date.parse(t.deadline)!==Date.parse(t.startedAt)+state.autonomy.rules.value.windowMs)invalid();
            this.conversation={...state,turns:[...state.turns,t],autonomy:{...state.autonomy,pending:null}};return;
        }
        if(fact.kind==='rollback-knowledge'){
            const version=fact.version;if(!version.ownerAction||version.ownerAction.kind!=='rollback'||version.proposalId!==undefined||version.rollbackOf.knowledgeId!==version.knowledgeId)invalid();
            const command=parseKnowledgeRollback({kind:'rollback-knowledge',operationId:version.ownerAction.operationId,knowledgeId:version.knowledgeId,targetVersion:version.rollbackOf.version,expectedKnowledgeVersion:version.ownerAction.fromVersion,expectedRevision:HomeRevision(revision-1),reason:version.ownerAction.reason});
            const expected=createKnowledgeRollback(state.knowledge,command,revision,version.ownerAction.createdAt);if(JSON.stringify(expected)!==JSON.stringify(version))invalid();
            this.conversation={...state,knowledge:{...state.knowledge,versions:[...state.knowledge.versions,expected]}};return;
        }
        if(fact.kind==='save-proposal'){
            const raw=fact.proposal,a=state.attempts.find(a=>a.attemptId===raw.attemptId),value=parseKnowledgeProposal(raw.value),claim=proposalClaim(raw.claim);
            if(!a||a.kind!=='tool'||!a.proposal||!a.enteredAt||a.outcome||raw.runId!==a.runId||raw.committedRevision!==revision||raw.processing||claim.sourceBasis&&JSON.stringify(claim.sourceBasis.map(source=>source.ref))!==JSON.stringify(value.sources.map(source=>source.ref))||!Number.isFinite(Date.parse(raw.createdAt))||state.knowledge.proposals.some(p=>p.proposalId===raw.proposalId||p.attemptId===a.attemptId)||JSON.stringify(claim)!==JSON.stringify(a.proposal))invalid();active(a!.runId);
            for(const source of value.sources){const ref=source.ref;if(ref.kind==='input'&&!inputs.some(input=>input.inputId===ref.id)||ref.kind==='reply'&&!state.replies.some(reply=>reply.replyId===ref.id)||ref.kind==='tool'&&!state.attempts.some(tool=>tool.kind==='tool'&&tool.attemptId===ref.id)||ref.kind==='knowledge'&&!state.knowledge.versions.some(version=>version.knowledgeId===ref.id&&version.version===ref.version))invalid();}
            const proposal:ProposalRecord={...raw,proposalId:ProposalId(raw.proposalId),operationId:OperationId(raw.operationId),runId:RunId(raw.runId),attemptId:AttemptId(raw.attemptId),claim,value,committedRevision:revision};this.conversation={...state,knowledge:{...state.knowledge,proposals:[...state.knowledge.proposals,proposal]}};return;
        }
        if(fact.kind==='process-proposal'){
            const contactFact=(fact as unknown as {contact?:{intent?:ContactIntentRecord;delivery?:import('./deliveries.ts').DeliveryRecord;supersedes?:ContactIntentId}}).contact;
            const p=state.knowledge.proposals.find(p=>p.proposalId===fact.proposalId),a=p&&state.attempts.find(a=>a.attemptId===p.attemptId),result=fact.processing;if(!p||!a?.outcome||!canonicalProposalRecorded(a,p,state.nativeRecords)||p.processing||result.committedRevision!==revision||!['adopted','pending-review','rejected','unchanged'].includes(result.status)||!/^[A-Z][A-Z0-9_]{1,127}$/.test(result.reason))invalid();
            if(result.status==='adopted'){
                if(!canonicalProposalSucceeded(a!,p!)||p!.claim.contextGeneration!==generation||p!.claim.settingsVersion!==state.rules.version||p!.claim.inputSequence!==undefined&&inputs.some(input=>input.receiveSequence>p!.claim.inputSequence!)||fact.assessment.status!=='adopt'||!fact.version)invalid();active(p!.runId);
                const v=fact.version!,previous=state.knowledge.versions.filter(v=>p!.value.targetId?v.knowledgeId===p!.value.targetId:v.kind===p!.value.kind&&v.topic===p!.value.topic).at(-1),expected=previous?.version??0;
                const {knowledgeId:ignoredId,version:ignoredVersion,proposalId:ignoredProposal,committedRevision:ignoredRevision,sourceBasis:ignoredBasis,...value}=v;
                if(v.sourceBasis&&(v.sourceBasis.length!==p!.value.sources.length||v.sourceBasis.some((basis,index)=>JSON.stringify(basis.ref)!==JSON.stringify(p!.value.sources[index]!.ref)||!/^[0-9a-f]{64}$/.test(basis.contentDigest))||JSON.stringify(v.sourceBasis)!==JSON.stringify(fact.assessment.sources)))invalid();
                if(previous&&previous.kind!==p!.value.kind)invalid();
                if(p!.value.expectedVersion!==expected||v.version!==expected+1||v.version<1||v.knowledgeId!==(previous?.knowledgeId??KnowledgeId('knowledge-'+p!.proposalId))||result.knowledgeId!==v.knowledgeId||result.version!==v.version||v.proposalId!==p!.proposalId||v.committedRevision!==revision||JSON.stringify(parseKnowledgeProposal(value))!==JSON.stringify(p!.value))invalid();
                if(fact.assessment.sources.length!==p!.value.sources.length)invalid();
                // Without a QQ binding there is no fixed target, so a contact proposal is adopted as
                // knowledge only (honest "saved, not sent"); it can never manufacture a delivery.
                if(v.kind==='contact'&&!qqBinding&&contactFact)return invalid();
                if(v.kind==='contact'&&qqBinding){
                    // A contact adoption must archive exactly the matching intent (and at most one pending delivery).
                    const intent=contactFact?.intent,binding=qqBinding,delivery=contactFact?.delivery;
                    if(!intent||!binding)return invalid();
                    if(intent.state!=='open'||intent.deliveryId!==delivery?.deliveryId||intent.runId!==p!.runId||intent.proposalId!==p!.proposalId||intent.knowledgeId!==v.knowledgeId||intent.knowledgeVersion!==v.version||intent.committedRevision!==revision||state.contact.intents.some(record=>record.intentId===intent.intentId))return invalid();
                    if(contactFact!.supersedes!==undefined){const prior=state.contact.intents.find(record=>record.intentId===contactFact!.supersedes);if(!prior||prior.state!=='open'||prior.deliveryId!==undefined||prior.runId!==p!.runId)return invalid();}
                    if(delivery){const expected=prepareContactDelivery({intentId:intent.intentId,runId:intent.runId,text:String(v.text)},binding,state.deliveryRules,revision);if(JSON.stringify(delivery)!==JSON.stringify(expected)||state.deliveries.some(record=>record.deliveryId===delivery.deliveryId))return invalid();}
                    else if(intent.deliveryId)return invalid();
                }else if(v.kind!=='contact'&&contactFact)return invalid();
            }else if(result.status==='unchanged'){const previous=state.knowledge.versions.findLast(version=>version.knowledgeId===p!.value.targetId);if(!previous||fact.version||result.knowledgeId!==previous.knowledgeId||result.version!==previous.version||p!.value.expectedVersion!==previous.version||!unchangedKnowledge(p!.value,previous)||!canonicalProposalSucceeded(a!,p!))invalid();}else if(fact.version||result.knowledgeId||result.version)invalid();
            const processing:ProposalProcessing={...result,...(result.knowledgeId?{knowledgeId:KnowledgeId(result.knowledgeId)}:{}),...(result.version!==undefined?{version:KnowledgeVersion(result.version)}:{}),committedRevision:revision};
            let autonomy=state.autonomy;if(fact.activity){const value=p!.value,at=Date.parse(fact.activity.adoptedAt),turn=active(p!.runId);if(value.kind!=='activity'||!['adopted','unchanged'].includes(result.status)||!Number.isFinite(at)||at<Date.parse(p!.createdAt)||at>=Date.parse(turn.deadline)||fact.activity.restUntil!==(value.decision==='rest'?new Date(at+value.restMs!).toISOString():undefined))invalid();autonomy={...autonomy,activity:{proposalId:p!.proposalId,decision:value.kind==='activity'?value.decision:'',reason:value.reason,committedRevision:revision},...(fact.activity.restUntil?{restUntil:fact.activity.restUntil}:{})};}
            const contact=contactFact?.intent?{intents:[...state.contact.intents.map(record=>record.intentId===contactFact.supersedes?{...record,state:'closed' as const,closedReason:'CONTACT_SUPERSEDED',supersededBy:contactFact.intent!.intentId}:record),{...contactFact.intent,...(contactFact.delivery?{deliveryId:contactFact.delivery.deliveryId}:{})}]}:state.contact;
            this.conversation={...state,autonomy,contact,knowledge:{proposals:state.knowledge.proposals.map(record=>record===p?{...record,processing}:record),versions:fact.version?[...state.knowledge.versions,admitProposedKnowledge(fact.version)]:state.knowledge.versions},deliveries:contactFact?.delivery?[...state.deliveries,admitDelivery(contactFact.delivery,this.roleId)]:state.deliveries};return;
        }
        if(fact.kind==='edit-file-access'){if(!validateFileAccess(fact.value)||fact.version!==state.fileAccess.version+1)invalid();this.conversation={...state,fileAccess:{version:fact.version,value:admitFileAccess(fact.value)}};return;}
        if(fact.kind==='edit-file-rules'){if(!validateFileRules(fact.value)||fact.version!==state.fileRules.version+1)invalid();this.conversation={...state,fileRules:{version:fact.version,value:fact.value}};return;}
        if(fact.kind==='resolve-delivery'){
            const r=fact.resolution,d=state.deliveries.find(d=>d.deliveryId===r.deliveryId),a=state.sendAttempts.find(a=>a.sendAttemptId===r.sendAttemptId);
            if(!validResolutionDecision(r)||!d||!a||d.sendAttemptId!==a.sendAttemptId||a.deliveryId!==d.deliveryId||!a.observation||!['unknown','rejected'].includes(d.status)||r.committedRevision!==revision||state.deliveryResolutions.some(x=>x.operationId===r.operationId))invalid();
            OperationId(r.operationId);
            if(r.decision==='resend'){
                // A contact is never resent through the reply resolution path: rejudging it is a new proposal.
                if(d!.qualification==='contact')invalid();
                const reply=state.replies.find(x=>x.replyId===d!.replyId);
                if(!reply||!sameQQTarget(qqBinding,d!.target)||state.deliveryResolutions.some(x=>x.deliveryId===d!.deliveryId&&x.newDeliveryId))invalid();
                const expected=prepareRedelivery(reply!,d!,state.deliveryRules,revision,r.operationId);
                if(!fact.delivery||JSON.stringify(fact.delivery)!==JSON.stringify(expected)||r.newDeliveryId!==expected.deliveryId||state.deliveries.some(x=>x.deliveryId===expected.deliveryId))invalid();
            }else if(fact.delivery||r.newDeliveryId)invalid();
            const resolution:DeliveryResolution={...r,operationId:OperationId(r.operationId),deliveryId:DeliveryId(r.deliveryId),sendAttemptId:SendAttemptId(r.sendAttemptId),committedRevision:HomeRevision(r.committedRevision),...(r.newDeliveryId?{newDeliveryId:DeliveryId(r.newDeliveryId)}:{})};
            this.conversation={...state,deliveryResolutions:[...state.deliveryResolutions,resolution],deliveries:fact.delivery?[...state.deliveries,admitDelivery(fact.delivery,this.roleId)]:state.deliveries};return;
        }
        if(fact.kind==='edit-delivery-rules'){
            if(!validateDeliveryRules(fact.value)||fact.version!==state.deliveryRules.version+1)invalid();
            // Exactly one display rule covers both qualifications; the body source differs (reply text vs contact intent knowledge).
            const pending=state.deliveries.filter(d=>d.status==='pending');
            const sourceText=(delivery:{qualification:'main-reply'|'contact';replyId?:unknown;contactIntentId?:unknown})=>{
                if(delivery.qualification==='contact'){const intent=delivery.contactIntentId?state.contact.intents.find(intent=>intent.intentId===delivery.contactIntentId):undefined,record=intent&&state.knowledge.versions.find(version=>version.knowledgeId===intent.knowledgeId&&version.version===intent.knowledgeVersion);if(!record)invalid();return String(record!.text);}
                const reply=state.replies.find(reply=>reply.replyId===delivery.replyId);if(!reply)return invalid();return reply.text;
            };
            const changed=pending.filter(d=>previewDelivery(d.qualification,sourceText(d),fact.value.previewCodePoints)!==d.text);
            if(fact.replacements.length!==changed.length)invalid();
            const replacements=fact.replacements.map(d=>admitDelivery(d,this.roleId));
            for(const original of changed){const next=replacements.find(d=>d.supersedes===original.deliveryId);if(!next||next.status!=='pending'||next.qualification!==original.qualification||next.source!==original.source||next.replyId!==original.replyId||next.intentId!==original.intentId||next.contactIntentId!==original.contactIntentId||next.runId!==original.runId||JSON.stringify(next.inputIds)!==JSON.stringify(original.inputIds)||!sameQQTarget(next.target,original.target)||next.rulesVersion!==fact.version||next.text!==previewDelivery(original.qualification,sourceText(original),fact.value.previewCodePoints)||next.retryOf!==original.retryOf||next.resolutionOperationId!==original.resolutionOperationId||next.committedRevision!==revision||state.deliveries.some(d=>d.deliveryId===next.deliveryId)||next.sendAttemptId||next.supersededBy)invalid();}
            this.conversation={...state,deliveryRules:{version:fact.version,value:fact.value},deliveries:[...state.deliveries.map(d=>{const next=replacements.find(n=>n.supersedes===d.deliveryId);return next?{...d,status:'cancelled' as const,supersededBy:next.deliveryId}:d;}),...replacements]};return;
        }
        if(fact.kind==='begin-delivery'){
            const a=fact.attempt,found=state.deliveries.find(delivery=>delivery.deliveryId===a.deliveryId);
            if(!found)return invalid();
            const delivery=found;const contactStamp=a.contact;
            if(!(delivery.status==='pending'&&restoreDeliveryEligible(this.restoreAcceptances.at(-1),delivery,state)&&sameQQTarget(qqBinding,delivery.target)&&a.rules.version===state.deliveryRules.version&&JSON.stringify(a.rules.value)===JSON.stringify(state.deliveryRules.value)&&Number.isFinite(Date.parse(a.reservedAt))&&Date.parse(a.deadline)===Date.parse(a.reservedAt)+a.rules.value.sendTimeoutMs&&a.committedRevision===revision&&!a.observation&&!state.sendAttempts.some(x=>x.sendAttemptId===a.sendAttemptId||x.deliveryId===delivery.deliveryId)))return invalid();
            let sendingIntents=state.contact.intents;
            if(a.source==='user'){
                // #39 invariant: a reply delivery is still checked field by field against its saved reply.
                const reply=state.replies.find(reply=>reply.replyId===delivery.replyId);
                if(!reply||delivery.qualification!=='main-reply'||delivery.source!=='user'||contactStamp||delivery.text!==previewReply(reply.text,state.deliveryRules.value.previewCodePoints))return invalid();
            }else{
                // Contact branch: the stamp, the intent, the day window, the body and every contact rule are re-checked.
                if(delivery.qualification!=='contact'||delivery.source!=='contact'||!contactStamp||!validContactStamp(contactStamp)||contactStamp.intentId!==delivery.contactIntentId||contactStamp.rulesVersion!==state.contactRules.version||contactStamp.clock.utc!==a.reservedAt)return invalid();
                if(contactStamp.localMinutes<0||contactStamp.localMinutes>1439)return invalid();
                const intent=state.contact.intents.find(intent=>intent.intentId===contactStamp.intentId);
                if(!intent||intent.state!=='open'||intent.deliveryId!==delivery.deliveryId||intent.runId!==contactStamp.runId||!sameQQTarget(qqBinding,delivery.target))return invalid();
                // The contact day must be the real IANA window containing the reading; no second calendar.
                const day=contactStamp.day,at=Date.parse(contactStamp.clock.utc);
                if(!/^day-[0-9a-f]{64}$/.test(day.windowId)||!Number.isFinite(Date.parse(day.startUtc))||!Number.isFinite(Date.parse(day.endUtc))||day.dataVersion!==contactStamp.clock.dataVersion||!(Date.parse(day.startUtc)<=at&&at<Date.parse(day.endUtc)))return invalid();
                const record=state.knowledge.versions.find(version=>version.knowledgeId===intent.knowledgeId&&version.version===intent.knowledgeVersion);
                if(!record||delivery.text!==previewDelivery('contact',String(record.text),state.deliveryRules.value.previewCodePoints))return invalid();
                const blocked=contactBlocked({rules:state.contactRules,stamp:contactStamp,usage:{dayUsed:state.sendAttempts.filter(attempt=>attempt.contact&&attempt.contact.day.windowId===day.windowId).length,roundUsed:contactRoundUsed(state,intent.runId),lastReservedAt:state.sendAttempts.filter(attempt=>attempt.contact).at(-1)?.reservedAt??null}});
                if(!blocked.ok)return invalid();
                sendingIntents=state.contact.intents.map(record=>record.intentId===intent.intentId?{...record,state:'sending' as const}:record);
            }
            const attempt={...a,sendAttemptId:SendAttemptId(a.sendAttemptId),deliveryId:DeliveryId(a.deliveryId),committedRevision:HomeRevision(a.committedRevision),rules:{...a.rules,version:DeliveryRulesVersion(a.rules.version)}};
            this.conversation={...state,sendAttempts:[...state.sendAttempts,attempt],deliveries:state.deliveries.map(x=>x===delivery?{...delivery,status:'sending' as const,sendAttemptId:attempt.sendAttemptId}:x),contact:{...state.contact,intents:sendingIntents}};return;
        }
        if(fact.kind==='settle-delivery'){
            const attempt=state.sendAttempts.find(a=>a.sendAttemptId===fact.sendAttemptId);
            if(!attempt)return invalid();
            const delivery=state.deliveries.find(d=>d.deliveryId===attempt.deliveryId);
            if(!delivery||delivery.status!=='sending'||attempt.observation)return invalid();
            const o=fact.observation;
            if(!['confirmed','unknown','rejected'].includes(o.kind))return invalid();
            if(o.kind==='confirmed'){QQMessageId(o.messageId);if(!o.evidence)return invalid();}else if(!/^[A-Z][A-Z0-9_]{1,63}$/.test(o.code))return invalid();
            // A contact intent mirrors the send observation; failure/unknown stay charged and are never retried.
            const nextState:ContactIntentState=o.kind==='confirmed'?'sent':o.kind==='unknown'?'unknown':'rejected';
            const contact=attempt.contact?{...state.contact,intents:state.contact.intents.map(intent=>intent.intentId===attempt.contact!.intentId?{...intent,state:nextState,...(nextState==='sent'?{}:{closedReason:o.kind})}:intent)}:state.contact;
            this.conversation={...state,sendAttempts:state.sendAttempts.map(x=>x===attempt?{...attempt,observation:o}:x),deliveries:state.deliveries.map(x=>x===delivery?{...delivery,status:o.kind}:x),contact};return;
        }
        if(fact.kind==='edit-web-rules'){if(!validateWebRules(fact.value)||fact.version!==state.webRules.version+1)invalid();this.conversation={...state,webRules:{version:fact.version,value:fact.value}};return;}
        if(fact.kind==='reserve-web-tool'){const previous=this.conversation;try{this.applyConversationFact({kind:'reserve-attempt',attempt:fact.tool,contextGeneration:fact.contextGeneration,settingsVersion:fact.settingsVersion},inputs,generation,revision);this.applyConversationFact({kind:'reserve-attempt',attempt:fact.web,contextGeneration:fact.contextGeneration,settingsVersion:fact.settingsVersion},inputs,generation,revision);}catch(error){this.conversation=previous;throw error;}return;}
        if(fact.kind==='edit-proposal-rules'){if(!validateProposalRules(fact.value)||fact.version!==state.proposalRules.version+1)invalid();this.conversation={...state,proposalRules:{version:fact.version,value:fact.value}};return;}
        if(fact.kind==='edit-retry-rules'){if(!validateRetryRules(fact.value)||fact.version!==state.retryRules.version+1)invalid();this.conversation={...state,retryRules:{version:fact.version,value:fact.value}};return;}
        if(fact.kind==='edit-read-rules'){if(!validateReadRules(fact.value)||fact.version!==state.readRules.version+1)invalid();this.conversation={...state,readRules:{version:fact.version,value:fact.value}};return;}
        if(fact.kind==='edit-contact-rules'){
            // One owner, one version, one CAS: an invalid value rejects the whole edit and keeps the old rules.
            if(!validateContactRules(fact.value)||fact.version!==state.contactRules.version+1)invalid();
            this.conversation={...state,contactRules:{version:fact.version,value:{...fact.value,quietHours:{...fact.value.quietHours}}}};return;
        }
        if(fact.kind==='contact-intent'){
            const intent=fact.intent,proposal=state.knowledge.proposals.find(record=>record.proposalId===intent.proposalId);
            const version=state.knowledge.versions.find(record=>record.knowledgeId===intent.knowledgeId&&record.version===intent.knowledgeVersion);
            if(!proposal||proposal.value.kind!=='contact'||!version||version.proposalId!==proposal.proposalId||version.kind!=='contact'||intent.state!=='open'||intent.deliveryId!==undefined||intent.committedRevision!==revision||state.contact.intents.some(record=>record.intentId===intent.intentId)||!Number.isFinite(Date.parse(intent.createdAt))||active(intent.runId).runId!==intent.runId)return invalid();
            const delivery=fact.delivery;
            if(delivery){
                const expected=prepareContactDelivery({intentId:intent.intentId,runId:intent.runId,text:String(version.text)},qqBinding??invalid(),state.deliveryRules,revision);
                if(JSON.stringify(delivery)!==JSON.stringify(expected)||state.deliveries.some(record=>record.deliveryId===delivery.deliveryId))invalid();
            }
            this.conversation={...state,contact:{intents:[...state.contact.intents,{...intent,...(delivery?{deliveryId:delivery.deliveryId}:{})}]},deliveries:delivery?[...state.deliveries,admitDelivery(delivery,this.roleId)]:state.deliveries};return;
        }
        if(fact.kind==='settle-contact-intent'){
            const intent=state.contact.intents.find(record=>record.intentId===fact.intentId);
            if(!intent||!['sending','open'].includes(intent.state)||!intent.deliveryId||!['sent','unknown'].includes(fact.state))invalid();
            this.conversation={...state,contact:{intents:state.contact.intents.map(record=>record===intent?{...record,state:fact.state}:record)}};return;
        }
        if(fact.kind==='close-contact-intent'){
            const intent=state.contact.intents.find(record=>record.intentId===fact.intentId);
            if(!intent||['sent','unknown'].includes(intent.state)||!/^[A-Z][A-Z0-9_]{1,127}$/.test(fact.reason)||(fact.supersededBy!==undefined&&!state.contact.intents.some(record=>record.intentId===fact.supersededBy)))invalid();
            // Closing never sends: it only records that this intent will not be delivered.
            this.conversation={...state,contact:{intents:state.contact.intents.map(record=>record===intent?{...record,state:'closed',closedReason:fact.reason,...(fact.supersededBy?{supersededBy:fact.supersededBy}:{})}:record)}};return;
        }
        if (fact.kind === 'edit-conversation') {
            if (!validateConversationSettings(fact.value) || fact.version !== state.rules.version+1) invalid();
            this.conversation = {...state,rules:{version:fact.version,value:fact.value}}; return;
        }
        if (fact.kind === 'begin-turn') {
            const t=fact.turn;
            if (!t || t.source!=='user'||t.status!=='running'||t.contextGeneration!==generation||t.settingsVersion!==state.rules.version||!t.inputIds.length||t.inputIds.length>8||new Set(t.inputIds).size!==t.inputIds.length||state.turns.some(x=>x.runId===t.runId||x.groupId===t.groupId)||!Number.isFinite(Date.parse(t.startedAt))||Date.parse(t.deadline)!==Date.parse(t.startedAt)+state.rules.value.windowMs) invalid();
            const queued=inputs.filter(x=>restoreInputEligible(this.restoreAcceptances.at(-1),x)&&runnableInput(x,x.bindingId===t.bindingId&&x.bindingVersion===t.bindingVersion)&&(x.status==='queued'||x.status==='running'));
            const chosen=t.inputIds.map(id=>inputs.find(x=>x.inputId===id)??invalid());
            if (chosen.some((x,i)=>queued[i]?.inputId!==x.inputId||x.bindingId!==t.bindingId||x.bindingVersion!==t.bindingVersion)) invalid();
            for (const x of chosen) inputs[inputs.indexOf(x)]={...x,status:'running',processingUnavailableReason:undefined};
            // A new process may continue a previously running group; old attempts stay charged.
            this.conversation={...state,turns:[...state.turns,t]}; return;
        }
        if (fact.kind === 'reserve-attempt') {
            const a=fact.attempt,t=active(a.runId);
            const claim=a.proposal;
            if(claim&&(a.kind!=='tool'||claim.contextGeneration!==generation||claim.settingsVersion!==state.rules.version||
                claim.sourceBasis?.some(source=>source.currentRun&&(source.currentRun.runId!==a.runId||source.currentRun.initialRevision!==claim.initialRevision||source.committedRevision===undefined||source.committedRevision>=revision))||
                claim.proposalRulesVersion!==undefined&&claim.proposalRulesVersion!==state.proposalRules.version||
                claim.inputSequence!==undefined&&claim.inputSequence!==(t.source==='autonomous'?t.admittedInputSequence:Math.max(...inputs.filter(input=>t.inputIds.includes(input.inputId)).map(input=>input.receiveSequence)))||
                (t.source==='autonomous'?claim.autonomyRulesVersion!==state.autonomy.rules.version:claim.autonomyRulesVersion!==undefined)))invalid();
            if ((a.fileOperation!==undefined&&(a.kind!=='tool'||!a.fileRules||a.fileOperation!=='read'&&a.fileOperation!=='write'))||(a.fileAccessVersion!==undefined&&(a.kind!=='tool'||!a.fileRules||a.fileAccessVersion!==state.fileAccess.version))||(a.fileRules&&a.fileAccessVersion===undefined&&state.fileAccess.version!==1)||(a.fileRules&&(a.kind!=='tool'||!validateFileRules(a.fileRules.value)||a.fileRules.version!==state.fileRules.version||JSON.stringify(a.fileRules.value)!==JSON.stringify(state.fileRules.value)))||(a.retryRules&&(!['model','web'].includes(a.kind)||!validateRetryRules(a.retryRules.value)||a.retryRules.version!==state.retryRules.version||JSON.stringify(a.retryRules.value)!==JSON.stringify(state.retryRules.value)))||(a.modelOperation?.ordinal===1&&state.retryRules.value.maxAutomaticRetries<1)||!validModelOperation(a,state.attempts)||!validWebAttempt(a,state.attempts)||!['model','tool','web'].includes(a.kind)||a.source!==t.source||a.outcome||a.observation||a.enteredAt||(a.readRules&&(a.kind!=='tool'||!validateReadRules(a.readRules.value)||a.readRules.version!==state.readRules.version||JSON.stringify(a.readRules.value)!==JSON.stringify(state.readRules.value)))||state.attempts.some(x=>x.attemptId===a.attemptId)||fact.contextGeneration!==generation||fact.settingsVersion!==state.rules.version||t.contextGeneration!==generation||!Number.isFinite(Date.parse(a.reservedAt))||Date.parse(a.reservedAt)>=Date.parse(t.deadline)||state.attempts.filter(x=>x.runId===t.runId&&x.kind===a.kind).length>=(a.kind==='model'?(t.source==='autonomous'?state.autonomy.rules.value:state.rules.value).modelLimit:a.kind==='web'?(t.source==='autonomous'?state.autonomy.rules.value:state.rules.value).webLimit:(t.source==='autonomous'?state.autonomy.rules.value:state.rules.value).toolLimit)) invalid();
            if(a.webTool&&(a.webTool.rules.version!==state.webRules.version||JSON.stringify(a.webTool.rules.value)!==JSON.stringify(state.webRules.value)||Date.parse(a.webTool.deadline)>Date.parse(t.deadline)||Date.parse(a.webTool.deadline)!==Math.min(Date.parse(t.deadline),Date.parse(a.reservedAt)+a.webTool.rules.value.toolTimeoutMs)))invalid();
            const autonomy=t.source==='autonomous'?a.autonomy?appendWindow(state.autonomy,a.autonomy,a.kind):invalid():state.autonomy;if(t.source==='autonomous'&&(a.windowId!==a.autonomy!.day.windowId||a.autonomy!.snapshotVersion===1&&a.reservedAt!==a.autonomy!.clock.utc)||t.source==='user'&&(a.autonomy||a.windowId))invalid();this.conversation={...state,autonomy,attempts:[...state.attempts,a]}; return;
        }
        if(fact.kind==='capture-material'){
            const material=fact.material,a=state.attempts.find(x=>x.attemptId===material.attemptId)??invalid();active(a.runId);
            if(a.kind!=='tool'||!a.observation||a.outcome||!['sdk-local-spill','role-read-result','role-file-result','role-web-result'].includes(material.source)||typeof material.text!=='string'||!Number.isSafeInteger(material.bytes)||material.bytes!==Buffer.byteLength(material.text,'utf8')||digest(Buffer.from(material.text,'utf8'))!==material.digest||state.attempts.some(x=>x.materials?.some(m=>m.materialId===material.materialId)))invalid();
            this.conversation={...state,attempts:state.attempts.map(x=>x===a?{...a,materials:[...(a.materials??[]),material]}:x)};return;
        }
        if(fact.kind==='observe-tool'){
            const a=state.attempts.find(x=>x.attemptId===fact.attemptId)??invalid();active(a.runId);
            if(a.kind!=='tool'||!a.enteredAt||a.outcome||a.observation||!Number.isFinite(Date.parse(fact.observation.observedAt))||!['returned','threw'].includes(fact.observation.kind))invalid();
            this.conversation={...state,attempts:state.attempts.map(x=>x===a?{...a,observation:fact.observation}:x)};return;
        }
        if (fact.kind==='enter-attempt'||fact.kind==='record-attempt') {
            const a=state.attempts.find(x=>x.attemptId===fact.attemptId)??invalid(); active(a.runId);
            if (fact.kind==='enter-attempt') {if(a.enteredAt||a.outcome||a.fileRules&&a.fileRules.version!==state.fileRules.version||!Number.isFinite(Date.parse(fact.now)))invalid();this.conversation={...state,attempts:state.attempts.map(x=>x===a?{...a,enteredAt:fact.now}:x)};}
            else {if((fact.outcome.modelFailure&&!validateModelFailure(fact.outcome.modelFailure))||a.outcome||!['completed','failed','cancelled','not-dispatched'].includes(fact.outcome.kind)||(!a.enteredAt&&fact.outcome.kind!=='not-dispatched'))invalid();this.conversation={...state,attempts:state.attempts.map(x=>x===a?{...a,outcome:fact.outcome}:x)};}
            return;
        }
        if(fact.kind==='refresh-turn-context'){
            const t=active(fact.runId);if(t.contextGeneration!==fact.previousGeneration||fact.nextGeneration!==generation||fact.nextGeneration===fact.previousGeneration||state.attempts.some(x=>x.runId===t.runId&&!x.outcome))invalid();
            this.conversation={...state,turns:state.turns.map(x=>x===t?{...t,contextGeneration:fact.nextGeneration}:x)};return;
        }
        if (fact.kind==='native-record') {
            active(fact.record.runId);
            if (!['tools-result','native-session','host-denial'].includes(fact.record.provenance)||state.nativeRecords.some(x=>x.runId===fact.record.runId&&x.nativeId===fact.record.nativeId&&x.provenance===fact.record.provenance)) invalid();
            this.conversation={...state,nativeRecords:[...state.nativeRecords,fact.record]};return;
        }
        if (fact.kind==='finish-turn') {
            const t=active(fact.runId),first=inputs.find(x=>x.inputId===t.inputIds[0]);
            const closesRevokedQQ=first?.channel==='qq'&&(!qqBinding||qqBinding.bindingId!==t.bindingId||qqBinding.version!==t.bindingVersion)&&fact.outcome.kind==='failure'&&fact.outcome.reason==='QQ_BINDING_CHANGED';
            if (fact.contextGeneration!==t.contextGeneration||(!closesRevokedQQ&&(fact.contextGeneration!==generation||t.contextGeneration!==generation))||state.attempts.some(x=>x.runId===t.runId&&!x.outcome)||!['reply','no-reply','internal','failure'].includes(fact.outcome.kind)) invalid();
            if (fact.outcome.kind==='reply'&&(!fact.replyId||typeof fact.outcome.text!=='string'||!fact.outcome.text.length))invalid();
            if (fact.outcome.kind!=='reply'&&(!fact.outcome.reason||fact.replyId))invalid();
            const external=first?.channel==='qq'&&fact.outcome.kind==='reply';
            if(external){const expected=prepareDelivery({replyId:fact.replyId!,intentId:IntentId('intent-'+t.runId),runId:t.runId,inputIds:t.inputIds,text:fact.outcome.kind==='reply'?fact.outcome.text:''},qqBinding!,state.deliveryRules,revision);if(!qqBinding||qqBinding.bindingId!==t.bindingId||qqBinding.version!==t.bindingVersion||JSON.stringify(fact.delivery)!==JSON.stringify(expected))invalid();}else if(fact.delivery)invalid();
            for (const id of t.inputIds) {const i=inputs.findIndex(x=>x.inputId===id);if(i<0||inputs[i]!.status!=='running')invalid();inputs[i]={...inputs[i]!,status:'resolved'};}
            this.conversation={...state,deliveries:fact.delivery?[...state.deliveries,admitDelivery(fact.delivery,this.roleId)]:state.deliveries,turns:state.turns.map(x=>x===t?{...t,status:'finished',outcome:fact.outcome,...(fact.replyId?{replyId:fact.replyId}:{})}:x),replies:fact.outcome.kind==='reply'?[...state.replies,{replyId:fact.replyId!,experienceId:ExperienceId('experience-'+t.runId),intentId:IntentId('intent-'+t.runId),runId:t.runId,inputIds:t.inputIds,bindingId:t.bindingId,bindingVersion:t.bindingVersion,text:fact.outcome.text,display:'queryable',committedRevision:revision}]:state.replies};return;
        }
        invalid();
    }
    private async conversationCommit(operationId:OperationId, business:unknown, fact:ConversationFact, expectedRevision?:HomeRevision) {
        op(operationId);const fp=fingerprint(business);
        await this.assertWritable();
        if(this.uncertain) {if(this.uncertain!==operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.storagePath,'commits'));await this.syncHead(operationId);this.uncertain=null;}
        const old=this.commits.find(x=>x.operationId===operationId);
        if(old){if(old.kind!==fact.kind||old.fingerprint!==fp)fail('OPERATION_CONFLICT');return this.receipt(old);}
        if(expectedRevision!==undefined&&expectedRevision!==this.revision)fail('REVISION_CONFLICT');
        // Validate the transition against the latest authority before publishing, preserving state until replay.
        const previous=this.conversation;try{this.applyConversationFact(fact,structuredClone([...this.snapshot.inputs]),this.snapshot.contextGeneration,HomeRevision(this.revision+1),this.snapshot.qqBinding);}catch(e){this.conversation=previous;throw e;}this.conversation=previous;
        const payload=await this.putManaged(fact);
        return this.append(fact.kind,operationId,fp,{payload});
    }
    readDeliveryRules(){return this.run(async()=>structuredClone({...this.conversation.deliveryRules,revision:this.revision}));}
    readContactRules(){return this.run(async()=>structuredClone({...this.conversation.contactRules,revision:this.revision}));}
    /**
     * The only atomic frequency/cooldown reservation. The reply branch is unchanged; the contact branch
     * re-checks user priority prerequisites (done by the Runtime), binding, intent, rest/pause, quiet
     * hours, daily/round limits and cooldown in the same commit as the attempt record.
     */
    beginDelivery(request:BeginDelivery){return this.run(async()=>{
        const {operationId,expectedRevision,expectedRulesVersion,now,contact,...business}=request;const prior=this.commits.find(c=>c.operationId===operationId);
        if(!prior&&expectedRulesVersion!==this.conversation.deliveryRules.version)fail('DELIVERY_RULES_VERSION_CONFLICT');
        if(!prior){const delivery=this.conversation.deliveries.find(d=>d.deliveryId===request.deliveryId);if(!delivery||delivery.status!=='pending')fail('DELIVERY_NOT_PENDING');if(!restoreDeliveryEligible(this.restoreAcceptances.at(-1),delivery!,this.conversation))fail('RESTORE_DELIVERY_REVIEW_REQUIRED');if(!sameQQTarget(this.snapshot.qqBinding,delivery!.target))fail('QQ_BINDING_CHANGED');}
        let attempt:SendAttemptRecord;
        if(contact){
            if(!validContactStamp(contact.stamp)||contact.stamp.rulesVersion!==this.conversation.contactRules.version)fail('CONTACT_RULES_CHANGED');
            if(!prior){
                const delivery=this.conversation.deliveries.find(d=>d.deliveryId===request.deliveryId)!;
                if(delivery.qualification!=='contact'||delivery.contactIntentId!==contact.intentId)fail('DELIVERY_NOT_PENDING');
                const intent=this.conversation.contact.intents.find(intent=>intent.intentId===contact.intentId);
                if(!intent||intent.state!=='open'||intent.deliveryId!==delivery.deliveryId)fail('CONTACT_INTENT_CLOSED');
                const autonomy=this.conversation.autonomy;
                // Rest and pause are autonomy semantics; both block a new proactive contact, not a user reply.
                if(autonomy.pausedAt)fail('AUTONOMY_PAUSED');
                if(autonomy.restUntil&&Date.parse(contact.stamp.clock.utc)<Date.parse(autonomy.restUntil))fail('AUTONOMOUS_REST');
                const problem=clockProblem(autonomy,contact.stamp.clock);if(problem)fail(problem);
                const blocked=contactBlocked({rules:this.conversation.contactRules,stamp:contact.stamp,usage:{dayUsed:this.conversation.sendAttempts.filter(attempt=>attempt.contact&&attempt.contact.day.windowId===contact.stamp.day.windowId).length,roundUsed:contactRoundUsed(this.conversation,intent.runId),lastReservedAt:this.conversation.sendAttempts.filter(attempt=>attempt.contact).at(-1)?.reservedAt??null}});
                if(!blocked.ok)fail(blocked.code);
                attempt={sendAttemptId:request.sendAttemptId,deliveryId:request.deliveryId,source:'contact',reservedAt:now,deadline:new Date(Date.parse(now)+this.conversation.deliveryRules.value.sendTimeoutMs).toISOString(),rules:structuredClone(this.conversation.deliveryRules),committedRevision:HomeRevision(this.revision+1),contact:{snapshotVersion:1,intentId:contact.intentId,runId:intent.runId,day:structuredClone(contact.stamp.day),clock:structuredClone(contact.stamp.clock),localMinutes:contact.stamp.localMinutes,rulesVersion:contact.stamp.rulesVersion}};
            }else{const saved=structuredClone(this.conversation.sendAttempts.find(a=>a.sendAttemptId===request.sendAttemptId)!);attempt=saved;}
        }else{
            attempt={sendAttemptId:request.sendAttemptId,deliveryId:request.deliveryId,source:'user',reservedAt:now,deadline:new Date(Date.parse(now)+this.conversation.deliveryRules.value.sendTimeoutMs).toISOString(),rules:structuredClone(this.conversation.deliveryRules),committedRevision:HomeRevision(this.revision+1)};
        }
        await this.conversationCommit(operationId,{kind:'begin-delivery',...business,...(contact?{contact:{intentId:contact.intentId}}:{})},{kind:'begin-delivery',attempt},expectedRevision);return structuredClone(this.conversation.sendAttempts.find(a=>a.sendAttemptId===request.sendAttemptId)!);
    });}
    /** Owner/remote close of a contact intent: archives the decision, never sends. */
    closeContactIntent(request:{operationId:OperationId;intentId:ContactIntentId;reason:string;supersededBy?:ContactIntentId;expectedRevision?:HomeRevision}){return this.run(async()=>{
        const fact:ConversationFact={kind:'close-contact-intent',intentId:request.intentId,reason:request.reason,...(request.supersededBy?{supersededBy:request.supersededBy}:{})};
        await this.conversationCommit(request.operationId,{kind:'close-contact-intent',intentId:request.intentId,reason:request.reason,...(request.supersededBy?{supersededBy:request.supersededBy}:{})},fact,request.expectedRevision);
    });}
    settleDelivery(request:{operationId:OperationId;sendAttemptId:SendAttemptId;observation:DeliveryObservation}){return this.run(async()=>{const fact={kind:'settle-delivery' as const,sendAttemptId:request.sendAttemptId,observation:structuredClone(request.observation)};await this.conversationCommit(request.operationId,{...fact,observation:JSON.stringify(fact.observation)},fact);});}
    readWebRules(){return this.run(async()=>structuredClone({...this.conversation.webRules,revision:this.revision}));}
    readRetryRules(){return this.run(async()=>structuredClone({...this.conversation.retryRules,revision:this.revision}));}
    initializeFileAreas(areas:readonly ('works'|'journal')[]){return this.run(async()=>{await this.assertWritable();if(!Array.isArray(areas)||areas.some(area=>area!=='works'&&area!=='journal')||new Set(areas).size!==areas.length)fail('INVALID_FILE_AREA');for(const area of areas){const target=join(this.path,area);await this.io.barrier?.('before-file-area-create',{operationId:OperationId('initialize-file-areas-'+this.roleId),revision:this.revision});try{await mkdir(target,{mode:0o700});}catch(error){if(!error||typeof error!=='object'||!('code'in error)||error.code!=='EEXIST')fail('FILE_AREA_INITIALIZATION_FAILED');}await directory(target);}await syncDir(this.path);});}
    readFileAccess(){return this.run(async()=>structuredClone({...this.conversation.fileAccess,revision:this.revision}));}
    readFileRules(){return this.run(async()=>structuredClone({...this.conversation.fileRules,revision:this.revision}));}
    readReadRules(){return this.run(async()=>structuredClone({...this.conversation.readRules,revision:this.revision}));}
    readConversation() {return this.run(async()=>structuredClone({...this.conversation,revision:this.revision}));}
    readCurrentToolSource(request:CurrentToolSourceRequest){return this.run(()=>this.currentToolSource(request));}
    private async currentToolSource(request:CurrentToolSourceRequest):Promise<CurrentToolSource>{
        if(request.roleId!==this.roleId)fail('CONTEXT_ROLE_CHANGED');
        if(this.fault||this.uncertain||this.pendingOwnerChanges||request.contextGeneration!==this.snapshot.contextGeneration)fail('CONTEXT_SNAPSHOT_STALE');
        const turn=this.conversation.turns.find(turn=>turn.runId===request.runId&&turn.status==='running'),attempt=this.conversation.attempts.find(attempt=>attempt.attemptId===request.attemptId);
        if(!turn||turn.contextGeneration!==request.contextGeneration||!contextBindingAllowed(this.snapshot,turn.bindingId,turn.bindingVersion))return fail('CONTEXT_RUN_NOT_ACTIVE');
        if(!attempt||attempt.kind!=='tool'||attempt.runId!==turn.runId||!attempt.enteredAt||!attempt.observation||!attempt.outcome)return fail('CURRENT_TOOL_SOURCE_NOT_READY');
        const canonical=confirmedToolCanonical(attempt,this.conversation),result=contextField(contextField(attempt.outcome.data,'result'),'final');
        if(!canonical||contextField(contextField(result,'value'),'toolAttemptId')!==attempt.attemptId||attempt.observation.kind!=='returned'||contextField(attempt.observation.value,'toolAttemptId')!==attempt.attemptId)return fail('CURRENT_TOOL_CANONICAL_REQUIRED');
        let reserved:HomeRevision|undefined,outcome:HomeRevision|undefined,final:HomeRevision|undefined,generation:unknown;
        // Read only the authoritative journal's managed facts. No writable source index is introduced.
        for(const commit of this.commits.toReversed()){
            if(commit.revision<=(this.storage?.baseRevision??0))break;
            if(!['reserve-attempt','reserve-web-tool','record-attempt','native-record'].includes(commit.kind))continue;
            const fact:unknown=JSON.parse(await this.managedText(commit.data.payload)),kind=contextField(fact,'kind');
            const candidate=kind==='reserve-web-tool'?contextField(fact,'tool'):contextField(fact,'attempt');
            if(!reserved&&(kind==='reserve-attempt'||kind==='reserve-web-tool')&&contextField(candidate,'attemptId')===attempt.attemptId){reserved=commit.revision;generation=contextField(fact,'contextGeneration');}
            if(!outcome&&kind==='record-attempt'&&contextField(fact,'attemptId')===attempt.attemptId)outcome=commit.revision;
            if(!final&&kind==='native-record'&&contextField(contextField(fact,'record'),'nativeId')===canonical.nativeId&&contextField(contextField(fact,'record'),'runId')===turn.runId)final=commit.revision;
            if(reserved&&outcome&&final)break;
        }
        if(!reserved||!outcome||!final||reserved<=HomeRevision(request.initialRevision)||generation!==request.contextGeneration)return fail('CURRENT_TOOL_SOURCE_STALE');
        const reader=createContextSnapshotReader(this.snapshot,this.conversation,{purpose:request.purpose,runId:request.runId},async()=>{});
        try{const source=await reader.read({kind:'tool',id:attempt.attemptId});if(!('toolName'in source))return fail('CURRENT_TOOL_SOURCE_NOT_READY');return {source:{...source,committedRevision:HomeRevision(Math.max(outcome,final)),currentRun:{runId:turn.runId,initialRevision:HomeRevision(request.initialRevision)}},observedRevision:this.revision};}finally{reader.revoke();}
    }
    readProposalRules(){return this.run(async()=>structuredClone({...this.conversation.proposalRules,revision:this.revision}));}
    readKnowledge(){return this.run(async()=>structuredClone({...this.conversation.knowledge,revision:this.revision}));}
    saveProposal(request:{operationId:OperationId;attemptId:AttemptId;value:KnowledgeProposal;now:string}){return this.run(async()=>{
        const value=parseKnowledgeProposal(request.value),id=ProposalId('proposal-'+AttemptId(request.attemptId)),old=this.conversation.knowledge.proposals.find(p=>p.proposalId===id);if(old){if(old.operationId!==request.operationId||!old.cleanup&&JSON.stringify(old.value)!==JSON.stringify(value))fail('OPERATION_CONFLICT');await this.conversationCommit(request.operationId,{kind:'save-proposal',attemptId:request.attemptId,value},{kind:'save-proposal',proposal:old});return structuredClone(this.conversation.knowledge.proposals.find(p=>p.proposalId===id)!);}
        const attempt=this.conversation.attempts.find(a=>a.attemptId===request.attemptId);if(!attempt?.proposal)return fail('PROPOSAL_PERMISSION_REQUIRED');
        const proposal:ProposalRecord={proposalId:id,operationId:OperationId(request.operationId),runId:attempt.runId,attemptId:attempt.attemptId,claim:proposalClaim(attempt.proposal),value,createdAt:request.now,committedRevision:HomeRevision(this.revision+1)};
        await this.conversationCommit(request.operationId,{kind:'save-proposal',attemptId:request.attemptId,value},{kind:'save-proposal',proposal});return structuredClone(this.conversation.knowledge.proposals.find(p=>p.proposalId===id)!);
    });}
    processProposal(request:{operationId:OperationId;proposalId:ProposalId;assessment:ProposalAssessment;now?:string}){return this.run(async()=>{
        const p=this.conversation.knowledge.proposals.find(p=>p.proposalId===request.proposalId);if(!p)return fail('PROPOSAL_NOT_FOUND');if(p.processing){if(!this.commits.some(commit=>commit.operationId===request.operationId)){await this.assertWritable();if(this.uncertain)fail('IO_UNCERTAIN');return structuredClone(p);}const version=this.conversation.knowledge.versions.find(v=>v.proposalId===p.proposalId&&v.version===p.processing?.version);await this.conversationCommit(request.operationId,{kind:'process-proposal',proposalId:p.proposalId,assessment:request.assessment},{kind:'process-proposal',proposalId:p.proposalId,assessment:request.assessment,processing:p.processing,...(version?{version}:{})});return structuredClone(this.conversation.knowledge.proposals.find(record=>record.proposalId===p.proposalId)!);}
        const a=this.conversation.attempts.find(a=>a.attemptId===p.attemptId);if(!a?.outcome)return fail('PROPOSAL_FINAL_PENDING');const previous=this.conversation.knowledge.versions.filter(v=>p.value.targetId?v.knowledgeId===p.value.targetId:v.kind===p.value.kind&&v.topic===p.value.topic).at(-1);
        const contactIntent=p.value.kind==='contact'?p.value.intentId:undefined;let checked=request.assessment;
        if(checked.status==='adopt'){try{const reader=createContextSnapshotReader(this.snapshot,this.conversation,{purpose:'daily',runId:p.runId},async()=>{}),sources=[];for(const source of p.value.sources){const basis=request.assessment.sources.find(basis=>JSON.stringify(basis.ref)===JSON.stringify(source.ref));if(source.ref.kind==='tool'&&basis?.currentRun){if(basis.currentRun.runId!==p.runId||basis.currentRun.initialRevision!==p.claim.initialRevision)throw new HomeError('CURRENT_TOOL_SOURCE_STALE');const turn=this.conversation.turns.find(turn=>turn.runId===p.runId)!;sources.push((await this.currentToolSource({roleId:this.roleId,runId:p.runId,contextGeneration:p.claim.contextGeneration,initialRevision:basis.currentRun.initialRevision,attemptId:source.ref.id,purpose:turn.inputIds.some(id=>this.snapshot.inputs.some(input=>input.inputId===id&&input.contextPurpose==='history'&&input.channel===undefined))?'history':'daily'})).source);}else sources.push(await reader.read(source.ref));}checked=assessKnowledgeProposal(p.value,sources,this.snapshot.inputs);}catch{checked={status:'reject',reason:'PROPOSAL_SOURCE_UNAVAILABLE',sources:[]};}}
        let status:ProposalProcessing['status']=checked.status==='adopt'?'adopted':checked.status==='reject'?'rejected':'pending-review',reason=checked.reason;
        if(!canonicalProposalSucceeded(a,p)){status='rejected';reason='CANONICAL_NOT_SUCCESSFUL';}else if(p.claim.contextGeneration!==this.snapshot.contextGeneration||p.claim.settingsVersion!==this.conversation.rules.version){status='rejected';reason='PROPOSAL_CONTEXT_STALE';}else if(p.claim.autonomyRulesVersion!==undefined&&this.conversation.autonomy.clockBlocked){status='rejected';reason='AUTONOMOUS_CLOCK_BLOCKED';}else if(p.claim.autonomyRulesVersion!==undefined&&p.claim.autonomyRulesVersion!==this.conversation.autonomy.rules.version){status='rejected';reason='AUTONOMY_RULES_CHANGED';}else if(p.claim.proposalRulesVersion!==this.conversation.proposalRules.version){status='rejected';reason='PROPOSAL_RULES_STALE';}else if(p.value.kind==='activity'&&p.value.decision==='rest'&&p.value.restMs!>this.conversation.proposalRules.value.maxRestSuggestionMs){status='rejected';reason='REST_SUGGESTION_LIMIT';}else if(contactIntent&&!this.conversation.replies.some(reply=>reply.intentId===contactIntent)){status='rejected';reason='CONTACT_INTENT_NOT_FOUND';}else if(p.claim.inputSequence===undefined||this.snapshot.inputs.some(input=>input.receiveSequence>p.claim.inputSequence!)){status='rejected';reason='PROPOSAL_NEW_INPUT';}else if(p.value.expectedVersion!==(previous?.version??0)){status='rejected';reason='KNOWLEDGE_VERSION_CONFLICT';}else if(previous&&previous.kind!==p.value.kind){status='rejected';reason='KNOWLEDGE_KIND_CONFLICT';}
        // Re-evaluating an old intent must be a new paid judgement, never a replay of the old text.
        let supersedes:ContactIntentId|undefined;
        if(status==='adopted'&&p.value.kind==='contact'){
            const open=this.conversation.contact.intents.find(intent=>intent.state==='open'&&intent.deliveryId===undefined&&intent.runId===p.runId);
            if(open)supersedes=open.intentId;
        }
        if(status==='adopted'&&ownerActionSourceReused(p.value,this.conversation.knowledge,createContextLineage(this.snapshot,this.conversation).describe)){status='pending-review';reason='OWNER_ACTION_REQUIRES_NEW_EVIDENCE';}
        if(status==='adopted'&&correctedSourceReused(p.value,this.conversation.knowledge,createContextLineage(this.snapshot,this.conversation).describe)){status='rejected';reason='CORRECTED_SOURCE_REUSE';}else if(status==='adopted'&&previous&&unchangedKnowledge(p.value,previous)){status='unchanged';reason='KNOWLEDGE_UNCHANGED';}
        const revision=HomeRevision(this.revision+1),version:KnowledgeRecord|undefined=status==='adopted'?{...p.value,sourceBasis:structuredClone(checked.sources),knowledgeId:previous?.knowledgeId??KnowledgeId('knowledge-'+p.proposalId),version:KnowledgeVersion((previous?.version??0)+1),proposalId:p.proposalId,committedRevision:revision}:undefined,processing:ProposalProcessing={status,reason,committedRevision:revision,...(version?{knowledgeId:version.knowledgeId,version:version.version}:status==='unchanged'&&previous?{knowledgeId:previous.knowledgeId,version:previous.version}:{})};
        const activity=(status==='adopted'||status==='unchanged')&&p.value.kind==='activity'&&request.now!==undefined?{adoptedAt:request.now,...(p.value.decision==='rest'?{restUntil:new Date(Date.parse(request.now)+p.value.restMs!).toISOString()}:{})}:undefined;
        // Contact adoption archives an intent (and at most one pending delivery) in the same commit as
        // `processing`; sending still requires `beginDelivery`'s full atomic admission.
        const binding=this.snapshot.qqBinding,intent:ContactIntentRecord|undefined=version&&version.kind==='contact'&&binding?{intentId:ContactIntentId('contact-intent-'+version.knowledgeId.slice('knowledge-'.length)+'-'+version.version),runId:p.runId,proposalId:p.proposalId,knowledgeId:version.knowledgeId,knowledgeVersion:version.version,createdAt:request.now??new Date().toISOString(),committedRevision:revision,state:'open'}:undefined;
        const contactDelivery=version&&version.kind==='contact'&&binding&&intent?prepareContactDelivery({intentId:intent.intentId,runId:intent.runId,text:String(version.text)},binding,this.conversation.deliveryRules,revision):undefined;
        const arrivedIntent=intent&&contactDelivery?{...intent,deliveryId:contactDelivery.deliveryId}:intent;
        await this.conversationCommit(request.operationId,{kind:'process-proposal',proposalId:p.proposalId,assessment:request.assessment},{kind:'process-proposal',proposalId:p.proposalId,assessment:request.assessment,processing,...(version?{version}:{}),...(activity?{activity}:{}),...(arrivedIntent?{contact:{intent:arrivedIntent,...(contactDelivery?{delivery:contactDelivery}:{}),...(supersedes?{supersedes}:{})}}:{})});
        return structuredClone(this.conversation.knowledge.proposals.find(record=>record.proposalId===p.proposalId)!);
    });}
    readQQHistory(){return this.run(async()=>structuredClone({...this.qqHistory,revision:this.revision}));}
    private async qqHistoryCommit(operationId:OperationId,fact:QQHistoryFact):Promise<void>{
        op(operationId);const fp=fingerprint(qqHistoryBusiness(fact));await this.assertWritable();
        if(this.uncertain){if(this.uncertain!==operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.storagePath,'commits'));await this.syncHead(operationId);this.uncertain=null;}
        const old=this.commits.find(c=>c.operationId===operationId);if(old){if(old.kind!=='qq-history'||old.fingerprint!==fp)fail('OPERATION_CONFLICT');return;}
        applyQQHistoryFact(this.qqHistory,fact,{roleId:this.roleId,binding:this.snapshot.qqBinding,inputs:this.snapshot.inputs});
        await this.append('qq-history',operationId,fp,{payload:await this.putManaged(fact)});
    }
    beginQQHistory(request:BeginQQHistory){return this.run(async()=>{
        op(request.operationId);if(!validQQHistoryPolicy(request.policy)||!Number.isFinite(Date.parse(request.now)))fail('INVALID_QQ_HISTORY_POLICY');
        await this.assertWritable();if(this.uncertain&&this.uncertain!==request.operationId)fail('IO_UNCERTAIN');
        const prior=this.qqHistory.queries.find(q=>q.operationId===request.operationId);if(prior){await this.qqHistoryCommit(request.operationId,{action:'begin',query:prior});return structuredClone(this.qqHistory.queries.find(q=>q.queryId===prior.queryId)!);}
        const binding=this.snapshot.qqBinding;if(!binding)fail('QQ_NOT_BOUND');if(this.qqHistory.queries.some(q=>q.phase==='running'))fail('QQ_HISTORY_QUERY_RUNNING');
        if(request.expectedBindingVersion!==undefined&&request.expectedBindingVersion!==binding!.version)fail('QQ_BINDING_CHANGED');
        const last=this.qqHistory.queries.at(-1);if(last&&Date.parse(request.now)<Date.parse(last.startedAt)+request.policy.cooldownMs)fail('QQ_HISTORY_COOLDOWN');
        const input=this.snapshot.inputs.filter(i=>(request.anchorInputId===undefined||i.inputId===request.anchorInputId)&&i.channel==='qq'&&i.bindingId===binding!.bindingId&&i.bindingVersion===binding!.version&&i.qqSource).at(-1);
        if(request.anchorInputId!==undefined&&!input)fail('QQ_HISTORY_ANCHOR_CHANGED');
        if(request.trigger==='reconnect'&&!input)fail('QQ_HISTORY_INITIAL_BINDING');
        const query:QQHistoryQuery={queryId:QQHistoryQueryId('history-'+historyDigest(request.operationId)),operationId:request.operationId,trigger:request.trigger,target:structuredClone(binding!),policy:structuredClone(request.policy),startedAt:request.now,anchor:input?{inputId:input.inputId,messageId:input.qqSource!.messageId,text:input.text}:null,phase:'running',gapReasons:[],requests:[],candidates:[]};
        await this.qqHistoryCommit(request.operationId,{action:'begin',query});return structuredClone(this.qqHistory.queries.find(q=>q.queryId===query.queryId)!);
    });}
    beginQQHistorySelection(request:SelectQQHistory&{readonly now:string}){return this.run(async()=>{
        op(request.operationId);const prior=this.qqHistory.selections.find(s=>s.operationId===request.operationId);
        const selection:QQHistorySelection={operationId:request.operationId,queryId:request.queryId,candidateIds:[...request.candidateIds],acknowledgedGap:request.acknowledgedGap,startedAt:prior?.startedAt??request.now,phase:'pending',receipts:[]};
        if(prior&&this.uncertain&&this.uncertain!==request.operationId){const original=this.commits.find(c=>c.operationId===request.operationId);if(original?.kind!=='qq-history'||original.fingerprint!==fingerprint(qqHistoryBusiness({action:'select',selection})))fail('OPERATION_CONFLICT');return structuredClone(prior);}
        if(!prior){if(this.uncertain&&this.uncertain!==request.operationId)fail('IO_UNCERTAIN');const query=this.qqHistory.queries.find(q=>q.queryId===request.queryId);if(!query)fail('QQ_HISTORY_QUERY_NOT_FOUND');if(!sameQQTarget(this.snapshot.qqBinding,query!.target))fail('QQ_BINDING_CHANGED');if(this.commits.some(c=>c.operationId===request.operationId))fail('OPERATION_CONFLICT');if(this.revision!==request.expectedRevision)fail('REVISION_CONFLICT');if(this.snapshot.qqBinding?.version!==request.expectedBindingVersion)fail('QQ_BINDING_CHANGED');}
        await this.qqHistoryCommit(request.operationId,{action:'select',selection});return structuredClone(this.qqHistory.selections.find(s=>s.operationId===request.operationId)!);
    });}
    recordQQHistorySelection(request:{operationId:OperationId;selectionOperationId:OperationId;candidateId:QQHistoryCandidateId;receipt:Exclude<import('./inputs.ts').InputReceipt,{kind:'uncertain'}>}){return this.run(()=>this.qqHistoryCommit(request.operationId,{action:'selection-receipt',selectionOperationId:request.selectionOperationId,candidateId:request.candidateId,receipt:structuredClone(request.receipt)}));}
    finishQQHistorySelection(request:{operationId:OperationId;selectionOperationId:OperationId}){return this.run(()=>this.qqHistoryCommit(request.operationId,{action:'selection-finish',selectionOperationId:request.selectionOperationId}));}
    reserveQQHistoryPage(request:{operationId:OperationId;queryId:QQHistoryQueryId;page:QQHistoryPageRequest}){return this.run(()=>this.qqHistoryCommit(request.operationId,{action:'reserve',queryId:request.queryId,request:structuredClone(request.page)}));}
    enterQQHistoryPage(request:{operationId:OperationId;queryId:QQHistoryQueryId;requestId:QQHistoryRequestId;now:string}){return this.run(()=>this.qqHistoryCommit(request.operationId,{action:'enter',queryId:request.queryId,requestId:request.requestId,now:request.now}));}
    observeQQHistoryPage(request:{operationId:OperationId;queryId:QQHistoryQueryId;requestId:QQHistoryRequestId;outcome:QQHistoryObservation}){return this.run(()=>this.qqHistoryCommit(request.operationId,{action:'observe',queryId:request.queryId,requestId:request.requestId,outcome:structuredClone(request.outcome)}));}
    finishQQHistory(request:{operationId:OperationId;queryId:QQHistoryQueryId;reason:string}){return this.run(()=>this.qqHistoryCommit(request.operationId,{action:'finish',queryId:request.queryId,reason:request.reason}));}
    readAutonomy(){return this.run(async()=>structuredClone({...this.conversation.autonomy,revision:this.revision}));}
    /** Cross-window attribution comes from the same attempt ledger; it never invents a second window record. */
    readAutonomyAttribution(request:{readonly runId?:RunId}){return this.run(async()=>{
        const runs=this.conversation.turns.filter(turn=>turn.source==='autonomous'&&(!request.runId||turn.runId===request.runId));
        if(request.runId&&!runs.length)fail('ACTIVITY_NOT_FOUND');
        return structuredClone(runs.map(turn=>{const attempts=this.conversation.attempts.filter(attempt=>attempt.runId===turn.runId),windows=[...new Set(attempts.flatMap(attempt=>attempt.windowId?[attempt.windowId]:[]))];return {runId:turn.runId,status:turn.status,startedAt:turn.startedAt,deadline:turn.deadline,windows,attempts:attempts.map(attempt=>({attemptId:attempt.attemptId,kind:attempt.kind,windowId:attempt.windowId??'',reservedAt:attempt.reservedAt,...(attempt.outcome?{outcome:attempt.outcome.kind}:{})}))};}));
    });}
    private async guardAutonomyClock(operationId:OperationId,clock:ClockReading):Promise<void>{const problem=clockProblem(this.conversation.autonomy,clock);if(!problem)return;if(!this.conversation.autonomy.clockBlocked&&problem!=='CLOCK_UNAVAILABLE'){const id=OperationId('clock-'+createHash('sha256').update(operationId).digest('hex')),fact:ConversationFact={kind:'clock-blocked',reason:problem,clock};await this.conversationCommit(id,fact,fact);}fail(problem);}
    checkAutonomyClock(request:{operationId:OperationId;clock:ClockReading}){return this.run(async()=>{await this.assertWritable();await this.guardAutonomyClock(request.operationId,request.clock);});}

    requestWake(request:{operationId:OperationId;reason:string;stamp:AutonomousStamp}){return this.run(async()=>{
        await this.assertWritable();op(request.operationId);
        if(this.uncertain){if(this.uncertain!==request.operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.path,'commits'));await this.syncHead(request.operationId);this.uncertain=null;}
        const prior=this.commits.find(c=>c.operationId===request.operationId);if(prior){if(prior.kind==='request-wake'||prior.kind==='coalesce-wake'){const fact=JSON.parse(await this.managedText(prior.data.payload));if((prior.kind==='request-wake'?fact.opportunity.reason:fact.reason)!==request.reason)fail('OPERATION_CONFLICT');return {kind:'accepted' as const,opportunity:structuredClone(fact.opportunity) as WakeOpportunity,dispatchOpportunity:false};}if(prior.kind==='clock-blocked'){const fact=JSON.parse(await this.managedText(prior.data.payload));return {kind:'skipped' as const,reason:String(fact.reason)};}fail('OPERATION_CONFLICT');}
        const problem=clockProblem(this.conversation.autonomy,request.stamp.clock);if(problem){await this.conversationCommit(request.operationId,{kind:'clock-blocked',reason:problem,clock:request.stamp.clock},{kind:'clock-blocked',reason:problem,clock:request.stamp.clock});return {kind:'skipped' as const,reason:problem};}
        const blocked=wakeBlocked(this.conversation.autonomy,request.stamp);if(blocked)return {kind:'skipped' as const,reason:blocked};
        if(this.conversation.autonomy.pending){const opportunity=structuredClone(this.conversation.autonomy.pending),fact:ConversationFact={kind:'coalesce-wake',opportunity,reason:request.reason,clock:request.stamp.clock};await this.conversationCommit(request.operationId,{kind:'coalesce-wake',opportunityId:opportunity.opportunityId,reason:request.reason},fact);return {kind:'accepted' as const,opportunity,dispatchOpportunity:true};}
        const opportunity={opportunityId:request.operationId,requestedAt:request.stamp.clock.utc,reason:request.reason};await this.conversationCommit(request.operationId,{kind:'request-wake',reason:request.reason},{kind:'request-wake',opportunity,clock:request.stamp.clock});return {kind:'accepted' as const,opportunity,dispatchOpportunity:true};
    });}
    suspendAutonomous(request:{operationId:OperationId;runId:RunId;reason:string}){return this.run(async()=>{const fact:ConversationFact={kind:'suspend-autonomous',runId:request.runId,reason:request.reason};await this.conversationCommit(request.operationId,fact,fact);});}
    /**
     * The periodic schedule is a Home-owned sidecar (`.autonomy-schedule.json`), not a commit: it is
     * runtime progress, not a business fact, and must not consume user-visible Home revisions.
     */
    private schedulePath(){return join(this.path,'.autonomy-schedule.json');}
    private async readScheduleFile():Promise<AutonomySchedule|undefined>{
        if(this.scheduleAnchor)return structuredClone(this.scheduleAnchor);
        let value:Record<string,Json>;try{value=await jsonFile(this.schedulePath(),this.recoverAliases,!this.recoverAliases);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return undefined;if(error instanceof HomeError&&error.code==='CORRUPT_HOME')fail('CORRUPT_AUTONOMY_SCHEDULE');throw error;}
        if(!validSchedule(value))fail('CORRUPT_AUTONOMY_SCHEDULE');
        const schedule:AutonomySchedule={anchorAt:String(value.anchorAt),lastSlotAt:value.lastSlotAt===null?null:String(value.lastSlotAt),nextOpportunityAt:String(value.nextOpportunityAt),missedSlots:Number(value.missedSlots)};
        this.scheduleAnchor=structuredClone(schedule);
        return structuredClone(schedule);
    }
    private async writeScheduleFile(schedule:AutonomySchedule):Promise<void>{
        if(!validSchedule(schedule))fail('INVALID_AUTONOMY_SCHEDULE');
        // The sidecar is replaced atomically (temp file + rename); it is not an append-only commit.
        const target=this.schedulePath(),temp=join(this.path,'.autonomy-schedule.json.'+randomUUID()+'.pending');
        const fd=await open(temp,'wx',0o600);
        try{await fd.writeFile(canonicalBytes(schedule));await fd.sync();}finally{await fd.close();}
        try{await rename(temp,target);}finally{await unlink(temp).catch(()=>{});}
        await syncDir(this.path);
        this.scheduleAnchor=structuredClone(schedule);
    }
    readAutonomySchedule(){return this.run(async()=>{const saved=await this.readScheduleFile();return saved?structuredClone(saved):null;});}
    armAutonomySchedule(request:{operationId:OperationId;schedule:AutonomySchedule}){return this.run(async()=>{await this.assertWritable();if(!validSchedule(request.schedule))fail('INVALID_AUTONOMY_SCHEDULE');const saved=await this.readScheduleFile();if(saved&&JSON.stringify(saved)!==JSON.stringify(request.schedule))fail('AUTONOMY_SCHEDULE_EXISTS');if(saved)return structuredClone(saved);await this.writeScheduleFile(request.schedule);this.scheduleAnchor=request.schedule;return structuredClone(request.schedule);});}
    advanceAutonomySchedule(request:{operationId:OperationId;slotAt:string;dispatchedSlot:boolean;nextOpportunityAt:string;missedSlots:number}){return this.run(async()=>{await this.assertWritable();const current=await this.readScheduleFile()??fail('AUTONOMY_SCHEDULE_MISSING');const interval=this.conversation.autonomy.rules.value.wakeIntervalMs;if(request.slotAt!==current.nextOpportunityAt)fail('AUTONOMY_SCHEDULE_STALE');if(!Number.isFinite(Date.parse(request.nextOpportunityAt))||!Number.isSafeInteger(request.missedSlots)||request.missedSlots<0||typeof request.dispatchedSlot!=='boolean')fail('INVALID_AUTONOMY_SCHEDULE');if(!(Date.parse(request.slotAt)<Date.parse(request.nextOpportunityAt)))fail('INVALID_AUTONOMY_SCHEDULE');const delta=(Date.parse(request.nextOpportunityAt)-Date.parse(request.slotAt))/interval;if(!Number.isSafeInteger(delta)||delta<1)fail('INVALID_AUTONOMY_SCHEDULE');const expected=current.missedSlots+delta-(request.dispatchedSlot?1:0);if(request.missedSlots!==expected)fail('INVALID_AUTONOMY_SCHEDULE');const next:AutonomySchedule={anchorAt:current.anchorAt,lastSlotAt:request.slotAt,nextOpportunityAt:request.nextOpportunityAt,missedSlots:request.missedSlots};await this.writeScheduleFile(next);this.scheduleAnchor=next;return structuredClone(next);});}
    /** Interval edits recompute only the next future opportunity: consumed slots and usage stay. */
    rescheduleAutonomyFuture(request:{operationId:OperationId;nextOpportunityAt:string}){return this.run(async()=>{await this.assertWritable();const current=await this.readScheduleFile()??fail('AUTONOMY_SCHEDULE_MISSING');if(!Number.isFinite(Date.parse(request.nextOpportunityAt))||Date.parse(request.nextOpportunityAt)<=Date.parse(current.lastSlotAt??current.anchorAt))fail('INVALID_AUTONOMY_SCHEDULE');const next:AutonomySchedule={anchorAt:current.anchorAt,lastSlotAt:current.lastSlotAt,nextOpportunityAt:request.nextOpportunityAt,missedSlots:current.missedSlots};await this.writeScheduleFile(next);return structuredClone(next);});}
    setAutonomyPause(request:{operationId:OperationId;paused:boolean;at:string;expectedRevision?:HomeRevision}){return this.run(async()=>{const prior=this.commits.find(c=>c.operationId===request.operationId);if(prior){if(prior.kind==='set-autonomy-pause')return;fail('OPERATION_CONFLICT');}const fact:ConversationFact={kind:'set-autonomy-pause',paused:request.paused,at:request.at};await this.conversationCommit(request.operationId,{kind:fact.kind,paused:fact.paused},fact,request.expectedRevision);});}
    beginAutonomous(request:{operationId:OperationId;runId:RunId;expectedRevision:HomeRevision;now:string;stamp?:AutonomousStamp}){return this.run(async()=>{
        await this.assertWritable();if(this.revision!==request.expectedRevision)fail('REVISION_CONFLICT');
        if(request.stamp){await this.guardAutonomyClock(request.operationId,request.stamp.clock);if(request.stamp.rulesVersion!==this.conversation.autonomy.rules.version)fail('AUTONOMY_RULES_CHANGED');const blocked=wakeBlocked(this.conversation.autonomy,request.stamp);if(blocked)fail(blocked);if(request.now!==request.stamp.clock.utc)fail('AUTONOMY_STAMP_UTC_MISMATCH');}
        const pending=this.conversation.autonomy.pending??fail('AUTONOMOUS_OPPORTUNITY_MISSING');const panel=this.snapshot.panelBinding;
        const suspended=this.conversation.turns.find(t=>t.source==='autonomous'&&t.status==='suspended'&&restoreRunEligible(this.restoreAcceptances.at(-1),t.runId));if(suspended){const fact:ConversationFact={kind:'resume-autonomous',runId:suspended.runId,opportunityId:pending.opportunityId,admittedInputSequence:Math.max(0,...this.snapshot.inputs.map(i=>i.receiveSequence)),contextGeneration:this.snapshot.contextGeneration};await this.conversationCommit(request.operationId,{kind:fact.kind,runId:suspended.runId,opportunityId:pending.opportunityId},fact,request.expectedRevision);return structuredClone(this.conversation.turns.find(t=>t.runId===suspended.runId)!);}
        const turn:TurnRecord={groupId:InputGroupId('group-'+request.runId),runId:request.runId,inputIds:[],bindingId:panel.bindingId,bindingVersion:panel.bindingVersion,source:'autonomous',opportunityId:pending.opportunityId,admittedInputSequence:Math.max(0,...this.snapshot.inputs.map(i=>i.receiveSequence)),startedAt:request.now,deadline:new Date(Date.parse(request.now)+this.conversation.autonomy.rules.value.windowMs).toISOString(),contextGeneration:this.snapshot.contextGeneration,settingsVersion:this.conversation.rules.version,status:'running'};
        const fact:ConversationFact={kind:'begin-autonomous',turn,opportunityId:pending.opportunityId};await this.conversationCommit(request.operationId,{kind:fact.kind,runId:request.runId,opportunityId:pending.opportunityId},fact,request.expectedRevision);return structuredClone(this.conversation.turns.find(t=>t.runId===request.runId)!);
    });}
    beginTurn(request:BeginTurn) {return this.run(async()=>{
        const first=this.snapshot.inputs.find(x=>x.inputId===request.inputIds[0]) ?? fail('INPUT_NOT_FOUND');
        const turn:TurnRecord={groupId:InputGroupId('group-'+request.runId),runId:request.runId,inputIds:[...request.inputIds],bindingId:first.bindingId,bindingVersion:first.bindingVersion,source:'user',startedAt:request.now,deadline:new Date(Date.parse(request.now)+this.conversation.rules.value.windowMs).toISOString(),contextGeneration:this.snapshot.contextGeneration,settingsVersion:this.conversation.rules.version,status:'running'};
        await this.conversationCommit(request.operationId,{kind:'begin-turn',inputIds:request.inputIds,runId:request.runId},{kind:'begin-turn',turn},request.expectedRevision);
        return structuredClone(this.conversation.turns.find(x=>x.runId===request.runId)!);
    });}
    refreshTurnContext(request:{operationId:OperationId;runId:RunId;previousGeneration:ContextGeneration;nextGeneration:ContextGeneration}) {return this.run(async()=>{const {operationId,...data}=request;const fact:ConversationFact={kind:'refresh-turn-context',...data};await this.conversationCommit(operationId,fact,fact);});}
    reserveAttempt(request:ReserveAttempt) {return this.run(async()=>{
        const {operationId,expectedRevision,now,...business}=request;
        const attempt:AttemptRecord={attemptId:request.attemptId,runId:request.runId,source:request.source,kind:request.kind,reservedAt:now,...(request.autonomy?{autonomy:structuredClone(request.autonomy),windowId:request.autonomy.day.windowId}:{}),...(request.proposal?{proposal:proposalClaim(request.proposal)}:{}),...(request.fileOperation!==undefined?{fileOperation:request.fileOperation}:{}),...(request.fileAccessVersion!==undefined?{fileAccessVersion:request.fileAccessVersion}:{}),...(request.fileRules?{fileRules:structuredClone(request.fileRules)}:{}),...(request.modelOperation?{modelOperation:structuredClone(request.modelOperation)}:{}),...(request.webOperation?{webOperation:structuredClone(request.webOperation)}:{}),...(['model','web'].includes(request.kind)?{retryRules:structuredClone(request.retryRules??this.conversation.retryRules)}:{}),...(request.kind==='tool'?{readRules:structuredClone(request.readRules??this.conversation.readRules)}:{})};
        const group=this.conversation.turns.find(x=>x.runId===request.runId&&x.status==='running') ?? fail('RUN_NOT_ACTIVE');
        if(request.source!==group.source)fail('SOURCE_MISMATCH');
        if(group.source==='autonomous'&&!this.commits.some(c=>c.operationId===operationId)&&request.autonomy)await this.guardAutonomyClock(operationId,request.autonomy.clock);
        if(request.modelOperation?.ordinal===1&&this.conversation.retryRules.value.maxAutomaticRetries<1)fail('MODEL_RETRY_LIMIT');
        if(!this.commits.some(x=>x.operationId===operationId)&&this.conversation.attempts.filter(x=>x.runId===group.runId&&x.kind===request.kind).length>=(request.kind==='model'?(group.source==='autonomous'?this.conversation.autonomy.rules.value:this.conversation.rules.value).modelLimit:request.kind==='web'?(group.source==='autonomous'?this.conversation.autonomy.rules.value:this.conversation.rules.value).webLimit:(group.source==='autonomous'?this.conversation.autonomy.rules.value:this.conversation.rules.value).toolLimit))fail(request.kind==='model'?'MODEL_LIMIT':request.kind==='web'?'WEB_LIMIT':'TOOL_LIMIT');if(!this.commits.some(x=>x.operationId===operationId)&&Date.parse(now)>=Date.parse(group.deadline))fail('TURN_DEADLINE');
        await this.conversationCommit(operationId,{action:'reserve-attempt',...business},{kind:'reserve-attempt',attempt,contextGeneration:request.contextGeneration,settingsVersion:request.settingsVersion},expectedRevision);
        return structuredClone(this.conversation.attempts.find(x=>x.attemptId===request.attemptId)!);
    });}
    reserveWebTool(request:ReserveWebTool){return this.run(async()=>{
        const {operationId,expectedRevision,now,webAttemptId,webTool,...business}=request;
        const group=this.conversation.turns.find(x=>x.runId===request.runId&&x.status==='running')??fail('RUN_NOT_ACTIVE');
        if(request.source!==group.source)fail('SOURCE_MISMATCH');
        if(group.source==='autonomous'&&!this.commits.some(c=>c.operationId===operationId)&&request.autonomy)await this.guardAutonomyClock(operationId,request.autonomy.clock);
        if(!this.commits.some(x=>x.operationId===operationId)){for(const kind of ['tool','web'] as const)if(this.conversation.attempts.filter(x=>x.runId===group.runId&&x.kind===kind).length>=(kind==='tool'?(group.source==='autonomous'?this.conversation.autonomy.rules.value:this.conversation.rules.value).toolLimit:(group.source==='autonomous'?this.conversation.autonomy.rules.value:this.conversation.rules.value).webLimit))fail(kind==='tool'?'TOOL_LIMIT':'WEB_LIMIT');if(Date.parse(now)>=Date.parse(group.deadline))fail('TURN_DEADLINE');}
        const tool:AttemptRecord={attemptId:request.attemptId,runId:request.runId,source:request.source,kind:'tool',reservedAt:now,...(request.autonomy?{autonomy:structuredClone(request.autonomy),windowId:request.autonomy.day.windowId}:{}),readRules:structuredClone(request.readRules??this.conversation.readRules),webTool:structuredClone(webTool)};
        const web:AttemptRecord={attemptId:webAttemptId,runId:request.runId,source:request.source,kind:'web',reservedAt:now,...(request.autonomy?{autonomy:structuredClone(request.autonomy),windowId:request.autonomy.day.windowId}:{}),retryRules:structuredClone(request.retryRules??this.conversation.retryRules),webOperation:{logicalOpId:webTool.logicalOpId,parentAttemptId:tool.attemptId,ordinal:0}};
        await this.conversationCommit(operationId,{action:'reserve-web-tool',...business,webAttemptId,webTool},{kind:'reserve-web-tool',tool,web,contextGeneration:request.contextGeneration,settingsVersion:request.settingsVersion},expectedRevision);
        return structuredClone({tool:this.conversation.attempts.find(x=>x.attemptId===tool.attemptId)!,web:this.conversation.attempts.find(x=>x.attemptId===web.attemptId)!});
    });}
    enterAttempt(request:{operationId:OperationId;attemptId:AttemptId;now:string}) {return this.run(async()=>{await this.conversationCommit(request.operationId,{kind:'enter-attempt',attemptId:request.attemptId},{kind:'enter-attempt',attemptId:request.attemptId,now:request.now});});}
    recordAttempt(request:{operationId:OperationId;attemptId:AttemptId;outcome:AttemptOutcome}) {return this.run(async()=>{await this.conversationCommit(request.operationId,{kind:'record-attempt',attemptId:request.attemptId,outcome:JSON.stringify(request.outcome)},{kind:'record-attempt',attemptId:request.attemptId,outcome:request.outcome});});}
    observeAttempt(request:{operationId:OperationId;attemptId:AttemptId;observation:ToolObservation}) {return this.run(async()=>{await this.conversationCommit(request.operationId,{kind:'observe-tool',attemptId:request.attemptId,observation:JSON.stringify(request.observation)},{kind:'observe-tool',attemptId:request.attemptId,observation:request.observation});});}
    captureMaterial(request:{operationId:OperationId;material:ToolMaterial}) {return this.run(async()=>{await this.conversationCommit(request.operationId,{kind:'capture-material',material:JSON.stringify(request.material)},{kind:'capture-material',material:request.material});});}
    recordNative(request:{operationId:OperationId;record:NativeRecord}) {return this.run(async()=>{await this.conversationCommit(request.operationId,{kind:'native-record',record:JSON.stringify(request.record)},{kind:'native-record',record:request.record});});}
    finishTurn(request:FinishTurn) {return this.run(async()=>{
        if(request.outcome.kind==='reply'&&this.conversation.turns.find(t=>t.runId===request.runId)?.source==='autonomous')fail('AUTONOMOUS_REPLY_FORBIDDEN');
        const replay=this.replayRequests.get(request.operationId);if(replay){if(replay!==fingerprint({kind:'finish-turn',runId:request.runId,outcome:JSON.stringify(request.outcome)}))fail('OPERATION_CONFLICT');const original=this.commits.find(commit=>commit.operationId===request.operationId)!;return {...this.receipt(original),...(request.outcome.kind==='reply'?{replyId:ReplyId('reply-'+request.runId)}:{})} as TurnReceipt;}
        if(request.outcome.kind==='reply'){if(typeof request.outcome.text!=='string'||!request.outcome.text.length)fail('INVALID_REPLY');canonicalBytes(request.outcome.text);}
        const fact:ConversationFact={kind:'finish-turn',runId:request.runId,contextGeneration:request.contextGeneration,outcome:request.outcome,...(request.outcome.kind==='reply'?{replyId:ReplyId('reply-'+request.runId)}:{})};
        const turn=this.conversation.turns.find(t=>t.runId===request.runId),input=turn&&this.snapshot.inputs.find(x=>x.inputId===turn.inputIds[0]),prior=this.commits.find(c=>c.operationId===request.operationId),binding=this.snapshot.qqBinding;
        if(prior&&prior.kind!=='finish-turn')fail('OPERATION_CONFLICT');
        const revoked=turn&&input?.channel==='qq'&&(!binding||binding.bindingId!==turn.bindingId||binding.version!==turn.bindingVersion);
        if(!prior&&revoked&&!(request.outcome.kind==='failure'&&request.outcome.reason==='QQ_BINDING_CHANGED'))fail('QQ_BINDING_CHANGED');
        if(request.outcome.kind==='reply'&&turn&&input?.channel==='qq'){
            const reply={replyId:fact.replyId!,intentId:IntentId('intent-'+turn.runId),runId:turn.runId,inputIds:turn.inputIds,text:request.outcome.text};
            if(prior){const saved=JSON.parse(await this.managedText(prior.data.payload));if(saved.delivery)fact.delivery=saved.delivery;}else fact.delivery=prepareDelivery(reply,binding!,this.conversation.deliveryRules,HomeRevision(this.revision+1));
        }
        const receipt=await this.conversationCommit(request.operationId,{...fact,outcome:JSON.stringify(request.outcome)},fact);
        return {...receipt,...(fact.replyId?{replyId:fact.replyId}:{})} as TurnReceipt;
    });}
    readExecutionRecord(request:ExecutionRecordRead) {return this.run(async()=>{
        if(!Number.isSafeInteger(request.offset)||request.offset<0||!Number.isSafeInteger(request.limit)||request.limit<1||request.limit>65536||!['attempt','native'].includes(request.kind))fail('INVALID_RECORD_PAGE');
        const value=request.kind==='attempt'?this.conversation.attempts.find(x=>x.attemptId===request.recordId):this.conversation.nativeRecords.find(x=>x.provenance+'/'+x.nativeId===request.recordId);
        if(!value)return fail('EXECUTION_RECORD_NOT_FOUND');const points=Array.from(JSON.stringify(value));const page={runId:value.runId,json:points.slice(request.offset,request.offset+request.limit).join(''),offset:request.offset,totalCodePoints:points.length,more:request.offset+request.limit<points.length};return request.kind==='attempt'?{...page,kind:'attempt' as const,recordId:request.recordId}:{...page,kind:'native' as const,recordId:request.recordId};
    });}
    readReply(request:ReplyRead) {return this.run(async()=>{
        if(!Number.isSafeInteger(request.offset)||request.offset<0||!Number.isSafeInteger(request.limit)||request.limit<1||request.limit>1048576)fail('INVALID_REPLY_PAGE');
        const reply=this.conversation.replies.find(x=>x.replyId===request.replyId) ?? fail('REPLY_NOT_FOUND');if(reply.cleanup)fail('REPLY_SOURCE_CLEANED');const points=Array.from(reply.text);
        return {...structuredClone(reply),text:points.slice(request.offset,request.offset+request.limit).join(''),offset:request.offset,totalCodePoints:points.length,more:request.offset+request.limit<points.length} as ReplyPage;
    });}
    async initialize(request: CreateHomeRequest) { const core = await this.put({ text: request.core }); const config = await this.put(request.settings); return this.append('create', request.operationId, this.identity.creationFingerprint, { core, settings: config }); }
    readSnapshot() { return this.run(async () => structuredClone({ ...this.snapshot, ...(this.uncertain ? { uncertainOperationId: this.uncertain } : {}) })); }
    openContextReader(request:ContextReaderRequest){return this.run(async()=>{
        if(!request||Object.getPrototypeOf(request)!==Object.prototype||Reflect.ownKeys(request).some(key=>typeof key!=='string'||!('value' in Object.getOwnPropertyDescriptor(request,key)!)))fail('INVALID_CONTEXT_PURPOSE');
        const purpose:unknown=Object.getOwnPropertyDescriptor(request,'purpose')?.value;
        if(purpose!=='management'&&purpose!=='daily'&&purpose!=='history'||Object.keys(request).sort().join('|')!==(purpose==='management'?'purpose':'purpose|runId'))fail('INVALID_CONTEXT_PURPOSE');
        const owned:ContextReaderRequest=purpose==='management'?Object.freeze({purpose:'management'}):purpose==='daily'?Object.freeze({purpose:'daily',runId:RunId(Object.getOwnPropertyDescriptor(request,'runId')?.value)}):Object.freeze({purpose:'history',runId:RunId(Object.getOwnPropertyDescriptor(request,'runId')?.value)});
        const snapshot=structuredClone(this.snapshot),validate=(sources:readonly ContextSourceBasis[])=>this.run(async()=>{
            if(this.fault||this.uncertain||this.pendingOwnerChanges||this.snapshot.contextGeneration!==snapshot.contextGeneration||this.snapshot.core.version!==snapshot.core.version)fail('CONTEXT_SNAPSHOT_STALE');
            if(owned.purpose!=='management'&&!this.conversation.turns.some(turn=>turn.runId===owned.runId&&turn.status==='running'))fail('CONTEXT_RUN_NOT_ACTIVE');
            const lineage=owned.purpose==='daily'?createContextLineage(this.snapshot,this.conversation):undefined;
            for(const source of sources){if(lineage&&!lineage.describe(source.ref).availableForDaily)fail('CONTEXT_SNAPSHOT_STALE');if(contextSourceDigest(this.snapshot,this.conversation,source.ref)!==source.contentDigest)fail('CONTEXT_SOURCE_CHANGED');}
        });
        if(this.fault||this.uncertain||this.pendingOwnerChanges)fail('CONTEXT_SNAPSHOT_STALE');
        return createContextSnapshotReader(snapshot,structuredClone(this.conversation),owned,validate);
    });}
    private inputReceipt(operationId: OperationId, kind: 'accepted' | 'duplicate'): InputAcceptedReceipt {
        const input = this.snapshot.inputs.find(x => x.operationId === operationId);
        if (!input) return fail('CORRUPT_CHAIN');
        return { kind, operationId: input.operationId, roleId: this.roleId, inputId: input.inputId, experienceId: input.experienceId, committedRevision: input.committedRevision, receiveSequence: input.receiveSequence, bindingId: input.bindingId, bindingVersion: input.bindingVersion, status: 'queued' };
    }
    acceptInput(input: BoundInput) {
        return this.run(async (): Promise<InputAcceptedReceipt> => {
            await this.assertWritable();
            const fp = fingerprint(inputBusiness(input, this.roleId,this.snapshot.qqBinding,this.qqHistory));
            if (this.uncertain) {
                if (input.operationId !== this.uncertain) throw new HomeError('IO_UNCERTAIN', 'IO_UNCERTAIN', this.uncertain);
                try { await this.load();await syncDir(join(this.storagePath, 'commits'));await this.syncHead(input.operationId); }
                catch { throw new HomeError('IO_UNCERTAIN', 'IO_UNCERTAIN', this.uncertain); }
                this.uncertain = null;
            }
            const operation = this.commits.find(x => x.operationId === input.operationId);
            if (operation) {
                if (operation.kind !== 'accept-input' || operation.fingerprint !== fp) fail('OPERATION_CONFLICT');
                this.snapshot = { ...this.snapshot, projection: await this.projection(true) };
                return this.inputReceipt(operation.operationId, 'duplicate');
            }
            const previous = this.commits.find(x => x.kind === 'accept-input' && x.data.keyHash === inputKey(input));
            if (previous) {
                if(previous.fingerprint!==fp){const original=this.snapshot.inputs.find(i=>i.operationId===previous.operationId);if(input.channel!=='qq'||!original||original.text!==input.text||fingerprint(original.qqSource)!==fingerprint(input.qqSource))fail('INPUT_KEY_CONFLICT');}
                // No alias ledger: a duplicate always names the original queryable operation.
                return this.inputReceipt(previous.operationId, 'duplicate');
            }
            if (Buffer.byteLength(input.text, 'utf8') > this.snapshot.settings.value.inputLimitBytes) fail('INPUT_TOO_LARGE');
            const content = await this.put({ externalKey: input.externalKey, text: input.text, origin: input.origin, receivedAt: input.receivedAt, sourceEvidence: input.sourceEvidence,...(input.contextPurpose?{contextPurpose:input.contextPurpose}:{}),...(input.origin==='history'?{historySource:input.historySource}:{}),...(input.channel==='qq'?{channel:'qq',qqSource:input.qqSource}:{}) });
            await this.append('accept-input', input.operationId, fp, { bindingId: input.bindingId, bindingVersion: input.bindingVersion, inputId: InputId('input-' + randomUUID()), experienceId: ExperienceId('experience-' + randomUUID()), receiveSequence: this.snapshot.inputs.length + 1, keyHash: inputKey(input), content, status: 'queued' });
            return this.inputReceipt(input.operationId, 'accepted');
        });
    }
    /** Read-only projection of the last verified authority; does not wait behind a pending write. */
    operationSnapshot(operationId:OperationId):HomeOperation{
        if(this.closed)fail('HOME_CLOSED');op(operationId);
        if(this.uncertain===operationId)return {operationId,kind:'uncertain',stage:'commit-uncertain'};
        const c=this.commits.find(commit=>commit.operationId===operationId);if(!c)return {operationId,kind:'not-found'};
        const stop=this.stops.find(record=>record.operationId===operationId);
        return {...this.receipt(c),...(stop?{stop:{...structuredClone(stop),phase:'unverified' as const}}:{})};
    }
    async readActivationDiagnostic():Promise<HomeDiagnostic|undefined>{
        if(this.closed)fail('HOME_CLOSED');let accepted:RestoreAcceptance|undefined,reason='';
        const previous=this.restoreAcceptances.at(-1);try{if(previous&&await locallyAcceptedRestore(this.path,previous))accepted=previous;}catch{reason='RESTORE_LOCAL_PROOF_UNAVAILABLE';}
        const portable=await portableRestoreRequired(this.path),outgoing=this.handovers.filter(record=>record.requestedRevision>(accepted?.committedRevision??0)).at(-1);
        if(!reason){if(portable&&!accepted||previous&&!accepted)reason='RESTORE_HANDOVER_REQUIRED';else if(outgoing)reason=outgoing.readyRevision!==undefined?'SOURCE_HANDOVER_RELEASED':'SOURCE_HANDOVER_PENDING';}
        if(!reason)return undefined;return {...await diagnoseRoleHome(this.path,{expectedRoleId:this.roleId}),mode:'read-only',reason,recovery:['restore-and-confirm-handover']};
    }
    readRestoreSource(){return this.run(()=>acceptedRestoreSource(this.path,this.restoreAcceptances.at(-1)));}
    restoredMaintenanceSnapshotFacts(){return structuredClone(this.restoredMaintenance);}
    restoreAcceptanceSnapshot():RestoreAcceptance|undefined{if(this.closed)fail('HOME_CLOSED');return structuredClone(this.restoreAcceptances.at(-1));}
    confirmRestore(raw:RestoreConfirmation){return this.run(async()=>{
        const request=restoreConfirmation(raw),{operationId,expectedRevision,...business}=request,fp=fingerprint({kind:'accept-restore',...business});await this.assertWritable();
        if(this.uncertain){if(this.uncertain!==operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.path,'commits'));await this.syncHead(operationId);this.uncertain=null;}
        const old=this.commits.find(commit=>commit.operationId===operationId);if(old&&(old.kind!=='accept-restore'||old.fingerprint!==fp))fail('OPERATION_CONFLICT');
        if(old){const accepted=this.restoreAcceptances.find(record=>record.operationId===operationId);if(accepted&&await locallyAcceptedRestore(this.path,accepted))return structuredClone(accepted);}
        if(!old&&this.revision!==expectedRevision)fail('REVISION_CONFLICT');
        const prepared=await prepareRestoreAcceptance(this.path,request,this.roleId,!!old,validateBackupAuthority),progress=prepared.progress;
        const handover=this.handovers.find(record=>record.handoverId===request.handoverId);
        if(!handover?.readyRevision||handover.backupOperationId!==prepared.backupOperationId||handover.stopOperationId!==progress.sourceStopOperationId||handover.readyRevision>(progress.sourceRevision??0))fail('SOURCE_HANDOVER_UNPROVEN');
        if(!old){if(progress.sourceRevision!==this.revision)fail('RESTORE_CONTENT_CHANGED');const refs=new Set<string>(),maintenance=await this.putManaged(prepared.maintenanceSnapshots,refs);await prepared.validateTarget(refs);await this.append('accept-restore',operationId,fp,{restoreOperationId:request.restoreOperationId,handoverId:request.handoverId,manifestDigest:request.expectedManifestDigest,sourceRevision:HomeRevision(progress.sourceRevision),sourceStopOperationId:handover!.stopOperationId,inputSequence:this.snapshot.inputs.at(-1)?.receiveSequence??0,inheritedRunIds:this.conversation.turns.filter(turn=>turn.status==='running'||turn.status==='suspended').map(turn=>turn.runId),maintenance});}
        const acceptance=this.restoreAcceptances.find(record=>record.operationId===operationId);if(!acceptance)fail('RESTORE_ACCEPTANCE_UNCERTAIN');await markRestoreAccepted(this.path,acceptance!);return structuredClone(acceptance!);
    });}

    reconcileOperation(operationId:OperationId){return this.run(async()=>{
        op(operationId);await this.assertWritable();if(this.uncertain){if(this.uncertain!==operationId)fail('IO_UNCERTAIN');await this.load();if(!this.commits.some(commit=>commit.operationId===operationId))fail('IO_UNCERTAIN');await syncDir(join(this.path,'commits'));await this.syncHead(operationId);this.uncertain=null;}
        return this.operationSnapshot(operationId);
    });}
    reconcileHandover(request:{operationId:OperationId;handoverOperationId:OperationId;priorNativeFlush:'unknown'|'source-checkpoint'}){return this.run(async()=>{
        const operationId=OperationId(request.operationId),handoverOperationId=OperationId(request.handoverOperationId),priorNativeFlush=request.priorNativeFlush,business={kind:'reconcile-handover',handoverOperationId,priorNativeFlush},fp=fingerprint(business);await this.assertWritable();
        if(this.uncertain){if(this.uncertain!==operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.path,'commits'));await this.syncHead(operationId);this.uncertain=null;}
        const old=this.commits.find(commit=>commit.operationId===operationId);if(old){if(old.kind!==business.kind||old.fingerprint!==fp)fail('OPERATION_CONFLICT');return this.receipt(old);}
        const record=this.handovers.find(record=>record.operationId===handoverOperationId);if(!record||record.readyRevision!==undefined||record.recovery||!['unknown','source-checkpoint'].includes(priorNativeFlush)||priorNativeFlush==='source-checkpoint'&&!this.stops.some(stop=>stop.operationId===record.stopOperationId&&stop.checkpoint==='ready-to-close'&&stop.requestedRevision>record.requestedRevision))fail('INVALID_HANDOVER_RECONCILIATION');
        return this.append('reconcile-handover',operationId,fp,{handoverOperationId,priorNativeFlush});
    });}
    handoverSnapshots():readonly HandoverRecord[]{if(this.closed)fail('HOME_CLOSED');return structuredClone(this.handovers);}
    requestHandover(raw:HandoverReservation,seal?:()=>void){return this.run(async()=>{
        const request=handoverReservation(raw),{operationId,expectedRevision,...business}=request,fp=fingerprint({kind:'request-handover',...business});await this.assertWritable();
        if(this.uncertain){if(this.uncertain!==operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.path,'commits'));await this.syncHead(operationId);this.uncertain=null;}
        const old=this.commits.find(commit=>commit.operationId===operationId);if(old){if(old.kind!=='request-handover'||old.fingerprint!==fp)fail('OPERATION_CONFLICT');return this.receipt(old);}
        if(this.handovers.some(record=>currentOutgoingHandover(record,this.restoreAcceptances.at(-1)?.committedRevision)))fail('HANDOVER_ALREADY_REQUESTED');if(expectedRevision!==this.revision)fail('REVISION_CONFLICT');
        seal?.();return this.append('request-handover',operationId,fp,business);
    });}
    readyHandover(request:{operationId:OperationId;handoverOperationId:OperationId}){return this.run(async()=>{
        const operationId=OperationId(request.operationId),handoverOperationId=OperationId(request.handoverOperationId),business={kind:'ready-handover',handoverOperationId},fp=fingerprint(business);await this.assertWritable();
        if(this.uncertain){if(this.uncertain!==operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.path,'commits'));await this.syncHead(operationId);this.uncertain=null;}
        const old=this.commits.find(commit=>commit.operationId===operationId);if(old){if(old.kind!==business.kind||old.fingerprint!==fp)fail('OPERATION_CONFLICT');return this.receipt(old);}
        const record=this.handovers.find(record=>record.operationId===handoverOperationId);if(!record||record.readyRevision!==undefined||!this.stops.some(stop=>stop.operationId===record.stopOperationId&&stop.checkpoint==='ready-to-close'))fail('HANDOVER_NOT_SETTLED');
        return this.append('ready-handover',operationId,fp,{handoverOperationId});
    });}
    stopSnapshots():readonly StopRecord[]{if(this.closed)fail('HOME_CLOSED');return structuredClone(this.stops);}
    private async stopCommit(operationId:OperationId,business:{kind:'request-stop';reason:StopReason}|{kind:'checkpoint-stop'|'reconcile-stop';stopOperationId:OperationId}):Promise<HomeReceipt>{
        op(operationId);const fp=fingerprint(business);await this.assertWritable();
        if(this.uncertain){if(this.uncertain!==operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.storagePath,'commits'));await this.syncHead(operationId);this.uncertain=null;}
        const old=this.commits.find(commit=>commit.operationId===operationId);if(old){if(old.kind!==business.kind||old.fingerprint!==fp)fail('OPERATION_CONFLICT');return this.receipt(old);}
        if(business.kind==='request-stop'){
            if(!['owner-stop','unload','migration'].includes(business.reason))fail('INVALID_STOP');
            return this.append(business.kind,operationId,fp,{reason:business.reason});
        }
        const previous=this.stops.find(record=>record.operationId===business.stopOperationId);if(!previous||(business.kind==='checkpoint-stop'?previous.checkpoint!=='requested':previous.reconciledRevision!==undefined))fail('STOP_CHECKPOINT_CONFLICT');
        return this.append(business.kind,operationId,fp,{stopOperationId:business.stopOperationId});
    }
    reconcileStop(request:{operationId:OperationId;stopOperationId:OperationId}){return this.run(()=>this.stopCommit(request.operationId,{kind:'reconcile-stop',stopOperationId:request.stopOperationId}));}
    requestStop(request:{operationId:OperationId;reason:StopReason}){return this.run(()=>this.stopCommit(request.operationId,{kind:'request-stop',reason:request.reason}));}
    checkpointStop(request:{operationId:OperationId;stopOperationId:OperationId}){return this.run(()=>this.stopCommit(request.operationId,{kind:'checkpoint-stop',stopOperationId:request.stopOperationId}));}
    readOperation(operationId: OperationId) { return this.run(async (): Promise<HomeOperation> => { op(operationId); const diagnostic = await diagnoseRoleHome(this.path, { expectedRoleId: this.roleId }); if (diagnostic.mode === 'read-only') { this.fault = diagnostic; return { operationId, kind: 'unavailable', reason: 'READ_ONLY_HOME' }; } if (this.uncertain === operationId)
        return { operationId, kind: 'uncertain', stage: 'commit-uncertain' }; const c = this.commits.find(x => x.operationId === operationId); return c ? { ...await this.projectionReceipt(c), ...(this.stops.find(stop=>stop.operationId===operationId)?{stop:this.operationSnapshot(operationId).stop}:{}), ...(c.kind === 'accept-input' ? { inputReceipt: this.inputReceipt(operationId, 'accepted') } : {}) } : { operationId, kind: 'not-found' }; }); }
    private progressPath(c: Commit) { return join(this.storagePath, 'projection-progress', fingerprint(c.operationId) + '.json'); }
    private async progress(c: Commit): Promise<ProjectionProgress> {
        const base = { intent: 'committed' as const, preservedMaterialRef: String(c.data.preserved) };
        try {
            await directory(join(this.storagePath, 'projection-progress'));
            const value = await jsonFile(this.progressPath(c)); exact(value, ['operationId', 'revision', 'targetDigest', 'digest']);
            const { digest: claimed, ...body } = value;
            if (claimed !== fingerprint(body) || value.operationId !== c.operationId || value.revision !== c.revision || value.targetDigest !== digest(this.generatedHistory[c.revision - 1]!)) fail('CORRUPT_PROJECTION_PROGRESS');
            return { ...base, state: 'complete' };
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return { ...base, state: 'unavailable', reason: 'CORRUPT_PROJECTION_PROGRESS' };
        }
        const preview = await this.preview('settings');
        if (c.revision !== this.revision) return { ...base, state: 'blocked', reason: 'PROJECTION_TARGET_SUPERSEDED' };
        if (preview.state === 'unavailable') return { ...base, state: 'unavailable', reason: preview.reason ?? 'UNSAFE_PROJECTION' };
        if (preview.actualDigest !== c.data.observedDigest && preview.actualDigest !== digest(this.generatedHistory[c.revision - 1]!)) return { ...base, state: 'blocked', reason: 'PROJECTION_DIGEST_CONFLICT' };
        return { ...base, state: 'pending' };
    }
    private async projectionReceipt(c: Commit): Promise<HomeReceipt> {
        if (c.kind !== 'import-projection' && c.kind !== 'rebuild-projection') return this.receipt(c);
        return { ...this.receipt(c), projection: await this.projection(false), projectionOperation: await this.progress(c) };
    }
    private async completeProjection(c: Commit): Promise<HomeReceipt> {
        let progress = await this.progress(c);
        if (progress.state !== 'pending') return this.projectionReceipt(c);
        const desired = this.generatedHistory[c.revision - 1]!;
        const file = join(this.storagePath, 'views', 'settings.json');
        try {
            const before = await this.preview('settings');
            if (before.actualDigest !== digest(desired)) {
                const temp = join(this.storagePath, 'views', '.' + randomUUID() + '.projection');
                const fd = await open(temp, 'wx', 0o600);
                try { await fd.writeFile(desired); await fd.sync(); } finally { await fd.close(); }
                try {
                    await this.io.barrier?.('before-projection-replace', { operationId: c.operationId, revision: c.revision });
                    const current = await this.preview('settings');
                    if (current.actualDigest !== before.actualDigest || current.state === 'unavailable') fail('PROJECTION_DIGEST_CONFLICT');
                    await rename(temp, file);
                    await this.io.barrier?.('after-projection-replace', { operationId: c.operationId, revision: c.revision });
                } finally { await unlink(temp).catch(() => {}); }
            }
            await syncDir(dirname(file));
            await this.io.barrier?.('before-projection-progress', { operationId: c.operationId, revision: c.revision });
            const progressDir = join(this.storagePath, 'projection-progress');
            try { await mkdir(progressDir, { mode: 0o700 }); await syncDir(this.path); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
            await directory(progressDir);
            const body = { operationId: c.operationId, revision: c.revision, targetDigest: digest(desired) };
            try { await publish(this.progressPath(c), canonicalBytes({ ...body, digest: fingerprint(body) })); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
            await syncDir(progressDir);
            await this.io.barrier?.('after-projection-progress', { operationId: c.operationId, revision: c.revision });
            this.snapshot = { ...this.snapshot, projection: await this.projection(false) };
            return this.projectionReceipt(c);
        } catch (error) {
            progress = await this.progress(c);
            return { ...this.receipt(c), projection: await this.projection(false), projectionOperation: { ...progress, ...(progress.state === 'pending' ? { reason: 'PROJECTION_WRITE_FAILED' } : {}) } };
        }
    }
    applyProjection(command: ProjectionCommand) {
        return this.run(async () => {
            await this.assertWritable();
            op(command.operationId);
            if (command.projectionId !== 'settings' || (command.observedDigest !== null && (typeof command.observedDigest !== 'string' || !/^[a-f0-9]{64}$/.test(command.observedDigest)))) fail('INVALID_PROJECTION_COMMAND');
            const fp = fingerprint({ kind: command.kind, projectionId: command.projectionId, observedDigest: command.observedDigest });
            if (this.uncertain) {
                if (this.uncertain !== command.operationId) fail('IO_UNCERTAIN');
                await this.load(); await syncDir(join(this.storagePath, 'commits')); await this.syncHead(command.operationId); this.uncertain = null;
            }
            const existing = this.commits.find(c => c.operationId === command.operationId);
            if (existing) { if (existing.fingerprint !== fp) fail('OPERATION_CONFLICT'); return this.completeProjection(existing); }
            if (command.expectedRevision !== this.revision) fail('REVISION_CONFLICT');
            if (command.expectedCoreVersion !== this.snapshot.core.version) fail('CORE_VERSION_CONFLICT');
            if (command.expectedSettingsVersion !== this.snapshot.settings.version) fail('SETTINGS_VERSION_CONFLICT');
            const preview = await this.preview(command.projectionId);
            if (preview.state === 'unavailable') fail('UNSAFE_PROJECTION');
            if (preview.actualDigest !== command.observedDigest) fail('PROJECTION_DIGEST_CONFLICT');
            const actual = preview.actualDigest === null ? null : await safeBytes(join(this.storagePath, 'views', 'settings.json'));
            if ((actual === null ? null : digest(actual)) !== command.observedDigest) fail('PROJECTION_DIGEST_CONFLICT');
            if (actual && actual.length > 8388608) fail('PROJECTION_TOO_LARGE');
            let imported: ReturnType<DiskHome['projectionValue']> | undefined;
            if (command.kind === 'import-projection') {
                if (!actual) fail('INVALID_PROJECTION'); imported = this.projectionValue(actual!);
                if (!preview.importable) fail(preview.reason ?? 'INVALID_PROJECTION');
            } else if (command.kind !== 'rebuild-projection') fail('UNSUPPORTED_COMMAND');
            const preserved = await this.putMaterial(actual);
            const data: Record<string, Json> = { projectionId: command.projectionId, observedDigest: command.observedDigest, preserved };
            if (imported) {
                data.sourceRevision = imported.revision; data.sourceCoreVersion = imported.core.version; data.sourceSettingsVersion = imported.settings.version; data.provenance = 'owner-import';
                const coreChanged = imported.core.text !== this.snapshot.core.text;
                const settingsChanged = imported.settings.value.inputLimitBytes !== this.snapshot.settings.value.inputLimitBytes;
                data.core = coreChanged ? await this.put({ text: imported.core.text }) : null; data.coreVersion = CoreVersion(this.snapshot.core.version + Number(coreChanged));
                data.settings = settingsChanged ? await this.put(imported.settings.value) : null; data.settingsVersion = InputSettingsVersion(this.snapshot.settings.version + Number(settingsChanged));
            }
            await this.append(command.kind, command.operationId, fp, data);
            return this.completeProjection(this.commits.find(c => c.operationId === command.operationId)!);
        });
    }
    applyOwner(command: HomeCommand) {
        const dependencyChange=['rollback-knowledge','edit-autonomy-rules','edit-file-rules','edit-file-access','edit-proposal-rules','edit-web-rules','edit-delivery-rules','edit-contact-rules','bind-qq','edit-core','edit-settings','edit-conversation','edit-read-rules','edit-retry-rules','import-projection','cleanup-sources'].includes(command.kind);if(dependencyChange)this.pendingOwnerChanges++;
        if (command.kind === 'import-projection' || command.kind === 'rebuild-projection') return this.applyProjection(command).finally(()=>{if(dependencyChange)this.pendingOwnerChanges--;});
        return this.run(async () => {
            await this.assertWritable();
            op(command.operationId);
            let business: unknown;
            if(command.kind==='cleanup-sources')return this.commitCleanupRequest(admitCleanupCommand(command));
            // A previous attempt of this same owner operation published but lost its acknowledgement.
            // Reconcile before any branch may early-return the original receipt, otherwise the
            // uncertain gate would stay set and block every later operation.
            if(this.uncertain){if(this.uncertain!==command.operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.storagePath,'commits'));await this.syncHead(command.operationId);this.uncertain=null;}
            if(command.kind==='rollback-knowledge'){
                const request=parseKnowledgeRollback(command),business=rollbackKnowledgeBusiness(request),old=this.commits.find(commit=>commit.operationId===request.operationId);
                if(old){if(old.kind!=='rollback-knowledge'||old.fingerprint!==fingerprint(business))fail('OPERATION_CONFLICT');return this.receipt(old);}
                const version=createKnowledgeRollback(this.conversation.knowledge,request,HomeRevision(this.revision+1),new Date().toISOString());
                return this.conversationCommit(request.operationId,business,{kind:'rollback-knowledge',version},request.expectedRevision);
            }
            if(command.kind==='bind-qq'){
                if(!validateBindQQ(command))fail('INVALID_QQ_BINDING');
                if(this.uncertain){if(this.uncertain!==command.operationId)fail('IO_UNCERTAIN');await this.load();await syncDir(join(this.storagePath,'commits'));await this.syncHead(command.operationId);this.uncertain=null;}
                const business={kind:'bind-qq',connectionId:command.connectionId,accountId:command.accountId,peerId:command.peerId},fp=fingerprint(business);
                const old=this.commits.find(x=>x.operationId===command.operationId);if(old){if(old.kind!=='bind-qq'||old.fingerprint!==fp)fail('OPERATION_CONFLICT');return this.receipt(old);}
                if(command.expectedRevision!==this.revision)fail('REVISION_CONFLICT');if(command.expectedBindingVersion!==(this.snapshot.qqBinding?.version??0))fail('QQ_BINDING_VERSION_CONFLICT');
                const binding:QQBinding={bindingId:BindingId('qq-'+this.roleId),version:BindingVersion((this.snapshot.qqBinding?.version??0)+1),connectionId:command.connectionId,accountId:command.accountId,peerId:command.peerId,activatedRevision:HomeRevision(this.revision+1)};
                return this.append('bind-qq',command.operationId,fp,{binding:await this.put(binding)});
            }
            if (command.kind === 'create') {
                text(command.core);
                settings(command.settings);
                business = { kind: 'create', core: command.core, settings: command.settings };
            }
            else if (command.kind === 'edit-core') {
                text(command.text);
                business = { kind: command.kind, text: command.text };
            }
            else if (command.kind === 'edit-settings') {
                settings(command.settings);
                business = { kind: command.kind, settings: command.settings };
            }
            else if(command.kind==='set-autonomy-pause'){
                if(typeof command.paused!=='boolean'||!Number.isFinite(Date.parse(command.at)))fail('INVALID_AUTONOMY_PAUSE');
                const prior=this.commits.find(c=>c.operationId===command.operationId);
                if(prior){if(prior.kind!=='set-autonomy-pause')fail('OPERATION_CONFLICT');const stored=JSON.parse(await this.managedText(prior.data.payload));if(stored.kind!=='set-autonomy-pause')fail('OPERATION_CONFLICT');const fact:ConversationFact={kind:'set-autonomy-pause',paused:stored.paused,at:stored.at};return this.conversationCommit(command.operationId,{kind:fact.kind,paused:fact.paused},fact);}
                if(command.paused===!!this.conversation.autonomy.pausedAt)fail('AUTONOMY_PAUSE_UNCHANGED');
                const fact:ConversationFact={kind:'set-autonomy-pause',paused:command.paused,at:command.at};
                return this.conversationCommit(command.operationId,{kind:fact.kind,paused:fact.paused},fact,command.expectedRevision);
            }
            else if(command.kind==='edit-autonomy-rules'){
                if(!validAutonomyRules(command.value))fail('INVALID_AUTONOMY_RULES');
                const replay=this.commits.some(x=>x.operationId===command.operationId);
                if(!replay&&command.expectedAutonomyRulesVersion!==this.conversation.autonomy.rules.version)fail('AUTONOMY_RULES_VERSION_CONFLICT');
                if(!replay&&command.clock){const problem=clockProblem(this.conversation.autonomy,command.clock);if(problem)fail(problem);}
                const priorRules=this.conversation.autonomy.rules.value,window=this.conversation.autonomy.windows.at(-1);
                // A confirmed zone change never opens a fresh budget: the current window keeps id, usage and its old end as a lower bound.
                const transition=replay||command.value.timeZone===priorRules.timeZone||!window||!command.clock?undefined:transitionIanaWindow(window,command.value,command.clock.utc,command.clock.dataVersion);
                const fact:ConversationFact={kind:'edit-autonomy-rules',value:command.value,version:AutonomyRulesVersion(this.conversation.autonomy.rules.version+1),...(transition?{transition:transition.transition,clock:command.clock}:{})};
                return this.conversationCommit(command.operationId,{kind:command.kind,value:command.value},{...fact},command.expectedRevision);
            }
            else if(command.kind==='review-autonomy-clock'){
                // Trusted owner review of an unclear clock: it clears the seal, never rewinds usage or cooldown.
                const block=this.conversation.autonomy.clockBlocked??fail('CLOCK_NOT_BLOCKED');
                const reading:ClockReading|undefined=command.clock;
                if(!reading)fail('CLOCK_UNAVAILABLE');
                const problem=clockProblem({...this.conversation.autonomy,clockBlocked:undefined},reading);if(problem)fail(problem);
                const reviewed:ConversationFact={kind:'clock-reviewed',clock:reading,review:'trusted-owner',previousBlock:block};
                return this.conversationCommit(command.operationId,{kind:command.kind,previousBlock:block},reviewed,command.expectedRevision);
            }
            else if(command.kind==='edit-file-access'){
                if(!validateEditFileAccess(command))fail('INVALID_FILE_ACCESS');
                if(!this.commits.some(commit=>commit.operationId===command.operationId)&&command.expectedFileAccessVersion!==this.conversation.fileAccess.version)fail('FILE_ACCESS_VERSION_CONFLICT');
                const value=admitFileAccess(command.value);return this.conversationCommit(command.operationId,{kind:command.kind,value},{kind:command.kind,value,version:FileAccessVersion(this.conversation.fileAccess.version+1)},command.expectedRevision);
            }
            else if(command.kind==='edit-file-rules'){
                if(!validateFileRules(command.value))fail('INVALID_FILE_RULES');
                if(!this.commits.some(x=>x.operationId===command.operationId)&&command.expectedFileRulesVersion!==this.conversation.fileRules.version)fail('FILE_RULES_VERSION_CONFLICT');
                const value:FileRulesValue={maxTextBytes:command.value.maxTextBytes,listPageSize:command.value.listPageSize,recursiveEntries:command.value.recursiveEntries,operationTimeoutMs:command.value.operationTimeoutMs};
                return this.conversationCommit(command.operationId,{kind:command.kind,value},{kind:'edit-file-rules',value,version:FileRulesVersion(this.conversation.fileRules.version+1)},command.expectedRevision);
            }
            else if(command.kind==='resolve-delivery'){
                if(!validateResolveDelivery(command))fail('INVALID_DELIVERY_RESOLUTION');
                const {expectedRevision,expectedQQBindingVersion,expectedDeliveryRulesVersion,operationId,kind,...choice}=command;
                const old=this.commits.find(c=>c.operationId===operationId);
                if(old){if(old.kind!==kind||old.fingerprint!==fingerprint({kind,...choice}))fail('OPERATION_CONFLICT');return this.receipt(old);}
                if(command.expectedDeliveryRulesVersion!==this.conversation.deliveryRules.version)fail('DELIVERY_RULES_VERSION_CONFLICT');
                if(command.expectedQQBindingVersion!==this.snapshot.qqBinding?.version)fail('QQ_BINDING_VERSION_CONFLICT');
                const original=this.conversation.deliveries.find(d=>d.deliveryId===command.deliveryId),attempt=this.conversation.sendAttempts.find(a=>a.sendAttemptId===command.sendAttemptId);
                if(!original||!attempt||original.sendAttemptId!==attempt.sendAttemptId||!attempt.observation||!['unknown','rejected'].includes(original.status))fail('DELIVERY_NOT_RESOLVABLE');
                // A contact is never resent through the reply resolution path; rejudging is a new proposal.
                if(command.decision==='resend'&&original!.qualification==='contact')fail('CONTACT_NOT_RESOLVABLE');
                if(command.decision==='resend'&&this.conversation.deliveryResolutions.some(x=>x.deliveryId===original!.deliveryId&&x.newDeliveryId))fail('DELIVERY_ALREADY_REISSUED');
                if(command.decision==='resend'&&!sameQQTarget(this.snapshot.qqBinding,original!.target))fail('QQ_BINDING_CHANGED');
                const delivery=command.decision==='resend'?prepareRedelivery(this.conversation.replies.find(r=>r.replyId===original!.replyId)!,original!,this.conversation.deliveryRules,HomeRevision(this.revision+1),operationId):undefined;
                const resolution:DeliveryResolution={...choice,operationId,committedRevision:HomeRevision(this.revision+1),...(delivery?{newDeliveryId:delivery.deliveryId}:{})};
                return this.conversationCommit(operationId,{kind,...choice},{kind,resolution,...(delivery?{delivery}:{})},expectedRevision);
            }
            else if(command.kind==='edit-delivery-rules'){
                if(!validateDeliveryRules(command.value))fail('INVALID_DELIVERY_RULES');
                if(!this.commits.some(x=>x.operationId===command.operationId)&&command.expectedDeliveryRulesVersion!==this.conversation.deliveryRules.version)fail('DELIVERY_RULES_VERSION_CONFLICT');
                const value={previewCodePoints:command.value.previewCodePoints,sendTimeoutMs:command.value.sendTimeoutMs},version=DeliveryRulesVersion(this.conversation.deliveryRules.version+1),revision=HomeRevision(this.revision+1);
                // Both qualifications use the same single display rule; a contact has no reply, so its body
                // comes from the adopted knowledge version of its intent (never from a reply or internal text).
                const replacements=this.conversation.deliveries.filter(d=>d.status==='pending').flatMap(d=>{
                    if(d.qualification==='contact'){
                        const intent=d.contactIntentId?this.conversation.contact.intents.find(intent=>intent.intentId===d.contactIntentId):undefined,record=intent&&this.conversation.knowledge.versions.find(version=>version.knowledgeId===intent.knowledgeId&&version.version===intent.knowledgeVersion);
                        if(!record||!intent)return [];
                        const text=previewDelivery('contact',String(record.text),value.previewCodePoints);
                        return text===d.text?[]:[{...d,deliveryId:DeliveryId('delivery-'+createHash('sha256').update(command.operationId+':'+d.deliveryId).digest('hex')),text,rulesVersion:version,committedRevision:revision,supersedes:d.deliveryId}];
                    }
                    const reply=this.conversation.replies.find(r=>r.replyId===d.replyId);if(!reply)return [];
                    return previewReply(reply.text,value.previewCodePoints)===d.text?[]:[{...prepareDelivery(reply,d.target,{value,version},revision,d.deliveryId,command.operationId),...(d.retryOf?{retryOf:d.retryOf,resolutionOperationId:d.resolutionOperationId}:{})}];
                });
                return this.conversationCommit(command.operationId,{kind:command.kind,value},{kind:'edit-delivery-rules',value,version,replacements},command.expectedRevision);
            }
            else if(command.kind==='edit-web-rules'){
                if(!validateWebRules(command.value))fail('INVALID_WEB_RULES');
                if(!this.commits.some(x=>x.operationId===command.operationId)&&command.expectedWebRulesVersion!==this.conversation.webRules.version)fail('WEB_RULES_VERSION_CONFLICT');
                return this.conversationCommit(command.operationId,{kind:command.kind,value:command.value},{kind:'edit-web-rules',value:command.value,version:WebRulesVersion(this.conversation.webRules.version+1)},command.expectedRevision);
            }
            else if(command.kind==='edit-proposal-rules'){if(!validateProposalRules(command.value))fail('INVALID_PROPOSAL_RULES');if(!this.commits.some(x=>x.operationId===command.operationId)&&command.expectedProposalRulesVersion!==this.conversation.proposalRules.version)fail('PROPOSAL_RULES_VERSION_CONFLICT');return this.conversationCommit(command.operationId,{kind:command.kind,value:command.value},{kind:'edit-proposal-rules',value:command.value,version:ProposalRulesVersion(this.conversation.proposalRules.version+1)},command.expectedRevision);}
            else if(command.kind==='edit-retry-rules'){
                if(!validateRetryRules(command.value))fail('INVALID_RETRY_RULES');
                if(!this.commits.some(x=>x.operationId===command.operationId)&&command.expectedRetryRulesVersion!==this.conversation.retryRules.version)fail('RETRY_RULES_VERSION_CONFLICT');
                const value:RetryRulesValue={maxAutomaticRetries:command.value.maxAutomaticRetries,retryDelayMs:command.value.retryDelayMs};
                return this.conversationCommit(command.operationId,{kind:command.kind,value},{kind:'edit-retry-rules',value,version:RetryRulesVersion(this.conversation.retryRules.version+1)},command.expectedRevision);
            }
            else if(command.kind==='edit-contact-rules'){
                if(!validateContactRules(command.value))fail('INVALID_CONTACT_RULES');
                if(!this.commits.some(x=>x.operationId===command.operationId)&&command.expectedContactRulesVersion!==this.conversation.contactRules.version)fail('CONTACT_RULES_VERSION_CONFLICT');
                const value:ContactRulesValue={cooldownMs:command.value.cooldownMs,dailyLimit:command.value.dailyLimit,perRoundLimit:command.value.perRoundLimit,quietHours:{...command.value.quietHours}} as ContactRulesValue;
                return this.conversationCommit(command.operationId,{kind:command.kind,value},{kind:'edit-contact-rules',value,version:ContactRulesVersion(this.conversation.contactRules.version+1)},command.expectedRevision);
            }
            else if(command.kind==='edit-read-rules'){
                if(!validateReadRules(command.value))fail('INVALID_READ_RULES');
                if(!this.commits.some(x=>x.operationId===command.operationId)&&command.expectedReadRulesVersion!==this.conversation.readRules.version)fail('READ_RULES_VERSION_CONFLICT');
                const value:ReadRulesValue={toolConcurrency:command.value.toolConcurrency,displayCodePoints:command.value.displayCodePoints,readTimeoutMs:command.value.readTimeoutMs};
                return this.conversationCommit(command.operationId,{kind:command.kind,value},{kind:'edit-read-rules',value,version:ReadRulesVersion(this.conversation.readRules.version+1)},command.expectedRevision);
            }
            else if (command.kind === 'edit-conversation') {
                if(!validateConversationSettings(command.value))fail('INVALID_CONVERSATION_SETTINGS');
                if(!this.commits.some(x=>x.operationId===command.operationId)&&command.expectedConversationVersion!==this.conversation.rules.version)fail('CONVERSATION_VERSION_CONFLICT');
                return this.conversationCommit(command.operationId,{kind:command.kind,value:command.value},{kind:'edit-conversation',value:command.value,version:ConversationVersion(this.conversation.rules.version+1)},command.expectedRevision);
            }
            else if (command.kind === 'attach-home')
                business = { kind: command.kind, roleId: command.roleId };
            else if (command.kind === 'register-home')
                business = { kind: command.kind, targetOperationId: command.targetOperationId };
            else
                return fail('UNSUPPORTED_COMMAND');
            const fp = fingerprint(business);
            if (this.uncertain) {
                if (command.operationId !== this.uncertain)
                    fail('IO_UNCERTAIN');
                await this.load();
                await syncDir(join(this.storagePath, 'commits'));await this.syncHead(command.operationId);
                this.uncertain = null;
            }
            const existing = this.commits.find(x => x.operationId === command.operationId);
            if (existing) {
                if (existing.fingerprint !== fp)
                    fail('OPERATION_CONFLICT');
                this.snapshot = { ...this.snapshot, projection: await this.projection(true) };
                return this.receipt(existing);
            }
            if (command.kind === 'create')
                return fail('CREATE_CONFLICT');
            if (command.kind === 'attach-home') {
                if (command.roleId !== this.roleId)
                    fail('IDENTITY_CONFLICT');
                return this.append(command.kind, command.operationId, fp, { roleId: this.roleId });
            }
            if (command.kind === 'register-home') {
                if (!this.commits.some(x => x.operationId === command.targetOperationId && (x.kind === 'create' || x.kind === 'attach-home')))
                    fail('IDENTITY_CONFLICT');
                return this.append(command.kind, command.operationId, fp, { targetOperationId: command.targetOperationId });
            }
            if (command.expectedRevision !== this.revision)
                fail('REVISION_CONFLICT');
            if (command.kind === 'edit-core') {
                if (command.expectedCoreVersion !== this.snapshot.core.version)
                    fail('CORE_VERSION_CONFLICT');
                return this.append(command.kind, command.operationId, fp, { core: await this.put({ text: command.text }), coreVersion: CoreVersion(this.snapshot.core.version + 1) });
            }
            if (command.expectedSettingsVersion !== this.snapshot.settings.version)
                fail('SETTINGS_VERSION_CONFLICT');
            return this.append(command.kind, command.operationId, fp, { settings: await this.put(command.settings), settingsVersion: InputSettingsVersion(this.snapshot.settings.version + 1) });
        }).finally(()=>{if(dependencyChange)this.pendingOwnerChanges--;});
    }
    close() { return this.run(async () => { if (this.uncertain)
        fail('IO_UNCERTAIN'); await this.release(); this.closed = true; }); }
}
async function identityAt(path: string, recover = false, validateAliases = false): Promise<Identity> { const value = await jsonFile(join(path, 'identity.json'), recover, validateAliases); exact(value, ['formatMajor', 'formatMinor', 'roleId', 'creationOperationId', 'creationFingerprint']);
    // The root identity stays frozen at the creation format; a moved layout is declared by head.json.
    const format = admitRootFormat({major:value.formatMajor,minor:value.formatMinor});
    if (typeof value.roleId !== 'string' || !/^role-[0-9a-f-]{36}$/.test(value.roleId) || typeof value.creationOperationId !== 'string' || typeof value.creationFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(value.creationFingerprint))
    fail('CORRUPT_HOME'); return {format,roleId:RoleId(value.roleId),creationOperationId:op(value.creationOperationId),creationFingerprint:String(value.creationFingerprint)}; }
function backupStore(path:string,roleId:RoleId,io:HomeIO={},releaseAccess?:()=>Promise<void>){return new BackupStore(path,roleId,{io,releaseAccess,acquire:()=>acquire(path,io,'.maintenance.lock'),validate:validateBackupAuthority});}
export async function openRoleHome(input:string,options:{expectedRoleId?:RoleId;io?:HomeIO}={}):Promise<OpenedRoleHome>{return openWriterHome(input,options,false);}
async function openWriterHome(input:string,options:{expectedRoleId?:RoleId;io?:HomeIO},maintenanceRecovery:boolean):Promise<OpenedRoleHome>{
    const path=await canonicalPath(input);await directory(path);if(await realpath(path)!==path)fail('UNSAFE_PATH');
    const releaseAccess=await acquire(path,options.io,'.maintenance.lock');let releaseWriter:(()=>Promise<void>)|undefined;
    try{
        const identity=await identityAt(path,false,true);if(options.expectedRoleId!==undefined&&identity.roleId!==options.expectedRoleId)fail('IDENTITY_CONFLICT');
        const backups=backupStore(path,identity.roleId,options.io,releaseAccess),pending=await backups.pending();
        if(pending.length&&(!maintenanceRecovery||pending.some(record=>record.sourceRevision!==undefined)))fail('MAINTENANCE_PENDING');
        releaseWriter=await acquire(path,options.io);const writerRelease=releaseWriter;
        const home=new DiskHome(path,identity,async()=>{await writerRelease();await backups.writerClosed();},options.io??{},true,backups);
        await new DiskHome(path,identity,async()=>{},{},false).load();await identityAt(path,true);await home.load();await home.syncStorage();await home.syncHead();return home;
    }catch(error){if(releaseWriter)await releaseWriter();await releaseAccess();throw error;}
}
async function validateBackupAuthority(path:string,roleId:RoleId){
    const identity=await identityAt(path,false,true);if(identity.roleId!==roleId)fail('IDENTITY_CONFLICT');
    const home=new DiskHome(path,identity,async()=>{},{},false);await home.load();
    const status=home.formatStatus();
    return {mode:'healthy' as const,reason:'AUTHORITY_VERIFIED',verifiedRoleId:home.roleId,verifiedRevision:home.revision,verifiedFormat:{major:status.format.major,minor:status.format.minor},stops:home.stopSnapshots(),maintenanceSnapshots:home.restoredMaintenanceSnapshotFacts()};
}
/** Read-only integrity verification. It neither imports nor activates the portable copy. */
export async function verifyRoleBackup(destination:string,options:{expectedRoleId?:RoleId;operationId?:OperationId}={}):Promise<BackupProgress>{return verifyBackup(destination,options,validateBackupAuthority);}
/** Owner-only maintenance primitive; copying never activates a Runtime. */
export function restoreRoleBackup(request:RestoreRequest,io:HomeIO={}):Promise<RestoreProgress>{return restoreBackup(request,{validate:validateBackupAuthority,acquire:destination=>acquire(destination,io,'.maintenance.lock'),io});}
export function readRoleRestore(destination:string,request:RestoreRead):Promise<RestoreProgress>{return readRestore(destination,request);}
/** Historical maintenance facts are read-only; foreign destinations are never execution grants. */
export async function readBackupMaintenance(destination:string,options:{expectedRoleId?:RoleId;operationId?:OperationId}={}):Promise<BackupMaintenanceRead>{return readMaintenance(destination,options,validateBackupAuthority);}
export async function createRoleHome(input: string, request: CreateHomeRequest, io: HomeIO = {}): Promise<OpenedRoleHome> {
    op(request.operationId);
    text(request.core);
    settings(request.settings);
    const path = await canonicalPath(input);
    const fp = fingerprint({ kind: 'create', core: request.core, settings: request.settings });
    let created = false;
    try {
        await mkdir(path, { mode: 0o700 });
        created = true;
        await syncDir(dirname(path));
    }
    catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EEXIST')
            throw e;
    }
    if (created) {
        for (const name of ['commits', 'blobs', 'views'])
            await mkdir(join(path, name), { mode: 0o700 });
        await publish(join(path, 'identity.json'), canonicalBytes({ formatMajor: HOME_CURRENT_FORMAT.major, formatMinor: HOME_CURRENT_FORMAT.minor, roleId: RoleId('role-' + randomUUID()), creationOperationId: request.operationId, creationFingerprint: fp }), async () => io.barrier?.('after-identity-publish', { operationId: request.operationId, revision: HomeRevision(0) }));
        await syncDir(path);
    }
    await directory(path);
    if (await realpath(path) !== path)
        fail('UNSAFE_PATH');
    const releaseAccess=await acquire(path,io,'.maintenance.lock');let releaseWriter:(()=>Promise<void>)|undefined;
    try {
        const identity = await identityAt(path, true);
        const backups=backupStore(path,identity.roleId,io,releaseAccess);if((await backups.pending()).length)fail('MAINTENANCE_PENDING');
        releaseWriter=await acquire(path,io);const writerRelease=releaseWriter;const release=async()=>{await writerRelease();await backups.writerClosed();};
        if (identity.creationOperationId !== request.operationId || identity.creationFingerprint !== fp)
            fail('CREATE_CONFLICT');
        await initializeHead(path,identity.roleId);
        const home = new DiskHome(path, identity, release, io,true,backups);
        try {
            await home.load();
            await syncDir(join(path, 'commits'));await home.syncHead(request.operationId);
        }
        catch (e) {
            if (!(e instanceof HomeError) || e.code !== 'INCOMPLETE_HOME')
                throw e;
            await home.initialize(request);
        }
        return home;
    }
    catch (e) {
        if(releaseWriter)await releaseWriter();await releaseAccess();
        throw e;
    }
}

/** Decode and validate Home authority without acquiring a writer or repairing files. */
export async function diagnoseRoleHome(input: string, options: { expectedRoleId?: RoleId } = {}): Promise<HomeDiagnostic> {
    let claimedRoleId: string | null = null;
    let claimedFormat:{major:number;minor:number}|undefined;
    const evidence: { file: string; digest: string; bytes: number }[] = [];
    let path: string;
    try {
        path = await canonicalPath(input); await directory(path); if (await realpath(path) !== path) fail('UNSAFE_PATH');
        // A verified storage generation holds the authority subtree after a physical cleanup; evidence must follow head.
        let generation: string | undefined;
        try {
            const head = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await safeBytes(join(path, 'head.json'), false, true))) as { storage?: { id?: unknown } };
            const id = head.storage?.id; if (typeof id === 'string' && /^generation-[a-f0-9]{64}$/.test(id)) generation = id;
        } catch { /* The failing head read below supplies the diagnostic. */ }
        const areas = generation ? ['', 'content-generations/' + generation + '/commits', 'content-generations/' + generation + '/blobs', 'content-generations/' + generation + '/views', 'content-generations/' + generation + '/projection-progress', 'commits', 'blobs'] : ['', 'commits', 'blobs'];
        for (const area of areas) {
            let names: string[];
            try { if (area) await directory(join(path, area)); names = area ? (await readdir(join(path, area))).filter(name => !name.startsWith('.')).sort() : ['identity.json', 'head.json']; } catch { continue; }
            for (const name of names) {
                if (evidence.length >= 2048) break;
                const relative = area ? area + '/' + name : name;
                try { const bytes = await safeBytes(join(path, relative), false, true); evidence.push({ file: relative, digest: digest(bytes), bytes: bytes.length }); } catch { /* The failing authority read below supplies the diagnostic. */ }
            }
        }
        try { const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await safeBytes(join(path, 'identity.json'), false, true))); if (typeof value.roleId === 'string' && /^role-[0-9a-f-]{36}$/.test(value.roleId)) claimedRoleId = value.roleId; if (Number.isSafeInteger(value.formatMajor) && Number.isSafeInteger(value.formatMinor)) claimedFormat = {major:Number(value.formatMajor),minor:Number(value.formatMinor)}; } catch { /* A claim is optional, never a verified identity. */ }
        const identity = await identityAt(path, false, true);
        if (options.expectedRoleId !== undefined && identity.roleId !== options.expectedRoleId) fail('IDENTITY_CONFLICT');
        let floor:HeadFloor|undefined;
        try { floor=await readHead(path,identity.roleId); } catch { /* The replay below supplies the diagnostic. */ }
        const home = new DiskHome(path, identity, async () => {}, {}, false); await home.load(floor);
        return { mode: 'healthy', reason: 'AUTHORITY_VERIFIED', claimedRoleId, format:{major:home.formatStatus().format.major,minor:home.formatStatus().format.minor}, verifiedRoleId: home.roleId, verifiedRevision: home.revision, recovery: [], evidence };
    } catch (error) {
        const reason = error instanceof HomeError ? error.code : (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'MISSING_AUTHORITY' : 'HOME_UNREADABLE';
        return { mode: 'read-only', reason, claimedRoleId, claimedFormat, verifiedRoleId: null, verifiedRevision: null, recovery: ['retry-open', 'inspect-validated-backup'], evidence };
    }
}
/** Runtime can retain readonly management capabilities without manufacturing a writable Home. */
export async function openRoleHomeForRuntime(input: string, options: { expectedRoleId?: RoleId; io?: HomeIO } = {}): Promise<OpenedRoleHome | DiagnosticRoleHome> {
    // A known fault is diagnosed before any writer takeover or alias cleanup.
    const diagnostic = await diagnoseRoleHome(input, options);
    if (diagnostic.mode === 'read-only') return { kind: 'diagnostic', readDiagnostic: async () => structuredClone(diagnostic), close: async () => {} };
    try { return await openWriterHome(input, options,true); }
    catch (error) {
        const current = await diagnoseRoleHome(input, options);
        const openingReason = error instanceof HomeError ? error.code : 'HOME_UNREADABLE';
        return { kind: 'diagnostic',...(current.verifiedRoleId?{backups:backupStore(await canonicalPath(input),current.verifiedRoleId,options.io)}:{}), readDiagnostic: async () => ({ ...current, mode: 'read-only', reason: current.mode === 'healthy' ? openingReason : current.reason, recovery: ['retry-open', 'inspect-validated-backup'] }), close: async () => {} };
    }
}
