import {createHash} from 'node:crypto';
import {lstat,realpath} from 'node:fs/promises';
import {dirname,isAbsolute,normalize} from 'node:path';
import {FileGrantId,OperationId,RoleId,HomeError,plainExact} from '../home/index.ts';
import {FileMappingVersion} from '../host-contracts.ts';
export interface LocalFileMapping {readonly grantId:FileGrantId;readonly roleId:RoleId;readonly homeRoot:string;readonly homeFingerprint:string;readonly path:string;readonly pathFingerprint:string;readonly operationId:OperationId;}
export interface DirectoryIdentity {readonly root:string;readonly fingerprint:string;readonly device:string;readonly inode:string;readonly birthtimeNs:string;}
/** Candidate roleId identifies the requesting role, not a verified owner. Every row only denies access. */
export interface KnownFileHome extends DirectoryIdentity {readonly roleId:RoleId;readonly source:'opened-home'|'verified-diagnostic'|'diagnostic-candidate';}
export interface FileMappingProfile {readonly version:FileMappingVersion;readonly lastOperationId:string;readonly entries:readonly LocalFileMapping[];readonly protectionCacheId?:string;}
export const fileMappingDefaults:FileMappingProfile=Object.freeze({version:FileMappingVersion(0),lastOperationId:'',entries:Object.freeze([]),protectionCacheId:''});
const digest=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const path=(value:unknown):value is string=>typeof value==='string'&&value.length<=8192&&isAbsolute(value)&&normalize(value)===value&&!value.includes('\0');
export function validateFileMappings(value:unknown):value is FileMappingProfile{
    if(!plainExact(value,['version','lastOperationId','entries'])&&!plainExact(value,['version','lastOperationId','entries','protectionCacheId']))return false;
    if(typeof value.lastOperationId!=='string'||!Array.isArray(value.entries)||value.entries.length>64||Reflect.ownKeys(value.entries).length!==value.entries.length+1||value.protectionCacheId!==undefined&&(typeof value.protectionCacheId!=='string'||value.protectionCacheId!==''&&!/^protection-[a-f0-9-]{36}$/.test(value.protectionCacheId)))return false;
    try{FileMappingVersion(value.version);if(value.version===0){if(value.lastOperationId||value.entries.length)return false;}else OperationId(value.lastOperationId);}catch{return false;}
    const ids=new Set<string>();for(let index=0;index<value.entries.length;index++){
        const descriptor=Object.getOwnPropertyDescriptor(value.entries,String(index)),entry=descriptor&&'value'in descriptor?descriptor.value:undefined;
        if(!plainExact(entry,['grantId','roleId','homeRoot','homeFingerprint','path','pathFingerprint','operationId'])||!path(entry.homeRoot)||!path(entry.path)||!digest(entry.homeFingerprint)||!digest(entry.pathFingerprint))return false;
        try{FileGrantId(entry.grantId);RoleId(entry.roleId);OperationId(entry.operationId);}catch{return false;}
        const id=JSON.stringify([entry.roleId,entry.grantId]);if(ids.has(id))return false;ids.add(id);
    }return true;
}
export function validateKnownFileHome(value:unknown):value is KnownFileHome{
    if(!plainExact(value,['roleId','root','fingerprint','device','inode','birthtimeNs','source'])||!path(value.root)||!digest(value.fingerprint)||!['device','inode','birthtimeNs'].every(key=>typeof value[key]==='string'&&/^(0|[1-9][0-9]{0,63})$/.test(value[key]))||value.source!=='opened-home'&&value.source!=='verified-diagnostic'&&value.source!=='diagnostic-candidate')return false;
    try{RoleId(value.roleId);}catch{return false;}return createHash('sha256').update([value.device,value.inode,value.birthtimeNs].join(':')).digest('hex')===value.fingerprint;
}
/** Metadata only. Every ancestor must be a real directory, including the supplied root. */
export async function localDirectoryIdentity(root:string):Promise<DirectoryIdentity>{
    if(!path(root)||await realpath(root)!==root)throw new HomeError('FILE_MAPPING_ROOT_INVALID');
    let cursor=root;while(true){const node=await lstat(cursor,{bigint:true});if(node.isSymbolicLink()||!node.isDirectory())throw new HomeError('FILE_MAPPING_ROOT_INVALID');const parent=dirname(cursor);if(parent===cursor)break;cursor=parent;}
    const node=await lstat(root,{bigint:true});return {root,fingerprint:createHash('sha256').update([node.dev,node.ino,node.birthtimeNs].join(':')).digest('hex'),device:String(node.dev),inode:String(node.ino),birthtimeNs:String(node.birthtimeNs)};
}
export async function mappingStillMatches(mapping:LocalFileMapping,homeRoot:string,roleId:RoleId):Promise<boolean>{
    if(mapping.roleId!==roleId||mapping.homeRoot!==homeRoot)return false;
    try{const home=await localDirectoryIdentity(homeRoot),target=await localDirectoryIdentity(mapping.path);return home.fingerprint===mapping.homeFingerprint&&target.fingerprint===mapping.pathFingerprint;}catch{return false;}
}
