/** Pure selection seam for the verifier; no Home or owner capability. */
export function selectCurrentTopicCleanup(inputs,topicVersions,{includeReferencedInstructions=false}={}){
 const sourceIds=[...new Set(topicVersions.flatMap(version=>version.sources.filter(source=>source.ref.kind==='input').map(source=>source.ref.id)))];
 const referenceCandidates=includeReferencedInstructions?inputs.filter(input=>typeof input.text==='string'&&sourceIds.some(id=>input.text.includes(id))).map(input=>input.inputId):[];
 const candidateIds=[...new Set([...sourceIds,...inputs.filter(input=>typeof input.text==='string'&&/映月桥|ROUTE_C58|石篱门|ROUTE_D58/.test(input.text)).map(input=>input.inputId),...referenceCandidates])].sort();
 const sources=[],excluded=[];
 for(const id of candidateIds){
  const input=inputs.find(input=>input.inputId===id);
  if(input?.cleanup){excluded.push({id,reason:'already-cleaned',cleanupRevision:input.cleanup.revision});continue;}
  if(typeof input?.text!=='string'||!input.text.trim().length){excluded.push({id,reason:'empty-or-unavailable-text'});continue;}
  sources.push({kind:'input',id});
 }
 return {selection:{sources,derived:'retain'},candidateCount:candidateIds.length,excluded};
}
