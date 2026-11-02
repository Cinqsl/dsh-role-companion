import type {DeliveryResolution} from './delivery-resolutions.ts';
import {ReplyId,IntentId,RunId,BindingVersion,HomeRevision,OperationId,ContactIntentId,type InputId,type RoleId,type RunId as RunIdentity} from './ids.ts';
import {admitQQBinding,plainExact,QQMessageId,type QQBinding} from './qq.ts';
import type {ClockReading,IanaDay} from '../runtime/clock.ts';
import type {ContactRulesVersion} from './ids.ts';
declare const identity:unique symbol;
export type DeliveryId=string & {readonly [identity]:'RoleCompanion.DeliveryId'};
export type SendAttemptId=string & {readonly [identity]:'RoleCompanion.SendAttemptId'};
export type DeliveryRulesVersion=number & {readonly [identity]:'RoleCompanion.DeliveryRulesVersion'};
export function DeliveryId(value:unknown):DeliveryId{return OperationId(value) as string as DeliveryId;}
export function SendAttemptId(value:unknown):SendAttemptId{return OperationId(value) as string as SendAttemptId;}
export function DeliveryRulesVersion(value:unknown):DeliveryRulesVersion{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)throw new Error('INVALID_DELIVERY_RULES_VERSION');return value as DeliveryRulesVersion;}
export const longReplyMarker='内容较长，完整回复已保存，可在 DSH 角色面板查看';
/** 主动联系的正文同样只发一条有界预览；标记文案不同，避免把主动联系说成“回复”。 */
export const longContactMarker='内容较长，完整消息已保存，可在 DSH 角色面板查看';
export const minimumPreviewCodePoints=Math.max(Array.from(longReplyMarker).length,Array.from(longContactMarker).length)+1;
export interface DeliveryRulesValue{readonly previewCodePoints:number;readonly sendTimeoutMs:number;}
export interface DeliveryRules{readonly version:DeliveryRulesVersion;readonly value:DeliveryRulesValue;}
export interface DeliveryRulesSnapshot extends DeliveryRules{readonly revision:HomeRevision;}
export const deliveryRulesDefaults:DeliveryRulesValue=Object.freeze({previewCodePoints:1500,sendTimeoutMs:20000});
export function validateDeliveryRules(value:unknown):value is DeliveryRulesValue{return plainExact(value,['previewCodePoints','sendTimeoutMs'])&&Number.isSafeInteger(value.previewCodePoints)&&Number(value.previewCodePoints)>=minimumPreviewCodePoints&&Number(value.previewCodePoints)<=1048576&&Number.isSafeInteger(value.sendTimeoutMs)&&Number(value.sendTimeoutMs)>0&&Number(value.sendTimeoutMs)<=2147483647;}
export function previewText(text:string,limit:number,marker:string):string{const points=Array.from(text);return points.length<=limit?text:points.slice(0,limit-Array.from(marker).length).join('')+marker;}
export function previewReply(text:string,limit:number):string{return previewText(text,limit,longReplyMarker);}
export function previewContact(text:string,limit:number):string{return previewText(text,limit,longContactMarker);}
/** The one display rule (deliveryRules.previewCodePoints) applies to both; only the marker differs. */
export function previewDelivery(qualification:DeliveryQualification,text:string,limit:number):string{return qualification==='contact'?previewContact(text,limit):previewReply(text,limit);}
/**
 * One delivery ledger serves both qualifications: a user-triggered main reply and a role-initiated
 * contact. A contact delivery has no reply and never reuses `ReplyRecord.intentId`; it points at its
 * own contact intent instead. `qualification` is the discriminator every consumer must branch on.
 */
export type DeliveryQualification='main-reply'|'contact';
export interface DeliveryRecord{
 readonly deliveryId:DeliveryId;readonly qualification:DeliveryQualification;readonly source:'user'|'contact';
 readonly replyId?:ReplyId;readonly intentId?:IntentId;readonly contactIntentId?:ContactIntentId;
 readonly runId:RunId;readonly inputIds:readonly InputId[];
 readonly target:QQBinding;readonly text:string;readonly rulesVersion:DeliveryRulesVersion;
 readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker;
 readonly status:'pending'|'sending'|'confirmed'|'rejected'|'unknown'|'cancelled';readonly committedRevision:HomeRevision;
 readonly retryOf?:DeliveryId;readonly resolutionOperationId?:OperationId;
 readonly supersedes?:DeliveryId;readonly supersededBy?:DeliveryId;readonly sendAttemptId?:SendAttemptId;
}
export type DeliveryObservation={readonly kind:'confirmed';readonly messageId:QQMessageId;readonly evidence:unknown}|{readonly kind:'unknown'|'rejected';readonly code:string;readonly evidence?:unknown};
/** Contact attribution of one reserved attempt; the sole source of contact cooldown/daily/round usage. */
export interface ContactAttemptAttribution {
  readonly snapshotVersion?:1;
  readonly intentId:ContactIntentId;readonly runId:RunIdentity;readonly day:IanaDay;readonly clock:ClockReading;
  readonly localMinutes:number;readonly rulesVersion:ContactRulesVersion;
}
export interface SendAttemptRecord{readonly cleanup?:import('./cleanup.ts').SourceCleanupMarker;readonly sendAttemptId:SendAttemptId;readonly deliveryId:DeliveryId;readonly source:'user'|'contact';readonly reservedAt:string;readonly deadline:string;readonly rules:DeliveryRules;readonly committedRevision:HomeRevision;readonly observation?:DeliveryObservation;readonly contact?:ContactAttemptAttribution;}
export interface DeliveryState{readonly deliveryRules:DeliveryRules;readonly deliveries:readonly DeliveryRecord[];readonly sendAttempts:readonly SendAttemptRecord[];readonly deliveryResolutions:readonly DeliveryResolution[];}
export const initialDeliveries=():DeliveryState=>({deliveryRules:{version:DeliveryRulesVersion(1),value:deliveryRulesDefaults},deliveries:[],sendAttempts:[],deliveryResolutions:[]});
export interface BeginDelivery{readonly operationId:OperationId;readonly deliveryId:DeliveryId;readonly sendAttemptId:SendAttemptId;readonly expectedRulesVersion:DeliveryRulesVersion;readonly expectedRevision:HomeRevision;readonly now:string;readonly contact?:{readonly stamp:import('./contact.ts').ContactStamp;readonly intentId:ContactIntentId};}
export type DeliveryFact={readonly kind:'begin-delivery';readonly attempt:SendAttemptRecord}|{readonly kind:'settle-delivery';readonly sendAttemptId:SendAttemptId;readonly observation:DeliveryObservation}|{readonly kind:'edit-delivery-rules';readonly value:DeliveryRulesValue;readonly version:DeliveryRulesVersion;readonly replacements:readonly DeliveryRecord[]};
export interface EditDeliveryRules{readonly kind:'edit-delivery-rules';readonly operationId:OperationId;readonly value:DeliveryRulesValue;readonly expectedDeliveryRulesVersion:DeliveryRulesVersion;readonly expectedRevision:HomeRevision;}
export function admitDelivery(value:DeliveryRecord,roleId:RoleId):DeliveryRecord{return {...value,deliveryId:DeliveryId(value.deliveryId),qualification:value.qualification,source:value.source,...(value.replyId?{replyId:ReplyId(value.replyId)}:{}),...(value.intentId?{intentId:IntentId(value.intentId)}:{}),...(value.contactIntentId?{contactIntentId:ContactIntentId(value.contactIntentId)}:{}),runId:RunId(value.runId),target:admitQQBinding(value.target,roleId),rulesVersion:DeliveryRulesVersion(value.rulesVersion),committedRevision:HomeRevision(value.committedRevision),...(value.retryOf?{retryOf:DeliveryId(value.retryOf)}:{}),...(value.resolutionOperationId?{resolutionOperationId:OperationId(value.resolutionOperationId)}:{}),...(value.supersedes?{supersedes:DeliveryId(value.supersedes)}:{}),...(value.supersededBy?{supersededBy:DeliveryId(value.supersededBy)}:{}),...(value.sendAttemptId?{sendAttemptId:SendAttemptId(value.sendAttemptId)}:{})};}
export function sameQQTarget(a:QQBinding|undefined|null,b:QQBinding):boolean{return !!a&&a.bindingId===b.bindingId&&a.version===b.version&&a.connectionId===b.connectionId&&a.accountId===b.accountId&&a.peerId===b.peerId&&a.activatedRevision===b.activatedRevision;}
