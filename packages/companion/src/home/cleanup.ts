import {createHash} from 'node:crypto';
import {HomeError} from './errors.ts';
import {createContextLineage} from './context-lineage.ts';
import {InputId,ReplyId,AttemptId,OperationId,HomeRevision} from './ids.ts';
import type {ContextSourceRef} from './context-snapshot.ts';
import type {HomeSnapshot} from './index.ts';
import type {ConversationState} from './turns.ts';
import type {KnowledgeRecord} from './knowledge.ts';
import type {QQHistoryState} from './qq-history.ts';
import type {StorageGenerationPointer} from './storage-generation.ts';

export interface CleanupSelection {readonly sources:readonly Exclude<ContextSourceRef,{kind:'core'}|{kind:'knowledge'}>[];readonly derived:'retain'|'remove';}
export interface SourceCleanupMarker {readonly operationId:OperationId;readonly revision:HomeRevision;readonly originalContentDigest:string;readonly originalUtf8Bytes:number;readonly reason:'owner-cleaned';}
export interface CleanupCommand {readonly kind:'cleanup-sources';readonly operationId:OperationId;readonly selection:CleanupSelection;readonly expectedRevision:HomeRevision;readonly previewDigest:string;}
export interface CleanupProgress {readonly operationId:OperationId;readonly phase:'logical-complete'|'purging'|'complete';readonly logicalRevision:HomeRevision;readonly request?:CleanupCommand;readonly requestedPreview?:CleanupPreview;readonly preview:CleanupPreview;readonly storageGeneration?:string;readonly physical:{readonly complete:boolean;readonly purgedFiles?:number;readonly totalFiles?:number};readonly error?:string;}
export interface CleanupWaiting {readonly operationId:OperationId;readonly phase:'waiting-actions';readonly request:CleanupCommand;readonly preview:CleanupPreview;readonly logicalRevision?:never;readonly physical:{readonly complete:false};readonly error?:string;}
export interface CleanupAdmission {readonly request:CleanupCommand;readonly preview:CleanupPreview;commit():Promise<import('./index.ts').HomeReceipt>;release():void;}
export interface CleanupEffect {readonly kind:'input'|'reply'|'tool'|'turn'|'attempt'|'native'|'delivery'|'send-attempt'|'proposal'|'knowledge'|'qq-history'|'autonomy-activity';readonly id:string;readonly version?:number;readonly action:'revoke'|'cancel-pending'|'retain-result-metadata'|'retain-source-marked';}
export interface CleanupPreview {
 readonly revision:HomeRevision;readonly selection:CleanupSelection;readonly digest:string;
 readonly effects:readonly CleanupEffect[];
 readonly quiescingRuns:readonly string[];
 readonly sharedContent:readonly {readonly digest:string;readonly utf8Bytes:number;readonly uses:readonly string[];readonly retainedUses:readonly string[]}[];
 /** Every known authority generation, including the root-inline one a format upgrade left behind. */
 readonly storageGenerations:readonly {readonly id:string;readonly format:'home-v1-inline-and-managed-content'|'role-home-storage-generation-1';readonly disposition:'rewrite-before-purge'|'retained-until-purge'}[];
 readonly externalCopies:readonly ['QQ messages','DSH private storage','external files','independent backups'];
 readonly physical:{readonly phase:'not-started';readonly complete:false};
}
const fail=():never=>{throw new HomeError('INVALID_CLEANUP_SELECTION');};
export const cleanupRefKey=(ref:ContextSourceRef):string=>ref.kind==='core'?'core':ref.kind+':'+ref.id+(ref.kind==='knowledge'?':'+ref.version:'');
export function admitCleanupSelection(value:CleanupSelection):CleanupSelection {
 if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join('|')!=='derived|sources'||!['retain','remove'].includes(value.derived)||!Array.isArray(value.sources)||!value.sources.length||value.sources.length>100)fail();
 const sources=value.sources.map((ref):CleanupSelection['sources'][number]=>{if(!ref||Object.getPrototypeOf(ref)!==Object.prototype||Object.keys(ref).sort().join('|')!=='id|kind')fail();if(ref.kind==='input')return {kind:'input',id:InputId(ref.id)};if(ref.kind==='reply')return {kind:'reply',id:ReplyId(ref.id)};if(ref.kind==='tool')return {kind:'tool',id:AttemptId(ref.id)};return fail();});
 if(new Set(sources.map(cleanupRefKey)).size!==sources.length)fail();
 return {sources:sources.sort((a,b)=>cleanupRefKey(a).localeCompare(cleanupRefKey(b))),derived:value.derived};
}
/**
 * Derived impact is computed from the same Home lineage used by trusted readers.
 * `previousGenerations` names authority that a format upgrade left behind; the cleanup preview must
 * disclose it instead of reporting only the current layout.
 */
export function previewSourceCleanup(snapshot:HomeSnapshot,state:ConversationState,requested:CleanupSelection,history?:QQHistoryState,storage?:StorageGenerationPointer,previousGenerations:readonly string[]=[]):CleanupPreview {
 const selection=admitCleanupSelection(requested),lineage=createContextLineage(snapshot,state);
 const refs:ContextSourceRef[]=[...snapshot.inputs.map(input=>({kind:'input' as const,id:input.inputId})),...state.replies.map(reply=>({kind:'reply' as const,id:reply.replyId})),...state.attempts.filter(attempt=>attempt.kind==='tool').map(attempt=>({kind:'tool' as const,id:attempt.attemptId})),...state.knowledge.versions.map(record=>({kind:'knowledge' as const,id:record.knowledgeId,version:record.version}))];
 for(const ref of selection.sources)if(!refs.some(candidate=>cleanupRefKey(candidate)===cleanupRefKey(ref)))throw new HomeError('CLEANUP_SOURCE_NOT_FOUND');
 for(const ref of selection.sources){const record=ref.kind==='input'?snapshot.inputs.find(record=>record.inputId===ref.id):ref.kind==='reply'?state.replies.find(record=>record.replyId===ref.id):state.attempts.find(record=>record.attemptId===ref.id);if(record?.cleanup)throw new HomeError('CLEANUP_SOURCE_ALREADY_CLEANED');}
 const selected=new Set(selection.sources.map(cleanupRefKey));
 const affected=(ref:ContextSourceRef,seen=new Set<string>()):boolean=>{const key=cleanupRefKey(ref);if(selected.has(key))return true;if(seen.has(key))return false;seen.add(key);const origin=lineage.describe(ref);return [...origin.dependencies,...origin.dataOrigins].some(parent=>affected(parent,seen));};
 const impacted=refs.filter(ref=>affected(ref)),keys=new Set(impacted.map(cleanupRefKey)),effects:CleanupEffect[]=impacted.map(ref=>({kind:ref.kind as 'input'|'reply'|'tool'|'knowledge',id:'id'in ref?ref.id:'',...(ref.kind==='knowledge'?{version:ref.version}:{}),action:ref.kind==='knowledge'&&selection.derived==='retain'?'retain-source-marked':'revoke'}));
 // A source-zero autonomous turn has no inputIds; its actual Native frame records the sources it used.
 const framedTurns=new Set(state.turns.filter(turn=>lineage.frameSources(turn.runId).some(used=>keys.has(cleanupRefKey(used)))).map(turn=>turn.runId));
 const turns=state.turns.filter(turn=>turn.status==='running'||framedTurns.has(turn.runId)||turn.inputIds.some(id=>keys.has('input:'+id))||state.replies.some(reply=>reply.runId===turn.runId&&keys.has('reply:'+reply.replyId))||state.attempts.some(attempt=>attempt.runId===turn.runId&&keys.has('tool:'+attempt.attemptId))),runs=new Set(turns.map(turn=>turn.runId));
 for(const turn of turns)effects.push({kind:'turn',id:turn.runId,action:turn.status==='finished'?'retain-result-metadata':'cancel-pending'});
 for(const attempt of state.attempts.filter(attempt=>runs.has(attempt.runId)))effects.push({kind:'attempt',id:attempt.attemptId,action:'revoke'});
 for(const record of state.nativeRecords.filter(record=>runs.has(record.runId)))effects.push({kind:'native',id:record.nativeId,action:'revoke'});
 for(const delivery of state.deliveries.filter(delivery=>runs.has(delivery.runId)))effects.push({kind:'delivery',id:delivery.deliveryId,action:delivery.status==='pending'?'cancel-pending':'retain-result-metadata'});
 for(const attempt of state.sendAttempts.filter(attempt=>state.deliveries.some(delivery=>delivery.deliveryId===attempt.deliveryId&&runs.has(delivery.runId))))effects.push({kind:'send-attempt',id:attempt.sendAttemptId,action:'retain-result-metadata'});
 for(const proposal of state.knowledge.proposals.filter(proposal=>keys.has('tool:'+proposal.attemptId)||proposal.value.sources.some(source=>keys.has(cleanupRefKey(source.ref)))))effects.push({kind:'proposal',id:proposal.proposalId,action:selection.derived==='retain'?'retain-source-marked':'revoke'});
 // The adopted autonomous decision is a derived Home projection; keep the decision/rest window but revoke its source-bound reason.
 const activity=state.autonomy.activity,activityProposal=activity?state.knowledge.proposals.find(proposal=>proposal.proposalId===activity.proposalId):undefined;
 if(activity&&activityProposal&&(keys.has('tool:'+activityProposal.attemptId)||activityProposal.value.sources.some(source=>keys.has(cleanupRefKey(source.ref)))))effects.push({kind:'autonomy-activity',id:activity.proposalId,action:selection.derived==='retain'?'retain-source-marked':'revoke'});
 for(const query of history?.queries??[])if(cleanupHistoryInputs(snapshot.inputs,selection,query.target).some(input=>query.anchor?.inputId===input.inputId||query.candidates.some(candidate=>candidate.messageId===input.qqSource?.messageId)||query.requests.some(request=>request.outcome?.kind==='response'&&request.outcome.rows.some(row=>row.messageId===input.qqSource?.messageId))))effects.push({kind:'qq-history',id:query.queryId,action:'revoke'});
 effects.sort((a,b)=>(a.kind+':'+a.id+':'+(a.version??0)).localeCompare(b.kind+':'+b.id+':'+(b.version??0)));
 const uses=new Map<string,{text:string;uses:string[];retainedUses:string[]}>();
 for(const [id,text,retained]of [['core:'+snapshot.core.version,snapshot.core.text,true] as const,...snapshot.inputs.map(input=>['input:'+input.inputId,input.text,!keys.has('input:'+input.inputId)] as const),...state.replies.map(reply=>['reply:'+reply.replyId,reply.text,!keys.has('reply:'+reply.replyId)] as const),...state.knowledge.versions.map(record=>['knowledge:'+record.knowledgeId+':'+record.version,record.text,selection.derived==='retain'||!keys.has('knowledge:'+record.knowledgeId+':'+record.version)] as const)]){const digest=createHash('sha256').update(text).digest('hex'),item=uses.get(digest)??{text,uses:[],retainedUses:[]};item.uses.push(id);if(retained)item.retainedUses.push(id);uses.set(digest,item);}
 const sharedContent=[...uses].filter(([,item])=>item.uses.length>1&&item.uses.some(id=>!item.retainedUses.includes(id))).map(([digest,item])=>({digest,utf8Bytes:Buffer.byteLength(item.text,'utf8'),uses:item.uses,retainedUses:item.retainedUses}));
 const value={revision:snapshot.revision,selection,effects,quiescingRuns:state.turns.filter(turn=>turn.status==='running').map(turn=>turn.runId).sort(),sharedContent,// The current generation stays first: it is the one a cleanup rewrites. Everything older follows.
    storageGenerations:storage?[{id:storage.id,format:'role-home-storage-generation-1' as const,disposition:'rewrite-before-purge' as const},{id:'root-inline',format:'home-v1-inline-and-managed-content' as const,disposition:'retained-until-purge' as const},...previousGenerations.filter(id=>id!==storage.id).map(id=>({id,format:'role-home-storage-generation-1' as const,disposition:'retained-until-purge' as const}))]:[{id:'current',format:'home-v1-inline-and-managed-content' as const,disposition:'rewrite-before-purge' as const}],externalCopies:['QQ messages','DSH private storage','external files','independent backups'] as const,physical:{phase:'not-started' as const,complete:false as const}};
 return {...value,digest:createHash('sha256').update(JSON.stringify(value)).digest('hex')};
}

function cleanupHistoryInputs(inputs:HomeSnapshot['inputs'],selection:CleanupSelection,target:import('./qq.ts').QQBinding){return inputs.filter(input=>selection.sources.some(ref=>ref.kind==='input'&&ref.id===input.inputId)&&input.qqSource?.connectionId===target.connectionId&&input.qqSource.accountId===target.accountId&&input.qqSource.peerId===target.peerId);}
/** Home-owned candidate/response copies are revoked with their original source; remote QQ remains outside this task. */
export function cleanupQQHistory(state:QQHistoryState,inputs:HomeSnapshot['inputs'],preview:CleanupPreview,operationId:OperationId,revision:HomeRevision):QQHistoryState {
 const marker=(content:unknown):SourceCleanupMarker=>{const text=typeof content==='string'?content:JSON.stringify(content);return {operationId,revision,originalContentDigest:createHash('sha256').update(text).digest('hex'),originalUtf8Bytes:Buffer.byteLength(text),reason:'owner-cleaned'};};
 return {...state,queries:state.queries.map(query=>{if(!preview.effects.some(effect=>effect.kind==='qq-history'&&effect.id===query.queryId))return query;const revoked=cleanupHistoryInputs(inputs,preview.selection,query.target),ids=new Set(revoked.map(input=>input.qqSource!.messageId));return {...query,
  anchor:query.anchor&&revoked.some(input=>input.inputId===query.anchor!.inputId)?{...query.anchor,text:'',cleanup:marker(query.anchor.text)}:query.anchor,
  candidates:query.candidates.map(candidate=>ids.has(candidate.messageId)?{...candidate,text:'',eligible:false,reason:'QQ_HISTORY_SOURCE_CLEANED',cleanup:marker(candidate.text)}:candidate),
  requests:query.requests.map(request=>{if(!request.outcome)return request;const outcome=request.outcome;if(outcome.kind==='response')return {...request,outcome:{...outcome,responseJSON:'{}',rows:outcome.rows.map(row=>row.messageId&&ids.has(row.messageId)?{...row,kind:'unsupported' as const,text:null,reason:'QQ_HISTORY_SOURCE_CLEANED'}:row)},cleanup:marker(outcome)};const {responseJSON,...retained}=outcome;return {...request,outcome:retained,cleanup:marker(outcome)};}),
 };})};
}

export function admitCleanupCommand(value:CleanupCommand):CleanupCommand {
 if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join('|')!=='expectedRevision|kind|operationId|previewDigest|selection'||value.kind!=='cleanup-sources'||typeof value.previewDigest!=='string'||!/^[a-f0-9]{64}$/.test(value.previewDigest))throw new HomeError('INVALID_CLEANUP_COMMAND');
 return {kind:'cleanup-sources',operationId:OperationId(value.operationId),selection:admitCleanupSelection(value.selection),expectedRevision:HomeRevision(value.expectedRevision),previewDigest:value.previewDigest};
}
export function applyLogicalCleanup(inputs:HomeSnapshot['inputs'],state:ConversationState,preview:CleanupPreview,operationId:OperationId,revision:HomeRevision):{inputs:HomeSnapshot['inputs'];state:ConversationState} {
 const effects=preview.effects,has=(kind:CleanupEffect['kind'],id:string,version?:number)=>effects.find(effect=>effect.kind===kind&&effect.id===id&&(version===undefined||effect.version===version));
 const runs=new Set(effects.filter(effect=>effect.kind==='turn').map(effect=>effect.id));
 if(state.turns.some(turn=>runs.has(turn.runId)&&turn.status!=='finished')||state.attempts.some(attempt=>runs.has(attempt.runId)&&!attempt.outcome)||state.deliveries.some(delivery=>has('delivery',delivery.deliveryId)&&delivery.status==='sending'))throw new HomeError('CLEANUP_WORK_NOT_QUIESCENT');
 const marker=(content:unknown):SourceCleanupMarker=>{const text=typeof content==='string'?content:JSON.stringify(content);return {operationId,revision,originalContentDigest:createHash('sha256').update(text).digest('hex'),originalUtf8Bytes:Buffer.byteLength(text,'utf8'),reason:'owner-cleaned'};};
 return {inputs:inputs.map(input=>has('input',input.inputId)?{...input,text:'',utf8Bytes:0,status:'cancelled' as const,cleanup:marker(input.text)}:input),state:{...state,
  turns:state.turns.map(turn=>has('turn',turn.runId)&&turn.outcome?{...turn,outcome:{...turn.outcome,...('text'in turn.outcome?{text:''}:{})},cleanup:marker(turn.outcome)}:turn),
  replies:state.replies.map(reply=>has('reply',reply.replyId)?{...reply,text:'',cleanup:marker(reply.text)}:reply),
  attempts:state.attempts.map(attempt=>{if(!has('attempt',attempt.attemptId))return attempt;const {observation,materials,proposal,...rest}=attempt;return {...rest,...(rest.outcome?{outcome:{kind:rest.outcome.kind,...(rest.outcome.code?{code:rest.outcome.code}:{}),...(rest.outcome.modelFailure?{modelFailure:rest.outcome.modelFailure}:{})}}:{}),cleanup:marker(attempt)};}),
  nativeRecords:state.nativeRecords.map(record=>has('native',record.nativeId)?{...record,data:{kind:'source-cleaned'},cleanup:marker(record.data)}:record),
  deliveries:state.deliveries.map(delivery=>has('delivery',delivery.deliveryId)?{...delivery,text:'',status:delivery.status==='pending'?'cancelled':delivery.status,cleanup:marker(delivery.text)}:delivery),
  sendAttempts:state.sendAttempts.map(attempt=>{if(!has('send-attempt',attempt.sendAttemptId)||!attempt.observation)return attempt;const observation=attempt.observation;return {...attempt,observation:observation.kind==='confirmed'?{kind:observation.kind,messageId:observation.messageId,evidence:{kind:'source-cleaned'}}:{kind:observation.kind,code:observation.code},cleanup:marker(observation)};}),
  deliveryResolutions:state.deliveryResolutions.map(resolution=>has('delivery',resolution.deliveryId)?{...resolution,note:'',cleanup:marker(resolution.note)}:resolution),
  knowledge:{...state.knowledge,
   proposals:state.knowledge.proposals.map(proposal=>has('proposal',proposal.proposalId)?.action==='revoke'?{...proposal,value:{...proposal.value,topic:'',text:'',reason:'',scope:'',sources:[]},cleanup:marker(proposal.value)}:proposal),
   versions:state.knowledge.versions.map((record):KnowledgeRecord=>{if(has('knowledge',record.knowledgeId,record.version)?.action!=='revoke')return record;const cleared={topic:'',text:'',reason:'',scope:'',sources:[],cleanup:marker(record)};return record.ownerAction?{...record,...cleared,ownerAction:{...record.ownerAction,reason:''}}:{...record,...cleared};}),
  },
  ...(has('autonomy-activity',state.autonomy.activity?.proposalId??'')?.action==='revoke'?{autonomy:{...state.autonomy,activity:{...state.autonomy.activity!,reason:''}}}:{}),
 }};
}
