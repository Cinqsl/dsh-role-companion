import {lstatSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';import type {Context} from '@deepseek-ai/cordis';import type {} from '@deepseek-ai/dsh-app-boot';
const launchUnproven=():never=>{throw new Error('FILE_LAUNCH_ARGUMENTS_UNPROVEN');};
export function cliConfigurationPaths(cwd:string):string[]{
    const args=process.argv;const paths:string[]=[];let cursor=2;if(args[cursor]&&!args[cursor]!.startsWith('-')){if(args[cursor]==='plugin')launchUnproven();cursor++;}
    while(cursor<args.length){const flag=args[cursor]!;if(flag==='--patch'){const value=args[cursor+1];if(!value||value.startsWith('-'))launchUnproven();paths.push(resolve(cwd,value));cursor+=2;continue;}if(flag.startsWith('--patch=')){const value=flag.slice('--patch='.length);if(!value)launchUnproven();paths.push(resolve(cwd,value));cursor++;continue;}
        if(flag==='--profile'||flag==='--from-default-profile'){if(args.length<=cursor+1)launchUnproven();cursor+=2;continue;}if(flag.startsWith('--profile=')||flag.startsWith('--from-default-profile=')){cursor++;continue;}break;
    }return paths;
}
/** A source owner can be remounted only inside the same physical profile. */
export function fileSourceProfileIdentity(ctx:Context):string{const profile=ctx.get('profileContext');if(!profile)throw new Error('FILE_SOURCE_PROFILE_UNAVAILABLE');const stat=lstatSync(profile.dir,{bigint:true});if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('FILE_SOURCE_PROFILE_LINK');return createHash('sha256').update(JSON.stringify([profile.dir,String(stat.dev),String(stat.ino),String(stat.birthtimeNs)])).digest('hex');}
/** Metadata only. No configuration, environment or credential contents are read. */
export function fileSourceCheckpoint(ctx:Context):string{
    const profile=ctx.get('profileContext');if(!profile)throw new Error('FILE_SOURCE_PROFILE_UNAVAILABLE');
    const rows=[profile.dir,join(profile.dir,'package.json'),profile.patchPath,join(profile.home,'cordis.patch.yml'),...cliConfigurationPaths(profile.cwd)].map(path=>{try{const s=lstatSync(path,{bigint:true});if(s.isSymbolicLink())throw new Error('FILE_SOURCE_PROFILE_LINK');return [path,String(s.dev),String(s.ino),String(s.birthtimeNs),String(s.mtimeNs),String(s.ctimeNs),String(s.size)];}catch(error){if(error&&typeof error==='object'&&'code'in error&&error.code==='ENOENT')return [path,'missing'];throw error;}});
    // The profile directory contains lock/cache files; only its physical identity participates.
    rows[0]=rows[0]!.slice(0,4);return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}
export interface RuntimeRootSource {readonly root:string;readonly owner:string;readonly phase:'observed'|'retired';}
export interface RegisteredFileSources {readonly roots:readonly RuntimeRootSource[];readonly unproven:boolean;readonly generation:number;readonly checkpoint:string;readonly reconciled:boolean;}
