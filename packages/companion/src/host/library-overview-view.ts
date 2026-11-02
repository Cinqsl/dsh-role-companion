import type {ContextSnapshotReader,ContextSourceMetadata} from '../home/context-snapshot.ts';
import type {HomeSnapshot} from '../home/index.ts';
import type {KnowledgeSnapshot} from '../home/knowledge.ts';
import type {ConversationSnapshot} from '../home/turns.ts';
import type {RoleView} from '../runtime/index.ts';
import type {LibrarySourceSummary} from '../types.library.sources.ts';
import type {
  LibraryOverview,
  LibraryOverviewAction,
  LibraryOverviewRecent,
} from '../types.library.overview.ts';
import {nativeRecordSummary} from './library-execution-view.ts';
import {boundedPreview} from './library-preview.ts';
import {librarySourceTime} from './library-source-time.ts';
import {queryKnowledgeLibrary} from './library-knowledge-view.ts';
import {contextSourceRefDescriptor} from '../library/source-ref.ts';

export interface LibraryRuntimeHealth {
  readonly archivePending:number;
  readonly archiveFault:string;
  readonly executionFault:string;
  readonly lifecycleFault:string;
  readonly blockedTurnReason:string;
}

export interface LibraryOverviewData {
  readonly snapshot:HomeSnapshot;
  readonly conversation:ConversationSnapshot;
  readonly knowledge:KnowledgeSnapshot;
  readonly sources:readonly ContextSourceMetadata[];
  readonly recentSources:readonly LibrarySourceSummary[];
  readonly health:LibraryRuntimeHealth;
}

export interface LibraryOverviewFacts extends LibraryOverviewData {
  readonly view:RoleView;
}

export async function readLibraryOverviewSources(reader:ContextSnapshotReader):Promise<{
  readonly sources:readonly ContextSourceMetadata[];
  readonly recentSources:readonly LibrarySourceSummary[];
}> {
  if(reader.purpose!=='management')throw new Error('INVALID_CONTEXT_PURPOSE');
  const sources=await reader.list();
  const recentMetadata=sources
    .filter(source=>source.ref.kind==='input'||source.ref.kind==='reply')
    .sort((left,right)=>(librarySourceTime(right)??'').localeCompare(librarySourceTime(left)??''))
    .slice(0,6);
  const recentSources:LibrarySourceSummary[]=[];
  for(const source of recentMetadata){
    let text='';
    try {
      text=(await reader.read(source.ref)).text;
    } catch(error) {
      if(!error||typeof error!=='object'||!('code'in error)||error.code!=='CONTEXT_SOURCE_CLEANED')throw error;
    }
    recentSources.push({
      source:source as LibrarySourceSummary['source'],
      preview:source.cleanup?'正文已清理，保留清理结果。':boundedPreview(text,160,'正文为空'),
      occurredAt:librarySourceTime(source),
    });
  }
  return {sources,recentSources};
}

export function projectLibraryOverview(facts:LibraryOverviewFacts):LibraryOverview {
  const actions:LibraryOverviewAction[]=[];
  const runningTurns=facts.conversation.turns.filter(turn=>turn.status==='running').length;
  const openAttempts=facts.conversation.attempts.filter(attempt=>!attempt.outcome).length;
  const executionCount=Math.max(runningTurns,openAttempts);
  if(executionCount){
    actions.push({
      id:'execution-unclosed',
      kind:'execution',
      reason:`${executionCount} 项执行尚未闭合`,
      impact:'执行记录尚未取得最终结果，相关内容可能仍在写入。',
      actionLabel:'查看执行记录',
      target:{view:'executions',collection:'tools'},
    });
  }

  const nativeGap=facts.conversation.nativeRecords.find(record=>nativeRecordSummary(record).status==='gap');
  const archiveGapCount=facts.health.archivePending+(nativeGap?1:0);
  if(archiveGapCount){
    actions.push({
      id:'archive-gap',
      kind:'archive-gap',
      reason:`${archiveGapCount} 项归档或记录缺口待补全`,
      impact:'部分执行或原始经历暂时无法完整核对。',
      actionLabel:nativeGap?'查看缺口记录':'进入诊断恢复',
      target:nativeGap
        ?{view:'executions',collection:'native'}
        :{view:'maintenance',tab:'diagnostics'},
    });
  }

  const sourceGaps=facts.sources.filter(source=>source.completeness==='gap'&&!source.cleanup);
  if(sourceGaps.length){
    actions.push({
      id:'source-gap',
      kind:'source-gap',
      reason:`${sourceGaps.length} 项资料存在读取缺口`,
      impact:'相关正文或来源关系不能完整用于日常读取。',
      actionLabel:'查看读取缺口',
      target:contextSourceRefDescriptor(sourceGaps[0].ref).target,
    });
  }

  if(facts.view.home&&facts.view.home.projection!=='current'){
    actions.push({
      id:'projection-diff',
      kind:'projection',
      reason:'文本投影与角色之家内容不一致',
      impact:'手工修改的投影尚未合并或重建，当前文件可能不是权威内容。',
      actionLabel:'处理投影差异',
      target:{view:'maintenance',tab:'projection'},
    });
  }

  const faultReason=facts.health.executionFault
    ||facts.health.lifecycleFault
    ||facts.health.blockedTurnReason
    ||(facts.view.status==='read-only'&&facts.view.diagnostic?.mode==='read-only'?facts.view.diagnostic.reason:'');
  if(faultReason){
    actions.push({
      id:'runtime-fault',
      kind:'fault',
      reason:'角色运行或资料完整性需要核对',
      impact:'执行、写入或归档可能暂时停止，已保存的原操作不会被清除。',
      actionLabel:'进入诊断恢复',
      target:{view:'maintenance',tab:'diagnostics'},
    });
  }

  const recent:Array<LibraryOverviewRecent&{readonly sortAt:number}>=facts.recentSources.map(source=>{
    const descriptor=contextSourceRefDescriptor(source.source.ref);
    return {
      id:`source:${descriptor.key}`,
      kind:'source',
      typeLabel:descriptor.label,
      title:descriptor.label,
      summary:source.preview,
      occurredAt:source.occurredAt,
      target:descriptor.target,
      sortAt:source.occurredAt?Date.parse(source.occurredAt)||0:0,
    };
  });
  const versions=queryKnowledgeLibrary(facts.knowledge,{
    collection:'versions',
    offset:0,
    limit:20,
    keyword:'',
    kind:'',
    scope:'current',
    status:'',
    from:'',
    to:'',
    order:'newest',
  }).records;
  for(const record of versions){
    recent.push({
      id:`knowledge:${JSON.stringify(record.ref)}`,
      kind:'knowledge',
      typeLabel:'知识版本',
      title:record.topicExcerpt,
      summary:record.textExcerpt||'正文已清理，保留版本记录。',
      occurredAt:record.effectiveAt,
      target:{view:'knowledge',collection:'versions',ref:record.ref},
      sortAt:record.effectiveAt?Date.parse(record.effectiveAt)||0:0,
    });
  }
  recent.sort((left,right)=>right.sortAt-left.sortAt||left.id.localeCompare(right.id));
  const priority:Readonly<Record<LibraryOverviewAction['kind'],number>>={
    fault:0,
    execution:1,
    'archive-gap':2,
    projection:3,
    'source-gap':4,
  };
  actions.sort((left,right)=>priority[left.kind]-priority[right.kind]);

  return {
    roleId:facts.snapshot.roleId,
    revision:facts.snapshot.revision,
    actions:actions.slice(0,3),
    actionCount:actions.length,
    recent:recent.slice(0,4).map(({sortAt:_,...item})=>item),
  };
}
