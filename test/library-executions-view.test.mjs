import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {openRoleHome} from 'dsh-role-companion/home';
import {
  executionLibraryPage,
  readExecutionLibraryDetail,
  readExecutionLibraryPart,
  validateExecutionLibraryQuery,
} from 'dsh-role-companion';
import {createToolViewFixture} from './tool-view-fixture.mjs';

function query(collection,overrides={}){
  return {
    collection,
    keyword:'',
    toolName:'all',
    result:'all',
    channel:'all',
    from:null,
    to:null,
    sort:'newest',
    offset:0,
    limit:20,
    expectedRevision:null,
    ...overrides,
  };
}

async function openFixture(t){
  const root=await mkdtemp(join(tmpdir(),'library-executions-view-'));
  const fixture=await createToolViewFixture(join(root,'home'));
  const home=await openRoleHome(fixture.path);
  t.after(async()=>{await home.close();await rm(root,{recursive:true,force:true});});
  return {fixture,home,state:await home.readConversation(),snapshot:await home.readSnapshot()};
}

test('执行查询在完整集合上筛选、排序并按独立修订分页',async t=>{
  const {fixture,state,snapshot}=await openFixture(t);
  const panel=snapshot.panelBinding;
  const page=(request)=>executionLibraryPage(state,fixture.roleId,panel,snapshot.qqBinding??null,request);

  assert.equal(page(query('tools',{toolName:'role_read'})).total,3);
  const pending=page(query('tools',{result:'pending'}));
  assert.equal(pending.total,2);
  assert.equal(pending.items.every(item=>/最终结果待保存/.test(item.summary)),true);

  const gaps=page(query('native',{result:'gap'}));
  assert.equal(gaps.total,2);
  assert.equal(gaps.items.some(item=>item.name==='SDK 外置资料归属缺口'),true);
  assert.equal(page(query('native',{result:'synthetic'})).total,3);
  assert.equal(page(query('native',{result:'error'})).total,1);

  const keyword=page(query('native',{keyword:'SDK_SPILL_UNPROVEN'}));
  assert.equal(keyword.total,1);
  assert.equal(JSON.stringify(keyword).includes(fixture.privateLocator),false);
  assert.equal(JSON.stringify(keyword).includes(fixture.text),false);
  assert.equal(page(query('tools',{keyword:fixture.privateLocator})).total,0);
  assert.equal(page(query('native',{keyword:fixture.privateLocator})).total,0);
  assert.equal(page(query('tools',{keyword:'完整工具正文🌟'})).total,0);
  assert.equal(page(query('native',{keyword:'完整工具正文🌟'})).total,0);

  const newest=page(query('native',{sort:'newest'}));
  const oldest=page(query('native',{sort:'oldest'}));
  assert.deepEqual(oldest.items.map(item=>item.recordId),newest.items.map(item=>item.recordId).reverse());
  assert.equal(page(query('native',{from:'2027-01-01T00:00:00.000Z'})).total,0);

  const expanded=structuredClone(state);
  expanded.nativeRecords=[
    ...expanded.nativeRecords,
    ...Array.from({length:20},(_,index)=>({
      ...structuredClone(expanded.nativeRecords[0]),
      nativeId:`native-exposure-${String(index).padStart(2,'0')}`,
    })),
  ];
  const first=executionLibraryPage(expanded,fixture.roleId,panel,snapshot.qqBinding??null,query('native',{expectedRevision:state.revision}));
  const second=executionLibraryPage(expanded,fixture.roleId,panel,snapshot.qqBinding??null,query('native',{offset:20,expectedRevision:state.revision}));
  assert.equal(first.total,28);
  assert.equal(first.items.length,20);
  assert.equal(first.more,true);
  assert.equal(first.nextOffset,20);
  assert.equal(second.items.length,8);
  assert.equal(second.more,false);

  assert.throws(
    ()=>executionLibraryPage(state,fixture.roleId,panel,snapshot.qqBinding??null,query('tools',{offset:20,expectedRevision:0})),
    error=>error.code==='EXECUTION_LIBRARY_REVISION_CHANGED',
  );
  assert.throws(()=>validateExecutionLibraryQuery({...query('tools'),extra:true}),error=>error.code==='INVALID_EXECUTION_LIBRARY_PAGE');
  assert.throws(()=>validateExecutionLibraryQuery(query('tools',{from:'2026-02-01T00:00:00.000Z',to:'2026-01-01T00:00:00.000Z'})),error=>error.code==='INVALID_EXECUTION_LIBRARY_PAGE');
});

test('执行页面暴露稳定的规范化筛选标识',async t=>{
  const {fixture,state,snapshot}=await openFixture(t);
  const panel=snapshot.panelBinding;
  const page=request=>executionLibraryPage(state,fixture.roleId,panel,snapshot.qqBinding??null,request);
  const first=page(query('tools',{
    keyword:' ROLE_READ ',
    from:'2026-01-01T00:00:00.000Z',
  }));
  const sameFiltersReordered=page({
    expectedRevision:null,
    limit:50,
    offset:20,
    sort:'newest',
    to:null,
    from:'2026-01-01T00:00:00.000Z',
    channel:'all',
    result:'all',
    toolName:'all',
    keyword:' ROLE_READ ',
    collection:'tools',
  });
  const changed=page(query('tools',{
    keyword:' ROLE_READ ',
    from:'2026-01-01T00:00:00.000Z',
    result:'pending',
  }));

  assert.equal(
    first.filterKey,
    '{"collection":"tools","keyword":"role_read","toolName":"all","result":"all","channel":"all","from":"2026-01-01T00:00:00.000Z","to":null,"sort":"newest"}',
  );
  assert.equal(first.filterKey,sameFiltersReordered.filterKey);
  assert.notEqual(first.filterKey,changed.filterKey);
});

test('执行详情分段读取请求、观察、最终结果、材料和原生事件',async t=>{
  const {fixture,home,state,snapshot}=await openFixture(t);
  const panel=snapshot.panelBinding;
  const detail=(collection,recordId)=>readExecutionLibraryDetail(
    home,
    fixture.roleId,
    panel,
    {collection,recordId,expectedRevision:state.revision},
  );
  const success=await detail('tools',fixture.attempts.success);
  assert.match(success.contentDigest,/^[a-f0-9]{64}$/);
  assert.equal(success.sections.some(section=>section.field==='request'),true);
  assert.equal(success.sections.some(section=>section.field==='observation'),true);
  assert.equal(success.sections.some(section=>section.field==='final'),true);
  assert.equal(success.sections.filter(section=>section.field==='material').length,5);
  assert.equal(success.sections.some(section=>section.field==='raw'),true);

  const part=(field,overrides={})=>readExecutionLibraryPart(home,fixture.roleId,panel,{
    collection:'tools',
    recordId:fixture.attempts.success,
    field,
    materialId:null,
    offset:0,
    limit:4096,
    expectedRevision:state.revision,
    expectedContentDigest:success.contentDigest,
    ...overrides,
  });
  const complete=async(field,overrides={})=>{
    let offset=0,text='',page;
    do{
      page=await part(field,{...overrides,offset});
      text+=page.text;
      offset=page.nextOffset??offset+Array.from(page.text).length;
    }while(page.more);
    return {...page,text};
  };
  assert.deepEqual(JSON.parse((await part('request')).text),{name:'role_read'});
  const observation=JSON.parse((await complete('observation')).text);
  assert.equal(observation.kind,'returned');
  assert.equal(Array.from(observation.value.text).length,Array.from(fixture.text).length);
  assert.equal(observation.value.text,fixture.text);
  assert.equal(JSON.parse((await complete('final')).text).isError,false);

  const materialId=success.sections.find(section=>section.field==='material').materialId;
  const materialText=(await complete('material',{materialId})).text;
  assert.equal(materialText.length,fixture.text.length+3);
  assert.equal(materialText.endsWith('材料0'),true);
  const raw=await part('raw');
  assert.equal(raw.more,true);
  const rawNext=await part('raw',{offset:raw.nextOffset});
  assert.equal(raw.contentDigest,rawNext.contentDigest);
  assert.notEqual(rawNext.text,'');

  const gap=await detail('native',fixture.native.find(record=>record.name==='spill-gap').recordId);
  assert.equal(gap.item.native.status,'gap');
  let nativeText='',nativeOffset=0,nativePart;
  do{
    nativePart=await readExecutionLibraryPart(home,fixture.roleId,panel,{
      collection:'native',
      recordId:gap.item.recordId,
      field:'native',
      materialId:null,
      offset:nativeOffset,
      limit:4096,
      expectedRevision:state.revision,
      expectedContentDigest:gap.contentDigest,
    });
    nativeText+=nativePart.text;
    nativeOffset=nativePart.nextOffset??nativeOffset+Array.from(nativePart.text).length;
  }while(nativePart.more);
  assert.equal(JSON.parse(nativeText).kind,'sdk-spill-gap');

  await assert.rejects(
    ()=>part('raw',{expectedContentDigest:'0'.repeat(64)}),
    error=>error.code==='EXECUTION_RECORD_CHANGED',
  );
  await assert.rejects(
    ()=>part('raw',{expectedRevision:0}),
    error=>error.code==='EXECUTION_LIBRARY_REVISION_CHANGED',
  );
  await assert.rejects(
    ()=>detail('tools','missing-attempt'),
    error=>error.code==='EXECUTION_RECORD_NOT_FOUND',
  );
});
