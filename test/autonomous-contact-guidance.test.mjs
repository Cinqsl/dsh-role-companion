import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

test('真实Native自主请求把联系呈现为有依据的角色决定且不自动发送', {timeout: 60000}, async t => {
  const run = await mkdtemp(join(await realpath(tmpdir()), 'role-autonomous-contact-guidance59-'));
  let success = false;
  t.after(() => success ? rm(run, {recursive: true, force: true}) : t.diagnostic('retained ' + run));

  const child = spawnSync(
    process.execPath,
    [new URL('./autonomous-contact-guidance-worker.mjs', import.meta.url).pathname],
    {
      cwd: run,
      env: {
        PATH: process.env.PATH,
        HOME: join(run, 'home'),
        DSH_HOME: join(run, 'home'),
        TMPDIR: run,
        DSH_TEST_RUN: run,
        DSH_TELEMETRY_DISABLED: '1',
        ...(process.env.DSH_FIXTURE_NODE_MODULES
          ? {DSH_FIXTURE_NODE_MODULES: process.env.DSH_FIXTURE_NODE_MODULES}
          : {})
      },
      encoding: 'utf8',
      timeout: 45000
    }
  );
  assert.equal(child.error, undefined, child.stdout + child.stderr);
  assert.equal(child.status, 0, child.stdout + child.stderr);

  const report = JSON.parse(await readFile(join(run, 'autonomous-contact-guidance.json'), 'utf8'));
  if (process.env.DSH59_GUIDANCE_EVIDENCE_DIRECTORY) {
    const evidence = process.env.DSH59_GUIDANCE_EVIDENCE_DIRECTORY;
    await mkdir(evidence, {recursive: true});
    await writeFile(join(evidence, 'autonomous-contact-guidance.json'), JSON.stringify(report, null, 2) + '\n');
  }

  const guidance = report.requests.flatMap(request =>
    request.messages.flatMap(message => Array.isArray(message.content) ? message.content : [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .filter(text => text.includes('一次自主机会'))
  );
  const proposalTool = report.requests
    .flatMap(request => request.tools)
    .find(tool => tool.name === 'role_propose');
  assert(proposalTool, 'the real Native request must carry the role_propose definition');
  assert.match(proposalTool.description, /每个contact提议.*角色决定联系用户/);
  assert.match(proposalTool.description, /statement必须为role-choice/);
  assert.match(proposalTool.description, /即使text依据外部观察.*sources.*ref.*quote/);
  assert.deepEqual(proposalTool.input_schema.properties.statement.enum, [
    'user-report',
    'role-choice',
    'external-observation',
    'tentative'
  ]);
  assert.equal(guidance.length, 1, 'the real Native request must carry its autonomous opportunity notice');
  for (const notice of guidance) {
    assert.match(notice, /继续、换兴趣或休息/);
    assert.match(notice, /经历查证后.*确实想分享的新内容/);
    assert.match(notice, /role_propose/);
    assert.match(notice, /contact/);
    assert.match(notice, /可选/);
    assert.match(notice, /不强制/);
    assert.match(notice, /不保证.*发送/);
    assert.match(notice, /内部活动文字.*不是.*草稿或消息/);
    assert.match(notice, /用户看不到/);
    assert.match(notice, /确实想分享的新内容.*决定联系用户.*必须.*role_propose\(kind=contact\).*本次机会/);
    assert.match(notice, /没有新内容时可不联系/);
    assert.match(notice, /内部活动文字.*不代表.*已发送/);
    assert.doesNotMatch(notice, /必须联系|应该联系|一定要联系/);
  }
  assert.equal(report.state.replies.length, 0);
  assert.equal(report.state.contact.intents.length, 0);
  assert.equal(report.state.sendAttempts.length, 0);
  assert.equal(report.state.deliveries.length, 0);
  success = true;
});
