import type {RestoreConfirmation,RestoreAcceptance} from './restore-acceptance.ts';
import {validateRestoreRequest,type RestoreRequest,type RestoreProgress,type RestoreRead} from './restores.ts';
import {BackupManifestDigest} from './ids.ts';
import {retainedHomeEntries} from './layout.ts';
import {constants} from 'node:fs';
import {open,mkdir,lstat,realpath,readdir,readFile,rename,unlink} from 'node:fs/promises';
import {join,dirname,basename,resolve,sep} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {HomeError} from './errors.ts';
import {OperationId,RoleId,HomeRevision} from './ids.ts';
import {parseProjectionJSON} from './projections.ts';
import type {BackupRequest,BackupProgress,BackupFile,HomeBackupMaintenance,BackupMaintenanceSnapshot,BackupMaintenanceRead} from './backups.ts';
import type {HomeIO} from './index.ts';

const hash=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');
const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)+'\n','utf8');
function fail(code:string):never{throw new HomeError(code);}
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const hex=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const code=(error:unknown)=>error instanceof HomeError?error.code:error instanceof Error&&'code' in error&&typeof error.code==='string'&&/^[A-Z][A-Z0-9_]{1,63}$/.test(error.code)?error.code:'BACKUP_IO_FAILED';
const absent=(error:unknown)=>error instanceof Error&&'code' in error&&error.code==='ENOENT';
async function exists(path:string){try{await lstat(path);return true;}catch(error){if(absent(error))return false;throw error;}}
async function syncDir(path:string){const file=await open(path,'r');try{await file.sync();}finally{await file.close();}}
/** Reject aliases at every existing component. This is validation, not an OS sandbox. */
async function exactPath(input:string,allowMissing=false):Promise<string>{
    if(typeof input!=='string'||!input.startsWith('/')||input.includes('\0')||input.split('/').some(x=>x==='.'||x==='..')||resolve(input)!==input||input==='/')fail('UNSAFE_BACKUP_PATH');
    let path='/';const parts=input.split('/').filter(Boolean);
    for(let i=0;i<parts.length;i++){
        path=join(path,parts[i]!);let stat;try{stat=await lstat(path);}catch(error){if(allowMissing&&i===parts.length-1&&absent(error))return input;throw error;}
        if(!stat.isDirectory()||stat.isSymbolicLink()||await realpath(path)!==path)fail('UNSAFE_BACKUP_PATH');
    }return input;
}
async function directory(path:string){try{await mkdir(path,{mode:0o700});await syncDir(dirname(path));}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='EEXIST'))throw error;}await exactPath(path);}
async function bytes(path:string,stable=true):Promise<Buffer>{
    const before=await lstat(path);if(!before.isFile()||before.isSymbolicLink()||before.nlink>1)fail('UNSAFE_BACKUP_FILE');if(before.nlink!==1)fail(stable?'UNSAFE_BACKUP_FILE':'BACKUP_METADATA_CHANGED');
    const fd=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
    try{const stat=await fd.stat();if(!stat.isFile()||stat.ino!==before.ino||stat.dev!==before.dev||stat.nlink!==1)fail(stable?'UNSAFE_BACKUP_FILE':'BACKUP_METADATA_CHANGED');const value=await fd.readFile();const after=await fd.stat();const current=await lstat(path);if(after.size!==value.length||after.mtimeMs!==stat.mtimeMs||stable&&(after.ctimeMs!==stat.ctimeMs||current.ino!==stat.ino||current.dev!==stat.dev||current.nlink!==1))fail('BACKUP_SOURCE_CHANGED');return value;}finally{await fd.close();}
}
async function json(path:string):Promise<unknown>{for(let retry=0;retry<4;retry++){try{return parseProjectionJSON(new TextDecoder('utf-8',{fatal:true}).decode(await bytes(path,false)));}catch(error){if(error instanceof HomeError&&error.code==='BACKUP_METADATA_CHANGED')continue;if(error instanceof HomeError)throw error;if(absent(error))throw error;return fail('CORRUPT_BACKUP_METADATA');}}return fail('BACKUP_METADATA_CHANGED');}
async function atomic(path:string,value:unknown,afterSync?:()=>Promise<void>){
    await exactPath(dirname(path));if(await exists(path))await bytes(path);
    const temp=join(dirname(path),'.backup-'+randomUUID()+'.pending'),fd=await open(temp,'wx',0o600);
    try{await fd.writeFile(encode(value));await fd.sync();}finally{await fd.close();}
    try{await afterSync?.();await rename(temp,path);await syncDir(dirname(path));}finally{await unlink(temp).catch(()=>{});}
}
const retained=new Set<string>(retainedHomeEntries);
const ignored=(name:string)=>name==='.restore'||name==='.maintenance'||name==='.maintenance.lock'||name==='writer.lock'||/^\.takeover-[a-f0-9]{64}$/.test(name)||/^\.(?:identity\.json|head|head\.json|writer\.lock|\.maintenance\.lock)\.[0-9a-f-]{36}\.pending$/.test(name);
const temporary=(area:string,name:string)=>area==='views'?/^\.[0-9a-f-]{36}\.projection$/.test(name):area==='commits'?/^\.[0-9]{12}\.json\.[0-9a-f-]{36}\.pending$/.test(name):area==='blobs'?/^\.[a-f0-9]{64}\.json\.[0-9a-f-]{36}\.pending$/.test(name):false;
/** All retained files and empty directories are covered, independently of record field names. */
async function inventory(root:string,source=true):Promise<BackupFile[]>{
    await exactPath(root);const files:BackupFile[]=[];
    const walk=async(relative:string):Promise<void>=>{
        const path=join(root,relative),stat=await lstat(path);if(stat.isSymbolicLink())fail('UNSAFE_BACKUP_FILE');
        if(stat.isDirectory()){await exactPath(path);files.push({path:relative,kind:'directory',bytes:0,digest:''});for(const name of(await readdir(path)).sort()){if(source&&temporary(relative,name))continue;await walk(relative+'/'+name);}}
        else if(stat.isFile()){const value=await bytes(path);files.push({path:relative,kind:'file',bytes:value.length,digest:hash(value)});}else fail('UNSAFE_BACKUP_FILE');
    };
    for(const name of(await readdir(root)).sort()){if(source&&ignored(name))continue;if(!retained.has(name))fail('UNCLASSIFIED_HOME_CONTENT');await walk(name);}return files;
}
function validFiles(value:unknown):value is BackupFile[]{
    return Array.isArray(value)&&value.every((file:unknown)=>object(file)&&Object.keys(file).sort().join('|')==='bytes|digest|kind|path'&&typeof file.path==='string'&&file.path.length>0&&!file.path.startsWith('/')&&file.path.split('/').every(p=>p!=='.'&&p!=='..'&&p.length>0)&&!file.path.includes('\\')&&!file.path.includes('\0')&&retained.has(file.path.split('/')[0]!)&&(file.kind==='file'||file.kind==='directory')&&Number.isSafeInteger(file.bytes)&&Number(file.bytes)>=0&&(file.kind==='file'?hex(file.digest):file.digest===''&&file.bytes===0))&&new Set(value.map(x=>x.path)).size===value.length;
}
function validMaintenanceFiles(value:unknown):value is BackupFile[]{
    return Array.isArray(value)&&value.length>0&&value.every((file:unknown)=>object(file)&&Object.keys(file).sort().join('|')==='bytes|digest|kind|path'&&typeof file.path==='string'&&/^[a-f0-9]{64}\.json$/.test(file.path)&&file.kind==='file'&&Number.isSafeInteger(file.bytes)&&Number(file.bytes)>0&&hex(file.digest)&&file.path===file.digest+'.json')&&new Set(value.map(file=>file.path)).size===value.length;
}
function recordValue(value:unknown):BackupProgress{
    if(!object(value)||typeof value.destination!=='string'||!['stopping','stopped','copying','verifying','uncertain','failed','verified-restorable'].includes(String(value.phase))||!['requested','stopped','manifest-published','verified'].includes(String(value.checkpoint))||!validFiles(value.files)||!Number.isSafeInteger(value.copiedFiles)||!Number.isSafeInteger(value.verifiedFiles)||Number(value.copiedFiles)<0||Number(value.verifiedFiles)<0||value.error!==undefined&&typeof value.error!=='string'||value.manifestDigest!==undefined&&!hex(value.manifestDigest)||value.sourceHeadDigest!==undefined&&!hex(value.sourceHeadDigest)||value.maintenanceDigest!==undefined&&!hex(value.maintenanceDigest)||value.maintenanceFiles!==undefined&&!validMaintenanceFiles(value.maintenanceFiles))fail('CORRUPT_BACKUP_JOURNAL');
    OperationId(value.operationId);RoleId(value.roleId);OperationId(value.stopOperationId);if(value.sourceRevision!==undefined)HomeRevision(value.sourceRevision);
    return value as unknown as BackupProgress;
}
function maintenanceSnapshot(value:unknown):BackupMaintenanceSnapshot{
    if(!object(value)||Object.keys(value).sort().join('|')!=='currentOperationId|format|records|roleId|sourceHeadDigest|sourceRevision'||value.format!=='role-backup-maintenance-1'||!hex(value.sourceHeadDigest)||!Array.isArray(value.records))fail('INVALID_BACKUP_MAINTENANCE');
    const roleId=RoleId(value.roleId),sourceRevision=HomeRevision(value.sourceRevision),currentOperationId=OperationId(value.currentOperationId),records=value.records.map(recordValue);
    if(new Set(records.map(record=>record.operationId)).size!==records.length||records.some(record=>record.roleId!==roleId||Object.hasOwn(record,'frozenMaintenance')||Object.hasOwn(record,'format')||Object.hasOwn(record,'destinationIdentity'))||!records.some(record=>record.operationId===currentOperationId&&record.phase==='stopped'&&record.checkpoint==='stopped'&&record.sourceRevision===sourceRevision&&record.sourceHeadDigest===value.sourceHeadDigest))fail('INVALID_BACKUP_MAINTENANCE');
    return {format:'role-backup-maintenance-1',roleId,sourceRevision,sourceHeadDigest:value.sourceHeadDigest,currentOperationId,records};
}
/** Validate imported immutable history; it never becomes a live maintenance task. */
export function restoredMaintenanceSnapshots(value:unknown,roleId:RoleId):readonly BackupMaintenanceSnapshot[]{
    if(!Array.isArray(value))fail('INVALID_BACKUP_MAINTENANCE');const snapshots=value.map(maintenanceSnapshot);
    if(snapshots.some(snapshot=>snapshot.roleId!==roleId)||new Set(snapshots.map(snapshot=>hash(encode(snapshot)))).size!==snapshots.length)fail('INVALID_BACKUP_MAINTENANCE');return snapshots;
}
interface Manifest {readonly format:'role-backup-1';readonly operationId:OperationId;readonly roleId:RoleId;readonly sourceRevision:HomeRevision;readonly sourceHeadDigest:string;readonly stopOperationId:OperationId;readonly homeFormat:{readonly major:number;readonly minor:number};readonly files:readonly BackupFile[];readonly maintenanceDigest:string;readonly maintenanceFiles:readonly BackupFile[];}
interface Journal extends BackupProgress {readonly format:'role-backup-task-1';readonly frozenMaintenance?:BackupMaintenanceSnapshot;readonly destinationIdentity?:{readonly dev:string;readonly ino:string};}
function journal(value:unknown):Journal{
    if(!object(value)||value.format!=='role-backup-task-1'||!object(value.record)||value.record.format!=='role-backup-task-1'||!hex(value.digest)||hash(encode(value.record))!==value.digest)fail('CORRUPT_BACKUP_JOURNAL');
    recordValue(value.record);if(value.record.destinationIdentity!==undefined&&(!object(value.record.destinationIdentity)||Object.keys(value.record.destinationIdentity).sort().join('|')!=='dev|ino'||typeof value.record.destinationIdentity.dev!=='string'||typeof value.record.destinationIdentity.ino!=='string'||!/^[0-9]+$/.test(value.record.destinationIdentity.dev)||!/^[0-9]+$/.test(value.record.destinationIdentity.ino)))fail('CORRUPT_BACKUP_JOURNAL');if(value.record.frozenMaintenance!==undefined){const snapshot=maintenanceSnapshot(value.record.frozenMaintenance);if(snapshot.roleId!==value.record.roleId||snapshot.currentOperationId!==value.record.operationId||snapshot.sourceRevision!==value.record.sourceRevision||hash(encode(snapshot))!==value.record.maintenanceDigest)fail('CORRUPT_BACKUP_JOURNAL');}
    return value.record as unknown as Journal;
}
function publicProgress(record:Journal):BackupProgress{const {format,frozenMaintenance,destinationIdentity,...progress}=record;return structuredClone(progress);}
function manifest(record:Journal,homeFormat:{readonly major:number;readonly minor:number}):Manifest{if(record.sourceRevision===undefined||!record.sourceHeadDigest||!record.maintenanceDigest||!record.maintenanceFiles)fail('BACKUP_STOP_UNCONFIRMED');return {format:'role-backup-1',operationId:record.operationId,roleId:record.roleId,sourceRevision:record.sourceRevision,sourceHeadDigest:record.sourceHeadDigest,stopOperationId:record.stopOperationId,homeFormat:{major:homeFormat.major,minor:homeFormat.minor},files:record.files,maintenanceDigest:record.maintenanceDigest,maintenanceFiles:record.maintenanceFiles};}
export interface BackupAuthority {readonly mode:'healthy'|'read-only';readonly reason:string;readonly verifiedRoleId:RoleId|null;readonly verifiedRevision:HomeRevision|null;
    /** The format the verified authority declares; a backup manifest records it verbatim. */
    readonly verifiedFormat?:{readonly major:number;readonly minor:number};readonly stops:readonly {readonly operationId:OperationId;readonly checkpoint:string;readonly checkpointRevision:HomeRevision}[];readonly maintenanceSnapshots?:readonly BackupMaintenanceSnapshot[];}
type Validate=(path:string,roleId:RoleId)=>Promise<BackupAuthority>;
interface Dependencies {readonly acquire:()=>Promise<()=>Promise<void>>;readonly validate:Validate;readonly io:HomeIO;readonly releaseAccess?:()=>Promise<void>;}

export class BackupStore implements HomeBackupMaintenance {
    private serial:Promise<unknown>=Promise.resolve();private releaseAccess:(()=>Promise<void>)|undefined;private homeClosed=false;private pinned=false;
    constructor(private readonly source:string,private readonly roleId:RoleId,private readonly deps:Dependencies){this.releaseAccess=deps.releaseAccess;this.homeClosed=!deps.releaseAccess;}
    private run<T>(fn:()=>Promise<T>):Promise<T>{const task=this.serial.then(fn);this.serial=task.catch(()=>{});return task;}
    private path(id:OperationId){return join(this.source,'.maintenance','backup-'+hash(id)+'.json');}
    private async load(id:OperationId){try{const record=journal(await json(this.path(id)));if(record.operationId!==id||record.roleId!==this.roleId)fail('CORRUPT_BACKUP_JOURNAL');return record;}catch(error){if(absent(error))return undefined;throw error;}}
    private async save(record:Journal){await directory(join(this.source,'.maintenance'));await atomic(this.path(record.operationId),{format:'role-backup-task-1',record,digest:hash(encode(record))});}
    private async barrier(stage:string,record:Journal){await this.deps.io.barrier?.(stage,{operationId:record.operationId,revision:record.sourceRevision??HomeRevision(0)});}
    private async journals(){const result:Journal[]=[];if(!await exists(join(this.source,'.maintenance')))return result;await exactPath(join(this.source,'.maintenance'));for(const name of(await readdir(join(this.source,'.maintenance'))).sort()){if(/^\.backup-[0-9a-f-]+\.pending$/.test(name))continue;if(!/^backup-[a-f0-9]{64}\.json$/.test(name))fail('CORRUPT_BACKUP_JOURNAL');const record=journal(await json(join(this.source,'.maintenance',name)));if(record.roleId!==this.roleId||this.path(record.operationId)!==join(this.source,'.maintenance',name))fail('CORRUPT_BACKUP_JOURNAL');result.push(record);}return result;}
    async list(){return (await this.journals()).map(publicProgress);}
    async pending(){return (await this.list()).filter(record=>record.checkpoint!=='verified');}
    async read(operationId:OperationId):Promise<BackupProgress>{OperationId(operationId);const record=await this.load(operationId);return record?publicProgress(record):{operationId,roleId:this.roleId,destination:'',phase:'not-found',checkpoint:'requested',stopOperationId:operationId,files:[],copiedFiles:0,verifiedFiles:0};}
    private async destination(request:BackupRequest){OperationId(request.operationId);const path=await exactPath(request.destination,true);if(path===this.source||path.startsWith(this.source+sep)||this.source.startsWith(path+sep))fail('BACKUP_PATH_OVERLAP');return path;}
    async preflight(request:BackupRequest):Promise<void>{const destination=await this.destination(request),previous=await this.load(request.operationId);if(previous&&previous.destination!==destination)fail('OPERATION_CONFLICT');if(!previous&&await exists(destination)&&(await readdir(destination)).length)fail('BACKUP_DESTINATION_NOT_EMPTY');}
    async reserve(request:BackupRequest,stopOperationId:OperationId,seal?:()=>void):Promise<BackupProgress>{return this.run(async()=>{
        const destination=await this.destination(request),previous=await this.load(request.operationId);
        if(previous){if(previous.destination!==destination)fail('OPERATION_CONFLICT');if(previous.phase==='verified-restorable'||previous.sourceRevision!==undefined)return publicProgress(previous);}
        if(this.homeClosed&&!this.deps.releaseAccess)fail('BACKUP_STOP_REQUIRED');
        if((await this.pending()).some(record=>record.operationId!==request.operationId))fail('MAINTENANCE_PENDING');
        if(!previous&&await exists(destination)&&(await readdir(destination)).length)fail('BACKUP_DESTINATION_NOT_EMPTY');
        const record:Journal=previous?{...previous,phase:'stopping',stopOperationId}:{format:'role-backup-task-1',operationId:request.operationId,roleId:this.roleId,destination,phase:'stopping',checkpoint:'requested',stopOperationId,files:[],copiedFiles:0,verifiedFiles:0};
        if(this.homeClosed&&!this.releaseAccess)this.releaseAccess=await this.deps.acquire();
        seal?.();this.pinned=true;await this.save(record);await this.barrier('after-backup-request',record);return publicProgress(record);
    });}
    async verify(operationId:OperationId):Promise<BackupProgress>{return this.run(async()=>{
        const record=await this.load(OperationId(operationId));if(!record)fail('BACKUP_NOT_FOUND');if(record.checkpoint!=='verified')fail('BACKUP_NOT_COMPLETE');
        const release=this.releaseAccess?undefined:await this.deps.acquire();
        try{let next:Journal;try{await verifyBackup(record.destination,{expectedRoleId:this.roleId,operationId},this.deps.validate);const {error,...clean}=record;next={...clean,phase:'verified-restorable'};}catch(error){const errorCode=code(error);next={...record,phase:errorCode==='BACKUP_ACCESS_BUSY'?'uncertain':'failed',error:errorCode};}await this.save(next);return publicProgress(next);}finally{await release?.();}
    });}
    private async freezeMaintenance(record:Journal,restored:readonly BackupMaintenanceSnapshot[]=[]):Promise<Journal>{
        if(record.sourceRevision===undefined||!record.sourceHeadDigest)fail('BACKUP_STOP_UNCONFIRMED');
        const journals=await this.journals();
        let snapshot=record.frozenMaintenance;
        if(!snapshot){const {maintenanceDigest,maintenanceFiles,manifestDigest,error,...clean}=publicProgress(record),current:BackupProgress={...clean,phase:'stopped',checkpoint:'stopped',copiedFiles:0,verifiedFiles:0};snapshot={format:'role-backup-maintenance-1',roleId:this.roleId,sourceRevision:HomeRevision(record.sourceRevision),sourceHeadDigest:record.sourceHeadDigest!,currentOperationId:record.operationId,records:[...journals.filter(prior=>prior.operationId!==record.operationId).map(publicProgress),current].sort((a,b)=>a.operationId.localeCompare(b.operationId))};}
        const documents=new Map<string,BackupMaintenanceSnapshot>();for(const snapshot of restored)documents.set(hash(encode(snapshot)),snapshot);for(const prior of journals)if(prior.frozenMaintenance)documents.set(hash(encode(prior.frozenMaintenance)),prior.frozenMaintenance);const maintenanceDigest=hash(encode(snapshot));documents.set(maintenanceDigest,snapshot);
        const maintenanceFiles=[...documents].sort(([a],[b])=>a.localeCompare(b)).map(([digest,value])=>({path:digest+'.json',kind:'file' as const,bytes:encode(value).length,digest}));
        return {...record,frozenMaintenance:snapshot,maintenanceDigest,maintenanceFiles};
    }
    private async maintenanceDocuments(record:Journal){
        const documents=new Map<string,Buffer>();for(const snapshot of(await this.deps.validate(this.source,this.roleId)).maintenanceSnapshots??[])documents.set(hash(encode(snapshot)),encode(snapshot));for(const prior of await this.journals())if(prior.frozenMaintenance)documents.set(hash(encode(prior.frozenMaintenance)),encode(prior.frozenMaintenance));if(record.frozenMaintenance)documents.set(hash(encode(record.frozenMaintenance)),encode(record.frozenMaintenance));
        for(const file of record.maintenanceFiles??[])if(!documents.has(file.digest)||documents.get(file.digest)!.length!==file.bytes)fail('BACKUP_MAINTENANCE_MISSING');return documents;
    }
    async writerClosed(){this.homeClosed=true;if(!this.pinned&&this.releaseAccess){await this.releaseAccess();this.releaseAccess=undefined;}}
    async copy(request:BackupRequest):Promise<BackupProgress>{return this.run(async()=>{
        const destination=await this.destination(request);let record=await this.load(request.operationId);if(!record||record.destination!==destination)fail(record?'OPERATION_CONFLICT':'BACKUP_NOT_FOUND');
        if(record.phase==='verified-restorable')return publicProgress(record);
        if(!this.homeClosed||record.sourceRevision===undefined&&!this.deps.releaseAccess)fail('BACKUP_STOP_REQUIRED');
        if(!this.releaseAccess)this.releaseAccess=await this.deps.acquire();
        try{
            if(await exists(join(this.source,'writer.lock')))fail('BACKUP_WRITER_PRESENT');
            const source=await this.deps.validate(this.source,this.roleId);if(source.mode!=='healthy'||source.verifiedRoleId!==this.roleId||source.verifiedRevision===null)fail('BACKUP_INVALID_SOURCE');
            const stopId=record.stopOperationId;if(!source.stops.some(stop=>stop.operationId===stopId&&stop.checkpoint==='ready-to-close'&&stop.checkpointRevision<=source.verifiedRevision!))fail('BACKUP_STOP_UNCONFIRMED');
            const current=await inventory(this.source),head=hash(await bytes(join(this.source,'head.json')));
            if(record.sourceRevision===undefined){record=await this.freezeMaintenance({...record,phase:'stopped',checkpoint:'stopped',sourceRevision:source.verifiedRevision,sourceHeadDigest:head,files:current},source.maintenanceSnapshots);await this.save(record);await this.barrier('after-backup-stopped',record);}
            else if(source.verifiedRevision!==record.sourceRevision||head!==record.sourceHeadDigest||!encode(current).equals(encode(record.files)))fail('BACKUP_SOURCE_CHANGED');
            if(!record.frozenMaintenance){record=await this.freezeMaintenance(record,source.maintenanceSnapshots);await this.save(record);}
            const maintenanceDocuments=await this.maintenanceDocuments(record);
            await directory(destination);const marker=join(destination,'backup-operation.json'),identity={format:'role-backup-copy-1',roleId:this.roleId,operationId:request.operationId,source:this.source,destination};
            const markerExists=await exists(marker);if(markerExists&&!encode(await json(marker)).equals(encode(identity)))fail('BACKUP_DESTINATION_CONFLICT');
            const stat=await lstat(destination,{bigint:true}),destinationIdentity={dev:String(stat.dev),ino:String(stat.ino)};
            if(record.destinationIdentity){if(record.destinationIdentity.dev!==destinationIdentity.dev||record.destinationIdentity.ino!==destinationIdentity.ino)fail('BACKUP_DESTINATION_CHANGED');}
            else{if(!markerExists&&(await readdir(destination)).length)fail('BACKUP_DESTINATION_NOT_EMPTY');record={...record,destinationIdentity};await this.save(record);}
            await cleanupUnpublished(destination,record);
            if(!markerExists){if((await readdir(destination)).length)fail('BACKUP_DESTINATION_NOT_EMPTY');const checkpoint=record;await atomic(marker,identity,()=>this.barrier('after-backup-marker-sync',checkpoint));}
            await directory(join(destination,'home'));record={...record,phase:'copying',copiedFiles:0};await this.save(record);
            for(const file of record.files){
                const target=join(destination,'home',file.path);await this.barrier('before-backup-file',record);
                if(file.kind==='directory')await directory(target);
                else{await exactPath(dirname(target));const value=await bytes(join(this.source,file.path));if(value.length!==file.bytes||hash(value)!==file.digest)fail('BACKUP_SOURCE_CHANGED');const checkpoint=record;await atomicBytes(target,value,()=>this.barrier('after-backup-file-sync',checkpoint));}
                record={...record,copiedFiles:record.copiedFiles+1};await this.save(record);await this.barrier('after-backup-file',record);
            }
            await directory(join(destination,'maintenance'));for(const file of record.maintenanceFiles??[]){const checkpoint=record;await atomicBytes(join(destination,'maintenance',file.path),maintenanceDocuments.get(file.digest)!,()=>this.barrier('after-backup-file-sync',checkpoint));record={...record,copiedFiles:record.copiedFiles+1};await this.save(record);}
            const authorityFormat=source.verifiedFormat??{major:1,minor:0};
            const body=manifest(record,authorityFormat),manifestDigest=hash(encode(body));await atomic(join(destination,'manifest.json'),{...body,manifestDigest});record={...record,phase:'verifying',checkpoint:'manifest-published',manifestDigest};await this.save(record);await this.barrier('after-backup-manifest',record);
            await verifyBackup(destination,{expectedRoleId:this.roleId,operationId:request.operationId},this.deps.validate);
            if(!encode(await inventory(this.source)).equals(encode(record.files))||hash(await bytes(join(this.source,'head.json')))!==record.sourceHeadDigest)fail('BACKUP_SOURCE_CHANGED');
            record={...record,phase:'verified-restorable',checkpoint:'verified',verifiedFiles:record.files.length+(record.maintenanceFiles?.length??0)};const {error,...clean}=record;record=clean;await this.save(record);await this.barrier('after-backup-verified',record);return publicProgress(record);
        }catch(error){const failure=code(error);record={...record,phase:'failed',error:failure};try{await this.save(record);}catch{throw new HomeError('BACKUP_PROGRESS_UNCERTAIN');}return publicProgress(record);}
        finally{if(this.releaseAccess){await this.releaseAccess();this.releaseAccess=undefined;}this.pinned=false;}
    });}
}
/** Only an unchanged, journal-owned destination may discard its uncommitted copy temporaries. */
async function cleanupUnpublished(destination:string,record:Journal){
    const declared=new Set(['backup-operation.json','manifest.json','home','maintenance',...record.files.map(file=>'home/'+file.path),...(record.maintenanceFiles??[]).map(file=>'maintenance/'+file.path)]);
    const directories=new Set(['','home','maintenance',...record.files.filter(file=>file.kind==='directory').map(file=>'home/'+file.path)]);
    const walk=async(relative:string):Promise<void>=>{const path=join(destination,relative);await exactPath(path);for(const name of await readdir(path)){
        const entry=relative?relative+'/'+name:name,full=join(destination,entry),stat=await lstat(full);
        if(stat.isSymbolicLink())fail('UNSAFE_BACKUP_FILE');
        if(!declared.has(entry)&&/^\.backup-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pending$/.test(name)){if(!stat.isFile()||stat.nlink!==1)fail('UNSAFE_BACKUP_FILE');await unlink(full);await syncDir(path);}
        else if(stat.isDirectory()&&directories.has(entry))await walk(entry);
    }};await walk('');
}
async function atomicBytes(path:string,value:Buffer,afterSync?:()=>Promise<void>){await exactPath(dirname(path));if(await exists(path))await bytes(path);const temp=join(dirname(path),'.backup-'+randomUUID()+'.pending'),fd=await open(temp,'wx',0o600);try{await fd.writeFile(value);await fd.sync();}finally{await fd.close();}try{await afterSync?.();await rename(temp,path);await syncDir(dirname(path));}finally{await unlink(temp).catch(()=>{});}}
export async function verifyBackup(destination:string,options:{expectedRoleId?:RoleId;operationId?:OperationId},validate:Validate):Promise<BackupProgress>{
    await exactPath(destination);const value=await json(join(destination,'manifest.json'));if(!object(value))fail('INVALID_BACKUP_MANIFEST');const {manifestDigest,...body}=value;
    if(Object.keys(body).sort().join('|')!=='files|format|homeFormat|maintenanceDigest|maintenanceFiles|operationId|roleId|sourceHeadDigest|sourceRevision|stopOperationId'||!hex(manifestDigest)||hash(encode(body))!==manifestDigest||body.format!=='role-backup-1'||!validFiles(body.files)||!hex(body.maintenanceDigest)||!validMaintenanceFiles(body.maintenanceFiles)||!hex(body.sourceHeadDigest)||!object(body.homeFormat)||!Number.isSafeInteger(body.homeFormat.major)||!Number.isSafeInteger(body.homeFormat.minor))fail('INVALID_BACKUP_MANIFEST');
    const roleId=RoleId(body.roleId),operationId=OperationId(body.operationId),sourceRevision=HomeRevision(body.sourceRevision),stopOperationId=OperationId(body.stopOperationId);
    if(options.expectedRoleId!==undefined&&roleId!==options.expectedRoleId||options.operationId!==undefined&&operationId!==options.operationId)fail('BACKUP_IDENTITY_CONFLICT');
    const names=(await readdir(destination)).sort();if(names.join('|')!=='backup-operation.json|home|maintenance|manifest.json')fail('BACKUP_UNEXPECTED_CONTENT');
    const marker=await json(join(destination,'backup-operation.json'));if(!object(marker)||Object.keys(marker).sort().join('|')!=='destination|format|operationId|roleId|source'||marker.format!=='role-backup-copy-1'||typeof marker.source!=='string'||typeof marker.destination!=='string'||marker.roleId!==roleId||marker.operationId!==operationId)fail('BACKUP_DESTINATION_CONFLICT');
    for(const lock of ['writer.lock','.maintenance.lock'])if(await exists(join(destination,'home',lock)))fail('BACKUP_ACCESS_BUSY');
    const actual=await inventory(join(destination,'home'),false);if(!encode(actual).equals(encode(body.files)))fail('BACKUP_CONTENT_MISMATCH');
    const authority=await validate(join(destination,'home'),roleId);
    // The manifest names the source layout; a backup of a newer generation must say so.
    const authorityFormat=authority.verifiedFormat;
    if(authorityFormat&&(authorityFormat.major!==body.homeFormat.major||authorityFormat.minor!==body.homeFormat.minor))fail('INVALID_BACKUP_MANIFEST');
    if(authority.mode!=='healthy'||authority.verifiedRoleId!==roleId||authority.verifiedRevision!==sourceRevision||!authority.stops.some(stop=>stop.operationId===stopOperationId&&stop.checkpoint==='ready-to-close'&&stop.checkpointRevision<=sourceRevision)||hash(await bytes(join(destination,'home/head.json')))!==body.sourceHeadDigest)fail('BACKUP_AUTHORITY_INVALID');
    await verifyMaintenanceFiles(destination,{operationId,roleId,sourceRevision,sourceHeadDigest:body.sourceHeadDigest,stopOperationId,files:body.files,maintenanceDigest:body.maintenanceDigest,maintenanceFiles:body.maintenanceFiles},authority);
    return {operationId,roleId,destination,phase:'verified-restorable',checkpoint:'verified',stopOperationId,sourceRevision,sourceHeadDigest:body.sourceHeadDigest,files:body.files,copiedFiles:body.files.length+body.maintenanceFiles.length,verifiedFiles:body.files.length+body.maintenanceFiles.length,manifestDigest,maintenanceDigest:body.maintenanceDigest,maintenanceFiles:body.maintenanceFiles};
}

async function verifyMaintenanceFiles(destination:string,manifest:Pick<Manifest,'operationId'|'roleId'|'sourceRevision'|'sourceHeadDigest'|'stopOperationId'|'files'|'maintenanceDigest'|'maintenanceFiles'>,authority?:BackupAuthority):Promise<BackupMaintenanceSnapshot[]>{
    const path=join(destination,'maintenance');try{await exactPath(path);}catch(error){if(absent(error))fail('BACKUP_MAINTENANCE_MISSING');throw error;}
    if((await readdir(path)).sort().join('|')!==manifest.maintenanceFiles.map(file=>file.path).sort().join('|'))fail('BACKUP_MAINTENANCE_MISSING');
    const documents=new Map<string,BackupMaintenanceSnapshot>();for(const file of manifest.maintenanceFiles){let value:Buffer;try{value=await bytes(join(path,file.path));}catch(error){if(absent(error))fail('BACKUP_MAINTENANCE_MISSING');throw error;}if(value.length!==file.bytes||hash(value)!==file.digest)fail('BACKUP_MAINTENANCE_CORRUPT');const snapshot=maintenanceSnapshot(parseProjectionJSON(new TextDecoder('utf-8',{fatal:true}).decode(value)));if(snapshot.roleId!==manifest.roleId||snapshot.sourceRevision>manifest.sourceRevision)fail('INVALID_BACKUP_MAINTENANCE');documents.set(file.digest,snapshot);}
    const current=documents.get(manifest.maintenanceDigest);if(!current||current.currentOperationId!==manifest.operationId||current.sourceRevision!==manifest.sourceRevision||current.sourceHeadDigest!==manifest.sourceHeadDigest)fail('INVALID_BACKUP_MAINTENANCE');
    const record=current.records.find(record=>record.operationId===manifest.operationId);if(!record||record.stopOperationId!==manifest.stopOperationId||!encode(record.files).equals(encode(manifest.files)))fail('INVALID_BACKUP_MAINTENANCE');
    for(const snapshot of documents.values())for(const record of snapshot.records){if(record.maintenanceDigest&&!documents.has(record.maintenanceDigest))fail('BACKUP_MAINTENANCE_MISSING');for(const file of record.maintenanceFiles??[])if(!documents.has(file.digest))fail('BACKUP_MAINTENANCE_MISSING');if(authority&&record.sourceRevision!==undefined&&!authority.stops.some(stop=>stop.operationId===record.stopOperationId&&stop.checkpoint==='ready-to-close'&&stop.checkpointRevision<=record.sourceRevision!))fail('INVALID_BACKUP_MAINTENANCE');}
    return [...documents.values()];
}
export async function readMaintenance(destination:string,options:{expectedRoleId?:RoleId;operationId?:OperationId},validate:Validate):Promise<BackupMaintenanceRead>{
    const currentReceipt=await verifyBackup(destination,options,validate);if(!currentReceipt.maintenanceDigest||!currentReceipt.maintenanceFiles||currentReceipt.sourceRevision===undefined||!currentReceipt.sourceHeadDigest)fail('INVALID_BACKUP_MAINTENANCE');
    const retainedSnapshots=await verifyMaintenanceFiles(destination,{operationId:currentReceipt.operationId,roleId:currentReceipt.roleId,sourceRevision:currentReceipt.sourceRevision,sourceHeadDigest:currentReceipt.sourceHeadDigest,stopOperationId:currentReceipt.stopOperationId,files:currentReceipt.files,maintenanceDigest:currentReceipt.maintenanceDigest,maintenanceFiles:currentReceipt.maintenanceFiles});const snapshot=retainedSnapshots.find(value=>hash(encode(value))===currentReceipt.maintenanceDigest);if(!snapshot)fail('INVALID_BACKUP_MAINTENANCE');return {snapshot,retainedSnapshots,currentReceipt};
}

interface RestoreJournal extends RestoreProgress {readonly acceptanceOperationId?:OperationId;readonly format:'role-restore-task-1';readonly fingerprint:string;readonly destinationIdentity:{readonly dev:string;readonly ino:string};}
function restorePublic(record:RestoreJournal):RestoreProgress{const {format,fingerprint,destinationIdentity,acceptanceOperationId,...progress}=record;return structuredClone(progress);}
async function restoreJournal(destination:string):Promise<RestoreJournal|undefined>{
    try{await exactPath(join(destination,'.restore'));const wrapped=await json(join(destination,'.restore','operation.json'));if(!object(wrapped)||wrapped.format!=='role-restore-journal-1'||Object.keys(wrapped).sort().join('|')!=='digest|format|record'||!object(wrapped.record)||wrapped.record.format!=='role-restore-task-1'||!hex(wrapped.digest)||hash(encode(wrapped.record))!==wrapped.digest)fail('CORRUPT_RESTORE_JOURNAL');const r=wrapped.record;if(Object.keys(r).some(key=>!['format','operationId','roleId','backupPath','destination','phase','manifestDigest','sourceRevision','sourceStopOperationId','files','copiedFiles','verifiedFiles','error','fingerprint','destinationIdentity','acceptanceOperationId'].includes(key))||!hex(r.fingerprint)||!object(r.destinationIdentity)||Object.keys(r.destinationIdentity).sort().join('|')!=='dev|ino'||typeof r.destinationIdentity.dev!=='string'||!/^\d+$/.test(r.destinationIdentity.dev)||typeof r.destinationIdentity.ino!=='string'||!/^\d+$/.test(r.destinationIdentity.ino)||typeof r.backupPath!=='string'||r.destination!==destination||!['copying','verifying','awaiting-handover','accepted','uncertain','failed'].includes(String(r.phase))||!validFiles(r.files)||!Number.isSafeInteger(r.copiedFiles)||Number(r.copiedFiles)<0||!Number.isSafeInteger(r.verifiedFiles)||Number(r.verifiedFiles)<0||r.error!==undefined&&typeof r.error!=='string')fail('CORRUPT_RESTORE_JOURNAL');return {format:'role-restore-task-1',operationId:OperationId(r.operationId),roleId:RoleId(r.roleId),backupPath:r.backupPath,destination,phase:r.phase==='copying'?'copying':r.phase==='verifying'?'verifying':r.phase==='awaiting-handover'?'awaiting-handover':r.phase==='accepted'?'accepted':r.phase==='uncertain'?'uncertain':'failed',manifestDigest:BackupManifestDigest(r.manifestDigest),sourceRevision:HomeRevision(r.sourceRevision),sourceStopOperationId:OperationId(r.sourceStopOperationId),files:r.files,copiedFiles:Number(r.copiedFiles),verifiedFiles:Number(r.verifiedFiles),...(typeof r.error==='string'?{error:r.error}:{}),...(r.acceptanceOperationId!==undefined?{acceptanceOperationId:OperationId(r.acceptanceOperationId)}:{}),fingerprint:r.fingerprint,destinationIdentity:{dev:r.destinationIdentity.dev,ino:r.destinationIdentity.ino}};
    }catch(error){if(absent(error))return undefined;throw error;}
}
async function saveRestore(record:RestoreJournal){await directory(join(record.destination,'.restore'));await atomic(join(record.destination,'.restore','operation.json'),{format:'role-restore-journal-1',record,digest:hash(encode(record))});}
export async function readRestore(destination:string,request:RestoreRead):Promise<RestoreProgress>{
    OperationId(request.operationId);RoleId(request.expectedRoleId);await exactPath(destination,true);const record=await restoreJournal(destination);if(!record)return {operationId:request.operationId,roleId:request.expectedRoleId,backupPath:'',destination,phase:'not-found',files:[],copiedFiles:0,verifiedFiles:0};if(record.operationId!==request.operationId||record.roleId!==request.expectedRoleId)fail('RESTORE_IDENTITY_CONFLICT');return restorePublic(record);
}
export async function restoreBackup(request:RestoreRequest,deps:{readonly validate:Validate;readonly acquire:(destination:string)=>Promise<()=>Promise<void>>;readonly io:HomeIO}):Promise<RestoreProgress>{
    if(!validateRestoreRequest(request))fail('INVALID_RESTORE_REQUEST');const backupPath=await exactPath(request.backupPath),destination=await exactPath(request.destination,true);if(destination===backupPath||destination.startsWith(backupPath+sep)||backupPath.startsWith(destination+sep))fail('RESTORE_PATH_OVERLAP');
    const source=await verifyBackup(backupPath,{expectedRoleId:request.expectedRoleId},deps.validate);if(source.manifestDigest!==request.expectedManifestDigest)fail('RESTORE_MANIFEST_CONFLICT');const fingerprint=hash(encode({operationId:request.operationId,backupPath,destination,expectedRoleId:request.expectedRoleId,expectedManifestDigest:request.expectedManifestDigest}));let previous:RestoreJournal|undefined;
    if(await exists(destination)){if(await exists(join(destination,'writer.lock')))fail('HOME_BUSY');previous=await restoreJournal(destination);if(!previous&&(await readdir(destination)).length)fail('RESTORE_DESTINATION_NOT_EMPTY');}
    await directory(destination);const release=await deps.acquire(destination);let record:RestoreJournal|undefined;
    try{previous=await restoreJournal(destination);if(!previous&&(await readdir(destination)).some(name=>name!=='.maintenance.lock'))fail('RESTORE_DESTINATION_NOT_EMPTY');if(previous&&(previous.manifestDigest!==source.manifestDigest||previous.sourceRevision!==source.sourceRevision||previous.sourceStopOperationId!==source.stopOperationId||!encode(previous.files).equals(encode(source.files))))fail('CORRUPT_RESTORE_JOURNAL');if(previous&&(previous.operationId!==request.operationId||previous.roleId!==request.expectedRoleId||previous.fingerprint!==fingerprint))fail('OPERATION_CONFLICT');const stat=await lstat(destination,{bigint:true}),identity={dev:String(stat.dev),ino:String(stat.ino)};if(previous&&(previous.destinationIdentity.dev!==identity.dev||previous.destinationIdentity.ino!==identity.ino))fail('RESTORE_DESTINATION_CHANGED');
        record=previous??{format:'role-restore-task-1',operationId:request.operationId,roleId:request.expectedRoleId,backupPath,destination,phase:'copying',manifestDigest:request.expectedManifestDigest,sourceRevision:source.sourceRevision,sourceStopOperationId:source.stopOperationId,files:source.files,copiedFiles:0,verifiedFiles:0,fingerprint,destinationIdentity:identity};await saveRestore(record);await deps.io.barrier?.('after-restore-request',{operationId:record.operationId,revision:record.sourceRevision??HomeRevision(0)});
        let copiedFiles=0;
        for(const file of source.files){await deps.io.barrier?.('before-restore-file',{operationId:record.operationId,revision:record.sourceRevision??HomeRevision(0)});const target=join(destination,file.path);if(file.kind==='directory')await directory(target);else{await exactPath(dirname(join(backupPath,'home',file.path)));await exactPath(dirname(target));const value=await bytes(join(backupPath,'home',file.path));if(value.length!==file.bytes||hash(value)!==file.digest)fail('RESTORE_SOURCE_CHANGED');if(await exists(target)){const current=await bytes(target);if(!current.equals(value))fail('RESTORE_DESTINATION_CONFLICT');}else await atomicBytes(target,value);}record={...record,phase:'copying',copiedFiles:++copiedFiles};await saveRestore(record);await deps.io.barrier?.('after-restore-file',{operationId:record.operationId,revision:record.sourceRevision??HomeRevision(0)});}
        record={...record,phase:'verifying'};await saveRestore(record);if(!encode(await inventory(destination)).equals(encode(source.files)))fail('RESTORE_CONTENT_MISMATCH');const restored=await deps.validate(destination,request.expectedRoleId);if(restored.mode!=='healthy'||restored.verifiedRevision!==source.sourceRevision)fail('RESTORE_AUTHORITY_INVALID');const rechecked=await verifyBackup(backupPath,{expectedRoleId:request.expectedRoleId},deps.validate);if(rechecked.manifestDigest!==request.expectedManifestDigest)fail('RESTORE_SOURCE_CHANGED');const {error:previousError,...confirmed}=record;record={...confirmed,phase:'awaiting-handover',verifiedFiles:source.files.length};await saveRestore(record);return restorePublic(record);
    }catch(error){if(!record)throw error;record={...record,phase:'uncertain',error:code(error)};await saveRestore(record);return restorePublic(record);}finally{await release();}
}

/** Read the existing local task and physical root. Historical manifests never supply a new root grant. */
async function localRestoreRecord(root:string){
    await exactPath(root);const record=await restoreJournal(root);if(!record)fail('RESTORE_NOT_FOUND');
    const stat=await lstat(root,{bigint:true});if(String(stat.dev)!==record.destinationIdentity.dev||String(stat.ino)!==record.destinationIdentity.ino)fail('RESTORE_DESTINATION_CHANGED');return record;
}
export async function prepareRestoreAcceptance(root:string,request:RestoreConfirmation,roleId:RoleId,alreadyCommitted:boolean,validate:Validate){
    const record=await localRestoreRecord(root);
    if(record.operationId!==request.restoreOperationId||record.roleId!==roleId||record.manifestDigest!==request.expectedManifestDigest)fail('RESTORE_IDENTITY_CONFLICT');
    if(record.phase!=='awaiting-handover'&&record.phase!=='accepted')fail('RESTORE_NOT_VERIFIED');
    if(record.acceptanceOperationId&&record.acceptanceOperationId!==request.operationId)fail('OPERATION_CONFLICT');
    const source=await verifyBackup(record.backupPath,{expectedRoleId:roleId},validate);
    if(source.manifestDigest!==record.manifestDigest||source.sourceRevision!==record.sourceRevision||source.stopOperationId!==record.sourceStopOperationId)fail('RESTORE_SOURCE_CHANGED');
    const maintenance=await readMaintenance(record.backupPath,{expectedRoleId:roleId},validate);
    return {progress:restorePublic(record),backupOperationId:source.operationId,maintenanceSnapshots:maintenance.retainedSnapshots,async validateTarget(additionalBlobRefs:ReadonlySet<string>){
        if(alreadyCommitted)return;
        const original=new Set(source.files.map(file=>file.path));const current=(await inventory(root)).filter(file=>original.has(file.path)||!/^blobs\/[a-f0-9]{64}\.json$/.test(file.path)||!additionalBlobRefs.has(file.path.slice(6,-5)));
        if(!encode(current).equals(encode(source.files)))fail('RESTORE_CONTENT_MISMATCH');
    }};
}
export async function markRestoreAccepted(root:string,acceptance:RestoreAcceptance){
    const record=await localRestoreRecord(root);if(record.operationId!==acceptance.restoreOperationId||record.manifestDigest!==acceptance.manifestDigest||record.sourceRevision!==acceptance.sourceRevision||record.sourceStopOperationId!==acceptance.sourceStopOperationId||record.acceptanceOperationId&&record.acceptanceOperationId!==acceptance.operationId)fail('RESTORE_IDENTITY_CONFLICT');
    const {error,...confirmed}=record;await saveRestore({...confirmed,phase:'accepted',acceptanceOperationId:acceptance.operationId});
}
export async function locallyAcceptedRestore(root:string,acceptance:RestoreAcceptance):Promise<boolean>{
    let record:RestoreJournal;try{record=await localRestoreRecord(root);}catch(error){if(absent(error)||error instanceof HomeError&&error.code==='RESTORE_NOT_FOUND')return false;throw error;}
    return record.phase==='accepted'&&record.acceptanceOperationId===acceptance.operationId&&record.operationId===acceptance.restoreOperationId&&record.manifestDigest===acceptance.manifestDigest&&record.sourceRevision===acceptance.sourceRevision&&record.sourceStopOperationId===acceptance.sourceStopOperationId;
}

/** Machine-local, deny-only provenance; no returned path grants execution or filesystem access. */
export async function acceptedRestoreSource(root:string,acceptance:RestoreAcceptance|undefined):Promise<RestoreRequest|undefined>{
    if(!acceptance)return undefined;const record=await localRestoreRecord(root);
    if(record.phase!=='accepted'||record.acceptanceOperationId!==acceptance.operationId||record.operationId!==acceptance.restoreOperationId||record.manifestDigest!==acceptance.manifestDigest||record.sourceRevision!==acceptance.sourceRevision||record.sourceStopOperationId!==acceptance.sourceStopOperationId)fail('RESTORE_LOCAL_PROOF_UNAVAILABLE');
    return {operationId:record.operationId,backupPath:record.backupPath,destination:root,expectedRoleId:record.roleId,expectedManifestDigest:record.manifestDigest!};
}
