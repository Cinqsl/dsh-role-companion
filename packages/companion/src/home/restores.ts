import {OperationId,RoleId,BackupManifestDigest,type HomeRevision} from './ids.ts';
import type {BackupFile} from './backups.ts';
/** Filesystem paths are owner inputs, never model capabilities. */
export interface RestoreRequest {readonly operationId:OperationId;readonly backupPath:string;readonly destination:string;readonly expectedRoleId:RoleId;readonly expectedManifestDigest:BackupManifestDigest;}
export interface RestoreRead {readonly operationId:OperationId;readonly expectedRoleId:RoleId;}
export type RestorePhase='not-found'|'copying'|'verifying'|'awaiting-handover'|'accepted'|'uncertain'|'failed';
export interface RestoreProgress {
    readonly operationId:OperationId;readonly roleId:RoleId;readonly backupPath:string;readonly destination:string;
    readonly phase:RestorePhase;readonly manifestDigest?:BackupManifestDigest;readonly sourceRevision?:HomeRevision;readonly sourceStopOperationId?:OperationId;
    readonly files:readonly BackupFile[];readonly copiedFiles:number;readonly verifiedFiles:number;readonly error?:string;
}
export function validateRestoreRequest(value:unknown):value is RestoreRequest {
    if(!value||typeof value!=='object'||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!['operationId','backupPath','destination','expectedRoleId','expectedManifestDigest'].includes(key))||Reflect.ownKeys(value).length!==5)return false;
    if(!('operationId'in value&&'backupPath'in value&&'destination'in value&&'expectedRoleId'in value&&'expectedManifestDigest'in value))return false;
    try{OperationId(value.operationId);RoleId(value.expectedRoleId);BackupManifestDigest(value.expectedManifestDigest);}catch{return false;}
    return typeof value.backupPath==='string'&&typeof value.destination==='string';
}

export function sameRestoreRequest(left:RestoreRequest,right:RestoreRequest){return left.operationId===right.operationId&&left.backupPath===right.backupPath&&left.destination===right.destination&&left.expectedRoleId===right.expectedRoleId&&left.expectedManifestDigest===right.expectedManifestDigest;}
