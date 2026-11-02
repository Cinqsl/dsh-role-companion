import {HomeRevision,OperationId} from '../../home/ids.ts';
import type {BindingVersion,CleanupCommand,CleanupSelection,RoleId} from '../../types.ts';

export interface PendingCleanup {
  readonly roleId:RoleId;
  readonly bindingVersion:BindingVersion;
  readonly command:CleanupCommand;
}

const prefix='dsh-role-companion:pending-cleanup-operation:v1:';
const storageKey=(roleId:RoleId)=>prefix+roleId;
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);

function cleanupSource(value:unknown):CleanupSelection['sources'][number]|null {
  if(!record(value)||typeof value.id!=='string')return null;
  return value.kind==='input'||value.kind==='reply'||value.kind==='tool'
    ?{kind:value.kind,id:value.id} as CleanupSelection['sources'][number]
    :null;
}

function cleanupSelection(value:unknown):CleanupSelection|null {
  if(!record(value)||!Array.isArray(value.sources)||value.sources.length<1||value.sources.length>100)return null;
  if(value.derived!=='retain'&&value.derived!=='remove')return null;
  const sources=value.sources.map(cleanupSource);
  if(sources.some(item=>!item)||new Set(sources.map(item=>item!.kind+':'+item!.id)).size!==sources.length)return null;
  return {sources:sources as CleanupSelection['sources'],derived:value.derived};
}

export function loadPendingCleanup(roleId:RoleId):PendingCleanup|null {
  try {
    const raw:unknown=JSON.parse(localStorage.getItem(storageKey(roleId))||'null');
    if(!record(raw)||raw.roleId!==roleId||!record(raw.command))return null;
    const selected=cleanupSelection(raw.command.selection);
    if(!selected||raw.command.kind!=='cleanup-sources'||typeof raw.command.operationId!=='string'
      ||typeof raw.command.previewDigest!=='string'||!/^[a-f0-9]{64}$/.test(raw.command.previewDigest)
      ||typeof raw.command.expectedRevision!=='number'||!Number.isSafeInteger(raw.command.expectedRevision)
      ||typeof raw.bindingVersion!=='number'||!Number.isSafeInteger(raw.bindingVersion))return null;
    return {
      roleId,
      bindingVersion:raw.bindingVersion as BindingVersion,
      command:{
        kind:'cleanup-sources',
        operationId:OperationId(raw.command.operationId),
        selection:selected,
        expectedRevision:HomeRevision(raw.command.expectedRevision),
        previewDigest:raw.command.previewDigest,
      },
    };
  } catch {
    return null;
  }
}

export function savePendingCleanup(value:PendingCleanup):boolean {
  try {
    localStorage.setItem(storageKey(value.roleId),JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearPendingCleanup(roleId:RoleId):void {
  try {
    localStorage.removeItem(storageKey(roleId));
  } catch {}
}

export {storageKey as pendingCleanupStorageKey};
