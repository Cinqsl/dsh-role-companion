import {withFileProfileEdit} from './file-protection-cache.ts';
import {randomUUID} from 'node:crypto';
import type {Context} from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-config-editor';
import {HomeError,OperationId,QQConnectionId,plainExact} from '../home/index.ts';
import {QQProfileVersion} from '../host-contracts.ts';
import {qqTransportFields,qqHistoryFields,qqHistoryDefaults,validateQQTransport,type QQProfileRecord} from './qq-profile.ts';
import type {QQConnectionEditRequest} from '../types.ts';
/** Validate before requesting an ordered Host remount. No configuration is persisted here. */
export function prepareQQProfile(current:QQProfileRecord,request:QQConnectionEditRequest,value:unknown,restoredConnectionId?:QQConnectionId){
  OperationId(request.operationId);QQProfileVersion(request.expectedProfileVersion);
  const legacy=['enabled','endpoint','credentialRef','maxFrameBytes','readTimeoutMs','reconnectInitialMs','reconnectMaxMs','jitterRatio'];
  const priorShape=plainExact(value,legacy);if(!priorShape&&!plainExact(value,[...legacy,...Object.keys(qqHistoryDefaults)]))throw new HomeError('INVALID_QQ_TRANSPORT');
  if(restoredConnectionId&&current.connectionId&&current.connectionId!==restoredConnectionId)throw new HomeError('QQ_RESTORE_CONNECTION_MISMATCH');
  const connectionId=current.connectionId||restoredConnectionId||QQConnectionId('connection-'+randomUUID());
  const next={...(priorShape?qqHistoryFields(current):{}),...value,connectionId};if(!validateQQTransport(next))throw new HomeError('INVALID_QQ_TRANSPORT');
  if(current.lastOperationId===request.operationId){if(JSON.stringify(qqTransportFields(current))!==JSON.stringify(qqTransportFields(next)))throw new HomeError('OPERATION_CONFLICT');}
  else if(current.version!==request.expectedProfileVersion)throw new HomeError('QQ_PROFILE_VERSION_CONFLICT');
  return qqTransportFields(next);
}
/** Only the existing profile editor persists transport parameters and references. */
export async function editQQProfile(ctx:Context,get:()=>QQProfileRecord,request:QQConnectionEditRequest,value:unknown,restoredConnectionId?:QQConnectionId):Promise<QQProfileRecord>{
  const next=prepareQQProfile(get(),request,value,restoredConnectionId);
  const editor=ctx.get('configEditor');if(!editor)throw new HomeError('PROFILE_EDITOR_UNAVAILABLE');
  const entries=editor.entries().filter(entry=>entry.options.name==='dsh-role-companion');if(entries.length!==1)throw new HomeError('PROFILE_ENTRY_AMBIGUOUS');
  await withFileProfileEdit(ctx,()=>editor.edit(entries[0]!,current=>{
    const old=get();
    if(old.lastOperationId===request.operationId){if(JSON.stringify(qqTransportFields(old))!==JSON.stringify(qqTransportFields(next)))throw new HomeError('OPERATION_CONFLICT');return current;}
    if(old.version!==request.expectedProfileVersion)throw new HomeError('QQ_PROFILE_VERSION_CONFLICT');
    const qq:QQProfileRecord={...next,version:QQProfileVersion(old.version+1),lastOperationId:request.operationId};return {...current,qq};
  }));
  const applied=get();if(applied.lastOperationId!==request.operationId||JSON.stringify(qqTransportFields(applied))!==JSON.stringify(qqTransportFields(next)))throw new HomeError('PROFILE_APPLY_UNCONFIRMED');return applied;
}
