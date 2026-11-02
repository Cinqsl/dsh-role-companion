import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createRoleHome} from 'dsh-role-companion/home';

const run = process.env.DSH_TEST_RUN;
const count = Number(process.env.DSH_CONTEXT_LINEAGE_TOOLS ?? 28);
const mode = process.env.DSH_CONTEXT_LINEAGE_MODE ?? 'undispatched';
const now = '2026-10-30T05:40:00.000Z';
const textV1 = '初始目标只引用这一条原始输入。';
const textV2 = '更正目标只引用这条新的原始输入。';
const digest = text => createHash('sha256').update(text).digest('hex');
const binding = roleId => ({bindingId:'panel-'+roleId,bindingVersion:1});
const report = {
  case:'context-lineage-bounded-dag-expansion',
  count,
  status:'running',
  realBusinessCalls:{model:0,web:0,qq:0},
};

const accept = (home, operationId, text) => home.acceptInput({
  operationId,
  ...binding(home.roleId),
  externalKey:operationId,
  text,
  origin:'live',
  receivedAt:now,
  sourceEvidence:'authenticated-owner-panel',
});

async function saveGoal(home, {turn, input, previous, text, relation}) {
  const proposalId = previous ? 'proposal-growth-v2' : 'proposal-growth-v1';
  const attemptId = 'tool-' + proposalId;
  const proposal = {
    kind:'goal',
    topic:previous ? '迁移后的纠正目标' : '迁移后的初始目标',
    expectedVersion:previous?.version ?? 0,
    ...(previous ? {
      targetId:previous.knowledgeId,
      relation:{kind:'correction',targetId:previous.knowledgeId,version:previous.version},
    } : {}),
    text,
    statement:'role-choice',
    sources:[{ref:{kind:'input',id:input.inputId},quote:text}],
    scope:'来源展开回归',
    reason:relation,
    state:'planned',
  };
  const source = {
    ref:{kind:'input',id:input.inputId},
    contentDigest:digest(text),
    committedRevision:input.committedRevision,
  };
  const state = await home.readConversation();
  const reserved = await home.reserveAttempt({
    operationId:'reserve-' + proposalId,
    runId:turn.runId,
    attemptId,
    source:'user',
    kind:'tool',
    contextGeneration:turn.contextGeneration,
    settingsVersion:turn.settingsVersion,
    expectedRevision:home.revision,
    now,
    proposal:{
      contextGeneration:turn.contextGeneration,
      settingsVersion:turn.settingsVersion,
      proposalRulesVersion:state.proposalRules.version,
      initialRevision:1,
      inputSequence:input.receiveSequence,
      sourceBasis:[source],
    },
  });
  await home.enterAttempt({operationId:'enter-' + proposalId,attemptId:reserved.attemptId,now});
  const saved = await home.saveProposal({operationId:'save-' + proposalId,attemptId,value:proposal,now});
  const callSeq = (await home.readConversation()).attempts.filter(attempt => attempt.runId === turn.runId).length;
  await home.recordNative({
    operationId:'native-' + proposalId,
    record:{
      runId:turn.runId,
      nativeId:'session-' + proposalId + ':final:' + callSeq,
      provenance:'tools-result',
      data:{
        association:'issued-execution',
        name:'role_propose',
        callSeq,
        arguments:saved.value,
        result:{isError:false,value:{proposalId:saved.proposalId}},
      },
    },
  });
  await home.observeAttempt({
    operationId:'observe-' + proposalId,
    attemptId,
    observation:{kind:'returned',value:{proposalId:saved.proposalId,status:'pending-final'},observedAt:now},
  });
  await home.recordAttempt({
    operationId:'record-' + proposalId,
    attemptId,
    outcome:{
      kind:'completed',
      data:{
        request:{
          name:'role_propose',
          arguments:saved.value,
          native:{sessionId:'session-' + proposalId,callSeq},
        },
        result:{final:{isError:false,value:{proposalId:saved.proposalId},content:[]}},
        dispatchObserved:true,
      },
    },
  });
  const processed = await home.processProposal({
    operationId:'process-' + proposalId,
    proposalId:saved.proposalId,
    assessment:{status:'adopt',reason:'CURRENT_GOAL_DECISION_NOT_COMPLETION',sources:[source]},
    now,
  });
  assert.equal(processed.processing.status, 'adopted');
  return processed;
}

async function addModel(home, turn, goal) {
  const attemptId = 'model-growth-v1';
  await home.reserveAttempt({
    operationId:'reserve-' + attemptId,
    runId:turn.runId,
    attemptId,
    source:'user',
    kind:'model',
    contextGeneration:turn.contextGeneration,
    settingsVersion:turn.settingsVersion,
    expectedRevision:home.revision,
    now,
  });
  await home.enterAttempt({operationId:'enter-' + attemptId,attemptId,now});
  await home.recordAttempt({
    operationId:'record-' + attemptId,
    attemptId,
    outcome:{
      kind:'completed',
      data:{
        request:{
          sessionId:'session-growth',
          contextManifest:{selected:[{kind:'knowledge',id:goal.knowledgeId,version:goal.version}]},
        },
        result:{final:{isError:false,value:{text:'继续目标。'},content:[]}},
        dispatchObserved:true,
      },
    },
  });
}

async function addRead(home, turn, input, index) {
  const attemptId = 'tool-growth-' + String(index).padStart(2, '0');
  const result = {
    source:'input',
    version:home.revision,
    inputId:input.inputId,
    experienceId:input.experienceId,
    text:'记录 ' + index,
    offset:0,
    totalCodePoints:8,
    more:false,
    toolAttemptId:attemptId,
  };
  await home.reserveAttempt({
    operationId:'reserve-' + attemptId,
    runId:turn.runId,
    attemptId,
    source:'user',
    kind:'tool',
    contextGeneration:turn.contextGeneration,
    settingsVersion:turn.settingsVersion,
    expectedRevision:home.revision,
    now,
  });
  await home.enterAttempt({operationId:'enter-' + attemptId,attemptId,now});
  await home.observeAttempt({
    operationId:'observe-' + attemptId,
    attemptId,
    observation:{kind:'returned',value:result,observedAt:now},
  });
  await home.recordAttempt({
    operationId:'record-' + attemptId,
    attemptId,
    outcome:{
      kind:'completed',
      data:{
        request:{name:'role_read',arguments:{source:'input',id:input.inputId,offset:0,limit:4096}},
        result:{final:{provenance:'tools-result',canonicalValue:'saved',isError:false,value:result,content:[{type:'text',text:JSON.stringify(result)}]}},
        dispatchObserved:true,
      },
    },
  });
}

async function addIncompleteRead(home, turn, input) {
  const attemptId = 'tool-growth-' + mode;
  await home.reserveAttempt({
    operationId:'reserve-' + attemptId,
    runId:turn.runId,
    attemptId,
    source:'user',
    kind:'tool',
    contextGeneration:turn.contextGeneration,
    settingsVersion:turn.settingsVersion,
    expectedRevision:home.revision,
    now,
  });
  if (mode === 'dispatched-gap') await home.enterAttempt({operationId:'enter-' + attemptId,attemptId,now});
  await home.recordAttempt({
    operationId:'record-' + attemptId,
    attemptId,
    outcome:{
      kind:mode === 'dispatched-gap' ? 'completed' : 'not-dispatched',
      code:mode === 'dispatched-gap' ? '' : 'ROLE_READ_TIMEOUT',
      data:{
        request:{name:'role_read',arguments:{source:'input',id:input.inputId,offset:0,limit:4096}},
        result:{final:{isError:true,error:{code:mode === 'dispatched-gap' ? 'ROLE_READ_FAILED' : 'ROLE_READ_TIMEOUT'},content:[]}},
        dispatchObserved:mode === 'dispatched-gap',
      },
    },
  });
}

let home;
try {
  await mkdir(run, {recursive:true});
  home = await createRoleHome(join(run, 'role'), {
    operationId:'growth-create',
    core:'同一来源经多段经历引用时，日常来源仍必须有界且可用。',
    settings:{inputLimitBytes:32768},
  });
  const current = await home.readConversation();
  await home.applyOwner({
    kind:'edit-conversation',
    operationId:'growth-rules',
    value:{...current.rules.value, toolLimit:count * 2 + 11},
    expectedConversationVersion:current.rules.version,
    expectedRevision:home.revision,
  });

  const inputV1 = await accept(home, 'growth-input-v1', textV1);
  const turnV1 = await home.beginTurn({
    operationId:'growth-turn-v1',
    inputIds:[inputV1.inputId],
    runId:'run-growth-v1',
    expectedRevision:home.revision,
    now,
  });
  const processedV1 = await saveGoal(home, {
    turn:turnV1,
    input:inputV1,
    text:textV1,
    relation:'保存初始目标，后续经历均引用这一当前版本。',
  });
  await home.finishTurn({
    operationId:'growth-finish-v1',
    runId:turnV1.runId,
    contextGeneration:turnV1.contextGeneration,
    outcome:{kind:'no-reply',reason:'GROWTH_SEED'},
  });

  const inputV2 = await accept(home, 'growth-input-v2', textV2);
  const turnV2 = await home.beginTurn({
    operationId:'growth-turn-v2',
    inputIds:[inputV2.inputId],
    runId:'run-growth-v2',
    expectedRevision:home.revision,
    now,
  });
  await addModel(home, turnV2, processedV1.processing);
  await addIncompleteRead(home, turnV2, inputV2);
  for (let index = 0; index < count; index++) await addRead(home, turnV2, inputV2, index);
  const processedV2 = await saveGoal(home, {
    turn:turnV2,
    input:inputV2,
    previous:processedV1.processing,
    text:textV2,
    relation:'用新的完整输入纠正当前目标。',
  });

  const startedAt = performance.now();
  const reader = await home.openContextReader({purpose:'daily',runId:turnV2.runId});
  let sources;
  try {
    sources = await reader.list();
    await reader.constraints();
  } finally {
    reader.revoke();
  }
  report.elapsedMs = Math.round(performance.now() - startedAt);
  report.sources = sources.length;
  report.goal = sources.find(source =>
    source.ref.kind === 'knowledge'
    && source.ref.id === processedV2.processing.knowledgeId
    && source.ref.version === processedV2.processing.version);
  if (mode === 'dispatched-gap') {
    assert.equal(report.goal, undefined, 'a dispatched tool missing evidence must keep dependent knowledge out of daily use');
  } else {
    assert(report.goal, 'the corrected goal remains available after excluding a proven undispatched attempt');
    assert(report.goal.dependencies.length <= count + 4, 'shared lineage must stay bounded by source identities');
  }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = {
    name:error.name,
    code:error.code ?? null,
    message:String(error.message),
  };
  throw error;
} finally {
  if (home) await home.close().catch(() => {});
  if (process.env.DSH_CONTEXT_EVIDENCE_DIRECTORY) {
    await mkdir(process.env.DSH_CONTEXT_EVIDENCE_DIRECTORY, {recursive:true});
    await writeFile(
      join(process.env.DSH_CONTEXT_EVIDENCE_DIRECTORY, 'context-lineage-growth.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
  }
}
