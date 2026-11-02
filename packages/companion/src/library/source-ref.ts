import type {ContextSourceRef} from '../home/context-snapshot.ts';
import type {KnowledgeRecordRef} from '../types.knowledge.ts';
import type {LibraryOverviewTarget} from '../types.library.overview.ts';

export const librarySourceLabels:Readonly<Record<'core'|'input'|'reply',string>>={
  core:'核心设定',
  input:'用户来信',
  reply:'角色回复',
};

export function knowledgeRecordRefTechnical(ref:KnowledgeRecordRef):string {
  return ref.kind==='proposal'
    ?`proposal/${ref.proposalId}`
    :`knowledge/${ref.knowledgeId}/v${ref.version}`;
}

export function contextSourceRefDescriptor(ref:ContextSourceRef):{
  readonly label:string;
  readonly technical:string;
  readonly key:string;
  readonly target:LibraryOverviewTarget;
} {
  const key=JSON.stringify(ref);
  switch(ref.kind){
    case 'core':
      return {label:librarySourceLabels.core,technical:'core',key,target:{view:'sources',ref}};
    case 'input':
      return {label:librarySourceLabels.input,technical:`input/${ref.id}`,key,target:{view:'sources',ref}};
    case 'reply':
      return {label:librarySourceLabels.reply,technical:`reply/${ref.id}`,key,target:{view:'sources',ref}};
    case 'tool':
      return {label:'工具执行',technical:`tool/${ref.id}`,key,target:{view:'executions',collection:'tools'}};
    case 'knowledge':
      return {
        label:'知识版本',
        technical:`knowledge/${ref.id}/v${ref.version}`,
        key,
        target:{view:'knowledge',collection:'versions',ref:{kind:'version',knowledgeId:ref.id,version:ref.version}},
      };
    default: {
      const unreachable:never=ref;
      return unreachable;
    }
  }
}

export const contextSourceRefLabel=(ref:ContextSourceRef):string=>contextSourceRefDescriptor(ref).label;
export const contextSourceRefTechnical=(ref:ContextSourceRef):string=>contextSourceRefDescriptor(ref).technical;
export const contextSourceRefKey=(ref:ContextSourceRef):string=>contextSourceRefDescriptor(ref).key;
export const contextSourceRefTarget=(ref:ContextSourceRef):LibraryOverviewTarget=>contextSourceRefDescriptor(ref).target;
