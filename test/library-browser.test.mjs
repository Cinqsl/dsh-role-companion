import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {chromium} from 'playwright-core';
import {bootOfficialCliFixture} from './official-cli-fixture.mjs';
import {response} from './native-fixture.mjs';
import {createLibraryBrowserFixture} from './library-browser-fixture.mjs';

const root=new URL('..',import.meta.url).pathname;
const chromePath='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const evidencePath=join(root,'evidence/role-library-v1');

async function waitForLibrary(page) {
  await page.getByRole('heading',{name:'角色资料库',exact:true}).waitFor({state:'visible',timeout:20000});
  await page.locator('.rcLibraryContent').waitFor({state:'visible',timeout:20000});
}

async function openLibrary(page,origin) {
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2500);
  const continueButton=page.getByRole('button',{name:'继续'});
  if(await continueButton.isVisible().catch(()=>false)) {
    await continueButton.click();
    await continueButton.waitFor({state:'hidden',timeout:30000});
    await page.waitForTimeout(500);
  }
  await page.getByRole('button',{name:'账号菜单'}).click();
  await page.waitForTimeout(500);
  await page.getByText('设置',{exact:true}).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button',{name:'DSH 角色伙伴',exact:true}).click();
  await page.waitForTimeout(1500);
  const refresh=page.getByRole('button',{name:'刷新状态'}).first();
  if(await refresh.isVisible().catch(()=>false)) {
    await refresh.click();
    await page.waitForTimeout(1200);
  }
  await page.getByRole('button',{name:'打开完整资料库'}).click();
  await page.waitForTimeout(1500);
  const close=page.getByRole('button',{name:'关闭',exact:true});
  if(await close.isVisible().catch(()=>false)) {
    await close.click();
    await page.waitForTimeout(1000);
  }
  const pluginSwitch=page.getByRole('switch',{name:'启用 dsh-role-companion'});
  if(await pluginSwitch.isVisible().catch(()=>false)) {
    await pluginSwitch.click();
    await page.waitForTimeout(2500);
    await pluginSwitch.click();
    await page.waitForTimeout(3500);
  }
  await waitForLibrary(page);
}

async function selectNavigation(page,label) {
  const desktop=page.locator('.rcLibraryFullNav button:visible').filter({hasText:new RegExp(`^${label}$`)});
  if(await desktop.count()) {
    await desktop.first().click();
    return;
  }
  await page.locator('.rcLibraryMenu summary:visible').click();
  const compact=page.locator('.rcLibraryMenuOptions button:visible').filter({hasText:new RegExp(`^${label}$`)});
  assert.equal(await compact.count(),1);
  await compact.click();
}

async function assertNoHorizontalOverflow(page) {
  const dimensions=await page.evaluate(()=>{
    const panel=document.querySelector('.rcLibraryPanel');
    return {
      viewport:document.documentElement.clientWidth,
      document:document.documentElement.scrollWidth,
      panel:panel?Math.ceil(panel.getBoundingClientRect().right):0,
    };
  });
  assert.ok(dimensions.document<=dimensions.viewport+1,JSON.stringify(dimensions));
  assert.ok(dimensions.panel<=dimensions.viewport+1,JSON.stringify(dimensions));
}

test('真实构建资料库在桌面和窄屏完成导航、详情、筛选、维护和键盘操作',{timeout:300000},async t=>{
  const run=await mkdtemp(join(tmpdir(),'dsh-library-browser-'));
  let host,browser;
  t.after(async()=>{
    await browser?.close();
    if(host)await host.stop();
    await rm(run,{recursive:true,force:true});
  });
  await mkdir(evidencePath,{recursive:true});
  execFileSync('npm',['run','pack:plugin'],{cwd:root,stdio:'ignore'});
  const artifact=join(root,'artifacts/dsh-role-companion-0.1.3.tgz');
  const fixture=await createLibraryBrowserFixture(run);
  host=await bootOfficialCliFixture(run,()=>response('浏览器资料库验收模型返回。'),{
    profileName:'library75',
    installPackage:artifact,
    captureTransportError:true,
    bootstrap:{
      path:fixture.path,
      roleId:fixture.roleId,
      creationOperationId:'proposal-create46',
      registrationOperationId:'proposal-create46',
      version:0,
    },
  });
  for(let attempt=0;attempt<120;attempt+=1) {
    const current=await host.rpc('inspect');
    const summary=current.role.home?.inputSummary;
    if(summary&&summary.queued===0&&summary.running===0)break;
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  const modelEntriesBeforeBrowsing=host.entries.length;
  const readOverview=await host.rpc('readLibraryOverview',{
    expectedRoleId:fixture.roleId,
    expectedBindingVersion:1,
  });
  assert.ok(readOverview.recent.some(item=>item.kind==='source'),JSON.stringify(readOverview.recent));
  const origin=new URL(host.privateLoginUrl).origin;
  const exchange=await fetch(host.privateLoginUrl,{redirect:'manual'});
  const cookies=exchange.headers.getSetCookie().map(value=>{
    const [pair]=value.split(';'),index=pair.indexOf('=');
    return {name:pair.slice(0,index),value:pair.slice(index+1),url:origin};
  });
  browser=await chromium.launch({executablePath:chromePath,headless:true});

  const desktop=await browser.newContext({viewport:{width:960,height:900},locale:'zh-CN'});
  const page=await desktop.newPage();
  await desktop.addCookies(cookies);
  await openLibrary(page,origin);
  await page.getByText('概览',{exact:true}).first().waitFor();
  await assertNoHorizontalOverflow(page);
  await page.screenshot({path:join(evidencePath,'desktop-overview.png'),fullPage:true});

  await selectNavigation(page,'来源');
  await page.locator('.rcSourcesLibrary').waitFor();
  await page.locator('.rcSourceRow:visible').first().waitFor();
  assert.doesNotMatch(await page.locator('.rcSourcesLibrary').innerText(),/\brevision\b/i);
  await page.getByLabel('来源类型').selectOption('input');
  await page.getByRole('button',{name:'下一页来源'}).click();
  await page.getByText(/当前 21–/).waitFor();
  await selectNavigation(page,'概览');
  await page.locator('.rcOverviewRecent').waitFor();
  const recentOverviewText=await page.locator('.rcOverviewRecent').innerText();
  assert.match(recentOverviewText,/用户来信|角色回复/);
  await page.locator('.rcOverviewRecent button').filter({hasText:/用户来信|角色回复/}).first().click();
  await page.locator('.rcSourceDetail:visible').waitFor();
  await page.locator('.rcSourceBody').waitFor();
  await selectNavigation(page,'来源');
  await page.locator('.rcSourceRow:visible').first().waitFor();
  await page.getByLabel('搜索来源正文').fill('蓝盐灯塔');
  await page.getByRole('button',{name:'搜索来源'}).click();
  await page.getByText(/筛选后 1 条/).waitFor();
  await page.locator('.rcSourceRow:visible').filter({hasText:'蓝盐灯塔'}).first().click();
  await page.locator('.rcSourceBody').waitFor();
  assert.match(await page.locator('.rcSourceDetail').innerText(),/技术信息/);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({path:join(evidencePath,'desktop-sources-detail.png'),fullPage:true});
  const beforeChange=await host.rpc('inspect');
  const home=beforeChange.role.home;
  assert.ok(home);
  await host.rpc('applyOwner',{
    expectedRoleId:fixture.roleId,
    command:{
      kind:'edit-core',
      operationId:'library-browser-core-change',
      text:'浏览器验收：记录变化后必须重新读取来源。',
      expectedCoreVersion:home.core.version,
      expectedRevision:home.revision,
    },
  });
  await page.getByRole('button',{name:'继续读取正文'}).click();
  await page.getByText(/记录已变化/).first().waitFor();
  await page.screenshot({path:join(evidencePath,'desktop-sources-conflict.png'),fullPage:true});
  await page.getByRole('button',{name:'刷新资料',exact:true}).click();
  await page.waitForTimeout(1000);

  await page.getByLabel('搜索来源正文').fill('绝对不存在的来源词');
  await page.getByRole('button',{name:'搜索来源'}).click();
  await page.getByText('无匹配结果',{exact:true}).waitFor();
  await page.getByRole('button',{name:'清除筛选'}).last().click();
  await page.locator('.rcSourceRow:visible').first().waitFor();
  await page.getByRole('button',{name:'下一页来源'}).click();
  await page.getByText(/当前 21–/).waitFor();
  await page.screenshot({path:join(evidencePath,'desktop-sources-page-2.png'),fullPage:true});

  await selectNavigation(page,'知识');
  await page.locator('.rcKnowledgeRecord:visible').first().waitFor();
  await page.locator('.rcKnowledgeRecord:visible').first().click();
  await page.locator('.rcKnowledgeDetail:visible').waitFor();
  assert.match(await page.locator('.rcKnowledgeDetail').innerText(),/正文/);
  assert.doesNotMatch(await page.locator('.rcKnowledgeLibrary').innerText(),/\brevision\b/i);
  await page.screenshot({path:join(evidencePath,'desktop-knowledge-detail.png'),fullPage:true});
  await page.evaluate(({roleId})=>{
    const key=`dsh-role-companion:library-preference:v1:${roleId}:knowledge:1`;
    localStorage.setItem(key,JSON.stringify({
      collection:'versions',
      tabs:{
        versions:{filters:{keyword:'持久化旧筛选',kind:'',scope:'all',status:'',from:'',to:'',order:'newest'},offset:20,limit:20},
        proposals:{filters:{keyword:'',kind:'',scope:'all',status:'',from:'',to:'',order:'newest'},offset:0,limit:20},
      },
    }));
  },{roleId:fixture.roleId});
  await selectNavigation(page,'概览');
  await page.locator('.rcOverviewRecent button').filter({hasText:'知识版本'}).first().click();
  await page.locator('.rcKnowledgeDetail:visible').waitFor();
  assert.equal(await page.getByLabel('关键词').inputValue(),'');
  await page.getByLabel('开始日期').fill('2026-12-02');
  await page.getByLabel('结束日期').fill('2026-01-01');
  await page.getByText(/知识目录读取未完成/).waitFor();
  assert.equal(await page.locator('.rcLibraryFullNav').isVisible(),true);
  await page.screenshot({path:join(evidencePath,'desktop-knowledge-load-error.png'),fullPage:true});
  await page.getByRole('button',{name:'清除筛选'}).click();
  await page.locator('.rcKnowledgeRecord:visible').first().waitFor();

  await selectNavigation(page,'执行记录');
  await page.locator('.rcExecutionListItem:visible').first().waitFor();
  await page.locator('.rcExecutionListItem:visible').first().click();
  await page.locator('.rcExecutionDetailPane:visible').waitFor();
  await page.getByText('执行观察（不是最终结果）',{exact:true}).waitFor();
  const executionDetail=await page.locator('.rcExecutionDetailPane').innerText();
  assert.match(executionDetail,/执行观察（不是最终结果）/);
  assert.match(executionDetail,/最终规范结果/);
  assert.doesNotMatch(await page.locator('.rcExecutions').innerText(),/\brevision\b/i);
  await page.screenshot({path:join(evidencePath,'desktop-execution-detail.png'),fullPage:true});

  await selectNavigation(page,'维护');
  await page.getByRole('heading',{name:'清理经历来源'}).waitFor();
  const selectable=page.locator('.rcCleanupRows input[type="checkbox"]:not(:disabled)').first();
  await selectable.check();
  await page.getByRole('button',{name:'继续预览'}).click();
  await page.getByText('将撤销的记录',{exact:true}).waitFor();
  await page.getByText('保留的结果元数据',{exact:true}).waitFor();
  await page.getByRole('heading',{name:'将撤销的记录',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:join(evidencePath,'desktop-maintenance-preview.png'),fullPage:true});
  await page.getByRole('button',{name:'确认清理所选记录'}).click();
  await page.getByText(/等待已进入动作及最终归档/).waitFor({timeout:30000});

  const mobile=await browser.newContext({viewport:{width:390,height:844},locale:'zh-CN'});
  const mobilePage=await mobile.newPage();
  await mobile.addCookies(cookies);
  await openLibrary(mobilePage,origin);
  await assertNoHorizontalOverflow(mobilePage);
  assert.equal(await mobilePage.locator('.rcLibraryFullNav').isVisible(),false);
  assert.equal(await mobilePage.locator('.rcLibraryMenu').isVisible(),true);
  await mobilePage.screenshot({path:join(evidencePath,'mobile-overview.png'),fullPage:true});

  await selectNavigation(mobilePage,'来源');
  await mobilePage.locator('.rcSourceRow:visible').first().waitFor();
  await assertNoHorizontalOverflow(mobilePage);
  await mobilePage.screenshot({path:join(evidencePath,'mobile-sources-list.png'),fullPage:true});
  await mobilePage.getByLabel('搜索来源正文').fill('蓝盐灯塔');
  await mobilePage.getByRole('button',{name:'搜索来源'}).click();
  await mobilePage.getByText(/筛选后 1 条/).waitFor();
  const row=mobilePage.locator('.rcSourceRow:visible').filter({hasText:'蓝盐灯塔'}).first();
  await row.click();
  const detail=mobilePage.locator('.rcSourceDetail:visible');
  await detail.waitFor();
  assert.equal(await mobilePage.locator('.rcSourceIndex').isVisible(),false);
  await mobilePage.waitForFunction(()=>document.activeElement?.tagName==='H3',{timeout:5000});
  await mobilePage.locator('.rcSourceBody').waitFor();
  assert.equal(await mobilePage.evaluate(()=>document.activeElement?.tagName),'H3');
  await assertNoHorizontalOverflow(mobilePage);
  await mobilePage.screenshot({path:join(evidencePath,'mobile-source-detail.png'),fullPage:true});
  await mobilePage.keyboard.press('Escape');
  await mobilePage.locator('.rcSourceIndex:visible').waitFor();
  assert.equal(await detail.isVisible(),false);
  await mobilePage.waitForFunction(()=>document.activeElement?.matches('.rcSourceRow'));
  assert.equal(await mobilePage.locator('.rcSourceRow:focus').count(),1);

  await selectNavigation(mobilePage,'知识');
  await mobilePage.locator('.rcKnowledgeRecord:visible').first().waitFor();
  await mobilePage.locator('.rcKnowledgeRecord:visible').first().click();
  await mobilePage.locator('.rcKnowledgeDetail:visible').waitFor();
  await assertNoHorizontalOverflow(mobilePage);
  await mobilePage.screenshot({path:join(evidencePath,'mobile-knowledge-detail.png'),fullPage:true});
  await mobilePage.keyboard.press('Escape');
  await mobilePage.locator('.rcKnowledgeRecords:visible').waitFor();

  await selectNavigation(mobilePage,'执行记录');
  await mobilePage.locator('.rcExecutionListItem:visible').first().waitFor();
  await mobilePage.locator('.rcExecutionListItem:visible').first().click();
  await mobilePage.locator('.rcExecutionDetailPane:visible').waitFor();
  await mobilePage.locator('.rcExecutionDetailSection[data-field="request"] .rcExecutionText').waitFor();
  await assertNoHorizontalOverflow(mobilePage);
  await mobilePage.screenshot({path:join(evidencePath,'mobile-execution-detail.png'),fullPage:true});
  await mobilePage.getByRole('button',{name:'返回执行列表'}).click();
  await mobilePage.locator('.rcExecutionList:visible').first().waitFor();

  await selectNavigation(mobilePage,'维护');
  await mobilePage.getByRole('heading',{name:'清理经历来源'}).waitFor();
  await assertNoHorizontalOverflow(mobilePage);
  await mobilePage.screenshot({path:join(evidencePath,'mobile-maintenance.png'),fullPage:true});

  await selectNavigation(mobilePage,'概览');
  await mobilePage.locator('.rcOverviewCategories').waitFor();
  await assertNoHorizontalOverflow(mobilePage);

  assert.equal(host.entries.length,modelEntriesBeforeBrowsing,'browsing the library must not trigger a model request');
  await desktop.close();
  await mobile.close();
});
