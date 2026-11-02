import {plainExact} from './qq.ts';
import {OperationId,HomeRevision,BindingVersion} from './ids.ts';
import {DeliveryId,SendAttemptId,DeliveryRulesVersion,type DeliveryRecord} from './deliveries.ts';
/** A user disposition is evidence of that decision, never evidence of remote acceptance. */
export interface ResolveDelivery {
 readonly kind:'resolve-delivery';readonly operationId:OperationId;
 readonly deliveryId:DeliveryId;readonly sendAttemptId:SendAttemptId;
 readonly decision:'no-resend'|'resend';readonly note:string;readonly duplicateRiskAcknowledged:boolean;
 readonly expectedQQBindingVersion:BindingVersion;readonly expectedDeliveryRulesVersion:DeliveryRulesVersion;readonly expectedRevision:HomeRevision;
}
export interface DeliveryResolution {
 readonly operationId:OperationId;readonly deliveryId:DeliveryId;readonly sendAttemptId:SendAttemptId;
 readonly decision:'no-resend'|'resend';readonly note:string;readonly duplicateRiskAcknowledged:boolean;
 readonly committedRevision:HomeRevision;readonly newDeliveryId?:DeliveryId;
}
export interface ResolveDeliveryFact {readonly kind:'resolve-delivery';readonly resolution:DeliveryResolution;readonly delivery?:DeliveryRecord;}
export function validResolutionDecision(value:unknown):value is Pick<ResolveDelivery,'decision'|'note'|'duplicateRiskAcknowledged'>{
 if(!value||typeof value!=='object')return false;const v=value as ResolveDelivery;
 return ['no-resend','resend'].includes(v.decision)&&typeof v.note==='string'&&v.note.trim().length>0&&Array.from(v.note).length<=4096&&!v.note.includes('\0')&&v.duplicateRiskAcknowledged===(v.decision==='resend');
}
export function validateResolveDelivery(value:unknown):value is ResolveDelivery {
 if(!plainExact(value,['kind','operationId','deliveryId','sendAttemptId','decision','note','duplicateRiskAcknowledged','expectedQQBindingVersion','expectedDeliveryRulesVersion','expectedRevision'])||value.kind!=='resolve-delivery'||!validResolutionDecision(value))return false;
 const v=value as unknown as ResolveDelivery;
 try{OperationId(v.operationId);DeliveryId(v.deliveryId);SendAttemptId(v.sendAttemptId);BindingVersion(v.expectedQQBindingVersion);DeliveryRulesVersion(v.expectedDeliveryRulesVersion);HomeRevision(v.expectedRevision);return true;}catch{return false;}
}
