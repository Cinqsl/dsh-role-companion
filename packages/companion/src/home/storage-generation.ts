import {constants} from 'node:fs';
import {open,mkdir,lstat,realpath,readdir,readFile,link,unlink,rmdir} from 'node:fs/promises';
import {join,dirname,relative} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {HomeError} from './errors.ts';
import {HomeRevision,OperationId,RoleId} from './ids.ts';
import type {HomeIO} from './index.ts';

export interface StorageGenerationPointer {readonly id:string;readonly baseRevision:HomeRevision;readonly baseCommitDigest:string;readonly checkpointDigest:string;}
export interface CleanupPurgeEntry {readonly path:string;readonly kind:'file'|'directory';readonly digest:string;readonly bytes:number;readonly dev:string;readonly ino:string;}
export interface StorageGenerationCheckpoint {
 readonly format:'role-home-storage-generation-1';readonly roleId:RoleId;readonly id:string;readonly baseRevision:HomeRevision;readonly baseCommitDigest:string;
 readonly domain:unknown;readonly commits:readonly unknown[];readonly replayRequests:readonly {readonly operationId:OperationId;readonly fingerprint:string}[];
 readonly cleanupOperationId:OperationId;readonly purge:readonly CleanupPurgeEntry[];
 /** Why this generation exists; `format-upgrade` generations never rewrite user content. */
 readonly purpose?:'format-upgrade';
}
const hash=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');
const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)+'\n','utf8');
function fail(code:string):never{throw new HomeError(code);}
const absent=(error:unknown)=>!!error&&typeof error==='object'&&'code'in error&&error.code==='ENOENT';
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const hex=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export const storageGenerationId=(operationId:OperationId,sourceHead:string)=>'generation-'+hash(operationId+':'+sourceHead);
export function admitStoragePointer(value:unknown):StorageGenerationPointer {
 if(!object(value)||Object.keys(value).sort().join('|')!=='baseCommitDigest|baseRevision|checkpointDigest|id'||typeof value.id!=='string'||!/^generation-[a-f0-9]{64}$/.test(value.id)||!hex(value.baseCommitDigest)||!hex(value.checkpointDigest))fail('CORRUPT_STORAGE_GENERATION');
 return {id:value.id,baseRevision:HomeRevision(value.baseRevision),baseCommitDigest:value.baseCommitDigest,checkpointDigest:value.checkpointDigest};
}
async function exactDirectory(path:string){const stat=await lstat(path);if(!stat.isDirectory()||stat.isSymbolicLink()||await realpath(path)!==path)fail('UNSAFE_CLEANUP_PATH');return stat;}
async function syncDir(path:string){const fd=await open(path,'r');try{await fd.sync();}finally{await fd.close();}}
async function safeBytes(path:string){const before=await lstat(path);if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1)fail('UNSAFE_CLEANUP_FILE');const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{const start=await fd.stat();if(start.dev!==before.dev||start.ino!==before.ino||start.nlink!==1)fail('CLEANUP_CONTENT_CHANGED');const value=await fd.readFile(),end=await fd.stat(),current=await lstat(path);if(start.dev!==current.dev||start.ino!==current.ino||current.nlink!==1||end.size!==value.length||end.mtimeMs!==start.mtimeMs||end.ctimeMs!==start.ctimeMs)fail('CLEANUP_CONTENT_CHANGED');return {bytes:value,stat:start};}finally{await fd.close();}}
async function ensureDirectory(path:string){try{await mkdir(path,{mode:0o700});await syncDir(dirname(path));}catch(error){if(!error||typeof error!=='object'||!('code'in error)||error.code!=='EEXIST')throw error;}await exactDirectory(path);}
async function publish(path:string,bytes:Buffer){await exactDirectory(dirname(path));try{const existing=await safeBytes(path);if(!existing.bytes.equals(bytes))fail('CLEANUP_STAGING_CONFLICT');return;}catch(error){if(!absent(error))throw error;}
 const temp=join(dirname(path),'.cleanup-'+randomUUID()+'.pending'),fd=await open(temp,'wx',0o600);try{await fd.writeFile(bytes);await fd.sync();}finally{await fd.close();}
 try{try{await link(temp,path);}catch(error){if(!error||typeof error!=='object'||!('code'in error)||error.code!=='EEXIST')throw error;const existing=await readFile(path);if(!existing.equals(bytes))fail('CLEANUP_STAGING_CONFLICT');}}finally{await unlink(temp);}await syncDir(dirname(path));
}
async function json(path:string){const value=await safeBytes(path);try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(value.bytes));}catch{return fail('CORRUPT_STORAGE_GENERATION');}}
export async function readStorageGeneration(root:string,pointer:StorageGenerationPointer):Promise<StorageGenerationCheckpoint>{
 const area=join(root,'content-generations');await exactDirectory(area);const path=join(area,pointer.id);await exactDirectory(path);const raw=await safeBytes(join(path,'checkpoint.json'));if(hash(raw.bytes)!==pointer.checkpointDigest)fail('CORRUPT_STORAGE_GENERATION');const value=await json(join(path,'checkpoint.json'));
 if(!object(value)||Object.keys(value).sort().join('|')!=='body|digest'||!object(value.body)||!hex(value.digest)||hash(encode(value.body))!==value.digest)fail('CORRUPT_STORAGE_GENERATION');
 const body=value.body;if(body.format!=='role-home-storage-generation-1'||body.id!==pointer.id||body.baseRevision!==pointer.baseRevision||body.baseCommitDigest!==pointer.baseCommitDigest||!Array.isArray(body.commits)||!Array.isArray(body.replayRequests)||!Array.isArray(body.purge)||body.purpose!==undefined&&body.purpose!=='format-upgrade')fail('CORRUPT_STORAGE_GENERATION');RoleId(body.roleId);OperationId(body.cleanupOperationId);
 return body as unknown as StorageGenerationCheckpoint;
}
function ownedName(area:string,name:string):boolean {
 if(area==='commits')return /^[0-9]{12}\.json$/.test(name)||/^\.[0-9]{12}\.json\.[0-9a-f-]{36}\.pending$/.test(name);
 if(area==='blobs'||area==='projection-progress')return /^[a-f0-9]{64}\.json$/.test(name)||/^\.[a-f0-9]{64}\.json\.[0-9a-f-]{36}\.pending$/.test(name);
 if(area==='views')return name==='settings.json'||/^\.[0-9a-f-]{36}\.projection$/.test(name);
 return false;
}
async function inventory(root:string,roleId:RoleId,exclude:string):Promise<CleanupPurgeEntry[]>{
 const files:CleanupPurgeEntry[]=[];
 async function walk(path:string,area:string){const stat=await lstat(path),name=path.slice(path.lastIndexOf('/')+1);if(stat.isSymbolicLink())fail('UNSAFE_CLEANUP_PATH');
  if(stat.isDirectory()){await exactDirectory(path);const entries=await readdir(path);for(const entry of entries){if(!ownedName(area,entry)&&!(area==='generation'&&(entry==='checkpoint.json'||entry==='owner.json'||entry==='commits'||entry==='blobs'||entry==='views'||entry==='projection-progress'||/^\.cleanup-[0-9a-f-]{36}\.pending$/.test(entry))))fail('UNCLASSIFIED_CLEANUP_CONTENT');await walk(join(path,entry),area==='generation'&&['commits','blobs','views','projection-progress'].includes(entry)?entry:area);}files.push({path:relative(root,path),kind:'directory',digest:'',bytes:0,dev:String(stat.dev),ino:String(stat.ino)});}
  else if(stat.isFile()){const value=await safeBytes(path);files.push({path:relative(root,path),kind:'file',digest:hash(value.bytes),bytes:value.bytes.length,dev:String(value.stat.dev),ino:String(value.stat.ino)});}else fail('UNSAFE_CLEANUP_FILE');
 }
 for(const area of ['commits','blobs','views','projection-progress'])try{await walk(join(root,area),area);}catch(error){if(!absent(error))throw error;}
 const generations=join(root,'content-generations');try{await exactDirectory(generations);for(const id of (await readdir(generations)).sort()){if(id===exclude)continue;if(!/^generation-[a-f0-9]{64}$/.test(id))fail('UNCLASSIFIED_CLEANUP_CONTENT');const owner=await json(join(generations,id,'owner.json'));if(!object(owner)||owner.roleId!==roleId||owner.id!==id||owner.format!=='role-cleanup-generation-owner-1')fail('UNOWNED_CLEANUP_GENERATION');await walk(join(generations,id),'generation');}}catch(error){if(!absent(error))throw error;}
 return files;
}
export async function prepareStorageGeneration(root:string,checkpoint:Omit<StorageGenerationCheckpoint,'format'|'id'|'purge'>,retainedFiles:readonly {readonly path:string;readonly bytes:Buffer}[],io:HomeIO):Promise<StorageGenerationPointer>{
 const id=storageGenerationId(checkpoint.cleanupOperationId,checkpoint.baseCommitDigest),area=join(root,'content-generations'),path=join(area,id);await ensureDirectory(area);await ensureDirectory(path);
 const owner={format:'role-cleanup-generation-owner-1',roleId:checkpoint.roleId,operationId:checkpoint.cleanupOperationId,id,baseRevision:checkpoint.baseRevision,sourceHeadDigest:checkpoint.baseCommitDigest};await publish(join(path,'owner.json'),encode(owner));await io.barrier?.('after-cleanup-generation-owner',{operationId:checkpoint.cleanupOperationId,revision:checkpoint.baseRevision});
 for(const name of ['commits','blobs','views','projection-progress'])await ensureDirectory(join(path,name));
 for(const file of retainedFiles){if(!/^(blobs|views|projection-progress)\/[A-Za-z0-9.-]+$/.test(file.path))fail('INVALID_CLEANUP_RETAINED_FILE');await publish(join(path,file.path),file.bytes);}
 const purge=await inventory(root,checkpoint.roleId,id),body:StorageGenerationCheckpoint={...checkpoint,format:'role-home-storage-generation-1',id,purge},bytes=encode({body,digest:hash(encode(body))});if(bytes.length>268435456)fail('CLEANUP_CHECKPOINT_TOO_LARGE');await publish(join(path,'checkpoint.json'),bytes);await syncDir(path);await io.barrier?.('after-cleanup-generation-sync',{operationId:checkpoint.cleanupOperationId,revision:checkpoint.baseRevision});
 const pointer={id,baseRevision:checkpoint.baseRevision,baseCommitDigest:checkpoint.baseCommitDigest,checkpointDigest:hash(bytes)};const actual=await readStorageGeneration(root,pointer);if(JSON.stringify(actual)!==JSON.stringify(body))fail('CLEANUP_GENERATION_VALIDATION_FAILED');return pointer;
}
export async function purgeStorageGeneration(root:string,checkpoint:StorageGenerationCheckpoint,io:HomeIO,observe:(count:number,total:number)=>void):Promise<number>{
 let count=0;const files=checkpoint.purge.filter(file=>file.kind==='file');
 for(const entry of checkpoint.purge){if(entry.path.startsWith('/')||entry.path.split('/').some(part=>part==='..'||part==='.')||entry.path.includes('\\'))fail('INVALID_CLEANUP_PURGE_PATH');const path=join(root,entry.path);
  await io.barrier?.('before-cleanup-purge-entry',{operationId:checkpoint.cleanupOperationId,revision:checkpoint.baseRevision});
  try{await exactDirectory(dirname(path));const stat=await lstat(path);if(String(stat.dev)!==entry.dev||String(stat.ino)!==entry.ino||stat.isSymbolicLink())fail('CLEANUP_CONTENT_CHANGED');
   if(entry.kind==='file'){const value=await safeBytes(path);if(value.bytes.length!==entry.bytes||hash(value.bytes)!==entry.digest)fail('CLEANUP_CONTENT_CHANGED');await unlink(path);}else{if(!stat.isDirectory())fail('CLEANUP_CONTENT_CHANGED');await rmdir(path);}await syncDir(dirname(path));
  }catch(error){if(!absent(error))throw error;}
  if(entry.kind==='file')count++;observe(count,files.length);await io.barrier?.('after-cleanup-purge-entry',{operationId:checkpoint.cleanupOperationId,revision:checkpoint.baseRevision});
 }
 return files.length;
}

/**
 * A successor generation that never became authority may be discarded. It is only removed when every
 * entry is a name the generator itself writes, so a foreign or linked file keeps the directory intact.
 */
export async function discardStorageGeneration(root:string,pointer:StorageGenerationPointer,operationId:OperationId,io:HomeIO):Promise<boolean>{
 const area=join(root,'content-generations'),path=join(area,pointer.id);
 let entries:string[];try{await exactDirectory(path);entries=await readdir(path);}catch(error){if(absent(error))return false;throw error;}
 const allowed=(areaName:string,name:string):boolean=>{
  if(areaName==='')return name==='owner.json'||name==='checkpoint.json'||['commits','blobs','views','projection-progress'].includes(name);
  if(areaName==='commits')return /^[0-9]{12}\.json$/.test(name)||/^\.[0-9]{12}\.json\.[0-9a-f-]{36}\.pending$/.test(name);
  if(areaName==='blobs'||areaName==='projection-progress')return /^[a-f0-9]{64}\.json$/.test(name)||/^\.[a-f0-9]{64}\.json\.[0-9a-f-]{36}\.pending$/.test(name);
  if(areaName==='views')return name==='settings.json'||/^\.[0-9a-f-]{36}\.projection$/.test(name)||/^\.[A-Za-z0-9.-]+\.[0-9a-f-]{36}\.pending$/.test(name);
  return false;
 };
 const walk=async(directory:string,areaName:string):Promise<boolean>=>{
  for(const name of await readdir(directory)){
   if(!allowed(areaName,name))return false;
   const full=join(directory,name),stat=await lstat(full);
   if(stat.isSymbolicLink())return false;
   if(stat.isDirectory()){if(!await walk(full,name))return false;await io.barrier?.('before-format-generation-discard',{operationId,revision:pointer.baseRevision});await rmdir(full);}
   else if(stat.isFile()){if(stat.nlink!==1)return false;await io.barrier?.('before-format-generation-discard',{operationId,revision:pointer.baseRevision});await unlink(full);}
   else return false;
  }
  return true;
 };
 if(!await walk(path,''))return false;
 await syncDir(area);return true;
}
