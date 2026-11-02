import {createHash} from 'node:crypto';
import {HomeError} from '../home/errors.ts';
import {RunId,type RoleId,type BindingVersion} from '../home/ids.ts';
import type {ConversationSnapshot,TurnRecord} from '../home/turns.ts';
import type {AutonomyView,AutonomyScheduleView,ActivityRecordRead,ActivityRecordPart} from '../types.autonomy.ts';
import {plainExact} from '../home/qq.ts';
import {nextResetUtc} from '../home/autonomy.ts';
const encoded=(turn:TurnRecord)=>{const text=JSON.stringify(turn);return {text,contentDigest:createHash('sha256').update(text).digest('hex'),totalCodePoints:Array.from(text).length};};
/** Bounded projection from one authoritative Home conversation snapshot. */
export function autonomyView(state:ConversationSnapshot,roleId:RoleId,bindingVersion:BindingVersion,skipReason:string|null=null):AutonomyView {
 const a=state.autonomy,all=state.turns.filter(t=>t.source==='autonomous');return {roleId,bindingVersion,revision:state.revision,rules:a.rules,pending:a.pending,restUntil:a.restUntil??null,clockBlocked:a.clockBlocked??null,clockDataVersion:a.clock?.dataVersion??null,windows:a.windows.slice(-30),totalWindows:a.windows.length,nextResetUtc:nextResetUtc(a,a.clock)??a.windows.at(-1)?.endUtc??null,currentWindowId:a.windows.at(-1)?.windowId??null,activities:all.slice(-20).reverse().map(turn=>{const {text,...body}=encoded(turn),attempts=state.attempts.filter(a=>a.runId===turn.runId);return {runId:turn.runId,status:turn.status,startedAt:turn.startedAt,deadline:turn.deadline,reason:turn.outcome&&'reason'in turn.outcome?turn.outcome.reason:turn.status,textExcerpt:turn.outcome?.text?Array.from(turn.outcome.text).slice(0,240).join(''):'',totalCodePoints:body.totalCodePoints,contentDigest:body.contentDigest,modelUsed:attempts.filter(a=>a.kind==='model').length,toolUsed:attempts.filter(a=>a.kind==='tool').length,webUsed:attempts.filter(a=>a.kind==='web').length};}),totalActivities:all.length,schedule:scheduleView(state,skipReason),ruleEffect:'next-admission',timeZoneEditing:'available'};
}
export function activityRecordPart(state:ConversationSnapshot,request:ActivityRecordRead):ActivityRecordPart {
 if(!plainExact(request,['runId','revision','contentDigest','offset','limit'])||!Number.isSafeInteger(request.offset)||request.offset<0||!Number.isSafeInteger(request.limit)||request.limit<1||request.limit>4096||typeof request.contentDigest!=='string'||!/^[a-f0-9]{64}$/.test(request.contentDigest))throw new HomeError('INVALID_ACTIVITY_PAGE');
 const runId=RunId(request.runId),turn=state.turns.find(t=>t.runId===runId&&t.source==='autonomous');if(!turn)throw new HomeError('ACTIVITY_NOT_FOUND');const body=encoded(turn);if(request.revision!==state.revision||body.contentDigest!==request.contentDigest)throw new HomeError('ACTIVITY_CHANGED');const points=Array.from(body.text);return {runId,revision:state.revision,contentDigest:body.contentDigest,text:points.slice(request.offset,request.offset+request.limit).join(''),offset:request.offset,totalCodePoints:points.length,more:request.offset+request.limit<points.length};
}

/** Read-only projection: the panel never keeps a second schedule or pause value. */
export function scheduleView(state:ConversationSnapshot,skipReason:string|null=null):AutonomyScheduleView {
 const schedule=state.autonomy.schedule,value=state.autonomy.rules.value;
 // Before the first runtime arming the durable schedule is absent; the panel shows the configured
 // interval and paused intent only, and reports no scheduled opportunity yet.
 return {intervalMs:value.wakeIntervalMs,paused:state.autonomy.pausedAt!==undefined,pausedAt:state.autonomy.pausedAt??null,anchorAt:schedule?.anchorAt??'',lastSlotAt:schedule?.lastSlotAt??null,nextOpportunityAt:schedule?.nextOpportunityAt??'',missedSlots:schedule?.missedSlots??0,lastSkipReason:skipReason};
}
