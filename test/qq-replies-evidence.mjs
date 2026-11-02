import {mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';
export async function replyEvidence(name,value){const directory=process.env.DSH39_EVIDENCE_DIR;if(!directory)return;await mkdir(directory,{recursive:true});await writeFile(join(directory,name+'.json'),JSON.stringify({caseId:name,...value,externalBusinessCalls:{model:0,web:0,qq:0}},null,2)+'\n');}
