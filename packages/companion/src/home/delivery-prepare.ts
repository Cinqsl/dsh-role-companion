import {createHash} from 'node:crypto';
import {DeliveryId,previewDelivery,previewReply,type DeliveryQualification,type DeliveryRecord,type DeliveryRules} from './deliveries.ts';
import type {ReplyId,IntentId,RunId,InputId,HomeRevision,OperationId,ContactIntentId} from './ids.ts';
import type {QQBinding} from './qq.ts';
const stableId=(seed:string)=>DeliveryId('delivery-'+createHash('sha256').update(seed).digest('hex'));
export function prepareDelivery(reply:{replyId:ReplyId;intentId:IntentId;runId:RunId;inputIds:readonly InputId[];text:string},target:QQBinding,rules:DeliveryRules,revision:HomeRevision,supersedes?:DeliveryId,operationId?:OperationId):DeliveryRecord{return {deliveryId:stableId(supersedes?operationId+':'+supersedes:reply.replyId),qualification:'main-reply',source:'user',replyId:reply.replyId,intentId:reply.intentId,runId:reply.runId,inputIds:[...reply.inputIds],target:structuredClone(target),text:previewReply(reply.text,rules.value.previewCodePoints),rulesVersion:rules.version,status:'pending',committedRevision:revision,...(supersedes?{supersedes}:{})};}

export function prepareRedelivery(reply:Parameters<typeof prepareDelivery>[0],original:DeliveryRecord,rules:DeliveryRules,revision:HomeRevision,operationId:OperationId):DeliveryRecord {const {supersedes,...delivery}=prepareDelivery(reply,original.target,rules,revision,original.deliveryId,operationId);return {...delivery,retryOf:original.deliveryId,resolutionOperationId:operationId};}

/**
 * A contact candidate prepared at adoption time. It is only a pending item: no send happens until
 * `beginDelivery` re-checks every rule atomically. The target comes from the binding, never the model,
 * and the text is the adopted knowledge version's text (not an internal activity string).
 */
export function prepareContactDelivery(intent:{intentId:ContactIntentId;runId:RunId;text:string},target:QQBinding,rules:DeliveryRules,revision:HomeRevision):DeliveryRecord {
    return {deliveryId:stableId('contact:'+intent.intentId),qualification:'contact',source:'contact',contactIntentId:intent.intentId,runId:intent.runId,inputIds:[],target:structuredClone(target),text:previewDelivery('contact',intent.text,rules.value.previewCodePoints),rulesVersion:rules.version,status:'pending',committedRevision:revision};
}
export {previewDelivery,previewReply};
export {longContactMarker,longReplyMarker} from './deliveries.ts';
export type {DeliveryQualification};
