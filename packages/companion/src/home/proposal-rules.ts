import {ProposalRulesVersion,type HomeRevision} from './ids.ts';
import {plainExact} from './qq.ts';
export interface ProposalRulesValue {readonly maxRestSuggestionMs:number;}
export interface ProposalRules {readonly version:ProposalRulesVersion;readonly value:ProposalRulesValue;}
export interface ProposalRulesSnapshot extends ProposalRules {readonly revision:HomeRevision;}
export const proposalRulesDefaults:ProposalRulesValue=Object.freeze({maxRestSuggestionMs:86400000});
export function validateProposalRules(value:unknown):value is ProposalRulesValue {return plainExact(value,['maxRestSuggestionMs'])&&typeof value.maxRestSuggestionMs==='number'&&Number.isSafeInteger(value.maxRestSuggestionMs)&&value.maxRestSuggestionMs>=1&&value.maxRestSuggestionMs<=2147483647;}
export const initialProposalRules=():ProposalRules=>({version:ProposalRulesVersion(1),value:proposalRulesDefaults});
