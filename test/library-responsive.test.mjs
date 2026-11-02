import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHookRuntime} from './react-hook-runtime.mjs';

const text=value=>value==null||typeof value==='boolean'?'':typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):text(value.props?.children);
const all=(value,predicate,found=[])=>{
  if(!value||typeof value!=='object')return found;
  if(!Array.isArray(value)&&predicate(value))found.push(value);
  const children=Array.isArray(value)?value:value.props?.children;
  if(Array.isArray(children))for(const child of children)all(child,predicate,found);
  else all(children,predicate,found);
  return found;
};
const button=(tree,label)=>all(tree,node=>node.type==='button'&&(text(node)===label||node.props?.['aria-label']===label))[0];
const control=(tree,label)=>all(tree,node=>node.props?.['aria-label']===label)[0];
const navButton=(tree,label)=>{
  const nav=all(tree,node=>node.type==='nav'&&node.props?.['aria-label']==='资料库一级视图')[0];
  return button(nav,label);
};

function view(roleId='role-1') {
  return {
    packageName:'dsh-role-companion',packageVersion:'0.1.3',requiredDsh:'0.2.1-rc.3',
    installed:true,enabled:true,fiberPhase:'active',
    bootstrap:{path:'/tmp/role',roleId,creationOperationId:'create',registrationOperationId:'create',version:1},
    role:{status:'ready',reason:'',roleId,revision:12,backups:[],cleanups:[],home:{roleId,revision:12,panelBinding:{bindingId:`panel-${roleId}`,bindingVersion:1,source:'owner-panel'}}},
    selectedRoleId:roleId,capabilities:[],
  };
}

function source(index) {
  return {
    source:{
      ref:{kind:'input',id:`input-${String(index).padStart(8,'0')}-0000-4000-8000-000000000000`},
      speaker:'user',experienceId:`experience-${index}`,runId:null,receiveSequence:index,
      binding:{bindingId:'panel-role-1',bindingVersion:1},occurredAt:`2026-10-${String((index%9)+10).padStart(2,'0')}T08:00:00.000Z`,
      committedRevision:index+1,contentDigest:String(index%10).repeat(64),completeness:'complete',
      dependencies:[],dataOrigins:[],modelAttempts:[],lineage:'known',derivedRead:false,availableForDaily:true,
    },
    preview:`来源记录 ${index}：${'可读摘要'.repeat(12)}`,
    occurredAt:`2026-10-${String((index%9)+10).padStart(2,'0')}T08:00:00.000Z`,
  };
}

function knowledgeRecord(index) {
  const version=(index%40)+1;
  return {
    ref:{kind:'version',knowledgeId:'knowledge-night',version},
    origin:'proposal',knowledgeId:'knowledge-night',version,
    kind:'memory',topicExcerpt:`夜间散步 ${version}`,textExcerpt:`用户保留了夜间散步的记录 ${version}。`,
    status:'adopted',reasonExcerpt:'EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH',current:version===40,
    effectiveAt:`2026-10-${String((index%20)+1).padStart(2,'0')}T09:00:00.000Z`,
    sourceCount:0,sourceRefs:[],sourcesMore:false,proposalId:`proposal-${version}`,ownerOperationId:null,
    committedRevision:index+2,contentDigest:String(index%10).repeat(64),totalCodePoints:20,
  };
}

function executionItem(index) {
  return {
    collection:'tools',recordId:`attempt-${index}`,runId:'run-night',channel:'panel',channelBindingVersion:1,
    occurredAt:`2026-10-${String((index%20)+1).padStart(2,'0')}T10:00:00.000Z`,timeBasis:'tool-observed',
    typeLabel:'工具执行',name:index===1?'role_read':`role_read_${index}`,
    summary:'观察已返回；最终规范成功',result:'success',statusLabel:'最终成功',dispatchObserved:true,
    tool:{
      name:'role_read',observation:{status:'returned',code:'',observedAt:'2026-10-01T10:00:00.000Z'},
      final:{provenance:'tools-result',closure:null,status:'success',code:'',value:'saved',contentBlocks:1,metaSaved:false},
      gap:false,materials:[],materialCount:0,materialsMore:false,
    },
    native:null,
  };
}

async function harness(t,options={}) {
  const previousWindow=globalThis.window,previousDocument=globalThis.document;
  const previousStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  let loaded;
  globalThis.window={__ModuleLoader__:{load(value){loaded=value;}},innerWidth:960};
  globalThis.document={querySelector(){return null;},createElement(){return{dataset:{}};},head:{appendChild(){}}};
  const storage=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,writable:true,value:{
    getItem:key=>storage.get(key)??null,
    setItem:(key,value)=>storage.set(key,String(value)),
    removeItem:key=>storage.delete(key),
  }});
  t.after(()=>{
    if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
    if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
    if(previousStorage===undefined)delete globalThis.localStorage;else Object.defineProperty(globalThis,'localStorage',previousStorage);
  });
  await import(`${pathToFileURL('packages/companion/lib/client.js').href}?library-responsive=${Date.now()}`);
  const hooks=createHookRuntime(),nodeRequire=createRequire(import.meta.url);
  const plugin=loaded.factory(name=>name==='react'?hooks.exports:name==='react/jsx-runtime'?{
    Fragment:Symbol('Fragment'),jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),
  }:nodeRequire(name));
  let currentView=view(options.roleId),queries=[],knowledgeQueries=[],knowledgeDetailCalls=[],executionQueries=[];
  const remote={
    async inspect(){return{ok:true,value:currentView};},
    async readLibraryOverview(roleId,bindingVersion){
      if(options.readLibraryOverview)return options.readLibraryOverview(roleId,bindingVersion);
      return{ok:true,value:options.overview??{actionCount:0,actions:[],recent:[]}};
    },
    async readLibrarySources(roleId,bindingVersion,request){
      queries.push({roleId,bindingVersion,request});
      const rows=options.sourceRows??Array.from({length:27},(_,index)=>source(index+1));
      const filtered=request.types?.length===1?rows.filter(row=>row.source.ref.kind===request.types[0]):rows;
      const sources=filtered.slice(request.offset,request.offset+request.limit);
      return{ok:true,value:{
        basis:{roleId,revision:12,contextGeneration:3,coreVersion:1},purpose:'management',revision:12,
        query:{keyword:'',types:request.types??['core','input','reply'],completeness:'all',availability:'all',from:null,to:null,sort:'newest'},
        filterKey:JSON.stringify(request),sources,offset:request.offset,limit:request.limit,total:filtered.length,datasetTotal:27,
        rangeStart:sources.length?request.offset+1:0,rangeEnd:request.offset+sources.length,
        more:request.offset+sources.length<filtered.length,nextOffset:request.offset+sources.length<filtered.length?request.offset+sources.length:null,
      }};
    },
    async readContextSource(_roleId,_bindingVersion,request){
      const selected=source(1);
      return{ok:true,value:{
        basis:{roleId:'role-1',revision:12,contextGeneration:3,coreVersion:1},
        source:selected.source,text:'窄屏详情正文。',offset:request.offset,totalCodePoints:8,more:false,
      }};
    },
    async queryKnowledgeLibrary(roleId,bindingVersion,request){
      knowledgeQueries.push({roleId,bindingVersion,request});
      const rows=Array.from({length:41},(_,index)=>knowledgeRecord(index+1));
      const records=rows.slice(request.offset,request.offset+request.limit);
      return{ok:true,value:{
        revision:12,collection:request.collection,offset:request.offset,limit:request.limit,
        range:{start:records.length?request.offset+1:0,end:request.offset+records.length},
        total:rows.length,more:request.offset+records.length<rows.length,
        nextOffset:request.offset+records.length<rows.length?request.offset+records.length:null,records,
      }};
    },
    async readKnowledgeLibraryDetail(_roleId,_bindingVersion,request){
      knowledgeDetailCalls.push(request);
      if(options.knowledgeContinuationConflict&&request.offset>0){
        return{ok:false,error:{code:'role/home-error',details:{reason:'KNOWLEDGE_RECORD_CHANGED'}}};
      }
      const offset=request.offset??0,text=offset===0?'第一段':'第二段';
      return{ok:true,value:{
        ref:request.ref,revision:12,contentDigest:request.contentDigest,totalCodePoints:120,
        committedRevision:12,origin:'proposal',knowledgeId:'knowledge-night',version:1,proposalId:'proposal-1',
        ownerOperationId:null,kind:'memory',topic:'夜间散步 1',text,offset,bodyTotalCodePoints:6,more:offset===0,nextOffset:offset===0?3:null,
        statement:'user-report',scope:'夜间习惯',status:'adopted',current:false,effectiveAt:'2026-10-01T09:00:00.000Z',
        proposalReason:'保留用户原话',processingReason:'EXTRACTIVE_USER_REPORT_NOT_WORLD_TRUTH',
        sources:[],preservedCorrections:[],ownerAction:null,rollbackOf:null,difference:null,
      }};
    },
    async readExecutionLibrary(roleId,bindingVersion,request){
      executionQueries.push({roleId,bindingVersion,request});
      const rows=Array.from({length:41},(_,index)=>executionItem(index+1));
      const items=rows.slice(request.offset,request.offset+request.limit);
      return{ok:true,value:{
        roleId,revision:12,collection:request.collection,offset:request.offset,limit:request.limit,
        total:rows.length,rangeStart:items.length?request.offset+1:null,rangeEnd:items.length?request.offset+items.length:null,
        more:request.offset+items.length<rows.length,nextOffset:request.offset+items.length<rows.length?request.offset+items.length:null,
        hasPrevious:request.offset>0,items,
      }};
    },
    async readExecutionLibraryDetail(_roleId,_bindingVersion,request){
      return{ok:true,value:{
        roleId:'role-1',revision:12,item:executionItem(1),contentDigest:'d'.repeat(64),
        sections:[{field:'request',materialId:null,label:'请求',totalCodePoints:18}],
      }};
    },
    async readExecutionLibraryPart(){
      return{ok:true,value:{
        roleId:'role-1',revision:12,collection:'tools',recordId:'attempt-1',field:'request',materialId:null,
        contentDigest:'d'.repeat(64),text:'{"name":"role_read"}',offset:0,totalCodePoints:18,more:false,nextOffset:null,
      }};
    },
  };
  const registrations=[];
  const ctx={
    remote:{$mount:async()=>{},roleCompanion:remote},
    pluginNavigation:{openBundle(){}},
    inject(names,callback){assert.deepEqual(names,['remote.roleCompanion']);callback(this);},
    slots:{inject(_name,callback){callback();},register(options,component){registrations.push({options,component});return()=>{};}},
  };
  await plugin.apply(ctx);
  return {
    hooks,storage,queries,knowledgeQueries,knowledgeDetailCalls,executionQueries,
    page:()=>registrations.find(item=>item.options.name==='plugins.bundle.config').component({view:'page'}),
    setView(next){currentView=next;},
    cleanup(){hooks.reset();},
  };
}

test('资料库首次显示概览，并按角色恢复分类、来源筛选和页码',async t=>{
  const app=await harness(t);t.after(app.cleanup);
  let tree=await app.hooks.render(app.page());
  assert.equal(navButton(tree,'概览').props['aria-current'],'page');

  navButton(tree,'来源').props.onClick();
  tree=await app.hooks.render(app.page());
  control(tree,'来源类型').props.onChange({target:{value:'input'}});
  tree=await app.hooks.render(app.page());
  assert.equal(app.queries.at(-1).request.offset,0);
  button(tree,'下一页来源').props.onClick();
  tree=await app.hooks.render(app.page());
  assert.equal(app.queries.at(-1).request.offset,20);

  app.hooks.reset();
  tree=await app.hooks.render(app.page());
  assert.equal(navButton(tree,'来源').props['aria-current'],'page');
  assert.equal(control(tree,'来源类型').props.value,'input');
  assert.equal(app.queries.at(-1).request.types[0],'input');
  assert.equal(app.queries.at(-1).request.offset,20);
  assert.match(text(tree),/21–27 \/ 27/);

  app.setView(view('role-2'));
  app.hooks.reset();
  tree=await app.hooks.render(app.page());
  assert.equal(navButton(tree,'概览').props['aria-current'],'page');
});

test('概览在角色切换读取失败时立即清除上一角色内容',async t=>{
  const app=await harness(t,{readLibraryOverview:async roleId=>roleId==='role-2'
    ?{ok:false,error:{code:'CONNECTION_LOST'}}
    :{ok:true,value:{
      actionCount:1,
      actions:[{
        id:'role-one-fault',kind:'fault',reason:'角色一故障待处理',impact:'只属于角色一',
        target:{view:'maintenance',tab:'diagnostics'},actionLabel:'查看角色一诊断',
      }],
      recent:[],
    }}});
  t.after(app.cleanup);
  let tree=await app.hooks.render(app.page());
  assert.match(text(tree),/角色一故障待处理/);

  app.setView(view('role-2'));
  button(tree,'刷新资料').props.onClick();
  tree=await app.hooks.render(app.page());
  assert.doesNotMatch(text(tree),/角色一故障待处理/);
  assert.match(text(tree),/概览读取未完成（CONNECTION_LOST）/);
});

test('概览在角色变为不可读后清除已加载内容',async t=>{
  const app=await harness(t,{overview:{
    actionCount:1,
    actions:[{
      id:'stopped-fault',kind:'fault',reason:'不可读前仍显示的事项',impact:'加载后必须清除',
      target:{view:'maintenance',tab:'diagnostics'},actionLabel:'查看诊断事项',
    }],
    recent:[],
  }});
  t.after(app.cleanup);
  let tree=await app.hooks.render(app.page());
  assert.match(text(tree),/不可读前仍显示的事项/);

  const stopped=view();
  stopped.role.status='stopped';
  stopped.role.reason='ROLE_STOPPED';
  app.setView(stopped);
  button(tree,'刷新资料').props.onClick();
  tree=await app.hooks.render(app.page());
  assert.doesNotMatch(text(tree),/不可读前仍显示的事项/);
});

test('窄屏一级导航保留五个分类并提供紧凑菜单',async t=>{
  const app=await harness(t);t.after(app.cleanup);
  const tree=await app.hooks.render(app.page());
  const nav=all(tree,node=>node.type==='nav'&&node.props?.['aria-label']==='资料库一级视图')[0];
  assert.ok(nav);
  assert.ok(all(nav,node=>node.type==='details'&&node.props?.className==='rcLibraryMenu').length);
  assert.equal(all(nav,node=>node.type==='button'&&['概览','来源','知识','执行记录','维护'].includes(text(node))).length,10);
});

test('概览最近来源和知识目标越过持久化筛选与页码打开详情',async t=>{
  const sourceRecord=source(1),knowledge=knowledgeRecord(1);
  const overview={
    actionCount:0,actions:[],
    recent:[{
      id:'recent-source',kind:'source',typeLabel:'用户来信',title:'最近来源',
      summary:'最近保存的用户来信',occurredAt:sourceRecord.occurredAt,
      target:{view:'sources',ref:sourceRecord.source.ref},
    },{
      id:'recent-knowledge',kind:'knowledge',typeLabel:'知识版本',title:'最近知识',
      summary:'最近保存的知识版本',occurredAt:knowledge.effectiveAt,
      target:{view:'knowledge',collection:'versions',ref:knowledge.ref},
    }],
  };
  const app=await harness(t,{overview});t.after(app.cleanup);
  const prefix='dsh-role-companion:library-preference:v1:role-1';
  app.storage.set(`${prefix}:sources`,JSON.stringify({
    filters:{keyword:'旧来源筛选',kind:'input',completeness:'all',availability:'all',period:'all',sort:'newest'},
    query:{keyword:'旧来源筛选',types:['input'],completeness:'all',availability:'all',sort:'newest'},
    offset:20,limit:20,
  }));
  app.storage.set(`${prefix}:knowledge:1`,JSON.stringify({
    collection:'versions',
    tabs:{
      versions:{filters:{keyword:'旧知识筛选',kind:'',scope:'all',status:'',from:'',to:'',order:'newest'},offset:20,limit:20},
      proposals:{filters:{keyword:'',kind:'',scope:'all',status:'',from:'',to:'',order:'newest'},offset:0,limit:20},
    },
  }));
  let tree=await app.hooks.render(app.page());
  const recentSource=all(tree,node=>node.type==='button'&&text(node).includes('最近来源'))[0];
  assert.ok(recentSource);
  recentSource.props.onClick();
  tree=await app.hooks.render(app.page());
  assert.equal(app.queries.at(-1).request.offset,0);
  assert.equal(app.queries.at(-1).request.types,undefined);
  assert.ok(all(tree,node=>node.props?.className==='rcSourceBody').length);

  navButton(tree,'概览').props.onClick();
  tree=await app.hooks.render(app.page());
  const recentKnowledge=all(tree,node=>node.type==='button'&&text(node).includes('最近知识'))[0];
  assert.ok(recentKnowledge);
  recentKnowledge.props.onClick();
  tree=await app.hooks.render(app.page());
  assert.equal(app.knowledgeQueries.at(-1).request.offset,0);
  assert.equal(app.knowledgeQueries.at(-1).request.keyword,'');
  assert.ok(all(tree,node=>node.props?.className==='rcKnowledgeDetail').length);
});

test('来源日期分组使用与显示日期相同的本地日历日',async t=>{
  const previousTimeZone=process.env.TZ;
  process.env.TZ='Asia/Shanghai';
  t.after(()=>{if(previousTimeZone===undefined)delete process.env.TZ;else process.env.TZ=previousTimeZone;});
  const first=source(1),second=source(2);
  first.occurredAt=first.source.occurredAt='2026-10-20T15:30:00.000Z';
  second.occurredAt=second.source.occurredAt='2026-10-20T16:30:00.000Z';
  const app=await harness(t,{sourceRows:[first,second]});t.after(app.cleanup);
  let tree=await app.hooks.render(app.page());
  navButton(tree,'来源').props.onClick();
  tree=await app.hooks.render(app.page());
  const groups=all(tree,node=>node.type==='section'&&node.props?.className==='rcSourceDateGroup');
  assert.equal(groups.length,2);
  assert.match(groups[0].props['aria-label'],/10月20日/);
  assert.match(groups[1].props['aria-label'],/10月21日/);
});

test('窄屏来源详情聚焦标题，仅详情内 Esc 返回原记录和滚动位置',async t=>{
  const previousFrame=globalThis.requestAnimationFrame,previousCancel=globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame=callback=>{callback(0);return 1;};
  globalThis.cancelAnimationFrame=()=>{};
  t.after(()=>{
    if(previousFrame===undefined)delete globalThis.requestAnimationFrame;else globalThis.requestAnimationFrame=previousFrame;
    if(previousCancel===undefined)delete globalThis.cancelAnimationFrame;else globalThis.cancelAnimationFrame=previousCancel;
  });
  const app=await harness(t);t.after(app.cleanup);
  globalThis.window.innerWidth=390;
  let tree=await app.hooks.render(app.page());
  navButton(tree,'来源').props.onClick();
  tree=await app.hooks.render(app.page());

  const list=all(tree,node=>node.props?.['data-source-list']!==undefined)[0];
  const row=all(tree,node=>node.type==='button'&&node.props?.className==='rcSourceRow')[0];
  const returnedRow={
    focused:false,
    parentElement:{scrollIntoView(){}},
    getAttribute(){return'input/input-00000001-0000-4000-8000-000000000000';},
    focus(){this.focused=true;return true;},
  };
  const listElement={scrollTop:72,querySelectorAll(){return[returnedRow];}};
  list.props.ref.current=listElement;
  row.props.onClick();
  tree=await app.hooks.render(app.page());

  const section=all(tree,node=>node.type==='section'&&node.props?.className==='rcSourcesLibrary')[0];
  const detail=all(tree,node=>node.type==='article'&&node.props?.className?.includes('rcSourceDetail'))[0];
  const heading=all(detail,node=>node.type==='h3'&&node.props?.tabIndex===-1)[0];
  assert.ok(heading);
  listElement.scrollTop=0;

  let prevented=false;
  section.props.onKeyDown({key:'Escape',defaultPrevented:false,preventDefault(){prevented=true;}});
  tree=await app.hooks.render(app.page());
  assert.equal(prevented,true);
  assert.equal(app.storage.size>0,true);
  assert.equal(all(tree,node=>node.props?.className?.includes('is-detail-open')).length,0);
  assert.equal(listElement.scrollTop,72);
  assert.equal(returnedRow.focused,true);

  prevented=false;
  const returnedSection=all(tree,node=>node.type==='section'&&node.props?.className==='rcSourcesLibrary')[0];
  returnedSection.props.onKeyDown({key:'Escape',defaultPrevented:false,preventDefault(){prevented=true;}});
  assert.equal(prevented,false);
});

test('知识视图恢复筛选和页码但不恢复详情正文',async t=>{
  const app=await harness(t);t.after(app.cleanup);
  let tree=await app.hooks.render(app.page());
  navButton(tree,'知识').props.onClick();
  tree=await app.hooks.render(app.page());
  control(tree,'关键词').props.onChange({currentTarget:{value:'夜航'}});
  tree=await app.hooks.render(app.page());
  control(tree,'知识类型').props.onChange({currentTarget:{value:'memory'}});
  tree=await app.hooks.render(app.page());
  button(tree,'下一页').props.onClick();
  tree=await app.hooks.render(app.page());
  assert.equal(app.knowledgeQueries.at(-1).request.offset,20);

  app.hooks.reset();
  tree=await app.hooks.render(app.page());
  assert.equal(navButton(tree,'知识').props['aria-current'],'page');
  assert.equal(control(tree,'关键词').props.value,'夜航');
  assert.equal(control(tree,'知识类型').props.value,'memory');
  assert.equal(app.knowledgeQueries.at(-1).request.offset,20);
  assert.equal(all(tree,node=>node.props?.['aria-label']==='知识详情').length,1);
  assert.match(text(tree),/选择一条记录查看正文/);
});

test('知识视图首次挂载立即恢复已保存的回退操作',async t=>{
  const roleId='role-11111111-1111-4111-8111-111111111111';
  const app=await harness(t,{roleId});t.after(app.cleanup);
  const operationId='rollback-pending-first-mount';
  app.storage.set(`dsh-role-companion:pending-knowledge-rollback:v2:${roleId}:1`,JSON.stringify({
    roleId,
    bindingVersion:1,
    request:{
      operationId,
      knowledgeId:'knowledge-night',
      targetVersion:1,
      expectedKnowledgeVersion:2,
      expectedRevision:12,
      reason:'首次挂载仍需核对原回退操作。',
    },
  }));

  let tree=await app.hooks.render(app.page());
  navButton(tree,'知识').props.onClick();
  tree=await app.hooks.render(app.page());

  assert.match(text(tree),/知识回退操作/);
  assert.match(text(tree),new RegExp(operationId));
  assert.ok(button(tree,'查询原回退操作'));
});

test('知识视图在角色不可读时显示不可用且不发起读取',async t=>{
  const blocked=view();
  blocked.role.backups=[{checkpoint:'missing'}];
  const app=await harness(t);t.after(app.cleanup);
  app.setView(blocked);

  let tree=await app.hooks.render(app.page());
  navButton(tree,'知识').props.onClick();
  tree=await app.hooks.render(app.page());

  assert.equal(app.knowledgeQueries.length,0);
  assert.match(text(tree),/角色已停止或需要核对运行状态，资料读取暂不可用/);
  assert.equal(text(tree).includes('知识目录读取未完成'),false);
});

test('知识详情先读取有界正文，记录变化后拒绝继续拼接',async t=>{
  const app=await harness(t,{knowledgeContinuationConflict:true});t.after(app.cleanup);
  let tree=await app.hooks.render(app.page());
  navButton(tree,'知识').props.onClick();
  tree=await app.hooks.render(app.page());
  const record=all(tree,node=>node.type==='button'&&node.props?.className==='rcKnowledgeRecord')[0];
  record.props.onClick();
  tree=await app.hooks.render(app.page());

  assert.deepEqual(
    app.knowledgeDetailCalls.map(call=>({offset:call.offset,limit:call.limit})),
    [{offset:0,limit:4096}],
  );
  assert.match(text(tree),/第一段/);
  assert.match(text(tree),/已读取第 1–3 个码点，共 6 个/);
  button(tree,'继续读取知识正文').props.onClick();
  tree=await app.hooks.render(app.page());
  assert.deepEqual(
    app.knowledgeDetailCalls.map(call=>({offset:call.offset,limit:call.limit})),
    [{offset:0,limit:4096},{offset:3,limit:4096}],
  );
  assert.match(text(tree),/知识记录已变化/);
  assert.equal(text(tree).includes('第一段第二段'),false);
});

test('执行视图恢复筛选和页码但不恢复详情',async t=>{
  const app=await harness(t);t.after(app.cleanup);
  let tree=await app.hooks.render(app.page());
  navButton(tree,'执行记录').props.onClick();
  tree=await app.hooks.render(app.page());
  control(tree,'搜索执行记录').props.onChange({target:{value:'role_read'}});
  tree=await app.hooks.render(app.page());
  control(tree,'排序').props.onChange({target:{value:'oldest'}});
  tree=await app.hooks.render(app.page());
  all(tree,node=>node.type==='form'&&node.props?.['aria-label']==='工具执行筛选')[0].props.onSubmit({preventDefault(){}});
  tree=await app.hooks.render(app.page());
  button(tree,'下一页').props.onClick();
  tree=await app.hooks.render(app.page());
  assert.equal(app.executionQueries.at(-1).request.offset,20);

  app.hooks.reset();
  tree=await app.hooks.render(app.page());
  assert.equal(navButton(tree,'执行记录').props['aria-current'],'page');
  assert.equal(control(tree,'搜索执行记录').props.value,'role_read');
  assert.equal(control(tree,'排序').props.value,'oldest');
  assert.equal(app.executionQueries.at(-1).request.offset,20);
  assert.equal(all(tree,node=>node.props?.['data-detail']==='closed').length,1);
});
