import {createRoleHome} from 'dsh-role-companion/home';

export async function createLibrarySourcesFixture(path) {
  const core=`核心设定：${'在夜航中保持诚实并记录真实依据。'.repeat(12)}`;
  const home=await createRoleHome(path,{operationId:'library-sources-create',core,settings:{inputLimitBytes:131072}});
  const bindingId=`panel-${home.roleId}`,inputs=[];
  for(let index=0;index<24;index++){
    const text=index===0
      ?`第一封来信：${'我在雨夜寻找白色回廊。\n'.repeat(16)}`
      :index===21?'后来在一本旧书里发现了蓝盐灯塔的线索。':`第 ${index+1} 封来源来信：记录编号 ${String(index).padStart(2,'0')}。`;
    const receivedAt=new Date(Date.UTC(2026,9,1,index)).toISOString();
    inputs.push(await home.acceptInput({operationId:`library-sources-input-${index}`,bindingId,bindingVersion:1,externalKey:`library-sources-key-${index}`,text,origin:'live',receivedAt,sourceEvidence:'authenticated-owner-panel'}));
  }
  const now='2026-11-02T00:00:00.000Z';
  const turn=await home.beginTurn({operationId:'library-sources-turn',inputIds:[inputs[0].inputId],runId:'library-sources-run',expectedRevision:home.revision,now});
  await home.reserveAttempt({operationId:'library-sources-tool-reserve',runId:turn.runId,attemptId:'library-sources-tool',source:'user',kind:'tool',contextGeneration:turn.contextGeneration,settingsVersion:turn.settingsVersion,expectedRevision:home.revision,now});
  await home.enterAttempt({operationId:'library-sources-tool-enter',attemptId:'library-sources-tool',now});
  await home.observeAttempt({operationId:'library-sources-tool-observe',attemptId:'library-sources-tool',observation:{kind:'returned',value:{text:'工具来源不应出现在资料库来源视图'},observedAt:now}});
  await home.recordAttempt({operationId:'library-sources-tool-record',attemptId:'library-sources-tool',outcome:{kind:'completed',data:{request:{name:'role_read'},result:{final:{isError:false,value:{text:'工具最终结果'},content:[]}},dispatchObserved:true}}});
  const reply=`角色回复：${'我会沿着信中的路标继续查证，不把推测当作事实。\n'.repeat(10)}`;
  const finished=await home.finishTurn({operationId:'library-sources-finish',runId:turn.runId,contextGeneration:turn.contextGeneration,outcome:{kind:'reply',text:reply}});
  const roleId=home.roleId,revision=home.revision;
  await home.close();
  return {path,roleId,revision,bindingId,turn,finished,inputs,core,reply,toolAttemptId:'library-sources-tool'};
}
