import {FileRulesVersion,type HomeRevision} from './ids.ts';
/** File limits are persistent Home facts. Parallel reads/display retain their existing ReadRules owner. */
export interface FileRulesValue {readonly maxTextBytes:number;readonly listPageSize:number;readonly recursiveEntries:number;readonly operationTimeoutMs:number;}
export interface FileRules {readonly version:FileRulesVersion;readonly value:FileRulesValue;}
export interface FileRulesSnapshot extends FileRules {readonly revision:HomeRevision;}
export const fileRulesDefaults:FileRulesValue=Object.freeze({maxTextBytes:1048576,listPageSize:200,recursiveEntries:1000,operationTimeoutMs:10000});
/** The supported range keeps complete encoded tool results within the existing capture contract. */
export const fileRulesMaximums:FileRulesValue=Object.freeze({maxTextBytes:1048576,listPageSize:1000,recursiveEntries:1000,operationTimeoutMs:2147483647});
export function validateFileRules(value:unknown):value is FileRulesValue {
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).length!==4||Object.keys(value).sort().join('|')!=='listPageSize|maxTextBytes|operationTimeoutMs|recursiveEntries')return false;
    for(const key of ['maxTextBytes','listPageSize','recursiveEntries','operationTimeoutMs'] satisfies readonly (keyof FileRulesValue)[]){const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!('value'in d)||typeof d.value!=='number'||!Number.isSafeInteger(d.value)||d.value<1||d.value>fileRulesMaximums[key])return false;}
    return true;
}
export const initialFileRules=():FileRules=>({version:FileRulesVersion(1),value:fileRulesDefaults});
