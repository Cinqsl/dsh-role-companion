import {RetryRulesVersion,type HomeRevision} from './ids.ts';
export interface RetryRulesValue {readonly maxAutomaticRetries:number;readonly retryDelayMs:number;}
export interface RetryRules {readonly version:RetryRulesVersion;readonly value:RetryRulesValue;}
export interface RetryRulesSnapshot extends RetryRules {readonly revision:HomeRevision;}
export const retryRulesDefaults:RetryRulesValue=Object.freeze({maxAutomaticRetries:1,retryDelayMs:1000});
export function validateRetryRules(value:unknown):value is RetryRulesValue {
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).length!==2||Object.keys(value).sort().join('|')!=='maxAutomaticRetries|retryDelayMs')return false;
    for(const key of ['maxAutomaticRetries','retryDelayMs']){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor||!('value'in descriptor)||typeof descriptor.value!=='number'||!Number.isSafeInteger(descriptor.value))return false;}
    return 'maxAutomaticRetries'in value&&typeof value.maxAutomaticRetries==='number'&&value.maxAutomaticRetries>=0&&value.maxAutomaticRetries<=1&&'retryDelayMs'in value&&typeof value.retryDelayMs==='number'&&value.retryDelayMs>=1&&value.retryDelayMs<=2147483647;
}
export const initialRetryRules=():RetryRules=>({version:RetryRulesVersion(1),value:retryRulesDefaults});
