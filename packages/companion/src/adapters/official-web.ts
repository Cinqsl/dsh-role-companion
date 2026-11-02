import type {WebWireRecord,WebRules} from '../home/web.ts';
import type {IssuedWebAttempt} from '../runtime/web.ts';
import {ExecutionError,safeExecutionCode} from '../runtime/execution.ts';
export const officialWebEndpoints=Object.freeze({search:'https://api.deepseek.com/v1/tools/search',fetch:'https://api.deepseek.com/v1/tools/fetch'} as const);
export type OfficialWebBody={readonly query:string;readonly count:number;readonly need_content:false}|{readonly url:string};
/** Host-only single-request wire seam. The role receives no credentials or generic URL transport. */
export interface OfficialWebWireTransport {post(endpoint:typeof officialWebEndpoints[keyof typeof officialWebEndpoints],body:OfficialWebBody,secret:string,signal:AbortSignal):Promise<Response>;}
export const officialWebWire:OfficialWebWireTransport=Object.freeze<OfficialWebWireTransport>({post:(endpoint,body,secret,signal)=>fetch(endpoint,{method:'POST',headers:{authorization:'Bearer '+secret,'content-type':'application/json'},body:JSON.stringify(body),redirect:'manual',credentials:'omit',signal})});
export interface OfficialWebOwner {credential(signal:AbortSignal):Promise<string>;check():void;readonly signal:AbortSignal;}
export interface OfficialWebCapability {request(operation:'search'|'fetch',body:OfficialWebBody,rules:WebRules,deadline:string,permit:IssuedWebAttempt,signal:AbortSignal):Promise<WebWireRecord>;}
export function createOfficialWebCapability(owner:OfficialWebOwner,wire:OfficialWebWireTransport):OfficialWebCapability {
    return Object.freeze<OfficialWebCapability>({async request(operation,body,rules,deadline,permit,signal){
        const timeout=new AbortController(),combined=AbortSignal.any([signal,owner.signal,timeout.signal]);
        let timer:ReturnType<typeof setTimeout>|undefined;let status:WebWireRecord['providerStatus']='unknown',bytes=0,received=0,dispatched=false,complete=false,code='',retryAfterMs:number|undefined,providerErrorCode:string|undefined;const parts:Uint8Array[]=[];
        try{
            if(permit.remainingMs()<=0)throw new ExecutionError('WEB_TOOL_TIMEOUT');owner.check();combined.throwIfAborted();const secret=await owner.credential(combined);combined.throwIfAborted();owner.check();
            const response=await permit.dispatch(combined,()=>{owner.check();combined.throwIfAborted();const remaining=permit.remainingMs();if(remaining<=0)throw new ExecutionError('WEB_TOOL_TIMEOUT');timer=setTimeout(()=>timeout.abort(),Math.min(rules.value.transportTimeoutMs,remaining));dispatched=true;return wire.post(officialWebEndpoints[operation],body,secret,combined);});status=response.status>=100&&response.status<=599?response.status:'unknown';
            const retry=response.headers.get('retry-after');if(retry!==null){const delay=/^[0-9]+(?:\.[0-9]+)?$/.test(retry.trim())?Number(retry)*1000:Date.parse(retry)-Date.parse(permit.now());if(Number.isFinite(delay)&&delay>=0)retryAfterMs=delay;}
            const reader=response.body?.getReader();if(reader){try{while(true){combined.throwIfAborted();const chunk=await reader.read();if(chunk.done){complete=true;break;}received+=chunk.value.byteLength;const retained=chunk.value.subarray(0,Math.max(0,rules.value.responseLimitBytes-bytes));if(retained.byteLength){parts.push(retained.slice());bytes+=retained.byteLength;}if(received>rules.value.responseLimitBytes){code='WEB_RESPONSE_LIMIT';await reader.cancel();break;}}}finally{reader.releaseLock();}}else complete=true;
            if(complete){const raw=Buffer.concat(parts);let text:string|undefined,payload:unknown;try{text=new TextDecoder('utf-8',{fatal:true}).decode(raw);}catch{code='WEB_INVALID_UTF8';}if(text!==undefined)try{payload=JSON.parse(text);}catch{code='WEB_INVALID_JSON';}
                if(payload&&typeof payload==='object'&&'error'in payload&&payload.error&&typeof payload.error==='object'){const error=payload.error,candidate='code'in error?error.code:'type'in error?error.type:undefined;if(typeof candidate==='string'&&/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(candidate))providerErrorCode=candidate.toUpperCase().replaceAll('-','_');}
                if(!code&&status!==200)code=typeof status==='number'&&status>=300&&status<=399?'WEB_REDIRECT_REJECTED':'WEB_PROVIDER_REJECTED';}
        }catch(error){code=timeout.signal.aborted?'WEB_TRANSPORT_TIMEOUT':signal.aborted||owner.signal.aborted?'WEB_CANCELLED':safeExecutionCode(error)==='EXECUTION_FAILED'?'WEB_TRANSPORT_FAILED':safeExecutionCode(error);}
        finally{clearTimeout(timer);}
        const raw=Buffer.concat(parts);return {providerStatus:status,rawBase64:raw.toString('base64'),retainedBytes:raw.byteLength,receivedBytes:received,completeness:!dispatched?'not-dispatched':!complete?'partial':['WEB_INVALID_JSON','WEB_INVALID_UTF8'].includes(code)?'invalid':'complete',...(code?{code}:{}),...(retryAfterMs===undefined?{}:{retryAfterMs}),...(providerErrorCode?{providerErrorCode}:{}),dispatchObserved:dispatched};
    }});
}
