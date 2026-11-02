import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHookRuntime} from './react-hook-runtime.mjs';

function textContent(node) {
  if(node===null||node===undefined||typeof node==='boolean')return'';
  if(typeof node==='string'||typeof node==='number')return String(node);
  if(Array.isArray(node))return node.map(textContent).join('');
  return textContent(node.props?.children);
}

function findAll(node,predicate,found=[]) {
  if(!node||typeof node!=='object')return found;
  if(!Array.isArray(node)&&predicate(node))found.push(node);
  const children=Array.isArray(node)?node:node.props?.children;
  if(Array.isArray(children))for(const child of children)findAll(child,predicate,found);
  else findAll(children,predicate,found);
  return found;
}

const find=(node,predicate)=>findAll(node,predicate)[0];
const button=(node,label)=>find(node,candidate=>candidate.type==='button'&&textContent(candidate)===label);
const field=(node,label)=>find(node,candidate=>candidate.props?.['aria-label']===label);

function readyView() {
  return {
    packageName:'dsh-role-companion',packageVersion:'0.1.3',requiredDsh:'0.2.1-rc.3',installed:true,enabled:true,fiberPhase:'active',
    bootstrap:{path:'/tmp/role',roleId:'role-1',creationOperationId:'create',registrationOperationId:'create',version:1},
    role:{status:'ready',reason:'',roleId:'role-1',revision:12,backups:[],cleanups:[],home:{roleId:'role-1',revision:12,panelBinding:{bindingId:'panel-role-1',bindingVersion:1,source:'owner-panel'}}},
    selectedRoleId:'role-1',capabilities:[],
  };
}

function sourceRow(kind,overrides={}) {
  const common={contentDigest:String(kind==='core'?'a':'b').repeat(64),completeness:'complete',dependencies:[],dataOrigins:[],modelAttempts:[],lineage:'known',derivedRead:false,availableForDaily:kind==='core'};
  if(kind==='core')return {source:{ref:{kind:'core'},speaker:'owner',coreVersion:1,committedRevision:1,...common},preview:'核心设定：诚实记录每天的经历与依据。',occurredAt:null,...overrides};
  if(kind==='input')return {source:{ref:{kind:'input',id:'input-11111111-1111-4111-8111-111111111111'},speaker:'user',experienceId:'experience-input',runId:'run-source',receiveSequence:1,binding:{bindingId:'panel-role-1',bindingVersion:1},occurredAt:'2026-10-20T08:00:00.000Z',committedRevision:2,...common},preview:'我在一封旧信里发现了蓝盐灯塔的坐标。',occurredAt:'2026-10-20T08:00:00.000Z',...overrides};
  return {source:{ref:{kind:'reply',id:'reply-22222222-2222-4222-8222-222222222222'},speaker:'role',experienceId:'experience-reply',binding:{bindingId:'panel-role-1',bindingVersion:1},occurredAt:'2026-10-21T09:00:00.000Z',timeKind:'turn-start',runId:'run-reply',inputIds:['input-11111111-1111-4111-8111-111111111111'],committedRevision:5,evidence:'generated-output-not-delivery-or-truth',...common},preview:'我会继续查证灯塔坐标，不把猜测当作事实。',occurredAt:'2026-10-21T09:00:00.000Z',...overrides};
}

function sourcePage(request) {
  const keyword=request.keyword??'',query={keyword,types:request.types??['core','input','reply'],completeness:request.completeness??'all',availability:request.availability??'all',from:request.from??null,to:request.to??null,sort:request.sort??'newest'};
  const rows=keyword==='蓝盐灯塔'?[sourceRow('input')]:keyword==='没有结果'?[]:[sourceRow('core'),sourceRow('reply'),sourceRow('input')];
  const offset=request.offset??0,limit=request.limit??20,sources=rows.slice(offset,offset+limit);
  return {basis:{roleId:'role-1',revision:12,contextGeneration:3,coreVersion:1},purpose:'management',revision:12,query,filterKey:JSON.stringify(query),sources,offset,limit,total:rows.length,datasetTotal:37,rangeStart:sources.length?offset+1:0,rangeEnd:sources.length?offset+sources.length:0,more:offset+sources.length<rows.length,nextOffset:offset+sources.length<rows.length?offset+sources.length:null};
}

test('资料库来源面板支持宿主检索、筛选标签、分页和带冲突保护的详情',{timeout:30000},async t=>{
  const previousWindow=globalThis.window,previousDocument=globalThis.document,previousLocalStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  let loaded;
  globalThis.window={__ModuleLoader__:{load(value){loaded=value;}}};
  globalThis.document={querySelector(){return null;},createElement(){return{dataset:{}};},head:{appendChild(){}}};
  const storage=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,writable:true,value:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)}});
  t.after(()=>{
    hookRuntime.reset();
    if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
    if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
    if(previousLocalStorage===undefined)delete globalThis.localStorage;else Object.defineProperty(globalThis,'localStorage',previousLocalStorage);
  });
  const hookRuntime=createHookRuntime(),nodeRequire=createRequire(import.meta.url);
  await import(`${pathToFileURL('packages/companion/lib/client.js').href}?library-sources-client=${Date.now()}`);
  const plugin=loaded.factory(name=>name==='react'?hookRuntime.exports:name==='react/jsx-runtime'?{Fragment:Symbol('Fragment'),jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:nodeRequire(name));
  const calls=[],registrations=[];
  let detailConflict=false;
  const remote={
    async inspect(){return{ok:true,value:readyView()};},
    async readLibrarySources(roleId,bindingVersion,request){calls.push({method:'readLibrarySources',roleId,bindingVersion,request});return{ok:true,value:sourcePage(request)};},
    async readContextSource(roleId,bindingVersion,request){
      calls.push({method:'readContextSource',roleId,bindingVersion,request});
      if(detailConflict)return{ok:false,error:{code:'role/home-error',details:{reason:'CONTEXT_SOURCE_CHANGED'}}};
      return{ok:true,value:{basis:{roleId:'role-1',revision:12,contextGeneration:3,coreVersion:1},source:sourceRow('input').source,text:'蓝盐灯塔的第一段正文。\n'.repeat(8),offset:request.offset,totalCodePoints:320,more:true}};
    },
  };
  const ctx={
    remote:{$mount:async()=>{},roleCompanion:remote},
    pluginNavigation:{openBundle(){}},
    inject(names,callback){assert.deepEqual(names,['remote.roleCompanion']);callback(this);},
    slots:{inject(name,callback){callback();},register(options,component){registrations.push({options,component});return()=>{};}},
  };
  await plugin.apply(ctx);
  const pageComponent=registrations.find(item=>item.options.name==='plugins.bundle.config').component({view:'page'});
  let tree=await hookRuntime.render(pageComponent);
  const libraryNav=()=>find(tree,candidate=>candidate.type==='nav'&&candidate.props?.['aria-label']==='资料库一级视图');
  button(libraryNav(),'来源').props.onClick();
  tree=await hookRuntime.render(pageComponent);
  assert.match(textContent(tree),/用户来信/);
  assert.match(textContent(tree),/角色回复/);
  assert.match(textContent(tree),/蓝盐灯塔/);
  assert.match(textContent(tree),/完整/);
  assert.doesNotMatch(textContent(find(tree,candidate=>candidate.props?.['data-source-list']!==undefined)),/input-11111111/);

  const search=field(tree,'搜索来源正文');
  search.props.onChange({target:{value:'蓝盐灯塔'}});
  tree=await hookRuntime.render(pageComponent);
  button(tree,'搜索来源').props.onClick();
  tree=await hookRuntime.render(pageComponent);
  assert.equal(calls.at(-1).request.keyword,'蓝盐灯塔');
  assert.match(textContent(tree),/关键词：蓝盐灯塔/);
  const keywordChip=find(tree,candidate=>candidate.type==='button'&&textContent(candidate).includes('关键词：蓝盐灯塔'));
  assert.ok(keywordChip);
  keywordChip.props.onClick();
  tree=await hookRuntime.render(pageComponent);
  assert.equal(calls.at(-1).request.keyword,'');

  const pageSize=field(tree,'每页来源数');
  pageSize.props.onChange({target:{value:'50'}});
  tree=await hookRuntime.render(pageComponent);
  assert.equal(calls.at(-1).request.limit,50);

  const detailButton=find(tree,candidate=>candidate.type==='button'&&String(candidate.props?.['aria-label']??'').startsWith('打开用户来信：'));
  assert.ok(detailButton);
  detailButton.props.onClick();
  tree=await hookRuntime.render(pageComponent);
  assert.match(textContent(tree),/蓝盐灯塔的第一段正文/);
  assert.match(textContent(tree),/技术信息/);
  assert.ok(button(tree,'返回来源列表'));
  detailConflict=true;
  button(tree,'继续读取正文').props.onClick();
  tree=await hookRuntime.render(pageComponent);
  assert.match(textContent(tree),/记录已变化/);
  button(tree,'返回来源列表').props.onClick();
  tree=await hookRuntime.render(pageComponent);

  const emptySearch=field(tree,'搜索来源正文');
  emptySearch.props.onChange({target:{value:'没有结果'}});
  tree=await hookRuntime.render(pageComponent);
  button(tree,'搜索来源').props.onClick();
  tree=await hookRuntime.render(pageComponent);
  assert.match(textContent(tree),/无匹配结果/);
  button(tree,'清除筛选').props.onClick();
  tree=await hookRuntime.render(pageComponent);
  assert.equal(calls.at(-1).request.keyword,'');
});
