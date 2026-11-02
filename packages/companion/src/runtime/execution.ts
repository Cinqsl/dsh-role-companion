import type {RoleFileCapability} from '../actions/files.ts';
import type {FileRules} from '../home/file-rules.ts';
import type {IssuedWebOperation} from './web.ts';
export type {IssuedWebOperation,IssuedWebAttempt} from './web.ts';
import type {ModelPurpose,ModelFailure,ModelOperationClaim} from '../home/model-operations.ts';
import type {LogicalOpId} from '../home/ids.ts';
import type {ReadRules} from '../home/read-rules.ts';
import { type RunId,type NativeExposureId } from '../home/ids.ts';
import type { AttemptOutcome, ConversationSettings, NativeRecord, TurnRecord,ToolObservationInput,ToolMaterialBody,ToolMaterial } from '../home/turns.ts';
import type {HomeRevision,AttemptId} from '../home/ids.ts';
import type {RoleReadCapability} from '../actions/read.ts';
import type {RoleProposeCapability} from '../actions/propose.ts';
import type {RoleProposeValue} from '../actions/propose.ts';
import type {KnowledgeProposal} from '../home/knowledge.ts';
import type { ContextFrame } from '../context/index.ts';
export interface ExecutionRoute { readonly provider:'deepseek-official';readonly model:'deepseek-flash';readonly contextWindow:number;readonly outputLimit:number; }
export interface TurnPlan { readonly turn:TurnRecord;readonly frame:ContextFrame;readonly route:ExecutionRoute; }
/** This capability is minted only in startRole; never serialized into a message or tool arguments. */
export interface IssuedRunScope {
    readonly runId:RunId;readonly source:'user'|'autonomous';readonly signal:AbortSignal;
    rejectRun(code:string):void;
    selectContext(refs:readonly import('../home/context-snapshot.ts').ContextSourceRef[]):void;
    parameters():Promise<ConversationSettings>;
    reserveModel(request:unknown,operation?:ModelOperationClaim):Promise<IssuedModelAttempt>;
    createModelOperation(purpose:ModelPurpose):IssuedModelOperation;
    readonly roleRead:RoleReadCapability;
    readonly rolePropose:RoleProposeCapability;
    readonly roleFiles?:RoleFileCapability;
    reserveTool(request:unknown,options?:{readonly kind:'proposal'|'file-read'|'file-write'|'web-search'|'web-fetch'}):Promise<IssuedToolAttempt>;
    quiesceTools():Promise<void>;
    afterTools(action:()=>void):void;
    registerFinalization(key:NativeExposureId,save:()=>void|Promise<void>):void;
    registerNative(record:Omit<NativeRecord,'runId'>):void;
    drain():Promise<void>;
}
export interface IssuedToolAttempt {
    readonly proposal?:{save(value:KnowledgeProposal):Promise<RoleProposeValue>};
    readonly attemptId:AttemptId;
    readonly readRules:ReadRules;
    readonly fileRules?:FileRules;
    readonly web?:IssuedWebOperation;
    recordDisplay(body:ToolMaterialBody):ToolMaterial;
    enter():Promise<void>;
    invoke<T>(signal:AbortSignal|undefined,effect:()=>Promise<T>):Promise<T>;
    observe(observation:ToolObservationInput):Promise<HomeRevision>;
    captureMaterial(body:ToolMaterialBody):Promise<ToolMaterial>;
    finalize(outcome:AttemptOutcome):void;
}
export type RunOutcome={readonly kind:'reply';readonly text:string}|{readonly kind:'no-reply'|'internal'|'failure';readonly reason:string;readonly text?:string};
export interface QuiescenceReport { readonly idle:boolean;readonly flushed:boolean; }
export interface ExecutionPort {
    inspect():Promise<{readonly available:boolean;readonly reason:string;readonly credential?:{readonly ref:string;readonly configured:boolean;readonly source?:string;readonly writable:boolean}}>;
    restoreOwnership?(ids:readonly unknown[]):void;
    release?(runId:RunId):Promise<void>;
    onClosing?(listener:(reason?:string)=>void):()=>void;
    onAvailability?(listener:()=>void):()=>void;
    prepare(outputTokens:number,signal?:AbortSignal):Promise<ExecutionRoute>;
    run(plan:TurnPlan,scope:IssuedRunScope):Promise<RunOutcome>;
    quiesce(runId:RunId):Promise<QuiescenceReport>;
    close():Promise<void>;
    retainRecordingUntil?(homeReleased:Promise<void>):void;
    dispose?():Promise<void>;
}
export class ExecutionError extends Error { constructor(readonly code:string){super(code);} }
export const safeExecutionCode=(error:unknown):string=>error instanceof ExecutionError?error.code:error&&typeof error==='object'&&'code' in error&&typeof error.code==='string'&&/^[A-Z][A-Z0-9_]{1,63}$/.test(error.code)?error.code:'EXECUTION_FAILED';

export interface IssuedModelAttempt {readonly attemptId:AttemptId;enter():Promise<void>;iterate<T>(effect:()=>AsyncIterable<T>):AsyncIterable<T>;settle(outcome:AttemptOutcome):Promise<void>;}
export interface IssuedModelOperation {readonly logicalOpId:LogicalOpId;reserve(request:unknown):Promise<IssuedModelAttempt>;retry(failure:ModelFailure,signal:AbortSignal):Promise<boolean>;}
