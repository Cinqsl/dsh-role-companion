import {createHash} from 'node:crypto';
import {HomeError} from '../home/errors.ts';
import {ContactIntentId,type BindingVersion,type RoleId} from '../home/ids.ts';
import {plainExact} from '../home/qq.ts';
import {contactBlocked,type ContactStamp} from '../home/contact.ts';
import {contactRoundUsed} from '../home/contact.ts';
import type {ConversationSnapshot} from '../home/turns.ts';
import type {ContactIntentRead,ContactIntentPart,ContactView} from '../types.contact.ts';

/**
 * A bounded projection from the single authoritative conversation snapshot. No second counter: every
 * number comes from `sendAttempts` (the only contact frequency ledger) and the current ContactRules.
 */
export function contactView(state:ConversationSnapshot,roleId:RoleId,bindingVersion:BindingVersion,stamp:ContactStamp|undefined,failure:string|null):ContactView {
    const rules=state.contactRules,contacts=state.sendAttempts.filter(attempt=>attempt.contact);
    const day=stamp?.day,last=contacts.at(-1);
    const dayUsed=day?contacts.filter(attempt=>attempt.contact!.day.windowId===day.windowId).length:0;
    const roundRunId=state.turns.filter(turn=>turn.source==='autonomous'&&turn.status==='running').at(-1)?.runId??null;
    const roundUsed=roundRunId?contactRoundUsed(state,roundRunId):0;
    const cooldownRemainingMs=stamp&&last?Math.max(0,Date.parse(last.reservedAt)+rules.value.cooldownMs-Date.parse(stamp.clock.utc)):0;
    const blocked=stamp?contactBlocked({rules,stamp,usage:{dayUsed,roundUsed,lastReservedAt:last?.reservedAt??null}}):{ok:false as const,code:'CLOCK_UNAVAILABLE'};
    // Each reason is reported separately: pause, rest, clock, cooldown, DND and quotas never collapse.
    const blockedReasons:string[]=[];
    if(state.autonomy.pausedAt)blockedReasons.push('AUTONOMY_PAUSED');
    if(stamp&&state.autonomy.restUntil&&Date.parse(stamp.clock.utc)<Date.parse(state.autonomy.restUntil))blockedReasons.push('AUTONOMOUS_REST');
    if(stamp&&(state.autonomy.clockBlocked||!stamp))blockedReasons.push('CLOCK_UNAVAILABLE');
    if(!blocked.ok&&!blockedReasons.includes(blocked.code))blockedReasons.push(blocked.code);
    if(failure&&!blockedReasons.includes(failure))blockedReasons.push(failure);
    return {
        roleId,bindingVersion,revision:state.revision,rules,
        usage:{dayWindowId:day?.windowId??null,dayUsed,dailyLimit:rules.value.dailyLimit,roundRunId,roundUsed,perRoundLimit:rules.value.perRoundLimit,cooldownRemainingMs,lastReservedAt:last?.reservedAt??null,quietHoursActive:!!stamp&&!blocked.ok&&blocked.code==='CONTACT_QUIET_HOURS'},
        blockedReasons,
        intents:state.contact.intents.slice(-30).map(intent=>{const record=state.knowledge.versions.find(version=>version.knowledgeId===intent.knowledgeId&&version.version===intent.knowledgeVersion),text=record?String(record.text):'',delivery=state.deliveries.find(delivery=>delivery.deliveryId===intent.deliveryId);return {intentId:intent.intentId,state:intent.state,runId:intent.runId,proposalId:intent.proposalId,knowledgeId:intent.knowledgeId,knowledgeVersion:intent.knowledgeVersion,createdAt:intent.createdAt,committedRevision:intent.committedRevision,deliveryId:intent.deliveryId??null,deliveryStatus:delivery?.status??null,closedReason:intent.closedReason??null,supersededBy:intent.supersededBy??null,contentDigest:createHash('sha256').update(text).digest('hex'),textExcerpt:Array.from(text).slice(0,240).join(''),totalCodePoints:Array.from(text).length};}),
        totalIntents:state.contact.intents.length,
        ruleEffect:'next-contact-attempt',
        // The real send path is verified by #51 mechanism evidence; real role choice quality stays G2.
        deliveryPath:'mechanism-verified-real-choice-not-run'
    };
}
/** Full text of one contact intent, paged by revision+digest so two versions are never stitched. */
export function contactIntentPart(state:ConversationSnapshot,request:ContactIntentRead):ContactIntentPart {
    if(!plainExact(request,['intentId','revision','contentDigest','offset','limit'])||!Number.isSafeInteger(request.offset)||request.offset<0||!Number.isSafeInteger(request.limit)||request.limit<1||request.limit>4096||typeof request.contentDigest!=='string'||!/^[a-f0-9]{64}$/.test(request.contentDigest))throw new HomeError('INVALID_CONTACT_INTENT_PAGE');
    const intentId=ContactIntentId(request.intentId),intent=state.contact.intents.find(record=>record.intentId===intentId);
    if(!intent)throw new HomeError('CONTACT_INTENT_NOT_FOUND');
    const record=state.knowledge.versions.find(version=>version.knowledgeId===intent.knowledgeId&&version.version===intent.knowledgeVersion);
    if(!record)throw new HomeError('CONTACT_INTENT_NOT_FOUND');
    const text=String(record.text),digest=createHash('sha256').update(text).digest('hex');
    if(request.revision!==state.revision||digest!==request.contentDigest)throw new HomeError('CONTACT_CHANGED');
    const points=Array.from(text);
    return {intentId,revision:state.revision,contentDigest:digest,text:points.slice(request.offset,request.offset+request.limit).join(''),offset:request.offset,totalCodePoints:points.length,more:request.offset+request.limit<points.length};
}
