import {restoreRegistrationIds,type RestoreRegistrationRequest} from './restore-registration.ts';
import {restoreInputEligible,restoreRunEligible,restoreRevisionEligible,restoreDeliveryEligible,type RestoreConfirmation,type RestoreAcceptance} from '../home/restore-acceptance.ts';
import {createNodeClock,type ClockPort} from './clock.ts';
export {createNodeClock,ianaDay,type ClockPort,type ClockReading,type IanaDay} from './clock.ts';
import {clockProblem,validAutonomyRules,effectiveAutonomyDay,scheduleBase,nextSlotAfter,nextGridSlot,wakeBlocked,type AutonomySnapshot,type AutonomySchedule,type AutonomyAttributionRun} from '../home/autonomy.ts';
import {createRestoreRuntime,type RestorePort} from './restore.ts';
import type {RestoreRequest,RestoreRead,RestoreProgress} from '../home/restores.ts';
export type {RestorePort} from './restore.ts';
import {currentOutgoingHandover,validateHandoverRequest,type HandoverRequest,type HandoverProgress,type HandoverRecord} from '../home/handovers.ts';
import {HandoverId} from '../home/ids.ts';
export type {HandoverRequest,HandoverProgress} from '../home/handovers.ts';
import type {ProposalRulesSnapshot} from '../home/proposal-rules.ts';
import type {ContactStamp} from '../home/contact.ts';
import type {ContactRulesSnapshot} from '../home/contact-rules.ts';
import {admitCleanupCommand,type CleanupCommand,type CleanupSelection,type CleanupPreview,type CleanupProgress,type CleanupWaiting,type CleanupAdmission} from '../home/cleanup.ts';
export type CleanupView=CleanupProgress|CleanupWaiting;
import {cleanupCatalogPage} from '../host/library-maintenance-view.ts';
import type {CleanupCatalogPage,CleanupCatalogPageRequest} from '../types.library.maintenance.ts';
import {recoverFileEffects} from './file-recovery.ts';
import type {FileAccessSnapshot} from '../home/file-access.ts';
import type {RoleFileCapability} from '../actions/files.ts';
import type {FileRules} from '../home/file-rules.ts';
import type {FileRulesSnapshot} from '../home/file-rules.ts';
export {prepareCharacterContext,fitCharacterContext,searchContextSources} from '../context/index.ts';
import {checkKnowledgeProposal} from '../context/proposals.ts';
import {parseKnowledgeProposal,knowledgeSourceBasis,canonicalProposalRecorded,type KnowledgeProposal,type KnowledgeSnapshot,type ProposalAssessment} from '../home/knowledge.ts';
import {readContextSourcePage,readContextSourcePart,type ContextSourcePageRequest,type ContextSourcePage,type ContextSourceRead,type ContextSourcePart} from '../home/context-snapshot.ts';
import {readLibrarySources as projectLibrarySources} from '../host/library-sources-view.ts';
import type {LibrarySourceQuery,LibrarySourcePage} from '../types.library.sources.ts';
import type {LibraryOverviewData} from '../host/library-overview-view.ts';
import {readLibraryOverviewSources} from '../host/library-overview-view.ts';
import {validateResolveDelivery,SendAttemptId,sameQQTarget,type QQBinding,type DeliveryRulesSnapshot,type DeliveryRecord,type SendAttemptRecord,type DeliveryObservation} from '../home/index.ts';
import type {DeliveryPort,PreparedDelivery} from './delivery.ts';
export type * from './delivery.ts';
import {parseRoleWeb} from '../actions/web.ts';
import {issueWebOperation,type IssuedWebOperation} from './web.ts';
import type {WebRulesSnapshot,WebToolClaim} from '../home/web.ts';
import type {BackupRequest,BackupProgress} from '../home/backups.ts';
import {HOME_FORMATS} from '../home/format.ts';
import type {FormatStatus,HomeFormat} from '../home/format.ts';
import {isFormatUpgradeTerminal,type FormatUpgradeView,type FormatUpgradePreview,type FormatUpgradeProgress,type FormatUpgradeRequest} from '../home/format-upgrade.ts';
export type {FormatUpgradeView} from '../home/format-upgrade.ts';
export type {BackupRequest,BackupProgress} from '../home/backups.ts';
import type {InboundPort} from './inbound.ts';
import {createQQHistoryRuntime,type QQHistoryPort} from './history.ts';
export type {QQHistoryPort,PreparedQQHistoryRead} from './history.ts';
import type {QQHistoryQuery,QQHistorySnapshot} from '../home/qq-history.ts';
export type {InboundPort} from './inbound.ts';
import {runnableInput} from '../home/inputs.ts';
import type {StopRequest,StopReason,StopProgress,StopStep} from '../home/stops.ts';
import type {RetryRulesSnapshot} from '../home/retry-rules.ts';
import {transientModelFailure,type ModelOperationClaim,type ModelPurpose,type ModelFailure} from '../home/model-operations.ts';
import type {ReadRules} from '../home/read-rules.ts';
import {NativeExposureId,RunId,AttemptId,MaterialId,LogicalOpId,type ConversationVersion} from '../home/ids.ts';
import { RoleId, OperationId, HomeRevision } from '../home/ids.ts';
import {createHash,randomUUID} from 'node:crypto';
import type {RoleReadValue,RoleReadRequest,RoleReadGrants,RoleReadContent} from '../actions/read.ts';
import {prepareCharacterContext,searchContextSources,isContextInvalidation} from '../context/index.ts';
import {ExecutionError,safeExecutionCode,type ExecutionPort,type IssuedRunScope,type IssuedModelAttempt} from './execution.ts';
export type * from './execution.ts';
import {validateConversationSettings} from '../home/turns.ts';
import type {AttemptRecord,ConversationState,ConversationSnapshot,TurnRecord,ExecutionRecordRead,ExecutionRecordPage,ReplyRead,ReplyPage,NativeRecord,AttemptOutcome,ToolObservationInput,ToolMaterialBody,ToolMaterial} from '../home/turns.ts';
import type { OpenedRoleHome, HomeSnapshot, HomeCommand, HomeReceipt, HomeOperation,ProjectionId,ProjectionPreview,HomeDiagnostic,DiagnosticRoleHome,PreservedProjection,ReadRulesSnapshot } from '../home/index.ts';
import type { BoundInput, InputReceipt } from '../home/inputs.ts';
export type { BoundInput, InputReceipt } from '../home/inputs.ts';
export type { OpenedRoleHome } from '../home/index.ts';
export interface RoleHomeView extends Pick<HomeSnapshot, 'roleId' | 'revision' | 'core' | 'settings' | 'contextGeneration' | 'creationOperationId' | 'projection' | 'panelBinding' | 'uncertainOperationId'> {
    readonly inputSummary: { readonly total: number; readonly queued: number; readonly running: number; readonly resolved: number; readonly cancelled: number; readonly blocked: number; readonly processing: 'unavailable' | 'available'; };
}
/**
 * Known phases come from Home facts only; an unreadable or unknown layout is `unsupported`.
 * The five panel phases are `compatible`, `needs-upgrade`, `processing`, `failed` and `migrated`.
 */
function projectFormat(home:OpenedRoleHome|undefined,report:HomeDiagnostic|undefined,task?:FormatUpgradeProgress):FormatUpgradeView|undefined{
    const claimed=report?.claimedFormat;
    const status=home&&home.formatStatus?home.formatStatus():undefined;
    const format=status?.format??report?.format??claimed;
    if(!format){
        return undefined;
    }
    const known=HOME_FORMATS.some(candidate=>candidate.major===format.major&&candidate.minor===format.minor);
    if(!known)return {status:'unsupported',format,layout:'root-inline',upgradesAvailable:false};
    if(!status)return {status:report?.mode==='read-only'?'unsupported':'compatible',format,layout:format.major===2?'storage-generation':'root-inline',upgradesAvailable:format.major===1};
    const base={format:status.format,layout:status.layout,upgradesAvailable:status.upgrade.available};
    if(!task)return {status:base.upgradesAvailable?'needs-upgrade':'compatible',...base,target:status.upgrade.to};
    if(task.phase==='failed')return {status:'failed',...base,target:task.to,operationId:task.operationId,phase:task.phase,checkpoint:task.checkpoint,...(task.error?{error:task.error}:{}),...(task.recovery?{recovery:task.recovery}:{})};
    if(task.phase==='switched')return {status:'migrated',...base,format:task.to,layout:'storage-generation',upgradesAvailable:false,target:task.to,operationId:task.operationId,phase:task.phase,checkpoint:task.checkpoint};
    return {status:'processing',...base,target:task.to,operationId:task.operationId,phase:task.phase,checkpoint:task.checkpoint,upgradesAvailable:false,...(task.error?{error:task.error}:{}),...(task.recovery?{recovery:task.recovery}:{})};
}
async function projectHome(home: OpenedRoleHome, available=false): Promise<RoleHomeView> {
    const snapshot = await home.readSnapshot();
    const { inputs, roleId, revision, core, settings, contextGeneration, creationOperationId, projection, panelBinding, uncertainOperationId } = snapshot;
    return { roleId, revision, core, settings, contextGeneration, creationOperationId, projection, panelBinding, ...(uncertainOperationId ? { uncertainOperationId } : {}), inputSummary: { total: inputs.length, queued: inputs.filter(x => x.status === 'queued').length, running: inputs.filter(x => x.status === 'running').length, resolved: inputs.filter(x => x.status === 'resolved').length, cancelled: inputs.filter(x => x.status === 'cancelled').length, blocked: inputs.filter(x => x.status === 'blocked').length, processing: available ? 'available' : 'unavailable' } };
}
/** Runtime capabilities shared by production and controlled adapters. */
export interface RoleView {
    readonly cleanups?:readonly CleanupView[];
    readonly status: 'not-ready' | 'ready' | 'read-only' | 'stopping' | 'stopped';
    readonly reason: string;
    readonly stop?:StopProgress;
    readonly backups?:readonly BackupProgress[];
    readonly roleId: RoleId | null;
    readonly revision: HomeRevision | null;
    readonly home?: RoleHomeView;
    readonly diagnostic?:HomeDiagnostic;
    readonly execution?:Awaited<ReturnType<ExecutionPort['inspect']>>;
    readonly schedule?:ScheduleView;
    readonly format?:FormatUpgradeView;
}
/** Execution is attached only to the same writable Home lifetime. */
export interface RuntimeTimer {readonly id:number;}
export interface TimerPort { setTimeout(run:()=>void,delayMs:number):RuntimeTimer; clearTimeout(timer:RuntimeTimer):void; }
export const defaultTimers:TimerPort={setTimeout:(run,delayMs)=>({id:Number(setTimeout(run,delayMs))}),clearTimeout:timer=>clearTimeout(timer.id)};
export interface RolePorts { readonly clock?:ClockPort; readonly readOnlyAdmission?:'RESTORE_LOCAL_REGISTRATION_REQUIRED'; readonly restore?:RestorePort; readonly history?:QQHistoryPort; readonly inbound?:InboundPort; readonly delivery?:DeliveryPort; readonly execution?: ExecutionPort; readonly files?:RoleFileCapability; readonly now?:()=>Date; readonly timers?:TimerPort; }
export interface WakeHint {
    readonly operationId?:OperationId;
    readonly reason?: string;
}
export interface ScheduleView {
    readonly intervalMs:number;
    readonly paused:boolean;
    readonly pausedAt:string|null;
    readonly anchorAt:string;
    readonly lastSlotAt:string|null;
    readonly nextOpportunityAt:string;
    readonly missedSlots:number;
    readonly armed:boolean;
    readonly lastSkipReason:string|null;
}
export type WakeReceipt = {readonly kind:'skipped';readonly reason:string}|{readonly kind:'accepted';readonly opportunityId:OperationId;readonly requestedAt:string};
export type OwnerCommand = HomeCommand;
export type OwnerReceipt = HomeReceipt | {
    readonly operationId: OperationId;
    readonly kind: 'unavailable';
    readonly reason: string;
};
export type OperationView = HomeOperation;
export interface RoleRuntime {
    receive(input: BoundInput): Promise<InputReceipt>;
    wake(hint: WakeHint): Promise<WakeReceipt>;
    inspect(): Promise<Readonly<RoleView>>;
}
export interface RoleOwner {
    readLibraryOverviewFacts():Promise<LibraryOverviewData>;
    readCleanupCatalog(page:CleanupCatalogPageRequest):Promise<CleanupCatalogPage>;
    previewCleanup(selection:CleanupSelection):Promise<CleanupPreview>;
    requestCleanup(request:CleanupCommand):Promise<CleanupView>;
    readCleanup(operationId:OperationId):Promise<CleanupView|{readonly operationId:OperationId;readonly phase:'not-found'}>;
    completeRestoreRegistration(request:RestoreRegistrationRequest):Promise<HomeReceipt>;
    confirmRestore(request:RestoreConfirmation):Promise<RestoreAcceptance>;
    requestRestore(request:RestoreRequest):Promise<RestoreProgress>;
    readRestore(destination:string,request:RestoreRead):Promise<RestoreProgress>;
    requestHandover(request:HandoverRequest):Promise<HandoverProgress>;
    readHandover(operationId:OperationId):Promise<HandoverProgress>;
    queryQQHistory(request:{readonly operationId:OperationId;readonly expectedBindingVersion?:import('../home/ids.ts').BindingVersion}):Promise<QQHistoryQuery>;
    readQQHistory():Promise<QQHistorySnapshot>;
    selectQQHistory(request:import('../home/qq-history.ts').SelectQQHistory):Promise<import('../home/qq-history.ts').QQHistorySelection>;
    previewFormatUpgrade():Promise<FormatUpgradePreview>;
    requestFormatUpgrade(request:FormatUpgradeRequest):Promise<FormatUpgradeProgress>;
    readFormatUpgrade(operationId:OperationId):Promise<FormatUpgradeProgress|{readonly operationId:OperationId;readonly phase:'not-found'}>;
    resumeFormatUpgrade(request:FormatUpgradeRequest):Promise<FormatUpgradeProgress>;
    requestBackup(request:BackupRequest):Promise<BackupProgress>;
    readBackup(operationId:OperationId):Promise<BackupProgress>;
    verifyBackup(operationId:OperationId):Promise<BackupProgress>;
    resumeBackup(request:BackupRequest):Promise<BackupProgress>;
    stop(request:StopRequest):Promise<HomeOperation>;
    retryArchives():Promise<{readonly pending:number;readonly revision:HomeRevision|null}>;
    previewProjection(projectionId:ProjectionId):Promise<ProjectionPreview>;
    readDiagnostic():Promise<HomeDiagnostic>;
    readPreservedProjection(operationId:OperationId):Promise<PreservedProjection>;
    apply(command: OwnerCommand): Promise<OwnerReceipt>;
    readOperation(operationId: OperationId): Promise<Readonly<OperationView>>;
    readConversation():Promise<ConversationSnapshot>;
    readKnowledge():Promise<KnowledgeSnapshot>;
    readAutonomy():Promise<AutonomySnapshot>;
    readAutonomyAttribution(request:{readonly runId?:RunId}):Promise<readonly AutonomyAttributionRun[]>;
    readProposalRules():Promise<ProposalRulesSnapshot>;
    readFileAccess():Promise<FileAccessSnapshot>;
    readFileRules():Promise<FileRulesSnapshot>;
    readReadRules():Promise<ReadRulesSnapshot>;
    readDeliveryRules():Promise<DeliveryRulesSnapshot>;
    readRetryRules():Promise<RetryRulesSnapshot>;
    readContactRules():Promise<ContactRulesSnapshot>;
    readContactState():Promise<{readonly state:ConversationSnapshot;readonly stamp:ContactStamp|undefined;readonly lastBlockedReason:string|null}>;
    readWebRules():Promise<WebRulesSnapshot>;
    readExecutionRecord(request:ExecutionRecordRead):Promise<ExecutionRecordPage>;
    readReply(request:ReplyRead):Promise<ReplyPage>;
    readContextSources(page:ContextSourcePageRequest):Promise<ContextSourcePage>;
    readContextSource(request:ContextSourceRead):Promise<ContextSourcePart>;
    readLibrarySources(request:LibrarySourceQuery):Promise<LibrarySourcePage>;
}
export interface StoppedRole {
    readonly status: 'stopped';
    readonly reason: string;
}
export interface RoleLifetime {
    requestStop(reason: 'owner-stop' | 'unload' | 'migration'): void;
    readonly stopped: Promise<StoppedRole>;
}
export interface RunningRole {
    readonly runtime: RoleRuntime;
    readonly owner: RoleOwner;
    readonly lifetime: RoleLifetime;
}
/** One Home owns admission, durable attempts, replies and the running lifetime. */
function recordedNativeEvent(value:unknown){
    if(!value||typeof value!=='object'||Array.isArray(value))return undefined;
    const type='type' in value&&typeof value.type==='string'?value.type:undefined;
    const sessionId='sessionId' in value&&typeof value.sessionId==='string'?value.sessionId:undefined;
    const seq='seq' in value&&typeof value.seq==='number'&&Number.isSafeInteger(value.seq)?value.seq:undefined;
    const data='data' in value&&value.data&&typeof value.data==='object'?value.data:undefined;
    const callId=data&&'callId' in data&&typeof data.callId==='string'?data.callId:undefined;
    const sourceEventSeqs='sourceEventSeqs' in value&&Array.isArray(value.sourceEventSeqs)?value.sourceEventSeqs.filter((entry:unknown):entry is number=>typeof entry==='number'&&Number.isSafeInteger(entry)):[];
    return {type,sessionId,seq,callId,sourceEventSeqs};
}
async function recoverNativeGaps(home:OpenedRoleHome,turn:TurnRecord,state:ConversationSnapshot){
    for(const record of state.nativeRecords.filter(x=>x.runId===turn.runId&&x.provenance==='native-session')){
        const raw=recordedNativeEvent(record.data);if(raw?.type!=='tool/call'||!raw.callId)continue;const callId=raw.callId;
        // Only an explicit span from the same issued technical Session proves this exposure closed.
        // Legacy records without that evidence retain an honest gap; callId may repeat across steps/Sessions.
        const closed=raw.sessionId!==undefined&&raw.seq!==undefined&&state.nativeRecords.some(x=>{const data=recordedNativeEvent(x.data);return x.runId===turn.runId&&x.provenance==='native-session'&&data?.type==='tool/result'&&data.sessionId===raw.sessionId&&data.sourceEventSeqs.some(seq=>seq===raw.seq);});
        const gap=state.nativeRecords.some(x=>(x.data as {sourceNativeId?:string}).sourceNativeId===record.nativeId);
        if(!closed&&!gap)await home.recordNative({operationId:OperationId('gap-'+createHash('sha256').update(turn.runId+record.nativeId).digest('hex')),record:{runId:turn.runId,nativeId:NativeExposureId('interrupted-'+record.nativeId),provenance:'native-session',data:{kind:'native-exposure-gap',sourceNativeId:record.nativeId,callId,reason:'PROCESS_INTERRUPTED',toolAdmission:'unavailable'}}});
    }
}
async function recoverPendingAttempts(home:OpenedRoleHome,turn:TurnRecord,state:ConversationSnapshot){
    for(const old of state.attempts.filter(x=>x.runId===turn.runId&&!x.outcome))await home.recordAttempt({operationId:OperationId('recover-'+old.attemptId),attemptId:old.attemptId,outcome:{kind:old.enteredAt?'failed':'not-dispatched',code:'PROCESS_INTERRUPTED'}});return recoverFileEffects(home,turn,state);
}
export async function startRole(capability: OpenedRoleHome | DiagnosticRoleHome | undefined, ports: RolePorts): Promise<RunningRole> {
    let activationReadHome:OpenedRoleHome|undefined;
    if(capability&&'readSnapshot' in capability){const diagnostic=await capability.readActivationDiagnostic?.()??(ports.readOnlyAdmission?{...await capability.readDiagnostic(),mode:'read-only' as const,reason:ports.readOnlyAdmission,recovery:['complete-local-registration']}:undefined);if(diagnostic){const readonlyHome=capability;activationReadHome=readonlyHome;capability={kind:'diagnostic',readDiagnostic:async()=>{const current=await readonlyHome.readActivationDiagnostic?.();return current??{...await readonlyHome.readDiagnostic(),mode:'read-only',reason:readonlyHome.restoreAcceptanceSnapshot()?'RESTORE_ACCEPTED_REOPEN_REQUIRED':'RESTORE_ADMISSION_RECHECK_REQUIRED',recovery:['complete-local-registration']};},close:()=>readonlyHome.close()};}}
    const home=capability&&'readSnapshot' in capability?capability:undefined;
    const execution=home?ports.execution:undefined;
    const restored=home?.restoreAcceptanceSnapshot();
    const backups=(home??activationReadHome)?.backups??capability?.backups;let maintenancePending=!!(await backups?.pending())?.length;
    let cleanupSealed=!!home?.cleanupSnapshots().some(task=>task.phase!=='complete');
    // A durable non-terminal format upgrade seals the lifetime exactly like a pending cleanup.
    let formatUpgradeSealed=false;
    const sealed=()=>cleanupSealed||formatUpgradeSealed;
    const cleanupRuns=new Map<OperationId,{readonly request:CleanupCommand;view:CleanupView;task?:Promise<void>}>();
    const backupRequests=new Map<OperationId,{readonly destination:string;readonly task:Promise<BackupProgress>}>();
    const backupRuns=new Map<OperationId,Promise<void>>(),backupErrors=new Map<OperationId,string>();
    let status:RoleView['status']='not-ready', stopReason='', fault='',archiveFault='',lifecycleFault='',blockedTurnReason='',blockedTurn:TurnRecord|undefined, working:Promise<void>|undefined,currentAbort:AbortController|undefined,reschedule=false;
    const clock=ports.clock??createNodeClock(ports.now);
    const now=()=>{if(ports.clock){try{return new Date(clock.read().utc).toISOString();}catch{/* UTC fallback keeps normal user work available; autonomous admission still requires the ClockPort. */}}return (ports.now?.()??new Date()).toISOString();};
    const autonomyStamp=async()=>{if(!home)throw new ExecutionError('HOME_UNAVAILABLE');const state=await home.readAutonomy(),reading=clock.read();return {snapshotVersion:1 as const,clock:reading,day:effectiveAutonomyDay(state,reading,clock.day(reading.utc,state.rules.value.timeZone)),rulesVersion:state.rules.version};};
    /**
     * A contact needs local wall-clock minutes for quiet hours. The ClockPort is the only source of that
     * conversion (real Node ICU/IANA); a caller-supplied offset never enters this stamp.
     */
    const contactStamp=async():Promise<ContactStamp>=>{
        if(!home)throw new ExecutionError('HOME_UNAVAILABLE');
        const state=await home.readAutonomy(),reading=clock.read(),rules=await home.readContactRules();
        if(!clock.local)throw new ExecutionError('CLOCK_LOCAL_UNAVAILABLE');
        const local=clock.local(reading.utc,state.rules.value.timeZone);
        return {snapshotVersion:1 as const,clock:reading,day:effectiveAutonomyDay(state,reading,clock.day(reading.utc,state.rules.value.timeZone)),localMinutes:local.localMinutes,rulesVersion:rules.version};
    };
    /** The contact projection needs the same trusted stamp; unavailable clocks never fail the read. */
    const contactReadStamp=async():Promise<ContactStamp|undefined>=>{try{return await contactStamp();}catch{return undefined;}};
    let homeClosed=false,homeReleased!:()=>void;const homeRelease=new Promise<void>(resolve=>homeReleased=resolve);execution?.retainRecordingUntil?.(homeRelease);
    let activeStopId:OperationId|undefined,stopRequest:Promise<void>|undefined,stopTask:Promise<void>|undefined,stopOperation:HomeOperation|undefined,stopError='',stopStep:StopStep='actions';
    const retainedStops=new Map<OperationId,HomeOperation>();
    const retainedCleanups=new Map<OperationId,CleanupView>();
    const retainedFormatUpgrades=new Map<OperationId,FormatUpgradeProgress>();
    let formatUpgradeTask:FormatUpgradeProgress|undefined;
    let activeHandover:HandoverRecord|undefined;
    const retainedHandovers=new Map<OperationId,HandoverRecord>();
    const handoverRequests=new Map<OperationId,{destination:string;task:Promise<HandoverProgress>}>();
    const handoverIntents=new Map<OperationId,{readonly request:HandoverRequest;sealed:boolean;error?:string}>();
    const handoverRecoveryWrites=new Map<OperationId,Promise<void>>();
    if(home){
        // A durable non-terminal upgrade seals this lifetime until the original operation continues.
        const upgrade=await home.pendingFormatUpgrade();
        if(upgrade){formatUpgradeTask=upgrade;if(!isFormatUpgradeTerminal(upgrade.phase))formatUpgradeSealed=true;}
    }
    let retainedHome=home?await projectHome(home):activationReadHome?await projectHome(activationReadHome):undefined;
    let resolveStopped!:(v:StoppedRole)=>void;const stopped=new Promise<StoppedRole>(r=>resolveStopped=r);
    if(home&&execution?.restoreOwnership){const history=await home.readConversation();execution.restoreOwnership(history.attempts.flatMap(attempt=>{const data=attempt.outcome?.data as {request?:{sessionId?:unknown}}|undefined;const id=data?.request?.sessionId;return typeof id==='string'&&id.length<=512?[id]:[];}));}
    let ready=home&&execution?(await execution.inspect()).available:false;
    status=capability&&!home?'read-only':ready?'ready':'not-ready';
    let reason=home?execution?(ready?'ready':(await execution.inspect()).reason):'execution-unavailable':capability?'read-only-home':'home-not-open';
    let availabilityReason=reason;
    let exclusiveFileSlot:AttemptId|undefined;const waitingFileWriters=new Set<AttemptId>();
    const readSlots=new Set<AttemptId>(),slotWaiters=new Set<()=>void>();
    const wakeSlots=()=>{for(const wake of slotWaiters)wake();slotWaiters.clear();};
    const bodies=new Set<Promise<void>>(),finals=new Map<AttemptId,Promise<void>>();
    const quiesceTools=async()=>{while(bodies.size)await Promise.all([...bodies]);while(finals.size)await Promise.all([...finals.values()]);await drain();};
    const afterTools=(action:()=>void)=>{if(!bodies.size&&!finals.size&&!toolDebts.size)action();else void quiesceTools().then(action).catch(()=>{});};
    const debts=new Set<Promise<void>>(),toolDebts=new Set<Promise<void>>();
    interface ArchiveJob {save:()=>Promise<void>;task:Promise<void>;code:string;toolLifetime:boolean;}
    const archives=new Map<OperationId,Set<ArchiveJob>>();
    const archiveJobs=()=>[...archives].flatMap(([operationId,jobs])=>[...jobs].map(job=>({operationId,job})));
    const removeArchive=(operationId:OperationId,job:ArchiveJob)=>{const jobs=archives.get(operationId);if(!jobs)return;jobs.delete(job);if(!jobs.size&&archives.get(operationId)===jobs)archives.delete(operationId);};
    function archive(operationId:OperationId,save:()=>Promise<void>,toolLifetime=false):Promise<void>{
        const job:ArchiveJob={save,task:Promise.resolve(),code:'',toolLifetime},jobs=archives.get(operationId)??new Set<ArchiveJob>();jobs.add(job);archives.set(operationId,jobs);
        job.task=Promise.resolve().then(save);debts.add(job.task);if(toolLifetime)toolDebts.add(job.task);
        void job.task.then(()=>{debts.delete(job.task);toolDebts.delete(job.task);removeArchive(operationId,job);},error=>{job.code=safeExecutionCode(error);archiveFault=archiveFault||job.code;});return job.task;
    }

    const drain=async()=>{while(debts.size)await Promise.all([...debts]);if(fault||archiveFault)throw new ExecutionError(archiveFault||fault);};
    let autonomyWakeIssued=false,autonomyEpoch=0,receivingInputs=0,activeAutonomous:AbortController|undefined;
    const timers=ports.timers??defaultTimers;
    let schedulerTimer:RuntimeTimer|undefined,schedulersRunning=false,schedulerSkipReason:string|null=null,schedulerNextAt:string|undefined,schedulerArmed=false;
    function clearScheduler(){if(schedulerTimer!==undefined){timers.clearTimeout(schedulerTimer);schedulerTimer=undefined;schedulerArmed=false;}}
    const schedulableSchedule=(schedule:AutonomySchedule)=>({...schedule});
    const sealAutonomy=()=>{autonomyEpoch++;const active=activeAutonomous;if(active)afterTools(()=>active.abort('AUTONOMOUS_PREEMPTED'));wakeSlots();};
    const writable=()=>!maintenancePending&&(status==='ready'||status==='not-ready');
    const restoreRuntime=createRestoreRuntime(ports.restore,()=>!home&&status!=='stopping'&&status!=='stopped');
    const readHome=():OpenedRoleHome=>{if(!homeClosed&&home&&writable())return home;if(!homeClosed&&activationReadHome&&status==='read-only')return activationReadHome;throw new ExecutionError('HOME_UNAVAILABLE');};
    async function receiveInput(input:BoundInput):Promise<InputReceipt>{if(sealed())return {kind:'rejected',reason:'stopping'};sealAutonomy();receivingInputs++;try{return await receiveBoundInput(input);}finally{receivingInputs--;schedule();}}
    async function receiveBoundInput(input:BoundInput):Promise<InputReceipt>{
                if(maintenancePending||sealed())return {kind:'rejected',reason:'stopping'};
                if(!writable())return {kind:'rejected',reason:status==='read-only'?'read-only':'stopping'};
                if(home&&!input.bindingId&&Buffer.byteLength(input.text,'utf8')>(await home.readSnapshot()).settings.value.inputLimitBytes)return {kind:'rejected',reason:'input-too-large'};
                if(!home||!input.bindingId)return {kind:'rejected',reason:'not-ready'};
                try {const receipt=await home.acceptInput(input);schedule();return receipt;}
                catch(error){const code=safeExecutionCode(error);if(code==='READ_ONLY_HOME')status='read-only';if(code==='IO_UNCERTAIN')return {kind:'uncertain',operationId:error instanceof Error&&'operationId' in error&&typeof error.operationId==='string'?OperationId(error.operationId):input.operationId,reason:'IO_UNCERTAIN'};const reason=code==='READ_ONLY_HOME'?'read-only':code==='INPUT_TOO_LARGE'?'input-too-large':code==='INPUT_NOT_BOUND'?'not-bound':code==='INPUT_KEY_CONFLICT'?'key-conflict':code==='OPERATION_CONFLICT'?'operation-conflict':['INVALID_INPUT','INVALID_VALUE','INVALID_OPERATION_ID'].includes(code)?'invalid-input':'storage-error';return {kind:'rejected',operationId:input.operationId,reason,errorCode:code};}
            }
    function historyWait(pending:Promise<void>,signal:AbortSignal):Promise<void>{
        if(signal.aborted)return Promise.reject(new ExecutionError(typeof signal.reason==='string'?signal.reason:'QQ_HISTORY_ADMISSION_CHANGED'));
        return new Promise<void>((resolve,reject)=>{const cancel=()=>{signal.removeEventListener('abort',cancel);reject(new ExecutionError(typeof signal.reason==='string'?signal.reason:'QQ_HISTORY_ADMISSION_CHANGED'));};signal.addEventListener('abort',cancel,{once:true});void pending.then(()=>{signal.removeEventListener('abort',cancel);resolve();},error=>{signal.removeEventListener('abort',cancel);reject(error);});});
    }
    async function historyLocalIdle(target:QQBinding,signal:AbortSignal):Promise<void>{
        for(;;){if(signal.aborted)throw new ExecutionError(typeof signal.reason==='string'?signal.reason:'QQ_HISTORY_ADMISSION_CHANGED');if(!writable()||!home||homeClosed||sealed())throw new ExecutionError('ROLE_STOPPING');if(!sameQQTarget((await home.readSnapshot()).qqBinding,target))throw new ExecutionError('QQ_BINDING_CHANGED');
            if(working){await historyWait(working,signal);continue;}if(deliveryScheduler){await historyWait(deliveryScheduler,signal);continue;}const send=sendingTasks.get(deliveryLane(target));if(send){await historyWait(send,signal);continue;}return;
        }
    }
    const historyRuntime=home?createQQHistoryRuntime({home,port:ports.history,now,archive,receive:receiveInput,guard:async()=>{if(!writable()||homeClosed||sealed())throw new ExecutionError('ROLE_STOPPING');if(blockedTurn)throw new ExecutionError('TURN_FINALIZATION_PENDING');if(startupPending||!startupRecovered)throw new ExecutionError('STOP_RECOVERY_PENDING');await drain();},localIdle:historyLocalIdle}):undefined;
    const diagnostic=async():Promise<HomeDiagnostic>=>{
        if(status==='stopping'||status==='stopped')return {mode:'read-only',reason:status,claimedRoleId:home?.roleId??null,verifiedRoleId:null,verifiedRevision:null,recovery:[],evidence:[]};
        const result=capability?await capability.readDiagnostic():{mode:'read-only' as const,reason:'HOME_NOT_OPEN',claimedRoleId:null,verifiedRoleId:null,verifiedRevision:null,recovery:[],evidence:[]};
        if(capability&&result.mode==='read-only'&&writable())status='read-only';return result;
    };
    let recovering=true,startupPending=false,startupRecovered=true,lastContactBlocked:string|null=null;let deliveryScheduler:Promise<void>|undefined,deliveryReschedule=false;const sendingTasks=new Map<string,Promise<void>>(),queuedDeliveryLanes=new Set<string>(),abandonedSends=new Set<SendAttemptId>();
    const deliveryPort=home?ports.delivery:undefined;
    const deliveryLane=(binding:QQBinding)=>JSON.stringify([binding.bindingId,binding.version,binding.connectionId,binding.accountId,binding.peerId]);
    async function sendPending(binding:QQBinding){
        if(!home||!deliveryPort||!writable()||sealed()||fault||archiveFault||blockedTurn)return;
        for(;;){
            if(!writable()||sealed()||fault||archiveFault||blockedTurn)return;
            const snapshot=await home.readSnapshot(),state=await home.readConversation();if(!writable()||sealed()||fault||archiveFault||blockedTurn||!sameQQTarget(snapshot.qqBinding,binding))return;if(snapshot.uncertainOperationId)return;if(snapshot.revision!==state.revision)continue;
            // Order matters: a user reply always goes first, so a blocked contact never starves it.
            const eligible=(d:DeliveryRecord)=>restoreDeliveryEligible(restored,d,state)&&d.status==='pending'&&sameQQTarget(binding,d.target)&&deliveryPort!.canSend(d.target);
            const candidate=state.deliveries.find(d=>d.qualification==='main-reply'&&eligible(d))??state.deliveries.find(d=>d.qualification==='contact'&&eligible(d));
            if(!candidate)return;
            const delivery=candidate;
            const id=SendAttemptId('send-'+randomUUID()),operationId=OperationId('begin-delivery-'+id);let attempt:SendAttemptRecord|undefined;
            const contact=candidate.qualification==='contact';
            let stamp:ContactStamp|undefined,deliveryNow:string;
            if(contact){try{stamp=await contactStamp();deliveryNow=stamp.clock.utc;}catch(error){const code=safeExecutionCode(error);if(!['CLOCK_LOCAL_UNAVAILABLE','CLOCK_UNAVAILABLE','IANA_DATA_CHANGED','CLOCK_ROLLBACK','HOME_UNAVAILABLE'].includes(code))throw error;return;}}else deliveryNow=now();
            try{await archive(operationId,async()=>{try{attempt=await home!.beginDelivery({operationId,deliveryId:candidate.deliveryId,sendAttemptId:id,expectedRevision:state.revision,expectedRulesVersion:state.deliveryRules.version,now:deliveryNow,...(contact&&stamp&&candidate.contactIntentId?{contact:{stamp,intentId:candidate.contactIntentId}}:{})});}catch(error){
                const code=safeExecutionCode(error);
                if(contact)lastContactBlocked=code;
                // A blocked contact ends this lane instead of spinning; the next schedule()/wake retries.
                if(['REVISION_CONFLICT','DELIVERY_RULES_VERSION_CONFLICT','DELIVERY_NOT_PENDING','QQ_BINDING_CHANGED','CONTACT_QUIET_HOURS','CONTACT_COOLDOWN','CONTACT_DAILY_LIMIT','CONTACT_ROUND_LIMIT','CONTACT_INTENT_CLOSED','CONTACT_RULES_CHANGED','AUTONOMOUS_REST','AUTONOMY_PAUSED','CLOCK_ROLLBACK','IANA_DATA_CHANGED','CLOCK_UNAVAILABLE'].includes(code))return;
                throw error;}});}catch{abandonedSends.add(id);return;}
            if(!attempt)return;if(contact)lastContactBlocked=null;let dispatched=false;const savedAttempt=attempt;
            const prepared:PreparedDelivery=Object.freeze({delivery:structuredClone(delivery),attempt:structuredClone(savedAttempt),async invoke<T>(effect:()=>Promise<T>):Promise<T>{const admission=home.admission;if(dispatched||admission.contextGeneration!==snapshot.contextGeneration||!writable()||fault||archiveFault||blockedTurn||admission.pendingOwnerChange||!deliveryPort.canSend(delivery.target)||Date.parse(now())>=Date.parse(savedAttempt.deadline))throw new ExecutionError('SEND_NOT_DISPATCHED');dispatched=true;return effect();}});
            let observation:DeliveryObservation;try{observation=await deliveryPort.send(prepared);if(!dispatched&&observation.kind!=='rejected')observation={kind:'rejected',code:'SEND_NOT_DISPATCHED'};}catch{observation={kind:dispatched?'unknown':'rejected',code:dispatched?'QQ_SEND_UNCERTAIN':'SEND_NOT_DISPATCHED'};}
            const stable=structuredClone(observation);await archive(OperationId('settle-'+id),()=>home.settleDelivery({operationId:OperationId('settle-'+id),sendAttemptId:id,observation:stable}));
        }
    }
    function scheduleDelivery(){
        const owner=home,port=deliveryPort;if(!owner||!port||!writable()||sealed()||archiveFault||fault)return;if(deliveryScheduler){deliveryReschedule=true;return;}
        const task:Promise<void>=Promise.resolve().then(async()=>{const binding=(await owner.readSnapshot()).qqBinding;if(!binding||!writable()||sealed()||fault||archiveFault||blockedTurn||!port.canSend(binding))return;
            const key=deliveryLane(binding);if(sendingTasks.has(key)){queuedDeliveryLanes.add(key);return;}
            const send:Promise<void>=Promise.resolve().then(()=>sendPending(binding)).catch(error=>{if(!archiveFault)fault=safeExecutionCode(error);}).finally(()=>{if(sendingTasks.get(key)===send)sendingTasks.delete(key);if(queuedDeliveryLanes.delete(key))scheduleDelivery();});sendingTasks.set(key,send);
        }).catch(error=>{if(!archiveFault)fault=safeExecutionCode(error);}).finally(()=>{if(deliveryScheduler===task)deliveryScheduler=undefined;if(deliveryReschedule){deliveryReschedule=false;scheduleDelivery();}});deliveryScheduler=task;
    }
    const unlistenDelivery=deliveryPort?.onAvailability?.(()=>{scheduleDelivery();schedule();});
    if(home){for(const attempt of (await home.readConversation()).sendAttempts.filter(a=>!a.observation))await archive(OperationId('recover-send-'+attempt.sendAttemptId),()=>home.settleDelivery({operationId:OperationId('recover-send-'+attempt.sendAttemptId),sendAttemptId:attempt.sendAttemptId,observation:{kind:'unknown',code:'PROCESS_INTERRUPTED'}}));}

    const completeStartup=()=>{void historyRuntime?.activate();if(maintenancePending){reason='BACKUP_MAINTENANCE_PENDING';return;}if(sealed()){reason=formatUpgradeSealed?'FORMAT_UPGRADE_PENDING':'SOURCE_CLEANUP_PENDING';return;}if(startupRecovered&&!fault&&!archiveFault&&status==='not-ready'){status=ready?'ready':'not-ready';reason=ready?'ready':availabilityReason;}};
    async function work() {
        if(!home||!execution||status!=='ready'||fault||archiveFault||blockedTurn||maintenancePending||sealed())return;
        while(status==='ready'&&!fault&&!archiveFault&&!blockedTurn&&!sealed()) {
            const snapshot=await home.readSnapshot(), state=await home.readConversation();
            let turn=state.turns.find(x=>x.status==='running'&&restoreRunEligible(restored,x.runId));
            if(turn&&recovering){await recoverNativeGaps(home,turn,state);if(turn.source==='autonomous'){await recoverPendingAttempts(home,turn,state);await home.suspendAutonomous({operationId:OperationId('recover-autonomous-'+turn.runId),runId:turn.runId,reason:'PROCESS_INTERRUPTED'});recovering=false;continue;}}
            recovering=false;

            const queued=snapshot.inputs.filter(x=>x.status==='queued'&&restoreInputEligible(restored,x));
            const first=queued.find(x=>runnableInput(x,!!deliveryPort&&!!snapshot.qqBinding&&deliveryPort.canSend(snapshot.qqBinding)));
            if(!turn&&!first){if(receivingInputs||!autonomyWakeIssued||!state.autonomy.pending)return;try{const stamp=await autonomyStamp();turn=await home.beginAutonomous({operationId:OperationId('autonomous-'+randomUUID()),runId:RunId('run-'+randomUUID()),expectedRevision:state.revision,now:stamp.clock.utc,stamp});}catch(error){const code=safeExecutionCode(error);if(code==='REVISION_CONFLICT')continue;if(['AUTONOMOUS_MODEL_LIMIT','AUTONOMOUS_REST','CLOCK_ROLLBACK','IANA_DATA_CHANGED','CLOCK_UNAVAILABLE','AUTONOMY_RULES_CHANGED'].includes(code))return;throw error;}}
            if(!turn){const group=[];for(const x of queued.slice(queued.indexOf(first!))){if(group.length===8||x.bindingId!==first!.bindingId||x.bindingVersion!==first!.bindingVersion)break;group.push(x.inputId);}try{turn=await home.beginTurn({operationId:OperationId('begin-'+randomUUID()),inputIds:group,runId:RunId('run-'+randomUUID()),expectedRevision:snapshot.revision,now:now()});}catch(e){if(safeExecutionCode(e)==='REVISION_CONFLICT')continue;throw e;}}
            // Forced-exit reservations stay charged. No native stack or lost output is replayed.
            if(await recoverPendingAttempts(home,turn,state)){const latest=await home.readSnapshot(),input=latest.inputs.find(item=>item.inputId===turn.inputIds[0]),revoked=input?.channel==='qq'&&(!latest.qqBinding||latest.qqBinding.bindingId!==turn.bindingId||latest.qqBinding.version!==turn.bindingVersion);if(!revoked&&turn.contextGeneration!==latest.contextGeneration)await home.refreshTurnContext({operationId:OperationId('file-recovery-refresh-'+turn.runId),runId:turn.runId,previousGeneration:turn.contextGeneration,nextGeneration:latest.contextGeneration});await home.finishTurn({operationId:OperationId('file-recovery-finish-'+turn.runId),runId:turn.runId,contextGeneration:revoked?turn.contextGeneration:latest.contextGeneration,outcome:{kind:'failure',reason:revoked?'QQ_BINDING_CHANGED':'FILE_ACTION_RECONCILIATION_REQUIRED'}});continue;}
            const abort=new AbortController();currentAbort=abort;const timer=setTimeout(()=>{runFault=runFault||'TURN_DEADLINE';afterTools(()=>abort.abort());},Math.max(1,Date.parse(turn.deadline)-Date.parse(now())));
            const currentTurn=turn,issuedEpoch=autonomyEpoch,issuedAutonomyRulesVersion=state.autonomy.rules.version;let runFault='';const preempted=()=>currentTurn.source==='autonomous'&&(issuedEpoch!==autonomyEpoch||receivingInputs>0||home.admission.autonomyRulesVersion!==issuedAutonomyRulesVersion);if(currentTurn.source==='autonomous')activeAutonomous=abort;const grantedMaterials=new Map<MaterialId,ToolMaterial>();
            const dispatchClock=():Promise<void>|undefined=>{if(currentTurn.source!=='autonomous')return;const reading=clock.read(),problem=clockProblem(home.admission.autonomyClock,reading);if(problem)return home.checkAutonomyClock({operationId:OperationId('clock-dispatch-'+randomUUID()),clock:reading}).then(()=>{throw new ExecutionError(problem);});};
            const bindingRevoked=(snapshot:HomeSnapshot)=>snapshot.inputs.find(input=>input.inputId===currentTurn.inputIds[0])?.channel==='qq'&&(!snapshot.qqBinding||snapshot.qqBinding.bindingId!==currentTurn.bindingId||snapshot.qqBinding.version!==currentTurn.bindingVersion);
            const issueSources=async()=>{let reader:import('../home/context-snapshot.ts').ContextSnapshotReader|undefined;try{const readSnapshot=await home.readSnapshot(),currentInputs=currentTurn.inputIds.map(id=>{const input=readSnapshot.inputs.find(input=>input.inputId===id);if(!input||input.status!=='running'||input.bindingId!==currentTurn.bindingId||input.bindingVersion!==currentTurn.bindingVersion)throw new ExecutionError('INPUT_SCOPE_CHANGED');return input;});reader=await home.openContextReader({purpose:currentInputs.some(input=>input.contextPurpose==='history')?'history':'daily',runId:currentTurn.runId});return {readSnapshot,currentInputs,contextReader:reader,grantedSources:await reader.list()};}catch(error){reader?.revoke();throw error;}};
            let admitted:Awaited<ReturnType<typeof issueSources>>;
            try{admitted=await issueSources();}catch(error){clearTimeout(timer);abort.abort();currentAbort=undefined;const latest=await home.readSnapshot();if(bindingRevoked(latest)){await archive(OperationId('failure-'+currentTurn.runId),async()=>{await home.finishTurn({operationId:OperationId('failure-'+currentTurn.runId),runId:currentTurn.runId,contextGeneration:currentTurn.contextGeneration,outcome:{kind:'failure',reason:'QQ_BINDING_CHANGED'}});});continue;}if(isContextInvalidation(safeExecutionCode(error))&&latest.contextGeneration!==currentTurn.contextGeneration){await home.refreshTurnContext({operationId:OperationId('refresh-'+randomUUID()),runId:currentTurn.runId,previousGeneration:currentTurn.contextGeneration,nextGeneration:latest.contextGeneration});continue;}throw error;}
            const {readSnapshot,currentInputs,contextReader,grantedSources}=admitted;let contextDependencies:readonly import('../home/context-snapshot.ts').ContextSourceRef[]=[];
            const firstSequence=Math.min(...currentInputs.map(input=>input.receiveSequence));
            const previousInput=readSnapshot.inputs.filter(input=>input.status==='resolved'&&input.receiveSequence<firstSequence&&input.bindingId===currentTurn.bindingId&&input.bindingVersion===currentTurn.bindingVersion).at(-1);
            const readGrants:RoleReadGrants=Object.freeze({rule:contextReader.purpose==='history'?'fixed-history-snapshot':'fixed-daily-snapshot',basis:contextReader.basis,sources:grantedSources,coreVersion:readSnapshot.core.version,inputs:Object.freeze(currentInputs.map(input=>Object.freeze({inputId:input.inputId,experienceId:input.experienceId}))),previousExperience:previousInput?Object.freeze({inputId:previousInput.inputId,experienceId:previousInput.experienceId}):null});
            const initialSourceKeys=new Set(grantedSources.map(source=>JSON.stringify(source.ref)));
            const readScopedSource=async(ref:import('../home/context-snapshot.ts').ContextSourceRef)=>{
                if(initialSourceKeys.has(JSON.stringify(ref)))return contextReader.read(ref);
                await contextReader.check([]);if(ref.kind!=='tool')throw new ExecutionError('CONTEXT_SOURCE_NOT_GRANTED');
                return (await home.readCurrentToolSource({roleId:readSnapshot.roleId,runId:currentTurn.runId,contextGeneration:currentTurn.contextGeneration,initialRevision:contextReader.basis.revision,attemptId:ref.id,purpose:contextReader.purpose==='history'?'history':'daily'})).source;
            };
            const proposalReader=Object.freeze({...contextReader,read:readScopedSource});
            let processingProposals:Promise<void>|undefined;
            const processReadyProposals=async()=>{if(processingProposals)return processingProposals;const task=(async()=>{await drain();const knowledge=await home.readKnowledge(),conversation=await home.readConversation();for(const p of knowledge.proposals.filter(p=>p.runId===currentTurn.runId&&!p.processing)){const attempt=conversation.attempts.find(a=>a.attemptId===p.attemptId);if(!attempt?.outcome||!canonicalProposalRecorded(attempt,p,conversation.nativeRecords))continue;let assessment:ProposalAssessment={status:'reject',reason:'PROPOSAL_RUN_CLOSED',sources:[]};if(!sealed()&&status==='ready'&&!abort.signal.aborted&&!runFault&&Date.parse(now())<Date.parse(currentTurn.deadline))try{assessment=await checkKnowledgeProposal(p.value,Object.freeze({...proposalReader,read:async(ref:import('../home/context-snapshot.ts').ContextSourceRef)=>{const basis=p.claim.sourceBasis?.find(basis=>JSON.stringify(basis.ref)===JSON.stringify(ref));const source=basis?.currentRun&&ref.kind==='tool'?(await home.readCurrentToolSource({roleId:readSnapshot.roleId,runId:p.runId,contextGeneration:p.claim.contextGeneration,initialRevision:basis.currentRun.initialRevision,attemptId:ref.id,purpose:contextReader.purpose==='history'?'history':'daily'})).source:await proposalReader.read(ref);if(basis&&basis.contentDigest!==source.contentDigest)throw new ExecutionError('CONTEXT_SOURCE_CHANGED');return source;}}),(await home.readSnapshot()).inputs);}catch{assessment={status:'reject',reason:'PROPOSAL_CONTEXT_STALE',sources:[]};}if(sealed()||status!=='ready'||abort.signal.aborted||runFault||Date.parse(now())>=Date.parse(currentTurn.deadline))assessment={status:'reject',reason:Date.parse(now())>=Date.parse(currentTurn.deadline)?'PROPOSAL_DEADLINE':'PROPOSAL_RUN_CLOSED',sources:[]};const stable=structuredClone(assessment);await archive(OperationId('process-'+p.proposalId),()=>home.processProposal({operationId:OperationId('process-'+p.proposalId),proposalId:p.proposalId,assessment:stable,now:now()}).then(()=>{}),true);}})();processingProposals=task;try{await task;}finally{if(processingProposals===task)processingProposals=undefined;}};
            const parameters=async()=>{if(sealed())throw new ExecutionError('SOURCE_CLEANUP');if(preempted())throw new ExecutionError('AUTONOMOUS_PREEMPTED');if(currentTurn.source==='autonomous')await home.checkAutonomyClock({operationId:OperationId('clock-admission-'+randomUUID()),clock:clock.read()});await processReadyProposals();if(blockedTurn)throw new ExecutionError(lifecycleFault||archiveFault||'TURN_FINALIZATION_PENDING');if(runFault)throw new ExecutionError(runFault);if(Date.parse(now())>=Date.parse(currentTurn.deadline))throw new ExecutionError('TURN_DEADLINE');if(sealed()||status!=='ready'||abort.signal.aborted)throw new ExecutionError(status==='ready'?'TURN_DEADLINE':'ROLE_STOPPING');const s=await home.readSnapshot();if(bindingRevoked(s))throw new ExecutionError('QQ_BINDING_CHANGED');if(s.contextGeneration!==currentTurn.contextGeneration)throw new ExecutionError('CONTEXT_STALE');await contextReader.check(contextDependencies);const state=await home.readConversation();if(currentTurn.source==='autonomous'&&state.autonomy.restUntil&&Date.parse(now())<Date.parse(state.autonomy.restUntil))throw new ExecutionError('AUTONOMOUS_REST');return currentTurn.source==='autonomous'?state.autonomy.rules.value:state.rules.value;};
            const readSourceContent=async(request:RoleReadRequest):Promise<RoleReadContent>=>{
                await parameters();if(!Number.isSafeInteger(request.offset)||request.offset<0||!Number.isSafeInteger(request.limit)||request.limit<1)throw new ExecutionError('INVALID_ROLE_READ');
                const snapshot=await home.readSnapshot(),admission=home.admission;
                if(snapshot.roleId!==readSnapshot.roleId||admission.pendingOwnerChange||admission.contextGeneration!==currentTurn.contextGeneration||snapshot.core.version!==readGrants.coreVersion)throw new ExecutionError('CONTEXT_STALE');
                if(request.source==='core')return {source:'core',version:snapshot.core.version,text:snapshot.core.text};
                if(request.source==='material'){const material=grantedMaterials.get(request.id);if(!material)throw new ExecutionError('MATERIAL_NOT_GRANTED');return {source:'material',materialId:material.materialId,text:material.text};}
                if(request.source==='query'){const result=await searchContextSources(contextReader,request.query);return {source:'query',query:request.query,version:contextReader.basis.revision,text:JSON.stringify({provenance:'local-lexical-query',purpose:contextReader.purpose,basis:contextReader.basis,notFound:!result.sources.length,sources:result.sources,constraints:result.constraints})};}
                if(request.source==='knowledge'){const source=await contextReader.read({kind:'knowledge',id:request.id,version:request.version});return {source:'knowledge',knowledgeId:request.id,version:request.version,text:source.text};}
                if(request.source==='reply'){const source=await contextReader.read({kind:'reply',id:request.id});if(source.ref.kind!=='reply'||!('experienceId'in source)||!('committedRevision'in source))throw new ExecutionError('ROLE_READ_NOT_GRANTED');return {source:'reply',replyId:request.id,experienceId:source.experienceId,version:source.committedRevision,text:source.text};}
                if(request.source==='tool'){const source=await readScopedSource({kind:'tool',id:request.id});return {source:'tool',attemptId:request.id,version:source.ref.kind==='tool'&&'committedRevision'in source&&source.committedRevision!==undefined?source.committedRevision:contextReader.basis.revision,text:source.text};}
                const listed=await contextReader.list();const candidate=listed.find(source=>source.ref.kind==='input'&&(request.source==='input'?source.ref.id===request.id:'experienceId'in source&&source.experienceId===request.id));
                const grant=candidate&&candidate.ref.kind==='input'&&'experienceId'in candidate?{inputId:candidate.ref.id,experienceId:candidate.experienceId}:undefined;
                if(!grant)throw new ExecutionError('ROLE_READ_NOT_GRANTED');
                const input=snapshot.inputs.find(x=>x.inputId===grant.inputId&&x.experienceId===grant.experienceId);
                if(!input)throw new ExecutionError('ROLE_READ_SOURCE_UNAVAILABLE');await contextReader.check([{kind:'input',id:input.inputId}]);
                return {source:request.source,version:input.committedRevision,inputId:input.inputId,experienceId:input.experienceId,text:input.text};
            };
            const readSource=async(request:RoleReadRequest):Promise<RoleReadContent>=>{
                const content=await readSourceContent(request);let ref:import('../home/context-snapshot.ts').ContextSourceRef|undefined;
                if(request.source==='input'||request.source==='experience'){if('inputId'in content)ref={kind:'input',id:content.inputId};}
                else if(request.source==='tool')ref={kind:'tool',id:request.id};else if(request.source==='reply')ref={kind:'reply',id:request.id};
                else if(request.source==='knowledge')ref={kind:'knowledge',id:request.id,version:request.version};
                else if(request.source==='material'){const material=grantedMaterials.get(request.id);if(material)ref={kind:'tool',id:material.attemptId};}
                if(!ref)return content;const constraints=(await contextReader.constraints()).filter(constraint=>JSON.stringify(constraint.target)===JSON.stringify(ref));if(!constraints.length)return content;
                const required=[...new Map(constraints.flatMap(constraint=>constraint.required).map(ref=>[JSON.stringify(ref),ref])).values()],sources=[];for(const requiredRef of required)sources.push(await contextReader.read(requiredRef));return {...content,qualifiers:JSON.stringify({constraints,sources})};
            };
            const scope:IssuedRunScope=Object.freeze({runId:turn.runId,source:currentTurn.source,signal:abort.signal,parameters,async drain(){await drain();await processReadyProposals();},quiesceTools,afterTools,...(ports.files?{roleFiles:ports.files}:{}),selectContext(refs:readonly import('../home/context-snapshot.ts').ContextSourceRef[]){contextDependencies=refs;},
                rolePropose:Object.freeze({async check(value:KnowledgeProposal){const proposal=parseKnowledgeProposal(value);await parameters();const rules=await home.readProposalRules();if(proposal.kind==='activity'&&proposal.decision==='rest'&&proposal.restMs!>rules.value.maxRestSuggestionMs)throw new ExecutionError('REST_SUGGESTION_LIMIT');for(const source of proposal.sources)await readScopedSource(source.ref);}}),
                roleRead:Object.freeze({grants:readGrants,async check(request:RoleReadRequest){await readSource(request);},async read(request:RoleReadRequest):Promise<RoleReadValue>{const source=await readSource(request),points=Array.from(source.text);return {...source,text:points.slice(request.offset,request.offset+request.limit).join(''),offset:request.offset,totalCodePoints:points.length,more:request.offset+request.limit<points.length};}}),
rejectRun(code:string){runFault=runFault||(/^[A-Z][A-Z0-9_]{1,63}$/.test(code)?code:'NATIVE_RUN_REJECTED');},
                registerFinalization(key:NativeExposureId,save:()=>void|Promise<void>){const operationId=OperationId('final-registration-'+createHash('sha256').update(currentTurn.runId+':'+key).digest('hex'));archive(operationId,async()=>{await save();},true);},
                registerNative(record:Omit<NativeRecord,'runId'>){
                    try {const stable=structuredClone(record);const operationId=OperationId('native-'+createHash('sha256').update(JSON.stringify({runId:currentTurn.runId,provenance:stable.provenance,nativeId:stable.nativeId})).digest('hex'));const data=stable.data,toolLifetime=stable.provenance==='tools-result'||!!data&&typeof data==='object'&&(('type' in data&&['tool/call','tool/result'].includes(String(data.type)))||('kind' in data&&data.kind==='sdk-spill-gap'));archive(operationId,()=>home.recordNative({operationId,record:{...stable,runId:currentTurn.runId}}),toolLifetime);}catch(e){fault=safeExecutionCode(e);}
                },
                async reserveTool(request:unknown,options?:{readonly kind:'file-read'|'file-write'|'proposal'|'web-search'|'web-fetch'}){
                    const proposalValue=options?.kind==='proposal'?request&&typeof request==='object'&&'name'in request&&request.name==='role_propose'&&'arguments'in request?parseKnowledgeProposal(request.arguments):(()=>{throw new ExecutionError('INVALID_ROLE_PROPOSE');})():undefined;
                    const proposalSources=proposalValue?await Promise.all(proposalValue.sources.map(async source=>knowledgeSourceBasis(await readScopedSource(source.ref)))):undefined;
                    const id=AttemptId('tool-'+randomUUID()),webId=AttemptId('web-'+randomUUID()),logicalOpId=LogicalOpId('logical-'+randomUUID());let reservedVersion:ConversationVersion|undefined,reservedReadRules:ReadRules|undefined,reservedFileRules:FileRules|undefined,webClaim:WebToolClaim|undefined,firstWeb:AttemptRecord|undefined;
                    while(true){
                        await drain();await parameters();const snapshot=await home.readSnapshot(),conversation=await home.readConversation();
                        try{const autonomy=currentTurn.source==='autonomous'?await autonomyStamp():undefined,stamp=autonomy?.clock.utc??now(),common={operationId:OperationId('reserve-'+id),runId:currentTurn.runId,attemptId:id,source:currentTurn.source,...(autonomy?{autonomy}:{}),contextGeneration:snapshot.contextGeneration,settingsVersion:conversation.rules.version,readRules:conversation.readRules,...(options?.kind==='file-read'||options?.kind==='file-write'?{fileRules:conversation.fileRules,fileAccessVersion:conversation.fileAccess.version,fileOperation:options.kind==='file-write'?'write' as const:'read' as const}:{}),expectedRevision:conversation.revision,now:stamp};
                            let reserved:AttemptRecord;if(options?.kind==='web-search'||options?.kind==='web-fetch'){const rules=conversation.webRules;if(!request||typeof request!=='object'||!('arguments'in request)||!('name'in request)||request.name!==(options.kind==='web-search'?'role_web_search':'role_web_fetch'))throw new ExecutionError('INVALID_ROLE_WEB');parseRoleWeb(options.kind==='web-search'?'search':'fetch',request.arguments,rules.value.maxResults);webClaim={logicalOpId,operation:options.kind==='web-search'?'search':'fetch',deadline:new Date(Math.min(Date.parse(currentTurn.deadline),Date.parse(stamp)+rules.value.toolTimeoutMs)).toISOString(),rules:structuredClone(rules)};const compound=await home.reserveWebTool({...common,webAttemptId:webId,webTool:webClaim});reserved=compound.tool;firstWeb=compound.web;}else reserved=await home.reserveAttempt({...common,kind:'tool',...(options?.kind==='proposal'?{proposal:{contextGeneration:snapshot.contextGeneration,settingsVersion:conversation.rules.version,proposalRulesVersion:conversation.proposalRules.version,initialRevision:contextReader.basis.revision,sourceBasis:proposalSources,...(currentTurn.source==='autonomous'?{autonomyRulesVersion:conversation.autonomy.rules.version}:{}),inputSequence:currentTurn.source==='autonomous'?currentTurn.admittedInputSequence!:Math.max(...snapshot.inputs.filter(input=>currentTurn.inputIds.includes(input.inputId)).map(input=>input.receiveSequence))}}:{})});
                            reservedVersion=conversation.rules.version;reservedReadRules=reserved.readRules;reservedFileRules=reserved.fileRules;break;}
                        catch(error){if(safeExecutionCode(error)==='REVISION_CONFLICT')continue;throw error;}
                    }
                    if(!reservedReadRules)throw new ExecutionError('READ_RULES_UNCONFIRMED');const effectiveReadRules=Object.freeze({version:reservedReadRules.version,value:Object.freeze({...reservedReadRules.value})});
                    const prerequisites:{confirmed:boolean;task:Promise<void>}[]=[];let dispatched=false,observed=false,finalized=false,finalizedOutcome:AttemptOutcome|undefined,bodyDone:()=>void=()=>{};
                    let finalDone!:()=>void;const final=new Promise<void>(r=>finalDone=r);finals.set(id,final);
                    const exclusive=options?.kind==='file-write'||options?.kind==='proposal';const releaseSlot=()=>{let changed=waitingFileWriters.delete(id);if(exclusiveFileSlot===id){exclusiveFileSlot=undefined;changed=true;}if(readSlots.delete(id))changed=true;if(changed)wakeSlots();};
                    const acquireSlot=async()=>{if(exclusive)waitingFileWriters.add(id);while(true){await drain();await parameters();if(home.admission.readRulesVersion!==effectiveReadRules.version)throw new ExecutionError('READ_RULES_CHANGED');if(!exclusiveFileSlot&&(exclusive?readSlots.size===0:!waitingFileWriters.size&&readSlots.size<effectiveReadRules.value.toolConcurrency)){readSlots.add(id);if(exclusive){waitingFileWriters.delete(id);exclusiveFileSlot=id;}return;}await new Promise<void>(resolve=>slotWaiters.add(resolve));}};
                    const registerMaterial=(body:ToolMaterialBody)=>{
                        const material:ToolMaterial={...structuredClone(body),materialId:MaterialId('material-'+randomUUID()),attemptId:id};
                        const operationId=OperationId('capture-'+material.materialId),prerequisite={confirmed:false,task:Promise.resolve()};prerequisites.push(prerequisite);
                        prerequisite.task=archive(operationId,async()=>{await home.captureMaterial({operationId,material});prerequisite.confirmed=true;grantedMaterials.set(material.materialId,material);},true);
                        return {material,saved:prerequisite.task};
                    };
                    const web=webClaim&&firstWeb?issueWebOperation({home,first:firstWeb,toolId:id,claim:webClaim,dispatchClock,...(currentTurn.source==='autonomous'?{stamp:autonomyStamp}:{}),now,parameters,drain,archive:(operationId,save)=>archive(operationId,save,true),check:()=>{const admission=home.admission;if(fault||archiveFault||runFault||preempted()||maintenancePending||status!=='ready'||abort.signal.aborted||admission.pendingOwnerChange||admission.contextGeneration!==currentTurn.contextGeneration||admission.settingsVersion!==reservedVersion||admission.webRulesVersion!==webClaim!.rules.version||admission.readRulesVersion!==effectiveReadRules.version||Date.parse(now())>=Date.parse(webClaim!.deadline))throw new ExecutionError('WEB_DISPATCH_ADMISSION_CHANGED');}}):undefined;
                    let proposalTask:Promise<import('../actions/propose.ts').RoleProposeValue>|undefined;
                    const proposal=proposalValue?Object.freeze({save(value:KnowledgeProposal){if(proposalTask)return proposalTask;if(!dispatched||JSON.stringify(parseKnowledgeProposal(value))!==JSON.stringify(proposalValue))throw new ExecutionError('PROPOSAL_PERMISSION_REQUIRED');const stable=structuredClone(proposalValue),createdAt=now(),operationId=OperationId('save-proposal-'+id),prerequisite={confirmed:false,task:Promise.resolve()};let savedId:import('../home/ids.ts').ProposalId|undefined;prerequisites.push(prerequisite);prerequisite.task=archive(operationId,async()=>{const saved=await home.saveProposal({operationId,attemptId:id,value:stable,now:createdAt});savedId=saved.proposalId;prerequisite.confirmed=true;},true);proposalTask=prerequisite.task.then(()=>{if(!savedId)throw new ExecutionError('PROPOSAL_SAVE_UNCONFIRMED');return {proposalId:savedId,toolAttemptId:id,status:'pending-final' as const};});return proposalTask;}}):undefined;
                    return Object.freeze({attemptId:id,readRules:effectiveReadRules,...(proposal?{proposal}:{}),...(web?{web}:{}),...(reservedFileRules?{fileRules:reservedFileRules}:{}),
                        async enter(){try{await acquireSlot();await drain();await parameters();await home.enterAttempt({operationId:OperationId('enter-'+id),attemptId:id,now:now()});}catch(error){releaseSlot();throw error;}},
                        async invoke<T>(signal:AbortSignal|undefined,effect:()=>Promise<T>):Promise<T>{while(true){await drain();await parameters();if(!debts.size)break;}if(signal?.aborted){releaseSlot();throw new ExecutionError('ROLE_READ_CANCELLED');}const admission=home.admission;if(fault||archiveFault||debts.size||runFault||preempted()||status!=='ready'||abort.signal.aborted||admission.pendingOwnerChange||admission.contextGeneration!==currentTurn.contextGeneration||admission.settingsVersion!==reservedVersion||admission.readRulesVersion!==effectiveReadRules.version||reservedFileRules&&admission.fileRulesVersion!==reservedFileRules.version||Date.parse(now())>=Date.parse(currentTurn.deadline)){releaseSlot();throw new ExecutionError('DISPATCH_ADMISSION_CHANGED');}if(dispatched)throw new ExecutionError('TOOL_ALREADY_DISPATCHED');if(!readSlots.has(id))throw new ExecutionError('TOOL_SLOT_UNCONFIRMED');const clockGate=dispatchClock();if(clockGate)try{await clockGate;}catch(error){releaseSlot();throw error;}dispatched=true;let resolve!:()=>void;const body=new Promise<void>(r=>resolve=r);bodies.add(body);bodyDone=()=>{bodies.delete(body);releaseSlot();resolve();};return effect();},
                        async observe(observation:ToolObservationInput){if(observed)throw new ExecutionError('TOOL_ALREADY_OBSERVED');observed=true;const stable=structuredClone({...observation,observedAt:now()}),prerequisite={confirmed:false,task:Promise.resolve()};prerequisites.push(prerequisite);try{prerequisite.task=archive(OperationId('tool-observation-'+id),async()=>{await home.observeAttempt({operationId:OperationId('tool-observation-'+id),attemptId:id,observation:stable});prerequisite.confirmed=true;},true);await prerequisite.task;return home.revision;}finally{bodyDone();}},
                        async captureMaterial(body:ToolMaterialBody):Promise<ToolMaterial>{const registered=registerMaterial(body);await registered.saved;return registered.material;},
                        recordDisplay(body:ToolMaterialBody):ToolMaterial{return registerMaterial(body).material;},
                        finalize(outcome:AttemptOutcome){if(!dispatched)releaseSlot();if(finalized){if(finalizedOutcome!==outcome)fault='TOOL_FINAL_DUPLICATE';return;}finalized=true;finalizedOutcome=outcome;const stable=structuredClone({...outcome,...(!dispatched?{kind:'not-dispatched'}:{}),data:{request,result:outcome.data,dispatchObserved:dispatched}});const saved:AttemptOutcome={...stable,kind:dispatched?outcome.kind:'not-dispatched'};
                            archive(OperationId('tool-final-'+id),async()=>{for(const prerequisite of prerequisites)if(!prerequisite.confirmed){try{await prerequisite.task;}catch{if(!prerequisite.confirmed)throw new ExecutionError('TOOL_ARCHIVE_PREREQUISITE');}}await web?.finishReservations();await home.recordAttempt({operationId:OperationId('tool-final-'+id),attemptId:id,outcome:saved});},true);finals.delete(id);finalDone();}
                    });
                },
                createModelOperation(purpose:ModelPurpose){
                    const logicalOpId=LogicalOpId('logical-'+randomUUID());const issued:IssuedModelAttempt[]=[];let retryReady=false,plannedRetryVersion:RetryRulesSnapshot['version']|undefined;
                    return Object.freeze({logicalOpId,
                        async reserve(request:unknown){if(issued.length>1||issued.length===1&&!retryReady)throw new ExecutionError('MODEL_LOGICAL_OPERATION_EXHAUSTED');const prior=issued[0];if(prior&&(await home.readRetryRules()).version!==plannedRetryVersion)throw new ExecutionError('MODEL_RETRY_RULES_CHANGED');const claim:ModelOperationClaim=prior?{logicalOpId,purpose,ordinal:1,previousAttemptId:prior.attemptId}:{logicalOpId,purpose,ordinal:0};retryReady=false;const attempt=await scope.reserveModel(request,claim);issued.push(attempt);return attempt;},
                        async retry(failure:ModelFailure,signal:AbortSignal){
                            if(issued.length!==1||retryReady||!transientModelFailure(failure)||state.attempts.some(x=>x.runId===currentTurn.runId))return false;
                            await quiesceTools();await parameters();const saved=(await home.readConversation()).attempts.find(x=>x.attemptId===issued[0]!.attemptId);
                            if(saved?.outcome?.kind!=='failed'||JSON.stringify(saved.outcome.modelFailure)!==JSON.stringify(failure))return false;
                            const retryRules=await home.readRetryRules();if(!retryRules.value.maxAutomaticRetries)return false;const delayMs=Math.ceil(failure.providerRetryAfterMs??retryRules.value.retryDelayMs),remaining=Date.parse(currentTurn.deadline)-Date.parse(now());if(delayMs>=remaining||delayMs>2147483647)return false;
                            const cancellation=AbortSignal.any([signal,abort.signal]);if(cancellation.aborted)return false;
                            await new Promise<void>((resolve,reject)=>{const done=()=>{clearTimeout(timer);cancellation.removeEventListener('abort',cancel);resolve();};const cancel=()=>{clearTimeout(timer);cancellation.removeEventListener('abort',cancel);reject(new ExecutionError('MODEL_RETRY_CANCELLED'));};const timer=setTimeout(done,delayMs);cancellation.addEventListener('abort',cancel,{once:true});});
                            await quiesceTools();await parameters();const latest=await home.readRetryRules();if(latest.version!==retryRules.version||!latest.value.maxAutomaticRetries)return false;plannedRetryVersion=latest.version;retryReady=true;return true;
                        }
                    });
                },
                async reserveModel(request:unknown,modelOperation?:ModelOperationClaim){
                    const id=AttemptId('attempt-'+randomUUID());let reservedVersion:ConversationVersion|undefined,reservedRetryVersion:RetryRulesSnapshot['version']|undefined;
                    while(true){await parameters();await quiesceTools();await parameters();const s=await home.readSnapshot(),c=await home.readConversation();try{const autonomy=currentTurn.source==='autonomous'?await autonomyStamp():undefined;await home.reserveAttempt({operationId:OperationId('reserve-'+id),runId:currentTurn.runId,attemptId:id,source:currentTurn.source,...(autonomy?{autonomy}:{}),kind:'model',retryRules:c.retryRules,...(modelOperation?{modelOperation}:{}),contextGeneration:s.contextGeneration,settingsVersion:c.rules.version,expectedRevision:c.revision,now:autonomy?.clock.utc??now()});reservedVersion=c.rules.version;reservedRetryVersion=c.retryRules.version;break;}catch(e){if(safeExecutionCode(e)==='REVISION_CONFLICT')continue;throw e;}}
                    let entered=false,dispatched=false,settled=false;
                    return Object.freeze({attemptId:id,async enter(){await drain();await parameters();await home.enterAttempt({operationId:OperationId('enter-'+id),attemptId:id,now:now()});entered=true;},async *iterate<T>(effect:()=>AsyncIterable<T>){while(true){await quiesceTools();await parameters();if(!debts.size&&!bodies.size&&!finals.size)break;}if(!entered||dispatched||settled)throw new ExecutionError('MODEL_ATTEMPT_CAPABILITY_SPENT');const current=home.admission;if(modelOperation?.ordinal===1&&current.retryRulesVersion!==reservedRetryVersion)throw new ExecutionError('MODEL_RETRY_RULES_CHANGED');if(fault||archiveFault||debts.size||bodies.size||finals.size||runFault||preempted()||status!=='ready'||abort.signal.aborted||current.pendingOwnerChange||current.contextGeneration!==currentTurn.contextGeneration||current.settingsVersion!==reservedVersion||Date.parse(now())>=Date.parse(currentTurn.deadline))throw new ExecutionError('DISPATCH_ADMISSION_CHANGED');const clockGate=dispatchClock();if(clockGate)await clockGate;dispatched=true;yield* effect();},async settle(outcome:AttemptOutcome){if(settled)throw new ExecutionError('ATTEMPT_ALREADY_SETTLED');const saved=structuredClone({...outcome,...(outcome.data===undefined?{}:{data:{request,result:outcome.data,dispatchObserved:dispatched}}),...(!dispatched?{kind:'not-dispatched' as const}:{})});await archive(OperationId('record-'+id),()=>home.recordAttempt({operationId:OperationId('record-'+id),attemptId:id,outcome:saved}));settled=true;}});
                }
            });
            let finished=false,quiesceFailed=false;
            const quiesceCurrent=async()=>{try{const quiet=await execution.quiesce(currentTurn.runId);if(!quiet.idle||!quiet.flushed)throw new ExecutionError('NATIVE_FLUSH_UNCONFIRMED');}catch(error){quiesceFailed=true;throw error;}};
            const retainQuiesceFailure=(code:string)=>{blockedTurn=currentTurn;blockedTurnReason=code;lifecycleFault=code;};
            try {
                const rules=await scope.parameters();if(currentTurn.source==='autonomous'&&(await home.readConversation()).attempts.filter(attempt=>attempt.runId===currentTurn.runId&&attempt.kind==='model').length>=rules.modelLimit)throw new ExecutionError('MODEL_LIMIT');const route=await execution.prepare(rules.outputTokens,abort.signal);
                const frame=await prepareCharacterContext(await home.readSnapshot(),currentTurn,route,contextReader);contextDependencies=frame.manifest.selected;
                const received=await execution.run({turn:currentTurn,frame,route},scope);
                const outcome=runFault?{kind:'failure' as const,reason:runFault}:received;await quiesceTools();await quiesceCurrent();await processReadyProposals();
                if(currentTurn.source==='autonomous'&&(await home.readAutonomy()).restUntil&&Date.parse(now())<Date.parse((await home.readAutonomy()).restUntil!)){const latest=await home.readSnapshot();if(latest.contextGeneration!==currentTurn.contextGeneration)await home.refreshTurnContext({operationId:OperationId('rest-context-'+currentTurn.runId),runId:currentTurn.runId,previousGeneration:currentTurn.contextGeneration,nextGeneration:latest.contextGeneration});await home.finishTurn({operationId:OperationId('rest-finish-'+currentTurn.runId),runId:currentTurn.runId,contextGeneration:latest.contextGeneration,outcome:{kind:'internal',reason:'ACTIVITY_REST'}});await execution.release?.(currentTurn.runId);finished=true;continue;}
                if(preempted()){await home.suspendAutonomous({operationId:OperationId('suspend-'+currentTurn.runId+'-'+issuedEpoch),runId:currentTurn.runId,reason:'USER_PRIORITY'});await execution.release?.(currentTurn.runId);finished=true;continue;}
                if(outcome.kind==='failure'&&isContextInvalidation(outcome.reason))throw new ExecutionError(outcome.reason);
                if((await home.readSnapshot()).contextGeneration!==currentTurn.contextGeneration)throw new ExecutionError('CONTEXT_STALE');
                await archive(OperationId('finish-'+currentTurn.runId),async()=>{try{await home.finishTurn({operationId:OperationId('finish-'+currentTurn.runId),runId:currentTurn.runId,contextGeneration:currentTurn.contextGeneration,outcome});}catch(error){if(safeExecutionCode(error)!=='QQ_BINDING_CHANGED')throw error;await home.finishTurn({operationId:OperationId('finish-'+currentTurn.runId),runId:currentTurn.runId,contextGeneration:currentTurn.contextGeneration,outcome:{kind:'failure',reason:'QQ_BINDING_CHANGED'}});}});finished=true;await execution.release?.(currentTurn.runId);scheduleDelivery();
            } catch(error) {
                if(finished){fault=safeExecutionCode(error);return;}
                const code=runFault||safeExecutionCode(error);
                if(quiesceFailed){retainQuiesceFailure(code);return;}
                if(!fault&&!archiveFault) {
                    try {await quiesceTools();await drain();await quiesceCurrent();await processReadyProposals();if(preempted()){await home.suspendAutonomous({operationId:OperationId('suspend-'+currentTurn.runId+'-'+issuedEpoch),runId:currentTurn.runId,reason:'USER_PRIORITY'});await execution.release?.(currentTurn.runId);finished=true;continue;}const latest=await home.readSnapshot();if(bindingRevoked(latest)){await archive(OperationId('failure-'+currentTurn.runId),async()=>{await home.finishTurn({operationId:OperationId('failure-'+currentTurn.runId),runId:currentTurn.runId,contextGeneration:currentTurn.contextGeneration,outcome:{kind:'failure',reason:'QQ_BINDING_CHANGED'}});});}else if(latest.contextGeneration!==currentTurn.contextGeneration){await home.refreshTurnContext({operationId:OperationId('refresh-'+randomUUID()),runId:currentTurn.runId,previousGeneration:currentTurn.contextGeneration,nextGeneration:latest.contextGeneration});if(runFault)await home.finishTurn({operationId:OperationId('failure-'+currentTurn.runId),runId:currentTurn.runId,contextGeneration:latest.contextGeneration,outcome:{kind:'failure',reason:runFault}});if(runFault)await execution.release?.(currentTurn.runId);}else if(!runFault&&isContextInvalidation(code)){/* New fixed sources require a new issued scope after old records/Session settle. */}else await home.finishTurn({operationId:OperationId('failure-'+currentTurn.runId),runId:currentTurn.runId,contextGeneration:currentTurn.contextGeneration,outcome:{kind:'failure',reason:code}});await execution.release?.(currentTurn.runId);}catch(e){if(quiesceFailed)retainQuiesceFailure(code);else if(archiveFault){blockedTurn=currentTurn;blockedTurnReason=bindingRevoked(await home.readSnapshot())?'QQ_BINDING_CHANGED':code;}else fault=safeExecutionCode(e);}
                }else if(archiveFault){blockedTurn=currentTurn;blockedTurnReason=code;}
            } finally {contextReader.revoke();clearTimeout(timer);abort.abort();currentAbort=undefined;if(activeAutonomous===abort)activeAutonomous=undefined;}
            if(fault||archiveFault||blockedTurn)return;
        }
    }

    /** The only autonomous opportunity entry: explicit owner wake and the periodic scheduler share it. */
    async function wake(hint:WakeHint):Promise<WakeReceipt>{
        if(!home||!writable()||sealed()||status!=='ready')return {kind:'skipped',reason:sealed()?'SOURCE_CLEANUP_PENDING':status==='read-only'?'read-only':reason};
        const receipt=await home.requestWake({operationId:hint?.operationId?OperationId(hint.operationId):OperationId('wake-'+randomUUID()),reason:typeof hint?.reason==='string'?hint.reason.slice(0,256):'wake',stamp:await autonomyStamp()});
        if(receipt.kind==='skipped')return receipt;
        if(receipt.dispatchOpportunity){autonomyWakeIssued=true;schedule();}
        return {kind:'accepted',opportunityId:receipt.opportunity.opportunityId,requestedAt:receipt.opportunity.requestedAt};
    }
    /** Offset so the recomputed slot stays on a grid aligned to the anchor. */
    function scheduleOffset(baseMs:number,anchorAt:string,intervalMs:number):number{return ((baseMs-Date.parse(anchorAt))%intervalMs+intervalMs)%intervalMs||intervalMs;}
    /** Interval edits recompute only the next future opportunity; the anchor and consumed slots stay. */
    function recomputedSchedule(schedule:AutonomySchedule|undefined,intervalMs:number):AutonomySchedule|undefined{
        if(!schedule)return undefined;
        // Recompute on the new interval grid measured from the last consumed slot (or the anchor).
        const base=Math.max(Date.parse(clock.read().utc),Date.parse(scheduleBase(schedule)));
        return {...schedule,nextOpportunityAt:new Date(base+intervalMs-scheduleOffset(base,schedule.anchorAt,intervalMs)).toISOString()};
    }
    const scheduleOperation=(prefix:string,slotAt:string)=>OperationId(prefix+'-'+createHash('sha256').update('role-wake-schedule:'+slotAt).digest('hex').slice(0,40));
    function nextFutureSlot(schedule:AutonomySchedule,intervalMs:number,nowMs:number):string{
        let next=nextSlotAfter(scheduleBase(schedule),intervalMs);
        if(!(intervalMs>0))return next;
        // Missed slots are never replayed: skip forward without inventing historical opportunities.
        for(let guard=0;Date.parse(next)<=nowMs;guard++){if(guard>100000)break;next=nextSlotAfter(next,intervalMs);}
        return next;
    }
    const pauseActive=async()=>{if(!home||homeClosed)return undefined;const state=await home.readAutonomy();return state.pausedAt;};
    let arming=false;
    async function armTimer(){
        if(arming)return;arming=true;
        try{await armTimerInner();}finally{arming=false;}
    }
    async function armTimerInner(){
        clearScheduler();
        if(!home||homeClosed||status!=='ready'||!writable()||maintenancePending||sealed())return;
        let state:AutonomySnapshot;try{state=await home.readAutonomy();}catch{return;}
        schedulerArmed=false;
        if(state.pausedAt){schedulerSkipReason='AUTONOMY_PAUSED';return;}
        let schedule:AutonomySchedule|undefined;
        try{schedule=await home.readAutonomySchedule()??undefined;}catch(error){schedulerSkipReason=safeExecutionCode(error);return;}
        if(!schedule){
            // One durable anchor at first arming; later armings only recompute the future slot.
            // The operation id is derived from the anchor, so a retried arming is idempotent.
            const anchor=clock.read().utc;
            try{schedule=await home.armAutonomySchedule({operationId:scheduleOperation('arm',anchor),schedule:{anchorAt:anchor,lastSlotAt:null,nextOpportunityAt:nextSlotAfter(anchor,state.rules.value.wakeIntervalMs),missedSlots:0}});}
            catch(error){schedulerSkipReason=safeExecutionCode(error);return;}
        }
        if(!schedule)return;
        const nowMs=Date.parse(clock.read().utc);
        for(let guard=0;Date.parse(schedule.nextOpportunityAt)<=nowMs&&guard<64;guard++){
            // Missed slots after downtime are never replayed; consume them into one future slot.
            const current=schedule,grid=nextGridSlot(current.anchorAt,state.rules.value.wakeIntervalMs,nowMs),delta=Math.max(1,(Date.parse(grid.at)-Date.parse(current.nextOpportunityAt))/state.rules.value.wakeIntervalMs);
            try{schedule=await home.advanceAutonomySchedule({operationId:scheduleOperation('missed',current.nextOpportunityAt),slotAt:current.nextOpportunityAt,dispatchedSlot:false,nextOpportunityAt:grid.at,missedSlots:current.missedSlots+delta});}
            catch(error){schedulerSkipReason=safeExecutionCode(error);return;}
        }
        if(!schedule)return;
        schedulerNextAt=schedule.nextOpportunityAt;schedulerArmed=true;
        // A stop may have finished while this projection awaited Home; never install a timer on a dead lifetime.
        if(homeClosed||status!=='ready'||!writable()||sealed()){schedulerArmed=false;return;}
        const delay=Math.max(0,Date.parse(schedule.nextOpportunityAt)-Date.parse(clock.read().utc));
        schedulerTimer=timers.setTimeout(()=>{schedulerTimer=undefined;void scheduledSlot();},Math.min(delay,2147483647));
    }
    let schedulerTask:Promise<void>|undefined;
    async function scheduledSlot():Promise<void>{
        if(schedulerTask)return;
        schedulerTask=(async()=>{
            try{
                if(!home||homeClosed||status!=='ready'||!writable()||maintenancePending||sealed())return;
                const state=await home.readAutonomy(),schedule=await home.readAutonomySchedule(),reading=clock.read();
                if(state.pausedAt){schedulerSkipReason='AUTONOMY_PAUSED';return;}
                if(!schedule)return;
                if(Date.parse(reading.utc)<Date.parse(schedule.nextOpportunityAt))return;
                const slot=schedule.nextOpportunityAt;
                // Re-check the clock problem and rest/budget before spending a slot; a skip is a real outcome.
                const stamp=await autonomyStamp();
                const problem=clockProblem(state,stamp.clock),blocked=problem??wakeBlocked(state,stamp);
                if(blocked){schedulerSkipReason=blocked;}
                else{
                    const receipt=await wake({operationId:scheduleOperation('scheduled',slot),reason:'scheduled-opportunity'});
                    schedulerSkipReason=receipt.kind==='skipped'?receipt.reason:null;
                }
                // The slot is consumed either way: busy slots coalesce into at most one and never backfill.
                const live=await home.readAutonomy(),current=await home.readAutonomySchedule(),interval=live.rules.value.wakeIntervalMs,grid=nextGridSlot(current?.anchorAt??slot,interval,Math.max(Date.parse(slot),Date.parse(clock.read().utc))),delta=Math.max(1,(Date.parse(grid.at)-Date.parse(slot))/interval),dispatched=blocked===undefined;
                await home.advanceAutonomySchedule({operationId:scheduleOperation('advance',slot),slotAt:slot,dispatchedSlot:dispatched,nextOpportunityAt:grid.at,missedSlots:(current?.missedSlots??0)+delta-(dispatched?1:0)});
            }catch(error){schedulerSkipReason=safeExecutionCode(error);}
            finally{schedulerTask=undefined;void armTimer();}
        })();
        await schedulerTask;
    }
    function stopScheduler(){clearScheduler();}
    async function projectSchedule():Promise<ScheduleView|undefined>{
        if(!home||homeClosed||status==='stopping'||status==='stopped')return undefined;
        let state:AutonomySnapshot;try{state=await home.readAutonomy();}catch{return undefined;}
        let schedule:AutonomySchedule|undefined;try{schedule=await home.readAutonomySchedule()??undefined;}catch{return undefined;}
        if(!schedule)return {intervalMs:state.rules.value.wakeIntervalMs,paused:state.pausedAt!==undefined,pausedAt:state.pausedAt??null,anchorAt:'',lastSlotAt:null,nextOpportunityAt:'',missedSlots:0,armed:false,lastSkipReason:schedulerSkipReason};
        return {intervalMs:state.rules.value.wakeIntervalMs,paused:state.pausedAt!==undefined,pausedAt:state.pausedAt??null,anchorAt:schedule.anchorAt,lastSlotAt:schedule.lastSlotAt,nextOpportunityAt:schedule.nextOpportunityAt,missedSlots:schedule.missedSlots,armed:schedulerArmed&&!state.pausedAt&&schedulerTimer!==undefined,lastSkipReason:schedulerSkipReason};
    }

    function schedule(){scheduleDelivery();if(working){reschedule=true;return;}if(!ready||!writable()||fault||archiveFault||blockedTurn||maintenancePending||sealed())return;if(!schedulerTimer&&!schedulerTask)void armTimer();working=Promise.resolve().then(work).catch(e=>{fault=safeExecutionCode(e);}).finally(()=>{working=undefined;if(reschedule){reschedule=false;schedule();}});}
    function stopView():HomeOperation{
        if(!activeStopId)throw new ExecutionError('STOP_NOT_REQUESTED');
        const view=stopOperation??{operationId:activeStopId,kind:'unavailable' as const,reason:'STOP_COMMIT_PENDING'};
        return {...structuredClone(view),...(view.stop?{stop:{...view.stop,step:stopStep,phase:status==='stopped'?'stopped' as const:stopError||archiveFault?'blocked' as const:'stopping' as const,...(stopError||archiveFault?{error:stopError||archiveFault}:{})}}:{})};
    }
    function advanceStop(){
        if(stopTask||status==='stopped')return;
        const task=(async()=>{try{
            stopError='';stopScheduler();if(!homeClosed){stopStep='actions';await Promise.all([...handoverRecoveryWrites.values()]);await restoreRuntime.drain();await ports.inbound?.drain();await working;await historyRuntime?.drain();await deliveryScheduler;await Promise.all([...sendingTasks.values()]);await Promise.all([...cleanupRuns.values()].flatMap(entry=>entry.task?[entry.task]:[]));stopStep='records';if(blockedTurn)throw new ExecutionError(lifecycleFault||archiveFault||'TURN_FINALIZATION_PENDING');await quiesceTools();await drain();stopStep='model-and-flush';await execution?.close();
            if(home&&activeStopId){const id=activeStopId;await archive(OperationId('stop-checkpoint-'+createHash('sha256').update(id).digest('hex')),async()=>{await home.checkpointStop({operationId:OperationId('stop-checkpoint-'+createHash('sha256').update(id).digest('hex')),stopOperationId:id});stopOperation=home.operationSnapshot(id);});retainedHome=await projectHome(home);for(const stop of home.stopSnapshots())retainedStops.set(stop.operationId,home.operationSnapshot(stop.operationId));}
            if(home&&activeHandover){const record=activeHandover,id=OperationId('handover-ready-'+createHash('sha256').update(record.operationId).digest('hex'));await archive(id,async()=>{await home.readyHandover({operationId:id,handoverOperationId:record.operationId});activeHandover=home.handoverSnapshots().find(item=>item.operationId===record.operationId);if(activeHandover)retainedHandovers.set(record.operationId,activeHandover);});retainedHome=await projectHome(home);}
            for(const task of cleanupViews())retainedCleanups.set(task.operationId,task);stopStep='home';await capability?.close();homeClosed=true;homeReleased();}stopStep='observers';historyRuntime?.dispose();await ports.inbound?.dispose();await execution?.dispose?.();unlisten?.();unlistenClose?.();unlistenDelivery?.();status='stopped';stopStep='complete';stopError='';resolveStopped({status:'stopped',reason:stopReason});
        }catch(error){stopError=safeExecutionCode(error);}})();
        stopTask=task;void task.finally(()=>{if(stopTask===task)stopTask=undefined;});
    }
    function beginStop(why:StopReason,operationId?:OperationId):Promise<void>{
        if(status==='stopped')return Promise.resolve();
        if(activeStopId)return stopRequest??Promise.resolve();
        status='stopping';stopReason=why;historyRuntime?.interrupt('ROLE_STOPPING');ports.inbound?.seal();
        if(home){const id=operationId??OperationId('stop-'+randomUUID());activeStopId=id;stopRequest=archive(id,async()=>{try{await home.requestStop({operationId:id,reason:why});stopOperation=home.operationSnapshot(id);}catch(error){if(safeExecutionCode(error)==='IO_UNCERTAIN')stopOperation={operationId:id,kind:'uncertain',stage:'commit-uncertain'};throw error;}});}
        afterTools(()=>currentAbort?.abort());advanceStop();return stopRequest??Promise.resolve();
    }
    function requestStop(why:StopReason){void beginStop(why).catch(()=>{});}
    async function readHandover(operationId:OperationId):Promise<HandoverProgress>{
        const id=OperationId(operationId),reader=home??activationReadHome;
        const record=homeClosed?retainedHandovers.get(id):reader?.handoverSnapshots().find(item=>item.operationId===id);
        const roleId=reader?.roleId;if(!roleId)throw new ExecutionError('HOME_UNAVAILABLE');
        if(!record){const intent=handoverIntents.get(id),operation=!homeClosed?reader?.operationSnapshot(id):undefined;
            if(operation?.kind==='uncertain'||intent?.sealed)return {operationId:id,roleId,phase:'uncertain',error:operation?.kind==='uncertain'?'IO_UNCERTAIN':intent?.error||'HANDOVER_PUBLICATION_UNCONFIRMED'};
            return {operationId:id,roleId,phase:'not-found'};
        }
        const accepted=homeClosed?restored:reader?.restoreAcceptanceSnapshot();
        if(!currentOutgoingHandover(record,accepted?.committedRevision))return {operationId:id,roleId,phase:'uncertain',record:structuredClone(record),history:true,error:'HANDOVER_IMPORTED_HISTORY'};
        const backup=backups?await readBackup(record.backupOperationId):undefined;
        const error=stopError||archiveFault||backup?.error;
        const phase=error?'uncertain':record.readyRevision===undefined?'closing':backup?.phase==='verified-restorable'?'verified':backup?.phase==='failed'?'failed':'copying';
        return {operationId:id,roleId,phase,record:structuredClone(record),...(backup?{backup}:{}),...(error?{error}:{})};
    }
    function recoverReadonlyHandover(request:HandoverRequest,record:HandoverRecord):Promise<HandoverProgress>{
        const reader=activationReadHome;if(!reader||homeClosed||!backups||execution)throw new ExecutionError('HANDOVER_RECOVERY_UNAVAILABLE');
        const previous=handoverRequests.get(request.operationId);if(previous){if(previous.destination!==request.destination)throw new ExecutionError('OPERATION_CONFLICT');return previous.task;}
        const task=(async()=>{
            const diagnostic=await reader.readActivationDiagnostic?.();if(diagnostic?.reason!=='SOURCE_HANDOVER_PENDING'&&diagnostic?.reason!=='SOURCE_HANDOVER_RELEASED')throw new ExecutionError('READ_ONLY_HOME');
            maintenancePending=true;reason='HANDOVER_RECORD_RECONCILIATION';
            const writes=Promise.resolve().then(async()=>{
                await backups.reserve({operationId:record.backupOperationId,destination:request.destination},record.stopOperationId);
                const uncertain=(await reader.readSnapshot()).uncertainOperationId;if(uncertain)await reader.reconcileOperation(uncertain);
                let current=reader.handoverSnapshots().find(item=>item.operationId===record.operationId)!;
                if(current.readyRevision===undefined){
                    const state=await reader.readConversation();for(const turn of state.turns.filter(turn=>turn.status!=='finished')){await recoverNativeGaps(reader,turn,state);await recoverPendingAttempts(reader,turn,state);}
                    const prior=reader.stopSnapshots().find(stop=>stop.operationId===record.stopOperationId),priorNativeFlush=prior?.checkpoint==='ready-to-close'&&prior.requestedRevision>record.requestedRevision?'source-checkpoint':'unknown';
                    if(!current.recovery)await reader.reconcileHandover({operationId:OperationId('handover-reconcile-'+createHash('sha256').update(record.operationId).digest('hex')),handoverOperationId:record.operationId,priorNativeFlush});
                    if(!prior)await reader.requestStop({operationId:record.stopOperationId,reason:'owner-stop'});
                    if(reader.stopSnapshots().find(stop=>stop.operationId===record.stopOperationId)?.checkpoint==='requested')await reader.checkpointStop({operationId:OperationId('stop-checkpoint-'+createHash('sha256').update(record.stopOperationId).digest('hex')),stopOperationId:record.stopOperationId});
                    await reader.readyHandover({operationId:OperationId('handover-ready-'+createHash('sha256').update(record.operationId).digest('hex')),handoverOperationId:record.operationId});
                    current=reader.handoverSnapshots().find(item=>item.operationId===record.operationId)!;
                }
                activeHandover=current;retainedHandovers.set(current.operationId,current);retainedHome=await projectHome(reader);
            });
            handoverRecoveryWrites.set(request.operationId,writes);void writes.then(()=>{if(handoverRecoveryWrites.get(request.operationId)===writes)handoverRecoveryWrites.delete(request.operationId);},()=>{});
            try{await writes;backupErrors.delete(record.backupOperationId);await beginStop('owner-stop');const copy=(async()=>{try{await stopped;await backups.copy({operationId:record.backupOperationId,destination:request.destination});}catch(error){backupErrors.set(record.backupOperationId,safeExecutionCode(error));}})();backupRuns.set(record.backupOperationId,copy);void copy.finally(()=>{if(backupRuns.get(record.backupOperationId)===copy)backupRuns.delete(record.backupOperationId);});return readHandover(request.operationId);}
            catch(error){backupErrors.set(record.backupOperationId,safeExecutionCode(error));throw error;}
        })();
        handoverRequests.set(request.operationId,{destination:request.destination,task});const clear=()=>{if(handoverRequests.get(request.operationId)?.task===task)handoverRequests.delete(request.operationId);};void task.then(clear,clear);return task;
    }
    async function requestHandover(request:HandoverRequest):Promise<HandoverProgress>{
        if(!validateHandoverRequest(request))throw new ExecutionError('INVALID_HANDOVER');
        const old=handoverRequests.get(request.operationId);if(old){if(old.destination!==request.destination)throw new ExecutionError('OPERATION_CONFLICT');return old.task;}
        if(!home||homeClosed){
            const result=await readHandover(request.operationId);if(!result.record)throw new ExecutionError('HOME_UNAVAILABLE');
            if(result.record.destinationDigest!==createHash('sha256').update(request.destination).digest('hex'))throw new ExecutionError('OPERATION_CONFLICT');
            if(result.history)return result;
            if(result.phase!=='verified'&&activationReadHome&&!homeClosed)return recoverReadonlyHandover(request,result.record);
            if(result.phase!=='verified'&&homeClosed&&result.record.readyRevision!==undefined){await requestBackup({operationId:result.record.backupOperationId,destination:request.destination});return readHandover(request.operationId);}
            return result;
        }
        const task=(async()=>{
            const digest=createHash('sha256').update(request.destination).digest('hex'),existing=home.handoverSnapshots().find(record=>record.operationId===request.operationId);
            if(existing){if(existing.destinationDigest!==digest)throw new ExecutionError('OPERATION_CONFLICT');if(!currentOutgoingHandover(existing,home.restoreAcceptanceSnapshot()?.committedRevision))return readHandover(request.operationId);activeHandover=existing;}
            else{
                const previous=handoverIntents.get(request.operationId);
                if(previous&&(previous.request.destination!==request.destination||previous.request.expectedRevision!==request.expectedRevision))throw new ExecutionError('OPERATION_CONFLICT');
                if(!writable()&&!previous?.sealed&&home.operationSnapshot(request.operationId).kind!=='uncertain')throw new ExecutionError('READ_ONLY_HOME');
                const key=createHash('sha256').update(home.roleId+':'+request.operationId).digest('hex');
                if(!previous?.sealed){if(!backups)throw new ExecutionError('BACKUP_UNAVAILABLE');await backups.preflight({operationId:OperationId('handover-backup-'+key),destination:request.destination});}
                const intent=previous??{request:Object.freeze({...request}),sealed:false};handoverIntents.set(request.operationId,intent);
                try{await home.requestHandover({operationId:request.operationId,handoverId:HandoverId('handover-'+key),backupOperationId:OperationId('handover-backup-'+key),stopOperationId:OperationId('handover-stop-'+key),destinationDigest:digest,expectedRevision:request.expectedRevision},()=>{intent.sealed=true;maintenancePending=true;status='stopping';reason='HANDOVER_REQUEST_PENDING';ports.inbound?.seal();historyRuntime?.interrupt('ROLE_STOPPING');});}
                catch(error){if(intent.sealed){intent.error=safeExecutionCode(error);reason=intent.error;}else if(handoverIntents.get(request.operationId)===intent)handoverIntents.delete(request.operationId);throw error;}
                activeHandover=home.handoverSnapshots().find(record=>record.operationId===request.operationId);if(activeHandover)handoverIntents.delete(request.operationId);
            }
            if(!activeHandover)throw new ExecutionError('HANDOVER_NOT_FOUND');
            retainedHandovers.set(request.operationId,activeHandover);
            await requestBackup({operationId:activeHandover.backupOperationId,destination:request.destination});
            return readHandover(request.operationId);
        })();
        handoverRequests.set(request.operationId,{destination:request.destination,task});const clear=()=>{if(handoverRequests.get(request.operationId)?.task===task)handoverRequests.delete(request.operationId);};void task.then(clear,clear);return task;
    }
    function projectBackup(progress:BackupProgress):BackupProgress{
        const error=backupErrors.get(progress.operationId);if(error)return {...progress,phase:'uncertain',error};
        if(progress.phase==='stopping'&&activeStopId===progress.stopOperationId&&(stopError||archiveFault))return {...progress,error:stopError||archiveFault};
        if(['stopping','stopped','copying','verifying'].includes(progress.phase)&&!backupRequests.has(progress.operationId)&&!backupRuns.has(progress.operationId)&&!(progress.phase==='stopping'&&activeStopId===progress.stopOperationId&&status==='stopping'))return {...progress,phase:'uncertain',error:'BACKUP_RECONCILIATION_REQUIRED'};
        return progress;
    }
    async function readBackup(operationId:OperationId):Promise<BackupProgress>{if(!backups)throw new ExecutionError('BACKUP_UNAVAILABLE');return projectBackup(await backups.read(OperationId(operationId)));}
    async function requestBackup(request:BackupRequest):Promise<BackupProgress>{
        const owned=Object.freeze({operationId:OperationId(request.operationId),destination:request.destination}),prior=backupRequests.get(owned.operationId);
        if(prior){if(prior.destination!==owned.destination)throw new ExecutionError('OPERATION_CONFLICT');return prior.task;}
        const task=prepareBackup(owned);backupRequests.set(owned.operationId,{destination:owned.destination,task});
        const clear=()=>{if(backupRequests.get(owned.operationId)?.task===task)backupRequests.delete(owned.operationId);};void task.then(clear,clear);return task;
    }
    async function prepareBackup(request:BackupRequest):Promise<BackupProgress>{
        if(!backups)throw new ExecutionError('BACKUP_UNAVAILABLE');OperationId(request.operationId);
        const prior=await backups.read(request.operationId);if(prior.phase!=='not-found'&&prior.destination!==request.destination)throw new ExecutionError('OPERATION_CONFLICT');
        if(prior.phase==='not-found'&&home&&!homeClosed&&home.operationSnapshot(request.operationId).kind!=='not-found')throw new ExecutionError('OPERATION_CONFLICT');
        if(prior.checkpoint==='verified'){backupErrors.delete(request.operationId);if(prior.phase==='verified-restorable')return prior;return backups.verify(request.operationId);}
        const runningBackup=backupRuns.get(request.operationId);if(runningBackup){if(prior.phase!=='failed'&&prior.phase!=='uncertain'&&!backupErrors.has(request.operationId))return readBackup(request.operationId);await runningBackup;if(backupRuns.get(request.operationId)===runningBackup)backupRuns.delete(request.operationId);}
        backupErrors.delete(request.operationId);
        if(prior.sourceRevision===undefined){
            if(!home)throw new ExecutionError('BACKUP_STOP_REQUIRED');
            if(status==='read-only')throw new ExecutionError('READ_ONLY_HOME');
            const stopOperationId=activeStopId??(activeHandover?.backupOperationId===request.operationId?activeHandover.stopOperationId:OperationId('backup-stop-'+randomUUID()));
            try{await backups.reserve(request,stopOperationId,()=>{maintenancePending=true;if(status!=='stopped')status='stopping';});}catch(error){const saved=await backups.read(request.operationId);if(saved.phase!=='not-found'||status==='stopping'){maintenancePending=true;void beginStop('owner-stop',saved.phase==='not-found'?stopOperationId:saved.stopOperationId).catch(()=>{});}throw error;}
            maintenancePending=true;await beginStop('owner-stop',stopOperationId);
        }
        const task=(async()=>{try{if(prior.sourceRevision===undefined)await stopped;await backups.copy(request);maintenancePending=!!(await backups.pending()).length;}catch(error){backupErrors.set(request.operationId,safeExecutionCode(error));}})();
        backupRuns.set(request.operationId,task);void task.finally(()=>{if(backupRuns.get(request.operationId)===task)backupRuns.delete(request.operationId);});return readBackup(request.operationId);
    }

    function cleanupViews():CleanupView[]{const reader=home??activationReadHome,views=new Map<OperationId,CleanupView>(retainedCleanups);if(reader&&!homeClosed)for(const task of reader.cleanupSnapshots())views.set(task.operationId,task);for(const [id,entry]of cleanupRuns)if(!views.has(id)||entry.view.error)views.set(id,entry.view);return [...views.values()];}
    async function readCleanup(operationId:OperationId):Promise<CleanupView|{readonly operationId:OperationId;readonly phase:'not-found'}>{
        const id=OperationId(operationId);if(homeClosed)return structuredClone(cleanupViews().find(task=>task.operationId===id)??{operationId:id,phase:'not-found' as const});const saved=await readHome().readCleanup(id),entry=cleanupRuns.get(id);return saved.phase==='not-found'?entry?.view??saved:entry?.view.error?{...saved,error:entry.view.error}:saved;
    }
    async function requestCleanup(value:CleanupCommand):Promise<CleanupView>{
        const request=admitCleanupCommand(value);if(!home||homeClosed||status==='read-only')throw new ExecutionError('READ_ONLY_HOME');if(status==='stopping'||status==='stopped'||maintenancePending)throw new ExecutionError('ROLE_STOPPING');
        const saved=await home.readCleanup(request.operationId),prior=cleanupRuns.get(request.operationId);
        if(saved.phase!=='not-found'&&JSON.stringify(saved.request?.selection??saved.preview.selection)!==JSON.stringify(request.selection))throw new ExecutionError('OPERATION_CONFLICT');
        if(saved.phase==='complete')return saved;
        if(prior?.task){if(JSON.stringify(prior.request)!==JSON.stringify(request))throw new ExecutionError('OPERATION_CONFLICT');return readCleanup(request.operationId) as Promise<CleanupView>;}
        let admission:CleanupAdmission|undefined;cleanupSealed=true;
        try{if(saved.phase==='not-found')admission=await home.prepareCleanup(request);}catch(error){cleanupSealed=home.cleanupSnapshots().some(task=>task.phase!=='complete');schedule();throw error;}
        const entry:{request:CleanupCommand;view:CleanupView;task?:Promise<void>}={request,view:saved.phase==='not-found'?{operationId:request.operationId,phase:'waiting-actions',request,preview:admission!.preview,physical:{complete:false}}:saved};cleanupRuns.set(request.operationId,entry);
        const task=Promise.resolve().then(async()=>{
            try{
                if(admission){historyRuntime?.interrupt('SOURCE_CLEANUP');afterTools(()=>currentAbort?.abort());await working;await deliveryScheduler;await Promise.all([...sendingTasks.values()]);await historyRuntime?.drain();await quiesceTools();await drain();if(blockedTurn)throw new ExecutionError(lifecycleFault||archiveFault||'TURN_FINALIZATION_PENDING');
                    for(const turn of (await home.readConversation()).turns.filter(turn=>turn.status==='running')){const quiet=await execution?.quiesce(turn.runId);if(!quiet?.idle||!quiet.flushed)throw new ExecutionError('NATIVE_FLUSH_UNCONFIRMED');await home.finishTurn({operationId:OperationId('cleanup-interrupted-'+turn.runId),runId:turn.runId,contextGeneration:turn.contextGeneration,outcome:{kind:'failure',reason:'SOURCE_CLEANUP'}});await execution?.release?.(turn.runId);}
                    await admission.commit();entry.view=await home.readCleanup(request.operationId) as CleanupProgress;
                }
                entry.view=await home.continueCleanup(request.operationId);
            }catch(error){entry.view={...entry.view,error:safeExecutionCode(error)};}finally{admission?.release();cleanupSealed=home.cleanupSnapshots().some(task=>task.phase!=='complete');if(entry.view.phase==='complete')cleanupRuns.delete(request.operationId);if(!cleanupSealed){completeStartup();schedule();}}
        });entry.task=task;void task.finally(()=>{if(entry.task===task)entry.task=undefined;});return structuredClone(entry.view);
    }

    const unlistenClose=execution?.onClosing?.(code=>{requestStop('unload');if(code)stopReason=code;});
    const unlisten=execution?.onAvailability?.(()=>{void execution.inspect().then(info=>{if(!writable())return;ready=info.available;availabilityReason=info.reason;status=ready?'ready':'not-ready';reason=info.reason;if(startupPending||!startupRecovered){status='not-ready';reason='STOP_RECOVERY_PENDING';return;}if(ready)schedule();}).catch(()=>{fault='EXECUTION_STATUS_FAILED';});});
    const pendingStops=home?.stopSnapshots().filter(stop=>stop.reconciledRevision===undefined&&restoreRevisionEligible(restored,stop.requestedRevision))??[];
    const pendingHistory=home?(await home.readQQHistory()).queries.filter(q=>q.phase==='running'):[];
    if(home&&(pendingStops.length||pendingHistory.length)){
        startupPending=true;startupRecovered=false;status='not-ready';reason='STOP_RECOVERY_PENDING';
        const recovery=archive(OperationId('stop-recovery-'+createHash('sha256').update([...pendingStops.map(stop=>stop.operationId),...pendingHistory.map(query=>query.operationId)].join(':')).digest('hex')),async()=>{
            await historyRuntime?.recover();
            const state=await home.readConversation();
            for(const turn of state.turns.filter(turn=>turn.status==='running')){await recoverNativeGaps(home,turn,state);await recoverPendingAttempts(home,turn,state);}
            for(const stop of pendingStops)await home.reconcileStop({operationId:OperationId('stop-reconcile-'+createHash('sha256').update(stop.operationId).digest('hex')),stopOperationId:stop.operationId});
            if(pendingStops.length)recovering=false;startupRecovered=true;
        });
        void recovery.then(()=>{startupPending=false;completeStartup();schedule();},()=>{startupPending=false;reason=archiveFault||'STOP_RECOVERY_BLOCKED';});
    }else if(maintenancePending){status=home?'not-ready':status;reason='BACKUP_MAINTENANCE_PENDING';}else schedule();
    return Object.freeze({
        runtime:Object.freeze({
            receive:receiveInput,
            wake,
            async inspect():Promise<RoleView>{const report=status==='stopping'||status==='stopped'?undefined:await diagnostic(),viewHome=home??activationReadHome,scheduleView=await projectSchedule(),formatView=projectFormat(viewHome,report,formatUpgradeTask);return {...(formatView?{format:formatView}:{}),...(viewHome&&cleanupViews().length?{cleanups:cleanupViews()}:{}),...(scheduleView?{schedule:scheduleView}:{}),...(backups?{backups:(await backups.list()).map(projectBackup)}:{}),status,reason:archiveFault||lifecycleFault||fault||stopReason||(formatUpgradeSealed?'FORMAT_UPGRADE_PENDING':cleanupSealed?'SOURCE_CLEANUP_PENDING':'')||(status==='read-only'?report?.reason:reason)||reason,roleId:status==='read-only'?report?.verifiedRoleId??null:home?.roleId??activationReadHome?.roleId??null,revision:status==='read-only'?report?.verifiedRevision??null:home?.revision??activationReadHome?.revision??null,...(viewHome?{home:homeClosed||status==='stopping'||startupPending?retainedHome:await projectHome(viewHome,!!home&&!!ready&&!fault&&!archiveFault&&!blockedTurn&&!maintenancePending)}:{}),...(activeStopId&&stopOperation?.stop?{stop:stopView().stop}:{}),...(report&&capability?{diagnostic:report}:{}),...(execution?{execution:await execution.inspect()}:{})};}
        }),
        owner:Object.freeze({
            async readLibraryOverviewFacts(){
                const reader=await readHome().openContextReader({purpose:'management'});
                try{
                    const [snapshot,conversation,knowledge,sourceFacts]=await Promise.all([
                        readHome().readSnapshot(),
                        readHome().readConversation(),
                        readHome().readKnowledge(),
                        readLibraryOverviewSources(reader),
                    ]);
                    if(snapshot.revision!==conversation.revision
                        ||snapshot.revision!==knowledge.revision
                        ||snapshot.revision!==reader.basis.revision)throw new ExecutionError('LIBRARY_OVERVIEW_CHANGED');
                    return structuredClone({
                        snapshot,
                        conversation,
                        knowledge,
                        sources:sourceFacts.sources,
                        recentSources:sourceFacts.recentSources,
                        health:{
                            archivePending:archiveJobs().length,
                            archiveFault,
                            executionFault:fault,
                            lifecycleFault,
                            blockedTurnReason,
                        },
                    });
                }finally{
                    reader.revoke();
                }
            },
            async readCleanupCatalog(page:CleanupCatalogPageRequest){
                const reader=readHome();
                const [snapshot,conversation]=await Promise.all([reader.readSnapshot(),reader.readConversation()]);
                return cleanupCatalogPage(snapshot,conversation,page);
            },
            async previewFormatUpgrade(){if(!home||homeClosed)throw new ExecutionError('HOME_UNAVAILABLE');return home.previewFormatUpgrade();},
            async requestFormatUpgrade(request:FormatUpgradeRequest){
                if(!home||homeClosed)throw new ExecutionError('HOME_UNAVAILABLE');
                if(status==='read-only')throw new ExecutionError('READ_ONLY_HOME');
                if(status==='stopping'||status==='stopped')throw new ExecutionError('ROLE_STOPPING');
                if(maintenancePending)throw new ExecutionError('BACKUP_MAINTENANCE_PENDING');
                if(cleanupSealed)throw new ExecutionError('SOURCE_CLEANUP_PENDING');
                if(formatUpgradeSealed)throw new ExecutionError('FORMAT_UPGRADE_PENDING');
                let progress:FormatUpgradeProgress;
                try{progress=await home.requestFormatUpgrade(request);}
                catch(error){
                    const code=safeExecutionCode(error);
                    // A refused request still leaves a durable, queryable task.
                    if(code==='FORMAT_UPGRADE_BACKUP_REQUIRED'){const failed=await home.readFormatUpgrade(OperationId(request.operationId));if(failed.phase!=='not-found'){retainedFormatUpgrades.set(failed.operationId,failed);formatUpgradeTask=failed;}}
                    throw error;
                }
                retainedFormatUpgrades.set(progress.operationId,progress);formatUpgradeTask=progress;
                if(progress.phase==='failed')return structuredClone(progress);
                formatUpgradeSealed=true;stopScheduler();historyRuntime?.interrupt('FORMAT_UPGRADE');afterTools(()=>currentAbort?.abort());
                try{
                    await working;await deliveryScheduler;await Promise.all([...sendingTasks.values()]);await historyRuntime?.drain();await quiesceTools();await drain();
                    if(blockedTurn)throw new ExecutionError(lifecycleFault||archiveFault||'TURN_FINALIZATION_PENDING');
                    // The running lifetime must be quiescent before the successor generation is written.
                    for(const turn of (await home.readConversation()).turns.filter(turn=>turn.status==='running')){const quiet=await execution?.quiesce(turn.runId);if(!quiet?.idle||!quiet.flushed)throw new ExecutionError('NATIVE_FLUSH_UNCONFIRMED');await home.finishTurn({operationId:OperationId('format-upgrade-interrupted-'+turn.runId),runId:turn.runId,contextGeneration:turn.contextGeneration,outcome:{kind:'failure',reason:'FORMAT_UPGRADE'}});await execution?.release?.(turn.runId);}
                    progress=await home.continueFormatUpgrade(progress.operationId);
                }catch(error){
                    const code=safeExecutionCode(error),saved=await home.readFormatUpgrade(progress.operationId);
                    progress=saved.phase==='not-found'?{...progress,phase:'failed',error:code}:saved;
                    retainedFormatUpgrades.set(progress.operationId,progress);formatUpgradeTask=progress;
                    throw error;
                }finally{
                    retainedFormatUpgrades.set(progress.operationId,progress);formatUpgradeTask=progress;
                    formatUpgradeSealed=progress.phase!=='switched'&&progress.phase!=='failed';
                    if(!sealed()){completeStartup();schedule();}
                }
                return structuredClone(progress);
            },
            async readFormatUpgrade(operationId:OperationId){
                const id=OperationId(operationId);
                if(formatUpgradeTask?.operationId===id)return structuredClone(formatUpgradeTask);
                const retained=retainedFormatUpgrades.get(id);if(retained)return structuredClone(retained);
                if(home&&!homeClosed)return home.readFormatUpgrade(id);
                return {operationId:id,phase:'not-found' as const};
            },
            async resumeFormatUpgrade(request:FormatUpgradeRequest){
                if(!home||homeClosed)throw new ExecutionError('HOME_UNAVAILABLE');
                if(status==='read-only')throw new ExecutionError('READ_ONLY_HOME');
                if(maintenancePending)throw new ExecutionError('BACKUP_MAINTENANCE_PENDING');
                if(cleanupSealed)throw new ExecutionError('SOURCE_CLEANUP_PENDING');
                const progress=await home.resumeFormatUpgrade(request);
                retainedFormatUpgrades.set(progress.operationId,progress);formatUpgradeTask=progress;
                formatUpgradeSealed=progress.phase!=='switched'&&progress.phase!=='failed';
                if(!sealed()){completeStartup();schedule();}
                return structuredClone(progress);
            },
            async previewCleanup(selection:CleanupSelection){if(status==='read-only')throw new ExecutionError('READ_ONLY_HOME');return readHome().previewCleanup(selection);},
            requestCleanup,readCleanup,
            async queryQQHistory(request:{readonly operationId:OperationId;readonly expectedBindingVersion?:import('../home/ids.ts').BindingVersion}){if(!historyRuntime)throw new ExecutionError('HOME_UNAVAILABLE');return historyRuntime.query(request);},
            async selectQQHistory(request:import('../home/qq-history.ts').SelectQQHistory){if(!historyRuntime)throw new ExecutionError('HOME_UNAVAILABLE');return historyRuntime.select(request);},
            async readQQHistory(){if(!historyRuntime||homeClosed)throw new ExecutionError('HOME_UNAVAILABLE');return historyRuntime.read();},
            async confirmRestore(request:RestoreConfirmation){const reader=activationReadHome??(home?.restoreAcceptanceSnapshot()?.operationId===request.operationId?home:undefined);if(!reader||homeClosed||status==='stopping'||status==='stopped')throw new ExecutionError('RESTORE_CONFIRMATION_UNAVAILABLE');return reader.confirmRestore(request);},
            async completeRestoreRegistration(request:RestoreRegistrationRequest){
                if(!request||typeof request!=='object'||Object.getPrototypeOf(request)!==Object.prototype||Object.keys(request).sort().join('|')!=='acceptanceOperationId|stage'||!['attach','register'].includes(request.stage))throw new ExecutionError('INVALID_RESTORE_REGISTRATION');
                const id=OperationId(request.acceptanceOperationId),reader=activationReadHome??home;if(!reader||homeClosed||status==='stopping'||status==='stopped')throw new ExecutionError('HOME_UNAVAILABLE');
                if(reader.restoreAcceptanceSnapshot()?.operationId!==id||await reader.readActivationDiagnostic?.())throw new ExecutionError('RESTORE_NOT_CONFIRMED');
                const ids=restoreRegistrationIds(id);return reader.applyOwner(request.stage==='attach'?{kind:'attach-home',operationId:ids.attachOperationId,roleId:reader.roleId}:{kind:'register-home',operationId:ids.registrationOperationId,targetOperationId:ids.attachOperationId});
            },
            requestRestore:restoreRuntime.request,readRestore:restoreRuntime.read,requestHandover,readHandover,requestBackup,readBackup,resumeBackup:requestBackup,
            async verifyBackup(operationId:OperationId){if(!backups)throw new ExecutionError('BACKUP_UNAVAILABLE');const result=await backups.verify(OperationId(operationId));backupErrors.delete(operationId);return result;},
            async stop(request:StopRequest){
                const id=OperationId(request.operationId);if(activeStopId===id){await stopRequest;return stopView();}
                if(!home||homeClosed)throw new ExecutionError('HOME_UNAVAILABLE');
                const prior=home.operationSnapshot(id);if(prior.stop){if(prior.stop.reason!=='owner-stop')throw new ExecutionError('OPERATION_CONFLICT');return prior;}if(prior.kind!=='not-found')throw new ExecutionError('OPERATION_CONFLICT');
                if(activeStopId)throw new ExecutionError('STOP_ALREADY_REQUESTED');
                if(!writable())throw new ExecutionError('READ_ONLY_HOME');await beginStop('owner-stop',id);return stopView();
            },
            async retryArchives(){
                if(!home)throw new ExecutionError('HOME_UNAVAILABLE');const priorReason=archiveFault;
                for(const {operationId,job}of archiveJobs()){try{await job.task;}catch{}if(job.code){debts.delete(job.task);toolDebts.delete(job.task);removeArchive(operationId,job);await archive(operationId,job.save,job.toolLifetime);}}
                while(true){const pending=archiveJobs().map(x=>x.job).filter(job=>!job.code);if(!pending.length)break;await Promise.all(pending.map(job=>job.task));}
                if(archives.size)return {pending:archiveJobs().length,revision:home.revision};for(const id of abandonedSends){const attempt=(await home.readConversation()).sendAttempts.find(a=>a.sendAttemptId===id);if(attempt&&!attempt.observation)await archive(OperationId('abandon-'+id),()=>home.settleDelivery({operationId:OperationId('abandon-'+id),sendAttemptId:id,observation:{kind:'rejected',code:'SEND_NOT_DISPATCHED'}}));abandonedSends.delete(id);}archiveFault='';
                if(blockedTurn){const alreadyFinished=(await home.readConversation()).turns.some(turn=>turn.runId===blockedTurn!.runId&&turn.status==='finished');if(!alreadyFinished){const quiet=await execution!.quiesce(blockedTurn.runId);if(!quiet.flushed)throw new ExecutionError('NATIVE_FLUSH_UNCONFIRMED');const latest=await home.readSnapshot();if(latest.contextGeneration!==blockedTurn.contextGeneration)await home.refreshTurnContext({operationId:OperationId('refresh-'+randomUUID()),runId:blockedTurn.runId,previousGeneration:blockedTurn.contextGeneration,nextGeneration:latest.contextGeneration});await home.finishTurn({operationId:OperationId('archive-failure-'+blockedTurn.runId),runId:blockedTurn.runId,contextGeneration:latest.contextGeneration,outcome:{kind:'failure',reason:blockedTurnReason||priorReason||lifecycleFault||'ARCHIVE_RECOVERED_RUN_FAILED'}});}await execution!.release?.(blockedTurn.runId);blockedTurn=undefined;blockedTurnReason='';lifecycleFault='';}
                if(status==='stopping')advanceStop();else{completeStartup();schedule();}
                return {pending:archiveJobs().length,revision:home.revision};
            },
            async previewProjection(projectionId:ProjectionId){if(!home||!writable())throw Object.assign(new Error('HOME_UNAVAILABLE'),{code:'READ_ONLY_HOME'});return home.previewProjection(projectionId);},
            readDiagnostic:diagnostic,
            async readPreservedProjection(operationId:OperationId){if(!home||!writable())throw Object.assign(new Error('HOME_UNAVAILABLE'),{code:'READ_ONLY_HOME'});return home.readPreservedProjection(operationId);},
            async apply(command:OwnerCommand):Promise<OwnerReceipt>{
                // Only the runtime's own ClockPort may stamp a trusted reading; caller-supplied clocks are stripped.
                if(command.kind==='edit-autonomy-rules')command=Object.freeze({...command,clock:clock.read()});
                else if(command.kind==='review-autonomy-clock')command=Object.freeze({...command,clock:clock.read()});
                if(command.kind==='cleanup-sources'){const progress=await requestCleanup(command);if(progress.phase==='waiting-actions')return {operationId:command.operationId,kind:'unavailable',reason:'SOURCE_CLEANUP_PENDING'};return home!.applyOwner(command);}
                if(formatUpgradeSealed)return {operationId:command.operationId,kind:'unavailable',reason:'FORMAT_UPGRADE_PENDING'};
                if(cleanupSealed)return {operationId:command.operationId,kind:'unavailable',reason:'SOURCE_CLEANUP_PENDING'};
                if(command.kind==='edit-autonomy-rules'){sealAutonomy();if(home&&writable()){if(!validAutonomyRules(command.value))throw new ExecutionError('INVALID_AUTONOMY_RULES');const old=await home.readOperation(command.operationId);if(old.kind==='not-found'){const a=await home.readAutonomy();if(command.expectedAutonomyRulesVersion!==a.rules.version)throw new ExecutionError('AUTONOMY_RULES_VERSION_CONFLICT');if(command.value.outputTokens!==a.rules.value.outputTokens){if(!execution)throw new ExecutionError('MODEL_ROUTE_UNAVAILABLE');await execution.prepare(command.value.outputTokens);}if(command.value.wakeIntervalMs!==a.rules.value.wakeIntervalMs){const savedSchedule=await home.readAutonomySchedule().catch(()=>null);const nextSchedule=recomputedSchedule(savedSchedule??undefined,command.value.wakeIntervalMs);if(nextSchedule)await home.rescheduleAutonomyFuture({operationId:OperationId('interval-'+createHash('sha256').update(command.operationId+':schedule').digest('hex').slice(0,40)),nextOpportunityAt:nextSchedule.nextOpportunityAt});}}}}if(command.kind==='resolve-delivery'&&home&&writable()){if(!validateResolveDelivery(command))throw new ExecutionError('INVALID_DELIVERY_RESOLUTION');const snapshot=await home.readSnapshot();if(snapshot.uncertainOperationId&&snapshot.uncertainOperationId!==command.operationId)throw new ExecutionError('IO_UNCERTAIN');const previous=await home.readOperation(command.operationId);if(previous.kind==='not-found'&&command.decision==='resend'){const state=await home.readConversation(),original=state.deliveries.find(d=>d.deliveryId===command.deliveryId);if(!original||!sameQQTarget(snapshot.qqBinding,original.target))throw new ExecutionError('QQ_BINDING_CHANGED');if(!deliveryPort?.canSend(original.target))throw new ExecutionError('QQ_SEND_UNAVAILABLE');}}if(command.kind==='edit-conversation'&&home&&writable()){if(!validateConversationSettings(command.value))throw new ExecutionError('INVALID_CONVERSATION_SETTINGS');const old=await home.readOperation(command.operationId);if(old.kind==='not-found'){const c=await home.readConversation();if(command.expectedConversationVersion!==c.rules.version)throw new ExecutionError('CONVERSATION_VERSION_CONFLICT');if(!execution)throw new ExecutionError('MODEL_ROUTE_UNAVAILABLE');await execution.prepare(command.value.outputTokens);}}if(home&&writable()){const before=command.kind==='bind-qq'?(await home.readSnapshot()).qqBinding:undefined;const result=await home.applyOwner(command);if(command.kind==='bind-qq'){const after=(await home.readSnapshot()).qqBinding;if(after&&!sameQQTarget(before,after))historyRuntime?.interrupt('QQ_BINDING_CHANGED');}if(command.kind==='set-autonomy-pause'||command.kind==='edit-autonomy-rules'){clearScheduler();schedulerSkipReason=null;if(result.kind==='committed')void armTimer();}schedule();return result;}return {operationId:command.operationId,kind:'unavailable',reason:maintenancePending?'BACKUP_MAINTENANCE_PENDING':status==='read-only'?'read-only-home':stopReason||reason};},
            async readOperation(operationId:OperationId):Promise<OperationView>{if(activeStopId===operationId)return stopView();if(homeClosed&&retainedStops.has(operationId))return structuredClone(retainedStops.get(operationId)!);return home&&!homeClosed?home.readOperation(operationId):activationReadHome&&status==='read-only'&&!homeClosed?activationReadHome.readOperation(operationId):capability?{operationId,kind:'unavailable',reason:status}:{operationId,kind:'not-found'};},
            async readDeliveryRules(){return readHome().readDeliveryRules();},
            async readWebRules(){return readHome().readWebRules();},
            async readRetryRules(){return readHome().readRetryRules();},
            async readContactRules(){return readHome().readContactRules();},
            async readContactState(){const snapshot=await contactReadStamp();return {state:await readHome().readConversation(),stamp:snapshot,lastBlockedReason:lastContactBlocked};},
            async readFileAccess(){return readHome().readFileAccess();},
            async readFileRules(){return readHome().readFileRules();},
            async readReadRules(){return readHome().readReadRules();},
            async readProposalRules(){return readHome().readProposalRules();},
            async readAutonomy(){return readHome().readAutonomy();},
            async readAutonomyAttribution(request:{readonly runId?:RunId}){return readHome().readAutonomyAttribution(request);},
            async readKnowledge(){return readHome().readKnowledge();},
            async readContextSources(page:ContextSourcePageRequest){const reader=await readHome().openContextReader({purpose:'management'});try{return await readContextSourcePage(reader,page);}finally{reader.revoke();}},
            async readContextSource(request:ContextSourceRead){const reader=await readHome().openContextReader({purpose:'management'});try{return await readContextSourcePart(reader,request);}finally{reader.revoke();}},
            async readLibrarySources(request:LibrarySourceQuery){const reader=await readHome().openContextReader({purpose:'management'});try{return await projectLibrarySources(reader,request);}finally{reader.revoke();}},
            async readConversation(){return readHome().readConversation();},
            async readExecutionRecord(request:ExecutionRecordRead){return readHome().readExecutionRecord(request);},
            async readReply(request:ReplyRead){return readHome().readReply(request);}
        }),
        lifetime:Object.freeze({stopped,requestStop})
    });
}
