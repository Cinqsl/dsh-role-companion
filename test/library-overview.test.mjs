import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

const root=await mkdtemp(join(tmpdir(),'library-overview-pure-'));
const output=join(root,'overview.mjs');
await build({
  entryPoints:[new URL('../packages/companion/src/host/library-overview-view.ts',import.meta.url).pathname],
  bundle:true,
  platform:'node',
  format:'esm',
  target:'node24',
  outfile:output,
});
const {projectLibraryOverview,readLibraryOverviewSources}=await import(pathToFileURL(output).href);
await rm(root,{recursive:true,force:true});

const roleId='role-11111111-1111-4111-8111-111111111111';
const cleanRef={kind:'input',id:'input-22222222-2222-4222-8222-222222222222'};
const gapRef={kind:'reply',id:'reply-33333333-3333-4333-8333-333333333333'};

function fixture(){
  const binding={bindingId:`panel-${roleId}`,bindingVersion:1};
  const proposal={
    proposalId:'proposal-walk',
    operationId:'proposal-operation',
    runId:'run-walk',
    attemptId:'attempt-walk',
    claim:{},
    value:{
      kind:'memory',
      topic:'傍晚散步',
      text:'用户说最近喜欢傍晚散步。',
      statement:'user-report',
      sources:[],
      scope:'最近的个人偏好',
      reason:'保留用户自述',
      expectedVersion:0,
    },
    createdAt:'2026-10-31T10:00:00.000Z',
    committedRevision:19,
    processing:{
      status:'adopted',
      reason:'EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH',
      committedRevision:20,
      knowledgeId:'knowledge-walk',
      version:1,
    },
  };
  const version={
    knowledgeId:'knowledge-walk',
    version:1,
    proposalId:'proposal-walk',
    topic:'傍晚散步',
    text:'用户说最近喜欢傍晚散步。',
    statement:'user-report',
    sources:[],
    scope:'最近的个人偏好',
    reason:'保留用户自述',
    kind:'memory',
    committedRevision:20,
  };
  const sourceBase={
    dependencies:[],
    dataOrigins:[],
    modelAttempts:[],
    lineage:'known',
    derivedRead:false,
    availableForDaily:false,
    contentDigest:'a'.repeat(64),
    committedRevision:10,
    binding,
  };
  return {
    view:{
      status:'ready',
      reason:'',
      roleId,
      revision:20,
      home:{roleId,revision:20,projection:'current',panelBinding:binding},
    },
    snapshot:{
      roleId,
      revision:20,
      contextGeneration:3,
      core:{version:1,text:'核心设定',committedRevision:1},
      settings:{version:1,value:{inputLimitBytes:32768},committedRevision:1},
      inputs:[],
      projection:'current',
      panelBinding:binding,
      creationOperationId:'overview-create',
    },
    conversation:{revision:20,turns:[],attempts:[],replies:[],nativeRecords:[],knowledge:{revision:20,proposals:[],versions:[]}},
    knowledge:{revision:20,proposals:[proposal],versions:[version]},
    sources:[{
      ...sourceBase,
      ref:cleanRef,
      speaker:'user',
      experienceId:'experience-clean',
      runId:null,
      receiveSequence:1,
      occurredAt:'2026-10-29T12:00:00.000Z',
      completeness:'gap',
      cleanup:{operationId:'cleanup-input',reason:'owner-request',originalUtf8Bytes:20},
    },{
      ...sourceBase,
      ref:gapRef,
      speaker:'role',
      experienceId:'experience-gap',
      occurredAt:'2026-10-30T12:00:00.000Z',
      timeKind:'turn-start',
      runId:'run-gap',
      inputIds:[cleanRef.id],
      evidence:'generated-output-not-delivery-or-truth',
      completeness:'gap',
    }],
    recentSources:[{
      source:{
        ...sourceBase,
        ref:gapRef,
        speaker:'role',
        experienceId:'experience-gap',
        occurredAt:'2026-10-30T12:00:00.000Z',
        timeKind:'turn-start',
        runId:'run-gap',
        inputIds:[cleanRef.id],
        evidence:'generated-output-not-delivery-or-truth',
        completeness:'gap',
      },
      preview:'这条回复存在读取缺口。',
      occurredAt:'2026-10-30T12:00:00.000Z',
    }],
    health:{archivePending:0,archiveFault:'',executionFault:'',lifecycleFault:'',blockedTurnReason:''},
  };
}

test('资料概览和资料库来源共享历史来时报时间规则',async()=>{
  const state=fixture();
  const source={
    ...state.sources[0],
    origin:'history',
    occurredAt:'2026-10-20T08:00:00.000Z',
    reportedAt:' 2026-10-31T13:30:00.000Z ',
  };
  const result=await readLibraryOverviewSources({
    purpose:'management',
    basis:state.snapshot,
    list:async()=>[source],
    read:async()=>({...source,text:'历史来信正文'}),
  });
  assert.equal(result.recentSources[0].occurredAt,'2026-10-31T13:30:00.000Z');
});

test('资料概览限制三项行动、忽略清理历史，并排序最近读写目标',()=>{
  const state=fixture();
  const sourceOnly=projectLibraryOverview(state);
  assert.equal(sourceOnly.actionCount,1);
  assert.equal(sourceOnly.actions[0].kind,'source-gap');
  assert.equal(sourceOnly.recent[0].kind,'knowledge');
  assert.deepEqual(sourceOnly.recent[0].target,{
    view:'knowledge',
    collection:'versions',
    ref:{kind:'version',knowledgeId:'knowledge-walk',version:1},
  });
  assert.equal(sourceOnly.recent.some(item=>item.target.view==='sources'&&item.target.ref.kind==='reply'),true);

  state.view.home.projection='diff';
  state.conversation.turns=[{runId:'run-open',inputIds:[],status:'running',deadline:'2026-11-01T00:00:00.000Z',startedAt:'2026-10-31T12:00:00.000Z'}];
  state.conversation.attempts=[{attemptId:'attempt-open',runId:'run-open',kind:'tool',reservedAt:'2026-10-31T12:00:01.000Z'}];
  state.conversation.nativeRecords=[{nativeId:'native-gap',runId:'run-open',provenance:'native-session',data:{kind:'native-exposure-gap',reason:'PROCESS_INTERRUPTED'}}];
  state.health.archivePending=1;
  state.health.executionFault='EXECUTION_STATUS_FAILED';

  const mixed=projectLibraryOverview(state);
  assert.equal(mixed.actionCount,5);
  assert.deepEqual(mixed.actions.map(action=>action.kind),['fault','execution','archive-gap']);
  const visible=JSON.stringify(mixed.actions.map(({reason,impact,actionLabel})=>({reason,impact,actionLabel})));
  assert.doesNotMatch(visible,/EXECUTION_STATUS_FAILED|PROCESS_INTERRUPTED/);
  assert.match(visible,/诊断恢复/);
});
