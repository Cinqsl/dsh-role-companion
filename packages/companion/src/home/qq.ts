import {BindingId,BindingVersion,HomeRevision,type RoleId,type OperationId,type BindingId as BindingIdentity,type BindingVersion as BindingRevision} from './ids.ts';
declare const qqIdentity:unique symbol;
export type QQConnectionId=string&{readonly[qqIdentity]:'RoleCompanion.QQConnectionId'};
export type QQAccountId=string&{readonly[qqIdentity]:'RoleCompanion.QQAccountId'};
export type QQPeerId=string&{readonly[qqIdentity]:'RoleCompanion.QQPeerId'};
export type QQMessageId=string&{readonly[qqIdentity]:'RoleCompanion.QQMessageId'};
const invalid=(code:string):never=>{throw Object.assign(new Error(code),{code});};
export function QQConnectionId(value:unknown):QQConnectionId{if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(value))return invalid('INVALID_QQ_CONNECTION');return value as QQConnectionId;}
export function QQAccountId(value:unknown):QQAccountId{if(typeof value!=='string'||!/^[1-9][0-9]{0,19}$/.test(value))return invalid('INVALID_QQ_ACCOUNT');return value as QQAccountId;}
export function QQPeerId(value:unknown):QQPeerId{if(typeof value!=='string'||!/^[1-9][0-9]{0,19}$/.test(value))return invalid('INVALID_QQ_PEER');return value as QQPeerId;}
/** Signed provider IDs remain opaque equality tokens; no numeric ordering. */
export function QQMessageId(value:unknown):QQMessageId{if(typeof value!=='string'||!/^[-]?(?:0|[1-9][0-9]{0,19})$/.test(value)||value==='-0')return invalid('INVALID_QQ_MESSAGE_ID');return value as QQMessageId;}
export interface QQBinding{
  readonly bindingId:BindingIdentity;readonly version:BindingRevision;readonly connectionId:QQConnectionId;
  readonly accountId:QQAccountId;readonly peerId:QQPeerId;readonly activatedRevision:HomeRevision;
}
export interface BindQQCommand{
  readonly kind:'bind-qq';readonly operationId:OperationId;readonly connectionId:QQConnectionId;readonly accountId:QQAccountId;readonly peerId:QQPeerId;
  readonly expectedBindingVersion:BindingRevision|0;readonly expectedRevision:HomeRevision;
}
/** Private provider provenance retained in Home; never passed into ContextFrame. */
export interface QQInputSource{readonly connectionId:QQConnectionId;readonly accountId:QQAccountId;readonly peerId:QQPeerId;readonly direction:'incoming';readonly messageId:QQMessageId;}
export function admitQQInputSource(value:unknown):QQInputSource{
  if(!plainExact(value,['connectionId','accountId','peerId','direction','messageId'])||value.direction!=='incoming')return invalid('INVALID_QQ_SOURCE');
  return {connectionId:QQConnectionId(value.connectionId),accountId:QQAccountId(value.accountId),peerId:QQPeerId(value.peerId),direction:'incoming',messageId:QQMessageId(value.messageId)};
}
export function plainExact(value:unknown,keys:readonly string[]):value is Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).length!==keys.length)return false;
  return keys.every(key=>{const field=Object.getOwnPropertyDescriptor(value,key);return !!field&&'value'in field;});
}
export function validateBindQQ(value:unknown):value is BindQQCommand{
  if(!plainExact(value,['kind','operationId','connectionId','accountId','peerId','expectedBindingVersion','expectedRevision']))return false;
  try{QQConnectionId(value.connectionId);QQAccountId(value.accountId);QQPeerId(value.peerId);}catch{return false;}
  return value.kind==='bind-qq'&&value.accountId!==value.peerId&&typeof value.expectedBindingVersion==='number'&&Number.isSafeInteger(value.expectedBindingVersion)&&value.expectedBindingVersion>=0&&typeof value.expectedRevision==='number'&&Number.isSafeInteger(value.expectedRevision)&&value.expectedRevision>=1;
}
export function admitQQBinding(value:unknown,roleId:RoleId):QQBinding{
  if(!plainExact(value,['bindingId','version','connectionId','accountId','peerId','activatedRevision'])||value.bindingId!=='qq-'+roleId||value.accountId===value.peerId)return invalid('INVALID_QQ_BINDING');
  return {bindingId:BindingId(value.bindingId),version:BindingVersion(value.version),connectionId:QQConnectionId(value.connectionId),accountId:QQAccountId(value.accountId),peerId:QQPeerId(value.peerId),activatedRevision:HomeRevision(value.activatedRevision)};
}
