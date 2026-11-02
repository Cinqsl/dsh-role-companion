import test from 'node:test';
import assert from 'node:assert/strict';
import {TYPERT} from 'dsh-role-companion/typert';

test('官方生成 codec 的 nominal ID/版本仍按原 string/number wire 往返，记录读取的判别字段保持原字节',()=>{
 const method=name=>TYPERT.invocations.find(x=>x.namespace==='roleCompanion'&&x.method===name);
 const attach=method('attachHome');
 const wire={path:'/fixture/home',expectedRoleId:'role-00000000-0000-0000-0000-000000000000',operationId:'attach-original',expectedProfileVersion:0};
 const parsed=Object.fromEntries(attach.parameters.map(p=>[p.name,p.codec.create().parse(wire[p.name])]));
 assert.equal(JSON.stringify(parsed),'{"path":"/fixture/home","expectedRoleId":"role-00000000-0000-0000-0000-000000000000","operationId":"attach-original","expectedProfileVersion":0}');
 const receipt={operationId:'attach-original',roleId:wire.expectedRoleId,committedRevision:2,registration:'registered'};
 assert.deepEqual(attach.result.create().parse(JSON.parse(JSON.stringify(receipt))),receipt);
 const record=method('readExecutionRecord').parameters.find(p=>p.name==='request').codec.create();
 for(const request of [{kind:'attempt',recordId:'attempt-original',offset:0,limit:4096},{kind:'native',recordId:'native-session/session:12',offset:0,limit:4096}])assert.deepEqual(record.parse(JSON.parse(JSON.stringify(request))),request);
});

test('独立读规则版本经官方生成codec保持number wire，不增加运行时盒子',()=>{const edit=TYPERT.invocations.find(x=>x.namespace==='roleCompanion'&&x.method==='editReadRules'),request={operationId:'read-rules-wire',value:{toolConcurrency:2,displayCodePoints:12000,readTimeoutMs:10000},expectedReadRulesVersion:1,expectedRevision:7};assert.deepEqual(edit.parameters.find(x=>x.name==='request').codec.create().parse(JSON.parse(JSON.stringify(request))),request);const read=TYPERT.invocations.find(x=>x.namespace==='roleCompanion'&&x.method==='readReadRules'),value={version:2,value:{toolConcurrency:3,displayCodePoints:512,readTimeoutMs:1500},revision:8,roleId:'role-00000000-0000-0000-0000-000000000000',bindingVersion:1,effectiveFrom:'next-tool-admission'};assert.deepEqual(read.result.create().parse(JSON.parse(JSON.stringify(value))),value);});

test('owner完整记录DTO额外digest是技术string，保留既有分页与record kind wire',()=>{const method=TYPERT.invocations.find(x=>x.namespace==='roleCompanion'&&x.method==='readExecutionRecord'),page={kind:'native',recordId:'native-session/session:12',runId:'run-original',json:'{}',offset:0,totalCodePoints:2,more:false,contentDigest:'a'.repeat(64)};assert.deepEqual(method.result.create().parse(JSON.parse(JSON.stringify(page))),page);});
