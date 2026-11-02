import {FileAccessVersion,FileGrantId,HomeRevision,OperationId} from './ids.ts';
/** Portable permission facts contain business identities and modes, never local disk roots. */
export type FileAccessMode='none'|'read-only'|'read-write';
export interface FileGrant {readonly grantId:FileGrantId;readonly mode:'read-only'|'read-write';}
export interface FileAccessValue {readonly works:FileAccessMode;readonly journal:FileAccessMode;readonly grants:readonly FileGrant[];}
export interface FileAccess {readonly version:FileAccessVersion;readonly value:FileAccessValue;}
export interface FileAccessSnapshot extends FileAccess {readonly revision:HomeRevision;}
export interface EditFileAccess {readonly kind:'edit-file-access';readonly operationId:OperationId;readonly value:FileAccessValue;readonly expectedFileAccessVersion:FileAccessVersion;readonly expectedRevision:HomeRevision;}
export const fileAccessDefaults:FileAccessValue=Object.freeze({works:'read-write',journal:'read-write',grants:Object.freeze([])});
export const initialFileAccess=():FileAccess=>({version:FileAccessVersion(1),value:fileAccessDefaults});
const exact=(value:unknown,keys:readonly string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype&&Reflect.ownKeys(value).length===keys.length&&keys.every(key=>{const item=Object.getOwnPropertyDescriptor(value,key);return !!item&&'value'in item;});
export function validateFileAccess(value:unknown):value is FileAccessValue {
    if(!exact(value,['works','journal','grants'])||typeof value.works!=='string'||!['none','read-only','read-write'].includes(value.works)||typeof value.journal!=='string'||!['none','read-only','read-write'].includes(value.journal)||!Array.isArray(value.grants)||Object.getPrototypeOf(value.grants)!==Array.prototype||value.grants.length>64||Reflect.ownKeys(value.grants).length!==value.grants.length+1)return false;
    const ids=new Set<FileGrantId>();for(let index=0;index<value.grants.length;index++){const item=Object.getOwnPropertyDescriptor(value.grants,String(index));if(!item||!('value'in item)||!exact(item.value,['grantId','mode'])||item.value.mode!=='read-only'&&item.value.mode!=='read-write')return false;let id:FileGrantId;try{id=FileGrantId(item.value.grantId);}catch{return false;}if(ids.has(id))return false;ids.add(id);}return true;
}
export function admitFileAccess(value:FileAccessValue):FileAccessValue{return {works:value.works,journal:value.journal,grants:value.grants.map(grant=>({grantId:FileGrantId(grant.grantId),mode:grant.mode}))};}
/** Archived content belongs to Home. This predicate never grants live filesystem access. */
export function archivedFileContentAllowed(book:FileAccessValue,scope:unknown):boolean{
    if(!validateFileAccess(book))return false;if(scope==='works'||scope==='journal')return book[scope]!=='none';
    if(typeof scope!=='string'||!scope.startsWith('grant:'))return false;let id:FileGrantId;try{id=FileGrantId(scope.slice(6));}catch{return false;}
    return book.grants.some(grant=>grant.grantId===id);
}
export function validateEditFileAccess(value:unknown):value is EditFileAccess {
    if(!exact(value,['kind','operationId','value','expectedFileAccessVersion','expectedRevision'])||value.kind!=='edit-file-access'||!validateFileAccess(value.value))return false;
    try{OperationId(value.operationId);FileAccessVersion(value.expectedFileAccessVersion);HomeRevision(value.expectedRevision);}catch{return false;}return true;
}
