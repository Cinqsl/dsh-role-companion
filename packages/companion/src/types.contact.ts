import type {ContactRules} from './home/contact-rules.ts';
import type {ContactIntentState} from './home/contact.ts';
import type {ContactIntentId,ContactRulesVersion,HomeRevision,OperationId,ProposalId,KnowledgeId,KnowledgeVersion,RunId,BindingVersion,RoleId} from './home/ids.ts';
import type {ContactRulesValue} from './home/contact-rules.ts';
import type {DeliveryId} from './home/deliveries.ts';
export interface ContactRulesEditRequest {readonly operationId:OperationId;readonly value:ContactRulesValue;readonly expectedContactRulesVersion:ContactRulesVersion;readonly expectedRevision:HomeRevision;}
export interface ContactUsageView {
 readonly dayWindowId:string|null;readonly dayUsed:number;readonly dailyLimit:number;
 readonly roundRunId:RunId|null;readonly roundUsed:number;readonly perRoundLimit:number;
 readonly cooldownRemainingMs:number;readonly lastReservedAt:string|null;readonly quietHoursActive:boolean;
}
export interface ContactIntentSummary {
 readonly intentId:ContactIntentId;readonly state:ContactIntentState;readonly runId:RunId;readonly proposalId:ProposalId;
 readonly knowledgeId:KnowledgeId;readonly knowledgeVersion:KnowledgeVersion;readonly createdAt:string;readonly committedRevision:HomeRevision;
 readonly deliveryId:DeliveryId|null;readonly deliveryStatus:string|null;readonly closedReason:string|null;readonly supersededBy:ContactIntentId|null;
 readonly contentDigest:string;readonly textExcerpt:string;readonly totalCodePoints:number;
}
export interface ContactView {
 readonly roleId:RoleId;readonly bindingVersion:BindingVersion;readonly revision:HomeRevision;readonly rules:ContactRules;
 readonly usage:ContactUsageView;
 /** Separately reported reasons, never collapsed into one enum. */
 readonly blockedReasons:readonly string[];
 readonly intents:readonly ContactIntentSummary[];readonly totalIntents:number;
 readonly ruleEffect:'next-contact-attempt';
 /** Honest scope of this ticket: mechanism verified; real autonomous choice quality remains G2. */
 readonly deliveryPath:'mechanism-verified-real-choice-not-run';
}
export interface ContactIntentRead {readonly intentId:ContactIntentId;readonly revision:HomeRevision;readonly contentDigest:string;readonly offset:number;readonly limit:number;}
export interface ContactIntentPart {readonly intentId:ContactIntentId;readonly revision:HomeRevision;readonly contentDigest:string;readonly text:string;readonly offset:number;readonly totalCodePoints:number;readonly more:boolean;}
