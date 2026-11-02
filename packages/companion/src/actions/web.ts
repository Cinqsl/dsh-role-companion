import {BlockList,isIP} from 'node:net';
import {ExecutionError} from '../runtime/execution.ts';
import type {IssuedToolAttempt} from '../runtime/execution.ts';
import type {OfficialWebCapability,OfficialWebBody} from '../adapters/official-web.ts';
import type {AttemptId,LogicalOpId} from '../home/ids.ts';
const denied=new BlockList();for(const [address,prefix]of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]] as const)denied.addSubnet(address,prefix,'ipv4');for(const [address,prefix]of [['::',128],['::1',128],['fc00::',7],['fe80::',10],['ff00::',8],['2001:db8::',32]] as const)denied.addSubnet(address,prefix,'ipv6');
export function validateWebUrl(value:unknown):string {
    if(typeof value!=='string'||Array.from(value).length>8192||value!==value.trim())throw new ExecutionError('INVALID_WEB_URL');let url:URL;try{url=new URL(value);}catch{throw new ExecutionError('INVALID_WEB_URL');}
    const host=url.hostname.replace(/^\[|\]$/g,'').replace(/\.$/,'').toLowerCase(),family=isIP(host);
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password||!host||host==='localhost'||host==='local'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host.endsWith('.lan')||!family&&!host.includes('.')||family&&denied.check(host,family===4?'ipv4':'ipv6'))throw new ExecutionError('WEB_URL_NOT_ALLOWED');return value;
}
export type RoleWebRequest={readonly operation:'search';readonly query:string;readonly limit?:number}|{readonly operation:'fetch';readonly url:string};
export function parseRoleWeb(operation:'search'|'fetch',value:unknown,maxResults=50):RoleWebRequest {
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!Object.getOwnPropertyDescriptor(value,key)?.enumerable||!('value'in Object.getOwnPropertyDescriptor(value,key)!)))throw new ExecutionError('INVALID_ROLE_WEB');
    if(operation==='fetch'){if(Object.keys(value).join('|')!=='url'||!('url'in value))throw new ExecutionError('INVALID_ROLE_WEB');return {operation,url:validateWebUrl(value.url)};}
    if(Object.keys(value).some(key=>!['query','limit'].includes(key))||!('query'in value)||typeof value.query!=='string'||!value.query.trim()||/[\uD800-\uDFFF]/u.test(value.query)||Array.from(value.query).length>128)throw new ExecutionError('INVALID_WEB_QUERY');
    if('limit'in value&&(typeof value.limit!=='number'||!Number.isSafeInteger(value.limit)||value.limit<1||value.limit>Math.min(50,maxResults)))throw new ExecutionError('INVALID_WEB_LIMIT');return {operation,query:value.query,...('limit'in value&&typeof value.limit==='number'?{limit:value.limit}:{})};
}
export type RoleWebValue={readonly provider:'deepseek-official';readonly operation:'search'|'fetch';readonly providerStatus:number;readonly targetStatus:'unknown';readonly finalUrl:'unknown';readonly acquiredAt:string;readonly toolAttemptId:AttemptId;readonly attemptId:AttemptId;readonly logicalOpId:LogicalOpId}&({readonly query:string;readonly results:{readonly title:string;readonly url:string;readonly snippet:string;readonly summary?:string}[]}|{readonly requestedUrl:string;readonly title:string;readonly markdown:string});
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
export async function executeRoleWeb(request:RoleWebRequest,capability:OfficialWebCapability,attempt:IssuedToolAttempt,signal:AbortSignal):Promise<RoleWebValue>{
    const web=attempt.web;if(!web||web.claim.operation!==request.operation)throw new ExecutionError('WEB_PERMISSION_REQUIRED');let started=false;
    await attempt.enter();
    let value:RoleWebValue;
    try{
        value=await attempt.invoke(signal,async()=>{started=true;let current=web.first;const body:OfficialWebBody=request.operation==='search'?{query:request.query,count:request.limit??web.claim.rules.value.maxResults,need_content:false}:{url:request.url};
            while(true){const raw=await capability.request(request.operation,body,web.claim.rules,web.claim.deadline,current,signal);await current.settle(raw);
                if(raw.code){const retry=await web.retry(raw,signal);if(retry){current=retry;continue;}throw new ExecutionError(raw.code);}
                const payload:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.from(raw.rawBase64,'base64'))),common={provider:'deepseek-official' as const,operation:request.operation,providerStatus:typeof raw.providerStatus==='number'?raw.providerStatus:0,targetStatus:'unknown' as const,finalUrl:'unknown' as const,acquiredAt:web.now(),toolAttemptId:attempt.attemptId,attemptId:current.attemptId,logicalOpId:web.logicalOpId};
                if(!object(payload)||raw.providerStatus!==200)throw new ExecutionError('WEB_INVALID_RESPONSE');
                if(request.operation==='fetch'){if(typeof payload.title!=='string'||typeof payload.content!=='string')throw new ExecutionError('WEB_INVALID_RESPONSE');return {...common,requestedUrl:request.url,title:payload.title,markdown:payload.content};}
                if(!Array.isArray(payload.results)||payload.results.length>(request.limit??web.claim.rules.value.maxResults))throw new ExecutionError('WEB_INVALID_RESPONSE');const results=payload.results.map(item=>{if(!object(item)||typeof item.title!=='string'||typeof item.url!=='string'||typeof item.snippet!=='string'||'summary'in item&&typeof item.summary!=='string')throw new ExecutionError('WEB_INVALID_RESPONSE');return {title:item.title,url:validateWebUrl(item.url),snippet:item.snippet,...(typeof item.summary==='string'?{summary:item.summary}:{})};});return {...common,query:request.query,results};
            }
        });
    }catch(error){if(started)await attempt.observe({kind:'threw',code:error instanceof ExecutionError?error.code:'WEB_FAILED'});throw error;}
    await attempt.observe({kind:'returned',value});return value;
}
