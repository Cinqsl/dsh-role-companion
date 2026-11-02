import type {LogicalOpId,AttemptId} from './ids.ts';
import type {AttemptRecord} from './turns.ts';
export type ModelPurpose='primary'|'required-auxiliary'|'compaction';
export interface ModelOperationClaim {readonly logicalOpId:LogicalOpId;readonly purpose:ModelPurpose;readonly ordinal:0|1;readonly previousAttemptId?:AttemptId;}
/** Safe provider-neutral facts; diagnostic messages and provider payloads stay in managed attempt content. */
export interface ModelFailure {readonly code:string;readonly status?:number;readonly providerRetryAfterMs?:number;}
export function validateModelFailure(value:unknown):value is ModelFailure {
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(x=>!['code','status','providerRetryAfterMs'].includes(x))||!('code'in value)||typeof value.code!=='string'||!/^[A-Z][A-Z0-9_]{1,63}$/.test(value.code))return false;
    return (!('status'in value)||typeof value.status==='number'&&Number.isSafeInteger(value.status)&&value.status>=100&&value.status<=599)&&(!('providerRetryAfterMs'in value)||typeof value.providerRetryAfterMs==='number'&&Number.isFinite(value.providerRetryAfterMs)&&value.providerRetryAfterMs>0);
}
export const transientModelFailure=(failure:ModelFailure):boolean=>['TRANSPORT','TIMEOUT','RATE_LIMIT','SERVER'].includes(failure.code);
export function validModelOperation(attempt:AttemptRecord,attempts:readonly AttemptRecord[]):boolean {
    const claim=attempt.modelOperation;if(!claim)return true;
    if(attempt.kind!=='model'||!['primary','required-auxiliary','compaction'].includes(claim.purpose)||Object.keys(claim).some(x=>!['logicalOpId','purpose','ordinal','previousAttemptId'].includes(x)))return false;
    const previous=attempts.filter(x=>x.modelOperation?.logicalOpId===claim.logicalOpId);
    if(claim.ordinal===0)return !previous.length&&claim.previousAttemptId===undefined;
    if(claim.ordinal!==1||previous.length!==1)return false;const first=previous[0]!;
    return first.runId===attempt.runId&&first.source===attempt.source&&first.modelOperation?.purpose===claim.purpose&&first.modelOperation.ordinal===0&&first.attemptId===claim.previousAttemptId&&first.outcome?.kind==='failed'&&!!first.outcome.modelFailure&&transientModelFailure(first.outcome.modelFailure);
}
