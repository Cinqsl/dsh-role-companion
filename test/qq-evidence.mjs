import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function qqEvidence(caseId,value){
  if(!process.env.DSH_QQ_EVIDENCE_DIR)return;
  await mkdir(process.env.DSH_QQ_EVIDENCE_DIR,{recursive:true});
  await writeFile(join(process.env.DSH_QQ_EVIDENCE_DIR,caseId+'.json'),JSON.stringify({caseId,...value,externalBusinessCalls:{model:0,web:0,qq:0}},null,2)+'\n');
}
