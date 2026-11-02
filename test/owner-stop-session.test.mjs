import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

for(const mode of ['archive','factory'])test('真实 '+mode+' 在持有原生工具时保留记录，并由显式owner-stop完成收尾',{timeout:60000},async t=>{
  const run=await mkdtemp(join(tmpdir(),'dsh-owner-stop-session37-'));let passed=false;
  t.after(()=>passed?rm(run,{recursive:true,force:true}):t.diagnostic('Synthetic failure retained at '+run));
  const child=spawnSync(process.execPath,[new URL('./owner-stop-session-worker.mjs',import.meta.url).pathname,mode],{
    cwd:run,env:{PATH:process.env.PATH,HOME:join(run,'home'),DSH_HOME:join(run,'home'),DSH_TEST_RUN:run,TMPDIR:run,DSH_TELEMETRY_DISABLED:'1'},encoding:'utf8',timeout:45000,
  });
  assert.equal(child.error,undefined,child.stdout+'\n'+child.stderr);
  assert.equal(child.signal,null,'timeout/signal cleanup cannot count as stopped');
  assert.equal(child.status,0,child.stdout+'\n'+child.stderr);
  const result=JSON.parse(await readFile(join(run,'owner-stop-session-result.json'),'utf8'));
  assert.equal(result.status,'passed');assert.equal(result.actualModels,1);assert.equal(result.actualReaders,1);assert.equal(result.canonicalNotifications,1);
  assert.equal(result.roleStopped,true);assert.equal(result.hostStopped,true);assert.equal(result.lockReleased,true);assert.equal(result.publicReopen,true);
  if(process.env.DSH_OWNER_STOP_SESSION_EVIDENCE_DIR){await mkdir(process.env.DSH_OWNER_STOP_SESSION_EVIDENCE_DIR,{recursive:true});await writeFile(join(process.env.DSH_OWNER_STOP_SESSION_EVIDENCE_DIR,mode+'.json'),JSON.stringify(result,null,2)+'\n');}
  passed=true;
});
