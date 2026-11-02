import {initialAutonomy,type AutonomyState,type AutonomyFact,type AutonomousStamp} from './autonomy.ts';
import {initialProposalRules,type ProposalRules,type ProposalRulesValue} from './proposal-rules.ts';
import {emptyKnowledge,type KnowledgeState,type KnowledgeFact,type ProposalClaim} from './knowledge.ts';
import {initialFileAccess,type FileAccess,type FileAccessValue} from './file-access.ts';
import {initialFileRules,type FileRules,type FileRulesValue} from './file-rules.ts';
import type {ResolveDeliveryFact} from './delivery-resolutions.ts';
import {initialDeliveries,type DeliveryState,type DeliveryFact,type DeliveryRecord} from './deliveries.ts';
import {initialWebRules,type WebRules,type WebRulesValue,type WebToolClaim,type WebAttemptClaim} from './web.ts';
import {initialRetryRules,type RetryRules,type RetryRulesValue} from './retry-rules.ts';
import type {ModelOperationClaim,ModelFailure} from './model-operations.ts';
import {initialReadRules,type ReadRules,type ReadRulesValue} from './read-rules.ts';
import {initialContactRules,type ContactRules,type ContactRulesValue} from './contact-rules.ts';
import {emptyContact,type ContactState} from './contact.ts';
import { AutonomyRulesVersion,InputId, BindingId, OperationId, ExperienceId, InputGroupId, RunId, AttemptId, ReplyId, IntentId, NativeExposureId, NativeRecordRef, HomeRevision, ConversationVersion,ReadRulesVersion, BindingVersion, ContextGeneration,MaterialId,LogicalOpId,RetryRulesVersion,ProposalRulesVersion,FileRulesVersion,FileAccessVersion,WebRulesVersion,ContactRulesVersion,ContactIntentId,KnowledgeId,KnowledgeVersion } from './ids.ts';
/** Conversation facts belong to Home. Managed JSON text preserves fractional provider values. */
export interface ConversationSettings {
    readonly modelLimit: number;
    readonly toolLimit: number;
    readonly webLimit: number;
    readonly windowMs: number;
    readonly outputTokens: number;
}
export const conversationDefaults: ConversationSettings = Object.freeze({ modelLimit: 8, toolLimit: 16, webLimit: 4, windowMs: 600000, outputTokens: 4096 });
export interface ConversationRules { readonly version: ConversationVersion; readonly value: ConversationSettings; }
export interface BeginTurn {
    readonly operationId: OperationId; readonly inputIds: readonly InputId[]; readonly runId: RunId; readonly now: string; readonly expectedRevision: HomeRevision;
}
export interface TurnRecord {
    readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker;
    readonly groupId: InputGroupId; readonly runId: RunId; readonly inputIds: readonly InputId[]; readonly bindingId: BindingId; readonly bindingVersion: BindingVersion;
    readonly source: 'user'|'autonomous';readonly opportunityId?:OperationId;readonly admittedInputSequence?:number; readonly startedAt: string; readonly deadline: string; readonly contextGeneration: ContextGeneration; readonly settingsVersion: ConversationVersion;
    readonly status: 'running' | 'suspended' | 'finished'; readonly outcome?: TurnOutcome; readonly replyId?: ReplyId;
}
export interface ReserveAttempt {
    readonly operationId: OperationId; readonly runId: RunId; readonly attemptId: AttemptId; readonly source: 'user'|'autonomous'; readonly kind: 'model'|'tool'|'web';
    readonly autonomy?:AutonomousStamp;readonly contextGeneration: ContextGeneration; readonly settingsVersion: ConversationVersion; readonly expectedRevision: HomeRevision; readonly now: string;readonly proposal?:ProposalClaim;readonly readRules?:ReadRules;readonly modelOperation?:ModelOperationClaim;readonly retryRules?:RetryRules;readonly webOperation?:WebAttemptClaim;readonly fileRules?:FileRules;readonly fileAccessVersion?:FileAccessVersion;readonly fileOperation?:'read'|'write';
}
export interface AttemptOutcome { readonly kind: 'completed' | 'failed' | 'cancelled' | 'not-dispatched'; readonly code?: string;readonly modelFailure?:ModelFailure; readonly data?: unknown; }
export interface AttemptRecord {
    readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker;
    readonly attemptId: AttemptId; readonly runId: RunId; readonly source: 'user'|'autonomous'; readonly kind: 'model'|'tool'|'web'; readonly reservedAt: string;
    readonly autonomy?:AutonomousStamp;readonly windowId?:import('./ids.ts').DayWindowId;readonly enteredAt?: string; readonly outcome?: AttemptOutcome;
    readonly proposal?:ProposalClaim;readonly readRules?:ReadRules;readonly modelOperation?:ModelOperationClaim;readonly retryRules?:RetryRules;readonly webTool?:WebToolClaim;readonly webOperation?:WebAttemptClaim;readonly fileRules?:FileRules;readonly fileAccessVersion?:FileAccessVersion;readonly fileOperation?:'read'|'write';
    readonly observation?:ToolObservation;
    readonly materials?:readonly ToolMaterial[];
}
export interface ToolMaterialBody {readonly source:'sdk-local-spill'|'role-read-result'|'role-file-result'|'role-web-result';readonly text:string;readonly bytes:number;readonly digest:string;}
export interface ToolMaterial extends ToolMaterialBody {readonly materialId:MaterialId;readonly attemptId:AttemptId;}
export type ToolObservationInput={readonly kind:'returned';readonly value:unknown}|{readonly kind:'threw';readonly code:string};
export type ToolObservation=ToolObservationInput&{readonly observedAt:string};
export type TurnOutcome = { readonly kind: 'reply'; readonly text: string } | { readonly kind: 'no-reply' | 'internal' | 'failure'; readonly reason: string; readonly text?: string };
export interface FinishTurn { readonly operationId: OperationId; readonly runId: RunId; readonly contextGeneration: ContextGeneration; readonly outcome: TurnOutcome; }
export interface TurnReceipt { readonly operationId: OperationId; readonly kind: 'committed'; readonly committedRevision: HomeRevision; readonly replyId?: ReplyId; }
export interface ReplyRecord {
    readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker;
    readonly replyId: ReplyId; readonly experienceId:ExperienceId; readonly intentId:IntentId; readonly runId: RunId; readonly inputIds: readonly InputId[]; readonly bindingId: BindingId; readonly bindingVersion: BindingVersion;
    readonly text: string; readonly display: 'queryable'; readonly committedRevision: HomeRevision;
}
export interface ReplyRead { readonly replyId: ReplyId; readonly offset: number; readonly limit: number; }
export interface ReplyPage extends ReplyRecord { readonly offset: number; readonly totalCodePoints: number; readonly more: boolean; }
export interface NativeRecord { readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker; readonly runId: RunId; readonly nativeId: NativeExposureId; readonly provenance: 'tools-result' | 'native-session' | 'host-denial'; readonly data: unknown; }
export interface ConversationState extends DeliveryState {
    /** #51：主动联系规则与意图是独立切片；不并入 autonomy.rules（旧 Home 重放的字面 key 串）。 */
    readonly contactRules:ContactRules;readonly contact:ContactState;
    readonly autonomy:AutonomyState;readonly knowledge:KnowledgeState;readonly proposalRules:ProposalRules;
    readonly rules: ConversationRules;readonly fileRules:FileRules;readonly fileAccess:FileAccess;readonly webRules:WebRules;readonly readRules:ReadRules;readonly retryRules:RetryRules; readonly turns: readonly TurnRecord[]; readonly attempts: readonly AttemptRecord[]; readonly replies: readonly ReplyRecord[]; readonly nativeRecords: readonly NativeRecord[];
}
export function validateConversationSettings(value: unknown): value is ConversationSettings {
    if (!value || typeof value !== 'object' || Object.keys(value).sort().join('|') !== 'modelLimit|outputTokens|toolLimit|webLimit|windowMs') return false;
    const v = value as ConversationSettings;
    return [v.modelLimit,v.toolLimit,v.webLimit].every(x=>Number.isSafeInteger(x)&&x>=0) && Number.isSafeInteger(v.outputTokens)&&v.outputTokens>0&&v.outputTokens<=256000 && Number.isSafeInteger(v.windowMs)&&v.windowMs>0&&v.windowMs<=2147483647;
}

export interface ConversationSnapshot extends ConversationState {readonly revision:HomeRevision;}
export type ConversationFact = AutonomyFact | KnowledgeFact | ResolveDeliveryFact | DeliveryFact
 | {kind:'edit-proposal-rules';value:ProposalRulesValue;version:ProposalRulesVersion}
 | {kind:'edit-web-rules';value:WebRulesValue;version:WebRulesVersion}
 | {kind:'reserve-web-tool';tool:AttemptRecord;web:AttemptRecord;contextGeneration:ContextGeneration;settingsVersion:ConversationVersion}
 | {kind:'begin-turn'; turn:TurnRecord}
 | {kind:'reserve-attempt'; attempt:AttemptRecord; contextGeneration:ContextGeneration; settingsVersion:ConversationVersion}
 | {kind:'enter-attempt'; attemptId:AttemptId; now:string}
 | {kind:'record-attempt'; attemptId:AttemptId; outcome:AttemptOutcome}
 | {kind:'observe-tool';attemptId:AttemptId;observation:ToolObservation}
 | {kind:'capture-material';material:ToolMaterial}
 | {kind:'finish-turn'; runId:RunId; contextGeneration:ContextGeneration; outcome:TurnOutcome; replyId?:ReplyId;delivery?:DeliveryRecord}
 | {kind:'refresh-turn-context';runId:RunId;previousGeneration:ContextGeneration;nextGeneration:ContextGeneration}
 | {kind:'native-record'; record:NativeRecord}
 | {kind:'edit-conversation'; value:ConversationSettings; version:ConversationVersion}
 | {kind:'edit-read-rules';value:ReadRulesValue;version:ReadRulesVersion}
 | {kind:'edit-file-access';value:FileAccessValue;version:FileAccessVersion}
 | {kind:'edit-file-rules';value:FileRulesValue;version:FileRulesVersion}
 | {kind:'edit-retry-rules';value:RetryRulesValue;version:RetryRulesVersion}
 | {kind:'edit-contact-rules';value:ContactRulesValue;version:import('./ids.ts').ContactRulesVersion}
 | {kind:'contact-intent';intent:import('./contact.ts').ContactIntentRecord;delivery?:import('./deliveries.ts').DeliveryRecord}
 | {kind:'settle-contact-intent';intentId:import('./ids.ts').ContactIntentId;state:'sent'|'unknown'}
 | {kind:'close-contact-intent';intentId:import('./ids.ts').ContactIntentId;reason:string;supersededBy?:import('./ids.ts').ContactIntentId};
export const emptyConversation = (): ConversationState => ({contactRules:initialContactRules(),contact:emptyContact(),autonomy:initialAutonomy(),knowledge:emptyKnowledge(),proposalRules:initialProposalRules(),...initialDeliveries(),rules:{version:ConversationVersion(1),value:conversationDefaults},fileRules:initialFileRules(),fileAccess:initialFileAccess(),webRules:initialWebRules(),readRules:initialReadRules(),retryRules:initialRetryRules(),turns:[],attempts:[],replies:[],nativeRecords:[]});
export type ExecutionRecordRead = {readonly kind:'attempt';readonly recordId:AttemptId;readonly offset:number;readonly limit:number} | {readonly kind:'native';readonly recordId:NativeRecordRef;readonly offset:number;readonly limit:number};
export type ExecutionRecordPage = ({readonly kind:'attempt';readonly recordId:AttemptId} | {readonly kind:'native';readonly recordId:NativeRecordRef}) & {readonly offset:number} & {readonly runId:RunId;readonly json:string;readonly totalCodePoints:number;readonly more:boolean};

/** Attach only the owning brands after checking primitives at replay/domain admission. */
export function admitConversationFact(fact: ConversationFact): ConversationFact {
    switch(fact.kind) {
        case 'coalesce-wake':case 'suspend-autonomous':case 'resume-autonomous':case 'request-wake':case 'begin-autonomous':case 'clock-blocked':case 'set-autonomy-pause':return fact;
        case 'edit-autonomy-rules':return {...fact,version:AutonomyRulesVersion(fact.version)};
        case 'clock-reviewed':return fact;
        case 'rollback-knowledge':case 'edit-proposal-rules':case 'save-proposal':case 'process-proposal':return fact;
        case 'edit-file-access':return {...fact,version:FileAccessVersion(fact.version)};
        case 'edit-file-rules':return {...fact,version:FileRulesVersion(fact.version)};
        case 'resolve-delivery':case 'begin-delivery':case 'settle-delivery':case 'edit-delivery-rules':return fact;
        case 'edit-web-rules':return {...fact,version:WebRulesVersion(fact.version)};
        case 'reserve-web-tool':{const tool=admitConversationFact({kind:'reserve-attempt',attempt:fact.tool,contextGeneration:fact.contextGeneration,settingsVersion:fact.settingsVersion}),web=admitConversationFact({kind:'reserve-attempt',attempt:fact.web,contextGeneration:fact.contextGeneration,settingsVersion:fact.settingsVersion});if(tool.kind!=='reserve-attempt'||web.kind!=='reserve-attempt')throw Error('INVALID_WEB_FACT');return {...fact,tool:tool.attempt,web:web.attempt,contextGeneration:ContextGeneration(fact.contextGeneration),settingsVersion:ConversationVersion(fact.settingsVersion)};}
        case 'edit-retry-rules':return {...fact,version:RetryRulesVersion(fact.version)};
        case 'edit-contact-rules':return {...fact,version:ContactRulesVersion(fact.version)};
        case 'contact-intent':return {...fact,intent:{...fact.intent,intentId:ContactIntentId(fact.intent.intentId),runId:RunId(fact.intent.runId),proposalId:fact.intent.proposalId,knowledgeId:KnowledgeId(fact.intent.knowledgeId),knowledgeVersion:KnowledgeVersion(fact.intent.knowledgeVersion),committedRevision:HomeRevision(fact.intent.committedRevision),...(fact.intent.deliveryId?{deliveryId:fact.intent.deliveryId}:{}),...(fact.intent.supersededBy?{supersededBy:ContactIntentId(fact.intent.supersededBy)}:{})}};
        case 'settle-contact-intent':return {...fact,intentId:ContactIntentId(fact.intentId)};
        case 'close-contact-intent':return {...fact,intentId:ContactIntentId(fact.intentId),...(fact.supersededBy?{supersededBy:ContactIntentId(fact.supersededBy)}:{})};
        case 'edit-read-rules': return {...fact,version:ReadRulesVersion(fact.version)};
        case 'edit-conversation': return {...fact,version:ConversationVersion(fact.version)};
        case 'begin-turn': {const t=fact.turn;return {...fact,turn:{...t,groupId:InputGroupId(t.groupId),runId:RunId(t.runId),inputIds:t.inputIds.map(InputId),bindingId:BindingId(t.bindingId),bindingVersion:BindingVersion(t.bindingVersion),contextGeneration:ContextGeneration(t.contextGeneration),settingsVersion:ConversationVersion(t.settingsVersion),...(t.replyId?{replyId:ReplyId(t.replyId)}:{})}};}
        case 'reserve-attempt': return {...fact,attempt:{...fact.attempt,...(fact.attempt.fileAccessVersion!==undefined?{fileAccessVersion:FileAccessVersion(fact.attempt.fileAccessVersion)}:{}),...(fact.attempt.fileRules?{fileRules:{...fact.attempt.fileRules,version:FileRulesVersion(fact.attempt.fileRules.version)}}:{}),runId:RunId(fact.attempt.runId),attemptId:AttemptId(fact.attempt.attemptId),...(fact.attempt.webTool?{webTool:{...fact.attempt.webTool,logicalOpId:LogicalOpId(fact.attempt.webTool.logicalOpId),rules:{...fact.attempt.webTool.rules,version:WebRulesVersion(fact.attempt.webTool.rules.version)}}}:{}),...(fact.attempt.webOperation?{webOperation:{...fact.attempt.webOperation,logicalOpId:LogicalOpId(fact.attempt.webOperation.logicalOpId),parentAttemptId:AttemptId(fact.attempt.webOperation.parentAttemptId),...(fact.attempt.webOperation.previousAttemptId?{previousAttemptId:AttemptId(fact.attempt.webOperation.previousAttemptId)}:{})}}:{}),...(fact.attempt.retryRules?{retryRules:{...fact.attempt.retryRules,version:RetryRulesVersion(fact.attempt.retryRules.version)}}:{}),...(fact.attempt.modelOperation?{modelOperation:{...fact.attempt.modelOperation,logicalOpId:LogicalOpId(fact.attempt.modelOperation.logicalOpId),...(fact.attempt.modelOperation.previousAttemptId?{previousAttemptId:AttemptId(fact.attempt.modelOperation.previousAttemptId)}:{})}}:{}),...(fact.attempt.readRules?{readRules:{...fact.attempt.readRules,version:ReadRulesVersion(fact.attempt.readRules.version)}}:{})},contextGeneration:ContextGeneration(fact.contextGeneration),settingsVersion:ConversationVersion(fact.settingsVersion)};
        case 'enter-attempt': case 'record-attempt': case 'observe-tool': return {...fact,attemptId:AttemptId(fact.attemptId)};
        case 'capture-material':return {...fact,material:{...fact.material,materialId:MaterialId(fact.material.materialId),attemptId:AttemptId(fact.material.attemptId)}};
        case 'finish-turn': return {...fact,runId:RunId(fact.runId),contextGeneration:ContextGeneration(fact.contextGeneration),...(fact.replyId?{replyId:ReplyId(fact.replyId)}:{})};
        case 'refresh-turn-context': return {...fact,runId:RunId(fact.runId),previousGeneration:ContextGeneration(fact.previousGeneration),nextGeneration:ContextGeneration(fact.nextGeneration)};
        case 'native-record': return {...fact,record:{...fact.record,runId:RunId(fact.record.runId),nativeId:NativeExposureId(fact.record.nativeId)}};
    }
}
