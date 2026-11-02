import {createHash} from 'node:crypto';
import {HomeError,type ConversationSnapshot,type ExecutionRecordRead,type ExecutionRecordPage} from '../home/index.ts';
import type {OwnerExecutionRecordPage} from '../types.ts';
/** Read-only host utility. Callers retain responsibility for owner authentication and binding guards. */
export interface ExecutionRecordReader{readConversation():Promise<ConversationSnapshot>;readExecutionRecord(request:ExecutionRecordRead):Promise<ExecutionRecordPage>;}
export type ExecutionRecordGuard=(state:ConversationSnapshot,page:ExecutionRecordPage)=>void;
export async function readStableExecutionRecord(reader:ExecutionRecordReader,request:ExecutionRecordRead,guard:ExecutionRecordGuard):Promise<OwnerExecutionRecordPage>{
 const before=await reader.readConversation(),prior=request.kind==='attempt'?before.attempts.find(x=>x.attemptId===request.recordId):before.nativeRecords.find(x=>x.provenance+'/'+x.nativeId===request.recordId);
 const page=await reader.readExecutionRecord(request),state=await reader.readConversation(),current=request.kind==='attempt'?state.attempts.find(x=>x.attemptId===request.recordId):state.nativeRecords.find(x=>x.provenance+'/'+x.nativeId===request.recordId);guard(state,page);if(!prior||!current)throw new HomeError('EXECUTION_RECORD_CHANGED');
 const contentDigest=createHash('sha256').update(JSON.stringify(current),'utf8').digest('hex');if(createHash('sha256').update(JSON.stringify(prior),'utf8').digest('hex')!==contentDigest)throw new HomeError('EXECUTION_RECORD_CHANGED');
 return {...page,contentDigest};
}
