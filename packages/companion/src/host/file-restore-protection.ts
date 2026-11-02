import {join} from 'node:path';
import type {Context} from '@deepseek-ai/cordis';
import type {RestoreRequest} from '../home/restores.ts';
import {FileActionError} from '../actions/files.ts';
import {knownFileHomes,retainKnownFileHome} from '../adapters/file-protection.ts';
import {localDirectoryIdentity,type FileMappingProfile} from './file-mappings.ts';
import {fileProtectionCache} from './file-protection-cache.ts';
/** The existing mapping owner only accumulates deny metadata; provenance never grants a path. */
export async function retainRestoreFileProtection(ctx:Context,source:RestoreRequest|undefined,profile:FileMappingProfile):Promise<void>{
    if(!source)return;if(!profile.protectionCacheId)throw new FileActionError('FILE_SOURCE_CACHE_RECHECK_REQUIRED');
    const cache=fileProtectionCache(ctx),prior=await cache.snapshot(profile.protectionCacheId,knownFileHomes(ctx),true,{admission:true});
    for(const root of [source.backupPath,join(source.backupPath,'home')]){
        try{retainKnownFileHome(ctx,{...await localDirectoryIdentity(root),roleId:source.expectedRoleId,source:'diagnostic-candidate'});}
        catch(error){if(!error||typeof error!=='object'||!('code'in error)||error.code!=='ENOENT'||!prior.homes.some(known=>known.root===root&&known.roleId===source.expectedRoleId))throw new FileActionError('FILE_PROTECTION_UNPROVEN','RESTORE_SOURCE_METADATA_UNPROVEN');}
    }
    await cache.snapshot(profile.protectionCacheId,knownFileHomes(ctx),true,{admission:true});
}
