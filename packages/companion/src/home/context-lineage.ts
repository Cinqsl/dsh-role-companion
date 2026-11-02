import {activeKnowledgeVersions,knowledgeSourceRequirements} from './knowledge-owner.ts';
import {contextTextDigest} from './context-digest.ts';
import {archivedFileContentAllowed} from './file-access.ts';
import type {HomeSnapshot} from './index.ts';
import type {AttemptRecord,ConversationState} from './turns.ts';
import type {KnowledgeRecord} from './knowledge.ts';
import type {ContextSourceRef,ContextSourceLineage} from './context-snapshot.ts';
import {contextField as field,contextObject as object,contextToolParts} from './context-tools.ts';
import type {BindingId,BindingVersion} from './ids.ts';
export function contextBindingAllowed(snapshot:HomeSnapshot,id:BindingId,version:BindingVersion):boolean{return id===snapshot.panelBinding.bindingId&&version===snapshot.panelBinding.bindingVersion||snapshot.qqBinding?.bindingId===id&&snapshot.qqBinding.version===version;}
const refKey=(ref:ContextSourceRef)=>ref.kind==='core'?'core':ref.kind+':'+ref.id+(ref.kind==='knowledge'?':'+ref.version:'');
/** Trailing whitespace is not meaning: match directUserReport, which adopts a report whose only difference is the final newline. */
const sameReportText=(left:string,right:string)=>left.trimEnd()===right.trimEnd();
/** Home facts determine transitive use, never self-reported IDs in user/model text. */
export function createContextLineage(snapshot:HomeSnapshot,conversation:ConversationState){
 const activeKnowledge=activeKnowledgeVersions(conversation.knowledge);
 const attempts=conversation.attempts,index=new Map(attempts.map((attempt,index)=>[attempt.attemptId,index])),cache=new Map<string,ContextSourceLineage>(),intrinsic=new Map<string,{available:boolean;current:boolean}>(),visiting=new Set<string>();
 const request=(attempt:AttemptRecord)=>field(attempt.outcome?.data,'request');
 const session=(attempt:AttemptRecord)=>attempt.kind==='model'?field(request(attempt),'sessionId'):field(field(request(attempt),'native'),'sessionId');
 const sameSession=(left:AttemptRecord,right:AttemptRecord)=>typeof session(left)!=='string'||typeof session(right)!=='string'||session(left)===session(right);
 const contributesToolEvidence=(attempt:AttemptRecord)=>attempt.kind==='tool'&&attempt.outcome?.kind!=='not-dispatched';
 const turnFor=(runId:AttemptRecord['runId'])=>conversation.turns.find(turn=>turn.runId===runId);
 const unique=(refs:readonly ContextSourceRef[])=>[...new Map(refs.map(ref=>[refKey(ref),ref])).values()];
 function sourceRef(value:unknown):ContextSourceRef|undefined{
  if(!object(value))return;
  if(value.kind==='core')return {kind:'core'};
  if(value.kind==='knowledge'){const record=conversation.knowledge.versions.find(record=>record.knowledgeId===value.id&&record.version===value.version);if(record)return {kind:'knowledge',id:record.knowledgeId,version:record.version};}
  if(value.kind==='input'){const input=snapshot.inputs.find(input=>input.inputId===value.id);if(input)return {kind:'input',id:input.inputId};}
  if(value.kind==='reply'){const reply=conversation.replies.find(reply=>reply.replyId===value.id);if(reply)return {kind:'reply',id:reply.replyId};}
  if(value.kind==='tool'){const attempt=attempts.find(attempt=>attempt.kind==='tool'&&attempt.attemptId===value.id);if(attempt)return {kind:'tool',id:attempt.attemptId};}
 }
 function frameRefs(model:AttemptRecord|undefined,kind:'selected'|'granted'):{refs:ContextSourceRef[];known:boolean}{
  const manifest=model?field(request(model),'contextManifest'):undefined,raw=field(manifest,kind);
  if(Array.isArray(raw)){const refs=raw.map(sourceRef);return {refs:refs.filter((ref):ref is ContextSourceRef=>!!ref),known:refs.every(Boolean)};}
  if(kind==='granted')return {refs:[],known:false};
  const inputIds=field(manifest,'inputIds');if(Array.isArray(inputIds)){const refs=inputIds.map(id=>sourceRef({kind:'input',id}));return {refs:refs.filter((ref):ref is ContextSourceRef=>!!ref),known:refs.every(Boolean)};}
  // Legacy local-only frames and trusted non-Native ports still have actual turn inputs.
  return {refs:[],known:true};
 }
 function modelsBefore(runId:AttemptRecord['runId'],limit:number,anchor?:AttemptRecord){return attempts.filter(model=>model.kind==='model'&&model.runId===runId&&(index.get(model.attemptId)??0)<limit&&(!anchor||sameSession(model,anchor)));}
 function toolOrigins(attempt:AttemptRecord,model:AttemptRecord|undefined):{refs:ContextSourceRef[];known:boolean;scopeBounded:boolean}{
  const parts=contextToolParts(attempt,conversation);if(parts.name==='role_propose'){const proposal=conversation.knowledge.proposals.find(p=>p.attemptId===attempt.attemptId);return {refs:proposal?.value.sources.map(source=>source.ref)??[],known:!!proposal,scopeBounded:false};}if(parts.name!=='role_read')return {refs:[],known:true,scopeBounded:false};
  const args=field(parts.request,'arguments');if(!object(args))return {refs:[],known:false,scopeBounded:false};
  if(args.source==='core')return {refs:[],known:true,scopeBounded:false};
  if(args.source==='knowledge'){const ref=sourceRef({kind:'knowledge',id:args.id,version:args.version});return {refs:ref?[ref]:[],known:!!ref,scopeBounded:false};}
  if(args.source==='input'||args.source==='reply'||args.source==='tool'){const ref=sourceRef({kind:args.source,id:args.id});return {refs:ref?[ref]:[],known:!!ref,scopeBounded:false};}
  if(args.source==='experience'){const input=snapshot.inputs.find(input=>input.experienceId===args.id);const reply=conversation.replies.find(reply=>reply.experienceId===args.id);return {refs:input?[{kind:'input',id:input.inputId}]:reply?[{kind:'reply',id:reply.replyId}]:[],known:!!input||!!reply,scopeBounded:false};}
  if(args.source==='material'){const parent=attempts.find(parent=>parent.kind==='tool'&&parent.materials?.some(material=>material.materialId===args.id));return {refs:parent?[{kind:'tool',id:parent.attemptId}]:[],known:!!parent,scopeBounded:false};}
  if(args.source==='query'){
   const value=attempt.observation?.kind==='returned'?attempt.observation.value:undefined;
   if(field(value,'offset')===0&&field(value,'more')===false&&typeof field(value,'text')==='string')try{const data:unknown=JSON.parse(String(field(value,'text'))),raw=field(data,'sources');if(Array.isArray(raw)){const refs=raw.map(source=>sourceRef(field(source,'ref')));return {refs:refs.filter((ref):ref is ContextSourceRef=>!!ref),known:refs.every(Boolean),scopeBounded:false};}}catch{}
   const granted=frameRefs(model,'granted');return {refs:granted.refs,known:granted.known,scopeBounded:true};
  }
  return {refs:[],known:false,scopeBounded:false};
 }
 // Only an entire identical original utterance proves this extractive memory on its own.
 // Summaries and non-extractive choices keep their original full evidence requirements.
 function knowledgeRequirements(record:KnowledgeRecord):readonly ContextSourceRef[]{
  const required=knowledgeSourceRequirements(record);
  if(record.kind!=='memory'||record.statement!=='user-report'||record.sources.length<2||!record.sources.every(source=>source.ref.kind==='input'&&sameReportText(source.quote,record.text)))return required;
  const complete=record.sources.filter(source=>{const ref=source.ref;if(ref.kind!=='input')return false;const input=snapshot.inputs.find(input=>input.inputId===ref.id);return !!input&&sameReportText(input.text,record.text)&&describe(ref).availableForDaily&&record.sourceBasis?.some(basis=>refKey(basis.ref)===refKey(ref)&&basis.contentDigest===contextTextDigest(input.text));});
  return complete.length?[...complete.map(source=>source.ref),...(record.preservedCorrections??[])]:required;
 }
 function independentUserReport(record:KnowledgeRecord):boolean{
  return record.kind==='memory'&&record.statement==='user-report'&&record.sources.every(source=>source.ref.kind==='input'&&sameReportText(source.quote,record.text))&&record.sources.some(source=>{
   const ref=source.ref;if(ref.kind!=='input')return false;const input=snapshot.inputs.find(input=>input.inputId===ref.id);
   return !!input&&sameReportText(input.text,record.text)&&describe(ref).availableForDaily&&!!record.sourceBasis?.some(basis=>refKey(basis.ref)===refKey(ref)&&basis.contentDigest===contextTextDigest(input.text));
  });
 }
 /** Content provenance precedes adoption; following the proposal result itself would point back here. */
 function knowledgeOrigin(record:KnowledgeRecord):{refs:ContextSourceRef[];models:AttemptRecord[];known:boolean;available:boolean}{
  const required=knowledgeRequirements(record);
  if(independentUserReport(record))return {refs:[...required],models:[],known:true,available:true};
  let original:KnowledgeRecord|undefined=record;const owners=new Set<string>();
  while(original?.ownerAction){const key=refKey({kind:'knowledge',id:original.knowledgeId,version:original.version});if(owners.has(key))return {refs:[...required],models:[],known:false,available:false};owners.add(key);const target:NonNullable<KnowledgeRecord['rollbackOf']>=original.rollbackOf;original=conversation.knowledge.versions.find(previous=>previous.knowledgeId===target.knowledgeId&&previous.version===target.version);}
  const proposal=original?.proposalId?conversation.knowledge.proposals.find(proposal=>proposal.proposalId===original.proposalId):undefined;
  const attempt=proposal&&attempts.find(attempt=>attempt.kind==='tool'&&attempt.attemptId===proposal.attemptId),turn=attempt&&turnFor(attempt.runId);
  if(!attempt||!proposal||!turn)return {refs:[...required],models:[],known:false,available:false};
  const models=modelsBefore(attempt.runId,index.get(attempt.attemptId)??0,attempt),refs:ContextSourceRef[]=[...required,...turn.inputIds.map(id=>({kind:'input' as const,id}))];let known=true;
  for(const model of models){const used=frameRefs(model,'selected');refs.push(...used.refs);known&&=used.known;}
  refs.push(...attempts.filter(prior=>contributesToolEvidence(prior)&&prior.runId===attempt.runId&&(index.get(prior.attemptId)??0)<(index.get(attempt.attemptId)??0)&&sameSession(prior,attempt)).map(prior=>({kind:'tool' as const,id:prior.attemptId})));
  // A newer version may use its own earlier content. Keep that content's real sources,
  // rather than requiring the superseded body to remain a current daily selection.
  const historical=new Map<string,boolean>(),checking=new Set<string>(),expanding=new Set<string>(),expanded=new Map<string,readonly ContextSourceRef[]>();
  const ownEarlier=(ref:ContextSourceRef)=>ref.kind==='knowledge'&&ref.id===record.knowledgeId&&ref.version<record.version;
  const hasEarlier=(ref:ContextSourceRef):boolean=>{const key=refKey(ref),found=historical.get(key);if(found!==undefined)return found;if(ownEarlier(ref))return true;if(checking.has(key))return false;checking.add(key);const foundEarlier=describe(ref).dependencies.some(hasEarlier);checking.delete(key);historical.set(key,foundEarlier);return foundEarlier;};
  const protectedRef=(ref:ContextSourceRef)=>record.preservedCorrections?.some(correction=>refKey(correction)===refKey(ref));
  const contentRefs=(ref:ContextSourceRef):ContextSourceRef[]=>{
   const key=refKey(ref);if(key===refKey({kind:'knowledge',id:record.knowledgeId,version:record.version})){known=false;return [];}
   const cached=expanded.get(key);if(cached)return [...cached];
   if(protectedRef(ref)||!hasEarlier(ref)){const result=[ref];expanded.set(key,result);return result;}if(expanding.has(key)){known=false;return [ref];}expanding.add(key);
   const source=describe(ref),facts=intrinsic.get(key),prior=ref.kind==='tool'?conversation.knowledge.proposals.find(p=>p.attemptId===ref.id)?.processing:undefined;
   const previousProposal=prior?.knowledgeId===record.knowledgeId&&typeof prior.version==='number'&&prior.version<record.version;
   const result=unique(facts?.available&&(facts.current||ownEarlier(ref)||previousProposal)?source.dependencies.flatMap(contentRefs):[ref]);expanding.delete(key);expanded.set(key,result);return [...result];
  };
  return {refs:unique(refs.flatMap(contentRefs)),models,known,available:!attempt.cleanup&&!proposal.cleanup&&contextToolParts(attempt,conversation).complete&&contextBindingAllowed(snapshot,turn.bindingId,turn.bindingVersion)};
 }
 function describe(ref:ContextSourceRef):ContextSourceLineage{
  const key=refKey(ref),found=cache.get(key);if(found)return found;
  const unavailable:ContextSourceLineage={dependencies:[],dataOrigins:[],modelAttempts:[],lineage:'unavailable',derivedRead:false,availableForDaily:false};
  if(visiting.has(key))return unavailable;visiting.add(key);
  let dependencies:ContextSourceRef[]=[],dataOrigins:ContextSourceRef[]=[],models:AttemptRecord[]=[],known=true,base=true,current=true,scopeBounded=false,derivedRead=false;
  if(ref.kind==='knowledge'){const record=conversation.knowledge.versions.find(record=>record.knowledgeId===ref.id&&record.version===ref.version);base=!!record&&!record.cleanup;current=!!record&&activeKnowledge.includes(record);if(record){if(record.sources.some(source=>source.ref.kind==='core'))base&&=record.sourceBasis?.some(source=>source.ref.kind==='core'&&source.contentDigest===contextTextDigest(snapshot.core.text))??false;const origin=knowledgeOrigin(record);base&&=origin.available;known&&=origin.known;models=origin.models;dependencies.push(...origin.refs);dataOrigins=record.sources.map(source=>source.ref);derivedRead=record.kind==='summary';}}
  else if(ref.kind==='input'){const input=snapshot.inputs.find(input=>input.inputId===ref.id);base=!!input&&contextBindingAllowed(snapshot,input.bindingId,input.bindingVersion)&&(input.status==='resolved'||input.status==='running');}
  else if(ref.kind==='reply'){
   const reply=conversation.replies.find(reply=>reply.replyId===ref.id),turn=reply&&turnFor(reply.runId);base=!!reply&&!reply.cleanup&&!!turn&&contextBindingAllowed(snapshot,reply.bindingId,reply.bindingVersion);
   if(turn){dependencies.push(...turn.inputIds.map(id=>({kind:'input' as const,id})));const last=attempts.findLast(model=>model.kind==='model'&&model.runId===turn.runId);models=modelsBefore(turn.runId,Number.MAX_SAFE_INTEGER,last);for(const model of models){const used=frameRefs(model,'selected');dependencies.push(...used.refs);known&&=used.known;}const before=last?(index.get(last.attemptId)??Number.MAX_SAFE_INTEGER):Number.MAX_SAFE_INTEGER;dependencies.push(...attempts.filter(tool=>contributesToolEvidence(tool)&&tool.runId===turn.runId&&(index.get(tool.attemptId)??0)<before&&(!last||sameSession(tool,last))).map(tool=>({kind:'tool' as const,id:tool.attemptId})));}
  }else if(ref.kind==='tool'){
   const attempt=attempts.find(attempt=>attempt.kind==='tool'&&attempt.attemptId===ref.id);if(!attempt)base=false;
   else{const parts=contextToolParts(attempt,conversation);base=parts.complete&&contextBindingAllowed(snapshot,parts.turn.bindingId,parts.turn.bindingVersion);if(parts.name==='role_file')base&&=archivedFileContentAllowed(conversation.fileAccess.value,field(field(parts.request,'arguments'),'scope'));dependencies.push(...parts.turn.inputIds.map(id=>({kind:'input' as const,id})));models=modelsBefore(attempt.runId,index.get(attempt.attemptId)??0,attempt);for(const model of models){const used=frameRefs(model,'selected');dependencies.push(...used.refs);known&&=used.known;}dependencies.push(...attempts.filter(tool=>contributesToolEvidence(tool)&&tool.runId===attempt.runId&&(index.get(tool.attemptId)??0)<(index.get(attempt.attemptId)??0)&&sameSession(tool,attempt)).map(tool=>({kind:'tool' as const,id:tool.attemptId})));if(parts.name==='role_propose'){const proposal=conversation.knowledge.proposals.find(p=>p.attemptId===attempt.attemptId),processed=proposal?.processing;base&&=!!processed&&['adopted','unchanged'].includes(processed.status);current=!conversation.knowledge.versions.some(version=>version.knowledgeId===processed?.knowledgeId&&version.version>(processed?.version??0));if(processed?.knowledgeId&&processed.version)dependencies.push({kind:'knowledge',id:processed.knowledgeId,version:processed.version});}const origins=toolOrigins(attempt,models.at(-1));dataOrigins=origins.scopeBounded?[]:origins.refs;dependencies.push(...origins.refs);known&&=origins.known;if(parts.name==='role_read'&&attempt.observation?.kind==='returned'){const qualifiers=field(attempt.observation.value,'qualifiers');if(typeof qualifiers==='string')try{const parsed:unknown=JSON.parse(qualifiers),sources=field(parsed,'sources');if(!Array.isArray(sources))known=false;else{const refs=sources.map(source=>sourceRef(field(source,'ref')));known&&=refs.every(Boolean);const qualified=refs.filter((ref):ref is ContextSourceRef=>!!ref);dependencies.push(...qualified);dataOrigins=[...dataOrigins,...qualified];}}catch{known=false;}}scopeBounded=origins.scopeBounded;derivedRead=parts.name==='role_read'||parts.name==='role_propose'||parts.name==='role_file';}
  }
  dependencies=unique(dependencies);intrinsic.set(key,{available:base&&known,current});const result:ContextSourceLineage={dependencies,dataOrigins:unique(dataOrigins),modelAttempts:models.map(model=>model.attemptId),lineage:known?scopeBounded?'scope-bounded':'known':'unavailable',derivedRead,availableForDaily:base&&current&&known&&dependencies.every(dependency=>describe(dependency).availableForDaily)};visiting.delete(key);cache.set(key,result);return result;
 }
 const frameCache=new Map<string,readonly ContextSourceRef[]>();
 /** Every actual model frame of a run names the sources it really used; a source-zero autonomous turn has no inputIds. */
 function frameSources(runId:AttemptRecord['runId']):readonly ContextSourceRef[]{
  const key=String(runId),found=frameCache.get(key);if(found)return found;
  const refs=unique(attempts.filter(attempt=>attempt.kind==='model'&&attempt.runId===runId).flatMap(attempt=>frameRefs(attempt,'selected').refs));
  frameCache.set(key,refs);return refs;
 }
 return {describe,frameSources};
}
