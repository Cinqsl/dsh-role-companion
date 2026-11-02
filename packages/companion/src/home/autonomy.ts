import {HomeError} from './errors.ts';
import {AutonomyRulesVersion,type HomeRevision,type OperationId,type RunId,type ProposalId} from './ids.ts';
import type {ClockReading,IanaDay} from '../runtime/clock.ts';
import {ianaDayBounds,canonicalTimeZone,type IanaDayBounds} from './iana.ts';
import type {ConversationSettings,TurnRecord,AttemptRecord} from './turns.ts';
export interface AutonomyRulesValue extends ConversationSettings {readonly dailyModelLimit:number;readonly dailyToolLimit:number;readonly dailyWebLimit:number;readonly timeZone:string;readonly wakeIntervalMs:number;}
export interface AutonomyRules {readonly version:AutonomyRulesVersion;readonly value:AutonomyRulesValue;}
export const autonomyDefaults:AutonomyRulesValue=Object.freeze({modelLimit:4,toolLimit:8,webLimit:3,dailyModelLimit:24,dailyToolLimit:48,dailyWebLimit:12,windowMs:300000,outputTokens:2048,timeZone:'Asia/Shanghai',wakeIntervalMs:3600000});
/** Durable wall-clock anchor for periodic opportunities. Interval changes only recompute future slots. */
export interface AutonomySchedule {readonly anchorAt:string;readonly lastSlotAt:string|null;readonly nextOpportunityAt:string;readonly missedSlots:number;}
export interface WakeOpportunity {readonly opportunityId:OperationId;readonly requestedAt:string;readonly reason:string;}
/** A time zone change keeps the window id, usage and the original end lower bound. */
export interface AutonomyWindowTransition {readonly kind:'time-zone-change';readonly previousTimeZone:string;readonly previousEndUtc:string;readonly at:string;readonly nextTimeZone:string;readonly dataVersion:string;}
export interface AutonomyWindow extends IanaDay {readonly used:{readonly model:number;readonly tool:number;readonly web:number};readonly transition?:AutonomyWindowTransition;}
export interface AutonomyState {readonly rules:AutonomyRules;readonly pending:WakeOpportunity|null;readonly windows:readonly AutonomyWindow[];readonly clock?:ClockReading;readonly clockBlocked?:string;readonly restUntil?:string;readonly pausedAt?:string;readonly schedule?:AutonomySchedule;readonly activity?:{readonly proposalId:ProposalId;readonly decision:string;readonly reason:string;readonly committedRevision:HomeRevision};}
export interface AutonomySnapshot extends AutonomyState {readonly revision:HomeRevision;}
/** Attribution of an autonomous run to windows: reservation window plus any later daily usage. */
export interface AutonomyAttributionRun {readonly runId:RunId;readonly status:TurnRecord['status'];readonly startedAt:string;readonly deadline:string;readonly windows:readonly string[];readonly attempts:readonly {readonly attemptId:string;readonly kind:AttemptRecord['kind'];readonly windowId:string;readonly reservedAt:string;readonly outcome?:string}[];}
export interface AutonomousStamp {readonly snapshotVersion?:1;readonly clock:ClockReading;readonly day:IanaDay;readonly rulesVersion:AutonomyRulesVersion;}
export type AutonomyFact={readonly kind:'coalesce-wake';readonly opportunity:WakeOpportunity;readonly reason:string;readonly clock:ClockReading}|{readonly kind:'suspend-autonomous';readonly runId:RunId;readonly reason:string}|{readonly kind:'resume-autonomous';readonly runId:RunId;readonly opportunityId:OperationId;readonly admittedInputSequence:number;readonly contextGeneration:import('./ids.ts').ContextGeneration}|{readonly kind:'request-wake';readonly opportunity:WakeOpportunity;readonly clock:ClockReading}|{readonly kind:'begin-autonomous';readonly turn:TurnRecord;readonly opportunityId:OperationId}|{readonly kind:'edit-autonomy-rules';readonly value:AutonomyRulesValue;readonly version:AutonomyRulesVersion;readonly clock?:ClockReading;readonly transition?:AutonomyWindowTransition}|{readonly kind:'set-autonomy-pause';readonly paused:boolean;readonly at:string}|{readonly kind:'clock-blocked';readonly reason:string;readonly clock:ClockReading}|{readonly kind:'clock-reviewed';readonly clock:ClockReading;readonly review:'trusted-owner';readonly previousBlock:string};
export const initialAutonomy=():AutonomyState=>({rules:{version:AutonomyRulesVersion(1),value:autonomyDefaults},pending:null,windows:[]});
const fail=(code:string):never=>{throw new HomeError(code);};
export function validAutonomyRules(value:unknown):value is AutonomyRulesValue {
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join('|')!=='dailyModelLimit|dailyToolLimit|dailyWebLimit|modelLimit|outputTokens|timeZone|toolLimit|wakeIntervalMs|webLimit|windowMs')return false;
 const v=value as AutonomyRulesValue;if(![v.modelLimit,v.toolLimit,v.webLimit,v.dailyModelLimit,v.dailyToolLimit,v.dailyWebLimit].every(n=>Number.isSafeInteger(n)&&n>=0)||!Number.isSafeInteger(v.windowMs)||v.windowMs<1||v.windowMs>2147483647||!Number.isSafeInteger(v.outputTokens)||v.outputTokens<1||v.outputTokens>256000||!Number.isSafeInteger(v.wakeIntervalMs)||v.wakeIntervalMs<60000||v.wakeIntervalMs>2147483647||typeof v.timeZone!=='string'||/^[+-]/.test(v.timeZone))return false;
 // Reject names Node ICU cannot resolve; never fall back to the machine zone.
 return canonicalTimeZone(v.timeZone)!==undefined;
}
export function clockProblem(state:{readonly clock?:ClockReading;readonly clockBlocked?:string|undefined},reading:ClockReading):string|undefined {
 if(!reading||!Number.isFinite(Date.parse(reading.utc))||!Number.isSafeInteger(reading.monotonicMs)||reading.monotonicMs<0||!reading.processId||!reading.dataVersion)return 'CLOCK_UNAVAILABLE';
 if(state.clockBlocked)return state.clockBlocked;const prior=state.clock;if(!prior)return;
 if(prior.dataVersion!==reading.dataVersion)return 'IANA_DATA_CHANGED';
 const expected=Date.parse(prior.utc)+(prior.processId===reading.processId?Math.max(0,reading.monotonicMs-prior.monotonicMs):0);
 if(Date.parse(reading.utc)<expected-60000)return 'CLOCK_ROLLBACK';
}
/**
 * Confirmed time zone transition: keep the current window id, usage and the original end as a
 * lower bound; extend to the first calendar midnight of the new zone that satisfies that lower
 * bound and is at least 24 hours after the window start. No new empty budget, no returned usage.
 */
export function transitionIanaWindow(window:AutonomyWindow,rules:AutonomyRulesValue,at:string,dataVersion:string):{readonly window:AutonomyWindow;readonly transition:AutonomyWindowTransition}{
 const zone=rules.timeZone;
 if(!Number.isFinite(Date.parse(at))||!dataVersion)fail('CLOCK_UNAVAILABLE');
 if(canonicalTimeZone(zone)===undefined)fail('INVALID_TIME_ZONE');
 if(dataVersion!==window.dataVersion)fail('IANA_DATA_CHANGED');
 const previousEndUtc=window.endUtc,startUtc=window.startUtc,startMs=Date.parse(startUtc),lowerBound=Math.max(Date.parse(previousEndUtc),startMs+86400000);
 if(!(Date.parse(at)>=startMs))fail('CLOCK_ROLLBACK');
 // Real IANA conversion only: the first new-zone local midnight at/after the lower bound.
 const bounds=(ms:number):IanaDayBounds=>{try{return ianaDayBounds(ms,zone,dataVersion);}catch{return fail('IANA_DAY_UNAVAILABLE');}};
 const endUtc=bounds(lowerBound-1000).endUtc;
 if(!(Date.parse(endUtc)>=lowerBound)||!(Date.parse(endUtc)>startMs))fail('IANA_DAY_UNAVAILABLE');
 // Keep the window internally consistent: localDate is the start's local date in the window's own zone.
 const localDate=bounds(startMs).localDate;
 const transition:AutonomyWindowTransition={kind:'time-zone-change',previousTimeZone:window.timeZone,previousEndUtc,at,nextTimeZone:zone,dataVersion};
 return {window:{windowId:window.windowId,startUtc,endUtc,localDate,timeZone:zone,dataVersion,used:{...window.used},transition},transition};
}
/**
 * The day a reading belongs to. A preserved transition window spans two calendar days of its new
 * zone; while the reading is inside it, that window stays authoritative instead of opening a new
 * budget. Outside it, the ClockPort's real IANA calendar day applies.
 */
export function effectiveAutonomyDay(state:AutonomyState,reading:ClockReading,day:IanaDay):IanaDay {
 const last=state.windows.at(-1);
 if(!last||last.dataVersion!==reading.dataVersion||last.timeZone!==state.rules.value.timeZone)return day;
 const at=Date.parse(reading.utc);
 if(!(at>=Date.parse(last.startUtc)&&at<Date.parse(last.endUtc)))return day;
 return {windowId:last.windowId,startUtc:last.startUtc,endUtc:last.endUtc,localDate:last.localDate,timeZone:last.timeZone,dataVersion:last.dataVersion};
}
const sameDayRecord=(window:AutonomyWindow,day:IanaDay)=>window.windowId===day.windowId&&window.startUtc===day.startUtc&&window.endUtc===day.endUtc&&window.localDate===day.localDate&&window.timeZone===day.timeZone&&window.dataVersion===day.dataVersion;
export function appendWindow(state:AutonomyState,stamp:AutonomousStamp,kind:AttemptRecord['kind']):AutonomyState {
 if(stamp.snapshotVersion!==undefined&&stamp.snapshotVersion!==1)fail('AUTONOMY_STAMP_FORMAT');const problem=clockProblem(state,stamp.clock);if(problem)fail(problem);if(stamp.rulesVersion!==state.rules.version)fail('AUTONOMY_RULES_CHANGED');
 const d=stamp.day,at=Date.parse(stamp.clock.utc);if(d.timeZone!==state.rules.value.timeZone||d.dataVersion!==stamp.clock.dataVersion||!(Date.parse(d.startUtc)<=at&&at<Date.parse(d.endUtc))||!/^day-[0-9a-f]{64}$/.test(d.windowId))fail('INVALID_AUTONOMY_WINDOW');
 const last=state.windows.at(-1);let current=state.windows.find(w=>w.windowId===d.windowId);if(current&&!sameDayRecord(current,d))fail('AUTONOMY_WINDOW_CONFLICT');
 if(!current&&last&&at<Date.parse(last.endUtc))fail('AUTONOMY_WINDOW_OVERLAP');
 current??={...d,used:{model:0,tool:0,web:0}};const limit=kind==='model'?state.rules.value.dailyModelLimit:kind==='tool'?state.rules.value.dailyToolLimit:state.rules.value.dailyWebLimit;if(current.used[kind]>=limit)fail('AUTONOMOUS_DAILY_'+kind.toUpperCase()+'_LIMIT');
 const next={...current,used:{...current.used,[kind]:current.used[kind]+1}};return {...state,clock:stamp.clock,windows:current===last||state.windows.some(w=>w.windowId===current!.windowId)?state.windows.map(w=>w.windowId===current!.windowId?next:w):[...state.windows,next]};
}
export function wakeBlocked(state:AutonomyState,stamp:AutonomousStamp):string|undefined {
 const problem=clockProblem(state,stamp.clock);if(problem)return problem;if(state.pausedAt)return 'AUTONOMY_PAUSED';if(state.restUntil&&Date.parse(stamp.clock.utc)<Date.parse(state.restUntil))return 'AUTONOMOUS_REST';
 const v=state.rules.value,w=state.windows.find(w=>w.windowId===stamp.day.windowId);if(!v.modelLimit||!v.dailyModelLimit||(w?.used.model??0)>=v.dailyModelLimit)return 'AUTONOMOUS_MODEL_LIMIT';
}
/** Real next reset instant: the preserved window end, or the current IANA day end when no window exists. */
export function nextResetUtc(state:AutonomyState,clock:ClockReading|undefined):string|undefined {
 const last=state.windows.at(-1);
 if(last&&clock&&Date.parse(clock.utc)<Date.parse(last.endUtc))return last.endUtc;
 if(!clock)return last?.endUtc;
 try{return ianaDayBounds(clock.utc,state.rules.value.timeZone,clock.dataVersion).endUtc;}catch{return last?.endUtc;}
}

/** Future slot base: last consumed slot, else the durable anchor. Interval edits never backfill old slots. */
export function scheduleBase(schedule:AutonomySchedule):string{return schedule.lastSlotAt??schedule.anchorAt;}
export function nextSlotAfter(base:string,intervalMs:number):string{return new Date(Date.parse(base)+intervalMs).toISOString();}
/**
 * Next slot on the anchor grid strictly after `afterMs`. Missed slots are counted, never replayed:
 * a restart or a long busy period consumes the backlog into this single future slot.
 */
export function nextGridSlot(anchorAt:string,intervalMs:number,afterMs:number):{readonly at:string;readonly delta:number}{
 const anchor=Date.parse(anchorAt);if(!Number.isFinite(anchor)||!(intervalMs>0)||!Number.isFinite(afterMs))throw new Error('INVALID_SCHEDULE_GRID');
 const steps=Math.max(1,Math.ceil((afterMs-anchor)/intervalMs));
 for(let guard=0;guard<8;guard++){const at=anchor+steps*intervalMs;if(at>afterMs)return {at:new Date(at).toISOString(),delta:steps};}
 return {at:new Date(anchor+(steps+1)*intervalMs).toISOString(),delta:steps+1};
}
export function validSchedule(value:unknown):value is AutonomySchedule{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)return false;
 const v=value as AutonomySchedule;if(Object.keys(v).sort().join('|')!=='anchorAt|lastSlotAt|missedSlots|nextOpportunityAt')return false;
 if(!Number.isSafeInteger(v.missedSlots)||v.missedSlots<0)return false;
 if(!Number.isFinite(Date.parse(v.anchorAt))||!Number.isFinite(Date.parse(v.nextOpportunityAt)))return false;
 if(v.lastSlotAt!==null&&!Number.isFinite(Date.parse(v.lastSlotAt)))return false;
 return v.lastSlotAt===null||Date.parse(v.lastSlotAt)>=Date.parse(v.anchorAt);
}
