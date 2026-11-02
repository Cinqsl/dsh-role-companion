import {HomeError} from './errors.ts';
import type {AttemptRecord,ConversationState} from './turns.ts';
export const contextObject=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
export const contextField=(value:unknown,name:string):unknown=>contextObject(value)?value[name]:undefined;
/** Canonical completeness has one Home owner, shared by source projection and lineage. */
export function contextToolParts(attempt:AttemptRecord,conversation:ConversationState){
 const turn=conversation.turns.find(turn=>turn.runId===attempt.runId);if(!turn)throw new HomeError('CONTEXT_SOURCE_INCOMPLETE');
 const data=attempt.outcome?.data,request=contextField(data,'request'),name=contextField(request,'name'),rawFinal=contextField(contextField(data,'result'),'final');
 const final=contextObject(rawFinal)?rawFinal:undefined;
 const canonical=!!final&&final.provenance!=='synthetic-native'&&final.canonicalValue!=='unavailable'&&Array.isArray(final.content)&&((final.isError===false&&Object.hasOwn(final,'value'))||(final.isError===true&&contextObject(final.error)));
 const gap=conversation.nativeRecords.some(record=>record.runId===attempt.runId&&contextField(record.data,'attemptId')===attempt.attemptId&&['sdk-spill-gap','native-exposure-gap'].includes(String(contextField(record.data,'kind'))));
 const complete=canonical&&!!attempt.observation&&typeof name==='string'&&contextObject(request)&&Object.hasOwn(request,'arguments')&&!gap;
 return {turn,request,name:typeof name==='string'?name:'unknown',final,canonical,complete};
}

/** A current-run supplement requires the independent real Native canonical, not a synthetic closure. */
export function confirmedToolCanonical(attempt:AttemptRecord,conversation:ConversationState){
 const parts=contextToolParts(attempt,conversation),native=contextField(parts.request,'native'),session=contextField(native,'sessionId'),seq=contextField(native,'callSeq');
 if(!parts.complete||attempt.outcome?.kind!=='completed'||parts.final?.isError!==false||typeof session!=='string'||typeof seq!=='number')return;
 return conversation.nativeRecords.find(record=>record.runId===attempt.runId&&record.provenance==='tools-result'&&record.nativeId===session+':final:'+seq&&contextField(record.data,'association')==='issued-execution'&&contextField(record.data,'callSeq')===seq&&contextField(record.data,'name')===parts.name&&JSON.stringify(contextField(record.data,'arguments'))===JSON.stringify(contextField(parts.request,'arguments'))&&JSON.stringify(contextField(record.data,'result'))===JSON.stringify(parts.final));
}
