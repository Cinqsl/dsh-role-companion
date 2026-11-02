import {assessKnowledgeProposal,type KnowledgeProposal,type ProposalAssessment} from '../home/knowledge.ts';
import type {ContextSnapshotReader} from '../home/context-snapshot.ts';
import type {InputRecord} from '../home/inputs.ts';
/** Read-only interpretation; no model request, adoption or persistent progress lives here. */
export async function checkKnowledgeProposal(value:KnowledgeProposal,reader:ContextSnapshotReader,inputs:readonly InputRecord[]):Promise<ProposalAssessment>{
 const sources=[];for(const quote of value.sources)sources.push(await reader.read(quote.ref));return assessKnowledgeProposal(value,sources,inputs);
}
