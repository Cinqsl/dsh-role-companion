import {HandoverId,OperationId,HomeRevision,type RoleId} from './ids.ts';
import type {BackupProgress} from './backups.ts';
import {HomeError} from './errors.ts';
/** A source release is independent of ordinary owner stop. It never proves current single activity. */
export interface HandoverRequest {readonly operationId:OperationId;readonly destination:string;readonly expectedRevision:HomeRevision;}
export interface HandoverReservation {readonly operationId:OperationId;readonly handoverId:HandoverId;readonly backupOperationId:OperationId;readonly stopOperationId:OperationId;readonly destinationDigest:string;readonly expectedRevision:HomeRevision;}
export interface HandoverRecord {readonly operationId:OperationId;readonly handoverId:HandoverId;readonly backupOperationId:OperationId;readonly stopOperationId:OperationId;readonly destinationDigest:string;readonly requestedRevision:HomeRevision;readonly readyRevision?:HomeRevision;readonly recovery?:{readonly revision:HomeRevision;readonly priorNativeFlush:'unknown'|'source-checkpoint'};}
export interface HandoverProgress {readonly operationId:OperationId;readonly roleId:RoleId;readonly phase:'not-found'|'closing'|'copying'|'verified'|'uncertain'|'failed';readonly record?:HandoverRecord;readonly backup?:BackupProgress;readonly error?:string;readonly history?:true;}
export function handoverReservation(value:unknown):HandoverReservation{
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join('|')!=='backupOperationId|destinationDigest|expectedRevision|handoverId|operationId|stopOperationId'||!('destinationDigest' in value)||typeof value.destinationDigest!=='string'||!/^[a-f0-9]{64}$/.test(value.destinationDigest))throw new HomeError('INVALID_HANDOVER');
    if(!('operationId' in value)||!('handoverId' in value)||!('backupOperationId' in value)||!('stopOperationId' in value)||!('expectedRevision' in value))throw new HomeError('INVALID_HANDOVER');
    return {operationId:OperationId(value.operationId),handoverId:HandoverId(value.handoverId),backupOperationId:OperationId(value.backupOperationId),stopOperationId:OperationId(value.stopOperationId),destinationDigest:value.destinationDigest,expectedRevision:HomeRevision(value.expectedRevision)};
}
export function validateHandoverRequest(value:unknown):value is HandoverRequest{
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join('|')!=='destination|expectedRevision|operationId'||!('destination' in value)||typeof value.destination!=='string'||!value.destination.startsWith('/')||value.destination.includes('\0'))return false;
    try{if(!('operationId' in value)||!('expectedRevision' in value))return false;OperationId(value.operationId);HomeRevision(value.expectedRevision);return true;}catch{return false;}
}

/** Incoming history never seals the currently accepted instance or proves its next release. */
export const currentOutgoingHandover=(record:HandoverRecord,acceptedRevision:HomeRevision|undefined)=>record.requestedRevision>(acceptedRevision??0);
