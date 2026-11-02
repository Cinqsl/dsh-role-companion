import {ContactIntentId,HomeRevision,KnowledgeId,KnowledgeVersion,ProposalId,RunId,type ContactRulesVersion,type OperationId} from './ids.ts';
import {quietHoursActive} from './contact-rules.ts';
import {plainExact} from './qq.ts';
import type {DeliveryId} from './deliveries.ts';
import type {ClockReading,IanaDay} from '../runtime/clock.ts';
import type {ContactRules} from './contact-rules.ts';
import type {ConversationSnapshot} from './turns.ts';

/** A contact intent goes open → sending → sent/unknown; it is never reopened after a delivery exists. */
export type ContactIntentState='open'|'sending'|'sent'|'unknown'|'rejected'|'closed';
export interface ContactIntentRecord {
    readonly intentId:ContactIntentId;readonly runId:RunId;readonly proposalId:ProposalId;
    readonly knowledgeId:KnowledgeId;readonly knowledgeVersion:KnowledgeVersion;
    readonly createdAt:string;readonly committedRevision:HomeRevision;
    readonly state:ContactIntentState;readonly deliveryId?:DeliveryId;
    readonly closedReason?:string;readonly supersededBy?:ContactIntentId;
}
export interface ContactState {readonly intents:readonly ContactIntentRecord[];}
export const emptyContact=():ContactState=>({intents:[]});

/** The single contact stamp a Home needs to judge local wall-clock rules; no Home-owned clock exists. */
export interface ContactStamp {
    readonly snapshotVersion?:1;
    readonly clock:ClockReading;
    readonly day:IanaDay;
    readonly localMinutes:number;
    readonly rulesVersion:ContactRulesVersion;
}

/**
 * Derived contact usage: every number comes from the existing sendAttempts ledger.
 * There is no counter array, no second budget, and an unknown/rejected attempt stays charged.
 */
export interface ContactUsage {
    readonly dayUsed:number;
    readonly roundUsed:number;
    readonly lastReservedAt:string|null;
}
export function contactUsage(state:Pick<ConversationSnapshot,'sendAttempts'|'deliveries'>,dayWindowId:string,runId?:string):ContactUsage {
    const contacts=state.sendAttempts.filter(attempt=>attempt.contact);
    return {dayUsed:contacts.filter(attempt=>attempt.contact!.day.windowId===dayWindowId).length,roundUsed:runId===undefined?0:contactRoundUsed(state,runId),lastReservedAt:contacts.at(-1)?.reservedAt??null};
}
/** The round is charged by the delivery of this autonomous turn, not by any user reply. */
export function contactRoundUsed(state:Pick<ConversationSnapshot,'sendAttempts'|'deliveries'>,runId:string):number {
    const runs=new Map(state.deliveries.map(delivery=>[delivery.deliveryId,delivery.runId]));
    return state.sendAttempts.filter(attempt=>attempt.contact&&runs.get(attempt.deliveryId)===runId).length;
}
export type ContactAdmission = {readonly ok:true} | {readonly ok:false;readonly code:string};
/**
 * Pure, ordered admission for a contact attempt. Rest/pause/clock/binding/intent are judged by the
 * caller (they already have Home state); this function judges only the contact-rule set.
 */
export function contactBlocked(input:{readonly rules:ContactRules;readonly stamp:ContactStamp;readonly usage:ContactUsage}):ContactAdmission {
    const {rules,stamp,usage}=input,value=rules.value;
    if(stamp.rulesVersion!==rules.version)return {ok:false,code:'CONTACT_RULES_CHANGED'};
    if(value.dailyLimit<=0||usage.dayUsed>=value.dailyLimit)return {ok:false,code:'CONTACT_DAILY_LIMIT'};
    if(value.perRoundLimit<=0||usage.roundUsed>=value.perRoundLimit)return {ok:false,code:'CONTACT_ROUND_LIMIT'};
    if(usage.lastReservedAt&&Number.isFinite(Date.parse(usage.lastReservedAt))&&Date.parse(stamp.clock.utc)<Date.parse(usage.lastReservedAt)+value.cooldownMs)return {ok:false,code:'CONTACT_COOLDOWN'};
    if(quietHoursActive(value.quietHours,stamp.localMinutes))return {ok:false,code:'CONTACT_QUIET_HOURS'};
    return {ok:true};
}
/** Contact admission never charges model/tool/web windows: the autonomy ledger stays untouched. */
export function contactIntentOpen(state:ContactState,intentId:ContactIntentId):ContactIntentRecord|undefined {
    const intent=state.intents.find(record=>record.intentId===intentId);
    return intent?.state==='open'?intent:undefined;
}
export function contactIntentWritable(intent:ContactIntentRecord):boolean {return intent.state==='open'&&intent.deliveryId===undefined;}
/**
 * Validates the stamp fields shared by the Runtime capability and the persisted attempt attribution.
 * The attribution additionally carries intentId/runId, so this must not require an exact key set.
 */
export function validContactStamp(value:unknown):value is ContactStamp {
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)return false;
    const v=value as ContactStamp;
    return v.snapshotVersion===1&&Number.isSafeInteger(v.localMinutes)&&v.localMinutes>=0&&v.localMinutes<1440&&Number.isSafeInteger(v.rulesVersion)&&v.rulesVersion>=1&&!!v.clock&&typeof v.clock==='object'&&!!v.day&&typeof v.day==='object';
}
export function contactIntentOperationId(intent:OperationId):OperationId{return intent;}
