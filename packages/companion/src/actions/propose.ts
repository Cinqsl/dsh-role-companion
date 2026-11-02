import {parseKnowledgeProposal,type KnowledgeProposal} from '../home/knowledge.ts';
import type {ProposalId,AttemptId} from '../home/ids.ts';
import type {IssuedToolAttempt} from '../runtime/execution.ts';
export interface RoleProposeValue {readonly proposalId:ProposalId;readonly toolAttemptId:AttemptId;readonly status:'pending-final';}
export interface RoleProposeCapability {check(value:KnowledgeProposal):Promise<void>;}
export const parseRolePropose=parseKnowledgeProposal;
export async function executeRolePropose(value:KnowledgeProposal,capability:RoleProposeCapability,attempt:IssuedToolAttempt,signal:AbortSignal):Promise<RoleProposeValue>{
 await capability.check(value);await attempt.enter();let started=false,result:RoleProposeValue;
 try{result=await attempt.invoke(signal,()=>{started=true;if(!attempt.proposal)throw Object.assign(new Error('PROPOSAL_PERMISSION_REQUIRED'),{code:'PROPOSAL_PERMISSION_REQUIRED'});return attempt.proposal.save(value);});}catch(error){if(started)await attempt.observe({kind:'threw',code:'PROPOSAL_SAVE_FAILED'});throw error;}
 await attempt.observe({kind:'returned',value:result});return result;
}
