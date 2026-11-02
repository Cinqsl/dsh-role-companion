import {randomUUID} from 'node:crypto';
import {AttemptId,OperationId,type HomeRevision,type LogicalOpId} from '../home/ids.ts';
import {retryableWebRecord,type WebToolClaim,type WebWireRecord} from '../home/web.ts';
import type {OpenedRoleHome,AttemptRecord} from '../home/index.ts';
import {ExecutionError} from './execution.ts';
export interface IssuedWebAttempt {readonly attemptId:AttemptId;now():string;remainingMs():number;dispatch<T>(signal:AbortSignal,effect:()=>Promise<T>):Promise<T>;settle(record:WebWireRecord):Promise<void>;}
export interface IssuedWebOperation {
    readonly logicalOpId:LogicalOpId;readonly claim:WebToolClaim;now():string;remainingMs():number;readonly first:IssuedWebAttempt;
    retry(record:WebWireRecord,signal:AbortSignal):Promise<IssuedWebAttempt|undefined>;
    finishReservations():Promise<void>;
}
interface WebIssuer {
    readonly home:OpenedRoleHome;readonly first:AttemptRecord;readonly toolId:AttemptId;readonly claim:WebToolClaim;
    readonly dispatchClock?:()=>Promise<void>|undefined;readonly stamp?:()=>Promise<import('../home/autonomy.ts').AutonomousStamp>;readonly now:()=>string;readonly check:()=>void;readonly parameters:()=>Promise<unknown>;readonly drain:()=>Promise<void>;
    readonly archive:(operationId:OperationId,save:()=>Promise<void>)=>Promise<void>;
}
/** Nested HTTP gates never wait for the active parent body's future canonical result. */
export function issueWebOperation(owner:WebIssuer):IssuedWebOperation {
    const remainingMs=()=>Math.max(0,Date.parse(owner.claim.deadline)-Date.parse(owner.now()));
    const records:{attempt:AttemptRecord;started:boolean;confirmed:boolean;saved?:Promise<void>;outcome?:WebWireRecord}[]=[];
    const issue=(attempt:AttemptRecord):IssuedWebAttempt=>{
        const state:{attempt:AttemptRecord;started:boolean;confirmed:boolean;saved?:Promise<void>;outcome?:WebWireRecord}={attempt,started:false,confirmed:false};records.push(state);
        return Object.freeze({attemptId:attempt.attemptId,now:owner.now,remainingMs,
            async dispatch<T>(signal:AbortSignal,effect:()=>Promise<T>):Promise<T>{
                await owner.drain();await owner.parameters();owner.check();signal.throwIfAborted();
                if(state.started||state.outcome)throw new ExecutionError('WEB_ATTEMPT_CAPABILITY_SPENT');
                await owner.home.enterAttempt({operationId:OperationId('enter-'+attempt.attemptId),attemptId:attempt.attemptId,now:owner.now()});
                owner.check();signal.throwIfAborted();if(Date.parse(owner.now())>=Date.parse(owner.claim.deadline))throw new ExecutionError('WEB_TOOL_TIMEOUT');
                if(attempt.webOperation?.ordinal===1&&owner.home.admission.retryRulesVersion!==attempt.retryRules?.version)throw new ExecutionError('WEB_RETRY_RULES_CHANGED');
                const clockGate=owner.dispatchClock?.();if(clockGate)await clockGate;state.started=true;return effect();
            },
            settle(record:WebWireRecord){if(state.outcome)throw new ExecutionError('WEB_ATTEMPT_ALREADY_SETTLED');const stable=structuredClone({...record,dispatchObserved:state.started});state.outcome=stable;
                state.saved=owner.archive(OperationId('web-outcome-'+attempt.attemptId),async()=>{await owner.home.recordAttempt({operationId:OperationId('web-outcome-'+attempt.attemptId),attemptId:attempt.attemptId,outcome:{kind:!state.started?'not-dispatched':stable.code==='WEB_CANCELLED'?'cancelled':stable.code?'failed':'completed',...(stable.code?{code:stable.code}:{}),data:stable}});state.confirmed=true;});return state.saved;
            }
        });
    };
    const first=issue(owner.first);
    return Object.freeze({logicalOpId:owner.claim.logicalOpId,claim:owner.claim,now:owner.now,remainingMs,first,
        async retry(record:WebWireRecord,signal:AbortSignal){
            if(records.length!==1||!retryableWebRecord(record)||!records[0]?.saved)return;
            await records[0].saved;await owner.drain();await owner.parameters();owner.check();
            const rules=await owner.home.readRetryRules();if(!rules.value.maxAutomaticRetries)return;
            const delay=Math.ceil(record.retryAfterMs??rules.value.retryDelayMs),remaining=Date.parse(owner.claim.deadline)-Date.parse(owner.now());
            if(delay>=remaining||delay>2147483647||signal.aborted)return;
            await new Promise<void>((resolve,reject)=>{const cancel=()=>{clearTimeout(timer);signal.removeEventListener('abort',cancel);reject(new ExecutionError('WEB_CANCELLED'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},delay);signal.addEventListener('abort',cancel,{once:true});});
            await owner.drain();await owner.parameters();owner.check();if((await owner.home.readRetryRules()).version!==rules.version)return;
            const id=AttemptId('web-'+randomUUID());
            while(true){const conversation=await owner.home.readConversation(),snapshot=await owner.home.readSnapshot();owner.check();try{const autonomy=owner.first.source==='autonomous'?await owner.stamp?.():undefined;const attempt=await owner.home.reserveAttempt({operationId:OperationId('reserve-'+id),runId:owner.first.runId,attemptId:id,source:owner.first.source,...(autonomy?{autonomy}:{}),kind:'web',webOperation:{logicalOpId:owner.claim.logicalOpId,parentAttemptId:owner.toolId,ordinal:1,previousAttemptId:owner.first.attemptId},retryRules:rules,contextGeneration:snapshot.contextGeneration,settingsVersion:conversation.rules.version,expectedRevision:conversation.revision,now:autonomy?.clock.utc??owner.now()});return issue(attempt);}catch(error){if(error&&typeof error==='object'&&'code'in error&&error.code==='REVISION_CONFLICT')continue;throw error;}}
        },
        async finishReservations(){for(const state of records){if(state.saved){if(!state.confirmed)await state.saved;continue;}const record:WebWireRecord={providerStatus:'unknown',rawBase64:'',retainedBytes:0,receivedBytes:0,completeness:'not-dispatched',dispatchObserved:false,code:'WEB_NOT_DISPATCHED'};state.outcome=record;state.saved=owner.archive(OperationId('web-outcome-'+state.attempt.attemptId),async()=>{await owner.home.recordAttempt({operationId:OperationId('web-outcome-'+state.attempt.attemptId),attemptId:state.attempt.attemptId,outcome:{kind:'not-dispatched',code:record.code,data:record}});state.confirmed=true;});await state.saved;}}
    });
}
