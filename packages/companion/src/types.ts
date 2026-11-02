export type {AutonomyRulesEditRequest,WakeRoleRequest,AutonomyPauseRequest,AutonomyView,AutonomyScheduleView,ActivityRecordRead,ActivityRecordPart,ActivitySummary,ClockReviewRequest,AutonomyAttributionRequest,AutonomyAttributionView} from './types.autonomy.ts';
export type {AutonomyAttributionRun,AutonomyWindow,AutonomyWindowTransition} from './home/autonomy.ts';
export type {RestoreConfirmation,RestoreAcceptance} from './home/restore-acceptance.ts';
export type {HandoverRequest,HandoverProgress,HandoverRecord} from './home/handovers.ts';
export type {RestoreRequest,RestoreRead,RestoreProgress,RestorePhase} from './home/restores.ts';
import type {ProposalRulesSnapshot} from './home/proposal-rules.ts';
export type {CleanupSelection,CleanupCommand,CleanupPreview,CleanupProgress,CleanupWaiting} from './home/cleanup.ts';
export type {CleanupCatalogItem,CleanupCatalogPage,CleanupCatalogPageRequest,LibraryMaintenanceView,MaintenanceHealth} from './types.library.maintenance.ts';
import type {WebRulesSnapshot} from './home/web.ts';
export type {KnowledgePageRequest,KnowledgePage,KnowledgeRecordRef,KnowledgeRecordSummary,KnowledgeRecordRead,KnowledgeRecordPart,KnowledgeRollbackRequest,KnowledgeDifferenceRequest,KnowledgeDifference,KnowledgeDifferenceField} from './types.knowledge.ts';
export type {ExecutionLibraryCollection,ExecutionLibraryChannel,ExecutionLibrarySort,ExecutionLibraryToolName,ExecutionLibraryResult,ExecutionLibraryQuery,ExecutionLibraryItem,ExecutionLibraryPage,ExecutionLibraryDetailRequest,ExecutionLibrarySectionField,ExecutionLibrarySection,ExecutionLibraryDetail,ExecutionLibraryPartRequest,ExecutionLibraryPart} from './types.library.executions.ts';
export type {KnowledgeLibraryQuery,KnowledgeLibraryPage,KnowledgeLibraryRecordSummary,KnowledgeLibraryScope,KnowledgeLibraryOrder,KnowledgeLibraryDetailRequest,KnowledgeLibraryDetail,KnowledgeLibrarySourceReference,KnowledgeLibraryOwnerAction} from './types.knowledge.ts';
export type {LibraryMaintenanceTab,LibraryOverviewTarget,LibraryOverviewActionKind,LibraryOverviewAction,LibraryOverviewRecent,LibraryOverview} from './types.library.overview.ts';
export type {BackupRequest,BackupProgress,BackupPhase,BackupFile,BackupMaintenanceSnapshot,BackupMaintenanceRead} from './home/backups.ts';
export type {FormatUpgradeRequest,FormatUpgradeProgress,FormatUpgradePreview,FormatUpgradeView} from './home/format-upgrade.ts';
import type {RetryRulesSnapshot} from './home/retry-rules.ts';
import type {FileRulesSnapshot} from './home/file-rules.ts';
import type {FileAccessSnapshot} from './home/file-access.ts';
import type {ReadRulesSnapshot} from './home/read-rules.ts';
import { ProfileSelectionVersion } from './host-contracts.ts';
import { type CoreVersion, type InputSettingsVersion, type RoleId, type InputId, type BindingId,type MaterialId, type OperationId, type ExperienceId, type RunId, type AttemptId, type ReplyId, type IntentId, type NativeRecordRef, type HomeRevision, type ConversationVersion, type BindingVersion } from './home/ids.ts';
import type { RoleView } from './runtime/index.ts';
export type { PanelInputRequest, InputListView, InputReceipt, InputPageRequest } from './home/inputs.ts';
/** Host and role readiness are separate facts. */
export interface CompanionView {
    readonly restoration?:import('./home/restores.ts').RestoreProgress;
    /** Verified Home facts for owner confirmation/query; neither one grants execution by itself. */
    readonly restorationHandover?:import('./home/handovers.ts').HandoverRecord;
    readonly restorationAcceptance?:import('./home/restore-acceptance.ts').RestoreAcceptance;
    /** Original owner request and CAS from the one machine-local locator; never an activation capability. */
    readonly restorationRequest?:{readonly request:import('./home/restores.ts').RestoreRequest;readonly profileVersion:ProfileSelectionVersion;};
    readonly qq?:QQReceiveSummary;
    readonly packageName: string;
    readonly packageVersion: string;
    readonly requiredDsh: string;
    readonly installed: boolean;
    readonly enabled: boolean | null;
    readonly fiberPhase: string | null;
    readonly role: RoleView;
    readonly bootstrap: BootstrapSelection;
    readonly selectedRoleId: string | null;
    readonly capabilities: readonly string[];
}
export interface QQReceiveSummary{readonly bindingVersion:BindingVersion|0;readonly transport:import('./adapters/onebot.ts').QQReceiveView;}
export type {AutoUpdateValue,AutoUpdateProfile,AutoUpdatePhase,AutoUpdateView} from './host/auto-update.ts';
export interface AutoUpdateEditRequest{readonly operationId:OperationId;readonly expectedVersion:number;readonly value:import('./host/auto-update.ts').AutoUpdateValue;}
export interface QQConnectionEditRequest{readonly operationId:OperationId;readonly expectedProfileVersion:import('./host-contracts.ts').QQProfileVersion;readonly value:Readonly<Record<string,string|number|boolean>>;}
export interface QQBindingEditRequest{readonly operationId:OperationId;readonly accountId:string;readonly peerId:string;readonly expectedRevision:HomeRevision;readonly replaceConfirmed:boolean;}
/** Every read is owner authenticated; private account/peer facts are excluded from inspect/logs/models. */
export interface QQConnectionView{readonly homeRevision:HomeRevision;readonly roleId:RoleId;readonly bindingVersion:BindingVersion|0;readonly profileVersion:import('./host-contracts.ts').QQProfileVersion;readonly lastOperationId:string;readonly value:import('./host/qq-profile.ts').QQTransportParameters;readonly binding:import('./home/qq.ts').QQBinding|null;readonly transport:import('./adapters/onebot.ts').QQReceiveView;readonly credential:{readonly ref:string;readonly configured:boolean;readonly writable:boolean;readonly source:string|null};}
/** Raw profile claims; only opened Home supplies verified business identity. */
export interface BootstrapSelection {
    readonly path: string;
    readonly roleId: string;
    readonly creationOperationId: string;
    readonly registrationOperationId: string;
    readonly version: ProfileSelectionVersion;
}
export interface HomeConnectReceipt {
    readonly operationId: OperationId;
    readonly roleId: RoleId;
    readonly committedRevision: HomeRevision;
    readonly registration: 'registered' | 'unregistered' | 'uncertain';
    readonly errorCode?: string;
}
export interface ConversationPage {readonly offset:number;readonly limit:number;}
export interface ToolMaterialSummary {readonly materialId:MaterialId;readonly source:'sdk-local-spill'|'role-read-result'|'role-file-result'|'role-web-result';readonly bytes:number;readonly digest:string;}
export interface ToolFinalSummary {readonly provenance:'tools-result'|'synthetic-native'|'unavailable';readonly closure:'before-dispatch'|'recovery-not-started'|'recovery-unknown'|'unknown'|null;readonly status:'pending'|'success'|'error'|'unavailable';readonly code:string;readonly value:'saved'|'not-applicable'|'unavailable';readonly contentBlocks:number|null;readonly metaSaved:boolean;}
export interface ToolAttemptSummary {
    readonly name:'role_read'|'role_file'|'role_web_search'|'role_web_fetch'|'role_propose'|'unknown';readonly observation:{readonly status:'returned'|'threw'|'not-recorded';readonly code:string;readonly observedAt:string|null};
    readonly final:ToolFinalSummary;readonly gap:boolean;readonly materials:readonly ToolMaterialSummary[];readonly materialCount:number;readonly materialsMore:boolean;
}
export interface NativeRecordSummary {readonly kind:'canonical-tool-result'|'tool-call'|'tool-result'|'gap'|'synthetic-closure'|'other';readonly status:'success'|'error'|'recorded'|'gap'|'synthetic';readonly code:string;readonly canonicalValue:'saved'|'not-applicable'|'unavailable';readonly closure:'before-dispatch'|'recovery-not-started'|'recovery-unknown'|'unknown'|null;readonly gapKind:'sdk-spill-gap'|'native-exposure-gap'|'file-effect-gap'|null;readonly artifactCount:number;readonly knownArtifactBytes:number|null;}
export interface ConversationView {
    readonly roleId:RoleId;readonly revision:HomeRevision;readonly bindingVersion:BindingVersion;
    readonly rules:import('./home/turns.ts').ConversationRules;readonly retryRules:import('./home/retry-rules.ts').RetryRules;readonly budget:import('./home/budget-view.ts').ConversationBudgetView;
    readonly turns:readonly {readonly runId:RunId;readonly inputIds:readonly InputId[];readonly status:string;readonly deadline:string;readonly outcome:string;readonly reason:string}[];
    readonly attempts:readonly {readonly channel:'panel'|'qq';readonly kind:'model'|'tool'|'web';readonly attemptId:AttemptId;readonly runId:RunId;readonly reservedAt:string;readonly enteredAt:string|null;readonly dispatchObserved:boolean|null;readonly outcome:string;readonly code:string;readonly source:'user'|'autonomous';readonly modelOperation:import('./home/model-operations.ts').ModelOperationClaim|null;readonly modelFailure:import('./home/model-operations.ts').ModelFailure|null;readonly tool:ToolAttemptSummary|null}[];
    readonly nativeRecords:readonly {readonly channel:'panel'|'qq';readonly recordId:NativeRecordRef;readonly runId:RunId;readonly provenance:'tools-result'|'native-session'|'host-denial';readonly summary:NativeRecordSummary}[];
    readonly replies:readonly {readonly replyId:ReplyId;readonly experienceId:ExperienceId;readonly intentId:IntentId;readonly runId:RunId;readonly bindingId:BindingId;readonly bindingVersion:BindingVersion;readonly inputIds:readonly InputId[];readonly committedRevision:HomeRevision;readonly codePoints:number;readonly display:'queryable'}[];
    readonly offset:number;readonly limit:number;readonly totalTurns:number;readonly totalAttempts:number;readonly totalToolAttempts:number;readonly totalReplies:number;readonly totalNativeRecords:number;readonly nextOffset:number|null;
    readonly more:boolean;
    /** 本构建支持的受控工具种类；不发行当前 scope 或资源权限。 */
    readonly tools:readonly ('role_read'|'role_file'|'role_web_search'|'role_web_fetch'|'role_propose')[];readonly retrieval:'local-lexical';readonly automaticRetry:'controlled';
}
export type {ExecutionRecordPage,ExecutionRecordRead,ReplyPage,ReplyRead,ConversationSettings} from './home/turns.ts';
export interface ConversationEditRequest {readonly operationId:OperationId;readonly value:Readonly<Record<string,number>>;readonly expectedConversationVersion:ConversationVersion;readonly expectedRevision:HomeRevision;}

export interface ArchiveRetryReceipt {readonly pending:number;readonly revision:HomeRevision|null;}

export type * from './home/ids.ts';
export type {ProfileSelectionVersion} from './host-contracts.ts';
export type {QQProfileVersion} from './host-contracts.ts';
export type {QQReceiveView} from './adapters/onebot.ts';
export type {QQTransportParameters,QQProfileRecord} from './host/qq-profile.ts';

/** Wire shape is generated; the authenticated adapter validates the original Gateway JSON keys. */
export interface CreateHomeInput {readonly operationId:OperationId;readonly core:string;readonly settings:Readonly<Record<string,number>>;}
export type OwnerEditInput = {readonly kind:'edit-core';readonly operationId:OperationId;readonly text:string;readonly expectedCoreVersion:CoreVersion;readonly expectedRevision:HomeRevision} | {readonly kind:'edit-settings';readonly operationId:OperationId;readonly settings:Readonly<Record<string,number>>;readonly expectedSettingsVersion:InputSettingsVersion;readonly expectedRevision:HomeRevision};

/** Serializable read selectors and grant metadata; capabilities remain Runtime-private. */
export type {RoleReadRequest,RoleReadValue,RoleReadGrants} from './actions/read.ts';

export type {ReadRulesValue,ReadRules,ReadRulesSnapshot} from './home/read-rules.ts';
export interface ReadRulesEditRequest {readonly operationId:OperationId;readonly value:Readonly<Record<string,number>>;readonly expectedReadRulesVersion:import('./home/ids.ts').ReadRulesVersion;readonly expectedRevision:HomeRevision;}
export interface ReadRulesView extends ReadRulesSnapshot {readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly effectiveFrom:'next-tool-admission';}

export type {FileAccessValue,FileAccess,FileAccessSnapshot,FileGrant,FileAccessMode} from './home/file-access.ts';
export interface FileAccessEditRequest {readonly operationId:OperationId;readonly value:import('./home/file-access.ts').FileAccessValue;readonly expectedFileAccessVersion:import('./home/ids.ts').FileAccessVersion;readonly expectedRevision:HomeRevision;}
export interface FileMappingEditRequest {readonly operationId:OperationId;readonly grantId:import('./home/ids.ts').FileGrantId;readonly path:string|null;readonly expectedFileMappingVersion:import('./host-contracts.ts').FileMappingVersion;readonly expectedFileAccessVersion:import('./home/ids.ts').FileAccessVersion;}
export interface FileAccessView extends FileAccessSnapshot {
    readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly mappingVersion:import('./host-contracts.ts').FileMappingVersion;readonly lastMappingOperationId:string;
    readonly localMappings:readonly {readonly grantId:import('./home/ids.ts').FileGrantId;readonly path:string|null;readonly status:'bound'|'unbound'|'stale'}[];
}
export type {RoleFileRequest,RoleFileValue,RoleFileScope} from './actions/files.ts';
export type {FileRulesValue,FileRules,FileRulesSnapshot} from './home/file-rules.ts';
export interface FileRulesEditRequest {readonly operationId:OperationId;readonly value:Readonly<Record<string,number>>;readonly expectedFileRulesVersion:import('./home/ids.ts').FileRulesVersion;readonly expectedRevision:HomeRevision;}
export interface FileRulesView extends FileRulesSnapshot {readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly effectiveFrom:'next-file-admission';}

/** Remote read consistency metadata; this digest grants no Home or tool capability. */
export type OwnerExecutionRecordPage=import('./home/turns.ts').ExecutionRecordPage&{readonly contentDigest:string};

export type {StopReason,StopRequest,StopRecord,StopProgress,StopStep} from './home/stops.ts';
export type {ModelPurpose,ModelOperationClaim,ModelFailure} from './home/model-operations.ts';
export type {RetryRulesValue,RetryRules,RetryRulesSnapshot} from './home/retry-rules.ts';
export interface RetryRulesEditRequest {readonly operationId:OperationId;readonly value:Readonly<Record<string,number>>;readonly expectedRetryRulesVersion:import('./home/ids.ts').RetryRulesVersion;readonly expectedRevision:HomeRevision;}
export interface RetryRulesView extends RetryRulesSnapshot {readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly effectiveFrom:'next-retry-admission';}

export type {ConversationBudgetView,ResourceCounts} from './home/budget-view.ts';

export type {QQConnectionId,QQAccountId,QQPeerId,QQMessageId,QQBinding} from './home/qq.ts';

export interface QQDeliveryRulesEditRequest{readonly operationId:OperationId;readonly expectedRevision:HomeRevision;readonly expectedDeliveryRulesVersion:import('./home/deliveries.ts').DeliveryRulesVersion;readonly value:Readonly<Record<string,number>>;}
export interface QQDeliveryRead{readonly deliveryId:import('./home/deliveries.ts').DeliveryId;readonly offset:number;readonly limit:number;}
export interface QQDeliveryPage{readonly revision:HomeRevision;readonly rules:import('./home/deliveries.ts').DeliveryRules;readonly resolutions:readonly import('./home/delivery-resolutions.ts').DeliveryResolution[];readonly delivery:import('./home/deliveries.ts').DeliveryRecord;readonly attemptJSON:string|null;readonly offset:number;readonly totalCodePoints:number;readonly more:boolean;}
export interface QQDeliveriesView{readonly roleId:RoleId;readonly bindingVersion:BindingVersion|0;readonly revision:HomeRevision;readonly rules:import('./home/deliveries.ts').DeliveryRules;readonly offset:number;readonly limit:number;readonly total:number;readonly more:boolean;readonly deliveries:readonly {readonly deliveryId:import('./home/deliveries.ts').DeliveryId;readonly qualification:'main-reply'|'contact';readonly replyId:ReplyId|null;readonly intentId:IntentId|null;readonly contactIntentId:import('./home/ids.ts').ContactIntentId|null;readonly runId:RunId;readonly status:string;readonly bindingVersion:BindingVersion;readonly codePoints:number;readonly committedRevision:HomeRevision;readonly retryOf:import('./home/deliveries.ts').DeliveryId|null;readonly supersedes:import('./home/deliveries.ts').DeliveryId|null;readonly supersededBy:import('./home/deliveries.ts').DeliveryId|null;readonly sendAttemptId:import('./home/deliveries.ts').SendAttemptId|null;readonly messageId:import('./home/qq.ts').QQMessageId|null;readonly code:string;readonly blockedReason:string|null}[];}

export interface QQDeliveryResolutionRequest{readonly operationId:OperationId;readonly deliveryId:import('./home/deliveries.ts').DeliveryId;readonly sendAttemptId:import('./home/deliveries.ts').SendAttemptId;readonly decision:'no-resend'|'resend';readonly note:string;readonly duplicateRiskAcknowledged:boolean;readonly expectedRevision:HomeRevision;readonly expectedDeliveryRulesVersion:import('./home/deliveries.ts').DeliveryRulesVersion;}

export type {WebRulesValue,WebRules,WebRulesSnapshot,WebWireRecord,WebAttemptClaim,WebToolClaim} from './home/web.ts';
export type {OfficialWebWireTransport} from './adapters/official-web.ts';
export interface WebRulesEditRequest {readonly operationId:OperationId;readonly value:Readonly<Record<string,number>>;readonly expectedWebRulesVersion:import('./home/ids.ts').WebRulesVersion;readonly expectedRevision:HomeRevision;}
export interface WebRulesView extends WebRulesSnapshot {readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly effectiveFrom:'next-web-admission';}

export type {QQHistoryQueryId,QQHistoryRequestId,QQHistoryCandidateId,QQHistoryPolicy} from './home/qq-history.ts';
export interface QQHistoryQueryRequest{readonly operationId:OperationId;}
export interface QQHistoryQueryReceipt{readonly roleId:RoleId;readonly queryId:import('./home/qq-history.ts').QQHistoryQueryId;readonly operationId:OperationId;readonly committedRevision:HomeRevision;}
export interface QQHistoryReadRequest{readonly queryId:import('./home/qq-history.ts').QQHistoryQueryId|null;readonly operationId:OperationId|null;readonly queryOffset:number;readonly candidateOffset:number;readonly limit:number;}
export interface QQHistoryCandidateSummary{readonly candidateId:import('./home/qq-history.ts').QQHistoryCandidateId;readonly messageId:import('./home/qq.ts').QQMessageId;readonly preview:string;readonly totalCodePoints:number;readonly reportedAt:string|null;readonly eligible:boolean;readonly reason:string;}
export interface QQHistoryQueryView{
 readonly queryId:import('./home/qq-history.ts').QQHistoryQueryId;readonly operationId:OperationId;readonly target:import('./home/qq.ts').QQBinding;readonly startedAt:string;readonly policy:import('./home/qq-history.ts').QQHistoryPolicy;
 readonly anchor:{readonly inputId:InputId;readonly messageId:import('./home/qq.ts').QQMessageId}|null;readonly phase:'running'|'gap';readonly gapReasons:readonly string[];
 readonly requests:readonly {readonly requestId:import('./home/qq-history.ts').QQHistoryRequestId;readonly pageIndex:number;readonly limit:number;readonly anchorMessageId:import('./home/qq.ts').QQMessageId|null;readonly reservedAt:string;readonly enteredAt:string|null;readonly status:'reserved'|'entered'|'response'|'failed';readonly code:string;readonly dispatchObserved:boolean|null;}[];
 readonly candidates:readonly QQHistoryCandidateSummary[];readonly totalCandidates:number;readonly candidateOffset:number;readonly moreCandidates:boolean;readonly outgoingRows:number;readonly unsupportedRows:number;
}
export interface QQHistoryView{
 readonly selections:readonly QQHistorySelection[];
 readonly roleId:RoleId;readonly bindingVersion:BindingVersion|0;readonly revision:HomeRevision;readonly readable:boolean;readonly reason:string;
 readonly query:QQHistoryQueryView|null;readonly queries:readonly {readonly queryId:import('./home/qq-history.ts').QQHistoryQueryId;readonly operationId:OperationId;readonly bindingVersion:BindingVersion;readonly startedAt:string;readonly phase:'running'|'gap';readonly candidates:number;}[];readonly totalQueries:number;readonly queryOffset:number;readonly moreQueries:boolean;
}
export interface QQHistoryRecordRead{readonly kind:'candidate'|'request';readonly queryId:import('./home/qq-history.ts').QQHistoryQueryId;readonly recordId:string;readonly offset:number;readonly limit:number;}
export interface QQHistoryRecordPage{readonly queryId:import('./home/qq-history.ts').QQHistoryQueryId;readonly recordId:string;readonly kind:'candidate'|'request';readonly revision:HomeRevision;readonly json:string;readonly contentDigest:string;readonly offset:number;readonly totalCodePoints:number;readonly more:boolean;}

export interface QQHistorySelectionRequest{readonly operationId:OperationId;readonly queryId:import('./home/qq-history.ts').QQHistoryQueryId;readonly candidateIds:readonly import('./home/qq-history.ts').QQHistoryCandidateId[];readonly acknowledgedGap:true;readonly expectedRevision:HomeRevision;}
export type QQHistorySelection=import('./home/qq-history.ts').QQHistorySelection;
export type {ContextSource,ContextSourceLineage,CoreContextSource,InputContextSource,ReplyContextSource,ToolContextSource,ContextSourceConstraint,ContextSourceRef,ContextSourceMetadata,ContextSnapshotBasis,ContextSourcePageRequest,ContextSourcePage,ContextSourceRead,ContextSourcePart} from './home/context-snapshot.ts';
export type {LibrarySourceKind,LibrarySourceSort,LibrarySourceCompleteness,LibrarySourceAvailability,LibrarySourceQuery,NormalizedLibrarySourceQuery,LibrarySourceMetadata,LibrarySourceSummary,LibrarySourcePage} from './types.library.sources.ts';

export type {ProposalRulesValue,ProposalRules,ProposalRulesSnapshot} from './home/proposal-rules.ts';
export interface ProposalRulesEditRequest {readonly operationId:OperationId;readonly value:Readonly<Record<string,number>>;readonly expectedProposalRulesVersion:import('./home/ids.ts').ProposalRulesVersion;readonly expectedRevision:HomeRevision;}
export interface ProposalRulesView extends ProposalRulesSnapshot {readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly effectiveFrom:'next-proposal-admission';}

export type {ContactRulesEditRequest,ContactUsageView,ContactIntentSummary,ContactView,ContactIntentRead,ContactIntentPart} from './types.contact.ts';
