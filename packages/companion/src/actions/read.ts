import {MaterialId,InputId,KnowledgeId,KnowledgeVersion,ExperienceId,ReplyId,AttemptId,type CoreVersion,type HomeRevision} from '../home/ids.ts';
import type {ToolObservationInput} from '../home/turns.ts';
export type RoleReadRequest=({readonly source:'core'}|{readonly source:'knowledge';readonly id:KnowledgeId;readonly version:KnowledgeVersion}|{readonly source:'input';readonly id:InputId}|{readonly source:'experience';readonly id:ExperienceId}|{readonly source:'material';readonly id:MaterialId}|{readonly source:'reply';readonly id:ReplyId}|{readonly source:'tool';readonly id:AttemptId}|{readonly source:'query';readonly query:string})&{readonly offset:number;readonly limit:number};
export type RoleReadContent=({readonly source:'core';readonly version:CoreVersion}|{readonly source:'knowledge';readonly knowledgeId:KnowledgeId;readonly version:KnowledgeVersion}|{readonly source:'input'|'experience';readonly version:HomeRevision;readonly inputId:InputId;readonly experienceId:ExperienceId}|{readonly source:'material';readonly materialId:MaterialId}|{readonly source:'reply';readonly replyId:ReplyId;readonly experienceId:ExperienceId;readonly version:HomeRevision}|{readonly source:'tool';readonly attemptId:AttemptId;readonly version:HomeRevision}|{readonly source:'query';readonly query:string;readonly version:HomeRevision})&{readonly text:string;readonly qualifiers?:string;};
export type RoleReadValue=RoleReadContent&{readonly toolAttemptId?:AttemptId;readonly offset:number;readonly totalCodePoints:number;readonly more:boolean};
export interface RoleReadGrants {
    readonly rule:'fixed-daily-snapshot'|'fixed-history-snapshot';
    readonly basis:import('../home/context-snapshot.ts').ContextSnapshotBasis;
    readonly sources:readonly import('../home/context-snapshot.ts').ContextSourceMetadata[];
    readonly coreVersion:CoreVersion;
    readonly inputs:readonly {readonly inputId:InputId;readonly experienceId:ExperienceId}[];
    readonly previousExperience:{readonly inputId:InputId;readonly experienceId:ExperienceId}|null;
}
export interface RoleReadCapability {readonly grants:RoleReadGrants;check(request:RoleReadRequest):Promise<void>;read(request:RoleReadRequest):Promise<RoleReadValue>;}
export interface RecordedRead {readonly value:RoleReadValue;readonly observationRevision:HomeRevision;}
export interface ReadObservationPermit {readonly attemptId:AttemptId;enter():Promise<void>;invoke<T>(signal:AbortSignal|undefined,effect:()=>Promise<T>):Promise<T>;observe(observation:ToolObservationInput):Promise<HomeRevision>;}
export function parseRoleRead(value:unknown):RoleReadRequest{
    if(!value||typeof value!=='object'||Array.isArray(value)||!('source' in value)||!('offset' in value)||typeof value.offset!=='number'||!Number.isSafeInteger(value.offset)||value.offset<0||!('limit' in value)||typeof value.limit!=='number'||!Number.isSafeInteger(value.limit)||value.limit<1)throw Object.assign(new Error('INVALID_ROLE_READ'),{code:'INVALID_ROLE_READ'});
    const keys=Object.keys(value).sort().join('|');if(value.source==='knowledge'&&keys==='id|limit|offset|source|version'&&'id'in value&&'version'in value&&typeof value.version==='number'&&value.version>0)return {source:'knowledge',id:KnowledgeId(value.id),version:KnowledgeVersion(value.version),offset:value.offset,limit:value.limit};if(value.source==='core'&&keys==='limit|offset|source')return {source:'core',offset:value.offset,limit:value.limit};
    if(value.source==='input'&&keys==='id|limit|offset|source'&&'id' in value)return {source:'input',id:InputId(value.id),offset:value.offset,limit:value.limit};
    if(value.source==='experience'&&keys==='id|limit|offset|source'&&'id' in value)return {source:'experience',id:ExperienceId(value.id),offset:value.offset,limit:value.limit};
    if(value.source==='material'&&keys==='id|limit|offset|source'&&'id' in value)return {source:'material',id:MaterialId(value.id),offset:value.offset,limit:value.limit};
    if(value.source==='reply'&&keys==='id|limit|offset|source'&&'id'in value)return {source:'reply',id:ReplyId(value.id),offset:value.offset,limit:value.limit};
    if(value.source==='tool'&&keys==='id|limit|offset|source'&&'id'in value)return {source:'tool',id:AttemptId(value.id),offset:value.offset,limit:value.limit};
    if(value.source==='query'&&keys==='limit|offset|query|source'&&'query'in value&&typeof value.query==='string'&&value.query.trim()&&Buffer.byteLength(value.query,'utf8')<=32768&&!value.query.includes('\0'))return {source:'query',query:value.query,offset:value.offset,limit:value.limit};
    throw Object.assign(new Error('INVALID_ROLE_READ'),{code:'INVALID_ROLE_READ'});
}
/** Effects and their observation settle before the SDK body can return. No owner/SDK/path capability is accepted. */
export async function executeRoleRead(request:RoleReadRequest,capability:RoleReadCapability,attempt:ReadObservationPermit,signal?:AbortSignal):Promise<RecordedRead>{
    const check=()=>{if(signal?.aborted)throw Object.assign(new Error('ROLE_READ_CANCELLED'),{code:'ROLE_READ_CANCELLED'});};
    check();await capability.check(request);check();await attempt.enter();check();
    let value:RoleReadValue,started=false;
    try{value=await attempt.invoke(signal,async()=>{started=true;return {...await capability.read(request),toolAttemptId:attempt.attemptId};});}
    catch(error){if(started)await attempt.observe({kind:'threw',code:error&&typeof error==='object'&&'code' in error&&typeof error.code==='string'&&/^[A-Z][A-Z0-9_]{1,63}$/.test(error.code)?error.code:'ROLE_READ_FAILED'});throw error;}
    const observationRevision=await attempt.observe({kind:'returned',value});check();return {value,observationRevision};
}
