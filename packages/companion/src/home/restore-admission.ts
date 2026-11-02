import {lstat} from 'node:fs/promises';
import {basename,dirname,join} from 'node:path';
/** Deny-only provenance: a portable backup is not an activated instance or a handover. */
export async function portableRestoreRequired(homePath:string):Promise<boolean>{
    try{await lstat(join(homePath,'.restore'));return true;}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}
    if(basename(homePath)!=='home')return false;
    for(const name of ['manifest.json','backup-operation.json']){
        try{await lstat(join(dirname(homePath),name));return true;}
        catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}
    }
    return false;
}
