import {createHash} from 'node:crypto';
import {OperationId} from '../home/ids.ts';
/** Deterministic control operations belong to the original accepted owner action, never a model run. */
export function restoreRegistrationIds(acceptanceOperationId:OperationId){
    const attachOperationId=OperationId('restore-attach-'+createHash('sha256').update(OperationId(acceptanceOperationId)).digest('hex'));
    return {attachOperationId,registrationOperationId:OperationId('registration-'+createHash('sha256').update(attachOperationId).digest('hex'))};
}
export interface RestoreRegistrationRequest {readonly acceptanceOperationId:OperationId;readonly stage:'attach'|'register';}
