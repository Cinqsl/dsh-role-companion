import type {HomeRevision,ProposalId,KnowledgeId,KnowledgeVersion,OperationId} from './home/ids.ts';
import type {ContextSourceRef} from './home/context-snapshot.ts';
export type {KnowledgeRollbackRequest} from './home/knowledge-owner.ts';
export interface KnowledgeDifferenceRequest{readonly knowledgeId:KnowledgeId;readonly targetVersion:KnowledgeVersion;readonly revision:HomeRevision;}
export interface KnowledgeDifferenceField{readonly field:string;readonly targetExcerpt:string;readonly currentExcerpt:string;readonly targetMore:boolean;readonly currentMore:boolean;}
/** Bounded comparison of original records; their complete bodies use the existing digest-checked reader. */
export interface KnowledgeDifference{readonly revision:HomeRevision;readonly knowledgeId:KnowledgeId;readonly targetVersion:KnowledgeVersion;readonly currentVersion:KnowledgeVersion;readonly targetDigest:string;readonly currentDigest:string;readonly fields:readonly KnowledgeDifferenceField[];readonly preservedCorrections:readonly ContextSourceRef[];}

/** Read-only selectors. No selector grants a model capability or adoption authority. */
export type KnowledgeRecordRef={readonly kind:'proposal';readonly proposalId:ProposalId}|{readonly kind:'version';readonly knowledgeId:KnowledgeId;readonly version:KnowledgeVersion};
export interface KnowledgePageRequest{readonly collection:'proposals'|'versions';readonly offset:number;readonly limit:number;}
export interface KnowledgeRecordSummary{
 readonly ref:KnowledgeRecordRef;readonly proposalId:ProposalId|null;readonly ownerOperationId:OperationId|null;readonly origin:'proposal'|'owner-action';readonly knowledgeId:KnowledgeId|null;readonly version:KnowledgeVersion|null;
 readonly kind:string;readonly topicExcerpt:string;readonly status:string;readonly reasonExcerpt:string;readonly proposalReasonExcerpt:string;
 /** Source references are not an independent-evidence count. Full references remain in the record. */
 readonly sourceCount:number;readonly sourceRefs:readonly ContextSourceRef[];readonly sourcesMore:boolean;
 /** Latest version of this KnowledgeId, not a claim of availability or verified truth. */
 readonly current:boolean|null;readonly committedRevision:HomeRevision;readonly contentDigest:string;readonly totalCodePoints:number;
}
export interface KnowledgePage{readonly revision:HomeRevision;readonly collection:'proposals'|'versions';readonly offset:number;readonly limit:number;readonly total:number;readonly more:boolean;readonly records:readonly KnowledgeRecordSummary[];}
export type KnowledgeLibraryScope='all'|'current'|'historical';
export type KnowledgeLibraryOrder='newest'|'oldest';
/** A management-only query over the complete Home collection; excerpts never grant model access. */
export interface KnowledgeLibraryQuery{
 readonly collection:'proposals'|'versions';readonly offset:number;readonly limit:20|50;
 readonly keyword:string;readonly kind:string;readonly scope:KnowledgeLibraryScope;readonly status:string;
 readonly from:string;readonly to:string;readonly order:KnowledgeLibraryOrder;
}
export interface KnowledgeLibraryRecordSummary{
 readonly ref:KnowledgeRecordRef;readonly origin:'proposal'|'owner-action';readonly knowledgeId:KnowledgeId|null;
 readonly version:KnowledgeVersion|null;readonly kind:string;readonly topicExcerpt:string;readonly textExcerpt:string;
 readonly status:string;readonly reasonExcerpt:string;readonly current:boolean|null;readonly effectiveAt:string|null;
 readonly sourceCount:number;readonly sourceRefs:readonly ContextSourceRef[];readonly sourcesMore:boolean;
 readonly proposalId:ProposalId|null;readonly ownerOperationId:OperationId|null;
 readonly committedRevision:HomeRevision;readonly contentDigest:string;readonly totalCodePoints:number;
}
export interface KnowledgeLibraryPage{
 readonly revision:HomeRevision;readonly collection:'proposals'|'versions';
 readonly offset:number;readonly limit:20|50;readonly range:{readonly start:number;readonly end:number};
 readonly filterKey:string;readonly total:number;readonly more:boolean;readonly nextOffset:number|null;
 readonly records:readonly KnowledgeLibraryRecordSummary[];
}
export interface KnowledgeLibraryDetailRequest{
 readonly ref:KnowledgeRecordRef;readonly revision:HomeRevision;readonly contentDigest:string;
 readonly offset:number;readonly limit:number;
}
export interface KnowledgeLibrarySourceReference{
 readonly ref:ContextSourceRef;readonly quote:string;
}
export interface KnowledgeLibraryOwnerAction{
 readonly operationId:OperationId;readonly fromVersion:KnowledgeVersion;
 readonly reason:string;readonly createdAt:string;
}
/** Readable management projection; raw JSON remains behind the digest-checked record reader. */
export interface KnowledgeLibraryDetail{
 readonly ref:KnowledgeRecordRef;readonly revision:HomeRevision;readonly contentDigest:string;readonly totalCodePoints:number;
 readonly committedRevision:HomeRevision;readonly origin:'proposal'|'owner-action';
 readonly knowledgeId:KnowledgeId|null;readonly version:KnowledgeVersion|null;readonly proposalId:ProposalId|null;
 readonly ownerOperationId:OperationId|null;readonly kind:string;readonly topic:string;readonly text:string;
 readonly offset:number;readonly bodyTotalCodePoints:number;readonly more:boolean;readonly nextOffset:number|null;
 readonly statement:string;readonly scope:string;readonly status:string;readonly current:boolean|null;
 readonly effectiveAt:string|null;readonly proposalReason:string;readonly processingReason:string;
 readonly sources:readonly KnowledgeLibrarySourceReference[];
 readonly preservedCorrections:readonly ContextSourceRef[];
 readonly ownerAction:KnowledgeLibraryOwnerAction|null;
 readonly rollbackOf:{readonly knowledgeId:KnowledgeId;readonly version:KnowledgeVersion}|null;
 readonly difference:KnowledgeDifference|null;
}
export interface KnowledgeRecordRead{readonly ref:KnowledgeRecordRef;readonly revision:HomeRevision;readonly contentDigest:string;readonly offset:number;readonly limit:number;}
export interface KnowledgeRecordPart{readonly ref:KnowledgeRecordRef;readonly revision:HomeRevision;readonly contentDigest:string;readonly text:string;readonly offset:number;readonly totalCodePoints:number;readonly more:boolean;}
