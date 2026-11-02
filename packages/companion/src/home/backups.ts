import type {HomeRevision,OperationId,RoleId} from './ids.ts';
/** Home owns both the maintenance journal and the portable content manifest. */
export interface BackupRequest {readonly operationId:OperationId;readonly destination:string;}
export interface BackupFile {readonly path:string;readonly kind:'file'|'directory';readonly bytes:number;readonly digest:string;}
export type BackupPhase='not-found'|'stopping'|'stopped'|'copying'|'verifying'|'uncertain'|'failed'|'verified-restorable';
export interface BackupProgress {
    readonly operationId:OperationId;readonly roleId:RoleId;readonly destination:string;
    readonly phase:BackupPhase;readonly checkpoint:'requested'|'stopped'|'manifest-published'|'verified';
    readonly stopOperationId:OperationId;readonly sourceRevision?:HomeRevision;readonly sourceHeadDigest?:string;
    readonly files:readonly BackupFile[];readonly copiedFiles:number;readonly verifiedFiles:number;
    readonly manifestDigest?:string;readonly error?:string;
    readonly maintenanceDigest?:string;readonly maintenanceFiles?:readonly BackupFile[];
}
/** Trusted Home/Runtime continuation; never handed to a view or an execution scope. */
export interface HomeBackupMaintenance {
    list():Promise<readonly BackupProgress[]>;
    pending():Promise<readonly BackupProgress[]>;
    read(operationId:OperationId):Promise<BackupProgress>;
    preflight(request:BackupRequest):Promise<void>;
    reserve(request:BackupRequest,stopOperationId:OperationId,seal?:()=>void):Promise<BackupProgress>;
    copy(request:BackupRequest):Promise<BackupProgress>;
    verify(operationId:OperationId):Promise<BackupProgress>;
    writerClosed():Promise<void>;
}

/** Immutable facts only: historical destinations confer no path or execution grant. */
export interface BackupMaintenanceSnapshot {
    readonly format:'role-backup-maintenance-1';readonly roleId:RoleId;
    readonly sourceRevision:HomeRevision;readonly sourceHeadDigest:string;readonly currentOperationId:OperationId;
    readonly records:readonly BackupProgress[];
}
export interface BackupMaintenanceRead {
    readonly snapshot:BackupMaintenanceSnapshot;
    readonly retainedSnapshots:readonly BackupMaintenanceSnapshot[];
    readonly currentReceipt:BackupProgress;
}
