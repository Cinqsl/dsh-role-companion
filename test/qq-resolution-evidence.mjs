import {mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
export async function resolutionEvidence(name,value){if(!process.env.DSH40_EVIDENCE_DIR)return;const dir=resolve(process.env.DSH40_EVIDENCE_DIR);await mkdir(dir,{recursive:true});await writeFile(resolve(dir,name+'.json'),JSON.stringify({...value,realBusiness:{model:0,web:0,qq:0}},null,2)+'\n');}
