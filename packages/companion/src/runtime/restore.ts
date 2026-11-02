import {validateRestoreRequest,sameRestoreRequest,type RestoreRequest,type RestoreRead,type RestoreProgress} from '../home/restores.ts';
import {OperationId,RoleId} from '../home/ids.ts';
import {ExecutionError,safeExecutionCode} from './execution.ts';
/** Owner-only filesystem continuation; no model/tool capability is exposed. */
export interface RestorePort {request(request:RestoreRequest):Promise<RestoreProgress>;read(destination:string,request:RestoreRead):Promise<RestoreProgress>;}
/** Live calls only; durable progress and request identity remain Home-owned. */
export function createRestoreRuntime(port:RestorePort|undefined,canRequest:()=>boolean){
    const calls=new Map<OperationId,{request:RestoreRequest;task:Promise<RestoreProgress>;progress:RestoreProgress}>(),pending=new Set<Promise<RestoreProgress>>();
    async function read(destination:string,request:RestoreRead):Promise<RestoreProgress>{
        OperationId(request.operationId);RoleId(request.expectedRoleId);if(!port)throw new ExecutionError('RESTORE_UNAVAILABLE');
        const live=calls.get(request.operationId);if(live&&(live.request.destination!==destination||live.request.expectedRoleId!==request.expectedRoleId))throw new ExecutionError('RESTORE_IDENTITY_CONFLICT');
        const saved=await port.read(destination,request);if((saved.phase==='copying'||saved.phase==='verifying')&&(!live||!pending.has(live.task)))return {...saved,phase:'uncertain',error:'RESTORE_RECONCILIATION_REQUIRED'};return saved.phase==='not-found'&&live?structuredClone(live.progress):saved;
    }
    async function request(raw:RestoreRequest):Promise<RestoreProgress>{
        if(!validateRestoreRequest(raw))throw new ExecutionError('INVALID_RESTORE_REQUEST');if(!port)throw new ExecutionError('RESTORE_UNAVAILABLE');
        const owned=Object.freeze({...raw}),previous=calls.get(owned.operationId);
        if(previous){if(!sameRestoreRequest(previous.request,owned))throw new ExecutionError('OPERATION_CONFLICT');if(pending.has(previous.task)||(previous.progress.phase==='awaiting-handover'||previous.progress.phase==='accepted'))return previous.task;}
        if(!canRequest())throw new ExecutionError('RESTORE_ADMISSION_CLOSED');
        const call:{request:RestoreRequest;progress:RestoreProgress;task:Promise<RestoreProgress>}={request:owned,progress:{operationId:owned.operationId,roleId:owned.expectedRoleId,backupPath:owned.backupPath,destination:owned.destination,manifestDigest:owned.expectedManifestDigest,phase:'copying' as const,files:[],copiedFiles:0,verifiedFiles:0},task:Promise.resolve({operationId:owned.operationId,roleId:owned.expectedRoleId,backupPath:owned.backupPath,destination:owned.destination,phase:'copying',files:[],copiedFiles:0,verifiedFiles:0})};
        call.task=Promise.resolve().then(()=>port.request(owned)).then(progress=>{call.progress=progress;return structuredClone(progress);},error=>{call.progress={...call.progress,phase:'uncertain',error:safeExecutionCode(error)};throw error;});
        calls.set(owned.operationId,call);pending.add(call.task);const settle=()=>pending.delete(call.task);void call.task.then(settle,settle);return call.task;
    }
    return {request,read,async drain(){while(pending.size)await Promise.allSettled([...pending]);}};
}
