import {sameQQTarget,type DeliveryObservation} from '../home/deliveries.ts';
import type {DeliveryPort,PreparedDelivery} from '../runtime/delivery.ts';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import type {EventEmitter} from 'node:events';
import {qqInputIdentity,type InputReceipt,type BoundInput} from '../home/index.ts';
import {QQMessageId,plainExact,type QQBinding,type QQConnectionId} from '../home/qq.ts';
import {validateQQTransport,type QQTransportParameters} from '../host/qq-profile.ts';
import type {InboundPort} from '../runtime/inbound.ts';
import type {QQHistoryPort,PreparedQQHistoryRead} from '../runtime/history.ts';
import type {QQHistoryRow,QQHistoryObservation,QQHistoryPolicy} from '../home/qq-history.ts';
import {qqHistoryFields} from '../host/qq-profile.ts';

interface Socket extends EventEmitter{readonly readyState:number;send(value:string,callback:(error?:Error)=>void):void;close(code?:number):void;terminate():void;}
const WS=createRequire(import.meta.url)('ws') as {new(url:string,options:{headers:Record<string,string>;handshakeTimeout:number;maxPayload:number;followRedirects:boolean}):Socket;readonly CLOSED:number;};
type Phase='disabled'|'unbound'|'connecting'|'checking'|'ready'|'backoff'|'blocked'|'sealed'|'closed';
interface Counts{connections:number;checks:number;historyRequests:number;accepted:number;duplicate:number;filtered:number;unsupported:number;invalid:number;conflict:number;gaps:number;frames:number;parseAttempts:number;reconnects:number;}
export interface QQReceiveView{readonly phase:Phase;readonly reason:string;readonly connectionId:QQConnectionId|null;readonly generation:string|null;readonly nextDelayMs:number|null;readonly receive:'verified-friend-text-only';readonly replies:'available'|'unavailable';readonly counts:Readonly<Counts>;}
export interface QQReceiveOptions{
  readonly configuration:()=>QQTransportParameters;
  readonly configurationVersion?:()=>number;
  readonly binding:()=>Promise<QQBinding|null>;
  readonly resolveCredential:(ref:string)=>Promise<string|undefined>;
  readonly receive:(input:BoundInput)=>Promise<InputReceipt>;
  readonly random?:()=>number;
}
export interface QQReceiveAdapter extends InboundPort,DeliveryPort,QQHistoryPort{start():void;reconnect():Promise<void>;inspect():QQReceiveView;}
export const qqUnavailableView:QQReceiveView=Object.freeze({phase:'disabled',reason:'QQ_NOT_ACTIVE',connectionId:null,generation:null,nextDelayMs:null,receive:'verified-friend-text-only',replies:'unavailable',counts:Object.freeze({connections:0,checks:0,historyRequests:0,accepted:0,duplicate:0,filtered:0,unsupported:0,invalid:0,conflict:0,gaps:0,frames:0,parseAttempts:0,reconnects:0})});
interface Pending{readonly purpose:'check'|'send'|'history';resolve:(value:unknown)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>;}
interface Generation{readonly id:string;readonly socket:Socket;readonly config:QQTransportParameters;readonly configurationVersion:number;readonly binding:QQBinding;readonly pending:Map<string,Pending>;verified:boolean;failed:boolean;}
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const error=(code:string)=>Object.assign(new Error(code),{code});
function scalar(value:unknown,signed=false):string|undefined{
  const result=typeof value==='string'?value:typeof value==='number'&&Number.isSafeInteger(value)?String(value):undefined;
  return result&& (signed?/^-?(?:0|[1-9][0-9]{0,19})$/:/^[1-9][0-9]{0,19}$/).test(result)&&result!=='-0'?result:undefined;
}
function safeJSON(value:unknown):boolean{
  const pending:[unknown,number][]=[[value,0]];
  while(pending.length){const [item,depth]=pending.pop()!;if(depth>64)return false;if(item&&typeof item==='object'){for(const key of Object.keys(item)){if(['__proto__','prototype','constructor'].includes(key))return false;pending.push([(item as Record<string,unknown>)[key],depth+1]);}}}
  return true;
}
function historyRow(value:unknown,binding:QQBinding):QQHistoryRow{
  const raw=record(value)?value:undefined,id=raw?scalar(raw.message_id,true):undefined;
  let reportedAt:string|null=null;try{if(typeof raw?.time==='number'&&Number.isSafeInteger(raw.time)&&raw.time>=0)reportedAt=new Date(raw.time*1000).toISOString();}catch{}
  const unsupported=(reason:string):QQHistoryRow=>({messageId:id?QQMessageId(id):null,kind:'unsupported',text:null,reportedAt,reason});
  if(!raw||!id)return unsupported('QQ_HISTORY_INVALID_ID');
  if(raw.message_type!=='private'||raw.sub_type!=='friend'||raw.self_id!==undefined&&scalar(raw.self_id)!==binding.accountId||!record(raw.sender)||raw.group_id!==undefined||raw.sender.group_id!==undefined)return unsupported('QQ_HISTORY_IDENTITY_UNVERIFIED');
  const sender=scalar(raw.sender.user_id),user=scalar(raw.user_id);
  if(sender===binding.accountId&&user===binding.accountId&&scalar(raw.target_id)===binding.peerId&&(raw.post_type===undefined||raw.post_type==='message_sent'))return {messageId:QQMessageId(id),kind:'outgoing',text:null,reportedAt,reason:'QQ_HISTORY_OUTGOING'};
  if(sender!==binding.peerId||user!==binding.peerId||raw.target_id!==undefined||raw.post_type!==undefined&&raw.post_type!=='message')return unsupported('QQ_HISTORY_IDENTITY_UNVERIFIED');
  if(!Array.isArray(raw.message)||!raw.message.length||!raw.message.every(segment=>plainExact(segment,['type','data'])&&segment.type==='text'&&plainExact(segment.data,['text'])&&typeof segment.data.text==='string'))return unsupported('QQ_HISTORY_TEXT_UNSUPPORTED');
  const text=raw.message.map(segment=>(segment as {data:{text:string}}).data.text).join('');if(!text||/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(text))return unsupported('QQ_HISTORY_TEXT_UNSUPPORTED');
  return {messageId:QQMessageId(id),kind:'incoming-friend-text',text,reportedAt,reason:''};
}
/** Forward Universal WS only. It owns connection correlation, never an input ledger or reply queue. */
export function createQQReceiveAdapter(options:QQReceiveOptions):QQReceiveAdapter{
  let phase:Phase='disabled',reason='',sealed=false,closed=false,epoch=0,current:Generation|undefined,connectTask:Promise<void>|undefined,reconnectTimer:ReturnType<typeof setTimeout>|undefined,nextDelayMs:number|null=null,failures=0;
  const verified=new Set<(generation:string,target:QQBinding)=>Promise<void>>();
  const availability=new Set<()=>void>();const notify=()=>{for(const listener of availability)listener();};
  const admissions=new Set<Promise<void>>(),counts:Counts={connections:0,checks:0,historyRequests:0,accepted:0,duplicate:0,filtered:0,unsupported:0,invalid:0,conflict:0,gaps:0,frames:0,parseAttempts:0,reconnects:0};
  const live=(g:Generation)=>!sealed&&!closed&&current===g&&!g.failed;
  function cancelTimer(){if(reconnectTimer)clearTimeout(reconnectTimer);reconnectTimer=undefined;nextDelayMs=null;}
  function rejectPending(g:Generation,code:string){for(const pending of g.pending.values()){clearTimeout(pending.timer);pending.reject(error(code));}g.pending.clear();}
  function schedule(g:Generation){
    if(sealed||closed||current!==g)return;
    const base=Math.min(g.config.reconnectMaxMs,g.config.reconnectInitialMs*2**Math.min(failures++,30)),random=options.random?.()??Math.random();
    nextDelayMs=Math.round(Math.min(g.config.reconnectMaxMs,base*(1+g.config.jitterRatio*Math.max(0,Math.min(1,Number.isFinite(random)?random:0)))));phase='backoff';counts.reconnects++;
    reconnectTimer=setTimeout(()=>{reconnectTimer=undefined;nextDelayMs=null;begin();},nextDelayMs);
  }
  function fail(g:Generation,code:string,terminal=false){
    if(current!==g||g.failed)return;g.failed=true;g.verified=false;reason=code;counts.gaps++;rejectPending(g,code);notify();
    if(!sealed&&!closed){phase=terminal?'blocked':'backoff';g.socket.terminate();if(!terminal)schedule(g);}
  }
  function call(g:Generation,action:'get_version_info'|'get_login_info'|'get_friend_list'):Promise<unknown>{
    if(!live(g))return Promise.reject(error('QQ_CONNECTION_CLOSED'));
    return new Promise((resolve,reject)=>{const echo=randomUUID(),timer=setTimeout(()=>{g.pending.delete(echo);reject(error('QQ_CHECK_TIMEOUT'));},g.config.readTimeoutMs);g.pending.set(echo,{resolve,reject,timer,purpose:'check'});counts.checks++;
      try{g.socket.send(JSON.stringify({action,params:{},echo}),failure=>{if(!failure)return;const pending=g.pending.get(echo);if(pending){clearTimeout(pending.timer);g.pending.delete(echo);pending.reject(error('QQ_CONNECTION_LOST'));}});}catch{clearTimeout(timer);g.pending.delete(echo);reject(error('QQ_CONNECTION_LOST'));}
    });
  }
  async function verify(g:Generation){
    try{
      const version=await call(g,'get_version_info');if(!record(version)||version.app_name!=='SnowLuma'||version.app_version!=='2.0.3-node'||version.protocol_version!=='v11')throw error('QQ_VERSION_UNSUPPORTED');
      const login=await call(g,'get_login_info');if(!record(login)||scalar(login.user_id)!==g.binding.accountId)throw error('QQ_ACCOUNT_MISMATCH');
      const friends=await call(g,'get_friend_list');if(!Array.isArray(friends)||!friends.some(friend=>record(friend)&&scalar(friend.user_id)===g.binding.peerId))throw error('QQ_FRIEND_NOT_VERIFIED');
      const binding=await options.binding();if(!live(g))return;if(!sameBinding(binding,g.binding))throw error('QQ_BINDING_CHANGED');
      for(const listener of verified)await listener(g.id,structuredClone(g.binding));if(!live(g))return;
      const latest=await options.binding();if(!live(g))return;if(!sameBinding(latest,g.binding))throw error('QQ_BINDING_CHANGED');
      g.verified=true;failures=0;reason='';phase='ready';notify();
    }catch(cause){if(!live(g))return;const code=cause instanceof Error&&'code'in cause&&typeof cause.code==='string'?cause.code:'QQ_CHECK_FAILED';fail(g,code,!['QQ_CHECK_TIMEOUT','QQ_CONNECTION_LOST'].includes(code));}
  }
  function sameBinding(a:QQBinding|null,b:QQBinding){return a?.bindingId===b.bindingId&&a.version===b.version&&a.connectionId===b.connectionId&&a.accountId===b.accountId&&a.peerId===b.peerId;}
  async function incoming(g:Generation,value:Record<string,unknown>){
    if(!live(g)||!g.verified){counts.filtered++;return;}
    if(value.post_type!=='message'||value.message_type!=='private'||value.sub_type!=='friend'||scalar(value.self_id)!==g.binding.accountId||scalar(value.user_id)!==g.binding.peerId||!record(value.sender)||scalar(value.sender.user_id)!==g.binding.peerId||String(g.binding.accountId)===String(g.binding.peerId)){counts.filtered++;return;}
    if(!Array.isArray(value.message)||!value.message.length||!value.message.every(segment=>plainExact(segment,['type','data'])&&segment.type==='text'&&plainExact(segment.data,['text'])&&typeof segment.data.text==='string')){counts.unsupported++;return;}
    const text=value.message.map(segment=>(segment as {data:{text:string}}).data.text).join(''),messageId=scalar(value.message_id,true);
    if(!messageId||!text||/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(text)){counts.invalid++;return;}QQMessageId(messageId);
    const binding=await options.binding();if(!live(g))return;if(!sameBinding(binding,g.binding)){fail(g,'QQ_BINDING_CHANGED',true);return;}
    const source={connectionId:g.binding.connectionId,accountId:g.binding.accountId,peerId:g.binding.peerId,direction:'incoming' as const,messageId:QQMessageId(messageId)},identity=qqInputIdentity(g.binding,source);
    const receipt=await options.receive({...identity,bindingId:g.binding.bindingId,bindingVersion:g.binding.version,text,channel:'qq',qqSource:source,origin:'live',receivedAt:new Date().toISOString(),sourceEvidence:'verified-onebot-friend-text'});
    if(receipt.kind==='accepted'||receipt.kind==='duplicate'){counts[receipt.kind]++;return;}
    if(!live(g))return;
    counts.gaps++;if(receipt.kind==='uncertain')fail(g,'QQ_INPUT_IO_UNCERTAIN',true);else if(receipt.kind==='rejected'){if(receipt.reason==='key-conflict'||receipt.reason==='operation-conflict'){counts.conflict++;fail(g,'QQ_INPUT_CONFLICT',true);}else reason=receipt.reason==='input-too-large'?'QQ_INPUT_TOO_LARGE':'QQ_INPUT_REJECTED';}
  }
  function frame(g:Generation,data:unknown,binary:boolean){
    if(closed||current!==g||g.failed)return;counts.frames++;
    if(binary||!Buffer.isBuffer(data)){fail(g,'QQ_FRAME_UNSUPPORTED',true);return;}if(data.length>g.config.maxFrameBytes){fail(g,'QQ_FRAME_TOO_LARGE',true);return;}
    let value:unknown,wireJSON:string;try{counts.parseAttempts++;wireJSON=new TextDecoder('utf-8',{fatal:true}).decode(data);value=JSON.parse(wireJSON);if(!record(value)||!safeJSON(value))throw error('invalid');}catch{counts.invalid++;reason='QQ_FRAME_INVALID';return;}
    if(typeof value.echo==='string'){
      const pending=g.pending.get(value.echo);if(!pending)return;g.pending.delete(value.echo);clearTimeout(pending.timer);
      if(pending.purpose==='send'){pending.resolve(value);return;}
      if(pending.purpose==='history'){pending.resolve({envelope:value,rawJSON:wireJSON});return;}
      if(value.status==='ok'&&value.retcode===0)pending.resolve(value.data);else pending.reject(error(value.retcode===401||value.retcode===403?'QQ_AUTH_FAILED':'QQ_CHECK_REJECTED'));return;
    }
    if(!live(g))return;
    const task=incoming(g,value).catch(()=>fail(g,'QQ_INPUT_FAILED',true));admissions.add(task);void task.finally(()=>admissions.delete(task));
  }
  async function connect(){
    if(sealed||closed)return;cancelTimer();const mine=++epoch;let config:QQTransportParameters,binding:QQBinding|null,credential:string|undefined;
    try{
      config=structuredClone(options.configuration());if(!validateQQTransport(config))throw error('QQ_CONFIGURATION_INVALID');if(!config.enabled){phase='disabled';reason='';return;}
      binding=await options.binding();if(mine!==epoch||sealed)return;if(!binding||binding.connectionId!==config.connectionId){phase='unbound';reason='QQ_NOT_BOUND';return;}
      credential=await options.resolveCredential(config.credentialRef);if(mine!==epoch||sealed)return;
      if(!credential||/[\r\n]/.test(credential)){phase='blocked';reason='QQ_CREDENTIAL_UNAVAILABLE';return;}
    }catch{if(mine===epoch&&!sealed){phase='blocked';reason='QQ_CONFIGURATION_UNAVAILABLE';}return;}
    if(mine!==epoch||sealed)return;
    const socket=new WS(config.endpoint,{headers:{Authorization:'Bearer '+credential},handshakeTimeout:config.readTimeoutMs,maxPayload:config.maxFrameBytes,followRedirects:false});
    const g:Generation={id:randomUUID(),socket,config,configurationVersion:options.configurationVersion?.()??0,binding,pending:new Map(),verified:false,failed:false};current=g;counts.connections++;phase='connecting';
    socket.on('open',()=>{if(live(g)){phase='checking';void verify(g);}});socket.on('message',(data,binary)=>frame(g,data,!!binary));
    socket.on('error',(cause:unknown)=>{const code=record(cause)&&cause.code==='WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'?'QQ_FRAME_TOO_LARGE':'QQ_CONNECTION_LOST';fail(g,code,code==='QQ_FRAME_TOO_LARGE');});
    socket.on('unexpected-response',(_request:unknown,response:{statusCode?:number;resume():void})=>{response.resume();fail(g,response.statusCode===401||response.statusCode===403?'QQ_AUTH_FAILED':'QQ_HANDSHAKE_FAILED',response.statusCode!==undefined&&response.statusCode>=400&&response.statusCode<500);});
    socket.on('close',(code:number)=>{rejectPending(g,'QQ_CONNECTION_LOST');if(live(g))fail(g,code===1008?'QQ_AUTH_FAILED':'QQ_CONNECTION_LOST',code===1008);});
  }
  const begin=()=>{connectTask=connect();void connectTask.catch(()=>{if(!sealed){phase='blocked';reason='QQ_CONNECTION_FAILED';}});};
  async function closeSocket(g:Generation|undefined){if(!g||g.socket.readyState===WS.CLOSED)return;await new Promise<void>(resolve=>{const timer=setTimeout(()=>g.socket.terminate(),1000);g.socket.once('close',()=>{clearTimeout(timer);resolve();});try{g.socket.close(1000);}catch{g.socket.terminate();}});}
  const adapter:QQReceiveAdapter={
    onVerified(listener){verified.add(listener);return()=>verified.delete(listener);},
    canRead(target){return Number.isSafeInteger(Number(target.peerId))&&String(Number(target.peerId))===target.peerId&&!!current&&live(current)&&current.verified&&sameQQTarget(current.binding,target)&&current.configurationVersion===(options.configurationVersion?.()??0);},
    policy():QQHistoryPolicy{const g=current;if(!g)throw error('QQ_HISTORY_NOT_CONNECTED');const value=qqHistoryFields(g.config);return {pageSize:value.historyPageSize,maxPages:value.historyMaxPages,cooldownMs:value.historyCooldownMs,readTimeoutMs:g.config.readTimeoutMs,configurationVersion:g.configurationVersion};},
    async read(prepared:PreparedQQHistoryRead):Promise<QQHistoryObservation>{
      const g=current,echo=randomUUID();let dispatched=false;
      if(!g||!adapter.canRead(prepared.query.target))return {kind:'failed',code:'QQ_HISTORY_NOT_CONNECTED',dispatchObserved:false,observedAt:new Date().toISOString()};
      const anchor=prepared.request.anchorMessageId;if(anchor!==null&&(anchor==='0'||!Number.isSafeInteger(Number(anchor))||String(Number(anchor))!==anchor))return {kind:'failed',code:'QQ_HISTORY_ANCHOR_UNSUPPORTED',dispatchObserved:false,observedAt:new Date().toISOString()};
      try{
        const raw=await prepared.invoke(async()=>{
          if(!adapter.canRead(prepared.query.target))throw error('QQ_HISTORY_NOT_CONNECTED');
          return new Promise<unknown>((resolve,reject)=>{const timer=setTimeout(()=>{g.pending.delete(echo);reject(error('QQ_HISTORY_TIMEOUT'));},g.config.readTimeoutMs);g.pending.set(echo,{resolve,reject,timer,purpose:'history'});
            try{dispatched=true;counts.historyRequests++;g.socket.send(JSON.stringify({action:'get_friend_msg_history',params:{user_id:Number(g.binding.peerId),message_id:anchor===null?0:Number(anchor),count:prepared.request.limit,reverse_order:false},echo}),cause=>{if(!cause)return;const pending=g.pending.get(echo);if(pending){clearTimeout(pending.timer);g.pending.delete(echo);pending.reject(error('QQ_HISTORY_WRITE_FAILED'));}});}catch{clearTimeout(timer);g.pending.delete(echo);reject(error('QQ_HISTORY_WRITE_FAILED'));}
          });
        });
        if(!record(raw)||!record(raw.envelope)||typeof raw.rawJSON!=='string')throw error('QQ_HISTORY_RESPONSE_UNSUPPORTED');const envelope=raw.envelope,responseJSON=raw.rawJSON;
        if(envelope.status!=='ok'||envelope.retcode!==0)return {kind:'failed',code:envelope.retcode===401||envelope.retcode===403?'QQ_HISTORY_FORBIDDEN':'QQ_HISTORY_ACTION_REJECTED',dispatchObserved:true,generation:g.id,echo,responseJSON,observedAt:new Date().toISOString()};
        if(!record(envelope.data)||!Array.isArray(envelope.data.messages))return {kind:'failed',code:'QQ_HISTORY_RESPONSE_UNSUPPORTED',dispatchObserved:true,generation:g.id,echo,responseJSON,observedAt:new Date().toISOString()};
        if(envelope.data.messages.length>prepared.request.limit)return {kind:'failed',code:'QQ_HISTORY_PAGE_LIMIT',dispatchObserved:true,generation:g.id,echo,responseJSON,observedAt:new Date().toISOString()};
        return {kind:'response',observedAt:new Date().toISOString(),generation:g.id,echo,responseJSON,rows:envelope.data.messages.map(row=>historyRow(row,g.binding))};
      }catch(cause){return {kind:'failed',code:record(cause)&&typeof cause.code==='string'?cause.code:'QQ_HISTORY_UNCERTAIN',dispatchObserved:dispatched,generation:g.id,echo,observedAt:new Date().toISOString()};}
    },
    canSend(target){return Number.isSafeInteger(Number(target.peerId))&&String(Number(target.peerId))===target.peerId&&!!current&&live(current)&&current.verified&&sameQQTarget(current.binding,target);},
    onAvailability(listener){availability.add(listener);return()=>availability.delete(listener);},
    async send(prepared:PreparedDelivery):Promise<DeliveryObservation>{
      const g=current;let dispatched=false;const echo=randomUUID();
      if(!g||!adapter.canSend(prepared.delivery.target))return {kind:'rejected',code:'QQ_SEND_NOT_CONNECTED'};
      try{
        const binding=await options.binding();if(!sameQQTarget(binding,prepared.delivery.target)||!adapter.canSend(prepared.delivery.target))return {kind:'rejected',code:'QQ_SEND_BINDING_CHANGED'};
        const remaining=Date.parse(prepared.attempt.deadline)-Date.now();if(!Number.isFinite(remaining)||remaining<=0)return {kind:'rejected',code:'QQ_SEND_DEADLINE'};
        const response=await new Promise<unknown>((resolve,reject)=>{
          const timer=setTimeout(()=>{g.pending.delete(echo);reject(error('QQ_SEND_TIMEOUT'));},Math.min(remaining,2147483647));g.pending.set(echo,{resolve,reject,timer,purpose:'send'});
          void prepared.invoke(async()=>{if(!adapter.canSend(prepared.delivery.target))throw error('QQ_SEND_NOT_CONNECTED');dispatched=true;await new Promise<void>((sent,failed)=>{try{g.socket.send(JSON.stringify({action:'send_private_msg',params:{user_id:prepared.delivery.target.peerId,message:[{type:'text',data:{text:prepared.delivery.text}}],auto_escape:true},echo}),failure=>failure?failed(error('QQ_SEND_WRITE_UNCERTAIN')):sent());}catch{failed(error('QQ_SEND_WRITE_UNCERTAIN'));}});}).catch(cause=>{const pending=g.pending.get(echo);if(pending){clearTimeout(pending.timer);g.pending.delete(echo);pending.reject(cause);}});
        });
        const evidence={generation:g.id,echo,response};if(record(response)&&response.status==='ok'&&response.retcode===0&&record(response.data)){const id=scalar(response.data.message_id,true);if(id&&id!=='0')return {kind:'confirmed',messageId:QQMessageId(id),evidence};}
        return {kind:'unknown',code:'QQ_SEND_RESPONSE_UNCERTAIN',evidence};
      }catch(cause){const code=record(cause)&&typeof cause.code==='string'?cause.code:'QQ_SEND_UNCERTAIN';return {kind:dispatched?'unknown':'rejected',code,evidence:{generation:g.id,echo,dispatchObserved:dispatched}};}
    },
    start(){if(!closed&&!sealed&&!current&&!connectTask)begin();},
    async reconnect(){if(sealed||closed)return;cancelTimer();const mine=++epoch;phase='connecting';reason='';const previous=current;current=undefined;if(previous){previous.failed=true;rejectPending(previous,'QQ_CONNECTION_CHANGED');await closeSocket(previous);}if(!sealed&&mine===epoch)begin();},
    inspect(){return {phase,reason:phase==='ready'&&current&&!adapter.canSend(current.binding)?'QQ_SEND_TARGET_UNSUPPORTED':reason,connectionId:current?.binding.connectionId??null,generation:current?.id??null,nextDelayMs,receive:'verified-friend-text-only',replies:current&&adapter.canSend(current.binding)?'available':'unavailable',counts:{...counts}};},
    seal(){if(sealed)return;sealed=true;epoch++;cancelTimer();phase='sealed';if(current)for(const [echo,pending]of current.pending)if(pending.purpose==='check'){clearTimeout(pending.timer);current.pending.delete(echo);pending.reject(error('QQ_CONNECTION_CLOSED'));}notify();},
    async drain(){while(admissions.size)await Promise.all([...admissions]);},
    async dispose(){adapter.seal();await adapter.drain();await connectTask;await closeSocket(current);closed=true;phase='closed';},
  };
  return adapter;
}
