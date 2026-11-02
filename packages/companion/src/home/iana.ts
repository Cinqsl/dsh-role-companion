/** Pure IANA calendar conversion (Node ICU at runtime; no Node-only imports so the panel can reuse it). */
export interface IanaDayBounds {readonly startUtc:string;readonly endUtc:string;readonly localDate:string;}
/** Local wall-clock coordinates of one instant. Never a fixed offset: real Node ICU/IANA lookup. */
export interface IanaLocalTime {readonly localDate:string;readonly localMinutes:number;}
const formats=new Map<string,Intl.DateTimeFormat>(),clockFormats=new Map<string,Intl.DateTimeFormat>();
function calendar(timeZone:string){let f=formats.get(timeZone);if(!f){if(typeof timeZone!=='string'||!timeZone||/^[+-]/.test(timeZone))throw Error('IANA_TIME_ZONE_UNAVAILABLE');try{f=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',calendar:'iso8601',numberingSystem:'latn'});}catch{throw Error('IANA_TIME_ZONE_UNAVAILABLE');}formats.set(timeZone,f);}return f;}
/** Canonical IANA identifier that Node ICU resolves, or undefined when the name is not resolvable. */
export function canonicalTimeZone(timeZone:unknown):string|undefined{try{const name=new Intl.DateTimeFormat('en',{timeZone:timeZone as string}).resolvedOptions().timeZone;return typeof name==='string'&&name.length?name:undefined;}catch{return undefined;}}
/** Wall-clock formatter: en-GB 24-hour clock so 00:00 never renders as 12 AM. */
function wallClock(timeZone:string){let f=clockFormats.get(timeZone);if(!f){if(typeof timeZone!=='string'||!timeZone||/^[+-]/.test(timeZone))throw Error('IANA_TIME_ZONE_UNAVAILABLE');try{f=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,calendar:'iso8601',numberingSystem:'latn'});}catch{throw Error('IANA_TIME_ZONE_UNAVAILABLE');}clockFormats.set(timeZone,f);}return f;}
function dateKey(ms:number,timeZone:string){const parts=calendar(timeZone).formatToParts(new Date(ms)),get=(type:string)=>parts.find(p=>p.type===type)!.value;return get('year')+'-'+get('month')+'-'+get('day');}
/** Local minutes since local midnight (0–1439) for quiet-hours judgement; DST-safe by construction. */
export function ianaLocalMinutes(utcOrMs:string|number,timeZone:string):IanaLocalTime {
 const ms=typeof utcOrMs==='number'?utcOrMs:Date.parse(utcOrMs);if(!Number.isFinite(ms))throw Error('CLOCK_UNAVAILABLE');
 const parts=wallClock(timeZone).formatToParts(new Date(ms)),get=(type:string)=>{const part=parts.find(entry=>entry.type===type);if(!part)throw Error('IANA_TIME_ZONE_UNAVAILABLE');return part.value;};
 const hour=Number(get('hour')),minute=Number(get('minute'));
 if(!Number.isSafeInteger(hour)||hour<0||hour>23||!Number.isSafeInteger(minute)||minute<0||minute>59)throw Error('IANA_TIME_ZONE_UNAVAILABLE');
 return {localDate:get('year')+'-'+get('month')+'-'+get('day'),localMinutes:hour*60+minute};
}
/** Single IANA calendar conversion: the UTC start/end of the chosen local date. */
export function ianaDayBounds(utcOrMs:string|number,timeZone:string,dataVersion:string):IanaDayBounds {
 const ms=typeof utcOrMs==='number'?utcOrMs:Date.parse(utcOrMs);if(!Number.isFinite(ms)||!dataVersion)throw Error('CLOCK_UNAVAILABLE');const localDate=dateKey(ms,timeZone);
 // Search for calendar changes, not for a fixed offset or a presumed 24-hour day.
 let left=Math.floor(ms/1000)*1000,right=left;for(let n=0;n<72&&dateKey(left,timeZone)===localDate;n++)left-=3600000;for(let n=0;n<72&&dateKey(right,timeZone)===localDate;n++)right+=3600000;
 if(dateKey(left,timeZone)===localDate||dateKey(right,timeZone)===localDate)throw Error('IANA_DAY_UNAVAILABLE');
 let lo=left,hi=Math.floor(ms/1000)*1000;while(hi-lo>1000){const mid=Math.floor((lo+hi)/2000)*1000;if(dateKey(mid,timeZone)===localDate)hi=mid;else lo=mid;}const startUtc=new Date(hi).toISOString();
 lo=Math.floor(ms/1000)*1000;hi=right;while(hi-lo>1000){const mid=Math.floor((lo+hi)/2000)*1000;if(dateKey(mid,timeZone)===localDate)lo=mid;else hi=mid;}const endUtc=new Date(hi).toISOString();
 return {startUtc,endUtc,localDate};
}
