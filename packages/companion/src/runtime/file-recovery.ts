import {OperationId,NativeExposureId,type OpenedRoleHome,type TurnRecord,type ConversationSnapshot} from '../home/index.ts';
/** Recovery records uncertainty only. It never reads, retries or compensates a disk action. */
export async function recoverFileEffects(home:OpenedRoleHome,turn:TurnRecord,state:ConversationSnapshot):Promise<boolean>{
    let blocked=state.nativeRecords.some(record=>record.runId===turn.runId&&record.data&&typeof record.data==='object'&&'kind'in record.data&&record.data.kind==='file-effect-gap');
    for(const attempt of state.attempts){
        if(attempt.runId!==turn.runId||!attempt.fileRules||!attempt.enteredAt||attempt.fileOperation==='read')continue;
        if(state.nativeRecords.some(record=>record.runId===turn.runId&&record.provenance==='host-denial'&&record.nativeId==='file-recovery-'+attempt.attemptId))continue;
        const value=attempt.observation?.kind==='returned'?attempt.observation.value:undefined;
        const effect=value&&typeof value==='object'&&'effect'in value&&value.effect==='published'?'published':'unknown';
        const interrupted=!attempt.outcome||attempt.outcome.code==='PROCESS_INTERRUPTED';
        await home.recordNative({operationId:OperationId('file-recovery-'+attempt.attemptId),record:{runId:turn.runId,nativeId:NativeExposureId('file-recovery-'+attempt.attemptId),provenance:'host-denial',data:{kind:'file-effect-gap',attemptId:attempt.attemptId,reason:interrupted?'PROCESS_INTERRUPTED':'TURN_CONTINUATION_UNAVAILABLE',fileOperation:attempt.fileOperation??'unproven-legacy',effect,observation:attempt.observation?.kind??'not-recorded',canonicalOutcome:attempt.outcome?.kind??'not-recorded',entryEvidence:attempt.observation?'recorded-observation':'durable-intent-only'}}});blocked=true;
    }
    return blocked;
}
