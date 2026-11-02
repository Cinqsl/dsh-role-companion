import {DayWindowId} from '../home/ids.ts';
import {randomUUID,createHash} from 'node:crypto';
import {ianaDayBounds,ianaLocalMinutes} from '../home/iana.ts';
export {canonicalTimeZone,ianaDayBounds,ianaLocalMinutes} from '../home/iana.ts';
export type {IanaDayBounds} from '../home/iana.ts';
/** Host clock capability. Calendar conversion uses the running Node ICU/IANA database. */
export interface ClockReading {readonly utc:string;readonly monotonicMs:number;readonly processId:string;readonly dataVersion:string;}
export interface IanaDay {readonly windowId:DayWindowId;readonly startUtc:string;readonly endUtc:string;readonly localDate:string;readonly timeZone:string;readonly dataVersion:string;}
/** `local` is the only way Home may learn local wall-clock minutes; a fixed offset is never accepted. */
export interface ClockPort {read():ClockReading;day(utc:string,timeZone:string):IanaDay;local?(utc:string,timeZone:string):{readonly localDate:string;readonly localMinutes:number};}
export function ianaWindowId(startUtc:string,endUtc:string,timeZone:string,dataVersion:string):DayWindowId{return DayWindowId('day-'+createHash('sha256').update(JSON.stringify({startUtc,endUtc,timeZone,dataVersion})).digest('hex'));}
export function ianaDay(utc:string,timeZone:string,dataVersion:string):IanaDay {
 const {startUtc,endUtc,localDate}=ianaDayBounds(utc,timeZone,dataVersion);
 return {windowId:ianaWindowId(startUtc,endUtc,timeZone,dataVersion),startUtc,endUtc,localDate,timeZone,dataVersion};
}
export function createNodeClock(now:()=>Date=()=>new Date()):ClockPort {
 const processId=randomUUID(),dataVersion=process.versions.tz&&process.versions.icu?'node-icu:'+process.versions.icu+'/tz:'+process.versions.tz:'';
 return Object.freeze({read(){if(!dataVersion)throw Error('IANA_DATA_UNAVAILABLE');return {utc:now().toISOString(),monotonicMs:Math.floor(performance.now()),processId,dataVersion};},day(utc:string,timeZone:string){if(!dataVersion)throw Error('IANA_DATA_UNAVAILABLE');return ianaDay(utc,timeZone,dataVersion);},local(utc:string,timeZone:string){if(!dataVersion)throw Error('IANA_DATA_UNAVAILABLE');return ianaLocalMinutes(utc,timeZone);}});
}
