import {createHash} from 'node:crypto';
import {InputKey,OperationId,type BindingId,type BindingVersion} from './ids.ts';
import type {QQInputSource} from './qq.ts';
/** Stable namespace is Home-owned. An ephemeral socket generation is never an input identity. */
export function qqInputIdentity(binding:{readonly bindingId:BindingId;readonly version:BindingVersion},source:QQInputSource){
  const hash=createHash('sha256').update(JSON.stringify([binding.bindingId,binding.version,source.connectionId,source.accountId,source.peerId,source.direction,source.messageId])).digest('hex');
  return {externalKey:InputKey('qq-'+hash),operationId:OperationId('qq-input-'+hash)};
}
