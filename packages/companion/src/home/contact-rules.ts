import {ContactRulesVersion,type HomeRevision} from './ids.ts';
import {plainExact} from './qq.ts';
/** 免打扰只限制主动联系，不阻止角色回复用户主动发来的消息。 */
export interface QuietHoursOff {readonly mode:'off';}
export interface QuietHoursAllDay {readonly mode:'all-day';}
export interface QuietHoursRange {readonly mode:'range';readonly start:string;readonly end:string;}
export type QuietHours=QuietHoursOff|QuietHoursAllDay|QuietHoursRange;
/**
 * 主动联系规则的唯一持久值与版本。冷却/日额/轮额按**实际发送尝试**计数，
 * 计数本身来自既有 sendAttempts，不在这里存第二份计数器。
 */
export interface ContactRulesValue {readonly cooldownMs:number;readonly dailyLimit:number;readonly perRoundLimit:number;readonly quietHours:QuietHours;}
export interface ContactRules {readonly version:ContactRulesVersion;readonly value:ContactRulesValue;}
export interface ContactRulesSnapshot extends ContactRules {readonly revision:HomeRevision;}
export const contactRulesDefaults:ContactRulesValue=Object.freeze({cooldownMs:7200000,dailyLimit:3,perRoundLimit:1,quietHours:Object.freeze({mode:'range',start:'23:00',end:'08:00'})});
const HHMM=/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
/** 'HH:mm' 是**本地墙钟**分钟；不接受固定偏移或数字时区。 */
export function localMinutes(value:unknown):number {
    if(typeof value!=='string'||!HHMM.test(value))throw Error('INVALID_LOCAL_MINUTES');
    return Number(value.slice(0,2))*60+Number(value.slice(3,5));
}
function validQuietHours(value:unknown):value is QuietHours {
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)return false;
    const mode=(value as {mode?:unknown}).mode;
    if(mode==='off'||mode==='all-day')return plainExact(value,['mode']);
    if(mode!=='range'||!plainExact(value,['mode','start','end']))return false;
    const {start,end}=value as {start?:unknown;end?:unknown};
    if(typeof start!=='string'||typeof end!=='string'||!HHMM.test(start)||!HHMM.test(end))return false;
    // 同起止必须由用户改选“全天”或“关闭”，不猜测其含义。
    return start!==end;
}
/** 未知键、自有 __proto__、小数/负数/溢出、同起止一律整笔拒绝；0 表示禁止。 */
export function validateContactRules(value:unknown):value is ContactRulesValue {
    if(!plainExact(value,['cooldownMs','dailyLimit','perRoundLimit','quietHours']))return false;
    const v=value as unknown as ContactRulesValue;
    for(const field of ['cooldownMs','dailyLimit','perRoundLimit'] as const){const raw=v[field];if(typeof raw!=='number'||!Number.isSafeInteger(raw)||raw<0)return false;}
    return validQuietHours(v.quietHours);
}
export const initialContactRules=():ContactRules=>({version:ContactRulesVersion(1),value:contactRulesDefaults});
/** 区间含起点、不含终点；跨午夜与同日区间语义一致。 */
export function quietHoursActive(quietHours:QuietHours,minutes:number):boolean {
    if(!Number.isSafeInteger(minutes)||minutes<0||minutes>=1440)throw Error('INVALID_LOCAL_MINUTES');
    if(quietHours.mode==='off')return false;
    if(quietHours.mode==='all-day')return true;
    const start=localMinutes(quietHours.start),end=localMinutes(quietHours.end);
    return start<end?minutes>=start&&minutes<end:minutes>=start||minutes<end;
}
