import {OperationId,HandoverId,BackupManifestDigest,HomeRevision,type RunId} from './ids.ts';
import {HomeError} from './errors.ts';
/** Only the trusted owner may make this current assertion; no inference scope receives this method. */
export interface RestoreConfirmation {readonly operationId:OperationId;readonly restoreOperationId:OperationId;readonly handoverId:HandoverId;readonly expectedManifestDigest:BackupManifestDigest;readonly expectedRevision:HomeRevision;readonly currentSourceStoppedConfirmed:boolean;}
export interface RestoreAcceptance {readonly operationId:OperationId;readonly restoreOperationId:OperationId;readonly handoverId:HandoverId;readonly manifestDigest:BackupManifestDigest;readonly sourceRevision:HomeRevision;readonly sourceStopOperationId:OperationId;readonly inputSequence:number;readonly inheritedRunIds:readonly RunId[];readonly committedRevision:HomeRevision;}
export function restoreConfirmation(value:unknown):RestoreConfirmation{
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).some(key=>typeof key!=='string')||Reflect.ownKeys(value).sort().join('|')!=='currentSourceStoppedConfirmed|expectedManifestDigest|expectedRevision|handoverId|operationId|restoreOperationId')throw new HomeError('INVALID_RESTORE_CONFIRMATION');
    if(!('operationId' in value)||!('restoreOperationId' in value)||!('handoverId' in value)||!('expectedManifestDigest' in value)||!('expectedRevision' in value)||!('currentSourceStoppedConfirmed' in value)||typeof value.currentSourceStoppedConfirmed!=='boolean')throw new HomeError('INVALID_RESTORE_CONFIRMATION');
    if(!value.currentSourceStoppedConfirmed)throw new HomeError('SOURCE_STOP_CONFIRMATION_REQUIRED');
    return {operationId:OperationId(value.operationId),restoreOperationId:OperationId(value.restoreOperationId),handoverId:HandoverId(value.handoverId),expectedManifestDigest:BackupManifestDigest(value.expectedManifestDigest),expectedRevision:HomeRevision(value.expectedRevision),currentSourceStoppedConfirmed:true};
}

/** One Home-owned qualifier shared by replay and the Runtime scheduler. Historical records remain unchanged. */
export const restoreInputEligible=(accepted:RestoreAcceptance|undefined,input:{readonly receiveSequence:number})=>!accepted||input.receiveSequence>accepted.inputSequence;
export const restoreRunEligible=(accepted:RestoreAcceptance|undefined,runId:RunId)=>!accepted||!accepted.inheritedRunIds.includes(runId);
export const restoreRevisionEligible=(accepted:RestoreAcceptance|undefined,revision:HomeRevision)=>!accepted||revision>accepted.sourceRevision;

/** New preview rows retain the reply's inherited status; only a new explicit owner resend can renew delivery. */
export function restoreDeliveryEligible(accepted:RestoreAcceptance|undefined,delivery:import('./deliveries.ts').DeliveryRecord,state:Pick<import('./turns.ts').ConversationState,'replies'|'deliveryResolutions'>):boolean{
    if(!accepted)return true;
    const reply=state.replies.find(reply=>reply.replyId===delivery.replyId);if(reply&&reply.committedRevision>accepted.sourceRevision)return true;
    const resolution=state.deliveryResolutions.find(resolution=>resolution.operationId===delivery.resolutionOperationId);
    return !!resolution&&resolution.decision==='resend'&&resolution.committedRevision>accepted.sourceRevision&&resolution.deliveryId===delivery.retryOf&&!!resolution.newDeliveryId;
}
