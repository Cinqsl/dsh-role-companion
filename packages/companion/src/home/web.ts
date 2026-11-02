import {WebRulesVersion,type HomeRevision,type LogicalOpId,type AttemptId} from './ids.ts';
import type {AttemptRecord,ReserveAttempt} from './turns.ts';
export interface WebRulesValue {readonly transportTimeoutMs:number;readonly toolTimeoutMs:number;readonly maxResults:number;readonly responseLimitBytes:number;}
export interface WebRules {readonly version:WebRulesVersion;readonly value:WebRulesValue;}
export interface WebRulesSnapshot extends WebRules {readonly revision:HomeRevision;}
export const webRulesDefaults:WebRulesValue=Object.freeze({transportTimeoutMs:30000,toolTimeoutMs:45000,maxResults:8,responseLimitBytes:4194304});
export const initialWebRules=():WebRules=>({version:WebRulesVersion(1),value:webRulesDefaults});
export function validateWebRules(value:unknown):value is WebRulesValue {
    const keys=['maxResults','responseLimitBytes','toolTimeoutMs','transportTimeoutMs'];
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).length!==4||Object.keys(value).sort().join('|')!==keys.join('|'))return false;
    if(keys.some(key=>{const d=Object.getOwnPropertyDescriptor(value,key);return !d||!('value'in d)||typeof d.value!=='number'||!Number.isSafeInteger(d.value)||d.value<1;}))return false;
    return 'maxResults'in value&&typeof value.maxResults==='number'&&value.maxResults<=50&&'responseLimitBytes'in value&&typeof value.responseLimitBytes==='number'&&value.responseLimitBytes<=4194304&&'toolTimeoutMs'in value&&typeof value.toolTimeoutMs==='number'&&value.toolTimeoutMs<=2147483647&&'transportTimeoutMs'in value&&typeof value.transportTimeoutMs==='number'&&value.transportTimeoutMs<=2147483647;
}
export type WebOperation='search'|'fetch';
export interface WebToolClaim {readonly logicalOpId:LogicalOpId;readonly operation:WebOperation;readonly deadline:string;readonly rules:WebRules;}
export interface WebAttemptClaim {readonly logicalOpId:LogicalOpId;readonly parentAttemptId:AttemptId;readonly ordinal:0|1;readonly previousAttemptId?:AttemptId;}
export interface ReserveWebTool extends Omit<ReserveAttempt,'kind'|'webOperation'> {readonly webAttemptId:AttemptId;readonly webTool:WebToolClaim;}
/** Exact bytes precede any provider projection. No headers or credential values belong here. */
export interface WebWireRecord {readonly providerStatus:number|'unknown';readonly rawBase64:string;readonly retainedBytes:number;readonly receivedBytes:number;readonly completeness:'complete'|'partial'|'invalid'|'not-dispatched';readonly code?:string;readonly retryAfterMs?:number;readonly providerErrorCode?:string;readonly dispatchObserved:boolean;}
export function isWebWireRecord(value:unknown):value is WebWireRecord {
    if(!value||typeof value!=='object'||Array.isArray(value))return false;
    return 'providerStatus'in value&&(value.providerStatus==='unknown'||typeof value.providerStatus==='number'&&Number.isInteger(value.providerStatus)&&value.providerStatus>=100&&value.providerStatus<=599)&&'rawBase64'in value&&typeof value.rawBase64==='string'&&/^[A-Za-z0-9+/]*={0,2}$/.test(value.rawBase64)&&'retainedBytes'in value&&typeof value.retainedBytes==='number'&&Number.isSafeInteger(value.retainedBytes)&&value.retainedBytes>=0&&value.retainedBytes<=4194304&&'receivedBytes'in value&&typeof value.receivedBytes==='number'&&Number.isSafeInteger(value.receivedBytes)&&value.receivedBytes>=value.retainedBytes&&'completeness'in value&&['complete','partial','invalid','not-dispatched'].includes(String(value.completeness))&&'dispatchObserved'in value&&typeof value.dispatchObserved==='boolean'&&(!('code'in value)||typeof value.code==='string'&&/^[A-Z][A-Z0-9_]{1,63}$/.test(value.code))&&(!('providerErrorCode'in value)||typeof value.providerErrorCode==='string'&&/^[A-Z][A-Z0-9_]{0,63}$/.test(value.providerErrorCode))&&(!('retryAfterMs'in value)||typeof value.retryAfterMs==='number'&&Number.isFinite(value.retryAfterMs)&&value.retryAfterMs>=0);
}
const terminalWebCodes=new Set(['QUOTA','INSUFFICIENT_QUOTA','INSUFFICIENT_BALANCE','INVALID_API_KEY','AUTHENTICATION_ERROR','INVALID_REQUEST_ERROR','PERMISSION_DENIED','SECURITY_POLICY']);
export const retryableWebRecord=(record:WebWireRecord):boolean=>!terminalWebCodes.has(record.providerErrorCode??'')&&((record.completeness==='complete'&&typeof record.providerStatus==='number'&&([408,429].includes(record.providerStatus)||record.providerStatus>=500))||record.code==='WEB_TRANSPORT_FAILED');
export function validWebAttempt(attempt:AttemptRecord,attempts:readonly AttemptRecord[]):boolean {
    if(attempt.webTool){const c=attempt.webTool;if(attempt.kind!=='tool'||!['search','fetch'].includes(c.operation)||!validateWebRules(c.rules.value)||!Number.isFinite(Date.parse(c.deadline))||attempts.some(x=>x.webTool?.logicalOpId===c.logicalOpId))return false;}
    const claim=attempt.webOperation;if(attempt.kind!=='web')return !claim;
    if(!claim||![0,1].includes(claim.ordinal))return false;
    const parent=attempts.find(x=>x.attemptId===claim.parentAttemptId&&x.kind==='tool'&&x.webTool?.logicalOpId===claim.logicalOpId);
    if(!parent||parent.runId!==attempt.runId||parent.source!==attempt.source)return false;
    const prior=attempts.filter(x=>x.webOperation?.logicalOpId===claim.logicalOpId);
    if(claim.ordinal===0)return !prior.length&&claim.previousAttemptId===undefined;
    const first=prior[0];return prior.length===1&&first?.attemptId===claim.previousAttemptId&&first.outcome?.kind==='failed'&&isWebWireRecord(first.outcome.data)&&retryableWebRecord(first.outcome.data);
}
