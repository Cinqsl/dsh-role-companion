import {createHash} from 'node:crypto';
import {HomeError} from './errors.ts';
import {HomeRevision,OperationId,RoleId} from './ids.ts';
import type {HomeFormat} from './format.ts';
import type {StorageGenerationPointer} from './storage-generation.ts';

/**
 * A format upgrade is a Home-owned maintenance task, not a business commit. Its journal lives in
 * `.format-upgrade/<digest>.json` and is the only place that says which phase the task reached.
 */
export const FORMAT_UPGRADE_TASK_FORMAT='role-format-upgrade-task-1';
/** Home-owned maintenance directory; classified in `layout.ts`, never copied as live content. */
export const FORMAT_UPGRADE_JOURNAL_DIRECTORY='.format-upgrade';
export type FormatUpgradePhase='not-found'|'requested'|'writing'|'validating'|'uncertain'|'switched'|'failed';
export type FormatUpgradeCheckpoint='requested'|'generation-written'|'validated'|'switched';
export interface FormatUpgradeRequest {
    readonly operationId:OperationId;
    readonly expectedRevision:HomeRevision;
}
export interface FormatUpgradeProgress {
    readonly operationId:OperationId;
    readonly roleId:RoleId;
    readonly phase:FormatUpgradePhase;
    readonly checkpoint:FormatUpgradeCheckpoint;
    readonly from:HomeFormat;
    readonly to:HomeFormat;
    readonly backupOperationId:OperationId;
    readonly expectedRevision:HomeRevision;
    readonly sourceRevision?:HomeRevision;
    readonly sourceHeadDigest?:string;
    readonly generation?:StorageGenerationPointer;
    readonly copiedFiles:number;
    readonly verifiedFiles:number;
    readonly identityDigest?:string;
    readonly recordDigest?:string;
    readonly manifestDigest?:string;
    readonly error?:string;
    /** Written by a later process that found a non-terminal journal; the phase is the durable one. */
    readonly interrupted?:true;
    readonly recovery?:readonly string[];
}
/** A read-only projection of the same authority; it never contains a path or a write grant. */
export interface FormatUpgradePreview {
    readonly roleId:RoleId;
    readonly revision:HomeRevision;
    readonly from:HomeFormat;
    readonly to:HomeFormat;
    readonly backupOperationId:OperationId;
    readonly backup:{readonly satisfied:boolean;readonly operationId?:OperationId;readonly sourceRevision?:HomeRevision};
    readonly retains:readonly {readonly part:'identity.json'|'head.json'|'commits'|'blobs'|'views'|'projection-progress'|'works'|'journal'|'.autonomy-schedule.json';readonly bytes:number}[];
    readonly externalCopies:readonly ['QQ messages','DSH private storage','external files','independent backups'];
}
const fail=(code:string):never=>{throw new HomeError(code);};
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const hex=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const pair=(value:unknown):HomeFormat=>{
    if(!object(value)||Object.keys(value).sort().join('|')!=='major|minor')return fail('CORRUPT_FORMAT_UPGRADE');
    const {major,minor}=value;
    if(typeof major!=='number'||typeof minor!=='number'||!Number.isSafeInteger(major)||!Number.isSafeInteger(minor)||major<0||minor<0)return fail('CORRUPT_FORMAT_UPGRADE');
    return {major,minor};
};
export const formatPair=(value:HomeFormat)=>Object.freeze({major:value.major,minor:value.minor});
/**
 * The upgrade consumes an existing verified backup instead of creating one: a backup stops the
 * running lifetime and therefore cannot be produced by the lifetime that asks to upgrade.
 */
export const FORMAT_UPGRADE_JOURNAL_FORMAT='role-format-upgrade-journal-1';
export const formatUpgradeJournalName=(operationId:OperationId)=>'upgrade-'+createHash('sha256').update(operationId).digest('hex')+'.json';
export function admitFormatUpgradeRequest(value:unknown):FormatUpgradeRequest{
    if(!object(value)||Object.keys(value).sort().join('|')!=='expectedRevision|operationId')fail('INVALID_FORMAT_UPGRADE_REQUEST');
    const raw=value as {operationId:unknown;expectedRevision:unknown};
    return {operationId:OperationId(raw.operationId),expectedRevision:HomeRevision(raw.expectedRevision)};
}
const PHASES:ReadonlySet<string>=new Set(['requested','writing','validating','uncertain','switched','failed']);
const CHECKPOINTS:ReadonlySet<string>=new Set(['requested','generation-written','validated','switched']);
const PROGRESS_KEYS='backupOperationId|copiedFiles|expectedRevision|from|operationId|phase|roleId|to|verifiedFiles';
const OPTIONAL_KEYS=new Set(['checkpoint','format','generation','sourceRevision','sourceHeadDigest','identityDigest','recordDigest','manifestDigest','error','interrupted','recovery']);
/** A journal is read whole: unknown keys, a foreign role or a missing required field all fail closed. */
export function admitFormatUpgradeProgress(value:unknown,roleId:RoleId):FormatUpgradeProgress{
    if(!object(value))return fail('CORRUPT_FORMAT_UPGRADE');
    const required=new Set(PROGRESS_KEYS.split('|'));
    for(const key of required)if(!Object.hasOwn(value,key))fail('CORRUPT_FORMAT_UPGRADE');
    for(const key of Object.keys(value))if(!required.has(key)&&!OPTIONAL_KEYS.has(key))fail('CORRUPT_FORMAT_UPGRADE');
    if(value.format!==undefined&&value.format!==FORMAT_UPGRADE_TASK_FORMAT)fail('CORRUPT_FORMAT_UPGRADE');
    if(value.roleId!==roleId||!PHASES.has(String(value.phase))||!CHECKPOINTS.has(String(value.checkpoint)))fail('CORRUPT_FORMAT_UPGRADE');
    const progress=value as unknown as FormatUpgradeProgress;
    OperationId(progress.operationId);OperationId(progress.backupOperationId);HomeRevision(progress.expectedRevision);
    pair(progress.from);pair(progress.to);
    if(!Number.isSafeInteger(progress.copiedFiles)||progress.copiedFiles<0||!Number.isSafeInteger(progress.verifiedFiles)||progress.verifiedFiles<0)fail('CORRUPT_FORMAT_UPGRADE');
    if(progress.sourceRevision!==undefined)HomeRevision(progress.sourceRevision);
    for(const key of ['sourceHeadDigest','identityDigest','recordDigest','manifestDigest'] as const)if(progress[key]!==undefined&&!hex(progress[key]))fail('CORRUPT_FORMAT_UPGRADE');
    if(progress.error!==undefined&&typeof progress.error!=='string')fail('CORRUPT_FORMAT_UPGRADE');
    if(progress.generation!==undefined&&(!object(progress.generation)||typeof progress.generation.id!=='string'||!hex(progress.generation.baseCommitDigest)||!hex(progress.generation.checkpointDigest)))fail('CORRUPT_FORMAT_UPGRADE');
    if(progress.recovery!==undefined&&(!Array.isArray(progress.recovery)||progress.recovery.some(entry=>typeof entry!=='string')))fail('CORRUPT_FORMAT_UPGRADE');
    return progress;
}
/** Only a durable `switched` journal may claim migration; every other phase stays honest. */
export const isFormatUpgradeTerminal=(phase:FormatUpgradePhase)=>phase==='switched'||phase==='failed';
export const isFormatUpgradeRunning=(phase:FormatUpgradePhase)=>phase==='requested'||phase==='writing'||phase==='validating'||phase==='uncertain';
/** The panel projection. Known phases are explicit; an unknown pair is `unsupported`, never `compatible`. */
export interface FormatUpgradeView {
    readonly status:'compatible'|'needs-upgrade'|'processing'|'failed'|'migrated'|'unsupported';
    readonly format:HomeFormat;
    readonly target?:HomeFormat;
    readonly layout:'root-inline'|'storage-generation';
    readonly operationId?:OperationId;
    readonly phase?:FormatUpgradePhase;
    readonly checkpoint?:FormatUpgradeCheckpoint;
    readonly error?:string;
    readonly recovery?:readonly string[];
    readonly upgradesAvailable:boolean;
}

/** The live script never reads a journal path; Home supplies the exact directory it owns. */
export interface FormatUpgradeJournalIO {
    read(name:string):Promise<unknown|undefined>;
    write(name:string,record:unknown):Promise<void>;
}
/** Journal order is the task order: a later phase may only replace an earlier one. */
export const formatUpgradePhaseRank=(phase:FormatUpgradePhase):number=>
    phase==='requested'?0:phase==='writing'?1:phase==='validating'?2:phase==='uncertain'?3:phase==='switched'?4:phase==='failed'?5:0;
export function formatUpgradeJournalRecord(progress:FormatUpgradeProgress){
    return Object.freeze({format:FORMAT_UPGRADE_TASK_FORMAT,...formatPairBody(progress)});
}
/** Canonical bytes reject `undefined`; an absent fact is simply not a journalled fact. */
function formatPairBody(progress:FormatUpgradeProgress){
    const {from,to,...rest}=progress,body:Record<string,unknown>={};
    for(const [key,value]of Object.entries(rest))if(value!==undefined)body[key]=value;
    return {...body,from:formatPair(from),to:formatPair(to)};
}
/** A terminal journal is never rewritten; running journals are replaced atomically by Home. */
export async function saveFormatUpgradeTask(io:FormatUpgradeJournalIO,roleId:RoleId,progress:FormatUpgradeProgress):Promise<FormatUpgradeProgress>{
    const admitted=admitFormatUpgradeProgress(progress,roleId),name=formatUpgradeJournalName(admitted.operationId);
    await io.write(name,formatUpgradeJournalRecord(admitted));
    return admitted;
}
export async function loadFormatUpgradeTask(io:FormatUpgradeJournalIO,roleId:RoleId,operationId:OperationId):Promise<FormatUpgradeProgress|undefined>{
    const value=await io.read(formatUpgradeJournalName(operationId));if(value===undefined)return undefined;
    const progress=admitFormatUpgradeProgress(value,roleId);
    if(progress.operationId!==operationId)fail('CORRUPT_FORMAT_UPGRADE');
    return progress;
}
/** Called by a process that did not perform the task: a non-terminal journal is an interrupted one. */
export function interruptedFormatUpgrade(progress:FormatUpgradeProgress):FormatUpgradeProgress{
    if(isFormatUpgradeTerminal(progress.phase))return progress;
    return {...progress,phase:'uncertain',interrupted:true,recovery:['resume-format-upgrade','inspect-old-generation']};
}
