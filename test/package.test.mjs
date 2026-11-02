import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, rm, writeFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { Context } from '@deepseek-ai/cordis';

test('插件声明支持 DSH rc.2 与 rc.3', async () => {
  const plugin = await import(pathToFileURL(resolve('packages/companion/lib/index.js')).href);
  assert.equal(plugin.supportsDshVersion('0.2.1-rc.2'), true);
  assert.equal(plugin.supportsDshVersion('0.2.1-rc.3'), true);
  assert.equal(plugin.supportsDshVersion('0.2.1-rc.1'), false);
});

test('仅放行已审计的 BrowserSkill post-execute 组合', async () => {
  const plugin = await import(pathToFileURL(resolve('packages/companion/lib/index.js')).href);
  assert.equal(plugin.approvedPostEntry('browserskill','@wxg-prc-cpg/browser-skill-dsh-plugin'), true);
  assert.equal(plugin.approvedPostEntry('browserskill','@example/unknown'), false);
  assert.equal(plugin.approvedPostEntry('foreign','@wxg-prc-cpg/browser-skill-dsh-plugin'), false);
});

test('角色工作会话使用专用空工具预设并标记为内部 subagent', async () => {
  const patch = await readFile(resolve('packages/companion/cordis.patch.yml'), 'utf8');
  assert.match(patch, /id: role-companion-preset[\s\S]*?id: dsh-role-companion-work-v1[\s\S]*?plugins: \[\]/);
  const library = await readFile(resolve('packages/companion/lib/index.js'), 'utf8');
  assert.match(library, /agent\.session\.append\("subagent\/descriptor"/);
});

for (const missing of ['client.js','typert.host.js','typert.remote-client.js']) {
  test(`安装产物缺少 ${missing} 时明确拒绝激活`, async t => {
    const dir = await specimen(t);
    await rm(join(dir,'lib',missing));
    const plugin = await import(pathToFileURL(join(dir,'lib/index.js')).href);
    const ctx = new Context();
    t.after(()=>ctx.fiber.dispose());
    assert.throws(()=>plugin.apply(ctx), error => error.code === 'PACKAGE_ARTIFACT_MISSING');
  });
}

async function specimen(t) {
  await mkdir('.runs',{recursive:true});
  const dir = await mkdtemp(resolve('.runs/package-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  await cp('packages/companion/lib',join(dir,'lib'),{recursive:true});
  await cp('packages/companion/package.json',join(dir,'package.json'));
  return dir;
}
