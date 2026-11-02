import {withFileProfileEdit} from './file-protection-cache.ts';
import type {Context} from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-config-editor';
import {HomeError,OperationId} from '../home/index.ts';
import {FileMappingVersion} from '../host-contracts.ts';
import type {FileMappingEditRequest} from '../types.ts';
import type {FileMappingProfile,LocalFileMapping} from './file-mappings.ts';
/** Existing profile configuration is the only authority for machine-local roots. */
export async function editFileMappingProfile(ctx:Context,get:()=>FileMappingProfile,request:FileMappingEditRequest,roleId:LocalFileMapping['roleId'],mapping:LocalFileMapping|null,protectionCacheId:string):Promise<FileMappingProfile>{
    OperationId(request.operationId);FileMappingVersion(request.expectedFileMappingVersion);
    const editor=ctx.get('configEditor');if(!editor)throw new HomeError('PROFILE_EDITOR_UNAVAILABLE');const owners=editor.entries().filter(entry=>entry.options.name==='dsh-role-companion');if(owners.length!==1)throw new HomeError('PROFILE_ENTRY_AMBIGUOUS');
    await withFileProfileEdit(ctx,()=>editor.edit(owners[0]!,current=>{
        const old=get(),prior=old.entries.find(entry=>entry.roleId===roleId&&entry.grantId===request.grantId);
        if(old.lastOperationId===request.operationId){if(JSON.stringify(prior??null)!==JSON.stringify(mapping))throw new HomeError('OPERATION_CONFLICT');return current;}
        if(old.version!==request.expectedFileMappingVersion)throw new HomeError('FILE_MAPPING_VERSION_CONFLICT');
        const entries=old.entries.filter(entry=>entry.roleId!==roleId||entry.grantId!==request.grantId);if(mapping)entries.push(mapping);
        if(entries.length>64)throw new HomeError('FILE_MAPPING_LIMIT');
        return {...current,fileMappings:{version:FileMappingVersion(old.version+1),lastOperationId:request.operationId,entries,protectionCacheId}};
    }));const applied=get();if(applied.lastOperationId!==request.operationId)throw new HomeError('PROFILE_APPLY_UNCONFIRMED');return applied;
}
