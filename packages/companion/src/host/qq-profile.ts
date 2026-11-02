import {plainExact,QQConnectionId} from '../home/qq.ts';
import {QQProfileVersion} from '../host-contracts.ts';
export interface QQTransportParameters{
  readonly enabled:boolean;readonly connectionId:QQConnectionId|'';readonly endpoint:string;readonly credentialRef:string;
  readonly maxFrameBytes:number;readonly readTimeoutMs:number;readonly reconnectInitialMs:number;readonly reconnectMaxMs:number;readonly jitterRatio:number;
  /** Omitted only by a legacy caller; the profile owner materializes all three defaults. */
  readonly historyPageSize?:number;readonly historyMaxPages?:number;readonly historyCooldownMs?:number;
}
export interface QQHistoryParameters{readonly historyPageSize:number;readonly historyMaxPages:number;readonly historyCooldownMs:number;}
export const qqHistoryDefaults:QQHistoryParameters=Object.freeze({historyPageSize:50,historyMaxPages:3,historyCooldownMs:60000});
export const qqTransportDefaults:QQTransportParameters&QQHistoryParameters=Object.freeze({enabled:false,connectionId:'',endpoint:'',credentialRef:'',maxFrameBytes:1048576,readTimeoutMs:10000,reconnectInitialMs:1000,reconnectMaxMs:60000,jitterRatio:0.2,...qqHistoryDefaults});
export interface QQProfileRecord extends QQTransportParameters{readonly historyPageSize:number;readonly historyMaxPages:number;readonly historyCooldownMs:number;readonly version:QQProfileVersion;readonly lastOperationId:string;}
export const qqProfileDefaults:QQProfileRecord=Object.freeze({...qqTransportDefaults,version:QQProfileVersion(0),lastOperationId:''});
export function qqHistoryFields(value:QQTransportParameters):QQHistoryParameters{return {historyPageSize:value.historyPageSize??qqHistoryDefaults.historyPageSize,historyMaxPages:value.historyMaxPages??qqHistoryDefaults.historyMaxPages,historyCooldownMs:value.historyCooldownMs??qqHistoryDefaults.historyCooldownMs};}
export function qqTransportFields(value:QQTransportParameters):QQTransportParameters&QQHistoryParameters{return {enabled:value.enabled,connectionId:value.connectionId,endpoint:value.endpoint,credentialRef:value.credentialRef,maxFrameBytes:value.maxFrameBytes,readTimeoutMs:value.readTimeoutMs,reconnectInitialMs:value.reconnectInitialMs,reconnectMaxMs:value.reconnectMaxMs,jitterRatio:value.jitterRatio,...qqHistoryFields(value)};}
export function validateQQProfile(value:unknown):value is QQProfileRecord{
  if(!plainExact(value,Object.keys(qqProfileDefaults)))return false;
  try{QQProfileVersion(value.version);}catch{return false;}
  return typeof value.lastOperationId==='string'&&(value.version===0?value.lastOperationId==='':/^[a-zA-Z0-9_-]{1,128}$/.test(value.lastOperationId))&&validateQQTransport(qqTransportFields(value as unknown as QQProfileRecord));
}
export function validQQEndpoint(value:unknown):value is string{
  if(typeof value!=='string'||value.length>2048)return false;
  try{const url=new URL(value);return ['ws:','wss:'].includes(url.protocol)&&!url.username&&!url.password&&!url.search&&!url.hash;}catch{return false;}
}
export function validateQQTransport(value:unknown):value is QQTransportParameters{
  const legacy=['enabled','connectionId','endpoint','credentialRef','maxFrameBytes','readTimeoutMs','reconnectInitialMs','reconnectMaxMs','jitterRatio'];
  if(!plainExact(value,legacy)&&!plainExact(value,[...legacy,...Object.keys(qqHistoryDefaults)]))return false;
  if(Object.hasOwn(value,'historyPageSize')){
    if(!['historyPageSize','historyMaxPages','historyCooldownMs'].every(key=>typeof value[key]==='number'&&Number.isSafeInteger(value[key])&&Number(value[key])>=1))return false;
    if(Number(value.historyPageSize)>200||Number(value.historyMaxPages)>16||Number(value.historyCooldownMs)>2147483647)return false;
  }
  if(typeof value.enabled!=='boolean'||typeof value.connectionId!=='string'||typeof value.endpoint!=='string'||typeof value.credentialRef!=='string')return false;
  try{if(value.connectionId)QQConnectionId(value.connectionId);}catch{return false;}
  if(value.endpoint&&!validQQEndpoint(value.endpoint)||value.credentialRef&&!/^[a-zA-Z_][a-zA-Z0-9_]{0,127}$/.test(value.credentialRef))return false;
  if(value.enabled&&(!value.connectionId||!value.endpoint||!value.credentialRef))return false;
  if(!['maxFrameBytes','readTimeoutMs','reconnectInitialMs','reconnectMaxMs'].every(key=>typeof value[key]==='number'&&Number.isSafeInteger(value[key])&&Number(value[key])>=1&&Number(value[key])<=2147483647))return false;
  return Number(value.maxFrameBytes)<=16777216&&Number(value.reconnectMaxMs)>=Number(value.reconnectInitialMs)&&typeof value.jitterRatio==='number'&&Number.isFinite(value.jitterRatio)&&value.jitterRatio>=0&&value.jitterRatio<=1;
}
