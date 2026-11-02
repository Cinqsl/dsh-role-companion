import type {RunId} from './ids.ts';
import type {ConversationState,ConversationSettings} from './turns.ts';
export interface ResourceCounts {readonly model:number;readonly tool:number;readonly web:number;}
/** A read projection of the same Home attempts, never another counter or allowance. */
export interface ConversationBudgetView {
    readonly runId:RunId|null;readonly source:'user'|'autonomous';readonly status:'none'|'running'|'suspended'|'finished';readonly deadline:string|null;
    readonly configured:ConversationSettings;readonly effectiveLimit:ResourceCounts;readonly used:ResourceCounts;readonly remaining:ResourceCounts;
    readonly chargedRetries:number;readonly knownLogicalOperations:number;readonly legacyModelAttempts:number;readonly web:'available';
}
export function conversationBudgetView(state:ConversationState):ConversationBudgetView {
    const turn=state.turns.find(x=>x.source==='user'&&x.status==='running')??state.turns.filter(x=>x.source==='user').at(-1),attempts=turn?state.attempts.filter(x=>x.runId===turn.runId):[],models=attempts.filter(x=>x.kind==='model');
    const configured=state.rules.value,effectiveLimit={model:configured.modelLimit,tool:configured.toolLimit,web:configured.webLimit},used={model:models.length,tool:attempts.filter(x=>x.kind==='tool').length,web:attempts.filter(x=>x.kind==='web').length};
    return {runId:turn?.runId??null,source:'user',status:turn?.status??'none',deadline:turn?.deadline??null,configured,effectiveLimit,used,remaining:{model:Math.max(0,effectiveLimit.model-used.model),tool:Math.max(0,effectiveLimit.tool-used.tool),web:Math.max(0,effectiveLimit.web-used.web)},chargedRetries:models.filter(x=>x.modelOperation?.ordinal===1).length,knownLogicalOperations:new Set(models.flatMap(x=>x.modelOperation?[x.modelOperation.logicalOpId]:[])).size,legacyModelAttempts:models.filter(x=>!x.modelOperation).length,web:'available'};
}
