import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHookRuntime} from './react-hook-runtime.mjs';

const text=value=>value==null||typeof value==='boolean'?'':typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):text(value.props?.children);
const all=(value,predicate,found=[])=>{if(!value||typeof value!=='object')return found;if(!Array.isArray(value)&&predicate(value))found.push(value);const children=Array.isArray(value)?value:value.props?.children;if(Array.isArray(children))for(const child of children)all(child,predicate,found);else all(children,predicate,found);return found;};
const button=(tree,label)=>all(tree,node=>node.type==='button'&&text(node)===label)[0];
const control=(tree,label)=>all(tree,node=>node.props?.['aria-label']===label)[0];
const listButton=(tree,name)=>all(tree,node=>node.type==='button'&&node.props?.className==='rcExecutionListItem'&&text(node).includes(name))[0];
const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));};

function readyView(status='ready'){
  return {
    packageName:'dsh-role-companion',packageVersion:'0.1.3',requiredDsh:'0.2.1-rc.3',
    installed:true,enabled:true,fiberPhase:'active',bootstrap:{path:'/tmp/role',roleId:'role-1',creationOperationId:'create',registrationOperationId:'create',version:1},
    role:{status,reason:status==='read-only'?'READ_ONLY':'',roleId:'role-1',revision:12,backups:[],cleanups:[],home:{roleId:'role-1',revision:12,panelBinding:{bindingId:'panel-role-1',bindingVersion:1,source:'owner-panel'}}},
    selectedRoleId:'role-1',capabilities:[],
  };
}

function item(collection,name,overrides={}){
  return {
    collection,recordId:collection==='tools'?`attempt-${name}`:`native-session/native-${name}`,
    runId:'run-link',channel:'panel',channelBindingVersion:1,
    occurredAt:collection==='tools'?'2026-10-27T10:00:00.000Z':'2026-10-26T10:00:00.000Z',timeBasis:collection==='tools'?'tool-observed':'run-started',
    typeLabel:collection==='tools'?'工具执行':'原生记录',name,summary:collection==='tools'?'观察已返回；最终规范成功':'记录存在缺口',
    result:collection==='tools'?'success':'gap',statusLabel:collection==='tools'?'最终规范成功':'记录存在缺口',dispatchObserved:true,
    tool:collection==='tools'?{name:'role_read',observation:{status:'returned',code:'',observedAt:'2026-10-27T10:00:00.000Z'},final:{provenance:'tools-result',closure:null,status:'success',code:'',value:'saved',contentBlocks:1,metaSaved:false},gap:false,materials:[{materialId:'material-00000000-0000-4000-8000-000000000001',source:'sdk-local-spill',bytes:8,digest:'a'.repeat(64)}],materialCount:1,materialsMore:false}:null,
    native:collection==='native'?{kind:'gap',status:'gap',code:'SDK_SPILL_UNPROVEN',canonicalValue:'unavailable',closure:null,gapKind:'sdk-spill-gap',artifactCount:1,knownArtifactBytes:8}:null,
    ...overrides,
  };
}

async function setup(status='ready',options={}){
  const previousWindow=globalThis.window,previousDocument=globalThis.document,previousStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  let loaded;globalThis.window={__ModuleLoader__:{load(value){loaded=value;}}};globalThis.document={querySelector(){return null;},createElement(){return {dataset:{}};},head:{appendChild(){}}};
  const storage=new Map();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)}});
  await import(`${pathToFileURL('packages/companion/lib/client.js').href}?executions-test=${Date.now()}`);
  const hooks=createHookRuntime(),require=createRequire(import.meta.url),plugin=loaded.factory(name=>name==='react'?hooks.exports:name==='react/jsx-runtime'?{Fragment:Symbol('Fragment'),jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:require(name));
  const calls=[],registrations=[];
  const ctx={
    remote:{async $mount(){},roleCompanion:{
      async inspect(){return {ok:true,value:readyView(status)};},
      async readExecutionLibrary(_roleId,_bindingVersion,request){
        calls.push({method:'query',request});
        if(options.queryFailure)return {ok:false,error:{code:'role/home-error',details:{reason:options.queryFailure}}};
        const items=request.keyword==='none'?[]:request.collection==='tools'?[item('tools','role_read')]:[item('native','SDK 外置资料归属缺口')];
        return {ok:true,value:{roleId:'role-1',revision:12,collection:request.collection,offset:request.offset,limit:request.limit,total:items.length,rangeStart:1,rangeEnd:items.length,more:false,nextOffset:null,hasPrevious:false,items}};
      },
      async readExecutionLibraryDetail(_roleId,_bindingVersion,request){
        calls.push({method:'detail',request});
        return {ok:true,value:{roleId:'role-1',revision:12,item:item(request.collection,request.collection==='tools'?'role_read':'SDK 外置资料归属缺口'),contentDigest:'d'.repeat(64),sections:request.collection==='tools'?[{field:'request',materialId:null,label:'请求',totalCodePoints:21},{field:'observation',materialId:null,label:'执行观察',totalCodePoints:18},{field:'final',materialId:null,label:'最终规范结果',totalCodePoints:18},{field:'material',materialId:'material-00000000-0000-4000-8000-000000000001',label:'SDK 外置材料',totalCodePoints:8},{field:'raw',materialId:null,label:'原始 JSON',totalCodePoints:80}]:[{field:'native',materialId:null,label:'原生事件与闭合信息',totalCodePoints:80},{field:'raw',materialId:null,label:'原始 JSON',totalCodePoints:90}]}};
      },
      async readExecutionLibraryPart(_roleId,_bindingVersion,request){
        calls.push({method:'part',request});
        if(options.partFailureField===request.field)return {ok:false,error:{code:'role/home-error',details:{reason:'EXECUTION_RECORD_CHANGED'}}};
        const values={request:'{"name":"role_read"}',observation:'{"kind":"returned"}',final:'{"isError":false}',native:'{"kind":"sdk-spill-gap"}',raw:'{"technical":true}',material:'full material body'};
        return {ok:true,value:{roleId:'role-1',revision:12,collection:request.collection,recordId:request.recordId,field:request.field,materialId:request.materialId,contentDigest:'d'.repeat(64),text:values[request.field],offset:request.offset,totalCodePoints:Array.from(values[request.field]).length,more:false,nextOffset:null}};
      },
    }},
    pluginNavigation:{openBundle(){}},
    inject(_names,callback){callback(this);},
    slots:{inject(_name,callback){callback();},register(options,component){registrations.push({options,component});return()=>{};}},
  };
  await plugin.apply(ctx);
  return {hooks,ctx,pluginPage:registrations[0].component({view:'page'}),calls,cleanup(){hooks.reset();if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;if(previousStorage===undefined)delete globalThis.localStorage;else Object.defineProperty(globalThis,'localStorage',previousStorage);}};
}

async function openExecutions(status='ready',options={}){
  const setupResult=await setup(status,options);
  let tree=await setupResult.hooks.render(setupResult.pluginPage);
  button(tree,'执行记录').props.onClick();
  tree=await setupResult.hooks.render(setupResult.pluginPage);
  return {...setupResult,tree:()=>tree,rerender:async()=>{tree=await setupResult.hooks.render(setupResult.pluginPage);return tree;}};
}

test('父级执行资料库默认工具标签并保留原生独立查询状态',async t=>{
  const harness=await openExecutions();
  t.after(harness.cleanup);
  let tree=harness.tree();
  assert.ok(all(tree,node=>node.props?.['aria-label']==='执行记录类型').length);
  assert.equal(button(tree,'工具执行').props['aria-current'],'page');
  assert.ok(button(tree,'原生记录'));
  assert.equal(harness.calls.filter(call=>call.method==='query').at(-1).request.collection,'tools');

  button(tree,'原生记录').props.onClick();
  tree=await harness.rerender();
  assert.equal(button(tree,'原生记录').props['aria-current'],'page');
  assert.equal(harness.calls.filter(call=>call.method==='query').at(-1).request.collection,'native');
  assert.match(text(tree),/SDK 外置资料归属缺口/);

  button(tree,'工具执行').props.onClick();
  tree=await harness.rerender();
  assert.equal(button(tree,'工具执行').props['aria-current'],'page');
  assert.match(text(tree),/role_read/);
  assert.equal(text(tree).includes('重试原工具记录保存'),false);
});

test('执行列表可打开分段详情、材料、原生关联并在变化时停止拼接',async t=>{
  const harness=await openExecutions('ready',{partFailureField:'raw'});
  t.after(harness.cleanup);
  let tree=harness.tree();
  listButton(tree,'role_read').props.onClick();
  await settle();
  tree=await harness.rerender();
  assert.ok(all(tree,node=>node.props?.['data-detail']==='open').length);
  assert.match(text(tree),/执行观察（不是最终结果）/);
  assert.match(text(tree),/最终规范结果/);
  assert.match(text(tree),/不能据此认定最终成功/);
  assert.match(text(tree),/"name":"role_read"/);

  button(tree,'读取材料正文').props.onClick();
  await settle();
  tree=await harness.rerender();
  assert.match(text(tree),/full material body/);

  button(tree,'读取原始 JSON').props.onClick();
  await settle();
  tree=await harness.rerender();
  assert.match(text(tree),/记录内容已变化，请重新打开详情/);

  button(tree,'返回执行列表').props.onClick();
  await settle();
  tree=await harness.rerender();
  assert.equal(all(tree,node=>node.props?.['data-detail']==='closed').length,1);

  button(tree,'原生记录').props.onClick();
  await settle();
  tree=await harness.rerender();
  listButton(tree,'SDK 外置资料归属缺口').props.onClick();
  await settle();
  tree=await harness.rerender();
  assert.match(text(tree),/原生事件与闭合信息/);
  assert.match(text(tree),/sdk-spill-gap/);
  button(tree,'查找同一执行').props.onClick();
  await settle();
  tree=await harness.rerender();
  assert.equal(button(tree,'工具执行').props['aria-current'],'page');
  assert.equal(harness.calls.filter(call=>call.method==='query').at(-1).request.keyword,'run-link');
});

test('筛选回到第一页并关闭详情，空结果和只读浏览保留恢复入口',async t=>{
  const harness=await openExecutions('read-only');
  t.after(harness.cleanup);
  let tree=harness.tree();
  listButton(tree,'role_read').props.onClick();
  await settle();
  tree=await harness.rerender();
  assert.match(text(tree),/只读副本/);
  assert.equal(text(tree).includes('重试原工具记录保存'),false);

  const sort=control(tree,'排序');
  sort.props.onChange({target:{value:'oldest'}});
  tree=await harness.rerender();
  all(tree,node=>node.type==='form'&&node.props?.['aria-label']==='工具执行筛选')[0].props.onSubmit({preventDefault(){}});
  await settle();
  tree=await harness.rerender();
  assert.equal(all(tree,node=>node.props?.['data-detail']==='closed').length,1);
  assert.equal(harness.calls.filter(call=>call.method==='query').at(-1).request.sort,'oldest');
  assert.equal(harness.calls.filter(call=>call.method==='query').at(-1).request.offset,0);

  const search=control(tree,'搜索执行记录');
  search.props.onChange({target:{value:'none'}});
  tree=await harness.rerender();
  all(tree,node=>node.type==='form'&&node.props?.['aria-label']==='工具执行筛选')[0].props.onSubmit({preventDefault(){}});
  await settle();
  tree=await harness.rerender();
  assert.match(text(tree),/没有匹配记录/);
  const clear=all(tree,node=>node.type==='button'&&text(node)==='清除筛选').at(-1);
  clear.props.onClick();
  await settle();
  tree=await harness.rerender();
  assert.match(text(tree),/role_read/);
});
