import type {FileRulesValue} from '../home/file-rules.ts';
import {FileGrantId,FileTag,type AttemptId,type HomeRevision} from '../home/ids.ts';
import type {ToolObservationInput} from '../home/turns.ts';
/** Only relative business names cross the model interface. Disk roots remain in Host. */
export type RoleFileScope='works'|'journal'|`grant:${FileGrantId}`;
export function fileGrantScope(grantId:FileGrantId):RoleFileScope{return `grant:${grantId}`;}
function parseScope(value:unknown):RoleFileScope{if(value==='works'||value==='journal')return value;if(typeof value==='string'&&value.startsWith('grant:')){try{return fileGrantScope(FileGrantId(value.slice(6)));}catch{}}throw new FileActionError('INVALID_ROLE_FILE');}
export interface RoleFileList {readonly op:'list';readonly scope:RoleFileScope;readonly path:string;readonly offset:number;readonly limit:number;readonly expectedTag?:FileTag;}
export interface RoleFileReadText extends Omit<RoleFileList,'op'> {readonly op:'readText';}
export type FileExpectation=FileTag|'absent';
export interface RoleFileWriteText {readonly op:'writeText';readonly scope:RoleFileScope;readonly path:string;readonly text:string;readonly expectedTag:FileExpectation;}
export interface RoleFileMkdir {readonly op:'mkdir';readonly scope:RoleFileScope;readonly path:string;readonly expectedTag:'absent';}
export interface RoleFileMove {readonly op:'move';readonly scope:RoleFileScope;readonly path:string;readonly destination:string;readonly expectedTag:FileTag;readonly destinationExpectedTag:'absent';}
export interface RoleFileRemove {readonly op:'remove';readonly scope:RoleFileScope;readonly path:string;readonly expectedTag:FileTag;readonly recursive:boolean;}
export type RoleFileRequest=RoleFileList|RoleFileReadText|RoleFileWriteText|RoleFileMkdir|RoleFileMove|RoleFileRemove;
export interface RoleFileEntry {readonly name:string;readonly kind:'file'|'directory';readonly tag:FileTag;}
export interface RoleFileListValue {readonly op:'list';readonly scope:RoleFileScope;readonly path:string;readonly entries:readonly RoleFileEntry[];readonly tag:FileTag;readonly offset:number;readonly totalEntries:number;readonly more:boolean;}
export interface RoleFileTextValue {readonly op:'readText';readonly scope:RoleFileScope;readonly path:string;readonly text:string;readonly bytes:number;readonly tag:FileTag;readonly offset:number;readonly totalCodePoints:number;readonly more:boolean;}
export interface RoleFileWriteValue {readonly op:'writeText'|'mkdir'|'move'|'remove';readonly scope:RoleFileScope;readonly path:string;readonly effect:'published'|'unknown';readonly previousTag:FileExpectation;readonly tag?:FileTag;readonly destination?:string;readonly destinationPreviousTag?:'absent';readonly stages?:string[];readonly bytes?:number;readonly digest?:string;readonly code?:string;}
export type RoleFileValue=RoleFileListValue|RoleFileTextValue|RoleFileWriteValue;
export interface RoleFileCapability {readonly scopes:readonly RoleFileScope[];prepare?(signal?:AbortSignal):Promise<void>;snapshot?():RoleFileCapability;assertCurrent?():void;check(request:RoleFileRequest):Promise<void>;execute(request:RoleFileRequest,rules:FileRulesValue,signal?:AbortSignal):Promise<RoleFileValue>;}
export interface FileObservationPermit {readonly attemptId:AttemptId;readonly rules:FileRulesValue;enter():Promise<void>;invoke<T>(signal:AbortSignal|undefined,effect:()=>Promise<T>):Promise<T>;observe(observation:ToolObservationInput):Promise<HomeRevision>;}
export class FileActionError extends Error {constructor(readonly code:string,readonly reason?:string){super(code);}}
const plain=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const validUnicode=(value:string)=>!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
export function parseRoleFile(value:unknown):RoleFileRequest {
    if(!plain(value)||Reflect.ownKeys(value).length!==Object.keys(value).length)throw new FileActionError('INVALID_ROLE_FILE');
    for(const key of Object.keys(value)){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor||!('value'in descriptor))throw new FileActionError('INVALID_ROLE_FILE');}
    const scope=parseScope(value.scope);if(typeof value.path!=='string')throw new FileActionError('INVALID_ROLE_FILE');
    if(!validUnicode(value.path)||value.path.includes('\\')||value.path.includes(':')||value.path.includes('\0')||!(value.op==='list'&&value.path==='')&&value.path.split('/').some(part=>!part||part==='.'||part==='..'))throw new FileActionError('INVALID_FILE_PATH');
    const keys=Object.keys(value).sort().join('|');
    if(value.op==='remove'){if(keys!=='expectedTag|op|path|recursive|scope'||typeof value.recursive!=='boolean')throw new FileActionError('INVALID_ROLE_FILE');return {op:'remove',scope,path:value.path,expectedTag:FileTag(value.expectedTag),recursive:value.recursive};}
    if(value.op==='move'){if(keys!=='destination|destinationExpectedTag|expectedTag|op|path|scope'||typeof value.destination!=='string'||!validUnicode(value.destination)||!value.destination||value.destination.includes('\\')||value.destination.includes(':')||value.destination.includes('\0')||value.destination.split('/').some(part=>!part||part==='.'||part==='..')||value.destination===value.path||value.destination.startsWith(value.path+'/')||value.destinationExpectedTag!=='absent')throw new FileActionError('INVALID_ROLE_FILE');return {op:'move',scope,path:value.path,destination:value.destination,expectedTag:FileTag(value.expectedTag),destinationExpectedTag:'absent'};}
    if(value.op==='mkdir'){if(keys!=='expectedTag|op|path|scope'||value.expectedTag!=='absent')throw new FileActionError('INVALID_ROLE_FILE');return {op:'mkdir',scope,path:value.path,expectedTag:'absent'};}
    if(value.op==='writeText'){
        if(keys!=='expectedTag|op|path|scope|text'||typeof value.text!=='string'||!validUnicode(value.text))throw new FileActionError('INVALID_ROLE_FILE');
        return {op:'writeText',scope,path:value.path,text:value.text,expectedTag:value.expectedTag==='absent'?'absent':FileTag(value.expectedTag)};
    }
    if(value.op!=='list'&&value.op!=='readText'||!['limit|offset|op|path|scope','expectedTag|limit|offset|op|path|scope'].includes(keys)||typeof value.offset!=='number'||!Number.isSafeInteger(value.offset)||value.offset<0||typeof value.limit!=='number'||!Number.isSafeInteger(value.limit)||value.limit<1)throw new FileActionError('INVALID_ROLE_FILE');
    if(value.offset>0&&!('expectedTag'in value))throw new FileActionError('FILE_PAGE_TAG_REQUIRED');return {op:value.op,scope,path:value.path,offset:value.offset,limit:value.limit,...('expectedTag'in value?{expectedTag:FileTag(value.expectedTag)}:{})};
}
/** No SDK context, disk root, owner, budget or retry policy enters ControlledActions. */
export async function executeRoleFile(request:RoleFileRequest,capability:RoleFileCapability,attempt:FileObservationPermit,signal?:AbortSignal){
    const check=()=>{if(signal?.aborted)throw new FileActionError('FILE_OPERATION_CANCELLED');};check();await capability.check(request);check();await attempt.enter();check();let value:RoleFileValue,started=false;
    try{value=await attempt.invoke(signal,()=>{started=true;return capability.execute(request,attempt.rules,signal);});}
    catch(error){if(started)await attempt.observe({kind:'threw',code:error&&typeof error==='object'&&'code'in error&&typeof error.code==='string'&&/^[A-Z][A-Z0-9_]{1,63}$/.test(error.code)?error.code:'FILE_OPERATION_FAILED'});throw error;}
    const recorded={...value,toolAttemptId:attempt.attemptId};const observationRevision=await attempt.observe({kind:'returned',value:recorded});if('effect'in value&&value.effect==='unknown')throw new FileActionError('FILE_EFFECT_UNKNOWN');check();return {value:recorded,observationRevision};
}
