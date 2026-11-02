import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {openRoleHome} from 'dsh-role-companion/home';

export async function createLibraryBrowserFixture(run) {
  const fixtureEnv={
    PATH:process.env.PATH,
    HOME:join(run,'home'),
    DSH_HOME:join(run,'home'),
    TMPDIR:run,
    DSH_TEST_RUN:run,
    DSH_TELEMETRY_DISABLED:'1',
  };
  const knowledgeWorker=spawnSync(process.execPath,[new URL('./knowledge-native-worker.mjs',import.meta.url).pathname],{
    cwd:run,
    env:fixtureEnv,
    encoding:'utf8',
    timeout:50000,
  });
  assert.equal(knowledgeWorker.error,undefined,knowledgeWorker.stdout+knowledgeWorker.stderr);
  assert.equal(knowledgeWorker.status,0,knowledgeWorker.stdout+knowledgeWorker.stderr);
  const native=JSON.parse(await readFile(join(run,'knowledge-native.json'),'utf8'));
  assert.equal(native.status,'passed');

  const path=join(run,'role');
  const home=await openRoleHome(path,{expectedRoleId:native.roleId});
  let step='accept tool input';
  try {
    const bindingId=`panel-${home.roleId}`;
    const now='2026-11-02T03:00:00.000Z';
    const accepted=await home.acceptInput({
      operationId:'library-browser-tool-input',
      bindingId,
      bindingVersion:1,
      externalKey:'library-browser-tool-input',
      text:'请查看这段记录，并说明观察和最终结果的区别。',
      origin:'live',
      receivedAt:now,
      sourceEvidence:'authenticated-owner-panel',
    });
    step='begin tool turn';
    const turn=await home.beginTurn({
      operationId:'library-browser-tool-turn',
      inputIds:[accepted.inputId],
      runId:'library-browser-tool-run',
      expectedRevision:home.revision,
      now,
    });
    step='reserve tool attempt';
    const attemptId='library-browser-tool-attempt';
    await home.reserveAttempt({
      operationId:'library-browser-tool-reserve',
      runId:turn.runId,
      attemptId,
      source:'user',
      kind:'tool',
      contextGeneration:turn.contextGeneration,
      settingsVersion:turn.settingsVersion,
      expectedRevision:home.revision,
      now,
    });
    step='enter tool attempt';
    await home.enterAttempt({operationId:'library-browser-tool-enter',attemptId,now});
    step='observe tool attempt';
    await home.observeAttempt({
      operationId:'library-browser-tool-observe',
      attemptId,
      observation:{kind:'returned',value:{text:'工具观察已返回，等待最终规范结果。'},observedAt:now},
    });
    const materialText='材料正文：保留完整请求、观察和最终结果，便于后续核对。';
    step='capture tool material';
    await home.captureMaterial({
      operationId:'library-browser-tool-material',
      material:{
        materialId:'material-11111111-1111-4111-8111-111111111111',
        attemptId,
        source:'role-read-result',
        text:materialText,
        bytes:Buffer.byteLength(materialText,'utf8'),
        digest:createHash('sha256').update(materialText,'utf8').digest('hex'),
      },
    });
    step='record tool final';
    await home.recordAttempt({
      operationId:'library-browser-tool-final',
      attemptId,
      outcome:{
        kind:'completed',
        data:{
          request:{name:'role_read',arguments:{source:'core'}},
          result:{
            final:{
              isError:false,
              value:{text:'这是最终规范成功结果。'},
              content:[{type:'text',text:'这是最终规范成功结果。'}],
            },
          },
          dispatchObserved:true,
        },
      },
    });
    step='finish tool turn';
    await home.finishTurn({
      operationId:'library-browser-tool-finish',
      runId:turn.runId,
      contextGeneration:turn.contextGeneration,
      outcome:{kind:'reply',text:'执行观察已经返回；只有最终规范结果才表示这条工具动作的最终状态。'},
    });

    for(let index=0;index<24;index+=1) {
      step=`accept source ${index}`;
      await home.acceptInput({
        operationId:`library-browser-source-${index}`,
        bindingId,
        bindingVersion:1,
        externalKey:`library-browser-source-${index}`,
        text:index===0
          ?`蓝盐灯塔的第一封来信：${'夜晚沿着河岸记录安静景色。\n'.repeat(300)}`
          :index===23
            ?'没有匹配结果之外的最后一次湖边散步记录。'
            :`第 ${index+1} 封来源来信：记录编号 ${String(index).padStart(2,'0')}。`,
        origin:'live',
        receivedAt:new Date(Date.parse(now)+index*60000).toISOString(),
        sourceEvidence:'authenticated-owner-panel',
      });
    }
    const knowledge=await home.readKnowledge();
    assert.equal(knowledge.versions.length,1);
    return {path,roleId:home.roleId,revision:home.revision,native,knowledge};
  } catch(error) {
    error.message=`${step}: ${error.message}`;
    throw error;
  } finally {
    await home.close();
  }
}
