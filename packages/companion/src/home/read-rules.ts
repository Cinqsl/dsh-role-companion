import {ReadRulesVersion,type HomeRevision} from './ids.ts';
/** Home owns read-tool rules independently from the shipped five-field conversation rules. */
export interface ReadRulesValue {
    readonly toolConcurrency:number;
    readonly displayCodePoints:number;
    readonly readTimeoutMs:number;
}
export interface ReadRules {readonly version:ReadRulesVersion;readonly value:ReadRulesValue;}
export interface ReadRulesSnapshot extends ReadRules {readonly revision:HomeRevision;}
export const readRulesDefaults:ReadRulesValue=Object.freeze({toolConcurrency:2,displayCodePoints:12000,readTimeoutMs:10000});
/** 256 code points retain the supported material receipt's required source/ID/bytes/digest notice. */
export const minimumReadDisplayCodePoints=256;
export function validateReadRules(value:unknown):value is ReadRulesValue {
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).length!==3||Object.keys(value).sort().join('|')!=='displayCodePoints|readTimeoutMs|toolConcurrency')return false;
    const keys=['toolConcurrency','displayCodePoints','readTimeoutMs'];
    if(keys.some(key=>{const descriptor=Object.getOwnPropertyDescriptor(value,key);return !descriptor||!('value' in descriptor)||typeof descriptor.value!=='number'||!Number.isSafeInteger(descriptor.value);}))return false;
    if(!('toolConcurrency' in value)||typeof value.toolConcurrency!=='number'||value.toolConcurrency<1||!('displayCodePoints' in value)||typeof value.displayCodePoints!=='number'||value.displayCodePoints<minimumReadDisplayCodePoints||!('readTimeoutMs' in value)||typeof value.readTimeoutMs!=='number'||value.readTimeoutMs<1||value.readTimeoutMs>2147483647)return false;
    return true;
}
export const initialReadRules=():ReadRules=>({version:ReadRulesVersion(1),value:readRulesDefaults});
