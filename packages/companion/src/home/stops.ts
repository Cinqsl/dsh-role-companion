import type {HomeRevision,OperationId} from './ids.ts';
/** Stop facts describe verified checkpoints, never an invented post-close commit. */
export type StopReason='owner-stop'|'unload'|'migration';
export interface StopRequest {readonly operationId:OperationId;}
export interface StopRecord {
    readonly operationId:OperationId;readonly reason:StopReason;
    readonly requestedRevision:HomeRevision;readonly checkpoint:'requested'|'ready-to-close';readonly checkpointRevision:HomeRevision;
    readonly reconciledRevision?:HomeRevision;
}
export type StopStep='actions'|'records'|'model-and-flush'|'home'|'observers'|'complete';
export interface StopProgress extends StopRecord {readonly phase:'unverified'|'stopping'|'blocked'|'stopped';readonly step?:StopStep;readonly error?:string;}

export const isStopReason=(value:unknown):value is StopReason=>value==='owner-stop'||value==='unload'||value==='migration';
